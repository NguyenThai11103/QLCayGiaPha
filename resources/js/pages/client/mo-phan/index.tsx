import { Head, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { KhuMo, KhuMoPayload, MoPhan, MoPhanHistory, Nguoi, OpenMapDirectionSummary, OpenMapVehicle, khuMoApi, moPhanApi, nguoiApi } from '../../../services/gia-pha.api';

interface MoPhanFormState {
    thanh_vien_id: string;
    khu_mo_id: string;
    vi_do: string;
    kinh_do: string;
    ghi_chu: string;
    anh_mo: File | null;
}

interface KhuMoFormState {
    ten_khu_mo: string;
    dia_chi: string;
    vi_do: string;
    kinh_do: string;
    mo_ta: string;
    anh_khu_mo: File | null;
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function mapUrl(viDo: number | string, kinhDo: number | string): string {
    return `https://www.google.com/maps?q=${viDo},${kinhDo}`;
}

function openMapPlaceUrl(viDo: number | string, kinhDo: number | string): string {
    return `https://www.openmap.vn/place/latlon%3A${viDo}%3A${kinhDo}`;
}

const OPENMAP_VEHICLES: Array<{ value: OpenMapVehicle; label: string }> = [
    { value: 'motor', label: 'Xe máy' },
    { value: 'car', label: 'Ô tô' },
    { value: 'walking', label: 'Đi bộ' },
    { value: 'bike', label: 'Xe đạp' },
];

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
            // apiClient interceptor already displays the backend error.
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

                    {/* <button
                        type="button"
                        onClick={() => openCreate()}
                        className="gp-btn gp-btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <Icon name="plus" size={14} />
                        Thêm mộ phần
                    </button> */}
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
                            title: moPhan.ten_thanh_vien || 'Mộ phần',
                            lat: Number(moPhan.vi_do),
                            lng: Number(moPhan.kinh_do),
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

function KhuMoSection({
    khuMos,
    canManage,
    onCreate,
    onView,
    onEdit,
    onDirection,
}: {
    khuMos: KhuMo[];
    canManage: boolean;
    onCreate: () => void;
    onView: (khuMo: KhuMo) => void;
    onEdit: (khuMo: KhuMo) => void;
    onDirection: (khuMo: KhuMo) => void;
}) {
    return (
        <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 3 }}>Khu mộ</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Các khu an nghỉ của dòng họ</div>
                </div>
                {canManage && (
                    <button type="button" onClick={onCreate} className="gp-btn gp-btn-primary">
                        <Icon name="plus" size={14} />
                        Thêm khu mộ
                    </button>
                )}
            </div>

            {khuMos.length === 0 ? (
                <div style={{ borderRadius: 12, border: '1px dashed var(--line)', padding: 18, color: 'var(--ink-mute)', fontSize: 13 }}>
                    Chưa có khu mộ. Hãy tạo khu mộ để nhóm các mộ phần cùng địa điểm.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {khuMos.map((khuMo) => (
                        <div key={khuMo.id} style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', overflow: 'hidden' }}>
                            {khuMo.anh_khu_mo_url && (
                                <img src={khuMo.anh_khu_mo_url} alt={khuMo.ten_khu_mo} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                            )}
                            <div style={{ padding: 14 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{khuMo.ten_khu_mo}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>{khuMo.dia_chi || 'Chưa có địa chỉ'}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
                                    {khuMo.so_mo_phan || 0} mộ phần · {Number(khuMo.vi_do).toFixed(6)}, {Number(khuMo.kinh_do).toFixed(6)}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button type="button" onClick={() => onView(khuMo)} className="gp-btn gp-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                        <Icon name="search" size={14} />
                                        Chi tiết
                                    </button>
                                    <button type="button" onClick={() => onDirection(khuMo)} className="gp-btn gp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                                        <Icon name="map" size={14} />
                                        Chỉ đường
                                    </button>
                                    {canManage && (
                                        <button type="button" onClick={() => onEdit(khuMo)} className="gp-btn gp-btn-ghost" title="Sửa khu mộ">
                                            <Icon name="edit" size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function KhuMoDetailModal({
    khuMo,
    rows,
    canManage,
    onClose,
    onEdit,
    onDirection,
    onGraveDirection,
    onHistory,
}: {
    khuMo: KhuMo;
    rows: Array<{ moPhan: MoPhan; member: Nguoi | null }>;
    canManage: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDirection: () => void;
    onGraveDirection: (moPhan: MoPhan) => void;
    onHistory: (moPhan: MoPhan) => void;
}) {
    const gravePhotos = rows
        .map(({ moPhan, member }) => ({ url: moPhan.anh_mo_url, title: member?.ten_day_du || moPhan.ten_thanh_vien || 'Mộ phần' }))
        .filter((item): item is { url: string; title: string } => !!item.url);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 920, maxHeight: '88vh', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ minHeight: 154, background: khuMo.anh_khu_mo_url ? `linear-gradient(180deg, rgba(34,26,18,0.16), rgba(34,26,18,0.62)), url(${khuMo.anh_khu_mo_url}) center/cover` : 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', padding: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, opacity: 0.86 }}>Chi tiết khu mộ</div>
                        <h2 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>{khuMo.ten_khu_mo}</h2>
                        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.88 }}>{khuMo.dia_chi || 'Chưa có địa chỉ'}</div>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.16)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: 22, overflow: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.35fr)', gap: 18 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', padding: 14 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Mộ phần</div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{rows.length}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Cập nhật</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 7 }}>{formatDateTime(khuMo.updated_at)}</div>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <CoordinatePill label="Vĩ độ" value={Number(khuMo.vi_do).toFixed(7)} />
                                    <CoordinatePill label="Kinh độ" value={Number(khuMo.kinh_do).toFixed(7)} />
                                </div>
                                {khuMo.mo_ta && (
                                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.58 }}>{khuMo.mo_ta}</div>
                                )}
                            </div>

                            {gravePhotos.length > 0 && (
                                <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', padding: 14 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Hình ảnh mộ phần</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                        {gravePhotos.slice(0, 6).map((photo) => (
                                            <a key={`${photo.title}-${photo.url}`} href={photo.url} target="_blank" rel="noreferrer" title={photo.title} style={{ height: 86, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line-soft)', background: 'var(--bg-elev)', display: 'block' }}>
                                                <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" onClick={onDirection} className="gp-btn gp-btn-primary">
                                    <Icon name="map" size={14} />
                                    Chỉ đường đến khu mộ
                                </button>
                                {canManage && (
                                    <button type="button" onClick={onEdit} className="gp-btn gp-btn-ghost">
                                        <Icon name="edit" size={14} />
                                        Cập nhật khu mộ
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.4 }}>Danh sách an táng</div>
                                    <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 800, marginTop: 2 }}>Các mộ chôn cất trong khu</div>
                                </div>
                                <span style={{ borderRadius: 999, background: 'var(--gold-glow)', border: '1px solid var(--gold-pale)', padding: '5px 10px', color: 'var(--brown)', fontSize: 12, fontWeight: 800 }}>{rows.length} mộ</span>
                            </div>

                            {rows.length === 0 ? (
                                <div style={{ padding: 22, color: 'var(--ink-mute)', fontSize: 13, textAlign: 'center' }}>
                                    Chưa có mộ phần nào được gắn với khu mộ này.
                                </div>
                            ) : (
                                <div style={{ maxHeight: 470, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                                    {rows.map(({ moPhan, member }, index) => (
                                        <div key={moPhan.id} style={{ display: 'grid', gridTemplateColumns: moPhan.anh_mo_url ? '76px 1fr' : '1fr', gap: 12, padding: 14, borderTop: index === 0 ? 'none' : '1px solid var(--line-soft)' }}>
                                            {moPhan.anh_mo_url && (
                                                <a href={moPhan.anh_mo_url} target="_blank" rel="noreferrer" style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-soft)', background: 'var(--bg-elev)' }}>
                                                    <img src={moPhan.anh_mo_url} alt={member?.ten_day_du || moPhan.ten_thanh_vien || 'Ảnh mộ'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                </a>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {member?.ten_day_du || moPhan.ten_thanh_vien || 'Chưa rõ thành viên'}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
                                                            Đời {member?.doi_thu || moPhan.doi_thu || '-'} · Mất ngày {member?.ngay_mat || 'chưa rõ'}
                                                        </div>
                                                    </div>
                                                    {member && (
                                                        <Link href={`/gia-pha/thanh-vien/${member.id}`} style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                                            Hồ sơ
                                                        </Link>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                                                    <CoordinatePill label="Vĩ độ" value={Number(moPhan.vi_do).toFixed(7)} />
                                                    <CoordinatePill label="Kinh độ" value={Number(moPhan.kinh_do).toFixed(7)} />
                                                </div>
                                                {moPhan.ghi_chu && <div style={{ marginTop: 8, color: 'var(--ink-soft)', fontSize: 12.5, lineHeight: 1.5 }}>{moPhan.ghi_chu}</div>}

                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                                                    <button type="button" onClick={() => onGraveDirection(moPhan)} className="gp-btn gp-btn-ghost">
                                                        <Icon name="map" size={14} />
                                                        Chỉ đường
                                                    </button>
                                                    <button type="button" onClick={() => onHistory(moPhan)} className="gp-btn gp-btn-ghost">
                                                        <Icon name="clock" size={14} />
                                                        Lịch sử
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MoPhanMapPanel({ rows }: { rows: Array<{ member: Nguoi; moPhan: MoPhan | null }> }) {
    const points = rows
        .filter((row): row is { member: Nguoi; moPhan: MoPhan } => !!row.moPhan)
        .map(({ member, moPhan }) => ({
            member,
            moPhan,
            lat: Number(moPhan.vi_do),
            lng: Number(moPhan.kinh_do),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    const bounds = useMemo(() => {
        if (points.length === 0) return null;
        const latValues = points.map((point) => point.lat);
        const lngValues = points.map((point) => point.lng);
        const minLat = Math.min(...latValues);
        const maxLat = Math.max(...latValues);
        const minLng = Math.min(...lngValues);
        const maxLng = Math.max(...lngValues);
        return {
            minLat,
            maxLat,
            minLng,
            maxLng,
            latRange: Math.max(maxLat - minLat, 0.0001),
            lngRange: Math.max(maxLng - minLng, 0.0001),
        };
    }, [points]);

    return (
        <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--line-soft)' }}>
                <div>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 3 }}>Bản đồ dòng họ</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Danh sách mộ phần có tọa độ</div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>{points.length} vị trí</div>
            </div>

            <div style={{ position: 'relative', height: 320, background: 'linear-gradient(135deg, color-mix(in srgb, var(--jade) 8%, transparent), color-mix(in srgb, var(--gold) 12%, transparent))' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.36, backgroundImage: 'linear-gradient(var(--line-soft) 1px, transparent 1px), linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
                {points.length === 0 || !bounds ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
                        Chưa có tọa độ để hiển thị trên bản đồ.
                    </div>
                ) : (
                    points.map((point, index) => {
                        const left = ((point.lng - bounds.minLng) / bounds.lngRange) * 86 + 7;
                        const top = (1 - ((point.lat - bounds.minLat) / bounds.latRange)) * 78 + 11;

                        return (
                            <a
                                key={`${point.moPhan.id}-${index}`}
                                href={mapUrl(point.moPhan.vi_do, point.moPhan.kinh_do)}
                                target="_blank"
                                rel="noreferrer"
                                title={`${point.member.ten_day_du} - ${Number(point.moPhan.vi_do).toFixed(7)}, ${Number(point.moPhan.kinh_do).toFixed(7)}`}
                                style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -100%)', textDecoration: 'none' }}
                            >
                                <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50% 50% 50% 4px', transform: 'rotate(-45deg)', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', boxShadow: '0 8px 20px rgba(92,58,30,0.24)', border: '2px solid var(--bg-elev)' }}>
                                    <span style={{ transform: 'rotate(45deg)', fontSize: 11, fontWeight: 800 }}>{index + 1}</span>
                                </span>
                            </a>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function MoPhanCard({
    member,
    moPhan,
    canDelete,
    onCreate,
    onUpdate,
    onDelete,
    onCopy,
    onHistory,
    onDirection,
}: {
    member: Nguoi;
    moPhan: MoPhan | null;
    canDelete: boolean;
    onCreate: () => void;
    onUpdate: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onHistory: () => void;
    onDirection: () => void;
}) {
    return (
        <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.ten_day_du}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                        Đời {member.doi_thu || '-'} - Mất ngày {member.ngay_mat || 'chưa rõ'}
                    </div>
                </div>
                <Link href={`/gia-pha/thanh-vien/${member.id}`} style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Chi tiết
                </Link>
            </div>

            {moPhan ? (
                <>
                    {moPhan.anh_mo_url && (
                        <a href={moPhan.anh_mo_url} target="_blank" rel="noreferrer" style={{ display: 'block', height: 150, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-soft)', background: 'var(--card-soft)' }}>
                            <img src={moPhan.anh_mo_url} alt={`Ảnh mộ ${member.ten_day_du}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </a>
                    )}

                    <div style={{ borderRadius: 12, background: 'var(--card-soft)', border: '1px solid var(--line-soft)', padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                            <CoordinatePill label="Vĩ độ" value={Number(moPhan.vi_do).toFixed(7)} />
                            <CoordinatePill label="Kinh độ" value={Number(moPhan.kinh_do).toFixed(7)} />
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                            {moPhan.ghi_chu || 'Chưa có ghi chú vị trí.'}
                        </div>
                        {moPhan.ten_khu_mo && (
                            <div style={{ fontSize: 12, color: 'var(--brown)', marginTop: 8, fontWeight: 700 }}>
                                Khu mộ: {moPhan.ten_khu_mo}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button type="button" onClick={onDirection} className="gp-btn gp-btn-ghost" style={{ justifyContent: 'center' }}>
                            <Icon name="map" size={14} />
                            Chỉ đường
                        </button>
                        <button type="button" onClick={onCopy} className="gp-btn gp-btn-ghost">
                            <Icon name="copy" size={14} />
                            Sao chép
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                            Cập nhật: {formatDateTime(moPhan.updated_at)}
                            {moPhan.ten_nguoi_cap_nhat ? ` bởi ${moPhan.ten_nguoi_cap_nhat}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" onClick={onHistory} className="gp-btn gp-btn-ghost" title="Lịch sử cập nhật">
                                <Icon name="clock" size={14} />
                            </button>
                            <button type="button" onClick={onUpdate} className="gp-btn gp-btn-ghost" title="Cập nhật mộ phần">
                                <Icon name="edit" size={14} />
                            </button>
                            {canDelete && (
                                <button type="button" onClick={onDelete} className="gp-btn gp-btn-ghost" title="Xóa mộ phần" style={{ color: 'var(--crimson)' }}>
                                    <Icon name="trash" size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ borderRadius: 12, background: 'color-mix(in srgb, var(--terracotta) 8%, transparent)', border: '1px dashed color-mix(in srgb, var(--terracotta) 35%, transparent)', padding: 14 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>Chưa có tọa độ mộ phần cho thành viên này.</div>
                    <button type="button" onClick={onCreate} className="gp-btn gp-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <Icon name="plus" size={14} />
                        Lưu tọa độ
                    </button>
                </div>
            )}
        </div>
    );
}

function CoordinatePill({ label, value }: { label: string; value: string }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--gold-pale)', background: 'var(--gold-glow)', color: 'var(--brown)', padding: '4px 9px', fontSize: 11.5, fontWeight: 700 }}>
            <span style={{ opacity: 0.7 }}>{label}</span>
            {value}
        </span>
    );
}

function MoPhanFormModal({
    members,
    initialMember,
    editing,
    khuMos,
    onClose,
    onSaved,
}: {
    members: Nguoi[];
    initialMember: Nguoi | null;
    editing: MoPhan | null;
    khuMos: KhuMo[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState<MoPhanFormState>({
        thanh_vien_id: String(editing?.thanh_vien_id || initialMember?.id || ''),
        khu_mo_id: String(editing?.khu_mo_id || ''),
        vi_do: editing ? String(editing.vi_do) : '',
        kinh_do: editing ? String(editing.kinh_do) : '',
        ghi_chu: editing?.ghi_chu || '',
        anh_mo: null,
    });
    const [saving, setSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof MoPhanFormState, value: string | File | null) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Thiết bị không hỗ trợ lấy vị trí GPS.');
            return;
        }

        setGpsLoading(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((current) => ({
                    ...current,
                    vi_do: position.coords.latitude.toFixed(7),
                    kinh_do: position.coords.longitude.toFixed(7),
                }));
                setGpsLoading(false);
            },
            () => {
                setError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền GPS hoặc nhập thủ công.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const viDo = Number(form.vi_do);
        const kinhDo = Number(form.kinh_do);

        if (!editing && !form.thanh_vien_id) {
            setError('Vui lòng chọn thành viên đã mất.');
            return;
        }

        if (!Number.isFinite(viDo) || viDo < -90 || viDo > 90) {
            setError('Vĩ độ phải nằm trong khoảng -90 đến 90.');
            return;
        }

        if (!Number.isFinite(kinhDo) || kinhDo < -180 || kinhDo > 180) {
            setError('Kinh độ phải nằm trong khoảng -180 đến 180.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                khu_mo_id: form.khu_mo_id ? Number(form.khu_mo_id) : null,
                vi_do: viDo,
                kinh_do: kinhDo,
                ghi_chu: form.ghi_chu.trim() || null,
                anh_mo: form.anh_mo,
            };

            const res = editing
                ? await moPhanApi.update({ id: editing.id, ...payload })
                : await moPhanApi.create({ thanh_vien_id: Number(form.thanh_vien_id), ...payload });

            if (res.success) {
                toast.success(res.message || 'Đã lưu mộ phần');
                await onSaved();
            } else {
                setError(res.message || 'Không thể lưu mộ phần.');
            }
        } catch (error) {
            setError(getErrorMessage(error, 'Không thể lưu mộ phần.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 560, background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Mộ phần</div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editing ? 'Cập nhật tọa độ' : 'Thêm tọa độ mộ phần'}</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && (
                        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--crimson) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 25%, transparent)', color: 'var(--crimson)', fontSize: 13 }}>
                            {error}
                        </div>
                    )}

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Thành viên đã mất</span>
                        <select value={form.thanh_vien_id} onChange={(event) => setField('thanh_vien_id', event.target.value)} className="gp-input" disabled={!!editing || !!initialMember}>
                            <option value="">Chọn thành viên</option>
                            {members.map((member) => (
                                <option key={member.id} value={member.id}>{member.ten_day_du}</option>
                            ))}
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Khu mộ</span>
                        <select value={form.khu_mo_id} onChange={(event) => setField('khu_mo_id', event.target.value)} className="gp-input">
                            <option value="">Mộ riêng lẻ / chưa gắn khu</option>
                            {khuMos.map((khuMo) => (
                                <option key={khuMo.id} value={khuMo.id}>{khuMo.ten_khu_mo}</option>
                            ))}
                        </select>
                    </label>

                    <button type="button" onClick={useCurrentLocation} disabled={gpsLoading} className="gp-btn gp-btn-ghost" style={{ justifyContent: 'center', opacity: gpsLoading ? 0.65 : 1 }}>
                        <Icon name="crosshair" size={15} />
                        {gpsLoading ? 'Đang lấy vị trí...' : 'Lấy vị trí GPS hiện tại'}
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Vĩ độ</span>
                            <input value={form.vi_do} onChange={(event) => setField('vi_do', event.target.value)} className="gp-input" inputMode="decimal" placeholder="10.7626220" />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Kinh độ</span>
                            <input value={form.kinh_do} onChange={(event) => setField('kinh_do', event.target.value)} className="gp-input" inputMode="decimal" placeholder="106.6601720" />
                        </label>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Ghi chú tìm đường</span>
                        <textarea value={form.ghi_chu} onChange={(event) => setField('ghi_chu', event.target.value)} className="gp-input" rows={4} placeholder="Ví dụ: Mộ nằm cạnh cây dừa to, hàng thứ hai bên trái..." style={{ resize: 'vertical' }} />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Ảnh mộ</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => setField('anh_mo', event.target.files?.[0] || null)}
                            className="gp-input"
                        />
                        {editing?.anh_mo_url && !form.anh_mo && (
                            <a href={editing.anh_mo_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textDecoration: 'none' }}>
                                Xem ảnh hiện tại
                            </a>
                        )}
                    </label>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.65 : 1 }}>
                            {saving ? 'Đang lưu...' : 'Lưu mộ phần'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function MoPhanHistoryModal({ moPhan, onClose }: { moPhan: MoPhan; onClose: () => void }) {
    const [items, setItems] = useState<MoPhanHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        moPhanApi.history(moPhan.id)
            .then((res) => {
                if (res.success) setItems(res.data || []);
                else setError(res.message || 'Không thể tải lịch sử.');
            })
            .catch((err) => setError(getErrorMessage(err, 'Không thể tải lịch sử.')))
            .finally(() => setLoading(false));
    }, [moPhan.id]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 720, maxHeight: '86vh', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Lịch sử tọa độ</div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{moPhan.ten_thanh_vien || 'Mộ phần'}</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: 22, overflow: 'auto' }}>
                    {loading ? (
                        <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Đang tải lịch sử...</div>
                    ) : error ? (
                        <div style={{ color: 'var(--crimson)', fontSize: 13 }}>{error}</div>
                    ) : items.length === 0 ? (
                        <div style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Chưa có lịch sử cập nhật.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {items.map((item) => (
                                <div key={item.id} style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--card-soft)', padding: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                                            {item.ten_nguoi_cap_nhat || 'Hệ thống'}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{formatDateTime(item.created_at)}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <HistoryBlock title="Trước" lat={item.vi_do_cu} lng={item.kinh_do_cu} note={item.ghi_chu_cu} />
                                        <HistoryBlock title="Sau" lat={item.vi_do_moi} lng={item.kinh_do_moi} note={item.ghi_chu_moi} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HistoryBlock({ title, lat, lng, note }: { title: string; lat: number | null; lng: number | null; note: string | null }) {
    return (
        <div style={{ borderRadius: 10, background: 'var(--bg-elev)', border: '1px solid var(--line-soft)', padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
                {lat !== null && lng !== null ? `${Number(lat).toFixed(7)}, ${Number(lng).toFixed(7)}` : 'Chưa có tọa độ'}
            </div>
            {note && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.5 }}>{note}</div>}
        </div>
    );
}

function KhuMoFormModal({ dongHoId, editing, onClose, onSaved }: { dongHoId: number; editing: KhuMo | null; onClose: () => void; onSaved: () => Promise<void> }) {
    const [form, setForm] = useState<KhuMoFormState>({
        ten_khu_mo: editing?.ten_khu_mo || '',
        dia_chi: editing?.dia_chi || '',
        vi_do: editing ? String(editing.vi_do) : '',
        kinh_do: editing ? String(editing.kinh_do) : '',
        mo_ta: editing?.mo_ta || '',
        anh_khu_mo: null,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof KhuMoFormState, value: string | File | null) => setForm((current) => ({ ...current, [key]: value }));

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Thiết bị không hỗ trợ GPS.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setField('vi_do', position.coords.latitude.toFixed(7));
                setField('kinh_do', position.coords.longitude.toFixed(7));
            },
            () => setError('Không thể lấy vị trí hiện tại.'),
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const viDo = Number(form.vi_do);
        const kinhDo = Number(form.kinh_do);
        if (!form.ten_khu_mo.trim()) return setError('Vui lòng nhập tên khu mộ.');
        if (!Number.isFinite(viDo) || viDo < -90 || viDo > 90) return setError('Vĩ độ không hợp lệ.');
        if (!Number.isFinite(kinhDo) || kinhDo < -180 || kinhDo > 180) return setError('Kinh độ không hợp lệ.');

        const payload: KhuMoPayload = {
            dong_ho_id: dongHoId,
            ten_khu_mo: form.ten_khu_mo.trim(),
            dia_chi: form.dia_chi.trim() || null,
            vi_do: viDo,
            kinh_do: kinhDo,
            mo_ta: form.mo_ta.trim() || null,
            anh_khu_mo: form.anh_khu_mo,
        };

        setSaving(true);
        setError('');
        try {
            const res = editing ? await khuMoApi.update({ ...payload, id: editing.id }) : await khuMoApi.create(payload);
            if (res.success) {
                toast.success(res.message || 'Đã lưu khu mộ');
                await onSaved();
            } else {
                setError(res.message || 'Không thể lưu khu mộ.');
            }
        } catch (err) {
            setError(getErrorMessage(err, 'Không thể lưu khu mộ.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 560, background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Khu mộ</div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{editing ? 'Cập nhật khu mộ' : 'Thêm khu mộ'}</h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                        <Icon name="x" size={15} />
                    </button>
                </div>

                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {error && <div style={{ color: 'var(--crimson)', fontSize: 13 }}>{error}</div>}
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Tên khu mộ</span>
                        <input value={form.ten_khu_mo} onChange={(event) => setField('ten_khu_mo', event.target.value)} className="gp-input" />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Địa chỉ</span>
                        <input value={form.dia_chi} onChange={(event) => setField('dia_chi', event.target.value)} className="gp-input" />
                    </label>
                    <button type="button" onClick={useCurrentLocation} className="gp-btn gp-btn-ghost" style={{ justifyContent: 'center' }}>
                        <Icon name="crosshair" size={15} />
                        Lấy vị trí GPS hiện tại
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input value={form.vi_do} onChange={(event) => setField('vi_do', event.target.value)} className="gp-input" placeholder="Vĩ độ" />
                        <input value={form.kinh_do} onChange={(event) => setField('kinh_do', event.target.value)} className="gp-input" placeholder="Kinh độ" />
                    </div>
                    <textarea value={form.mo_ta} onChange={(event) => setField('mo_ta', event.target.value)} className="gp-input" rows={3} placeholder="Mô tả khu mộ..." style={{ resize: 'vertical' }} />
                    <input type="file" accept="image/*" onChange={(event) => setField('anh_khu_mo', event.target.files?.[0] || null)} className="gp-input" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary">{saving ? 'Đang lưu...' : 'Lưu khu mộ'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function DirectionModal({ target, onClose }: { target: { title: string; lat: number; lng: number }; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [vehicle, setVehicle] = useState<OpenMapVehicle>('motor');
    const [summary, setSummary] = useState<OpenMapDirectionSummary | null>(null);
    const [error, setError] = useState('');

    const getDirection = () => {
        if (!navigator.geolocation) {
            setError('Thiết bị không hỗ trợ GPS.');
            return;
        }

        setLoading(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const res = await khuMoApi.direction({
                        origin: `${position.coords.latitude},${position.coords.longitude}`,
                        destination: `${target.lat},${target.lng}`,
                        vehicle,
                        alternatives: false,
                        admin_v2: true,
                    });
                    if (res.success && res.data) setSummary(res.data);
                    else setError(res.message || 'Không thể lấy chỉ đường.');
                } catch (err) {
                    setError(getErrorMessage(err, 'Không thể lấy chỉ đường.'));
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền GPS.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 460, background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div>
                        <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>OpenMap.vn</div>
                        <h2 style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 800 }}>{target.title}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost"><Icon name="x" size={14} /></button>
                </div>
                <div style={{ borderRadius: 12, background: 'var(--card-soft)', border: '1px solid var(--line)', padding: 12, color: 'var(--ink-soft)', fontSize: 13 }}>
                    Điểm đến: {target.lat.toFixed(7)}, {target.lng.toFixed(7)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
                    {OPENMAP_VEHICLES.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                                setVehicle(item.value);
                                setSummary(null);
                                setError('');
                            }}
                            className={vehicle === item.value ? 'gp-btn gp-btn-primary' : 'gp-btn gp-btn-ghost'}
                            style={{ justifyContent: 'center', minWidth: 0, paddingInline: 8 }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {summary && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                            <div style={{ background: 'var(--card-soft)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                                <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.distanceText}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Quãng đường</div>
                            </div>
                            <div style={{ background: 'var(--card-soft)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                                <div style={{ fontSize: 22, fontWeight: 800 }}>{summary.durationText}</div>
                                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Thời gian</div>
                            </div>
                        </div>
                        {(summary.startAddress || summary.endAddress) && (
                            <div style={{ marginTop: 10, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card-soft)', padding: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                                {summary.startAddress && <div><strong>Xuất phát:</strong> {summary.startAddress}</div>}
                                {summary.endAddress && <div><strong>Điểm đến:</strong> {summary.endAddress}</div>}
                            </div>
                        )}
                        {summary.steps.length > 0 && (
                            <div style={{ marginTop: 10, maxHeight: 220, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg-elev)' }}>
                                {summary.steps.map((step, index) => (
                                    <div key={`${step.instruction}-${index}`} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, padding: 12, borderTop: index === 0 ? 'none' : '1px solid var(--line-soft)' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--gold-glow)', color: 'var(--gold)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4 }}>{step.instruction}</div>
                                            <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 3 }}>{step.distanceText} - {step.durationText}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                {error && <div style={{ color: 'var(--crimson)', fontSize: 13, marginTop: 12 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                    <a href={openMapPlaceUrl(target.lat, target.lng)} target="_blank" rel="noreferrer" className="gp-btn gp-btn-ghost" style={{ textDecoration: 'none' }}>
                        <Icon name="map" size={14} />
                        OpenMap
                    </a>
                    <a href={mapUrl(target.lat, target.lng)} target="_blank" rel="noreferrer" className="gp-btn gp-btn-ghost" style={{ textDecoration: 'none' }}>
                        <Icon name="map" size={14} />
                        Google Maps
                    </a>
                    <button type="button" onClick={getDirection} disabled={loading} className="gp-btn gp-btn-primary">
                        <Icon name="crosshair" size={14} />
                        {loading ? 'Đang tính...' : 'Chỉ đường'}
                    </button>
                </div>
            </div>
        </div>
    );
}
