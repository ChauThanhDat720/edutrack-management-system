import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CalendarDays, Plus, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentAbsences = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [formData, setFormData] = useState({
        date: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchMyAbsences = async () => {
        try {
            setLoading(true);
            const res = await api.get('/absence/me');
            setAbsences(res.data.data);
        } catch (error) {
            toast.error('Không thể tải danh sách đơn xin nghỉ');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyAbsences();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/absence', formData);
            toast.success('Đã gửi đơn xin nghỉ phép!');
            setShowModal(false);
            setFormData({ date: '', reason: '' });
            fetchMyAbsences();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi đơn thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return toast.error('Vui lòng nhập nội dung phản hồi');
        setSubmitting(true);
        try {
            await api.put(`/absence/${selectedId}/Response`, { studentReply: replyContent });
            toast.success('Đã gửi phản hồi!');
            setShowReplyModal(false);
            setReplyContent('');
            fetchMyAbsences();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi phản hồi thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 size={12} className="mr-1" /> Đã duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle size={12} className="mr-1" /> Từ chối
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} className="mr-1" /> Đang chờ
                    </span>
                );
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa đơn này?')) return;
        try {
            await api.delete(`/absence/${id}`);
            toast.success('Đã xóa đơn');
            fetchMyAbsences();
        } catch (err) {
            toast.error('Không thể xóa đơn');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 text-slate-800">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Đơn xin nghỉ phép</h1>
                    <p className="text-gray-500 text-sm">Quản lý các yêu cầu nghỉ phép của bạn</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    <span className="font-semibold">Tạo đơn mới</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600/20 border-t-blue-600"></div>
                </div>
            ) : absences.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <CalendarDays className="text-blue-500" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Chưa có đơn nào</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Bạn chưa gửi đơn xin nghỉ phép nào. Hãy nhấn "Tạo đơn mới" để bắt đầu.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {absences.map((item) => (
                        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-transparent -mr-12 -mt-12 rounded-full group-hover:scale-110 transition-transform duration-500"></div>

                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                    <CalendarDays size={22} />
                                </div>
                                {getStatusBadge(item.status)}
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngày nghỉ</label>
                                    <p className="text-gray-900 font-bold text-lg mt-0.5">
                                        {new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lý do</label>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed mt-1">{item.reason}</p>
                                </div>

                                {item.note && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group/note">
                                        <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            Phản hồi từ giáo viên
                                        </p>
                                        <p className="text-xs text-slate-600 italic leading-relaxed">"{item.note}"</p>

                                        {item.status === 'rejected' && !item.isAppealed && (
                                            <button
                                                onClick={() => {
                                                    setSelectedId(item._id);
                                                    setShowReplyModal(true);
                                                }}
                                                className="mt-3 flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors"
                                            >
                                                <MessageSquare size={14} />
                                                <span>Phản hồi lại</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {item.studentReply && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-1.5 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                                            Bạn đã giải trình
                                        </p>
                                        <p className="text-xs text-blue-700 leading-relaxed font-medium">{item.studentReply}</p>
                                        {item.status === 'pending' && (
                                            <p className="text-[9px] text-blue-400 mt-2 italic">* Đang chờ giáo viên duyệt lại</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between relative z-10 text-[10px] font-medium text-gray-400">
                                <span>Gửi lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                {item.status === 'pending' && !item.isAppealed && (
                                    <button
                                        className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                                        title="Xóa đơn"
                                        onClick={() => handleDelete(item._id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-slate-800">Tạo đơn xin nghỉ phép</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngày xin nghỉ</label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Lý do nghỉ</label>
                                <textarea
                                    name="reason"
                                    required
                                    rows="4"
                                    placeholder="Vd: Con bị sốt cao cần đi khám, Có việc gia đình đột xuất..."
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100/50">
                                <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
                                    Đơn của bạn sẽ được gửi tới Giáo viên/Admin để xét duyệt. Vui lòng gửi đơn trước ngày nghỉ ít nhất 24h nếu có thể.
                                </p>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex justify-center items-center"
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Gửi đơn ngay"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setShowReplyModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
                            <div className="flex items-center space-x-2 text-blue-600">
                                <MessageSquare size={20} />
                                <h3 className="text-xl font-bold">Phản hồi giải trình</h3>
                            </div>
                            <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleReplySubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nội dung giải thích thêm</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Giải thích lý do tại sao bạn cần nghỉ hoặc cung cấp thêm bằng chứng (Vd: Giấy khám bệnh)..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                ></textarea>
                                <p className="text-[10px] text-gray-400 mt-2 italic">* Sau khi gửi phản hồi, đơn của bạn sẽ quay lại trạng thái 'Chờ duyệt' để giáo viên xem xét lại.</p>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowReplyModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex justify-center items-center"
                                >
                                    {submitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Gửi giải trình"
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

export default StudentAbsences;
