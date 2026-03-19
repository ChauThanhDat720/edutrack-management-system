import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, LogOut, BookOpen, Plus, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
    const { logout, user } = useContext(AuthContext);

    const getNavLinkClass = ({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`;

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-blue-600">EduManager</h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
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
                    </>
                )}

                {user?.role === 'teacher' && (
                    <>
                        <NavLink to="/teacher/classes" className={getNavLinkClass}>
                            <BookOpen size={20} />
                            <span className="font-medium">Quản lý Lớp học</span>
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
                    </>
                )}

                <NavLink to="/announcements" className={getNavLinkClass}>
                    <Bell size={20} />
                    <span className="font-medium">Announcements</span>
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
