import { Router } from "express";
import db from "../db.js";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import dotenv from "dotenv";
import jwt from "jsonwebtoken"; // 用于生成 JWT
import fs from "fs";
import cacheService from "../services/cacheService.js"; // 引入缓存服务

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 获取帖子列表(仅测试用)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM posts WHERE status != 'deleted'");

    if (rows.length === 0) {
      return res.status(404).json({ message: "没有找到帖子" });
    }

    const postIds = rows.map((post) => post.id);
    let imageRows = [];

    if (postIds.length > 0) {
      [imageRows] = await db.query("SELECT post_id, image_url FROM post_images WHERE post_id IN (?)", [postIds]);
    }

    const imagesMap = imageRows.reduce((map, row) => {
      if (!map[row.post_id]) {
        map[row.post_id] = [];
      }
      map[row.post_id].push(row.image_url);
      return map;
    }, {});

    const postsWithImages = rows.map((post) => ({
      ...post,
      images: imagesMap[post.id] || [],
    }));

    return res.status(200).json(postsWithImages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "服务器错误" });
  }
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

    // 将新帖子数据存入缓存
    const postData = {
      id: postId,
      author_id,
      title,
      content,
      price,
      campus_id,
      post_type,
      tag,
      images: imageUrls,
    };
    await cacheService.handleNewPost(postData);

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
router.delete("/:post_id", async (req, res) => {
  const { post_id } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    // 解码 token 获取用户信息
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id;

    // 参数验证
    if (!post_id || !author_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 查找帖子并验证用户权限
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ? AND author_id = ?", [post_id, author_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "帖子未找到或用户无权删除" });
    }

    // 软删除帖子
    await db.query("UPDATE posts SET status = 'deleted' WHERE id = ?", [post_id]);

    // 缓存更新:
    await cacheService.handlePostDeletion(post_id);

    return res.status(200).json({ message: "帖子已标记为删除" });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的 Token" });
    }
    return res.status(500).json({ message: "服务器错误" });
  }
});

// 获取帖子详情
router.get("/byID/:post_id", async (req, res) => {
  const { post_id } = req.params;

  if (!post_id) {
    return res.status(400).json({ message: "缺少帖子 ID" });
  }

  try {
    // 尝试从缓存获取数据
    const cachedPost = await cacheService.getPostDetail(post_id);
    if (cachedPost) {
      return res.status(200).json(cachedPost);
    }

    // 从数据库获取
    const [rows] = await db.query("SELECT * FROM posts WHERE id = ? AND status != 'deleted'", [post_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "帖子未找到或已被删除" });
    }

    const post = rows[0];
    const [imageRows] = await db.query("SELECT image_url FROM post_images WHERE post_id = ?", [post_id]);

    const postData = {
      post,
      images: imageRows.map((row) => row.image_url),
    };

    // 设置缓存
    await cacheService.setPostDetail(post_id, postData);

    res.status(200).json(postData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
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

    // 只在无筛选条件时，尝试从缓存获取数据
    const hasFilter = keyword || title || status || campus_id || post_type || tag || min_price || max_price;

    if (!hasFilter) {
      const cachedPosts = await cacheService.getPaginatedPosts(page, limit);
      if (cachedPosts) {
        return res.status(200).json(cachedPosts);
      }
    }

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

    // 如果总数为0，直接返回空结果
    if (total === 0) {
      return res.status(200).json({
        total: 0,
        count: 0, // 添加当前页帖子数量
        page: Number(page),
        limit: Number(limit),
        posts: [],
      });
    }

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

    // 添加第二次检查
    if (rows.length === 0) {
      return res.status(200).json({
        total,
        count: 0,
        page: Number(page),
        limit: Number(limit),
        posts: [],
      });
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

    // 返回带分页信息的响应
    const result = {
      total,
      count: postsWithImages.length,
      page: Number(page),
      limit: Number(limit),
      posts: postsWithImages,
    };

    // 只缓存无筛选条件的结果
    if (!hasFilter) {
      await cacheService.setPaginatedPosts(page, limit, result);
    }

    res.status(200).json(result);
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

    // 只在有新图片上传时才处理图片
    if (files && files.length > 0) {
      // 删除旧图片
      const [oldImages] = await db.query("SELECT image_url FROM post_images WHERE post_id = ?", [post_id]);
      for (const img of oldImages) {
        const oldFilePath = "public" + img.image_url;
        await fs.promises.unlink(oldFilePath).catch(() => {});
      }
      await db.query("DELETE FROM post_images WHERE post_id = ?", [post_id]);

      // 插入新图片
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO post_images (post_id, image_url) VALUES (?, ?)", [post_id, url]));
      await Promise.all(imagePromises);
    }

    // 更新帖子
    const updateQuery = `
      UPDATE posts
      SET title = ?, content = ?, price = ?, campus_id = ?, status = ?, post_type = ?, tag = ? WHERE id = ?`;

    await db.query(updateQuery, [title, content, price, campus_id, status, post_type, tag, post_id]);

    // 更新缓存
    await cacheService.handlePostUpdate(post_id, {
      ...req.body,
      images: files ? files.map((file) => `/uploads/${file.filename}`) : [],
    });

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

// 修改点赞数
router.put("/like/:post_id", async (req, res) => {
  const { post_id } = req.params; // 获取帖子 ID
  const { like } = req.body; // 获取前端传递的 like（true 或 false）

  if (like === undefined) {
    return res.status(400).json({ message: "缺少 like 参数" });
  }

  try {
    // 判断是增加还是减少点赞数
    const likeChange = like === true ? 1 : like === false ? -1 : 0;

    if (likeChange === 0) {
      return res.status(400).json({ message: "无效的 like 参数，必须是 true 或 false" });
    }

    // 更新帖子点赞数
    const [result] = await db.query("UPDATE posts SET likes = likes + ? WHERE id = ? AND status != 'deleted'", [likeChange, post_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "帖子未找到" });
    }

    // 先查询最新值
    const [updatedPost] = await db.query("SELECT likes FROM posts WHERE id = ?", [post_id]);
    await cacheService.handleCounterUpdate(post_id, "likes", updatedPost[0].likes);

    res.status(200).json({ message: likeChange === 1 ? "点赞成功" : "取消点赞成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 修改投诉数
router.put("/complaint/:post_id", async (req, res) => {
  const { post_id } = req.params; // 获取帖子 ID
  const { complaint } = req.body; // 获取前端传递的 complaint（true 或 false）

  if (complaint === undefined) {
    return res.status(400).json({ message: "缺少 complaint 参数" });
  }

  try {
    // 判断是增加还是减少投诉数
    const complaintChange = complaint === true ? 1 : complaint === false ? -1 : 0;

    if (complaintChange === 0) {
      return res.status(400).json({ message: "无效的 complaint 参数，必须是 true 或 false" });
    }

    // 更新帖子投诉数
    const [result] = await db.query("UPDATE posts SET complaints = complaints + ? WHERE id = ? AND status != 'deleted'", [complaintChange, post_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "帖子未找到" });
    }

    // 先查询最新值
    const [updatedPost] = await db.query("SELECT complaints FROM posts WHERE id = ?", [post_id]);
    await cacheService.handleCounterUpdate(post_id, "complaints", updatedPost[0].complaints);

    res.status(200).json({ message: complaintChange === 1 ? "投诉成功" : "取消投诉成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

router.get("/user-history", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { page = 1, limit = 10 } = req.query; // 添加分页参数

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    // 解码 Token 获取用户信息
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id;

    if (!author_id) {
      return res.status(401).json({ message: "无效的用户信息" });
    }

    // 计算分页偏移量
    const offset = (page - 1) * limit;

    // 检查用户是否存在
    const [userExists] = await db.query("SELECT id FROM users WHERE id = ?", [author_id]);

    if (userExists.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 首先获取总数
    const [countRows] = await db.query("SELECT COUNT(*) as total FROM posts WHERE author_id = ? AND status != 'deleted'", [author_id]);
    const total = countRows[0].total;

    // 如果总数为0，直接返回空结果
    if (total === 0) {
      return res.status(200).json({
        total: 0,
        count: 0,
        page: Number(page),
        limit: Number(limit),
        posts: [],
      });
    }

    // 查询当前页的帖子
    const [rows] = await db.query(
      `SELECT * FROM posts 
       WHERE author_id = ? AND status != 'deleted' 
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [author_id, Number(limit), Number(offset)]
    );

    // 如果当前页没有数据，返回空结果
    if (rows.length === 0) {
      return res.status(200).json({
        total,
        count: 0,
        page: Number(page),
        limit: Number(limit),
        posts: [],
      });
    }

    // 获取已查到帖子ID列表
    const postIds = rows.map((p) => p.id);

    // 查询对应的图片
    let imageRows = [];
    if (postIds.length > 0) {
      [imageRows] = await db.query("SELECT post_id, image_url FROM post_images WHERE post_id IN (?)", [postIds]);
    }

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

    // 返回带分页信息的响应
    res.status(200).json({
      total, // 总记录数
      count: postsWithImages.length, // 当前页记录数
      page: Number(page), // 当前页码
      limit: Number(limit), // 每页限制
      posts: postsWithImages, // 帖子数据
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
