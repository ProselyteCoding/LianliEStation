// user、auth、admin 相关的状态管理

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie"; // 使用cookie存储token
import api from "../api/index";
import { message } from "antd";
import { clearIDB } from "../utils/idbManager";
import { useRecordStore, useMainStore } from "./index";

interface RecordItem {
  targetId: number;
  targetType: string; // "goods" 或 "post"
}

interface Favorite {
  goods:{id:number}[],
  posts:{id:number}[],
}

// 一般用户
interface User {
  nickname: string;
  username: string;
  campus_id: number;
  qq_id: string;
  email: string;
  credit: number;
  theme_id: number;
  background_url: string | undefined;
  banner_url: string | undefined;
  avatar: string | undefined;
  likes: RecordItem[];
  complaints: RecordItem[];
  favorites: Favorite;
}

// 管理员获取所有用户
interface AllUsers {
  id: number;
  nickname: string;
  username: string;
  campus_id: number | undefined;
  qq_id: string | undefined;
  email: string;
  credit: number;
  theme_id: number;
  background_url: string | undefined;
  banner_url: string | undefined;
  avatar: string | undefined;
}

interface UserState {
  users?: AllUsers[]; // 管理员获取所有用户
  currentUser?: User | null; // 当前用户
  // searchedUser: QQSearchedUser | null; // 管理员通过QQ号搜索到的用户
  isAuthenticated: boolean;
  isAdmin: boolean;
  
  // ========== 新增：加载状态 ==========
  isUserLoading: boolean;
  setUserLoading: (loading: boolean) => void;

  // fetchByQQ: (qq_id: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  changeImage: (type: string, image: File) => Promise<void>;
  changeProfile: (
    nickname: string,
    campus_id: number,
    qq_id?: string,      // ✅ 改为可选参数
    theme_id?: number
  ) => Promise<void>;
  // updateCredit: (qq_id: string, credit: number) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    username: string;
  }) => Promise<void>;
  adminRegister: (adminData: {
    username: string;
    password: string;
    email: string;
  }) => Promise<void>;
  logout: () => void;
  deleteUser: (username: string) => Promise<void>;
  requestVerification: (email: string) => Promise<void>;
  changePassword: (
    email: string,
    verificationCode: string,
    newPassword: string
  ) => Promise<void>;
  updateLikesComplaints: (
    type: string,
    action: string,
    post_id: number,
    value: number
  ) => void;
  updateFavorite: (type: string, goods_id: number,value: number) => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      isAdmin: false,
      users: [],
      currentUser: null,
      // searchedUser: null,
      
      // ========== 新增：加载状态初始值 ==========
      isUserLoading: false,
      
      // ========== 新增：设置加载状态 ==========
      setUserLoading: (loading) => set({ isUserLoading: loading }),
      
      login: async (identifier: string, password: string) => {
        try {
          const res = await api.post("/api/auth/login", {
            identifier,
            password,
          });

          const token = res?.data.token;
          if (!token) {
            message.error("未获取到token，请重试");
            return;
          }

          const isAdmin = res?.data.isAdmin;
          Cookies.set("auth-token", token, { expires: 7 });
          set({ isAuthenticated: true, isAdmin });

          await get().fetchUserProfile(); // 获取当前用户信息
        } catch (error: any) {
          throw error;
        }
      },

  register: async (userData: {
    email: string;
    password: string;
    username: string;
  }) => {
    try {
      const res = await api.post("/api/auth/register", userData );
      console.log(res?.data.message); // 注册成功
    } catch (error: any) {
      throw error;
    }
  },

  // 管理员注册（后门）
  adminRegister: async (adminData: {
    username: string;
    password: string;
    email: string;
  }) => {
    try {
      const res = await api.post("/api/auth/admin/register", adminData);
      message.success(res?.data.message || "管理员注册成功");
      console.log(res?.data.message);
    } catch (error: any) {
      throw error;
    }
  },      logout: () => {
        // 清理当前 Store
        set({
          isAuthenticated: false,
          isAdmin: false,
          users: [],
          currentUser: null,
          // searchedUser: null,
        });

        // 清理其他 Store
        useRecordStore.getState().reset();
        useMainStore.getState().reset();

        // 清理 localStorage
        localStorage.removeItem("userStore");
        localStorage.removeItem("recordStore");
        localStorage.removeItem("mainStore");

        // 清理 indexedDB
        clearIDB("userImagesDB").catch(error => {
          console.error("清理 IndexedDB 失败:", error);
        });

        // 清理 Cookies
        Cookies.remove("auth-token");

        console.log("全局登出完成");
      },

      deleteUser: async (username: string) => {
        try {
          const res = await api.delete("/api/users/profile", {
            username,
          });
          console.log(res?.data.message); // 账户已删除
          Cookies.remove("auth-token"); // 删除用户时移除 cookie
          set({ isAuthenticated: false });
        } catch (error: any) {
          throw error;
        }
      },

      requestVerification: async (email: string) => {
        try {
          const res = await api.post("/api/auth/verification", {
            email,
          });
          if (res?.status === 200) {
            console.log(res.data.message); // 验证码已发送，请检查您的邮箱
          }
        } catch (error: any) {
          throw error;
        }
      },

      changePassword: async (
        email: string,
        verificationCode: string,
        newPassword: string
      ) => {
        try {
          const res = await api.put("/api/auth/change-password", {
            email,
            verificationCode,
            newPassword,
          });
          if (res?.status === 200) {
            console.log(res.data.message); // 密码修改成功
          }
        } catch (error: any) {
          throw error;
        }
      },

      // 一般用户获取自己的信息、管理员获取所有用户信息
      fetchUserProfile: async () => {
        // ========== 新增：开始加载 ==========
        set({ isUserLoading: true });
        
        try {
          console.log('🔄 fetchUserProfile: 开始请求');
          const res = await api.get("/api/users/profile");
          console.log('✅ fetchUserProfile: API响应', res?.data);
          
          const { isAdmin } = get();

          // ✅ 管理员直接返回，不需要复杂的用户信息
          if (isAdmin) {
            console.log('👑 fetchUserProfile: 管理员登录成功');
            // 管理员只需要基本信息
            set({ 
              currentUser: {
                username: res?.data.username,
                email: res?.data.email,
                nickname: res?.data.username, // 管理员用 username 作为 nickname
                campus_id: 0,
                qq_id: '',
                credit: 100,
                theme_id: 1,
                background_url: undefined,
                banner_url: undefined,
                avatar: undefined,
                likes: [],
                complaints: [],
                favorites: { posts: [], goods: [] },
              }
            });
            return;
          }

          // 一般用户获取自己的信息
          const userData = res?.data;
          
          if (userData) {
            // 提取 likes 和 complaints
            const { records, favorites, ...userInfo } = userData;
            const likes = records?.likes || [];
            const complaints = records?.complaints || [];

            console.log('📝 fetchUserProfile: 准备更新state', {
              nickname: userInfo.nickname,
              email: userInfo.email,
              qq_id: userInfo.qq_id
            });
            
            // 分别设置用户信息和记录
            set({ 
              currentUser: {
                ...userInfo,
                likes,
                complaints,
                favorites,
              }
            });
            
            console.log('✅ fetchUserProfile: state已更新', get().currentUser);
          }
        } catch (error: any) {
          console.error('❌ fetchUserProfile: 请求失败', error);
          throw error;
        } finally {
          // ========== 新增：加载完成 ==========
          set({ isUserLoading: false });
        }
      },

      // 管理员通过QQ号搜索用户
      // fetchByQQ: async (qq_id: string) => {
      //   try {
      //     const res = await api.post(
      //       '/api/users/searchByQQ',
      //        {
      //           qq_id: qq_id,
      //         },
      //     );
      //     set({ searchedUser: res?.data });
      //   } catch (error: any) {
      //     throw error;
      //   }
      // },

      // 上传用户的图片
      changeImage: async (type: string, image: File) => {
        try {
          // 验证图片类型参数
          if (!['avatar', 'background', 'banner'].includes(type)) {
            throw new Error('无效的图片类型，必须是 avatar, background 或 banner');
          }

          // 验证是否选择了图片
          if (!image) {
            throw new Error('请选择要上传的图片文件');
          }

          const formData = new FormData();
          formData.append("image", image);

          const res = await api.put(`/api/users/profile/image?type=${type}`, formData);

          if (res?.data?.url) {
            // 清除IndexedDB和localStorage中的旧缓存
            try {
              const { openDB } = await import('idb');
              const db = await openDB('userImagesDB', 1, {
                upgrade(db) {
                  if (!db.objectStoreNames.contains('images')) {
                    db.createObjectStore('images');
                  }
                },
              });
              const tx = db.transaction('images', 'readwrite');
              const store = tx.objectStore('images');
              await store.delete(type); // 删除旧缓存
              await tx.done;
              db.close();
              console.log(`已清除 IndexedDB 中的旧图片缓存: ${type}`);
            } catch (idbError) {
              console.error('清除 IndexedDB 缓存失败:', idbError);
            }

            // 清除 localStorage 中的旧缓存
            let localStorageKey = "";
            if (type === "background") {
              localStorageKey = "userBackground";
            } else if (type === "banner") {
              localStorageKey = "userBanner";
            } else if (type === "avatar") {
              localStorageKey = "userAvatar";
            }
            localStorage.removeItem(localStorageKey);

            // 重新获取用户信息，确保URL是最新的
            await get().fetchUserProfile();

            message.success(res.data.message || '图片上传成功');
            console.log('图片上传成功:', res.data);
          }
        } catch (error: any) {
          // 根据API文档处理不同的错误状态
          const errorMessage = error.response?.data?.message || error.message || '图片上传失败';
          
          switch (error.response?.status) {
            case 400:
              message.error(errorMessage);
              break;
            case 401:
              message.error('登录已过期，请重新登录');
              // 可选择性地触发登出
              break;
            case 404:
              message.error('用户不存在');
              break;
            case 500:
              message.error('服务器错误，请稍后重试');
              break;
            default:
              message.error(errorMessage);
          }
          
          console.error('图片上传失败:', error);
          throw error;
        }
      },

      // 更新用户的个人信息（图片除外）
      // 更新用户的个人信息（图片除外）
      changeProfile: async (
        nickname: string,
        campus_id: number,
        qq_id?: string,      // ✅ 改为可选参数
        theme_id?: number
      ) => {
        try {
          console.log('🔄 changeProfile: 开始更新', { nickname, campus_id, qq_id, theme_id });
          
          // ✅ 动态构建请求体，只包含提供的参数
          const requestBody: any = {
            nickname,
            campus_id,
          };

          // qq_id改为可选，只在提供时才添加
          if (qq_id !== undefined && qq_id !== null && qq_id.trim() !== '') {
            requestBody.qq_id = qq_id.trim();
          }

          if (theme_id !== undefined) {
            requestBody.theme_id = theme_id;
          }

          console.log('📤 changeProfile: 请求体', requestBody);

          const res = await api.put("/api/users/profile", requestBody);
          console.log('✅ changeProfile: API更新成功', res.data);
          
          // ✅ 关键修复：保存后端返回的新token到Cookie
          if (res.data.token) {
            console.log('🔑 changeProfile: 更新token到Cookie');
            Cookies.set('auth-token', res.data.token, { expires: 7 });
          }
          
          // 重新获取用户信息，确保数据同步
          console.log('🔄 changeProfile: 调用fetchUserProfile刷新数据');
          await get().fetchUserProfile();
          console.log('✅ changeProfile: 数据刷新完成');
          
          message.success(res.data.message || '个人信息更新成功');
          console.log(res.data);
        } catch (error: any) {
          console.error('❌ changeProfile: 更新失败', error);
          message.error(error.response?.data?.message || '更新失败');
          throw error;
        }
      },

      updateLikesComplaints: (
        type: string,
        action: string,
        post_id: number,
        value: number
      ) => {
        const currentUser = get().currentUser;
        if (currentUser) {
          if (value === 1) {
            if (action === "like") {
              const likes = currentUser.likes;
              likes.push({ targetId: post_id, targetType: type });
              set(
                (state: UserState) =>
                  ({
                    currentUser: {
                      ...state.currentUser,
                      likes,
                    },
                  } as Partial<UserState>)
              );
            }
            else {
              const complaints = currentUser.complaints;
              complaints.push({ targetId: post_id, targetType: type });
              set(
                (state: UserState) =>
                  ({
                    currentUser: {
                      ...state.currentUser,
                      complaints,
                    },
                  } as Partial<UserState>)
              );
            }
          } else {
            if (action === "like") {
              const likes = currentUser.likes.filter(
                (item) => item.targetId !== post_id || item.targetType !== type
              );
              set(
                (state: UserState) =>
                  ({
                    currentUser: {
                      ...state.currentUser,
                      likes,
                    },
                  } as Partial<UserState>)
              );
            } else {
              const complaints = currentUser.complaints.filter(
                (item) => item.targetId !== post_id || item.targetType !== type
              );
              set(
                (state: UserState) =>
                  ({
                    currentUser: {
                      ...state.currentUser,
                      complaints,
                    },
                  } as Partial<UserState>)
              );
            }
          }
        }
      },
      updateFavorite: (type: string, goods_id: number,value: number) => {
        const currentUser = get().currentUser;
        if (currentUser) {
          if (value === 1) {
            const favorites = currentUser.favorites;
            if (type === "goods") {
              favorites.goods.push({ id: goods_id });
            } else if (type === "post") {
              favorites.posts.push({ id: goods_id });
            }
            set(
              (state: UserState) =>
                ({
                  currentUser: {
                    ...state.currentUser,
                    favorites,
                  },
                } as Partial<UserState>)
            );
          }
          else { 
            const favorites = currentUser.favorites;
            if (type === "goods") {
              favorites.goods = favorites.goods.filter((item) => item.id !== goods_id);
            } else if (type === "post") {
              favorites.posts = favorites.posts.filter((item) => item.id !== goods_id);
            }
            set(
              (state: UserState) =>
                ({
                  currentUser: {
                    ...state.currentUser,
                    favorites,
                  },
                } as Partial<UserState>)
            );
          }
        }
      },

      // // 管理员更新用户信誉分
      // updateCredit: async (qq_id: string, credit: number) => {
      //   try {
      //     const res = await api.put(
      //       '/api/users/searchByQQ',{

      //           qq_id: qq_id,
      //           credit: credit,
      //         }
      //
      //     );
      //     set(
      //       (state: UserState) =>
      //         ({
      //           currentUser: {
      //             ...state.currentUser,
      //             credit: credit,
      //           },
      //         } as Partial<UserState>)
      //     );
      //     console.log(res?.data);
      //   } catch (error: any) {
      //     throw error;
      //   }
      // },
    }),
    {
      name: "userStore",
      // 只持久化必要的状态，currentUser和users每次从服务器获取最新数据
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        // currentUser、users不持久化，避免使用过期数据
      }),
    }
  )
);

export default useUserStore;
