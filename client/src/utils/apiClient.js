import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthToken = () => {
  return localStorage.getItem('token'); 
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器：自动加上 Authorization 头
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
