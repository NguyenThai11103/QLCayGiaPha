/* global window, React, Icon, MEMBERS, BY_ID, avatarGrad, CLAN */
// ============================================================
// Tra cứu quan hệ — Vietnamese Kinship Relationship Lookup
// ============================================================
const { useState: useLkState, useMemo: useLkMemo, useRef: useLkRef, useEffect: useLkEffect } = React;

// ============================================================
// Kinship engine
// ============================================================
function ancestorMap(id) {
  const result = new Map();
  result.set(id, { dist: 0, path: [id] });
  const q = [id];
  while (q.length) {
    const cur = q.shift();
    const { dist, path } = result.get(cur);
    const m = BY_ID[cur];
    if (!m) continue;
    for (const pid of m.parents) {
      if (!result.has(pid)) {
        const np = [...path, pid];
        result.set(pid, { dist: dist + 1, path: np });
        q.push(pid);
      }
    }
  }
  return result;
}

// Vietnamese kinship vocab tables
const DIRECT_UP = {
  1: { M: "Cha", F: "Mẹ" },
  2: { M: "Ông", F: "Bà" },
  3: { M: "Cụ", F: "Cụ Bà" },
  4: { M: "Kỵ", F: "Kỵ Bà" },
  5: { M: "Cao Tổ", F: "Cao Tổ Bà" },
  6: { M: "Cao Tằng Tổ", F: "Cao Tằng Tổ Bà" },
};
const DIRECT_DOWN = {
  1: { M: "Con trai", F: "Con gái" },
  2: { M: "Cháu trai", F: "Cháu gái" },
  3: { M: "Chắt trai", F: "Chắt gái" },
  4: { M: "Chút trai", F: "Chút gái" },
  5: { M: "Chít trai", F: "Chít gái" },
  6: { M: "Hậu duệ đời 7", F: "Hậu duệ đời 7" },
};
function genPrefix(gap, elderGender) {
  // gap = generation gap between speaker and the relative (e.g. 1 = sibling of parent, 2 = sibling of grandparent)
  // For Vietnamese: gap 2 → "Bác/Chú/Cô/Cậu/Dì" (no prefix), gap 3 → "Ông/Bà" prefix, gap 4 → "Cụ", gap 5 → "Kỵ"
  if (gap === 2) return "";
  if (gap === 3) return elderGender === "M" ? "Ông " : "Bà ";
  if (gap === 4) return "Cụ ";
  if (gap === 5) return "Kỵ ";
  return "";
}

function pibName(a, isPaternal, isOlder) {
  // A is sibling of B's direct ancestor; return what B calls A
  if (isPaternal) {
    if (a.gender === "M") return isOlder ? "Bác" : "Chú";
    return "Cô";
  }
  // maternal
  if (a.gender === "M") return "Cậu";
  return "Dì";
}

function computeRelationship(aId, bId) {
  if (!aId || !bId) return null;
  if (aId === bId) {
    return { kind: "self", aToB: "Chính mình", bToA: "Chính mình", path: [aId] };
  }
  const a = BY_ID[aId], b = BY_ID[bId];
  if (!a || !b) return null;

  // Direct spouse
  if (a.spouse === bId) {
    return {
      kind: "spouse",
      aToB: a.gender === "M" ? "Vợ" : "Chồng",
      bToA: b.gender === "M" ? "Vợ" : "Chồng",
      desc: "Vợ chồng — hôn phối trực tiếp",
      path: [aId, bId],
      common: null,
      via: "marriage",
    };
  }

  const aAnc = ancestorMap(aId);
  const bAnc = ancestorMap(bId);

  let best = null;
  for (const [id, data] of aAnc) {
    if (bAnc.has(id)) {
      const bData = bAnc.get(id);
      const total = data.dist + bData.dist;
      if (!best || total < best.total) {
        best = {
          id, total,
          upA: data.dist, upB: bData.dist,
          pathA: data.path, pathB: bData.path,
        };
      }
    }
  }

  if (best) return makeBloodResult(a, b, best);

  // Marriage-bridge: a's spouse blood-related to b?
  if (a.spouse) {
    const sub = computeRelationship(a.spouse, bId);
    if (sub && sub.kind !== "unrelated" && sub.kind !== "spouse") {
      return makeInLawResult(a, b, sub, "a");
    }
  }
  if (b.spouse) {
    const sub = computeRelationship(aId, b.spouse);
    if (sub && sub.kind !== "unrelated" && sub.kind !== "spouse") {
      return makeInLawResult(a, b, sub, "b");
    }
  }

  return { kind: "unrelated", aToB: "Không quan hệ", bToA: "Không quan hệ", desc: "Không tìm thấy quan hệ huyết thống hoặc hôn nhân trong dữ liệu hiện có." };
}

function makeBloodResult(a, b, best) {
  const { upA, upB, pathA, pathB, id: commonId } = best;
  const fullPath = [...pathA, ...pathB.slice(0, -1).reverse()];

  // Case: A is ancestor of B (upA = 0)
  if (upA === 0) {
    const term = DIRECT_UP[upB]?.[a.gender] || `Tổ tiên đời ${upB}`;
    const rev = DIRECT_DOWN[upB]?.[b.gender] || `Hậu duệ đời ${upB}`;
    return {
      kind: "ancestor",
      aToB: rev, // a calls b
      bToA: term, // b calls a
      desc: `Trực hệ — ${term} của ${b.name.split(" ").slice(-1)[0]}, cách ${upB} đời`,
      path: fullPath, common: commonId,
      generations: upB,
      via: "blood",
    };
  }

  // Case: B is ancestor of A (upB = 0)
  if (upB === 0) {
    const term = DIRECT_UP[upA]?.[b.gender] || `Tổ tiên đời ${upA}`;
    const rev = DIRECT_DOWN[upA]?.[a.gender] || `Hậu duệ đời ${upA}`;
    return {
      kind: "descendant",
      aToB: term,
      bToA: rev,
      desc: `Trực hệ — ${term} của ${a.name.split(" ").slice(-1)[0]}, cách ${upA} đời`,
      path: fullPath, common: commonId,
      generations: upA,
      via: "blood",
    };
  }

  // Case: siblings (upA = upB = 1)
  if (upA === 1 && upB === 1) {
    const isOlderA = a.birth < b.birth;
    let aToB, bToA;
    if (b.gender === "M") aToB = isOlderA ? "Em trai" : "Anh trai";
    else aToB = isOlderA ? "Em gái" : "Chị gái";
    if (a.gender === "M") bToA = isOlderA ? "Anh trai" : "Em trai";
    else bToA = isOlderA ? "Chị gái" : "Em gái";
    return {
      kind: "sibling",
      aToB, bToA,
      desc: "Anh chị em ruột — cùng cha mẹ",
      path: [a.id, commonId, b.id],
      common: commonId, generations: 0,
      via: "blood",
    };
  }

  // Case: pibling (A is sibling of B's direct ancestor) — upA = 1, upB >= 2
  if (upA === 1 && upB >= 2) {
    // B's parent on path is pathB[upB - 1] (one below common)
    const bParent = BY_ID[pathB[upB - 1]];
    // Find sibling on A's side (A himself, since upA=1 means a is child of common)
    // Determine paternal/maternal: is bParent male?
    const isPaternal = bParent && bParent.gender === "M";
    const isOlder = a.birth < (bParent?.birth || 0);
    const base = pibName(a, isPaternal, isOlder);
    const prefix = genPrefix(upB, a.gender);
    const bToA = (prefix + base).trim();
    const aToB = upB === 2
      ? (b.gender === "M" ? "Cháu trai" : "Cháu gái")
      : (DIRECT_DOWN[upB - 1]?.[b.gender] || "Hậu duệ");
    return {
      kind: "pibling",
      aToB, bToA,
      desc: `${bToA} — ${isPaternal ? "bên nội" : "bên ngoại"}${isOlder ? ", anh/chị của" : ", em của"} ${bParent?.name?.split(" ").slice(-1)[0] || "cha/mẹ"}`,
      path: fullPath, common: commonId,
      generations: upB - upA,
      side: isPaternal ? "paternal" : "maternal",
      via: "blood",
    };
  }

  // Case: nibling (B is sibling of A's direct ancestor)
  if (upB === 1 && upA >= 2) {
    const aParent = BY_ID[pathA[upA - 1]];
    const isPaternal = aParent && aParent.gender === "M";
    const isOlder = b.birth < (aParent?.birth || 0);
    const base = pibName(b, isPaternal, isOlder);
    const prefix = genPrefix(upA, b.gender);
    const aToB = (prefix + base).trim();
    const bToA = upA === 2
      ? (a.gender === "M" ? "Cháu trai" : "Cháu gái")
      : (DIRECT_DOWN[upA - 1]?.[a.gender] || "Hậu duệ");
    return {
      kind: "nibling",
      aToB, bToA,
      desc: `${aToB} — ${isPaternal ? "bên nội" : "bên ngoại"}`,
      path: fullPath, common: commonId,
      generations: upA - upB,
      side: isPaternal ? "paternal" : "maternal",
      via: "blood",
    };
  }

  // Case: cousins (upA = upB > 1)
  if (upA === upB) {
    const isOlderA = a.birth < b.birth;
    const aToBBase = b.gender === "M"
      ? (isOlderA ? "Em trai họ" : "Anh trai họ")
      : (isOlderA ? "Em gái họ" : "Chị gái họ");
    const bToABase = a.gender === "M"
      ? (isOlderA ? "Anh trai họ" : "Em trai họ")
      : (isOlderA ? "Chị gái họ" : "Em gái họ");
    const level = upA; // 2 = first cousins, 3 = second, etc.
    const note = level === 2 ? "Anh em họ đời 1" : `Anh em họ đời ${level - 1}`;
    return {
      kind: "cousin",
      aToB: aToBBase, bToA: bToABase,
      desc: `${note} — cùng tổ ${DIRECT_UP[level]?.M || "tiên"}, cách ${level} đời tổ chung`,
      path: fullPath, common: commonId,
      generations: 0, level,
      via: "blood",
    };
  }

  // Mixed cousins (e.g. upA=2, upB=3 — first cousin once removed)
  const removed = Math.abs(upA - upB);
  const closer = Math.min(upA, upB);
  return {
    kind: "cousin-removed",
    aToB: upA < upB ? `Cô/Chú họ — cách ${removed} đời` : `Cháu họ — cách ${removed} đời`,
    bToA: upB < upA ? `Cô/Chú họ — cách ${removed} đời` : `Cháu họ — cách ${removed} đời`,
    desc: `Anh em họ ${closer === 2 ? "đời 1" : `đời ${closer - 1}`} cách ${removed} đời`,
    path: fullPath, common: commonId,
    generations: removed,
    via: "blood",
  };
}

function makeInLawResult(a, b, sub, bridge) {
  // bridge = "a" means a married into b's family; "b" means b married in
  const bridgeName = bridge === "a" ? "vợ/chồng của bạn" : "vợ/chồng của họ";
  let aToB, bToA;
  if (bridge === "a") {
    // a's spouse is sub-relation to b. So a is in-law via that.
    // If sub.bToA was "Em trai", then b is brother of a's spouse → b is em chồng/em vợ to a
    aToB = inLawLabel(sub.bToA, b.gender, "spouse-side");
    bToA = inLawLabel(sub.aToB, a.gender, "in-law-side");
  } else {
    aToB = inLawLabel(sub.aToB, b.gender, "in-law-side");
    bToA = inLawLabel(sub.bToA, a.gender, "spouse-side");
  }
  return {
    kind: "in-law",
    aToB, bToA,
    desc: `Quan hệ qua hôn nhân (qua ${bridge === "a" ? a.name : b.name}) — ${sub.desc}`,
    path: sub.path, common: sub.common,
    bridge, sub,
    via: "marriage",
  };
}

// Simple in-law mapper — adds "chồng/vợ" suffix for spouse-side relations
function inLawLabel(baseTerm, viewerGender, mode) {
  // Heuristic: append " (qua hôn)" — Vietnamese has many specific terms (dâu/rể/anh rể/chị dâu)
  // Keep it simple for the demo.
  if (!baseTerm) return "Thông gia";
  if (baseTerm.includes("Cha")) return viewerGender === "M" ? "Bố vợ/Bố chồng" : "Bố vợ/Bố chồng";
  if (baseTerm.includes("Mẹ")) return "Mẹ vợ/Mẹ chồng";
  if (baseTerm.includes("Con trai")) return "Con rể";
  if (baseTerm.includes("Con gái")) return "Con dâu";
  if (baseTerm.includes("Anh")) return mode === "spouse-side" ? "Anh chồng/Anh vợ" : "Em rể/Em dâu";
  if (baseTerm.includes("Chị")) return "Chị chồng/Chị vợ";
  if (baseTerm.includes("Em trai")) return "Em chồng/Em vợ";
  if (baseTerm.includes("Em gái")) return "Em chồng/Em vợ";
  return baseTerm + " (qua hôn)";
}

// ============================================================
// UI — Member selector card
// ============================================================
function SelectorCard({ label, member, onPick, accent = "gold" }) {
  if (!member) {
    return (
      <button onClick={onPick} style={{
        flex: 1, padding: 28, background: "var(--card)",
        border: "2px dashed var(--card-border-strong)", borderRadius: 16,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--card-soft)", border: "2px dashed var(--card-border-strong)",
          display: "grid", placeItems: "center", color: "var(--ink-mute)",
        }}>
          <Icon name="plus" size={28} />
        </div>
        <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>Chạm để chọn thành viên</div>
      </button>
    );
  }
  const seed = parseInt(member.id.replace("m", ""), 10);
  return (
    <div className="card card-pad" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.06,
        background: avatarGrad(seed), pointerEvents: "none",
      }} />
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
        <div className="chip" style={{
          background: `color-mix(in srgb, var(--${accent}) 14%, transparent)`,
          color: `var(--${accent})`,
          borderColor: `color-mix(in srgb, var(--${accent}) 22%, transparent)`,
        }}>
          <span className="chip-dot" />
          {label}
        </div>
        <button className="icon-btn" onClick={onPick} title="Đổi" style={{ width: 30, height: 30 }}>
          <Icon name="edit" size={14} />
        </button>
      </div>

      <div className="row gap-3" style={{ alignItems: "center", position: "relative" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
          background: avatarGrad(seed),
          display: "grid", placeItems: "center",
          color: "white", fontSize: 18, fontWeight: 700, letterSpacing: 1,
          boxShadow: "var(--shadow-md)",
        }}>{member.short}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          {member.title && (
            <div style={{ fontSize: 10.5, color: "var(--ink-mute)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>
              {member.title}
            </div>
          )}
          <div className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1.1, marginBottom: 4 }}>
            {member.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            Đời {member.gen} · {member.birth}{member.death ? ` — ${member.death}` : " — nay"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Member picker modal
// ============================================================
function PickerModal({ open, onClose, onPick, exclude }) {
  const [q, setQ] = useLkState("");
  const [filterGen, setFilterGen] = useLkState(null);
  useLkEffect(() => { if (open) { setQ(""); setFilterGen(null); } }, [open]);
  if (!open) return null;

  const filtered = MEMBERS.filter(m => {
    if (m.id === exclude) return false;
    if (filterGen && m.gen !== filterGen) return false;
    if (q && !m.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      backdropFilter: "blur(4px)", zIndex: 100,
      display: "grid", placeItems: "center", padding: 24,
      animation: "fadeUp 0.2s ease both",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--card)", borderRadius: 16, width: 560, maxWidth: "100%",
        maxHeight: "82vh", overflow: "hidden",
        border: "1px solid var(--card-border)", boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>
              Chọn thành viên
            </div>
            <button className="icon-btn" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="search" style={{ width: "100%" }}>
            <Icon name="search" size={15} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên..."
              style={{ width: "100%" }}
            />
          </div>
          <div className="row gap-2" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => setFilterGen(null)} className="chip" style={{
              cursor: "pointer", background: filterGen === null ? "var(--gold-glow)" : "var(--card-soft)",
              color: filterGen === null ? "var(--brown)" : "var(--ink-soft)",
              borderColor: filterGen === null ? "var(--gold-soft)" : "var(--line)",
              fontFamily: "inherit",
            }}>Tất cả · {MEMBERS.length}</button>
            {[1, 2, 3, 4, 5, 6].map(g => {
              const c = MEMBERS.filter(m => m.gen === g).length;
              return (
                <button key={g} onClick={() => setFilterGen(g)} className="chip" style={{
                  cursor: "pointer", background: filterGen === g ? "var(--gold-glow)" : "var(--card-soft)",
                  color: filterGen === g ? "var(--brown)" : "var(--ink-soft)",
                  borderColor: filterGen === g ? "var(--gold-soft)" : "var(--line)",
                  fontFamily: "inherit",
                }}>Đời {g} · {c}</button>
              );
            })}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: 8, flex: 1 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
              Không tìm thấy thành viên nào
            </div>
          )}
          {filtered.map(m => {
            const seed = parseInt(m.id.replace("m", ""), 10);
            return (
              <button key={m.id} onClick={() => { onPick(m.id); onClose(); }} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                width: "100%", textAlign: "left",
                background: "transparent", border: "1px solid transparent",
                borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-soft)"; e.currentTarget.style.borderColor = "var(--gold-soft)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: avatarGrad(seed),
                  display: "grid", placeItems: "center", color: "white", fontSize: 12, fontWeight: 700,
                  flexShrink: 0,
                }}>{m.short}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row gap-2" style={{ alignItems: "baseline" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{m.name}</span>
                    {m.title && <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{m.title}</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>
                    Đời {m.gen} · {m.birth}{m.death ? ` — ${m.death}` : ""} · {m.gender === "M" ? "Nam" : "Nữ"}
                  </div>
                </div>
                <Icon name="chevron-right" size={14} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Path visualization (horizontal ladder)
// ============================================================
function PathView({ result }) {
  if (!result || !result.path || result.path.length < 2) return null;
  const { path, common } = result;
  return (
    <div className="card" style={{
      padding: "28px 24px 22px", background: "var(--card)",
      border: "1px solid var(--card-border)",
      overflow: "hidden",
    }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
            Đường dẫn quan hệ
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            {path.length} bước · {result.via === "marriage" ? "qua hôn nhân" : "huyết thống"}
            {common && ` · tổ chung: ${BY_ID[common]?.name?.split(" ").slice(-2).join(" ")}`}
          </div>
        </div>
      </div>

      <div style={{
        overflowX: "auto", overflowY: "visible",
        paddingBottom: 12, paddingTop: 8,
      }}>
        <div style={{ display: "inline-flex", alignItems: "flex-start", gap: 0, minWidth: "100%", padding: "0 8px" }}>
          {path.map((id, idx) => {
            const m = BY_ID[id];
            if (!m) return null;
            const seed = parseInt(m.id.replace("m", ""), 10);
            const isCommon = id === common;
            const isEnd = idx === 0 || idx === path.length - 1;

            return (
              <React.Fragment key={`${id}-${idx}`}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  width: 96, flexShrink: 0, position: "relative",
                }}>
                  {isCommon && (
                    <div style={{
                      position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                      background: "var(--gold)", color: "white",
                      fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                      padding: "2px 8px", borderRadius: 999,
                      boxShadow: "var(--shadow-gold)", whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      zIndex: 2,
                    }}>Tổ chung</div>
                  )}
                  <div style={{
                    width: isEnd ? 56 : isCommon ? 60 : 48,
                    height: isEnd ? 56 : isCommon ? 60 : 48,
                    borderRadius: "50%", background: avatarGrad(seed),
                    display: "grid", placeItems: "center",
                    color: "white", fontSize: isEnd ? 14 : isCommon ? 14 : 12, fontWeight: 700,
                    border: isEnd ? "3px solid var(--gold)" : isCommon ? "3px solid var(--gold)" : "2px solid var(--card)",
                    boxShadow: isEnd || isCommon ? "var(--shadow-gold)" : "var(--shadow-sm)",
                    marginTop: isCommon ? 8 : 0,
                  }}>{m.short}</div>
                  <div style={{ fontSize: 9.5, color: "var(--ink-mute)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
                    Đời {m.gen}
                  </div>
                  <div className="font-serif" style={{
                    fontSize: 12, fontWeight: 600, color: "var(--ink)",
                    textAlign: "center", lineHeight: 1.15, maxWidth: 86,
                  }}>
                    {m.name.split(" ").slice(-2).join(" ")}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-faint)", fontVariantNumeric: "tabular-nums" }}>
                    {m.birth}{m.death ? `–${m.death}` : ""}
                  </div>
                </div>

                {idx < path.length - 1 && (
                  <PathEdge fromId={path[idx]} toId={path[idx + 1]} commonId={common} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PathEdge({ fromId, toId, commonId }) {
  const from = BY_ID[fromId], to = BY_ID[toId];
  if (!from || !to) return null;
  let label = "";
  // Determine direction by parents
  if (from.parents.includes(toId)) {
    // from's parent is to → going up
    label = to.gender === "M" ? "← cha" : "← mẹ";
  } else if (to.parents.includes(fromId)) {
    // from is to's parent → going down
    label = from.gender === "M" ? "con →" : "con →";
  } else {
    // Maybe siblings / spouses
    if (from.spouse === toId) label = "↔ hôn";
    else label = "·";
  }
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minWidth: 32, paddingTop: 30, gap: 4,
    }}>
      <div style={{
        width: 32, height: 2, background: "var(--gold-soft)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", left: "50%", top: -2, transform: "translateX(-50%)",
          width: 6, height: 6, borderRadius: "50%", background: "var(--gold)",
        }} />
      </div>
      <div style={{ fontSize: 9.5, color: "var(--gold)", fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// ============================================================
// Result card (giant reveal)
// ============================================================
function ResultCard({ a, b, result }) {
  if (!result) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
        <Icon name="link" size={36} color="var(--ink-faint)" />
        <div style={{ marginTop: 14, fontSize: 14, color: "var(--ink-mute)" }}>
          Chọn hai thành viên để xem xưng hô
        </div>
      </div>
    );
  }

  const lastA = a.name.split(" ").slice(-2).join(" ");
  const lastB = b.name.split(" ").slice(-2).join(" ");

  const kindLabels = {
    self: { label: "Chính mình", color: "ink-mute", icon: "users" },
    spouse: { label: "Hôn phối", color: "terracotta", icon: "heart" },
    ancestor: { label: "Tổ tiên — Hậu duệ", color: "gold", icon: "tree" },
    descendant: { label: "Hậu duệ — Tổ tiên", color: "gold", icon: "tree" },
    sibling: { label: "Anh chị em ruột", color: "jade", icon: "users" },
    pibling: { label: "Trên một thế hệ", color: "brown", icon: "branch" },
    nibling: { label: "Dưới một thế hệ", color: "brown", icon: "branch" },
    cousin: { label: "Anh chị em họ", color: "jade", icon: "branch" },
    "cousin-removed": { label: "Họ xa", color: "ink-mute", icon: "branch" },
    "in-law": { label: "Quan hệ thông gia", color: "terracotta", icon: "heart" },
    unrelated: { label: "Không có quan hệ", color: "ink-mute", icon: "link" },
  };
  const k = kindLabels[result.kind] || kindLabels.unrelated;

  return (
    <div className="card" style={{
      padding: 32,
      position: "relative", overflow: "hidden",
      background: "linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--gold) 5%, var(--card)) 100%)",
      borderColor: "var(--gold-soft)",
    }}>
      {/* Decorative corner ornaments */}
      <div style={{ position: "absolute", top: 16, right: 16, color: "var(--gold)", opacity: 0.2 }}>
        <Icon name="sparkle" size={48} />
      </div>
      <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120,
        background: "radial-gradient(circle, var(--gold-glow), transparent 70%)", opacity: 0.6 }} />

      <div className="row gap-2" style={{ marginBottom: 14, position: "relative" }}>
        <span className="chip" style={{
          background: `color-mix(in srgb, var(--${k.color}) 14%, transparent)`,
          color: `var(--${k.color})`,
          borderColor: `color-mix(in srgb, var(--${k.color}) 25%, transparent)`,
        }}>
          <Icon name={k.icon} size={11} />
          {k.label}
        </span>
        {result.via && (
          <span className="chip">
            {result.via === "marriage" ? "Qua hôn nhân" : "Huyết thống"}
          </span>
        )}
        {typeof result.generations === "number" && result.generations > 0 && (
          <span className="chip">Cách {result.generations} đời</span>
        )}
        {result.side && (
          <span className="chip">{result.side === "paternal" ? "Bên nội" : "Bên ngoại"}</span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        {/* Primary direction: B calls A */}
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{lastB}</span> gọi <span style={{ fontWeight: 600, color: "var(--ink)" }}>{lastA}</span> là
        </div>
        <div className="font-serif" style={{
          fontSize: 64, fontWeight: 600, color: "var(--gold)",
          lineHeight: 1.05, letterSpacing: "-0.5px",
          marginBottom: 20,
        }}>
          {result.bToA}
        </div>

        {/* Reverse */}
        <div style={{
          padding: "14px 18px", background: "var(--card-soft)",
          borderRadius: 12, border: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="arrow-right" size={14} color="var(--ink-mute)" />
          <div>
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{lastA}</span> gọi <span style={{ fontWeight: 600, color: "var(--ink)" }}>{lastB}</span> là{" "}
            </span>
            <span className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--brown)" }}>
              {result.aToB}
            </span>
          </div>
        </div>

        {result.desc && (
          <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            {result.desc}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Examples / Recent / Glossary panels
// ============================================================
const PRESETS = [
  { a: "m23", b: "m1", note: "Hậu duệ → Cụ Tổ" },
  { a: "m23", b: "m15", note: "Cháu → Ông chú" },
  { a: "m23", b: "m25", note: "Anh em họ đời 2" },
  { a: "m18", b: "m17", note: "Anh em ruột" },
  { a: "m23", b: "m24", note: "Anh em ruột" },
  { a: "m3", b: "m6", note: "Anh em — đời 2" },
];

function Presets({ onPick }) {
  return (
    <div className="card card-pad">
      <div className="section-title" style={{ marginBottom: 4 }}>Tra cứu mẫu</div>
      <div className="section-meta" style={{ marginBottom: 14 }}>Bấm để xem nhanh</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PRESETS.map((p, i) => {
          const a = BY_ID[p.a], b = BY_ID[p.b];
          if (!a || !b) return null;
          const sa = parseInt(a.id.replace("m", ""), 10);
          const sb = parseInt(b.id.replace("m", ""), 10);
          return (
            <button key={i} onClick={() => onPick(p.a, p.b)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10,
              background: "transparent", border: "1px solid transparent",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-soft)"; e.currentTarget.style.borderColor = "var(--gold-soft)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <div style={{ display: "flex", marginRight: 4 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: avatarGrad(sa), border: "2px solid var(--card)", color: "white", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center" }}>{a.short}</div>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: avatarGrad(sb), border: "2px solid var(--card)", color: "white", fontSize: 9, fontWeight: 700, display: "grid", placeItems: "center", marginLeft: -8 }}>{b.short}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.name.split(" ").slice(-2).join(" ")} & {b.name.split(" ").slice(-2).join(" ")}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{p.note}</div>
              </div>
              <Icon name="chevron-right" size={13} color="var(--ink-faint)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const GLOSSARY = [
  { side: "Bên nội (huyết tộc cha)", terms: [
    ["Bác", "Anh trai của cha"],
    ["Chú", "Em trai của cha"],
    ["Cô", "Chị / em gái của cha"],
  ]},
  { side: "Bên ngoại (huyết tộc mẹ)", terms: [
    ["Cậu", "Anh / em trai của mẹ"],
    ["Dì", "Chị / em gái của mẹ"],
  ]},
  { side: "Thế hệ trên", terms: [
    ["Ông / Bà", "Đời trên hai bậc"],
    ["Cụ", "Đời trên ba bậc"],
    ["Kỵ", "Đời trên bốn bậc"],
    ["Cao Tổ", "Đời trên năm bậc"],
  ]},
  { side: "Thế hệ dưới", terms: [
    ["Con", "Đời dưới một bậc"],
    ["Cháu", "Đời dưới hai bậc"],
    ["Chắt", "Đời dưới ba bậc"],
    ["Chút", "Đời dưới bốn bậc"],
    ["Chít", "Đời dưới năm bậc"],
  ]},
];

function Glossary() {
  return (
    <div className="card card-pad">
      <div className="row" style={{ marginBottom: 10, justifyContent: "space-between" }}>
        <div>
          <div className="section-title">Từ điển xưng hô</div>
          <div className="section-meta">Tra cứu nhanh</div>
        </div>
        <Icon name="book" size={16} color="var(--gold)" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {GLOSSARY.map((g, gi) => (
          <div key={gi}>
            <div style={{ fontSize: 10.5, letterSpacing: 1.5, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
              {g.side}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.terms.map(([t, d], i) => (
                <div key={i} className="row" style={{ justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "var(--card-soft)" }}>
                  <span className="font-serif" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{t}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-mute)", textAlign: "right" }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main page
// ============================================================
function LookupPage({ onNav }) {
  const [aId, setAId] = useLkState("m23"); // Minh Anh
  const [bId, setBId] = useLkState("m15"); // Quang (Ông Chú — nice demo)
  const [picker, setPicker] = useLkState(null); // "a" | "b"
  const [recents, setRecents] = useLkState([
    { a: "m23", b: "m1", time: "Vừa xong" },
    { a: "m23", b: "m18", time: "5 phút" },
    { a: "m13", b: "m23", time: "Hôm qua" },
  ]);

  const a = aId ? BY_ID[aId] : null;
  const b = bId ? BY_ID[bId] : null;
  const result = useLkMemo(() => (a && b ? computeRelationship(aId, bId) : null), [aId, bId]);

  function swap() {
    setAId(bId);
    setBId(aId);
  }

  function pickPreset(a, b) {
    setAId(a); setBId(b);
    setRecents(prev => [{ a, b, time: "Vừa xong" }, ...prev].slice(0, 5));
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1320, margin: "0 auto" }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase" }}>Tra cứu quan hệ</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Máy tính xưng hô · Quy tắc Họ Việt</span>
          </div>
          <h1 className="page-title">Xưng hô trong dòng họ</h1>
          <div className="page-sub">Chọn hai thành viên — chúng tôi tính khoảng cách thế hệ, hướng huyết thống và đề xuất cách gọi đúng theo phong tục Việt.</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => onNav("tree")}>
            <Icon name="tree" size={14} />
            Xem trên cây
          </button>
          <button className="btn btn-primary">
            <Icon name="sparkle" size={14} />
            Hỏi AI
          </button>
        </div>
      </div>

      {/* Two-pane selector */}
      <div className="row gap-3" style={{ alignItems: "stretch", marginBottom: 24, position: "relative" }}>
        <SelectorCard label="Người A" member={a} onPick={() => setPicker("a")} accent="gold" />

        {/* Swap button */}
        <div style={{
          display: "grid", placeItems: "center",
          position: "relative",
        }}>
          <button onClick={swap} title="Tráo hai người" style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--card)", border: "1.5px solid var(--gold-soft)",
            color: "var(--gold)", cursor: "pointer", display: "grid", placeItems: "center",
            boxShadow: "var(--shadow-md)", fontFamily: "inherit",
            transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "rotate(180deg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.transform = "rotate(0deg)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3L4 7l4 4" /><path d="M4 7h12" />
              <path d="M16 21l4-4-4-4" /><path d="M20 17H8" />
            </svg>
          </button>
        </div>

        <SelectorCard label="Người B" member={b} onPick={() => setPicker("b")} accent="terracotta" />
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, alignItems: "start" }}>
        {/* LEFT — result + path */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ResultCard a={a} b={b} result={result} />
          {result && result.path && result.path.length >= 2 && (
            <PathView result={result} />
          )}
          {/* Detail / explanation card */}
          {result && result.kind !== "unrelated" && result.kind !== "self" && (
            <div className="card card-pad">
              <div className="section-title" style={{ marginBottom: 12 }}>Phân tích chi tiết</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <DetailField label="Loại quan hệ" value={result.kind === "ancestor" ? "Trực hệ trên" : result.kind === "descendant" ? "Trực hệ dưới" : result.kind === "sibling" ? "Anh chị em ruột" : result.kind === "cousin" ? `Họ đời ${result.level - 1}` : result.kind === "pibling" ? "Bậc cô/chú/bác" : result.kind === "nibling" ? "Bậc cháu" : result.kind} />
                <DetailField label="Đường lối" value={result.via === "marriage" ? "Qua hôn nhân" : "Huyết thống trực tiếp"} />
                <DetailField label="Khoảng cách thế hệ" value={`${result.generations || 0} đời`} />
                {result.side && <DetailField label="Nhánh" value={result.side === "paternal" ? "Bên nội (cha)" : "Bên ngoại (mẹ)"} />}
                {result.common && <DetailField label="Tổ chung" value={BY_ID[result.common]?.name} fullSpan />}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — presets + glossary + recent */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Presets onPick={pickPreset} />

          {/* Recent lookups */}
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 4 }}>Đã tra gần đây</div>
            <div className="section-meta" style={{ marginBottom: 12 }}>Lịch sử cá nhân</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recents.map((r, i) => {
                const ra = BY_ID[r.a], rb = BY_ID[r.b];
                if (!ra || !rb) return null;
                const sa = parseInt(ra.id.replace("m", ""), 10);
                const sb = parseInt(rb.id.replace("m", ""), 10);
                return (
                  <button key={i} onClick={() => { setAId(r.a); setBId(r.b); }} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                    borderRadius: 8, background: "transparent", border: 0,
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--card-soft)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarGrad(sa), border: "1.5px solid var(--card)", color: "white", fontSize: 8, fontWeight: 700, display: "grid", placeItems: "center" }}>{ra.short}</div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarGrad(sb), border: "1.5px solid var(--card)", color: "white", fontSize: 8, fontWeight: 700, display: "grid", placeItems: "center", marginLeft: -6 }}>{rb.short}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ra.name.split(" ").slice(-1)[0]} ↔ {rb.name.split(" ").slice(-1)[0]}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-mute)" }}>{r.time}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <Glossary />
        </div>
      </div>

      {/* Picker modal */}
      <PickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        exclude={picker === "a" ? bId : aId}
        onPick={(id) => { picker === "a" ? setAId(id) : setBId(id); }}
      />
    </div>
  );
}

function DetailField({ label, value, fullSpan }) {
  return (
    <div style={{ gridColumn: fullSpan ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 10, color: "var(--ink-mute)", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div className="font-serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

Object.assign(window, { LookupPage });
