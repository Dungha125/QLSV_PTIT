import React from "react";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }) {
    const { token, loading } = useAuth();

    if (loading) return <div style={{ padding: 24 }}><Spin /></div>;
    if (!token) return <Navigate to="/quanly" replace />;

    return children;
}
