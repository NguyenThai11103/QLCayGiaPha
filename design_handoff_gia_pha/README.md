# Handoff: Gia Phả — Vietnamese Family Genealogy Platform

## Overview

**Gia Phả** is a digital family genealogy platform for Vietnamese clans (dòng họ). It lets families digitize traditional paper family books (sách gia phả), visualize multi-generation trees, look up Vietnamese kinship relationships, manage ancestral events (giỗ chạp), and apply AI to old documents.

This handoff covers the design of 3 hero screens — **Landing**, **Dashboard**, and **Family Tree** — built as a single-page interactive prototype. Seven additional sidebar destinations (Members, Relationship Lookup, AI Assistant, Clan Management, Events, Documents, Settings) currently render an "Coming soon" placeholder and are out of scope for this handoff.

---

## About the Design Files

The files in `design/` are **design references created in HTML/React** (loaded via Babel standalone in the browser). They are prototypes showing the intended look and behavior — **not production code to copy directly**.

Your task is to **recreate these designs in your target codebase's environment** (React + Vite/Next.js, Vue, Inertia + Laravel, etc.) using its established patterns, component library, and routing. If no environment exists yet, the prototype assumes **React + Tailwind CSS + Inertia** (per the original brief) — that's a sensible starting point.

The HTML files use:
- React 18 (UMD) + Babel standalone — replace with your bundler
- Inline JSX in `<script type="text/babel">` files — convert to real `.jsx`/`.tsx`
- CSS custom properties on `:root[data-theme="…"]` for theming — port to your CSS / Tailwind config
- Google Fonts (`Be Vietnam Pro`, `Cormorant Garamond`)

---

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are specified. Recreate pixel-perfectly using your codebase's component library. The visual system is cohesive across three themes (warm / paper / dark) — preserve all three when porting.

---

## Design Tokens

All tokens are defined as CSS custom properties in `design/src/styles.css`. Below is the **`warm` (default) theme**; see `styles.css` for `dark` and `paper` overrides.

### Colors — Warm Theme (default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#FBF6EC` | Page background (cream) |
| `--bg-elev` | `#FFFEF9` | Sidebar, topbar |
| `--bg-sunken` | `#F4ECDA` | Sunken surfaces |
| `--card` | `#FFFFFF` | Card surface |
| `--card-soft` | `#FBF6EC` | Soft card / hover row |
| `--card-border` | `#EADFC4` | Card border (default) |
| `--card-border-strong` | `#D9C795` | Stronger border |
| `--ink` | `#2A1F12` | Primary text |
| `--ink-soft` | `#5C4A2E` | Secondary text |
| `--ink-mute` | `#8A7553` | Muted text / meta |
| `--ink-faint` | `#B8A47A` | Disabled / faint |
| `--gold` | `#B8902C` | Primary accent / CTA |
| `--gold-soft` | `#D4AF55` | Gold hover / secondary |
| `--gold-pale` | `#F0E2BB` | Gold backgrounds |
| `--gold-glow` | `#FAF1D4` | Gold tint backgrounds |
| `--brown` | `#5C3A1E` | Heading accents |
| `--brown-soft` | `#8A5A2E` | Gold hover state |
| `--jade` | `#2F5D3A` | "Alive" status, secondary CTA |
| `--jade-soft` | `#4A7A52` | Jade hover |
| `--terracotta` | `#B4502E` | Marriage line, female accent |
| `--crimson` | `#9B2B1F` | Notifications, errors |
| `--alive` | `#2F5D3A` | Status dot (alive) |
| `--deceased` | `#6B5232` | Status dot (deceased) |

### Colors — Dark Theme (key changes)

```
--bg: #14110B;  --bg-elev: #1C1812;  --card: #1F1A12;
--ink: #F2E6C8;  --ink-soft: #C8B488;
--gold: #D4AF55;  --gold-glow: #2A2010;  --jade: #6FA374;
--card-border: #34291A;
```

### Colors — Paper Theme (key changes)

```
--bg: #F1E9D6;  --card: #FBF5E4;
--ink: #3D2914;  --gold: #9B6B2E;
--card-border: #D9C795;
```
Paper theme also adds a subtle SVG noise overlay (see `body::before` in `styles.css`).

### Typography

- **Display / Headings**: `Cormorant Garamond` (weights 500, 600, 700; italic 500). Use for: H1s, page titles, name cards, large numbers, motto/quote, generation labels.
- **Body / UI**: `Be Vietnam Pro` (weights 300, 400, 500, 600, 700). Use for: all other text. Has excellent Vietnamese diacritics.

Type scale (px):
- Page title (serif): 32–42 / 600 / -0.3px tracking
- Hero H1 (serif): 64 / 600 / -0.5px / line-height 1.05
- Section title: 16 / 600
- Body: 13.5–14 / 400–500 / line-height 1.5
- Meta / muted: 12–13 / 400
- Eyebrow label: 10–11 / 700 / uppercase / letter-spacing 1.5–2px
- Tabular numerics: enable `font-variant-numeric: tabular-nums` for dates/years

### Spacing

Standard scale (px): 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 48, 64. Use multiples of 4. Card padding default `22px`; section gap default `24px`.

### Border Radius

| Size | Use |
|---|---|
| 6px | Pills, chips |
| 8px | Buttons, inputs, small cards |
| 10–12px | Member cards, event cards |
| 14px | Standard card |
| 16px | Side panel, large card |
| 24px | Hero / pattern sections |
| 999px | Chips, badges, pill buttons |

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(60,40,10,0.04), 0 1px 1px rgba(60,40,10,0.03);
--shadow-md: 0 4px 12px rgba(60,40,10,0.06), 0 2px 4px rgba(60,40,10,0.04);
--shadow-lg: 0 12px 32px rgba(60,40,10,0.08), 0 4px 12px rgba(60,40,10,0.05);
--shadow-gold: 0 6px 24px rgba(184,144,44,0.18);
```

### Pattern

Subtle 24×24 diamond lattice in `--pattern-color` (`rgba(184,144,44,0.06)` in warm). Applied via `.bg-pattern` utility — used on hero illustration backdrop and timeline section.

---

## Screens / Views

### 1. Landing (`page === "landing"`)

**Purpose**: Marketing entry point. Communicates the product and routes users to either the Tree or Clan creation flow.

**Layout** (max-width 1280px, centered):

1. **Hero section** — Two-column grid `1.05fr / 0.95fr`, min-height 580px, gap 48px.
   - **Left column**: Pill badge ("Phiên bản 2026 · Beta công khai", gold-glow background, gold dot), giant serif H1 with two italic accents in gold and brown ("Lưu giữ *cội nguồn*, kết nối *muôn đời*"), 17px body paragraph, two CTAs ("Khám phá cây gia phả" primary / "Lập dòng họ mới" ghost), stat strip with 4 columns ("12K+ Dòng họ", "1.4M Thành viên", "63 Tỉnh thành", "9 đời Sâu nhất") separated by top border.
   - **Right column**: Large SVG family tree illustration (520×560 viewBox) — see "Hero Tree Illustration" below. Backdrop has subtle diamond pattern at 0.6 opacity with -20px inset rounded square. Filter `drop-shadow(0 12px 32px rgba(184,144,44,0.12))`.

2. **Section ornament divider** — Centered: horizontal gradient line → lotus icon → uppercase "TÍNH NĂNG" label → lotus icon → horizontal gradient line.

3. **Features intro** — Centered H2 "Truyền thống gặp công nghệ" (42px serif) + 16px sub-paragraph.

4. **Feature cards grid** — 3 columns, 6 cards, gap 20px. Each card:
   - 44×44 rounded square icon container (10px radius) tinted with accent color (`color-mix(in srgb, var(--accent) 14%, transparent)`)
   - 20px serif title
   - 13.5px body description
   - Card lifts -2px on hover, border shifts to `--gold-soft`, shadow upgrades to `--shadow-md`
   - Six cards: Tree (gold), Link (jade), AI (terracotta), Calendar (crimson), Scroll (brown), Users (gold)

5. **Timeline section** — `--card-soft` background, 24px radius, 56px×48px padding, with diamond pattern at 0.4 opacity behind. Centered "Lịch sử" eyebrow + "176 năm — 6 thế hệ" H2. Vertical timeline with 4 alternating left/right markers (year, era eyebrow, event description), connected by a centered fading gold gradient vertical line. Each marker has a 14px gold dot with 4px bg + 1px gold-soft rings.

6. **Final CTA section** — Centered lotus icon, large serif H2 with two-line ca dao quote ("Cây có gốc..."), attribution, primary CTA "Bắt đầu hành trình".

**Hero Tree Illustration** (SVG, 520×560):
- Radial gold-glow halo behind the founder node
- Dashed diamond cartouche frame with 4 gold rhombus accents at midpoints
- 4-generation hierarchical tree with gold connector lines at 0.55 opacity
- Bloodline path drawn over connectors at full opacity, 2.5px stroke
- Gen 1 (founder): 38px radius node with nested 30px white inner, "CỤ TỔ" label + name + dates
- Gen 2: 3× 27px nodes
- Gen 3: 5× 22px nodes
- Gen 4/5: 8× 14px nodes, one is "BẠN" (active user) — gold-filled with animating pulse ring (r: 14→22, opacity 0.6→0)
- "BẠN" indicator: chevron up + 9px label below the highlighted node
- Bottom motto plaque with italic serif "Trung · Hiếu · Nhân · Nghĩa"
- Right-gutter generation labels (ĐỜI 1 · CỤ TỔ, ĐỜI 2, ĐỜI 3, ĐỜI 4·5)

---

### 2. Dashboard (`page === "dashboard"`)

**Purpose**: Home base for an authenticated clan member. Shows clan-wide activity, upcoming events, generation distribution, quick actions, AI suggestions.

**Layout** (max-width 1320px, centered):

1. **Page header row** — Left: eyebrow ("BẢNG ĐIỀU KHIỂN · Thứ Sáu, 15 tháng 5, 2026 — Mùng 10 tháng 4 ÂL"), serif H1 ("Chào buổi sáng, Minh Anh 🌸"), sub. Right: ghost "Tuần này ⌄" button + primary "Thêm thành viên" button.

2. **Stats row** — 4 equal columns, gap 16px. Each `StatCard`:
   - Radial accent gradient behind top-right corner
   - 36×36 tinted icon container
   - Up-right arrow icon button (top right)
   - 13px label / 42px serif value / 11px delta pill with accent color
   - Stats: "Tổng thành viên 247 · +12 tháng này" (gold), "Đời 9 · Từ 1850—2026" (jade), "Chi—Phái 6 · 3 nhánh chính" (terracotta), "Sự kiện sắp tới 4 · Giỗ Tổ trong 12 ngày" (crimson)

3. **Main grid** — 2 columns `1.6fr / 1fr`, gap 24px.

   **Left column**:
   - **Generation distribution card** — Title + legend (alive/deceased squares). Vertical bar chart, 180px tall, 9 bars (one per generation). Each bar:
     - Bar background = `--gold-pale` with `--gold-soft` border
     - Inner fill = gold gradient, height = `(alive/count) * 100%`
     - Number above (serif 13px), generation label below (10.5px muted)
   - **Activity feed card** — Title + "Xem tất cả →" link. Rows separated by `--line-soft`:
     - 32×32 tinted icon container (photo/edit/link/ai/add-user)
     - Inline activity sentence: `**Name** action **target** ` + time meta
     - Color coded: photo=jade, edit=gold, link=terracotta, ai=crimson, add=gold

   **Right column**:
   - **Quick actions card** — Gradient background (`--card` → `--gold-glow` at 200%). 2×2 grid of QuickAction buttons (Thêm thành viên, Tra cứu quan hệ, Tạo lễ giỗ, Tải gia phả cũ). Each: 34×34 icon, 13px label below.
   - **Upcoming events card** — 3 EventCard rows:
     - Left date block: tinted background, eyebrow month, serif 24px day number, year footer, 64px min-width
     - Right: type chip + "Còn N ngày" crimson chip if ≤14 days, 16px serif title, 12px meta (location · attendees)
   - **AI suggestion card** — Gold-tinted gradient, gold-soft border, with sparkle icon decorative at -30,-30 (12% opacity). "AI Trợ lý" chip, 18px serif title ("Phát hiện 2 thành viên có thể là một người"), 13px description with specific match details, primary "Xem chi tiết" + ghost "Bỏ qua" buttons.

---

### 3. Family Tree (`page === "tree"`)

**Purpose**: The core feature. Pan/zoom canvas of the entire 6-generation, 25-member tree. Click any member to open a detail panel.

**Layout** (full bleed, negative margins to escape content padding):

1. **Toolbar** (64px) — `--bg-elev` background, bottom border.
   - **Left**: Eyebrow + clan name, serif H1 "Toàn cây · 6 đời · 25 thành viên"
   - **Right** (all in a row):
     - Zoom group (boxed `--card-soft` with 1px border): − button / "72%" label / + button / divider / fit-to-screen button
     - Bloodline toggle: `btn-jade` when active, `btn-ghost` when off
     - Filter dropdown (ghost)
     - Primary "+ Thêm" button

2. **Canvas** — Fills remaining viewport.
   - **Background**: 24×24 radial-dot grid (`--card-border` dots at 0.8px) at 0.5 opacity
   - **Transform container**: Translates by `(pan.x, pan.y)`, scales by `scale`. Width/height match computed layout bounds.
   - **Generation watermark labels**: Per-generation row, "Đời N" rendered in 64px serif at 6% opacity behind cards.
   - **Connectors** (SVG overlay, pointer-events: none):
     - Spouse line: dashed terracotta horizontal between cards at `y = top + CARD_H/2`, with 8px white circle marker in the middle containing a 4px terracotta diamond
     - Parent-child: vertical line down from couple midpoint to a horizontal bus 36px below the couple, then horizontal bus across all children's x-midpoints, then vertical up to each child top edge
     - Bloodline edges drawn 2px solid gold; non-bloodline 1.2px `--card-border-strong` at 0.75 opacity
     - When bloodline mode is on, non-bloodline cards dim to 0.35 opacity, non-bloodline connectors dim to 0.25 opacity
   - **Member cards** (148×80, 12px radius):
     - Border: 1.5px. Default `--card-border`, on-bloodline `--gold-soft`, selected `--gold`
     - Shadow: selected = `--shadow-gold`, on-bloodline = `--shadow-md`, else `--shadow-sm`
     - Left edge: 3px gender accent stripe (brown=male, terracotta=female) at 0.7 opacity
     - "BẠN" badge: top-right -8/-8 offset, gold pill, 2px bg border
     - Top row: 30px gradient avatar circle (initials, white text 10px 700) + title eyebrow ("Cụ Tổ", "Ông", "Bà") + 13.5px serif name (last two words). Avatar desaturated/0.7 opacity if deceased.
     - Bottom row: 10.5px tabular dates ("1850 — 1920" or "1970") + status dot (jade for alive, faint for deceased; † cross for deceased)
     - Hover: lift -2px, border `--gold`

3. **Generation rail** (top-left overlay, 16px from edges):
   - `--card` with 14px radius, shadow-md
   - "THẾ HỆ" eyebrow + 6 buttons (one per gen)
   - Active gen: `--gold-glow` background, gold serif numeral
   - Each row: 16px serif number + "N người" muted count

4. **Legend** (bottom-left overlay):
   - Pill card listing: gold line = "Dòng huyết", dashed terracotta = "Hôn nhân", green dot = "Còn sống"

5. **Pan/zoom hint** (bottom-right):
   - "[Kéo] để di chuyển · [Lăn chuột] để phóng" with `kbd` styling
   - Shifts left by 372px when member panel is open

6. **Member detail panel** (right side, 340px wide, top/right/bottom 16px from edges):
   - 80px gradient header banner using the member's avatar gradient
   - Close button (X) top-right of banner
   - 84px avatar circle bleeding into header (-42px margin-top), 4px `--card` border
   - Title eyebrow → serif H2 name → meta line ("Đời N · Nam/Nữ · birth—death")
   - Status chips: alive/deceased + role
   - Honor card (if any): gold-glow bg, "CÔNG TRẠNG" eyebrow + 14px serif text
   - Note paragraph (if any)
   - Relations sections: "Cha mẹ", "Vợ"/"Chồng", "Con", "Anh chị em" — each as a list of compact 24px-avatar rows
   - Footer: primary "Xem hồ sơ" + icon-only link button

---

## Interactions & Behavior

### Navigation
- Sidebar items set `page` state, smooth scroll to top
- Topbar breadcrumb updates per page
- "Bạn" (active user) is `m23` = Nguyễn Minh Anh

### Family tree pan/zoom
- **Pointer drag** anywhere on canvas → pan. Cursor `grab`/`grabbing`.
- **Wheel** (without modifier) → pan in 2D
- **Ctrl/Cmd + Wheel** → zoom around cursor, clamped 0.25 ≤ scale ≤ 2
- **Zoom buttons** → multiply scale by 0.9/1.1
- **Fit-to-screen** → compute `scale = min(viewport/layoutSize) * 0.9`, center
- **On mount** → run fit-to-screen
- **Click member card** → set `selected`, open detail panel, do NOT pan
- **Click generation rail row** → select first member of that gen and center on them
- All `transform` transitions are 0.25s ease, suppressed during drag

### Layout algorithm (Reingold–Tilford-ish)
Recursive: each member's "unit width" = `2 * CARD_W + COUPLE_GAP` if married, else `CARD_W`. For each parent:
1. Recursively layout children, summing widths with `SIB_GAP` between siblings
2. If parent unit is wider than children's total span, distribute extra space evenly between child subtrees (shift all descendants)
3. Center parent unit over the children's final span
After full layout, normalize positions so origin is `(PAD, PAD)` and report `width`/`height`.

Constants: `CARD_W=148, CARD_H=80, COUPLE_GAP=16, SIB_GAP=28, GEN_GAP=90, HORIZ_BUS_OFFSET=36, PAD=48`.

### Bloodline computation
From the selected member, walk up `parents[0]` if it has parents in the clan, else `parents[1]`, until reaching the founder. Add every walked id to a Set. Non-bloodline members dim to 0.35; non-bloodline connectors dim to 0.25.

### Tweaks panel
- Floating in bottom-right when host has tweaks toggled on
- Theme radio: warm / paper / dark — updates `document.documentElement.dataset.theme`
- Quick-nav grid: 2×2 buttons for landing/dashboard/tree/members
- State persists via `__edit_mode_set_keys` postMessage to host

### Animations
- Page transitions: `.fade-in` = `fadeUp 0.4s ease both` (translateY 8→0, opacity 0→1)
- "BẠN" pulse on hero tree: SVG `<animate>` r 14→22→14 and opacity 0.6→0→0.6 over 2.4s loop
- Card hover lift: `transform: translateY(-2px)` + shadow upgrade, 0.2s ease
- Member panel: `fadeUp 0.25s ease both`

---

## State Management

### Top-level (`App` in `app.jsx`)
- `page: string` — current route id ("landing" | "dashboard" | "tree" | "members" | ... )
- `t: { theme, showOrnaments }` — tweaks state from `useTweaks` hook (persisted via postMessage to host shell)

### Family tree (`FamilyTreePage`)
- `selected: string | null` — currently selected member id (defaults to `"m23"`)
- `showBlood: boolean` — bloodline highlight mode (default true)
- `scale: number` — zoom level (clamped 0.25–2)
- `pan: { x, y }` — translation in CSS pixels
- `dragging: boolean` — true while pointer-drag is in progress
- `layout` — memoized from `layoutTree("m1")` — `{ positions: { id → {x, y} }, width, height }`
- `bloodline` — memoized Set of ids on the path to selected

### Data shape (see `data.jsx`)
```ts
type Member = {
  id: string;             // "m1" .. "m25"
  name: string;           // "Nguyễn Văn Trường"
  short: string;          // "NVT" — initials shown in avatar
  gender: "M" | "F";
  birth: number;
  death: number | null;   // null = alive
  gen: number;            // 1..6
  parents: string[];      // ids of biological parents (0 or 2 entries)
  spouse: string | null;
  role?: string;          // "Thủy tổ", "Trưởng nam"
  title?: string;         // "Cụ Tổ", "Cụ", "Ông", "Bà"
  honor?: string;         // "Hương Cống triều Tự Đức"
  note?: string;
  me?: boolean;           // marks current user (only m23)
};
```

---

## Assets

- **Icons**: All inline SVG, 24×24 viewBox, currentColor stroke, 1.75 stroke width. Defined in `design/src/icons.jsx`. Names: `home, dashboard, tree, users, link, book, calendar, sparkle, settings, search, bell, plus, arrow-right, arrow-up-right, chevron-down, chevron-right, branch, layers, photo, edit, ai, add-user, expand, fit, minus, pin, heart, scroll, globe, menu-grid, lotus`. Port to your icon system (Lucide, Heroicons, or custom).
- **Avatars**: Placeholder gradient initials, generated from `AV_PALETTES[seed % 6]`. **Replace with real portrait photos** in production. Card avatar size: 30px; panel avatar size: 84px.
- **Decorative SVG**: Hero tree illustration is hand-built inline SVG (see `design/src/landing.jsx::HeroTreeIllustration`). Diamond cartouche frame, gold halo, animated "BẠN" pulse — all in code, no external assets.
- **Fonts**: Loaded from Google Fonts via `<link>` in `index.html`. Self-host in production if needed.
- **Sample family data**: Fictional Nguyễn clan from Hà Tĩnh, 25 members across 6 generations. Replace with real data from your backend.

---

## Files

```
design/
├── index.html              — Entry. Loads React UMD, Babel, fonts, all .jsx
├── src/
│   ├── styles.css          — All design tokens (3 themes) + utility classes
│   ├── data.jsx            — Sample Nguyễn clan: MEMBERS, EVENTS, ACTIVITIES, STATS
│   ├── icons.jsx           — Icon component (~30 inline SVG icons) + VietOrnament
│   ├── shell.jsx           — Sidebar (logo + nav + user footer), Topbar (crumbs + search + icon buttons)
│   ├── landing.jsx         — Hero, feature cards, timeline, CTA, hero tree SVG
│   ├── dashboard.jsx       — Stats, generation bar chart, activity, events, AI card
│   ├── family-tree.jsx     — Layout algo, member cards, connectors, pan/zoom, side panel
│   ├── app.jsx             — Router state, theme effect, tweaks panel wiring
│   └── tweaks-panel.jsx    — Tweaks panel host (provided by design tool; do NOT port — replace with your own settings UI)
```

### Open the prototype locally

```sh
cd design/
python3 -m http.server 8080
# open http://localhost:8080
```

Or use any static server. Must be served over HTTP (not file://) for the JSX modules to load.

---

## Implementation Notes for Your Codebase

1. **Convert JSX files to real components** — split into per-component files matching your project layout.
2. **Replace CSS variables with your token system** — if using Tailwind, configure `theme.extend.colors` with the values above. Keep the three-theme structure via `[data-theme="..."]` selectors or Tailwind's `dark:` variant.
3. **Replace `useTweaks`** — the design tool's persistence layer. In production, use your settings store / user preferences.
4. **Member data** — replace the static `MEMBERS` array with a real API. The layout algorithm doesn't care about source, only the shape.
5. **The tree layout is O(N²)** in the worst case from `shiftSubtree`. Fine for hundreds of members; if you need thousands, switch to a single-pass Walker's algorithm.
6. **Pan/zoom uses CSS transforms**, not canvas. Works well to ~1000 cards. Beyond that, consider canvas/WebGL.
7. **Accessibility**: cards are `<div>`s with `onClick` — make them real `<button>` elements with keyboard handlers in production. Add ARIA roles to the tree (`role="tree"`, `role="treeitem"`). The icon buttons in the topbar already lack accessible names — add `aria-label`s.
8. **Mobile responsiveness** — the prototype is desktop-first (sidebar 248px, content min 1024px). On phones, collapse sidebar to a drawer and let the tree canvas fill the viewport.
9. **Tree print/export** — not implemented. Plan for "Print to PDF" and "Export PNG" of the tree view.
10. **Vietnamese localization** — all copy is hardcoded Vietnamese. Wrap in your i18n framework if you plan to support English / other languages.
