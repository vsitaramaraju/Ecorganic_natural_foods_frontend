import axios from "axios";

const API = axios.create({
  baseURL: "http://200.141.1.171:5000/api"
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
