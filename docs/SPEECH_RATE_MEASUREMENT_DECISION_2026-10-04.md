# Speech rate measurement decision — 2026-10-04

## Decision

QuickStroke does **not** use speech rate to trigger the Speech screening observation in the current pre-pilot build.

- Phrase matching remains active and may contribute to the Speech observation.
- Speech-rate timing, calculated rate, timing source, and reliability are retained as **exploratory research telemetry**.
- User-facing UI labels speech rate as **under development** and states that it is **not currently used in the screening result**.
- No constant timing correction is applied.
- Android remains in exclusive browser-ASR mode. The concurrent WebAudio/PCM + browser SpeechRecognition probe has been removed from the production path.
- A future single-capture/local-ASR architecture may revisit direct PCM timing without competing microphone consumers.

This is an engineering/research measurement decision, not a clinical validation conclusion.

## Why rate was removed from the decision

The browser implementations used by the current web architecture do not expose a validated acoustic ground-truth speech interval. QuickStroke can derive timing from browser SpeechRecognition events and, on iOS, calibrated WebAudio activity, but pilot measurements showed platform-dependent bias.

### Android Chrome pilot — POCO F6

One speaker repeated the Thai target phrase "วันนี้ท้องฟ้าแจ่มใส" 10 times. An iPhone voice recording was used as an independent external waveform reference.

- External waveform speech duration was approximately **2.06–2.21 s**, mean about **2.14 s**.
- QuickStroke/Android timing ranged approximately **1.43–4.24 s**.
- One attempt using an ASR speech-end boundary underestimated duration by about **0.65 s**.
- Nine attempts ending through the current-activity fallback overestimated duration by about **1.34–2.08 s**, mean error about **+1.64 s**.
- Phrase recognition remained exact in the post-deduplication test set.

Interpretation: Android timing error was not a stable constant offset and depended on timing source/ASR state. A single compensation constant would therefore be unsafe.

### iPhone Safari pilot

The same speaker repeated the target phrase 10 times while a POCO F6 recorded the external reference waveform.

- External waveform speech duration was approximately **1.84–1.98 s**, mean about **1.92 s**.
- QuickStroke/iPhone timing was approximately **1.22–1.38 s**, mean about **1.31 s**.
- Mean timing bias was about **-0.61 s**, with low within-pilot variability (SD about **0.06 s**).
- Phrase recognition was exact in all 10 attempts.

Interpretation: iPhone timing was more repeatable than Android timing in this pilot, but it still showed systematic underestimation versus the external waveform. The small, single-speaker pilot is not sufficient to justify a correction factor.

## Concurrent PCM probe on Android

A research-only production probe temporarily kept WebAudio/PCM capture active while Chrome SpeechRecognition also ran on POCO F6.

The user performed **4 Speech module runs**. Each run automatically produced **2 attempts**, for **8 test attempts total**.

Across all four runs:
- module result: **indeterminate**
- phrase similarity: **0**
- final ASR result count: **0**
- ASR restart count: **2 per attempt**
- PCM capture itself was active at **48 kHz**
- derived PCM/VAD durations were unstable, approximately **3.18–11.02 s**

Interpretation: concurrent WebAudio capture and browser SpeechRecognition caused unacceptable microphone/ASR contention on this Android device and did not provide a reliable timing substitute. The probe was therefore removed from the production path.

Data-handling marker: any stored Speech event with `speechResearch.pcmProbe.enabled=true` belongs to this engineering experiment and must be excluded from JSSF participant-outcome analysis. It may be retained only as engineering evidence for browser/device compatibility.

## Current architecture

### iOS / Safari
- Browser SpeechRecognition: phrase recognition.
- WebAudio/acoustic timing may still be collected for research provenance.
- Speech rate is **not** used for screening decisions.

### Android / Chrome
- Browser SpeechRecognition runs in **exclusive-ASR** mode.
- Competing WebAudio capture is released before ASR starts.
- Speech rate is **not** used for screening decisions.
- Acoustic timing/rate may be retained only when available as research telemetry; absence must not become an alert.

## Suggested event-day answer

If asked why QuickStroke does not currently score speech speed:

> We tested speech-rate timing against independent waveform recordings. The current browser-based timing was platform dependent: Android showed variable endpointing error, while iPhone was more consistent but still had systematic bias. We therefore keep speech rate as an exploratory research variable but do not use it to flag a user. Phrase recognition remains active. We also tested simultaneous PCM capture with Android browser speech recognition, but the two microphone consumers interfered and ASR reliability degraded, so that approach was removed. A future local/single-capture speech-recognition architecture can revisit direct waveform timing.

## Limitations of this evidence

- Engineering pilot, not diagnostic validation.
- Single speaker in the timing comparison.
- Limited device set.
- External phone recordings are an independent timing reference, but are not laboratory-grade instrumentation.
- These results justify excluding rate from the current decision logic; they do **not** establish clinical sensitivity/specificity for stroke speech abnormalities.

## Revisit criteria

Speech rate should only return to the screening decision after:
1. a validated timing method is available across supported devices,
2. agreement is checked against an independent acoustic reference,
3. cross-device and multi-speaker repeatability is characterized,
4. the clinical/research value of rate adds information beyond phrase/intelligibility measures.
