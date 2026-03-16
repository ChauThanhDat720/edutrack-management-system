import React, { useState, useRef } from 'react';
import { Upload, Download, X, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import api from '../utils/api';

/**
 * A reusable Excel import button + result modal.
 * Props:
 *   onImportSuccess: callback called after successful import to refresh parent data.
 */
const ExcelImportButton = ({ onImportSuccess }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null); // null | { created, skipped, errors, message }
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset state
        setError('');
        setResult(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/users/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            setShowResult(true);
            if (onImportSuccess) onImportSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload thất bại. Kiểm tra lại file Excel.');
        } finally {
            setUploading(false);
            // Reset file input so user can upload the same file again
            e.target.value = '';
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await api.get('/users/excel-template', { responseType: 'blob' });
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'student_import_template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Không thể tải file mẫu');
        }
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="excel-upload-input"
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDownloadTemplate}
                    title="Tải file Excel mẫu"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download size={15} />
                    File Mẫu
                </button>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${uploading ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    {uploading ? (
                        <>
                            <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Đang nhập...
                        </>
                    ) : (
                        <>
                            <Upload size={15} />
                            Nhập từ Excel
                        </>
                    )}
                </button>
            </div>

            {/* Inline error */}
            {error && (
                <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {/* Result Modal */}
            {showResult && result && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet size={20} className="text-green-600" />
                                <h2 className="font-bold text-gray-900">Kết Quả Nhập Excel</h2>
                            </div>
                            <button onClick={() => setShowResult(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="px-6 py-4 grid grid-cols-3 gap-4 text-center border-b border-gray-100">
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-green-700">{result.data?.created?.length || 0}</p>
                                <p className="text-xs text-green-600 font-medium mt-0.5">Tạo thành công</p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-yellow-700">{result.data?.skipped?.length || 0}</p>
                                <p className="text-xs text-yellow-600 font-medium mt-0.5">Bỏ qua (trùng)</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-red-700">{result.data?.errors?.length || 0}</p>
                                <p className="text-xs text-red-600 font-medium mt-0.5">Lỗi</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-3">
                            {result.data?.created?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Đã tạo:</p>
                                    {result.data.created.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                            <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                                            <span className="font-medium">{r.name}</span>
                                            <span className="text-gray-400">{r.email}</span>
                                            {r.class && r.class !== 'Không xếp lớp' && <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{r.class}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result.data?.skipped?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">Bỏ qua:</p>
                                    {result.data.skipped.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                            <AlertCircle size={13} className="text-yellow-500 flex-shrink-0" />
                                            <span>{r.name || r.email}</span>
                                            <span className="text-xs text-gray-400 ml-auto">{r.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {result.data?.errors?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Lỗi:</p>
                                    {result.data.errors.map((r, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                            <X size={13} className="text-red-500 flex-shrink-0" />
                                            <span>{r.row}</span>
                                            <span className="text-xs text-gray-400 ml-auto">{r.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowResult(false)}
                                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Xong
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExcelImportButton;
