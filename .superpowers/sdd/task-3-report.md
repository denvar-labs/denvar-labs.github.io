# Task 3 Report: Add Orbitron + esports.css to root pages

## Status: DONE

## Commits
- `656c355` feat: add Orbitron font and esports.css to index.html

## Summary
Inserted the 4 link tags (2 preconnect, 1 Orbitron stylesheet, 1 esports.css) after `css/style.css` in `index.html`. File verified, looks correct.

## Notes
- CSP does not currently allow fonts from `fonts.gstatic.com` (`default-src 'self'`). Orbitron may not render until CSP is updated to add `font-src https://fonts.gstatic.com` or a `default-src` exception.
