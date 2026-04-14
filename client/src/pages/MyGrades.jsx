import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, AlertCircle, Award, Target, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const MyGrades = () => {
    const { user } = useContext(AuthContext);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTerm, setActiveTerm] = useState('Semester 1');

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                // Kiểm tra user id và gọi API
                if (!user || !user._id) return;
                const res = await api.get(`/grades/student/${user._id}`);
                setGrades(res.data.data);
            } catch (err) {
                // Backend trả về 404 nếu chưa có điểm
                if (err.response && err.response.status === 404) {
                    setGrades([]);
                } else {
                    setError('Không thể tải điểm số. Vui lòng thử lại sau.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [user]);

    const filteredGrades = grades.filter(g => g.term === activeTerm);
    
    const calculateGPA = (termGrades) => {
        if (termGrades.length === 0) return 0;
        const validGrades = termGrades.filter(g => g.averageGrade !== null);
        if (validGrades.length === 0) return 0;
        const sum = validGrades.reduce((acc, g) => acc + g.averageGrade, 0);
        return sum / validGrades.length;
    };

    const gpa = calculateGPA(filteredGrades);
    const maxGrade = filteredGrades.length > 0 ? Math.max(...filteredGrades.map(g => g.averageGrade || 0)) : 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium tracking-wide">Đang tải bảng điểm...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <AlertCircle size={40} className="mb-2" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                            <BookOpen size={24} />
                        </div>
                        Kết Quả Học Tập
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Theo dõi và phân tích tiến độ học tập của bạn</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                    {[
                        { id: 'Semester 1', label: 'Học kỳ 1' },
                        { id: 'Semester 2', label: 'Học kỳ 2' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTerm(t.id)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                activeTerm === t.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">GPA Học Kỳ</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h2 className="text-4xl font-black text-gray-900">{gpa ? gpa.toFixed(2) : '-'}</h2>
                        <span className="text-gray-400 font-bold mb-1">/ 10</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <Award size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Điểm cao nhất</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h2 className="text-4xl font-black text-gray-900">{maxGrade ? maxGrade.toFixed(2) : '-'}</h2>
                        <span className="text-gray-400 font-bold mb-1">Max</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <Target size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tổng số môn</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h2 className="text-4xl font-black text-gray-900">{filteredGrades.length}</h2>
                        <span className="text-gray-400 font-bold mb-1">Môn học</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredGrades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Bạn chưa có điểm số nào được cập nhật.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Môn Học</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Miệng</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Giữa Kỳ</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Cuối Kỳ</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">TB Môn</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Giáo Viên</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredGrades.map((grade) => (
                                    <tr key={grade._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6 font-bold text-gray-900">{grade.subject}</td>
                                        <td className="px-8 py-6 text-center font-bold text-gray-600">{grade.oralGrade ?? '-'}</td>
                                        <td className="px-8 py-6 text-center font-bold text-gray-600">{grade.midtermGrade ?? '-'}</td>
                                        <td className="px-8 py-6 text-center font-bold text-gray-600">{grade.finalGrade ?? '-'}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full font-black text-xs ${
                                                (grade.averageGrade || 0) >= 8 ? 'bg-green-50 text-green-600' :
                                                (grade.averageGrade || 0) >= 5 ? 'bg-blue-50 text-blue-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                                {grade.averageGrade ? grade.averageGrade.toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                    {grade.teacher?.name?.charAt(0)}
                                                </div>
                                                <span className="text-[12px] font-medium text-gray-500">{grade.teacher?.name}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyGrades;
