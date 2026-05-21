import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth.context';
import apiClient from '../../lib/api.client';
import { tokenStorage } from '../../lib/token.storage';
import toast from '../../lib/toast.util';

export default function GoogleCallback() {
    const { checkAuth } = useAuth();
    const [showOtpForm, setShowOtpForm] = useState(false);
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Đang kết nối tài khoản Google...');

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
                    if (response.data.need_otp) {
                        setEmail(response.data.email);
                        setShowOtpForm(true);
                        return;
                    }

                    const { token: newToken } = response.data.data;

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

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) {
            toast.error('Vui lòng nhập đủ 6 chữ số của mã OTP.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.post('/auth/google/verify-otp', {
                email,
                token: otpCode,
            });

            if (response.data.success) {
                const { token: newToken } = response.data.data;

                // Lưu vào localStorage
                tokenStorage.setToken(newToken);

                // Lưu vào cookie cho middleware backend
                const isHttps = window.location.protocol === 'https:';
                const secureFlag = isHttps ? '; secure' : '';
                document.cookie = `auth_token=${newToken}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax${secureFlag}`;

                // Cập nhật state auth và tải lại thông tin
                await checkAuth();

                toast.success('Xác nhận OTP thành công! Đăng nhập thành công.');
                router.visit('/gia-pha/dashboard');
            } else {
                toast.error(response.data.message || 'Mã OTP không chính xác.');
            }
        } catch (error) {
            console.error('Lỗi xác thực OTP:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) {
            toast.error('Không tìm thấy mã xác thực Google cũ, vui lòng đăng nhập lại.');
            router.visit('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiClient.post('/auth/google/callback', { code });
            if (response.data.success && response.data.need_otp) {
                toast.success('Mã OTP mới đã được gửi về hòm thư của bạn.');
                setOtpCode('');
            } else {
                toast.error('Gửi lại mã OTP thất bại.');
            }
        } catch (error) {
            console.error('Lỗi gửi lại mã OTP:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showOtpForm) {
        return (
            <>
                <Head title="Xác minh OTP - 2FA" />
                <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--ink)]">
                    <div className="w-full max-w-[440px] rounded-[20px] border border-[var(--card-border)] bg-[var(--card)] p-8 shadow-[var(--shadow-xl)] transition-all">
                        <div className="text-center">
                            {/* Shield Lock SVG Icon */}
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold-glow)] text-[var(--gold)]">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="M12 8v4" />
                                    <path d="M12 16h.01" />
                                </svg>
                            </div>

                            <h2 className="mt-6 font-serif text-[24px] font-semibold tracking-[0.5px]">Xác minh bảo mật (2FA)</h2>
                            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                                Một mã xác thực gồm 6 chữ số đã được gửi tới email:
                                <br />
                                <strong className="mt-1 inline-block text-[var(--gold)] font-medium">{email}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
                            <div>
                                <label className="mb-2 block text-[12.5px] font-semibold uppercase tracking-[1px] text-[var(--ink-mute)]">
                                    Mã xác nhận (OTP)
                                </label>
                                <div className="relative flex items-center rounded-[12px] border border-[var(--card-border)] bg-[var(--card-soft)] px-4 py-3 transition-all focus-within:border-[var(--gold)] focus-within:bg-[var(--card)] focus-within:shadow-[0_0_0_3px_var(--gold-glow)]">
                                    <svg className="mr-3 text-[var(--ink-mute)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="******"
                                        className="w-full bg-transparent font-mono text-[20px] font-bold tracking-[0.5em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || otpCode.length !== 6}
                                className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                                        </svg>
                                        Đang xác nhận...
                                    </>
                                ) : (
                                    'Xác nhận đăng nhập'
                                )}
                            </button>

                            <div className="flex items-center justify-between border-t border-[var(--line)] pt-5 text-[13px]">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isSubmitting}
                                    className="font-medium text-[var(--gold)] transition hover:text-[var(--brown-soft)] disabled:opacity-50"
                                >
                                    Gửi lại mã OTP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.visit('/login')}
                                    className="font-medium text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
                                >
                                    Quay lại đăng nhập
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </>
        );
    }

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

                    <h2 className="mt-8 font-serif text-[24px] font-semibold tracking-[0.5px]">{statusMessage}</h2>
                    <p className="mt-2 text-[14px] text-[var(--ink-mute)]">
                        Hệ thống đang xác thực thông tin và đưa bạn vào không gian gia phả...
                    </p>
                </div>
            </div>
        </>
    );
}
