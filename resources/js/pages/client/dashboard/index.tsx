import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import QRHubModal from '../../../components/gia-pha/QRHubModal';
import { useAuth } from '../../../contexts/auth.context';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import apiClient from '../../../lib/api.client';
import toast from '../../../lib/toast.util';
import { DongHo, DongHoUpdatePayload, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';

const events = [
    ['15', 'Tháng 3 ÂL', '2026', 'Giỗ Tổ - Cụ Nguyễn Văn Trường', 'Từ đường Tiên Điền', '47 người dự', 12, 'scroll', 'brown'],
    ['20', 'Tháng 4', '2026', 'Lễ cưới Nguyễn Đức Long & Phạm Thúy Quỳnh', 'Hà Nội', '120 người dự', 28, 'heart', 'terracotta'],
    ['10', 'Tháng 5 ÂL', '2026', 'Giỗ Cụ Bà Trần Thị Lan', 'Từ đường Tiên Điền', '35 người dự', 51, 'lotus', 'jade'],
] as const;

const emptyClanForm = {
    ten_dong_ho: '',
    mo_ta: '',
    gia_huan: '',
    loi_gioi_thieu: '',
    dia_chi_tu_duong: '',
    logo_path: '',
    anh_tu_duong_path: '',
    theme_color: 'gold' as NonNullable<DongHo['theme_color']>,
};

function storageUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;

    return `/storage/${path.replace(/^public\//, '').replace(/^storage\//, '')}`;
}

const clanInfoSuggestions = [
    'Nguồn gốc họ tộc, nơi phát tích, thủy tổ và các đời đầu.',
    'Địa chỉ từ đường, ngày giỗ tổ, nghi lễ thường niên và người phụ trách.',
    'Gia huấn, tộc ước, quy ước đặt tên, vai vế, ngành chi và truyền thống nổi bật.',
    'Danh sách chi phái, địa bàn cư trú, nghề nghiệp/truyền thống học hành qua các đời.',
    'Tư liệu lưu trữ: ảnh từ đường, sắc phong, bia mộ, gia phả giấy, câu chuyện nhân vật tiêu biểu.',
];

const themeOptions: { key: NonNullable<DongHo['theme_color']>; label: string; className: string }[] = [
    { key: 'gold', label: 'Vàng gia phả', className: 'bg-[#b8902c]' },
    { key: 'crimson', label: 'Đỏ son', className: 'bg-[#8b2a1f]' },
    { key: 'jade', label: 'Ngọc lục', className: 'bg-[#2f5d3a]' },
    { key: 'indigo', label: 'Chàm', className: 'bg-[#315c86]' },
    { key: 'bronze', label: 'Đồng cổ', className: 'bg-[#8b5a2b]' },
];

export default function ClientDashboard() {
    const { user, checkAuth } = useAuth();

    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrModalTab, setQrModalTab] = useState<'my-qr' | 'scan'>('my-qr');
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [selectedThanhVienId, setSelectedThanhVienId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [clanModalOpen, setClanModalOpen] = useState(false);
    const [clanSaving, setClanSaving] = useState(false);
    const [clanForm, setClanForm] = useState(emptyClanForm);

    const activeClan = dongHos.find((item) => item.id === (user?.dong_ho_id || user?.dong_ho?.id)) || dongHos[0] || user?.dong_ho || null;
    const canManageClan = ['truong_toc', 'quan_ly'].includes(user?.quyen_han || '') && Boolean(activeClan?.id);

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

    const [profileForm, setProfileForm] = useState({
        ho_ten: user?.ho_va_ten || '',
        tieu_su: activeMember?.tieu_su || '',
        anh_dai_dien: activeMember?.anh_dai_dien || '',
    });

    useEffect(() => {
        if (activeMember) {
            setProfileForm({
                ho_ten: user?.ho_va_ten || activeMember.ten_day_du || '',
                tieu_su: activeMember.tieu_su || '',
                anh_dai_dien: activeMember.anh_dai_dien || '',
            });
        }
    }, [activeMember, user]);

    useEffect(() => {
        if (!activeClan) return;

        setClanForm({
            ten_dong_ho: activeClan.ten_dong_ho || '',
            mo_ta: activeClan.mo_ta || '',
            gia_huan: activeClan.gia_huan || '',
            loi_gioi_thieu: activeClan.loi_gioi_thieu || '',
            dia_chi_tu_duong: activeClan.dia_chi_tu_duong || '',
            logo_path: activeClan.logo_path || '',
            anh_tu_duong_path: activeClan.anh_tu_duong_path || '',
            theme_color: activeClan.theme_color || 'gold',
        });
    }, [
        activeClan?.id,
        activeClan?.ten_dong_ho,
        activeClan?.mo_ta,
        activeClan?.gia_huan,
        activeClan?.loi_gioi_thieu,
        activeClan?.dia_chi_tu_duong,
        activeClan?.logo_path,
        activeClan?.anh_tu_duong_path,
        activeClan?.theme_color,
    ]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const getFather = () => {
        if (!activeMember?.id_cha) return undefined;
        return members.find((m) => m.id === activeMember.id_cha);
    };

    const getMother = () => {
        if (!activeMember?.id_me) return undefined;
        return members.find((m) => m.id === activeMember.id_me);
    };

    const getSpouses = () => {
        if (!activeMember?.vo_chong_ids) return [];
        return members.filter((m) => activeMember.vo_chong_ids?.includes(m.id));
    };

    const getChildren = () => {
        if (!activeThanhVienId) return [];
        return members.filter((m) => m.id_cha === activeThanhVienId || m.id_me === activeThanhVienId);
    };

    const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profileForm.ho_ten.trim()) {
            toast.error('Họ tên không được để trống.');
            return;
        }

        setSaving(true);
        try {
            const { data: res } = await apiClient.post('/auth/update-profile', {
                ho_ten: profileForm.ho_ten.trim(),
                tieu_su: profileForm.tieu_su.trim() || null,
                anh_dai_dien: profileForm.anh_dai_dien.trim() || null,
            });

            if (res.success) {
                toast.success('Cập nhật hồ sơ cá nhân thành công.');
                setProfileModalOpen(false);
                if (typeof checkAuth === 'function') {
                    await checkAuth();
                }
                await loadData();
            } else {
                toast.error(res.message || 'Không thể cập nhật.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Có lỗi xảy ra.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const openClanProfileModal = () => {
        if (!activeClan) return;

        setClanForm({
            ten_dong_ho: activeClan.ten_dong_ho || '',
            mo_ta: activeClan.mo_ta || '',
            gia_huan: activeClan.gia_huan || '',
            loi_gioi_thieu: activeClan.loi_gioi_thieu || '',
            dia_chi_tu_duong: activeClan.dia_chi_tu_duong || '',
            logo_path: activeClan.logo_path || '',
            anh_tu_duong_path: activeClan.anh_tu_duong_path || '',
            theme_color: activeClan.theme_color || 'gold',
        });
        setClanModalOpen(true);
    };

    const handleClanSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!activeClan?.id) {
            toast.error('Không tìm thấy dòng họ để cập nhật.');
            return;
        }

        if (!clanForm.ten_dong_ho.trim()) {
            toast.error('Vui lòng nhập tên dòng họ.');
            return;
        }

        const payload: DongHoUpdatePayload = {
            id: activeClan.id,
            ten_dong_ho: clanForm.ten_dong_ho.trim(),
            mo_ta: clanForm.mo_ta.trim() || null,
            gia_huan: clanForm.gia_huan.trim() || null,
            loi_gioi_thieu: clanForm.loi_gioi_thieu.trim() || null,
            dia_chi_tu_duong: clanForm.dia_chi_tu_duong.trim() || null,
            logo_path: clanForm.logo_path.trim() || null,
            anh_tu_duong_path: clanForm.anh_tu_duong_path.trim() || null,
            theme_color: clanForm.theme_color || 'gold',
        };

        setClanSaving(true);
        try {
            const res = await dongHoApi.update(payload);
            if (res.success) {
                toast.success(res.message || 'Cập nhật hồ sơ dòng họ thành công.');
                setClanModalOpen(false);
                await loadData();
                if (typeof checkAuth === 'function') {
                    await checkAuth();
                }
            } else {
                toast.error(res.message || 'Không thể cập nhật hồ sơ dòng họ.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dòng họ.');
        } finally {
            setClanSaving(false);
        }
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

    const generations = useMemo(() => buildGenerationStats(members), [members]);
    const aliveCount = members.filter((member) => !Boolean(member.da_mat)).length;
    const deceasedCount = members.length - aliveCount;
    const maxGeneration = generations.length ? Math.max(...generations.map((item) => item.generation)) : 0;
    const clanProfileChecks = useMemo(
        () => [
            { label: 'Mô tả ngắn', done: Boolean(activeClan?.mo_ta?.trim()) },
            { label: 'Lời giới thiệu', done: Boolean(activeClan?.loi_gioi_thieu?.trim()) },
            { label: 'Gia huấn', done: Boolean(activeClan?.gia_huan?.trim()) },
            { label: 'Địa chỉ từ đường', done: Boolean(activeClan?.dia_chi_tu_duong?.trim()) },
            { label: 'Logo', done: Boolean(activeClan?.logo_path?.trim()) },
            { label: 'Ảnh từ đường', done: Boolean(activeClan?.anh_tu_duong_path?.trim()) },
        ],
        [
            activeClan?.mo_ta,
            activeClan?.loi_gioi_thieu,
            activeClan?.gia_huan,
            activeClan?.dia_chi_tu_duong,
            activeClan?.logo_path,
            activeClan?.anh_tu_duong_path,
        ],
    );
    const completedClanFields = clanProfileChecks.filter((item) => item.done).length;
    const clanProfilePercent = Math.round((completedClanFields / clanProfileChecks.length) * 100);
    const missingClanFields = clanProfileChecks.filter((item) => !item.done);
    const clanHeroImageUrl = storageUrl(activeClan?.anh_tu_duong_path);
    const clanLogoUrl = storageUrl(activeClan?.logo_path);

    return (
        <AuthenticatedLayout>
            <Head title="Bảng điều khiển Gia Phả" />
            <div className="mx-auto max-w-[1320px]">
                {/* Banner Dòng Họ hoành tráng */}
                <div className="relative mb-8 flex h-[200px] items-end overflow-hidden rounded-2xl border border-[var(--gold-soft)] bg-[var(--bg-elev)] shadow-lg md:h-[260px]">
                    {/* Ảnh nền từ đường */}
                    {clanHeroImageUrl ? (
                        <img
                            src={clanHeroImageUrl}
                            alt="Từ đường dòng tộc"
                            className="absolute inset-0 h-full w-full object-cover brightness-75 filter transition-all duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(135deg,var(--gold-soft),var(--brown-soft))] opacity-85">
                            {/* Hoa văn cổ phong giả lập */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold-glow)_10%,transparent_10.5%)] bg-[size:24px_24px] opacity-10" />
                        </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    {/* Logo & Tên dòng họ nổi bật */}
                    <div className="absolute right-6 bottom-6 left-6 z-10 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                        <div className="flex flex-col items-center gap-4 text-center text-white md:flex-row md:items-end md:gap-6 md:text-left">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--gold-pale)] bg-[var(--bg-elev)] shadow-lg md:h-20 md:w-20">
                                {clanLogoUrl ? (
                                    <img src={clanLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-2xl font-bold text-[var(--gold)]">{activeClan?.ten_dong_ho?.charAt(0) || 'G'}</div>
                                )}
                            </div>
                            <div>
                                <span className="gp-chip mb-1 inline-block rounded border-none bg-[var(--gold-glow)] px-2 py-0.5 text-[9px] font-bold tracking-widest text-[var(--brown)] uppercase">
                                    Không gian gia tộc số
                                </span>
                                <h1 className="font-serif text-[24px] leading-tight font-bold tracking-[0.5px] md:text-[32px]">
                                    {activeClan?.ten_dong_ho || 'Gia tộc'}
                                </h1>
                                <p className="mt-1 max-w-xl truncate text-[12px] text-white/80 md:text-[13px]">
                                    {activeClan?.dia_chi_tu_duong
                                        ? `Từ đường: ${activeClan.dia_chi_tu_duong}`
                                        : 'Địa chỉ từ đường chưa cập nhật'}
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-center gap-2 md:justify-end">
                            {canManageClan && (
                                <button
                                    type="button"
                                    onClick={openClanProfileModal}
                                    className="gp-btn flex items-center gap-2 border border-white/25 bg-white/15 text-white shadow-md backdrop-blur hover:bg-white/25"
                                >
                                    <Icon name="settings" size={15} />
                                    Hồ sơ dòng họ
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setProfileModalOpen(true)}
                                className="gp-btn gp-btn-primary flex items-center gap-2 border-none bg-[var(--gold)] text-white shadow-md hover:bg-[var(--brown)]"
                            >
                                <Icon name="edit" size={15} />
                                Cập nhật tiểu sử
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="gp-eyebrow">
                        Không gian thành viên ·{' '}
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h2 className="mt-1 text-[20px] font-bold text-[var(--brown)]">
                        {getGreeting()}, {user?.ten_goi_nho || user?.ho_va_ten || 'Thành viên'}
                    </h2>
                    <p className="mt-1 text-[13px] text-[var(--ink-mute)]">
                        {activeMember?.doi_thu
                            ? `Bạn là thế hệ đời thứ ${activeMember.doi_thu} của dòng họ. Không gian gia phả giúp bạn kết nối nguồn cội, cập nhật tiểu sử và tra cứu danh xưng dòng tộc.`
                            : activeClan?.mo_ta ||
                              'Chào mừng bạn đến với không gian gia phả dòng họ. Nơi kết nối cội nguồn, giữ gìn và phát huy các giá trị truyền thống gia tộc.'}
                    </p>
                </div>

                {canManageClan && (
                    <section className="gp-card mb-6 border-[var(--gold-soft)] bg-[linear-gradient(135deg,var(--card),var(--gold-glow))] p-5">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <div className="gp-eyebrow">Quản lý dòng họ</div>
                                <h2 className="mt-1 text-[18px] font-bold text-[var(--brown)]">Hoàn thiện hồ sơ {activeClan?.ten_dong_ho}</h2>
                                <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[var(--ink-mute)]">
                                    Hồ sơ dòng họ là phần giới thiệu chung mà mọi thành viên nhìn thấy: nguồn gốc, gia huấn, từ đường và tư liệu nhận diện.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="min-w-[190px] rounded-xl border border-[var(--line)] bg-white/70 p-3">
                                    <div className="flex items-center justify-between text-[12px] font-semibold text-[var(--ink-soft)]">
                                        <span>Mức hoàn thiện</span>
                                        <span className="text-[var(--gold)]">{clanProfilePercent}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--line-soft)]">
                                        <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${clanProfilePercent}%` }} />
                                    </div>
                                    <div className="mt-1 text-[11px] text-[var(--ink-mute)]">
                                        {completedClanFields}/{clanProfileChecks.length} mục đã có dữ liệu
                                    </div>
                                </div>
                                <button type="button" onClick={openClanProfileModal} className="gp-btn gp-btn-primary shrink-0">
                                    <Icon name="settings" size={15} />
                                    Cập nhật hồ sơ
                                </button>
                            </div>
                        </div>

                        {missingClanFields.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--gold-soft)] pt-4">
                                <span className="text-[12px] font-semibold text-[var(--ink-soft)]">Còn thiếu:</span>
                                {missingClanFields.map((item) => (
                                    <span key={item.label} className="rounded-full border border-[var(--line)] bg-white/70 px-2.5 py-1 text-[11.5px] text-[var(--ink-mute)]">
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        {/* Thẻ Gia Đình Số Glassmorphism */}
                        <section className="gp-card relative overflow-hidden border-[var(--gold-soft)] bg-[linear-gradient(135deg,rgba(253,250,243,0.85),rgba(255,255,255,0.95))] p-6 shadow-[0_12px_40px_rgba(99,70,45,0.05)] backdrop-blur-md">
                            <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-70" />
                            <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-30" />

                            <div className="relative flex flex-col items-center gap-6 md:flex-row md:items-start">
                                {/* Avatar lớn */}
                                <div className="relative shrink-0">
                                    <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gold)] bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] shadow-md">
                                        {activeMember?.anh_dai_dien ? (
                                            <img src={activeMember.anh_dai_dien} alt={user?.ho_va_ten} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] text-3xl font-bold text-white uppercase">
                                                {user?.ho_va_ten?.charAt(0) || 'G'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setProfileModalOpen(true)}
                                        className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-white shadow-md transition-all hover:bg-[var(--brown)]"
                                        title="Sửa hồ sơ"
                                    >
                                        <Icon name="edit" size={12} />
                                    </button>
                                </div>

                                {/* Thông tin thẻ */}
                                <div className="flex-1 text-center md:text-left">
                                    <span className="gp-chip gp-chip-gold mb-2 inline-flex items-center gap-1">
                                        <Icon name="lotus" size={11} />
                                        Thẻ gia đình số
                                    </span>
                                    <h2 className="mt-1 font-serif text-[24px] leading-tight font-bold text-[var(--brown)]">
                                        {activeMember?.ten_day_du || user?.ho_va_ten}
                                    </h2>
                                    <p className="mt-1 text-[12px] font-semibold tracking-wider text-[var(--ink-mute)] uppercase">
                                        {user?.ten_chuc_vu || 'Thành viên dòng họ'}
                                    </p>

                                    {activeMember && (
                                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--gold-soft)] pt-3 text-left text-[13px] text-[var(--ink-soft)]">
                                            <div>
                                                <span className="block text-[11px] font-medium text-[var(--ink-mute)]">Đời dòng họ:</span>
                                                <span className="font-semibold text-[var(--brown)]">Đời thứ {activeMember.doi_thu || '1'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] font-medium text-[var(--ink-mute)]">Giới tính:</span>
                                                <span className="font-semibold text-[var(--ink)]">
                                                    {activeMember.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                                                </span>
                                            </div>
                                            <div className="col-span-2 mt-1">
                                                <span className="block text-[11px] font-medium text-[var(--ink-mute)]">Tiểu sử của tôi:</span>
                                                <p className="mt-0.5 line-clamp-3 text-[12.5px] leading-relaxed text-[var(--ink-soft)] italic">
                                                    {activeMember.tieu_su ||
                                                        'Chưa cập nhật thông tin tiểu sử. Hãy cập nhật tiểu sử để thế hệ sau hiểu thêm về bạn.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mã QR cá nhân trỏ tới tra cứu danh xưng */}
                                {activeThanhVienId && (
                                    <div className="flex w-full shrink-0 flex-col items-center border-t border-[var(--gold-soft)] pt-6 md:w-auto md:border-t-0 md:border-l md:pt-0 md:pl-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setQrModalTab('my-qr');
                                                setIsQRModalOpen(true);
                                            }}
                                            className="group relative cursor-zoom-in rounded-xl border border-[var(--gold-soft)] bg-white p-2 transition-all hover:scale-105 hover:shadow-md"
                                            title="Click để phóng to mã QR"
                                        >
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`${window.location.origin}/gia-pha/tra-cuu-danh-xung?target_id=${activeThanhVienId}`)}&color=63462D&bgcolor=FFFFFF`}
                                                alt="Mã QR cá nhân"
                                                className="h-[100px] w-[100px] object-contain"
                                            />
                                            <span className="absolute inset-0 m-auto grid h-6 w-6 place-items-center rounded-lg border border-[var(--gold-soft)] bg-white text-[var(--gold)] shadow-sm">
                                                <Icon name="lotus" size={12} />
                                            </span>
                                        </button>
                                        <p className="mt-2 text-[10.5px] font-medium text-[var(--ink-mute)]">Mã định danh QR cá nhân</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Gia đình nhỏ của tôi */}
                        <section className="space-y-4">
                            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[var(--ink)]">
                                <Icon name="users" size={18} className="text-[var(--gold)]" />
                                Gia đình trực hệ của tôi
                            </h2>

                            <div className="space-y-5">
                                {/* Bố mẹ */}
                                <div>
                                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">Cha Mẹ</h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FamilyMemberCard member={getFather()} label="Cha đẻ" defaultGender="nam" />
                                        <FamilyMemberCard member={getMother()} label="Mẹ đẻ" defaultGender="nu" />
                                    </div>
                                </div>

                                {/* Vợ chồng */}
                                <div>
                                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">
                                        {activeMember?.gioi_tinh === 'nam' ? 'Vợ / Phối ngẫu' : 'Chồng / Phối ngẫu'}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {getSpouses().length > 0 ? (
                                            getSpouses().map((spouse, idx) => (
                                                <FamilyMemberCard
                                                    key={spouse.id}
                                                    member={spouse}
                                                    label={
                                                        activeMember?.gioi_tinh === 'nam'
                                                            ? `Vợ ${getSpouses().length > 1 ? idx + 1 : ''}`
                                                            : `Chồng ${getSpouses().length > 1 ? idx + 1 : ''}`
                                                    }
                                                    defaultGender={activeMember?.gioi_tinh === 'nam' ? 'nu' : 'nam'}
                                                />
                                            ))
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-3 text-center text-[12.5px] text-[var(--ink-mute)] sm:col-span-2">
                                                Chưa ghi nhận phối ngẫu trong hệ thống.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Con cái */}
                                <div>
                                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">Con Cái</h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {getChildren().length > 0 ? (
                                            getChildren().map((child, idx) => (
                                                <FamilyMemberCard
                                                    key={child.id}
                                                    member={child}
                                                    label={`Con thứ ${child.thu_tu_sinh || idx + 1}`}
                                                    defaultGender={child.gioi_tinh}
                                                />
                                            ))
                                        ) : (
                                            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-3 text-center text-[12.5px] text-[var(--ink-mute)] sm:col-span-2">
                                                Chưa ghi nhận con cái trong hệ thống.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Lời giới thiệu & Lịch sử dòng tộc */}
                        <section className="gp-card relative overflow-hidden border border-[var(--gold-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(253,250,243,0.95))] p-6 shadow-[0_4px_20px_rgba(99,70,45,0.02)]">
                            <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-40" />
                            <h2 className="mb-4 flex items-center gap-2 border-b border-[var(--gold-soft)] pb-2.5 text-[17px] font-semibold text-[var(--brown)]">
                                <Icon name="book" size={18} className="text-[var(--gold)]" />
                                Lịch sử & Nguồn gốc Dòng họ
                            </h2>
                            <div className="space-y-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                                {activeClan?.loi_gioi_thieu ? (
                                    <p className="whitespace-pre-line">{activeClan.loi_gioi_thieu}</p>
                                ) : (
                                    <div>
                                        <p>
                                            Dòng họ của chúng ta từ xưa đến nay vốn nổi tiếng với truyền thống hiếu học, yêu nước và đoàn kết. Những
                                            trang sử vàng của dòng họ luôn gắn liền với lịch sử thăng trầm của quê hương đất nước.
                                        </p>
                                        <p className="mt-2">
                                            Mỗi thành viên hôm nay là một đại diện tiếp nối hào khí của thế hệ đi trước. Hãy cùng chung tay bảo tồn tư
                                            liệu, xây dựng gia phả số để kết nối cội nguồn, hướng tới tương lai rạng rỡ.
                                        </p>
                                        {canManageClan && (
                                            <p className="mt-3 text-[12px] font-semibold text-[var(--gold)] italic">
                                                * Người quản lý dòng họ có thể dùng nút Hồ sơ dòng họ ở banner để cập nhật phần này.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        {/* Thao tác nhanh cho Member */}
                        <section className="gp-card bg-[linear-gradient(145deg,var(--card)_0%,var(--card)_52%,var(--gold-glow)_200%)] p-[22px]">
                            <h2 className="mb-4 text-[16px] font-semibold">Tiện ích gia đình</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {canManageClan && (
                                    <QuickAction icon="settings" label="Hồ sơ họ" color="gold" onClick={openClanProfileModal} />
                                )}
                                {canManageClan && (
                                    <QuickAction icon="add-user" label="Thêm thành viên" color="jade" onClick={() => router.visit('/gia-pha/thanh-vien')} />
                                )}
                                {canManageClan && (
                                    <QuickAction icon="check" label="Duyệt gia nhập" color="terracotta" onClick={() => router.visit('/gia-pha/cho-duyet')} />
                                )}
                                <QuickAction
                                    icon="link"
                                    label="Tra quan hệ"
                                    color="jade"
                                    onClick={() => router.visit('/gia-pha/tra-cuu-danh-xung')}
                                />
                                <QuickAction
                                    icon="book"
                                    label="Xem Cây Gia Phả"
                                    color="terracotta"
                                    onClick={() => router.visit('/gia-pha/cay-gia-pha')}
                                />
                                {!canManageClan && (
                                    <QuickAction icon="add-user" label="Xem danh sách" color="gold" onClick={() => router.visit('/gia-pha/thanh-vien')} />
                                )}
                            </div>
                        </section>

                        {/* Gia huấn Dòng họ Cổ kính */}
                        <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--gold-soft)] bg-[#fdfaf2] p-6 shadow-md">
                            {/* Góc trang trí cổ điển */}
                            <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-[var(--gold)]" />
                            <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-[var(--gold)]" />
                            <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[var(--gold)]" />
                            <div className="absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2 border-[var(--gold)]" />

                            <div className="text-center">
                                <span className="mb-1 flex justify-center text-[var(--gold)]">
                                    <Icon name="lotus" size={24} />
                                </span>
                                <h3 className="font-serif text-[18px] font-bold tracking-wider text-[var(--brown)] uppercase">Gia Huấn Dòng Tộc</h3>
                                <div className="mx-auto my-2.5 h-0.5 w-16 bg-[var(--gold-soft)]" />
                                <p className="px-2 font-serif text-[14.5px] leading-relaxed whitespace-pre-line text-[var(--ink-soft)] italic">
                                    {activeClan?.gia_huan ||
                                        `“Nước có nguồn, cây có cội, người có tông.\nCon cháu thảo hiền, hiếu kính cha mẹ,\nGiữ gìn gia phong, rạng danh tổ tiên.”\n\n(Lời răn dạy của tiền nhân)`}
                                </p>
                            </div>
                        </section>

                        {/* Lịch sự kiện sắp tới */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[16px] font-semibold">Sự kiện dòng họ sắp tới</h2>
                                <button
                                    type="button"
                                    onClick={() => router.visit('/gia-pha/events')}
                                    className="text-[12.5px] font-semibold text-[var(--gold)]"
                                >
                                    Xem lịch
                                </button>
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
                                            <div className="text-[9px] font-bold tracking-[1.2px] uppercase" style={{ color: `var(--${accent})` }}>
                                                {month}
                                            </div>
                                            <div className="font-serif text-[25px] leading-none font-semibold">{day}</div>
                                            <div className="text-[9px] text-[var(--ink-mute)]">{year}</div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap gap-2">
                                                <span className="gp-chip" style={{ color: `var(--${accent})` }}>
                                                    <Icon name={icon} size={11} />
                                                    Lễ họ
                                                </span>
                                                {days <= 14 && <span className="gp-chip gp-chip-crimson">Còn {days} ngày</span>}
                                            </div>
                                            <h3 className="font-serif text-[17px] leading-tight font-semibold">{title}</h3>
                                            <p className="mt-1 text-[12px] text-[var(--ink-mute)]">
                                                {location} · {attendees}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>

                        {/* Thống kê thu gọn cho Member */}
                        <section className="gp-card p-5">
                            <h2 className="mb-3 text-[15px] font-semibold">Thống kê dòng họ chung</h2>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-[var(--bg-elev)] p-2.5">
                                    <span className="block text-[11px] text-[var(--ink-mute)]">Thành viên</span>
                                    <span className="font-serif text-[22px] font-bold text-[var(--gold)]">{members.length}</span>
                                </div>
                                <div className="rounded-lg bg-[var(--bg-elev)] p-2.5">
                                    <span className="block text-[11px] text-[var(--ink-mute)]">Số đời sâu</span>
                                    <span className="font-serif text-[22px] font-bold text-[var(--jade)]">{maxGeneration || 1}</span>
                                </div>
                                <div className="rounded-lg bg-[var(--bg-elev)] p-2.5">
                                    <span className="block text-[11px] text-[var(--ink-mute)]">Đang sống</span>
                                    <span className="font-serif text-[22px] font-bold text-[var(--terracotta)]">{aliveCount}</span>
                                </div>
                            </div>
                            <div className="mt-4 border-t border-[var(--line-soft)] pt-3">
                                <div className="flex items-center justify-between text-[12px] text-[var(--ink-soft)]">
                                    <span>Số lượng người đã khuất:</span>
                                    <span className="font-semibold text-[var(--ink)]">{deceasedCount} thành viên</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {profileModalOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
                    <form onSubmit={handleProfileSubmit} className="gp-card w-full max-w-md overflow-hidden shadow-[var(--shadow-lg)]">
                        <div className="bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-4 text-[#fffef9]">
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-[22px] font-semibold">Chỉnh sửa hồ sơ cá nhân</h3>
                                <button
                                    type="button"
                                    onClick={() => setProfileModalOpen(false)}
                                    className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"
                                >
                                    <Icon name="x" size={17} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-4 p-6">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Họ và tên *</span>
                                <input
                                    value={profileForm.ho_ten}
                                    onChange={(e) => setProfileForm({ ...profileForm, ho_ten: e.target.value })}
                                    className="gp-input w-full"
                                    required
                                    maxLength={255}
                                    placeholder="Họ và tên của bạn"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Ảnh đại diện URL</span>
                                <input
                                    value={profileForm.anh_dai_dien}
                                    onChange={(e) => setProfileForm({ ...profileForm, anh_dai_dien: e.target.value })}
                                    className="gp-input w-full"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Tiểu sử cá nhân</span>
                                <textarea
                                    value={profileForm.tieu_su}
                                    onChange={(e) => setProfileForm({ ...profileForm, tieu_su: e.target.value })}
                                    rows={4}
                                    className="gp-input w-full resize-none"
                                    placeholder="Chia sẻ câu chuyện cuộc đời của bạn..."
                                />
                            </label>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setProfileModalOpen(false)} className="gp-btn gp-btn-ghost">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving} className="gp-btn gp-btn-primary disabled:opacity-60">
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {clanModalOpen && activeClan && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
                    <form onSubmit={handleClanSubmit} className="gp-card max-h-[92vh] w-full max-w-4xl overflow-y-auto shadow-[var(--shadow-lg)]">
                        <div className="bg-[linear-gradient(135deg,var(--brown),var(--gold))] px-6 py-4 text-[#fffef9]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-serif text-[24px] font-semibold">Cập nhật hồ sơ dòng họ</h3>
                                    <p className="mt-1 text-[12px] text-white/75">Chỉ thành viên có quyền quản lý dòng họ mới lưu được thay đổi.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setClanModalOpen(false)}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25"
                                >
                                    <Icon name="x" size={17} />
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr]">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Tên dòng họ *</span>
                                    <input
                                        value={clanForm.ten_dong_ho}
                                        onChange={(e) => setClanForm({ ...clanForm, ten_dong_ho: e.target.value })}
                                        className="gp-input w-full"
                                        required
                                        maxLength={255}
                                        placeholder="Ví dụ: Họ Nguyễn Bá"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Địa chỉ từ đường</span>
                                    <input
                                        value={clanForm.dia_chi_tu_duong}
                                        onChange={(e) => setClanForm({ ...clanForm, dia_chi_tu_duong: e.target.value })}
                                        className="gp-input w-full"
                                        maxLength={255}
                                        placeholder="Thôn/xã/huyện/tỉnh hoặc địa chỉ nhà thờ tổ"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Mô tả ngắn</span>
                                    <textarea
                                        value={clanForm.mo_ta}
                                        onChange={(e) => setClanForm({ ...clanForm, mo_ta: e.target.value })}
                                        rows={3}
                                        className="gp-input w-full resize-none"
                                        placeholder="Tóm tắt nguồn gốc, quê quán, số đời, chi phái nổi bật..."
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Lời giới thiệu / lịch sử dòng họ</span>
                                    <textarea
                                        value={clanForm.loi_gioi_thieu}
                                        onChange={(e) => setClanForm({ ...clanForm, loi_gioi_thieu: e.target.value })}
                                        rows={6}
                                        className="gp-input w-full resize-y"
                                        placeholder="Viết câu chuyện nguồn cội, thủy tổ, quá trình di cư, các thế hệ tiêu biểu..."
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-[var(--ink-soft)]">Gia huấn</span>
                                    <textarea
                                        value={clanForm.gia_huan}
                                        onChange={(e) => setClanForm({ ...clanForm, gia_huan: e.target.value })}
                                        rows={5}
                                        className="gp-input w-full resize-y font-serif"
                                        placeholder="Nếp nhà, lời răn dạy, quy ước ứng xử, tinh thần hiếu học, hiếu nghĩa..."
                                    />
                                </label>
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
                                    <h4 className="text-[14px] font-bold text-[var(--ink)]">Tư liệu hiển thị</h4>
                                    <label className="mt-3 block">
                                        <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Logo URL</span>
                                        <input
                                            value={clanForm.logo_path}
                                            onChange={(e) => setClanForm({ ...clanForm, logo_path: e.target.value })}
                                            className="gp-input w-full"
                                            placeholder="https://.../logo.png"
                                        />
                                    </label>
                                    <label className="mt-3 block">
                                        <span className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">Ảnh từ đường URL</span>
                                        <input
                                            value={clanForm.anh_tu_duong_path}
                                            onChange={(e) => setClanForm({ ...clanForm, anh_tu_duong_path: e.target.value })}
                                            className="gp-input w-full"
                                            placeholder="https://.../tu-duong.jpg"
                                        />
                                    </label>
                                </div>

                                <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
                                    <h4 className="text-[14px] font-bold text-[var(--ink)]">Màu chủ đạo</h4>
                                    <div className="mt-3 grid gap-2">
                                        {themeOptions.map((option) => (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => setClanForm({ ...clanForm, theme_color: option.key })}
                                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                                                    clanForm.theme_color === option.key
                                                        ? 'border-[var(--gold)] bg-[var(--gold-glow)] text-[var(--brown)]'
                                                        : 'border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--gold-soft)]'
                                                }`}
                                            >
                                                <span className={`h-4 w-4 rounded-full ${option.className}`} />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[var(--gold-soft)] bg-[var(--gold-glow)] p-4">
                                    <h4 className="text-[14px] font-bold text-[var(--brown)]">Gợi ý nên bổ sung</h4>
                                    <ul className="mt-3 space-y-2 text-[12.5px] leading-5 text-[var(--ink-soft)]">
                                        {clanInfoSuggestions.map((item) => (
                                            <li key={item} className="flex gap-2">
                                                <Icon name="check" size={13} className="mt-0.5 shrink-0 text-[var(--gold)]" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </aside>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[var(--line)] px-6 py-4">
                            <button type="button" onClick={() => setClanModalOpen(false)} className="gp-btn gp-btn-ghost">
                                Hủy
                            </button>
                            <button type="submit" disabled={clanSaving} className="gp-btn gp-btn-primary disabled:opacity-60">
                                {clanSaving ? 'Đang lưu...' : 'Lưu hồ sơ dòng họ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <QRHubModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} initialTab={qrModalTab} />
        </AuthenticatedLayout>
    );
}

function QuickAction({
    icon,
    label,
    color,
    onClick,
}: {
    icon: React.ComponentProps<typeof Icon>['name'];
    label: string;
    color: string;
    onClick: () => void;
}) {
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

function FamilyMemberCard({ member, label, defaultGender }: { member: Nguoi | undefined; label: string; defaultGender: 'nam' | 'nu' }) {
    if (!member) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--bg-elev)] px-4 py-3 opacity-60">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--card-soft)] text-[var(--ink-mute)]">
                    <Icon name="users" size={16} />
                </div>
                <div>
                    <div className="text-[11px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">{label}</div>
                    <div className="mt-0.5 text-[12.5px] text-[var(--ink-mute)] italic">Chưa ghi nhận</div>
                </div>
            </div>
        );
    }

    const initials = member.ten_day_du.charAt(0).toUpperCase();

    return (
        <div
            onClick={() => router.visit(`/gia-pha/thanh-vien/${member.id}`)}
            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3 transition-all hover:border-[var(--gold-soft)] hover:bg-[var(--gold-glow)]"
        >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--gold-soft)] bg-white shadow-sm">
                {member.anh_dai_dien ? (
                    <img src={member.anh_dai_dien} alt={member.ten_day_du} className="h-full w-full object-cover" />
                ) : (
                    <div
                        className={`flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] text-sm font-bold text-white uppercase`}
                    >
                        {initials}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold tracking-wider text-[var(--ink-mute)] uppercase">{label}</div>
                <h4 className="mt-0.5 truncate text-[13.5px] font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--brown)]">
                    {member.ten_day_du}
                </h4>
                <div className="mt-0.5 flex gap-2 text-[11px] text-[var(--ink-mute)]">
                    <span>Đời thứ {member.doi_thu || '?'}</span>
                    <span>·</span>
                    <span>{Boolean(member.da_mat) ? 'Đã mất' : 'Còn sống'}</span>
                </div>
            </div>
            <Icon
                name="arrow-right"
                size={13}
                className="text-[var(--ink-mute)] opacity-0 transition-all group-hover:text-[var(--gold)] group-hover:opacity-100"
            />
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

        const parents = [member.id_cha, member.id_me].map((id) => (id ? byId.get(id) : undefined)).filter(Boolean) as Nguoi[];
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
