import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/auth.context';
import Icon from './Icon';
import { Nguoi, nguoiApi } from '../../services/gia-pha.api';

interface QRHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'my-qr' | 'scan';
}

export default function QRHubModal({ isOpen, onClose, initialTab = 'my-qr' }: QRHubModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'my-qr' | 'scan'>(initialTab);
    const [jsQRLoaded, setJsQRLoaded] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [members, setMembers] = useState<Nguoi[]>([]);
    const [selectedThanhVienId, setSelectedThanhVienId] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Tải danh sách thành viên để tự động giả lập nếu chưa liên kết
    useEffect(() => {
        if (isOpen) {
            nguoiApi.list().then((res) => {
                const data = res.data || [];
                setMembers(data);
                if (user?.thanh_vien_id) {
                    setSelectedThanhVienId(parseInt(String(user.thanh_vien_id), 10));
                } else if (data.length > 0) {
                    // Chọn thành viên đầu tiên làm fallback để test nhanh
                    setSelectedThanhVienId(data[0].id);
                }
            });
        }
    }, [isOpen, user?.thanh_vien_id]);

    const activeThanhVienId = user?.thanh_vien_id ? parseInt(String(user.thanh_vien_id), 10) : selectedThanhVienId;
    const activeMember = members.find((m) => m.id === activeThanhVienId) || null;

    // Tính toán URL để mã hóa vào QR
    const qrUrl = activeThanhVienId
        ? `${window.location.origin}/gia-pha/tra-cuu-danh-xung?target_id=${activeThanhVienId}`
        : '';

    // URL ảnh sinh mã QR sắc nét cao
    const qrCodeImageUrl = qrUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&color=63462D&bgcolor=FCF9F2`
        : '';

    // Load jsQR library from CDN dynamically to avoid bundler conflicts
    useEffect(() => {
        if (!isOpen) return;

        if ((window as any).jsQR) {
            setJsQRLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
        script.async = true;
        script.onload = () => setJsQRLoaded(true);
        script.onerror = () => setScanError('Không thể tải thư viện giải mã QR. Vui lòng thử lại.');
        document.body.appendChild(script);

        return () => {
            // Cleanup script if needed, but keeping it loaded is usually fine
        };
    }, [isOpen]);

    // Handle Camera scan stream
    useEffect(() => {
        if (activeTab === 'scan' && isOpen && jsQRLoaded) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [activeTab, isOpen, jsQRLoaded]);

    const startCamera = async () => {
        setScanError(null);
        setScanResult(null);
        setIsScanning(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
                videoRef.current.play();
                animationFrameRef.current = requestAnimationFrame(tick);
            }
        } catch (err: any) {
            console.error('Lỗi mở camera:', err);
            setScanError('Không thể truy cập camera. Vui lòng cấp quyền hoặc tải lên tệp hình ảnh QR.');
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        setIsScanning(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const tick = () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) {
            animationFrameRef.current = requestAnimationFrame(tick);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const jsQR = (window as any).jsQR;

            if (jsQR) {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                    handleScanSuccess(code.data);
                    return; // Stop scanning on success
                }
            }
        }
        animationFrameRef.current = requestAnimationFrame(tick);
    };

    const handleScanSuccess = (url: string) => {
        stopCamera();
        setScanResult(url);

        // Kiểm tra xem URL có đúng định dạng tra cứu gia phả không
        if (url.includes('/gia-pha/tra-cuu-danh-xung')) {
            // Điều hướng nhanh
            const targetPath = url.substring(url.indexOf('/gia-pha/tra-cuu-danh-xung'));
            window.location.href = targetPath;
        } else {
            setScanError('Mã QR này không thuộc hệ thống Gia Phả hoặc không hợp lệ.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScanError(null);
        setScanResult(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const jsQR = (window as any).jsQR;
                    if (jsQR) {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code && code.data) {
                            handleScanSuccess(code.data);
                        } else {
                            setScanError('Không tìm thấy mã QR hợp lệ trong hình ảnh này. Hãy thử ảnh rõ nét hơn.');
                        }
                    } else {
                        setScanError('Thư viện giải mã chưa sẵn sàng, vui lòng thử lại.');
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleCopyLink = () => {
        if (!qrUrl) return;
        navigator.clipboard.writeText(qrUrl);
        alert('Đã sao chép liên kết định danh của bạn!');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop làm mờ kính cực đẹp */}
            <div
                className="fixed inset-0 bg-black/45 backdrop-blur-[6px] transition-opacity"
                onClick={onClose}
            />

            {/* Khung Modal */}
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-[var(--shadow-lg)] transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] px-6 py-4 text-[#fffef9]">
                    <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                            <Icon name="lotus" size={16} />
                        </span>
                        <h3 className="font-serif text-lg font-semibold tracking-wide">Trung tâm Định danh QR</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25 transition"
                    >
                        <Icon name="x" size={16} />
                    </button>
                </div>

                {/* Tabs điều hướng */}
                <div className="flex border-b border-[var(--line-soft)] bg-[var(--card-soft)]">
                    <button
                        onClick={() => setActiveTab('my-qr')}
                        className={`flex-1 py-3 text-center text-[13px] font-semibold transition-all ${
                            activeTab === 'my-qr'
                                ? 'border-b-2 border-[var(--gold)] text-[var(--gold)] bg-[var(--bg-elev)]'
                                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                    >
                        Mã QR của tôi
                    </button>
                    <button
                        onClick={() => setActiveTab('scan')}
                        className={`flex-1 py-3 text-center text-[13px] font-semibold transition-all ${
                            activeTab === 'scan'
                                ? 'border-b-2 border-[var(--gold)] text-[var(--gold)] bg-[var(--bg-elev)]'
                                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                    >
                        Quét mã người khác
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                    {activeTab === 'my-qr' ? (
                        <div className="flex flex-col items-center text-center">
                            {/* Cảnh báo chưa liên kết & tự động giả lập */}
                            {!user?.thanh_vien_id && activeThanhVienId && (
                                <div className="mb-4 rounded-xl bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] p-3 text-left border border-[color-mix(in_srgb,var(--gold)_14%,transparent)] w-full">
                                    <div className="flex gap-2 items-start text-[11.5px] text-[var(--gold)] font-medium leading-relaxed">
                                        <Icon name="sparkle" size={13} className="shrink-0 mt-0.5" />
                                        <span>
                                            Tài khoản chưa liên kết gia phả. Hệ thống đang **giả lập định danh** với thành viên để sinh mã QR test nhanh.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Profile ngắn (Tự động chuyển sang thành viên giả lập nếu có) */}
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--line-soft)] bg-[var(--bg)] p-3 w-full text-left">
                                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--gold-soft),var(--terracotta))] text-sm font-bold text-white">
                                    {activeMember?.anh_dai_dien || user?.anh_dai_dien ? (
                                        <img src={activeMember?.anh_dai_dien || user?.anh_dai_dien || undefined} alt={activeMember?.ten_day_du || user?.ho_va_ten} className="h-full w-full object-cover" />
                                    ) : (
                                        (activeMember?.ten_day_du || user?.ho_va_ten)?.charAt(0).toUpperCase() || 'G'
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-[14px] font-bold text-[var(--ink)]">
                                        {activeMember?.ten_day_du || user?.ho_va_ten}
                                    </h4>
                                    <p className="truncate text-[11px] text-[var(--ink-mute)]">
                                        {!user?.thanh_vien_id ? `Thành viên giả lập (ID: ${activeThanhVienId})` : (user?.ten_chuc_vu || 'Thành viên dòng họ')}
                                    </p>
                                </div>
                            </div>

                            {/* Bộ chọn thành viên giả lập nhanh (chỉ hiện khi chưa liên kết thực tế để tiện test) */}
                            {!user?.thanh_vien_id && members.length > 0 && (
                                <div className="mb-4 w-full text-left">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-mute)] mb-1">
                                        Chọn thành viên giả lập:
                                    </label>
                                    <select
                                        value={selectedThanhVienId || ''}
                                        onChange={(e) => setSelectedThanhVienId(Number(e.target.value))}
                                        className="gp-input w-full text-[12px] py-1.5 px-3 bg-[var(--card-soft)] border-[var(--line-soft)] rounded-lg font-medium text-[var(--ink-soft)] focus:border-[var(--gold)] focus:outline-none"
                                    >
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.ten_day_du} (ID: {m.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Khung chứa QR cực kỳ sang trọng */}
                            <div className="relative rounded-2xl border border-[var(--gold-soft)] bg-[#fdfaf3] p-4 shadow-inner">
                                {qrCodeImageUrl ? (
                                    <img
                                        src={qrCodeImageUrl}
                                        alt="Mã QR định danh cá nhân"
                                        className="h-48 w-48 object-contain transition-all duration-300 hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-48 w-48 items-center justify-center text-xs text-[var(--ink-mute)]">
                                        Không tìm thấy liên kết gia phả.
                                    </div>
                                )}
                                {/* Logo cánh sen chèn ở giữa mã QR */}
                                <div className="absolute inset-0 m-auto grid h-10 w-10 place-items-center rounded-lg border border-[var(--gold-soft)] bg-[#fdfaf3] text-[var(--gold)] shadow-md">
                                    <Icon name="lotus" size={18} />
                                </div>
                            </div>

                            <p className="mt-4 text-[12px] leading-5 text-[var(--ink-soft)] max-w-[280px]">
                                Đưa mã này cho thành viên khác trong dòng họ quét để họ tra cứu danh xưng và thông tin của bạn lập tức.
                            </p>

                            {/* Buttons */}
                            <div className="mt-5 flex gap-3 w-full">
                                <button
                                    onClick={handleCopyLink}
                                    className="gp-btn gp-btn-ghost flex-1 text-[12px] py-2"
                                >
                                    <Icon name="link" size={14} />
                                    Sao chép Link
                                </button>
                                <a
                                    href={qrCodeImageUrl}
                                    download="ma_qr_gia_pha.png"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="gp-btn gp-btn-primary flex-1 text-[12px] py-2 text-center inline-flex justify-center"
                                >
                                    <Icon name="photo" size={14} />
                                    Tải ảnh QR
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            {/* Khung máy quét Camera hoặc Tải ảnh */}
                            <div className="relative w-full aspect-square max-w-[280px] overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-black shadow-inner flex items-center justify-center">
                                {isScanning ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="h-full w-full object-cover"
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="hidden"
                                        />
                                        {/* Hiệu ứng khung ngắm quét laser phát sáng */}
                                        <div className="absolute inset-8 border-2 border-dashed border-[var(--gold)] rounded-xl pointer-events-none animate-pulse">
                                            {/* Đường kẻ laser chạy dọc cực xịn */}
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[linear-gradient(90deg,transparent,var(--gold),transparent)] animate-[scanLaser_2s_infinite_linear]" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center p-6 text-slate-400">
                                        <Icon name="camera" size={32} className="text-slate-500 animate-bounce" />
                                        <p className="mt-3 text-xs">Camera đang tắt</p>
                                        <button
                                            onClick={startCamera}
                                            className="gp-btn gp-btn-primary mt-4 text-[12px] px-4 py-1.5"
                                        >
                                            Bật Camera quét trực tiếp
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Thông báo lỗi / trạng thái */}
                            {scanError && (
                                <div className="mt-4 rounded-lg bg-[color-mix(in_srgb,var(--crimson)_8%,transparent)] p-3 text-left border border-[color-mix(in_srgb,var(--crimson)_14%,transparent)]">
                                    <div className="flex gap-2 items-start text-[12px] text-[var(--crimson)] font-medium">
                                        <Icon name="x" size={14} className="shrink-0 mt-0.5" />
                                        <span>{scanError}</span>
                                    </div>
                                </div>
                            )}

                            {scanResult && !scanError && (
                                <div className="mt-4 rounded-lg bg-[color-mix(in_srgb,var(--jade)_8%,transparent)] p-3 text-left border border-[color-mix(in_srgb,var(--jade)_14%,transparent)]">
                                    <div className="flex gap-2 items-start text-[12px] text-[var(--jade)] font-medium">
                                        <Icon name="check" size={14} className="shrink-0 mt-0.5" />
                                        <span>Đã nhận diện thành công QR Gia Phả! Đang chuyển hướng...</span>
                                    </div>
                                </div>
                            )}

                            {/* Lựa chọn tải tệp ảnh lên quét chéo */}
                            <div className="mt-5 border-t border-[var(--line-soft)] pt-4 w-full text-center">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--card-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--ink-soft)] hover:bg-[var(--line-soft)] hover:text-[var(--ink)] transition">
                                    <Icon name="book" size={14} />
                                    <span>Tải ảnh QR từ thư viện</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom animation style for scan laser line */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scanLaser {
                    0% { top: 0%; opacity: 0.2; }
                    50% { top: 100%; opacity: 1; }
                    100% { top: 0%; opacity: 0.2; }
                }
            `}} />
        </div>
    );
}
