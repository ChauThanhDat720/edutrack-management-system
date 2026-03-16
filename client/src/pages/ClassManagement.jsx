import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, X, ChevronRight, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ExcelImportButton from '../components/ExcelImportButton';

// ─── Create/Edit Class Modal ──────────────────────────────────────────────────
const CreateClassModal = ({ onClose, onCreated, teachers, initialData = null }) => {
    const isEdit = !!initialData;
    const [className, setClassName] = useState(initialData?.className || '');
    const [teacher, setTeacher] = useState(initialData?.teacher?._id || '');
    const [room, setRoom] = useState(initialData?.room || '');
    const [schedule, setSchedule] = useState(initialData?.schedule || []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const addScheduleRow = () => {
        setSchedule([...schedule, { dayOfWeek: 'Monday', startTime: '07:30', endTime: '09:00' }]);
    };

    const removeScheduleRow = (index) => {
        setSchedule(schedule.filter((_, i) => i !== index));
    };

    const updateScheduleRow = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index][field] = value;
        setSchedule(newSchedule);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = { className, teacher, room, schedule };
            if (isEdit) {
                await api.put(`/classes/${initialData._id}`, payload);
            } else {
                await api.post('/classes', payload);
            }
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Không thể ${isEdit ? 'cập nhật' : 'tạo'} lớp học`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Mới'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 rounded">{error}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Lớp <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="Ví dụ: 10A1"
                                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giáo Viên Chủ Nhiệm <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={teacher}
                                onChange={(e) => setTeacher(e.target.value)}
                                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Chọn giáo viên --</option>
                                {teachers.map((t) => (
                                    <option key={t._id} value={t._id}>
                                        {t.name} {t.teacherDetails?.subject ? `(${t.teacherDetails.subject})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phòng Học</label>
                            <input
                                type="text"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                placeholder="Ví dụ: Phòng 301"
                                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Schedule Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-800">Lịch học chi tiết</label>
                            <button
                                type="button"
                                onClick={addScheduleRow}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                <Plus size={14} /> Thêm buổi
                            </button>
                        </div>

                        <div className="space-y-3">
                            {schedule.length === 0 ? (
                                <p className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400">
                                    Chưa có lịch dạy nào được thiết lập.
                                </p>
                            ) : (
                                schedule.map((s, idx) => (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <select
                                            value={s.dayOfWeek}
                                            onChange={(e) => updateScheduleRow(idx, 'dayOfWeek', e.target.value)}
                                            className="flex-1 min-w-[100px] border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                                        >
                                            {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                                        </select>

                                        <div className="flex items-center gap-1">
                                            <input
                                                type="time"
                                                value={s.startTime}
                                                onChange={(e) => updateScheduleRow(idx, 'startTime', e.target.value)}
                                                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={s.endTime}
                                                onChange={(e) => updateScheduleRow(idx, 'endTime', e.target.value)}
                                                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeScheduleRow(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Đang lưu...' : (isEdit ? 'Cập Nhật Lớp' : 'Tạo Lớp')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Student Detail Modal ─────────────────────────────────────────────────────
const StudentDetailModal = ({ classItem, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Lớp {classItem.className}</h2>
                        <p className="text-sm text-gray-500">
                            Giáo viên: <span className="font-medium text-gray-700">{classItem.teacher?.name || '—'}</span>
                            {classItem.room && <> · Phòng: <span className="font-medium text-gray-700">{classItem.room}</span></>}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    {(!classItem.students || classItem.students.length === 0) ? (
                        <div className="text-center py-8 text-gray-500">
                            <GraduationCap size={40} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Lớp chưa có học sinh nào</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {classItem.students.map((student, idx) => (
                                <li key={student._id} className="flex items-center py-3 gap-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                        {student.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                    </div>
                                    {student.studentDetails?.studentId && (
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">
                                            {student.studentDetails.studentId}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ClassManagement = () => {
    const { user } = useContext(AuthContext);

    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);

    const handleEditClass = (cls) => {
        setSelectedClass(cls);
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setSelectedClass(null);
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data.data);
        } catch (error) {
            console.error("Không thể tải danh sách lớp", error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/users?role=teacher');
            setTeachers(res.data.data);
        } catch (error) {
            console.error("Không thể tải danh sách giáo viên", error);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            await Promise.all([fetchClasses(), fetchTeachers()]);
            setLoading(false);
        };
        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-500 text-sm">Đang tải dữ liệu lớp học...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Lớp Học</h1>
                    <p className="text-sm text-gray-500 mt-1">{classes.length} lớp học trong hệ thống</p>
                </div>
                {user?.role === 'admin' && (
                    <div className="flex items-center gap-2">
                        <ExcelImportButton onImportSuccess={fetchClasses} />
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            <Plus size={16} />
                            Thêm Lớp Mới
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Cards */}
            {classes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Chưa có lớp học nào</p>
                    <p className="text-sm text-gray-400 mt-1">Nhấn 'Thêm Lớp Mới' để bắt đầu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classes.map((cls) => (
                        <div
                            key={cls._id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Card Header */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 relative">
                                <h3 className="text-2xl font-extrabold text-white">{cls.className}</h3>
                                {cls.room && (
                                    <span className="text-xs text-blue-200 font-medium mt-0.5 block">{cls.room}</span>
                                )}
                                {user?.role === 'admin' && (
                                    <button
                                        onClick={() => handleEditClass(cls)}
                                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                                        title="Chỉnh sửa lớp"
                                    >
                                        <Plus className="w-4 h-4 rotate-45" size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {/* Teacher Info */}
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                        {cls.teacher?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Giáo viên</p>
                                        <p className="text-sm font-semibold text-gray-800">{cls.teacher?.name || 'Chưa có'}</p>
                                        {cls.teacher?.teacherDetails?.subject && (
                                            <p className="text-xs text-gray-500">Môn: {cls.teacher.teacherDetails.subject}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Student Count */}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Users size={16} className="text-indigo-500" />
                                    <span className="text-sm font-medium">
                                        <span className="text-xl font-bold text-gray-900">{cls.students?.length || 0}</span> học sinh
                                    </span>
                                </div>

                                {/* Schedule Preview */}
                                {cls.schedule?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {cls.schedule.slice(0, 3).map((s, i) => (
                                            <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 font-medium">
                                                {s.dayOfWeek?.slice(0, 3)} {s.startTime}
                                            </span>
                                        ))}
                                        {cls.schedule.length > 3 && (
                                            <span className="text-[10px] text-gray-400">+{cls.schedule.length - 3} buổi</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => navigate(`${cls._id}`)}
                                    className="w-full flex items-center justify-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    Chi Tiết Học Sinh
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateClassModal
                    teachers={teachers}
                    initialData={selectedClass}
                    onClose={handleCloseModal}
                    onCreated={fetchClasses}
                />
            )}

        </div>
    );
};

export default ClassManagement;
