import redis from "./redis.js";

console.log("开始测试 Redis 连接...");

// 测试基本连接
async function testRedisConnection() {
  try {
    // 测试 1: 基本连接
    console.log("\n测试 1: 测试基本连接");
    await new Promise((resolve) => {
      redis.on("connect", () => {
        console.log("✅ Redis 连接成功");
        resolve();
      });
    });

    // 测试 2: 基本的设置和获取操作
    console.log("\n测试 2: 测试基本的 SET/GET 操作");
    await redis.set("test_key", "test_value");
    const value = await redis.get("test_key");
    console.log("获取的值:", value);
    if (value === "test_value") {
      console.log("✅ SET/GET 操作测试通过");
    } else {
      console.log("❌ SET/GET 操作测试失败");
    }

    // 测试 3: 删除测试键
    console.log("\n测试 3: 测试删除操作");
    await redis.del("test_key");
    const deletedValue = await redis.get("test_key");
    if (deletedValue === null) {
      console.log("✅ DELETE 操作测试通过");
    } else {
      console.log("❌ DELETE 操作测试失败");
    }

    // 测试 4: 测试过期时间设置
    console.log("\n测试 4: 测试过期时间设置");
    await redis.set("expire_key", "will_expire", "EX", 2);
    console.log("等待 2 秒后键将过期...");
    await new Promise((resolve) => setTimeout(resolve, 2100));
    const expiredValue = await redis.get("expire_key");
    if (expiredValue === null) {
      console.log("✅ 过期时间测试通过");
    } else {
      console.log("❌ 过期时间测试失败");
    }
  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
  } finally {
    console.log("\n测试完成，关闭连接...");
    await redis.quit();
    process.exit(0);
  }
}

// 运行测试
testRedisConnection();
