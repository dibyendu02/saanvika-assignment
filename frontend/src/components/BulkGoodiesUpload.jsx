import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BulkGoodiesUpload = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [goodiesType, setGoodiesType] = useState('');
    const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);

    const isSuperAdmin = user?.role === 'super_admin';

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !goodiesType || !distributionDate) {
            setError('Please fill all fields and select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('goodiesType', goodiesType);
        formData.append('distributionDate', distributionDate);

        try {
            const response = await api.post('/goodies/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Set the upload result immediately
            const resultData = response.data.data;
            setUploadResult(resultData);

            // Call onSuccess if there were any successful distributions
            if (resultData.successCount > 0) {
                onSuccess?.();
            }

            // Show error if all failed
            if (resultData.successCount === 0 && resultData.failedCount > 0) {
                setError('All distributions failed. Please check the errors below.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Upload failed. Please try again.');
            setUploadResult(null);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setUploadResult(null);
        setError(null);
        setGoodiesType('');
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-h-screen overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Bulk Goodies Distribution</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <h3 className="font-semibold flex items-center gap-2 mb-1">
                            <AlertCircle size={18} /> Instructions
                        </h3>
                        <ul className="list-disc list-inside">
                            <li>Sheet should have <strong>employee_id</strong> column.</li>
                            {isSuperAdmin && <li>Super admins must include <strong>office_id</strong> column.</li>}
                            {!isSuperAdmin && <li>Employees must belong to your office ({user?.primaryOfficeId?.name || 'Assigned Office'}).</li>}
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Goodies Type</label>
                            <input
                                type="text"
                                value={goodiesType}
                                onChange={(e) => setGoodiesType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="e.g. Gift Hamper"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Distribution Date</label>
                            <input
                                type="date"
                                value={distributionDate}
                                onChange={(e) => setDistributionDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Excel File</label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500">
                                <input type="file" onChange={handleFileChange} className="hidden" />
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Upload size={20} />
                                    <span>{file ? file.name : 'Choose Excel file'}</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex gap-2">
                            <XCircle size={20} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {uploadResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="font-bold">{uploadResult.totalProcessed}</p>
                                    <p className="text-xs text-gray-500">Processed</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="font-bold text-green-600">{uploadResult.successCount}</p>
                                    <p className="text-xs text-gray-500">Success</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="font-bold text-red-600">{uploadResult.failedCount}</p>
                                    <p className="text-xs text-gray-500">Failed</p>
                                </div>
                            </div>

                            {uploadResult.successCount > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} />
                                        Successful Distributions
                                    </h4>
                                    <div className="space-y-1 text-sm text-green-700">
                                        {uploadResult.successRecords?.map((record, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>• {record.office}</span>
                                                <span className="font-medium">{record.employeeCount} employees</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uploadResult.failedCount > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                        <XCircle size={18} />
                                        Failed Items
                                    </h4>
                                    <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                                        {uploadResult.failedRecords?.map((r, i) => (
                                            <div key={i}>
                                                • {r.row ? `Row ${r.row}` : r.office}: {r.error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {uploadResult ? (
                        <button
                            onClick={handleClose}
                            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
                        >
                            Close
                        </button>
                    ) : (
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                        >
                            {uploading ? 'Uploading...' : 'Upload & Distribute'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BulkGoodiesUpload;
