import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import apiClient from '../../lib/api.client';
import { tokenStorage } from '../../lib/token.storage';
import toast from '../../lib/toast.util';

export default function GoogleCallback() {
    const { checkAuth } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (!code) {
                toast.error('Không tìm thấy mã xác thực Google.');
                router.visit('/login');
                return;
            }

            try {
                const response = await apiClient.post('/auth/google/callback', { code });

                if (response.data.success) {
                    const { token: newToken, user: newUser } = response.data.data;

                    // Lưu vào localStorage
                    tokenStorage.setToken(newToken);

                    // Lưu vào cookie cho middleware backend
                    const isHttps = window.location.protocol === 'https:';
                    const secureFlag = isHttps ? '; secure' : '';
                    document.cookie = `auth_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secureFlag}`;

                    // Cập nhật state auth và tải lại thông tin
                    await checkAuth();

                    toast.success('Đăng nhập bằng Google thành công!');
                    router.visit('/gia-pha/dashboard');
                } else {
                    toast.error(response.data.message || 'Đăng nhập Google thất bại.');
                    router.visit('/login');
                }
            } catch (error) {
                console.error('Lỗi callback Google:', error);
                router.visit('/login');
            }
        };

        void handleCallback();
    }, [checkAuth]);

    return (
        <>
            <Head title="Đang xử lý đăng nhập..." />
            <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] text-[var(--ink)]">
                <div className="text-center">
                    {/* Premium loading spinner */}
                    <div className="mx-auto relative flex h-20 w-20 items-center justify-center">
                        <div className="absolute h-16 w-16 animate-ping rounded-full bg-[var(--gold-glow)] opacity-75"></div>
                        <div className="relative h-12 w-12 rounded-full border-t-2 border-b-2 border-[var(--gold)] animate-spin"></div>
                    </div>
                    
                    <h2 className="mt-8 font-serif text-[24px] font-semibold tracking-[0.5px]">Đang kết nối tài khoản Google</h2>
                    <p className="mt-2 text-[14px] text-[var(--ink-mute)]">
                        Hệ thống đang xác thực thông tin và đưa bạn vào không gian gia phả...
                    </p>
                </div>
            </div>
        </>
    );
}
