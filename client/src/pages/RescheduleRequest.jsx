import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    CalendarDays, Clock, Plus, X, ChevronRight,
    CheckCircle2, XCircle, AlertCircle, CalendarCheck,
    Filter, RefreshCw, BookOpen, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
    pending: { label: 'Đang chờ', cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Đã duyệt', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
};

const RescheduleRequest = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [mySessions, setMySessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        sessionId: '',
        reason: '',
        newDate: '',
        newStartTime: '',
        newEndTime: '',
        newRoom: '',
    });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reschedule/my');
            setRequests(res.data.data || []);
        } catch (error) {
            toast.error('Không thể tải danh sách đơn');
        } finally {
            setLoading(false);
        }
    };

    const fetchMySessions = async () => {
        try {
            const res = await api.get('/sessions/my-schedule');
            // Chỉ lấy các buổi đã lên lịch (scheduled) và chưa diễn ra
            const upcoming = (res.data.sessions || res.data.data || []).filter(
                s => s.status === 'scheduled' && new Date(s.date) > new Date()
            );
            setMySessions(upcoming);
        } catch (error) {
            console.error('Không thể tải lịch dạy', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchMySessions();
    }, []);

    const filteredRequests = requests.filter(r =>
        filterStatus === 'all' || r.status === filterStatus
    );

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.sessionId || !form.reason || !form.newDate) {
            return toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }
        setSubmitting(true);
        try {
            await api.post('/reschedule', form);
            toast.success('Đơn xin dời buổi học đã được gửi thành công!');
            setShowModal(false);
            setForm({ sessionId: '', reason: '', newDate: '', newStartTime: '', newEndTime: '', newRoom: '' });
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi đơn thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Đơn Xin Dời Buổi Dạy</h1>
                    <p className="text-gray-500 text-sm mt-1">Gửi đơn xin dời lịch khi bận việc, đơn sẽ chờ admin duyệt.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={18} />
                    Tạo Đơn Xin Dời
                </button>
            </div>

            {/* Tabs Filter */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl w-fit">
                {['all', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {s === 'all' ? 'Tất cả' : STATUS_BADGE[s]?.label}
                        {s !== 'all' && (
                            <span className="ml-2 text-xs font-bold">
                                ({requests.filter(r => r.status === s).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                        </div>
                    ))
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <CalendarCheck className="mx-auto text-gray-200 mb-4" size={48} />
                        <p className="text-gray-400 font-medium">Chưa có đơn nào.</p>
                        <p className="text-sm text-gray-400">Nhấn nút "Tạo Đơn Xin Dời" để bắt đầu.</p>
                    </div>
                ) : (
                    filteredRequests.map(item => {
                        const badge = STATUS_BADGE[item.status];
                        const session = item.sessionId;
                        return (
                            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                            <CalendarDays size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {session?.classId?.className || 'Lớp không xác định'}
                                                {session?.subject?.name && <span className="text-gray-500 font-normal"> · {session.subject.name}</span>}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                Buổi cũ: <span className="font-medium text-gray-700">{session?.date ? new Date(session.date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                                {session?.startTime && <span> · {session.startTime} – {session.endTime}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`self-start md:self-auto text-xs font-bold px-3 py-1.5 rounded-full ${badge.cls}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                {/* New proposed info */}
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Ngày mới</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {item.newDate ? new Date(item.newDate).toLocaleDateString('vi-VN') : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Giờ mới</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {item.newStartTime ? `${item.newStartTime} – ${item.newEndTime}` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Phòng mới</p>
                                        <p className="text-sm font-semibold text-gray-800">{item.newRoom || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Gửi lúc</p>
                                        <p className="text-sm font-semibold text-gray-800">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Lý do:</p>
                                    <p className="text-sm text-gray-700 italic">"{item.reason}"</p>
                                </div>

                                {item.reviewNote && (
                                    <div className={`p-3 rounded-xl border text-sm ${item.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                        <span className="font-semibold">Ghi chú từ admin: </span>{item.reviewNote}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal tạo đơn */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-blue-600">
                                <CalendarCheck size={22} />
                                <h2 className="text-lg font-bold text-gray-900">Tạo Đơn Xin Dời Buổi Dạy</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Chọn buổi */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Buổi dạy muốn dời <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="sessionId"
                                    value={form.sessionId}
                                    onChange={handleFormChange}
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                >
                                    <option value="">-- Chọn buổi học --</option>
                                    {mySessions.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {new Date(s.date).toLocaleDateString('vi-VN')} · {s.startTime}–{s.endTime}
                                            {s.classId?.className ? ` · ${s.classId.className}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {mySessions.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">Không có buổi học nào sắp tới.</p>
                                )}
                            </div>

                            {/* Lý do */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Lý do xin dời <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={form.reason}
                                    onChange={handleFormChange}
                                    required
                                    rows={3}
                                    placeholder="Nêu rõ lý do cần dời buổi học..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
                                />
                            </div>

                            {/* Ngày mới */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Ngày mới đề xuất <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="newDate"
                                    value={form.newDate}
                                    onChange={handleFormChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Giờ */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        name="newStartTime"
                                        value={form.newStartTime}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        name="newEndTime"
                                        value={form.newEndTime}
                                        onChange={handleFormChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Phòng học mới */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phòng học mới</label>
                                <input
                                    type="text"
                                    name="newRoom"
                                    value={form.newRoom}
                                    onChange={handleFormChange}
                                    placeholder="VD: Phòng 301, A5..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : 'Gửi Đơn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RescheduleRequest;
