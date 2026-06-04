/* global window, React */
// ============================================================
// Family data — fictional Nguyễn clan (Họ Nguyễn — Chi nhánh Hà Tĩnh)
// 6 generations, ~22 members
// ============================================================

const CLAN = {
  name: "Họ Nguyễn",
  branch: "Chi nhánh Hà Tĩnh — Phái Cả",
  founder: "Nguyễn Văn Trường",
  founded: 1850,
  motto: "Trung – Hiếu – Nhân – Nghĩa",
  village: "Làng Tiên Điền, Hà Tĩnh",
};

// Helper to generate avatar gradients deterministically
const AV_PALETTES = [
  ["#B8902C", "#5C3A1E"],
  ["#2F5D3A", "#4A7A52"],
  ["#B4502E", "#8A3A1E"],
  ["#8A6F3F", "#5C4A2E"],
  ["#9B6B2E", "#D4AF55"],
  ["#4A7A52", "#2F5D3A"],
];

function avatarGrad(seed) {
  const p = AV_PALETTES[seed % AV_PALETTES.length];
  return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

// id, name, gender (M/F), birth, death (null = alive), gen, parents, spouse, role
const MEMBERS = [
  // Gen 1 — Thủy tổ
  { id: "m1", name: "Nguyễn Văn Trường", short: "NVT", gender: "M", birth: 1850, death: 1920, gen: 1, parents: [], spouse: "m2", role: "Thủy tổ", title: "Cụ Tổ", note: "Người sáng lập chi họ", honor: "Hương Cống triều Tự Đức" },
  { id: "m2", name: "Trần Thị Lan", short: "TTL", gender: "F", birth: 1855, death: 1925, gen: 1, parents: [], spouse: "m1", role: "Thủy tổ Bà", title: "Cụ Bà" },

  // Gen 2 — 3 con
  { id: "m3", name: "Nguyễn Văn Đức", short: "NVĐ", gender: "M", birth: 1878, death: 1945, gen: 2, parents: ["m1", "m2"], spouse: "m4", role: "Trưởng nam", title: "Cụ", honor: "Lý trưởng Tiên Điền" },
  { id: "m4", name: "Lê Thị Mai", short: "LTM", gender: "F", birth: 1882, death: 1950, gen: 2, parents: [], spouse: "m3", title: "Cụ Bà" },
  { id: "m5", name: "Nguyễn Thị Hương", short: "NTH", gender: "F", birth: 1881, death: 1948, gen: 2, parents: ["m1", "m2"], spouse: null, title: "Cụ" },
  { id: "m6", name: "Nguyễn Văn Hùng", short: "NVH", gender: "M", birth: 1885, death: 1955, gen: 2, parents: ["m1", "m2"], spouse: "m7", title: "Cụ" },
  { id: "m7", name: "Phạm Thị Nhung", short: "PTN", gender: "F", birth: 1888, death: 1960, gen: 2, parents: [], spouse: "m6", title: "Cụ Bà" },

  // Gen 3 — children of Đức (m3+m4) and Hùng (m6+m7)
  { id: "m8", name: "Nguyễn Văn Minh", short: "NVM", gender: "M", birth: 1910, death: 1985, gen: 3, parents: ["m3", "m4"], spouse: "m9", title: "Ông", honor: "Cử nhân Hán học" },
  { id: "m9", name: "Đỗ Thị Bích", short: "ĐTB", gender: "F", birth: 1915, death: 1990, gen: 3, parents: [], spouse: "m8", title: "Bà" },
  { id: "m10", name: "Nguyễn Thị Liên", short: "NTL", gender: "F", birth: 1912, death: 1995, gen: 3, parents: ["m3", "m4"], spouse: null, title: "Bà" },
  { id: "m11", name: "Nguyễn Văn Tài", short: "NVT", gender: "M", birth: 1915, death: 1972, gen: 3, parents: ["m6", "m7"], spouse: "m12", title: "Ông" },
  { id: "m12", name: "Hoàng Thị Sen", short: "HTS", gender: "F", birth: 1918, death: 2000, gen: 3, parents: [], spouse: "m11", title: "Bà" },

  // Gen 4 — children of Minh (m8+m9)
  { id: "m13", name: "Nguyễn Văn Tùng", short: "NVT", gender: "M", birth: 1942, death: 2018, gen: 4, parents: ["m8", "m9"], spouse: "m14", title: "Ông", honor: "Kỹ sư xây dựng" },
  { id: "m14", name: "Vũ Thị Hồng", short: "VTH", gender: "F", birth: 1945, death: null, gen: 4, parents: [], spouse: "m13", title: "Bà" },
  { id: "m15", name: "Nguyễn Văn Quang", short: "NVQ", gender: "M", birth: 1945, death: null, gen: 4, parents: ["m8", "m9"], spouse: "m16", title: "Ông", honor: "Giáo viên" },
  { id: "m16", name: "Trần Thị Yến", short: "TTY", gender: "F", birth: 1948, death: null, gen: 4, parents: [], spouse: "m15", title: "Bà" },
  { id: "m17", name: "Nguyễn Thị Hoa", short: "NTH", gender: "F", birth: 1948, death: null, gen: 4, parents: ["m8", "m9"], spouse: null, title: "Bà" },

  // Gen 5 — children of Tùng (m13+m14) and Quang (m15+m16)
  { id: "m18", name: "Nguyễn Văn Hải", short: "NVH", gender: "M", birth: 1970, death: null, gen: 5, parents: ["m13", "m14"], spouse: "m19", title: "Ông", honor: "Bác sĩ — Bệnh viện Bạch Mai" },
  { id: "m19", name: "Lý Thị Thu", short: "LTT", gender: "F", birth: 1972, death: null, gen: 5, parents: [], spouse: "m18", title: "Bà" },
  { id: "m20", name: "Nguyễn Thị Linh", short: "NTL", gender: "F", birth: 1973, death: null, gen: 5, parents: ["m13", "m14"], spouse: null, title: "Bà" },
  { id: "m21", name: "Nguyễn Văn Phúc", short: "NVP", gender: "M", birth: 1975, death: null, gen: 5, parents: ["m15", "m16"], spouse: "m22", title: "Ông" },
  { id: "m22", name: "Bùi Thị Mây", short: "BTM", gender: "F", birth: 1977, death: null, gen: 5, parents: [], spouse: "m21", title: "Bà" },

  // Gen 6 — current generation
  { id: "m23", name: "Nguyễn Minh Anh", short: "NMA", gender: "F", birth: 1995, death: null, gen: 6, parents: ["m18", "m19"], spouse: null, title: "", honor: "Du học sinh — Đại học Tokyo", me: true },
  { id: "m24", name: "Nguyễn Đức Long", short: "NĐL", gender: "M", birth: 1998, death: null, gen: 6, parents: ["m18", "m19"], spouse: null, title: "" },
  { id: "m25", name: "Nguyễn Bảo Khang", short: "NBK", gender: "M", birth: 2002, death: null, gen: 6, parents: ["m21", "m22"], spouse: null, title: "" },
];

// Build lookups
const BY_ID = Object.fromEntries(MEMBERS.map((m) => [m.id, m]));

function getChildren(id) {
  return MEMBERS.filter((m) => m.parents.includes(id));
}

function getCouples(gen) {
  // Returns array of {primary, spouse} for the given generation,
  // where primary is the blood descendant of the clan.
  const seen = new Set();
  const couples = [];
  for (const m of MEMBERS.filter((x) => x.gen === gen)) {
    if (seen.has(m.id)) continue;
    if (m.spouse && BY_ID[m.spouse]) {
      const sp = BY_ID[m.spouse];
      // primary = the one in the bloodline (has parents in clan) — fall back to male
      const primary = m.parents.length || gen === 1 ? m : sp;
      const spouse = primary === m ? sp : m;
      couples.push({ primary, spouse });
      seen.add(primary.id);
      seen.add(spouse.id);
    } else {
      couples.push({ primary: m, spouse: null });
      seen.add(m.id);
    }
  }
  return couples;
}

// ============================================================
// Activity / Events / Updates
// ============================================================
const ACTIVITIES = [
  { who: "Nguyễn Minh Anh", action: "đã thêm 3 ảnh kỷ vật", target: "Cụ Tổ Nguyễn Văn Trường", time: "2 giờ trước", type: "photo" },
  { who: "Nguyễn Văn Hải", action: "cập nhật tiểu sử cho", target: "Ông Nguyễn Văn Minh", time: "Hôm qua", type: "edit" },
  { who: "Nguyễn Đức Long", action: "đã liên kết quan hệ", target: "Bà Nguyễn Thị Hoa ↔ Ông Nguyễn Văn Quang", time: "2 ngày", type: "link" },
  { who: "AI Trợ lý", action: "gợi ý OCR cho tài liệu", target: "Gia phả cũ — Trang 47", time: "3 ngày", type: "ai" },
  { who: "Nguyễn Văn Quang", action: "thêm thành viên mới", target: "Nguyễn Bảo Khang", time: "5 ngày", type: "add" },
  { who: "Nguyễn Thị Linh", action: "tải lên ảnh sự kiện", target: "Giỗ Tổ — Xuân Giáp Thìn", time: "1 tuần", type: "photo" },
];

const EVENTS = [
  { date: "15 Tháng 3 ÂL", year: 2026, title: "Giỗ Tổ — Cụ Nguyễn Văn Trường", who: "Họ Nguyễn", location: "Từ đường Tiên Điền", attendees: 47, type: "anniversary", days: 12 },
  { date: "20 Tháng 4", year: 2026, title: "Lễ cưới Nguyễn Đức Long & Phạm Thúy Quỳnh", who: "Gia đình Ông Hải", location: "Hà Nội", attendees: 120, type: "wedding", days: 28 },
  { date: "10 Tháng 5 ÂL", year: 2026, title: "Giỗ Cụ Bà Trần Thị Lan", who: "Phái Cả", location: "Từ đường Tiên Điền", attendees: 35, type: "anniversary", days: 51 },
  { date: "Tháng 8 ÂL", year: 2026, title: "Lễ Vu Lan — Báo hiếu cha mẹ", who: "Toàn họ", location: "Chùa Hương Tích", attendees: 80, type: "ceremony", days: 145 },
];

const STATS = [
  { label: "Tổng thành viên", value: 247, delta: "+12 tháng này", icon: "users", accent: "gold" },
  { label: "Đời (Thế hệ)", value: 9, delta: "Từ 1850 — 2026", icon: "layers", accent: "jade" },
  { label: "Chi — Phái", value: 6, delta: "3 nhánh chính", icon: "branch", accent: "terracotta" },
  { label: "Sự kiện sắp tới", value: 4, delta: "Giỗ Tổ trong 12 ngày", icon: "calendar", accent: "crimson" },
];

// ============================================================
// Export
// ============================================================
Object.assign(window, {
  CLAN, MEMBERS, BY_ID, ACTIVITIES, EVENTS, STATS,
  getChildren, getCouples, avatarGrad,
});
