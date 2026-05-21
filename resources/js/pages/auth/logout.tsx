import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import apiClient from '../../lib/api.client';
import toast from '../../lib/toast.util';
import AuthScaffold from './AuthScaffold';

type Errors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [clanName, setClanName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [accepted, setAccepted] = useState(true);
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [created, setCreated] = useState(false);

    const validate = () => {
        const nextErrors: Errors = {};

        if (!name.trim()) {
            nextErrors.name = 'Vui lòng nhập họ và tên.';
        }

        if (!email.trim()) {
            nextErrors.email = 'Vui lòng nhập email.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Email không hợp lệ.';
        }

        if (!password) {
            nextErrors.password = 'Vui lòng nhập mật khẩu.';
        } else if (password.length < 6) {
            nextErrors.password = 'Mật khẩu tối thiểu 6 ký tự.';
        }

        if (confirmPassword !== password) {
            nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        if (!accepted) {
            toast.error('Vui lòng đồng ý điều khoản sử dụng.');
            return;
        }

        setSubmitting(true);

        try {
            const response = await apiClient.post('/nguoi-dung/create', {
                ho_ten: name.trim(),
                email: email.trim(),
                password,
                quyen_han: 'thanh_vien',
            });

            if (response.data?.success) {
                setCreated(true);
                toast.success(response.data.message || 'Tạo tài khoản thành công.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Đăng kí" />
            <AuthScaffold eyebrow="Đăng kí" title="Tạo tài khoản mới" subtitle="Bắt đầu hành trình số hóa dòng họ, quản lý thành viên và kết nối các thế hệ trong một không gian trang trọng.">
                {created ? (
                    <div className="gp-card p-7 text-center">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--jade)_25%,transparent)] bg-[color-mix(in_srgb,var(--jade)_12%,transparent)] text-[var(--jade)]">
                            <CheckIcon />
                        </div>
                        <h2 className="mt-4 font-serif text-[24px] font-semibold">Tài khoản đã được tạo</h2>
                        <p className="mt-2 text-[13.5px] leading-6 text-[var(--ink-soft)]">
                            Bạn có thể đăng nhập bằng email <strong className="text-[var(--ink)]">{email}</strong> để tiếp tục vào không gian gia phả.
                        </p>
                        <button type="button" onClick={() => router.visit('/login')} className="gp-btn gp-btn-primary mt-6 w-full">
                            Đến trang đăng nhập
                            <Icon name="arrow-right" size={16} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <SocialButton label="Google" onClick={handleGoogleLogin} />
                            <SocialButton label="Facebook" />
                        </div>

                        <div className="flex items-center gap-3 text-[12px] text-[var(--ink-faint)]">
                            <span className="h-px flex-1 bg-[var(--line)]" />
                            hoặc đăng kí bằng email
                            <span className="h-px flex-1 bg-[var(--line)]" />
                        </div>

                        <AuthField label="Họ và tên" error={errors.name}>
                            <Icon name="users" size={17} className="text-[var(--ink-mute)]" />
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                placeholder="Nguyễn Văn A"
                                autoComplete="name"
                                autoFocus
                            />
                        </AuthField>

                        <AuthField label="Email" error={errors.email}>
                            <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                placeholder="email@example.com"
                                autoComplete="email"
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
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </AuthField>

                        <AuthField label="Xác nhận mật khẩu" error={errors.confirmPassword}>
                            <Icon name="settings" size={17} className="text-[var(--ink-mute)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                placeholder="Nhập lại mật khẩu"
                                autoComplete="new-password"
                            />
                        </AuthField>

                        <AuthField label="Tên dòng họ (không bắt buộc)">
                            <Icon name="branch" size={17} className="text-[var(--ink-mute)]" />
                            <input
                                value={clanName}
                                onChange={(event) => setClanName(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                placeholder="vd: Họ Nguyễn - Tiên Điền"
                            />
                        </AuthField>

                        <label className="flex cursor-pointer items-start gap-2 text-[12.5px] leading-5 text-[var(--ink-mute)]">
                            <span
                                className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition"
                                style={{
                                    background: accepted ? 'var(--gold)' : 'var(--card)',
                                    borderColor: accepted ? 'var(--gold)' : 'var(--card-border)',
                                }}
                            >
                                <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="sr-only" />
                                {accepted && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                )}
                            </span>
                            Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của Gia Phả.
                        </label>

                        <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-70">
                            {submitting ? (
                                <>
                                    <SpinnerIcon />
                                    Đang tạo tài khoản...
                                </>
                            ) : (
                                <>
                                    Tạo tài khoản
                                    <Icon name="arrow-right" size={16} />
                                </>
                            )}
                        </button>

                        <div className="border-t border-[var(--line)] pt-5 text-center text-[13.5px] text-[var(--ink-mute)]">
                            Đã có tài khoản?{' '}
                            <button type="button" onClick={() => router.visit('/login')} className="font-bold text-[var(--gold)] hover:text-[var(--brown-soft)]">
                                Đăng nhập
                            </button>
                        </div>
                    </form>
                )}
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

function CheckIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
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

