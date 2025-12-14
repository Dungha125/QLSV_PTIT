import React, { useEffect, useMemo, useState } from "react";
import { axiosClient } from "../../api/axiosClient";

const sanitizeAlphaSpaces = (text) => {
  return (text || "").replace(
      /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỄỬỮỰÝỶỸ\s0-9,;.!?(){}[\]'"-/_@#&*^%~`]/g,
      ""
  );
};

// "2025-12-14 10:30:00" -> "2025-12-14T10:30"
const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  // nếu đã là ISO "2025-12-14T10:30"
  if (String(value).includes("T")) return String(value).slice(0, 16);
  // dạng "YYYY-MM-DD HH:mm:ss"
  return String(value).replace(" ", "T").slice(0, 16);
};

const formatDateTime = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  const d = new Date(dateTimeLocal);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:00`;
};

const EditEventForm = ({ event, onClose }) => {
  const [formData, setFormData] = useState(() => ({
    name: event?.name ?? "",
    start_at: toDatetimeLocalValue(event?.start_at),
    finish_at: toDatetimeLocalValue(event?.finish_at),
    organization: event?.organization ?? "",
    description: event?.description ?? "",
    address: event?.address ?? "",
    semester_id: event?.semester_id ?? "",

    // 🔹 cấu hình đăng ký
    register_start_at: toDatetimeLocalValue(event?.register_start_at),
    register_end_at: toDatetimeLocalValue(event?.register_end_at),
    max_participants: event?.max_participants ?? "",
    registration_visibility: event?.registration_visibility ?? 0,
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [semesters, setSemesters] = useState([]);

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axiosClient.get("/semesters");
        setSemesters(res?.data?.data ?? []);
      } catch (e) {
        console.error("Error fetching semesters:", e);
      }
    };
    fetchSemesters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // sanitize vài field text
    const sanitized =
        name === "name" || name === "organization" || name === "description" || name === "address"
            ? sanitizeAlphaSpaces(value)
            : value;

    setFormData((prev) => ({ ...prev, [name]: sanitized }));
  };

  const timeCheckError = useMemo(() => {
    const s = formData.start_at ? new Date(formData.start_at) : null;
    const f = formData.finish_at ? new Date(formData.finish_at) : null;

    if (s && f && f <= s) return "Thời gian kết thúc phải sau thời gian bắt đầu!";

    const rs = formData.register_start_at ? new Date(formData.register_start_at) : null;
    const re = formData.register_end_at ? new Date(formData.register_end_at) : null;

    if (rs && re && re <= rs) return "Thời gian đóng đăng ký phải sau thời gian mở đăng ký!";

    return null;
  }, [formData.start_at, formData.finish_at, formData.register_start_at, formData.register_end_at]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.start_at || !formData.finish_at || !formData.organization || !formData.address) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    if (timeCheckError) {
      setError(timeCheckError);
      return;
    }

    const payload = {
      name: formData.name,
      organization: formData.organization,
      description: formData.description,
      address: formData.address,
      semester_id: formData.semester_id ? Number(formData.semester_id) : null,
      start_at: formatDateTime(formData.start_at),
      finish_at: formatDateTime(formData.finish_at),

      // 🔹 cấu hình đăng ký
      register_start_at: formatDateTime(formData.register_start_at),
      register_end_at: formatDateTime(formData.register_end_at),
      max_participants: formData.max_participants ? Number(formData.max_participants) : null,
      registration_visibility: Number(formData.registration_visibility ?? 0),
    };

    setLoading(true);
    try {
      await axiosClient.put(`/events/${event.id}`, payload);
      if (onClose) onClose();
    } catch (e2) {
      setError(e2?.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
      <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm gap-4 flex flex-col bg-slate-100 rounded-md"
      >
        <h2 className="text-xl font-bold w-full text-center mt-2">Chỉnh sửa sự kiện</h2>

        {error && <p className="text-red-500 px-3">{error}</p>}

        <div className="w-full">
          <label className="px-2 font-bold">Tên sự kiện:</label>
          <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-white px-2 rounded-md py-1 text-base w-full"
          />
        </div>

        <div className="w-full">
          <label className="px-2 font-bold">Đơn vị tổ chức:</label>
          <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              className="bg-white px-2 rounded-md py-1 text-base w-full"
          />
        </div>

        <div className="w-full">
          <label className="px-2 font-bold">Chi tiết sự kiện:</label>
          <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="bg-white px-2 rounded-md py-1 text-base w-full"
          />
        </div>

        <div className="w-full">
          <label className="px-2 font-bold">Địa điểm:</label>
          <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="bg-white px-2 rounded-md py-1 text-base w-full"
          />
        </div>

        <div className="w-full">
          <label className="px-2 font-bold">Học kỳ:</label>
          <select
              name="semester_id"
              value={formData.semester_id}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Chọn học kỳ đang học</option>
            {Array.isArray(semesters) && semesters.length > 0 ? (
                semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                ))
            ) : (
                <option disabled>Không có học kỳ nào</option>
            )}
          </select>
        </div>

        <div className="w-full px-2">
          <label className="font-bold">Ngày bắt đầu:</label>
          <input
              type="datetime-local"
              name="start_at"
              value={formData.start_at}
              onChange={handleInputChange}
              className="w-full bg-white px-2 rounded-md py-1"
          />
        </div>

        <div className="w-full px-2">
          <label className="font-bold">Ngày kết thúc:</label>
          <input
              type="datetime-local"
              name="finish_at"
              value={formData.finish_at}
              onChange={handleInputChange}
              className="w-full bg-white px-2 rounded-md py-1"
          />
        </div>

        {/* ===== Cấu hình đăng ký ===== */}
        <div className="w-full px-2">
          <hr className="my-2" />
          <div className="font-bold mb-2">Cấu hình đăng ký</div>

          <label className="font-semibold">Mở đăng ký:</label>
          <input
              type="datetime-local"
              name="register_start_at"
              value={formData.register_start_at}
              onChange={handleInputChange}
              className="w-full bg-white px-2 rounded-md py-1 mb-2"
          />

          <label className="font-semibold">Đóng đăng ký:</label>
          <input
              type="datetime-local"
              name="register_end_at"
              value={formData.register_end_at}
              onChange={handleInputChange}
              className="w-full bg-white px-2 rounded-md py-1 mb-2"
          />

          <label className="font-semibold">Số lượng tối đa:</label>
          <input
              type="number"
              min={1}
              name="max_participants"
              value={formData.max_participants}
              onChange={handleInputChange}
              placeholder="Để trống = không giới hạn"
              className="w-full bg-white px-2 rounded-md py-1 mb-2"
          />

          <label className="font-semibold">Ai được xem danh sách:</label>
          <select
              name="registration_visibility"
              value={formData.registration_visibility}
              onChange={handleInputChange}
              className="w-full bg-white px-2 rounded-md py-2 mb-1"
          >
            <option value={0}>Chỉ admin được xem</option>
            <option value={1}>Công khai</option>
            <option value={2}>Chỉ người đã đăng ký</option>
          </select>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-700 text-white font-bold p-2 m-3 rounded-md"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
  );
};

export default EditEventForm;
