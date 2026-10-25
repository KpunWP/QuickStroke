# Actual adaptive Public Result captures

Real application, synthetic local Public fixtures; no participant results or
live media. Full-page Chromium screenshots, device scale factor 2. The source
filename records language, fixture, viewport width and 100%/200% root text scale.

- `contact-sheet.png`: three columns, invalid result, two-column and single-column
  fallbacks. Full-height captures uniformly scaled without clinical-content edits.
- `en-ok/review/urgent/invalid-360-1.png`: standard three-column scenarios.
- `en-history-360-1.png`: full-width history fallback.
- `en-review-430-2.png`: two columns at 200% text.
- `ja-invalid-320-2.png`: single column at 200% text.
- `th-ok-360-1.png`, `ja-ok-360-1.png`: multilingual three-column examples.

Official local Plex Thai/Manrope fixtures substituted for Google Fonts CSS;
Japanese uses system fallbacks. Real-device font delivery, native text scaling
and screen-reader behavior remain UAT. See ../../public-result-grid-refinement.md.
