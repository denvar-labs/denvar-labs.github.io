### Task 3: Add Orbitron + esports.css to root pages

**Files:**
- Modify: `index.html`

**Interfaces:** Consumes: esports.css (Task 2), tokens.css (Task 1). Produces: Orbitron font loaded, esports.css linked.

- [ ] **Step 1: Add Orbitron preconnect + font link + esports.css to index.html**

After the `<link rel="stylesheet" href="css/style.css">` line (line 12), insert:

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
