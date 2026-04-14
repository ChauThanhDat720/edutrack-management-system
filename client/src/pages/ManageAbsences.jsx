import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CalendarDays, Clock, CheckCircle2, XCircle, Search, Filter, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageAbsences = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    
    // For rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchAllAbsences = async () => {
        try {
            setLoading(true);
            const res = await api.get('/absence'); // In backend routes, the list for admin is at GET /absence or GET / depending on how they linked it.
            // Based on absenceRoutes.js: router.get('/', protect, getAllAbsences) 
            // Wait, let's check the routes again.
            setAbsences(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách đơn xin nghỉ');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAbsences();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Duyệt đơn xin nghỉ này?')) return;
        try {
            await api.put(`/absence/${id}`, { status: 'approved' });
            toast.success('Đã duyệt đơn');
            fetchAllAbsences();
        } catch (error) {
            toast.error('Thao tác thất bại');
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/absence/${selectedId}`, { 
                status: 'rejected', 
                note: rejectNote 
            });
            toast.success('Đã từ chối đơn');
            setShowRejectModal(false);
            setRejectNote('');
            fetchAllAbsences();
        } catch (error) {
            toast.error('Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAbsences = absences.filter(item => {
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchesName = item.student?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesName;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn xin nghỉ</h1>
                    <p className="text-gray-500 text-sm">Duyệt hoặc từ chối các yêu cầu nghỉ phép của học sinh</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên học sinh..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                        />
                    </div>
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Bị từ chối</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Học sinh</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lớp</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ngày xin nghỉ</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lý do</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="6" className="px-6 py-4"><div className="h-4 bg-gray-100 rounded"></div></td>
                                </tr>
                            ))
                        ) : filteredAbsences.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu phù hợp.
                                </td>
                            </tr>
                        ) : (
                            filteredAbsences.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                {item.student?.name?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-sm text-gray-900">{item.student?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600">{item.student?.studentDetails?.className || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                                            <span className="text-[10px] text-gray-400">Gửi: {new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-gray-600 truncate" title={item.reason}>{item.reason}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.status === 'approved' && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">Đã duyệt</span>
                                        )}
                                        {item.status === 'rejected' && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">Bị từ chối</span>
                                        )}
                                        {item.status === 'pending' && (
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700">Đang chờ</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.status === 'pending' ? (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleApprove(item._id)}
                                                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                    title="Duyệt đơn"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedId(item._id);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Từ chối"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 font-medium italic">Đã xử lý</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowRejectModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center space-x-3 text-red-600">
                            <XCircle size={24} />
                            <h3 className="text-xl font-bold">Từ chối đơn xin nghỉ</h3>
                        </div>
                        
                        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối (Gửi cho học sinh)</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Vd: Sai thông tin, Chưa đủ lý do xác thực..."
                                    value={rejectNote}
                                    onChange={(e) => setRejectNote(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none"
                                ></textarea>
                            </div>
                            
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-200 flex justify-center items-center"
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Xác nhận từ chối"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAbsences;
