import React, { useEffect, useState } from "react";
import { axiosClient } from "../../api/axiosClient";

const AddEvent = ({ onAddEvent, onClose }) => {
    const [eventName, setEventName] = useState("");
    const [eventStart, setEventStart] = useState("");
    const [eventFinish, setEventFinish] = useState("");
    const [eventOrganization, setEventOrganization] = useState("");
    const [eventAddress, setEventAddress] = useState("");
    const [eventSemester, setEventSemester] = useState("");
    const [eventDescription, setEventDescription] = useState("");

    // 🔹 Cấu hình đăng ký
    const [registerStart, setRegisterStart] = useState("");
    const [registerEnd, setRegisterEnd] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [registrationVisibility, setRegistrationVisibility] = useState(0);

    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ show: false, type: "", text: "" });

    // ===== Helpers =====
    const showPopup = (type, text) => {
        setPopup({ show: true, type, text });
        setTimeout(() => setPopup({ show: false, type: "", text: "" }), 3000);
    };

    const formatDateTime = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
        ).padStart(2, "0")}:00`;
    };

    // ===== Fetch semesters =====
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await axiosClient.get("/semesters");
                setSemesters(res?.data?.data ?? []);
            } catch (e) {
                console.error(e);
                showPopup("error", "Không thể tải danh sách học kỳ.");
            }
        };
        fetchSemesters();
    }, []);

    // ===== Submit =====
    const handleCreateEvent = async (e) => {
        e.preventDefault();

        // Basic validate
        if (
            !eventName ||
            !eventStart ||
            !eventFinish ||
            !eventOrganization ||
            !eventAddress ||
            !eventSemester
        ) {
            showPopup("error", "Vui lòng điền đầy đủ thông tin bắt buộc!");
            return;
        }

        if (new Date(eventFinish) <= new Date(eventStart)) {
            showPopup("error", "Thời gian kết thúc phải sau thời gian bắt đầu!");
            return;
        }

        // Validate đăng ký
        if (registerStart && registerEnd && new Date(registerEnd) <= new Date(registerStart)) {
            showPopup("error", "Thời gian đóng đăng ký phải sau thời gian mở đăng ký!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: eventName,
                organization: eventOrganization,
                description: eventDescription,
                address: eventAddress,
                semester_id: Number(eventSemester),
                start_at: formatDateTime(eventStart),
                finish_at: formatDateTime(eventFinish),

                // 🔹 registration config
                register_start_at: formatDateTime(registerStart),
                register_end_at: formatDateTime(registerEnd),
                max_participants: maxParticipants ? Number(maxParticipants) : null,
                registration_visibility: Number(registrationVisibility),
            };

            await axiosClient.post("/events", payload);

            showPopup("success", "Sự kiện đã được tạo thành công!");
            if (onAddEvent) onAddEvent();

            setTimeout(() => {
                if (onClose) onClose();
            }, 1200);
        } catch (error) {
            console.error(error);
            showPopup(
                "error",
                error?.response?.data?.message || "Lỗi khi tạo sự kiện!"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        showPopup("error", "Đã huỷ tạo sự kiện!");
        setTimeout(() => {
            if (onClose) onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[90vh]">
                <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">
                    Thêm Sự Kiện
                </h2>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Tên sự kiện"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <input
                        type="text"
                        placeholder="Đơn vị tổ chức"
                        value={eventOrganization}
                        onChange={(e) => setEventOrganization(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <input
                        type="text"
                        placeholder="Địa điểm"
                        value={eventAddress}
                        onChange={(e) => setEventAddress(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <select
                        value={eventSemester}
                        onChange={(e) => setEventSemester(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="">Chọn học kỳ</option>
                        {semesters.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    <input
                        type="datetime-local"
                        value={eventStart}
                        onChange={(e) => setEventStart(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <input
                        type="datetime-local"
                        value={eventFinish}
                        onChange={(e) => setEventFinish(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <textarea
                        placeholder="Mô tả sự kiện"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    {/* ===== Cấu hình đăng ký ===== */}
                    <hr />
                    <h3 className="font-semibold">Cấu hình đăng ký</h3>

                    <input
                        type="datetime-local"
                        value={registerStart}
                        onChange={(e) => setRegisterStart(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Mở đăng ký"
                    />

                    <input
                        type="datetime-local"
                        value={registerEnd}
                        onChange={(e) => setRegisterEnd(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                        placeholder="Đóng đăng ký"
                    />

                    <input
                        type="number"
                        min={1}
                        placeholder="Số lượng tối đa (để trống = không giới hạn)"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    />

                    <select
                        value={registrationVisibility}
                        onChange={(e) => setRegistrationVisibility(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value={0}>Chỉ quản trị xem danh sách</option>
                        <option value={1}>Công khai</option>
                        <option value={2}>Chỉ người đã đăng ký</option>
                    </select>

                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-500 text-white rounded"
                        >
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded"
                        >
                            {loading ? "Đang tạo..." : "Tạo sự kiện"}
                        </button>
                    </div>
                </form>
            </div>

            {popup.show && (
                <div
                    className={`fixed top-10 right-10 p-4 rounded shadow-md text-white ${
                        popup.type === "success" ? "bg-green-500" : "bg-red-500"
                    }`}
                >
                    {popup.text}
                </div>
            )}
        </div>
    );
};

export default AddEvent;
