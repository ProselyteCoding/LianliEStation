import {create} from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import axios from "axios";

interface Post {
    id: number;
    title: string;
    content: string | null;
    post_type: 'receive' | 'sell';
    tag: string | null;
    author_id: number;
    created_at: string;
    status: 'active' | 'inactive' | 'deleted';
    price: number;
    campus_id: number;
    images:string[];
  }


interface HistoryStoreState{
    posts:Post[];
    getPosts:()=> Promise<void>;
    removePost:(id:number)=>void;
    setPage:()=>void;
    page:number;
    clear:()=>void;
}

const token=Cookies.get("auth-token")


const useHistoryStore=create<HistoryStoreState>()(

    persist(
        (set,get)=>({
            posts:[],
            page:1,
            setPage: () => set((preState)=>({
                page: preState.page + 1
              })),
              clear:()=>set(()=>({
                posts:[]
              })),
            getPosts:async ()=>{
                try {
                    const response = await axios.get('http://localhost:5000/api/posts/user-history', {
                      params: {
                        page:get().page,
                        limit:12
                      },
                      headers:{
                        Authorization:`Bearer ${token}`
                      }
                    });
                    
                    // 检查返回数据是否有效
                    if (response.status === 200 && response.data) {
                      const data = response.data.posts;
                      set((state) => ({
                        posts: [...state.posts, ...data], // 更新 posts 状态
                      }));
                    } else {
                      // 如果没有数据或者返回了非 200 状态码，可以添加逻辑处理
                      console.log('No posts available or unexpected response status');
                    }
                  } catch (error) {
                    // 捕获请求失败的错误（如 404 或网络问题）
                    if (error instanceof Error) {
                      console.error('Error fetching posts:', error.message);
                    } else {
                      console.error('Error fetching posts:', error);
                    }
                  }
            },

            removePost:(id)=>{
                axios.delete(`http://localhost:5000/api/posts/${id}`,
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                })

            }
        }),
        ({
            name:"historyStore"
        })
    )
) 

export default useHistoryStore