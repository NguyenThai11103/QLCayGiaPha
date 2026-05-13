import { useState, useRef } from 'react';
import apiClient from '../../lib/api.client';
import toast from '../../lib/toast.util';

interface ImportEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportEmployeeModal({ isOpen, onClose, onSuccess }: ImportEmployeeModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await apiClient.get('/nhan-vien/template', {
                responseType: 'blob',
            });
            
            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'nhan_vien_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download template failed:', error);
            toast.error('Không thể tải file mẫu');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Vui lòng chọn file');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post<any>('/nhan-vien/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                const { imported, skipped } = response.data.data;
                toast.success(`Import thành công! Thêm mới: ${imported}, Bỏ qua: ${skipped}`);
                onSuccess();
                onClose();
                setFile(null);
            }
        } catch (error: any) {
            console.error('Import failed:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi import';
            toast.error(errorMessage);
            
            // Show detailed validation errors if available
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                 error.response.data.errors.forEach((err: string) => toast.error(err));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-md scale-100 transform rounded-2xl bg-white shadow-2xl transition-all duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Nhập nhân viên từ Excel</h3>
                        <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <div className="space-y-4">
                             {/* Template Download */}
                             <div className="rounded-lg bg-blue-50 p-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    Chưa có file mẫu? Tải xuống tại đây để điền thông tin nhân viên.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    ⬇ Tải file mẫu (.xlsx)
                                </button>
                            </div>

                            {/* File Input */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Chọn file Excel</label>
                                <div 
                                    className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:border-[#059669] hover:bg-red-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                    />
                                    <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-gray-600">
                                        {file ? file.name : 'Click để chọn file hoặc kéo thả vào đây'}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">Hỗ trợ: .xlsx, .xls, .csv</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !file}
                                className="flex items-center rounded-lg px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #059669, #10b981)',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tiến hành Import'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
