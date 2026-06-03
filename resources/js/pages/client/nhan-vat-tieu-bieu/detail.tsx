import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { NhanVatTieuBieuDetail, TaiLieu, nhanVatTieuBieuApi } from '../../../services/gia-pha.api';

function formatDate(value?: string | null): string {
    if (!value) return 'Không rõ';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initials(name?: string | null): string {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() || name.charAt(0).toUpperCase();
}

function avatarGrad(name?: string | null): string {
    const seed = (name || 'nhan vat').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
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

function titleOf(doc: TaiLieu): string {
    return doc.ten_tai_lieu || doc.ten_file_goc || doc.duong_dan_file.split('/').pop() || 'Tài liệu';
}

function fileIcon(doc: TaiLieu): React.ComponentProps<typeof Icon>['name'] {
    const ext = (doc.loai_file || doc.duong_dan_file.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'photo';
    if (ext === 'pdf') return 'scroll';
    return 'book';
}

function Paragraphs({ text, empty }: { text?: string | null; empty: string }) {
    const lines = (text || '').split(/\n+/).map(item => item.trim()).filter(Boolean);
    if (lines.length === 0) {
        return <p style={{ color: 'var(--ink-mute)', fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{empty}</p>;
    }

    return (
        <>
            {lines.map((line, index) => (
                <p key={index} style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.75, margin: index === 0 ? 0 : '12px 0 0' }}>{line}</p>
            ))}
        </>
    );
}

export default function NhanVatTieuBieuDetailPage({ id }: { id: number | string }) {
    const [data, setData] = useState<NhanVatTieuBieuDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        nhanVatTieuBieuApi.detail(id)
            .then(res => {
                if (res.success && res.data) setData(res.data);
                else setError(res.message || 'Không thể tải hồ sơ.');
            })
            .catch(() => setError('Không thể tải hồ sơ.'))
            .finally(() => setLoading(false));
    }, [id]);

    const profile = data?.profile;
    const title = profile?.tieu_de || profile?.ten_thanh_vien || 'Nhân vật tiêu biểu';
    const period = profile?.giai_doan || [profile?.nam_bat_dau, profile?.nam_ket_thuc].filter(Boolean).join(' - ') || 'Chưa ghi giai đoạn';

    return (
        <AuthenticatedLayout>
            <Head title={profile ? `${title} - Nhân vật tiêu biểu` : 'Nhân vật tiêu biểu'} />
            <div style={{ maxWidth: 1180, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, color: 'var(--ink-mute)', fontSize: 13 }}>
                    <Link href="/gia-pha/dashboard" style={{ color: 'var(--ink-mute)', textDecoration: 'none' }}>Tổng quan</Link>
                    <span style={{ opacity: 0.45 }}>/</span>
                    <Link href="/gia-pha/nhan-vat-tieu-bieu" style={{ color: 'var(--ink-mute)', textDecoration: 'none' }}>Nhân vật tiêu biểu</Link>
                    <span style={{ opacity: 0.45 }}>/</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{profile?.ten_thanh_vien || '...'}</span>
                </div>

                {loading && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 300, color: 'var(--ink-mute)', fontSize: 13 }}>Đang tải hồ sơ...</div>
                )}

                {!loading && error && (
                    <div style={{ background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', borderRadius: 14, padding: 18, color: 'var(--crimson)', fontWeight: 700, textAlign: 'center' }}>{error}</div>
                )}

                {!loading && profile && (
                    <>
                        <section style={{ minHeight: 360, borderRadius: 18, overflow: 'hidden', position: 'relative', background: profile.anh_bia_url ? 'var(--card-soft)' : avatarGrad(profile.ten_thanh_vien), marginBottom: 22 }}>
                            {profile.anh_bia_url && <img src={profile.anh_bia_url} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.68))' }} />
                            <div style={{ position: 'relative', minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 28, color: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
                                    <div style={{ width: 96, height: 96, borderRadius: 16, border: '3px solid rgba(255,255,255,0.78)', background: avatarGrad(profile.ten_thanh_vien), overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 42, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>
                                        {profile.anh_dai_dien ? <img src={profile.anh_dai_dien} alt={profile.ten_thanh_vien || title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(profile.ten_thanh_vien)}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                            {profile.linh_vuc && <span style={{ borderRadius: 999, padding: '5px 10px', background: 'rgba(255,255,255,0.18)', fontSize: 12, fontWeight: 800 }}>{profile.linh_vuc}</span>}
                                            {Boolean(profile.noi_bat) && <span style={{ borderRadius: 999, padding: '5px 10px', background: 'rgba(255,255,255,0.92)', color: 'var(--brown)', fontSize: 12, fontWeight: 800 }}>Nổi bật</span>}
                                        </div>
                                        <h1 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 42, lineHeight: 1.05, fontWeight: 800 }}>{title}</h1>
                                        <div style={{ marginTop: 8, opacity: 0.92, fontSize: 15 }}>
                                            {profile.ten_thanh_vien} · Đời {profile.doi_thu || '-'} · {period}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22, alignItems: 'start' }}>
                            <aside style={{ display: 'grid', gap: 14 }}>
                                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                                    <h2 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: 16, fontWeight: 800 }}>Thông tin nhanh</h2>
                                    {[
                                        ['Họ tên', profile.ten_thanh_vien || '-'],
                                        ['Tên thường gọi', profile.ten_thuong_goi || '-'],
                                        ['Nghề nghiệp', profile.nghe_nghiep || '-'],
                                        ['Ngày sinh', formatDate(profile.ngay_sinh_duong)],
                                        ['Ngày mất', formatDate(profile.ngay_mat_am)],
                                        ['Trạng thái', Number(profile.tinh_trang_song) === 0 ? 'Đã mất' : 'Còn sống'],
                                    ].map(([label, value]) => (
                                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: label === 'Họ tên' ? 'none' : '1px solid var(--line-soft)', fontSize: 13 }}>
                                            <span style={{ color: 'var(--ink-mute)' }}>{label}</span>
                                            <span style={{ color: 'var(--ink)', fontWeight: 700, textAlign: 'right' }}>{value}</span>
                                        </div>
                                    ))}
                                    <Link href={`/gia-pha/thanh-vien/${profile.thanh_vien_id}`} className="gp-btn gp-btn-ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                                        <Icon name="users" size={14} />
                                        Xem trong gia phả
                                    </Link>
                                </div>

                                <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                                    <h2 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: 16, fontWeight: 800 }}>Tài liệu liên quan</h2>
                                    {data.documents.length === 0 ? (
                                        <div style={{ color: 'var(--ink-mute)', fontSize: 13, lineHeight: 1.6 }}>Chưa có tài liệu gắn với thành viên này.</div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            {data.documents.slice(0, 8).map(doc => (
                                                <a key={doc.id} href={doc.duong_dan_file} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 9, alignItems: 'center', color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--line-soft)', borderRadius: 10, padding: 10 }}>
                                                    <Icon name={fileIcon(doc)} size={15} color="var(--gold)" />
                                                    <span style={{ minWidth: 0, flex: 1, fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titleOf(doc)}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <main style={{ display: 'grid', gap: 18 }}>
                                <section style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
                                    <h2 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: 20, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>Tóm tắt</h2>
                                    <Paragraphs text={profile.tom_tat || profile.tieu_su} empty="Chưa có phần tóm tắt cho hồ sơ này." />
                                </section>

                                <section style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
                                    <h2 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: 20, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>Câu chuyện</h2>
                                    <Paragraphs text={profile.cau_chuyen} empty="Chưa có câu chuyện được ghi lại." />
                                </section>

                                <section style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
                                    <h2 style={{ margin: '0 0 12px', color: 'var(--ink)', fontSize: 20, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>Đóng góp</h2>
                                    <Paragraphs text={profile.dong_gop} empty="Chưa có thông tin đóng góp." />
                                </section>
                            </main>
                        </div>
                    </>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
