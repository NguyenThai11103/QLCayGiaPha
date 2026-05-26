import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import { choDuyetApi, nguoiApi, Nguoi } from '../../../services/gia-pha.api';

interface PendingUser {
    id: number;
    ho_ten: string;
    email: string;
    created_at: string;
}

export default function ChoDuyetIndex() {
    const { user } = useAuth();
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [tvLienQuan, setTvLienQuan] = useState('');
    const [loaiQuanHe, setLoaiQuanHe] = useState('');
    const [doiThu, setDoiThu] = useState('');
    const [thuTuSinh, setThuTuSinh] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await choDuyetApi.list();
            if (res.success && res.data) {
                setUsers(res.data as unknown as PendingUser[]);
            }
        } catch (error) {
            console.error('Failed to load pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        try {
            const res = await nguoiApi.list();
            if (res.success && res.data) {
                setMembers(res.data);
            }
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    };

    useEffect(() => {
        if (user?.quyen_han === 'quan_ly') {
            void loadData();
            void loadMembers();
        }
    }, [user]);

    const handleReject = async (userId: number) => {
        if (!confirm('Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
            return;
        }

        setProcessingId(userId);
        try {
            const res = await choDuyetApi.process(userId, 'reject');
            if (res.success) {
                alert(res.message);
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert(res.message || 'Có lỗi xảy ra.');
            }
        } catch (error) {
            console.error('Failed to reject user:', error);
            alert('Có lỗi xảy ra.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenApproveModal = (u: PendingUser) => {
        setSelectedUser(u);
        setTvLienQuan('');
        setLoaiQuanHe('');
        setDoiThu('');
        setThuTuSinh('');
        setShowModal(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedUser) return;
        setProcessingId(selectedUser.id);
        setShowModal(false);
        
        try {
            const extraData = {
                thanh_vien_lien_quan_id: tvLienQuan ? parseInt(tvLienQuan) : null,
                loai_quan_he: loaiQuanHe || null,
                doi_thu: doiThu ? parseInt(doiThu) : null,
                thu_tu_sinh: thuTuSinh ? parseInt(thuTuSinh) : null,
            };
            const res = await choDuyetApi.process(selectedUser.id, 'approve', extraData);
            if (res.success) {
                alert(res.message);
                setUsers(users.filter(u => u.id !== selectedUser.id));
                void loadMembers(); // refresh tree members
            } else {
                alert(res.message || 'Có lỗi xảy ra.');
            }
        } catch (error) {
            console.error('Failed to approve user:', error);
            alert('Có lỗi xảy ra.');
        } finally {
            setProcessingId(null);
            setSelectedUser(null);
        }
    };

    if (user?.quyen_han !== 'quan_ly') {
        return (
            <AuthenticatedLayout>
                <div className="p-8 text-center text-[var(--ink-mute)]">Bạn không có quyền truy cập trang này.</div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Duyệt thành viên" />
            <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 2, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>Gia phả · Quản lý</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', fontFamily: 'Cormorant Garamond, serif' }}>Duyệt thành viên</h1>
                    <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', margin: 0 }}>Danh sách người dùng đang chờ được duyệt vào dòng họ của bạn.</p>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', placeItems: 'center', height: 280 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 36, height: 36, border: '4px solid var(--gold-pale)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Đang tải danh sách...</div>
                        </div>
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', padding: '56px 24px', textAlign: 'center' }}>
                        <Icon name="check" size={44} color="var(--ink-faint)" />
                        <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink-mute)' }}>
                            Không có yêu cầu gia nhập nào đang chờ duyệt.
                        </div>
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--card-soft)' }}>
                                    {['Họ và tên', 'Email', 'Thời gian đăng ký', 'Hành động'].map(col => (
                                        <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-mute)', borderBottom: '1px solid var(--line)' }}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, i) => (
                                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                                        <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{u.ho_ten}</td>
                                        <td style={{ padding: '16px', fontSize: 13, color: 'var(--ink-soft)' }}>{u.email}</td>
                                        <td style={{ padding: '16px', fontSize: 13, color: 'var(--ink-soft)' }}>{new Date(u.created_at).toLocaleString('vi-VN')}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => handleOpenApproveModal(u)}
                                                    disabled={processingId === u.id}
                                                    style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--jade)', color: 'white', border: 'none', cursor: processingId === u.id ? 'not-allowed' : 'pointer', opacity: processingId === u.id ? 0.7 : 1 }}
                                                >
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => handleReject(u.id)}
                                                    disabled={processingId === u.id}
                                                    style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--terracotta)', color: 'white', border: 'none', cursor: processingId === u.id ? 'not-allowed' : 'pointer', opacity: processingId === u.id ? 0.7 : 1 }}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Phê Duyệt */}
            {showModal && selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-elev)', borderRadius: 16, width: 480, maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Ghép nối thành viên: {selectedUser.ho_ten}</h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-mute)' }}>Xác định vị trí trên cây gia phả (Không bắt buộc)</p>
                        </div>
                        
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Thành viên liên kết</label>
                                <select 
                                    value={tvLienQuan} 
                                    onChange={e => setTvLienQuan(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', outline: 'none', background: 'var(--bg)', color: 'var(--ink)' }}
                                >
                                    <option value="">-- Chọn thành viên trên cây (tùy chọn) --</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.ten_day_du}</option>
                                    ))}
                                </select>
                            </div>

                            {tvLienQuan && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Mối quan hệ với người này</label>
                                    <select 
                                        value={loaiQuanHe} 
                                        onChange={e => setLoaiQuanHe(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', outline: 'none', background: 'var(--bg)', color: 'var(--ink)' }}
                                    >
                                        <option value="">-- Chọn loại quan hệ --</option>
                                        <option value="vo_chong">Vợ/Chồng</option>
                                        <option value="cha_con">Con (Người liên kết là Cha)</option>
                                        <option value="me_con">Con (Người liên kết là Mẹ)</option>
                                        <option value="anh_chi_em">Anh/Chị/Em</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Đời thứ (Tùy chọn)</label>
                                    <input 
                                        type="number" 
                                        value={doiThu} 
                                        onChange={e => setDoiThu(e.target.value)}
                                        placeholder="Tự động tính..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', outline: 'none', background: 'var(--bg)', color: 'var(--ink)' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Thứ tự sinh (Tùy chọn)</label>
                                    <input 
                                        type="number" 
                                        value={thuTuSinh} 
                                        onChange={e => setThuTuSinh(e.target.value)}
                                        placeholder="Ví dụ: 1"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', outline: 'none', background: 'var(--bg)', color: 'var(--ink)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{ padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, background: 'var(--card-soft)', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer' }}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleConfirmApprove}
                                style={{ padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, background: 'var(--jade)', color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Hoàn tất & Duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
