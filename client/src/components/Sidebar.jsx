import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, LogOut, BookOpen, Plus, Calendar, Heart, CalendarX, ClipboardCheck, CheckCircle, ShieldAlert, CalendarCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationList from './NotificationList';

const Sidebar = () => {
    const { logout, user } = useContext(AuthContext);
    const [showNotifications, setShowNotifications] = useState(false);

    const getNavLinkClass = ({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full relative">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-blue-600">EduManager</h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <NavLink to="/" className={getNavLinkClass}>
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </NavLink>

                {user?.role === 'admin' && (
                    <>
                        <NavLink to="/admin/users" className={getNavLinkClass}>
                            <Users size={20} />
                            <span className="font-medium">Quản lý Người dùng</span>
                        </NavLink>
                        <NavLink to="/admin/classes" className={getNavLinkClass}>
                            <BookOpen size={20} />
                            <span className="font-medium">Quản lý Lớp học</span>
                        </NavLink>
                        <NavLink to="/admin/announcements/create" className={getNavLinkClass}>
                            <Plus size={20} />
                            <span className="font-medium">Đăng thông báo</span>
                        </NavLink>
                        <NavLink to="/admin/absences" className={getNavLinkClass}>
                            <ClipboardCheck size={20} />
                            <span className="font-medium">Duyệt nghỉ phép</span>
                        </NavLink>
                        <NavLink to="/admin/conduct" className={getNavLinkClass}>
                            <ShieldAlert size={20} />
                            <span className="font-medium">Hạnh kiểm</span>
                        </NavLink>
                        <NavLink to="/admin/reschedule" className={getNavLinkClass}>
                            <CalendarCheck size={20} />
                            <span className="font-medium">Duyệt Dời Buổi</span>
                        </NavLink>
                    </>
                )}

                {user?.role === 'teacher' && (
                    <>
                        <NavLink to="/teacher/classes" className={getNavLinkClass}>
                            <BookOpen size={20} />
                            <span className="font-medium">Quản lý Lớp học</span>
                        </NavLink>
                        <NavLink to="/teacher/schedule" className={getNavLinkClass}>
                            <Calendar size={20} />
                            <span className="font-medium">Lịch dạy</span>
                        </NavLink>
                        <NavLink to="/teacher/absences" className={getNavLinkClass}>
                            <ClipboardCheck size={20} />
                            <span className="font-medium">Duyệt nghỉ phép</span>
                        </NavLink>
                        <NavLink to="/teacher/conduct" className={getNavLinkClass}>
                            <ShieldAlert size={20} />
                            <span className="font-medium">Hạnh kiểm</span>
                        </NavLink>
                        <NavLink to="/teacher/reschedule" className={getNavLinkClass}>
                            <CalendarCheck size={20} />
                            <span className="font-medium">Xin Dời Buổi Dạy</span>
                        </NavLink>
                    </>
                )}

                {user?.role === 'student' && (
                    <>
                        <NavLink to="/student/classes" className={getNavLinkClass}>
                            <BookOpen size={20} />
                            <span className="font-medium">Lớp học của tôi</span>
                        </NavLink>
                        <NavLink to="/student/schedule" className={getNavLinkClass}>
                            <Calendar size={20} />
                            <span className="font-medium">Lịch học</span>
                        </NavLink>
                        <NavLink to="/student/grades" className={getNavLinkClass}>
                            <BookOpen size={20} />
                            <span className="font-medium">Kết quả học tập</span>
                        </NavLink>
                        <NavLink to="/student/absences" className={getNavLinkClass}>
                            <CalendarX size={20} />
                            <span className="font-medium">Xin nghỉ phép</span>
                        </NavLink>
                        <NavLink to="/student/attendance" className={getNavLinkClass}>
                            <CheckCircle size={20} />
                            <span className="font-medium">Chuyên cần</span>
                        </NavLink>
                    </>
                )}

                <NavLink to="/announcements" className={getNavLinkClass}>
                    <Bell size={20} />
                    <span className="font-medium">Thông báo chung</span>
                </NavLink>

                <NavLink to="/confessions" className={getNavLinkClass}>
                    <Heart size={20} />
                    <span className="font-medium">Góc Tâm Sự</span>
                </NavLink>

                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors relative"
                >
                    <Bell size={20} />
                    <span className="font-medium">Thông báo của tôi</span>
                </button>
                
                {showNotifications && (
                    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
                        <div 
                            className="absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]" 
                            onClick={() => setShowNotifications(false)}
                        ></div>
                        <div className="relative w-80 h-full ml-64 shadow-2xl overflow-hidden">
                            <NotificationList onClose={() => setShowNotifications(false)} />
                        </div>
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{user?.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{user?.role}</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
