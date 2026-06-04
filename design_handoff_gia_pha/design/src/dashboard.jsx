/* global window, React, Icon, STATS, ACTIVITIES, EVENTS, CLAN, MEMBERS, avatarGrad, BY_ID */
// ============================================================
// Dashboard — Statistics, activity, events, quick actions
// ============================================================
const { useMemo: useDashMemo } = React;

function StatCard({ stat, idx }) {
  const accent = stat.accent;
  return (
    <div className="card card-pad" style={{ position: "relative", overflow: "hidden" }}>
      {/* Top right ornament */}
      <div style={{
        position: "absolute", top: -10, right: -10, width: 80, height: 80,
        background: `radial-gradient(circle at center, color-mix(in srgb, var(--${accent}) 18%, transparent), transparent 70%)`,
        borderRadius: "50%",
      }} />

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, display: "grid", placeItems: "center",
          background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
          color: `var(--${accent})`,
          border: `1px solid color-mix(in srgb, var(--${accent}) 22%, transparent)`,
        }}>
          <Icon name={stat.icon} size={18} />
        </div>
        <button className="icon-btn" style={{ width: 28, height: 28 }}>
          <Icon name="arrow-up-right" size={14} />
        </button>
      </div>

      <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 4 }}>{stat.label}</div>
      <div className="font-serif" style={{ fontSize: 42, fontWeight: 600, color: "var(--ink)", lineHeight: 1, marginBottom: 8, position: "relative" }}>
        {stat.value}
      </div>
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <span style={{
          fontSize: 11, padding: "2px 7px", borderRadius: 6, fontWeight: 600,
          background: `color-mix(in srgb, var(--${accent}) 10%, transparent)`,
          color: `var(--${accent})`,
        }}>↗ {stat.delta}</span>
      </div>
    </div>
  );
}

function ActivityRow({ a }) {
  const ICON_MAP = { photo: "photo", edit: "edit", link: "link", ai: "ai", add: "add-user" };
  const COLOR_MAP = { photo: "jade", edit: "gold", link: "terracotta", ai: "crimson", add: "gold" };
  const color = COLOR_MAP[a.type] || "gold";
  return (
    <div className="row gap-3" style={{ alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center",
        background: `color-mix(in srgb, var(--${color}) 14%, transparent)`,
        color: `var(--${color})`, flexShrink: 0,
        border: `1px solid color-mix(in srgb, var(--${color}) 20%, transparent)`,
      }}>
        <Icon name={ICON_MAP[a.type] || "edit"} size={15} />
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.45 }}>
          <span style={{ fontWeight: 600 }}>{a.who}</span>{" "}
          <span style={{ color: "var(--ink-soft)" }}>{a.action}</span>{" "}
          <span style={{ fontWeight: 500, color: "var(--brown)" }}>{a.target}</span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 3 }}>{a.time}</div>
      </div>
    </div>
  );
}

function EventCard({ e }) {
  const ICON_MAP = { anniversary: "scroll", wedding: "heart", ceremony: "lotus" };
  const COLOR_MAP = { anniversary: "brown", wedding: "terracotta", ceremony: "jade" };
  const color = COLOR_MAP[e.type] || "gold";
  return (
    <div className="card card-hover" style={{ padding: 16 }}>
      <div className="row gap-3" style={{ alignItems: "flex-start" }}>
        {/* Date column */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "8px 10px", background: `color-mix(in srgb, var(--${color}) 12%, transparent)`,
          borderRadius: 10, minWidth: 64,
          border: `1px solid color-mix(in srgb, var(--${color}) 22%, transparent)`,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: `var(--${color})`, textTransform: "uppercase" }}>
            {e.date.split(" ").slice(1).join(" ")}
          </div>
          <div className="font-serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", lineHeight: 1, margin: "2px 0" }}>
            {e.date.split(" ")[0]}
          </div>
          <div style={{ fontSize: 9, color: "var(--ink-mute)" }}>{e.year}</div>
        </div>

        <div className="grow" style={{ minWidth: 0 }}>
          <div className="row gap-2" style={{ marginBottom: 4 }}>
            <span className="chip" style={{
              background: `color-mix(in srgb, var(--${color}) 12%, transparent)`,
              color: `var(--${color})`,
              borderColor: `color-mix(in srgb, var(--${color}) 22%, transparent)`,
            }}>
              <Icon name={ICON_MAP[e.type]} size={11} />
              {e.type === "anniversary" ? "Lễ giỗ" : e.type === "wedding" ? "Lễ cưới" : "Lễ truyền thống"}
            </span>
            {e.days <= 14 && <span className="chip chip-crimson"><span className="chip-dot" />Còn {e.days} ngày</span>}
          </div>
          <div className="font-serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.25, marginBottom: 6 }}>
            {e.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.4 }}>
            {e.location} · {e.attendees} người dự
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="card card-hover" style={{
      padding: 14, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
      background: "var(--card)", border: "1px solid var(--card-border)",
      cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "inherit",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, display: "grid", placeItems: "center",
        background: `color-mix(in srgb, var(--${color}) 14%, transparent)`, color: `var(--${color})`,
        border: `1px solid color-mix(in srgb, var(--${color}) 20%, transparent)`,
      }}>
        <Icon name={icon} size={17} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
    </button>
  );
}

// Generation distribution chart — vertical bars
function GenerationChart() {
  const data = [
    { gen: "Đời 1", count: 2, alive: 0 },
    { gen: "Đời 2", count: 5, alive: 0 },
    { gen: "Đời 3", count: 12, alive: 0 },
    { gen: "Đời 4", count: 28, alive: 8 },
    { gen: "Đời 5", count: 64, alive: 62 },
    { gen: "Đời 6", count: 89, alive: 89 },
    { gen: "Đời 7", count: 35, alive: 35 },
    { gen: "Đời 8", count: 11, alive: 11 },
    { gen: "Đời 9", count: 1, alive: 1 },
  ];
  const max = Math.max(...data.map(d => d.count));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 10, alignItems: "end", height: 180, padding: "16px 0" }}>
      {data.map((d, i) => {
        const h = (d.count / max) * 100;
        const aliveH = (d.alive / d.count) * 100;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div className="font-serif" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{d.count}</div>
            <div style={{
              width: "100%", maxWidth: 36, height: `${h}%`, minHeight: 4,
              background: "var(--gold-pale)",
              borderRadius: "6px 6px 2px 2px",
              position: "relative", overflow: "hidden",
              border: "1px solid var(--gold-soft)",
            }}>
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: `${aliveH}%`,
                background: "linear-gradient(to top, var(--gold), var(--gold-soft))",
              }} />
            </div>
            <div style={{ fontSize: 10.5, color: "var(--ink-mute)", letterSpacing: 0.3 }}>{d.gen}</div>
          </div>
        );
      })}
    </div>
  );
}

function DashboardPage({ onNav }) {
  return (
    <div className="fade-in" style={{ maxWidth: 1320, margin: "0 auto" }}>

      {/* ===== Page header ===== */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>Bảng điều khiển</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Thứ Sáu, 15 tháng 5, 2026 — Mùng 10 tháng 4 ÂL</span>
          </div>
          <h1 className="page-title">Chào buổi sáng, Minh Anh 🌸</h1>
          <div className="page-sub">Họ {CLAN.name} · {CLAN.branch} · Đã có 12 cập nhật mới từ dòng họ trong tuần qua.</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost">
            <Icon name="calendar" size={15} />
            Tuần này
            <Icon name="chevron-down" size={14} />
          </button>
          <button className="btn btn-primary" onClick={() => onNav("tree")}>
            <Icon name="plus" size={15} />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* ===== Stats row ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {STATS.map((s, i) => <StatCard key={i} stat={s} idx={i} />)}
      </div>

      {/* ===== Main 2-col grid ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Generation distribution */}
          <div className="card card-pad">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div className="section-title">Phân bố thế hệ</div>
                <div className="section-meta">247 thành viên trên 9 đời · từ Cụ Tổ (1850) đến hậu duệ đời 9 (sinh 2024)</div>
              </div>
              <div className="row gap-3" style={{ alignItems: "center" }}>
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--gold)" }} />
                  <span className="text-xs muted">Còn sống</span>
                </div>
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--gold-pale)", border: "1px solid var(--gold-soft)" }} />
                  <span className="text-xs muted">Đã khuất</span>
                </div>
              </div>
            </div>
            <GenerationChart />
          </div>

          {/* Activity timeline */}
          <div className="card card-pad">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div className="section-title">Hoạt động gần đây</div>
                <div className="section-meta">Lịch sử cập nhật của toàn dòng họ</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                Xem tất cả
                <Icon name="chevron-right" size={13} />
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {ACTIVITIES.map((a, i) => <ActivityRow key={i} a={a} />)}
            </div>
          </div>

        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Quick actions */}
          <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--card) 0%, var(--gold-glow) 200%)" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
              <div className="section-title">Thao tác nhanh</div>
              <Icon name="sparkle" size={16} color="var(--gold)" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <QuickAction icon="add-user" label="Thêm thành viên" color="gold" onClick={() => onNav("members")} />
              <QuickAction icon="link" label="Tra cứu quan hệ" color="jade" onClick={() => onNav("lookup")} />
              <QuickAction icon="calendar" label="Tạo lễ giỗ" color="crimson" onClick={() => onNav("events")} />
              <QuickAction icon="scroll" label="Tải gia phả cũ" color="terracotta" onClick={() => onNav("documents")} />
            </div>
          </div>

          {/* Upcoming events */}
          <div className="card card-pad">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div className="section-title">Sắp diễn ra</div>
                <div className="section-meta">4 sự kiện trong 3 tháng tới</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                Lịch
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EVENTS.slice(0, 3).map((e, i) => <EventCard key={i} e={e} />)}
            </div>
          </div>

          {/* AI Suggestion card */}
          <div className="card card-pad" style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--gold) 8%, var(--card)) 0%, var(--card) 100%)",
            borderColor: "var(--gold-soft)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, color: "var(--gold)", opacity: 0.12 }}>
              <Icon name="sparkle" size={140} />
            </div>
            <div style={{ position: "relative" }}>
              <div className="row gap-2" style={{ marginBottom: 12 }}>
                <span className="chip chip-gold">
                  <Icon name="ai" size={11} />
                  AI Trợ lý
                </span>
              </div>
              <div className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", lineHeight: 1.35, marginBottom: 8 }}>
                Phát hiện 2 thành viên có thể là một người
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 14 }}>
                "Nguyễn Văn Tài" (đời 3) và "Tài Nguyễn" trong tài liệu Phái Hai có thể là cùng một người. AI tìm thấy 87% trùng khớp về năm sinh, quê quán và tên cha.
              </div>
              <div className="row gap-2">
                <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
                  Xem chi tiết
                </button>
                <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

Object.assign(window, { DashboardPage });
