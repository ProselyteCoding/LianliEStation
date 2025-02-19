import { create } from 'zustand';
import axios from 'axios';
import Cookies from 'js-cookie'; // 从 cookie 中获取 token

const token = Cookies.get('token'); // 获取 token

interface Response {
  id: number;
  user_id: number;
  response_type: string;
  related_id: number;
  content: string;
  read_status: string;
  created_at: string;
}

interface Appeal {
  id: number;
  author_id: number;
  post_id: number;
  content: string;
  status: string;
  created_at: string;
  image_url: string[];
}

interface MessageState {
  appeals: Appeal[];
  responses: Response[];
  fetchAppeals: () => Promise<void>; // 获取所有申诉（管理员）
  submitAppeal: (post_id: number, content: string, images: string[]) => Promise<void>; // 提交申诉
  searchAppeals: (author_id?: number, post_id?: number, status?: string) => Promise<void>; // 查询申诉
  updateAppealStatus: (appeal_id: number, status: string) => Promise<void>; // 修改申诉状态（管理员）
  deleteAppeal: (appeal_id: number) => Promise<void>; // 删除申诉（管理员）
  fetchResponses: () => Promise<void>; // 获取当前用户所有回复  
  submitResponse: (user_id: number, response_type: string, related_id: number, content: string) => Promise<void>; // 提交回复  
  markResponseAsRead: (response_id: number) => Promise<void>; // 标记回复为已读
}

const useMessageStore = create<MessageState>((set) => ({
  appeals: [],
  responses: [],
  fetchAppeals: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/appeals');
      set({ appeals: response.data }); // 更新申诉列表
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('获取申诉失败:', error.response?.data.message || '服务器错误');
      } else {
        console.error('未知错误:', error);
      }
    }
  },

  submitAppeal: async ( post_id: number, content: string, images: string[]) => {
    try {
      const response = await axios.post('http://localhost:5000/api/appeals/publish', { post_id, content, images: [] });
      console.log(response.data.message); // 申诉提交成功
      await useMessageStore.getState().fetchAppeals(); // 重新获取申诉列表
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('提交申诉失败:', error.response?.data.message || '服务器错误');
      } else {
        console.error('未知错误:', error);
      }
    }
  },

  searchAppeals: async (author_id?: number, post_id?: number, status?: string) => {
    const params: { [key: string]: any } = {};
    if (author_id) params.author_id = author_id;
    if (post_id) params.post_id = post_id;
    if (status) params.status = status;

    try {
      const response = await axios.get('http://localhost:5000/api/appeals/search', { params });
      set({ appeals: response.data }); // 更新申诉列表
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('查询申诉失败:', error.response?.data.message || '服务器错误');
      } else {
        console.error('未知错误:', error);
      }
    }
  },

  updateAppealStatus: async (appeal_id: number, status: string) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/appeals/${appeal_id}`, { status });
      console.log(response.data.message); // 状态修改成功
      await useMessageStore.getState().fetchAppeals(); // 重新获取申诉列表
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('修改申诉状态失败:', error.response?.data.message || '服务器错误');
      } else {
        console.error('未知错误:', error);
      }
    }
  },

  deleteAppeal: async (appeal_id: number) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/appeals/${appeal_id}`);
      console.log(response.data.message); // 申诉删除成功
      await useMessageStore.getState().fetchAppeals(); // 重新获取申诉列表
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('删除申诉失败:', error.response?.data.message || '服务器错误');
      } else {
        console.error('未知错误:', error);
      }
    }
  },
  fetchResponses: async () => {  
    try {  
      const response = await axios.get('http://localhost:5000/api/responses/');  
      set({ responses: response.data }); // 更新回复列表  
    } catch (error) {  
      if (axios.isAxiosError(error)) {  
        console.error('获取回复失败:', error.response?.data.message || '服务器错误');  
      } else {  
        console.error('未知错误:', error);  
      }  
    }  
  },  

  submitResponse: async (user_id: number, response_type: string, related_id: number, content: string) => {  
    try {  
      const response = await axios.post('http://localhost:5000/api/responses/', {  
        user_id,  
        response_type,  
        related_id,  
        content,  
      }, {  
        headers: {  
          Authorization: `Bearer ${token}`, // 必须添加JWT token  
        },  
      });  
      console.log(response.data.message); // 回复提交成功  
      await useMessageStore.getState().fetchResponses(); // 重新获取回复列表  
    } catch (error) {  
      if (axios.isAxiosError(error)) {  
        console.error('提交回复失败:', error.response?.data.message || '服务器错误');  
      } else {  
        console.error('未知错误:', error);  
      }  
    }  
  },  

  markResponseAsRead: async (response_id: number) => {  
    try {  
      const response = await axios.put(`http://localhost:5000/api/responses/${response_id}/read`, {}, {  
        headers: {  
          Authorization: `Bearer ${token}`, // 必须添加JWT token  
        },  
      });  
      console.log(response.data.message); // 回复标记为已读成功  
      await useMessageStore.getState().fetchResponses(); // 重新获取回复列表  
    } catch (error) {  
      if (axios.isAxiosError(error)) {  
        console.error('标记回复为已读失败:', error.response?.data.message || '服务器错误');  
      } else {  
        console.error('未知错误:', error);  
      }  
    }  
  },
}));

export default useMessageStore;
