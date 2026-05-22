import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import apiClient from '../../../lib/api.client';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import QRHubModal from '../../../components/gia-pha/QRHubModal';

interface DongHoWithStats extends DongHo {
    soThanhVien: number;
    daMat: number;
}

type FormState = {
    id?: number;
    ten_dong_ho: string;
    mo_ta: string;
    gia_huan?: string;
    loi_gioi_thieu?: string;
    dia_chi_tu_duong?: string;
    logo_path?: string;
    anh_tu_duong_path?: string;
    theme_color?: 'gold' | 'crimson' | 'jade' | 'indigo' | 'bronze';
};

const emptyForm: FormState = {
    ten_dong_ho: '',
    mo_ta: '',
    gia_huan: '',
    loi_gioi_thieu: '',
    dia_chi_tu_duong: '',
    logo_path: '',
    anh_tu_duong_path: '',
    theme_color: 'gold',
};

const localThemePresets: Record<string, Record<string, string>> = {
    gold: {
        '--gold': '#b8902c',
        '--gold-soft': '#d4af55',
        '--gold-glow': '#faf1d4',
        '--gold-pale': '#f0e2bb',
        '--brown': '#5c3a1e',
        '--brown-soft': '#8a5a2e',
    },
    crimson: {
        '--gold': '#9b2b1f',
        '--gold-soft': '#c44535',
        '--gold-glow': '#fdeeed',
        '--gold-pale': '#fcdcd9',
        '--brown': '#5a1911',
        '--brown-soft': '#80261b',
    },
    jade: {
        '--gold': '#2f5d3a',
        '--gold-soft': '#4a7a52',
        '--gold-glow': '#edf7ee',
        '--gold-pale': '#dbeedc',
        '--brown': '#193a20',
        '--brown-soft': '#24522d',
    },
    indigo: {
        '--gold': '#225b7a',
        '--gold-soft': '#3e84a8',
        '--gold-glow': '#edf6fa',
        '--gold-pale': '#dcecf5',
        '--brown': '#123447',
        '--brown-soft': '#1a4963',
    },
    bronze: {
        '--gold': '#8b5a2b',
        '--gold-soft': '#a06d3b',
        '--gold-glow': '#f7f2ed',
        '--gold-pale': '#eeded1',
        '--brown': '#4a2f14',
        '--brown-soft': '#69431c',
    }
};

const themePresetsList = [
    { key: 'gold', name: 'Vàng Cổ Phong', color: '#b8902c', desc: 'Ấm áp, tôn nghiêm' },
    { key: 'crimson', name: 'Hùng Tráng', color: '#9b2b1f', desc: 'Đỏ thắm, uy nghi' },
    { key: 'jade', name: 'Thanh Nhã', color: '#2f5d3a', desc: 'Xanh ngọc, an nhiên' },
    { key: 'indigo', name: 'Thâm Trầm', color: '#225b7a', desc: 'Xanh chàm, trí tuệ' },
    { key: 'bronze', name: 'Cổ Kính', color: '#8b5a2b', desc: 'Nâu đồng, hoài niệm' },
] as const;

const logoOptions = [
    { label: 'Vàng Cổ', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&q=80' },
    { label: 'Hùng Tráng', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=120&q=80' },
    { label: 'Thanh Nhã', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=120&q=80' },
];

const anhTuDuongOptions = [
    { label: 'Cổ Kính', url: 'https://images.unsplash.com/photo-1590076275577-46c41eb4e8c9?w=600&q=80' },
    { label: 'Truyền Thống', url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=600&q=80' },
    { label: 'An Bình', url: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=600&q=80' },
];

const activities = [
    ['photo', 'Nguyễn Minh Anh', 'đã thêm ảnh kỷ vật', 'Cụ Tổ Nguyễn Văn Trường', '2 giờ trước', 'jade'],
    ['edit', 'Nguyễn Văn Hải', 'cập nhật tiểu sử cho', 'Ông Nguyễn Văn Minh', 'Hôm qua', 'gold'],
    ['link', 'Nguyễn Đức Long', 'liên kết quan hệ', 'Bà Nguyễn Thị Hoa và Ông Nguyễn Văn Quang', '2 ngày', 'terracotta'],
    ['ai', 'AI Trợ lý', 'gợi ý OCR cho tài liệu', 'Gia phả cũ - Trang 47', '3 ngày', 'crimson'],
] as const;

const events = [
    ['15', 'Tháng 3 ÂL', '2026', 'Giỗ Tổ - Cụ Nguyễn Văn Trường', 'Từ đường Tiên Điền', '47 người dự', 12, 'scroll', 'brown'],
    ['20', 'Tháng 4', '2026', 'Lễ cưới Nguyễn Đức Long & Phạm Thúy Quỳnh', 'Hà Nội', '120 người dự', 28, 'heart', 'terracotta'],
    ['10', 'Tháng 5 ÂL', '2026', 'Giỗ Cụ Bà Trần Thị Lan', 'Từ đường Tiên Điền', '35 người dự', 51, 'lotus', 'jade'],
] as const;

export default function AdminDashboard() {
    const { user } = useAuth();
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrModalTab, setQrModalTab] = useState<'my-qr' | 'scan'>('my-qr');
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [selectedThanhVienId, setSelectedThanhVienId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'culture' | 'branding'>('info');

    // Tự động thiết lập thành viên giả lập mặc định nếu chưa liên kết thực tế
    useEffect(() => {
        if (user?.thanh_vien_id) {
            setSelectedThanhVienId(parseInt(String(user.thanh_vien_id), 10));
        } else if (members.length > 0) {
            setSelectedThanhVienId(members[0].id);
        }
    }, [user?.thanh_vien_id, members]);

    const activeThanhVienId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : selectedThanhVienId;
    const activeMember = members.find((m) => m.id === activeThanhVienId) || null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [dh, ng] = await Promise.all([dongHoApi.list(), nguoiApi.list()]);
            setDongHos(dh.data || []);
            setMembers(ng.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const withStats: DongHoWithStats[] = useMemo(
        () =>
            dongHos.map((dh) => {
                const clanMembers = members.filter((member) => member.id_dong_ho === dh.id);
                return {
                    ...dh,
                    soThanhVien: clanMembers.length,
                    daMat: clanMembers.filter((member) => Boolean(member.da_mat)).length,
                };
            }),
        [dongHos, members],
    );

    const generations = useMemo(() => buildGenerationStats(members), [members]);
    const maxGeneration = generations.length ? Math.max(...generations.map((item) => item.generation)) : 0;
    const primaryClan = withStats[0];

    const stats = [
        { label: 'Tổng thành viên', value: members.length, delta: `+${Math.min(12, Math.max(0, members.length))} tháng này`, icon: 'users', accent: 'gold' },
        { label: 'Đời sâu nhất', value: maxGeneration || 1, delta: 'Từ dữ liệu hiện có', icon: 'layers', accent: 'jade' },
        { label: 'Dòng họ', value: dongHos.length, delta: `${withStats.filter((clan) => clan.soThanhVien > 0).length} đang có thành viên`, icon: 'branch', accent: 'terracotta' },
        { label: 'Sự kiện sắp tới', value: 4, delta: 'Giỗ Tổ trong 12 ngày', icon: 'calendar', accent: 'crimson' },
    ] as const;

    const openCreate = () => {
        setForm(emptyForm);
        setFormOpen(true);
    };

    const openEdit = (dh: DongHo) => {
        setForm({
            id: dh.id,
            ten_dong_ho: dh.ten_dong_ho,
            mo_ta: dh.mo_ta || '',
            gia_huan: dh.gia_huan || '',
            loi_gioi_thieu: dh.loi_gioi_thieu || '',
            dia_chi_tu_duong: dh.dia_chi_tu_duong || '',
            logo_path: dh.logo_path || '',
            anh_tu_duong_path: dh.anh_tu_duong_path || '',
            theme_color: (dh.theme_color as any) || 'gold',
        });
        setActiveTab('info');
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setForm(emptyForm);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.ten_dong_ho.trim()) {
            toast.error('Vui lòng nhập tên dòng họ.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ten_dong_ho: form.ten_dong_ho.trim(),
                mo_ta: form.mo_ta.trim() || null,
                gia_huan: form.gia_huan?.trim() || null,
                loi_gioi_thieu: form.loi_gioi_thieu?.trim() || null,
                dia_chi_tu_duong: form.dia_chi_tu_duong?.trim() || null,
                logo_path: form.logo_path?.trim() || null,
                anh_tu_duong_path: form.anh_tu_duong_path?.trim() || null,
                theme_color: form.theme_color || 'gold',
            };
            const url = form.id ? '/dong-ho/update' : '/dong-ho/create';
            const body = form.id ? { id: form.id, ...payload } : payload;
            const { data: res } = await apiClient.post(url, body);

            if (res.success) {
                toast.success(res.message || 'Lưu thành công.');
                closeForm();
                await loadData();
                
                // Tự động tải lại thông tin auth nếu dòng họ được cập nhật trùng với dòng họ của user hiện tại
                if (form.id === user?.dong_ho?.id) {
                    router.reload({ only: ['auth'] });
                }
            } else {
                toast.error(res.message || 'Không thể lưu.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (dh: DongHo, count: number) => {
        if (count > 0) {
            toast.error(`Dòng họ "${dh.ten_dong_ho}" còn ${count} thành viên, không thể xóa.`);
            return;
        }

        if (!window.confirm(`Xóa dòng họ "${dh.ten_dong_ho}"?`)) return;

        try {
            const { data: res } = await apiClient.post('/dong-ho/delete', { id: dh.id });
            if (res.success) {
                toast.success(res.message || 'Xóa dòng họ thành công.');
                await loadData();
            } else {
                toast.error(res.message || 'Không thể xóa dòng họ.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Bảng điều khiển Quản trị Gia Phả" />
            <div className="mx-auto max-w-[1320px]">
                <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="gp-eyebrow">Bảng điều khiển Quản trị · Thứ Sáu, 15 tháng 5, 2026</div>
                        <h1 className="gp-page-title mt-2">{getGreeting()}, {user?.ten_goi_nho || user?.ho_va_ten || 'Quản trị viên'}</h1>
                        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--ink-mute)]">
                            {primaryClan
                                ? `Không gian ${primaryClan.ten_dong_ho} đang có ${primaryClan.soThanhVien} thành viên được ghi nhận.`
                                : 'Bắt đầu bằng việc lập dòng họ đầu tiên, sau đó thêm thành viên và dựng cây gia phả.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="gp-btn gp-btn-ghost">
                            Tuần này
                            <Icon name="chevron-down" size={15} />
                        </button>
                        <button type="button" onClick={openCreate} className="gp-btn gp-btn-primary">
                            <Icon name="plus" size={16} />
                            Thêm dòng họ
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <StatCard key={stat.label} {...stat} />
                    ))}
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <section className="gp-card p-[22px]">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-[var(--ink)]">Phân bố thế hệ</h2>
                                    <p className="mt-1 text-[12.5px] text-[var(--ink-mute)]">Tổng hợp từ dữ liệu thành viên hiện có</p>
                                </div>
                                <div className="flex items-center gap-3 text-[12px] text-[var(--ink-mute)]">
                                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold)]" />Còn sống</span>
                                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--gold-pale)] ring-1 ring-[var(--gold-soft)]" />Đã mất</span>
                                </div>
                            </div>
                            <GenerationChart data={generations} />
                        </section>

                        <section className="gp-card p-[22px]">
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-[16px] font-semibold text-[var(--ink)]">Hoạt động gần đây</h2>
                                <button type="button" className="text-[12.5px] font-semibold text-[var(--gold)]">Xem tất cả</button>
                            </div>
                            <div>
                                {activities.map(([icon, who, action, target, time, accent]) => (
                                    <div key={`${who}-${time}`} className="flex items-start gap-3 border-b border-[var(--line-soft)] py-3 last:border-b-0">
                                        <div
                                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border"
                                            style={{
                                                background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
                                                borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
                                                color: `var(--${accent})`,
                                            }}
                                        >
                                            <Icon name={icon} size={15} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13.5px] leading-6 text-[var(--ink-soft)]">
                                                <span className="font-semibold text-[var(--ink)]">{who}</span> {action}{' '}
                                                <span className="font-medium text-[var(--brown)]">{target}</span>
                                            </p>
                                            <div className="mt-0.5 text-[11.5px] text-[var(--ink-mute)]">{time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-[var(--ink)]">Dòng họ của bạn</h2>
                                    <p className="mt-1 text-[12.5px] text-[var(--ink-mute)]">Chọn một dòng họ để quản lý thành viên và cây gia phả.</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="gp-card grid min-h-48 place-items-center">
                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                                </div>
                            ) : withStats.length === 0 ? (
                                <div className="gp-card border-dashed p-12 text-center">
                                    <Icon name="lotus" size={34} className="mx-auto text-[var(--gold)]" />
                                    <h3 className="mt-4 font-serif text-2xl font-semibold">Chưa có dòng họ nào</h3>
                                    <p className="mt-2 text-sm text-[var(--ink-mute)]">Hãy thêm dòng họ đầu tiên để bắt đầu ghi chép nguồn cội.</p>
                                    <button type="button" onClick={openCreate} className="gp-btn gp-btn-primary mt-5">Thêm dòng họ</button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {withStats.map((dh) => (
                                        <ClanCard key={dh.id} clan={dh} onEdit={() => openEdit(dh)} onDelete={() => void handleDelete(dh, dh.soThanhVien)} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-6">
                        {activeThanhVienId && (
                            <section className="gp-card relative overflow-hidden border-[var(--gold-soft)] bg-[linear-gradient(135deg,rgba(253,250,243,0.9),rgba(255,255,255,0.9))] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
                                <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-60" />
                                <div className="relative flex flex-col items-center text-center">
                                    <span className="gp-chip gp-chip-gold mb-3 animate-pulse">
                                        <Icon name="lotus" size={11} />
                                        Thẻ gia đình số
                                    </span>

                                    {!user?.thanh_vien_id && (
                                        <div className="mb-3 rounded-lg bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] p-2 text-left border border-[color-mix(in_srgb,var(--gold)_14%,transparent)] w-full">
                                            <div className="flex gap-1.5 items-start text-[10px] text-[var(--gold)] font-medium leading-normal">
                                                <Icon name="sparkle" size={12} className="shrink-0 mt-0.5" />
                                                <span>Tài khoản chưa liên kết gia phả. Hệ thống tự động giả lập định danh để test.</span>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="font-serif text-[18px] font-bold text-[var(--brown)]">
                                        {activeMember?.ten_day_du || user?.ho_va_ten || 'Thành viên'}
                                    </h3>
                                    <p className="text-[11px] font-medium text-[var(--ink-mute)] uppercase tracking-wider mt-0.5">
                                        {!user?.thanh_vien_id ? 'Thành viên giả lập' : (user?.ten_chuc_vu || 'Thành viên dòng họ')}
                                    </p>

                                    {!user?.thanh_vien_id && members.length > 0 && (
                                        <div className="mt-2.5 mb-1 w-full text-left">
                                            <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1">
                                                Chọn nhân vật test nhanh:
                                            </label>
                                            <select
                                                value={selectedThanhVienId || ''}
                                                onChange={(e) => setSelectedThanhVienId(Number(e.target.value))}
                                                className="gp-input w-full text-[11px] py-1 px-2.5 bg-white border-[var(--gold-soft)] rounded-lg font-medium text-[var(--ink-soft)] focus:border-[var(--gold)] focus:outline-none"
                                            >
                                                {members.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.ten_day_du} (ID: {m.id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setQrModalTab('my-qr');
                                            setIsQRModalOpen(true);
                                        }}
                                        className="relative mt-4 group rounded-xl border border-[var(--gold-soft)] bg-white p-2.5 transition-all hover:scale-105 hover:shadow-md cursor-zoom-in"
                                        title="Click để phóng to mã QR"
                                    >
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/gia-pha/tra-cuu-danh-xung?target_id=${activeThanhVienId}`)}&color=63462D&bgcolor=FFFFFF`}
                                            alt="Mã QR cá nhân"
                                            className="h-28 w-28 object-contain"
                                        />
                                        <span className="absolute inset-0 m-auto grid h-7 w-7 place-items-center rounded-lg border border-[var(--gold-soft)] bg-white text-[var(--gold)] shadow-sm">
                                            <Icon name="lotus" size={14} />
                                        </span>
                                    </button>

                                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-soft)] max-w-[200px]">
                                        Đăng nhập là có ngay mã QR. Đưa mã cho người khác quét để nhận diện danh xưng lập tức!
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQrModalTab('scan');
                                            setIsQRModalOpen(true);
                                        }}
                                        className="gp-btn gp-btn-primary w-full mt-4 flex items-center justify-center gap-2"
                                    >
                                        <Icon name="camera" size={15} />
                                        Quét QR người khác
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="gp-card bg-[linear-gradient(145deg,var(--card)_0%,var(--card)_52%,var(--gold-glow)_200%)] p-[22px]">
                            <h2 className="mb-4 text-[16px] font-semibold">Thao tác nhanh</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction icon="add-user" label="Thêm thành viên" color="gold" onClick={() => router.visit('/gia-pha/thanh-vien')} />
                                <QuickAction icon="link" label="Tra quan hệ" color="jade" onClick={() => router.visit('/gia-pha/tra-cuu-danh-xung')} />
                                <QuickAction icon="calendar" label="Tạo lễ giỗ" color="crimson" onClick={() => undefined} />
                                <QuickAction icon="sparkle" label="Thử nghiệm QR" color="gold" onClick={() => router.visit('/gia-pha/test-qr')} />
                                <QuickAction icon="book" label="Tải gia phả cũ" color="terracotta" onClick={() => undefined} />
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[16px] font-semibold">Sự kiện sắp tới</h2>
                                <button type="button" className="text-[12.5px] font-semibold text-[var(--gold)]">Lịch họ</button>
                            </div>
                            {events.map(([day, month, year, title, location, attendees, days, icon, accent]) => (
                                <article key={title} className="gp-card gp-card-hover p-4">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className="flex min-w-16 flex-col items-center rounded-[10px] border px-2.5 py-2"
                                            style={{
                                                background: `color-mix(in srgb, var(--${accent}) 12%, transparent)`,
                                                borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
                                            }}
                                        >
                                            <div className="text-[9px] font-bold uppercase tracking-[1.2px]" style={{ color: `var(--${accent})` }}>{month}</div>
                                            <div className="font-serif text-[25px] font-semibold leading-none">{day}</div>
                                            <div className="text-[9px] text-[var(--ink-mute)]">{year}</div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap gap-2">
                                                <span className="gp-chip" style={{ color: `var(--${accent})` }}><Icon name={icon} size={11} />Lễ họ</span>
                                                {days <= 14 && <span className="gp-chip gp-chip-crimson">Còn {days} ngày</span>}
                                            </div>
                                            <h3 className="font-serif text-[17px] font-semibold leading-tight">{title}</h3>
                                            <p className="mt-1 text-[12px] text-[var(--ink-mute)]">{location} · {attendees}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        <section className="gp-card relative overflow-hidden border-[var(--gold-soft)] bg-[linear-gradient(135deg,var(--gold-glow),var(--card))] p-[22px]">
                            <Icon name="sparkle" size={92} className="absolute -left-8 -top-8 text-[var(--gold)] opacity-10" />
                            <div className="relative">
                                <span className="gp-chip gp-chip-gold"><Icon name="sparkle" size={12} />AI Trợ lý</span>
                                <h2 className="mt-4 font-serif text-[22px] font-semibold leading-tight">Phát hiện 2 thành viên có thể là một người</h2>
                                <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">
                                    Hồ sơ "Nguyễn Văn Tài" và ảnh chú thích "Ông Tài 1972" có ngày mất, nhánh cha mẹ và địa điểm trùng khớp 86%.
                                </p>
                                <div className="mt-5 flex gap-2">
                                    <button type="button" className="gp-btn gp-btn-primary">Xem chi tiết</button>
                                    <button type="button" className="gp-btn gp-btn-ghost">Bỏ qua</button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {formOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
                    <form 
                        onSubmit={handleSubmit} 
                        className={`gp-card w-full ${form.id ? 'max-w-3xl' : 'max-w-md'} overflow-hidden shadow-[var(--shadow-lg)] transition-all`}
                    >
                        <div className="bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-4 text-[#fffef9]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-serif text-[22px] font-semibold">
                                        {form.id ? 'Cấu hình Bản sắc Gia tộc' : 'Thêm dòng họ mới'}
                                    </h3>
                                    {form.id && (
                                        <p className="text-[11px] text-[#fffef9]/85 mt-0.5 font-sans">
                                            Thiết lập không gian số, nhận diện và màu sắc phong thủy cho gia tộc
                                        </p>
                                    )}
                                </div>
                                <button type="button" onClick={closeForm} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                                    <Icon name="x" size={17} />
                                </button>
                            </div>
                        </div>

                        {form.id && (
                            <div className="flex border-b border-[var(--line-soft)] bg-[var(--card-soft)] px-6">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('info')}
                                    className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                        activeTab === 'info'
                                            ? 'border-[var(--gold)] text-[var(--gold)]'
                                            : 'border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    Thông tin chung
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('culture')}
                                    className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                        activeTab === 'culture'
                                            ? 'border-[var(--gold)] text-[var(--gold)]'
                                            : 'border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    Gia huấn & Lịch sử
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('branding')}
                                    className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                        activeTab === 'branding'
                                            ? 'border-[var(--gold)] text-[var(--gold)]'
                                            : 'border-transparent text-[var(--ink-mute)] hover:text-[var(--ink)]'
                                    }`}
                                >
                                    Màu sắc & Nhận diện
                                </button>
                            </div>
                        )}

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {!form.id ? (
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Tên dòng họ *</span>
                                        <input value={form.ten_dong_ho} onChange={(e) => setForm({ ...form, ten_dong_ho: e.target.value })} className="gp-input w-full" required maxLength={255} placeholder="Ví dụ: Họ Nguyễn Bá" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Mô tả sơ lược</span>
                                        <textarea value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} rows={4} className="gp-input w-full resize-none" placeholder="Nguồn gốc, quê quán..." />
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeTab === 'info' && (
                                        <div className="space-y-4">
                                            <label className="block">
                                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Tên dòng họ *</span>
                                                <input value={form.ten_dong_ho} onChange={(e) => setForm({ ...form, ten_dong_ho: e.target.value })} className="gp-input w-full" required maxLength={255} placeholder="Ví dụ: Họ Nguyễn Bá" />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Địa chỉ từ đường</span>
                                                <input value={form.dia_chi_tu_duong || ''} onChange={(e) => setForm({ ...form, dia_chi_tu_duong: e.target.value })} className="gp-input w-full" maxLength={255} placeholder="Địa chỉ nhà thờ tổ, từ đường dòng tộc..." />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Mô tả sơ lược</span>
                                                <textarea value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} rows={4} className="gp-input w-full resize-none" placeholder="Tóm tắt ngắn gọn nguồn cội, chi nhánh..." />
                                            </label>
                                        </div>
                                    )}

                                    {activeTab === 'culture' && (
                                        <div className="space-y-4">
                                            <label className="block">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Gia huấn dòng tộc</span>
                                                    <span className="text-[10px] text-[var(--gold)] font-medium">Hiển thị dạng cuộn thư cổ kính ở trang chủ</span>
                                                </div>
                                                <textarea 
                                                    value={form.gia_huan || ''} 
                                                    onChange={(e) => setForm({ ...form, gia_huan: e.target.value })} 
                                                    rows={5} 
                                                    className="gp-input w-full font-serif text-[15px] leading-relaxed bg-[linear-gradient(to_bottom,rgba(253,250,243,0.3),rgba(253,250,243,0.5))]" 
                                                    placeholder="Lời răn dạy của tổ tiên, gia quy dòng họ, giá trị cốt lõi dòng tộc..." 
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">Lời giới thiệu & Lịch sử dòng họ</span>
                                                <textarea 
                                                    value={form.loi_gioi_thieu || ''} 
                                                    onChange={(e) => setForm({ ...form, loi_gioi_thieu: e.target.value })} 
                                                    rows={6} 
                                                    className="gp-input w-full leading-relaxed" 
                                                    placeholder="Lịch sử chi tiết nguồn gốc tổ tiên, hành trình lập nghiệp, định cư qua các thế hệ..." 
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {activeTab === 'branding' && (
                                        <div className="space-y-5">
                                            <div>
                                                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                                                    Tông màu chủ đạo phong thủy (Theme Color)
                                                </span>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                    {themePresetsList.map((p) => (
                                                        <button
                                                            key={p.key}
                                                            type="button"
                                                            onClick={() => setForm({ ...form, theme_color: p.key })}
                                                            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
                                                                form.theme_color === p.key
                                                                    ? 'border-[var(--gold)] bg-[linear-gradient(135deg,rgba(253,250,243,0.7),rgba(253,250,243,1))] ring-2 ring-[var(--gold-soft)] shadow-sm'
                                                                    : 'border-[var(--line-soft)] hover:bg-[var(--card-soft)] bg-white'
                                                            }`}
                                                        >
                                                            <span className="h-8 w-8 rounded-full border shadow-inner transition-transform group-hover:scale-105" style={{ backgroundColor: p.color, borderColor: 'rgba(0,0,0,0.1)' }} />
                                                            <span className="text-[11px] font-bold text-[var(--ink)]">{p.name}</span>
                                                            <span className="text-[8.5px] text-[var(--ink-mute)] leading-none">{p.desc}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="mt-3.5 rounded-xl border border-[var(--line-soft)] bg-white p-3 text-left">
                                                    <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-[var(--ink-mute)] flex items-center gap-1.5">
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                                                        Xem trước màu chủ đạo khi áp dụng vào giao diện
                                                    </div>
                                                    <div 
                                                        className="rounded-lg border p-2.5 flex gap-2.5 shadow-sm transition-all" 
                                                        style={{
                                                            backgroundColor: '#fafaf9',
                                                            borderColor: 'var(--line-soft)',
                                                            ...(form.theme_color ? localThemePresets[form.theme_color] : {})
                                                        } as any}
                                                    >
                                                        {/* Sidebar giả lập */}
                                                        <div className="w-16 border-r border-[var(--line)] pr-2 shrink-0 space-y-1.5">
                                                            <div className="h-3.5 rounded-[4px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] flex items-center justify-center text-[5px] text-white font-serif tracking-widest leading-none font-bold">GIA TỘC</div>
                                                            <div className="h-1.5 w-4/5 rounded bg-[var(--gold-pale)]" />
                                                            <div className="h-1.5 w-2/3 rounded bg-gray-200" />
                                                        </div>
                                                        {/* Content giả lập */}
                                                        <div className="flex-1 space-y-1.5">
                                                            <div className="h-2 w-1/3 rounded bg-[var(--brown)]" />
                                                            <div className="h-1.5 w-full rounded bg-gray-200" />
                                                            <div className="flex gap-1.5">
                                                                <div className="h-3.5 w-10 rounded bg-[var(--gold)] flex items-center justify-center text-[5px] text-white font-bold leading-none">Cây gia phả</div>
                                                                <div className="h-3.5 w-8 rounded-[3px] bg-gray-200" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="block">
                                                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                                                            Đường dẫn Logo dòng tộc
                                                        </span>
                                                        <input 
                                                            value={form.logo_path || ''} 
                                                            onChange={(e) => setForm({ ...form, logo_path: e.target.value })} 
                                                            className="gp-input w-full text-xs font-mono" 
                                                            maxLength={255} 
                                                            placeholder="URL ảnh logo (PNG/JPG)..." 
                                                        />
                                                    </label>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase tracking-wider block mb-1">
                                                            Hoặc chọn logo mẫu gợi ý:
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {logoOptions.map((opt, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, logo_path: opt.url })}
                                                                    className="flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] hover:border-[var(--gold-soft)] p-1 bg-white hover:bg-[var(--gold-glow)] transition-all"
                                                                >
                                                                    <img src={opt.url} alt="Sample logo" className="h-5 w-5 rounded object-cover" />
                                                                    <span className="text-[9.5px] font-semibold text-[var(--ink-soft)]">{opt.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block">
                                                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                                                            Đường dẫn Ảnh Từ đường
                                                        </span>
                                                        <input 
                                                            value={form.anh_tu_duong_path || ''} 
                                                            onChange={(e) => setForm({ ...form, anh_tu_duong_path: e.target.value })} 
                                                            className="gp-input w-full text-xs font-mono" 
                                                            maxLength={255} 
                                                            placeholder="URL ảnh bìa từ đường dòng họ..." 
                                                        />
                                                    </label>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-[var(--ink-mute)] uppercase tracking-wider block mb-1">
                                                            Hoặc chọn ảnh từ đường mẫu:
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {anhTuDuongOptions.map((opt, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, anh_tu_duong_path: opt.url })}
                                                                    className="flex items-center gap-1 rounded-lg border border-[var(--line-soft)] hover:border-[var(--gold-soft)] p-1 bg-white hover:bg-[var(--gold-glow)] transition-all"
                                                                >
                                                                    <img src={opt.url} alt="Sample cover" className="h-5 w-8 rounded object-cover" />
                                                                    <span className="text-[9px] font-semibold text-[var(--ink-soft)] tracking-tight">{opt.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[var(--line-soft)] bg-[var(--card-soft)] px-6 py-4">
                            <button type="button" onClick={closeForm} className="gp-btn gp-btn-ghost">
                                Hủy
                            </button>
                            <button type="submit" disabled={saving} className="gp-btn gp-btn-primary disabled:opacity-60 min-w-20">
                                {saving ? (
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Đang lưu...
                                    </span>
                                ) : (
                                    'Lưu cấu hình'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <QRHubModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                initialTab={qrModalTab}
            />
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value, delta, icon, accent }: { label: string; value: number; delta: string; icon: 'users' | 'layers' | 'branch' | 'calendar'; accent: string }) {
    return (
        <article className="gp-card relative overflow-hidden p-[22px]">
            <div
                className="absolute -right-4 -top-4 h-24 w-24 rounded-full"
                style={{ background: `radial-gradient(circle, color-mix(in srgb, var(--${accent}) 18%, transparent), transparent 70%)` }}
            />
            <div className="relative mb-4 flex items-center justify-between">
                <div
                    className="grid h-9 w-9 place-items-center rounded-[9px] border"
                    style={{
                        background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
                        borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
                        color: `var(--${accent})`,
                    }}
                >
                    <Icon name={icon} size={18} />
                </div>
                <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-[var(--ink-mute)] hover:bg-[var(--card-soft)]">
                    <Icon name="arrow-up-right" size={14} />
                </button>
            </div>
            <div className="text-[13px] text-[var(--ink-mute)]">{label}</div>
            <div className="font-serif text-[42px] font-semibold leading-none">{value}</div>
            <div className="mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, var(--${accent}) 10%, transparent)`, color: `var(--${accent})` }}>
                ↗ {delta}
            </div>
        </article>
    );
}

function QuickAction({ icon, label, color, onClick }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; color: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className="gp-card gp-card-hover flex min-h-[108px] flex-col items-start gap-2 p-3.5 text-left">
            <span
                className="grid h-9 w-9 place-items-center rounded-lg border"
                style={{
                    background: `color-mix(in srgb, var(--${color}) 14%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--${color}) 22%, transparent)`,
                    color: `var(--${color})`,
                }}
            >
                <Icon name={icon} size={17} />
            </span>
            <span className="text-[13px] font-semibold">{label}</span>
        </button>
    );
}

function ClanCard({ clan, onEdit, onDelete }: { clan: DongHoWithStats; onEdit: () => void; onDelete: () => void }) {
    return (
        <article className="gp-card gp-card-hover overflow-hidden">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--gold),var(--jade),var(--terracotta))]" />
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] font-serif text-3xl font-semibold text-white shadow-[var(--shadow-gold)]">
                        {clan.ten_dong_ho.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate font-serif text-[24px] font-semibold">{clan.ten_dong_ho}</h3>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-[var(--ink-mute)]">{clan.mo_ta || 'Chưa có mô tả nguồn gốc, quê quán.'}</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-[12.5px] text-[var(--ink-mute)]">
                    <span className="gp-chip gp-chip-gold">{clan.soThanhVien} thành viên</span>
                    <span>{clan.daMat} đã mất</span>
                </div>
                <div className="mt-5 flex gap-2">
                    <button type="button" onClick={() => router.visit('/gia-pha/cay-gia-pha')} className="gp-btn gp-btn-primary flex-1">
                        Vào cây
                        <Icon name="arrow-right" size={15} />
                    </button>
                    <button type="button" onClick={onEdit} title="Sửa" className="gp-btn gp-btn-ghost px-3">
                        <Icon name="edit" size={16} />
                    </button>
                    <button type="button" onClick={onDelete} title="Xóa" className="gp-btn gp-btn-ghost px-3 text-[var(--crimson)]">
                        <Icon name="x" size={16} />
                    </button>
                </div>
            </div>
        </article>
    );
}

function GenerationChart({ data }: { data: Array<{ generation: number; total: number; alive: number }> }) {
    const chartData = data.length ? data : [{ generation: 1, total: 0, alive: 0 }];
    const max = Math.max(1, ...chartData.map((item) => item.total));

    return (
        <div className="grid h-[210px] grid-cols-[repeat(auto-fit,minmax(42px,1fr))] items-end gap-2 pt-4">
            {chartData.map((item) => {
                const height = Math.max(8, (item.total / max) * 140);
                const aliveHeight = item.total ? (item.alive / item.total) * 100 : 0;
                return (
                    <div key={item.generation} className="flex h-full flex-col items-center justify-end gap-2">
                        <div className="font-serif text-[13px] font-semibold">{item.total}</div>
                        <div className="relative w-full max-w-9 overflow-hidden rounded-t-md rounded-b-sm border border-[var(--gold-soft)] bg-[var(--gold-pale)]" style={{ height }}>
                            <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(to_top,var(--gold),var(--gold-soft))]" style={{ height: `${aliveHeight}%` }} />
                        </div>
                        <div className="text-[10.5px] text-[var(--ink-mute)]">Đời {item.generation}</div>
                    </div>
                );
            })}
        </div>
    );
}

function buildGenerationStats(members: Nguoi[]) {
    if (!members.length) return [];

    const byId = new Map(members.map((member) => [member.id, member]));
    const generationById = new Map<number, number>();

    const resolveGeneration = (member: Nguoi): number => {
        const cached = generationById.get(member.id);
        if (cached) return cached;

        const parents = [member.id_cha, member.id_me]
            .map((id) => (id ? byId.get(id) : undefined))
            .filter(Boolean) as Nguoi[];
        const generation = parents.length ? Math.max(...parents.map(resolveGeneration)) + 1 : 1;
        generationById.set(member.id, generation);
        return generation;
    };

    members.forEach(resolveGeneration);

    const grouped = new Map<number, { generation: number; total: number; alive: number }>();
    members.forEach((member) => {
        const generation = generationById.get(member.id) || 1;
        const current = grouped.get(generation) || { generation, total: 0, alive: 0 };
        current.total += 1;
        if (!Boolean(member.da_mat)) current.alive += 1;
        grouped.set(generation, current);
    });

    return [...grouped.values()].sort((a, b) => a.generation - b.generation);
}
