import { Link } from '@inertiajs/react';
import Icon from '../../../../components/gia-pha/Icon';
import { MoPhan, Nguoi } from '../../../../services/gia-pha.api';

interface MoPhanCardProps {
    member: Nguoi;
    moPhan: MoPhan | null;
    canDelete: boolean;
    onCreate: () => void;
    onUpdate: () => void;
    onDelete: () => void;
    onCopy: () => void;
    onHistory: () => void;
    onDirection: () => void;
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

function CoordinatePill({ label, value }: { label: string; value: string }) {
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid var(--gold-pale)', background: 'var(--gold-glow)', color: 'var(--brown)', padding: '4px 9px', fontSize: 11.5, fontWeight: 700 }}>
            <span style={{ opacity: 0.7 }}>{label}</span>
            {value}
        </span>
    );
}

export default function MoPhanCard({
    member,
    moPhan,
    canDelete,
    onCreate,
    onUpdate,
    onDelete,
    onCopy,
    onHistory,
    onDirection,
}: MoPhanCardProps) {
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
