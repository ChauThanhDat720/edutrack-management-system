import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, Bell, LogOut, BookOpen, Plus, 
    Calendar, Heart, CalendarX, ClipboardCheck, CheckCircle, 
    ShieldAlert, CalendarCheck, ClipboardList, ChevronDown, 
    ChevronRight, Briefcase, GraduationCap, Settings, User
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationList from './NotificationList';

// ─── Sub-component NavGroup ──────────────────────────────────────────────────
const NavGroup = ({ title, icon: Icon, children, id, openGroups, toggleGroup }) => {
    const isOpen = openGroups[id];

    return (
        <div className="space-y-1">
            <button
                onClick={() => toggleGroup(id)}
                className="w-flex flex items-center justify-between w-full px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors group"
            >
                <div className="flex items-center space-x-2">
                    <Icon size={14} className="group-hover:text-blue-500 transition-colors" />
                    <span>{title}</span>
                </div>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isOpen && (
                <div className="space-y-1 ml-2 border-l-2 border-gray-100 pl-2 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

const Sidebar = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Quản lý trạng thái đóng/mở của các nhóm
    const [openGroups, setOpenGroups] = useState({
        training: true,
        system: true,
        teaching: true,
        support: true,
        learning: true,
        personal: true,
        utilities: true
    });

    const toggleGroup = (id) => {
        setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Tự động mở nhóm nếu có link bên trong đang active
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/admin/users') || path.startsWith('/admin/logs') || path.startsWith('/admin/announcements/create')) {
            setOpenGroups(prev => ({ ...prev, system: true }));
        }
        if (path.startsWith('/admin/classes') || path.startsWith('/admin/reschedule') || path.startsWith('/admin/absences') || path.startsWith('/admin/conduct')) {
            setOpenGroups(prev => ({ ...prev, training: true }));
        }
        // ... tương tự cho các role khác nếu cần
    }, [location.pathname]);

    const getNavLinkClass = ({ isActive }) =>
        `flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isActive 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;

    return (
        <aside className="w-68 bg-white border-r border-gray-100 flex flex-col h-full relative z-20">
            <div className="p-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <GraduationCap className="text-white" size={24} />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">EduManager</h2>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar pb-6">
                {/* TRANG CHỦ */}
                <div>
                    <NavLink to="/" className={getNavLinkClass}>
                        <LayoutDashboard size={20} />
                        <span className="font-bold text-sm">Dashboard</span>
                    </NavLink>
                </div>

                {/* MENU CHO ADMIN */}
                {user?.role === 'admin' && (
                    <>
                        <NavGroup title="Đào tạo & Học tập" icon={Briefcase} id="training" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/admin/classes" className={getNavLinkClass}>
                                <BookOpen size={18} />
                                <span className="font-medium text-sm">Quản lý Lớp học</span>
                            </NavLink>
                            <NavLink to="/admin/reschedule" className={getNavLinkClass}>
                                <CalendarCheck size={18} />
                                <span className="font-medium text-sm">Duyệt Dời Buổi</span>
                            </NavLink>
                            <NavLink to="/admin/absences" className={getNavLinkClass}>
                                <ClipboardCheck size={18} />
                                <span className="font-medium text-sm">Duyệt nghỉ phép</span>
                            </NavLink>
                            <NavLink to="/admin/conduct" className={getNavLinkClass}>
                                <ShieldAlert size={18} />
                                <span className="font-medium text-sm">Hạnh kiểm</span>
                            </NavLink>
                        </NavGroup>

                        <NavGroup title="Hệ thống & Nhân sự" icon={Settings} id="system" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/admin/users" className={getNavLinkClass}>
                                <Users size={18} />
                                <span className="font-medium text-sm">Người dùng</span>
                            </NavLink>
                            <NavLink to="/admin/announcements/create" className={getNavLinkClass}>
                                <Plus size={18} />
                                <span className="font-medium text-sm">Đăng thông báo</span>
                            </NavLink>
                            <NavLink to="/admin/logs" className={getNavLinkClass}>
                                <ClipboardList size={18} />
                                <span className="font-medium text-sm">Nhật ký hệ thống</span>
                            </NavLink>
                        </NavGroup>
                    </>
                )}

                {/* MENU CHO GIÁO VIÊN */}
                {user?.role === 'teacher' && (
                    <>
                        <NavGroup title="Giảng dạy" icon={Briefcase} id="teaching" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/teacher/classes" className={getNavLinkClass}>
                                <BookOpen size={18} />
                                <span className="font-medium text-sm">Quản lý Lớp học</span>
                            </NavLink>
                            <NavLink to="/teacher/schedule" className={getNavLinkClass}>
                                <Calendar size={18} />
                                <span className="font-medium text-sm">Lịch dạy</span>
                            </NavLink>
                            <NavLink to="/teacher/reschedule" className={getNavLinkClass}>
                                <CalendarCheck size={18} />
                                <span className="font-medium text-sm">Xin Dời Buổi</span>
                            </NavLink>
                        </NavGroup>

                        <NavGroup title="Hỗ trợ học sinh" icon={Heart} id="support" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/teacher/absences" className={getNavLinkClass}>
                                <ClipboardCheck size={18} />
                                <span className="font-medium text-sm">Duyệt nghỉ phép</span>
                            </NavLink>
                            <NavLink to="/teacher/conduct" className={getNavLinkClass}>
                                <ShieldAlert size={18} />
                                <span className="font-medium text-sm">Hạnh kiểm</span>
                            </NavLink>
                        </NavGroup>
                    </>
                )}

                {/* MENU CHO HỌC SINH */}
                {user?.role === 'student' && (
                    <>
                        <NavGroup title="Học tập" icon={BookOpen} id="learning" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/student/classes" className={getNavLinkClass}>
                                <BookOpen size={18} />
                                <span className="font-medium text-sm">Lớp học của tôi</span>
                            </NavLink>
                            <NavLink to="/student/schedule" className={getNavLinkClass}>
                                <Calendar size={18} />
                                <span className="font-medium text-sm">Lịch học</span>
                            </NavLink>
                            <NavLink to="/student/grades" className={getNavLinkClass}>
                                <CheckCircle size={18} />
                                <span className="font-medium text-sm">Kết quả học tập</span>
                            </NavLink>
                        </NavGroup>

                        <NavGroup title="Cá nhân" icon={User} id="personal" openGroups={openGroups} toggleGroup={toggleGroup}>
                            <NavLink to="/student/absences" className={getNavLinkClass}>
                                <CalendarX size={18} />
                                <span className="font-medium text-sm">Xin nghỉ phép</span>
                            </NavLink>
                            <NavLink to="/student/attendance" className={getNavLinkClass}>
                                <CheckCircle size={18} />
                                <span className="font-medium text-sm">Chuyên cần</span>
                            </NavLink>
                        </NavGroup>
                    </>
                )}

                {/* TIỆN ÍCH CHUNG */}
                <NavGroup title="Cộng đồng & Tiện ích" icon={Bell} id="utilities" openGroups={openGroups} toggleGroup={toggleGroup}>
                    <NavLink to="/announcements" className={getNavLinkClass}>
                        <Bell size={18} />
                        <span className="font-medium text-sm">Thông báo chung</span>
                    </NavLink>
                    <NavLink to="/confessions" className={getNavLinkClass}>
                        <Heart size={18} />
                        <span className="font-medium text-sm">Góc Tâm Sự</span>
                    </NavLink>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium text-sm"
                    >
                        <Bell size={18} />
                        <span>Thông báo của tôi</span>
                    </button>
                </NavGroup>

                {/* NOTIFICATIONS OVERLAY */}
                {showNotifications && (
                    <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
                        <div 
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
                            onClick={() => setShowNotifications(false)}
                        ></div>
                        <div className="relative w-85 h-full ml-68 shadow-2xl overflow-hidden bg-white">
                            <NotificationList onClose={() => setShowNotifications(false)} />
                        </div>
                    </div>
                )}
            </nav>

            {/* USER PROFILE & LOGOUT */}
            <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 truncate">{user?.name}</span>
                        <span className="text-[10px] uppercase font-black text-blue-600 tracking-tighter">{user?.role}</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm active:scale-95"
                >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
