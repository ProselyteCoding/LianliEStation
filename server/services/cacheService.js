import redis from "../redis.js";

// 缓存键前缀
const CACHE_KEYS = {
  POST_LIST: "post:list",
  POST_DETAIL: "post:detail:",
  USER_POSTS: "post:user:",
  SEARCH_RESULTS: "post:search:",
  PAGINATED_POSTS: "post:paginated:",
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  POST_LIST: 300, // 5分钟
  POST_DETAIL: 600, // 10分钟
  USER_POSTS: 300, // 5分钟
  SEARCH_RESULTS: 180, // 3分钟
  PAGINATED_POSTS: 300,
};

// 生成搜索查询的缓存键
const generateSearchKey = (params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key]) {
        acc[key] = params[key];
      }
      return acc;
    }, {});
  return `${CACHE_KEYS.SEARCH_RESULTS}${JSON.stringify(sortedParams)}`;
};

// 缓存服务
const cacheService = {
  // 获取帖子列表缓存
  async getPostList() {
    try {
      const cachedData = await redis.get(CACHE_KEYS.POST_LIST);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (err) {
      console.error("Cache get error:", err);
      return null;
    }
  },

  // 设置帖子列表缓存
  async setPostList(posts) {
    try {
      await redis.setex(CACHE_KEYS.POST_LIST, CACHE_TTL.POST_LIST, JSON.stringify(posts));
    } catch (err) {
      console.error("Cache set error:", err);
    }
  },

  // 获取帖子详情缓存
  async getPostDetail(postId) {
    try {
      const cachedData = await redis.get(CACHE_KEYS.POST_DETAIL + postId);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (err) {
      console.error("Cache get error:", err);
      return null;
    }
  },

  // 设置帖子详情缓存
  async setPostDetail(postId, postData) {
    try {
      await redis.setex(CACHE_KEYS.POST_DETAIL + postId, CACHE_TTL.POST_DETAIL, JSON.stringify(postData));
    } catch (err) {
      console.error("Cache set error:", err);
    }
  },

  // 清除与特定帖子相关的所有缓存
  async invalidatePostCache(postId, authorId) {
    try {
      const keys = [CACHE_KEYS.POST_LIST, CACHE_KEYS.POST_DETAIL + postId, `${CACHE_KEYS.USER_POSTS}${authorId}*`, `${CACHE_KEYS.SEARCH_RESULTS}*`];

      // 使用pipeline批量删除缓存
      const pipeline = redis.pipeline();

      // 删除确定的键
      pipeline.del(keys[0]);
      pipeline.del(keys[1]);

      // 使用scan删除模式匹配的键
      const scanAndDelete = async (pattern) => {
        let cursor = "0";
        do {
          const [newCursor, matchedKeys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
          cursor = newCursor;

          if (matchedKeys.length > 0) {
            pipeline.del(...matchedKeys);
          }
        } while (cursor !== "0");
      };

      // 删除用户帖子缓存和搜索结果缓存
      await scanAndDelete(keys[2]);
      await scanAndDelete(keys[3]);

      await pipeline.exec();
    } catch (err) {
      console.error("Cache invalidation error:", err);
    }
  },

  // 获取分页帖子列表缓存
  async getPaginatedPosts(page, limit) {
    try {
      const key = `${CACHE_KEYS.PAGINATED_POSTS}${page}:${limit}`;
      const cachedData = await redis.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (err) {
      console.error("Cache get error:", err);
      return null;
    }
  },

  // 设置分页帖子列表缓存
  async setPaginatedPosts(page, limit, data) {
    try {
      const key = `${CACHE_KEYS.PAGINATED_POSTS}${page}:${limit}`;
      await redis.setex(key, CACHE_TTL.PAGINATED_POSTS, JSON.stringify(data));
    } catch (err) {
      console.error("Cache set error:", err);
    }
  },

  // 清除所有分页帖子列表缓存
  async invalidatePaginatedCache() {
    try {
      const pattern = `${CACHE_KEYS.PAGINATED_POSTS}*`;
      let cursor = "0";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error("Cache invalidation error:", err);
    }
  },

  // 处理新帖子的缓存
  async handleNewPost(postData) {
    try {
      // 清除分页缓存
      await this.invalidatePaginatedCache();

      // 清除帖子列表缓存
      await redis.del(CACHE_KEYS.POST_LIST);

      // 清除用户帖子列表缓存
      const userPostsPattern = `${CACHE_KEYS.USER_POSTS}${postData.author_id}*`;
      let cursor = "0";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", userPostsPattern, "COUNT", 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");

      // 设置新帖子的详情缓存
      await this.setPostDetail(postData.id, {
        post: postData,
        images: postData.images || [],
      });
    } catch (err) {
      console.error("New post cache handling error:", err);
    }
  },

  // 处理帖子更新后的缓存更新
  async handlePostUpdate(postId, updatedData, authorId) {
    try {
      const pipeline = redis.pipeline();

      // 更新帖子详情缓存
      const postDetailKey = CACHE_KEYS.POST_DETAIL + postId;
      const cachedPost = await redis.get(postDetailKey);
      if (cachedPost) {
        const postData = JSON.parse(cachedPost);
        postData.post = { ...postData.post, ...updatedData };
        if (updatedData.images) {
          postData.images = updatedData.images;
        }
        pipeline.setex(postDetailKey, CACHE_TTL.POST_DETAIL, JSON.stringify(postData));
      }

      // 清除相关缓存
      pipeline.del(CACHE_KEYS.POST_LIST);
      pipeline.del(`${CACHE_KEYS.USER_POSTS}${authorId}*`);

      const searchPattern = `${CACHE_KEYS.SEARCH_RESULTS}*`;
      let cursor = "0";
      const keysToDelete = new Set();

      // 先收集所有要删除的键
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", searchPattern, "COUNT", 100);
        cursor = newCursor;
        keys.forEach((key) => keysToDelete.add(key));
      } while (cursor !== "0");

      // 将收集到的键添加到pipeline中
      if (keysToDelete.size > 0) {
        pipeline.del([...keysToDelete]);
      }

      // 最后执行pipeline
      await pipeline.exec();
    } catch (err) {
      console.error("Post update cache handling error:", err);
    }
  },

  // 处理帖子删除后的缓存更新
  async handlePostDeletion(postId, authorId) {
    try {
      const pipeline = redis.pipeline();
      await this.clearAllRelatedCache(postId, authorId);
      await pipeline.exec();
    } catch (err) {
      console.error("Post deletion cache handling error:", err);
    }
  },

  // 改进点赞/投诉计数更新的缓存处理
  async handleCounterUpdate(postId, field, value) {
    try {
      const pipeline = redis.pipeline();

      // 获取所有需要更新的缓存键
      const postDetailKey = CACHE_KEYS.POST_DETAIL + postId;
      const cachedPost = await redis.get(postDetailKey);
      const cachedList = await redis.get(CACHE_KEYS.POST_LIST);

      // 在一个pipeline中执行所有更新
      if (cachedPost) {
        const postData = JSON.parse(cachedPost);
        postData.post[field] = value;
        pipeline.setex(postDetailKey, CACHE_TTL.POST_DETAIL, JSON.stringify(postData));
      }

      if (cachedList) {
        const posts = JSON.parse(cachedList);
        const updatedPosts = posts.map((post) => (post.id === postId ? { ...post, [field]: value } : post));
        pipeline.setex(CACHE_KEYS.POST_LIST, CACHE_TTL.POST_LIST, JSON.stringify(updatedPosts));
      }

      // 清除分页和搜索缓存
      const keysToDelete = new Set();

      // 收集分页缓存键
      let cursor = "0";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", `${CACHE_KEYS.PAGINATED_POSTS}*`, "COUNT", 100);
        cursor = newCursor;
        keys.forEach((key) => keysToDelete.add(key));
      } while (cursor !== "0");

      // 收集搜索缓存键
      cursor = "0";
      do {
        const [newCursor, keys] = await redis.scan(cursor, "MATCH", `${CACHE_KEYS.SEARCH_RESULTS}*`, "COUNT", 100);
        cursor = newCursor;
        keys.forEach((key) => keysToDelete.add(key));
      } while (cursor !== "0");

      // 将所有要删除的键添加到pipeline中
      if (keysToDelete.size > 0) {
        pipeline.del([...keysToDelete]);
      }

      // 执行所有操作
      await pipeline.exec();
    } catch (err) {
      console.error("Counter update cache handling error:", err);
    }
  },

  // 添加到cacheService对象中
  async clearAllRelatedCache(postId, authorId) {
    try {
      const pipeline = redis.pipeline();
      const keysToDelete = new Set();

      // 收集所有要删除的键
      for (const pattern of [`${CACHE_KEYS.PAGINATED_POSTS}*`, `${CACHE_KEYS.SEARCH_RESULTS}*`, `${CACHE_KEYS.USER_POSTS}${authorId}*`]) {
        let cursor = "0";
        do {
          const [newCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
          cursor = newCursor;
          keys.forEach((key) => keysToDelete.add(key));
        } while (cursor !== "0");
      }

      // 添加确定的键
      keysToDelete.add(CACHE_KEYS.POST_LIST);
      if (postId) {
        keysToDelete.add(CACHE_KEYS.POST_DETAIL + postId);
      }

      // 执行删除操作
      if (keysToDelete.size > 0) {
        pipeline.del([...keysToDelete]);
      }

      await pipeline.exec();
    } catch (err) {
      console.error("Clear all related cache error:", err);
    }
  },
};

export default cacheService;
