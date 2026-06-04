import { Link } from '@inertiajs/react';
import Icon from '../../../../components/gia-pha/Icon';
import { KhuMo, MoPhan, Nguoi } from '../../../../services/gia-pha.api';

interface KhuMoDetailModalProps {
    khuMo: KhuMo;
    rows: Array<{ moPhan: MoPhan; member: Nguoi | null }>;
    canManage: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDirection: () => void;
    onGraveDirection: (moPhan: MoPhan) => void;
    onHistory: (moPhan: MoPhan) => void;
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

export default function KhuMoDetailModal({
    khuMo,
    rows,
    canManage,
    onClose,
    onEdit,
    onDirection,
    onGraveDirection,
    onHistory,
}: KhuMoDetailModalProps) {
    const khuMoPhotos = khuMo.anh_khu_mo_urls?.length ? khuMo.anh_khu_mo_urls : (khuMo.anh_khu_mo_url ? [khuMo.anh_khu_mo_url] : []);
    const gravePhotos = rows
        .map(({ moPhan, member }) => ({ url: moPhan.anh_mo_url, title: member?.ten_day_du || moPhan.ten_thanh_vien || 'Mộ phần' }))
        .filter((item): item is { url: string; title: string } => !!item.url);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 65, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 920, maxHeight: '88vh', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ minHeight: 154, background: khuMoPhotos[0] ? `linear-gradient(180deg, rgba(34,26,18,0.16), rgba(34,26,18,0.62)), url(${khuMoPhotos[0]}) center/cover` : 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', padding: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
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

                            {khuMoPhotos.length > 0 && (
                                <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', padding: 14 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Hình ảnh khu mộ</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                        {khuMoPhotos.slice(0, 8).map((url, index) => (
                                            <a key={url} href={url} target="_blank" rel="noreferrer" title={`Ảnh khu mộ ${index + 1}`} style={{ height: 86, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line-soft)', background: 'var(--bg-elev)', display: 'block' }}>
                                                <img src={url} alt={`Ảnh khu mộ ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

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
