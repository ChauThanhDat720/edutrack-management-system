import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserMinus, UserPlus, Search, Users, BookOpen, Clock, Calendar, Plus, X } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const ClassDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [classData, setClassData] = useState(null);
    const [allStudents, setAllStudents] = useState([]); // all students from API
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // track loading per student
    const [message, setMessage] = useState({ text: '', type: '' }); // success/error feedback

    // New states for Session Creation
    const [sessions, setSessions] = useState([]);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [sessionForm, setSessionForm] = useState({
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        teacherId: ''
    });
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const fetchClassData = async () => {
        try {
            const res = await api.get(`/classes/${id}`);
            setClassData(res.data.data);
        } catch (error) {
            console.error('Failed to fetch class', error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/class/${id}`);
            setSessions(res.data.data);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await api.get('/users?role=student');
            setAllStudents(res.data.data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            setSubjects(res.data.data);
        } catch (error) {
            console.error('Failed to fetch subjects', error);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchClassData(), fetchAllStudents(), fetchSubjects(), fetchSessions()]);
            setLoading(false);
        };
        init();
    }, [id]);

    const checkTeacherAvailability = async () => {
        const { date, startTime, endTime, subjectId } = sessionForm;
        if (!date || !startTime || !endTime) return;

        setIsCheckingAvailability(true);
        try {
            const res = await api.get(`/sessions/available-teachers?date=${date}&startTime=${startTime}&endTime=${endTime}&subjectId=${subjectId}`);
            setAvailableTeachers(res.data.data);
            // Clear teacher selection if current teacher is no longer available
            if (sessionForm.teacherId && !res.data.data.find(t => t._id === sessionForm.teacherId)) {
                setSessionForm(prev => ({ ...prev, teacherId: '' }));
            }
        } catch (error) {
            console.error('Failed to check availability', error);
            showMessage('Lỗi kiểm tra lịch giáo viên', 'error');
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    useEffect(() => {
        if (sessionForm.date && sessionForm.startTime && sessionForm.endTime) {
            checkTeacherAvailability();
        }
    }, [sessionForm.date, sessionForm.startTime, sessionForm.endTime]);

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setActionLoading('create-session');
        try {
            await api.post('/sessions', {
                ...sessionForm,
                classId: id
            });
            showMessage('Tạo lịch học thành công!');
            setShowSessionModal(false);
            fetchSessions(); // Refresh sessions list
            setSessionForm({ subjectId: '', date: '', startTime: '', endTime: '', teacherId: '' });
        } catch (err) {
            showMessage(err.response?.data?.message || 'Không thể tạo lịch học. Vui lòng kiểm tra xung đột.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleManageStudent = async (studentId, action) => {
        setActionLoading(studentId);
        try {
            const res = await api.patch(`/classes/${id}/students`, { studentId, action });
            setClassData(res.data.data);
            showMessage(
                action === 'add' ? 'Thêm học sinh thành công!' : 'Đã xóa học sinh khỏi lớp!',
                'success'
            );
        } catch (err) {
            showMessage(err.response?.data?.message || 'Thao tác thất bại', 'error');
        } finally {
            setActionLoading(null);
            setSearchTerm('');
        }
    };

    // IDs of students already in the class
    const enrolledIds = classData?.students?.map(s => s._id) || [];

    // Students NOT yet enrolled, filtered by search term
    const availableStudents = allStudents.filter(
        s => !enrolledIds.includes(s._id) &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-500 text-sm">Đang tải thông tin lớp...</p>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="text-center py-16">
                <p className="text-red-500 font-semibold">Không tìm thấy lớp học</p>
                <button onClick={() => navigate('..')} className="mt-4 text-blue-600 hover:underline text-sm">← Quay lại</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Back Button + Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('..')}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Lớp {classData.className}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Giáo viên: <span className="font-medium text-gray-700">{classData.teacher?.name}</span>
                            {classData.teacher?.teacherDetails?.subject && (
                                <> · Môn: <span className="font-medium text-gray-700">{classData.teacher.teacherDetails.subject}</span></>
                            )}
                            {classData.room && (
                                <> · Phòng: <span className="font-medium text-gray-700">{classData.room}</span></>
                            )}
                        </p>
                    </div>
                </div>
                
                {/* Nút Bảng điểm & Tạo lịch cho Admin & Teacher */}
                <div className="flex gap-2">
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <>
                            <button
                                onClick={() => setShowSessionModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
                            >
                                <Plus size={18} /> Tạo lịch học
                            </button>
                            <button
                                onClick={() => navigate('grades')}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium text-sm shadow-sm"
                            >
                                <BookOpen size={18} /> Bảng điểm
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Feedback Toast */}
            {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border-l-4 ${message.type === 'success'
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Sessions Panel ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Clock size={18} className="text-orange-500" />
                            Lịch sử buổi học
                        </h2>
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {classData.schedule?.length || 0} buổi/tuần
                        </span>
                    </div>
                    <div className="p-5 flex-1 max-h-[420px] overflow-y-auto">
                        {sessions.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <Calendar size={36} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Chưa có buổi học nào được lên lịch</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session) => (
                                    <div key={session._id} className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-100 rounded-lg hover:border-orange-200 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded uppercase">
                                                        {session.subject?.name || 'Môn học'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-medium">
                                                        {new Date(session.date).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-800">
                                                        {session.startTime} - {session.endTime}
                                                    </span>
                                                    <span className="text-xs text-gray-500 italic">
                                                        GV: {session.teacher?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            {(user?.role === 'teacher' || user?.role === 'admin') && (
                                                <button
                                                    onClick={() => navigate(`/teacher/attendance/${session._id}`)}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                                                        session.status === 'completed' 
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                        : 'bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white'
                                                    }`}
                                                >
                                                    {session.status === 'completed' ? 'Xem điểm danh' : 'Điểm danh'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Current Students Panel ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Users size={18} className="text-blue-500" />
                            Học sinh trong lớp
                        </h2>
                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {enrolledIds.length} người
                        </span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                        {enrolledIds.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">Lớp chưa có học sinh</p>
                            </div>
                        ) : (
                            classData.students.map((student) => (
                                <div key={student._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                    {/* Avatar */}
                                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                        {student.name?.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                        {student.studentDetails?.studentId && (
                                            <span className="text-[10px] text-gray-400 font-mono">{student.studentDetails.studentId}</span>
                                        )}
                                    </div>
                                    {/* Remove Button (Admin only) */}
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => handleManageStudent(student._id, 'remove')}
                                            disabled={actionLoading === student._id}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                                            title="Đuổi khỏi lớp"
                                        >
                                            {actionLoading === student._id
                                                ? <span className="inline-block h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                                                : <UserMinus size={16} />
                                            }
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Add Student Panel (Admin only) ── */}
                {user?.role === 'admin' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                <UserPlus size={18} className="text-green-500" />
                                Thêm học sinh vào lớp
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Chỉ hiển thị học sinh chưa có trong lớp này</p>
                        </div>

                        {/* Search Box */}
                        <div className="px-5 pt-4 pb-2">
                            <div className="relative">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm theo tên hoặc email..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Available Students List */}
                        <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
                            {availableStudents.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p className="text-sm">
                                        {searchTerm ? 'Không tìm thấy học sinh phù hợp' : 'Tất cả học sinh đã ở trong lớp'}
                                    </p>
                                </div>
                            ) : (
                                availableStudents.map((student) => (
                                    <div key={student._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                            {student.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleManageStudent(student._id, 'add')}
                                            disabled={actionLoading === student._id}
                                            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-white hover:bg-green-600 border border-green-300 hover:border-transparent px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                                        >
                                            {actionLoading === student._id
                                                ? <span className="inline-block h-3 w-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></span>
                                                : <UserPlus size={13} />
                                            }
                                            Thêm
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tạo lịch học */}
            {showSessionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar size={22} />
                                Tạo lịch học mới
                            </h3>
                            <button onClick={() => setShowSessionModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Môn học</label>
                                    <select
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        value={sessionForm.subjectId}
                                        onChange={(e) => setSessionForm({ ...sessionForm, subjectId: e.target.value })}
                                    >
                                        <option value="">-- Chọn môn học --</option>
                                        {subjects.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Ngày dạy</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={sessionForm.date}
                                        onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Giờ bắt đầu</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={sessionForm.startTime}
                                        onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Giờ kết thúc</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={sessionForm.endTime}
                                        onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                        Giáo viên
                                        {isCheckingAvailability && <span className="text-[10px] text-blue-500 animate-pulse normal-case">Đang tìm giáo viên rảnh...</span>}
                                    </label>
                                    <select
                                        required
                                        disabled={!sessionForm.date || !sessionForm.startTime || !sessionForm.endTime}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50"
                                        value={sessionForm.teacherId}
                                        onChange={(e) => setSessionForm({ ...sessionForm, teacherId: e.target.value })}
                                    >
                                        <option value="">-- Chọn giáo viên --</option>
                                        {availableTeachers.map(teacher => (
                                            <option key={teacher._id} value={teacher._id}>
                                                {teacher.name} {teacher.teacherDetails?.subject ? `(${teacher.teacherDetails.subject})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {(sessionForm.date && sessionForm.startTime && !isCheckingAvailability && availableTeachers.length === 0) && (
                                        <p className="text-[10px] text-red-500 font-medium italic mt-1">
                                            Không có giáo viên nào trống lịch trong khung giờ này.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSessionModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === 'create-session' || availableTeachers.length === 0}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md"
                                >
                                    {actionLoading === 'create-session' ? 'Đang lưu...' : 'Lưu lịch học'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassDetail;
