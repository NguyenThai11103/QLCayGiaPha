import { Head, router } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import Icon from '../../components/gia-pha/Icon';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../contexts/auth.context';
import { Nguoi, nguoiApi } from '../../services/gia-pha.api';
import toast from '../../lib/toast.util';

export default function TestQRSimulator() {
    const { user } = useAuth();
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Trạng thái Simulator
    const [selectedBId, setSelectedBId] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanSuccess, setScanSuccess] = useState(false);
    const [decodedUrl, setDecodedUrl] = useState('');
    const [decodedData, setDecodedData] = useState<any>(null);

    useEffect(() => {
        nguoiApi
            .list()
            .then((res) => {
                const data = res.data || [];
                setMembers(data);
                
                // Chọn mặc định người B khác với người đăng nhập
                const loggedInMemberId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : null;
                const defaultB = data.find((m) => m.id !== loggedInMemberId)?.id || (data[0]?.id ?? null);
                setSelectedBId(defaultB);
            })
            .finally(() => setLoading(false));
    }, [user?.thanh_vien_id]);

    const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
    const memberB = selectedBId ? byId.get(selectedBId) || null : null;
    const memberA = user?.thanh_vien_id ? byId.get(parseInt(String(user.thanh_vien_id), 10)) || null : null;

    // QR URL của người B
    const qrCodeUrl = useMemo(() => {
        if (!selectedBId) return '';
        return `${window.location.origin}/gia-pha/tra-cuu-danh-xung?target_id=${selectedBId}`;
    }, [selectedBId]);

    // Trình giả lập quét QR
    const handleStartScan = () => {
        if (isScanning) return;
        setIsScanning(true);
        setScanSuccess(false);
        setScanProgress(0);
        setDecodedUrl('');
        setDecodedData(null);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                setScanSuccess(true);
                setDecodedUrl(qrCodeUrl);
                
                // Tạo dữ liệu giả lập giải mã
                setDecodedData({
                    "qr_content" : qrCodeUrl,
                    "target_id"  : selectedBId,
                    "target_name": memberB?.ten_day_du || "Ẩn danh",
                    "scanned_by" : user?.ho_va_ten || "Thành viên hiện tại",
                    "timestamp"  : new Date().toISOString()
                });
                
                toast.success('Đã giải mã thành công mã QR! Chạm "Kiểm tra thực tế" để xem danh xưng chéo.');
            }
        }, 200);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mô phỏng QR Một chạm" />
            <div className="gp-fade-up mx-auto max-w-[1320px] px-4 py-2">
                
                {/* Header Room */}
                <div className="mb-7 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between border-b border-[var(--line-soft)] pb-5">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className="gp-chip gp-chip-gold animate-pulse">
                                <Icon name="sparkle" size={11} strokeWidth={2.5} />
                                Test Bench
                            </span>
                            <span className="text-[var(--ink-faint)]">·</span>
                            <span className="text-[12px] text-[var(--ink-mute)]">Giao diện thử nghiệm QR Một chạm</span>
                        </div>
                        <h1 className="gp-page-title text-3xl font-serif font-bold text-[var(--brown)]">
                            Phòng Thử Nghiệm QR "Một Chạm"
                        </h1>
                        <p className="mt-1 max-w-3xl text-[14px] leading-6 text-[var(--ink-mute)]">
                            Công cụ hỗ trợ mô phỏng luồng QR Một chạm mà không cần camera vật lý. 
                            Bạn có thể chọn thành viên đích, tạo mã QR, quét giả lập và chuyển hướng tức thì để tra cứu danh xưng chéo.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="gp-card grid min-h-96 place-items-center">
                        <div className="text-center">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--gold-pale)] border-t-[var(--gold)]" />
                            <div className="mt-4 text-sm font-semibold text-[var(--ink-mute)]">Đang kết nối cơ sở dữ liệu gia phả...</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                        
                        {/* Cột Trái: Trình mô phỏng 2 thiết bị */}
                        <div className="space-y-6">
                            
                            {/* Bộ cấu hình nhanh */}
                            <section className="gp-card p-5 border-[var(--gold-soft)] bg-gradient-to-br from-[var(--gold-glow)] to-[var(--card)]">
                                <h3 className="text-[15px] font-semibold text-[var(--brown)] mb-3 flex items-center gap-2">
                                    <Icon name="settings" size={16} />
                                    1. Chọn thành viên để giả lập
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1.5">
                                            Người A (Bạn - Đang đăng nhập)
                                        </label>
                                        <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--card-soft)] p-3">
                                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold-pale)] text-[var(--gold)] font-bold text-sm">
                                                A
                                            </span>
                                            <div className="min-w-0">
                                                <div className="text-[13px] font-semibold truncate text-[var(--ink)]">
                                                    {memberA?.ten_day_du || user?.ho_va_ten || "Chưa gán thành viên"}
                                                </div>
                                                <div className="text-[11px] text-[var(--ink-mute)]">
                                                    ID: {user?.thanh_vien_id || "null"} · Quyền: {user?.quyen_han || "guest"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1.5">
                                            Người B (Người để quét QR)
                                        </label>
                                        <select
                                            value={selectedBId || ''}
                                            onChange={(e) => {
                                                setSelectedBId(Number(e.target.value));
                                                setScanSuccess(false);
                                                setDecodedData(null);
                                            }}
                                            className="gp-input w-full text-[13.5px] py-2.5"
                                        >
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.ten_day_du} (Đời {m.id_cha ? 'n' : '1'} - {m.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Dual Mobile Device Simulator */}
                            <div className="grid gap-6 md:grid-cols-2">
                                
                                {/* Thiết bị B: Show QR */}
                                <div className="flex flex-col items-center">
                                    <div className="w-full text-center text-[12px] font-bold uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                                        [Thiết Bị B] Màn hình của {memberB?.ten_day_du || 'Người B'}
                                    </div>
                                    <div className="relative w-full max-w-[310px] aspect-[9/18.5] rounded-[38px] border-[12px] border-zinc-800 bg-zinc-900 shadow-2xl p-4 flex flex-col justify-between overflow-hidden text-white">
                                        {/* Status bar */}
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 px-2 mt-1">
                                            <span>15:04</span>
                                            <div className="w-16 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
                                            <div className="flex gap-1">
                                                <span>5G</span>
                                                <span className="w-4 h-2 bg-zinc-400 rounded-sm" />
                                            </div>
                                        </div>

                                        {/* Card content */}
                                        <div className="flex-1 flex flex-col items-center justify-center py-6">
                                            <div className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 text-center backdrop-blur-md">
                                                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider mb-2">
                                                    Thẻ Gia Đình Số
                                                </span>
                                                <h4 className="font-serif text-[16px] font-bold text-amber-100 truncate">
                                                    {memberB?.ten_day_du}
                                                </h4>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                                    {memberB?.gioi_tinh === 'nam' ? 'Nam thành viên' : 'Nữ thành viên'}
                                                </p>

                                                {/* QR cá nhân */}
                                                <div className="relative bg-white p-2.5 rounded-xl mt-4 mx-auto w-36 h-36 flex items-center justify-center shadow-inner group">
                                                    {qrCodeUrl ? (
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}&color=63462D&bgcolor=FFFFFF`}
                                                            alt="Mã QR"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="text-zinc-400 text-[10px]">Đang tạo QR...</div>
                                                    )}
                                                    <span className="absolute inset-0 m-auto grid h-7 w-7 place-items-center rounded-lg border border-amber-200 bg-white text-amber-700 shadow-sm">
                                                        <Icon name="lotus" size={13} />
                                                    </span>
                                                </div>

                                                <p className="text-[9px] text-zinc-400 mt-3 leading-relaxed">
                                                    Đưa mã này cho người khác quét để nhận diện quan hệ ngay lập tức.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Home indicator */}
                                        <div className="w-24 h-1 bg-zinc-600 rounded-full mx-auto mb-1" />
                                    </div>
                                </div>

                                {/* Thiết bị A: Camera quét QR */}
                                <div className="flex flex-col items-center">
                                    <div className="w-full text-center text-[12px] font-bold uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                                        [Thiết Bị A] Giao diện quét của bạn
                                    </div>
                                    <div className="relative w-full max-w-[310px] aspect-[9/18.5] rounded-[38px] border-[12px] border-zinc-800 bg-zinc-950 shadow-2xl p-4 flex flex-col justify-between overflow-hidden text-white">
                                        {/* Status bar */}
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 px-2 mt-1 z-10">
                                            <span>15:04</span>
                                            <div className="w-16 h-4 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5" />
                                            <div className="flex gap-1">
                                                <span>5G</span>
                                                <span className="w-4 h-2 bg-zinc-400 rounded-sm" />
                                            </div>
                                        </div>

                                        {/* Camera Viewfinder */}
                                        <div className="absolute inset-0 bg-zinc-950 flex flex-col justify-between py-10 px-6">
                                            <div className="text-center mt-4 z-10">
                                                <div className="text-[12px] font-semibold text-zinc-300">Quét Mã QR Nhận Diện</div>
                                                <div className="text-[9px] text-zinc-500 mt-1">Căn chỉnh mã QR nằm trong khung ngắm</div>
                                            </div>

                                            {/* Khung quét */}
                                            <div className="relative w-44 h-44 mx-auto my-auto flex items-center justify-center">
                                                {/* 4 Góc khung quét */}
                                                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-500" />
                                                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-500" />
                                                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-500" />
                                                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-500" />

                                                {/* Hiệu ứng quét laser */}
                                                {isScanning && (
                                                    <div 
                                                        className="absolute left-0 right-0 h-0.5 bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-[scan_2s_infinite]"
                                                        style={{
                                                            animation: 'scan 1.5s ease-in-out infinite'
                                                        }}
                                                    />
                                                )}

                                                {/* Ảnh thu nhỏ mờ để tạo cảm giác camera */}
                                                <div className="w-[90%] h-[90%] bg-zinc-900/60 rounded-lg flex items-center justify-center overflow-hidden border border-zinc-800">
                                                    {scanSuccess ? (
                                                        <div className="text-center z-10 text-emerald-400">
                                                            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 border border-emerald-500/30">
                                                                <Icon name="check" size={20} strokeWidth={3} />
                                                            </div>
                                                            <div className="text-[11px] font-bold">Thành công!</div>
                                                        </div>
                                                    ) : isScanning ? (
                                                        <div className="text-center z-10 text-amber-300">
                                                            <Icon name="camera" size={24} className="mx-auto animate-pulse mb-1.5" />
                                                            <div className="text-[9px]">Đang giải mã... {scanProgress}%</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center z-10 text-zinc-500">
                                                            <Icon name="camera" size={24} className="mx-auto mb-1.5 opacity-40" />
                                                            <div className="text-[9px]">Sẵn sàng quét</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nút hành động */}
                                            <div className="text-center mb-2 z-10">
                                                <button
                                                    type="button"
                                                    onClick={handleStartScan}
                                                    disabled={isScanning}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md ${
                                                        isScanning 
                                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                            : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                                                    }`}
                                                >
                                                    {isScanning ? 'Đang phân tích...' : 'Giả Lập Quét Một Chạm'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Home indicator */}
                                        <div className="w-24 h-1 bg-zinc-600 rounded-full mx-auto mb-1 z-10" />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Cột Phải: Dữ liệu mô phỏng & Kết quả giải mã */}
                        <div className="space-y-6">
                            
                            {/* Dữ liệu và URL trích xuất */}
                            <section className="gp-card p-[22px] flex flex-col justify-between min-h-[300px]">
                                <div>
                                    <div className="flex items-center justify-between mb-4 border-b border-[var(--line-soft)] pb-3">
                                        <h3 className="text-[16px] font-semibold text-[var(--ink)] flex items-center gap-2">
                                            <Icon name="link" size={17} />
                                            Kết quả giải mã QR
                                        </h3>
                                        <span className={`gp-chip text-[11px] font-semibold ${
                                            scanSuccess 
                                                ? 'gp-chip-gold text-emerald-700 bg-emerald-50 border-emerald-200' 
                                                : 'text-zinc-500 bg-zinc-100 border-zinc-200'
                                        }`}>
                                            {scanSuccess ? 'Đã giải mã' : 'Đang chờ quét'}
                                        </span>
                                    </div>

                                    {scanSuccess ? (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1">
                                                    URL trích xuất từ mã QR:
                                                </div>
                                                <div className="rounded-lg bg-zinc-950 font-mono text-[11.5px] p-3 text-amber-400 break-all border border-zinc-800">
                                                    {decodedUrl}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1.5">
                                                    Luồng dữ liệu JSON gửi về Client:
                                                </div>
                                                <pre className="rounded-lg bg-zinc-950 font-mono text-[11px] p-3 text-zinc-300 overflow-x-auto border border-zinc-800 leading-relaxed">
                                                    {JSON.stringify(decodedData, null, 4)}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200">
                                                <Icon name="camera" size={20} />
                                            </div>
                                            <h4 className="text-[14px] font-semibold text-[var(--ink-soft)]">
                                                Chưa có dữ liệu quét
                                            </h4>
                                            <p className="text-[12px] text-[var(--ink-mute)] max-w-[240px] mt-1">
                                                Vui lòng nhấn nút "Giả Lập Quét Một Chạm" ở Thiết bị A để kích hoạt luồng.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {scanSuccess && (
                                    <div className="pt-4 border-t border-[var(--line-soft)] mt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.visit(`/gia-pha/tra-cuu-danh-xung?target_id=${selectedBId}`);
                                            }}
                                            className="gp-btn gp-btn-primary w-full flex items-center justify-center gap-2 py-3 text-[13.5px]"
                                        >
                                            <Icon name="sparkle" size={15} />
                                            Kiểm tra trên Trang Tra Cứu Thật
                                        </button>
                                        <p className="text-[11px] text-[var(--ink-mute)] text-center mt-2.5">
                                            Tự động gán Người A là chính mình và Người B là thành viên quét, 
                                            tính toán danh xưng chéo mà không có độ trễ!
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* Hướng dẫn test nhanh */}
                            <section className="gp-card p-5">
                                <h3 className="text-[15px] font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                                    <Icon name="book" size={16} />
                                    Các bước kiểm tra tự động
                                </h3>
                                <ul className="space-y-3 text-[13px] text-[var(--ink-soft)] leading-relaxed">
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--gold-pale)] text-[10px] font-bold text-[var(--gold)]">
                                            1
                                        </span>
                                        <span>
                                            Chọn bất kỳ thành viên nào ở <strong>Người B</strong> để tạo mã QR động tương ứng.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--gold-pale)] text-[10px] font-bold text-[var(--gold)]">
                                            2
                                        </span>
                                        <span>
                                            Nhấn nút <strong>"Giả Lập Quét Một Chạm"</strong> trên màn hình thiết bị A.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--gold-pale)] text-[10px] font-bold text-[var(--gold)]">
                                            3
                                        </span>
                                        <span>
                                            Bấm <strong>"Kiểm tra trên Trang Tra Cứu Thật"</strong> để kiểm tra xem hệ thống có tự động nạp thành viên và tính toán danh xưng chuẩn hay không.
                                        </span>
                                    </li>
                                </ul>
                            </section>

                        </div>

                    </div>
                )}

            </div>
            
            {/* CSS Animation cho tia Laser */}
            <style>{`
                @keyframes scan {
                    0% { top: 5%; }
                    50% { top: 95%; }
                    100% { top: 5%; }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
