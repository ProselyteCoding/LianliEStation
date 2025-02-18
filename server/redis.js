import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  port: process.env.REDIS_PORT || 6379,
  host: process.env.REDIS_HOST || "localhost",
  password: process.env.REDIS_PASSWORD || "",
  // 如果连接失败，最多重试3次
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// 监听连接事件
redis.on("connect", () => {
  console.log("Redis client connected");
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export default redis;
