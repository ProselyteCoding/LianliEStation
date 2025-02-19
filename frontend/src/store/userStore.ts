// src/store/userStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import Cookies from "js-cookie"; // 使用cookie存储token

// 获取token
const token = Cookies.get("auth-token");

// 一般用户
interface User {
  nickname: string;
  email: string;
  username: string;
  campus_id: number;
  qq: string;
  credit: number;
}

// 管理员通过QQ号搜索到的用户
interface QQSearchedUser {
  id: number;
  nickname: string;
  email: string;
  qq_id: string;
  username: string;
  credit: number;
  campus_id: number;
}

interface IDSearchedUser {
  nickname: string;
  qq: string;
  credit: number;
  avatar: string;
}

// 用户的主题信息
interface UserTheme {
  theme_id: number;
  background_url: File | undefined;
  banner_url: File | undefined;
  avatar: File | undefined;
}

interface UserState {
  users: QQSearchedUser[]; // 管理员测试所有用户
  currentUser: User | null; // 当前用户
  detailUser: IDSearchedUser | null; // 详情页对应的发布者
  searchedUser: QQSearchedUser | null; // 管理员通过QQ号搜索到的用户
  userTheme: UserTheme; // 用户的主题信息
  fetchUsers: () => Promise<void>;
  fetchByQQ: (qq: string) => Promise<void>;
  fetchByID: (id: number) => Promise<void>;
  getTheme: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  changeTheme: (theme_id: number) => Promise<void>;
  changeBackground: (background: File) => Promise<void>;
  changeBanner: (banner: File) => Promise<void>;
  changeAvatar: (avatar: File) => Promise<void>;
  changeProfile: (
    nickname: string,
    campus_id: number,
    qq_id: string
  ) => Promise<void>;
  updateCredit: (qq_id: string, credit: number) => Promise<void>;
}

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      users: [],
      currentUser: null,
      detailUser: null,
      searchedUser: null,
      userTheme: {
        theme_id: 1,
        background_url: undefined,
        banner_url: undefined,
        avatar: undefined,
      },
      // 管理员获取所有用户信息
      fetchUsers: async () => {
        try {
          const res = await axios.get("http://localhost:5000/api/users/");
          set({ users: res.data });
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 用户获取自己的信息
      fetchUserProfile: async () => {
        try {
          const res = await axios.get(
            "http://localhost:5000/api/users/profile",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set({ currentUser: res.data });
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 管理员通过QQ号搜索用户
      fetchByQQ: async (qq: string) => {
        try {
          const res = await axios.post(
            "http://localhost:5000/api/users/searchByQQ",
            {
              params: {
                qq_id: qq,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set({ searchedUser: res.data });
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 通过ID搜索用户（用于详情页）
      fetchByID: async (id: number) => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/users/userInfo/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set({ detailUser: res.data });
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 获取用户的所有主题信息
      getTheme: async () => {
        try {
          const res = await axios.get(
            "http://localhost:5000/api/users/get-theme",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set({ userTheme: res.data });
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 更换用户的主题编号
      changeTheme: async (theme_id: number) => {
        try {
          const res = await axios.put(
            "http://localhost:5000/api/users/change-theme",
            {},
            {
              params: {
                theme_id: theme_id,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set((state) => ({
            userTheme: {
              ...state.userTheme, // 保持其他属性不变
              theme_id: theme_id, // 更新 theme_id 属性
            },
          }));
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 更新用户的发布背景
      changeBackground: async (background: File) => {
        try {
          const formData = new FormData();
          formData.append("image", background); // 修改为 image

          const res = await axios.put(
            "http://localhost:5000/api/users/change-background",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set((state) => ({
            userTheme: {
              ...state.userTheme, // 保持其他属性不变
              background_url: res.data.background_url, // 更新 background_url 属性
            },
          }));
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },

      // 更新用户的 banner
      changeBanner: async (banner: File) => {
        try {
          const formData = new FormData();
          formData.append("image", banner); // 修改为 image

          const res = await axios.put(
            "http://localhost:5000/api/users/change-banner",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set((state) => ({
            userTheme: {
              ...state.userTheme, // 保持其他属性不变
              banner_url: res.data.banner_url, // 更新 banner_url 属性
            },
          }));
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 更新用户的头像
      changeAvatar: async (avatar: File) => {
        try {
          const formData = new FormData();
          formData.append("image", avatar); // 修改为 image

          const res = await axios.put(
            "http://localhost:5000/api/users/change-avatar",
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set((state) => ({
            userTheme: {
              ...state.userTheme, // 保持其他属性不变
              avatar: res.data.avatar, // 更新 avatar 属性
            },
          }));
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },

      // 更新用户的个人信息
      changeProfile: async (
        nickname: string,
        campus_id: number,
        qq_id: string
      ) => {
        console.log(token);
        try {
          const res = await axios.put(
            "http://localhost:5000/api/users/profile",
            {
              nickname: nickname,
              campus_id: campus_id,
              qq_id: qq_id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set(
            (state: UserState) =>
              ({
                currentUser: {
                  ...state.currentUser,
                  nickname: nickname,
                  campus_id: campus_id,
                  qq_id: qq_id,
                },
              } as Partial<UserState>)
          );
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
      // 管理员更新用户信誉分
      updateCredit: async (qq_id: string, credit: number) => {
        try {
          const res = await axios.put(
            "http://localhost:5000/api/users/searchByQQ",
            {
              params: {
                qq_id: qq_id,
                credit: credit,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          set(
            (state: UserState) =>
              ({
                currentUser: {
                  ...state.currentUser,
                  credit: credit,
                },
              } as Partial<UserState>)
          );
          console.log(res.data);
        } catch (error: any) {
          if (error.response) console.error(error.response.data.message);
        }
      },
    }),
    {
      name: "user-storage",
    }
  )
);

export default useUserStore;
