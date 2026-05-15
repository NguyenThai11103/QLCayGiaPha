/* global window, React, Icon, VietOrnament */
// ============================================================
// Shell: Sidebar, Topbar
// ============================================================
const { useState } = React;

const NAV_ITEMS = [
  { id: "landing", label: "Trang chủ", icon: "home", section: "main" },
  { id: "dashboard", label: "Bảng điều khiển", icon: "dashboard", section: "main" },
  { id: "tree", label: "Cây gia phả", icon: "tree", section: "main", badge: "247" },
  { id: "members", label: "Thành viên", icon: "users", section: "main" },
  { id: "lookup", label: "Tra cứu quan hệ", icon: "link", section: "intel" },
  { id: "ai", label: "AI Trợ lý", icon: "ai", section: "intel", badge: "Mới" },
  { id: "clan", label: "Quản lý dòng họ", icon: "branch", section: "manage" },
  { id: "events", label: "Sự kiện & Lễ giỗ", icon: "calendar", section: "manage" },
  { id: "documents", label: "Tài liệu cổ", icon: "scroll", section: "manage" },
  { id: "settings", label: "Cài đặt", icon: "settings", section: "foot" },
];

function Sidebar({ active, onChange }) {
  const main = NAV_ITEMS.filter(n => n.section === "main");
  const intel = NAV_ITEMS.filter(n => n.section === "intel");
  const manage = NAV_ITEMS.filter(n => n.section === "manage");
  const foot = NAV_ITEMS.filter(n => n.section === "foot");

  const renderItem = (n) => (
    <button key={n.id} className={`nav-item ${active === n.id ? "active" : ""}`} onClick={() => onChange(n.id)}>
      <Icon name={n.icon} size={17} />
      <span>{n.label}</span>
      {n.badge && <span className="badge">{n.badge}</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">
          {/* Stylized 家 (gia) glyph */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8 L12 3 L20 8" />
            <path d="M6 8 V20 H18 V8" />
            <path d="M9 13 H15" />
            <path d="M12 8 V20" />
          </svg>
        </div>
        <div className="logo-text">
          <div className="name">Gia Phả</div>
          <div className="sub">Họ Nguyễn · Tiên Điền</div>
        </div>
      </div>

      <nav className="nav">
        {main.map(renderItem)}
        <div className="nav-section">Trí thông minh</div>
        {intel.map(renderItem)}
        <div className="nav-section">Quản lý</div>
        {manage.map(renderItem)}
      </nav>

      <div style={{ paddingBottom: 8 }}>
        {foot.map(renderItem)}
      </div>

      <div className="nav-foot">
        <div className="avatar">MA</div>
        <div className="who">
          <div className="n">Nguyễn Minh Anh</div>
          <div className="r">Đời thứ 6 · Hậu duệ</div>
        </div>
        <button className="icon-btn" title="Menu" style={{ width: 28, height: 28 }}>
          <Icon name="chevron-down" size={14} />
        </button>
      </div>
    </aside>
  );
}

const PAGE_LABELS = {
  landing: ["Trang chủ"],
  dashboard: ["Bảng điều khiển"],
  tree: ["Cây gia phả", "Tổng quát"],
  members: ["Thành viên"],
  lookup: ["Tra cứu quan hệ"],
  ai: ["AI Trợ lý"],
  clan: ["Quản lý dòng họ"],
  events: ["Sự kiện & Lễ giỗ"],
  documents: ["Tài liệu cổ"],
  settings: ["Cài đặt"],
};

function Topbar({ page, onNav }) {
  const labels = PAGE_LABELS[page] || [page];
  return (
    <header className="topbar">
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <div className="crumbs">
          <span>Gia Phả</span>
          {labels.map((l, i) => (
            <React.Fragment key={i}>
              <span className="sep">/</span>
              <span className={i === labels.length - 1 ? "now" : ""}>{l}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="row gap-3" style={{ alignItems: "center" }}>
        <div className="search">
          <Icon name="search" size={15} />
          <input placeholder="Tìm thành viên, sự kiện, tài liệu..." />
          <kbd>⌘K</kbd>
        </div>
        <button className="icon-btn" title="Thêm">
          <Icon name="plus" size={18} />
        </button>
        <button className="icon-btn" title="Thông báo">
          <Icon name="bell" size={18} />
          <span className="dot" />
        </button>
        <button className="icon-btn" title="Ngôn ngữ">
          <Icon name="globe" size={18} />
        </button>
        <div className="vdiv" style={{ height: 28, margin: "0 4px" }} />
        <div className="row gap-2" style={{ alignItems: "center", paddingRight: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--gold-soft), var(--terracotta))",
            display: "grid", placeItems: "center", color: "white", fontWeight: 600, fontSize: 12,
          }}>MA</div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, Topbar });
