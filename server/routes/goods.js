import dotenv from "dotenv";
import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import upload from "../middlewares/uploadImg.js";

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 软删除商品
router.delete("/:post_id", async (req, res) => {
  const { post_id } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const author_id = decoded.user_id;
    const isAdmin = decoded.isAdmin || false;

    // 确保必需的参数存在
    if (!post_id || !author_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    if (isAdmin) {
      try {
        await db.query("UPDATE goods SET status = 'deleted' WHERE id = ?", [post_id]);
        return res.status(200).json({ message: "管理员已删除商品" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "服务器错误" });
      }
    }

    // 查找商品并验证用户是否是作者
    try {
      const [rows] = await db.query("SELECT * FROM goods WHERE id = ? AND author_id = ?", [post_id, author_id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "商品未找到或用户无权删除" });
      }

      await db.query("UPDATE goods SET status = 'deleted' WHERE id = ?", [post_id]);
      return res.status(200).json({ message: "商品已标记为删除" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "服务器错误" });
    }
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "无效的 Token" });
  }
});

// 分页查询商品
router.get("/", async (req, res) => {
  try {
    const { keyword, title, status, campus_id, goods_type, tag, min_price, max_price, page, limit } = req.query;

    let whereClause = "WHERE status != 'deleted'";
    let params = [];

    if (keyword) {
      whereClause += " AND (title LIKE ? OR content LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

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

    if (goods_type) {
      whereClause += " AND goods_type = ?";
      params.push(goods_type);
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

    const countQuery = `SELECT COUNT(*) as total FROM goods ${whereClause}`;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0].total;
    // 如果总数为0，直接返回空结果
    if (total === 0) {
      return res.status(200).json({
        total: 0,
        count: 0, // 添加当前页商品数量
        page: page ? Number(page) : null,
        limit: limit ? Number(limit) : null,
        goods: [],
      });
    }

    let dataQuery;
    let finalParams = [...params];
    // 判断是否使用分页
    if (page && limit) {
      const offset = (Number(page) - 1) * limit;

      dataQuery = `
        SELECT *
        FROM goods
        ${whereClause}
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
      `;

      // 追加分页参数
      finalParams.push(Number(limit), Number(offset));
    } else {
      dataQuery = `
        SELECT *
        FROM goods
        ${whereClause}
        ORDER BY id DESC
      `;
    }

    const [rows] = await db.query(dataQuery, finalParams);

    // 添加第二次检查
    if (rows.length === 0) {
      return res.status(200).json({
        total,
        count: 0,
        page: page ? Number(page) : null,
        limit: limit ? Number(limit) : null,
        goods: [],
      });
    }

    // 获取已查到商品ID列表
    const postIds = rows.map((p) => p.id);
    // 查询对应的图片
    const [imageRows] = await db.query("SELECT goods_id, image_url FROM goods_images WHERE goods_id IN (?)", [postIds]);

    const imagesMap = imageRows.reduce((map, row) => {
      if (!map[row.goods_id]) {
        map[row.goods_id] = [];
      }
      map[row.goods_id].push(row.image_url);
      return map;
    }, {});

    const authorIds = rows.map((p) => p.author_id);
    const [authorRows] = await db.query("SELECT id, qq_id, nickname, credit, avatar FROM users WHERE id IN (?)", [authorIds]);

    // 创建作者信息映射表
    const authorsMap = authorRows.reduce((map, author) => {
      map[author.id] = {
        qq_id: author.qq_id,
        nickname: author.nickname,
        credit: author.credit,
        avatar: author.avatar,
      };
      return map;
    }, {});

    // 组装商品、图片和作者信息
    const postsWithImagesAndAuthor = rows.map((post) => {
      // 添加图片信息
      post.images = imagesMap[post.id] || [];

      // 添加作者信息
      const authorInfo = authorsMap[post.author_id] || { qq_id: null, avatar: null };
      post.author_qq_id = authorInfo.qq_id;
      post.author_nickname = authorInfo.nickname;
      post.author_credit = authorInfo.credit;
      post.author_avatar = authorInfo.avatar;

      return post;
    });

    res.status(200).json({
      total,
      count: postsWithImagesAndAuthor.length,
      page: page ? Number(page) : null,
      limit: limit ? Number(limit) : null,
      goods: postsWithImagesAndAuthor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 修改商品
router.put("/:post_id", upload.array("images", 3), async (req, res) => {
  const { post_id } = req.params;
  const { title, content, price, campus_id, status, goods_type, tag } = req.body;
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
    if (!author_id || !title || !campus_id || !goods_type || !price || !status) {
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

    let query, queryParams;

    if (isAdmin) {
      query = "SELECT * FROM goods WHERE id = ? AND status != 'deleted'";
      queryParams = [post_id];
    } else {
      query = "SELECT * FROM goods WHERE id = ? AND author_id = ? AND status != 'deleted'";
      queryParams = [post_id, author_id];
    }

    const [rows] = await db.query(query, queryParams);

    if (rows.length === 0) {
      if (req.files && req.files.length) {
        for (const file of req.files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(404).json({ message: "商品未找到或用户无权修改" });
    }

    // 只在有新图片上传时才处理图片
    if (files && files.length > 0) {
      // 删除旧图片
      const [oldImages] = await db.query("SELECT image_url FROM goods_images WHERE goods_id = ?", [post_id]);
      for (const img of oldImages) {
        const oldFilePath = "public" + img.image_url;
        await fs.promises.unlink(oldFilePath).catch(() => {});
      }
      await db.query("DELETE FROM goods_images WHERE goods_id = ?", [post_id]);

      // 插入新图片
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO goods_images (goods_id, image_url) VALUES (?, ?)", [post_id, url]));
      await Promise.all(imagePromises);
    }

    // 更新商品
    const updateQuery = `
      UPDATE goods
      SET title = ?, content = ?, price = ?, campus_id = ?, status = ?, goods_type = ?, tag = ? WHERE id = ?`;

    await db.query(updateQuery, [title, content, price, campus_id, status, goods_type, tag, post_id]);

    // 返回成功信息
    res.status(200).json({ message: "商品更新成功" });
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

// 修改点赞数和投诉数
router.put("/:action/:post_id", async (req, res) => {
  const { post_id, action } = req.params;
  const { value } = req.body;

  if (action !== "like" && action !== "complaint") {
    return res.status(400).json({ message: "无效的操作类型，必须是 like 或 complaint" });
  }

  if (value === undefined) {
    return res.status(400).json({ message: `缺少 ${action === "like" ? "like" : "complaint"} 参数` });
  }

  try {
    // 判断是增加还是减少点赞数
    const valueChange = value === true ? 1 : value === false ? -1 : 0;

    if (valueChange === 0) {
      return res.status(400).json({ message: `无效的 ${action === "like" ? "like" : "complaint"} 参数，必须是 true 或 false` });
    }

    const field = action === "like" ? "likes" : "complaints";

    // 更新商品数据
    const [result] = await db.query(`UPDATE goods SET ${field} = ${field} + ? WHERE id = ? AND status != 'deleted'`, [valueChange, post_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "商品未找到" });
    }

    // 根据操作类型和值变化返回相应消息
    let message;
    if (action === "like") {
      message = valueChange === 1 ? "点赞成功" : "取消点赞成功";
    } else {
      message = valueChange === 1 ? "投诉成功" : "取消投诉成功";
    }

    res.status(200).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
