# QuickStroke JSSF 2026 — Public modules design proposal

Design only. Base: PR #106 commit `87388eb7dd39be24663e0364f66193aa72481966`.
Branch: `design/public-modules-phase-b-20261024`.

Open `gallery.html` through a local static server. For example, from this directory:

```sh
python3 -m http.server 8772 --bind 127.0.0.1
```

Then open `http://localhost:8772/gallery.html`. No build or dependency installation
is required. The gallery links 24 states and offers TH/EN/JA, 320/360/390/430px,
100/200% text and module filters. Open a screen directly for genuine fluid width;
gallery frames contract if the containing card is narrower than the selected
width, and their own content scrolls. There is no fixed iPhone shell or OS UI.

Example deep link: `index.html?module=face&state=countdown&lang=en&text=200`.
English is the default review language. The language/text/state are carried in
the mockup URL, not application storage. Reload preserves that URL. Review chrome
is deliberately English; all patient-facing content and safety text switch.

## Design brief and system

A calm clinical flow: orientation, one instruction, working surface, readable
status, then the permitted action. Result is first in the gallery. Use the same
paper `#f4f7fa`, ink `#172536`, clinical blue `#0d58b8`, warning amber and coral
roles as Public Home. No all-clear green. Cards use 16–32px radii, restrained
shadows, 16px minimum page gutters and 8px-based space. Header/language controls
wrap naturally. Main content is fluid with a 480px maximum and safe-area-aware
padding. Pages scroll; controls and safety warnings are not sticky overlays.

IBM Plex Sans Thai for Thai; Manrope for suitable Latin text; Hiragino Kaku Gothic
ProN / Yu Gothic / Noto Sans CJK JP / Meiryo fallbacks for Japanese. Existing
Google Fonts family import is reused without adding a new font service or
bundled fonts. Text defaults to 16px, 26–28px main headings, 20px primary actions,
14px status/support, 12px simulation annotations; generous 1.5–1.8 line heights
and no negative Thai/Japanese tracking. The enlargement switch doubles text
through em-based sizing without reducing it to fit. Touch targets are at least
48px. Content-based centered primary actions grow and wrap; countdowns reserve
separate flow space. Reduced-motion users receive no animation (the only normal
motion is a 1px button press).

Icons use one rounded outline family matching Home. State uses text and symbols,
not only color. No computed clinical values, risk percentages, scores or angles
are shown. A synthetic badge appears on every screen; all result/transcript
examples carry explicit synthetic-data annotations.

## Result first

- Completed example: 3/3 usable checks, Face requires review; summary says further
  review, never medical clearance. Module statuses are scannable rows.
- Incomplete: 1/3 usable checks; untested modules are distinct from unusable ones.
- Unable-to-assess: 2/3 usable checks; Speech cannot be assessed; overall remains
  **incomplete**, matching the existing full-result state semantics.
- Urgent example: source urgent conclusion and emergency guidance remain visible.
- Existing next-step and safety copy accompany Retest/Continue and Home actions.
- Research details, internal weighted scores, submission and finalization are
  deliberately absent from this Public-only design simulator. Their production
  triggers/handlers are not replaced or changed.

## Face

Separate camera, instructions, status and countdown into nonoverlapping flow
regions. The crystal rim is decorative, noninteractive and outside the illustrated
camera surface; nothing covers eyes or mouth. The camera is original schematic
SVG artwork, **not** a live view or a measurement surface. Production acquisition
geometry must not be inferred from its 4:3 presentation: matching the real camera
mapping is a prerequisite for implementation. Countdown has no competing Start
button. Review controls advance it manually. Camera permission and unable-to-assess
examples retain existing explanatory copy; asymmetry result offers Continue/Retry.

## Arm

Reuse two existing production guide assets showing a participant extending an arm
while holding a smartphone upright. Left/right progress, guidance, countdown,
measurement, transition, completion and wrist-retry have separate states. No arm
angle or phone-angle numeric gauge is introduced: the assessment remains relative
phone-orientation drift. The copied assets originate from
`assets/arm/arm-{left,right}-step-2.webp`; no new participant data was collected.
Calibration/countdown/measurement are static visual examples, not new durations.

## Speech

Phrase, countdown and listening occupy separate regions. A static outlined mic
and explicit Listening label communicate recording, without pulsing decoration.
A synthetic transcript example illustrates recognition feedback. Distinguish
retry, unusable data, permission error and module completion. Existing privacy
text explicitly warns that browser/OS recognition may use an external service;
no on-device-only ASR claim is introduced. Countdown exposes no premature Speak
button. Existing Stop label is retained for the simulated listening control.

## Interaction and safety boundary

Mockup buttons move among **illustrative** states only; they are not a specification
of the capture state machine. Review controls reach every scenario, including
permission/errors. Home links return to the review gallery; they never enter the
application. The simulated right-arm Start links to the completion example; actual
right-arm calibration/measurement must use the unchanged production sequence.
There are no real timers, audio, media, sensors, ASR, storage, Research scripts,
Supabase libraries or submission calls. Emergency text is visible but deliberately
not wired to a real telephone action in this design simulator. Production emergency
call conditions and handlers must be preserved during authorized implementation.

## Implementation risks and order

1. Result — medium. Start with Public presentation fixtures, maintain valid,
   incomplete, invalid, urgent and historical-abnormal semantics. Never confuse
   protocol completion with successful upload or Research finalization.
2. Arm — high. Apply only scoped presentation after enumerating permission,
   calibration, left/right progression, hold/retry/error states. Existing sensor
   timing, wrist/drift thresholds and audio cues remain untouched.
3. Speech — high. Verify mic gesture acquisition, prerecorded/TTS cues, ASR,
   stop/retry races and cleanup contracts. Never move capture controls into a
   different lifecycle phase to fit this picture.
4. Face — very high. Establish the video/canvas/landmark transform map and all
   countdown/capture gates first. Add the bubble as a separate CSS decoration;
   never crop, scale or mirror acquisition to match the mock camera artwork.

Every module needs a separate authorized implementation and state-specific
regression review. No shared media refactor, algorithm, score/threshold change,
Consent/Research behavior, translation-pack edit or service configuration change
is proposed by these files. No application files, PR #106, Preview or Production
were changed. This local design-review branch is not pushed or deployed.
