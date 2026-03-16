import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Send, CheckCircle } from 'lucide-react';

const Announcements = () => {
    const { user } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetRole, setTargetRole] = useState('all');

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            setAnnouncements(res.data.data);
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.post('/announcements', { title, content, targetRole });
            setSuccessMsg('Announcement created successfully!');
            setTitle('');
            setContent('');
            setTargetRole('all');
            fetchAnnouncements(); // Refresh list
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
            </div>

            {user?.role === 'admin' && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => window.location.href = '/announcements/create'}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700"
                    >
                        + Create Announcement
                    </button>
                </div>
            )}

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-3 mb-4">
                        All Announcements History
                    </h3>
                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <p className="text-sm text-gray-500">No announcements found.</p>
                        ) : (
                            announcements.map((ann) => (
                                <div key={ann._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-md font-semibold text-gray-900">{ann.title}</h4>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                            {ann.targetRole}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                                    <div className="mt-3 text-xs text-gray-400">
                                        Published: {new Date(ann.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Announcements;
