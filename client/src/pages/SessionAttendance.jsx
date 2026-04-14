import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, XCircle, Clock, Info, ClipboardCheck } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const SessionAttendance = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [sessionData, setSessionData] = useState(null);
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [selectedAbsence, setSelectedAbsence] = useState(null);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const res = await api.get(`/sessions/${sessionId}/students`);
                if (res.data.success) {
                    setSessionData(res.data.data.sessionInfo);
                    setStudents(res.data.data.students);
                    // Initialize attendance data from server
                    const initialAttendance = res.data.data.students.map(s => ({
                        studentId: s._id,
                        status: s.status || 'present'
                    }));
                    setAttendanceData(initialAttendance);
                }
            } catch (error) {
                console.error('Failed to fetch session data', error);
                showMessage(error.response?.data?.message || 'Lỗi tải dữ liệu buổi học', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSessionData();
    }, [sessionId]);

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => 
            prev.map(item => 
                item.studentId === studentId ? { ...item, status } : item
            )
        );
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const res = await api.post(`/sessions/${sessionId}/attendance`, { attendanceData });
            if (res.data.success) {
                showMessage('Lưu điểm danh thành công!');
                setTimeout(() => navigate('..'), 1500); // Go back after saving
            }
        } catch (error) {
            console.error('Failed to save attendance', error);
            showMessage(error.response?.data?.message || 'Lỗi lưu điểm danh', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-500 text-sm">Đang tải danh sách điểm danh...</p>
            </div>
        );
    }

    if (!sessionData) {
        return (
            <div className="text-center py-16">
                <p className="text-red-500 font-semibold">Không tìm thấy buổi học</p>
                <button onClick={() => navigate('..')} className="mt-4 text-blue-600 hover:underline text-sm">← Quay lại</button>
            </div>
        );
    }

    const presentCount = attendanceData.filter(a => a.status === 'present').length;
    const absentCount = attendanceData.filter(a => a.status === 'absent').length;
    const lateCount = attendanceData.filter(a => a.status === 'late').length;
    const excusedCount = attendanceData.filter(a => a.status === 'excused').length;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button
                    onClick={() => navigate('..')}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Điểm danh: Lớp {sessionData.className}
                    </h1>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <Clock size={16} /> Ngày: {new Date(sessionData.date).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={16} /> Giờ: {sessionData.startTime} - {sessionData.endTime || 'Chưa rõ'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <span className="text-green-600 font-bold">Có mặt: {presentCount}</span>
                    <span className="text-red-600 font-bold">Vắng: {absentCount}</span>
                    <span className="text-blue-600 font-bold">Có phép: {excusedCount}</span>
                    <span className="text-yellow-600 font-bold">Muộn: {lateCount}</span>
                </div>
                <button
                    onClick={handleSaveAttendance}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
                >
                    {saving ? (
                        <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <Save size={20} />
                    )}
                    Lưu Điểm Danh
                </button>
            </div>

            {/* Feedback Toast */}
            {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border-l-4 shadow-sm ${message.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Attendance List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-700 w-16">STT</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Học sinh</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-10 text-center text-gray-500 italic">
                                        Lớp học này chưa có học sinh.
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => {
                                    const currentStatus = attendanceData.find(a => a.studentId === student._id)?.status || 'present';
                                    
                                    return (
                                        <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-medium">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                                        {student.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900">{student.name}</p>
                                                            {student.hasApprovedAbsence && (
                                                                <button 
                                                                    onClick={() => setSelectedAbsence(student)}
                                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase animate-pulse hover:bg-blue-200 transition-colors"
                                                                >
                                                                    <Info size={10} className="mr-0.5" /> Có đơn nghỉ
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            {student.studentDetails?.studentId || student.email}
                                                            {student.hasApprovedAbsence && (
                                                                <span className="ml-2 text-blue-500 italic">({student.absenceReason})</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'present')}
                                                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg border-2 transition-all ${currentStatus === 'present' 
                                                            ? 'border-green-500 bg-green-50 text-green-700' 
                                                            : 'border-gray-200 bg-white text-gray-400 hover:border-green-200'}`}
                                                    >
                                                        <CheckCircle size={20} className="mb-1" />
                                                        <span className="text-xs font-bold">Có mặt</span>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'absent')}
                                                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg border-2 transition-all ${currentStatus === 'absent' 
                                                            ? 'border-red-500 bg-red-50 text-red-700' 
                                                            : 'border-gray-200 bg-white text-gray-400 hover:border-red-200'}`}
                                                    >
                                                        <XCircle size={20} className="mb-1" />
                                                        <span className="text-xs font-bold">Vắng</span>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'late')}
                                                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg border-2 transition-all ${currentStatus === 'late' 
                                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                                                            : 'border-gray-200 bg-white text-gray-400 hover:border-yellow-200'}`}
                                                    >
                                                        <Clock size={20} className="mb-1" />
                                                        <span className="text-xs font-bold">Muộn</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'excused')}
                                                        className={`flex flex-col items-center justify-center w-20 h-16 rounded-lg border-2 transition-all ${currentStatus === 'excused' 
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                            : student.hasApprovedAbsence 
                                                                ? 'border-blue-200 bg-blue-50/30 text-blue-400 border-dashed hover:border-blue-300'
                                                                : 'border-gray-200 bg-white text-gray-400 hover:border-blue-200'}`}
                                                    >
                                                        <ClipboardCheck size={20} className="mb-1" />
                                                        <span className="text-xs font-bold">Có phép</span>
                                                    </button>
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

            {/* Absence Details Modal */}
            {selectedAbsence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ClipboardCheck size={24} />
                                Chi tiết đơn xin nghỉ
                            </h3>
                            <p className="opacity-80 text-sm mt-1">Học sinh: {selectedAbsence.name}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Lý do nghỉ</p>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-gray-700">
                                    "{selectedAbsence.absenceReason}"
                                </div>
                            </div>
                            
                            {selectedAbsence.absenceNote && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">Ghi chú từ người duyệt</p>
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm">
                                        {selectedAbsence.absenceNote}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    onClick={() => setSelectedAbsence(null)}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                                >
                                    Đóng cửa sổ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionAttendance;
