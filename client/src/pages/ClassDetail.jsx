import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserMinus, UserPlus, Search, Users, BookOpen, Clock, Calendar, Plus, X, FileText, Upload, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const ClassDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [classData, setClassData] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('sessions'); // sessions, students, assignments

    // Sessions state
    const [sessions, setSessions] = useState([]);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [sessionForm, setSessionForm] = useState({
        subjectId: '', date: '', startTime: '', endTime: '', teacherId: ''
    });
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    // Assignments state
    const [assignments, setAssignments] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentForm, setAssignmentForm] = useState({
        title: '', description: '', dueDate: '', points: 100, attachments: []
    });
    const [assignmentUploading, setAssignmentUploading] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null); // Mock file URL for now
    const [submissions, setSubmissions] = useState([]); // For teachers to view
    const [showViewSubmissionsModal, setShowViewSubmissionsModal] = useState(false);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Basic data needed by everyone
            const basePromises = [
                api.get(`/classes/${id}`),
                api.get(`/sessions/class/${id}`),
                api.get(`/assignments/class/${id}`)
            ];

            // Data only needed by Admin/Teacher
            const isStaff = user?.role === 'admin' || user?.role === 'teacher';
            if (isStaff) {
                basePromises.push(api.get('/users')); // Fetch all users to get students and teachers
                basePromises.push(api.get('/subjects'));
            }

            const results = await Promise.all(basePromises);
            
            setClassData(results[0].data.data);
            setSessions(results[1].data.data);
            setAssignments(results[2].data.data);

            if (isStaff) {
                setAllUsers(results[3].data.data);
                setSubjects(results[4].data.data);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
            showMessage('Lỗi tải dữ liệu. Có thể bạn không có quyền truy cập một số mục.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleCreateSession = async (e) => {
        e.preventDefault();
        setActionLoading('create-session');
        try {
            await api.post('/sessions', { ...sessionForm, classId: id });
            showMessage('Tạo lịch học thành công!');
            setShowSessionModal(false);
            const res = await api.get(`/sessions/class/${id}`);
            setSessions(res.data.data);
            setSessionForm({ subjectId: '', date: '', startTime: '', endTime: '', teacherId: '' });
        } catch (err) {
            showMessage(err.response?.data?.message || 'Lỗi tạo lịch học', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setActionLoading('create-assignment');
        try {
            await api.post('/assignments', { ...assignmentForm, classId: id });
            showMessage('Giao bài tập thành công!');
            setShowAssignmentModal(false);
            const res = await api.get(`/assignments/class/${id}`);
            setAssignments(res.data.data);
            setAssignmentForm({ title: '', description: '', dueDate: '', points: 100, attachments: [] });
        } catch (err) {
            showMessage(err.response?.data?.message || 'Lỗi giao bài tập', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
        try {
            await api.delete(`/assignments/${assignmentId}`);
            setAssignments(assignments.filter(a => a._id !== assignmentId));
            showMessage('Đã xóa bài tập');
        } catch (err) {
            showMessage('Lỗi khi xóa bài tập', 'error');
        }
    };

    const handleAssignmentFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setAssignmentUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAttachment = {
                url: res.data.data.url,
                name: res.data.data.name || file.name
            };
            setAssignmentForm(prev => ({
                ...prev,
                attachments: [...prev.attachments, newAttachment]
            }));
            showMessage('Tải tài liệu đính kèm thành công!');
        } catch (err) {
            showMessage('Lỗi khi tải tài liệu lên', 'error');
        } finally {
            setAssignmentUploading(false);
        }
    };

    const [submissionType, setSubmissionType] = useState('file'); // file, link
    const [submissionLink, setSubmissionLink] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmissionFile(res.data.data.url);
            showMessage('Tải tệp lên thành công!');
        } catch (err) {
            showMessage('Lỗi khi tải tệp lên', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();
        setActionLoading('submit-work');
        try {
            const payload = {
                assignmentId: selectedAssignment._id,
                fileUrl: submissionType === 'file' ? submissionFile : submissionLink,
                fileName: submissionType === 'file' ? 'Bản nộp tệp' : 'Liên kết nộp bài',
                type: submissionType
            };
            
            await api.post('/submission', payload);
            showMessage('Nộp bài thành công!');
            setShowSubmitModal(false);
            setSubmissionFile(null);
            setSubmissionLink('');
        } catch (err) {
            showMessage(err.response?.data?.message || 'Lỗi nộp bài', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const viewSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        try {
            const res = await api.get(`/submission/assignment/${assignment._id}`);
            setSubmissions(res.data.data);
            setShowViewSubmissionsModal(true);
        } catch (err) {
            showMessage('Lỗi tải danh sách nộp bài', 'error');
        }
    };

    const handleManageStudent = async (studentId, action) => {
        setActionLoading(studentId);
        try {
            const res = await api.patch(`/classes/${id}/students`, { studentId, action });
            setClassData(res.data.data);
            showMessage(action === 'add' ? 'Thêm học sinh thành công!' : 'Đã xóa học sinh!');
        } catch (err) {
            showMessage('Thao tác thất bại', 'error');
        } finally {
            setActionLoading(null);
            setSearchTerm('');
        }
    };

    const enrolledIds = classData?.students?.map(s => s._id) || [];
    const availableStudents = allUsers.filter(
        s => s.role === 'student' && !enrolledIds.includes(s._id) &&
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-500">Đang tải...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('..')} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Lớp {classData.className}</h1>
                        <p className="text-sm text-gray-500 font-medium">GV: {classData.teacher?.name} · Phòng: {classData.room || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                        <>
                            <button onClick={() => setShowSessionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-sm shadow-lg shadow-indigo-200"><Plus size={18} /> Tạo lịch</button>
                            <button onClick={() => setShowAssignmentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition font-bold text-sm shadow-lg shadow-pink-200"><FileText size={18} /> Giao bài</button>
                        </>
                    )}
                    <button onClick={() => navigate('grades')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition font-bold text-sm shadow-lg shadow-amber-200"><BookOpen size={18} /> Bảng điểm</button>
                </div>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-bold animate-in slide-in-from-top-4 border-l-4 ${message.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 gap-8">
                {[
                    { id: 'sessions', label: 'Lịch học', icon: Clock },
                    { id: 'assignments', label: 'Bài tập', icon: FileText },
                    { id: 'students', label: 'Học sinh', icon: Users },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-bold text-sm transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'sessions' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessions.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-400">
                                    <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Chưa có buổi học nào</p>
                                </div>
                            ) : (
                                sessions.map(session => (
                                    <div key={session._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{session.subject?.name}</span>
                                            <span className="text-xs text-gray-400 font-bold">{new Date(session.date).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <p className="text-lg font-black text-gray-800">{session.startTime} - {session.endTime}</p>
                                        <p className="text-xs text-gray-500 font-medium mb-4">GV: {session.teacher?.name}</p>
                                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                                            <button
                                                onClick={() => navigate(`/teacher/attendance/${session._id}`)}
                                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${session.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                            >
                                                {session.status === 'completed' ? 'Xem điểm danh' : 'Điểm danh'}
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
                        <div className="space-y-4">
                            {assignments.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Chưa có bài tập nào được giao</p>
                                </div>
                            ) : (
                                assignments.map(assignment => (
                                    <div key={assignment._id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600"><FileText size={24} /></div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{assignment.title}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1 mb-2">{assignment.description}</p>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                                        <Clock size={12} /> Hạn: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        {assignment.points} điểm
                                                    </span>
                                                </div>
                                                
                                                {/* Hiển thị tài liệu đính kèm từ giáo viên */}
                                                {assignment.attachments?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {assignment.attachments.map((file, idx) => (
                                                            <a 
                                                                key={idx} 
                                                                href={file.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
                                                            >
                                                                <FileText size={12} />
                                                                <span className="max-w-[120px] truncate">{file.name}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {user?.role === 'student' && (
                                                <button 
                                                    onClick={() => { setSelectedAssignment(assignment); setShowSubmitModal(true); }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
                                                >
                                                    Nộp bài
                                                </button>
                                            )}
                                            {(user?.role === 'teacher' || user?.role === 'admin') && (
                                                <>
                                                    <button 
                                                        onClick={() => viewSubmissions(assignment)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
                                                    >
                                                        <Eye size={16} /> Bản nộp
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteAssignment(assignment._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-black text-gray-800">Danh sách lớp ({enrolledIds.length})</h3>
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                                {classData.students.map(student => (
                                    <div key={student._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                                        <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm">{student.name.charAt(0)}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-400">{student.email}</p>
                                        </div>
                                        {user?.role === 'admin' && (
                                            <button onClick={() => handleManageStudent(student._id, 'remove')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><UserMinus size={18} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-50">
                                    <h3 className="font-black text-gray-800">Thêm học sinh</h3>
                                    <div className="mt-4 relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={searchTerm} 
                                            onChange={(e) => setSearchTerm(e.target.value)} 
                                            placeholder="Tìm tên hoặc email..." 
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                                    {availableStudents.map(student => (
                                        <div key={student._id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                                            <div className="h-10 w-10 rounded-2xl bg-green-100 text-green-700 font-black flex items-center justify-center text-sm">{student.name.charAt(0)}</div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-400">{student.email}</p>
                                            </div>
                                            <button onClick={() => handleManageStudent(student._id, 'add')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">Thêm</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAssignmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black">Giao bài tập mới</h3>
                            <button onClick={() => setShowAssignmentModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateAssignment} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tiêu đề bài tập</label>
                                    <input required value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Yêu cầu/Mô tả</label>
                                    <textarea required rows={3} value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Hạn nộp</label>
                                        <input type="datetime-local" required value={assignmentForm.dueDate} onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Điểm tối đa</label>
                                        <input type="number" required value={assignmentForm.points} onChange={e => setAssignmentForm({...assignmentForm, points: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tài liệu đính kèm</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {assignmentForm.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                                                <FileText size={14} />
                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                <button 
                                                    type="button"
                                                    onClick={() => setAssignmentForm(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idx)}))}
                                                    className="text-indigo-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div 
                                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${assignmentUploading ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200 hover:border-indigo-400'}`}
                                        onClick={() => !assignmentUploading && document.getElementById('assign-file-upload').click()}
                                    >
                                        <input 
                                            id="assign-file-upload" 
                                            type="file" 
                                            className="hidden" 
                                            onChange={handleAssignmentFileUpload}
                                            disabled={assignmentUploading}
                                        />
                                        <div className="flex items-center justify-center gap-2 text-indigo-600">
                                            {assignmentUploading ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                            ) : <Plus size={18} />}
                                            <span className="text-xs font-black">{assignmentUploading ? 'Đang tải lên...' : 'Thêm tài liệu đính kèm'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button disabled={assignmentUploading || actionLoading === 'create-assignment'} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50">
                                {actionLoading === 'create-assignment' ? 'Đang gửi...' : 'Giao bài ngay'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Nộp bài tập</h3>
                                <p className="text-sm text-gray-500 font-medium">{selectedAssignment?.title}</p>
                            </div>
                            <button onClick={() => setShowSubmitModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
                            <button 
                                onClick={() => setSubmissionType('file')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${submissionType === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                Nộp tệp
                            </button>
                            <button 
                                onClick={() => setSubmissionType('link')}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${submissionType === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                Gửi link
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWork} className="space-y-6">
                            {submissionType === 'file' ? (
                                <div 
                                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-colors cursor-pointer group bg-gray-50 ${submissionFile ? 'border-green-400' : 'border-gray-200 hover:border-indigo-400'}`}
                                    onClick={() => !uploading && document.getElementById('file-upload').click()}
                                >
                                    <input 
                                        id="file-upload" 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                    <div className={`p-4 bg-white rounded-2xl shadow-sm inline-block mb-4 transition-transform ${uploading ? 'animate-bounce' : 'group-hover:scale-110'} ${submissionFile ? 'text-green-500' : 'text-indigo-600'}`}>
                                        {uploading ? <Clock size={32} /> : (submissionFile ? <CheckCircle size={32} /> : <Upload size={32} />)}
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">
                                        {uploading ? 'Đang tải lên...' : (submissionFile ? 'Tải lên hoàn tất!' : 'Nhấn để chọn tệp bài làm')}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {submissionFile ? 'Bạn có thể nhấn lại để thay đổi tệp' : 'Hỗ trợ PDF, DOCX, ZIP, Ảnh'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Liên kết (Google Drive, Github, vv.)</label>
                                    <input 
                                        type="url" 
                                        required 
                                        placeholder="https://..."
                                        value={submissionLink}
                                        onChange={(e) => setSubmissionLink(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    />
                                </div>
                            )}

                            <button 
                                disabled={uploading || actionLoading === 'submit-work' || (submissionType === 'file' ? !submissionFile : !submissionLink)} 
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                            >
                                {actionLoading === 'submit-work' ? 'Đang nộp...' : 'Xác nhận nộp bài'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showViewSubmissionsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Danh sách nộp bài</h3>
                                <p className="text-sm text-gray-500 font-medium">{selectedAssignment?.title}</p>
                            </div>
                            <button onClick={() => setShowViewSubmissionsModal(false)}><X size={24} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {submissions.length === 0 ? (
                                <div className="py-12 text-center text-gray-400">
                                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Chưa có học sinh nào nộp bài</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {submissions.map(sub => (
                                        <div key={sub._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold">{sub.studentId?.name.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{sub.studentId?.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(sub.updatedAt).toLocaleString('vi-VN')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${sub.status === 'late' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {sub.status === 'late' ? 'Nộp muộn' : 'Đã nộp'}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {sub.workFiles.map((file, fIdx) => (
                                                            <a 
                                                                key={fIdx}
                                                                href={file.url} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                title={file.name}
                                                                className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm text-indigo-600 hover:bg-indigo-50 transition"
                                                            >
                                                                {file.type === 'link' ? <Search size={16} /> : <Eye size={16} />}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Session Modal logic remains similar but integrated into new styling */}
            {showSessionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                        <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-2"><Calendar size={22} /> Tạo lịch học</h3>
                            <button onClick={() => setShowSessionModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateSession} className="p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Môn học</label>
                                    <select required className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={sessionForm.subjectId} onChange={e => setSessionForm({...sessionForm, subjectId: e.target.value})}>
                                        <option value="">-- Chọn môn --</option>
                                        {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ngày dạy</label>
                                    <input type="date" required className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Bắt đầu</label>
                                    <input type="time" required className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Kết thúc</label>
                                    <input type="time" required className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={sessionForm.endTime} onChange={e => setSessionForm({...sessionForm, endTime: e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Giáo viên</label>
                                    <select required className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={sessionForm.teacherId} onChange={e => setSessionForm({...sessionForm, teacherId: e.target.value})}>
                                        <option value="">-- Chọn giáo viên --</option>
                                        {allUsers.filter(u => u.role === 'teacher').map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100">Lưu lịch học</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassDetail;
