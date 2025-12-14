import React, { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Space, Table, message, Tag } from "antd";
import moment from "moment";
import { axiosClient } from "../api/axiosClient";

export default function Blacklist() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get("/blacklists", { params: { per_page: 100, active: 0 } });
            // nếu backend trả paginate trực tiếp
            const items =
                res?.data?.data?.data ??
                res?.data?.data ??
                res?.data?.data?.data ??
                res?.data?.data ??
                res?.data?.data?.data ??
                res?.data?.data;

            setRows(Array.isArray(items) ? items : (res?.data?.data?.data ?? []));
        } catch (e) {
            message.error(e?.response?.data?.message || "Không tải được blacklist");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const createItem = async (values) => {
        try {
            const payload = {
                user_id: Number(values.user_id),
                reason: values.reason || null,
                blocked_from: values.blocked_from ? moment(values.blocked_from).format("YYYY-MM-DD HH:mm:ss") : null,
                blocked_until: values.blocked_until ? moment(values.blocked_until).format("YYYY-MM-DD HH:mm:ss") : null,
            };

            await axiosClient.post("/blacklists", payload);
            message.success("Đã thêm blacklist");
            setOpen(false);
            form.resetFields();
            fetchData();
        } catch (e) {
            message.error(e?.response?.data?.message || "Thêm blacklist thất bại");
        }
    };

    const removeItem = async (id) => {
        try {
            await axiosClient.delete(`/blacklists/${id}`);
            message.success("Đã gỡ blacklist");
            fetchData();
        } catch (e) {
            message.error(e?.response?.data?.message || "Gỡ blacklist thất bại");
        }
    };

    const isActive = (r) => {
        const now = moment();
        const from = r.blocked_from ? moment(r.blocked_from) : null;
        const until = r.blocked_until ? moment(r.blocked_until) : null;
        const okFrom = !from || !now.isBefore(from);
        const okUntil = !until || !now.isAfter(until);
        return okFrom && okUntil;
    };

    const columns = [
        { title: "ID", dataIndex: "id", width: 80 },
        {
            title: "Sinh viên",
            key: "user",
            render: (_, r) => {
                const u = r.user;
                if (!u) return `user_id=${r.user_id}`;
                return (
                    <div>
                        <div><b>{u.username}</b> — {(u.last_name || "") + " " + (u.first_name || "")}</div>
                        <div style={{ opacity: 0.7 }}>{u.class || u.first_class || ""}</div>
                    </div>
                );
            },
        },
        { title: "Lý do", dataIndex: "reason" },
        { title: "Từ", dataIndex: "blocked_from", width: 170 },
        { title: "Đến", dataIndex: "blocked_until", width: 170 },
        {
            title: "Trạng thái",
            key: "active",
            width: 120,
            render: (_, r) => (isActive(r) ? <Tag color="red">Đang chặn</Tag> : <Tag>Hết hiệu lực</Tag>),
        },
        {
            title: "Thao tác",
            key: "actions",
            width: 140,
            render: (_, r) => (
                <Space>
                    <Button danger size="small" onClick={() => removeItem(r.id)}>
                        Gỡ
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 16 }}>
            <Space style={{ marginBottom: 12 }}>
                <Button type="primary" onClick={() => setOpen(true)}>Thêm blacklist</Button>
                <Button onClick={fetchData}>Reload</Button>
            </Space>

            <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 50 }} />

            <Modal
                title="Thêm blacklist"
                open={open}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText="Thêm"
            >
                <Form form={form} layout="vertical" onFinish={createItem}>
                    <Form.Item name="user_id" label="User ID" rules={[{ required: true, message: "Nhập user_id" }]}>
                        <Input placeholder="VD: 123" />
                    </Form.Item>

                    <Form.Item name="reason" label="Lý do">
                        <Input.TextArea rows={3} placeholder="VD: Vi phạm nội quy / spam đăng ký..." />
                    </Form.Item>

                    <Form.Item name="blocked_from" label="Chặn từ">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name="blocked_until" label="Chặn đến">
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
