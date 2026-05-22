import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import toast from '../../../lib/toast.util';
import AuthScaffold from '../../auth/AuthScaffold';

type Errors = {
    email?: string;
    password?: string;
};

export default function AdminLogin() {
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await login({ email, password });
            toast.success('Đăng nhập quản trị viên thành công!');
            router.visit('/admin/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Đăng nhập thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitting = isSubmitting || isLoading;

    return (
        <>
            <Head title="Đăng nhập Quản trị viên" />
            <AuthScaffold eyebrow="Hệ thống Quản trị" title="Quản trị viên" subtitle="Đăng nhập với tài khoản System Admin để quản lý các dòng họ trong hệ thống.">
                <form onSubmit={handleSubmit} className="space-y-5">

                    <AuthField label="Email Quản trị" error={errors.email}>
                        <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                            placeholder="admin@example.com"
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
                            placeholder="Mật khẩu admin"
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
                                    background: rememberMe ? 'var(--crimson)' : 'var(--card)',
                                    borderColor: rememberMe ? 'var(--crimson)' : 'var(--card-border)',
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
                    </div>

                    <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-70 bg-[var(--crimson)] hover:bg-[var(--brown)] border-none text-white">
                        {submitting ? (
                            <>
                                <SpinnerIcon />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                Đăng nhập Hệ thống
                                <Icon name="arrow-right" size={16} />
                            </>
                        )}
                    </button>
                    
                    <div className="border-t border-[var(--line)] pt-5 text-center text-[12.5px] text-[var(--ink-mute)]">
                        Hệ thống này chỉ dành cho người được ủy quyền.<br/>Nếu bạn là người dùng, vui lòng truy cập <button type="button" onClick={() => window.location.href = '/login'} className="font-bold text-[var(--gold)] hover:text-[var(--brown-soft)]">trang đăng nhập thường</button>.
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
                className="flex min-h-12 items-center gap-2.5 rounded-[10px] border bg-[var(--card-soft)] px-3.5 transition focus-within:border-[var(--crimson)] focus-within:bg-[var(--card)] focus-within:shadow-[0_0_0_3px_var(--gold-pale)]"
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
