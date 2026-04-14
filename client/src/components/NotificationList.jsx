import { Bell, Check, Clock, X } from 'lucide-react';
import notificationService from '../utils/notificationService';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';

const NotificationList = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const socket = useContext(SocketContext);

    const fetchNotifications = async () => {
        try {
            const res = await notificationService.getMyNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (socket) {
            socket.on('new_notification', (newNotif) => {
                // Thêm thông báo mới vào đầu danh sách
                setNotifications(prev => [newNotif, ...prev]);
            });

            return () => {
                socket.off('new_notification');
            };
        }
    }, [socket]);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-100 animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <Bell size={18} className="text-blue-600" />
                    <h3 className="font-bold text-blue-900">Thông báo</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        Đang tải...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Không có thông báo nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div 
                                key={notif._id} 
                                className={`p-4 hover:bg-gray-50 transition-colors relative ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                                {!notif.isRead && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full"></div>
                                )}
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold ${!notif.isRead ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {notif.title}
                                    </h4>
                                    {!notif.isRead && (
                                        <button 
                                            onClick={() => handleMarkAsRead(notif._id)}
                                            className="text-blue-500 hover:text-blue-700 p-1"
                                            title="Đánh dấu đã đọc"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                    {notif.message}
                                </p>
                                <div className="flex items-center text-[10px] text-gray-400">
                                    <Clock size={10} className="mr-1" />
                                    {new Date(notif.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <button className="w-full py-3 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition-all">
                    Đánh dấu tất cả là đã đọc
                </button>
            </div>
        </div>
    );
};

export default NotificationList;
