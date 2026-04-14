import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, XCircle, Clock, ClipboardCheck, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sessions/student/attendance');
            if (res.data.success) {
                setRecords(res.data.data);
                setStats(res.data.stats);
            }
        } catch (error) {
            toast.error('Không thể tải lịch sử điểm danh');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'present': return { label: 'Có mặt', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={14} /> };
            case 'absent': return { label: 'Vắng mặt', color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle size={14} /> };
            case 'late': return { label: 'Đi muộn', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock size={14} /> };
            case 'excused': return { label: 'Vắng có phép', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <ClipboardCheck size={14} /> };
            default: return { label: 'Không xác định', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <Calendar size={14} /> };
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const attendanceRate = stats?.total > 0 
        ? Math.round(((stats.present + stats.excused + stats.late * 0.5) / stats.total) * 100) 
        : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chuyên cần của tôi</h1>
                    <p className="text-gray-500 text-sm">Theo dõi lịch sử điểm danh và tỉ lệ tham gia lớp học</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3">
                        <TrendingUp size={24} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p>
                    <p className="text-xs text-gray-500 font-medium uppercase mt-1">Tỉ lệ chuyên cần</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats?.present || 0}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase mt-1">Có mặt</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats?.excused || 0}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase mt-1">Vắng có phép</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats?.late || 0}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase mt-1">Đi muộn</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats?.absent || 0}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase mt-1">Vắng mặt</p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Chi tiết lịch sử</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày học</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lớp học</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ học</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                        Chưa có dữ liệu điểm danh nào được ghi nhận.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => {
                                    const statusInfo = getStatusInfo(record.status);
                                    return (
                                        <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {new Date(record.sessionId?.date).toLocaleDateString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {record.sessionId?.classId?.className || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {record.sessionId?.startTime || 'Chưa rõ'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                                                        {statusInfo.icon}
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
