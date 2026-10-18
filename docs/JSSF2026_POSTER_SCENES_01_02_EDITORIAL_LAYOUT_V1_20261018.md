# QuickStroke JSSF 2026 Poster — Scenes 01–02: Detailed Editorial + Layout v1
**Date:** 2026-10-18 | **Review status:** proposed, not final typeset or printer-approved.
**Purpose:** Turn approved seven-scene scientific storyboard into exact, readable English copy and a top-of-poster composition. This document does **not** change runtime code, research consent, clinical thresholds, or the data pipeline.
**Related:** `JSSF2026_POSTER_COMPLETE_STORYBOARD_V2_20261018.md`, `JSSF2026_AI_POSITIONING_FOR_POSTER_AND_ORAL_20261018.md`, `JSSF2026_PRIVACY_BY_DESIGN_SHARED_POSITIONING_20261018.md`.

## What passersby must understand
- **First glance (design goal, not tested claim):** This is a STROKE project.
- **Next glance:** Face / Arm / Speech are warning signs; TIME = emergency action, *not* a prompt to wait for an app.
- **Next:** The human need is uncertainty about whether and how to act.
- **After 20–30 seconds:** QuickStroke explores an accessible AI-assisted smartphone *research* system to guide observation and characterize measurable signals; not a diagnosis and not a proven care-time intervention.
- Keep clinical intro compact; **do not** let it consume the technical/experimental center of the poster.

## 1. Final-candidate opening English copy, within top approximately 22% of poster
**Project wordmark** (large): `QUICKSTROKE`
**Descriptor** (small but readable): `AI-assisted • Privacy-first • Smartphone research`
**Main heading** (very large, high contrast):
> **STROKE: WHEN EVERY MINUTE MATTERS**
**Human hook** (one short sentence):
> **Recognizing a warning sign is one thing. Deciding to act can be harder.**
**Definition** (small):
> A stroke is a medical emergency caused by interrupted blood flow to the brain or bleeding in the brain.
**FAST explanatory ribbon** (4 visual tokens):
> **F** — Face drooping  |  **A** — Arm weakness  |  **S** — Speech difficulty  |  **T** — Time to call emergency services
**Additional signs, very small**:
> Other sudden warning signs can include balance or vision changes.
**Research transition** (large prompt but secondary to heading):
> **Could the smartphone in our pocket help us observe these warning signs?**
**What we actually do**:
> QuickStroke explores guided Face, Arm, and Speech tasks using smartphone sensors and AI-assisted recognition to capture interpretable measurements.
**Mission**:
> **To support awareness and human decisions—not to diagnose stroke.**
**Visible safety line near FAST, repeated by public QR**:
> **Suspected stroke? Call emergency services immediately. Do not wait for the app.**
**Optional one-line technical qualifier**:
> The current nonclinical pilot studies measurement capture and quality—not clinical diagnostic accuracy or proven improvements in time to care.

Use words “help us observe” as exploratory, not “detect stroke” as a validated capability. Do not present the poster as advice to self-screen before seeking care.

### Scientific/medical wording notes
- FAST is an intuitive link between warning signs and the current Face/Arm/Speech modules, **not a complete symptom checklist**. Updated broader B.E.F.A.S.T. education includes Balance and Eyes; QuickStroke currently does not measure those domains. Do not imply absence of F/A/S excludes a stroke.
- No universal treatment-window countdown or universal stroke prevalence statistic is needed in the top panel.
- “Uncertainty causes delay” is a plausible motivational concern, **not an intervention outcome we measured**. Phrase as human issue/goal, not a measured reduction in hesitation or arrival time.
- No “AI-powered stroke diagnostic” or “all three modules use AI”. Face uses MediaPipe ML-based landmark tracking and deterministic derived analysis, Arm uses IMU signal processing, Speech uses browser ASR and rule-based matching.
- No universal claim about on-device speech. Presenter local Whisper is a proposed experiment pending offline verification; Public browser ASR can rely on a vendor-operated service. Privacy-first here means bounded consented derived research measurements, with no raw face/video/audio or transcripts stored in QuickStroke's research DB.

## 2. Proposed top-of-poster composition: full-width heading + 2-column content
*For English portrait poster (physical dimensions unconfirmed, start from A0 portrait design only as a draft)*.

```text
┌─────────────────────────────────────────────────────────┐
│ QUICKSTROKE                           AI-assisted ...   │
│                                                         │
│ STROKE: WHEN EVERY MINUTE MATTERS                        │
│ Recognizing a warning sign is one thing...              │
├───────────────────────────────┬─────────────────────────┤
│ SCENE 01 / HUMAN CONTEXT      │ SCENE 02 / RESEARCH IDEA│
│ A stroke is a medical        │         ┌─────┐         │
│ emergency.                    │    FACE │     │ SPEECH  │
│                                │         │PHONE│         │
│ [F FACE][A ARM][S SPEECH]     │    ARM  │     │         │
│ [T CALL EMERGENCY SERVICES]   │         └─────┘         │
│                                │ Camera/IMU/ASR pipeline │
│ Other sudden warning signs... │ Measurable observations │
│                                │ NOT a diagnosis         │
├───────────────────────────────┴─────────────────────────┤
│ SUSPECTED STROKE? SEEK EMERGENCY HELP. DON'T WAIT.       │
├─────────────────────────────────────────────────────────┤
│ SCENE 03 → Real instrument: FACE / ARM / SPEECH          │
└─────────────────────────────────────────────────────────┘
```

**Rough geometry, to adjust at real print size**
- Combined Scene 01–02: **20–23% of poster height**, including heading and a thin emergency safety ribbon; do not add seven separate framed cards.
- Full-width masthead: roughly first 7–9% of poster height.
- Below: **left 55–60% width** for concise FAST explainer + human uncertainty, **right 40–45%** for phone instrument / research transition. Small horizontal trim between, not heavy panel borders.
- **Scene 03 begins directly below**, with three equally composed real-engine evidence panels; don't use big ornamental smartphone that competes with authentic Face/Arm/Speech screenshots.
- Place word **STROKE** at the largest semantic text size, then QUICKSTROKE; exact font sizes decided on printable mockup/read-distance proof.
- Main heading must remain visually clear from about 2 m distance (a **design test**, not a medical/behavioral fact).
- FAST visual cues should have correct face drooping, arm weakness and speech difficulty semantics. Do not depict the phone directly proving anatomical muscle weakness or clinical speech abnormality.

## 3. Graphic directions for Artwork team
- Palette: deep navy/near-black for masthead, high-contrast “STROKE”, cool cyan/teal for technology, controlled warm accent for TIME emergency instruction; reserve modality colors for Scene 03 and Figure series.
- Replace placeholder icons with simple medically understandable visuals. Avoid depicting an actual “stroke patient” without verified source/context or publication consent.
- Keep emergency message understandable to international participants: `call emergency services` rather than only Thai 1669 or US 911; optional country-specific information belongs in app/localization, not international headline.
- Human hook is *typography*, not an alarming news photo. The earlier “SICK OR DRUNK?” story can still be used by a presenter in Oral but is not required in top 22% of Poster.
- A small phone schematic in Scene 02 is a conceptual diagram. Actual Face mesh, Arm trace and ASR example must be from verified implementation and genuine demo/research data later in Scene 03.
- **Privacy by Design** is a prominent explanatory callout in Scene 03 / 04, not hidden and not overloaded into Scene 01. Label Speech as `browser ASR` and do not claim fully on-device speech for Public.

## 4. Figure and text handoff
**Already supported:** Existing QuickStroke Face/Arm/Speech working prototype architecture, nonclinical pilot event/measurement record summary, project privacy policy and consented bounded technical data storage.
**Needs checking:** exact current Face overlay capture rights, current internationalized UI text, coherent Phone hero schematic, school/author marks, printer dimensions/bleed, full browser-ASR microphone notice, possible local Whisper Presenter test results.
**External verified medical context:**
- CDC, Signs and Symptoms of Stroke: https://www.cdc.gov/stroke/signs-symptoms/
- American Stroke Association, Stroke Symptoms: https://www.stroke.org/en/about-stroke/stroke-symptoms
- American Stroke Association, Stroke Facts: https://www.stroke.org/en/stroke-facts

## 5. Review gate / next design action
This version proposes to **keep Scene 01 and Scene 02 in one contiguous upper region** (not two separate full-width stacked scenes). Confirm headline, human hook, FAST-to-phone bridge and reading direction; then develop top-panel visual assets and the `Scene 03 FACE | ARM | SPEECH` panels. No artwork or print-master claim yet.
