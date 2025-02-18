import { Router } from "express";
import bcrypt from "bcrypt"; // 用于密码加密
import jwt from "jsonwebtoken"; // 用于生成 JWT
import db from "../db.js";
import dotenv from "dotenv";
import upload from "../middlewares/uploadImg.js"; // 引入图片上传中间件
import fs from "fs";
import { registerLimiter, loginLimiter, passwordChangeLimiter, verificationLimiter } from "../middlewares/limiter.js"; // 引入限流中间件
import logIP from "../middlewares/logIP.js"; // 记录IP的中间件
import sendVerificationCode from "../middlewares/mailer.js"; // 引入邮件发送逻辑
import redis from "../redis.js"; // 引入 Redis
import { decode } from "punycode";

let router = Router();

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// 获取所有用户信息（仅限管理员）
router.get("/", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // 获取 token

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // 解码 Token 获取用户信息

    // 判断 token 中的 isAdmin 字段是否为 true
    if (decoded.isAdmin !== true) {
      return res.status(403).json({ message: "您没有权限查看用户列表" });
    }

    // 查询所有用户信息：email, qq_id, nickname, username, id, campus_id, credit
    db.query("SELECT id, nickname, email, qq_id, username, campus_id, credit FROM users")
      .then(([rows]) => {
        res.json(rows); // 返回用户列表
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: "服务器错误" });
      });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token 无效" });
  }
});

// 用户注册，同时使用 IP 限流和打印 IP 功能
router.post("/register", registerLimiter, logIP, async (req, res) => {
  let { nickname, email, password, qq_id, username, campus_id } = req.body;

  if (!nickname) nickname = "DUTers"; // 默认昵称
  if (!email || !password || !qq_id || !username || !campus_id) {
    return res.status(400).json({ message: "缺少必要参数" });
  }

  try {
    // 检查邮箱或用户名是否已存在
    const [rows] = await db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username]);

    if (rows.length > 0) {
      const emailRegistered = rows.some((row) => row.email === email);
      const usernameRegistered = rows.some((row) => row.username === username);
      return res.status(400).json({
        message: emailRegistered && usernameRegistered ? "邮箱和用户名都已被注册" : emailRegistered ? "邮箱已被注册" : "用户名已被注册",
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 存入数据库
    await db.query("INSERT INTO users (nickname, email, password, qq_id, username, campus_id ) VALUES (?, ?, ?, ?, ?, ?)", [nickname, email, hashedPassword, qq_id, username, campus_id]);

    res.status(201).json({ message: "注册成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 管理员注册
router.post("/admin/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: "请提供用户名、密码和邮箱" });
  }

  try {
    // 检查管理员是否已经存在
    const [existingAdmin] = await db.query("SELECT * FROM admins WHERE username = ? OR email = ?", [username, email]);
    if (existingAdmin.length > 0) {
      return res.status(400).json({ message: "管理员用户名或邮箱已存在" });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建管理员账户
    const [result] = await db.query("INSERT INTO admins (username, password, email) VALUES (?, ?, ?)", [username, hashedPassword, email]);

    // 返回成功消息
    res.status(201).json({ message: "管理员注册成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 根据 qq_id 查询用户信息（仅限管理员）
router.post("/searchByQQ", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // 获取 token
  const { qq_id } = req.body; // 从请求体中获取 qq_id

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  if (!qq_id) {
    return res.status(400).json({ message: "缺少 qq_id 参数" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // 解码 Token 获取用户信息

    // 通过 isAdmin 字段判断是否为管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "您没有权限执行此操作" });
    }

    // 查询指定 qq_id 的用户信息
    const [rows] = await db.query("SELECT id, nickname, email, qq_id, username, credit, campus_id FROM users WHERE qq_id = ?", [qq_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "没有找到匹配的用户" });
    }

    res.status(200).json(rows[0]); // 返回找到的用户信息
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token 无效" });
  }
});

// 用户(管理员)登录
router.post("/login", loginLimiter, async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "请正确输入用户名/邮箱和密码" });
  }

  try {
    let user;
    let isAdmin = false;

    // 先在普通用户表中查询
    const [userRows] = await db.query("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier]);

    if (userRows.length > 0) {
      user = userRows[0];
      isAdmin = false;
    } else {
      // 如果普通用户表中没有，再在管理员表中查询
      const [adminRows] = await db.query("SELECT * FROM admins WHERE username = ?", [identifier]);
      if (adminRows.length === 0) {
        return res.status(401).json({ message: "用户名/邮箱或密码错误" });
      }
      user = adminRows[0];
      isAdmin = true;
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "用户名/邮箱或密码错误" });
    }

    // 构建 JWT 负载，根据身份返回不同信息
    const tokenPayload = isAdmin
      ? {
          user_id: user.id,
          username: user.username,
          isAdmin: true,
        }
      : {
          user_id: user.id,
          username: user.username,
          nickname: user.nickname,
          campus_id: user.campus_id,
          qq: user.qq_id,
          isAdmin: false,
        };

    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "7d" });

    res.status(200).json({
      message: "登录成功",
      token,
      isAdmin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// 获取用户个人信息
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 获取用户信息（包括 email 和 credit）
    const [userRows] = await db.query("SELECT email, credit FROM users WHERE id = ?", [decoded.user_id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 返回用户的详细信息，包括 email 和 credit
    const userData = {
      nickname: decoded.nickname,
      username: decoded.username,
      campus_id: decoded.campus_id,
      qq: decoded.qq,
      email: userRows[0].email, // 从数据库查询得到的 email
      credit: userRows[0].credit, // 从数据库查询得到的 credit
    };

    res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token 无效" });
  }
});

// 删除当前用户（需要身份验证）
router.delete("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [decoded.user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json({ message: "账户已删除" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token 无效" });
  }
});

// 修改用户信息（需要身份验证）
router.put("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { nickname, qq_id, campus_id } = req.body;

    // 验证必填参数
    if (!nickname || !qq_id || !campus_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 更新用户信息
    const [result] = await db.query("UPDATE users SET nickname = ?, qq_id = ?,  campus_id = ? WHERE id = ?", [nickname, qq_id, campus_id, decoded.user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 生成新 Token
    const newToken = jwt.sign(
      {
        user_id: decoded.user_id,
        username: decoded.username,
        nickname: nickname,
        campus_id: campus_id,
        qq: qq_id,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "更新成功", token: newToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token 无效" });
  }
});

// 请求验证码（发送邮件）
router.post("/RequestVerification", verificationLimiter, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { email } = req.body;

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  if (!email) {
    return res.status(400).json({ message: "邮箱不能为空" });
  }

  try {
    // 发送验证码
    const verificationCode = await sendVerificationCode(email);

    // 使用Redis存储验证码
    await redis.set(`verificationCode:${email}`, verificationCode, "EX", 300); // 5分钟后过期

    res.status(200).json({ message: "验证码已发送，请检查您的邮箱" });
  } catch (error) {
    console.error("发送验证码失败: ", error);
    res.status(500).json({ message: "邮件发送失败" });
  }
});

// 修改密码
router.put("/change-password", passwordChangeLimiter, async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { email, newPassword, verificationCode } = req.body;

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  if (!email || !newPassword || !verificationCode) {
    return res.status(400).json({ message: "请输入有效的邮箱、验证码和新密码" });
  }

  // 从Redis获取验证码并验证
  const cachedCode = await redis.get(`verificationCode:${email}`);
  if (!cachedCode || verificationCode !== cachedCode) {
    return res.status(400).json({ message: "验证码错误或已过期" });
  }

  try {
    // 查找用户
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    // 验证成功后删除验证码
    await redis.del(`verificationCode:${email}`);

    res.status(200).json({ message: "密码修改成功" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器错误，请稍后重试" });
  }
});

// 修改用户主题
router.put("/change-theme", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { theme_id } = req.body;

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 验证必填参数
    if (!theme_id) {
      return res.status(400).json({ message: "缺少必要参数" });
    }

    // 更新用户信息
    const [result] = await db.query("UPDATE users SET theme_id = ? WHERE id = ?", [theme_id, decoded.user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json({ message: "更新成功" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token 无效" });
  }
});

// 修改用户背景
router.put("/change-background", upload.single("image"), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const backgroundFile = req.file; // 获取上传的背景文件

  if (!token) {
    if (backgroundFile) {
      try {
        await fs.promises.unlink(backgroundFile.path);
      } catch {}
      return res.status(401).json({ message: "未提供 Token" });
    }
  }

  // 检查是否上传文件
  if (!backgroundFile) {
    return res.status(400).json({ message: "请选择要上传的背景图片" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 从数据库获取旧背景路径
    const [oldUserRows] = await db.query("SELECT background_url FROM users WHERE id = ?", [decoded.user_id]);
    if (!oldUserRows.length) {
      if (backgroundFile) {
        import("fs").then((fsModule) => fsModule.unlink(backgroundFile.path, () => {}));
      }
      return res.status(404).json({ message: "用户不存在" });
    }

    let oldBackground = oldUserRows[0].background;
    let backgroundPath = oldBackground; // 如果无新背景就保持原背景

    // 如果上传了新背景，则删除旧背景（非默认）并更新为新路径
    if (backgroundFile) {
      if (oldBackground && oldBackground !== "/uploads/default_background.png") {
        try {
          await fs.promises.unlink("public" + oldBackground);
        } catch {}
      }
      backgroundPath = "/uploads/" + backgroundFile.filename;
    }

    // 更新用户信息
    const [result] = await db.query("UPDATE users SET background_url = ? WHERE id = ?", [backgroundPath, decoded.user_id]);

    if (result.affectedRows === 0) {
      if (backgroundFile) {
        try {
          await fs.promises.unlink(backgroundFile.path);
        } catch {}
      }

      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json({ message: "更新成功" });
  } catch (err) {
    console.error(err);
    if (backgroundFile) {
      try {
        await fs.promises.unlink(backgroundFile.path);
      } catch {}
    }
    res.status(401).json({ message: "Token 无效" });
  }
});

// 修改用户 banner 图
router.put("/change-banner", upload.single("image"), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const bannerFile = req.file; // 获取上传的 banner 文件

  if (!token) {
    if (bannerFile) {
      try {
        await fs.promises.unlink(bannerFile.path);
      } catch {}
      return res.status(401).json({ message: "未提供 Token" });
    }
  }

  // 检查是否上传文件
  if (!bannerFile) {
    return res.status(400).json({ message: "请选择要上传的 banner 图片" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 从数据库获取旧 banner 路径
    const [oldUserRows] = await db.query("SELECT banner_url FROM users WHERE id = ?", [decoded.user_id]);
    if (!oldUserRows.length) {
      if (bannerFile) {
        import("fs").then((fsModule) => fsModule.unlink(bannerFile.path, () => {}));
      }
      return res.status(404).json({ message: "用户不存在" });
    }

    let oldBanner = oldUserRows[0].banner;
    let bannerPath = oldBanner; // 如果无新 banner 就保持原 banner

    // 如果上传了新 banner，则删除旧 banner（非默认）并更新为新路径
    if (bannerFile) {
      if (oldBanner && oldBanner !== "/uploads/default_banner.png") {
        try {
          await fs.promises.unlink("public" + oldBanner);
        } catch {}
      }
      bannerPath = "/uploads/" + bannerFile.filename;
    }

    // 更新用户信息
    const [result] = await db.query("UPDATE users SET banner_url = ? WHERE id = ?", [bannerPath, decoded.user_id]);

    if (result.affectedRows === 0) {
      if (bannerFile) {
        try {
          await fs.promises.unlink(bannerFile.path);
        } catch {}
      }

      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json({ message: "更新成功" });
  } catch (err) {
    console.error(err);
    if (bannerFile) {
      try {
        await fs.promises.unlink(bannerFile.path);
      } catch {}
    }
    res.status(401).json({ message: "Token 无效" });
  }
});

// 修改用户头像
router.put("/change-avatar", upload.single("image"), async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const avatarFile = req.file; // 获取上传的头像文件

  if (!token) {
    if (avatarFile) {
      try {
        await fs.promises.unlink(avatarFile.path);
      } catch {}
      return res.status(401).json({ message: "未提供 Token" });
    }
  }

  // 检查是否上传文件
  if (!avatarFile) {
    return res.status(400).json({ message: "请选择要上传的头像图片" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 从数据库获取旧头像路径
    const [oldUserRows] = await db.query("SELECT avatar FROM users WHERE id = ?", [decoded.user_id]);
    if (!oldUserRows.length) {
      if (avatarFile) {
        import("fs").then((fsModule) => fsModule.unlink(avatarFile.path, () => {}));
      }
      return res.status(404).json({ message: "用户不存在" });
    }

    let oldAvatar = oldUserRows[0].avatar;
    let avatarPath = oldAvatar; // 如果无新头像就保持原头像

    // 如果上传了新头像，则删除旧头像（非默认）并更新为新路径
    if (avatarFile) {
      if (oldAvatar && oldAvatar !== "/uploads/default_avatar.png") {
        try {
          await fs.promises.unlink("public" + oldAvatar);
        } catch {}
      }
      avatarPath = "/uploads/" + avatarFile.filename;
    }

    // 更新用户信息
    const [result] = await db.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, decoded.user_id]);

    if (result.affectedRows === 0) {
      if (avatarFile) {
        try {
          await fs.promises.unlink(avatarFile.path);
        } catch {}
      }

      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json({ message: "更新成功" });
  } catch (err) {
    console.error(err);
    if (avatarFile) {
      try {
        await fs.promises.unlink(avatarFile.path);
      } catch {}
    }
    res.status(401).json({ message: "Token 无效" });
  }
});

// 查询用户主题、背景、banner 图、头像
// 建议前端使用 localStorage 缓存，避免频繁请求
router.get("/get-theme", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // 在数据库中查询用户主题、背景、banner 图、头像
    const [rows] = await db.query("SELECT theme_id, background_url, banner_url , avatar FROM users WHERE id = ?", [decoded.user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token 无效" });
  }
});

// 管理员修改用户信用值 (credit)
router.put("/updateCredit", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // 获取 token
  const { qq_id, credit } = req.body; // 获取 qq_id 和新的 credit 值

  if (!token) {
    return res.status(401).json({ message: "未提供 Token" });
  }

  if (!qq_id || credit === undefined) {
    return res.status(400).json({ message: "缺少必要参数" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // 解码 Token 获取用户信息

    // 通过 isAdmin 字段判断是否为管理员
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "您没有权限执行此操作" });
    }

    // 更新指定 qq_id 用户的 credit 值
    const [result] = await db.query("UPDATE users SET credit = ? WHERE qq_id = ?", [credit, qq_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "没有找到匹配的用户" });
    }

    res.status(200).json({ message: "信用值已更新" });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token 无效" });
  }
});

// 根据用户ID查询用户的qq_id, credit,avatar,nickname信息,便于前端帖子的详情页查询用户基本信息
router.get("/userInfo/:user_id", async (req, res) => {
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
