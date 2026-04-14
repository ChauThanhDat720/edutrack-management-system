import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CalendarDays, Plus, Trash2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentAbsences = () => {
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Đơn xin nghỉ phép</h1>
                    <p className="text-gray-500 text-sm">Quản lý các yêu cầu nghỉ phép của bạn</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span>Tạo đơn mới</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : absences.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarDays className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Chưa có đơn nào</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Bạn chưa gửi đơn xin nghỉ phép nào. Hãy nhấn "Tạo đơn mới" để bắt đầu.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {absences.map((item) => (
                        <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-50 p-2 rounded-lg text-blue-600">
                                    <CalendarDays size={20} />
                                </div>
                                {getStatusBadge(item.status)}
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày nghỉ</label>
                                    <p className="text-gray-900 font-semibold">{new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lý do</label>
                                    <p className="text-sm text-gray-600 line-clamp-2">{item.reason}</p>
                                </div>
                                {item.note && (
                                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Phản hồi từ giáo viên:</p>
                                        <p className="text-xs text-gray-600 italic mt-1">"{item.note}"</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                                <span>Gửi lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                {item.status === 'pending' && (
                                    <button 
                                        className="text-red-400 hover:text-red-600 transition-colors p-1"
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Tạo đơn xin nghỉ phép</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày xin nghỉ</label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do nghỉ</label>
                                <textarea
                                    name="reason"
                                    required
                                    rows="4"
                                    placeholder="Vd: Sốt xuất huyết, Cần đi khám bệnh..."
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3">
                                <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-blue-600 leading-normal">
                                    Đơn xin nghỉ phép của bạn sẽ được gửi tới Giáo viên/Admin để xét duyệt. Vui lòng gửi đơn trước ngày nghỉ ít nhất 24h nếu có thể.
                                </p>
                            </div>
                            
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 flex justify-center items-center"
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
        </div>
    );
};

export default StudentAbsences;
