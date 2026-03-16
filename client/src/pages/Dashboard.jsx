import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    Users as UsersIcon,
    GraduationCap,
    Presentation,
    BellRing,
    Calendar,
    BookOpen,
    ClipboardList,
    TrendingUp,
    Plus
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Component: Admin Dashboard ───────────────────────────────────────────────
const AdminDashboard = ({ stats, announcements }) => {
    const navigate = useNavigate(); // Add this line at the top of AdminDashboard if not present
    const statCards = [
        { title: 'Tổng học sinh', value: stats.students, icon: GraduationCap, color: 'bg-blue-500' },
        { title: 'Tổng giáo viên', value: stats.teachers, icon: Presentation, color: 'bg-green-500' },
        { title: 'Tổng lớp học', value: stats.classes, icon: BookOpen, color: 'bg-purple-500' }
    ];

    const quickActions = [
        { title: 'Đăng thông báo', icon: Plus, link: '/admin/announcements/create', color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Thêm Người Dùng', icon: UsersIcon, link: '/admin/users', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { title: 'Quản lý Lớp học', icon: BookOpen, link: '/admin/classes', color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const chartData = {
        labels: ['Học sinh', 'Giáo viên'],
        datasets: [
            {
                data: [stats.students, stats.teachers],
                backgroundColor: ['#3b82f6', '#22c55e'],
                hoverBackgroundColor: ['#2563eb', '#16a34a'],
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 p-3 rounded-xl ${card.color} shadow-sm`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                                            <dd className="text-2xl font-bold text-gray-900">{card.value}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white p-6 shadow rounded-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ClipboardList size={20} className="text-blue-600" /> Hành động nhanh
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => navigate(action.link)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl ${action.bg} ${action.color} border border-transparent hover:border-current transition-all group`}
                            >
                                <div className="p-3 rounded-full bg-white shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                    <Icon size={24} />
                                </div>
                                <span className="text-sm font-bold">{action.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg border border-gray-100 p-6 flex flex-col h-96">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tỷ lệ Học sinh / Giáo viên</h3>
                    <div className="flex-1 relative w-full h-full flex justify-center items-center pb-4">
                        {stats.students === 0 && stats.teachers === 0 ? (
                            <p className="text-gray-500 text-sm italic">Không có dữ liệu biểu đồ.</p>
                        ) : (
                            <Doughnut data={chartData} options={chartOptions} />
                        )}
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg border border-gray-100 flex flex-col h-96">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <BellRing size={20} className="text-yellow-500" /> Thông báo mới nhất
                        </h3>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        {announcements.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-sm italic">Chưa có thông báo nào.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((ann) => (
                                    <div key={ann._id} className="relative pl-4 overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                                        <h4 className="text-sm font-semibold text-gray-900 truncate">{ann.title}</h4>
                                        <p className="text-xs text-gray-600 line-clamp-2">{ann.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Component: Teacher Dashboard ─────────────────────────────────────────────
const TeacherDashboard = ({ user }) => {
    const [teacherClasses, setTeacherClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            try {
                const res = await api.get('/classes');
                // Filter classes where this teacher is assigned
                const classes = res.data.data.filter(c => c.teacher?._id === user._id);
                setTeacherClasses(classes);
            } catch (error) {
                console.error("Error fetching teacher dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherData();
    }, [user._id]);

    const todayDate = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[todayDate.getDay()];

    const todaySchedule = teacherClasses.flatMap(cls =>
        (cls.schedule || [])
            .filter(s => s.dayOfWeek === currentDay)
            .map(s => ({ ...s, className: cls.className, room: cls.room }))
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (loading) return <div className="text-center py-10 text-gray-500">Đang tải dữ liệu giảng dạy...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lịch dạy hôm nay */}
                <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Calendar size={20} /> Lịch dạy hôm nay ({currentDay})
                        </h3>
                    </div>
                    <div className="p-6">
                        {todaySchedule.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 italic">Hôm nay bạn không có tiết dạy nào.</p>
                        ) : (
                            <div className="space-y-4">
                                {todaySchedule.map((s, idx) => (
                                    <div key={idx} className="flex items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                                        <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded text-sm">
                                            {s.startTime} - {s.endTime}
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-bold text-gray-900">Lớp {s.className}</p>
                                            <p className="text-xs text-gray-500">Phòng {s.room}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Các lớp đang phụ trách */}
                <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-green-500" /> Các lớp đang phụ trách
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{teacherClasses.length} lớp</span>
                    </div>
                    <div className="p-6">
                        {teacherClasses.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 italic">Bạn chưa được phân công lớp nào.</p>
                        ) : (
                            <div className="space-y-6">
                                {teacherClasses.map((cls) => (
                                    <div key={cls._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                            <div>
                                                <p className="text-lg font-extrabold text-gray-900">Lớp {cls.className}</p>
                                                <p className="text-xs text-gray-500">Phòng: {cls.room || '—'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-600">{cls.students?.length || 0} HS</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lịch dạy chi tiết:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cls.schedule && cls.schedule.length > 0 ? (
                                                    cls.schedule.map((s, i) => (
                                                        <span key={i} className="inline-flex flex-col p-2 bg-white border border-gray-200 rounded-lg shadow-sm min-w-[100px]">
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase mb-1">{s.dayOfWeek}</span>
                                                            <span className="text-xs font-medium text-gray-700">{s.startTime} - {s.endTime}</span>
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Chưa thiết lập lịch dạy</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Component: Student Dashboard ─────────────────────────────────────────────
const StudentDashboard = ({ user, announcements }) => {
    const grades = user.studentDetails?.grades || [];
    const gpa = grades.length > 0
        ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
        : '0.00';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* GPA & Statistics */}
                <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Điểm trung bình GPA</p>
                        <p className="text-4xl font-extrabold text-blue-600">{gpa}</p>
                    </div>
                </div>

                <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Số môn đã có điểm</p>
                        <p className="text-4xl font-extrabold text-orange-600">{grades.length}</p>
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            <div className="bg-white shadow rounded-lg border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <BellRing size={20} className="text-yellow-500" /> Thông báo từ lớp & trường
                    </h3>
                </div>
                <div className="p-6">
                    {announcements.length === 0 ? (
                        <p className="text-center text-gray-400 py-10 italic">Không có thông báo mới.</p>
                    ) : (
                        <div className="space-y-6">
                            {announcements.map((ann) => (
                                <div key={ann._id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <h4 className="text-base font-bold text-gray-900 mb-1">{ann.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{ann.content}</p>
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommonData = async () => {
            try {
                // Fetch stats for Admin
                if (user?.role === 'admin') {
                    const usersRes = await api.get('/users');
                    const users = usersRes.data.data;
                    const classRes = await api.get('/classes');

                    setStats({
                        students: users.filter((u) => u.role === 'student').length,
                        teachers: users.filter((u) => u.role === 'teacher').length,
                        classes: classRes.data.data.length
                    });
                }

                // Fetch Announcements (for all)
                const annRes = await api.get('/announcements');
                // Filter announcements by role
                const filteredAnn = annRes.data.data.filter(ann =>
                    ann.targetRole === 'all' || ann.targetRole === user?.role
                ).slice(0, 5);

                setAnnouncements(filteredAnn);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchCommonData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center flex-col items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Đang tải bảng điều khiển...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">Chào mừng trở lại, {user?.name}!</p>
            </header>

            {user?.role === 'admin' && <AdminDashboard stats={stats} announcements={announcements} />}
            {user?.role === 'teacher' && <TeacherDashboard user={user} />}
            {user?.role === 'student' && <StudentDashboard user={user} announcements={announcements} />}
        </div>
    );
};

export default Dashboard;
