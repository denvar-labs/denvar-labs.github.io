### Task 4: Add Orbitron + esports.css to ka-esports/*.html (21 pages)

**Files:**
- Modify: All 21 files in `ka-esports/` that have `<link rel="stylesheet" href="../css/style.css">`

**Interfaces:** Adds Orbitron font + esports.css stylesheet to 21 HTML pages in ka-esports/.

For each page, after the line `<link rel="stylesheet" href="../css/style.css">`, insert these 4 lines:

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/esports.css">
```

Pages to update (all in `ka-esports/`):
- `awards.html`
- `community.html`
- `faq.html`
- `global-leaderboard.html`
- `h2h-details.html`
- `hall-of-fame.html`
- `index.html`
- `match-reports.html`
- `matches.html`
- `monthly-leaderboard.html`
- `penalties.html`
- `player-comparison.html`
- `player-profile.html`
- `players.html`
- `rage-quit-rules.html`
- `rage-quit-stats.html`
- `seasons-report.html`
- `simulator.html`
- `streams.html`
- `suspension-list.html`
- `tournaments.html`

- [ ] **Steps 1-21: For each page**, find `<link rel="stylesheet" href="../css/style.css">` and insert the 4 lines after it.

- [ ] **Step 22: Verify** — spot-check 2-3 files to confirm insertion is correct.

- [ ] **Step 23: Commit**

```bash
git add ka-esports/*.html
git commit -m "feat: add Orbitron font and esports.css to all ka-esports pages"
```
