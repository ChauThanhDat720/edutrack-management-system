import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const MyGrades = () => {
    const { user } = useContext(AuthContext);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-500 text-sm">Đang tải bảng điểm...</p>
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="text-blue-600" />
                    Kết Quả Học Tập
                </h1>
                <p className="text-sm text-gray-500 mt-1">Xem điểm các môn học của bạn</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {grades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Bạn chưa có điểm số nào được cập nhật.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Môn Học</th>
                                    <th className="px-6 py-4">Học Kỳ</th>
                                    <th className="px-6 py-4 text-center">Điểm Miệng</th>
                                    <th className="px-6 py-4 text-center">Điểm Giữa Kỳ</th>
                                    <th className="px-6 py-4 text-center">Điểm Cuối Kỳ</th>
                                    <th className="px-6 py-4 text-center">Điểm Trung Bình</th>
                                    <th className="px-6 py-4">Giáo Viên</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {grades.map((grade) => (
                                    <tr key={grade._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{grade.subject}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                {grade.term === 'Semester 1' ? 'Học kỳ 1' : 'Học kỳ 2'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{grade.oralGrade ?? '-'}</td>
                                        <td className="px-6 py-4 text-center font-medium">{grade.midtermGrade ?? '-'}</td>
                                        <td className="px-6 py-4 text-center font-medium">{grade.finalGrade ?? '-'}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600">
                                            {grade.averageGrade ? grade.averageGrade.toFixed(2) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{grade.teacher?.name}</td>
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
