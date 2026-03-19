import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const StudentSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await api.get('/sessions/student/schedule');
                if (response.data.success) {
                    setSchedule(response.data.data);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Lỗi khi tải lịch học');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Lịch Học Của Bạn</h1>
            
            {schedule.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 text-lg">Bạn chưa có lịch học nào.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {schedule.map((session) => (
                        <div key={session._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {session.classId?.className || 'Lớp học không xác định'}
                                    </h3>
                                    <span className="inline-block mt-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                                        {session.status === 'completed' ? 'Đã hoàn thành' : 'Sắp diễn ra'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-600">
                                    <Calendar size={18} className="mr-3 text-blue-500" />
                                    <span>{new Date(session.date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Clock size={18} className="mr-3 text-blue-500" />
                                    <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <MapPin size={18} className="mr-3 text-blue-500" />
                                    <span>{session.classId?.room || 'Chưa xếp phòng'}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <User size={18} className="mr-3 text-blue-500" />
                                    <span>{session.teacher?.name || 'Chưa phân công'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentSchedule;
