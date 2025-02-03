import { Router } from "express";
import db from "../db.js";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import dotenv from "dotenv";
import jwt from "jsonwebtoken"; // 用于生成 JWT
import fs from "fs";

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 获取帖子列表
router.get("/", (req, res) => {
  db.query("SELECT * FROM posts WHERE status != 'deleted'") // 排除已删除的帖子
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ message: "没有找到帖子" });
      }

      // 获取所有帖子的图片信息
      const postIds = rows.map((post) => post.id);

      db.query("SELECT post_id, image_url FROM post_images WHERE post_id IN (?)", [postIds])
        .then(([imageRows]) => {
          // 创建一个帖子 ID 到图片 URL 的映射
          const imagesMap = imageRows.reduce((map, row) => {
            if (!map[row.post_id]) {
              map[row.post_id] = [];
            }
            map[row.post_id].push(row.image_url);
            return map;
          }, {});

          // 将图片信息添加到每个帖子中
          const postsWithImages = rows.map((post) => {
            post.images = imagesMap[post.id] || []; // 如果没有图片，返回空数组
            return post;
          });

          res.status(200).json(postsWithImages);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ message: "查询帖子图片失败" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "服务器错误" });
    });
});

// 新增帖子
router.post("/publish", upload.array("images", 5), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const files = req.files; // 获取上传的文件

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
    const { title, content, price, campus_id, post_type, tag } = req.body;

    // 检查必需参数（图片为可选参数）
    if (!author_id || !title || !campus_id || !post_type) {
      if (files && files.length) {
        for (const file of files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 插入帖子数据到 posts 表
    const [result] = await db.query("INSERT INTO posts (author_id, title, content, price, campus_id, post_type, tag) VALUES (?, ?, ?, ?, ?, ?, ?)", [author_id, title, content, price, campus_id, post_type, tag]);

    const postId = result.insertId; // 获取刚插入的帖子 ID
    if (!postId) {
      if (files && files.length) {
        for (const file of files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(500).json({ message: "帖子插入失败，无法获取 postId" });
    }

    // 初始化图片链接数组，如果有上传文件则存储，否则保持为空
    let imageUrls = [];
    if (files && Array.isArray(files) && files.length > 0) {
      imageUrls = files.map((file) => `/uploads/${file.filename}`);
      // 将图片链接存入 post_images 表
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO post_images (post_id, image_url) VALUES (?, ?)", [postId, url]));
      await Promise.all(imagePromises); // 等待所有图片保存完成
    }

    // 返回成功信息
    res.status(201).json({ message: "发布成功", image_urls: imageUrls });
  } catch (err) {
    console.error(err);
    if (files && files.length) {
      for (const file of files) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的 Token" });
    }
    res.status(500).json({ message: "服务器错误" });
  }
});

// 删除帖子
router.delete("/:post_id", (req, res) => {
  const { post_id } = req.params; // 从 URL 参数中获取 post_id
  const token = req.headers.authorization?.split(" ")[1]; // 获取请求头中的 token

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    // 解码 token 获取用户信息
    const decoded = jwt.verify(token, SECRET_KEY);

    const author_id = decoded.user_id; // 从 token 中获取用户的 ID

    // 确保必需的参数存在
    if (!post_id || !author_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 查找帖子并验证用户是否是作者
    db.query("SELECT * FROM posts WHERE id = ? AND author_id = ?", [post_id, author_id])
      .then(([rows]) => {
        if (rows.length === 0) {
          return res.status(404).json({ message: "帖子未找到或用户无权删除" });
        }

        // 软删除：将 status 字段设置为 'deleted'
        db.query("UPDATE posts SET status = 'deleted' WHERE id = ?", [post_id])
          .then(() => {
            res.status(200).json({ message: "帖子已标记为删除" });
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ message: "服务器错误" });
          });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "服务器错误" });
      });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "无效的 Token" });
  }
});

// 获取帖子详情
router.get("/byID/:post_id", (req, res) => {
  const { post_id } = req.params; // 从 URL 参数中获取 post_id

  if (!post_id) {
    return res.status(400).json({ message: "缺少帖子 ID" });
  }

  // 查询帖子信息，并且获取与该帖子相关的图片
  db.query("SELECT id, title, content, author_id, created_at, status, price, campus_id, post_type, tag FROM posts WHERE id = ? AND status != 'deleted'", [post_id])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ message: "帖子未找到或已被删除" });
      }

      const post = rows[0]; // 获取帖子信息

      // 查询与该帖子关联的图片信息
      db.query("SELECT image_url FROM post_images WHERE post_id = ?", [post_id])
        .then(([imageRows]) => {
          // 获取图片链接数组
          const images = imageRows.map((row) => row.image_url);

          // 返回帖子信息以及相关图片的 URL 列表
          res.status(200).json({
            post: post,
            images: images, // 将图片信息返回给前端
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ message: "查询帖子图片失败" });
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "服务器错误" });
    });
});

// 查询帖子（按条件）
router.get("/search", async (req, res) => {
  try {
    const {
      keyword, // 新增关键字搜索参数
      title,
      status,
      campus_id,
      post_type,
      tag,
      min_price,
      max_price,
      page = 1,
      limit = 10,
    } = req.query;

    // 计算分页偏移量
    const offset = (page - 1) * limit;

    let whereClause = "WHERE status != 'deleted'";
    let params = [];

    // 关键字搜索 - 在title和content中进行模糊匹配
    if (keyword) {
      whereClause += " AND (title LIKE ? OR content LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 其他可选条件筛选
    if (title) {
      whereClause += " AND title LIKE ?";
      params.push(`%${title}%`);
    }

    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }

    if (campus_id) {
      whereClause += " AND campus_id = ?";
      params.push(campus_id);
    }

    if (post_type) {
      whereClause += " AND post_type = ?";
      params.push(post_type);
    }

    if (tag) {
      whereClause += " AND tag = ?";
      params.push(tag);
    }

    if (min_price) {
      whereClause += " AND price >= ?";
      params.push(min_price);
    }

    if (max_price) {
      whereClause += " AND price <= ?";
      params.push(max_price);
    }

    // 统计总记录数，用于前端分页
    const countQuery = `SELECT COUNT(*) as total FROM posts ${whereClause}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;

    // 查询具体数据
    const dataQuery = `
      SELECT *
      FROM posts
      ${whereClause}
      ORDER BY id DESC
      LIMIT ?
      OFFSET ?
    `;
    // 追加分页参数
    params.push(Number(limit), Number(offset));
    const [rows] = await db.query(dataQuery, params);

    if (rows.length === 0) {
      return res.status(200).json({ total, posts: [] });
    }

    // 获取已查到帖子ID列表
    const postIds = rows.map((p) => p.id);
    // 查询对应的图片
    const [imageRows] = await db.query("SELECT post_id, image_url FROM post_images WHERE post_id IN (?)", [postIds]);

    // 创建 post_id -> [image_url] 的映射
    const imagesMap = imageRows.reduce((map, row) => {
      if (!map[row.post_id]) {
        map[row.post_id] = [];
      }
      map[row.post_id].push(row.image_url);
      return map;
    }, {});

    // 组装帖子与图片
    const postsWithImages = rows.map((post) => {
      post.images = imagesMap[post.id] || [];
      return post;
    });

    res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      posts: postsWithImages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 修改帖子
router.put("/:post_id", upload.array("images", 5), async (req, res) => {
  const { post_id } = req.params;
  const { title, content, price, campus_id, status, post_type, tag } = req.body;
  const files = req.files; // 获取上传的文件

  // 获取 token
  const token = req.headers.authorization?.split(" ")[1]; // 从 Authorization 字段获取 Token
  if (!token) {
    if (files && files.length) {
      for (const file of files) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    // 解码 Token 获取用户信息
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id; // 获取当前用户的 ID

    // 确保必需的字段存在
    if (!author_id || !title || !campus_id || !post_type) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 校验价格是否为合法数字
    if (price && isNaN(price)) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ message: "价格必须是数字" });
    }

    // 查找帖子并验证用户是否是作者且帖子未被删除
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ? AND author_id = ? AND status != 'deleted'", [post_id, author_id]);

    if (rows.length === 0) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(404).json({ message: "帖子未找到或用户无权修改" });
    }

    // 删除旧图片
    const [oldImages] = await db.query("SELECT image_url FROM post_images WHERE post_id = ?", [post_id]);
    for (const img of oldImages) {
      const oldFilePath = "public" + img.image_url;
      await fs.promises.unlink(oldFilePath).catch(() => {});
    }
    await db.query("DELETE FROM post_images WHERE post_id = ?", [post_id]);

    // 更新帖子
    const updateQuery = `
      UPDATE posts
      SET title = ?, content = ?, price = ?, campus_id = ?, status = ?, post_type = ?, tag = ? WHERE id = ?`;

    await db.query(updateQuery, [title, content, price, campus_id, status, post_type, tag, post_id]);

    // 插入新图片
    let imageUrls = [];
    if (req.files && req.files.length) {
      imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO post_images (post_id, image_url) VALUES (?, ?)", [post_id, url]));
      await Promise.all(imagePromises);
    }

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
