import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const EditAnnouncement = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetRole, setTargetRole] = useState('all');

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const res = await api.get(`/announcements/${id}`);
                const ann = res.data.data;
                setTitle(ann.title);
                setContent(ann.content);
                setTargetRole(ann.targetRole);
            } catch (err) {
                setErrorMsg('Failed to fetch announcement details');
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncement();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.put(`/announcements/${id}`, { title, content, targetRole });
            setSuccessMsg('Announcement updated successfully!');
            setTimeout(() => {
                navigate('/announcements');
            }, 1500);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to update announcement');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center py-10">Loading announcement...</div>;

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Access Restricted</h2>
                <p className="text-gray-500 mt-2">Only administrators can edit announcements.</p>
                <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Announcement</h1>
                    <p className="mt-1 text-sm text-gray-500">Modify the announcement details below.</p>
                </div>
                <button
                    onClick={() => navigate('/announcements')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                    <ChevronLeft size={16} className="mr-1" /> Back to List
                </button>
            </div>

            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                    {successMsg && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 flex items-center rounded-r-md">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <p className="text-sm font-medium text-green-800">{successMsg}</p>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-center rounded-r-md">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Announcement Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content</label>
                            <textarea
                                required
                                rows={6}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                            <select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="all">📢 All Users</option>
                                <option value="student">🎓 Students Only</option>
                                <option value="teacher">👨‍🏫 Teachers Only</option>
                            </select>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="submit"
                                disabled={updating}
                                className={`inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${updating ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                <Save size={16} className="mr-2" />
                                {updating ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditAnnouncement;
