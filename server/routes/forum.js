import { Router } from "express";
import db from "../db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import { commentLimiter } from "../middlewares/limiter.js"; // 引入评论限流中间件

let router = Router();
dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 删除校园墙帖子(用户软删除)
router.delete("/posts/:post_id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { post_id } = req.params;

  if (!token) {
    return res.status(401).json({ message: "未提供Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id;

    // 验证帖子归属权并执行软删除
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ? AND author_id = ?", [post_id, author_id]);

    if (rows.length === 0) {
      return res.status(403).json({ message: "没有权限删除此帖子" });
    }

    // 软删除帖子
    await db.query("UPDATE posts SET status = 'deleted' WHERE id = ?", [post_id]);

    res.status(200).json({ message: "删除成功" });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的Token" });
    }
    res.status(500).json({ message: "服务器错误" });
  }
});



// 处理帖子互动
router.post("/posts/interact/:post_id", commentLimiter, async (req, res) => {
  const { post_id } = req.params;
  const { action, content, parent_id } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user_id = decoded.user_id;

    // 验证帖子是否存在且未删除
    const [postRows] = await db.query(
      "SELECT * FROM posts WHERE id = ? AND status = 'active'", 
      [post_id]
    );

    if (postRows.length === 0) {
      return res.status(404).json({ message: "帖子不存在或已被删除" });
    }

    // 根据action执行不同操作
    switch (action) {
      case 'like':
      case 'complaint':
        // 点赞/投诉操作
        const { value } = req.body;
        if (value === undefined) {
          return res.status(400).json({ message: `缺少 ${action === 'like' ? 'value' : 'value'} 参数` });
        }

        const valueChange = value;
        if (valueChange !== 1 && valueChange !== -1) {
          return res.status(400).json({
            message: `无效的 ${action === 'like' ? 'value' : 'value'} 参数，必须是 1 或 -1`,
          });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
          let message;
          const targetTable = action === "like" ? "likes" : "complaints";
          const target_type = "post";

          if (valueChange === 1) {
            // 添加点赞/投诉
            try {
              const [insertResult] = await connection.query(
                `INSERT INTO ${targetTable} (user_id, target_id, target_type) VALUES (?, ?, ?)`, 
                [user_id, post_id, target_type]
              );

              if (insertResult.affectedRows > 0) {
                const columnName = action === "like" ? "likes" : "complaints";
                await connection.query(
                  `UPDATE posts SET ${columnName} = ${columnName} + 1 WHERE id = ?`, 
                  [post_id]
                );

                message = action === "like" ? "点赞成功" : "投诉成功";
              } else {
                await connection.rollback();
                connection.release();
                return res.status(500).json({ message: "操作失败" });
              }
            } catch (error) {
              // 如果是重复键错误（用户已经点赞/投诉过）
              if (error.code === "ER_DUP_ENTRY") {
                await connection.rollback();
                connection.release();
                return res.status(400).json({
                  message: action === "like" ? "您已经点赞过了" : "您已经投诉过了",
                });
              }
              throw error;
            }
          } else if (valueChange === -1) {
            // 取消点赞/投诉
            const [deleteResult] = await connection.query(
              `DELETE FROM ${targetTable} WHERE user_id = ? AND target_id = ? AND target_type = ?`, 
              [user_id, post_id, target_type]
            );

            if (deleteResult.affectedRows > 0) {
              const columnName = action === "like" ? "likes" : "complaints";
              await connection.query(
                `UPDATE posts SET ${columnName} = GREATEST(${columnName} - 1, 0) WHERE id = ?`, 
                [post_id]
              );

              message = action === "like" ? "取消点赞成功" : "取消投诉成功";
            } else {
              await connection.rollback();
              connection.release();
              return res.status(400).json({
                message: action === "like" ? "您还没有点赞过" : "您还没有投诉过",
              });
            }
          }

          await connection.commit();
          connection.release();

          return res.status(200).json({ message });
        } catch (error) {
          await connection.rollback();
          connection.release();
          throw error;
        }

      case 'comment':
        // 评论操作
        if (!content) {
          return res.status(400).json({ message: "评论内容不能为空" });
        }

        // 检查父评论是否存在（如果有）
        if (parent_id) {
          const [parentCommentRows] = await db.query(
            "SELECT * FROM post_comments WHERE id = ? AND status = 'active'",
            [parent_id]
          );

          if (parentCommentRows.length === 0) {
            return res.status(404).json({ message: "回复的评论不存在或已被删除" });
          }
        }

        // 插入评论
        const [result] = await db.query(
          "INSERT INTO post_comments (post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)",
          [post_id, user_id, content, parent_id || null]
        );

        // 获取新创建的评论
        const [newComment] = await db.query(
          `SELECT pc.*, u.nickname, u.avatar 
           FROM post_comments pc
           JOIN users u ON pc.user_id = u.id
           WHERE pc.id = ?`, 
          [result.insertId]
        );

        if (newComment.length === 0) {
          return res.status(500).json({ message: "评论创建失败" });
        }

        // 构建响应数据
        const commentData = {
          id: newComment[0].id,
          content: newComment[0].content,
          created_at: newComment[0].created_at,
          parent_id: newComment[0].parent_id,
          user: {
            id: newComment[0].user_id,
            nickname: newComment[0].nickname,
            avatar: newComment[0].avatar
          }
        };

        return res.status(201).json({
          message: "评论发布成功",
          comment: commentData
        });

      default:
        return res.status(400).json({ message: "无效的交互类型，必须是 like、complaint 或 comment" });
    }
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的Token" });
    }
    res.status(500).json({ message: "服务器错误" });
  }
});


router.get("/posts", async (req, res) => {
  try {
    const {
      campus_id,     // 校区ID
      author_id,     // 作者ID
      keyword,       // 关键词搜索(标题和内容)
      tag,           // 帖子标签筛选
      status = 'active', // 默认只查询active状态
      page = 1,      // 页码
      limit = 10,    // 每页数量
      with_comments = false // 是否包含评论，默认不包含
    } = req.query;

    // 构建基础查询
    let query = `
      SELECT p.*, u.nickname as author_name, u.avatar as author_avatar, 
             (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id AND pc.status = 'active') as comment_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;


    const queryParams = [];

    // 记录搜索关键词到数据库
    if (keyword && keyword.trim()) {
      const trimmedKeyword = keyword.trim();
      
      // 异步更新关键词统计，不阻塞主查询
      db.query(
        `INSERT INTO search_keywords (keyword, search_count) VALUES (?, 1) 
         ON DUPLICATE KEY UPDATE search_count = search_count + 1`,
        [trimmedKeyword]
      ).catch(err => {
        console.error('记录搜索关键词失败:', err);
        // 不影响主要功能，只记录错误
      });
    }

    if (campus_id) {
      query += " AND p.campus_id = ?";
      queryParams.push(campus_id);
    }

    if (author_id) {
      query += " AND p.author_id = ?";
      queryParams.push(author_id);
    }

    if (keyword) {
      query += " AND (p.title LIKE ? OR p.content LIKE ?)";
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (tag) {
      query += " AND p.tag = ?";
      queryParams.push(tag);
    }


    if (status && status !== 'all') {
      query += " AND p.status = ?";
      queryParams.push(status);
    }


    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_posts`;
    const [countRows] = await db.query(countQuery, queryParams);
    const total = countRows[0].total;
    

    query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    const offset = (parseInt(page) - 1) * parseInt(limit);
    queryParams.push(parseInt(limit), offset);

    // 执行主查询
    const [rows] = await db.query(query, queryParams);

    // 获取帖子相关的图片和评论
    const postsWithData = await Promise.all(
      rows.map(async (post) => {
        // 获取帖子图片
        const [imageRows] = await db.query(
          "SELECT image_url FROM post_image WHERE post_id = ?", 
          [post.id]
        );
        
        // 如果需要包含评论
        let comments = [];
        if (with_comments === 'true' || with_comments === true || with_comments === '1') {
          // 获取顶级评论
          const [commentRows] = await db.query(`
            SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
            FROM post_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.parent_id IS NULL AND c.status = 'active'
            ORDER BY c.created_at DESC
          `, [post.id]);
          
          // 获取每个顶级评论的回复
          comments = await Promise.all(
            commentRows.map(async (comment) => {
              const [replyRows] = await db.query(`
                SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
                FROM post_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.parent_id = ? AND c.status = 'active'
                ORDER BY c.created_at ASC
              `, [comment.id]);
              
              // 格式化评论数据
              return {
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                user: {
                  id: comment.user_id,
                  nickname: comment.user_nickname,
                  avatar: comment.user_avatar
                },
                replies: replyRows.map(reply => ({
                  id: reply.id,
                  content: reply.content,
                  created_at: reply.created_at,
                  user: {
                    id: reply.user_id,
                    nickname: reply.user_nickname,
                    avatar: reply.user_avatar
                  }
                }))
              };
            })
          );
        }
        
        return {
          ...post,
          images: imageRows.map(img => img.image_url),
          comments: comments
        };
      })
    );

    // 返回结果
    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      posts: postsWithData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 修改帖子
router.put("/posts/:post_id", upload.array("images", 9), async (req, res) => {
  const { post_id } = req.params;
  const { title, content, campus_id, tag, status } = req.body;
  const files = req.files;

  // 获取 token
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    if (files && files.length) {
      for (const file of files) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id;
    const isAdmin = decoded.isAdmin || false;

    // 确保必需的字段存在
    if (!title || !content || !campus_id) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ message: "缺少必要参数" });
    }

    let query, queryParams;

    if (isAdmin) {
      query = "SELECT * FROM posts WHERE id = ? AND status != 'deleted'";
      queryParams = [post_id];
    } else {
      query = "SELECT * FROM posts WHERE id = ? AND author_id = ? AND status != 'deleted'";
      queryParams = [post_id, author_id];
    }

    const [rows] = await db.query(query, queryParams);

    if (rows.length === 0) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(404).json({ message: "帖子未找到或用户无权修改" });
    }

    // 只在有新图片上传时才处理图片
    if (files && files.length > 0) {
      // 删除旧图片
      const [oldImages] = await db.query("SELECT image_url FROM post_image WHERE post_id = ?", [post_id]);
      for (const img of oldImages) {
        const oldFilePath = "public" + img.image_url;
        await fs.promises.unlink(oldFilePath).catch(() => {});
      }
      await db.query("DELETE FROM post_image WHERE post_id = ?", [post_id]);

      // 插入新图片
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO post_image (post_id, image_url) VALUES (?, ?)", [post_id, url]));
      await Promise.all(imagePromises);
    }

    // 更新帖子
    const updateQuery = `
      UPDATE posts
      SET title = ?, content = ?, campus_id = ?, tag = ?, status = ? WHERE id = ?`;

    await db.query(updateQuery, [title, content, campus_id, tag, status || 'active', post_id]);

    // 返回成功信息
    res.status(200).json({ message: "帖子更新成功" });
  } catch (err) {
    console.error(err);
    if (req.files && req.files.length) {
      for (const file of req.files) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的 Token" });
    }
    res.status(500).json({ message: "服务器错误" });
  }
});


export default router;