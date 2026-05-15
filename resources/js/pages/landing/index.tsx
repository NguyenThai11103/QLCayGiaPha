import { Head, router } from '@inertiajs/react';
import Icon from '../../components/gia-pha/Icon';

const stats = [
    ['12K+', 'Dòng họ'],
    ['1.4M', 'Thành viên'],
    ['63', 'Tỉnh thành'],
    ['9 đời', 'Sâu nhất'],
];

const features = [
    ['tree', 'Cây gia phả trực quan', 'Quan sát nhiều thế hệ trong một không gian pan/zoom rõ ràng, dễ kể lại câu chuyện dòng họ.', 'gold'],
    ['link', 'Tra cứu danh xưng', 'Tự động gợi ý cách xưng hô Việt Nam theo quan hệ huyết thống, hôn phối và thứ bậc.', 'jade'],
    ['sparkle', 'AI đọc tư liệu cũ', 'Hỗ trợ nhận diện văn bản, đối chiếu tên người và gợi ý liên kết từ gia phả giấy.', 'terracotta'],
    ['calendar', 'Lịch giỗ chạp', 'Nhắc ngày giỗ, lễ họ, họp mặt và phân công chuẩn bị theo từng chi phái.', 'crimson'],
    ['scroll', 'Kho tư liệu', 'Lưu sắc phong, ảnh cũ, trích lục, câu chuyện và phiên bản số của sách gia phả.', 'brown'],
    ['users', 'Quản lý thành viên', 'Phân quyền, cập nhật hồ sơ, theo dõi nhánh gia đình và lịch sử chỉnh sửa minh bạch.', 'gold'],
] as const;

const timeline = [
    ['1850', 'Khai họ', 'Cụ Nguyễn Văn Trường lập chi họ tại Tiên Điền, gìn giữ gia phong qua bản gia phả đầu tiên.'],
    ['1910', 'Mở phái', 'Ba nhánh chính hình thành, dòng họ bắt đầu ghi chép ngày sinh, ngày mất và hôn phối.'],
    ['1975', 'Đoàn tụ', 'Con cháu nhiều miền cùng phục dựng nhà thờ họ, bổ sung tư liệu thất lạc sau biến động.'],
    ['2026', 'Số hóa', 'Gia Phả đưa ký ức gia đình lên nền tảng số để thế hệ trẻ tiếp tục nối dài nguồn cội.'],
];

export default function Landing() {
    return (
        <>
            <Head title="Gia Phả - Lưu giữ nguồn cội" />
            <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
                <header className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 md:px-8">
                    <button type="button" className="flex items-center gap-3" onClick={() => router.visit('/')}>
                        <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--gold),var(--brown-soft))] text-[#fffef9] shadow-[var(--shadow-gold)]">
                            <Icon name="lotus" size={20} />
                        </span>
                        <span className="text-left leading-none">
                            <span className="font-serif text-[24px] font-semibold">Gia Phả</span>
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[1.8px] text-[var(--ink-mute)]">Nguồn cội số</span>
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button type="button" className="gp-btn gp-btn-ghost hidden sm:inline-flex" onClick={() => router.visit('/login')}>
                            Đăng nhập
                        </button>
                        <button type="button" className="gp-btn gp-btn-primary" onClick={() => router.visit('/gia-pha/dashboard')}>
                            Vào không gian họ
                            <Icon name="arrow-right" size={16} />
                        </button>
                    </div>
                </header>

                <section className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 pb-14 pt-6 md:min-h-[620px] md:grid-cols-[1.05fr_0.95fr] md:px-8">
                    <div className="gp-fade-up">
                        <div className="gp-chip gp-chip-gold mb-7">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                            Phiên bản 2026 · Beta công khai
                        </div>
                        <h1 className="font-serif text-[clamp(46px,7vw,72px)] font-semibold leading-[1.03] tracking-[-0.5px]">
                            Lưu giữ <em className="font-medium text-[var(--gold)]">cội nguồn</em>, kết nối{' '}
                            <em className="font-medium text-[var(--brown)]">muôn đời</em>
                        </h1>
                        <p className="mt-6 max-w-[620px] text-[16.5px] leading-8 text-[var(--ink-soft)]">
                            Nền tảng số hóa gia phả Việt Nam dành cho dòng họ, gia đình và người trẻ muốn hiểu mình đến từ đâu.
                            Ghi chép thành viên, dựng cây nhiều thế hệ, tra cứu danh xưng và lưu giữ tư liệu tổ tiên trong một nơi trang trọng.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <button type="button" className="gp-btn gp-btn-primary min-h-12 px-6 text-[15px]" onClick={() => router.visit('/gia-pha/cay-gia-pha')}>
                                Khám phá cây gia phả
                                <Icon name="tree" size={17} />
                            </button>
                            <button type="button" className="gp-btn gp-btn-ghost min-h-12 px-6 text-[15px]" onClick={() => router.visit('/gia-pha/dashboard')}>
                                Lập dòng họ mới
                            </button>
                        </div>
                        <div className="mt-10 grid max-w-[640px] grid-cols-2 gap-5 border-t border-[var(--line)] pt-6 sm:grid-cols-4">
                            {stats.map(([value, label]) => (
                                <div key={label}>
                                    <div className="font-serif text-[30px] font-semibold leading-none">{value}</div>
                                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[1.1px] text-[var(--ink-mute)]">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative mx-auto aspect-[520/560] w-full max-w-[540px]">
                        <div className="bg-pattern absolute -inset-5 rounded-[24px] opacity-70" />
                        <div className="relative h-full drop-shadow-[0_12px_32px_rgba(184,144,44,0.12)]">
                            <HeroTreeIllustration />
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8">
                    <div className="mb-10 flex items-center justify-center gap-4 text-[var(--gold)]">
                        <span className="h-px w-24 bg-gradient-to-r from-transparent to-[var(--gold)]" />
                        <Icon name="lotus" size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-[2px]">Tính năng</span>
                        <Icon name="lotus" size={18} />
                        <span className="h-px w-24 bg-gradient-to-l from-transparent to-[var(--gold)]" />
                    </div>
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="font-serif text-[clamp(36px,5vw,48px)] font-semibold">Truyền thống gặp công nghệ</h2>
                        <p className="mt-3 text-[15.5px] leading-7 text-[var(--ink-soft)]">
                            Thiết kế để người lớn tuổi thấy thân thuộc, người trẻ thấy dễ dùng, và cả dòng họ có một bản ghi đáng tin cậy.
                        </p>
                    </div>
                    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {features.map(([icon, title, desc, accent]) => (
                            <article key={title} className="gp-card gp-card-hover p-[22px]">
                                <div
                                    className="mb-4 grid h-11 w-11 place-items-center rounded-[10px] border"
                                    style={{
                                        background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
                                        borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
                                        color: `var(--${accent})`,
                                    }}
                                >
                                    <Icon name={icon} size={22} />
                                </div>
                                <h3 className="font-serif text-[21px] font-semibold">{title}</h3>
                                <p className="mt-2 text-[13.5px] leading-6 text-[var(--ink-soft)]">{desc}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
                    <div className="bg-pattern rounded-[24px] bg-[var(--card-soft)] px-5 py-12 md:px-14">
                        <div className="text-center">
                            <div className="gp-eyebrow">Lịch sử</div>
                            <h2 className="mt-2 font-serif text-[clamp(34px,5vw,48px)] font-semibold">176 năm · 6 thế hệ</h2>
                        </div>
                        <div className="relative mx-auto mt-12 max-w-4xl">
                            <div className="absolute left-1/2 top-0 bottom-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent md:block" />
                            <div className="space-y-8">
                                {timeline.map(([year, era, event], index) => (
                                    <div key={year} className={`grid items-start gap-4 md:grid-cols-[1fr_28px_1fr] ${index % 2 ? 'md:text-right' : ''}`}>
                                        <div className={index % 2 ? 'md:col-start-3 md:row-start-1' : ''}>
                                            <div className="text-[10.5px] font-bold uppercase tracking-[2px] text-[var(--gold)]">{era}</div>
                                            <div className="font-serif text-[23px] font-semibold">{year}</div>
                                            <p className="mt-1 text-[13px] leading-6 text-[var(--ink-soft)]">{event}</p>
                                        </div>
                                        <div className="hidden place-items-center md:grid">
                                            <span className="h-3.5 w-3.5 rounded-full bg-[var(--gold)] shadow-[0_0_0_4px_var(--bg),0_0_0_5px_var(--gold-soft)]" />
                                        </div>
                                        <div className="hidden md:block" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-3xl px-5 py-16 text-center">
                    <Icon name="lotus" size={28} className="mx-auto text-[var(--gold)]" />
                    <h2 className="mt-5 font-serif text-[clamp(36px,6vw,54px)] font-semibold leading-tight">
                        Cây có gốc mới nở cành xanh ngọn
                        <br />
                        Nước có nguồn mới bể rộng sông sâu
                    </h2>
                    <p className="mt-4 text-[13px] text-[var(--ink-mute)]">Ca dao Việt Nam</p>
                    <button type="button" className="gp-btn gp-btn-primary mt-8 min-h-12 px-7 text-[15px]" onClick={() => router.visit('/gia-pha/dashboard')}>
                        Bắt đầu hành trình
                        <Icon name="arrow-right" size={17} />
                    </button>
                </section>
            </main>
        </>
    );
}

function HeroTreeIllustration() {
    const gen2: Array<[number, string, string]> = [
        [130, 'NV. Đức', '1878'],
        [260, 'NT. Hương', '1881'],
        [390, 'NV. Hùng', '1885'],
    ];
    const gen3: Array<[number, string]> = [
        [80, 'Minh'],
        [180, 'Liên'],
        [260, 'Tài'],
        [340, 'Yến'],
        [440, 'Hà'],
    ];
    const gen4: Array<[number, boolean]> = [
        [60, false],
        [100, false],
        [180, false],
        [240, true],
        [280, false],
        [340, false],
        [420, false],
        [460, false],
    ];

    return (
        <svg viewBox="0 0 520 560" width="100%" height="100%" fill="none" className="block">
            <defs>
                <radialGradient id="gpHeroHalo" cx="50%" cy="22%" r="55%">
                    <stop offset="0%" stopColor="var(--gold-glow)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--gold-glow)" stopOpacity="0" />
                </radialGradient>
            </defs>
            <circle cx="260" cy="130" r="220" fill="url(#gpHeroHalo)" />
            <g opacity="0.55" stroke="var(--gold)" strokeWidth="0.8" fill="none">
                <rect x="30" y="30" width="460" height="500" rx="8" strokeDasharray="2 4" />
                <path d="M260 18 L274 30 L260 42 L246 30 Z" fill="var(--gold)" />
                <path d="M260 542 L274 530 L260 518 L246 530 Z" fill="var(--gold)" />
                <path d="M18 280 L30 266 L42 280 L30 294 Z" fill="var(--gold)" />
                <path d="M502 280 L490 266 L478 280 L490 294 Z" fill="var(--gold)" />
            </g>
            <g stroke="var(--gold)" strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round">
                <path d="M260 130 L260 165 L130 165 L130 195" />
                <path d="M260 165 L260 195" />
                <path d="M260 165 L390 165 L390 195" />
                <path d="M130 250 L130 285 L80 285 L80 310" />
                <path d="M130 285 L180 285 L180 310" />
                <path d="M260 250 L260 310" />
                <path d="M390 250 L390 285 L340 285 L340 310" />
                <path d="M390 285 L440 285 L440 310" />
                <path d="M80 365 L80 400 L60 400 L60 425" />
                <path d="M80 400 L100 400 L100 425" />
                <path d="M180 365 L180 425" />
                <path d="M260 365 L260 400 L240 400 L240 425" />
                <path d="M260 400 L280 400 L280 425" />
                <path d="M340 365 L340 425" />
                <path d="M440 365 L440 400 L420 400 L420 425" />
                <path d="M440 400 L460 400 L460 425" />
            </g>
            <g stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.95">
                <path d="M260 130 L260 195" />
                <path d="M260 250 L260 310" />
                <path d="M260 365 L260 400 L240 400 L240 425" />
            </g>
            <g fill="var(--ink-mute)" fontSize="9" fontFamily="Be Vietnam Pro" letterSpacing="2">
                <text x="490" y="135" textAnchor="end">ĐỜI 1 · CỤ TỔ</text>
                <text x="490" y="225" textAnchor="end">ĐỜI 2</text>
                <text x="490" y="340" textAnchor="end">ĐỜI 3</text>
                <text x="490" y="455" textAnchor="end">ĐỜI 4 · 5</text>
            </g>
            <g>
                <circle cx="260" cy="130" r="38" fill="var(--gold-glow)" stroke="var(--gold)" strokeWidth="2" />
                <circle cx="260" cy="130" r="30" fill="var(--card)" stroke="var(--gold)" strokeWidth="1" />
                <text x="260" y="125" textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">CỤ TỔ</text>
                <text x="260" y="138" textAnchor="middle" fontSize="14" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">NV. Trường</text>
                <text x="260" y="150" textAnchor="middle" fontSize="8" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">1850 - 1920</text>
            </g>
            {gen2.map(([x, name, birth]) => (
                <g key={x}>
                    <circle cx={x} cy="222" r="27" fill="var(--card)" stroke="var(--gold)" strokeWidth="1.2" />
                    <text x={x} y="220" textAnchor="middle" fontSize="11" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{name}</text>
                    <text x={x} y="232" textAnchor="middle" fontSize="7.5" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">{birth}</text>
                </g>
            ))}
            {gen3.map(([x, name]) => (
                <g key={x}>
                    <circle cx={x} cy="337" r="22" fill="var(--card)" stroke="var(--gold-soft)" strokeWidth="1" />
                    <text x={x} y="335" textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{name}</text>
                    <text x={x} y="346" textAnchor="middle" fontSize="7" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">đời 3</text>
                </g>
            ))}
            {gen4.map(([x, isMe]) => (
                <g key={x}>
                    <circle cx={x} cy="447" r="14" fill={isMe ? 'var(--gold)' : 'var(--card)'} stroke={isMe ? 'var(--gold)' : 'var(--gold-soft)'} strokeWidth={isMe ? '2' : '1'} />
                    {isMe && <circle cx={x} cy="447" r="20" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.4" />}
                </g>
            ))}
            <g transform="translate(240, 482)">
                <path d="M0 0 L8 -8 M0 0 L-8 -8" stroke="var(--gold)" strokeWidth="1" />
                <text x="0" y="14" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Be Vietnam Pro" fontWeight="600">BẠN</text>
            </g>
            <g transform="translate(260, 510)">
                <rect x="-80" y="-15" width="160" height="24" rx="12" fill="var(--card)" stroke="var(--gold)" strokeWidth="0.8" />
                <text x="0" y="1" textAnchor="middle" fontSize="12" fill="var(--brown)" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight="600">Trung · Hiếu · Nhân · Nghĩa</text>
            </g>
        </svg>
    );
}
