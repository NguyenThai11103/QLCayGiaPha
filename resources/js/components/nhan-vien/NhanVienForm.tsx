import { FormEvent, useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../lib/api.client';
import type { NhanVien, NhanVienFormData } from '../../types/nhan-vien.types';
import toast from '../../lib/toast.util';

interface NhanVienFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NhanVienFormData) => Promise<void>;
    employee?: NhanVien | null;
    title: string;
    isSelf?: boolean;
}

export default function NhanVienForm({ isOpen, onClose, onSubmit, employee, title, isSelf = false }: NhanVienFormProps) {
    const [formData, setFormData] = useState<NhanVienFormData>({
        email: employee?.email || '',
        ho_va_ten: employee?.ho_va_ten || '',
        ten_goi_nho: employee?.ten_goi_nho || '',
        password: '',
        so_dien_thoai: employee?.so_dien_thoai || '',
        ngay_bat_dau_lam: employee?.ngay_bat_dau_lam || '',
        ngay_sinh: employee?.ngay_sinh || '',
        id_quyen: employee?.id_quyen || 1,
        is_master: employee?.is_master || 0,
        is_open: employee?.is_open || 1,
        luong_co_ban: employee?.luong_co_ban || null,
        is_luong_co_ban: employee?.is_luong_co_ban || 0,
    });
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<{ id: number; ten_quyen: string }[]>([]);

    // Fetch permissions on mount
    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await apiClient.get('/phan-quyen');
                if (response.data.success) {
                    setPermissions(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch permissions:', error);
                // toast.error is handled globally
            }
        };
        fetchPermissions();
    }, []);

    // Update form data when employee prop changes
    useEffect(() => {
        if (employee) {
            setFormData({
                email: employee.email,
                ho_va_ten: employee.ho_va_ten,
                ten_goi_nho: employee.ten_goi_nho || '',
                password: '',
                so_dien_thoai: employee.so_dien_thoai,
                ngay_bat_dau_lam: employee.ngay_bat_dau_lam,
                ngay_sinh: employee.ngay_sinh,
                id_quyen: employee.id_quyen,
                is_master: employee.is_master,
                is_open: employee.is_open,
                luong_co_ban: employee.luong_co_ban,
                is_luong_co_ban: employee.is_luong_co_ban,
            });
        }
    }, [employee]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit(formData);
            toast.success(employee ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công');
            onClose();
            // Reset form
            setFormData({
                email: '',
                ho_va_ten: '',
                ten_goi_nho: '',
                password: '',
                so_dien_thoai: '',
                ngay_bat_dau_lam: '',
                ngay_sinh: '',
                id_quyen: 1,
                is_master: 0,
                is_open: 1,
                luong_co_ban: null,
                is_luong_co_ban: 0,
            });
        } catch (err: any) {
            // Error handling is now done globally in api.client.ts
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="email@example.com"
                        />
                    </div>

                    {/* Họ và tên */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.ho_va_ten}
                            onChange={(e) => setFormData({ ...formData, ho_va_ten: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>

                    {/* Tên gọi nhỏ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tên gọi nhỏ</label>
                        <input
                            type="text"
                            value={formData.ten_goi_nho}
                            onChange={(e) => setFormData({ ...formData, ten_goi_nho: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="A"
                        />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.so_dien_thoai}
                            onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="0123456789"
                        />
                    </div>

                    {/* Password - only required for new employee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Mật khẩu {!employee && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="password"
                            required={!employee}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder={employee ? 'Để trống nếu không đổi' : '••••••••'}
                        />
                    </div>

                    {/* Ngày sinh */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Ngày sinh <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.ngay_sinh}
                            onChange={(e) => setFormData({ ...formData, ngay_sinh: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                        />
                    </div>

                    {/* Ngày bắt đầu làm */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Ngày bắt đầu làm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.ngay_bat_dau_lam}
                            onChange={(e) => setFormData({ ...formData, ngay_bat_dau_lam: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                        />
                    </div>

                    {/* ID Quyền */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Quyền <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.id_quyen}
                            onChange={(e) => setFormData({ ...formData, id_quyen: parseInt(e.target.value) })}
                            className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none ${isSelf
                                    ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                                    : 'border-gray-300 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]'
                                }`}
                            disabled={isSelf}
                        >
                            {permissions.length === 0 ? (
                                <option value="">Đang tải...</option>
                            ) : (
                                permissions.map((permission) => (
                                    <option key={permission.id} value={permission.id}>
                                        {permission.ten_quyen}
                                    </option>
                                ))
                            )}
                        </select>
                        {isSelf && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-amber-700">Không thể tự thay đổi quyền của chính mình</p>
                            </div>
                        )}
                    </div>

                    {/* Lương cơ bản */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Lương cơ bản (VND)
                        </label>
                        <input
                            type="number"
                            value={formData.luong_co_ban || ''}
                            onChange={(e) => setFormData({ ...formData, luong_co_ban: e.target.value ? parseInt(e.target.value) : null })}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#059669] focus:ring-2 focus:ring-[#059669] focus:outline-none"
                            placeholder="5000000"
                            disabled={formData.is_luong_co_ban === 0}
                        />
                        <p className="mt-1 text-xs text-gray-500">Để trống nếu tính lương theo buổi</p>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.is_open === 1}
                            onChange={(e) => setFormData({ ...formData, is_open: e.target.checked ? 1 : 0 })}
                            className="h-4 w-4 rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
                        />
                        <span className="text-sm font-medium text-gray-700">Hoạt động</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={formData.is_luong_co_ban === 1}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData({
                                    ...formData,
                                    is_luong_co_ban: checked ? 1 : 0,
                                    luong_co_ban: checked ? formData.luong_co_ban : null
                                });
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
                        />
                        <span className="text-sm font-medium text-gray-700">Có lương cơ bản</span>
                    </label>
                    <label className={`flex items-center space-x-2 ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                            type="checkbox"
                            checked={formData.is_master === 1}
                            onChange={(e) => setFormData({ ...formData, is_master: e.target.checked ? 1 : 0 })}
                            disabled={isSelf}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                        />
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                            Quản trị viên
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                                Master
                            </span>
                        </span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                    >
                        {loading ? 'Đang xử lý...' : employee ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
