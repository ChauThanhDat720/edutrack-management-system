import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const CreateAnnouncement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetRole, setTargetRole] = useState('all');

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await api.post('/announcements', { title, content, targetRole });

            // Show success message
            setSuccessMsg('Announcement created successfully! Redirecting...');

            // Redirect to Dashboard after a short delay
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Access Restricted</h2>
                <p className="text-gray-500 mt-2">Only administrators can publish announcements.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Publish Announcement</h1>
                <p className="mt-1 text-sm text-gray-500">Create a new announcement for students or teachers.</p>
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
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Announcement Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                placeholder="e.g. Upcoming Semester Exams"
                            />
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                Detailed Content <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-400 mb-1">Provide clear instructions or information.</p>
                            <textarea
                                id="content"
                                required
                                rows={6}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors resize-y"
                                placeholder="Type the announcement details here..."
                            />
                        </div>

                        <div>
                            <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700">
                                Target Audience
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <select
                                    id="targetRole"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    className="block w-full sm:w-1/2 bg-white border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-medium"
                                >
                                    <option value="all">📢 All Users (Students & Teachers)</option>
                                    <option value="student">🎓 Students Only</option>
                                    <option value="teacher">👨‍🏫 Teachers Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading
                                        ? 'bg-blue-400 cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} className="mr-2" />
                                        Publish Now
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncement;
