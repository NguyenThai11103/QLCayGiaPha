import { Head, router } from '@inertiajs/react';
import { FormEvent, useState, useEffect } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import toast from '../../../lib/toast.util';
import apiClient from '../../../lib/api.client';

export default function Onboarding() {
    const { user, checkAuth } = useAuth();
    
    const [keyword, setKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // States for Create form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState({
        ten_dong_ho: '',
        ho_ten_thanh_vien: user?.ho_va_ten || '',
        gioi_tinh: 'nam',
        dia_chi_tu_duong: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.ten_dong_ho.trim() || !form.ho_ten_thanh_vien.trim()) {
            toast.error('Vui lòng điền đủ tên dòng họ và họ tên của bạn.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/onboarding/create-clan', form);
            toast.success('Khởi tạo dòng họ thành công!');
            await checkAuth();
            router.visit('/gia-pha/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi khi tạo dòng họ.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user?.trang_thai_gia_nhap === 'cho_duyet') {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
                <Head title="Đang chờ duyệt" />
                <div className="gp-card max-w-md w-full p-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-[var(--gold-glow)] text-[var(--gold)] rounded-full flex items-center justify-center mb-4">
                        <Icon name="clock" size={28} />
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-[var(--ink)]">Chờ phê duyệt</h1>
                    <p className="text-[var(--ink-soft)] text-[14px]">
                        Bạn đã gửi yêu cầu gia nhập một dòng họ. Vui lòng chờ Trưởng tộc (Quản lý) duyệt yêu cầu của bạn để có thể truy cập vào dữ liệu gia phả.
                    </p>
                    <button 
                        onClick={async () => {
                            await apiClient.post('/auth/logout');
                            window.location.href = '/login';
                        }}
                        className="gp-btn gp-btn-ghost w-full mt-4"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
            <Head title="Tìm nguồn cội" />
            
            <div className="gp-card max-w-lg w-full overflow-hidden shadow-xl">
                <div className="bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-8 text-[#fffef9] text-center">
                    <Icon name="lotus" size={32} className="mx-auto mb-3 opacity-90" />
                    <h1 className="font-serif text-[26px] font-bold">Kết nối Gia phả</h1>
                    <p className="text-sm opacity-85 mt-2">Tìm kiếm dòng họ của bạn để tiếp nối truyền thống, hoặc khởi tạo một nhánh mới.</p>
                </div>

                <div className="p-6">
                    {showCreateForm ? (
                        <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-[var(--ink-soft)] mb-1">Tên Dòng Họ (Cần tạo)</label>
                                <input value={form.ten_dong_ho} onChange={e => setForm({...form, ten_dong_ho: e.target.value})} className="gp-input w-full" placeholder="VD: Nguyễn Bá - Thái Bình" autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-[var(--ink-soft)] mb-1">Địa chỉ từ đường</label>
                                <input value={form.dia_chi_tu_duong} onChange={e => setForm({...form, dia_chi_tu_duong: e.target.value})} className="gp-input w-full" placeholder="VD: Thôn X, Xã Y, Huyện Z" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--ink-soft)] mb-1">Họ tên của bạn</label>
                                    <input value={form.ho_ten_thanh_vien} onChange={e => setForm({...form, ho_ten_thanh_vien: e.target.value})} className="gp-input w-full" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--ink-soft)] mb-1">Giới tính</label>
                                    <select value={form.gioi_tinh} onChange={e => setForm({...form, gioi_tinh: e.target.value})} className="gp-input w-full">
                                        <option value="nam">Nam</option>
                                        <option value="nu">Nữ</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="gp-btn gp-btn-ghost flex-1">Hủy bỏ</button>
                                <button type="submit" disabled={isSubmitting} className="gp-btn gp-btn-primary flex-1">
                                    {isSubmitting ? 'Đang khởi tạo...' : 'Lập dòng họ'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-5">
                            <div className="relative">
                                <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]" />
                                <input 
                                    type="text" 
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    placeholder="Tìm tên dòng họ (Ví dụ: Nguyễn Bá...)" 
                                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] text-sm focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold-glow)] transition-all"
                                />
                                {isSearching && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />}
                            </div>

                            {keyword.trim() && (
                                <div className="border border-[var(--line-soft)] rounded-xl max-h-60 overflow-y-auto bg-white">
                                    {searchResults.length > 0 ? (
                                        <ul className="divide-y divide-[var(--line-soft)]">
                                            {searchResults.map(clan => (
                                                <li key={clan.id} className="p-3.5 flex items-center justify-between hover:bg-[var(--bg-soft)] transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-[14px] text-[var(--ink)]">{clan.ten_dong_ho}</h4>
                                                        {clan.dia_chi_tu_duong && <p className="text-[12px] text-[var(--ink-mute)] mt-0.5">{clan.dia_chi_tu_duong}</p>}
                                                    </div>
                                                    <button onClick={() => handleJoin(clan.id, clan.ten_dong_ho)} className="gp-btn text-xs px-3 py-1.5 h-auto bg-[var(--gold-glow)] text-[var(--brown)] hover:bg-[var(--gold-pale)]">
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

                            <div className="flex items-center gap-3 py-2 text-[12px] text-[var(--ink-faint)]">
                                <span className="h-px flex-1 bg-[var(--line)]" />
                                hoặc
                                <span className="h-px flex-1 bg-[var(--line)]" />
                            </div>

                            <button 
                                onClick={() => setShowCreateForm(true)}
                                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-[var(--gold)] bg-[var(--gold-glow)] text-[var(--brown)] font-semibold text-sm hover:bg-[var(--gold-pale)] transition-colors"
                            >
                                <Icon name="plus" size={16} />
                                Khởi tạo Dòng Họ Mới
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
