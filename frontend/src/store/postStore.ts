import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface Post {
  id: number;
  title: string;
  content: string | null;
  post_type: "receive" | "sell";
  tag: string | null;
  author_id: number;
  created_at: string;
  status: "active" | "inactive" | "deleted";
  price: number;
  campus_id: number;
  images: string[];
  likes: number;
  complaints: number;
}

interface Filters {
  searchTerm: string | null;
  priceRange: [number, number];
  tag: string | null;
  post_type: "receive" | "sell"|null;
  campus_id: number|null;
}

interface PostState {
  page: number;
  posts: Post[];
  currentPost: Post | null;
  filters: Filters;
  clear: () => void;
  fetchPosts: () => Promise<void>;
  fetchPost: (id: number) => Promise<void>;
  setFilters: (newFilters: Partial<Filters>) => void;
  updatePosts: () => Promise<void>;
  setPage: () => void;
  clearPosts: () => void;
  clearFilters: () => void;
}

const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      page: 1,
      posts: [], // 初始化 posts 为一个空数组
      currentPost: null,
      filters: {
        searchTerm: "",
        post_type: null,
        tag: "",
        priceRange: [0, 1000000],
        campus_id: null,
      },
      setPage: () =>
        set((preState) => ({
          page: preState.page + 1,
        })),
      fetchPosts: async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/posts/search",
            {
              params: {
                page: get().page,
                limit: 12,
                keyword: get().filters.searchTerm,
                post_type: get().filters.post_type,
                tag: get().filters.tag,
                min_price: get().filters.priceRange[0],
                max_price: get().filters.priceRange[1],
                campus_id: get().filters.campus_id,
              },
            }
          );

          // 检查返回数据是否有效
          if (response.status === 200 && response.data) {
            const data = response.data.posts;
            set((state) => ({
              posts: [...data], // 更新 posts 状态
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No posts available or unexpected response status");
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
        }
      },
      fetchPost: async (id: number) => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/posts/byID/${id}`,
            {
              params: {
                post_id: id,
              },
            }
          );
          // 检查返回数据是否有效
          if (response.status === 200 && response.data) {
            const postData = response.data.post; // 访问 post 数据
            const images = response.data.images || []; // 访问 images 数据

            // 更新状态
            set({
              currentPost: { ...postData, images }, // 更新 currentPost
            });
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No posts available or unexpected response status");
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
        }
      },
      clear: () =>
        set(() => ({
          posts: [],
          page: 1,
          filters: {
            searchTerm: "",
            post_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          },
        })), // 清空所有状态，包括 posts 等
      clearPosts: () =>
        set(() => ({
          posts: [],
          page: 1,
        })), // 清空 posts 状态
      setFilters: async (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }, // 更新 filters 状态
        }));
      },
      clearFilters:()=>
        set(()=>({
          filters: {
            searchTerm: "",
            post_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          }
        })),
      updatePosts: async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/posts/search",
            {
              params: {
                page: get().page,
                limit: 12,
                keyword: get().filters.searchTerm,
                post_type: get().filters.post_type,
                tag: get().filters.tag,
                min_price: get().filters.priceRange[0],
                max_price: get().filters.priceRange[1],
                campus_id: get().filters.campus_id,
              },
            }
          );

          // 检查返回数据是否有效
          if (response.status === 200 && response.data) {
            const data = response.data.posts;
            set((state) => ({
              posts: [...state.posts, ...data], // 更新 posts 状态
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No posts available or unexpected response status");
          }
        } catch (error) {
          // 捕获请求失败的错误（如 404 或网络问题）
          if (error instanceof Error) {
            console.error("Error fetching posts:", error.message);
          } else {
            console.error("Error fetching posts:", error);
          }
        }
      },
    }),
    {
      name: "postStore",
    }
  )
);

export default usePostStore;
