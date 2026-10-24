# Copy mapping and editorial status

All patient-facing clinical/action strings are literal excerpts from the existing
TH/EN/JA locale packs at base commit `87388eb…`. No production translations are
edited. Context/ordering changes are design proposals requiring review. English
gallery/state-control chrome is review tooling, not proposed localized app copy.

## Existing production resources

| Prototype key | Production key | TH / EN / JA status |
| --- | --- | --- |
| `index.emergency` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.emergency` | Existing, unchanged |
| `index.notDiagnosis` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.notDiagnosis` | Existing, unchanged |
| `index.face` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.face` | Existing, unchanged |
| `index.arm` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.arm` | Existing, unchanged |
| `index.speech` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.speech` | Existing, unchanged |
| `index.publicPrimaryRestart` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `index.publicPrimaryRestart` | Existing, unchanged |
| `result.summaryKicker` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.summaryKicker` | Existing, unchanged |
| `result.stateIncompleteTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateIncompleteTitle` | Existing, unchanged |
| `result.stateIncompleteDesc` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateIncompleteDesc` | Existing, unchanged |
| `result.stateReviewTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateReviewTitle` | Existing, unchanged |
| `result.stateReviewDesc` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateReviewDesc` | Existing, unchanged |
| `result.stateUrgentTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateUrgentTitle` | Existing, unchanged |
| `result.stateUrgentDesc` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.stateUrgentDesc` | Existing, unchanged |
| `result.completionShort` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.completionShort` | Existing, unchanged |
| `result.metricUnable` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.metricUnable` | Existing, unchanged |
| `result.moduleOk` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.moduleOk` | Existing, unchanged |
| `result.moduleReview` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.moduleReview` | Existing, unchanged |
| `result.moduleBad` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.moduleBad` | Existing, unchanged |
| `result.notTested` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.notTested` | Existing, unchanged |
| `result.validityInvalid` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.validityInvalid` | Existing, unchanged |
| `result.nextIncomplete` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.nextIncomplete` | Existing, unchanged |
| `result.nextReview` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.nextReview` | Existing, unchanged |
| `result.nextUrgent` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.nextUrgent` | Existing, unchanged |
| `result.home` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.home` | Existing, unchanged |
| `result.retryAll` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.retryAll` | Existing, unchanged |
| `result.continueTests` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.continueTests` | Existing, unchanged |
| `result.safetyNote` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.safetyNote` | Existing, unchanged |
| `result.individualInvalidDesc` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `result.individualInvalidDesc` | Existing, unchanged |
| `face.step1` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.step1` | Existing, unchanged |
| `face.step2` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.step2` | Existing, unchanged |
| `face.pressStart` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.pressStart` | Existing, unchanged |
| `face.cardAligning` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.cardAligning` | Existing, unchanged |
| `face.cardAligned` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.cardAligned` | Existing, unchanged |
| `face.cardTesting` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.cardTesting` | Existing, unchanged |
| `face.startBtn` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.startBtn` | Existing, unchanged |
| `face.retryBtn` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.retryBtn` | Existing, unchanged |
| `face.faceDone` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.faceDone` | Existing, unchanged |
| `face.faceAbnormal` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.faceAbnormal` | Existing, unchanged |
| `face.faceUnableAssess` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.faceUnableAssess` | Existing, unchanged |
| `face.invalidHelp` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.invalidHelp` | Existing, unchanged |
| `face.navNext` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.navNext` | Existing, unchanged |
| `face.navHome` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `face.navHome` | Existing, unchanged |
| `arm.armLeft` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.armLeft` | Existing, unchanged |
| `arm.armRight` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.armRight` | Existing, unchanged |
| `arm.instrWait_left` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrWait_left` | Existing, unchanged |
| `arm.subWait_left` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.subWait_left` | Existing, unchanged |
| `arm.instrWait_right` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrWait_right` | Existing, unchanged |
| `arm.subWait_right` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.subWait_right` | Existing, unchanged |
| `arm.instrCalib` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrCalib` | Existing, unchanged |
| `arm.subCalib` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.subCalib` | Existing, unchanged |
| `arm.instrMeasure` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrMeasure` | Existing, unchanged |
| `arm.subMeasure` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.subMeasure` | Existing, unchanged |
| `arm.instrDone_left` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrDone_left` | Existing, unchanged |
| `arm.instrDone_right` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrDone_right` | Existing, unchanged |
| `arm.btnConfirmStart_left` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.btnConfirmStart_left` | Existing, unchanged |
| `arm.btnConfirmStart_right` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.btnConfirmStart_right` | Existing, unchanged |
| `arm.btnNext` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.btnNext` | Existing, unchanged |
| `arm.navNext` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.navNext` | Existing, unchanged |
| `arm.finalOk` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.finalOk` | Existing, unchanged |
| `arm.finalOkSub` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.finalOkSub` | Existing, unchanged |
| `arm.btnRetryArm` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.btnRetryArm` | Existing, unchanged |
| `arm.instrRetryWrist` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.instrRetryWrist` | Existing, unchanged |
| `arm.subRetryWrist` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.subRetryWrist` | Existing, unchanged |
| `arm.guideNote` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.guideNote` | Existing, unchanged |
| `arm.passLbl` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `arm.passLbl` | Existing, unchanged |
| `speech.target` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.target` | Existing, unchanged |
| `speech.hint` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.hint` | Existing, unchanged |
| `speech.preparePrompt` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.preparePrompt` | Existing, unchanged |
| `speech.speakNowPrompt` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.speakNowPrompt` | Existing, unchanged |
| `speech.listeningPrompt` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.listeningPrompt` | Existing, unchanged |
| `speech.listening` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.listening` | Existing, unchanged |
| `speech.ready` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.ready` | Existing, unchanged |
| `speech.btnStart` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.btnStart` | Existing, unchanged |
| `speech.btnRetry` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.btnRetry` | Existing, unchanged |
| `speech.btnStop` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.btnStop` | Existing, unchanged |
| `speech.displayNoAlertTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.displayNoAlertTitle` | Existing, unchanged |
| `speech.displayNoAlertSummary` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.displayNoAlertSummary` | Existing, unchanged |
| `speech.displayIndeterminateTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.displayIndeterminateTitle` | Existing, unchanged |
| `speech.subInvalid` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.subInvalid` | Existing, unchanged |
| `speech.voiceButNoText` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.voiceButNoText` | Existing, unchanged |
| `speech.phraseExact` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.phraseExact` | Existing, unchanged |
| `speech.fastResult` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `speech.fastResult` | Existing, unchanged |
| `permissions.cameraTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.cameraTitle` | Existing, unchanged |
| `permissions.needCamera` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.needCamera` | Existing, unchanged |
| `permissions.allowBtn` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.allowBtn` | Existing, unchanged |
| `permissions.blockedTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.blockedTitle` | Existing, unchanged |
| `permissions.blockedCamera` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.blockedCamera` | Existing, unchanged |
| `permissions.blockedMic` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.blockedMic` | Existing, unchanged |
| `permissions.retryBtn` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.retryBtn` | Existing, unchanged |
| `permissions.privacyCameraNote` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.privacyCameraNote` | Existing, unchanged |
| `permissions.privacyMicNote` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.privacyMicNote` | Existing, unchanged |
| `permissions.micTitle` | `locales/{th-TH,en-US,ja-JP}/ui.json` → `permissions.micTitle` | Existing, unchanged |

The Arm `driftLbl` value (English “Phone angle”) is intentionally not displayed.
No replacement clinical translation or absolute-arm-angle label is invented.
Full Result unable-to-assess is displayed with existing incomplete summary and
existing module validity label. Speech phrase and synthetic recognition use the
locale’s existing `speech.target`; they are not actual recognized speech.

## New design-review labels — UNAPPROVED proposals

Native Thai/Japanese editorial review is required for these simulation annotations.
They must not silently become production translations.

| Key | TH proposal | EN proposal | JA proposal |
| --- | --- | --- | --- |
| `review.badge` | แบบจำลองดีไซน์ · ไม่มีการบันทึก | Design simulation · No capture | デザインのシミュレーション・記録なし |
| `review.data` | ข้อมูลสมมติ · ไม่ใช่ผลของผู้เข้าร่วม | Synthetic example · Not a participant result | 架空の例・参加者の結果ではありません |
| `review.camera` | ภาพจำลองกล้อง | Illustrated camera placeholder | カメラ画面のイメージ |
| `review.next` | ดูสถานะจำลองถัดไป | Next simulated state | 次の模擬状態 |
| `review.notice` | สำหรับรีวิวดีไซน์เท่านั้น ไม่มีการเปิดกล้อง เซนเซอร์ ไมโครโฟน การรู้จำเสียง หรือการส่งข้อมูล | Design review only. No camera, motion sensor, microphone, recognition or data submission is active. | デザイン確認専用です。カメラ、モーションセンサー、マイク、音声認識、データ送信は動作しません。 |

These annotations describe the design sandbox only; they must not replace the
existing camera/microphone privacy disclosures. Japanese clinical translations
are reused as-is, not certified by this review; native-language review remains
necessary before exhibition use. New gallery English labels and scenario names
are review metadata, not new clinical instructions.

## Minimal Face refinement — additional existing excerpts

`face.critical`, `face.smileVoice`, `result.emergencyThailand` and
`result.emergencyLocal` are copied unchanged in TH/EN/JA for the illustrative
capture and urgent-result variant. No new clinical translation is proposed.
