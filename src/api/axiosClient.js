import axios from "axios";

export const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

axiosClient.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("me");
            // ✅ login route của bạn là /quanly (không phải /login)
            if (!window.location.pathname.startsWith("/quanly")) {
                window.location.href = "/quanly";
            } else {
                window.location.href = "/quanly";
            }
        }
        return Promise.reject(err);
    }
);
