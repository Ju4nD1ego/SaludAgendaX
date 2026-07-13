import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const refresh = localStorage.getItem('refresh');

    if (response?.status === 401 && !config._retry && refresh) {
      config._retry = true;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh });
        localStorage.setItem('access', data.access);
        config.headers.Authorization = `Bearer ${data.access}`;
        return api(config);
      } catch (refreshError) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
