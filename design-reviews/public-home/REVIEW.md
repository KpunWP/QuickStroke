# Final Public Home typography and multilingual proposal

2026-10-23. DESIGN ONLY; implementation not authorized. All new translations are proposed for review, not approved production copy. The separate mockup now shows intended final TH/EN/JA action, helper, menu and reset-dialog wording. Existing emergency, diagnostic limitation and disclaimer wording remains verbatim. COPY-MAPPING.md is the complete 35-row source/status mapping. No production locale files, application logic, tests, Research/Consent behavior, settings, branch or deployment were changed.

## Typography review

Thai uses IBM Plex Sans Thai 400/600/700, actual font faces with font-synthesis:none; no negative letter spacing. Manrope is used for suitable Latin text and brand. Thai heading 28–30px / 1.5; primary 24–26px / 1.55; module labels 16px / 1.65; progress and supporting text 14px / 1.75; warning 16px / 1.8; footer 14px / 1.8; disclaimer title 24px / 1.6 and body 16px / 1.85. These sizes are in rem in the prototype and can enlarge. Real 600/700 weights replace requests for nonexistent 750/850 Thai faces. Button height grows with content rather than clipping marks or enforcing one line. Icons sit separately from text baselines; text within each role uses consistent font/line-height.

Representative Thai renders at 320/360px, normal and enlarged sizes, show intact tone marks, no overlapping glyphs, comfortable button baselines and readable emergency emphasis. The narrow warning wraps naturally without truncating 1669 or the urgency wording. Full native Thai visual/editorial signoff and physical-device rasterization remain necessary.

English heading 28px / 1.4, primary 24px / 1.5; Japanese heading 28px / 1.55, primary 24px / 1.65. Other body roles match the Thai size scale. Japanese stack: Manrope (Latin), Noto Sans CJK JP, Hiragino Kaku Gothic ProN, Yu Gothic, Meiryo, sans-serif. The host actually rendered Noto Sans CJK JP Regular/Bold. Japanese normal/strict line breaking and phrase grouping prevent a lone final character in the heading; grouping still permits wrapping at enlarged sizes. No break-all, forced tiny type, ellipsis or clipped line containers. Noto glyph coverage and representative rendered samples are verified, not every Apple/Windows fallback.

All newly proposed Japanese wording in COPY-MAPPING.md requires native-language editorial review. Specifically review チェック versus screening terminology, 3項目を最初から確認 as restarting a full round, and 最初からやり直す for discarding current results and returning Home. Existing Japanese safety copy is not rewritten. Existing English/Japanese emergency resources direct users to local emergency services; only Thai retains production 1669 specificity.

## Public-only language persistence recommendation

Observed production behavior:
- index.setLang calls i18n.setLocale(persist:true, apply:true), writing localStorage.quickstroke_locale and legacy localStorage.fast_lang; Home additionally writes sessionStorage.fast_lang.
- Home starts from sessionStorage.fast_lang or configured default; it does not use the generic i18n initializer's localStorage/navigator resolution. New tabs may therefore return to Thai despite an earlier persistent English/Japanese selection.
- jssf-consent.html explicitly sets sessionStorage.fast_lang to th on start and resume (around lines 501 and 544). This is deliberate protocol behavior; do not replace it with a general remembered preference.

Recommended FUTURE implementation, subject to separate approval:
1. Resolve existing app mode and complete its current safe transition guards FIRST. Only apply a Public preference resolver after Public mode is confirmed. Do not run it on Consent or Research routes, or on protected Research recovery.
2. Add a Public-only validated locale preference (for example quickstroke_public_locale), with a separate Public-tab override. Resolve explicit Public user selection/tab preference, then persisted Public preference, then configured default (Thai for the QR). Do not treat shared fast_lang from a Research/Consent handoff as an explicit Public preference. Do not auto-switch the QR by navigator.language in this revision.
3. Migration is optional and should be decided explicitly: the existing persistent keys do not record whether a choice came from Public or another mode. Safest initial behavior is no automatic import; let the user's first Public selection create the new preference.
4. Render the resolved locale through the existing i18n API with persist:false so initialization does not overwrite shared persistent keys. In confirmed Public mode only, retain the current sessionStorage.fast_lang handoff needed by downstream Public test pages. User selection saves only the new Public preference/tab key; keep Research/Consent persistence untouched. Audit downstream Public pages before adopting this handoff; do not silently refactor the shared i18n module.
5. Storage access should be guarded: fall back to an in-memory selected locale if unavailable, without losing visible language selection. Do not change any consent, collection or media behavior.
6. Keep the once-per-tab disclaimer acknowledgment semantics; changing language while it is open updates its content without acknowledging or dismissing it.

The current mockup preserves the OBSERVED production-like tab/default restoration using isolated qs_mock_* keys. It does not implement this recommended resolver. It writes only preview-namespaced local/session values and keeps production storage untouched. ?lang= is a review-only override. Thus visual approval does not implicitly approve a persistence change.

Required future persistence regressions: fresh QR defaults Thai; explicit Public choice survives reload/new tab using the proposed Public key; storage unavailable still allows switching; Research/Consent start/resume remain Thai; protected Research sessions cannot be relabeled Public; returning safely to Public may restore its own preference without altering the Research record. No such production changes are included here.

## Prototype behavior and translation scope

Three 48px TH/EN/JA choices with native accessible names remain visible. All visible Home labels, module statuses, Individual chooser, warning, footer, More options, reset title/body/actions and first-use disclaimer update together. Product name and language names are intentionally stable. Synthetic completion is progress, not a clinical result. Reset preview does not erase data; primary/result controls do not run real assessments. Completed Test again and the separate Start over confirmation retain distinct meanings. Emergency interaction remains inert in the mockup; production call behavior must be preserved when implementation is eventually authorized.

Production limitations observed: remote font dependency; unsupported Thai weight requests and negative heading tracking; no explicit Japanese font stack; whole-pack English fallback but no automatic per-key English fallback; some errors/staff labels outside Home remain hardcoded. These findings are not changes to clinical or localization policy.

## Proposed GitHub transfer

Destination branch: design/public-home-visual-review-20261023. No commit or push authorized yet. Exact manifest: the two existing review HTML files updated, plus COPY-MAPPING.md, REVIEW.md and VALIDATION.md added, all under design-reviews/public-home/. Five files total. No fonts, screenshot images, source locale JSON, generated JSON, scripts, credentials, settings or dependencies copied.

To honor the prior no-bundled-fonts constraint, the transfer candidate uses the exact existing production Google Fonts stylesheet for IBM Plex Sans Thai/Manrope instead of bundled local font URLs. This is an explicit network dependency on fonts.googleapis.com and fonts.gstatic.com, not a self-contained font package. Japanese still uses its declared system stack. Font failure/offline fallback and cross-platform Japanese consistency remain limitations; do not claim identical metrics when fonts cannot load. The local typography review uses official locally loaded Thai/Latin families for controlled inspection, with their license files retained outside GitHub.

The transfer gallery links only to included HTML and Markdown files. It does not refer to excluded screenshots. Opening via local static server after downloading the branch is supported; GitHub blob links show source, not a deployed live app. No deployment or PR is proposed.
