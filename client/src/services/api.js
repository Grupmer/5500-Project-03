import axios from 'axios';

// 获取环境变量中设置的后端 API 基础 URL
// Vite 会在构建时将 import.meta.env.VITE_API_BASE_URL 替换为你在 .env 文件或 Render 环境变量中设置的实际值
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

const api = axios.create({
  baseURL: API_BASE_URL, // <-- 修改这里，使用环境变量获取的后端基础 URL
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const donorApi = {
  // 获取所有捐赠者
  // 这里依然使用 '/donor' 相对路径，axios 会自动把它加在 baseURL 后面
  getAllDonors: () => api.get('/api/donor'), // 注意这里需要加上 /api 前缀，因为后端路由是 /api/donor
  
  // 获取单个捐赠者详情
  getDonorById: (id) => api.get(`/api/donor/${id}`), // 同上，加上 /api
  
  // 创建捐赠者
  createDonor: (data) => api.post('/api/donor', data), // 加上 /api
  
  // 更新捐赠者
  updateDonor: (id, data) => api.put(`/api/donor/${id}`, data), // 加上 /api
  
  // 删除捐赠者
  deleteDonor: (id) => api.delete(`/api/donor/${id}`), // 加上 /api
  
  // 推荐捐赠者
  getRecommendedDonors: () => api.get('/api/donor/recommend') // 加上 /api
};

export const tagApi = {
  // 获取所有标签
  getAllTags: () => api.get('/api/tag'), // 加上 /api
  
  // 创建标签
  createTag: (data) => api.post('/api/tag', data), // 加上 /api
  
  // 更新标签
  updateTag: (id, data) => api.patch(`/api/tag/${id}`, data), // 加上 /api
  
  // 删除标签
  deleteTag: (id) => api.delete(`/api/tag/${id}`) // 加上 /api
};

// 你可能还有其他 API 模块或直接使用 api 实例的地方，都需要检查并加上 /api 前缀
// 例如：api.post('/api/auth/login', ...)


export default api; // 通常还是会导出这个实例，以防其他地方直接使用
