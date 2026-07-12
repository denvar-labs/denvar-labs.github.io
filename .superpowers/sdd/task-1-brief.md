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

Run: `node -e "const fs = require('fs'); const css = fs.readFileSync('css/tokens.css','utf8'); console.log('OK,', css.length, 'bytes');"`
Expected: OK

- [ ] **Step 4: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add neon tokens for esports visual identity"
```
