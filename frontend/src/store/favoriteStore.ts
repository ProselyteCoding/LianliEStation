import { create } from "zustand";
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
  interface FavoriteStoreState {
    posts: Post[];
    getPosts: () => Promise<void>;
    addPost: (post: Post) => void;
    removePost: (postId: number) => void;
  }

  const token = Cookies.get("auth-token");

  const useFavoriteStore = create<FavoriteStoreState>()(
    persist(
        (set, get) => ({
            posts: [],
            getPosts: async () => {
                const { data } = await axios.get<Post[]>(
                    "http://localhost:5000/api/favorites/user/favorites",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                set({ posts: data });
            },
            addPost: (post) => {
                axios.post("http://localhost:5000/api/favorites/add",post.id,{
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            },
            
            removePost: (postId: number) => {
                axios.post("http://localhost:5000/api/favorites/add",postId,{
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            },
        }),
        {
            name: "favoriteStore",
        }
    )
);

export default useFavoriteStore;