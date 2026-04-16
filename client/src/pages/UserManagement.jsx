import React, { useState, useEffect, useContext } from 'react';
import { Search, Plus, Edit, Trash2, ShieldAlert, X, GraduationCap, Presentation, Mail, Lock } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import ExcelImportButton from '../components/ExcelImportButton';

// ─── Create User Modal ───────────────────────────────────────────────────────
const CreateUserModal = ({ onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        studentDetails: { studentId: '', className: '' },
        teacherDetails: { subject: '' }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'studentId' || name === 'className') {
            setFormData({ ...formData, studentDetails: { ...formData.studentDetails, [name]: value } });
        } else if (name === 'subject') {
            setFormData({ ...formData, teacherDetails: { ...formData.teacherDetails, subject: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/users', formData);
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tạo người dùng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">Tạo Người Dùng Mới</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700 rounded">{error}</div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vai Trò <span className="text-red-500">*</span></label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {['student', 'teacher'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: r })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium capitalize transition-colors ${formData.role === r
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {r === 'student' ? <GraduationCap size={16} /> : <Presentation size={16} />}
                                        {r === 'student' ? 'Học sinh' : 'Giáo viên'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn A"
                                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@school.com"
                                    className="block w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="block w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {formData.role === 'student' ? (
                            <>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã Học Sinh</label>
                                    <input
                                        type="text"
                                        name="studentId"
                                        value={formData.studentDetails.studentId}
                                        onChange={handleChange}
                                        placeholder="HS12345"
                                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lớp Học</label>
                                    <input
                                        type="text"
                                        name="className"
                                        value={formData.studentDetails.className}
                                        onChange={handleChange}
                                        placeholder="Ví dụ: 10A7"
                                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Môn Học Giảng Dạy</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.teacherDetails.subject}
                                    onChange={handleChange}
                                    placeholder="Toán, Lý, Hóa..."
                                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Đang tạo...' : 'Tạo Người Dùng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all'); // 'all', 'teacher', 'student'
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = filterRole === 'all' 
                ? `/users?page=${currentPage}&limit=10` 
                : `/users?role=${filterRole}&page=${currentPage}&limit=10`;
            const res = await api.get(url);
            setUsers(res.data.data);
            if (res.data.totalPages) {
                setTotalPages(res.data.totalPages);
            }
            setErrorMsg('');
        } catch (error) {
            console.error("Failed to fetch users", error);
            setErrorMsg('Could not fetch users. Make sure you have admin rights.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole, currentPage]);

    // Lắng nghe sự kiện đồng bộ từ Socket.io
    useEffect(() => {
        if (socket) {
            socket.on('users_updated', (data) => {
                console.log('[Socket] Users updated:', data.message);
                fetchUsers(); // Tự động load lại danh sách khi có thay đổi từ bất kỳ đâu (Excel import, create, v.v.)
            });

            return () => socket.off('users_updated');
        }
    }, [socket]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;

        try {
            await api.delete(`/users/${id}`);
            setSuccessMsg(`User ${name} deleted successfully.`);
            setUsers(users.filter(u => u._id !== id));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to delete user", error);
            setErrorMsg(error.response?.data?.message || 'Failed to delete user');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    const handleEdit = (id) => {
        alert("Tính năng Sửa đang được phát triển cho ID: " + id);
    };

    // Filter by Search Term locally
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
                <p className="text-gray-500 mt-2">Only administrators can access User Management.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
                    <p className="mt-2 text-sm text-gray-700">Danh sách tất cả người dùng trong hệ thống bao gồm tên, email, vai trò và các hành động quản lý.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                    <ExcelImportButton onImportSuccess={fetchUsers} />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm Người Dùng
                    </button>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                    <p className="text-sm text-green-700">{successMsg}</p>
                </div>
            )}

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['all', 'teacher', 'student'].map((role) => (
                        <button
                            key={role}
                            onClick={() => { setFilterRole(role); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${filterRole === role
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {role === 'all' ? 'Tất cả' : role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* User Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto border-b border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Người dùng / Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vai trò
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center flex-col items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                            Đang tải dữ liệu...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                        Không tìm thấy người dùng phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                u.role === 'teacher' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {u.role === 'admin' ? 'Quản trị' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(u._id)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                title="Sửa"
                                            >
                                                <Edit className="w-5 h-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u._id, u.name)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Xóa"
                                                disabled={u.role === 'admin'}
                                            >
                                                <Trash2 className={`w-5 h-5 inline ${u.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Trang <span className="font-medium text-gray-900">{currentPage}</span> / <span className="font-medium text-gray-900">{totalPages}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 text-sm font-medium rounded-md border ${currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 text-sm font-medium rounded-md border ${currentPage === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200' : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300'}`}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        fetchUsers();
                        setSuccessMsg('Đã tạo người dùng mới thành công!');
                        setTimeout(() => setSuccessMsg(''), 3000);
                    }}
                />
            )}
        </div>
    );
};

export default UserManagement;
