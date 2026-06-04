import { useMemo } from 'react';
import { MoPhan, Nguoi } from '../../../../services/gia-pha.api';

interface MoPhanMapPanelProps {
    rows: Array<{ member: Nguoi; moPhan: MoPhan | null }>;
}

function mapUrl(viDo: number | string, kinhDo: number | string): string {
    return `https://www.google.com/maps?q=${viDo},${kinhDo}`;
}

export default function MoPhanMapPanel({ rows }: MoPhanMapPanelProps) {
    const points = rows
        .filter((row): row is { member: Nguoi; moPhan: MoPhan } => !!row.moPhan)
        .map(({ member, moPhan }) => ({
            member,
            moPhan,
            lat : Number(moPhan.vi_do),
            lng : Number(moPhan.kinh_do),
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
            latRange : Math.max(maxLat - minLat, 0.0001),
            lngRange : Math.max(maxLng - minLng, 0.0001),
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
