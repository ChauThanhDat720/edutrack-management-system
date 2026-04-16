import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, 
  Award, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  TrendingDown, 
  TrendingUp, 
  User, 
  Calendar 
} from 'lucide-react';

const ConductManagement = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Data states
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [type, setType] = useState('violation');
  const [content, setContent] = useState('');
  const [pointAdjustment, setPointAdjustment] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, recordsRes] = await Promise.all([
        api.get('/users?role=student&pagination=false'),
        api.get(`/conducts?page=${currentPage}&limit=10`)
      ]);
      setStudents(studentsRes.data.data || []);
      setRecords(recordsRes.data.data || []);
      if (recordsRes.data.totalPages) {
          setTotalPages(recordsRes.data.totalPages);
          setTotalRecords(recordsRes.data.totalDocs || 0);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu hạnh kiểm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const filteredRecords = records.filter(record => {
    const studentName = record.studentId?.name || '';
    const contentText = record.content || '';
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contentText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || record.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !content || !pointAdjustment) {
      return toast.error('Vui lòng điền đủ thông tin');
    }
    try {
      await api.post('/conducts', {
        studentId: selectedStudent,
        type,
        content,
        pointAdjustment: Number(pointAdjustment)
      });
      toast.success('Đã lưu bản ghi hạnh kiểm thành công!');
      setIsModalOpen(false);
      // Reset form
      setSelectedStudent('');
      setContent('');
      setPointAdjustment('');
      // Reload records to reflect changes
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-gray-500 text-sm">Đang tải dữ liệu hạnh kiểm...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản lý Hạnh kiểm</h1>
          <p className="text-gray-500 mt-1">Theo dõi và ghi nhận điểm hạnh kiểm của học sinh.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 font-medium"
          >
            <Plus size={20} />
            Ghi nhận Hạnh kiểm
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <User size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng số lượt ghi nhận</p>
            <p className="text-2xl font-bold text-gray-900">{totalRecords || records.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Vi phạm Kỷ luật</p>
            <p className="text-2xl font-bold text-gray-900">
              {records.filter(r => r.type === 'violation').length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Khen thưởng</p>
            <p className="text-2xl font-bold text-gray-900">
              {records.filter(r => r.type === 'reward').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm học sinh hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex bg-gray-100/80 p-1 rounded-xl w-full md:w-auto">
          {['all', 'violation', 'reward'].map((t) => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setCurrentPage(1); }}
              className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === t 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'all' ? 'Tất cả' : t === 'violation' ? 'Vi phạm' : 'Khen thưởng'}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Học sinh</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium">Nội dung</th>
                <th className="px-6 py-4 font-medium">Điểm</th>
                <th className="px-6 py-4 font-medium">Người ghi nhận</th>
                <th className="px-6 py-4 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                          {record.studentId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{record.studentId?.name || 'Không rõ'}</p>
                          <p className="text-xs text-gray-500">Lớp: {record.studentId?.studentDetails?.class?.className || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        record.type === 'violation' 
                          ? 'bg-red-50 text-red-600 font-medium border border-red-100'
                          : 'bg-green-50 text-green-600 font-medium border border-green-100'
                      }`}>
                        {record.type === 'violation' ? <ShieldAlert size={14} /> : <Award size={14} />}
                        {record.type === 'violation' ? 'Vi phạm' : 'Khen thưởng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700 text-sm line-clamp-2">{record.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${record.pointAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.pointAdjustment > 0 ? '+' : ''}{record.pointAdjustment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Cán bộ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(record.date).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy bản ghi nào.
                  </td>
                </tr>
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

      {/* Modal ghi nhận hạnh kiểm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Thêm Bản ghi Hạnh kiểm</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRecord} className="p-8 space-y-6">
              {/* Type Selection */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setType('violation')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    type === 'violation' 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-500'
                  }`}
                >
                  <ShieldAlert size={18} />
                  <span className="font-semibold text-sm">Vi phạm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('reward')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    type === 'reward' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-100 hover:border-gray-200 text-gray-500'
                  }`}
                >
                  <Award size={18} />
                  <span className="font-semibold text-sm">Khen thưởng</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Học sinh</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                >
                  <option value="">Chọn học sinh...</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name} {student.studentDetails?.class?.className ? `- Lớp ${student.studentDetails.class.className}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-28"
                  placeholder="Mô tả chi tiết sự việc..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điểm cộng/trừ 
                  <span className="text-gray-400 font-normal ml-2">(Tuỳ theo lỗi/thưởng)</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    placeholder="VD: 5 hoặc -5"
                    value={pointAdjustment}
                    onChange={(e) => setPointAdjustment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-gray-600 font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-3 rounded-xl text-white font-medium shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                    type === 'violation' 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/30' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConductManagement;
