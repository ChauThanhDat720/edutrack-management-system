import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    CalendarDays, CheckCircle2, XCircle, Filter,
    Search, X, CalendarCheck, Clock, MapPin, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
    pending: { label: 'Đang chờ', cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Đã duyệt', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-700' },
};

const ManageReschedule = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal duyệt / từ chối
    const [selectedItem, setSelectedItem] = useState(null);
    const [action, setAction] = useState(null); // 'approve' | 'reject'
    const [reviewNote, setReviewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const queryStatus = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const res = await api.get(`/reschedule?page=${currentPage}&limit=10${queryStatus}`);
            setRequests(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
        } catch (error) {
            toast.error('Không thể tải danh sách đơn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus, currentPage]);

    const filtered = requests.filter(r =>
        r.requestedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openModal = (item, act) => {
        setSelectedItem(item);
        setAction(act);
        setReviewNote('');
    };

    const closeModal = () => {
        setSelectedItem(null);
        setAction(null);
        setReviewNote('');
    };

    const handleSubmitAction = async (e) => {
        e.preventDefault();
        if (!selectedItem) return;
        setSubmitting(true);
        try {
            const endpoint = action === 'approve'
                ? `/reschedule/${selectedItem._id}/approve`
                : `/reschedule/${selectedItem._id}/reject`;
            await api.put(endpoint, { reviewNote });
            toast.success(action === 'approve' ? 'Đã duyệt đơn xin dời!' : 'Đã từ chối đơn');
            closeModal();
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Duyệt Đơn Dời Buổi Dạy</h1>
                    <p className="text-gray-500 text-sm mt-1">Xem xét và phê duyệt các đơn xin dời lịch học của giáo viên.</p>
                </div>
                {/* Counts */}
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-center">
                        <p className="text-xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</p>
                        <p className="text-xs text-yellow-600 font-medium">Chờ duyệt</p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex bg-gray-100/80 p-1 rounded-xl">
                    {['pending', 'approved', 'rejected', 'all'].map(s => (
                        <button
                            key={s}
                            onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {s === 'all' ? 'Tất cả' : STATUS_BADGE[s]?.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên giáo viên..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Giáo viên</th>
                                <th className="px-6 py-4">Buổi cũ</th>
                                <th className="px-6 py-4">Đề xuất mới</th>
                                <th className="px-6 py-4">Lý do</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        Không có đơn nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => {
                                    const session = item.sessionId;
                                    const badge = STATUS_BADGE[item.status];
                                    return (
                                        <tr key={item._id} className="hover:bg-gray-50/30 transition-colors">
                                            {/* Giáo viên */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                        {item.requestedBy?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{item.requestedBy?.name}</p>
                                                        <p className="text-xs text-gray-400">{item.requestedBy?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Buổi cũ */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-800">
                                                    {session?.date ? new Date(session.date).toLocaleDateString('vi-VN') : '—'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {session?.startTime} – {session?.endTime}
                                                </p>
                                                <p className="text-xs text-indigo-500 font-medium mt-0.5">
                                                    {session?.classId?.className}
                                                </p>
                                            </td>
                                            {/* Đề xuất mới */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                                        <CalendarDays size={13} className="text-blue-500" />
                                                        {item.newDate ? new Date(item.newDate).toLocaleDateString('vi-VN') : '—'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                        <Clock size={12} className="text-blue-400" />
                                                        {item.newStartTime ? `${item.newStartTime}–${item.newEndTime}` : '—'}
                                                    </div>
                                                    {item.newRoom && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <MapPin size={12} className="text-blue-400" />
                                                            {item.newRoom}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Lý do */}
                                            <td className="px-6 py-4 max-w-[200px]">
                                                <p className="text-sm text-gray-600 line-clamp-2 italic">"{item.reason}"</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                </p>
                                            </td>
                                            {/* Trạng thái */}
                                            <td className="px-6 py-4">
                                                <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                                {item.reviewNote && (
                                                    <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">"{item.reviewNote}"</p>
                                                )}
                                            </td>
                                            {/* Thao tác */}
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openModal(item, 'approve')}
                                                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                            title="Duyệt"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(item, 'reject')}
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Từ chối"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                        <span className="text-sm text-gray-500">Trang <b>{currentPage}</b> / <b>{totalPages}</b></span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                            >Trước</button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                            >Sau</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !submitting && closeModal()} />
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className={`px-6 py-5 border-b border-gray-100 flex items-center gap-3 ${action === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                            {action === 'approve' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            <h3 className="text-lg font-bold text-gray-900">
                                {action === 'approve' ? 'Duyệt đơn xin dời' : 'Từ chối đơn xin dời'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmitAction} className="p-6 space-y-4">
                            {/* Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                                <p><span className="font-medium text-gray-600">Giáo viên:</span> {selectedItem.requestedBy?.name}</p>
                                <p><span className="font-medium text-gray-600">Buổi cũ:</span> {selectedItem.sessionId?.date ? new Date(selectedItem.sessionId.date).toLocaleDateString('vi-VN') : '—'}</p>
                                <p><span className="font-medium text-gray-600">Ngày đề xuất:</span> {selectedItem.newDate ? new Date(selectedItem.newDate).toLocaleDateString('vi-VN') : '—'}</p>
                            </div>

                            {action === 'approve' && (
                                <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 flex items-start gap-2">
                                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>Khi duyệt, buổi cũ sẽ được đánh dấu "đã dời" và buổi mới sẽ được tạo theo đề xuất.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Ghi chú {action === 'reject' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    required={action === 'reject'}
                                    rows={3}
                                    placeholder={action === 'approve' ? 'Ghi chú thêm (nếu có)...' : 'Lý do từ chối...'}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                >Hủy</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${
                                        action === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700 shadow-green-500/25 disabled:bg-green-300'
                                            : 'bg-red-600 hover:bg-red-700 shadow-red-500/25 disabled:bg-red-300'
                                    }`}
                                >
                                    {submitting
                                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageReschedule;
