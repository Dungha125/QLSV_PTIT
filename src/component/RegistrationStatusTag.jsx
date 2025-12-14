import React from "react";
import { Tag } from "antd";

export default function RegistrationStatusTag({ status }) {
    const s = Number(status);

    if (s === 0) return <Tag>Đã đăng ký</Tag>;
    if (s === 1) return <Tag color="blue">Đã điểm danh</Tag>;
    if (s === 2) return <Tag color="green">Đã xác nhận tham dự</Tag>;
    if (s === 3) return <Tag color="red">Đã huỷ</Tag>;
    return <Tag>Không rõ</Tag>;
}
