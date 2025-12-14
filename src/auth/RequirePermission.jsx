import React from "react";
import { Alert } from "antd";
import { useAuth } from "./AuthContext";

/**
 * Bạn cần map quyền từ "me" (member_group/roles/scopes) theo backend.
 * Tạm thời: admin nếu me?.member_group === 2 (ví dụ), hoặc me?.is_admin === true.
 */
function isAdmin(me) {
    return !!(me?.is_admin || me?.member_group === 6 || me?.role === "admin");
}

export default function RequirePermission({ children, allow = "admin" }) {
    const { me } = useAuth();

    if (allow === "admin" && !isAdmin(me)) {
        return <Alert type="error" message="Bạn không có quyền truy cập chức năng này." showIcon />;
    }

    return children;
}
