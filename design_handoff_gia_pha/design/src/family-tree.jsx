/* global window, React, Icon, MEMBERS, BY_ID, getChildren, avatarGrad, CLAN */
// ============================================================
// Family Tree — interactive hierarchical visualization
// ============================================================
const { useState: useTreeState, useRef, useEffect, useMemo } = React;

// Layout constants
const CARD_W = 148;
const CARD_H = 80;
const COUPLE_GAP = 16;
const SIB_GAP = 28;
const GEN_GAP = 90;
const HORIZ_BUS_OFFSET = 36; // distance from couple bottom down to horizontal bus

function getCoupleUnitWidth(primary) {
  return primary.spouse ? CARD_W * 2 + COUPLE_GAP : CARD_W;
}

// ============================================================
// Layout algorithm — recursive subtree layout (Reingold–Tilford-ish)
// Returns { positions: { id -> {x, y} }, width, height }
// ============================================================
function layoutTree(rootId) {
  const positions = {};

  function layoutSubtree(primaryId, x, y) {
    const primary = BY_ID[primaryId];
    if (!primary) return 0;
    const unitW = getCoupleUnitWidth(primary);
    const children = MEMBERS.filter(m => m.parents.includes(primaryId)).map(c => c.id);

    if (children.length === 0) {
      // Leaf — place unit at x..x+unitW
      positions[primary.id] = { x, y };
      if (primary.spouse && BY_ID[primary.spouse]) {
        positions[primary.spouse] = { x: x + CARD_W + COUPLE_GAP, y };
      }
      return unitW;
    }

    // Recursively layout children to find their total width
    let cursor = x;
    const childInfo = [];
    for (const cid of children) {
      const w = layoutSubtree(cid, cursor, y + CARD_H + GEN_GAP);
      childInfo.push({ id: cid, x: cursor, w });
      cursor += w + SIB_GAP;
    }
    const childrenW = cursor - x - SIB_GAP;
    const totalW = Math.max(unitW, childrenW);

    // If parent unit is wider than children's span, spread children to fit
    if (unitW > childrenW && childInfo.length > 0) {
      const extra = unitW - childrenW;
      // Distribute extra evenly
      const perGap = childInfo.length > 1 ? extra / (childInfo.length - 1) : 0;
      let cur = x;
      for (let i = 0; i < childInfo.length; i++) {
        const shift = cur - childInfo[i].x;
        if (shift !== 0) shiftSubtree(childInfo[i].id, shift);
        childInfo[i].x = cur;
        cur += childInfo[i].w + SIB_GAP + perGap;
      }
    }

    // Place parent unit centered over children's span
    const finalChildrenLeft = childInfo[0].x;
    const finalChildrenRight = childInfo[childInfo.length - 1].x + childInfo[childInfo.length - 1].w;
    const centerOfChildren = (finalChildrenLeft + finalChildrenRight) / 2;
    const primaryX = centerOfChildren - unitW / 2;
    positions[primary.id] = { x: primaryX, y };
    if (primary.spouse && BY_ID[primary.spouse]) {
      positions[primary.spouse] = { x: primaryX + CARD_W + COUPLE_GAP, y };
    }

    return totalW;
  }

  function shiftSubtree(rootId, dx) {
    const root = BY_ID[rootId];
    if (positions[rootId]) positions[rootId] = { ...positions[rootId], x: positions[rootId].x + dx };
    if (root.spouse && positions[root.spouse]) positions[root.spouse] = { ...positions[root.spouse], x: positions[root.spouse].x + dx };
    for (const child of MEMBERS.filter(m => m.parents.includes(rootId))) {
      shiftSubtree(child.id, dx);
    }
  }

  layoutSubtree(rootId, 0, 0);

  // Normalize to start at 0,0 with padding
  const all = Object.values(positions);
  const minX = Math.min(...all.map(p => p.x));
  const minY = Math.min(...all.map(p => p.y));
  const maxX = Math.max(...all.map(p => p.x + CARD_W));
  const maxY = Math.max(...all.map(p => p.y + CARD_H));
  const PAD = 48;
  for (const id in positions) {
    positions[id] = { x: positions[id].x - minX + PAD, y: positions[id].y - minY + PAD };
  }
  return {
    positions,
    width: maxX - minX + PAD * 2,
    height: maxY - minY + PAD * 2,
  };
}

// ============================================================
// Build bloodline path: from a target member up to founder
// ============================================================
function bloodlinePath(targetId) {
  const path = new Set();
  let cur = BY_ID[targetId];
  while (cur) {
    path.add(cur.id);
    if (cur.parents.length > 0) {
      // Follow first parent (bloodline = direct Nguyễn line, prefer the one with parents in clan)
      const p1 = BY_ID[cur.parents[0]];
      const p2 = BY_ID[cur.parents[1]];
      if (p1 && p1.parents.length) cur = p1;
      else if (p2 && p2.parents.length) cur = p2;
      else { if (p1) path.add(p1.id); if (p2) path.add(p2.id); cur = null; }
    } else { cur = null; }
  }
  return path;
}

// ============================================================
// Member card
// ============================================================
function MemberCard({ m, pos, isMe, isOnBloodline, isSelected, isDim, onClick }) {
  const alive = m.death === null;
  const seed = parseInt(m.id.replace("m", ""), 10);
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: pos.x, top: pos.y,
        width: CARD_W, height: CARD_H,
        background: "var(--card)",
        border: `1.5px solid ${isSelected ? "var(--gold)" : isOnBloodline ? "var(--gold-soft)" : "var(--card-border)"}`,
        borderRadius: 12,
        boxShadow: isSelected ? "var(--shadow-gold)" : isOnBloodline ? "var(--shadow-md)" : "var(--shadow-sm)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: isDim ? 0.35 : 1,
        padding: "9px 11px",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        overflow: "hidden",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--gold)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = isSelected ? "var(--gold)" : isOnBloodline ? "var(--gold-soft)" : "var(--card-border)"; }}
    >
      {/* gender accent stripe on left */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: m.gender === "M" ? "var(--brown)" : "var(--terracotta)",
        opacity: 0.7,
      }} />

      {isMe && (
        <div style={{
          position: "absolute", top: -8, right: -8,
          background: "var(--gold)", color: "white",
          fontSize: 9, fontWeight: 700, letterSpacing: 1,
          padding: "2px 7px", borderRadius: 999,
          border: "2px solid var(--bg)",
        }}>BẠN</div>
      )}

      <div className="row gap-2" style={{ alignItems: "center" }}>
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: avatarGrad(seed),
          display: "grid", placeItems: "center",
          color: "white", fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          opacity: alive ? 1 : 0.7,
          filter: alive ? "none" : "saturate(0.5)",
        }}>
          {m.short}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {m.title && (
            <div style={{ fontSize: 9, color: "var(--ink-mute)", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 600, lineHeight: 1 }}>
              {m.title}
            </div>
          )}
          <div className="font-serif" style={{
            fontSize: 13.5, fontWeight: 600, color: "var(--ink)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            lineHeight: 1.1, marginTop: m.title ? 1 : 0,
          }}>
            {m.name.split(" ").slice(-2).join(" ")}
          </div>
        </div>
      </div>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ fontSize: 10.5, color: "var(--ink-mute)", fontVariantNumeric: "tabular-nums" }}>
          {m.birth}{m.death ? ` — ${m.death}` : ""}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 9, color: alive ? "var(--alive)" : "var(--ink-mute)",
          fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: alive ? "var(--alive)" : "var(--ink-faint)",
          }} />
          {alive ? "" : "†"}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Connector lines as SVG overlay
// ============================================================
function Connectors({ positions, bloodline, dimSet }) {
  // For each couple unit, draw:
  //  1. horizontal line between spouses (heart marker mid)
  //  2. line down from couple-midpoint to a "bus" line for their children
  //  3. horizontal bus
  //  4. line up from each child's unit-midpoint to the bus
  const lines = [];
  const couples = new Set();

  // Collect parent couples (those who have at least one child)
  const parentSet = new Set();
  for (const m of MEMBERS) for (const p of m.parents) parentSet.add(p);

  // Spouse connection lines
  for (const m of MEMBERS) {
    if (m.spouse && BY_ID[m.spouse] && !couples.has(m.spouse)) {
      const key = [m.id, m.spouse].sort().join("-");
      if (couples.has(key)) continue;
      couples.add(key);
      const p1 = positions[m.id];
      const p2 = positions[m.spouse];
      if (!p1 || !p2) continue;
      const y = p1.y + CARD_H / 2;
      const x1 = Math.min(p1.x, p2.x) + CARD_W;
      const x2 = Math.max(p1.x, p2.x);
      const dim = dimSet && (dimSet.has(m.id) || dimSet.has(m.spouse));
      lines.push({ type: "spouse", x1, y1: y, x2, y2: y, dim });
    }
  }

  // Parent-children buses
  for (const parent of MEMBERS) {
    const children = MEMBERS.filter(c => c.parents.includes(parent.id));
    if (children.length === 0) continue;
    // The bloodline parent's unit midpoint
    const ppos = positions[parent.id];
    if (!ppos) continue;
    let unitMidX = ppos.x + CARD_W / 2;
    if (parent.spouse && positions[parent.spouse]) {
      const spos = positions[parent.spouse];
      unitMidX = (Math.min(ppos.x, spos.x) + Math.max(ppos.x, spos.x) + CARD_W) / 2;
    }
    const parentBottomY = ppos.y + CARD_H;
    const busY = parentBottomY + HORIZ_BUS_OFFSET;

    const isBloodParent = bloodline && bloodline.has(parent.id);

    // Down from parent unit to bus
    lines.push({ type: "down", x1: unitMidX, y1: parentBottomY, x2: unitMidX, y2: busY, bold: isBloodParent });

    // Horizontal bus
    const childXs = children.map(c => positions[c.id].x + CARD_W / 2);
    if (children.length > 1) {
      const left = Math.min(...childXs, unitMidX);
      const right = Math.max(...childXs, unitMidX);
      lines.push({ type: "bus", x1: left, y1: busY, x2: right, y2: busY, bold: isBloodParent });
    }

    // Up to each child
    for (const c of children) {
      const cpos = positions[c.id];
      if (!cpos) continue;
      const midX = cpos.x + CARD_W / 2;
      const isBloodChild = bloodline && bloodline.has(c.id) && isBloodParent;
      lines.push({ type: "child", x1: midX, y1: busY, x2: midX, y2: cpos.y, bold: isBloodChild });
    }
  }

  return (
    <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
      {lines.map((l, i) => {
        const isBold = l.bold;
        const color = isBold ? "var(--gold)" : "var(--card-border-strong)";
        const w = isBold ? 2 : 1.2;
        const opacity = l.dim ? 0.25 : (isBold ? 1 : 0.75);
        if (l.type === "spouse") {
          // dashed for spouse
          return (
            <g key={i} opacity={opacity}>
              <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--terracotta)" strokeWidth={1.2} strokeDasharray="3 3" />
              <circle cx={(l.x1 + l.x2) / 2} cy={l.y1} r="4" fill="var(--card)" stroke="var(--terracotta)" strokeWidth="1.2" />
              <path d={`M ${(l.x1 + l.x2) / 2 - 2} ${l.y1 + 0.5} l 2 -2 l 2 2 l -2 2 z`} fill="var(--terracotta)" />
            </g>
          );
        }
        return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={w} opacity={opacity} strokeLinecap="round" />;
      })}
    </svg>
  );
}

// ============================================================
// Member detail side panel
// ============================================================
function MemberPanel({ m, onClose }) {
  if (!m) return null;
  const alive = m.death === null;
  const seed = parseInt(m.id.replace("m", ""), 10);
  const parents = m.parents.map(p => BY_ID[p]).filter(Boolean);
  const spouse = m.spouse ? BY_ID[m.spouse] : null;
  const children = MEMBERS.filter(c => c.parents.includes(m.id));
  const siblings = parents.length ? MEMBERS.filter(s => s.id !== m.id && s.parents.includes(parents[0].id)) : [];

  return (
    <div style={{
      position: "absolute", top: 16, right: 16, bottom: 16,
      width: 340,
      background: "var(--card)",
      border: "1px solid var(--card-border)",
      borderRadius: 16,
      boxShadow: "var(--shadow-lg)",
      display: "flex", flexDirection: "column",
      animation: "fadeUp 0.25s ease both",
      overflow: "hidden",
      zIndex: 5,
    }}>
      {/* Header banner */}
      <div style={{
        background: `linear-gradient(135deg, ${avatarGrad(seed).replace("linear-gradient(135deg, ", "").replace(")", "")})`,
        height: 80, position: "relative",
      }}>
        <button onClick={onClose} className="icon-btn" style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.15)", color: "white", border: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, paddingTop: 0 }}>
        {/* Avatar */}
        <div style={{
          width: 84, height: 84, borderRadius: "50%",
          background: avatarGrad(seed),
          marginTop: -42, marginBottom: 12,
          border: "4px solid var(--card)",
          display: "grid", placeItems: "center",
          color: "white", fontSize: 24, fontWeight: 700, letterSpacing: 1,
          boxShadow: "var(--shadow-md)",
        }}>{m.short}</div>

        {m.title && <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{m.title}</div>}
        <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", lineHeight: 1.1, marginTop: 2 }}>{m.name}</h2>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 4 }}>
          Đời thứ {m.gen} · {m.gender === "M" ? "Nam" : "Nữ"} · {m.birth}{m.death ? ` — ${m.death}` : " — nay"}
        </div>

        <div className="row gap-2" style={{ marginTop: 10 }}>
          <span className={`chip ${alive ? "chip-jade" : ""}`} style={!alive ? { background: "var(--card-soft)", color: "var(--ink-mute)" } : {}}>
            <span className="chip-dot" />
            {alive ? "Còn sống" : "Đã khuất"}
          </span>
          {m.role && <span className="chip chip-gold">{m.role}</span>}
        </div>

        {m.honor && (
          <div style={{
            marginTop: 14, padding: 12,
            background: "var(--gold-glow)", borderRadius: 10,
            border: "1px solid var(--gold-pale)",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--brown)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Công trạng</div>
            <div className="font-serif" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35 }}>{m.honor}</div>
          </div>
        )}

        {m.note && <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 12 }}>{m.note}</div>}

        {/* Relations */}
        <div style={{ marginTop: 18 }}>
          {parents.length > 0 && (
            <RelSection title="Cha mẹ" items={parents} />
          )}
          {spouse && <RelSection title={m.gender === "M" ? "Vợ" : "Chồng"} items={[spouse]} />}
          {children.length > 0 && (
            <RelSection title="Con" items={children} />
          )}
          {siblings.length > 0 && (
            <RelSection title="Anh chị em" items={siblings} />
          )}
        </div>
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
          <Icon name="edit" size={14} />
          Xem hồ sơ
        </button>
        <button className="icon-btn" style={{ width: 36, height: 36, border: "1px solid var(--line)" }}>
          <Icon name="link" size={15} />
        </button>
      </div>
    </div>
  );
}

function RelSection({ title, items }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ink-mute)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => {
          const seed = parseInt(it.id.replace("m", ""), 10);
          return (
            <div key={it.id} className="row gap-2" style={{
              padding: "6px 8px", borderRadius: 8,
              background: "var(--card-soft)", border: "1px solid var(--line-soft)",
              cursor: "pointer",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: avatarGrad(seed),
                display: "grid", placeItems: "center",
                color: "white", fontSize: 9, fontWeight: 700,
              }}>{it.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-mute)" }}>Đời {it.gen} · {it.birth}{it.death ? `–${it.death}` : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Generation rail (left side) — quick jump to a generation
// ============================================================
function GenerationRail({ currentGen, onJump, positions }) {
  const gens = [1, 2, 3, 4, 5, 6];
  return (
    <div style={{
      position: "absolute", left: 16, top: 16,
      background: "var(--card)", border: "1px solid var(--card-border)",
      borderRadius: 14, padding: 8, boxShadow: "var(--shadow-md)",
      display: "flex", flexDirection: "column", gap: 2,
      zIndex: 5,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "var(--ink-mute)", fontWeight: 700, textTransform: "uppercase", padding: "4px 8px 2px" }}>
        Thế hệ
      </div>
      {gens.map((g) => {
        const count = MEMBERS.filter(m => m.gen === g).length;
        return (
          <button key={g} onClick={() => onJump(g)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 8px", borderRadius: 8,
            background: currentGen === g ? "var(--gold-glow)" : "transparent",
            border: 0, cursor: "pointer", fontFamily: "inherit",
            color: "var(--ink)",
          }}>
            <div className="font-serif" style={{ fontSize: 16, fontWeight: 700, color: currentGen === g ? "var(--gold)" : "var(--ink)", width: 18, textAlign: "center" }}>{g}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-mute)" }}>{count} người</div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Main tree page
// ============================================================
function FamilyTreePage({ onNav }) {
  const layout = useMemo(() => layoutTree("m1"), []);
  const [selected, setSelected] = useTreeState("m23"); // start on "me"
  const [showBlood, setShowBlood] = useTreeState(true);
  const [scale, setScale] = useTreeState(0.72);
  const [pan, setPan] = useTreeState({ x: 0, y: 0 });
  const [dragging, setDragging] = useTreeState(false);
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const stageRef = useRef(null);

  const bloodline = useMemo(() => showBlood && selected ? bloodlinePath(selected) : null, [showBlood, selected]);

  // Initial fit-to-screen
  useEffect(() => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const fitS = Math.min(rect.width / layout.width, rect.height / layout.height) * 0.9;
    setScale(Math.min(0.95, Math.max(0.3, fitS)));
    setPan({
      x: (rect.width - layout.width * fitS) / 2,
      y: 24,
    });
  }, [layout.width, layout.height]);

  // Center on selected member when changed via jump
  function centerOn(id) {
    const p = layout.positions[id];
    if (!p || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    setPan({
      x: rect.width / 2 - (p.x + CARD_W / 2) * scale,
      y: rect.height / 2 - (p.y + CARD_H / 2) * scale,
    });
  }

  function jumpToGen(g) {
    const first = MEMBERS.find(m => m.gen === g);
    if (first) {
      setSelected(first.id);
      centerOn(first.id);
    }
  }

  function onWheel(e) {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 30) {
      // pan
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(2, Math.max(0.25, scale * factor));
    const rect = stageRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Zoom around cursor
    setPan(p => ({
      x: mx - (mx - p.x) * (newScale / scale),
      y: my - (my - p.y) * (newScale / scale),
    }));
    setScale(newScale);
  }

  function onPointerDown(e) {
    if (e.target.closest("[data-card]") || e.target.closest("[data-panel]")) return;
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.x),
      y: dragRef.current.panY + (e.clientY - dragRef.current.y),
    });
  }
  function onPointerUp() { setDragging(false); }

  function fitToScreen() {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const fitS = Math.min(rect.width / layout.width, rect.height / layout.height) * 0.9;
    setScale(fitS);
    setPan({ x: (rect.width - layout.width * fitS) / 2, y: 24 });
  }

  const selectedMember = selected ? BY_ID[selected] : null;
  const currentGen = selectedMember ? selectedMember.gen : null;

  // Set of dim members (not on bloodline when bloodline mode is on)
  const dimSet = bloodline ? new Set(MEMBERS.filter(m => !bloodline.has(m.id)).map(m => m.id)) : null;

  return (
    <div className="fade-in" style={{ height: "calc(100vh - 64px - 64px)", marginTop: -32, marginLeft: -32, marginRight: -32, marginBottom: -32, display: "flex", flexDirection: "column" }}>

      {/* ====== Toolbar ====== */}
      <div className="row" style={{
        justifyContent: "space-between", alignItems: "center",
        padding: "16px 28px",
        background: "var(--bg-elev)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div>
          <div className="row gap-2" style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>Cây gia phả</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{CLAN.name} · {CLAN.branch}</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1.1 }}>
            Toàn cây · 6 đời · {MEMBERS.length} thành viên
          </h1>
        </div>

        <div className="row gap-2">
          <div className="row gap-1" style={{ padding: 3, background: "var(--card-soft)", borderRadius: 8, border: "1px solid var(--line)" }}>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setScale(s => Math.max(0.25, s * 0.9))} title="Thu nhỏ">
              <Icon name="minus" size={15} />
            </button>
            <div style={{ minWidth: 46, textAlign: "center", fontSize: 12, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums", padding: "0 4px", alignSelf: "center" }}>
              {Math.round(scale * 100)}%
            </div>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setScale(s => Math.min(2, s * 1.1))} title="Phóng to">
              <Icon name="plus" size={15} />
            </button>
            <div className="vdiv" style={{ height: 18, margin: "auto 2px" }} />
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={fitToScreen} title="Vừa khung">
              <Icon name="fit" size={15} />
            </button>
          </div>

          <button className={`btn ${showBlood ? "btn-jade" : "btn-ghost"}`} onClick={() => setShowBlood(b => !b)}>
            <Icon name="link" size={14} />
            Dòng huyết
          </button>

          <button className="btn btn-ghost">
            <Icon name="layers" size={14} />
            Bộ lọc
            <Icon name="chevron-down" size={13} />
          </button>

          <button className="btn btn-primary">
            <Icon name="plus" size={14} />
            Thêm
          </button>
        </div>
      </div>

      {/* ====== Stage ====== */}
      <div
        ref={stageRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          flex: 1, position: "relative", overflow: "hidden",
          background: "var(--bg)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        {/* Subtle grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(var(--card-border) 0.8px, transparent 0.8px)`,
          backgroundSize: "24px 24px",
          opacity: 0.5,
          pointerEvents: "none",
        }} />

        {/* Transformed inner */}
        <div style={{
          position: "absolute",
          left: 0, top: 0,
          width: layout.width, height: layout.height,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          transition: dragging ? "none" : "transform 0.25s ease",
        }}>
          {/* Generation horizontal bands */}
          {[1, 2, 3, 4, 5, 6].map(g => {
            const gMembers = MEMBERS.filter(m => m.gen === g).map(m => layout.positions[m.id]).filter(Boolean);
            if (gMembers.length === 0) return null;
            const y = gMembers[0].y;
            return (
              <div key={g} style={{
                position: "absolute", left: 0, right: 0,
                top: y - 12, height: CARD_H + 24,
                pointerEvents: "none",
              }}>
                <div style={{
                  position: "absolute", left: 12, top: 6,
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 64, fontWeight: 700,
                  color: "var(--gold)", opacity: 0.06,
                  lineHeight: 1, letterSpacing: -2,
                }}>
                  Đời {g}
                </div>
              </div>
            );
          })}

          {/* Connectors */}
          <Connectors positions={layout.positions} bloodline={bloodline} dimSet={dimSet} />

          {/* Member cards */}
          {MEMBERS.map(m => {
            const pos = layout.positions[m.id];
            if (!pos) return null;
            return (
              <div key={m.id} data-card>
                <MemberCard
                  m={m}
                  pos={pos}
                  isMe={m.me}
                  isOnBloodline={bloodline && bloodline.has(m.id)}
                  isSelected={selected === m.id}
                  isDim={dimSet && dimSet.has(m.id)}
                  onClick={() => setSelected(m.id)}
                />
              </div>
            );
          })}
        </div>

        {/* ====== Generation rail (left overlay) ====== */}
        <GenerationRail currentGen={currentGen} onJump={jumpToGen} positions={layout.positions} />

        {/* ====== Legend (bottom left) ====== */}
        <div style={{
          position: "absolute", left: 16, bottom: 16,
          background: "var(--card)", border: "1px solid var(--card-border)",
          borderRadius: 12, padding: "10px 14px", boxShadow: "var(--shadow-md)",
          display: "flex", gap: 16, alignItems: "center",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--ink-mute)", fontWeight: 700, textTransform: "uppercase" }}>
            Chú thích
          </div>
          <div className="vdiv" style={{ height: 16 }} />
          <div className="row gap-2" style={{ alignItems: "center", fontSize: 11.5, color: "var(--ink-soft)" }}>
            <div style={{ width: 16, height: 3, background: "var(--gold)", borderRadius: 2 }} />
            Dòng huyết
          </div>
          <div className="row gap-2" style={{ alignItems: "center", fontSize: 11.5, color: "var(--ink-soft)" }}>
            <div style={{ width: 16, height: 2, background: "transparent", borderTop: "1.5px dashed var(--terracotta)" }} />
            Hôn nhân
          </div>
          <div className="row gap-2" style={{ alignItems: "center", fontSize: 11.5, color: "var(--ink-soft)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--alive)" }} />
            Còn sống
          </div>
        </div>

        {/* ====== Pan/zoom hint ====== */}
        <div style={{
          position: "absolute", right: selectedMember ? 372 : 16, bottom: 16,
          fontSize: 11, color: "var(--ink-mute)",
          background: "var(--card)", border: "1px solid var(--card-border)",
          padding: "6px 10px", borderRadius: 8, boxShadow: "var(--shadow-sm)",
        }}>
          <kbd style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>Kéo</kbd> để di chuyển ·{" "}
          <kbd style={{ background: "var(--bg)", border: "1px solid var(--line)", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>Lăn chuột</kbd> để phóng
        </div>

        {/* ====== Member detail panel ====== */}
        <div data-panel>
          <MemberPanel m={selectedMember} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FamilyTreePage });
