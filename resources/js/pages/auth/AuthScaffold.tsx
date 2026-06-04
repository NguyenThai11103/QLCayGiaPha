import { ReactNode } from 'react';
import Icon from '../../components/gia-pha/Icon';

type AuthScaffoldProps = {
    eyebrow: string;
    title: string;
    subtitle: string;
    children: ReactNode;
};

export default function AuthScaffold({ eyebrow, title, subtitle, children }: AuthScaffoldProps) {
    return (
        <main className="grid min-h-screen bg-[var(--bg)] text-[var(--ink)] lg:grid-cols-[1fr_1fr]">
            <section className="relative hidden min-h-screen overflow-hidden bg-[linear-gradient(160deg,#3A2714_0%,#1A120A_52%,#0F0A06_100%)] px-10 py-12 lg:flex lg:flex-col lg:items-center lg:justify-center">
                <div className="bg-pattern absolute inset-0 opacity-10" />
                <div className="absolute left-8 top-8 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[linear-gradient(135deg,rgba(255,220,150,0.95),rgba(180,120,50,0.95))] text-[#1A120A] shadow-[0_4px_16px_rgba(255,180,80,0.25)]">
                        <Icon name="tree" size={19} />
                    </span>
                    <span className="leading-none">
                        <span className="block font-serif text-[22px] font-semibold text-[#fff0c8]/90">Gia Phả</span>
                        <span className="mt-1 block text-[9px] font-bold uppercase tracking-[2px] text-[#fff0c8]/45">Nền tảng gia phả</span>
                    </span>
                </div>

                <div className="relative w-full max-w-[420px] opacity-90">
                    <AuthTreeDecor />
                </div>

                <div className="absolute bottom-12 left-10 right-10 text-center">
                    <p className="font-serif text-[24px] font-medium italic leading-snug text-[#fff0c8]/65">
                        "Cây có gốc mới nở cành xanh ngọn,
                        <br />
                        nước có nguồn mới bể rộng sông sâu."
                    </p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[1.8px] text-[#fff0c8]/35">Ca dao Việt Nam</p>
                </div>
            </section>

            <section className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-8 lg:px-14">
                <div className="absolute right-5 top-5 flex items-center gap-1.5 sm:right-8 sm:top-7">
                    <button type="button" className="rounded-md border border-[var(--gold-pale)] bg-[var(--gold-glow)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--brown)]">
                        VI
                    </button>
                    <button type="button" className="rounded-md border border-[var(--line)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ink-mute)]">
                        EN
                    </button>
                </div>

                <div className="w-full max-w-[430px]">
                    <div className="mb-8">
                        <div className="gp-chip gp-chip-gold mb-5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                            {eyebrow}
                        </div>
                        <h1 className="font-serif text-[clamp(34px,5vw,40px)] font-semibold leading-[1.08] tracking-[-0.3px]">{title}</h1>
                        <p className="mt-2 text-[14.5px] leading-6 text-[var(--ink-mute)]">{subtitle}</p>
                    </div>

                    {children}
                </div>
            </section>
        </main>
    );
}

function AuthTreeDecor() {
    const gen2 = [120, 200, 280];
    const gen3 = [80, 160, 200, 240, 320];

    return (
        <svg viewBox="0 0 400 500" width="100%" height="100%" fill="none" className="block">
            <defs>
                <radialGradient id="authHalo" cx="50%" cy="35%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,245,210,0.35)" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>
            <circle cx="200" cy="180" r="165" fill="url(#authHalo)" />
            <g opacity="0.3" stroke="rgba(255,240,200,0.5)" strokeWidth="0.6" fill="none">
                <rect x="40" y="40" width="320" height="420" rx="6" strokeDasharray="2 5" />
                <path d="M200 28 L212 40 L200 52 L188 40 Z" fill="rgba(255,240,200,0.3)" />
                <path d="M200 472 L212 460 L200 448 L188 460 Z" fill="rgba(255,240,200,0.3)" />
            </g>
            <g stroke="rgba(255,230,180,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M200 145 L200 175 L120 175 L120 205" />
                <path d="M200 175 L200 205" />
                <path d="M200 175 L280 175 L280 205" />
                <path d="M120 245 L120 280 L80 280 L80 310" />
                <path d="M120 280 L160 280 L160 310" />
                <path d="M200 245 L200 310" />
                <path d="M280 245 L280 280 L240 280 L240 310" />
                <path d="M280 280 L320 280 L320 310" />
            </g>
            <g stroke="rgba(255,220,150,0.68)" strokeWidth="2" fill="none" strokeLinecap="round">
                <path d="M200 145 L200 205" />
                <path d="M200 245 L200 310" />
            </g>
            <g>
                <circle cx="200" cy="140" r="30" fill="rgba(255,240,200,0.15)" stroke="rgba(255,220,150,0.5)" strokeWidth="1.5" />
                <circle cx="200" cy="140" r="22" fill="rgba(40,30,15,0.3)" stroke="rgba(255,220,150,0.3)" strokeWidth="0.8" />
                <text x="200" y="136" textAnchor="middle" fontSize="8" fill="rgba(255,240,200,0.7)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">
                    CỤ TỔ
                </text>
                <text x="200" y="149" textAnchor="middle" fontSize="11" fill="rgba(255,240,200,0.9)" fontFamily="Cormorant Garamond" fontWeight="600">
                    Nguyễn
                </text>
            </g>
            {gen2.map((x) => (
                <circle key={x} cx={x} cy="225" r="20" fill="rgba(40,30,15,0.25)" stroke="rgba(255,220,150,0.35)" strokeWidth="1" />
            ))}
            {gen3.map((x) => (
                <g key={x}>
                    <circle cx={x} cy="330" r="14" fill="rgba(40,30,15,0.2)" stroke="rgba(255,220,150,0.25)" strokeWidth="0.8" />
                    {x === 200 && (
                        <>
                            <circle cx={x} cy="330" r="14" fill="rgba(255,200,100,0.3)" stroke="rgba(255,220,150,0.6)" strokeWidth="1.5" />
                            <circle cx={x} cy="330" r="21" fill="none" stroke="rgba(255,220,150,0.3)" strokeWidth="0.8" className="origin-center animate-pulse" />
                        </>
                    )}
                </g>
            ))}
            <text x="200" y="402" textAnchor="middle" fontSize="12" fill="rgba(255,240,200,0.5)" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight="500" letterSpacing="2">
                Trung - Hiếu - Nhân - Nghĩa
            </text>
        </svg>
    );
}
