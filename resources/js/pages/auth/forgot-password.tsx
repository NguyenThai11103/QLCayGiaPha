import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import AuthScaffold from './AuthScaffold';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập email.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Email không hợp lệ.');
            return;
        }

        setError('');
        setSubmitting(true);

        window.setTimeout(() => {
            setSubmitting(false);
            setSent(true);
        }, 650);
    };

    return (
        <>
            <Head title="Quên mật khẩu" />
            <AuthScaffold eyebrow="Khôi phục" title="Quên mật khẩu?" subtitle="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu.">
                {sent ? (
                    <div className="gp-card p-7 text-center">
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--jade)_25%,transparent)] bg-[color-mix(in_srgb,var(--jade)_12%,transparent)] text-[var(--jade)]">
                            <CheckIcon />
                        </div>
                        <h2 className="mt-4 font-serif text-[24px] font-semibold">Email đã được gửi</h2>
                        <p className="mt-2 text-[13.5px] leading-6 text-[var(--ink-soft)]">
                            Kiểm tra hộp thư <strong className="text-[var(--ink)]">{email}</strong> để tiếp tục đặt lại mật khẩu. Liên kết sẽ có hiệu lực trong thời gian giới hạn.
                        </p>
                        <button type="button" onClick={() => router.visit('/login')} className="gp-btn gp-btn-primary mt-6 w-full">
                            Quay lại đăng nhập
                            <Icon name="arrow-right" size={16} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <label className="block">
                            <span className="mb-1.5 block text-[12.5px] font-semibold tracking-[0.3px] text-[var(--ink-soft)]">Email</span>
                            <span
                                className="flex min-h-12 items-center gap-2.5 rounded-[10px] border bg-[var(--card-soft)] px-3.5 transition focus-within:border-[var(--gold)] focus-within:bg-[var(--card)] focus-within:shadow-[0_0_0_3px_var(--gold-glow)]"
                                style={{ borderColor: error ? 'var(--crimson)' : 'var(--card-border)' }}
                            >
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
                            </span>
                            {error && <span className="mt-1.5 block text-[11.5px] text-[var(--crimson)]">{error}</span>}
                        </label>

                        <button type="submit" disabled={submitting} className="gp-btn gp-btn-primary min-h-12 w-full text-[15px] disabled:cursor-not-allowed disabled:opacity-70">
                            {submitting ? (
                                <>
                                    <SpinnerIcon />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    Gửi email khôi phục
                                    <Icon name="arrow-right" size={16} />
                                </>
                            )}
                        </button>

                        <button type="button" onClick={() => router.visit('/login')} className="gp-btn gp-btn-ghost w-full">
                            Quay lại đăng nhập
                        </button>
                    </form>
                )}
            </AuthScaffold>
        </>
    );
}

function CheckIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
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
