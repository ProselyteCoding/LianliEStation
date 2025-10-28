// messages、history、favorites 的状态管理
import api from "../api/index";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AxiosError } from "axios";
import { compressAppealImages } from "../utils/imageCompression";

interface Response {
  id: number;
  title: string;
  user_id: number;
  response_type: string;
  related_id: number;
  content: string;
  read_status: string;
  created_at: string;
  images: string[];
  image_count: number;
}

interface Appeal {
  id: number;
  title: string;
  author_id: number;
  post_id: number;
  content: string;
  type: string;
  status: string;
  read_status: string;
  created_at: string;
  images: string[];
}

interface FavoriteGoods {
  id: number;
  title: string;
  content: string | null;
  goods_type: "receive" | "sell";
  tag: string | null;
  author_id: number;
  created_at: string;
  status: "active" | "inactive" | "deleted";
  price: number;
  campus_id: number;
  images: string[];
}

interface FavoritePost {
  id: number;
  title: string;
  content: string | null;
  author_id: number;
  created_at: string;
  status: "active" | "inactive" | "deleted";
  campus_id: number;
  likes: number;
  images: string[];
}

interface HistoryPost {
  id: number;
  title: string;
  tag: string | null;
  content: string | null;
  author_id: number;
  created_at: string;
  status: "active" | "inactive" | "deleted";
  campus_id: number;
  likes: number;
  images: string[];
}

interface HistoryGoods {
  id: number;
  title: string;
  content: string | null;
  goods_type: "receive" | "sell";
  tag: string | null;
  author_id: number;
  created_at: string;
  status: "active" | "inactive" | "deleted";
  price: number;
  campus_id: number;
  images: string[];
}

interface RecordState {
  reset: () => void; // 退出账号时重置状态
  // history 相关的状态管理及方法
  historyGoods: HistoryGoods[];
  historyPosts: HistoryPost[];
  getHistory: () => Promise<void>;
  removeHistoryGoods: (id: number, reason?: string) => Promise<number | undefined>;
  removeHistoryPost: (id: number) => Promise<number | undefined>;
  setPage: () => void;
  page: number;
  clear: () => void;
  initialHistoryGoods: () => Promise<void>;

  // favorites 相关的状态管理及方法
  favoritesGoods: FavoriteGoods[];
  favoritePosts: FavoritePost[];
  getFavorites: () => Promise<void>;
  addFavoriteGoods: (goods_id: number) => Promise<number|undefined>;
  addFavoritePost: (favoritePost: number) => Promise<number|undefined>;
  removeFavoritePost: (favoriteId: number) => Promise<number|undefined>;
  removeFavoriteGoods: (favoriteId: number) => Promise<number|undefined>;

  // messages 相关的状态管理及方法
  appeals: Appeal[];
  responses: Response[];
  fetchAppeals: () => Promise<void>; // 获取所有申诉（管理员）
  submitAppeal: (
    id: number,
    type: string,
    content: string,
    images?: File[]
  ) => Promise<void>; // 提交申诉
  searchAppeals: (status?: string) => Promise<any>; // 查询申诉
  updateAppealStatus: (appeal_id: number, status: string) => Promise<void>; // 修改申诉状态（管理员）
  deleteAppeal: (appeal_id: number) => Promise<void>; // 删除申诉（管理员）
  fetchResponses: () => Promise<any>; // 获取当前用户所有回复
  submitResponse: (
    user_id: number,
    response_type: string,
    related_id: number,
    content: string
  ) => Promise<void>; // 提交回复(管理员)
  markResponse: (messages: object) => Promise<void>; // 标记回复为已读
}

const useRecordStore = create<RecordState>()(
  persist(
    (set, get) => ({
      historyGoods: [],
      forumPosts: [],
      historyPosts: [],
      favoritesGoods: [],
      favoritePosts: [],
      appeals: [],
      responses: [],
      page: 1,

      reset: () => {
        set({
          historyGoods: [],
          historyPosts: [],
          favoritesGoods: [],
          favoritePosts: [],
          appeals: [],
          responses: [],
          page: 1,
        });
      },

      setPage: () =>
        set((preState) => ({
          page: preState.page + 1,
        })),

      clear: () =>
        set(() => ({
          historyGoods: [],
        })),

      initialHistoryGoods: async () => {
        try {
          const response = await api.get("/api/history");

          // 检查返回数据是否有效
          if (response?.status === 200 && response.data) {
            const data = response.data.goods;
            set((state) => ({
              historyGoods: [...data], // 更新 goods 状态
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No goods available or unexpected response status");
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching goods:", error.message);
          } else {
            console.error("Error fetching goods:", error);
          }
        }
      },

      getHistory: async () => {
        try {
          const response = await api.get("/api/history");

          // 检查返回数据是否有效
          if (response?.status === 200 && response.data) {
            const data = response.data;
            set((state) => ({
              historyGoods: data.goods,
              historyPosts: data.posts, // 更新 goods 状态
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No goods available or unexpected response status");
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching goods:", error.message);
          } else {
            console.error("Error fetching goods:", error);
          }
        }
      },

      removeHistoryGoods: async (id, reason) => {
        try {
          const config = reason 
            ? { params: { reason } }
            : {};
          const response = await api.delete(`/api/goods/${id}`, config);
          return response.status;
        } catch (error) {
          const err = error as AxiosError;
          console.error('删除历史商品失败:', err);
          if (err.response) {
            return err.response.status;
          }
          throw error;
        }
      },

      removeHistoryPost: async (id) => {
        try {
          const response = await api.delete(`/api/forum/posts/${id}`);
          return response.status;
        } catch (error) {
          const err = error as AxiosError;
          console.error('删除历史帖子失败:', err);
          if (err.response) {
            return err.response.status;
          }
          throw error;
        }
      },

      getFavorites: async () => {
        try {
          const res = await api.get("/api/favorites");
          if (res?.status === 200 && res.data) {
            set({ 
              favoritesGoods:  res.data.data.goods ,
              favoritePosts:  res.data.data.posts ,
            });
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No goods available or unexpected response status");
          }
        } catch (error) {
          console.error("未知错误:", error);
        }
      },

      addFavoriteGoods: async (goods_id: number) => {
        try{
          const response = await api.post("/api/favorites/goods/add", { goods_id: goods_id });
          return response.status
        }
        catch(error){
          console.log(error)
          const err = error as AxiosError;
          console.log(err)
          if (err.response)
            return err.response.status;
        }
      },

      removeFavoriteGoods: async (favoriteId: number) => {
        try{
          const response = await api.delete("/api/favorites/goods/remove", { 
            data: { goods_id: favoriteId }
          });
          return response.status;
        }
        catch(error){
          const err = error as AxiosError;
          console.log(err)
          if (err.response)
            return err.response.status;
        }
      },

      addFavoritePost: async (favoriteId: number) => {
        try{
          const response = await api.post("/api/favorites/posts/add", { post_id: favoriteId });
          return response.status
        }
        catch(error){
          const err = error as AxiosError;
          console.log(err)
          if (err.response)
            return err.response.status;
        }
      },

      removeFavoritePost: async (favoriteId: number) => {
        try{
          const response = await api.delete("/api/favorites/posts/remove", { 
            data: { post_id: favoriteId }
          });
          return response.status
        }
        catch(error){
          const err = error as AxiosError;
          console.log(err)
          if (err.response)
            return err.response.status;
        }
      },

      // 获取全部申诉(管理员)
      fetchAppeals: async () => {
        try {
          const response = await api.get("/api/appeals");
          set({ appeals: response?.data }); // 更新申诉列表
        } catch (error) {
          console.error(error);
        }
      },

      // 提交申诉
      submitAppeal: async (
        id: number,
        content: string,
        type: string,
        images?: File[]
      ) => {
        try {
          const formData = new FormData();
          formData.append("id", id.toString());
          formData.append("content", content);
          formData.append("type", type);
          
          // ✅ 如果有图片，先压缩再添加
          if (images && images.length > 0) {
            console.log('🔄 开始压缩申诉图片...');
            const compressedImages = await compressAppealImages(images);
            compressedImages.forEach((image, index) => {
              formData.append(`images[${index}]`, image);
            });
          }

          const response = await api.post("/api/appeals/publish", { formData });
          console.log(response?.data.message); // 申诉提交成功
          await get().fetchAppeals(); // 重新获取申诉列表
        } catch (error) {
          throw error;
        }
      },

      // 查询当前用户提交的申诉记录
      searchAppeals: async (status?: string) => {
        try {
          const params = status ? { status } : {}; // 如果status存在，则将status作为查询参数
          const response = await api.get("/api/appeals/search", {
            params: { params },
          });
          set({ appeals: response?.data.data }); // 更新申诉列表
          return response?.data.data; // 返回申诉列表数据
        } catch (error) {
          throw error;
        }
      },

      // 修改申诉状态(管理员)
      updateAppealStatus: async (appeal_id: number, status: string) => {
        try {
          const response = await api.put(`/api/appeals/${appeal_id}`, {
            status,
          });
          console.log(response?.data.message); // 状态修改成功
          await get().fetchAppeals(); // 重新获取申诉列表
        } catch (error) {
          throw error;
        }
      },

      // 删除申诉(管理员)
      deleteAppeal: async (appeal_id: number) => {
        try {
          const response = await api.delete(`/api/appeals/${appeal_id}`);
          console.log(response?.data.message); // 申诉删除成功
          await get().fetchAppeals(); // 重新获取申诉列表
        } catch (error) {
          throw error;
        }
      },

      // 获取用户的所有通知消息
      fetchResponses: async () => {
        try {
          const response = await api.get("/api/messages/");
          set({ responses: response?.data.data }); // 更新回复列表
          return response?.data.data; // 返回回复列表数据
        } catch (error) {
          throw error;
        }
      },

      // (管理员)提交回复
      submitResponse: async (
        user_id: number,
        response_type: string,
        related_id: number,
        content: string
      ) => {
        try {
          const response = await api.post("/api/responses/", {
            user_id,
            response_type,
            related_id,
            content,
          });
          console.log(response?.data.message); // 回复提交成功
          await get().fetchResponses(); // 重新获取回复列表
        } catch (error) {
          throw error;
        }
      },

      // 修改通知状态（已读/未读）
      markResponse: async (messages: object) => {
        try {
          const response = await api.put(
            `/api/messages/status/batch`,
            messages
          );
          console.log(response?.data.message); // 回复标记为已读成功
          await get().fetchResponses(); // 重新获取回复列表
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: "recordStore", // 储存的唯一名称
    }
  )
);

export default useRecordStore;
