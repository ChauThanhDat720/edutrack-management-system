import React, { useState, useEffect } from 'react';
import { Search, Info, Clock, User, Activity, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../utils/api';

// ─── Modal xem chi tiết thay đổi ───────────────────────────────────────────
const LogDetailsModal = ({ log, onClose }) => {
    if (!log) return null;

    const renderData = (data) => {
        if (!data) return <span className="text-gray-400 italic">Trống</span>;
        if (typeof data === 'object') {
            return (
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40 border border-gray-200">
                    {JSON.stringify(data, null, 2)}
                </pre>
            );
        }
        return <span className="font-medium text-gray-800">{String(data)}</span>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Chi Tiết Hoạt Động</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hành động</label>
                            <p className="font-bold text-blue-600">{log.action}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Module</label>
                            <p className="font-bold text-purple-600">{log.module}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mô tả</label>
                        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 font-medium text-sm">
                            {log.description}
                        </div>
                    </div>

                    {log.details && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dữ liệu cũ</label>
                                {renderData(log.details.oldValue)}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dữ liệu mới</label>
                                {renderData(log.details.newValue)}
                            </div>
                        </div>
                    )}

                    {log.details?.note && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ghi chú duyệt</label>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{log.details.note}</p>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    
    // Filters
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `/activity?page=${page}&limit=12`;
            if (moduleFilter) url += `&module=${moduleFilter}`;
            if (actionFilter) url += `&action=${actionFilter}`;
            
            const res = await api.get(url);
            setLogs(res.data.data);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, moduleFilter, actionFilter]);

    const getActionStyle = (action) => {
        switch (action) {
            case 'TẠO': return 'bg-green-100 text-green-700 border-green-200';
            case 'CẬP NHẬT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'XÓA': return 'bg-red-100 text-red-700 border-red-200';
            case 'DUYỆT': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'TỪ CHỐI': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nhật Ký Hệ Thống</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium">Theo dõi mọi thay đổi dữ liệu quan trọng trên hệ thống</p>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-600">Bộ lọc:</span>
                </div>
                
                <select 
                    value={moduleFilter}
                    onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                    <option value="">Tất cả Module</option>
                    <option value="ĐIỂM SỐ">ĐIỂM SỐ</option>
                    <option value="DỜI LỊCH">DỜI LỊCH</option>
                    <option value="NGƯỜI DÙNG">NGƯỜI DÙNG</option>
                </select>

                <select 
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                    <option value="">Tất cả Hành động</option>
                    <option value="TẠO">TẠO</option>
                    <option value="CẬP NHẬT">CẬP NHẬT</option>
                    <option value="XÓA">XÓA</option>
                    <option value="DUYỆT">DUYỆT</option>
                    <option value="TỪ CHỐI">TỪ CHỐI</option>
                </select>
            </div>

            {/* Bảng nhật ký */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Người thực hiện</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Hành động</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Mô tả</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4 h-16 bg-gray-50 opacity-50"></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase tracking-wider">
                                        Không tìm thấy bản ghi nào
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={14} className="text-gray-400" />
                                                {new Date(log.createdAt).toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {log.user?.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{log.user?.name || 'Vô danh'}</div>
                                                    <div className="text-xs text-gray-400">{log.user?.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getActionStyle(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{log.module}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700 line-clamp-1">{log.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <Info size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                        <span className="text-sm text-gray-500 font-semibold">
                            Trang {page} / {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={!pagination.prevPage}
                                onClick={() => setPage(page - 1)}
                                className={`p-2 rounded-xl border ${!pagination.prevPage ? 'bg-gray-100 text-gray-300 border-gray-100' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'} transition-all`}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                disabled={!pagination.hasNextPage}
                                onClick={() => setPage(page + 1)}
                                className={`p-2 rounded-xl border ${!pagination.hasNextPage ? 'bg-gray-100 text-gray-300 border-gray-100' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'} transition-all`}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal chi tiết */}
            {selectedLog && (
                <LogDetailsModal 
                    log={selectedLog} 
                    onClose={() => setSelectedLog(null)} 
                />
            )}
        </div>
    );
};

export default SystemLogs;
