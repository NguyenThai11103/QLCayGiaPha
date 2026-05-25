import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/gia-pha/Icon';
import { useAuth } from '../../../contexts/auth.context';
import apiClient from '../../../lib/api.client';
import AuthenticatedLayout from '../../../layouts/AuthenticatedLayout';
import toast from '../../../lib/toast.util';
import { DongHo, dongHoApi, Nguoi, nguoiApi } from '../../../services/gia-pha.api';
import QRHubModal from '../../../components/gia-pha/QRHubModal';
import AdminDashboard from '../../admin/dashboard/index';

const events = [
    ['15', 'Tháng 3 ÂL', '2026', 'Giỗ Tổ - Cụ Nguyễn Văn Trường', 'Từ đường Tiên Điền', '47 người dự', 12, 'scroll', 'brown'],
    ['20', 'Tháng 4', '2026', 'Lễ cưới Nguyễn Đức Long & Phạm Thúy Quỳnh', 'Hà Nội', '120 người dự', 28, 'heart', 'terracotta'],
    ['10', 'Tháng 5 ÂL', '2026', 'Giỗ Cụ Bà Trần Thị Lan', 'Từ đường Tiên Điền', '35 người dự', 51, 'lotus', 'jade'],
] as const;

export default function ClientDashboard() {
    const { user, checkAuth } = useAuth();

    if (user?.quyen_han === 'quan_ly') {
        return <AdminDashboard />;
    }
    const [dongHos, setDongHos] = useState<DongHo[]>([]);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrModalTab, setQrModalTab] = useState<'my-qr' | 'scan'>('my-qr');
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [selectedThanhVienId, setSelectedThanhVienId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const getFather = () => {
        if (!activeMember?.id_cha) return undefined;
        return members.find(m => m.id === activeMember.id_cha);
    };

    const getMother = () => {
        if (!activeMember?.id_me) return undefined;
        return members.find(m => m.id === activeMember.id_me);
    };

    const getSpouses = () => {
        if (!activeMember?.vo_chong_ids) return [];
        return members.filter(m => activeMember.vo_chong_ids?.includes(m.id));
    };

    const getChildren = () => {
        if (!activeThanhVienId) return [];
        return members.filter(m => m.id_cha === activeThanhVienId || m.id_me === activeThanhVienId);
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

    return user?.is_master === 1 ? <AdminDashboard /> : (
        <AuthenticatedLayout>
            <Head title="Bảng điều khiển Gia Phả" />
            <div className="mx-auto max-w-[1320px]">
                {/* Banner Dòng Họ hoành tráng */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-[var(--gold-soft)] bg-[var(--bg-elev)] shadow-lg relative h-[200px] md:h-[260px] flex items-end">
                    {/* Ảnh nền từ đường */}
                    {user?.dong_ho?.anh_tu_duong_path ? (
                        <img 
                            src={user.dong_ho.anh_tu_duong_path} 
                            alt="Từ đường dòng tộc" 
                            className="absolute inset-0 h-full w-full object-cover filter brightness-75 transition-all duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(135deg,var(--gold-soft),var(--brown-soft))] opacity-85">
                            {/* Hoa văn cổ phong giả lập */}
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--gold-glow)_10%,transparent_10.5%)] bg-[size:24px_24px]" />
                        </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-0" />

                    {/* Logo & Tên dòng họ nổi bật */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-white text-center md:text-left">
                            <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-full border-4 border-[var(--gold-pale)] bg-[var(--bg-elev)] shadow-lg overflow-hidden flex items-center justify-center">
                                {user?.dong_ho?.logo_path ? (
                                    <img src={user.dong_ho.logo_path} alt="Logo" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-2xl font-bold text-[var(--gold)]">
                                        {user?.dong_ho?.ten_dong_ho?.charAt(0) || 'G'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <span className="gp-chip bg-[var(--gold-glow)] text-[var(--brown)] border-none mb-1 inline-block uppercase text-[9px] font-bold tracking-widest px-2 py-0.5 rounded">
                                    Không gian gia tộc số
                                </span>
                                <h1 className="font-serif text-[24px] md:text-[32px] font-bold leading-tight tracking-[0.5px]">
                                    {user?.dong_ho?.ten_dong_ho || 'Gia tộc'}
                                </h1>
                                <p className="text-[12px] md:text-[13px] text-white/80 mt-1 max-w-xl truncate">
                                    {user?.dong_ho?.dia_chi_tu_duong ? `Từ đường: ${user.dong_ho.dia_chi_tu_duong}` : 'Địa chỉ từ đường chưa cập nhật'}
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setProfileModalOpen(true)} className="gp-btn gp-btn-primary bg-[var(--gold)] text-white hover:bg-[var(--brown)] border-none shadow-md shrink-0 flex items-center gap-2">
                            <Icon name="edit" size={15} />
                            Cập nhật tiểu sử
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="gp-eyebrow">Không gian thành viên · {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <h2 className="text-[20px] font-bold mt-1 text-[var(--brown)]">{getGreeting()}, {user?.ten_goi_nho || user?.ho_va_ten || 'Thành viên'}</h2>
                    <p className="mt-1 text-[13px] text-[var(--ink-mute)]">
                        {activeMember?.doi_thu 
                            ? `Bạn là thế hệ đời thứ ${activeMember.doi_thu} của dòng họ. Không gian gia phả giúp bạn kết nối nguồn cội, cập nhật tiểu sử và tra cứu danh xưng dòng tộc.`
                            : 'Chào mừng bạn đến với không gian gia phả dòng họ. Nơi kết nối cội nguồn, giữ gìn và phát huy các giá trị truyền thống gia tộc.'}
                    </p>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        {/* Thẻ Gia Đình Số Glassmorphism */}
                        <section className="gp-card relative overflow-hidden border-[var(--gold-soft)] bg-[linear-gradient(135deg,rgba(253,250,243,0.85),rgba(255,255,255,0.95))] p-6 shadow-[0_12px_40px_rgba(99,70,45,0.05)] backdrop-blur-md">
                            <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-70" />
                            <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-30" />
                            
                            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                                {/* Avatar lớn */}
                                <div className="relative shrink-0">
                                    <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gold)] bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] shadow-md">
                                        {activeMember?.anh_dai_dien ? (
                                            <img src={activeMember.anh_dai_dien} alt={user?.ho_va_ten} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white uppercase bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))]">
                                                {user?.ho_va_ten?.charAt(0) || 'G'}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setProfileModalOpen(true)}
                                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)] text-white shadow-md hover:bg-[var(--brown)] transition-all"
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
                                    <h2 className="font-serif text-[24px] font-bold text-[var(--brown)] leading-tight mt-1">
                                        {activeMember?.ten_day_du || user?.ho_va_ten}
                                    </h2>
                                    <p className="text-[12px] font-semibold text-[var(--ink-mute)] uppercase tracking-wider mt-1">
                                        {user?.ten_chuc_vu || 'Thành viên dòng họ'}
                                    </p>

                                    {activeMember && (
                                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--gold-soft)] pt-3 text-[13px] text-[var(--ink-soft)] text-left">
                                            <div>
                                                <span className="block text-[11px] text-[var(--ink-mute)] font-medium">Đời dòng họ:</span>
                                                <span className="font-semibold text-[var(--brown)]">Đời thứ {activeMember.doi_thu || '1'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[11px] text-[var(--ink-mute)] font-medium">Giới tính:</span>
                                                <span className="font-semibold text-[var(--ink)]">{activeMember.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}</span>
                                            </div>
                                            <div className="col-span-2 mt-1">
                                                <span className="block text-[11px] text-[var(--ink-mute)] font-medium">Tiểu sử của tôi:</span>
                                                <p className="italic text-[12.5px] leading-relaxed text-[var(--ink-soft)] line-clamp-3 mt-0.5">
                                                    {activeMember.tieu_su || 'Chưa cập nhật thông tin tiểu sử. Hãy cập nhật tiểu sử để thế hệ sau hiểu thêm về bạn.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mã QR cá nhân trỏ tới tra cứu danh xưng */}
                                {activeThanhVienId && (
                                    <div className="flex flex-col items-center shrink-0 border-t md:border-t-0 md:border-l border-[var(--gold-soft)] pt-6 md:pt-0 md:pl-6 w-full md:w-auto">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setQrModalTab('my-qr');
                                                setIsQRModalOpen(true);
                                            }}
                                            className="relative group rounded-xl border border-[var(--gold-soft)] bg-white p-2 transition-all hover:scale-105 hover:shadow-md cursor-zoom-in"
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
                                        <p className="mt-2 text-[10.5px] text-[var(--ink-mute)] font-medium">
                                            Mã định danh QR cá nhân
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Gia đình nhỏ của tôi */}
                        <section className="space-y-4">
                            <h2 className="text-[17px] font-semibold text-[var(--ink)] flex items-center gap-2">
                                <Icon name="users" size={18} className="text-[var(--gold)]" />
                                Gia đình trực hệ của tôi
                            </h2>
                            
                            <div className="space-y-5">
                                {/* Bố mẹ */}
                                <div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-2">Cha Mẹ</h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <FamilyMemberCard member={getFather()} label="Cha đẻ" defaultGender="nam" />
                                        <FamilyMemberCard member={getMother()} label="Mẹ đẻ" defaultGender="nu" />
                                    </div>
                                </div>

                                {/* Vợ chồng */}
                                <div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-2">
                                        {activeMember?.gioi_tinh === 'nam' ? 'Vợ / Phối ngẫu' : 'Chồng / Phối ngẫu'}
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {getSpouses().length > 0 ? (
                                            getSpouses().map((spouse, idx) => (
                                                <FamilyMemberCard 
                                                    key={spouse.id} 
                                                    member={spouse} 
                                                    label={activeMember?.gioi_tinh === 'nam' ? `Vợ ${getSpouses().length > 1 ? idx + 1 : ''}` : `Chồng ${getSpouses().length > 1 ? idx + 1 : ''}`} 
                                                    defaultGender={activeMember?.gioi_tinh === 'nam' ? 'nu' : 'nam'} 
                                                />
                                            ))
                                        ) : (
                                            <div className="sm:col-span-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-3 text-center text-[12.5px] text-[var(--ink-mute)]">
                                                Chưa ghi nhận phối ngẫu trong hệ thống.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Con cái */}
                                <div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-2">Con Cái</h3>
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
                                            <div className="sm:col-span-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-3 text-center text-[12.5px] text-[var(--ink-mute)]">
                                                Chưa ghi nhận con cái trong hệ thống.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Lời giới thiệu & Lịch sử dòng tộc */}
                        <section className="gp-card p-6 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(253,250,243,0.95))] border border-[var(--gold-soft)] shadow-[0_4px_20px_rgba(99,70,45,0.02)] relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[radial-gradient(circle,var(--gold-glow)_0%,transparent_70%)] opacity-40" />
                            <h2 className="text-[17px] font-semibold text-[var(--brown)] flex items-center gap-2 mb-4 border-b border-[var(--gold-soft)] pb-2.5">
                                <Icon name="book" size={18} className="text-[var(--gold)]" />
                                Lịch sử & Nguồn gốc Dòng họ
                            </h2>
                            <div className="space-y-3 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                                {user?.dong_ho?.loi_gioi_thieu ? (
                                    <p className="whitespace-pre-line">{user.dong_ho.loi_gioi_thieu}</p>
                                ) : (
                                    <div>
                                        <p>
                                            Dòng họ của chúng ta từ xưa đến nay vốn nổi tiếng với truyền thống hiếu học, yêu nước và đoàn kết. Những trang sử vàng của dòng họ luôn gắn liền với lịch sử thăng trầm của quê hương đất nước.
                                        </p>
                                        <p className="mt-2">
                                            Mỗi thành viên hôm nay là một đại diện tiếp nối hào khí của thế hệ đi trước. Hãy cùng chung tay bảo tồn tư liệu, xây dựng gia phả số để kết nối cội nguồn, hướng tới tương lai rạng rỡ.
                                        </p>
                                        {String(user?.quyen_han) === 'quan_ly' && (
                                            <p className="mt-3 text-[12px] text-[var(--gold)] italic font-semibold">
                                                * Quản trị viên dòng họ có thể vào phần Cấu hình để cập nhật Lịch sử chi tiết của dòng họ.
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
                                <QuickAction icon="link" label="Tra quan hệ" color="jade" onClick={() => router.visit('/gia-pha/tra-cuu-danh-xung')} />
                                <QuickAction icon="sparkle" label="Thử nghiệm QR" color="gold" onClick={() => router.visit('/gia-pha/test-qr')} />
                                <QuickAction icon="book" label="Xem Cây Gia Phả" color="terracotta" onClick={() => router.visit('/gia-pha/cay-gia-pha')} />
                                <QuickAction icon="add-user" label="Xem danh sách" color="gold" onClick={() => router.visit('/gia-pha/thanh-vien')} />
                            </div>
                        </section>

                        {/* Gia huấn Dòng họ Cổ kính */}
                        <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--gold-soft)] bg-[#fdfaf2] p-6 shadow-md">
                            {/* Góc trang trí cổ điển */}
                            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[var(--gold)]" />
                            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[var(--gold)]" />
                            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[var(--gold)]" />
                            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[var(--gold)]" />

                            <div className="text-center">
                                <span className="text-[var(--gold)] flex justify-center mb-1">
                                    <Icon name="lotus" size={24} />
                                </span>
                                <h3 className="font-serif text-[18px] font-bold text-[var(--brown)] uppercase tracking-wider">
                                    Gia Huấn Dòng Tộc
                                </h3>
                                <div className="my-2.5 w-16 h-0.5 bg-[var(--gold-soft)] mx-auto" />
                                <p className="font-serif italic text-[14.5px] leading-relaxed text-[var(--ink-soft)] px-2 whitespace-pre-line">
                                    {user?.dong_ho?.gia_huan || `“Nước có nguồn, cây có cội, người có tông.\nCon cháu thảo hiền, hiếu kính cha mẹ,\nGiữ gìn gia phong, rạng danh tổ tiên.”\n\n(Lời răn dạy của tiền nhân)`}
                                </p>
                            </div>
                        </section>

                        {/* Lịch sự kiện sắp tới */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[16px] font-semibold">Sự kiện dòng họ sắp tới</h2>
                                <button type="button" onClick={() => router.visit('/gia-pha/events')} className="text-[12.5px] font-semibold text-[var(--gold)]">Xem lịch</button>
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

                        {/* Thống kê thu gọn cho Member */}
                        <section className="gp-card p-5">
                            <h2 className="text-[15px] font-semibold mb-3">Thống kê dòng họ chung</h2>
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
                            <div className="mt-4 pt-3 border-t border-[var(--line-soft)]">
                                <div className="flex justify-between items-center text-[12px] text-[var(--ink-soft)]">
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
                                <button type="button" onClick={() => setProfileModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25">
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
                                <button type="button" onClick={() => setProfileModalOpen(false)} className="gp-btn gp-btn-ghost">Hủy</button>
                                <button type="submit" disabled={saving} className="gp-btn gp-btn-primary disabled:opacity-60">
                                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
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

function FamilyMemberCard({ member, label, defaultGender }: { member: Nguoi | undefined; label: string; defaultGender: 'nam' | 'nu' }) {
    if (!member) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--bg-elev)] px-4 py-3 opacity-60">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--card-soft)] text-[var(--ink-mute)]">
                    <Icon name="users" size={16} />
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
                    <div className="text-[12.5px] italic text-[var(--ink-mute)] mt-0.5">Chưa ghi nhận</div>
                </div>
            </div>
        );
    }

    const initials = member.ten_day_du.charAt(0).toUpperCase();

    return (
        <div 
            onClick={() => router.visit(`/gia-pha/thanh-vien/${member.id}`)}
            className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] px-4 py-3 hover:border-[var(--gold-soft)] hover:bg-[var(--gold-glow)] transition-all cursor-pointer group"
        >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[var(--gold-soft)] bg-white shadow-sm">
                {member.anh_dai_dien ? (
                    <img src={member.anh_dai_dien} alt={member.ten_day_du} className="h-full w-full object-cover" />
                ) : (
                    <div className={`flex h-full w-full items-center justify-center text-sm font-bold text-white uppercase bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))]`}>
                        {initials}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-mute)]">{label}</div>
                <h4 className="truncate text-[13.5px] font-bold text-[var(--ink)] group-hover:text-[var(--brown)] transition-colors mt-0.5">
                    {member.ten_day_du}
                </h4>
                <div className="mt-0.5 flex gap-2 text-[11px] text-[var(--ink-mute)]">
                    <span>Đời thứ {member.doi_thu || '?' }</span>
                    <span>·</span>
                    <span>{Boolean(member.da_mat) ? 'Đã mất' : 'Còn sống'}</span>
                </div>
            </div>
            <Icon name="arrow-right" size={13} className="text-[var(--ink-mute)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--gold)] transition-all" />
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
