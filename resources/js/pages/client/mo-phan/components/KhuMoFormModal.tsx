import { FormEvent, useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import toast from '../../../../lib/toast.util';
import { KhuMo, KhuMoPayload, khuMoApi } from '../../../../services/gia-pha.api';

interface KhuMoFormState {
    ten_khu_mo: string;
    dia_chi: string;
    vi_do: string;
    kinh_do: string;
    mo_ta: string;
    anh_khu_mo: File | null;
}

interface KhuMoFormModalProps {
    dongHoId: number;
    editing: KhuMo | null;
    onClose: () => void;
    onSaved: () => Promise<void>;
}

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
}

export default function KhuMoFormModal({ dongHoId, editing, onClose, onSaved }: KhuMoFormModalProps) {
    const [form, setForm] = useState<KhuMoFormState>({
        ten_khu_mo  : editing?.ten_khu_mo || '',
        dia_chi     : editing?.dia_chi || '',
        vi_do       : editing ? String(editing.vi_do) : '',
        kinh_do     : editing ? String(editing.kinh_do) : '',
        mo_ta       : editing?.mo_ta || '',
        anh_khu_mo  : null,
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
            dong_ho_id  : dongHoId,
            ten_khu_mo  : form.ten_khu_mo.trim(),
            dia_chi     : form.dia_chi.trim() || null,
            vi_do       : viDo,
            kinh_do     : kinhDo,
            mo_ta       : form.mo_ta.trim() || null,
            anh_khu_mo  : form.anh_khu_mo,
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
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Mô tả thêm</span>
                        <textarea value={form.mo_ta} onChange={(event) => setField('mo_ta', event.target.value)} className="gp-input" rows={4} placeholder="Mô tả vị trí, đặc điểm nhận dạng..." style={{ resize: 'vertical' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}>Ảnh khu mộ</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => setField('anh_khu_mo', event.target.files?.[0] || null)}
                            className="gp-input"
                        />
                        {editing?.anh_khu_mo_url && !form.anh_khu_mo && (
                            <a href={editing.anh_khu_mo_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, textDecoration: 'none' }}>
                                Xem ảnh hiện tại
                            </a>
                        )}
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                        <button type="button" onClick={onClose} className="gp-btn gp-btn-ghost">Hủy</button>
                        <button type="submit" disabled={saving} className="gp-btn gp-btn-primary" style={{ opacity: saving ? 0.65 : 1 }}>
                            {saving ? 'Đang lưu...' : 'Lưu khu mộ'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
