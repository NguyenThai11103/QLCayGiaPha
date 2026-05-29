import { FormEvent, useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import toast from '../../../../lib/toast.util';
import { KhuMo, MoPhan, Nguoi, moPhanApi } from '../../../../services/gia-pha.api';

interface MoPhanFormState {
    thanh_vien_id: string;
    khu_mo_id: string;
    vi_do: string;
    kinh_do: string;
    ghi_chu: string;
    anh_mo: File | null;
}

interface MoPhanFormModalProps {
    members: Nguoi[];
    initialMember: Nguoi | null;
    editing: MoPhan | null;
    khuMos: KhuMo[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

export default function MoPhanFormModal({
    members,
    initialMember,
    editing,
    khuMos,
    onClose,
    onSaved,
}: MoPhanFormModalProps) {
    const [form, setForm] = useState<MoPhanFormState>({
        thanh_vien_id  : String(editing?.thanh_vien_id || initialMember?.id || ''),
        khu_mo_id      : String(editing?.khu_mo_id || ''),
        vi_do          : editing ? String(editing.vi_do) : '',
        kinh_do        : editing ? String(editing.kinh_do) : '',
        ghi_chu        : editing?.ghi_chu || '',
        anh_mo          : null,
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
                khu_mo_id : form.khu_mo_id ? Number(form.khu_mo_id) : null,
                vi_do     : viDo,
                kinh_do   : kinhDo,
                ghi_chu   : form.ghi_chu.trim() || null,
                anh_mo    : form.anh_mo,
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
        } catch (err) {
            setError(getErrorMessage(err, 'Không thể lưu mộ phần.'));
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
