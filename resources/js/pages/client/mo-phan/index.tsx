import { Head, Link } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { MoPhan, Nguoi, moPhanApi, nguoiApi } from '../../../services/gia-pha.api';

interface MoPhanFormState {
    thanh_vien_id: string;
    vi_do: string;
    kinh_do: string;
    ghi_chu: string;
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

function isDeceased(member: Nguoi): boolean {
    return member.da_mat === true || member.da_mat === 1;
}

export default function MoPhanPage() {
    const { user } = useAuth();
    const [moPhans, setMoPhans] = useState<MoPhan[]>([]);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState(() => {
        if (typeof window === 'undefined') return '';
        return new URLSearchParams(window.location.search).get('thanh_vien_id') || '';
    });
    const [editing, setEditing] = useState<MoPhan | null>(null);
    const [draftMember, setDraftMember] = useState<Nguoi | null>(null);

    const familyId = user?.dong_ho_id || user?.dong_ho?.id;
    const canDelete = user?.quyen_han === 'quan_ly' || user?.quyen_han === 'admin' || user?.is_master === 1;

    const loadData = async () => {
        setLoading(true);
        try {
            const [moRes, nguoiRes] = await Promise.all([
                moPhanApi.list(familyId ? { dong_ho_id: familyId } : undefined),
                nguoiApi.list(familyId),
            ]);

            if (moRes.success) setMoPhans(moRes.data || []);
            if (nguoiRes.success) setMembers(nguoiRes.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [familyId]);

    const deceasedMembers = useMemo(() => members.filter(isDeceased), [members]);
    const graveByMemberId = useMemo(() => {
        const map = new Map<number, MoPhan>();
        moPhans.forEach((item) => map.set(Number(item.thanh_vien_id), item));
        return map;
    }, [moPhans]);

    const rows = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return deceasedMembers
            .map((member) => ({
                member,
                moPhan: graveByMemberId.get(member.id) || null,
            }))
            .filter(({ member }) => {
                if (selectedMemberId && String(member.id) !== selectedMemberId) return false;
                if (!keyword) return true;

                return member.ten_day_du.toLowerCase().includes(keyword);
            });
    }, [deceasedMembers, graveByMemberId, search, selectedMemberId]);

    const withLocation = rows.filter((row) => row.moPhan).length;
    const withoutLocation = rows.length - withLocation;

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

        const res = await moPhanApi.delete(moPhan.id);
        if (res.success) {
            toast.success(res.message || 'Đã xóa mộ phần');
            await loadData();
        }
    };

    const copyLocation = async (moPhan: MoPhan) => {
        const text = `${moPhan.vi_do}, ${moPhan.kinh_do}`;
        await navigator.clipboard?.writeText(text);
        toast.success('Đã sao chép tọa độ');
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

                    {selectedMemberId && (
                        <button type="button" onClick={() => setSelectedMemberId('')} className="gp-btn gp-btn-ghost">
                            Bỏ lọc
                        </button>
                    )}
                </div>

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
                    onClose={closeModal}
                    onSaved={async () => {
                        closeModal();
                        await loadData();
                    }}
                />
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

function MoPhanCard({
    member,
    moPhan,
    canDelete,
    onCreate,
    onUpdate,
    onDelete,
    onCopy,
}: {
    member: Nguoi;
    moPhan: MoPhan | null;
    canDelete: boolean;
    onCreate: () => void;
    onUpdate: () => void;
    onDelete: () => void;
    onCopy: () => void;
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
                    <div style={{ borderRadius: 12, background: 'var(--card-soft)', border: '1px solid var(--line-soft)', padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                            <CoordinatePill label="Vĩ độ" value={Number(moPhan.vi_do).toFixed(7)} />
                            <CoordinatePill label="Kinh độ" value={Number(moPhan.kinh_do).toFixed(7)} />
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                            {moPhan.ghi_chu || 'Chưa có ghi chú vị trí.'}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <a href={mapUrl(moPhan.vi_do, moPhan.kinh_do)} target="_blank" rel="noreferrer" className="gp-btn gp-btn-ghost" style={{ justifyContent: 'center', textDecoration: 'none' }}>
                            <Icon name="map" size={14} />
                            Mở bản đồ
                        </a>
                        <button type="button" onClick={onCopy} className="gp-btn gp-btn-ghost">
                            <Icon name="copy" size={14} />
                            Sao chép
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                            Cập nhật: {formatDateTime(moPhan.updated_at)}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
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
    onClose,
    onSaved,
}: {
    members: Nguoi[];
    initialMember: Nguoi | null;
    editing: MoPhan | null;
    onClose: () => void;
    onSaved: () => Promise<void>;
}) {
    const [form, setForm] = useState<MoPhanFormState>({
        thanh_vien_id: String(editing?.thanh_vien_id || initialMember?.id || ''),
        vi_do: editing ? String(editing.vi_do) : '',
        kinh_do: editing ? String(editing.kinh_do) : '',
        ghi_chu: editing?.ghi_chu || '',
    });
    const [saving, setSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof MoPhanFormState, value: string) => {
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
                vi_do: viDo,
                kinh_do: kinhDo,
                ghi_chu: form.ghi_chu.trim() || null,
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
