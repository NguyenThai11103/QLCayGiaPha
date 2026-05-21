import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import { useAuth } from '../../contexts/auth.context';
import toast from '../../lib/toast.util';
import apiClient from '../../lib/api.client';
import AuthScaffold from './AuthScaffold';

type Errors = {
    email?: string;
    password?: string;
};

export default function Login() {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const nextErrors: Errors = {};

        if (!email.trim()) {
            nextErrors.email = 'Vui lòng nhập email.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Email không hợp lệ.';
        }

        if (!password) {
            nextErrors.password = 'Vui lòng nhập mật khẩu.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleGoogleLogin = async () => {
        try {
            const response = await apiClient.get('/auth/google/url');
            if (response.data.success && response.data.url) {
                window.location.href = response.data.url;
            } else {
                toast.error('Không thể khởi tạo đăng nhập bằng Google.');
            }
        } catch (error) {
            console.error('Lỗi khởi tạo đăng nhập Google:', error);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await login({ email, password });
            toast.success('Đăng nhập thành công!');
            router.visit('/gia-pha/dashboard');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitting = isSubmitting || isLoading;

    return (
        <>
            <Head title="Đăng nhập" />
            <AuthScaffold eyebrow="Đăng nhập" title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục quản lý gia phả, thành viên và lịch giỗ chạp của dòng họ.">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <SocialButton label="Google" onClick={handleGoogleLogin} />
                        <SocialButton label="Facebook" />
                    </div>

                    <div className="flex items-center gap-3 text-[12px] text-[var(--ink-faint)]">
                        <span className="h-px flex-1 bg-[var(--line)]" />
                        hoặc đăng nhập bằng email
                        <span className="h-px flex-1 bg-[var(--line)]" />
                    </div>

                    <AuthField label="Email" error={errors.email}>
                        <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="email@example.com"
                            autoComplete="email"
                            autoFocus
                        />
                    </AuthField>

                    <AuthField label="Mật khẩu" error={errors.password}>
                        <Icon name="settings" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="Tối thiểu 6 ký tự"
                            autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </AuthField>

                    <div className="flex items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-soft)]">
                            <span
                                className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition"
                                style={{
                                    background: rememberMe ? 'var(--gold)' : 'var(--card)',
                                    borderColor: rememberMe ? 'var(--gold)' : 'var(--card-border)',
                                }}
                            >
                                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="sr-only" />
                                {rememberMe && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                )}
                            </span>
                            Ghi nhớ đăng nhập
                        </label>
                        <button type="button" onClick={() => router.visit('/forgot-password')} className="text-[13px] font-semibold text-[var(--gold)] hover:text-[var(--brown-soft)]">
                            Quên mật khẩu?
                        </button>
                    </div>

                    <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-70">
                        {submitting ? (
                            <>
                                <SpinnerIcon />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Đăng nhập
                                <Icon name="arrow-right" size={16} />
                            </>
                        )}
                    </button>

                    <div className="border-t border-[var(--line)] pt-5 text-center text-[13.5px] text-[var(--ink-mute)]">
                        Chưa có tài khoản?{' '}
                        <button type="button" onClick={() => router.visit('/register')} className="font-bold text-[var(--gold)] hover:text-[var(--brown-soft)]">
                            Đăng kí ngay
                        </button>
                    </div>
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

function SocialButton({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
        <button type="button" onClick={onClick} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[var(--card-border)] bg-[var(--card)] px-4 text-[13px] font-semibold text-[var(--ink)] transition hover:-translate-y-px hover:border-[var(--gold)] hover:shadow-[var(--shadow-md)]">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--gold-glow)] text-[10px] font-bold text-[var(--gold)]">{label.charAt(0)}</span>
            {label}
        </button>
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
