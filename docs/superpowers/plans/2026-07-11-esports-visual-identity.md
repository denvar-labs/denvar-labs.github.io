# Esports Visual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add esports/gaming neon visual identity to dark mode, keeping light mode professional.

**Architecture:** Three additive changes — tokens.css gets neon CSS variables, new css/esports.css holds all gaming overrides (dark-mode only), all 23 HTML pages get Orbitron font link + esports.css link.

**Tech Stack:** Vanilla CSS custom properties, Google Fonts (Orbitron), no JavaScript changes.

## Global Constraints

- All changes must be additive — never modify or remove existing CSS variables or classes
- css/esports.css is loaded AFTER style.css so it can override when needed
- Orbitron weights loaded: 400, 600, 700, 900
- Every page must get BOTH the Orbitron font link AND the esports.css link
- Dark mode selectors use `body.dark` prefix — no HTML class changes needed
- No particles, scan lines, or full-screen animations (moderate intensity only)

---

### Task 1: Add neon tokens to tokens.css

**Files:**
- Modify: `css/tokens.css`

**Interfaces:** Consumes: nothing. Produces: CSS variables consumed by esports.css.

- [ ] **Step 1: Add font-display token and glow tokens after typography section**

Insert after line 116 (`--text-3xl` line):

```css
  /* ===== E-SPORTS/DISPLAY ===== */
  --font-display: 'Orbitron', 'Inter', system-ui, sans-serif;
  --accent-glow: 0 0 20px rgba(0, 212, 255, 0.4);
  --accent-glow-strong: 0 0 30px rgba(0, 212, 255, 0.6);
  --accent-glow-text: 0 0 10px rgba(0, 212, 255, 0.5);
```

- [ ] **Step 2: Update dark mode accent color**

Change `body.dark` section — replace `--accent: #6ba3f8;` with:
```css
  --accent: #00d4ff;
  --accent-dark: #00b8e6;
  --accent-light: rgba(0, 212, 255, 0.15);
```

Also darken the background and surfaces in `body.dark`:
- `--bg: #0d1117;`
- `--surface: #161b22;`
- `--surface-alt: #1c2333;`
- `--surface-hover: #21262d;`
- `--border: rgba(0, 212, 255, 0.15);`
- `--border-light: rgba(0, 212, 255, 0.08);`

- [ ] **Step 3: Verify tokens.css loads without errors**

Run: `node -e "const fs = require('fs'); const css = fs.readFileSync('css/tokens.css','utf8'); console.log('OK,', css.split('\\n').length, 'lines');"`
Expected: OK, ~170 lines

- [ ] **Step 4: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add neon tokens for esports visual identity"
```

---

### Task 2: Create css/esports.css

**Files:**
- Create: `css/esports.css`
- Test: verify in dark mode in browser

**Interfaces:** Consumes: CSS variables from tokens.css. Produces: gaming visual overrides active in dark mode.

- [ ] **Step 1: Create css/esports.css**

```css
/* ===== KA ESPORTS - Esports Visual Identity ===== */
/* Gaming/neon overrides for dark mode — additive, loaded after style.css */

/* ===== HERO GLOW (dark mode) ===== */
body.dark .hero {
  background: linear-gradient(135deg, #0d1117 0%, rgba(0, 212, 255, 0.07) 50%, #0d1117 100%);
  background-size: 200% 200%;
  animation: heroGlow 8s ease infinite;
  border: 1px solid var(--border);
}

@keyframes heroGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

body.dark .hero h1 {
  text-shadow: var(--accent-glow-text);
}

body.dark .eyebrow {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent);
}

/* ===== PANEL/CARD GLOW (dark mode) ===== */
body.dark .panel {
  border-color: var(--border);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

body.dark .panel:hover {
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: var(--accent-glow);
}

body.dark .panel-heading {
  border-bottom-color: var(--border);
}

/* ===== DATA TABLE (dark mode) ===== */
body.dark .data-table th {
  background: linear-gradient(135deg, #00d4ff 0%, #0088cc 100%);
  border-bottom: none;
}

body.dark .data-table tbody tr:hover td:not([class*="rank-"]) {
  background-color: rgba(0, 212, 255, 0.05);
}

/* ===== NAVBAR (dark mode) ===== */
body.dark .navbar-brand {
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: 1px;
}

body.dark .navbar {
  border-bottom-color: var(--border);
}

body.dark .nav-link.active {
  color: var(--accent);
  text-shadow: var(--accent-glow-text);
}

/* ===== BUTTONS (dark mode) ===== */
body.dark .btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
  font-weight: 700;
}

body.dark .btn-primary:hover:not(:disabled) {
  background: #00e6ff;
  box-shadow: var(--accent-glow);
  border-color: #00e6ff;
}

body.dark .btn-secondary {
  border-color: var(--border);
}

body.dark .btn-secondary:hover:not(:disabled) {
  border-color: rgba(0, 212, 255, 0.3);
}

/* ===== SECTION HEADINGS (dark mode) ===== */
body.dark .section-heading {
  font-family: var(--font-display);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ===== QUICK LINKS SIDEBAR (dark mode) ===== */
body.dark .quick-links a:hover {
  background: var(--accent);
  color: #000;
  box-shadow: var(--accent-glow);
}

/* ===== BADGE (dark mode) ===== */
body.dark .badge-primary {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent);
}

/* ===== PAGINATION (dark mode) ===== */
body.dark .page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #000;
  box-shadow: var(--accent-glow);
}

/* ===== DARK TOGGLE (dark mode — already neon-matched) ===== */
body.dark .dark-toggle {
  background: var(--accent);
}

/* ===== STATE BOXES (dark mode) ===== */
body.dark .state-box.state-error {
  border-color: rgba(229, 57, 53, 0.3);
}

body.dark .retry-btn {
  background: var(--accent);
  color: #000;
}

body.dark .retry-btn:hover {
  box-shadow: var(--accent-glow);
}

/* ===== REDUCED MOTION ===== */
@media (prefers-reduced-motion: reduce) {
  body.dark .hero {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify file syntax**

Run: `node -e "const fs = require('fs'); const css = fs.readFileSync('css/esports.css','utf8'); console.log('OK,', css.split('\\n').length, 'lines');"`
Expected: OK, ~130 lines

- [ ] **Step 3: Commit**

```bash
git add css/esports.css
git commit -m "feat: add esports.css with neon dark mode overrides"
```

---

### Task 3: Add Orbitron + esports.css to root pages

**Files:**
- Modify: `index.html`

**Interfaces:** Consumes: esports.css (Task 2), tokens.css (Task 1). Produces: Orbitron font loaded, esports.css linked.

- [ ] **Step 1: Add Orbitron preconnect + font link + esports.css to index.html**

Insert after the `<title>` line, before `</head>`:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/esports.css">
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add Orbitron font and esports.css to index.html"
```

---

### Task 4: Add Orbitron + esports.css to ka-esports/*.html (21 pages)

**Files:**
- Modify: All 21 files in `ka-esports/` with `<link rel="stylesheet" href="../css/style.css">`

**Interfaces:** Same as Task 3 but with adjusted paths (`../css/esports.css`).

- [ ] **Step 1-21: For each page, insert after the style.css `<link>` line:**

After `<link rel="stylesheet" href="../css/style.css">`, add:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/esports.css">
```

Pages to update:
- `ka-esports/index.html`
- `ka-esports/global-leaderboard.html`
- `ka-esports/monthly-leaderboard.html`
- `ka-esports/players.html`
- `ka-esports/player-profile.html`
- `ka-esports/player-comparison.html`
- `ka-esports/matches.html`
- `ka-esports/match-reports.html`
- `ka-esports/h2h-details.html`
- `ka-esports/tournaments.html`
- `ka-esports/seasons-report.html`
- `ka-esports/awards.html`
- `ka-esports/hall-of-fame.html`
- `ka-esports/rage-quit-stats.html`
- `ka-esports/rage-quit-rules.html`
- `ka-esports/penalties.html`
- `ka-esports/suspension-list.html`
- `ka-esports/community.html`
- `ka-esports/faq.html`
- `ka-esports/simulator.html`
- `ka-esports/streams.html`

- [ ] **Step 22: Commit**

```bash
git add ka-esports/*.html
git commit -m "feat: add Orbitron font and esports.css to all ka-esports pages"
```

---

### Task 5: Add Orbitron + esports.css to ka-esports/admin/penalty.html

**Files:**
- Modify: `ka-esports/admin/penalty.html`

**Interfaces:** Same pattern but with `../../css/esports.css`.

- [ ] **Step 1: Add links to penalty.html**

After `<link rel="stylesheet" href="../../css/style.css">`, add:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../css/esports.css">
```

- [ ] **Step 2: Commit**

```bash
git add ka-esports/admin/penalty.html
git commit -m "feat: add Orbitron font and esports.css to admin/penalty.html"
```

---

### Task 6: Visual verification

**Files:** None

- [ ] **Step 1: Open the site and toggle dark mode**

Open `ka-esports/index.html` in browser, toggle dark mode. Verify:
- Hero has animated gradient (subtle)
- Panels/cards have cyan border with hover glow
- Data table headers are cyan gradient
- Navbar brand shows Orbitron
- Section headings show Orbitron
- Buttons are cyan neon
- Quick links hover shows cyan

- [ ] **Step 2: Verify light mode is unaffected**

Toggle back to light mode. Verify:
- Hero is still solid blue
- Panels are still clean white
- Everything looks identical to before

- [ ] **Step 3: Test reduced motion**

If possible, enable `prefers-reduced-motion: reduce` in devtools. Verify hero animation stops.
