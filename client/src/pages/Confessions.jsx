import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
    Heart, 
    MessageCircle, 
    Send, 
    Trash2, 
    Check, 
    X, 
    Plus, 
    Image as ImageIcon,
    Clock,
    User as UserIcon,
    AlertCircle,
    UserCircle
} from 'lucide-react';
import { SocketContext } from '../context/SocketContext';
import toast from 'react-hot-toast';

const Confessions = () => {
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    const [confessions, setConfessions] = useState([]);
    const [pendingConfessions, setPendingConfessions] = useState([]);
    const [activeTab, setActiveTab] = useState('approved');
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);

    // Comment states
    const [commentsByConfession, setCommentsByConfession] = useState({});
    const [showCommentFor, setShowCommentFor] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [postingComment, setPostingComment] = useState(false);

    const fetchConfessions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/confession');
            setConfessions(res.data.data);
        } catch (err) {
            console.error("Failed to fetch confessions", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        if (user?.role !== 'admin') return;
        try {
            const res = await api.get('/confession/pending');
            setPendingConfessions(res.data.data);
        } catch (err) {
            console.error("Failed to fetch pending confessions", err);
        }
    };

    useEffect(() => {
        fetchConfessions();
        if (user?.role === 'admin') {
            fetchPending();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            // Nhận bài viết mới được duyệt
            socket.on('new_approved_confession', (newPost) => {
                setConfessions(prev => {
                    // Tránh duplicate nếu chính mình là người duyệt
                    if (prev.find(p => p._id === newPost._id)) return prev;
                    return [newPost, ...prev];
                });
                toast.success('Có tâm sự mới vừa được đăng!');
            });

            // Nhận cập nhật lượt thích
            socket.on('update_like', ({ confessionId, likes }) => {
                setConfessions(prev => prev.map(p => 
                    p._id === confessionId ? { ...p, likes } : p
                ));
            });

            // Nhận bình luận mới
            socket.on('new_comment', ({ confessionId, comment }) => {
                // Cập nhật danh sách bình luận nếu đang mở
                if (showCommentFor === confessionId) {
                    setCommentsByConfession(prev => ({
                        ...prev,
                        [confessionId]: [comment, ...(prev[confessionId] || [])]
                    }));
                }
                // Bạn có thể thêm logic tăng counter bình luận ở đây nếu có field
            });

            return () => {
                socket.off('new_approved_confession');
                socket.off('update_like');
                socket.off('new_comment');
            };
        }
    }, [socket, showCommentFor]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('isAnonymous', isAnonymous);
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            await api.post('/confession', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Confession đã được gửi và đang chờ duyệt!');
            setShowCreateModal(false);
            setTitle('');
            setContent('');
            setFiles([]);
            setIsAnonymous(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi confession');
        } finally {
            setCreating(false);
        }
    };

    const handleLike = async (id) => {
        try {
            const res = await api.put(`/confession/${id}/like`);
            // Update local state immediately for snappy feel
            setConfessions(prev => prev.map(p => 
                p._id === id ? { ...p, likes: res.data.data } : p
            ));
        } catch (err) {
            console.error("Like failed", err);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await api.put(`/confession/${id}/approve`, { status });
            fetchConfessions();
            fetchPending();
        } catch (err) {
            alert('Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await api.delete(`/confession/${id}`);
            fetchConfessions();
            fetchPending();
        } catch (err) {
            alert('Xóa thất bại');
        }
    };

    const toggleComments = async (confessionId) => {
        if (showCommentFor === confessionId) {
            setShowCommentFor(null);
            return;
        }

        setShowCommentFor(confessionId);
        setLoadingComments(true);
        try {
            const res = await api.get(`/comment/${confessionId}`);
            setCommentsByConfession(prev => ({
                ...prev,
                [confessionId]: res.data.data
            }));
        } catch (err) {
            console.error("Failed to fetch comments", err);
            // If 404, it means no comments, set empty array
            if (err.response?.status === 404) {
                setCommentsByConfession(prev => ({ ...prev, [confessionId]: [] }));
            }
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (confessionId) => {
        if (!newComment.trim()) return;
        setPostingComment(true);
        try {
            const res = await api.post(`/comment/${confessionId}`, { content: newComment });
            setNewComment('');
            // Refresh comments for this confession
            const resComments = await api.get(`/comment/${confessionId}`);
            setCommentsByConfession(prev => ({
                ...prev,
                [confessionId]: resComments.data.data
            }));
        } catch (err) {
            alert('Không thể gửi bình luận');
        } finally {
            setPostingComment(false);
        }
    };

    const handleDeleteComment = async (commentId, confessionId) => {
        if (!window.confirm('Xóa bình luận này?')) return;
        try {
            await api.delete(`/comment/${commentId}`);
            // Force refresh comments
            const resComments = await api.get(`/comment/${confessionId}`);
            setCommentsByConfession(prev => ({
                ...prev,
                [confessionId]: resComments.data.data
            }));
        } catch (err) {
            alert('Xóa thất bại');
        }
    }

    const renderConfessionCard = (item, isPending = false) => (
        <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md mb-6">
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h4 className="text-[15px] font-bold text-gray-900">
                                {item.isAnonymous ? 'Người dùng ẩn danh' : (item.author?.name || 'Thành viên')}
                            </h4>
                            <div className="flex items-center text-[12px] text-gray-400">
                                <Clock size={12} className="mr-1" />
                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                                {!item.isAnonymous && item.author?.role && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] uppercase font-bold">
                                        {item.author.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {isPending && user?.role === 'admin' && (
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => handleApprove(item._id, 'approved')}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Phê duyệt"
                            >
                                <Check size={18} />
                            </button>
                            <button 
                                onClick={() => handleApprove(item._id, 'rejected')}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Từ chối"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                    {!isPending && user?.role === 'admin' && (
                         <button 
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{item.content}</p>

                {item.media && item.media.length > 0 && (
                    <div className={`grid gap-2 mb-4 ${
                        item.media.length === 1 ? 'grid-cols-1' : 
                        item.media.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                        {item.media.map((m, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden bg-gray-100 aspect-video relative">
                                {m.resource_type === 'video' ? (
                                    <video src={m.url} className="w-full h-full object-cover" controls />
                                ) : (
                                    <img src={m.url} alt="confession-media" className="w-full h-full object-cover transition-transform hover:scale-105" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 border-t border-gray-50 flex items-center space-x-6">
                    <button 
                        onClick={() => handleLike(item._id)}
                        className={`flex items-center space-x-2 transition-all duration-300 ${
                            item.likes?.includes(user?.id || user?._id) 
                            ? 'text-pink-500 scale-110' 
                            : 'text-gray-400 hover:text-pink-500'
                        }`}
                    >
                        <Heart size={20} fill={item.likes?.includes(user?.id || user?._id) ? "currentColor" : "none"} />
                         <span className="text-sm font-bold">{item.likes?.length || 0}</span>
                    </button>
                    <button 
                        onClick={() => toggleComments(item._id)}
                        className={`flex items-center space-x-2 transition-colors ${showCommentFor === item._id ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                    >
                        <MessageCircle size={20} />
                        <span className="text-sm font-medium">Bình luận</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showCommentFor === item._id && (
                    <div className="mt-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-4 mb-4">
                            {loadingComments ? (
                                <div className="text-center py-4">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : commentsByConfession[item._id]?.length > 0 ? (
                                commentsByConfession[item._id].map(comment => (
                                    <div key={comment._id} className="flex space-x-3 group">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                            <UserIcon size={14} />
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 relative">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[13px] font-bold text-gray-900">{comment.author?.name}</span>
                                                <span className="text-[11px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                            
                                            {(user?.role === 'admin' || comment.author?._id === user?._id) && (
                                                <button 
                                                    onClick={() => handleDeleteComment(comment._id, item._id)}
                                                    className="absolute -right-8 top-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-400 py-2 italic font-serif">Hãy là người đầu tiên bình luận...</p>
                            )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <UserIcon size={14} />
                            </div>
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Viết bình luận..."
                                    className="w-full bg-gray-50 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none pr-10 transition-all"
                                    onKeyPress={(e) => e.key === 'Enter' && handlePostComment(item._id)}
                                />
                                <button 
                                    disabled={postingComment || !newComment.trim()}
                                    onClick={() => handlePostComment(item._id)}
                                    className={`absolute right-1 top-1 p-1 rounded-full transition-all ${newComment.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-300'}`}
                                >
                                    {postingComment ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Góc Tâm Sự</h1>
                    <p className="text-gray-500 mt-1">Nơi sẻ chia những điều thầm kín...</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all"
                >
                    <Plus size={20} />
                    <span>Đăng Confession</span>
                </button>
            </div>

            {user?.role === 'admin' && (
                <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                    <button 
                        onClick={() => setActiveTab('approved')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'approved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Bảng tin
                    </button>
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all relative ${
                            activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Chờ duyệt
                        {pendingConfessions.length > 0 && (
                            <span className="absolute top-1 right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                                {pendingConfessions.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {activeTab === 'approved' ? (
                    loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-400 font-medium tracking-wide">Đang tải bảng tin...</p>
                        </div>
                    ) : confessions.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Heart className="mx-auto text-gray-200 mb-4" size={48} />
                            <p className="text-gray-400 font-medium italic">Chưa có tâm sự nào được chia sẻ...</p>
                        </div>
                    ) : confessions.map(item => renderConfessionCard(item))
                ) : (
                    pendingConfessions.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Check className="mx-auto text-gray-200 mb-4" size={48} />
                            <p className="text-gray-400 font-medium">Hiện không có yêu cầu nào cần duyệt!</p>
                        </div>
                    ) : pendingConfessions.map(item => renderConfessionCard(item, true))
                )}
            </div>

            {/* Create Modal Overlay */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !creating && setShowCreateModal(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Gửi lời nhắn nhủ</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center space-x-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề ngắn</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Một cái tên thật kêu..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung tâm sự</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[150px]"
                                    placeholder="Hãy nói ra những gì bạn đang nghĩ..."
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <div className={`p-2 rounded-lg ${isAnonymous ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                        <UserCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Đăng bài ẩn danh</p>
                                        <p className="text-[11px] text-gray-500">Tên của bạn sẽ không hiển thị với mọi người</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAnonymous(!isAnonymous)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isAnonymous ? 'bg-blue-600' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Đính kèm phương tiện (tối đa 5)</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <label className="cursor-pointer">
                                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                                            <ImageIcon size={20} />
                                            <span className="text-[10px] mt-1">Thêm</span>
                                        </div>
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*,video/*" 
                                            className="hidden" 
                                            onChange={(e) => setFiles([...files, ...Array.from(e.target.files)])}
                                        />
                                    </label>
                                    {files.map((file, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden group">
                                            <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={creating}
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${
                                    creating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'
                                }`}
                            >
                                {creating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang gửi...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Gửi Confession</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Confessions;
