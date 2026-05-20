/* global window, React, Icon, VietOrnament, CLAN */
// ============================================================
// Landing page — Hero + features + timeline
// With scroll-triggered animations and micro-interactions
// ============================================================
const { useEffect: useLdEffect, useRef: useLdRef, useState: useLdState, useCallback: useLdCallback } = React;

// ============================================================
// Intersection Observer hook — triggers .is-visible class
// ============================================================
function useScrollReveal(options = {}) {
  const ref = useLdRef(null);
  useLdEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("is-visible");
        obs.disconnect();
      }
    }, { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ============================================================
// Animated counter — counts up from 0 to target
// ============================================================
function AnimatedCounter({ value, suffix = "", duration = 1800 }) {
  const [display, setDisplay] = useLdState("0");
  const ref = useLdRef(null);
  const hasAnimated = useLdRef(false);

  useLdEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Also trigger after hero entrance delay as fallback
    const fallbackTimer = setTimeout(() => { if (!hasAnimated.current) triggerCount(); }, 1200);
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) triggerCount();
    }, { threshold: 0.05 });
    obs.observe(el);

    function triggerCount() {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      const numStr = value.replace(/[^0-9.]/g, "");
      const target = parseFloat(numStr) || 0;
      const hasDecimal = numStr.includes(".");
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        if (hasDecimal) {
          setDisplay(current.toFixed(1));
        } else {
          setDisplay(Math.round(current).toString());
        }
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(hasDecimal ? target.toFixed(1) : Math.round(target).toString());
      }
      requestAnimationFrame(tick);
      obs.disconnect();
    }
    return () => { obs.disconnect(); clearTimeout(fallbackTimer); };
  }, [value, duration]);

  // Extract prefix/suffix from value string
  const numPart = value.replace(/[^0-9.]/g, "");
  const afterNum = value.slice(value.indexOf(numPart) + numPart.length);

  return (
    <span ref={ref} className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
      {display}{afterNum}
    </span>
  );
}

// ============================================================
// Hero Tree Illustration — with draw-in animation
// ============================================================
function HeroTreeIllustration() {
  return (
    <svg viewBox="0 0 520 560" width="100%" height="100%" fill="none" style={{ display: "block" }}>
      <defs>
        <radialGradient id="halo" cx="50%" cy="22%" r="55%">
          <stop offset="0%" stopColor="var(--gold-glow)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--gold-glow)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--brown-soft)" />
        </linearGradient>
        <pattern id="dot-tile" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="0.8" fill="var(--gold)" opacity="0.18" />
        </pattern>
        <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* halo — breathes */}
      <circle cx="260" cy="130" r="220" fill="url(#halo)">
        <animate attributeName="r" values="210;230;210" dur="5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;1;0.8" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Decorative frame — Vietnamese diamond cartouche */}
      <g opacity="0.55" stroke="var(--gold)" strokeWidth="0.8" fill="none">
        <rect x="30" y="30" width="460" height="500" rx="8" strokeDasharray="2 4">
          <animate attributeName="stroke-dashoffset" values="0;48" dur="12s" repeatCount="indefinite" />
        </rect>
        <path d="M260 18 L274 30 L260 42 L246 30 Z" fill="var(--gold)">
          <animateTransform attributeName="transform" type="rotate" values="0 260 30;360 260 30" dur="20s" repeatCount="indefinite" />
        </path>
        <path d="M260 542 L274 530 L260 518 L246 530 Z" fill="var(--gold)">
          <animateTransform attributeName="transform" type="rotate" values="0 260 530;-360 260 530" dur="20s" repeatCount="indefinite" />
        </path>
        <path d="M18 280 L30 266 L42 280 L30 294 Z" fill="var(--gold)">
          <animateTransform attributeName="transform" type="rotate" values="0 30 280;360 30 280" dur="20s" repeatCount="indefinite" />
        </path>
        <path d="M502 280 L490 266 L478 280 L490 294 Z" fill="var(--gold)">
          <animateTransform attributeName="transform" type="rotate" values="0 490 280;-360 490 280" dur="20s" repeatCount="indefinite" />
        </path>
      </g>

      {/* Connector lines — draw-in animation */}
      <g stroke="var(--gold)" strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round"
         style={{ strokeDasharray: 600, strokeDashoffset: 600, animation: "drawLine 2s cubic-bezier(0.22,1,0.36,1) 0.8s forwards" }}>
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

      {/* Bloodline highlight — draws in after connectors */}
      <g stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.95"
         style={{ strokeDasharray: 400, strokeDashoffset: 400, animation: "drawLine 1.5s cubic-bezier(0.22,1,0.36,1) 1.8s forwards" }}>
        <path d="M260 130 L260 195" />
        <path d="M260 250 L260 310" />
        <path d="M260 365 L260 400 L240 400 L240 425" />
      </g>

      {/* Generation labels */}
      <g fill="var(--ink-mute)" fontSize="9" fontFamily="Be Vietnam Pro" letterSpacing="2" opacity="0"
         style={{ animation: "revealUp 0.6s ease 2.2s forwards" }}>
        <text x="490" y="135" textAnchor="end">ĐỜI 1 · CỤ TỔ</text>
        <text x="490" y="225" textAnchor="end">ĐỜI 2</text>
        <text x="490" y="340" textAnchor="end">ĐỜI 3</text>
        <text x="490" y="455" textAnchor="end">ĐỜI 4 · 5</text>
      </g>

      {/* Gen 1 — Founder node (pops in first) */}
      <g opacity="0" style={{ animation: "revealScale 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.4s forwards", transformOrigin: "260px 130px" }}>
        <circle cx="260" cy="130" r="38" fill="var(--gold-glow)" stroke="var(--gold)" strokeWidth="2" />
        <circle cx="260" cy="130" r="30" fill="var(--card)" stroke="var(--gold)" strokeWidth="1" />
        <text x="260" y="125" textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">CỤ TỔ</text>
        <text x="260" y="138" textAnchor="middle" fontSize="14" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">NV. Trường</text>
        <text x="260" y="150" textAnchor="middle" fontSize="8" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">1850 — 1920</text>
      </g>

      {/* Gen 2 — 3 sons (staggered) */}
      {[[130, "NV. Đức", "1878", 0], [260, "NT. Hương", "1881", 1], [390, "NV. Hùng", "1885", 2]].map(([x, n, b, i]) => (
        <g key={i} opacity="0" style={{ animation: `revealScale 0.6s cubic-bezier(0.34,1.56,0.64,1) ${1.0 + i * 0.12}s forwards`, transformOrigin: `${x}px 222px` }}>
          <circle cx={x} cy={222} r="27" fill="var(--card)" stroke="var(--gold)" strokeWidth="1.2" />
          <text x={x} y={220} textAnchor="middle" fontSize="11" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{n}</text>
          <text x={x} y={232} textAnchor="middle" fontSize="7.5" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">{b}</text>
        </g>
      ))}

      {/* Gen 3 — 5 nodes (staggered) */}
      {[[80, "Minh", 0], [180, "Liên", 1], [260, "Tài", 2], [340, "Yến", 3], [440, "Hà", 4]].map(([x, n, i]) => (
        <g key={i} opacity="0" style={{ animation: `revealScale 0.5s cubic-bezier(0.34,1.56,0.64,1) ${1.5 + i * 0.1}s forwards`, transformOrigin: `${x}px 337px` }}>
          <circle cx={x} cy={337} r="22" fill="var(--card)" stroke="var(--gold-soft)" strokeWidth="1" />
          <text x={x} y={335} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{n}</text>
          <text x={x} y={346} textAnchor="middle" fontSize="7" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">đời 3</text>
        </g>
      ))}

      {/* Gen 4+ — small nodes (staggered, "BẠN" pulses) */}
      {[[60, false, 0], [100, false, 1], [180, false, 2], [240, true, 3], [280, false, 4], [340, false, 5], [420, false, 6], [460, false, 7]].map(([x, isMe, i]) => (
        <g key={i} opacity="0" style={{ animation: `revealScale 0.4s cubic-bezier(0.34,1.56,0.64,1) ${2.0 + i * 0.08}s forwards`, transformOrigin: `${x}px 447px` }}>
          <circle cx={x} cy={447} r="14" fill={isMe ? "var(--gold)" : "var(--card)"} stroke={isMe ? "var(--gold)" : "var(--gold-soft)"} strokeWidth={isMe ? "2" : "1"} />
          {isMe && <circle cx={x} cy={447} r="20" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>}
        </g>
      ))}

      {/* "Bạn đang ở đây" indicator */}
      <g transform="translate(240, 482)" opacity="0" style={{ animation: "revealUp 0.5s ease 2.6s forwards" }}>
        <path d="M0 0 L8 -8 M0 0 L-8 -8" stroke="var(--gold)" strokeWidth="1" />
        <text x="0" y="14" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Be Vietnam Pro" fontWeight="600">BẠN</text>
      </g>

      {/* Bottom motto seal */}
      <g transform="translate(260, 510)" opacity="0" style={{ animation: "revealUp 0.5s ease 2.8s forwards" }}>
        <rect x="-70" y="-15" width="140" height="22" rx="11" fill="var(--card)" stroke="var(--gold)" strokeWidth="0.8" />
      </g>
      <text x="260" y="514" textAnchor="middle" fontSize="11" fill="var(--brown)" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight="600"
        opacity="0" style={{ animation: "revealUp 0.5s ease 3s forwards" }}>Trung · Hiếu · Nhân · Nghĩa</text>
    </svg>
  );
}

// ============================================================
function StatPill({ value, label, delay = 0 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <AnimatedCounter value={value} />
      <div style={{ fontSize: 11.5, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent, index = 0 }) {
  const ref = useScrollReveal({ threshold: 0.2 });
  return (
    <div ref={ref}
      className="card card-pad card-hover feature-card-enter"
      style={{ position: "relative", overflow: "hidden", animationDelay: `${index * 0.1}s` }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center",
        background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
        color: `var(--${accent})`, marginBottom: 14,
        border: `1px solid color-mix(in srgb, var(--${accent}) 22%, transparent)`,
        transition: "transform 0.3s ease",
      }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

function TimelineMarker({ year, event, side, era, index = 0 }) {
  const ref = useScrollReveal({ threshold: 0.3 });
  return (
    <div ref={ref}
      className={`scroll-reveal ${side === "right" ? "rv-right" : "rv-left"}`}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        flexDirection: side === "right" ? "row-reverse" : "row",
        textAlign: side === "right" ? "right" : "left",
        animationDuration: "0.7s",
        animationDelay: `${index * 0.15}s`,
      }}>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{era}</div>
        <div className="font-serif" style={{ fontSize: 20, color: "var(--ink)", fontWeight: 600, margin: "2px 0 4px" }}>{year}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, maxWidth: 240, marginLeft: side === "right" ? "auto" : 0 }}>{event}</div>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="tl-dot-anim" style={{
          width: 14, height: 14, borderRadius: "50%", background: "var(--gold)",
          boxShadow: "0 0 0 4px var(--bg), 0 0 0 5px var(--gold-soft)",
          animationDelay: `${index * 0.15 + 0.2}s`,
        }} />
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}

// ============================================================
// Section ornament with rotating lotus
// ============================================================
function SectionDivider({ label }) {
  const ref = useScrollReveal({ threshold: 0.5 });
  return (
    <div ref={ref} className="scroll-reveal rv-up"
      style={{ display: "flex", alignItems: "center", gap: 16, margin: "72px 0 48px", color: "var(--gold)", animationDuration: "0.6s" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--gold-soft))" }} />
      <div style={{ animation: "ornamentSpin 30s linear infinite" }}>
        <Icon name="lotus" size={20} />
      </div>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--ink-mute)", fontWeight: 600 }}>{label}</div>
      <div style={{ animation: "ornamentSpin 30s linear infinite reverse" }}>
        <Icon name="lotus" size={20} />
      </div>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, var(--gold-soft))" }} />
    </div>
  );
}

// ============================================================
// Main landing page
// ============================================================
function LandingPage({ onNav }) {
  const featuresRef = useScrollReveal({ threshold: 0.15 });
  const timelineLineRef = useScrollReveal({ threshold: 0.2 });
  const ctaRef = useScrollReveal({ threshold: 0.3 });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>

      {/* ====== HERO ====== */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        gap: 48,
        alignItems: "center",
        minHeight: 580,
        position: "relative",
        paddingTop: 16,
      }}>
        {/* Top ornament — floats */}
        <div className="breathe" style={{ position: "absolute", top: -8, left: -16, color: "var(--gold)", opacity: 0.6 }}>
          <VietOrnament size={48} />
        </div>

        {/* Left: copy — staggered entrance */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 12px", borderRadius: 999,
            background: "var(--gold-glow)", border: "1px solid var(--gold-pale)", marginBottom: 24
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", animation: "pulse-gold 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 12, color: "var(--brown)", fontWeight: 600, letterSpacing: 0.5 }}>Phiên bản 2026 · Beta công khai</span>
          </div>

          <h1 className="font-serif hero-title" style={{
            fontSize: 64, fontWeight: 600, lineHeight: 1.05,
            color: "var(--ink)", letterSpacing: "-0.5px", marginBottom: 20
          }}>
            Lưu giữ <em style={{ color: "var(--gold)", fontStyle: "italic" }}>cội nguồn</em>,<br />
            kết nối <em style={{ color: "var(--brown)", fontStyle: "italic" }}>muôn đời.</em>
          </h1>

          <p className="hero-body" style={{ fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.55, maxWidth: 500, marginBottom: 36 }}>
            Gia Phả là nền tảng số hoá gia phả truyền thống Việt Nam — giúp dòng họ của bạn ghi chép, tra cứu và truyền lại lịch sử qua nhiều thế hệ, với sự hỗ trợ của trí tuệ nhân tạo.
          </p>

          <div className="row gap-3 hero-buttons" style={{ marginBottom: 48 }}>
            <button className="btn btn-primary btn-lg btn-shimmer" onClick={() => onNav("tree")}>
              <Icon name="tree" size={18} />
              Khám phá cây gia phả
              <Icon name="arrow-right" size={16} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNav("clan")}
              style={{ transition: "all 0.25s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <Icon name="plus" size={18} />
              Lập dòng họ mới
            </button>
          </div>

          {/* Stat strip — counts animate in */}
          <div className="hero-stats" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            paddingTop: 28, borderTop: "1px solid var(--line)",
            gap: 24,
          }}>
            <StatPill value="12K+" label="Dòng họ" />
            <StatPill value="1.4M" label="Thành viên" />
            <StatPill value="63" label="Tỉnh thành" />
            <StatPill value="9 đời" label="Sâu nhất" />
          </div>
        </div>

        {/* Right: tree illustration — floats gently */}
        <div className="hero-tree" style={{
          position: "relative",
          aspectRatio: "520 / 560",
          maxWidth: 560,
          marginLeft: "auto",
        }}>
          <div className="bg-pattern breathe" style={{
            position: "absolute", inset: -20, borderRadius: 24,
            opacity: 0.6,
          }} />
          <div className="float-gentle" style={{ position: "relative", height: "100%", filter: "drop-shadow(0 12px 32px rgba(184,144,44,0.12))" }}>
            <HeroTreeIllustration />
          </div>
        </div>
      </section>

      {/* ====== Section divider ornament ====== */}
      <SectionDivider label="Tính năng" />

      {/* ====== Features ====== */}
      <section ref={featuresRef} className="scroll-reveal rv-up" style={{
        textAlign: "center", marginBottom: 48,
        animationDuration: "0.7s",
      }}>
        <h2 className="font-serif" style={{ fontSize: 42, fontWeight: 600, color: "var(--ink)", marginBottom: 14, letterSpacing: "-0.3px" }}>
          Truyền thống gặp công nghệ
        </h2>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", maxWidth: 620, margin: "0 auto", lineHeight: 1.55 }}>
          Mọi tính năng được thiết kế tỉ mỉ cho văn hoá thờ cúng, tôn ti và xưng hô của người Việt.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 96 }}>
        <FeatureCard index={0} icon="tree" accent="gold" title="Cây gia phả tương tác"
          desc="Hiển thị nhiều đời theo bố cục dọc truyền thống. Phóng to, di chuyển và mở rộng từng nhánh con cháu một cách mượt mà." />
        <FeatureCard index={1} icon="link" accent="jade" title="Phân tích quan hệ"
          desc="Chọn hai thành viên bất kỳ — hệ thống tự tính và đặt tên đúng theo xưng hô Việt: chú, bác, cô, dì, cháu, chắt, chút, chít..." />
        <FeatureCard index={2} icon="ai" accent="terracotta" title="AI cho gia phả cũ"
          desc="OCR sách gia phả chữ Hán-Nôm, gợi ý ghép thành viên trùng tên, và trợ lý hỏi đáp về phong tục dòng họ." />
        <FeatureCard index={3} icon="calendar" accent="crimson" title="Lễ giỗ & sự kiện"
          desc="Theo dõi giỗ chạp âm lịch tự động, nhắc nhở trước, ghi nhận con cháu tham dự và lưu trữ ảnh các kỳ giỗ." />
        <FeatureCard index={4} icon="scroll" accent="brown" title="Tài liệu gốc"
          desc="Lưu trữ scan sách gia phả cổ, hoành phi, câu đối, sắc phong — đính kèm vào từng nhân vật trong cây." />
        <FeatureCard index={5} icon="users" accent="gold" title="Phân quyền dòng họ"
          desc="Trưởng họ, trưởng chi, hội đồng dòng họ — mỗi vai trò có quyền chỉnh sửa riêng. Lịch sử thay đổi minh bạch." />
      </section>

      {/* ====== Timeline section ====== */}
      <section style={{
        background: "var(--card-soft)",
        borderRadius: 24,
        border: "1px solid var(--card-border)",
        padding: "56px 48px",
        position: "relative",
        overflow: "hidden",
        marginBottom: 64,
      }}>
        <div className="bg-pattern" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
        <div style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: 8 }}>Lịch sử</div>
            <h2 className="font-serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--ink)" }}>
              176 năm — 6 thế hệ
            </h2>
          </div>

          <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
            {/* Vertical line — draws in on scroll, triggered by parent */}
            <div ref={timelineLineRef} className="scroll-reveal rv-up" style={{
              position: "absolute", left: "50%", top: 8, bottom: 8, width: 20,
              transform: "translateX(-50%)",
              animationDuration: "0.01s",
              pointerEvents: "none",
            }}>
              <div className="tl-line-child" style={{
                position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
                background: "linear-gradient(to bottom, transparent, var(--gold-soft), var(--gold-soft), transparent)",
                transform: "translateX(-50%) scaleY(0)",
                transformOrigin: "top center",
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <TimelineMarker index={0} year="1850" era="Tự Đức · Đời 1" side="left" event="Cụ Tổ Nguyễn Văn Trường lập làng tại Tiên Điền, Hà Tĩnh — đỗ Hương Cống triều Tự Đức." />
              <TimelineMarker index={1} year="1910" era="Khai sinh · Đời 3" side="right" event="Ông Nguyễn Văn Minh đỗ Cử nhân Hán học, là người đầu tiên trong họ ghi chép gia phả bằng chữ Quốc Ngữ." />
              <TimelineMarker index={2} year="1970" era="Đổi mới · Đời 5" side="left" event="Bác sĩ Nguyễn Văn Hải gia nhập Bệnh viện Bạch Mai — thế hệ đầu tiên ra Hà Nội học tập và lập nghiệp." />
              <TimelineMarker index={3} year="2026" era="Số hoá · Đời 6" side="right" event="Gia phả họ Nguyễn được số hoá hoàn toàn — toàn bộ 247 thành viên hiện diện trên một nền tảng." />
            </div>
          </div>
        </div>
      </section>

      {/* ====== Final CTA ====== */}
      <section ref={ctaRef} className="scroll-reveal rv-up" style={{
        textAlign: "center",
        padding: "64px 32px 96px",
        position: "relative",
        animationDuration: "0.8s",
      }}>
        <div className="float-gentle" style={{ color: "var(--gold)", marginBottom: 24 }}>
          <Icon name="lotus" size={32} />
        </div>
        <h2 className="font-serif" style={{ fontSize: 38, fontWeight: 600, color: "var(--ink)", maxWidth: 640, margin: "0 auto 16px", lineHeight: 1.2 }}>
          "Cây có gốc mới nở cành xanh ngọn,<br />nước có nguồn mới bể rộng sông sâu."
        </h2>
        <p style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 32 }}>— Ca dao Việt Nam</p>
        <div className="row gap-3" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary btn-lg btn-shimmer" onClick={() => onNav("dashboard")}
            style={{ transition: "all 0.25s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px) scale(1.02)"; e.currentTarget.style.boxShadow = "var(--shadow-gold)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            Bắt đầu hành trình
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { LandingPage });
