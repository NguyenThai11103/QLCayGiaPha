/* global window, React, Icon, BY_ID, avatarGrad */
// ============================================================
// Sự kiện & Lễ giỗ — Family Events & Death Anniversaries
// Runtime JSX. See events.tsx for the typed production version.
// ============================================================
const { useState: useEvState, useMemo: useEvMemo } = React;

const EVENT_META = {
  anniversary: { label: "Lễ giỗ", icon: "scroll", color: "brown" },
  wedding: { label: "Lễ cưới", icon: "heart", color: "terracotta" },
  ceremony: { label: "Lễ truyền thống", icon: "lotus", color: "jade" },
  longevity: { label: "Mừng thọ", icon: "sparkle", color: "gold" },
  birthday: { label: "Đầy tháng / Sinh nhật", icon: "users", color: "crimson" },
};

const EVENTS_2026 = [
  { id: "e1", date: "2026-03-27", lunarDate: "15 tháng 3 ÂL", title: "Giỗ Tổ — Cụ Nguyễn Văn Trường (176 năm)", type: "anniversary", honoreeId: "m1", location: "Từ đường Tiên Điền, Hà Tĩnh", attendees: 47, rsvpStatus: "going", pinned: true, description: "Lễ giỗ Tổ năm thứ 176 — toàn họ tụ hội. Trưởng họ Ông Nguyễn Văn Quang chủ tế. Cỗ chay 12 mâm, cỗ mặn 8 mâm." },
  { id: "e2", date: "2026-04-20", title: "Lễ cưới — Nguyễn Đức Long & Phạm Thúy Quỳnh", type: "wedding", honoreeId: "m24", location: "Trung tâm Tiệc cưới Bến Thành, Hà Nội", attendees: 120, rsvpStatus: "going", description: "Đại diện họ Nguyễn: Ông Bác Nguyễn Văn Hải. Lễ rước dâu lúc 9:30." },
  { id: "e3", date: "2026-05-15", lunarDate: "29 tháng 3 ÂL", title: "Mừng thọ Ông Nguyễn Văn Quang — 81 tuổi", type: "longevity", honoreeId: "m15", location: "Nhà thờ tổ, Tiên Điền", attendees: 38, rsvpStatus: "going", description: "Mừng thọ bát tuần. Mời cụ ngồi ghế thất phẩm, con cháu mừng tuổi đỏ." },
  { id: "e4", date: "2026-05-25", lunarDate: "10 tháng 4 ÂL", title: "Giỗ Cụ Bà Trần Thị Lan", type: "anniversary", honoreeId: "m2", location: "Từ đường Tiên Điền", attendees: 35, rsvpStatus: "going" },
  { id: "e5", date: "2026-06-19", lunarDate: "5 tháng 5 ÂL", title: "Lễ Đoan Ngọ — Diệt sâu bọ", type: "ceremony", location: "Từ đường Tiên Điền", attendees: 22, rsvpStatus: "maybe" },
  { id: "e6", date: "2026-08-26", lunarDate: "14 tháng 7 ÂL", title: "Lễ Vu Lan — Báo hiếu cha mẹ", type: "ceremony", location: "Chùa Hương Tích", attendees: 80, rsvpStatus: "going", pinned: true },
  { id: "e7", date: "2026-09-25", lunarDate: "15 tháng 8 ÂL", title: "Tết Trung Thu — Họp mặt trẻ em họ Nguyễn", type: "ceremony", location: "Sân nhà thờ tổ", attendees: 65, rsvpStatus: "going" },
  { id: "e8", date: "2026-10-12", title: "Đầy tháng cháu Nguyễn Bảo Nhi", type: "birthday", hostId: "m23", location: "Hà Nội", attendees: 25, rsvpStatus: "going", description: "Con đầu lòng của vợ chồng Minh Anh và Bảo Khang." },
  { id: "e9", date: "2026-11-24", lunarDate: "15 tháng 10 ÂL", title: "Giỗ Ông Nguyễn Văn Tùng (8 năm)", type: "anniversary", honoreeId: "m13", location: "Từ đường Tiên Điền", attendees: 28, rsvpStatus: "going" },
  { id: "e10", date: "2026-12-25", title: "Họp mặt cuối năm — Toàn Phái Cả", type: "ceremony", location: "Tiên Điền + livestream", attendees: 95, rsvpStatus: "pending" },
];

const VI_MONTHS = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const VI_WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const TODAY = "2026-05-15";

function parseISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}
function daysBetween(a, b) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function daysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
function firstWeekdayOf(year, month) { return new Date(year, month - 1, 1).getDay(); }
function fakeLunarFor(year, month, day) {
  const lunarMonth = ((month + 10) % 12) + 1;
  const lunarDay = ((day + 17) % 30) + 1;
  return `${lunarDay}/${lunarMonth} ÂL`;
}

// ============================================================
function Countdown({ targetISO }) {
  const days = daysBetween(TODAY, targetISO);
  const isPast = days < 0;
  return (
    <div style={{
      display: "inline-flex", alignItems: "baseline", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      background: isPast ? "var(--card-soft)" : "var(--gold-glow)",
      border: `1px solid ${isPast ? "var(--line)" : "var(--gold-pale)"}`,
      color: isPast ? "var(--ink-mute)" : "var(--brown)",
    }}>
      <span className="font-serif" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{Math.abs(days)}</span>
      <span style={{ fontSize: 11, letterSpacing: 0.5 }}>{isPast ? "ngày trước" : days === 0 ? "hôm nay" : "ngày nữa"}</span>
    </div>
  );
}

function NextEventHero({ event, honoree }) {
  const meta = EVENT_META[event.type];
  const { d, m } = parseISO(event.date);
  return (
    <div className="card" style={{
      padding: 28, marginBottom: 24,
      position: "relative", overflow: "hidden",
      background: "linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--gold) 6%, var(--card)) 100%)",
      borderColor: "var(--gold-soft)",
    }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, var(--gold-glow), transparent 70%)", opacity: 0.7 }} />
      <div style={{ position: "absolute", top: 24, right: 28, opacity: 0.12, color: "var(--gold)" }}>
        <Icon name={meta.icon} size={96} />
      </div>
      <div style={{ position: "relative", display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{
          flexShrink: 0, padding: "14px 18px",
          background: "var(--card)", border: "1.5px solid var(--gold-soft)",
          borderRadius: 16, textAlign: "center", minWidth: 110,
          boxShadow: "var(--shadow-md)",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--brown)", fontWeight: 700, textTransform: "uppercase" }}>{VI_MONTHS[m - 1]}</div>
          <div className="font-serif" style={{ fontSize: 56, fontWeight: 600, color: "var(--gold)", lineHeight: 1, margin: "4px 0" }}>{d}</div>
          {event.lunarDate && (
            <div style={{ fontSize: 11, color: "var(--ink-mute)", borderTop: "1px solid var(--line)", paddingTop: 4 }}>
              {event.lunarDate}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>
              Sự kiện tiếp theo
            </span>
            <Countdown targetISO={event.date} />
            {event.pinned && (
              <span className="chip chip-gold">
                <Icon name="pin" size={10} />
                Quan trọng
              </span>
            )}
          </div>
          <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 600, color: "var(--ink)", lineHeight: 1.15, marginBottom: 10, letterSpacing: "-0.3px" }}>
            {event.title}
          </h2>
          {event.description && (
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5, marginBottom: 14, maxWidth: 640 }}>
              {event.description}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="home" size={14} color="var(--ink-mute)" />
              {event.location}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="users" size={14} color="var(--ink-mute)" />
              {event.attendees} người dự
            </span>
            {honoree && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="heart" size={14} color="var(--ink-mute)" />
                Người được tưởng nhớ: {honoree.name}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary"><Icon name="plus" size={14} />Xác nhận tham dự</button>
            <button className="btn btn-ghost"><Icon name="calendar" size={14} />Thêm vào lịch</button>
            <button className="btn btn-ghost"><Icon name="link" size={14} />Chia sẻ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ year, month, events, selected, onSelect, onMonthChange }) {
  const totalDays = daysInMonth(year, month);
  const startWeekday = firstWeekdayOf(year, month);
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDate = useEvMemo(() => {
    const map = {};
    for (const e of events) (map[e.date] = map[e.date] || []).push(e);
    return map;
  }, [events]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>
            Lịch tháng
          </div>
          <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)" }}>
            {VI_MONTHS[month - 1]} {year}
          </h2>
        </div>
        <div className="row gap-2">
          <button className="icon-btn" onClick={() => onMonthChange(-1)} title="Tháng trước">
            <Icon name="chevron-down" size={16} style={{ transform: "rotate(90deg)" }} />
          </button>
          <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>Hôm nay</button>
          <button className="icon-btn" onClick={() => onMonthChange(1)} title="Tháng sau">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {VI_WEEKDAYS.map((w, i) => (
          <div key={i} style={{
            textAlign: "center", fontSize: 10.5, letterSpacing: 1.5,
            color: i === 0 ? "var(--crimson)" : "var(--ink-mute)",
            fontWeight: 700, padding: "6px 0",
          }}>{w}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const isToday = cell.iso === TODAY;
          const isSelected = cell.iso === selected;
          const dayEvents = eventsByDate[cell.iso] || [];
          const isSunday = i % 7 === 0;
          return (
            <button
              key={i}
              onClick={() => onSelect(cell.iso)}
              style={{
                aspectRatio: "1 / 1",
                background: isSelected ? "var(--gold-glow)" : isToday ? "color-mix(in srgb, var(--gold) 6%, transparent)" : "transparent",
                border: isSelected ? "1.5px solid var(--gold)" : isToday ? "1.5px solid var(--gold-soft)" : "1px solid transparent",
                borderRadius: 10, padding: 6,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "space-between",
                position: "relative", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!isSelected && !isToday) e.currentTarget.style.background = "var(--card-soft)"; }}
              onMouseLeave={(e) => { if (!isSelected && !isToday) e.currentTarget.style.background = "transparent"; }}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="font-serif" style={{
                  fontSize: 16, fontWeight: 600,
                  color: isSelected ? "var(--gold)" : isSunday ? "var(--crimson)" : "var(--ink)",
                  lineHeight: 1,
                }}>{cell.day}</span>
                <span style={{ fontSize: 9, color: "var(--ink-faint)", fontWeight: 500 }}>
                  {fakeLunarFor(year, month, cell.day)}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {dayEvents.slice(0, 2).map(e => {
                  const m = EVENT_META[e.type];
                  return (
                    <div key={e.id} style={{
                      fontSize: 9.5, padding: "1px 5px",
                      background: `color-mix(in srgb, var(--${m.color}) 14%, transparent)`,
                      color: `var(--${m.color})`,
                      borderRadius: 4, fontWeight: 600,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      textAlign: "left",
                    }}>
                      {e.title.split(" — ")[0].split(" ").slice(0, 3).join(" ")}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div style={{ fontSize: 9, color: "var(--ink-mute)", textAlign: "left", paddingLeft: 5 }}>
                    +{dayEvents.length - 2} nữa
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingItem({ event, honoree, isLast }) {
  const meta = EVENT_META[event.type];
  const { d, m } = parseISO(event.date);
  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, position: "relative" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`,
          border: `1px solid color-mix(in srgb, var(--${meta.color}) 25%, transparent)`,
          color: `var(--${meta.color})`,
          display: "grid", placeItems: "center", zIndex: 1,
        }}>
          <Icon name={meta.icon} size={16} />
        </div>
        {!isLast && (
          <div style={{ position: "absolute", top: 36, bottom: -20, left: "50%", width: 1, background: "var(--line)", transform: "translateX(-50%)" }} />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: 20, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span className="font-serif" style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{d}</span>
          <span style={{ fontSize: 11, color: "var(--ink-mute)", letterSpacing: 0.5 }}>{VI_MONTHS[m - 1]}</span>
          {event.lunarDate && <span style={{ fontSize: 10.5, color: "var(--gold)" }}>· {event.lunarDate}</span>}
          <span style={{ marginLeft: "auto" }}>
            <Countdown targetISO={event.date} />
          </span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, marginBottom: 4 }}>
          {event.title}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11.5, color: "var(--ink-mute)", flexWrap: "wrap" }}>
          <span className="chip" style={{
            background: `color-mix(in srgb, var(--${meta.color}) 10%, transparent)`,
            color: `var(--${meta.color})`,
            borderColor: `color-mix(in srgb, var(--${meta.color}) 20%, transparent)`,
            fontSize: 10,
          }}>{meta.label}</span>
          <span>· {event.location}</span>
          <span>· {event.attendees} người</span>
        </div>
      </div>
    </div>
  );
}

function FilterBar({ active, onChange, counts }) {
  const types = ["all", "anniversary", "wedding", "ceremony", "longevity", "birthday"];
  const labels = {
    all: "Tất cả", anniversary: "Lễ giỗ", wedding: "Lễ cưới",
    ceremony: "Lễ truyền thống", longevity: "Mừng thọ", birthday: "Sinh nhật",
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {types.map(t => {
        const isActive = active === t;
        const meta = t === "all" ? null : EVENT_META[t];
        return (
          <button key={t} onClick={() => onChange(t)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 999,
            background: isActive ? (meta ? `color-mix(in srgb, var(--${meta.color}) 14%, transparent)` : "var(--gold-glow)") : "var(--card)",
            color: isActive ? (meta ? `var(--${meta.color})` : "var(--brown)") : "var(--ink-soft)",
            border: `1px solid ${isActive ? (meta ? `color-mix(in srgb, var(--${meta.color}) 30%, transparent)` : "var(--gold-soft)") : "var(--line)"}`,
            fontSize: 12.5, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>
            {meta && <Icon name={meta.icon} size={12} />}
            {labels[t]}
            <span style={{
              fontSize: 10.5, padding: "1px 6px", borderRadius: 999,
              background: isActive ? "rgba(255,255,255,0.4)" : "var(--card-soft)",
              fontWeight: 700,
            }}>{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

function YearHeatmap({ events, currentMonth, onMonthClick }) {
  const counts = Array(12).fill(0);
  for (const e of events) counts[parseISO(e.date).m - 1]++;
  const max = Math.max(...counts, 1);
  return (
    <div className="card card-pad">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="section-title">Tổng quan năm 2026</div>
          <div className="section-meta">{events.length} sự kiện · phân bố theo tháng</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 8 }}>
        {counts.map((c, i) => {
          const intensity = c / max;
          const isCurrent = i + 1 === currentMonth;
          return (
            <button key={i} onClick={() => onMonthClick(i + 1)} style={{
              display: "flex", flexDirection: "column", alignItems: "stretch", gap: 6,
              padding: 8, borderRadius: 10,
              background: isCurrent ? "var(--gold-glow)" : "transparent",
              border: `1px solid ${isCurrent ? "var(--gold-soft)" : "transparent"}`,
              cursor: "pointer", fontFamily: "inherit",
            }}
              onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "var(--card-soft)"; }}
              onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{
                height: 32, borderRadius: 4,
                background: c === 0 ? "var(--card-soft)" : `color-mix(in srgb, var(--gold) ${Math.round(intensity * 80 + 20)}%, var(--card-soft))`,
                border: c === 0 ? "1px dashed var(--line)" : "1px solid var(--gold-soft)",
                display: "grid", placeItems: "center",
                color: c === 0 ? "var(--ink-faint)" : "var(--brown)",
                fontSize: 14, fontWeight: 700, fontFamily: "Cormorant Garamond, serif",
              }}>{c || "—"}</div>
              <div style={{
                fontSize: 10, color: isCurrent ? "var(--brown)" : "var(--ink-mute)",
                textAlign: "center", fontWeight: isCurrent ? 700 : 500, letterSpacing: 0.5,
              }}>T{i + 1}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventDetail({ event, honoree }) {
  if (!event) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", color: "var(--ink-mute)", padding: 32 }}>
        <Icon name="calendar" size={28} color="var(--ink-faint)" />
        <div style={{ marginTop: 10, fontSize: 13 }}>Chọn một ngày để xem chi tiết</div>
      </div>
    );
  }
  const meta = EVENT_META[event.type];
  const { d, m, y } = parseISO(event.date);
  const seed = honoree ? parseInt(honoree.id.replace("m", ""), 10) : 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row gap-2" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <span className="chip" style={{
          background: `color-mix(in srgb, var(--${meta.color}) 14%, transparent)`,
          color: `var(--${meta.color})`,
          borderColor: `color-mix(in srgb, var(--${meta.color}) 25%, transparent)`,
        }}>
          <Icon name={meta.icon} size={11} />
          {meta.label}
        </span>
        {event.pinned && <span className="chip chip-gold"><Icon name="pin" size={10} />Quan trọng</span>}
      </div>

      <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: 6 }}>
        {event.title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginBottom: 16 }}>
        {d} {VI_MONTHS[m - 1]} {y}
        {event.lunarDate && <> · {event.lunarDate}</>}
      </div>

      {honoree && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: "var(--card-soft)", borderRadius: 10, marginBottom: 14,
          border: "1px solid var(--line)",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: avatarGrad(seed),
            display: "grid", placeItems: "center", color: "white", fontSize: 12, fontWeight: 700,
          }}>{honoree.short}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ink-mute)", fontWeight: 700, textTransform: "uppercase" }}>
              Tưởng nhớ / Vinh danh
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{honoree.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
              Đời {honoree.gen} · {honoree.birth}{honoree.death ? `–${honoree.death}` : ""}
            </div>
          </div>
        </div>
      )}

      {event.description && (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 14 }}>
          {event.description}
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <DetailItem label="Địa điểm" value={event.location} />
        <DetailItem label="Người dự" value={`${event.attendees} người`} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          <Icon name="plus" size={13} />Tham dự
        </button>
        <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
          <Icon name="edit" size={13} />Chỉnh sửa
        </button>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={{ padding: "8px 10px", background: "var(--card-soft)", borderRadius: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: 1, color: "var(--ink-mute)", fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ============================================================
function EventsPage({ onNav }) {
  const [filter, setFilter] = useEvState("all");
  const [viewMonth, setViewMonth] = useEvState({ y: 2026, m: 5 });
  const [selectedDate, setSelectedDate] = useEvState(TODAY);

  const filtered = useEvMemo(
    () => EVENTS_2026.filter(e => filter === "all" || e.type === filter),
    [filter]
  );

  const counts = useEvMemo(() => {
    const c = { all: EVENTS_2026.length };
    Object.keys(EVENT_META).forEach(t => { c[t] = EVENTS_2026.filter(e => e.type === t).length; });
    return c;
  }, []);

  const nextEvent = useEvMemo(() => {
    const upcoming = filtered.filter(e => daysBetween(TODAY, e.date) >= 0)
      .sort((a, b) => daysBetween(TODAY, a.date) - daysBetween(TODAY, b.date));
    return upcoming[0] || null;
  }, [filtered]);

  const upcoming12 = useEvMemo(() => filtered
    .filter(e => daysBetween(TODAY, e.date) >= 0)
    .sort((a, b) => daysBetween(TODAY, a.date) - daysBetween(TODAY, b.date))
    .slice(0, 8), [filtered]);

  const selectedEvent = useEvMemo(() => {
    if (!selectedDate) return null;
    return EVENTS_2026.find(e => e.date === selectedDate) || null;
  }, [selectedDate]);

  const monthEvents = useEvMemo(
    () => filtered.filter(e => {
      const { y, m } = parseISO(e.date);
      return y === viewMonth.y && m === viewMonth.m;
    }),
    [filtered, viewMonth]
  );

  function changeMonth(dir) {
    setViewMonth(prev => {
      let m = prev.m + dir, y = prev.y;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      return { y, m };
    });
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1320, margin: "0 auto" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>Sự kiện & Lễ giỗ</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Lịch âm tự động · {EVENTS_2026.length} sự kiện năm 2026</span>
          </div>
          <h1 className="page-title">Lịch dòng họ</h1>
          <div className="page-sub">Lễ giỗ, lễ cưới, lễ truyền thống và mọi cột mốc quan trọng của họ Nguyễn — được tính toán theo cả dương lịch và âm lịch.</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => onNav("dashboard")}>
            <Icon name="dashboard" size={14} />
            Bảng điều khiển
          </button>
          <button className="btn btn-primary">
            <Icon name="plus" size={14} />
            Tạo sự kiện mới
          </button>
        </div>
      </div>

      {nextEvent && (
        <NextEventHero
          event={nextEvent}
          honoree={nextEvent.honoreeId ? BY_ID[nextEvent.honoreeId] : null}
        />
      )}

      <FilterBar active={filter} onChange={setFilter} counts={counts} />

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <CalendarView
            year={viewMonth.y}
            month={viewMonth.m}
            events={monthEvents}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onMonthChange={changeMonth}
          />
          <YearHeatmap
            events={EVENTS_2026}
            currentMonth={viewMonth.m}
            onMonthClick={(m) => setViewMonth(v => ({ ...v, m }))}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <EventDetail
            event={selectedEvent}
            honoree={selectedEvent && selectedEvent.honoreeId ? BY_ID[selectedEvent.honoreeId] : null}
          />

          <div className="card card-pad">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div className="section-title">Sắp diễn ra</div>
                <div className="section-meta">{upcoming12.length} sự kiện gần nhất</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
                Tất cả →
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {upcoming12.map((e, i) => (
                <UpcomingItem
                  key={e.id}
                  event={e}
                  honoree={e.honoreeId ? BY_ID[e.honoreeId] : null}
                  isLast={i === upcoming12.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EventsPage });
