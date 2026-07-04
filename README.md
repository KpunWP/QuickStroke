# QuickStroke — Web-Based FAST Stroke Screening

## License and Use Restriction

This repository is publicly accessible for competition judging, academic review, and project demonstration only. The source code is **not open source**.

All rights are reserved by the author/team. No permission is granted to copy, modify, redistribute, sublicense, publish, commercialize, or create derivative works from this software without prior written permission.

No patent license is granted by making this source code publicly accessible.

Third-party libraries, frameworks, fonts, icons, models, or other assets used in this project remain subject to their respective licenses.

---

## Medical Disclaimer

QuickStroke is a preliminary screening prototype only. It is **not** a medical diagnosis system, medical device, or replacement for professional medical evaluation.

If stroke is suspected, users should seek emergency medical help immediately and should not delay treatment because of this tool.

---

## Live Demo

**Web App:** https://QuickStroke.vercel.app

QuickStroke runs directly in a smartphone browser and does not require app installation.

---

## Project Overview

QuickStroke is a browser-based prototype for preliminary stroke risk screening based on the FAST principle:

* **F — Face:** facial asymmetry screening
* **A — Arm:** arm drift screening
* **S — Speech:** speech abnormality screening
* **T — Time:** if stroke is suspected, seek emergency medical help immediately

The goal of this project is to develop a **privacy-first, on-device-first FAST screening platform** that can help the general public, caregivers, and community health volunteers recognize possible stroke warning signs earlier.

The current prototype focuses on workflow testing, user interface design, sensor integration, and rule-based screening logic. Future versions may include machine learning models that can run directly in the browser.

---

## Key Features

### 1. Browser-Based and Zero Installation

Users can open the system through a web link without installing a mobile app.

### 2. FAST Screening Workflow

The prototype includes three screening modules:

| Module | Input                            | Current Method                                                        |
| ------ | -------------------------------- | --------------------------------------------------------------------- |
| Face   | Camera                           | Facial landmark and facial symmetry analysis                          |
| Arm    | Device motion/orientation sensor | Arm drift measurement                                                 |
| Speech | Microphone                       | Speech prompt recognition, speech rate, VAD, SNR, and voice stability |

### 3. Multilingual Support

The system supports:

* Thai
* English
* Japanese

Speech prompts are language-adapted rather than directly translated word-for-word, because each language has different speech rhythm and phonetic structure.

### 4. Privacy-First Design

The project is designed to minimize sensitive data exposure:

* No user account is required.
* The prototype does not store personal identity data.
* Image, audio, and sensor processing are designed to occur as locally as possible.
* Research data collection, if conducted in the future, will require consent and ethical approval.

### 5. On-Device-First Roadmap

The long-term goal is to move more processing into the browser using technologies such as:

* WebAssembly
* WebGPU
* Transformers.js
* Whisper-based on-device speech recognition

The current speech module uses browser speech recognition for prototyping. Some browsers may process speech recognition through external services, so future development will focus on replacing this with an on-device speech model.

---

## File Structure

```text
fastscreening/
├── index.html              # Main page and test selection
├── face-test.html          # Face asymmetry screening
├── arm-test.html           # Arm drift screening
├── speech-test.html        # Speech screening
├── result.html             # Combined FAST result page
├── fast-permissions.js     # Shared camera/microphone permission helper
└── README.md
```

---

## Screening Modules

### Face Module

The Face module uses the device camera to evaluate facial asymmetry during a smile task. The current prototype uses facial landmarks and pose-quality checks to reduce false readings caused by head rotation or poor camera positioning.

### Arm Module

The Arm module uses smartphone motion/orientation sensors to measure arm drift. The user tests one arm at a time, and the system evaluates whether the arm drops or drifts beyond an expected range during the test.

### Speech Module

The Speech module asks the user to say a short prompted sentence. It currently evaluates:

* whether the prompted sentence is recognized,
* speech rate,
* voice activity duration,
* background noise level,
* signal-to-noise ratio,
* voice stability.

Current speech prompts:

| Language | Prompt                | Unit          |
| -------- | --------------------- | ------------- |
| Thai     | วันนี้ท้องฟ้าแจ่มใส   | syllables/sec |
| English  | The sky is blue today | syllables/sec |
| Japanese | 今日は空がきれいです  | mora/sec      |

Japanese uses mora-based timing because Japanese is commonly treated as a mora-timed language.

---

## Current Scoring Concept

Each module produces a score from 0 to 100 and stores its result in `sessionStorage`.

The combined FAST score currently follows this weighting concept:

| Module | Weight |
| ------ | -----: |
| Face   |    40% |
| Arm    |    40% |
| Speech |    20% |

The result is interpreted as a preliminary screening score, not a diagnosis.

A future research version may use a **regularized logistic regression-first model** to combine Face, Arm, and Speech features into an interpretable screening risk score. Logistic regression is suitable for the early research phase because it is transparent, less data-hungry than deep learning, and appropriate for screening rather than detailed diagnosis.

---

## Research Roadmap

### 1. Prototype Development

* Build and test the web-based FAST workflow.
* Improve usability, multilingual support, and sensor reliability.

### 2. Pilot Data Collection

* Collect consented research data from a limited number of participants.
* Planned pilot size: approximately 100–200 participants, depending on feasibility and ethical approval.

### 3. Feature Calibration

* Calibrate thresholds for facial asymmetry, arm drift, and speech features.

### 4. Machine Learning Model

* Start with a regularized logistic regression model for interpretability and screening suitability.
* Compare with other models only if enough data becomes available.

### 5. On-Device Deployment

* Convert the validated model into a browser-runnable format.
* Aim to reduce or remove server-side processing.

---

## Technology Stack

* HTML
* CSS
* JavaScript
* MediaPipe-style facial landmark processing
* Web Audio API
* Web Speech API
* DeviceOrientation / DeviceMotion APIs
* Session Storage
* Vercel static deployment

---

## Limitations

This project is currently a prototype and has not yet been clinically validated.

Important limitations:

* It cannot diagnose stroke.
* It should not delay emergency treatment.
* Thresholds require calibration with real-world data.
* Speech recognition may behave differently across browsers and languages.
* Sensor readings may vary between smartphone models.
* Background noise and camera positioning can affect results.

---

## Intended Use

QuickStroke is intended for:

* educational demonstration,
* early prototype research,
* competition judging and academic review,
* public awareness of FAST stroke warning signs,
* future development into a privacy-preserving screening tool.

It is **not** intended to replace doctors, emergency services, or standard hospital stroke assessment.

---

## Project Status

**Status:** Working prototype  
**Stage:** Logic testing, UI/UX refinement, and research proposal preparation  
**Clinical validation:** Not yet performed

---

## Reuse and Contact

This project is provided for review and evaluation only. Any reuse, redistribution, derivative work, public health deployment, clinical use, or commercial use requires prior written permission from the author/team.
