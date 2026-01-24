/**
 * Bulk Employee Upload Component
 * Allows admins and super admins to upload employees via Excel file
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { uploadEmployeesExcel, downloadEmployeeTemplate } from '../api/employees';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BulkEmployeeUpload = ({ isOpen, onClose, onSuccess }) => {
    const { isSuperAdmin } = useAuth();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);



    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
            ];
            if (!validTypes.includes(selectedFile.type)) {
                setError('Please upload a valid Excel file (.xlsx or .xls)');
                return;
            }
            // Validate file size (5MB max)
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must not exceed 5MB');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setUploadResult(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await downloadEmployeeTemplate();
        } catch (err) {
            setError('Failed to download template');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const result = await uploadEmployeesExcel(file, null);
            setUploadResult(result.data);
            if (result.data.successCount > 0) {
                onSuccess?.();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setUploadResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-h-screen overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Bulk Employee Upload</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <AlertCircle size={20} />
                            Instructions
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                            <li>Download the Excel template using the button below</li>
                            <li>
                                Fill in employee details (name, age, gender, employee_id, employee_type, date_of_birth
                                {isSuperAdmin() && ', office_id'}
                                )
                            </li>
                            <li>Upload the completed file</li>
                            <li>Review the results and fix any errors if needed</li>
                        </ol>
                    </div>

                    {/* Download Template Button */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download size={20} />
                        Download Excel Template
                    </button>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Upload Excel File
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Upload size={20} />
                                    <span>{file ? file.name : 'Choose Excel file'}</span>
                                </div>
                            </label>
                        </div>
                        {file && (
                            <p className="text-sm text-gray-500">
                                File size: {(file.size / 1024).toFixed(2)} KB
                            </p>
                        )}
                    </div>


                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                            <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Upload Results */}
                    {uploadResult && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-800">
                                        {uploadResult.totalProcessed}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Processed</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {uploadResult.successCount}
                                    </p>
                                    <p className="text-sm text-gray-600">Successful</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {uploadResult.failedCount}
                                    </p>
                                    <p className="text-sm text-gray-600">Failed</p>
                                </div>
                            </div>

                            {/* Success Records */}
                            {uploadResult.successRecords && uploadResult.successRecords.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                        <CheckCircle size={18} />
                                        Successfully Created ({uploadResult.successCount})
                                    </h4>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {uploadResult.successRecords.map((record, index) => (
                                            <div key={index} className="text-sm text-green-800">
                                                • {record.name} ({record.employeeId})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Failed Records */}
                            {uploadResult.failedRecords && uploadResult.failedRecords.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                        <XCircle size={18} />
                                        Failed Records ({uploadResult.failedCount})
                                    </h4>
                                    <div className="max-h-40 overflow-y-auto space-y-2">
                                        {uploadResult.failedRecords.map((record, index) => (
                                            <div key={index} className="text-sm">
                                                <p className="font-medium text-red-800">
                                                    Row {record.row}: {record.data?.name || record.name || 'Unknown'}
                                                </p>
                                                <p className="text-red-600 ml-4">
                                                    {record.error}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Button */}
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
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {uploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Upload Employees
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BulkEmployeeUpload;
