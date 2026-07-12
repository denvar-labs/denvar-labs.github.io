# Esports Visual Identity — KA ESPORTS

**Date:** 2026-07-11
**Phase:** 2, Stream 16
**Goal:** Transform the visual identity from generic SaaS/professional to esports/gaming, using a mixed approach (light mode stays professional, dark mode gets full neon treatment).

## Design Decisions

### Mixed Mode Approach
- **Light mode**: Keep existing professional palette mostly intact (accent `#4a86e8`). Add subtle gaming accents (Orbitron headings, refined card styles) but no neon glow.
- **Dark mode**: Full esports neon transformation. Background deepens to `#0d1117`, accent becomes cyan `#00d4ff`, surfaces get glow effects, borders become cyan-tinted.

Rationale: Light mode is used in bright environments (office, daytime) where neon is distracting. Dark mode is used in gaming/evening contexts where neon aesthetics shine.

### Typography
- **Headings**: Orbitron (Google Fonts, weights 400, 600, 700, 900) — geometric sans-serif with wide tracking, the standard esports/gaming font
- **Body**: Inter (system stack, unchanged) — remains clean and readable
- **Application**: h1-h3, navbar-brand, section-headings, hero titles

### Color Palette Additions (tokens.css)

New tokens added (no existing tokens removed):

```
--accent-glow: 0 0 20px rgba(0,212,255,0.4)
--accent-glow-strong: 0 0 30px rgba(0,212,255,0.6)
--accent-glow-text: 0 0 10px rgba(0,212,255,0.5)
--font-display: 'Orbitron', 'Inter', system-ui, sans-serif
```

Dark mode overrides:
```
--accent: #00d4ff
--accent-dark: #00b8e6
--accent-light: rgba(0,212,255,0.15)
--bg: #0d1117
--surface: #161b22
--surface-alt: #1c2333
--surface-hover: #21262d
--border: rgba(0,212,255,0.15)
--border-light: rgba(0,212,255,0.08)
```

### New File: css/esports.css

All gaming/esports visual overrides live here. Loaded after `style.css`. Scope is primarily dark-mode selectors (`body.dark .selector`).

**Hero (dark mode):**
- Animated gradient background: `linear-gradient(135deg, #0d1117 0%, #00d4ff11 50%, #0d1117 100%)`
- Background size 200% 200%, animation `heroGlow 8s ease infinite`
- Text glow on h1: `text-shadow: var(--accent-glow-text)`

**Panels/Cards (dark mode):**
- Border: `1px solid var(--border)`
- Hover: `box-shadow: var(--accent-glow)`, border becomes `rgba(0,212,255,0.3)`

**Data Tables (dark mode):**
- Header: gradient `linear-gradient(135deg, #00d4ff, #0088cc)` replacing solid blue
- Row hover: subtle cyan tint (`rgba(0,212,255,0.05)`)
- Sticky header: bottom border glow

**Navbar (dark mode):**
- Brand in Orbitron, font-size 1.2rem, letter-spacing 1px
- Border-bottom: `1px solid var(--border)`
- Active nav-link: `color: var(--accent)`, `text-shadow: var(--accent-glow-text)`

**Buttons (dark mode):**
- `.btn-primary`: background `var(--accent)` (#00d4ff), hover glow
- `.btn-secondary`: border `var(--border)`, hover border glow

**Section headings:**
- Orbitron font-family, uppercase, wider letter-spacing (2px)

### Animations (Moderate Intensity)

New keyframes in `esports.css`:
1. `heroGlow` — slow gradient shift for hero backgrounds (8s cycle)
2. `pulseGlow` — subtle opacity pulse for decorative neon accents
3. No particles, no scan lines, no animated backgrounds beyond hero

### Pages to Update (21 total)

1. Add Google Fonts preconnect + Orbitron link to <head> of all 21 pages + any root pages
2. Add `<link rel="stylesheet" href="/css/esports.css">` to all pages

### Backward Compatibility & Reversibility

- All changes are additive (new CSS file, new tokens, new font link)
- Existing classes unchanged, no HTML class changes needed
- To revert: delete `esports.css` link, remove Orbitron link, revert token changes
- Git history allows full `git checkout` rollback

### Performance Impact
- Orbitron: ~8KB woff2 (negligible)
- esports.css: estimated ~3-5KB
- One additional HTTP request (or inline for perf)
