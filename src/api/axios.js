import axios from "axios";
import { notifySessionExpired } from "../utils/authEvents";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API = axios.create({
  baseURL: API_BASE_URL
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// The backend answers 401 only when the login token is missing, expired or invalid,
// so a 401 on a request that sent a token means the session is over: log out.
API.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && error.config?.headers?.Authorization) {
      notifySessionExpired();
    }
    return Promise.reject(error);
  }
);

export default API;
