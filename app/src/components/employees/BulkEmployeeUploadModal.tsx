import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { employeesApi } from '../../api/employees';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, ICON_SIZES } from '../../constants/theme';
import { showToast } from '../../utils/toast';

interface BulkEmployeeUploadModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BulkEmployeeUploadModal: React.FC<BulkEmployeeUploadModalProps> = ({
    isVisible,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    const handleFilePick = async () => {
        try {
            const [res] = await pick({
                type: [types.xls, types.xlsx],
                allowMultiSelection: false,
            });
            setSelectedFile(res as any);
            setUploadResult(null); // Clear previous results
        } catch (err: any) {
            if (!err.didCancel) {
                console.log('File pick error', err);
                showToast.error('Error', 'Failed to pick file');
            }
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                showToast.error('Error', 'Authentication token not found');
                return;
            }
            const url = `${API_BASE_URL}/users/template?token=${token}`;

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                showToast.error('Error', 'Cannot open download link');
            }
        } catch (error) {
            console.error('Download error:', error);
            showToast.error('Error', 'Failed to initiate download');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showToast.error('Error', 'Please select a file first');
            return;
        }

        setUploading(true);
        try {
            const response = await employeesApi.uploadBulk(selectedFile);
            setUploadResult(response.data);

            if (response.data.successCount > 0) {
                showToast.success('Success', `Processed ${response.data.totalProcessed} records`);
                // Don't close immediately so user can see results
            } else {
                showToast.error('Warning', 'No records were successfully processed');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Upload failed';
            console.error('Upload error:', error.response?.data || error);
            showToast.error('Error', msg);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (uploadResult?.successCount > 0) {
            onSuccess(); // Trigger refresh on close if success happened
        }
        setSelectedFile(null);
        setUploadResult(null);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Bulk Employee Upload</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* Instructions */}
                        <View style={styles.infoBox}>
                            <View style={styles.infoHeader}>
                                <Icon name="information-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.infoTitle}>Instructions</Text>
                            </View>
                            <Text style={styles.infoText}>1. Download the Excel template below.</Text>
                            <Text style={styles.infoText}>2. Fill in employee details (Name, Age, Gender, ID, Type).</Text>
                            {isSuperAdmin && (
                                <Text style={styles.infoText}>3. For Super Admins, include 'office_id' for each employee.</Text>
                            )}
                            <Text style={styles.infoText}>4. Upload the completed file.</Text>

                            <TouchableOpacity
                                style={styles.downloadLink}
                                onPress={handleDownloadTemplate}
                            >
                                <Icon name="download" size={16} color={COLORS.primary} />
                                <Text style={styles.downloadText}>Download Excel Template</Text>
                            </TouchableOpacity>
                        </View>

                        {/* File Selection */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Excel File</Text>
                            <TouchableOpacity
                                style={styles.fileInput}
                                onPress={handleFilePick}
                            >
                                <Icon name={selectedFile ? "file-excel" : "upload"} size={32} color={COLORS.primary} />
                                <Text style={styles.fileInputText}>
                                    {selectedFile ? selectedFile.name : 'Choose Excel File (.xlsx, .xls)'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Results Display */}
                        {uploadResult && (
                            <View style={styles.resultContainer}>
                                <View style={styles.resultSummary}>
                                    <View style={[styles.resultBadge, { backgroundColor: COLORS.backgroundLight }]}>
                                        <Text style={styles.resultValue}>{uploadResult.totalProcessed}</Text>
                                        <Text style={styles.resultLabel}>Total</Text>
                                    </View>
                                    <View style={[styles.resultBadge, { backgroundColor: '#dcfce7' }]}>
                                        <Text style={[styles.resultValue, { color: '#166534' }]}>{uploadResult.successCount}</Text>
                                        <Text style={[styles.resultLabel, { color: '#166534' }]}>Success</Text>
                                    </View>
                                    <View style={[styles.resultBadge, { backgroundColor: '#fee2e2' }]}>
                                        <Text style={[styles.resultValue, { color: '#991b1b' }]}>{uploadResult.failedCount}</Text>
                                        <Text style={[styles.resultLabel, { color: '#991b1b' }]}>Failed</Text>
                                    </View>
                                </View>

                                {uploadResult.failedRecords?.length > 0 && (
                                    <View style={styles.errorList}>
                                        <Text style={styles.errorTitle}>Failed Records:</Text>
                                        {uploadResult.failedRecords.map((item: any, index: number) => (
                                            <View key={index} style={styles.errorItem}>
                                                <Text style={styles.errorRowInfo}>
                                                    Row {item.row}: {item.data?.name || 'Unknown'}
                                                </Text>
                                                <Text style={styles.errorMessage}>{item.error}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        {uploadResult ? (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelButtonText}>Close</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, styles.submitButton, (!selectedFile || uploading) && styles.disabledButton]}
                                onPress={handleUpload}
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color={COLORS.textWhite} />
                                ) : (
                                    <>
                                        <Icon name="upload" size={20} color={COLORS.textWhite} />
                                        <Text style={styles.submitButtonText}>Upload Employees</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        height: '90%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    scrollContent: {
        flex: 1,
        padding: SPACING.md,
    },
    infoBox: {
        backgroundColor: COLORS.primaryLight + '10', // 10% opacity
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.primaryLight + '30',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    infoTitle: {
        marginLeft: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    infoText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: 4,
        paddingLeft: 4,
    },
    downloadLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryLight + '20',
    },
    downloadText: {
        marginLeft: SPACING.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    formGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    fileInput: {
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.xl,
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    fileInputText: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    resultContainer: {
        marginTop: SPACING.md,
    },
    resultSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    resultBadge: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        marginHorizontal: 4,
    },
    resultValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: 2,
    },
    resultLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
    },
    errorList: {
        backgroundColor: '#fee2e2',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
    },
    errorTitle: {
        color: '#991b1b',
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        marginBottom: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    errorItem: {
        marginBottom: SPACING.sm,
    },
    errorRowInfo: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: 'bold',
        color: '#7f1d1d',
    },
    errorMessage: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: '#b91c1c',
    },
    footer: {
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    button: {
        flexDirection: 'row',
        height: 50,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButton: {
        backgroundColor: COLORS.textSecondary,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: COLORS.textWhite,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    cancelButtonText: {
        color: COLORS.textWhite,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        fontSize: TYPOGRAPHY.fontSize.md,
    },
});

export default BulkEmployeeUploadModal;
