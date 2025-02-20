import redis from "../redis.js";

// 缓存 KEY 配置
const CACHE_KEYS = {
  POST_DETAIL: "post:detail:", // 单个帖子详情
  POST_PAGE: "post:page:", // 分页查询结果
};

// 缓存时间配置
const CACHE_TTL = {
  POST_DETAIL: 600, // 10 minutes
  POST_PAGE: 300, // 5 minutes
};

/**
 * Redis 缓存服务
 */
const cacheService = {
  // 查询帖子详情缓存
  async getPostDetail(postId) {
    try {
      const data = await redis.get(CACHE_KEYS.POST_DETAIL + postId);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("[Cache] Failed to get post detail:", err);
      return null;
    }
  },

  // 设置帖子详情缓存
  async setPostDetail(postId, postData) {
    try {
      await redis.setex(CACHE_KEYS.POST_DETAIL + postId, CACHE_TTL.POST_DETAIL, JSON.stringify(postData));
    } catch (err) {
      console.error("[Cache] Failed to set post detail:", err);
    }
  },

  // 查询分页帖子缓存
  async getPaginatedPosts(page, limit) {
    try {
      const key = `${CACHE_KEYS.POST_PAGE}${page}:${limit}`;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error("[Cache] Failed to get paginated posts:", err);
      return null;
    }
  },

  // 设置分页帖子缓存
  async setPaginatedPosts(page, limit, data) {
    try {
      const key = `${CACHE_KEYS.POST_PAGE}${page}:${limit}`;
      await redis.setex(key, CACHE_TTL.POST_PAGE, JSON.stringify(data));
    } catch (err) {
      console.error("[Cache] Failed to set paginated posts:", err);
    }
  },

  // 清除分页缓存
  async clearPaginationCache() {
    try {
      const pattern = `${CACHE_KEYS.POST_PAGE}*`;
      let cursor = "0";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("[Cache] Failed to clear pagination cache:", err);
    }
  },

  // 处理新帖子
  async handleNewPost(postData) {
    try {
      const pipeline = redis.pipeline();

      // 设置新帖子缓存
      pipeline.setex(CACHE_KEYS.POST_DETAIL + postData.id, CACHE_TTL.POST_DETAIL, JSON.stringify(postData));

      // 执行pipeline
      await pipeline.exec();

      // 清除分页缓存
      await this.clearPaginationCache();
    } catch (err) {
      console.error("[Cache] Failed to handle new post:", err);
    }
  },

  // 处理帖子更新
  async handlePostUpdate(postId, updatedData) {
    try {
      // 更新帖子详情缓存
      await this.setPostDetail(postId, updatedData);
      // 清除分页缓存
      await this.clearPaginationCache();
    } catch (err) {
      console.error("[Cache] Failed to handle post update:", err);
    }
  },

  // 处理帖子删除(软)
  async handlePostDeletion(postId) {
    try {
      const pipeline = redis.pipeline();

      // 删除帖子详情缓存
      pipeline.del(CACHE_KEYS.POST_DETAIL + postId);

      // 执行pipeline
      await pipeline.exec();

      // 清除分页缓存
      await this.clearPaginationCache();
    } catch (err) {
      console.error("[Cache] Failed to handle post deletion:", err);
    }
  },

  // 处理计数器更新
  async handleCounterUpdate(postId, field, value) {
    try {
      // 获取当前缓存的帖子数据
      const cachedPost = await this.getPostDetail(postId);
      if (cachedPost) {
        // 更新计数器字段
        cachedPost[field] = value;
        // 重新设置缓存
        await this.setPostDetail(postId, cachedPost);
      }

      // 清除分页缓存
      await this.clearPaginationCache();
    } catch (err) {
      console.error("[Cache] Failed to handle counter update:", err);
    }
  },
};

export default cacheService;
