# Final proposed-copy layout validation

Design-only, 2026-10-23. Desktop Chromium 154.0.8037.57. No real mobile-browser compatibility claim.

| CSS viewport | TH: Fresh/Incomplete/Completed/Disclaimer | EN: same four states | JA: same four states | Normal + 200% text |
|---|---|---|---|---|
| 320×568 | Pass | Pass | Pass | Pass, scrolling permitted |
| 360×800 | Pass | Pass | Pass | Pass, scrolling permitted |
| 390×844 | Pass | Pass | Pass | Pass, scrolling permitted |
| 430×932 | Pass | Pass | Pass | Pass, scrolling permitted |

96 layout cases passed horizontal overflow, text-range horizontal bounds, major-section overlap, visible 48px control checks and disclaimer acknowledgment reachability. Nine additional language/state copy assertions confirm intended proposed CTA/support/menu/reset labels, unchanged reset body and localized selector group. Twenty-four additional menu/reset-dialog cases (3 languages × 4 widths × 2 scales) passed horizontal overflow, 48px buttons and confirm-button scroll reachability. All three locales also passed actual Home/disclaimer switching and namespaced persistence checks. Same-tab reload restored Japanese.

200% means computed font sizes doubled for a stress test, not native OS scaling or pinch zoom. Screenshots use 2× pixel density. Vertical scrolling is expected at larger text sizes and on short screens; no safety text is removed to force a one-screen layout.

Thai headings, controls and warning render in actual IBM Plex Sans Thai faces; Latin in Manrope; Japanese glyphs in Noto Sans CJK JP on this host. The local controlled test uses official local Thai/Latin font files. The transfer candidate instead uses the existing production Google Fonts stylesheet and therefore needs a network connection to retrieve those families; font delivery in a reviewer's browser is not verified here. Japanese Apple/Windows fallback metrics remain unverified.

Representative normal/enlarged Thai, English and Japanese renders were visually inspected, including tone marks, multiline controls and Japanese heading breaks. Not all 120 render cases were manually inspected. No glyph clipping observed in inspected samples; geometric checks and font presence do not substitute for native editorial and shaping review. New Japanese text remains proposed pending native editorial review.

Still needed: physical Android Chrome, Samsung Internet, iOS Safari; actual OS scaling, browser bars and safe-area transitions; native Thai/Japanese editorial/rasterization review; screen-reader reading order/focus behavior; offline/blocked-font behavior. This revision does not revalidate prior landscape cases after the final copy changes. Production persistence/session/clinical flows are not executed or altered by these mockups.
