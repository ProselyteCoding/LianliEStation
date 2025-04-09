// 商品与帖子的状态管理

import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface Goods {
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
  likes: number;
  complaints: number;
}

interface Filters {
  searchTerm: string | null;
  priceRange: [number, number];
  tag: string | null;
  goods_type: "receive" | "sell"|null;
  campus_id: number|null;
}

interface MainState {
  page: number;
  goods: Goods[];
  currentGoods: Goods | null;
  filters: Filters;
  clear: () => void;
  fetchGoods: () => Promise<void>;
  fetchGoodsItem: (id: number) => Promise<void>;
  setFilters: (newFilters: Partial<Filters>) => void;
  updateGoods: () => Promise<void>;
  setPage: () => void;
  clearGoods: () => void;
  clearFilters: () => void;
}

const useMainStore = create<MainState>()(
  persist(
    (set, get) => ({
      page: 1,
      goods: [], // 初始化 goods 为一个空数组
      currentGoods: null,
      filters: {
        searchTerm: "",
        goods_type: null,
        tag: "",
        priceRange: [0, 1000000],
        campus_id: null,
      },
      setPage: () =>
        set((preState) => ({
          page: preState.page + 1,
        })),
      fetchGoods: async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/posts/search",
            {
              params: {
                page: get().page,
                limit: 12,
                keyword: get().filters.searchTerm,
                goods_type: get().filters.goods_type,
                tag: get().filters.tag,
                min_price: get().filters.priceRange[0],
                max_price: get().filters.priceRange[1],
                campus_id: get().filters.campus_id,
              },
            }
          );

          // 检查返回数据是否有效
          if (response.status === 200 && response.data) {
            const data = response.data.goods;
            set((state) => ({
              goods: [...data], // 更新 goods 状态
            }));
          } else {
            // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
            console.log("No goods available or unexpected response status");
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
      fetchGoodsItem: async (id: number) => {
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
              currentGoods: { ...postData, images }, // 更新 currentPost
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
          goods: [],
          page: 1,
          filters: {
            searchTerm: "",
            goods_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          },
        })), // 清空所有状态，包括 posts 等
      clearGoods: () =>
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
            goods_type: null,
            tag: null,
            priceRange: [0, 1000000],
            campus_id: null,
          }
        })),
      updateGoods: async () => {
        try {
          const response = await axios.get(
            "http://localhost:5000/api/posts/search",
            {
              params: {
                page: get().page,
                limit: 12,
                keyword: get().filters.searchTerm,
                post_type: get().filters.goods_type,
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
              goods: [...state.goods, ...data], // 更新 posts 状态
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
      name: "mainStore",
    }
  )
);

export default useMainStore;
