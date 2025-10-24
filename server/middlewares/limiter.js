import rateLimit from "express-rate-limit";

// 自定义IP获取函数，支持代理环境
const getClientIP = (req) => {
  // 优先获取代理头信息中的真实IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  const clientIP = req.headers['x-client-ip'];
  if (clientIP) {
    return clientIP;
  }
  
  // fallback到默认IP获取方式
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         'unknown';
};

// 注册限流，防止恶意注册
export const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时
  max: 5, // 每个 IP 最多允许 5 次成功注册请求（适应共享IP环境）
  skipFailedRequests: true, // 仅对成功请求计数
  message: { message: "今日注册次数已达上限，请明天再试" },
  keyGenerator: getClientIP, // 使用自定义IP获取函数
});

// 登录限流，防止暴力破解
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 15, // 每个 IP 最多允许 15 次登录尝试（略微放宽）
  message: { message: "您的登录尝试次数过多，请稍后再试" },
  skipSuccessfulRequests: true, // 只对失败的请求计数
  keyGenerator: getClientIP, // 使用自定义IP获取函数
});

// 密码修改限流
export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每个 IP 最多允许 5 次密码修改尝试（略微放宽）
  message: { message: "您的密码修改尝试次数过多，请稍后再试" },
  skipSuccessfulRequests: true, // 只对失败的请求计数
  keyGenerator: getClientIP, // 使用自定义IP获取函数
});

// 配置请求验证码的 IP 限制
export const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 每个 IP 最多允许 10 次请求验证码（放宽限制）
    skipFailedRequests: true, // 仅对成功请求计数
    message: { message: "您的请求验证码次数过多，请稍后再试" }, // 超过限制时的响应消息
    keyGenerator: getClientIP, // 使用自定义IP获取函数
});

// 发布内容限流，防止垃圾信息
export const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每个 IP 最多允许 20 次发布请求
  skipFailedRequests: true, // 仅对成功请求计数
  message: { message: "发布内容过于频繁，请稍后再试" },
  keyGenerator: getClientIP, // 使用自定义IP获取函数
});

// 申诉提交限流，防止恶意申诉
export const appealLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时
  max: 5, // 每个 IP 最多允许 5 次申诉请求
  skipFailedRequests: true, // 仅对成功请求计数
  message: { message: "今日申诉次数已达上限，请明天再试" },
  keyGenerator: getClientIP,
});

// 评论发布限流，防止垃圾评论
export const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分钟
  max: 10, // 每个 IP 最多允许 10 次评论
  skipFailedRequests: true, // 仅对成功请求计数
  message: { message: "评论过于频繁，请稍后再试" },
  keyGenerator: getClientIP, // 使用自定义IP获取函数
});
  