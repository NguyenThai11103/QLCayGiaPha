import { useEffect, useState } from 'react';
import Icon from '../../../../components/gia-pha/Icon';
import { MoPhan, MoPhanHistory, moPhanApi } from '../../../../services/gia-pha.api';

interface MoPhanHistoryModalProps {
    moPhan: MoPhan;
    onClose: () => void;
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

function getErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.message) return data.message;

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
    return firstError || fallback;
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

export default function MoPhanHistoryModal({ moPhan, onClose }: MoPhanHistoryModalProps) {
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
