import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import AdminDanhSachThanhVien from '../../admin/thanh-vien/index';

// Gradient avatar theo họ tên
function avatarGrad(name: string): string {
    const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const pairs = [
        ['#b8902c', '#5c3a1e'],
        ['#2f5d3a', '#4a7a52'],
        ['#8b2a1f', '#c44535'],
        ['#225b7a', '#3e84a8'],
        ['#8b5a2b', '#a06d3b'],
        ['#6b3fa0', '#9c6dd6'],
    ];
    const p = pairs[seed % pairs.length];
    return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

function initials(name: string): string {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() ?? name.charAt(0).toUpperCase();
}

export default function ClientDanhSachThanhVien() {
    const { user } = useAuth();
    const [members,      setMembers]      = useState<Nguoi[]>([]);
    const [dongHos,      setDongHos]      = useState<DongHo[]>([]);
    const [selectedDH,   setSelectedDH]   = useState('');
    const [loading,      setLoading]      = useState(true);
    const [searchTerm,   setSearchTerm]   = useState('');
    const [viewMode,     setViewMode]     = useState<'grid' | 'table'>('grid');

    const loadData = async () => {
        setLoading(true);
        try {
            const [dhRes, ngRes] = await Promise.all([dongHoApi.list(), nguoiApi.list(selectedDH)]);
            setDongHos(dhRes.data || []);
            setMembers(ngRes.data || []);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { 
        if (user?.is_master !== 1 && user?.quyen_han !== 'quan_ly') {
            void loadData(); 
        }
    }, [selectedDH, user?.is_master, user?.quyen_han]);

    const filtered = useMemo(() => {
        let list = selectedDH ? members.filter(m => String(m.id_dong_ho) === selectedDH) : members;
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(m => m.ten_day_du.toLowerCase().includes(q));
        }
        return list;
    }, [members, selectedDH, searchTerm]);

    // Phân nhánh admin hoặc quản lý (trưởng tộc)
    if (user?.is_master === 1 || user?.quyen_han === 'quan_ly') {
        return <AdminDanhSachThanhVien />;
    }

    const statsNam   = filtered.filter(m => m.gioi_tinh === 'nam').length;
    const statsNu    = filtered.filter(m => m.gioi_tinh === 'nu').length;
    const statsMat   = filtered.filter(m => Boolean(m.da_mat)).length;
    const statsAlive = filtered.length - statsMat;

    const getMemberById = (id: number) => members.find(m => m.id === id);

    return (
        <AuthenticatedLayout>
            <Head title="Danh sách thành viên dòng họ" />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* ─── Header ──────────────────────────────────── */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Thành viên</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Danh sách thành viên</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Tất cả các thành viên trong dòng họ được ghi chép trong gia phả.</p>
                </div>

                {/* ─── Stats Row ───────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Tổng số', value: filtered.length, icon: 'users' as const,    color: 'gold'       },
                        { label: 'Nam',     value: statsNam,        icon: 'users' as const,    color: 'gold'       },
                        { label: 'Nữ',      value: statsNu,         icon: 'heart' as const,    color: 'terracotta' },
                        { label: 'Còn sống',value: statsAlive,      icon: 'sparkle' as const,  color: 'jade'       },
                    ].map(stat => (
                        <div key={stat.label} style={{ background: 'var(--bg-elev)', borderRadius: 14, border: '1px solid var(--line)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in srgb, var(--${stat.color}) 12%, transparent)`, border: `1px solid color-mix(in srgb, var(--${stat.color}) 25%, transparent)`, display: 'grid', placeItems: 'center' }}>
                                <Icon name={stat.icon} size={16} color={`var(--${stat.color})`} />
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── Toolbar ─────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Icon name="search" size={15} color="var(--ink-mute)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Dòng họ filter */}
                    <select
                        value={selectedDH}
                        onChange={e => setSelectedDH(e.target.value)}
                        style={{ padding: '9px 36px 9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, cursor: 'pointer', appearance: 'none', minWidth: 180 }}
                    >
                        <option value="">Tất cả dòng họ</option>
                        {dongHos.map(dh => <option key={dh.id} value={dh.id}>{dh.ten_dong_ho}</option>)}
                    </select>

                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--card-soft)', padding: 3, borderRadius: 10, border: '1px solid var(--line)' }}>
                        {(['grid', 'table'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{ width: 34, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: viewMode === mode ? 'var(--bg-elev)' : 'transparent', color: viewMode === mode ? 'var(--gold)' : 'var(--ink-mute)', transition: 'all 0.15s', display: 'grid', placeItems: 'center', boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none' }}
                                title={mode === 'grid' ? 'Dạng thẻ' : 'Dạng bảng'}
                            >
                                <Icon name={mode === 'grid' ? 'lotus' : 'scroll'} size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── Loading ─────────────────────────────────── */}
                {loading && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 280 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải danh sách...</div>
                        </div>
                    </div>
                )}

                {/* ─── Empty state ─────────────────────────────── */}
                {!loading && filtered.length === 0 && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '56px 24px', textAlign: 'center' }}>
                        <Icon name="users" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink-mute)' }}>
                            {searchTerm ? `Không tìm thấy kết quả cho "${searchTerm}"` : 'Chưa có thành viên nào'}
                        </div>
                    </div>
                )}

                {/* ─── Grid view ───────────────────────────────── */}
                {!loading && filtered.length > 0 && viewMode === 'grid' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
                        {filtered.map(member => {
                            const dongHo = dongHos.find(d => d.id === member.id_dong_ho);
                            const spouseNames = (member.vo_chong_ids || []).map(sid => getMemberById(sid)?.ten_day_du).filter(Boolean).join(', ');

                            return (
                                <Link key={member.id} href={`/gia-pha/thanh-vien/${member.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div
                                        style={{ background: 'var(--bg-elev)', borderRadius: 20, border: '1px solid var(--line)', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-soft)';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(184, 144, 44, 0.08)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)';
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                        }}
                                    >
                                        {/* Banner */}
                                        <div style={{ height: 60, background: avatarGrad(member.ten_day_du), position: 'relative', opacity: 0.9 }}>
                                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at right top, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at left bottom, rgba(0,0,0,0.15) 0%, transparent 50%)' }} />
                                            {member.da_mat && (
                                                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Icon name="moon" size={10} /> Đã mất
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '0 20px 20px', marginTop: -24, position: 'relative', zIndex: 2 }}>
                                            {/* Avatar */}
                                            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid var(--bg-elev)', background: avatarGrad(member.ten_day_du), display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                                                {initials(member.ten_day_du)}
                                            </div>
                                        </div>

                                        <div style={{ padding: '0px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                                            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 6, fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.ten_day_du}</div>

                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: member.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 8%, transparent)' : 'color-mix(in srgb, var(--terracotta) 8%, transparent)', color: member.gioi_tinh === 'nam' ? 'var(--gold-dark)' : 'var(--terracotta)', border: `1px solid ${member.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 20%, transparent)' : 'color-mix(in srgb, var(--terracotta) 20%, transparent)'}`, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Icon name={member.gioi_tinh === 'nam' ? 'users' : 'heart'} size={11} /> {member.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                                                </span>
                                                {dongHo && (
                                                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--bg-base)', color: 'var(--ink-soft)', border: '1px solid var(--line)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Icon name="scroll" size={11} /> {dongHo.ten_dong_ho}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                                                {member.ngay_sinh && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="lotus" size={12} color="var(--ink-mute)" /> Sinh: <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{member.ngay_sinh}</strong></div>}
                                                {spouseNames && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="heart" size={12} color="var(--ink-mute)" /> Vợ/Chồng: <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{spouseNames}</strong></div>}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* ─── Table view ──────────────────────────────── */}
                {!loading && filtered.length > 0 && viewMode === 'table' && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--card-soft)' }}>
                                    {['Họ và tên', 'Dòng họ', 'Giới tính', 'Ngày sinh', 'Trạng thái', ''].map(col => (
                                        <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-mute)', borderBottom: '1px solid var(--line)' }}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((member, i) => {
                                    const dongHo = dongHos.find(d => d.id === member.id_dong_ho);
                                    return (
                                        <tr key={member.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line-soft)' : 'none' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-glow)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarGrad(member.ten_day_du), display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                                        {initials(member.ten_day_du)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{member.ten_day_du}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>#{member.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>{dongHo?.ten_dong_ho || `#${member.id_dong_ho}`}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: member.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 12%, transparent)' : 'color-mix(in srgb, var(--terracotta) 12%, transparent)', color: member.gioi_tinh === 'nam' ? 'var(--gold)' : 'var(--terracotta)', border: `1px solid ${member.gioi_tinh === 'nam' ? 'color-mix(in srgb, var(--gold) 25%, transparent)' : 'color-mix(in srgb, var(--terracotta) 25%, transparent)'}` }}>
                                                    {member.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>{member.ngay_sinh || '—'}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: member.da_mat ? 'var(--card-soft)' : 'color-mix(in srgb, var(--jade) 12%, transparent)', color: member.da_mat ? 'var(--ink-mute)' : 'var(--jade)', border: `1px solid ${member.da_mat ? 'var(--line)' : 'color-mix(in srgb, var(--jade) 25%, transparent)'}` }}>
                                                    {member.da_mat ? '✝ Đã mất' : '● Còn sống'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                <Link href={`/gia-pha/thanh-vien/${member.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold)', textDecoration: 'none' }}>
                                                    Xem →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
