import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import api from '../utils/api';

const CurriculumModal = ({ onClose }) => {
    const [grade, setGrade] = useState(10);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchCurriculum = async (selectedGrade) => {
        setLoading(true);
        try {
            const res = await api.get('/curriculums');
            const curriculums = res.data.data;
            const curriculumForGrade = curriculums.find(c => c.grade === selectedGrade);
            
            if (curriculumForGrade) {
                setSubjects(curriculumForGrade.subjects);
            } else {
                setSubjects([
                    { name: 'Toán', sessionsPerWeek: 4 },
                    { name: 'Văn', sessionsPerWeek: 3 },
                    { name: 'Anh', sessionsPerWeek: 3 },
                    { name: 'Lý', sessionsPerWeek: 2 },
                    { name: 'Hóa', sessionsPerWeek: 2 },
                    { name: 'Sinh', sessionsPerWeek: 1 },
                    { name: 'Sử', sessionsPerWeek: 1 },
                    { name: 'Địa', sessionsPerWeek: 1 },
                    { name: 'GDCD', sessionsPerWeek: 1 },
                    { name: 'Thể dục', sessionsPerWeek: 2 }
                ]);
            }
        } catch (error) {
            console.error("Không thể tải khung chương trình", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurriculum(grade);
    }, [grade]);

    const handleAddSubject = () => {
        setSubjects([...subjects, { name: '', sessionsPerWeek: 1 }]);
    };

    const handleRemoveSubject = (index) => {
        const newSubjects = [...subjects];
        newSubjects.splice(index, 1);
        setSubjects(newSubjects);
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...subjects];
        newSubjects[index][field] = value;
        setSubjects(newSubjects);
    };

    const handleSave = async () => {
        // Validate
        if (subjects.some(s => !s.name.trim() || s.sessionsPerWeek < 1)) {
            alert('Vui lòng điền đầy đủ tên môn học và số tiết hợp lệ (>0)');
            return;
        }

        setSaving(true);
        try {
            await api.post('/curriculums', { grade, subjects });
            alert(`Đã lưu Khung chương trình Khối ${grade} thành công!`);
        } catch (error) {
            console.error("Lỗi khi lưu khung chương trình", error);
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const totalSessions = subjects.reduce((sum, s) => sum + (Number(s.sessionsPerWeek) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Cấu hình Chương trình học</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex gap-4 items-center">
                    <label className="font-medium text-gray-700">Chọn khối:</label>
                    <div className="flex gap-2">
                        {[10, 11, 12].map(g => (
                            <button
                                key={g}
                                onClick={() => setGrade(g)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${grade === g ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
                            >
                                Khối {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : (
                        <>
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="font-semibold text-gray-800">Danh sách Môn học - Khối {grade}</h3>
                                <div className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                                    Tổng: {totalSessions} tiết/tuần
                                </div>
                            </div>
                            
                            {subjects.map((sub, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={sub.name}
                                            onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                                            placeholder="Tên môn (VD: Toán, Hóa...)"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            min="1"
                                            value={sub.sessionsPerWeek}
                                            onChange={(e) => handleSubjectChange(idx, 'sessionsPerWeek', parseInt(e.target.value))}
                                            placeholder="Số tiết"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 w-16">tiết/tuần</span>
                                    <button 
                                        onClick={() => handleRemoveSubject(idx)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <button 
                                onClick={handleAddSubject}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Thêm môn học
                            </button>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                        Đóng
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:bg-blue-400"
                    >
                        <Save size={18} />
                        {saving ? 'Đang lưu...' : 'Lưu Chương Trình'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CurriculumModal;
