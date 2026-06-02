import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { DongHo, dongHoApi, Nguoi, nguoiApi, NguoiDung, nguoiDungApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import toast from '../../../lib/toast.util';
import MemberFormModal from '../gia-pha/components/MemberFormModal';
import {
    buildPayload,
    canBeParentPair,
    canSelectAsSpouse,
    findSpouseIdFromChildren,
    getMemberById,
} from '../gia-pha/helpers/family-tree';
import { emptyForm, FormState, QuickAddMode } from '../gia-pha/types';

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
    const [selectedDoi,  setSelectedDoi]  = useState('');
    const [loading,      setLoading]      = useState(true);
    const [searchTerm,   setSearchTerm]   = useState('');
    const [viewMode,     setViewMode]     = useState<'grid' | 'table'>('grid');
    const [visibleCount, setVisibleCount] = useState(12);
    const [formOpen,     setFormOpen]     = useState(false);
    const [form,         setForm]         = useState<FormState>(emptyForm);
    const [isDauRe,      setIsDauRe]      = useState(false);
    const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>('none');
    const [selectedParentId, setSelectedParentId] = useState('');
    const [saving,       setSaving]       = useState(false);
    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountEmail, setAccountEmail] = useState('');
    const [selectedAccountMemberId, setSelectedAccountMemberId] = useState('');
    const [memberAccounts, setMemberAccounts] = useState<NguoiDung[]>([]);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [roleSaving, setRoleSaving] = useState(false);
    const [selectedRoleAccountId, setSelectedRoleAccountId] = useState('');
    const [selectedRole, setSelectedRole] = useState<'quan_ly' | 'thanh_vien'>('quan_ly');
    const loaderRef = useRef<HTMLDivElement>(null);
    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const loadData = async () => {
        setLoading(true);
        try {
            const [dhRes, ngRes, ndRes] = await Promise.all([
                dongHoApi.list(),
                nguoiApi.list(),
                canManage ? nguoiDungApi.list() : Promise.resolve({ data: { data: [] } }),
            ]);
            setDongHos(dhRes.data || []);
            setMembers(ngRes.data || []);
            setMemberAccounts(ndRes.data?.data || []);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { 
        void loadData(); 
    }, []);

    // Reset visible count when filters or search change
    useEffect(() => {
        setVisibleCount(12);
    }, [selectedDoi, searchTerm]);

    const uniqueDois = useMemo(() => {
        const dois = members.map(m => m.doi_thu).filter((doi): doi is number => doi !== undefined && doi !== null);
        return Array.from(new Set(dois)).sort((a, b) => a - b);
    }, [members]);

    const filtered = useMemo(() => {
        let list = members;
        if (selectedDoi) {
            list = list.filter(m => String(m.doi_thu) === selectedDoi);
        }
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(m => m.ten_day_du.toLowerCase().includes(q));
        }
        return list;
    }, [members, selectedDoi, searchTerm]);

    // IntersectionObserver for infinite scroll (robust for nested scroll containers)
    useEffect(() => {
        if (loading || visibleCount >= filtered.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount(prev => Math.min(prev + 12, filtered.length));
                }
            },
            { rootMargin: '100px' } // Load slightly before it comes into view for premium seamless feel
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loading, visibleCount, filtered.length]);

    const statsNam   = filtered.filter(m => m.gioi_tinh === 'nam').length;
    const statsNu    = filtered.filter(m => m.gioi_tinh === 'nu').length;
    const statsMat   = filtered.filter(m => Boolean(m.da_mat)).length;
    const statsAlive = filtered.length - statsMat;
    const provisionedMemberIds = useMemo(
        () => new Set(memberAccounts.map((account) => account.thanh_vien_id).filter((memberId): memberId is number => Boolean(memberId))),
        [memberAccounts],
    );
    const membersWithoutAccount = useMemo(
        () => members.filter((member) => !provisionedMemberIds.has(member.id)),
        [members, provisionedMemberIds],
    );
    const roleAssignableAccounts = useMemo(
        () => memberAccounts.filter((account) => Boolean(account.thanh_vien_id) && !['admin', 'truong_toc'].includes(account.quyen_han || '')),
        [memberAccounts],
    );
    const currentManagers = useMemo(
        () => memberAccounts.filter((account) => ['truong_toc', 'quan_ly'].includes(account.quyen_han || '')),
        [memberAccounts],
    );

    const defaultDongHoId = () => {
        if (user?.dong_ho_id) {
            return String(user.dong_ho_id);
        }

        if (dongHos.length === 1) {
            return String(dongHos[0].id);
        }

        return '';
    };

    const openCreateForm = () => {
        setIsDauRe(false);
        setQuickAddMode('none');
        setSelectedParentId('');
        setForm({ ...emptyForm, id_dong_ho: defaultDongHoId() });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setForm(emptyForm);
        setIsDauRe(false);
        setQuickAddMode('none');
        setSelectedParentId('');
    };

    const openAccountModal = (memberId?: number) => {
        setSelectedAccountMemberId(memberId ? String(memberId) : '');
        setAccountEmail('');
        setAccountModalOpen(true);
    };

    const closeAccountModal = () => {
        setAccountModalOpen(false);
        setSelectedAccountMemberId('');
        setAccountEmail('');
    };

    const closeRoleModal = () => {
        setRoleModalOpen(false);
        setSelectedRoleAccountId('');
        setSelectedRole('quan_ly');
    };

    const getAccountMemberName = (account: NguoiDung) => {
        const member = members.find((item) => item.id === account.thanh_vien_id);
        return member?.ten_day_du || account.ho_ten || account.email;
    };

    const getRoleLabel = (role?: string | null) => {
        if (role === 'truong_toc') return 'Trưởng tộc';
        if (role === 'quan_ly') return 'Quản lý';
        if (role === 'admin') return 'Quản trị hệ thống';
        return 'Thành viên';
    };

    const handleParentChange = (field: 'id_cha' | 'id_me', value: string) => {
        setForm((currentForm) => {
            if (field === 'id_cha') {
                const autoMotherId = findSpouseIdFromChildren(members, value, 'id_me');
                const currentMotherId = canBeParentPair(members, value, currentForm.id_me) ? currentForm.id_me : '';

                return { ...currentForm, id_cha: value, id_me: autoMotherId || currentMotherId };
            }

            const autoFatherId = findSpouseIdFromChildren(members, value, 'id_cha');
            const currentFatherId = canBeParentPair(members, currentForm.id_cha, value) ? currentForm.id_cha : '';

            return { ...currentForm, id_me: value, id_cha: autoFatherId || currentFatherId };
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.id_dong_ho) {
            toast.error('Vui lòng chọn dòng họ.');
            return;
        }

        if (!canBeParentPair(members, form.id_cha, form.id_me)) {
            toast.error('Cha và mẹ không được là tổ tiên hoặc con cháu của nhau.');
            return;
        }

        if (form.id_vo_chong_list.length > 0) {
            const invalidSpouse = form.id_vo_chong_list.some((spouseId) => {
                const spouse = getMemberById(members, spouseId);
                return spouse && !canSelectAsSpouse(members, spouse, form);
            });

            if (invalidSpouse) {
                toast.error('Có vợ/chồng không hợp lệ.');
                return;
            }
        }

        setSaving(true);
        try {
            const result = await nguoiApi.create(buildPayload(form, isDauRe));

            if (result.success) {
                toast.success(result.message || 'Thêm thành viên thành công.');
                closeForm();
                await loadData();
            } else {
                toast.error(result.message || 'Không thể thêm thành viên.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleProvisionAccount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAccountMemberId) {
            toast.error('Vui lòng chọn thành viên cần cấp tài khoản.');
            return;
        }

        if (!accountEmail.trim()) {
            toast.error('Vui lòng nhập email của thành viên.');
            return;
        }

        setAccountSaving(true);
        try {
            const response = await nguoiDungApi.provisionMemberAccount({
                thanh_vien_id: Number(selectedAccountMemberId),
                email: accountEmail.trim(),
            });
            const result = response.data;

            if (result.success) {
                toast.success(result.message || 'Đã cấp tài khoản cho thành viên.');
                closeAccountModal();
                await loadData();
            } else {
                toast.error(result.message || 'Không thể cấp tài khoản.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cấp tài khoản.');
        } finally {
            setAccountSaving(false);
        }
    };

    const updateMemberRole = async (accountId: number, role: 'quan_ly' | 'thanh_vien') => {
        setRoleSaving(true);
        try {
            const response = await nguoiDungApi.updateRole({ id: accountId, quyen_han: role });
            const result = response.data;

            if (result.success) {
                toast.success(result.message || 'Đã cập nhật vai trò thành viên.');
                await loadData();
                return true;
            }

            toast.error(result.message || 'Không thể cập nhật vai trò thành viên.');
            return false;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò.');
            return false;
        } finally {
            setRoleSaving(false);
        }
    };

    const handleRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedRoleAccountId) {
            toast.error('Vui lòng chọn tài khoản thành viên.');
            return;
        }

        const updated = await updateMemberRole(Number(selectedRoleAccountId), selectedRole);
        if (updated) {
            closeRoleModal();
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Danh sách thành viên dòng họ" />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* ─── Header ──────────────────────────────────── */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Thành viên</div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Danh sách thành viên</h1>
                            <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Tất cả các thành viên trong dòng họ được ghi chép trong gia phả.</p>
                        </div>
                        {canManage && (
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={() => setRoleModalOpen(true)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10, border: '1px solid var(--gold-soft)', background: 'var(--gold-glow)', color: 'var(--gold-dark)', padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                                >
                                    <Icon name="users" size={15} />
                                    Phân quyền
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openAccountModal()}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                                >
                                    <Icon name="users" size={15} />
                                    Cấp tài khoản
                                </button>
                                <button
                                    type="button"
                                    onClick={openCreateForm}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, var(--gold), var(--terracotta))', color: 'white', padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
                                >
                                    <Icon name="add-user" size={15} />
                                    Thêm thành viên
                                </button>
                            </div>
                        )}
                    </div>
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

                    {/* Lọc theo Đời */}
                    <select
                        value={selectedDoi}
                        onChange={e => setSelectedDoi(e.target.value)}
                        style={{ padding: '9px 36px 9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, cursor: 'pointer', appearance: 'none', minWidth: 150 }}
                    >
                        <option value="">Tất cả đời</option>
                        {uniqueDois.map(doi => <option key={doi} value={doi}>Đời thứ {doi}</option>)}
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
                        {filtered.slice(0, visibleCount).map(member => {
                            const dongHo = dongHos.find(d => d.id === member.id_dong_ho);
                            const spouseNames = (member.vo_chong_ids || []).map(sid => getMemberById(members, sid)?.ten_day_du).filter(Boolean).join(', ');

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
                                                    <Icon name="clock" size={10} /> Đã mất
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '0 20px 0', marginTop: -24, position: 'relative', zIndex: 2 }}>
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
                                                {member.doi_thu !== undefined && member.doi_thu !== null && (
                                                    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--bg-base)', color: 'var(--ink-soft)', border: '1px solid var(--line)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Icon name="branch" size={11} /> Đời thứ {member.doi_thu}
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
                                    {['Họ và tên', 'Đời thứ', 'Giới tính', 'Ngày sinh', 'Trạng thái', ''].map(col => (
                                        <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-mute)', borderBottom: '1px solid var(--line)' }}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, visibleCount).map((member, i) => {
                                    return (
                                        <tr key={member.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line-soft)' : 'none', cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-glow)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            onClick={() => router.visit(`/gia-pha/thanh-vien/${member.id}`)}
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
                                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--ink-soft)' }}>Đời thứ {member.doi_thu ?? '—'}</td>
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
                                                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold)', textDecoration: 'none' }}>
                                                    Xem →
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filtered.length > visibleCount && (
                    <div
                        ref={loaderRef}
                        onClick={() => setVisibleCount(prev => Math.min(prev + 12, filtered.length))}
                        style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-mute)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
                        title="Nhấp để tải thêm thành viên"
                    >
                        <div style={{ width: 16, height: 16, border: '2px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Đang tải thêm thành viên... (hoặc Nhấp để xem thêm)
                    </div>
                )}

            </div>

            {roleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={handleRoleSubmit}
                        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink)] shadow-2xl"
                    >
                        <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, var(--brown), var(--gold))' }}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Phân quyền quản lý</h3>
                                    <p className="mt-0.5 text-xs text-white/75">Cấp hoặc thu hồi quyền quản lý cho tài khoản thành viên trong dòng họ.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeRoleModal}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                                >
                                    <Icon name="x" size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
                                        Tài khoản thành viên <span className="text-red-500">*</span>
                                    </span>
                                    <select
                                        value={selectedRoleAccountId}
                                        onChange={(event) => {
                                            const account = roleAssignableAccounts.find((item) => String(item.id) === event.target.value);
                                            setSelectedRoleAccountId(event.target.value);
                                            setSelectedRole(account?.quyen_han === 'quan_ly' ? 'thanh_vien' : 'quan_ly');
                                        }}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                        required
                                    >
                                        <option value="">-- Chọn tài khoản cần phân quyền --</option>
                                        {roleAssignableAccounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {getAccountMemberName(account)} - {getRoleLabel(account.quyen_han)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
                                        Vai trò mới
                                    </span>
                                    <select
                                        value={selectedRole}
                                        onChange={(event) => setSelectedRole(event.target.value as 'quan_ly' | 'thanh_vien')}
                                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                    >
                                        <option value="quan_ly">Quản lý</option>
                                        <option value="thanh_vien">Thành viên</option>
                                    </select>
                                </label>
                            </div>

                            <div className="rounded-xl border border-[var(--line)] bg-[var(--card-soft)]">
                                <div className="border-b border-[var(--line)] px-4 py-3 text-sm font-bold text-[var(--ink)]">
                                    Người đang có quyền quản lý ({currentManagers.length})
                                </div>
                                <div className="max-h-72 divide-y divide-[var(--line-soft)] overflow-auto">
                                    {currentManagers.length === 0 && (
                                        <div className="px-4 py-4 text-sm text-[var(--ink-mute)]">Chưa có tài khoản quản lý nào trong dòng họ.</div>
                                    )}
                                    {currentManagers.map((account) => {
                                        const canRevoke = account.quyen_han === 'quan_ly';

                                        return (
                                            <div key={account.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-semibold text-[var(--ink)]">{getAccountMemberName(account)}</div>
                                                    <div className="truncate text-xs text-[var(--ink-mute)]">{account.email} · {getRoleLabel(account.quyen_han)}</div>
                                                </div>
                                                {canRevoke && (
                                                    <button
                                                        type="button"
                                                        disabled={roleSaving}
                                                        onClick={() => void updateMemberRole(account.id, 'thanh_vien')}
                                                        className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Thu hồi
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {roleAssignableAccounts.length === 0 && (
                                <div className="rounded-xl border border-[var(--gold-soft)] bg-[var(--gold-glow)] px-4 py-3 text-[12.5px] leading-5 text-[var(--ink-soft)]">
                                    Chưa có tài khoản thành viên có thể phân quyền. Hãy cấp tài khoản cho thành viên trước.
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeRoleModal} className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-2 font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--card-soft)]">
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={roleSaving || roleAssignableAccounts.length === 0}
                                    className="rounded-lg px-5 py-2 font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--terracotta))' }}
                                >
                                    {roleSaving ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {accountModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={handleProvisionAccount}
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink)] shadow-2xl"
                    >
                        <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, var(--brown), var(--gold))' }}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Cấp tài khoản thành viên</h3>
                                    <p className="mt-0.5 text-xs text-white/75">Hệ thống sẽ tạo mật khẩu ngẫu nhiên và gửi email thông báo cho thành viên.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAccountModal}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
                                >
                                    <Icon name="x" size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 p-6">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
                                    Thành viên <span className="text-red-500">*</span>
                                </span>
                                <select
                                    value={selectedAccountMemberId}
                                    onChange={(event) => setSelectedAccountMemberId(event.target.value)}
                                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                    required
                                >
                                    <option value="">-- Chọn thành viên chưa có tài khoản --</option>
                                    {membersWithoutAccount.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.ten_day_du} {member.doi_thu ? `(Đời ${member.doi_thu})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {membersWithoutAccount.length === 0 && (
                                    <p className="mt-1 text-xs text-[var(--ink-mute)]">Tất cả thành viên hiện đã có tài khoản liên kết.</p>
                                )}
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">
                                    Email đăng nhập <span className="text-red-500">*</span>
                                </span>
                                <input
                                    type="email"
                                    value={accountEmail}
                                    onChange={(event) => setAccountEmail(event.target.value)}
                                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-[var(--ink)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                                    placeholder="thanhvien@example.com"
                                    required
                                />
                            </label>

                            <div className="rounded-xl border border-[var(--gold-soft)] bg-[var(--gold-glow)] px-4 py-3 text-[12.5px] leading-5 text-[var(--ink-soft)]">
                                Sau khi cấp, thành viên sẽ nhận email gồm tài khoản, mật khẩu tạm và link đăng nhập. Thành viên nên đổi mật khẩu trong mục Hồ sơ sau lần đăng nhập đầu tiên.
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeAccountModal} className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-4 py-2 font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--card-soft)]">
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={accountSaving || membersWithoutAccount.length === 0}
                                    className="rounded-lg px-5 py-2 font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--terracotta))' }}
                                >
                                    {accountSaving ? 'Đang cấp...' : 'Cấp tài khoản'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {formOpen && (
                <MemberFormModal
                    form={form}
                    setForm={setForm}
                    dongHos={dongHos}
                    people={members}
                    isDauRe={isDauRe}
                    setIsDauRe={setIsDauRe}
                    quickAddMode={quickAddMode}
                    selectedParentId={selectedParentId}
                    saving={saving}
                    onClose={closeForm}
                    onSubmit={handleSubmit}
                    onParentChange={handleParentChange}
                />
            )}
        </AuthenticatedLayout>
    );
}
