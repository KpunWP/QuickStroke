# Phase B independent visual-review materials

Mockup source commit: `c8de64a5e11fad296826be62b838f576231f5ebf`.
The publication follow-up adds only this directory. It does not redesign the
mockups or change the application.

- [Portable interactive gallery ZIP](phase-b-responsive-gallery.zip): extract
  the entire archive, then serve its `public-modules` directory. No build needed.
- [50 browser-rendered screenshots ZIP](phase-b-screenshots.zip): original
  PNGs, two contact sheets and a filename guide. Approximately 22.6 MB.
- [Four principal English screens](phase-b-principal-screens.png): Result,
  Face countdown, Arm left and Speech listening; full-page captures.
- [All 24 English states contact sheet](phase-b-english-contact-sheet.png):
  grouped in Result / Face / Arm / Speech columns, with explicit state labels.

Contact sheets uniformly resize full-page screenshots without cropping their
content. They are visual-review aids, not proof of device usability or a
substitute for opening individual full-resolution PNGs.

## Open the gallery after downloading

Extract the gallery ZIP. From the extracted `public-modules` directory:

```sh
python3 -m http.server 8772 --bind 127.0.0.1
```

Open `http://localhost:8772/gallery.html` in your browser. All HTML, CSS, JavaScript
and Arm illustrations resolve relatively. Served-gallery filters, language
switching, an Arm image and simulated state navigation were rechecked with
external fonts blocked; fallback rendering works.

Direct double-click/file:// opening could not be verified because the managed
Chromium browser blocks file:// navigation by policy. A local HTTP server is the
verified route. Google Fonts remains an optional external typography dependency;
without it the gallery renders with system fallbacks, which will not exactly
match the font-fixture screenshots. No fonts or credentials are bundled.

GitHub blob links show source; GitHub does not render these HTML files as an
interactive website. No GitHub Pages, Vercel or other deployment is created.
Download the ZIP for interaction, or use the PNGs for immediate visual review.

## Scientific and UX review status

- Result retains explicit non-diagnostic and emergency copy. Completion is not
  medical clearance; the complete example requires review, and unassessable
  Speech remains an incomplete overall result.
- Face imagery is a labelled illustration. Countdown/instructions are outside
  it and facial features are unobscured. Live video geometry is not validated.
- Arm reuses production left/right one-handed, phone-upright illustrations.
  No absolute-arm-angle or numeric drift gauge is introduced. Anatomical side,
  screen-facing direction and real holding comprehension still require an
  expert/participant visual check; source reuse is not independent validation.
- Speech shows separate countdown, listening, retry and unable states. All
  transcript/results are synthetic, and no microphone/ASR is running.
- TH/EN/JA line wrapping passed simulated layout checks. Native-language
  editorial review, OS typography and real smartphone testing remain necessary.
- Visual approval remains pending. Existing PR #106 and its Preview are unchanged.
