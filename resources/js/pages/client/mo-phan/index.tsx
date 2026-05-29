import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { KhuMo, MoPhan, Nguoi, khuMoApi, moPhanApi, nguoiApi } from '../../../services/gia-pha.api';

// Imports các components mới
import KhuMoSection from './components/KhuMoSection';
import MoPhanMapPanel from './components/MoPhanMapPanel';
import MoPhanCard from './components/MoPhanCard';
import MoPhanFormModal from './components/MoPhanFormModal';
import MoPhanHistoryModal from './components/MoPhanHistoryModal';
import KhuMoFormModal from './components/KhuMoFormModal';
import KhuMoDetailModal from './components/KhuMoDetailModal';
import DirectionModal from './components/DirectionModal';

function isDeceased(member: Nguoi): boolean {
    return member.da_mat === true || member.da_mat === 1;
}

function memberBranch(member: Nguoi, memberById: Map<number, Nguoi>): Nguoi {
    let current = member;
    const seen = new Set<number>();

    while ((current.id_cha || current.id_me) && !seen.has(current.id)) {
        seen.add(current.id);
        const parent = (current.id_cha ? memberById.get(Number(current.id_cha)) : null)
            || (current.id_me ? memberById.get(Number(current.id_me)) : null);
        if (!parent) break;
        current = parent;
    }

    return current;
}

function getInitialMemberId(): string {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('thanh_vien_id') || '';
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ComponentProps<typeof Icon>['name']; color: string }) {
    return (
        <div style={{ background: 'var(--bg-elev)', borderRadius: 14, border: '1px solid var(--line)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `color-mix(in srgb, var(--${color}) 12%, transparent)`, border: `1px solid color-mix(in srgb, var(--${color}) 25%, transparent)`, display: 'grid', placeItems: 'center', color: `var(--${color})` }}>
                <Icon name={icon} size={17} />
            </div>
            <div>
                <div style={{ fontSize: 22, lineHeight: 1, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Cormorant Garamond, serif' }}>{value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3 }}>{label}</div>
            </div>
        </div>
    );
}

export default function MoPhanPage() {
    const { user } = useAuth();
    const [moPhans, setMoPhans] = useState<MoPhan[]>([]);
    const [khuMos, setKhuMos] = useState<KhuMo[]>([]);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [search, setSearch] = useState('');
    const [doiFilter, setDoiFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [khuMoFilter, setKhuMoFilter] = useState('');
    const initialMemberIdRef = useRef(getInitialMemberId());
    const autoOpenedMemberIdRef = useRef('');
    const [selectedMemberId, setSelectedMemberId] = useState(initialMemberIdRef.current);
    const [editing, setEditing] = useState<MoPhan | null>(null);
    const [draftMember, setDraftMember] = useState<Nguoi | null>(null);
    const [historyTarget, setHistoryTarget] = useState<MoPhan | null>(null);
    const [khuMoModalOpen, setKhuMoModalOpen] = useState(false);
    const [editingKhuMo, setEditingKhuMo] = useState<KhuMo | null>(null);
    const [detailKhuMo, setDetailKhuMo] = useState<KhuMo | null>(null);
    const [directionTarget, setDirectionTarget] = useState<{ title: string; lat: number; lng: number } | null>(null);

    const familyId = user?.dong_ho_id || user?.dong_ho?.id;
    const canDelete = user?.quyen_han === 'quan_ly';

    const loadData = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const [moRes, nguoiRes, khuRes] = await Promise.all([
                moPhanApi.list(familyId ? { dong_ho_id: familyId } : undefined),
                nguoiApi.list(familyId),
                khuMoApi.list(familyId ? { dong_ho_id: familyId } : undefined),
            ]);

            if (moRes.success) setMoPhans(moRes.data || []);
            if (nguoiRes.success) setMembers(nguoiRes.data || []);
            if (khuRes.success) setKhuMos(khuRes.data || []);
        } catch (error) {
            setLoadError(getErrorMessage(error, 'Không thể tải dữ liệu mộ phần.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [familyId]);

    const deceasedMembers = useMemo(() => members.filter(isDeceased), [members]);
    const memberById = useMemo(() => {
        const map = new Map<number, Nguoi>();
        members.forEach((member) => map.set(Number(member.id), member));
        return map;
    }, [members]);
    const graveByMemberId = useMemo(() => {
        const map = new Map<number, MoPhan>();
        moPhans.forEach((item) => map.set(Number(item.thanh_vien_id), item));
        return map;
    }, [moPhans]);
    const doiOptions = useMemo(() => {
        return Array.from(new Set(deceasedMembers.map((member) => member.doi_thu).filter(Boolean) as number[])).sort((a, b) => a - b);
    }, [deceasedMembers]);
    const branchOptions = useMemo(() => {
        const map = new Map<number, Nguoi>();
        deceasedMembers.forEach((member) => {
            const branch = memberBranch(member, memberById);
            map.set(branch.id, branch);
        });
        return Array.from(map.values()).sort((a, b) => a.ten_day_du.localeCompare(b.ten_day_du, 'vi'));
    }, [deceasedMembers, memberById]);

    useEffect(() => {
        const memberId = initialMemberIdRef.current;
        if (loading || !memberId || autoOpenedMemberIdRef.current === memberId) return;

        const member = deceasedMembers.find((item) => String(item.id) === memberId);
        if (!member) return;

        autoOpenedMemberIdRef.current = memberId;
        const moPhan = graveByMemberId.get(member.id);
        if (moPhan) {
            openUpdate(moPhan);
        } else {
            openCreate(member);
        }
    }, [loading, deceasedMembers, graveByMemberId]);

    const rows = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return deceasedMembers
            .map((member) => ({
                member,
                moPhan: graveByMemberId.get(member.id) || null,
            }))
            .filter(({ member }) => {
                if (selectedMemberId && String(member.id) !== selectedMemberId) return false;
                if (doiFilter && String(member.doi_thu || '') !== doiFilter) return false;
                if (branchFilter && String(memberBranch(member, memberById).id) !== branchFilter) return false;
                const grave = graveByMemberId.get(member.id) || null;
                if (khuMoFilter && String(grave?.khu_mo_id || '') !== khuMoFilter) return false;
                if (!keyword) return true;

                return member.ten_day_du.toLowerCase().includes(keyword);
            });
    }, [deceasedMembers, graveByMemberId, search, selectedMemberId, doiFilter, branchFilter, khuMoFilter, memberById]);

    const withLocation = deceasedMembers.filter((member) => graveByMemberId.has(member.id)).length;
    const withoutLocation = deceasedMembers.length - withLocation;

    const openCreate = (member?: Nguoi) => {
        setEditing(null);
        setDraftMember(member || null);
    };

    const openUpdate = (moPhan: MoPhan) => {
        setDraftMember(deceasedMembers.find((member) => member.id === Number(moPhan.thanh_vien_id)) || null);
        setEditing(moPhan);
    };

    const closeModal = () => {
        setEditing(null);
        setDraftMember(null);
    };

    const handleDelete = async (moPhan: MoPhan) => {
        if (!window.confirm('Xóa thông tin mộ phần này?')) return;

        try {
            const res = await moPhanApi.delete(moPhan.id);
            if (res.success) {
                toast.success(res.message || 'Đã xóa mộ phần');
                await loadData();
            }
        } catch {
            // apiClient interceptor displays error.
        }
    };

    const copyLocation = async (moPhan: MoPhan) => {
        try {
            const text = `${moPhan.vi_do}, ${moPhan.kinh_do}`;
            await navigator.clipboard?.writeText(text);
            toast.success('Đã sao chép tọa độ');
        } catch {
            toast.error('Không thể sao chép tọa độ.');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mộ phần gia tiên" />

            <div style={{ maxWidth: 1220, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>
                            Gia phả - Mộ phần
                        </div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>
                            Tọa độ mộ phần gia tiên
                        </h1>
                        <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0, maxWidth: 720 }}>
                            Lưu tọa độ GPS và ghi chú đường đi để con cháu trong dòng họ tìm mộ phần dễ dàng hơn.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
                    <StatCard label="Người đã mất" value={deceasedMembers.length} icon="users" color="brown" />
                    <StatCard label="Đã có tọa độ" value={withLocation} icon="pin" color="jade" />
                    <StatCard label="Chưa có tọa độ" value={withoutLocation} icon="map" color="terracotta" />
                </div>

                <KhuMoSection
                    khuMos={khuMos}
                    canManage={canDelete}
                    onCreate={() => { setEditingKhuMo(null); setKhuMoModalOpen(true); }}
                    onView={(khuMo) => setDetailKhuMo(khuMo)}
                    onEdit={(khuMo) => { setEditingKhuMo(khuMo); setKhuMoModalOpen(true); }}
                    onDirection={(khuMo) => setDirectionTarget({ title: khuMo.ten_khu_mo, lat: Number(khuMo.vi_do), lng: Number(khuMo.kinh_do) })}
                />

                <MoPhanMapPanel rows={rows.filter(({ moPhan }) => moPhan)} />

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                        <Icon name="search" size={14} color="var(--ink-mute)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Tìm theo tên người đã mất..."
                            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    <select
                        value={selectedMemberId}
                        onChange={(event) => setSelectedMemberId(event.target.value)}
                        style={{ padding: '10px 34px 10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, minWidth: 220 }}
                    >
                        <option value="">Tất cả người đã mất</option>
                        {deceasedMembers.map((member) => (
                            <option key={member.id} value={member.id}>{member.ten_day_du}</option>
                        ))}
                    </select>

                    <select
                        value={doiFilter}
                        onChange={(event) => setDoiFilter(event.target.value)}
                        style={{ padding: '10px 34px 10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, minWidth: 150 }}
                    >
                        <option value="">Tất cả đời</option>
                        {doiOptions.map((doi) => (
                            <option key={doi} value={doi}>Đời {doi}</option>
                        ))}
                    </select>

                    <select
                        value={branchFilter}
                        onChange={(event) => setBranchFilter(event.target.value)}
                        style={{ padding: '10px 34px 10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, minWidth: 210 }}
                    >
                        <option value="">Tất cả nhánh</option>
                        {branchOptions.map((branch) => (
                            <option key={branch.id} value={branch.id}>Nhánh {branch.ten_day_du}</option>
                        ))}
                    </select>

                    <select
                        value={khuMoFilter}
                        onChange={(event) => setKhuMoFilter(event.target.value)}
                        style={{ padding: '10px 34px 10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--bg-elev)', color: 'var(--ink)', fontSize: 13, minWidth: 190 }}
                    >
                        <option value="">Tất cả khu mộ</option>
                        {khuMos.map((khuMo) => (
                            <option key={khuMo.id} value={khuMo.id}>{khuMo.ten_khu_mo}</option>
                        ))}
                    </select>

                    {(selectedMemberId || doiFilter || branchFilter || khuMoFilter) && (
                        <button type="button" onClick={() => { setSelectedMemberId(''); setDoiFilter(''); setBranchFilter(''); setKhuMoFilter(''); }} className="gp-btn gp-btn-ghost">
                            Bỏ lọc
                        </button>
                    )}
                </div>

                {loadError && !loading ? (
                    <div style={{ background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', borderRadius: 12, color: 'var(--crimson)', fontSize: 13, marginBottom: 16, padding: '12px 14px' }}>
                        {loadError}
                    </div>
                ) : null}

                {loading ? (
                    <div style={{ display: 'grid', placeItems: 'center', height: 280 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 38, height: 38, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải dữ liệu mộ phần...</div>
                        </div>
                    </div>
                ) : rows.length === 0 ? (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '54px 24px', textAlign: 'center' }}>
                        <Icon name="map" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: 'var(--ink-mute)' }}>Chưa có dữ liệu phù hợp</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                        {rows.map(({ member, moPhan }) => (
                            <MoPhanCard
                                key={member.id}
                                member={member}
                                moPhan={moPhan}
                                canDelete={canDelete}
                                onCreate={() => openCreate(member)}
                                onUpdate={() => moPhan && openUpdate(moPhan)}
                                onDelete={() => moPhan && void handleDelete(moPhan)}
                                onCopy={() => moPhan && void copyLocation(moPhan)}
                                onHistory={() => moPhan && setHistoryTarget(moPhan)}
                                onDirection={() => {
                                    if (!moPhan) return;
                                    const lat = Number(moPhan.vi_do || moPhan.vi_do_khu_mo);
                                    const lng = Number(moPhan.kinh_do || moPhan.kinh_do_khu_mo);
                                    setDirectionTarget({ title: member.ten_day_du, lat, lng });
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {(draftMember || editing) && (
                <MoPhanFormModal
                    members={deceasedMembers}
                    initialMember={draftMember}
                    editing={editing}
                    khuMos={khuMos}
                    onClose={closeModal}
                    onSaved={async () => {
                        closeModal();
                        await loadData();
                    }}
                />
            )}

            {historyTarget && (
                <MoPhanHistoryModal moPhan={historyTarget} onClose={() => setHistoryTarget(null)} />
            )}

            {khuMoModalOpen && familyId && (
                <KhuMoFormModal
                    dongHoId={Number(familyId)}
                    editing={editingKhuMo}
                    onClose={() => { setKhuMoModalOpen(false); setEditingKhuMo(null); }}
                    onSaved={async () => {
                        setKhuMoModalOpen(false);
                        setEditingKhuMo(null);
                        await loadData();
                    }}
                />
            )}

            {detailKhuMo && (
                <KhuMoDetailModal
                    khuMo={detailKhuMo}
                    rows={moPhans
                        .filter((moPhan) => Number(moPhan.khu_mo_id) === Number(detailKhuMo.id))
                        .map((moPhan) => ({
                            moPhan,
                            member: memberById.get(Number(moPhan.thanh_vien_id)) || null,
                        }))}
                    canManage={canDelete}
                    onClose={() => setDetailKhuMo(null)}
                    onEdit={() => {
                        setEditingKhuMo(detailKhuMo);
                        setDetailKhuMo(null);
                        setKhuMoModalOpen(true);
                    }}
                    onDirection={() => setDirectionTarget({ title: detailKhuMo.ten_khu_mo, lat: Number(detailKhuMo.vi_do), lng: Number(detailKhuMo.kinh_do) })}
                    onGraveDirection={(moPhan) => {
                        setDirectionTarget({
                            title : moPhan.ten_thanh_vien || 'Mộ phần',
                            lat   : Number(moPhan.vi_do),
                            lng   : Number(moPhan.kinh_do),
                        });
                    }}
                    onHistory={(moPhan) => setHistoryTarget(moPhan)}
                />
            )}

            {directionTarget && (
                <DirectionModal target={directionTarget} onClose={() => setDirectionTarget(null)} />
            )}
        </AuthenticatedLayout>
    );
}
