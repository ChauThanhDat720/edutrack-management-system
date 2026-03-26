import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, AlertCircle, BookOpen } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const GradeManagement = () => {
    const { id: classId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [classData, setClassData] = useState(null);
    const [grades, setGrades] = useState([]);
    const [subject, setSubject] = useState(user?.teacherDetails?.subject || 'Toán');
    const [term, setTerm] = useState('Semester 1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);

    // Form states for editing
    const [editMode, setEditMode] = useState(null); // studentId
    const [editForm, setEditForm] = useState({ oralGrade: '', midtermGrade: '', finalGrade: '' });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch class students
                const classRes = await api.get(`/classes/${classId}`);
                setClassData(classRes.data.data);

                // Fetch grades for this class & subject
                try {
                    const gradeRes = await api.get(`/grades/class/${classId}?subject=${subject}`);
                    setGrades(gradeRes.data.data);
                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        setGrades([]);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId, subject]);

    const handleEdit = (studentId, existingGrade) => {
        setEditMode(studentId);
        if (existingGrade) {
            setEditForm({
                oralGrade: existingGrade.oralGrade ?? '',
                midtermGrade: existingGrade.midtermGrade ?? '',
                finalGrade: existingGrade.finalGrade ?? ''
            });
        } else {
            setEditForm({ oralGrade: '', midtermGrade: '', finalGrade: '' });
        }
    };

    const handleSave = async (studentId) => {
        setSaving(studentId);
        try {
            const body = {
                studentId,
                subject,
                term,
                oralGrade: editForm.oralGrade === '' ? null : Number(editForm.oralGrade),
                midtermGrade: editForm.midtermGrade === '' ? null : Number(editForm.midtermGrade),
                finalGrade: editForm.finalGrade === '' ? null : Number(editForm.finalGrade)
            };
            const res = await api.post('/grades', body);
            
            // Xóa khỏi editMode và reload phần grades
            setEditMode(null);
            const gradeRes = await api.get(`/grades/class/${classId}?subject=${subject}`);
            setGrades(gradeRes.data.data);
        } catch (error) {
            console.error('Lỗi lưu điểm', error);
            alert('Có lỗi xảy ra khi lưu điểm');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-3"></div>
                <p className="text-gray-500">Đang tải danh sách lớp...</p>
            </div>
        );
    }

    if (!classData) {
        return (
            <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-red-500 mb-4 text-opacity-50" />
                <p className="text-red-500 font-semibold mb-2">Không tìm thấy lớp học.</p>
                <button onClick={() => navigate('..')} className="text-blue-500 hover:underline">Quay lại</button>
            </div>
        );
    }

    const students = classData.students || [];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('..')}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Bảng Điểm Lớp {classData.className}
                    </h1>
                    <p className="text-sm text-gray-500">Nhập và quản lý điểm cho học sinh trong lớp</p>
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Môn học</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Học kỳ</label>
                    <select
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="Semester 1">Học kỳ 1</option>
                        <option value="Semester 2">Học kỳ 2</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Học Sinh</th>
                                <th className="px-6 py-4 text-center">Điểm Miệng</th>
                                <th className="px-6 py-4 text-center">Điểm Giữa Kỳ</th>
                                <th className="px-6 py-4 text-center">Điểm Cuối Kỳ</th>
                                <th className="px-6 py-4 text-center w-24">Trung Bình</th>
                                <th className="px-6 py-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-10 text-center text-gray-500">
                                        Lớp học này chưa có học sinh.
                                    </td>
                                </tr>
                            ) : (
                                students.map(student => {
                                    const studentGrade = grades.find(g => g.student._id === student._id);
                                    const isEditing = editMode === student._id;

                                    return (
                                        <tr key={student._id} className="hover:bg-orange-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </td>
                                            
                                            {/* Form Inputs / Text */}
                                            {isEditing ? (
                                                <>
                                                    <td className="px-3 py-4 text-center">
                                                        <input type="number" min="0" max="10" step="0.1" value={editForm.oralGrade} onChange={(e) => setEditForm({...editForm, oralGrade: e.target.value})} className="w-16 px-2 py-1 border rounded text-center" />
                                                    </td>
                                                    <td className="px-3 py-4 text-center">
                                                        <input type="number" min="0" max="10" step="0.1" value={editForm.midtermGrade} onChange={(e) => setEditForm({...editForm, midtermGrade: e.target.value})} className="w-16 px-2 py-1 border rounded text-center" />
                                                    </td>
                                                    <td className="px-3 py-4 text-center">
                                                        <input type="number" min="0" max="10" step="0.1" value={editForm.finalGrade} onChange={(e) => setEditForm({...editForm, finalGrade: e.target.value})} className="w-16 px-2 py-1 border rounded text-center" />
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-400">-</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 text-center">{studentGrade?.oralGrade ?? '-'}</td>
                                                    <td className="px-6 py-4 text-center">{studentGrade?.midtermGrade ?? '-'}</td>
                                                    <td className="px-6 py-4 text-center">{studentGrade?.finalGrade ?? '-'}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-orange-600">
                                                        {studentGrade?.averageGrade ? studentGrade.averageGrade.toFixed(2) : '-'}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-4 text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setEditMode(null)} className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                                        <button 
                                                            onClick={() => handleSave(student._id)} 
                                                            disabled={saving === student._id}
                                                            className="flex items-center gap-1 text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                                                        >
                                                            <Save size={14} /> Lưu
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleEdit(student._id, studentGrade)}
                                                        className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 px-3 py-1.5 rounded-lg ml-auto"
                                                    >
                                                        <Edit2 size={14} />
                                                        {studentGrade ? 'Sửa điểm' : 'Nhập điểm'}
                                                    </button>
                                                )}
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

export default GradeManagement;
