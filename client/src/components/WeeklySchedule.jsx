import React, { useState, useEffect, useContext } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, BookOpen, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const WeeklySchedule = ({ fetchEndpoint, title }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const getWeekRange = (date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(start.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return { monday, sunday };
    };

    const { monday, sunday } = getWeekRange(currentDate);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const response = await api.get(`${fetchEndpoint}?startDate=${monday.toISOString()}&endDate=${sunday.toISOString()}`);
                if (response.data.success) {
                    setSessions(response.data.data);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Lỗi khi tải lịch học');
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [currentDate, fetchEndpoint]);

    const navigateWeek = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    const days = [
        { name: 'Thứ 2', date: new Date(monday) },
        { name: 'Thứ 3', date: new Date(new Date(monday).setDate(monday.getDate() + 1)) },
        { name: 'Thứ 4', date: new Date(new Date(monday).setDate(monday.getDate() + 2)) },
        { name: 'Thứ 5', date: new Date(new Date(monday).setDate(monday.getDate() + 3)) },
        { name: 'Thứ 6', date: new Date(new Date(monday).setDate(monday.getDate() + 4)) },
        { name: 'Thứ 7', date: new Date(new Date(monday).setDate(monday.getDate() + 5)) },
        { name: 'Chủ Nhật', date: new Date(new Date(monday).setDate(monday.getDate() + 6)) },
    ];

    const getSessionsForDay = (date) => {
        return sessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate.getUTCDate() === date.getUTCDate() &&
                   sessionDate.getUTCMonth() === date.getUTCMonth() &&
                   sessionDate.getUTCFullYear() === date.getUTCFullYear();
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const formatTime = (time) => time ? time.substring(0, 5) : '';

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
                    <p className="text-gray-500 mt-1">Tuần từ {formatDate(monday)} đến {formatDate(sunday)}</p>
                </div>

                <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => navigateWeek(-1)}
                        className="p-2 hover:bg-gray-50 text-gray-600 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                        Hôm nay
                    </button>
                    <button 
                        onClick={() => navigateWeek(1)}
                        className="p-2 hover:bg-gray-50 text-gray-600 rounded-xl transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-400 font-medium">Đang tải lịch biểu...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {days.map((day, idx) => {
                        const daySessions = getSessionsForDay(day.date);
                        const isToday = new Date().toDateString() === day.date.toDateString();

                        return (
                            <div key={idx} className="flex flex-col min-h-[200px]">
                                <div className={`p-3 rounded-2xl mb-3 text-center transition-all ${
                                    isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600'
                                }`}>
                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-80">{day.name}</p>
                                    <p className="text-xl font-black">{day.date.getDate()}</p>
                                </div>

                                <div className="flex-1 space-y-3">
                                    {daySessions.length === 0 ? (
                                        <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center p-4">
                                            <p className="text-[10px] text-gray-300 font-bold uppercase text-center italic">Trống</p>
                                        </div>
                                    ) : (
                                        daySessions.map((session) => (
                                            <div key={session._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                        {session.subject?.name || 'Môn học'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1">{session.classId?.className}</h4>
                                                
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center text-[11px] text-gray-500">
                                                        <Clock size={12} className="mr-2 text-blue-400" />
                                                        <span className="font-bold">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                                                    </div>
                                                    <div className="flex items-center text-[11px] text-gray-500">
                                                        <MapPin size={12} className="mr-2 text-blue-400" />
                                                        <span className="font-medium">{session.classId?.room || 'Phòng 00'}</span>
                                                    </div>
                                                    <div className="flex items-center text-[11px] text-gray-500">
                                                        <User size={12} className="mr-2 text-blue-400" />
                                                        <span className="line-clamp-1">{session.teacher?.name || 'Giáo viên'}</span>
                                                    </div>
                                                </div>

                                                {currentUser?.role === 'teacher' && (
                                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                                        <Link 
                                                            to={`/${currentUser.role}/classes/${session.classId?._id}/sessions/${session._id}/attendance`}
                                                            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-2 py-1.5 rounded-lg"
                                                        >
                                                            <ClipboardCheck size={14} />
                                                            {session.status === 'completed' ? 'Xem điểm danh' : 'Điểm danh'}
                                                        </Link>
                                                        {session.status === 'completed' && (
                                                            <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter flex items-center">
                                                                <BookOpen size={10} className="mr-1" /> Đã học
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {currentUser?.role !== 'teacher' && session.status === 'completed' && (
                                                    <div className="mt-2 pt-2 border-t border-gray-50 flex items-center text-[9px] font-black text-green-500 uppercase tracking-tighter">
                                                        <BookOpen size={10} className="mr-1" />
                                                        Đã học
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WeeklySchedule;
