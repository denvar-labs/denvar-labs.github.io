# Landing Page Enhancements — KA ESPORTS

## Overview

Series of visual and UX improvements to the KA ESPORTS landing page (ka-esports/index.html): activity feed, hero texturing, scroll animations, search, and sparkline stats.

---

## 1. Feed de Actividad Reciente

**Location:** Between stats-bar and section grid.

**Stream Card (conditional):**
- Visible only when `fetchLiveStatus()` returns ≥1 live streamer
- Layout:
  ```
  ┌──────────────────────────────────────────┐
  │ 📺 En Vivo Ahora              🔴 EN VIVO│
  │ DenvarSC · 12 viewers · Twitch          │
  │ [▶ Ver Stream →]                        │
  └──────────────────────────────────────────┘
  ```
- Phosphor icon: `ph-broadcast` in card header
- Green LIVE badge with pulse animation (reuse `.live-badge` from streams.css)
- Click card/CTA → opens streamer channel URL
- If no live streamers, the card is not rendered

**Match List:**
- Fetches latest `MATCH_REPORTS_YYYY_MM` sheet
- Parses match blocks (reuse logic from `renderMatchReports`)
- Shows last 4-5 matches
- Each row format:
  ```
  🏁 Grey0__ venció a FX6400  +12.5 ⭐
     hace 2 horas
  ```
- Winner name + Δ Rating in green (`delta-positive` class)
- Loser name in `delta-negative` if applicable
- Relative timestamp (calculo JS: "hace X horas", "ayer", etc.)
- If no match data, section shows "No hay partidas este mes"
- Link "Ver todas →" at bottom → `match-reports.html`

---

## 2. Hero Visual Identity

**Checker pattern overlay:**
- CSS `::before` pseudo-element on `.hero-landing`
- Repeating checker flag SVG (public domain racing pattern)
- Opacity: 0.03-0.05, pointer-events: none
- Pattern size ~40px squares

**Title glow animation:**
- `.hero-landing h1` with `background: linear-gradient(90deg, #fff, #ffd700, #fff)`
- `background-clip: text; -webkit-background-clip: text; color: transparent`
- `background-size: 200% auto`
- CSS animation: `shimmer 3s linear infinite` (moves gradient position)
- Only in light mode; dark mode keeps current style

**CTA button hover:**
- `hero-btn:hover` gains diagonal gradient overlay via `::after`
- `transform: translateY(-2px)` kept, plus `box-shadow` intensifies

---

## 3. Scroll Reveal (Section Cards)

**IntersectionObserver-based:**
- All `.section-card` elements in `.section-grid`
- Initial state: `opacity: 0; transform: translateY(24px)`
- When intersecting: `opacity: 1; transform: translateY(0)` over 500ms ease-out
- Stagger: each card gets `transition-delay: calc(var(--card-index) * 80ms)`
- Cards below fold that are visible on load animate in immediately
- If IntersectionObserver not supported, show all cards (no-op)

**Icon hover animation:**
- `.section-card:hover .section-card-icon i` gets `animation: icon-pop 0.3s ease`
- Keyframes: `0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)}`
- Only on non-touch devices (prefers-reduced-motion respected)

---

## 4. Búsqueda Global de Jugadores

**Location:** Hero section, below CTA buttons.

```
🔍 Buscar jugador...  [input field]
```

- Phosphor `ph-magnifying-glass` icon inside input (left)
- Fetches `PLAYERS` sheet data on page load
- Filters players as user types (case-insensitive substring match)
- Dropdown shows max 8 results:
  ```
  Grey0__          ⭐ 1850
  FX6400           ⭐ 1720
  DenvarSC         ⭐ 1680
  ```
- On click/enter → navigate to `player-profile.html?player=Name`
- Debounce: 200ms before filtering
- Click outside dropdown closes it
- Keyboard: arrow keys navigate, Enter selects

---

## 5. Stats Bar — Trend Arrows

**Location:** Below each `.stat-value` in the stats-bar.

- Small span with trend data:
  ```
  <div class="stat-trend trend-up">▲ +12</div>
  ```
- Calculation: compare current value with previous month's data
- If previous data unavailable, show nothing
- Green (`trend-up`): positive change
- Red (`trend-down`): negative change
- Gray (`trend-flat`): no change
- Implements a simple month-over-month comparison

---

## 6. Performance & A11y Notes

- IntersectionObserver only loads if supported (no polyfill needed)
- All animations respect `prefers-reduced-motion`
- Search input has proper `aria-label`, `role="combobox"`, `aria-autocomplete="list"`
- Scroll reveal uses `will-change: transform, opacity` on observed elements
- Stream card status uses `aria-live="polite"` for screen readers

---

## Files Modified

- `ka-esports/index.html` — inline styles + embedded <script> for all features
- `css/esports.css` — if styles grow beyond inline capacity

## Data Dependencies

- `fetchSheetData('PLAYERS')` — for search + sparkline baseline
- `fetchSheetData('MATCH_REPORTS_YYYY_MM')` — for match feed
- `fetchLiveStatus()` — for stream card
- `fetchSheetList()` — to find latest MATCH_REPORTS sheet
