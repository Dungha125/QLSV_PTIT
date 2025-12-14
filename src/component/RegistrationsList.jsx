import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Space, Table, message, Tooltip } from "antd";
import { axiosClient } from "../api/axiosClient";
import RegistrationStatusTag from "./RegistrationStatusTag";
import { useAuth } from "../auth/AuthContext";

function isAdmin(me) {
    return !!(me?.is_admin || me?.member_group === 6 || me?.role === "admin");
}

export default function RegistrationsList({ eventId }) {
    const { me } = useAuth();
    const admin = useMemo(() => isAdmin(me), [me]);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { per_page: 200 };
            if (statusFilter !== null) params.status = statusFilter;

            const res = await axiosClient.get(`/events/${eventId}/registrations`, { params });

            // backend paginate JSON: {data:[...], ...} hoặc {code,...}
            const data = res?.data?.data?.data ?? res?.data?.data ?? res?.data?.data;
            const list = Array.isArray(data) ? data : (res?.data?.data?.data ?? res?.data?.data ?? res?.data?.data ?? res?.data?.data);

            // Trường hợp laravel paginate trả {data:[...]}
            const finalList = res?.data?.data?.data
                ? res.data.data.data
                : res?.data?.data?.data // hiếm
                    ? res.data.data.data
                    : res?.data?.data?.data
                        ? res.data.data.data
                        : res?.data?.data?.data;

            const safeList = res?.data?.data?.data
                ? res.data.data.data
                : res?.data?.data
                    ? res.data.data
                    : res?.data?.data
                        ? res.data.data
                        : res?.data?.data;

            // Làm gọn: ưu tiên paginate chuẩn laravel: res.data.data
            const laravelList = res?.data?.data?.data ? res.data.data.data : res?.data?.data?.data;

            const items = res?.data?.data?.data
                ? res.data.data.data
                : res?.data?.data
                    ? res.data.data
                    : res?.data?.data; // fallback

            setRows(Array.isArray(items) ? items : (res?.data?.data?.data?.data ?? []));
        } catch (e) {
            message.error(e?.response?.data?.message || "Không tải được danh sách đăng ký");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!eventId) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, statusFilter]);

    const doCheckin = async (userId) => {
        try {
            await axiosClient.post(`/events/${eventId}/checkin`, { user_id: userId });
            message.success("Đã điểm danh");
            fetchData();
        } catch (e) {
            message.error(e?.response?.data?.message || "Điểm danh thất bại");
        }
    };

    const doConfirm = async (userId) => {
        try {
            await axiosClient.post(`/events/${eventId}/confirm-attendance`, { user_id: userId });
            message.success("Đã xác nhận tham dự");
            fetchData();
        } catch (e) {
            message.error(e?.response?.data?.message || "Xác nhận thất bại");
        }
    };

    const filteredRows = useMemo(() => {
        const kw = q.trim().toLowerCase();
        if (!kw) return rows;
        return rows.filter((r) => {
            const name = `${r.last_name ?? ""} ${r.first_name ?? ""}`.toLowerCase();
            const username = (r.username ?? "").toLowerCase();
            const cls = (r.class ?? r.first_class ?? "").toLowerCase();
            return name.includes(kw) || username.includes(kw) || cls.includes(kw);
        });
    }, [rows, q]);

    const columns = [
        { title: "Mã SV", dataIndex: "username", key: "username", width: 120 },
        {
            title: "Họ tên",
            key: "name",
            render: (_, r) => `${r.last_name ?? ""} ${r.first_name ?? ""}`.trim(),
        },
        { title: "Lớp", key: "class", render: (_, r) => r.class ?? r.first_class ?? "" },
        {
            title: "Trạng thái",
            key: "status",
            render: (_, r) => <RegistrationStatusTag status={r.pivot?.status ?? r.status} />,
            width: 170,
        },
        {
            title: "Đăng ký lúc",
            key: "registered_at",
            render: (_, r) => r.pivot?.registered_at ?? r.registered_at ?? "",
            width: 180,
        },
    ];

    if (admin) {
        columns.push({
            title: "Thao tác",
            key: "actions",
            width: 220,
            render: (_, r) => {
                const userId = r.id;
                const status = Number(r.pivot?.status ?? r.status);
                const disabledCancelled = status === 3;

                return (
                    <Space>
                        <Tooltip title={disabledCancelled ? "User đã huỷ đăng ký" : "Điểm danh"}>
                            <Button
                                size="small"
                                disabled={disabledCancelled}
                                onClick={() => doCheckin(userId)}
                            >
                                Điểm danh
                            </Button>
                        </Tooltip>
                        <Tooltip title={disabledCancelled ? "User đã huỷ đăng ký" : "Xác nhận tham dự"}>
                            <Button
                                size="small"
                                type="primary"
                                disabled={disabledCancelled}
                                onClick={() => doConfirm(userId)}
                            >
                                Xác nhận
                            </Button>
                        </Tooltip>
                    </Space>
                );
            },
        });
    }

    return (
        <div>
            <Space style={{ marginBottom: 12 }} wrap>
                <Input
                    placeholder="Tìm mã SV / họ tên / lớp"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    style={{ width: 280 }}
                />
                <Button onClick={() => setStatusFilter(null)}>Tất cả</Button>
                <Button onClick={() => setStatusFilter(0)}>Đã đăng ký</Button>
                <Button onClick={() => setStatusFilter(1)}>Đã điểm danh</Button>
                <Button onClick={() => setStatusFilter(2)}>Đã xác nhận</Button>
                <Button danger onClick={() => setStatusFilter(3)}>Đã huỷ</Button>
                <Button onClick={fetchData}>Reload</Button>
            </Space>

            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={filteredRows}
                pagination={{ pageSize: 50 }}
            />
        </div>
    );
}
