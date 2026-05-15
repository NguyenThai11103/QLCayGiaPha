/* global window, React, ReactDOM, Sidebar, Topbar, LandingPage, DashboardPage, FamilyTreePage, TweaksPanel, useTweaks, TweakSection, TweakRadio, Icon */
// ============================================================
// App shell — router + theme + tweaks
// ============================================================
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "showOrnaments": true
}/*EDITMODE-END*/;

function App() {
  const [page, setPage] = useState("landing");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme to documentElement
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme || "warm");
  }, [t.theme]);

  function nav(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let Content;
  switch (page) {
    case "landing": Content = <LandingPage onNav={nav} />; break;
    case "dashboard": Content = <DashboardPage onNav={nav} />; break;
    case "tree": Content = <FamilyTreePage onNav={nav} />; break;
    default:
      Content = <PlaceholderPage page={page} onNav={nav} />;
  }

  return (
    <>
      <div className="app">
        <Sidebar active={page} onChange={nav} />
        <div className="main">
          <Topbar page={page} onNav={nav} />
          <div className="content" data-screen-label={page}>
            {Content}
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks" defaultOpen={false}>
        <TweakSection title="Giao diện">
          <TweakRadio
            label="Chủ đề"
            value={t.theme}
            onChange={(v) => setTweak("theme", v)}
            options={[
              { value: "warm", label: "Ấm" },
              { value: "paper", label: "Giấy" },
              { value: "dark", label: "Đêm" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Điều hướng nhanh">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { id: "landing", label: "Trang chủ" },
              { id: "dashboard", label: "Dashboard" },
              { id: "tree", label: "Cây gia phả" },
              { id: "members", label: "Thành viên" },
            ].map(b => (
              <button key={b.id} onClick={() => nav(b.id)} style={{
                padding: "8px 10px", borderRadius: 8,
                background: page === b.id ? "var(--gold)" : "var(--card-soft)",
                color: page === b.id ? "white" : "var(--ink)",
                border: "1px solid var(--card-border)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}>{b.label}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// ============================================================
// Placeholder for non-built screens (members, lookup, ai, etc.)
// ============================================================
function PlaceholderPage({ page, onNav }) {
  const LABELS = {
    members: { icon: "users", title: "Danh sách thành viên", sub: "247 thành viên · sắp xếp theo đời, chi, ngày sinh" },
    lookup: { icon: "link", title: "Tra cứu quan hệ", sub: "Chọn hai người để xác định xưng hô" },
    ai: { icon: "ai", title: "AI Trợ lý gia phả", sub: "OCR, gợi ý ghép, hỏi đáp về phong tục" },
    clan: { icon: "branch", title: "Quản lý dòng họ", sub: "Chi, phái, hội đồng dòng họ, phân quyền" },
    events: { icon: "calendar", title: "Sự kiện & Lễ giỗ", sub: "Lịch âm tự động · 47 lễ giỗ trong năm" },
    documents: { icon: "scroll", title: "Tài liệu cổ", sub: "Sách gia phả Hán-Nôm, hoành phi, sắc phong" },
    settings: { icon: "settings", title: "Cài đặt", sub: "Hồ sơ, quyền riêng tư, lịch sử" },
  };
  const l = LABELS[page] || { icon: "tree", title: "Sắp ra mắt", sub: "Trang này đang được hoàn thiện" };

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "120px auto", textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        margin: "0 auto 24px",
        background: "linear-gradient(135deg, var(--gold-glow), var(--card-soft))",
        border: "1px solid var(--gold-pale)",
        display: "grid", placeItems: "center",
        color: "var(--gold)",
      }}>
        <Icon name={l.icon} size={36} />
      </div>
      <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 600, color: "var(--ink)", marginBottom: 10, letterSpacing: "-0.3px" }}>{l.title}</h1>
      <div style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 28 }}>{l.sub}</div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 18px", borderRadius: 999,
        background: "var(--card)", border: "1px dashed var(--gold-soft)",
        fontSize: 13, color: "var(--brown)",
      }}>
        <Icon name="sparkle" size={15} />
        Đang được thiết kế · Sẽ có trong bản 2026 Q3
      </div>
      <div style={{ marginTop: 36 }}>
        <button className="btn btn-primary btn-lg" onClick={() => onNav("dashboard")}>
          ← Quay lại Bảng điều khiển
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
