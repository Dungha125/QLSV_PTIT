import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { axiosClient } from "../api/axiosClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [me, setMe] = useState(() => {
        const raw = localStorage.getItem("me");
        return raw ? JSON.parse(raw) : null;
    });
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("authToken");

    useEffect(() => {
        if (!token) return;

        // Nếu bạn đã có endpoint profile/me thì thay đúng URL ở đây.
        // Ví dụ thường gặp: /auth/me hoặc /users/me hoặc /auth/profile
        const fetchMe = async () => {
            setLoading(true);
            try {
                const res = await axiosClient.get("/auth/profile");
                // nếu backend bạn trả {code,message,data}:
                const data = res?.data?.data ?? res?.data;
                setMe(data);
                localStorage.setItem("me", JSON.stringify(data));
            } catch (e) {
                // axios interceptor sẽ xử lý 401
            } finally {
                setLoading(false);
            }
        };

        // Nếu đã có me cached thì vẫn fetch lại 1 lần để sync quyền
        fetchMe();
    }, [token]);

    const value = useMemo(() => ({ me, setMe, loading, token }), [me, loading, token]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
