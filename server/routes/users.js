import dotenv from "dotenv";
import { Router } from "express";
import fs from "fs";
import jwt from "jsonwebtoken"; // 用于生成 JWT
import db from "../db.js";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import { authToken, requireAdmin } from "../middlewares/authToken.js"; // 引入token验证中间件
// import {passwordChangeLimiter, verificationLimiter } from "../middlewares/limiter.js"; // 引入限流中间件
// import logIP from "../middlewares/logIP.js"; // 记录IP的中间件
// import sendVerificationCode from "../middlewares/mailer.js"; // 引入邮件发送逻辑

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 存储验证码的临时存储（实际使用中应该用缓存或数据库）
// let currentVerificationCode = "";
// let currentVerificationEmail = "";

// 获取所有用户信息（仅限管理员）
// router.get("/", (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1]; // 获取 token

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY); // 解码 Token 获取用户信息

//     // 判断 token 中的 isAdmin 字段是否为 true
//     if (decoded.isAdmin !== true) {
//       return res.status(403).json({ message: "您没有权限查看用户列表" });
//     }

//     // 查询所有用户信息：email, qq_id, nickname, username, id, campus_id, credit
//     db.query("SELECT id, nickname, email, qq_id, username, campus_id, credit FROM users")
//       .then(([rows]) => {
//         res.json(rows); // 返回用户列表
//       })
//       .catch((err) => {
//         console.error(err);
//         res.status(500).json({ message: "服务器错误" });
//       });
//   } catch (err) {
//     console.error(err);
//     return res.status(401).json({ message: "Token 无效" });
//   }
// });

// 用户注册，同时使用 IP 限流和打印 IP 功能
// router.post("/register", registerLimiter, logIP, async (req, res) => {
//   let { nickname, email, password, qq_id, username, campus_id } = req.body;

//   if (!nickname) nickname = "DUTers"; // 默认昵称
//   if (!email || !password || !qq_id || !username || !campus_id) {
//     return res.status(400).json({ message: "缺少必要参数" });
//   }

//   try {
//     // 检查邮箱或用户名是否已存在
//     const [rows] = await db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username]);

//     if (rows.length > 0) {
//       const emailRegistered = rows.some((row) => row.email === email);
//       const usernameRegistered = rows.some((row) => row.username === username);
//       return res.status(400).json({
//         message: emailRegistered && usernameRegistered ? "邮箱和用户名都已被注册" : emailRegistered ? "邮箱已被注册" : "用户名已被注册",
//       });
//     }

//     // 加密密码
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 存入数据库
//     await db.query("INSERT INTO users (nickname, email, password, qq_id, username, campus_id ) VALUES (?, ?, ?, ?, ?, ?)", [nickname, email, hashedPassword, qq_id, username, campus_id]);

//     res.status(201).json({ message: "注册成功" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "服务器错误" });
//   }
// });

// 管理员注册
// router.post("/admin/register", async (req, res) => {
//   const { username, password, email } = req.body;

//   if (!username || !password || !email) {
//     return res.status(400).json({ message: "请提供用户名、密码和邮箱" });
//   }

//   try {
//     // 检查管理员是否已经存在
//     const [existingAdmin] = await db.query("SELECT * FROM admins WHERE username = ? OR email = ?", [username, email]);
//     if (existingAdmin.length > 0) {
//       return res.status(400).json({ message: "管理员用户名或邮箱已存在" });
//     }

//     // 加密密码
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // 创建管理员账户
//     const [result] = await db.query("INSERT INTO admins (username, password, email) VALUES (?, ?, ?)", [username, hashedPassword, email]);

//     // 返回成功消息
//     res.status(201).json({ message: "管理员注册成功" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "服务器错误" });
//   }
// });

// 根据用户ID查询用户的qq_id, credit,avatar,nickname信息,便于前端帖子的详情页查询用户基本信息
// router.post("/login", loginLimiter, async (req, res) => {
//   const { identifier, password } = req.body;

//   if (!identifier || !password) {
//     return res.status(400).json({ message: "请正确输入用户名/邮箱和密码" });
//   }

//   try {
//     let user;
//     let isAdmin = false;

//     // 先在普通用户表中查询
//     const [userRows] = await db.query("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier]);

//     if (userRows.length > 0) {
//       user = userRows[0];
//       isAdmin = false;
//     } else {
//       // 如果普通用户表中没有，再在管理员表中查询
//       const [adminRows] = await db.query("SELECT * FROM admins WHERE username = ?", [identifier]);
//       if (adminRows.length === 0) {
//         return res.status(401).json({ message: "用户名/邮箱或密码错误" });
//       }
//       user = adminRows[0];
//       isAdmin = true;
//     }

//     // 验证密码
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "用户名/邮箱或密码错误" });
//     }

//     // 构建 JWT 负载，根据身份返回不同信息
//     const tokenPayload = isAdmin
//       ? {
//           user_id: user.id,
//           username: user.username,
//           isAdmin: true,
//         }
//       : {
//           user_id: user.id,
//           username: user.username,
//           nickname: user.nickname,
//           campus_id: user.campus_id,
//           qq: user.qq_id,
//           isAdmin: false,
//         };

//     const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "7d" });

//     res.status(200).json({
//       message: "登录成功",
//       token,
//       isAdmin,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "服务器错误" });
//   }
// });

// 获取用户个人信息
// router.get("/profile", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 获取用户信息（包括 email 和 credit）
//     const [userRows] = await db.query("SELECT email, credit FROM users WHERE id = ?", [decoded.user_id]);

//     if (userRows.length === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     // 返回用户的详细信息，包括 email 和 credit
//     const userData = {
//       nickname: decoded.nickname,
//       username: decoded.username,
//       campus_id: decoded.campus_id,
//       qq: decoded.qq,
//       email: userRows[0].email, // 从数据库查询得到的 email
//       credit: userRows[0].credit, // 从数据库查询得到的 credit
//     };

//     res.status(200).json(userData);
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 获取用户个人信息
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  // 如果没有token，记录游客访问并返回401
  if (!token) {
    try {
      await db.query("INSERT INTO record_event (info, type) VALUES (?, 'visit')", ["guest"]);
    } catch (recordErr) {
      console.error("记录游客访问事件失败:", recordErr);
    }
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;
    const isAdmin = decoded.isAdmin || false;

    const [userRows] = await db.query("SELECT email, credit, theme_id, background_url, banner_url, avatar FROM users WHERE id = ?", [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 获取点赞记录
    const [likeRecords] = await db.query("SELECT target_id, target_type FROM likes WHERE user_id = ?", [userId]);

    // 获取投诉记录
    const [complaintRecords] = await db.query("SELECT target_id, target_type FROM complaints WHERE user_id = ?", [userId]);

    // 并行查询用户收藏的帖子和商品
    const [[posts], [goods]] = await Promise.all([
      db.query(
        `
        SELECT p.id
        FROM user_favorites uf
        INNER JOIN posts p ON uf.post_id = p.id
        WHERE uf.user_id = ? AND uf.post_id IS NOT NULL AND uf.goods_id IS NULL AND p.status != 'deleted'
        ORDER BY uf.created_at DESC
      `,
        [userId]
      ),
      // 查询收藏的商品（goods表结构：id, title, content, author_id, created_at, status, price, campus_id, goods_type, tag）
      db.query(
        `
        SELECT g.id
        FROM user_favorites uf
        INNER JOIN goods g ON uf.goods_id = g.id
        WHERE uf.user_id = ? AND uf.goods_id IS NOT NULL AND uf.post_id IS NULL AND g.status != 'deleted'
        ORDER BY uf.created_at DESC
      `,
        [userId]
      ),
    ]);

    // 记录登录用户访问事件
    try {
      await db.query("INSERT INTO record_event (info, type) VALUES (?, 'visit')", [userId.toString()]);
    } catch (recordErr) {
      console.error("记录访问事件失败:", recordErr);
      // 不影响主要功能，继续执行
    }

    // 返回用户的详细信息
    const userData = {
      nickname: decoded.nickname,
      username: decoded.username,
      campus_id: decoded.campus_id,
      qq_id: decoded.qq,
      email: userRows[0].email,
      credit: userRows[0].credit,
      theme_id: userRows[0].theme_id,
      background_url: userRows[0].background_url,
      banner_url: userRows[0].banner_url,
      avatar: userRows[0].avatar,
      isAdmin: isAdmin,
      records: {
        likes: likeRecords.map((record) => ({
          targetId: record.target_id,
          targetType: record.target_type,
        })),
        complaints: complaintRecords.map((record) => ({
          targetId: record.target_id,
          targetType: record.target_type,
        })),
      },
      favorites: {
        posts: posts || [],
        goods: goods || [],
      },
    };

    return res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    // 如果token无效，也记录一次游客访问
    try {
      await db.query("INSERT INTO record_event (info, type) VALUES (?, 'visit')", ["guest"]);
    } catch (recordErr) {
      console.error("记录游客访问事件失败:", recordErr);
    }
    return res.status(401).json({ message: "Token 无效" });
  }
});

// 删除当前用户（需要身份验证）
// router.delete("/profile", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     const [result] = await db.query("DELETE FROM users WHERE id = ?", [decoded.user_id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json({ message: "账户已删除" });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 修改用户信息（需要身份验证）
// router.put("/profile", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     const { nickname, qq_id, campus_id } = req.body;

//     // 验证必填参数
//     if (!nickname || !qq_id || !campus_id) {
//       return res.status(400).json({ message: "缺少必要参数" });
//     }

//     // 更新用户信息
//     const [result] = await db.query("UPDATE users SET nickname = ?, qq_id = ?,  campus_id = ? WHERE id = ?", [nickname, qq_id, campus_id, decoded.user_id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     // 生成新 Token
//     const newToken = jwt.sign(
//       {
//         user_id: decoded.user_id,
//         username: decoded.username,
//         nickname: nickname,
//         campus_id: campus_id,
//         qq: qq_id,
//       },
//       SECRET_KEY,
//       { expiresIn: "7d" }
//     );

//     res.status(200).json({ message: "更新成功", token: newToken });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 修改用户信息（需要身份验证）- 合并后的版本
router.put("/profile", authToken, async (req, res) => {
  try {
    const { nickname, qq_id, campus_id, theme_id } = req.body;

    // 验证必填参数 - 只有 nickname, campus_id 是必填的
    if (!nickname || !campus_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 构建更新字段和参数
    let updateFields = "nickname = ?, campus_id = ?";
    let updateParams = [nickname, campus_id];

    // 如果提供了qq_id，也进行更新
    if (qq_id !== undefined) {
      updateFields += ", qq_id = ?";
      updateParams.push(qq_id);
    }

    // 如果提供了theme_id，也进行更新
    if (theme_id !== undefined) {
      updateFields += ", theme_id = ?";
      updateParams.push(theme_id);
    }

    // 添加WHERE条件参数
    updateParams.push(req.user.user_id);

    // 更新用户信息
    const [result] = await db.query(`UPDATE users SET ${updateFields} WHERE id = ?`, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 生成新 Token
    const newToken = jwt.sign(
      {
        user_id: req.user.user_id,
        username: req.user.username,
        nickname: nickname,
        campus_id: campus_id,
        qq: qq_id,
        isAdmin: req.user.isAdmin || false,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "更新成功", token: newToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 请求验证码（发送邮件）
// router.post("/RequestVerification", verificationLimiter, async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     return res.status(400).json({ message: "邮箱不能为空" });
//   }

//   try {
//     // 发送验证码
//     const verificationCode = await sendVerificationCode(email);

//     // 存储验证码和邮箱（简易实现，实际上可以存入数据库或缓存）
//     currentVerificationCode = verificationCode;
//     currentVerificationEmail = email;
//     // console.log(currentVerificationCode);
//     // console.log(currentVerificationEmail);

//     res.status(200).json({ message: "验证码已发送，请检查您的邮箱" });
//   } catch (error) {
//     console.error("发送验证码失败: ", error);
//     res.status(500).json({ message: "邮件发送失败" });
//   }
// });

// // 修改密码
// router.put("/change-password", passwordChangeLimiter, async (req, res) => {
//   const { email, newPassword, verificationCode } = req.body;

//   if (!email || !newPassword || !verificationCode) {
//     return res.status(400).json({ message: "缺少必要参数" });
//   }

//   // 验证验证码是否正确
//   if (verificationCode !== currentVerificationCode || email !== currentVerificationEmail) {
//     return res.status(400).json({ message: "验证码错误或已过期" });
//   }

//   try {
//     // 查找用户
//     const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (user.length === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     // 加密新密码
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // 更新密码
//     await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

//     res.status(200).json({ message: "密码修改成功" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "服务器错误" });
//   }
// });

// 修改用户主题
// router.put("/change-theme", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const { theme_id } = req.body;

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 验证必填参数
//     if (!theme_id) {
//       return res.status(400).json({ message: "缺少必要参数" });
//     }

//     // 更新用户信息
//     const [result] = await db.query("UPDATE users SET theme_id = ? WHERE id = ?", [theme_id, decoded.user_id]);

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json({ message: "更新成功" });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 修改用户背景
// router.put("/change-background", upload.single("image"), async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const backgroundFile = req.file; // 获取上传的背景文件

//   if (!token) {
//     if (backgroundFile) {
//       try {
//         await fs.promises.unlink(backgroundFile.path);
//       } catch {}
//       return res.status(401).json({ message: "未提供 Token" });
//     }
//   }

//   // 检查是否上传文件
//   if (!backgroundFile) {
//     return res.status(400).json({ message: "请选择要上传的背景图片" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 从数据库获取旧背景路径
//     const [oldUserRows] = await db.query("SELECT background_url FROM users WHERE id = ?", [decoded.user_id]);
//     if (!oldUserRows.length) {
//       if (backgroundFile) {
//         import("fs").then((fsModule) => fsModule.unlink(backgroundFile.path, () => {}));
//       }
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     let oldBackground = oldUserRows[0].background;
//     let backgroundPath = oldBackground; // 如果无新背景就保持原背景

//     // 如果上传了新背景，则删除旧背景（非默认）并更新为新路径
//     if (backgroundFile) {
//       if (oldBackground && oldBackground !== "/uploads/default_background.png") {
//         try {
//           await fs.promises.unlink("public" + oldBackground);
//         } catch {}
//       }
//       backgroundPath = "/uploads/" + backgroundFile.filename;
//     }

//     // 更新用户信息
//     const [result] = await db.query("UPDATE users SET background_url = ? WHERE id = ?", [backgroundPath, decoded.user_id]);

//     if (result.affectedRows === 0) {
//       if (backgroundFile) {
//         try {
//           await fs.promises.unlink(backgroundFile.path);
//         } catch {}
//       }

//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json({ message: "更新成功" });
//   } catch (err) {
//     console.error(err);
//     if (backgroundFile) {
//       try {
//         await fs.promises.unlink(backgroundFile.path);
//       } catch {}
//     }
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 修改用户 banner 图
// router.put("/change-banner", upload.single("image"), async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const bannerFile = req.file; // 获取上传的 banner 文件

//   if (!token) {
//     if (bannerFile) {
//       try {
//         await fs.promises.unlink(bannerFile.path);
//       } catch {}
//       return res.status(401).json({ message: "未提供 Token" });
//     }
//   }

//   // 检查是否上传文件
//   if (!bannerFile) {
//     return res.status(400).json({ message: "请选择要上传的 banner 图片" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 从数据库获取旧 banner 路径
//     const [oldUserRows] = await db.query("SELECT banner_url FROM users WHERE id = ?", [decoded.user_id]);
//     if (!oldUserRows.length) {
//       if (bannerFile) {
//         import("fs").then((fsModule) => fsModule.unlink(bannerFile.path, () => {}));
//       }
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     let oldBanner = oldUserRows[0].banner;
//     let bannerPath = oldBanner; // 如果无新 banner 就保持原 banner

//     // 如果上传了新 banner，则删除旧 banner（非默认）并更新为新路径
//     if (bannerFile) {
//       if (oldBanner && oldBanner !== "/uploads/default_banner.png") {
//         try {
//           await fs.promises.unlink("public" + oldBanner);
//         } catch {}
//       }
//       bannerPath = "/uploads/" + bannerFile.filename;
//     }

//     // 更新用户信息
//     const [result] = await db.query("UPDATE users SET banner_url = ? WHERE id = ?", [bannerPath, decoded.user_id]);

//     if (result.affectedRows === 0) {
//       if (bannerFile) {
//         try {
//           await fs.promises.unlink(bannerFile.path);
//         } catch {}
//       }

//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json({ message: "更新成功" });
//   } catch (err) {
//     console.error(err);
//     if (bannerFile) {
//       try {
//         await fs.promises.unlink(bannerFile.path);
//       } catch {}
//     }
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 修改用户头像
// router.put("/change-avatar", upload.single("image"), async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const avatarFile = req.file; // 获取上传的头像文件

//   if (!token) {
//     if (avatarFile) {
//       try {
//         await fs.promises.unlink(avatarFile.path);
//       } catch {}
//       return res.status(401).json({ message: "未提供 Token" });
//     }
//   }

//   // 检查是否上传文件
//   if (!avatarFile) {
//     return res.status(400).json({ message: "请选择要上传的头像图片" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 从数据库获取旧头像路径
//     const [oldUserRows] = await db.query("SELECT avatar FROM users WHERE id = ?", [decoded.user_id]);
//     if (!oldUserRows.length) {
//       if (avatarFile) {
//         import("fs").then((fsModule) => fsModule.unlink(avatarFile.path, () => {}));
//       }
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     let oldAvatar = oldUserRows[0].avatar;
//     let avatarPath = oldAvatar; // 如果无新头像就保持原头像

//     // 如果上传了新头像，则删除旧头像（非默认）并更新为新路径
//     if (avatarFile) {
//       if (oldAvatar && oldAvatar !== "/uploads/default_avatar.png") {
//         try {
//           await fs.promises.unlink("public" + oldAvatar);
//         } catch {}
//       }
//       avatarPath = "/uploads/" + avatarFile.filename;
//     }

//     // 更新用户信息
//     const [result] = await db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, decoded.user_id]);

//     if (result.affectedRows === 0) {
//       if (avatarFile) {
//         try {
//           await fs.promises.unlink(avatarFile.path);
//         } catch {}
//       }

//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json({ message: "更新成功" });
//   } catch (err) {
//     console.error(err);
//     if (avatarFile) {
//       try {
//         await fs.promises.unlink(avatarFile.path);
//       } catch {}
//     }
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 统一上传头像/背景/Banner接口
router.put("/profile/image", authToken, upload.single("image"), async (req, res) => {
  const imageFile = req.file; // 获取上传的文件
  const { type } = req.query; // 从查询参数获取上传类型: avatar, background, banner

  // 验证类型参数
  if (!["avatar", "background", "banner"].includes(type)) {
    if (imageFile) {
      try {
        await fs.promises.unlink(imageFile.path);
      } catch {}
    }
    return res.status(400).json({ message: "无效的图片类型，必须是 avatar, background 或 banner" });
  }

  // 检查是否上传文件
  if (!imageFile) {
    return res.status(400).json({
      message: `请选择要上传的${type === "avatar" ? "头像" : type === "background" ? "背景" : "banner"}图片`,
    });
  }

  try {
    // 根据类型确定字段名和默认图片路径
    let fieldName, defaultImage;
    switch (type) {
      case "avatar":
        fieldName = "avatar";
        defaultImage = "/uploads/default.png";
        break;
      case "background":
        fieldName = "background_url";
        defaultImage = "/uploads/default_background.png";
        break;
      case "banner":
        fieldName = "banner_url";
        defaultImage = "/uploads/default_banner.png";
        break;
    }

    // 从数据库获取旧图片路径
    const [oldUserRows] = await db.query(`SELECT ${fieldName} FROM users WHERE id = ?`, [req.user.user_id]);
    if (!oldUserRows.length) {
      if (imageFile) {
        import("fs").then((fsModule) => fsModule.unlink(imageFile.path, () => {}));
      }
      return res.status(404).json({ message: "用户不存在" });
    }

    let oldImage = oldUserRows[0][fieldName];
    let imagePath = oldImage; // 如果无新图片就保持原图片

    // 如果上传了新图片，则删除旧图片（非默认）并更新为新路径
    if (imageFile) {
      if (oldImage && oldImage !== defaultImage) {
        try {
          await fs.promises.unlink("public" + oldImage);
        } catch {}
      }
      imagePath = "/uploads/" + imageFile.filename;
    }

    // 更新用户信息
    const [result] = await db.query(`UPDATE users SET ${fieldName} = ? WHERE id = ?`, [imagePath, req.user.user_id]);

    if (result.affectedRows === 0) {
      if (imageFile) {
        try {
          await fs.promises.unlink(imageFile.path);
        } catch {}
      }
      return res.status(404).json({ message: "用户不存在" });
    }

    // 在响应中包含更新成功的消息和新的图片路径
    res.status(200).json({
      message: "更新成功",
      url: imagePath, // 统一使用url字段
      type: type, // 同时返回类型，方便前端识别
    });
  } catch (err) {
    console.error(err);
    if (imageFile) {
      try {
        await fs.promises.unlink(imageFile.path);
      } catch {}
    }
    res.status(500).json({ message: "服务器错误" });
  }
});

// 查询用户主题、背景、banner 图、头像
// 建议前端使用 localStorage 缓存，避免频繁请求
// router.get("/get-theme", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);

//     // 在数据库中查询用户主题、背景、banner 图、头像
//     const [rows] = await db.query("SELECT theme_id, background_url, banner_url , avatar FROM users WHERE id = ?", [decoded.user_id]);

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "用户不存在" });
//     }

//     res.status(200).json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// 根据用户ID查询用户的qq_id, credit,avatar,nickname信息,便于前端帖子的详情页查询用户基本信息
router.get("/user-info/:user_id", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "缺少用户 ID" });
  }

  try {
    const [rows] = await db.query("SELECT qq_id, credit, avatar,nickname FROM users WHERE id = ?", [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const user = rows[0];
    res.status(200).json({
      qq_id: user.qq_id,
      credit: user.credit,
      avatar: user.avatar,
      nickname: user.nickname,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 获取用户点赞/投诉记录
// router.get("/records", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ message: "未提供 Token" });
//   }

//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     const userId = decoded.user_id;

//     const [likeRecords] = await db.query("SELECT target_id, target_type FROM likes WHERE user_id = ?", [userId]);

//     const [complaintRecords] = await db.query("SELECT target_id, target_type FROM complaints WHERE user_id = ?", [userId]);

//     res.status(200).json({
//       likes: likeRecords.map((record) => ({
//         targetId: record.target_id,
//         targetType: record.target_type,
//       })),
//       complaints: complaintRecords.map((record) => ({
//         targetId: record.target_id,
//         targetType: record.target_type,
//       })),
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Token 无效" });
//   }
// });

// Token 解码
router.get("/decode-token", authToken, (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
