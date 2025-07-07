import axios from 'axios';

// Configura a baseURL usando a variável de ambiente
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:19003/api'

// axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('psg_auth_token')}`

// Adiciona um interceptor para incluir o token de autenticação
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('psg_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
