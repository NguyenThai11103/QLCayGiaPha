import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import apiClient from '../../../lib/api.client';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';

interface ThongTinNguoi {
    id          : number;
    id_dong_ho  : number;
    ten_day_du  : string;
    gioi_tinh   : string;
    ngay_sinh   : string | null;
    ngay_mat    : string | null;
    da_mat      : boolean;
    id_cha      : number | null;
    id_me       : number | null;
    tieu_su     : string | null;
    anh_dai_dien: string | null;
    doi_thu     ?: number | null;
}

interface QuanHeItem {
    nguoi  : ThongTinNguoi;
    xung_ho: string;
}

interface DetailData {
    thong_tin        : ThongTinNguoi;
    danh_sach_quan_he: QuanHeItem[];
}

function initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(0);
}

function formatDate(date: string | null): string {
    if (!date) return 'Không rõ';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcAge(ngaySinh: string | null, ngayMat: string | null): string | null {
    if (!ngaySinh) return null;
    const born  = new Date(ngaySinh);
    const end   = ngayMat ? new Date(ngayMat) : new Date();
    const years = Math.floor((end.getTime() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
    return years > 0 ? `${years} tuổi` : null;
}

// Màu avatar gradient theo họ tên (seed)
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

const XUNG_HO_COLOR: Record<string, string> = {
    'Cha'   : 'brown',
    'Mẹ'    : 'terracotta',
    'Con'   : 'jade',
    'Anh'   : 'brown',
    'Em'    : 'jade',
    'Chồng' : 'gold',
    'Vợ'    : 'gold',
};

function xungHoColor(xungHo: string): string {
    for (const [key, val] of Object.entries(XUNG_HO_COLOR)) {
        if (xungHo.includes(key)) return val;
    }
    return 'jade';
}

export default function ChiTietThanhVien({ id }: { id: number | string }) {
    const [data,    setData]    = useState<DetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        apiClient.get(`/nguoi/detail?id=${id}`)
            .then(res => {
                if (res.data.success) setData(res.data.data);
                else setError(res.data.message || 'Lỗi tải dữ liệu');
            })
            .catch(() => setError('Lỗi kết nối máy chủ'))
            .finally(() => setLoading(false));
    }, [id]);

    const tv = data?.thong_tin;

    return (
        <AuthenticatedLayout>
            <Head title={tv ? `${tv.ten_day_du} — Chi tiết thành viên` : 'Chi tiết thành viên'} />

            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--ink-mute)' }}>
                    <Link href="/gia-pha/dashboard" style={{ color: 'var(--ink-mute)', textDecoration: 'none' }}>Tổng quan</Link>
                    <span style={{ opacity: 0.4 }}>/</span>
                    <Link href="/gia-pha/thanh-vien" style={{ color: 'var(--ink-mute)', textDecoration: 'none' }}>Thành viên</Link>
                    <span style={{ opacity: 0.4 }}>/</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{tv?.ten_day_du ?? '...'}</span>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 300 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 40, height: 40, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải thông tin...</div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div style={{ padding: '20px 24px', background: 'color-mix(in srgb, var(--crimson) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)', borderRadius: 16, color: 'var(--crimson)', textAlign: 'center', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {/* Content */}
                {!loading && data && tv && (
                    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

                        {/* ─── Cột trái: Profile Card ─────────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Hero Card */}
                            <div style={{ background: 'var(--bg-elev)', borderRadius: 20, border: '1px solid var(--line)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                                {/* Banner gradient */}
                                <div style={{ height: 90, background: avatarGrad(tv.ten_day_du), position: 'relative' }}>
                                    <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                </div>

                                <div style={{ padding: '0 24px 24px', marginTop: -44 }}>
                                    {/* Avatar */}
                                    {tv.anh_dai_dien ? (
                                        <img
                                            src={tv.anh_dai_dien}
                                            alt={tv.ten_day_du}
                                            style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--bg-elev)', objectFit: 'cover', boxShadow: 'var(--shadow-md)', display: 'block', marginBottom: 12 }}
                                        />
                                    ) : (
                                        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--bg-elev)', background: avatarGrad(tv.ten_day_du), display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: 'white', boxShadow: 'var(--shadow-md)', marginBottom: 12 }}>
                                            {initials(tv.ten_day_du)}
                                        </div>
                                    )}

                                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', fontFamily: 'Cormorant Garamond, serif' }}>
                                        {tv.ten_day_du}
                                    </h1>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: tv.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 15%, transparent)' : 'color-mix(in srgb, var(--terracotta) 15%, transparent)', color: tv.gioi_tinh === 'nam' ? 'var(--gold)' : 'var(--terracotta)', border: `1px solid ${tv.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 30%, transparent)' : 'color-mix(in srgb, var(--terracotta) 30%, transparent)'}` }}>
                                            {tv.gioi_tinh === 'nam' ? '♂ Nam' : '♀ Nữ'}
                                        </span>
                                        {tv.da_mat ? (
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'color-mix(in srgb, var(--ink-mute) 15%, transparent)', color: 'var(--ink-mute)', border: '1px solid var(--line)' }}>✝ Đã mất</span>
                                        ) : (
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'color-mix(in srgb, var(--jade) 12%, transparent)', color: 'var(--jade)', border: '1px solid color-mix(in srgb, var(--jade) 25%, transparent)' }}>● Còn sống</span>
                                        )}
                                    </div>

                                    {/* Thông tin cơ bản */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <InfoRow icon="calendar" label="Ngày sinh" value={formatDate(tv.ngay_sinh)} sub={calcAge(tv.ngay_sinh, tv.da_mat ? tv.ngay_mat : null)} />
                                        {tv.da_mat && <InfoRow icon="scroll" label="Ngày mất" value={formatDate(tv.ngay_mat)} sub={calcAge(tv.ngay_sinh, tv.ngay_mat) ?? undefined} />}
                                        {tv.doi_thu && <InfoRow icon="users" label="Đời thứ" value={`Đời ${tv.doi_thu}`} />}
                                    </div>
                                </div>
                            </div>

                            {/* Tiểu sử */}
                            {tv.tieu_su && (
                                <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>Tiểu sử</div>
                                    <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0 }}>{tv.tieu_su}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <Link href="/gia-pha/thanh-vien" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'var(--card-soft)', color: 'var(--ink-soft)', fontWeight: 600, fontSize: 13, textDecoration: 'none', border: '1px solid var(--line)' }}>
                                    <Icon name="chevron-down" size={14} style={{ transform: 'rotate(90deg)' }} />
                                    Danh sách
                                </Link>
                                <Link href={`/gia-pha/cay-gia-pha`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                                    <Icon name="users" size={14} />
                                    Xem cây
                                </Link>
                            </div>
                        </div>

                        {/* ─── Cột phải: Quan hệ ──────────────────────────────────── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả</div>
                                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'Cormorant Garamond, serif' }}>Các mối quan hệ</h2>
                                </div>
                                <div style={{ padding: '6px 14px', borderRadius: 999, background: 'var(--gold-glow)', border: '1px solid var(--gold-pale)', fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>
                                    {data.danh_sach_quan_he.length} người
                                </div>
                            </div>

                            {data.danh_sach_quan_he.length === 0 ? (
                                <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '48px 24px', textAlign: 'center' }}>
                                    <Icon name="users" size={40} color="var(--ink-faint)" />
                                    <div style={{ marginTop: 12, color: 'var(--ink-mute)', fontSize: 14 }}>Chưa có thành viên nào khác trong dòng họ.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                    {data.danh_sach_quan_he.map((qh, idx) => {
                                        const color = xungHoColor(qh.xung_ho);
                                        return (
                                            <Link
                                                key={idx}
                                                href={`/gia-pha/thanh-vien/${qh.nguoi.id}`}
                                                style={{ textDecoration: 'none', display: 'block' }}
                                            >
                                                <div style={{ background: 'var(--bg-elev)', borderRadius: 14, border: '1px solid var(--line)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', transition: 'all 0.15s', cursor: 'pointer' }}
                                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-soft)')}
                                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
                                                >
                                                    {/* Avatar */}
                                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: avatarGrad(qh.nguoi.ten_day_du), display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                        {initials(qh.nguoi.ten_day_du)}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{qh.nguoi.ten_day_du}</div>
                                                        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                                            <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `color-mix(in srgb, var(--${color}) 12%, transparent)`, color: `var(--${color})`, border: `1px solid color-mix(in srgb, var(--${color}) 25%, transparent)` }}>
                                                                {qh.xung_ho}
                                                            </span>
                                                            {qh.nguoi.da_mat && (
                                                                <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', background: 'var(--card-soft)', border: '1px solid var(--line)' }}>✝ Đã mất</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Icon name="chevron-right" size={14} color="var(--ink-faint)" />
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, sub }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string; sub?: string | null }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gold-glow)', border: '1px solid var(--gold-pale)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={icon} size={13} color="var(--gold)" />
            </div>
            <div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{value}{sub && <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 500, marginLeft: 6 }}>· {sub}</span>}</div>
            </div>
        </div>
    );
}
