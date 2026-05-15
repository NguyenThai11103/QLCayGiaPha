/* global window, React, Icon, VietOrnament, CLAN */
// ============================================================
// Landing page — Hero + features + timeline
// ============================================================

function HeroTreeIllustration() {
  // Stylized lineage tree — 4 generations radiating downward from Cụ Tổ.
  // Designed to feel like a temple plaque + tree branch hybrid.
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

      {/* halo */}
      <circle cx="260" cy="130" r="220" fill="url(#halo)" />

      {/* Decorative frame — Vietnamese diamond cartouche */}
      <g opacity="0.55" stroke="var(--gold)" strokeWidth="0.8" fill="none">
        <rect x="30" y="30" width="460" height="500" rx="8" strokeDasharray="2 4" />
        <path d="M260 18 L274 30 L260 42 L246 30 Z" fill="var(--gold)" />
        <path d="M260 542 L274 530 L260 518 L246 530 Z" fill="var(--gold)" />
        <path d="M18 280 L30 266 L42 280 L30 294 Z" fill="var(--gold)" />
        <path d="M502 280 L490 266 L478 280 L490 294 Z" fill="var(--gold)" />
      </g>

      {/* Connector lines (drawn first so they're behind nodes) */}
      <g stroke="var(--gold)" strokeWidth="1.5" fill="none" opacity="0.55" strokeLinecap="round">
        {/* Gen 1 -> Gen 2 (3 branches) */}
        <path d="M260 130 L260 165 L130 165 L130 195" />
        <path d="M260 165 L260 195" />
        <path d="M260 165 L390 165 L390 195" />
        {/* Gen 2 -> Gen 3 */}
        <path d="M130 250 L130 285 L80 285 L80 310" />
        <path d="M130 285 L180 285 L180 310" />
        <path d="M260 250 L260 310" />
        <path d="M390 250 L390 285 L340 285 L340 310" />
        <path d="M390 285 L440 285 L440 310" />
        {/* Gen 3 -> Gen 4 (current gen, only some) */}
        <path d="M80 365 L80 400 L60 400 L60 425" />
        <path d="M80 400 L100 400 L100 425" />
        <path d="M180 365 L180 425" />
        <path d="M260 365 L260 400 L240 400 L240 425" />
        <path d="M260 400 L280 400 L280 425" />
        <path d="M340 365 L340 425" />
        <path d="M440 365 L440 400 L420 400 L420 425" />
        <path d="M440 400 L460 400 L460 425" />
      </g>

      {/* Bloodline highlight — primary line from founder to "me" */}
      <g stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.95">
        <path d="M260 130 L260 195" />
        <path d="M260 250 L260 310" />
        <path d="M260 365 L260 400 L240 400 L240 425" />
      </g>

      {/* Generation labels - right gutter */}
      <g fill="var(--ink-mute)" fontSize="9" fontFamily="Be Vietnam Pro" letterSpacing="2">
        <text x="490" y="135" textAnchor="end">ĐỜI 1 · CỤ TỔ</text>
        <text x="490" y="225" textAnchor="end">ĐỜI 2</text>
        <text x="490" y="340" textAnchor="end">ĐỜI 3</text>
        <text x="490" y="455" textAnchor="end">ĐỜI 4 · 5</text>
      </g>

      {/* Gen 1 — Founder node (larger, ornate) */}
      <g>
        <circle cx="260" cy="130" r="38" fill="var(--gold-glow)" stroke="var(--gold)" strokeWidth="2" />
        <circle cx="260" cy="130" r="30" fill="var(--card)" stroke="var(--gold)" strokeWidth="1" />
        <text x="260" y="125" textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">CỤ TỔ</text>
        <text x="260" y="138" textAnchor="middle" fontSize="14" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">NV. Trường</text>
        <text x="260" y="150" textAnchor="middle" fontSize="8" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">1850 — 1920</text>
      </g>

      {/* Gen 2 — 3 sons */}
      {[[130, "NV. Đức", "1878"], [260, "NT. Hương", "1881"], [390, "NV. Hùng", "1885"]].map(([x, n, b], i) => (
        <g key={i}>
          <circle cx={x} cy={222} r="27" fill="var(--card)" stroke="var(--gold)" strokeWidth="1.2" />
          <text x={x} y={220} textAnchor="middle" fontSize="11" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{n}</text>
          <text x={x} y={232} textAnchor="middle" fontSize="7.5" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">{b}</text>
        </g>
      ))}

      {/* Gen 3 — 5 nodes */}
      {[[80, "Minh"], [180, "Liên"], [260, "Tài"], [340, "Yến"], [440, "Hà"]].map(([x, n], i) => (
        <g key={i}>
          <circle cx={x} cy={337} r="22" fill="var(--card)" stroke="var(--gold-soft)" strokeWidth="1" />
          <text x={x} y={335} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="Cormorant Garamond" fontWeight="600">{n}</text>
          <text x={x} y={346} textAnchor="middle" fontSize="7" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro">đời 3</text>
        </g>
      ))}

      {/* Gen 4+ — small nodes, current generation */}
      {[[60, false], [100, false], [180, false], [240, true], [280, false], [340, false], [420, false], [460, false]].map(([x, isMe], i) => (
        <g key={i}>
          <circle cx={x} cy={447} r="14" fill={isMe ? "var(--gold)" : "var(--card)"} stroke={isMe ? "var(--gold)" : "var(--gold-soft)"} strokeWidth={isMe ? "2" : "1"} />
          {isMe && <circle cx={x} cy={447} r="20" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.4">
            <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>}
        </g>
      ))}

      {/* "Bạn đang ở đây" indicator */}
      <g transform="translate(240, 482)">
        <path d="M0 0 L8 -8 M0 0 L-8 -8" stroke="var(--gold)" strokeWidth="1" />
        <text x="0" y="14" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Be Vietnam Pro" fontWeight="600">BẠN</text>
      </g>

      {/* Bottom motto seal */}
      <g transform="translate(260, 510)">
        <rect x="-70" y="-15" width="140" height="22" rx="11" fill="var(--card)" stroke="var(--gold)" strokeWidth="0.8" />
        <text x="0" y="0" textAnchor="middle" fontSize="9" fill="var(--ink-mute)" fontFamily="Be Vietnam Pro" letterSpacing="1.5">MOTTO</text>
        <text x="0" y="-2" textAnchor="middle" fontSize="0" fill="none"></text>
      </g>
      <text x="260" y="514" textAnchor="middle" fontSize="11" fill="var(--brown)" fontFamily="Cormorant Garamond" fontStyle="italic" fontWeight="600">Trung · Hiếu · Nhân · Nghĩa</text>
    </svg>
  );
}

function StatPill({ value, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="font-serif" style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div className="card card-pad card-hover" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, display: "grid", placeItems: "center",
        background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
        color: `var(--${accent})`, marginBottom: 14,
        border: `1px solid color-mix(in srgb, var(--${accent}) 22%, transparent)`,
      }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

function TimelineMarker({ year, event, side, era }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      flexDirection: side === "right" ? "row-reverse" : "row",
      textAlign: side === "right" ? "right" : "left",
    }}>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{era}</div>
        <div className="font-serif" style={{ fontSize: 20, color: "var(--ink)", fontWeight: 600, margin: "2px 0 4px" }}>{year}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, maxWidth: 240, marginLeft: side === "right" ? "auto" : 0 }}>{event}</div>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 4px var(--bg), 0 0 0 5px var(--gold-soft)" }} />
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}

function LandingPage({ onNav }) {
  return (
    <div className="fade-in" style={{ maxWidth: 1280, margin: "0 auto" }}>

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
        {/* Top ornament */}
        <div style={{ position: "absolute", top: -8, left: -16, color: "var(--gold)", opacity: 0.6 }}>
          <VietOrnament size={48} />
        </div>

        {/* Left: copy */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 999, background: "var(--gold-glow)", border: "1px solid var(--gold-pale)", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
            <span style={{ fontSize: 12, color: "var(--brown)", fontWeight: 600, letterSpacing: 0.5 }}>Phiên bản 2026 · Beta công khai</span>
          </div>

          <h1 className="font-serif" style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.05, color: "var(--ink)", letterSpacing: "-0.5px", marginBottom: 20 }}>
            Lưu giữ <em style={{ color: "var(--gold)", fontStyle: "italic" }}>cội nguồn</em>,<br />
            kết nối <em style={{ color: "var(--brown)", fontStyle: "italic" }}>muôn đời.</em>
          </h1>

          <p style={{ fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.55, maxWidth: 500, marginBottom: 36 }}>
            Gia Phả là nền tảng số hoá gia phả truyền thống Việt Nam — giúp dòng họ của bạn ghi chép, tra cứu và truyền lại lịch sử qua nhiều thế hệ, với sự hỗ trợ của trí tuệ nhân tạo.
          </p>

          <div className="row gap-3" style={{ marginBottom: 48 }}>
            <button className="btn btn-primary btn-lg" onClick={() => onNav("tree")}>
              <Icon name="tree" size={18} />
              Khám phá cây gia phả
              <Icon name="arrow-right" size={16} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNav("clan")}>
              <Icon name="plus" size={18} />
              Lập dòng họ mới
            </button>
          </div>

          {/* Stat strip */}
          <div style={{
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

        {/* Right: tree illustration */}
        <div style={{
          position: "relative",
          aspectRatio: "520 / 560",
          maxWidth: 560,
          marginLeft: "auto",
        }}>
          <div className="bg-pattern" style={{
            position: "absolute", inset: -20, borderRadius: 24,
            opacity: 0.6,
          }} />
          <div style={{ position: "relative", height: "100%", filter: "drop-shadow(0 12px 32px rgba(184,144,44,0.12))" }}>
            <HeroTreeIllustration />
          </div>
        </div>
      </section>

      {/* ====== Section divider ornament ====== */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "72px 0 48px", color: "var(--gold)" }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--gold-soft))" }} />
        <Icon name="lotus" size={20} />
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--ink-mute)", fontWeight: 600 }}>Tính năng</div>
        <Icon name="lotus" size={20} />
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, var(--gold-soft))" }} />
      </div>

      {/* ====== Features ====== */}
      <section style={{ textAlign: "center", marginBottom: 48 }}>
        <h2 className="font-serif" style={{ fontSize: 42, fontWeight: 600, color: "var(--ink)", marginBottom: 14, letterSpacing: "-0.3px" }}>
          Truyền thống gặp công nghệ
        </h2>
        <p style={{ fontSize: 16, color: "var(--ink-soft)", maxWidth: 620, margin: "0 auto", lineHeight: 1.55 }}>
          Mọi tính năng được thiết kế tỉ mỉ cho văn hoá thờ cúng, tôn ti và xưng hô của người Việt.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 96 }}>
        <FeatureCard icon="tree" accent="gold" title="Cây gia phả tương tác"
          desc="Hiển thị nhiều đời theo bố cục dọc truyền thống. Phóng to, di chuyển và mở rộng từng nhánh con cháu một cách mượt mà." />
        <FeatureCard icon="link" accent="jade" title="Phân tích quan hệ"
          desc="Chọn hai thành viên bất kỳ — hệ thống tự tính và đặt tên đúng theo xưng hô Việt: chú, bác, cô, dì, cháu, chắt, chút, chít..." />
        <FeatureCard icon="ai" accent="terracotta" title="AI cho gia phả cũ"
          desc="OCR sách gia phả chữ Hán-Nôm, gợi ý ghép thành viên trùng tên, và trợ lý hỏi đáp về phong tục dòng họ." />
        <FeatureCard icon="calendar" accent="crimson" title="Lễ giỗ & sự kiện"
          desc="Theo dõi giỗ chạp âm lịch tự động, nhắc nhở trước, ghi nhận con cháu tham dự và lưu trữ ảnh các kỳ giỗ." />
        <FeatureCard icon="scroll" accent="brown" title="Tài liệu gốc"
          desc="Lưu trữ scan sách gia phả cổ, hoành phi, câu đối, sắc phong — đính kèm vào từng nhân vật trong cây." />
        <FeatureCard icon="users" accent="gold" title="Phân quyền dòng họ"
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
            {/* Vertical line */}
            <div style={{
              position: "absolute", left: "50%", top: 8, bottom: 8, width: 1,
              background: "linear-gradient(to bottom, transparent, var(--gold-soft), var(--gold-soft), transparent)",
              transform: "translateX(-50%)",
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <TimelineMarker year="1850" era="Tự Đức · Đời 1" side="left" event="Cụ Tổ Nguyễn Văn Trường lập làng tại Tiên Điền, Hà Tĩnh — đỗ Hương Cống triều Tự Đức." />
              <TimelineMarker year="1910" era="Khai sinh · Đời 3" side="right" event="Ông Nguyễn Văn Minh đỗ Cử nhân Hán học, là người đầu tiên trong họ ghi chép gia phả bằng chữ Quốc Ngữ." />
              <TimelineMarker year="1970" era="Đổi mới · Đời 5" side="left" event="Bác sĩ Nguyễn Văn Hải gia nhập Bệnh viện Bạch Mai — thế hệ đầu tiên ra Hà Nội học tập và lập nghiệp." />
              <TimelineMarker year="2026" era="Số hoá · Đời 6" side="right" event="Gia phả họ Nguyễn được số hoá hoàn toàn — toàn bộ 247 thành viên hiện diện trên một nền tảng." />
            </div>
          </div>
        </div>
      </section>

      {/* ====== Final CTA ====== */}
      <section style={{
        textAlign: "center",
        padding: "64px 32px 96px",
        position: "relative",
      }}>
        <div style={{ color: "var(--gold)", marginBottom: 24 }}>
          <Icon name="lotus" size={32} />
        </div>
        <h2 className="font-serif" style={{ fontSize: 38, fontWeight: 600, color: "var(--ink)", maxWidth: 640, margin: "0 auto 16px", lineHeight: 1.2 }}>
          "Cây có gốc mới nở cành xanh ngọn,<br />nước có nguồn mới bể rộng sông sâu."
        </h2>
        <p style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 32 }}>— Ca dao Việt Nam</p>
        <div className="row gap-3" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary btn-lg" onClick={() => onNav("dashboard")}>
            Bắt đầu hành trình
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { LandingPage });
