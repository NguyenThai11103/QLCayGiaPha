import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import apiClient from '../../../lib/api.client';
import toast from '../../../lib/toast.util';

export default function Onboarding() {
    const { user, checkAuth } = useAuth();

    const [keyword, setKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        if (!keyword.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await apiClient.get('/onboarding/search-clan', { params: { keyword } });
                setSearchResults(res.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [keyword]);

    const handleJoin = async (clanId: number, clanName: string) => {
        const ho_ten = prompt(`Vui lòng nhập chính xác Họ và Tên của bạn để xin gia nhập dòng họ ${clanName}:`, user?.ho_va_ten || '');
        if (!ho_ten) return;

        // Mặc định chọn giới tính để xin gia nhập (có thể làm modal xịn hơn nếu cần)
        try {
            await apiClient.post('/onboarding/join-clan', {
                dong_ho_id: clanId,
                ho_ten_thanh_vien: ho_ten,
                gioi_tinh: 'nam', // Mặc định, trưởng tộc có thể sửa lại
            });
            toast.success('Gửi yêu cầu thành công!');
            await checkAuth(); // Reload user state
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xin gia nhập.');
        }
    };

    if (user?.trang_thai_gia_nhap === 'cho_duyet') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
                <Head title="Đang chờ duyệt" />
                <div className="gp-card w-full max-w-md space-y-4 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-glow)] text-[var(--gold)]">
                        <Icon name="clock" size={28} />
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-[var(--ink)]">Chờ phê duyệt</h1>
                    <p className="text-[14px] text-[var(--ink-soft)]">
                        Bạn đã gửi yêu cầu gia nhập một dòng họ. Vui lòng chờ Trưởng tộc (Quản lý) duyệt yêu cầu của bạn để có thể truy cập vào dữ
                        liệu gia phả.
                    </p>
                    <button
                        onClick={async () => {
                            await apiClient.post('/auth/logout');
                            window.location.href = '/login';
                        }}
                        className="gp-btn gp-btn-ghost mt-4 w-full"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
            <Head title="Tìm nguồn cội" />

            <div className="gp-card w-full max-w-lg overflow-hidden shadow-xl">
                <div className="bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-8 text-center text-[#fffef9]">
                    <Icon name="lotus" size={32} className="mx-auto mb-3 opacity-90" />
                    <h1 className="font-serif text-[26px] font-bold">Kết nối Gia phả</h1>
                    <p className="mt-2 text-sm opacity-85">Tìm kiếm dòng họ đã được quản trị viên khởi tạo để tiếp nối truyền thống.</p>
                </div>

                <div className="p-6">
                    <div className="space-y-5">
                        <div className="relative">
                            <Icon name="search" size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-mute)]" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm tên dòng họ (Ví dụ: Nguyễn Bá...)"
                                className="h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] pr-4 pl-10 text-sm transition-all focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold-glow)] focus:outline-none"
                            />
                            {isSearching && (
                                <div className="absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
                            )}
                        </div>

                        {keyword.trim() && (
                            <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--line-soft)] bg-white">
                                {searchResults.length > 0 ? (
                                    <ul className="divide-y divide-[var(--line-soft)]">
                                        {searchResults.map((clan) => (
                                            <li
                                                key={clan.id}
                                                className="flex items-center justify-between p-3.5 transition-colors hover:bg-[var(--bg-soft)]"
                                            >
                                                <div>
                                                    <h4 className="text-[14px] font-semibold text-[var(--ink)]">{clan.ten_dong_ho}</h4>
                                                    {clan.dia_chi_tu_duong && (
                                                        <p className="mt-0.5 text-[12px] text-[var(--ink-mute)]">{clan.dia_chi_tu_duong}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleJoin(clan.id, clan.ten_dong_ho)}
                                                    className="gp-btn h-auto bg-[var(--gold-glow)] px-3 py-1.5 text-xs text-[var(--brown)] hover:bg-[var(--gold-pale)]"
                                                >
                                                    Xin gia nhập
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-6 text-center text-sm text-[var(--ink-mute)]">
                                        Không tìm thấy dòng họ nào phù hợp với "{keyword}".
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-xl border border-[var(--gold-soft)] bg-[var(--gold-glow)] p-4 text-[13px] leading-6 text-[var(--brown)]">
                            Dòng họ mới chỉ được tạo bởi quản trị viên hệ thống. Nếu chưa thấy dòng họ của bạn, vui lòng liên hệ quản trị viên để được
                            khởi tạo trước.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
