import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/gia-pha/Icon';
import { useAuth } from '../../contexts/auth.context';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import apiClient from '../../lib/api.client';

interface ProfileForm {
    ho_ten: string;
    anh_dai_dien: string;
    tieu_su: string;
}

interface PasswordForm {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

function avatarGrad(name: string): string {
    const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pairs = [
        ['#b8902c', '#5c3a1e'],
        ['#2f5d3a', '#4a7a52'],
        ['#8b2a1f', '#c44535'],
        ['#225b7a', '#3e84a8'],
        ['#8b5a2b', '#a06d3b'],
    ];
    const p = pairs[seed % pairs.length];
    return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

function initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() ?? name.charAt(0).toUpperCase();
}

export default function ProfilePage() {
    const { user, checkAuth } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');
    const [profile, setProfile] = useState<ProfileForm>({ ho_ten: '', anh_dai_dien: '', tieu_su: '' });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [pwForm, setPwForm] = useState<PasswordForm>({ current_password: '', new_password: '', confirm_password: '' });
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setProfile({
                ho_ten: user.ho_va_ten || '',
                anh_dai_dien: user.anh_dai_dien || '',
                tieu_su: ((user as any).tieu_su as string) || '',
            });
            setAvatarFile(null);
            setAvatarPreview('');
        }
    }, [user]);

    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreview('');
            return;
        }

        const objectUrl = URL.createObjectURL(avatarFile);
        setAvatarPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [avatarFile]);

    const showNotice = (type: 'success' | 'error', msg: string) => {
        setNotice({ type, msg });
        setTimeout(() => setNotice(null), 4000);
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            showNotice('error', 'Vui lòng chọn đúng tệp hình ảnh.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showNotice('error', 'Ảnh đại diện không được vượt quá 2MB.');
            return;
        }

        setAvatarFile(file);
    };

    // ─── Cập nhật hồ sơ ───────────────────────────────────────
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.ho_ten.trim()) {
            showNotice('error', 'Họ tên không được để trống.');
            return;
        }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('ho_ten', profile.ho_ten.trim());
            payload.append('anh_dai_dien', avatarFile ? '' : profile.anh_dai_dien);
            payload.append('tieu_su', profile.tieu_su);

            if (avatarFile) {
                payload.append('anh_dai_dien_file', avatarFile);
            }

            const res = await apiClient.post('/auth/profile', payload);
            if (res.data.success) {
                showNotice('success', 'Cập nhật hồ sơ thành công!');
                setAvatarFile(null);
                setAvatarPreview('');
                await checkAuth();
            } else {
                showNotice('error', res.data.message || 'Có lỗi xảy ra.');
            }
        } catch {
            showNotice('error', 'Lỗi kết nối máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    // ─── Đổi mật khẩu ─────────────────────────────────────────
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwForm.current_password || !pwForm.new_password) {
            showNotice('error', 'Vui lòng điền đầy đủ thông tin.');
            return;
        }
        if (pwForm.new_password !== pwForm.confirm_password) {
            showNotice('error', 'Mật khẩu xác nhận không khớp.');
            return;
        }
        if (pwForm.new_password.length < 8) {
            showNotice('error', 'Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }
        setSaving(true);
        try {
            const res = await apiClient.post('/auth/change-password', {
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
            });
            if (res.data.success) {
                showNotice('success', 'Đổi mật khẩu thành công!');
                setPwForm({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                showNotice('error', res.data.message || 'Mật khẩu hiện tại không đúng.');
            }
        } catch {
            showNotice('error', 'Lỗi kết nối máy chủ.');
        } finally {
            setSaving(false);
        }
    };

    const avatarSrc = avatarPreview || profile.anh_dai_dien;
    const displayName = user?.ho_va_ten || 'Người dùng';
    const role = user?.ten_chuc_vu || 'Thành viên';

    const TABS = [
        { key: 'profile', icon: 'users', label: 'Hồ sơ cá nhân' },
        { key: 'password', icon: 'scroll', label: 'Đổi mật khẩu' },
        { key: 'account', icon: 'sparkle', label: 'Tài khoản' },
    ] as const;

    return (
        <AuthenticatedLayout>
            <Head title="Hồ sơ cá nhân" />
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                {/* ─── Profile Hero ──────────────────────── */}
                <div
                    style={{
                        background: 'var(--bg-elev)',
                        borderRadius: 20,
                        border: '1px solid var(--line)',
                        overflow: 'hidden',
                        marginBottom: 24,
                        boxShadow: 'var(--shadow-md)',
                    }}
                >
                    {/* Banner */}
                    <div style={{ height: 96, background: avatarGrad(displayName), position: 'relative' }}>
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                opacity: 0.12,
                                backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)',
                                backgroundSize: '28px 28px',
                            }}
                        />
                    </div>
                    <div
                        style={{
                            padding: '18px 28px 24px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0, flex: '1 1 360px' }}>
                            {/* Avatar */}
                            <div style={{ position: 'relative', marginTop: -56, flexShrink: 0 }}>
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt={displayName}
                                        style={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: '50%',
                                            border: '3px solid var(--bg-elev)',
                                            objectFit: 'cover',
                                            boxShadow: 'var(--shadow-md)',
                                            display: 'block',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: '50%',
                                            border: '3px solid var(--bg-elev)',
                                            background: avatarGrad(displayName),
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontSize: 26,
                                            fontWeight: 700,
                                            color: 'white',
                                            boxShadow: 'var(--shadow-md)',
                                        }}
                                    >
                                        {initials(displayName)}
                                    </div>
                                )}
                            </div>
                            <div style={{ minWidth: 0, paddingTop: 2 }}>
                                <h1
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: 'var(--ink)',
                                        margin: '0 0 5px',
                                        fontFamily: 'Cormorant Garamond, serif',
                                        lineHeight: 1.15,
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {displayName}
                                </h1>
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: 'var(--ink-mute)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        flexWrap: 'wrap',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            background:
                                                user?.is_master === 1 ? 'color-mix(in srgb, var(--gold) 15%, transparent)' : 'var(--card-soft)',
                                            color: user?.is_master === 1 ? 'var(--gold)' : 'var(--ink-mute)',
                                            border: `1px solid ${user?.is_master === 1 ? 'color-mix(in srgb, var(--gold) 25%, transparent)' : 'var(--line)'}`,
                                        }}
                                    >
                                        {role}
                                    </span>
                                    <span style={{ overflowWrap: 'anywhere' }}>{user?.email}</span>
                                </div>
                            </div>
                        </div>

                        {user?.dong_ho && (
                            <div
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 12,
                                    background: 'var(--gold-glow)',
                                    border: '1px solid var(--gold-pale)',
                                    textAlign: 'right',
                                    maxWidth: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: 1.5,
                                        textTransform: 'uppercase',
                                        color: 'var(--gold)',
                                        marginBottom: 2,
                                    }}
                                >
                                    Dòng họ
                                </div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: 'var(--brown)',
                                        fontFamily: 'Cormorant Garamond, serif',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {user.dong_ho.ten_dong_ho}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Notice ────────────────────────────── */}
                {notice && (
                    <div
                        style={{
                            padding: '12px 18px',
                            borderRadius: 12,
                            marginBottom: 16,
                            background:
                                notice.type === 'success'
                                    ? 'color-mix(in srgb, var(--jade) 10%, transparent)'
                                    : 'color-mix(in srgb, var(--crimson) 10%, transparent)',
                            border: `1px solid color-mix(in srgb, var(--${notice.type === 'success' ? 'jade' : 'crimson'}) 25%, transparent)`,
                            color: `var(--${notice.type === 'success' ? 'jade' : 'crimson'})`,
                            fontSize: 13.5,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <Icon name={notice.type === 'success' ? 'sparkle' : 'x'} size={16} />
                        {notice.msg}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
                    {/* ─── Tab Nav ────────────────────────── */}
                    <div
                        style={{
                            background: 'var(--bg-elev)',
                            borderRadius: 16,
                            border: '1px solid var(--line)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {TABS.map((tab) => {
                                const active = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: active ? 'linear-gradient(90deg, var(--gold-glow), transparent)' : 'transparent',
                                            color: active ? 'var(--ink)' : 'var(--ink-soft)',
                                            fontWeight: active ? 700 : 500,
                                            fontSize: 13.5,
                                            fontFamily: 'inherit',
                                            textAlign: 'left',
                                            width: '100%',
                                            transition: 'all 0.15s',
                                            position: 'relative',
                                        }}
                                    >
                                        {active && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 6,
                                                    bottom: 6,
                                                    width: 3,
                                                    borderRadius: '0 4px 4px 0',
                                                    background: 'var(--gold)',
                                                }}
                                            />
                                        )}
                                        <Icon name={tab.icon} size={16} color={active ? 'var(--gold)' : 'var(--ink-mute)'} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── Tab Content ────────────────────── */}
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
                        {/* Tab: Hồ sơ */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <SectionHeader title="Thông tin cá nhân" desc="Cập nhật họ tên và thông tin hiển thị của bạn trong gia phả." />

                                <FormField label="Họ và tên" required>
                                    <input
                                        value={profile.ho_ten}
                                        onChange={(e) => setProfile((p) => ({ ...p, ho_ten: e.target.value }))}
                                        className="gp-input"
                                        placeholder="Nguyễn Văn A"
                                        required
                                    />
                                </FormField>

                                <FormField label="URL ảnh đại diện">
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                        <button type="button" className="gp-btn gp-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                                            <Icon name="camera" size={15} />
                                            Chọn ảnh
                                        </button>
                                        {avatarSrc && (
                                            <button
                                                type="button"
                                                className="gp-btn gp-btn-ghost"
                                                onClick={() => {
                                                    setAvatarFile(null);
                                                    setAvatarPreview('');
                                                    setProfile((p) => ({ ...p, anh_dai_dien: '' }));
                                                }}
                                            >
                                                <Icon name="x" size={15} />
                                                Gỡ ảnh
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={profile.anh_dai_dien}
                                            onChange={(e) => {
                                                setAvatarFile(null);
                                                setAvatarPreview('');
                                                setProfile((p) => ({ ...p, anh_dai_dien: e.target.value }));
                                            }}
                                            className="gp-input"
                                            placeholder="https://..."
                                            style={{ flex: 1 }}
                                        />
                                        {avatarSrc && (
                                            <img
                                                src={avatarSrc}
                                                alt="preview"
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '1px solid var(--line)',
                                                    flexShrink: 0,
                                                }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', margin: '4px 0 0' }}>
                                        Dán URL hình ảnh từ internet (Google Drive, Imgur, ...)
                                    </p>
                                </FormField>

                                <FormField label="Tiểu sử ngắn">
                                    <textarea
                                        value={profile.tieu_su}
                                        onChange={(e) => setProfile((p) => ({ ...p, tieu_su: e.target.value }))}
                                        className="gp-input"
                                        rows={4}
                                        placeholder="Giới thiệu ngắn về bản thân..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </FormField>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tab: Đổi mật khẩu */}
                        {activeTab === 'password' && (
                            <form onSubmit={handleChangePassword} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <SectionHeader title="Đổi mật khẩu" desc="Mật khẩu mới phải có ít nhất 8 ký tự." />

                                <FormField label="Mật khẩu hiện tại" required>
                                    <input
                                        type="password"
                                        value={pwForm.current_password}
                                        onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                                        className="gp-input"
                                        placeholder="••••••••"
                                        required
                                    />
                                </FormField>

                                <FormField label="Mật khẩu mới" required>
                                    <input
                                        type="password"
                                        value={pwForm.new_password}
                                        onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                                        className="gp-input"
                                        placeholder="Tối thiểu 8 ký tự"
                                        required
                                    />
                                    {/* Strength bar */}
                                    {pwForm.new_password && <PasswordStrength password={pwForm.new_password} />}
                                </FormField>

                                <FormField label="Xác nhận mật khẩu mới" required>
                                    <input
                                        type="password"
                                        value={pwForm.confirm_password}
                                        onChange={(e) => setPwForm((p) => ({ ...p, confirm_password: e.target.value }))}
                                        className="gp-input"
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                    />
                                    {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                                        <p style={{ fontSize: 11.5, color: 'var(--crimson)', margin: '4px 0 0' }}>⚠ Mật khẩu xác nhận không khớp</p>
                                    )}
                                </FormField>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                                        {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Tab: Tài khoản */}
                        {activeTab === 'account' && (
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <SectionHeader title="Thông tin tài khoản" desc="Các thông tin liên kết và trạng thái tài khoản của bạn." />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <InfoCard label="Email" value={user?.email || '—'} icon="link" />
                                    <InfoCard label="Vai trò" value={role} icon="sparkle" />
                                    <InfoCard label="Đăng nhập qua" value={user?.google_id ? 'Google' : 'Email / Mật khẩu'} icon="users" />
                                    {user?.dong_ho && <InfoCard label="Dòng họ" value={user.dong_ho.ten_dong_ho} icon="lotus" />}
                                </div>

                                {user?.thanh_vien_id && (user as any).ma_thanh_vien && (
                                    <div
                                        style={{
                                            padding: '20px',
                                            borderRadius: 14,
                                            background: 'var(--card)',
                                            border: '1px solid var(--line)',
                                            marginTop: 8,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Icon name="camera" size={18} color="var(--gold)" />
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Mã QR Cá Nhân</span>
                                        </div>
                                        <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '0', textAlign: 'center', maxWidth: 280 }}>
                                            Đưa mã QR này cho người khác quét để nhận diện quan hệ gia phả với bạn.
                                        </p>
                                        <div
                                            style={{
                                                padding: 12,
                                                background: '#fff',
                                                borderRadius: 12,
                                                border: '1px solid var(--line-soft)',
                                                marginTop: 4,
                                            }}
                                        >
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/gia-pha/tra-cuu-danh-xung?target_id=${(user as any).ma_thanh_vien}`)}`}
                                                alt="QR Code"
                                                style={{ display: 'block', width: 160, height: 160 }}
                                            />
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 2 }}>
                                            Mã Thành Viên: <span style={{ color: 'var(--gold)' }}>{(user as any).ma_thanh_vien}</span>
                                        </div>
                                    </div>
                                )}

                                <div
                                    style={{
                                        padding: '16px 20px',
                                        borderRadius: 14,
                                        background: 'color-mix(in srgb, var(--crimson) 6%, transparent)',
                                        border: '1px solid color-mix(in srgb, var(--crimson) 20%, transparent)',
                                        marginTop: 8,
                                    }}
                                >
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--crimson)', marginBottom: 4 }}>⚠ Vùng nguy hiểm</div>
                                    <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: '0 0 12px' }}>
                                        Nếu bạn muốn xóa tài khoản, vui lòng liên hệ quản trị viên dòng họ để được hỗ trợ.
                                    </p>
                                    <button
                                        type="button"
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 8,
                                            border: '1px solid color-mix(in srgb, var(--crimson) 40%, transparent)',
                                            background: 'transparent',
                                            color: 'var(--crimson)',
                                            fontSize: 12.5,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        Liên hệ quản trị viên
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, desc }: { title: string; desc: string }) {
    return (
        <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--line-soft)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', fontFamily: 'Cormorant Garamond, serif' }}>
                {title}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: 0 }}>{desc}</p>
        </div>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>
                {label}
                {required && <span style={{ color: 'var(--crimson)', marginLeft: 3 }}>*</span>}
            </span>
            {children}
        </label>
    );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Icon>['name'] }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--card-soft)',
                border: '1px solid var(--line)',
            }}
        >
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--gold-glow)',
                    border: '1px solid var(--gold-pale)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon name={icon} size={14} color="var(--gold)" />
            </div>
            <div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{value}</div>
            </div>
        </div>
    );
}

function PasswordStrength({ password }: { password: string }) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels = ['Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
    const colors = ['var(--crimson)', 'var(--terracotta)', 'var(--gold)', 'var(--jade)'];

    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: i < score ? colors[score - 1] : 'var(--line)',
                            transition: 'background 0.3s',
                        }}
                    />
                ))}
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: score > 0 ? colors[score - 1] : 'var(--ink-mute)', fontWeight: 600 }}>
                {score > 0 ? labels[score - 1] : 'Nhập mật khẩu'}
            </div>
        </div>
    );
}
