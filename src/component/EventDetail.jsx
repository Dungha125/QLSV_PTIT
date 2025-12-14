import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button, Space, message } from "antd";


import { axiosClient } from "../api/axiosClient";
import { useAuth } from "../auth/AuthContext";
import RegistrationsList from "./RegistrationsList";

// Tùy dự án bạn, chỉnh lại rule này cho đúng
function isStudent(me) {
  return !!(me?.member_group === 1 || me?.role === "student");
}
function isAdmin(me) {
  return !!(me?.is_admin || me?.member_group === 6 || me?.role === "admin");
}

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();

  const canStudent = useMemo(() => isStudent(me), [me]);
  const canAdmin = useMemo(() => isAdmin(me), [me]);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Popup import
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [fileData, setFileData] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({
    username: "",
    last_name: "",
    first_name: "",
  });

  // Toast popup custom (giữ lại như code cũ)
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto close popup (fix setTimeout trong render)
  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => setShowPopup(false), 3000);
    return () => clearTimeout(t);
  }, [showPopup]);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(`/events/${eventId}`);
      // backend bạn đang dùng {code,message,data}
      setEvent(res?.data?.data ?? res?.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Error fetching event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const doRegister = async () => {
    try {
      await axiosClient.post(`/events/${eventId}/register`);
      message.success("Đăng ký thành công");
      // Nếu cần refresh UI event
      // await fetchEvent();
    } catch (e) {
      message.error(e?.response?.data?.message || "Đăng ký thất bại");
    }
  };

  const doCancel = async () => {
    try {
      await axiosClient.delete(`/events/${eventId}/register`);
      message.success("Đã huỷ đăng ký");
      // await fetchEvent();
    } catch (e) {
      message.error(e?.response?.data?.message || "Huỷ thất bại");
    }
  };

  const toggleUploadPopup = () => {
    if (!canAdmin) return;
    setShowUploadPopup((v) => !v);
  };

  const handleBackClick = () => {
    navigate(`/quanly/home`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (result) => setFileData(result.data || []),
        error: (err) => console.error("Error parsing CSV:", err),
      });
      return;
    }

    if (fileExtension === "xlsx") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setFileData(jsonData || []);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    message.error("Chỉ hỗ trợ file .csv hoặc .xlsx");
  };

  const handleMappingChange = (e) => {
    const { name, value } = e.target;
    setFieldMapping((prev) => ({ ...prev, [name]: value }));
  };

  const handleImportSubmit = async () => {
    // Validate mapping
    if (!fieldMapping.username || !fieldMapping.last_name || !fieldMapping.first_name) {
      setPopupMessage("Bạn cần map đủ username / last_name / first_name");
      setIsSuccess(false);
      setShowPopup(true);
      return;
    }

    const mappedUsers = (fileData || [])
        .map((row) => ({
          username: row?.[fieldMapping.username],
          last_name: row?.[fieldMapping.last_name],
          first_name: row?.[fieldMapping.first_name],
        }))
        // lọc dòng rỗng
        .filter((u) => u.username && u.last_name && u.first_name);

    if (mappedUsers.length === 0) {
      setPopupMessage("File không có dữ liệu hợp lệ sau khi map");
      setIsSuccess(false);
      setShowPopup(true);
      return;
    }

    try {
      await axiosClient.post(`/events/import`, {
        event_id: Number(eventId),
        users: mappedUsers,
      });

      setPopupMessage("Tải danh sách thành công!");
      setIsSuccess(true);
      setShowPopup(true);
      setShowUploadPopup(false);
      setFileData([]);
      setFieldMapping({ username: "", last_name: "", first_name: "" });

      // RegistrationsList có nút Reload, nhưng để UX tốt hơn bạn có thể:
      // - hoặc trigger state refresh nếu RegistrationsList hỗ trợ callback
      // - hoặc người dùng bấm Reload
    } catch (e) {
      console.error("Import error:", e?.response?.data || e);
      setPopupMessage(e?.response?.data?.message || "Tải danh sách không thành công, vui lòng xem lại data");
      setIsSuccess(false);
      setShowPopup(true);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!event) return <p>Không tìm thấy sự kiện</p>;

  return (
      <div className="p-4">
        {/* Header */}
        <div className="w-full bg-red-500 fixed top-0 left-0 h-12 z-20">
          <button className="h-12 flex items-center mx-8 text-white font-bold" onClick={handleBackClick}>
            Quay lại
          </button>
        </div>

        {/* Event info */}
        <div className="w-full mb-4 mt-12">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p>{event.description}</p>
          <p>Địa điểm tổ chức: {event.address}</p>
          <p>Bắt đầu: {event.start_at}</p>
          <p>Kết thúc: {event.finish_at}</p>

          {/* Optional: show register config if backend has fields */}
          {event.register_start_at && <p>Mở đăng ký: {event.register_start_at}</p>}
          {event.register_end_at && <p>Đóng đăng ký: {event.register_end_at}</p>}
          {event.max_participants && <p>Số lượng tối đa: {event.max_participants}</p>}
        </div>

        {/* Student actions */}
        <Space style={{ marginBottom: 12 }} wrap>
          {canStudent && (
              <>
                <Button type="primary" onClick={doRegister}>
                  Đăng ký
                </Button>
                <Button danger onClick={doCancel}>
                  Huỷ đăng ký
                </Button>
              </>
          )}

          {/* Admin import */}
          {canAdmin && (
              <Button onClick={toggleUploadPopup} className="font-bold" danger>
                Thêm nhân sự (Import)
              </Button>
          )}
        </Space>

        {/* Registrations list (new) */}
        <div className="w-full bg-slate-200 rounded-md mt-2">
          <h1 className="w-full text-center text-xl font-bold p-4">Danh sách đăng ký</h1>
          <div className="p-3">
            <RegistrationsList eventId={eventId} />
          </div>
        </div>

        {/* Upload popup */}
        {showUploadPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="w-full flex justify-end">
                  <button onClick={toggleUploadPopup} className="text-gray-500 hover:text-gray-700">
                    <span className="text-3xl">&times;</span>
                  </button>
                </div>

                <h2 className="text-xl font-bold mb-4">Tải file (CSV/XLSX)</h2>
                <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="mb-4" />

                {fileData.length > 0 && (
                    <>
                      <h3 className="text-lg font-bold mb-4">Lựa chọn trường</h3>

                      {Object.keys(fieldMapping).map((field) => (
                          <div key={field} className="mb-4">
                            <label className="block mb-2">{field}</label>
                            <select
                                name={field}
                                value={fieldMapping[field]}
                                onChange={handleMappingChange}
                                className="border rounded w-full p-2"
                            >
                              <option value="">Lựa chọn trường</option>
                              {Object.keys(fileData[0] || {}).map((fileField) => (
                                  <option key={fileField} value={fileField}>
                                    {fileField}
                                  </option>
                              ))}
                            </select>
                          </div>
                      ))}

                      <button
                          onClick={handleImportSubmit}
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Submit
                      </button>
                    </>
                )}
              </div>
            </div>
        )}

        {/* Popup message */}
        {showPopup && (
            <div
                className={`fixed top-5 right-5 bg-opacity-100 p-5 rounded-lg text-white text-center z-50 ${
                    isSuccess ? "bg-green-500" : "bg-red-500"
                }`}
                onClick={() => setShowPopup(false)}
            >
              <div className="popup-content">
                <p>{popupMessage}</p>
              </div>
            </div>
        )}
      </div>
  );
};

export default EventDetail;
