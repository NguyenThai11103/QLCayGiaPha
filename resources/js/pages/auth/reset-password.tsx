import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import apiClient from '../../lib/api.client';
import toast from '../../lib/toast.util';
import AuthScaffold from './AuthScaffold';

type Errors = {
    email?: string;
    token?: string;
    password?: string;
    confirmPassword?: string;
};

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setEmail(params.get('email') || '');
        setToken(params.get('token') || '');
    }, []);

    const validate = () => {
        const nextErrors: Errors = {};

        if (!email) {
            nextErrors.email = 'Vui lòng nhập email tài khoản.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Email không hợp lệ.';
        }

        if (!token) {
            nextErrors.token = 'Vui lòng nhập mã xác nhận (OTP).';
        } else if (token.length !== 6 || !/^\d+$/.test(token)) {
            nextErrors.token = 'Mã xác nhận (OTP) phải gồm 6 chữ số.';
        }

        if (!password) {
            nextErrors.password = 'Vui lòng nhập mật khẩu mới.';
        } else if (password.length < 6) {
            nextErrors.password = 'Mật khẩu phải tối thiểu 6 ký tự.';
        }

        if (confirmPassword !== password) {
            nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        if (!email || !token) {
            toast.error('Thông tin khôi phục mật khẩu không hợp lệ hoặc bị thiếu.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await apiClient.post('/auth/reset-password', {
                email,
                token,
                password,
                confirmPassword,
            });

            if (response.data.success) {
                toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
                router.visit('/login');
            } else {
                toast.error(response.data.message || 'Đặt lại mật khẩu thất bại.');
            }
        } catch (error) {
            console.error('Lỗi đặt lại mật khẩu:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Đặt lại mật khẩu" />
            <AuthScaffold eyebrow="Bảo mật" title="Thiết lập mật khẩu mới" subtitle="Nhập mã OTP và mật khẩu mới bên dưới để lấy lại quyền truy cập vào gia phả.">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <AuthField label="Email tài khoản" error={errors.email}>
                        <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)] disabled:opacity-60"
                            placeholder="email@example.com"
                            disabled={!!new URLSearchParams(window.location.search).get('email')}
                        />
                    </AuthField>

                    <AuthField label="Mã xác nhận (OTP)" error={errors.token}>
                        <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type="text"
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="Nhập mã OTP 6 số từ email"
                            maxLength={6}
                            autoFocus={!!new URLSearchParams(window.location.search).get('email')}
                        />
                    </AuthField>

                    <AuthField label="Mật khẩu mới" error={errors.password}>
                        <Icon name="settings" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="Tối thiểu 6 ký tự"
                            autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </AuthField>

                    <AuthField label="Xác nhận mật khẩu mới" error={errors.confirmPassword}>
                        <Icon name="settings" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="Nhập lại mật khẩu mới"
                            autoComplete="new-password"
                        />
                    </AuthField>

                    <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-70">
                        {submitting ? (
                            <>
                                <SpinnerIcon />
                                Đang cập nhật...
                            </>
                        ) : (
                            <>
                                Cập nhật mật khẩu
                                <Icon name="arrow-right" size={16} />
                            </>
                        )}
                    </button>
                </form>
            </AuthScaffold>
        </>
    );
}

function AuthField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold tracking-[0.3px] text-[var(--ink-soft)]">{label}</span>
            <span
                className="flex min-h-12 items-center gap-2.5 rounded-[10px] border bg-[var(--card-soft)] px-3.5 transition focus-within:border-[var(--gold)] focus-within:bg-[var(--card)] focus-within:shadow-[0_0_0_3px_var(--gold-glow)]"
                style={{ borderColor: error ? 'var(--crimson)' : 'var(--card-border)' }}
            >
                {children}
            </span>
            {error && <span className="mt-1.5 block text-[11.5px] text-[var(--crimson)]">{error}</span>}
        </label>
    );
}

function SpinnerIcon() {
    return (
        <svg className="h-[18px] w-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.9 17.9A10.1 10.1 0 0112 20C5 20 1 12 1 12a18.4 18.4 0 015.1-5.9" />
            <path d="M9.9 4.2A8.8 8.8 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.1" />
            <path d="M1 1l22 22" />
            <path d="M14.1 14.1a3 3 0 01-4.2-4.2" />
        </svg>
    );
}
