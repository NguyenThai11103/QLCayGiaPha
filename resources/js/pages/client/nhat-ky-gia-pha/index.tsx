import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import toast from '../../../lib/toast.util';
import { NhatKyGiaPha, nhatKyGiaPhaApi } from '../../../services/gia-pha.api';
import { useAuth } from '../../../contexts/auth.context';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const FIELD_TRANSLATIONS: Record<string, string> = {
    ten_day_du: 'Họ và tên',
    gioi_tinh: 'Giới tính',
    ngay_sinh: 'Ngày sinh',
    ngay_mat: 'Ngày mất',
    da_mat: 'Tình trạng sống',
    tieu_su: 'Tiểu sử',
    anh_dai_dien: 'Ảnh đại diện',
    thu_tu_sinh: 'Thứ tự sinh',
    id_cha: 'Cha (ID)',
    id_me: 'Mẹ (ID)',
    doi_thu: 'Đời thứ',
    vo_chong_ids: 'Vợ/Chồng (IDs)',
};

function formatValue(key: string, value: any): string {
    if (value === null || value === undefined || value === '') return 'Trống';
    if (key === 'da_mat') return value ? 'Đã mất' : 'Còn sống';
    if (key === 'gioi_tinh') return value === 'nam' ? 'Nam' : 'Nữ';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
}

export default function NhatKyGiaPhaPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<NhatKyGiaPha[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    
    // Selected log for detailed view modal
    const [selectedLog, setSelectedLog] = useState<NhatKyGiaPha | null>(null);
    
    // Restore confirm state
    const [restoreLogId, setRestoreLogId] = useState<number | null>(null);
    const [restoring, setRestoring] = useState(false);

    const loadLogs = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const dongHoId = user?.dong_ho_id || user?.dong_ho?.id;
            if (!dongHoId) return;

            const res = await nhatKyGiaPhaApi.list(dongHoId);
            if (res.success && res.data) {
                setLogs(res.data);
            } else {
                setLoadError(res.message || 'Không thể tải nhật ký gia phả.');
            }
        } catch (error) {
            setLoadError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadLogs();
    }, [user?.dong_ho_id, user?.dong_ho?.id]);

    const canManage = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '');

    const handleRestoreClick = (logId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setRestoreLogId(logId);
    };

    const handleConfirmRestore = async () => {
        if (!restoreLogId) return;
        setRestoring(true);
        try {
            const res = await nhatKyGiaPhaApi.restore(restoreLogId);
            if (res.success) {
                toast.success(res.message || 'Khôi phục thông tin thành viên thành công.');
                setSelectedLog(null);
                await loadLogs();
            } else {
                toast.error(res.message || 'Không thể khôi phục.');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra trong quá trình khôi phục.');
        } finally {
            setRestoring(false);
            setRestoreLogId(null);
        }
    };

    // Calculate diffs between old data and new data for comparison display
    const diffs = useMemo(() => {
        if (!selectedLog) return [];
        const oldData = selectedLog.du_lieu_cu || {};
        const newData = selectedLog.du_lieu_moi || {};
        
        const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]))
            .filter(k => k in FIELD_TRANSLATIONS);

        const diffList: Array<{ field: string; oldVal: any; newVal: any }> = [];

        for (const key of allKeys) {
            const oldVal = oldData[key];
            const newVal = newData[key];
            
            // Loose equality comparison to handle numbers vs strings
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                diffList.push({
                    field: FIELD_TRANSLATIONS[key] || key,
                    oldVal,
                    newVal
                });
            }
        }

        return diffList;
    }, [selectedLog]);

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'create':
                return { bg: 'color-mix(in srgb, var(--jade) 8%, transparent)', border: 'var(--jade)', color: 'var(--jade)', label: 'Thêm mới' };
            case 'update':
                return { bg: 'color-mix(in srgb, var(--gold) 8%, transparent)', border: 'var(--gold)', color: 'var(--brown)', label: 'Cập nhật' };
            case 'delete':
                return { bg: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: 'var(--crimson)', color: 'var(--crimson)', label: 'Xóa' };
            case 'restore':
                return { bg: 'rgba(99, 102, 241, 0.1)', border: '#6366f1', color: '#4f46e5', label: 'Khôi phục' };
            default:
                return { bg: 'var(--card-soft)', border: 'var(--line)', color: 'var(--ink-mute)', label: action };
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nhật ký gia phả dòng họ" />
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Dòng họ · Lịch sử chỉnh sửa</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Nhật ký thay đổi gia phả</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Theo dõi lịch sử chỉnh sửa thông tin thành viên dòng họ, ai sửa gì, khi nào và cho phép khôi phục về phiên bản cũ.</p>
                </div>

                {loadError && !loading ? (
                    <div style={{ background: 'color-mix(in srgb, var(--crimson) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--crimson) 22%, transparent)', borderRadius: 12, color: 'var(--crimson)', fontSize: 13, marginBottom: 16, padding: '12px 14px' }}>
                        {loadError}
                    </div>
                ) : null}

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'grid', placeItems: 'center', height: 260 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải nhật ký thay đổi...</div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!loading && logs.length === 0 && (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '56px 24px', textAlign: 'center' }}>
                        <Icon name="clock" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: 'var(--ink-mute)' }}>Chưa có thay đổi nào được ghi nhận.</div>
                        <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 6 }}>Hệ thống tự động ghi nhật ký khi các quản lý chỉnh sửa cây gia phả.</p>
                    </div>
                )}

                {/* Timeline display */}
                {!loading && logs.length > 0 && (
                    <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 18, padding: '24px 20px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--line-soft)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {logs.map((log) => {
                                const badge = getActionBadgeColor(log.hanh_dong);
                                return (
                                    <div key={log.id} style={{ position: 'relative' }}>
                                        {/* Marker dot on the timeline line */}
                                        <div style={{ 
                                            position: 'absolute', 
                                            left: -33, 
                                            top: 4, 
                                            width: 16, 
                                            height: 16, 
                                            borderRadius: '50%', 
                                            background: badge.border, 
                                            border: '4px solid var(--bg-elev)', 
                                            boxShadow: '0 0 0 2px var(--line-soft)' 
                                        }} />

                                        {/* Card content */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: 260 }}>
                                                {/* Action description & Type */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                                    <span style={{ 
                                                        background: badge.bg, 
                                                        color: badge.color, 
                                                        border: `1px solid ${badge.border}`, 
                                                        borderRadius: 6, 
                                                        padding: '2px 8px', 
                                                        fontSize: 11.5, 
                                                        fontWeight: 700 
                                                    }}>
                                                        {badge.label}
                                                    </span>
                                                    <span style={{ fontSize: 12.5, color: 'var(--ink-mute)', fontWeight: 500 }}>
                                                        thực hiện bởi <strong style={{ color: 'var(--ink)' }}>{log.nguoi_thuc_hien?.ho_ten || log.nguoi_thuc_hien?.email || 'Hệ thống'}</strong>
                                                    </span>
                                                    <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                                                        • {new Date(log.created_at).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>

                                                {/* Custom Description Text */}
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px 0' }}>
                                                    {log.mo_ta}
                                                </p>
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                {/* Detail button */}
                                                {log.hanh_dong !== 'delete' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedLog(log)} 
                                                        className="gp-btn gp-btn-ghost"
                                                        style={{ padding: '6px 12px', fontSize: 12.5 }}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                )}
                                                
                                                {/* Restore button */}
                                                {canManage && (log.hanh_dong === 'update' || log.hanh_dong === 'delete') && (
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => handleRestoreClick(log.id, e)} 
                                                        className="gp-btn gp-btn-ghost"
                                                        style={{ color: 'var(--gold)', borderColor: 'var(--gold-soft)', padding: '6px 12px', fontSize: 12.5, background: 'var(--gold-glow)' }}
                                                    >
                                                        Khôi phục bản này
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Change details Modal (Diff Modal) */}
            {selectedLog && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}>
                    <div style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-elev)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 24px 60px rgba(0,0,0,0.28)' }}>
                        
                        {/* Modal Header */}
                        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, var(--gold), var(--brown-soft))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>Nhật ký gia phả</div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>So sánh chi tiết thay đổi</h2>
                            </div>
                            <button type="button" onClick={() => setSelectedLog(null)} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.18)', color: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                                <Icon name="x" size={15} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: 22 }}>
                            <div style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 14, marginBottom: 14 }}>
                                <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 6px 0' }}>
                                    Hành động: <strong>{selectedLog.mo_ta}</strong>
                                </p>
                                <p style={{ fontSize: 12.5, color: 'var(--ink-mute)', margin: 0 }}>
                                    Người sửa: {selectedLog.nguoi_thuc_hien?.ho_ten || selectedLog.nguoi_thuc_hien?.email || 'Hệ thống'} • {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
                                </p>
                            </div>

                            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
                                Các trường dữ liệu thay đổi:
                            </h3>

                            {/* Diff Display Table */}
                            {diffs.length === 0 ? (
                                <div style={{ background: 'var(--card-soft)', padding: 16, borderRadius: 10, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
                                    Chỉ có thông tin liên kết quan hệ thay đổi, không có thông tin cá nhân nào thay đổi trực tiếp.
                                </div>
                            ) : (
                                <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                                    {/* Table Header */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr', background: 'var(--card-soft)', borderBottom: '1px solid var(--line)', padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>
                                        <div>Trường dữ liệu</div>
                                        <div>Giá trị cũ</div>
                                        <div>Giá trị mới</div>
                                    </div>
                                    
                                    {/* Table Rows */}
                                    {diffs.map((diff, i) => (
                                        <div 
                                            key={i} 
                                            style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: '130px 1fr 1fr', 
                                                borderBottom: i < diffs.length - 1 ? '1px solid var(--line-soft)' : 'none', 
                                                padding: '12px',
                                                fontSize: 13,
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>{diff.field}</div>
                                            <div style={{ color: 'var(--crimson)', textDecoration: 'line-through', paddingRight: 8, wordBreak: 'break-all' }}>
                                                {formatValue(diff.field, diff.oldVal)}
                                            </div>
                                            <div style={{ color: 'var(--jade)', fontWeight: 600, wordBreak: 'break-all' }}>
                                                {formatValue(diff.field, diff.newVal)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions footer inside Modal */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: '1px solid var(--line-soft)', paddingTop: 16 }}>
                                <button type="button" onClick={() => setSelectedLog(null)} className="gp-btn gp-btn-ghost">Đóng</button>
                                {canManage && (selectedLog.hanh_dong === 'update' || selectedLog.hanh_dong === 'delete') && (
                                    <button 
                                        type="button" 
                                        onClick={(e) => handleRestoreClick(selectedLog.id, e)} 
                                        className="gp-btn gp-btn-primary"
                                        style={{ gap: 6, display: 'flex', alignItems: 'center' }}
                                    >
                                        <Icon name="clock" size={13} />
                                        Khôi phục bản này
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Confirm Restore Modal */}
            <ConfirmModal
                isOpen={restoreLogId !== null}
                onClose={() => setRestoreLogId(null)}
                onConfirm={handleConfirmRestore}
                title="Xác nhận khôi phục thành viên"
                message="Bạn có chắc chắn muốn khôi phục thành viên về phiên bản này? Hệ thống sẽ ghi đè thông tin hiện tại, khôi phục các quan hệ gia đình trực tiếp (cha, mẹ, vợ, chồng) và tự động tính toán lại thế hệ (đời thứ)."
                confirmText={restoring ? 'Đang khôi phục...' : 'Đồng ý khôi phục'}
                cancelText="Hủy bỏ"
                variant="warning"
            />
        </AuthenticatedLayout>
    );
}
