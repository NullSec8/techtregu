import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

function readXsrfCookie() {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const xsrf = readXsrfCookie();
    if (xsrf) {
      config.headers['X-XSRF-TOKEN'] = xsrf;
    }
  }
  return config;
});
