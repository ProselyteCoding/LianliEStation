import { message } from "antd";
// 商品与帖子的状态管理
import api from "../api/index";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AxiosError } from "axios";
import { compressPostImages } from "../utils/imageCompression";

interface Goods {
  id: number;
  title: string;
  content: string | null;
  price: number;
  campus_id: number;
  status: "active" | "inactive" | "deleted";
  goods_type: "receive" | "sell";
  tag: string | null;
  author_id: number;
  likes: number;
  complaints: number;
  created_at: string;
  images: string[];
  author_qq_id: string | null;
  author_nickname: string | null;
  author_avatar: string | null;
  author_credit: number;
}

interface GoodsFilters {
  searchTerm: string | null;
  priceRange: [number, number];
  tag: string | null;
  goods_type: "receive" | "sell" | null;
  campus_id: number | null;
}

interface PostFilters {
  searchTerm: string | null;
  tag: string | null;
  campus_id: number | null;
}

interface User {
  id: number;
  nickname: string;
  avatar: string;
}

interface Reply {
  id: number;
  content: string;
  created_at: string;
  user: User;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: User;
  replies: Reply[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  // tag: string;
  author_id: number;
  campus_id: number;
  author_avatar: string;
  author_name: string;
  status: "active" | "inactive" | "deleted";
  likes: number;
  created_at: string;
  images: string[];
  comments: Comment[];
}

interface MainState {
  reset: () => void; // 退出账号时重置状态
  
  // 分页状态
  marketPage: number;
  forumPage: number;
  
  // 数据列表
  goods: Goods[];
  posts: Post[];
  
  // 筛选器
  goodsFilters: GoodsFilters;
  postFilters: PostFilters;
  
  // 加载状态
  isMarketLoading: boolean;
  isMarketLoadingMore: boolean; // 添加加载更多的标志
  isForumLoading: boolean;
  isForumLoadingMore: boolean; // 添加帖子加载更多的标志
  hasMoreGoods: boolean; // 是否还有更多商品
  hasMorePosts: boolean; // 是否还有更多帖子
  setMarketLoading: (loading: boolean) => void;
  setForumLoading: (loading: boolean) => void;
  
  // 通用清理方法
  clear: () => void;
  
  // 商品相关方法
  fetchGoods: () => Promise<void>;
  updateGoods: () => Promise<void>;
  clearGoods: () => void;
  setGoodsFilters: (newFilters: Partial<GoodsFilters>) => void;
  clearGoodsFilters: () => void;
  publishMarketGoods: (
    title: string,
    campus_id: number,
    goods_type: string,
    content?: string,
    price?: number,
    tag?: string,
    images?: File[]
  ) => Promise<boolean>;
  updateMarketGoods: (
    goods_id: number,
    title: string,
    campus_id: number,
    goods_type: string,
    status: string,
    content?: string,
    price?: number,
    tag?: string,
    images?: File[]
  ) => Promise<boolean>;
  changeGoodsResponse: (
    action: string,
    post_id: string | undefined,
    value: number
  ) => Promise<string | any>;
  updateGoodsItem: (action: string, goods_id: number, value: number) => void;
  
  // 帖子相关方法
  fetchPosts: () => Promise<void>;
  updatePosts: () => Promise<void>;
  clearPosts: () => void;
  setPostFilters: (newFilters: Partial<PostFilters>) => void;
  clearPostFilters: () => void;
  publishForumPost: (
    title: string,
    content: string,
    campus_id: number,
    tag?: string,
    images?: File[]
  ) => Promise<boolean>;
  updateForumPost: (
    post_id: number,
    title: string,
    content: string,
    campus_id: number,
    status: string,
    tag?: string,
    images?: File[]
  ) => Promise<boolean>;
  updateForumInteract: (
    id: number,
    action: string,
    content?: string,
    parent_id?: number,
    value?: number
  ) => Promise<number | undefined>;
  
  // 申诉相关
  publishAppeal: (
    title: string,
    id: number,
    content: string,
    type: string,
    images: File[]
  ) => Promise<boolean>;
}

const useMainStore = create<MainState>()(
  persist(
    (set, get) => ({
      // 分页状态
      marketPage: 1,
      forumPage: 1,
      
      // 数据列表
      goods: [],
      posts: [],
      
      // 筛选器
      goodsFilters: {
        searchTerm: null,
        goods_type: null,
        tag: null,
        priceRange: [0, 1000000],
        campus_id: null,
      },
      postFilters: {
        searchTerm: null,
        tag: null,
        campus_id: null,
      },
      
      // 加载状态
      isMarketLoading: false,
      isMarketLoadingMore: false, // 初始化加载更多状态
      isForumLoading: false,
      isForumLoadingMore: false, // 初始化帖子加载更多状态
      hasMoreGoods: true, // 初始假设有更多商品
      hasMorePosts: true, // 初始假设有更多帖子
      
      // 设置加载状态
      setMarketLoading: (loading) => set({ isMarketLoading: loading }),
      setForumLoading: (loading) => set({ isForumLoading: loading }),

      // 重置所有状态
      reset: () => {
        set({
          marketPage: 1,
          forumPage: 1,
          goods: [],
          posts: [],
          hasMoreGoods: true,
          hasMorePosts: true,
          goodsFilters: {
            searchTerm: null,
            goods_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          },
          postFilters: {
            searchTerm: null,
            tag: null,
            campus_id: null,
          },
        });
      },

      // 通用清理方法
      clear: () =>
        set(() => ({
          goods: [],
          posts: [],
          marketPage: 1,
          forumPage: 1,
          hasMoreGoods: true,
          hasMorePosts: true,
          goodsFilters: {
            searchTerm: null,
            goods_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          },
          postFilters: {
            searchTerm: null,
            tag: null,
            campus_id: null,
          },
        })),

      // ==================== 帖子相关方法 ====================

      // 获取帖子列表（首次加载）
      fetchPosts: async () => {
        set({ isForumLoading: true, forumPage: 1, hasMorePosts: true }); // 重置页码和hasMore状态并开始加载
        
        try {
          const response = await api.get("/api/forum/posts", {
            params: {
              with_comments: true,
              page: 1, // 首次加载从第1页开始
              limit: 16,
              keyword: get().postFilters.searchTerm,
              tag: get().postFilters.tag,
              campus_id: get().postFilters.campus_id,
            },
          });
          if (response?.status === 200 && response.data) {
            const data = response.data.posts;
            set(() => ({
              posts: [...data], // 替换为新数据
              forumPage: 2, // 下次加载第2页
              hasMorePosts: data.length >= 16, // 如果返回的数据少于limit，说明没有更多了
            }));
          } else {
            console.log("No posts available or unexpected response status");
            set({ hasMorePosts: false });
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
          set({ hasMorePosts: false });
        } finally {
          set({ isForumLoading: false }); // 加载完成
        }
      },

      // 更新帖子列表（滚动加载更多）
      updatePosts: async () => {
        // 如果正在加载更多或没有更多内容，直接返回
        if (get().isForumLoadingMore || !get().hasMorePosts) {
          if (!get().hasMorePosts) {
            console.log('没有更多帖子了');
          } else {
            console.log('正在加载帖子中，跳过重复请求');
          }
          return;
        }
        
        set({ isForumLoadingMore: true }); // 标记开始加载
        
        try {
          const response = await api.get("/api/forum/posts", {
            params: {
              with_comments: true,
              limit: 16,
              page: get().forumPage,
              keyword: get().postFilters.searchTerm,
              tag: get().postFilters.tag,
              campus_id: get().postFilters.campus_id,
            },
          });
          if (response?.status === 200 && response.data.posts.length > 0) {
            const data = response.data.posts;
            
            console.log(`成功加载第${get().forumPage}页，获取${data.length}个帖子`);
            
            set((state) => ({
              posts: [...state.posts, ...data], // 追加新数据
              forumPage: state.forumPage + 1, // 页码+1
              hasMorePosts: data.length >= 16, // 如果返回的数据少于limit，说明没有更多了
            }));
          } else {
            console.log("No more posts available");
            set({ hasMorePosts: false });
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
        } finally {
          set({ isForumLoadingMore: false }); // 加载完成
        }
      },

      // 清空帖子列表
      clearPosts: () =>
        set(() => ({
          posts: [],
          forumPage: 1,
          hasMorePosts: true, // 重置hasMore状态
        })),

      // 设置帖子筛选器
      setPostFilters: async (newFilters) => {
        set((state) => ({
          postFilters: { ...state.postFilters, ...newFilters },
        }));
      },

      // 清空帖子筛选器
      clearPostFilters: () =>
        set(() => ({
          postFilters: {
            searchTerm: null,
            tag: null,
            campus_id: null,
          },
        })),

      // 发布帖子
      publishForumPost: async (
        title: string,
        content: string,
        campus_id: number,
        tag?: string,
        images?: File[]
      ) => {
        try {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('content', content);
          formData.append('campus_id', campus_id.toString());
          if(tag) formData.append('tag', tag);
          
          // ✅ 如果有图片，先压缩再添加到formData
          if (images && images.length > 0) {
            console.log('🔄 开始压缩帖子图片...');
            const compressedImages = await compressPostImages(images);
            compressedImages.forEach((image) => {
              formData.append('images', image);
            });
          }

          const response = await api.post("/api/publish/posts", formData);

          if (response.status === 200 || response.status === 201) {
            message.success('发布成功');
            return true;
          } else {
            message.error('发布失败，请稍后重试');
            return false;
          }
        } catch (error) {
          console.error('发布失败:', error);
          message.error('发布失败，请稍后重试');
          return false;
        }
      },

      publishMarketGoods: async (
        title: string,
        campus_id: number,
        goods_type: string,
        content?: string,
        price?: number,
        tag?: string,
        images?: File[]
      ) => {
        try {
          const formData = new FormData();
          
          // 必需参数
          formData.append('title', title);
          formData.append('campus_id', campus_id.toString());
          formData.append('goods_type', goods_type);
          
          // 可选参数
          if (content && content.trim() !== '') {
            formData.append('content', content);
          }
          
          if (price !== undefined && price !== null) {
            formData.append('price', price.toString());
          }
          
          if (tag && tag !== '商品类型') {
            formData.append('tag', tag);
          }
          
          // ✅ 图片上传（最多3张）- 先压缩再上传
          if (images && images.length > 0) {
            console.log('🔄 开始压缩商品图片...');
            const compressedImages = await compressPostImages(images);
            compressedImages.forEach((image) => {
              formData.append('images', image);
            });
          }

          const response = await api.post("/api/publish/goods", formData);

          if (response.status === 200 || response.status === 201) {
            message.success('发布成功');
            return true;
          } else {
            message.error('发布失败，请稍后重试');
            return false;
          }
        } catch (error) {
          console.error('发布失败:', error);
          message.error('发布失败，请稍后重试');
          return false;
        }
      },

      updateMarketGoods: async (
        goods_id: number,
        title: string,
        campus_id: number,
        goods_type: string,
        status: string,
        content?: string,
        price?: number,
        tag?: string,
        images?: File[]
      ) => {
        try {
          const formData = new FormData();
          
          // 必需参数
          formData.append('title', title);
          formData.append('campus_id', campus_id.toString());
          formData.append('goods_type', goods_type);
          formData.append('status', status);
          
          // 可选参数
          if (content && content.trim() !== '') {
            formData.append('content', content);
          }
          
          if (price !== undefined && price !== null) {
            formData.append('price', price.toString());
          }
          
          if (tag && tag !== '商品类型') {
            formData.append('tag', tag);
          }
          
          // ✅ 图片上传（最多3张）- 先压缩再上传
          if (images && images.length > 0) {
            console.log('🔄 开始压缩商品图片（修改）...');
            const compressedImages = await compressPostImages(images);
            compressedImages.forEach((image) => {
              formData.append('images', image);
            });
          }

          const response = await api.put(`/api/goods/${goods_id}`, formData);

          if (response.status === 200) {
            message.success('修改成功');
            return true;
          } else {
            message.error('修改失败，请稍后重试');
            return false;
          }
        } catch (error) {
          console.error('修改失败:', error);
          message.error('修改失败，请稍后重试');
          return false;
        }
      },

      updateForumPost: async (
        post_id: number,
        title: string,
        content: string,
        campus_id: number,
        status: string,
        tag?: string,
        images?: File[]
      ) => {
        try {
          const formData = new FormData();
          
          // 必需参数
          formData.append('title', title);
          formData.append('content', content);
          formData.append('campus_id', campus_id.toString());
          formData.append('status', status);
          
          // 可选参数
          if (tag && tag !== '帖子标签') {
            formData.append('tag', tag);
          }
          
          // ✅ 图片上传（最多9张）- 先压缩再上传
          if (images && images.length > 0) {
            console.log('🔄 开始压缩帖子图片（修改）...');
            const compressedImages = await compressPostImages(images);
            compressedImages.forEach((image) => {
              formData.append('images', image);
            });
          }

          const response = await api.put(`/api/forum/posts/${post_id}`, formData);

          if (response.status === 200) {
            message.success('修改成功');
            return true;
          } else {
            message.error('修改失败，请稍后重试');
            return false;
          }
        } catch (error) {
          console.error('修改失败:', error);
          message.error('修改失败，请稍后重试');
          return false;
        }
      },

      updateForumInteract: async (
        id: number,
        action: string,
        content?: string,
        parent_id?: number,
        value?: number
      ) => {
        try {
          const response = await api.post(`api/forum/posts/interact/${id}`, {
            post_id: id,
            action: action,
            content: content ? content : null,
            parent_id: parent_id ? parent_id : null,
            value: value ? value : null,
          });

          // if (response?.status === 200) {
          //   if(action === "like"){
          //     set((state) => ({
          //       forums: state.forums.map((forum) =>
          //         forum.id === id ? { ...forum, like: !forum.like } : forum
          //       ),
          //     }));
          //   }
          // }
          return response.status;
        }
        catch(error){
          console.log(error)
          const err = error as AxiosError;
          if (err.response)
            return err.response.status;
        }
      },

      // ==================== 商品相关方法 ====================

      // 获取商品列表（首次加载）
      fetchGoods: async () => {
        set({ isMarketLoading: true, marketPage: 1, hasMoreGoods: true }); // 重置页码和hasMore状态并开始加载
        
        try {
          const response = await api.get("/api/goods", {
            params: {
              page: 1, // 首次加载从第1页开始
              limit: 12,
              keyword: get().goodsFilters.searchTerm,
              goods_type: get().goodsFilters.goods_type,
              tag: get().goodsFilters.tag,
              min_price: get().goodsFilters.priceRange[0],
              max_price: get().goodsFilters.priceRange[1],
              campus_id: get().goodsFilters.campus_id,
            },
          });

          // console.log(response);
          // 检查返回数据是否有效
          if (response?.status === 200 && response.data) {
            const data = response.data.goods;
            set((state) => ({
              goods: [...data], // 替换为新数据
              marketPage: 2, // 下次加载第2页
              hasMoreGoods: data.length >= 12, // 如果返回的数据少于limit，说明没有更多了
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No goods available or unexpected response status");
            set({ hasMoreGoods: false });
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
          set({ hasMoreGoods: false });
        } finally {
          set({ isMarketLoading: false }); // 加载完成
        }
      },

      // 清空商品列表
      clearGoods: () =>
        set(() => ({
          goods: [],
          marketPage: 1,
          hasMoreGoods: true, // 重置hasMore状态
        })),

      // 设置商品筛选器
      setGoodsFilters: async (newFilters) => {
        set((state) => ({
          goodsFilters: { ...state.goodsFilters, ...newFilters }, // 更新 filters 状态
        }));
      },

      // 清空商品筛选器
      clearGoodsFilters: () =>
        set(() => ({
          goodsFilters: {
            searchTerm: null,
            goods_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          },
        })),

      // 更新商品列表（滚动加载更多）
      updateGoods: async () => {
        // 如果正在加载更多或没有更多内容，直接返回
        if (get().isMarketLoadingMore || !get().hasMoreGoods) {
          if (!get().hasMoreGoods) {
            console.log('没有更多商品了');
          } else {
            console.log('正在加载中，跳过重复请求');
          }
          return;
        }
        
        set({ isMarketLoadingMore: true }); // 标记开始加载
        
        try {
          const response = await api.get("/api/goods", {
            params: {
              page: get().marketPage,
              limit: 12,
              keyword: get().goodsFilters.searchTerm,
              goods_type: get().goodsFilters.goods_type,
              tag: get().goodsFilters.tag,
              min_price: get().goodsFilters.priceRange[0],
              max_price: get().goodsFilters.priceRange[1],
              campus_id: get().goodsFilters.campus_id,
            },
          });

          // 检查返回数据是否有效
          if (response?.status === 200 && response.data.goods.length > 0) {
            const data = response.data.goods;
            
            console.log(`成功加载第${get().marketPage}页，获取${data.length}个商品`);
            
            set((state) => ({
              goods: [...state.goods, ...data], // 追加新数据
              marketPage: state.marketPage + 1, // 页码+1
              hasMoreGoods: data.length >= 12, // 如果返回的数据少于limit，说明没有更多了
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No more goods available or unexpected response status");
            set({ hasMoreGoods: false });
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching goods:", error.message);
          } else {
            console.error("Error fetching goods:", error);
          }
        } finally {
          set({ isMarketLoadingMore: false }); // 加载完成
        }
      },

      // 修改商品点赞/投诉数
      changeGoodsResponse: async (
        action: string,
        post_id: string | undefined,
        value: number
      ) => {
        let msg: string | any;
        try {
          const response = await api.put(`/api/goods/${action}/${post_id}`, {
            value: value,
          });
          console.log(response);
          if (response?.status === 200) {
            if (post_id) {
              set((state) => ({
                ...state,
                goods: state.goods.map((good) =>
                  good.id === parseInt(post_id)
                    ? { ...good, ...response.data }
                    : good
                ),
              }));
              msg = "success";
            }
          } else if (response?.status === 400) {
            // console.log(response.data)
            msg = response;
          }
        } catch (error) {
          console.error(error);
          msg = error;
        }
        return msg;
      },

      // 发布举报
      publishAppeal: async (
        title: string,
        id: number,
        content: string,
        type: string,
        images: File[]
      ) => {
        console.log(title, id, content, type, images);
        try {
          const formData = new FormData();
          formData.append("id", id.toString());
          formData.append("content", content);
          formData.append("type", type);
          formData.append("title", title);
          for (let i = 0; i < images.length; i++) {
            formData.append("images", images[i]);
          }

          const response = await api.post("/api/appeals/publish", formData);
          console.log(response);
          if (response?.status === 201) {
            return true;
          } else {
            message.error("举报失败");
            return false;
          }
        } catch (error) {
          console.error(error);
          message.error("提交举报失败");
          return false;
        }
      },

      updateGoodsItem: (action: string, goods_id: number, value: number) => {
        const goods = get().goods;
        const newGoodsItem = goods.filter((item) => item.id === goods_id);
        const newGoods: Goods[] = goods.filter((item) => item.id !== goods_id);
        if (value === 1) {
          if (action === "like") {
            newGoodsItem[0].likes += 1;
            newGoods.push(newGoodsItem[0]);
          } else {
            newGoodsItem[0].complaints += 1;
            newGoods.push(newGoodsItem[0]);
          }
        } else {
          if (action === "like") {
            newGoodsItem[0].likes -= 1;
            newGoods.push(newGoodsItem[0]);
          } else {
            newGoodsItem[0].complaints -= 1;
            newGoods.push(newGoodsItem[0]);
          }
        }
        set(() => ({
          goods: newGoods,
        }));
      },
    }),
    {
      name: "mainStore",
    }
  )
);

export default useMainStore;
