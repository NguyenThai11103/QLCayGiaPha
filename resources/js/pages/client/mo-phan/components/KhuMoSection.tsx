import Icon from '../../../../components/gia-pha/Icon';
import { KhuMo } from '../../../../services/gia-pha.api';

interface KhuMoSectionProps {
    khuMos: KhuMo[];
    canManage: boolean;
    onCreate: () => void;
    onView: (khuMo: KhuMo) => void;
    onEdit: (khuMo: KhuMo) => void;
    onDirection: (khuMo: KhuMo) => void;
}

export default function KhuMoSection({
    khuMos,
    canManage,
    onCreate,
    onView,
    onEdit,
    onDirection,
}: KhuMoSectionProps) {
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
                    {khuMos.map((khuMo) => {
                        const photoUrls = khuMo.anh_khu_mo_urls?.length ? khuMo.anh_khu_mo_urls : (khuMo.anh_khu_mo_url ? [khuMo.anh_khu_mo_url] : []);

                        return (
                        <div key={khuMo.id} style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--card-soft)', overflow: 'hidden' }}>
                            {photoUrls[0] && (
                                <div style={{ position: 'relative' }}>
                                    <img src={photoUrls[0]} alt={khuMo.ten_khu_mo} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                                    {photoUrls.length > 1 && (
                                        <span style={{ position: 'absolute', right: 10, bottom: 10, borderRadius: 999, background: 'rgba(34,26,18,0.72)', color: 'white', padding: '4px 9px', fontSize: 11, fontWeight: 800 }}>
                                            {photoUrls.length} ảnh
                                        </span>
                                    )}
                                </div>
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
                    );})}
                </div>
            )}
        </div>
    );
}
