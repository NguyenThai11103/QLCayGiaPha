import { Head, router } from '@inertiajs/react';
import { FormEvent, ReactNode, useState, useEffect } from 'react';
import Icon from '../../components/gia-pha/Icon';
import apiClient from '../../lib/api.client';
import toast from '../../lib/toast.util';
import { familyInvitationApi, FamilyInvitationPreview } from '../../services/gia-pha.api';
import AuthScaffold from './AuthScaffold';

type Errors = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
};

export default function Register() {
    const invitationToken = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('invitation') || ''
        : '';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [accepted, setAccepted] = useState(true);
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [created, setCreated] = useState(false);
    const [invitationPreview, setInvitationPreview] = useState<FamilyInvitationPreview | null>(null);

    // Dòng họ states
    const [availableClans, setAvailableClans] = useState<any[]>([]);
    const [selectedClanId, setSelectedClanId] = useState<number | ''>('');
    const [createNewClan, setCreateNewClan] = useState(false);
    const [newClanName, setNewClanName] = useState('');
    const [newClanAddress, setNewClanAddress] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        apiClient.get('/auth/clans')
            .then(res => {
                if (res.data?.success) {
                    setAvailableClans(res.data.data || []);
                }
            })
            .catch(err => console.error('Lỗi tải danh sách dòng họ:', err));
    }, []);

    useEffect(() => {
        if (!invitationToken) return;

        familyInvitationApi.detail(invitationToken)
            .then((res) => {
                if (!res.success || !res.data) return;

                setInvitationPreview(res.data);
                if (res.data.email) {
                    setEmail(res.data.email);
                }
                if (res.data.thanh_vien?.ho_ten) {
                    setName((current) => current || res.data?.thanh_vien?.ho_ten || '');
                }
            })
            .catch(() => {});
    }, [invitationToken]);

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

        if (!invitationToken && createNewClan && !newClanName.trim()) {
            toast.error('Vui lòng nhập tên dòng họ muốn tạo mới.');
            return false;
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
            const response = await apiClient.post('/auth/register', {
                ho_ten: name.trim(),
                email: email.trim(),
                password,
                invitation_token: invitationToken || undefined,
                dong_ho_id: invitationToken || createNewClan ? undefined : selectedClanId || undefined,
                new_clan_name: invitationToken || !createNewClan ? undefined : newClanName.trim(),
                new_clan_address: invitationToken || !createNewClan ? undefined : newClanAddress.trim(),
            });

            if (response.data?.success) {
                setCreated(true);
                toast.success(response.data.message || 'Tạo tài khoản thành công.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const loginAfterRegisterUrl = invitationToken
        ? `/login?redirect=${encodeURIComponent('/gia-pha/cay-gia-pha')}`
        : '/login';

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
                        <button type="button" onClick={() => router.visit(loginAfterRegisterUrl)} className="gp-btn gp-btn-primary mt-6 w-full">
                            Đến trang đăng nhập
                            <Icon name="arrow-right" size={16} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {invitationToken && invitationPreview && (
                            <div className="rounded-[10px] border border-[var(--gold-pale)] bg-[var(--gold-glow)] px-3.5 py-3 text-[12.5px] leading-5 text-[var(--brown)]">
                                Đăng ký theo lời mời cho <strong>{invitationPreview.thanh_vien?.ho_ten}</strong>
                                {invitationPreview.dong_ho?.ten_dong_ho ? ` - ${invitationPreview.dong_ho.ten_dong_ho}` : ''}.
                            </div>
                        )}
                        {!invitationToken && <div className="grid grid-cols-2 gap-3">
                            <SocialButton label="Google" onClick={handleGoogleLogin} />
                            <SocialButton label="Facebook" />
                        </div>}

                        {!invitationToken && <div className="flex items-center gap-3 text-[12px] text-[var(--ink-faint)]">
                            <span className="h-px flex-1 bg-[var(--line)]" />
                            hoặc đăng kí bằng email
                            <span className="h-px flex-1 bg-[var(--line)]" />
                        </div>}

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

                        <div className={invitationToken ? 'hidden' : 'space-y-3'}>
                            <div className="flex gap-2 p-1 bg-[var(--card-soft)] rounded-xl border border-[var(--card-border)]">
                                <button
                                    type="button"
                                    onClick={() => { setCreateNewClan(false); setSelectedClanId(''); setSearchTerm(''); }}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${!createNewClan ? 'bg-white text-[var(--gold)] shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}
                                >
                                    Chọn dòng họ có sẵn
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setCreateNewClan(true); setSelectedClanId(''); setSearchTerm(''); }}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${createNewClan ? 'bg-white text-[var(--gold)] shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}
                                >
                                    Đăng ký dòng họ mới
                                </button>
                            </div>

                            {!createNewClan ? (
                                <div className="relative">
                                    <AuthField label="Chọn dòng họ từ danh sách">
                                        <Icon name="search" size={17} className="text-[var(--ink-mute)]" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setShowDropdown(true);
                                                setSelectedClanId('');
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                            placeholder="Tìm tên dòng họ... (Ví dụ: Họ Nguyễn)"
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => { setSearchTerm(''); setSelectedClanId(''); }}
                                                className="text-xs text-[var(--ink-mute)] hover:text-[var(--ink)]"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </AuthField>

                                    {showDropdown && (
                                        <div className="absolute z-10 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-white shadow-xl">
                                            {availableClans.filter(c =>
                                                c.ten_dong_ho.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).length > 0 ? (
                                                <ul className="divide-y divide-[var(--line-soft)]">
                                                    {availableClans
                                                        .filter(c => c.ten_dong_ho.toLowerCase().includes(searchTerm.toLowerCase()))
                                                        .map((c) => (
                                                            <li
                                                                key={c.id}
                                                                onClick={() => {
                                                                    setSelectedClanId(c.id);
                                                                    setSearchTerm(c.ten_dong_ho);
                                                                    setShowDropdown(false);
                                                                }}
                                                                className="p-3 cursor-pointer transition hover:bg-[var(--bg-soft)] text-left"
                                                            >
                                                                <div className="text-[13.5px] font-semibold text-[var(--ink)]">{c.ten_dong_ho}</div>
                                                                {c.dia_chi_tu_duong && (
                                                                    <div className="text-[11.5px] text-[var(--ink-mute)] mt-0.5">{c.dia_chi_tu_duong}</div>
                                                                )}
                                                            </li>
                                                        ))}
                                                </ul>
                                            ) : (
                                                <div className="p-4 text-center text-xs text-[var(--ink-mute)]">
                                                    Không tìm thấy dòng họ nào phù hợp.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                                    <AuthField label="Tên dòng họ mới *">
                                        <Icon name="branch" size={17} className="text-[var(--ink-mute)]" />
                                        <input
                                            value={newClanName}
                                            onChange={(event) => setNewClanName(event.target.value)}
                                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                            placeholder="vd: Họ Nguyễn - Tiên Điền"
                                            required
                                        />
                                    </AuthField>

                                    <AuthField label="Địa chỉ từ đường">
                                        <Icon name="link" size={17} className="text-[var(--ink-mute)]" />
                                        <input
                                            value={newClanAddress}
                                            onChange={(event) => setNewClanAddress(event.target.value)}
                                            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
                                            placeholder="vd: Tiên Điền, Nghi Xuân, Hà Tĩnh"
                                        />
                                    </AuthField>
                                </div>
                            )}
                        </div>

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
