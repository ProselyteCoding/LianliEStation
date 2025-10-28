import dotenv from "dotenv";
import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken"; // 用于生成 JWT
import db from "../db.js";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import { appealLimiter } from "../middlewares/limiter.js"; // 引入申诉限流中间件

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 提交申诉
router.post("/publish", appealLimiter, upload.array("images", 3), async (req, res) => {
  const { id, title, content, type } = req.body;
  const files = req.files;
  const token = req.headers.authorization?.split(" ")[1]; // 获取 token

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

    if (!id || !content || !title || !type) {
      if (files && files.length) {
        for (const file of files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 根据 type 判断是商品申诉还是帖子申诉

    if (type === "goods") {
      // 商品申诉
      const [postCheck] = await db.query("SELECT * FROM goods WHERE id = ?", [id]);
      if (postCheck.length === 0) {
        if (files && files.length) {
          for (const file of files) {
            await fs.promises.unlink(file.path).catch(() => {});
          }
        }
        return res.status(404).json({ message: "商品不存在" });
      }
    } else {
      // 帖子申诉
      const [postCheck] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);
      if (postCheck.length === 0) {
        if (files && files.length) {
          for (const file of files) {
            await fs.promises.unlink(file.path).catch(() => {});
          }
        }
        return res.status(404).json({ message: "帖子不存在" });
      }
    }

    // 插入申诉记录
    const [appealResult] = await db.query("INSERT INTO appeals (title, author_id, post_id, content, type) VALUES (?, ?, ?, ?, ?)", [title, author_id, id, content, type]);
    const appealId = appealResult.insertId;
    if (!appealId) {
      if (files && files.length) {
        for (const file of files) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
      return res.status(500).json({ message: "申诉插入失败" });
    }

    // 若上传了图片则存储
    let imageUrls = [];
    if (files && files.length) {
      imageUrls = files.map((file) => `/uploads/${file.filename}`);
      const imagePromises = imageUrls.map((url) => db.query("INSERT INTO appeal_images (appeal_id, image_url) VALUES (?, ?)", [appealId, url]));
      await Promise.all(imagePromises);
    }

    res.status(201).json({ message: "申诉提交成功" });
  } catch (err) {
    console.error(err);
    if (files && files.length) {
      for (const file of files) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
    res.status(500).json({ message: "服务器错误" });
  }
});

// 查询申诉
router.get("/search", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { status } = req.query;

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  if (status && status !== "pending" && status !== "resolved") {
    return res.status(400).json({ message: "无效的状态参数，只能为pending或resolved" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user_id = decoded.user_id;

    // 检查用户是否存在
    const [userCheck] = await db.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    let appeals;

    if (status) {
      [appeals] = await db.query(
        `SELECT a.* FROM appeals a
         WHERE a.author_id = ? AND a.status = ? AND a.status != 'deleted'
         ORDER BY a.created_at DESC`,
        [user_id, status]
      );
    } else {
      [appeals] = await db.query(
        `SELECT a.* FROM appeals a
         WHERE a.author_id = ? AND a.status != 'deleted'
         ORDER BY a.created_at DESC`,
        [user_id]
      );
    }

    if (appeals.length === 0) {
      return res.status(200).json({
        message: "查询成功",
        data: [],
      });
    }
    const appealIds = appeals.map((appeal) => appeal.id);

    const [imageRows] = await db.query("SELECT appeal_id, image_url FROM appeal_images WHERE appeal_id IN (?)", [appealIds]);

    const imagesMap = imageRows.reduce((map, row) => {
      if (!map[row.appeal_id]) {
        map[row.appeal_id] = [];
      }
      map[row.appeal_id].push(row.image_url);
      return map;
    }, {});

    const result = appeals.map((appeal) => ({
      ...appeal,
      images: imagesMap[appeal.id] || [],
    }));

    res.status(200).json({
      message: "查询成功",
      data: result,
    });
  } catch (err) {
    console.error(err);
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "无效的 Token" });
    }
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
