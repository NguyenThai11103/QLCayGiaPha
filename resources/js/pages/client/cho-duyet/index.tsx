import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import { choDuyetApi } from '../../../services/gia-pha.api';

interface PendingUser {
    id: number;
    ho_ten: string;
    email: string;
    created_at: string;
}

export default function ChoDuyetIndex() {
    const { user } = useAuth();
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

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

    useEffect(() => {
        if (user?.quyen_han === 'quan_ly') {
            void loadData();
        }
    }, [user]);

    const handleProcess = async (userId: number, action: 'approve' | 'reject') => {
        if (!confirm(action === 'approve' ? 'Bạn có chắc chắn muốn duyệt thành viên này?' : 'Bạn có chắc chắn muốn từ chối yêu cầu này?')) {
            return;
        }

        setProcessingId(userId);
        try {
            const res = await choDuyetApi.process(userId, action);
            if (res.success) {
                alert(res.message);
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert(res.message || 'Có lỗi xảy ra.');
            }
        } catch (error) {
            console.error('Failed to process user:', error);
            alert('Có lỗi xảy ra.');
        } finally {
            setProcessingId(null);
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
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
                        <Icon name="check-circle" size={44} color="var(--ink-faint)" />
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
                                                    onClick={() => handleProcess(u.id, 'approve')}
                                                    disabled={processingId === u.id}
                                                    style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: 'var(--jade)', color: 'white', border: 'none', cursor: processingId === u.id ? 'not-allowed' : 'pointer', opacity: processingId === u.id ? 0.7 : 1 }}
                                                >
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    onClick={() => handleProcess(u.id, 'reject')}
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
        </AuthenticatedLayout>
    );
}
