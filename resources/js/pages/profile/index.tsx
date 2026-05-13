import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import apiClient from '../../lib/api.client';
import { useAuth } from '../../contexts/auth.context';

export default function ProfileIndex() {
    const { user, checkAuth: refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'telegram'>('general');

    // General Info State
    const [generalForm, setGeneralForm] = useState({
        ho_va_ten: '',
        ten_goi_nho: '',
        so_dien_thoai: '',
        ngay_sinh: '',
        email: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [generalLoading, setGeneralLoading] = useState(false);

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Telegram State
    const [telegramChatId, setTelegramChatId] = useState('');
    const [telegramLoading, setTelegramLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setGeneralForm({
                ho_va_ten: user.ho_va_ten || '',
                ten_goi_nho: user.ten_goi_nho || '',
                so_dien_thoai: user.so_dien_thoai || '',
                ngay_sinh: user.ngay_sinh ? user.ngay_sinh.split('T')[0] : '',
                email: user.email || '',
            });
            setPreviewUrl(user.anh_dai_dien || null);
            setTelegramChatId((user as any).telegram_chat_id || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGeneralSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralLoading(true);
        try {
            const formData = new FormData();
            formData.append('ho_va_ten', generalForm.ho_va_ten);
            formData.append('ten_goi_nho', generalForm.ten_goi_nho || '');
            formData.append('so_dien_thoai', generalForm.so_dien_thoai);
            formData.append('ngay_sinh', generalForm.ngay_sinh);
            formData.append('email', generalForm.email);

            if (avatarFile) {
                formData.append('anh_dai_dien', avatarFile);
            }

            const res = await apiClient.post('/auth/update-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data.success) {
                toast.success('Cập nhật thông tin thành công');
                await refreshUser(); // Reload user context
            }
        } catch (error: any) {
            // Error handling is global, but we can show specific toast if needed
        } finally {
            setGeneralLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        try {
            const res = await apiClient.post('/auth/change-password', passwordForm);
            if (res.data.success) {
                toast.success('Đổi mật khẩu thành công');
                setPasswordForm({
                    current_password: '',
                    password: '',
                    password_confirmation: '',
                });
            }
        } catch (error: any) {
             // Error handled globally
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleTelegramSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTelegramLoading(true);
        try {
            const res = await apiClient.post('/auth/update-telegram', {
                telegram_chat_id: telegramChatId || null,
            });
            if (res.data.success) {
                toast.success('Cập nhật Telegram thành công');
                await refreshUser();
            }
        } catch (error: any) {
            // Error handled globally
        } finally {
            setTelegramLoading(false);
        }
    };

    if (!user) return null;

    return (
        <AuthenticatedLayout>
            <div className="mx-auto max-w-4xl">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">Trang Cá Nhân</h1>

                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                                    activeTab === 'general'
                                        ? 'border-b-2 border-[#059669] text-[#059669]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Thông tin chung
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                                    activeTab === 'security'
                                        ? 'border-b-2 border-[#059669] text-[#059669]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Bảo mật & Mật khẩu
                            </button>
                            <button
                                onClick={() => setActiveTab('telegram')}
                                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                                    activeTab === 'telegram'
                                        ? 'border-b-2 border-[#059669] text-[#059669]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                🔔 Kết nối Telegram
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'general' && (
                            <form onSubmit={handleGeneralSubmit} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                        <input
                                            type="text"
                                            required
                                            value={generalForm.ho_va_ten}
                                            onChange={e => setGeneralForm({ ...generalForm, ho_va_ten: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tên gọi nhớ</label>
                                        <input
                                            type="text"
                                            value={generalForm.ten_goi_nho}
                                            onChange={e => setGeneralForm({ ...generalForm, ten_goi_nho: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={generalForm.email}
                                            onChange={e => setGeneralForm({ ...generalForm, email: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                                        <input
                                            type="text"
                                            required
                                            value={generalForm.so_dien_thoai}
                                            onChange={e => setGeneralForm({ ...generalForm, so_dien_thoai: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                                        <input
                                            type="date"
                                            required
                                            value={generalForm.ngay_sinh}
                                            onChange={e => setGeneralForm({ ...generalForm, ngay_sinh: e.target.value })}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
                                        <div className="flex items-center space-x-4">
                                            {previewUrl && (
                                                <img src={previewUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={generalLoading}
                                        className="rounded-lg bg-[#059669] px-4 py-2 font-medium text-white hover:bg-[#d62b22] disabled:opacity-50"
                                    >
                                        {generalLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.current_password}
                                        onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordForm.password}
                                        onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nhập lại mật khẩu mới</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwordForm.password_confirmation}
                                        onChange={e => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="rounded-lg bg-[#059669] px-4 py-2 font-medium text-white hover:bg-[#d62b22] disabled:opacity-50"
                                    >
                                        {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'telegram' && (
                            <div className="max-w-lg space-y-6">
                                {/* Hướng dẫn */}
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                    <p className="mb-2 font-semibold">Hướng dẫn kết nối Telegram:</p>
                                    <ol className="list-decimal space-y-1 pl-4">
                                        <li>Mở Telegram, tìm bot <strong>@userinfobot</strong></li>
                                        <li>Nhắn <code className="rounded bg-blue-100 px-1">/start</code> — bot sẽ trả về Chat ID của bạn</li>
                                        <li>Tìm và nhắn <code className="rounded bg-blue-100 px-1">/start</code> tới bot HRM của công ty để kích hoạt</li>
                                        <li>Dán Chat ID vào ô bên dưới và lưu lại</li>
                                    </ol>
                                </div>

                                <form onSubmit={handleTelegramSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Telegram Chat ID
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="VD: 123456789"
                                            value={telegramChatId}
                                            onChange={e => setTelegramChatId(e.target.value)}
                                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#059669] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                        />
                                        {telegramChatId && (
                                            <p className="mt-1 text-xs text-green-600">
                                                ✓ Đã liên kết Telegram Chat ID
                                            </p>
                                        )}
                                        {!telegramChatId && (
                                            <p className="mt-1 text-xs text-gray-500">
                                                Để trống nếu muốn hủy liên kết Telegram
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={telegramLoading}
                                            className="rounded-lg bg-[#059669] px-4 py-2 font-medium text-white hover:bg-[#d62b22] disabled:opacity-50"
                                        >
                                            {telegramLoading ? 'Đang lưu...' : 'Lưu Chat ID'}
                                        </button>
                                    </div>
                                </form>

                                {/* Thông báo sẽ nhận */}
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                    <p className="mb-2 font-medium text-gray-700">Bạn sẽ nhận thông báo khi:</p>
                                    <ul className="space-y-1">
                                        <li>📋 Được giao task mới</li>
                                        <li>✅ Task của bạn được hoàn thành (dành cho người giao)</li>
                                        <li>💬 Có bình luận mới trên task</li>
                                        <li>⏰ Task sắp đến deadline (mỗi sáng 8:00)</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
