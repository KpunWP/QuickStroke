# JSSF minimal Power Words patch

Base: PR #124 / 28384b4b28eab2a4fb8292dfe47b60c0e1a99393. Diagnostic PR #125 is excluded.

## Exact locale change list (prepared before source edits)

Public Speech uses speech.publicUi overrides only. The legacy keys, Research/Dev participant wording and engine locale object are preserved. Blank subtitles are intentionally removed only where the old text added no safety/recovery information. A visible Public safety paragraph replaces their non-diagnostic role.

| Locale | Exact new/changed key | Old displayed wording | New wording |
|---|---|---|---|
| th-TH | `speech.publicUi.displayNoAlertTitle` | ไม่พบสิ่งที่ควรเตือน | พูดตรงประโยค |
| th-TH | `speech.publicUi.displayAttentionTitle` | ควรประเมินเพิ่มเติม | คำพูดไม่ตรง |
| th-TH | `speech.publicUi.displayIndeterminateTitle` | ประเมินไม่ได้ | ตรวจเสียงไม่ได้ |
| th-TH | `speech.publicUi.displayNoAlertSummary` | ไม่พบจุดที่ควรสังเกต | [empty] |
| th-TH | `speech.publicUi.displayAttentionSummary` | พบ {{count}} จุดที่ควรสังเกต | [empty] |
| th-TH | `speech.publicUi.statusPhraseExact` | ตรงตามประโยค | พูดตรงประโยค |
| th-TH | `speech.publicUi.statusPhraseAttention` | ควรสังเกต | คำพูดไม่ตรง |
| th-TH | `speech.publicUi.statusPhraseUnavailable` | ประเมินไม่ได้ | ตรวจเสียงไม่ได้ |
| th-TH | `speech.publicUi.domainPhraseLabel` | คำพูด | ประโยค |
| th-TH | `speech.publicUi.resultInvalid` | ประเมินไม่ได้ | ตรวจเสียงไม่ได้ |
| th-TH | `speech.publicUi.fastIncomplete` | พบสัญญาณ · ทำให้ครบทั้ง 3 อย่าง | สงสัยสโตรก? อย่ารอผล · ติดต่อฉุกเฉินทันที |
| th-TH | `speech.publicUi.micAccessError` | ⚠️ ไม่สามารถเข้าถึงไมค์:  | เปิดไมค์ไม่ได้ · ตรวจสิทธิ์แล้วลองใหม่ |
| th-TH | `speech.publicUi.speechApiUnavailable` | [ไม่พบ Speech API] | ตรวจเสียงไม่ได้ · ใช้เบราว์เซอร์อื่น |
| th-TH | `speech.publicUi.insufficientData` | ข้อมูลน้อยเกินไป | ตรวจเสียงไม่ได้ · ลองใหม่ |
| th-TH | `speech.publicUi.recognitionRecovery` | กำลังฟัง... (ASR retry failed; using voice detection) | ตรวจคำพูดไม่ได้ · รอผลแล้วลองใหม่ |
| th-TH | `speech.publicUi.detailsResearchNote` | ค่าด้านล่างเก็บไว้เพื่อการพัฒนาและวิเคราะห์ในระยะพรีไพลอต ไม่ใช่ผลวินิจฉัย | เปอร์เซ็นต์ความตรงของประโยคไม่ใช่ความเสี่ยงสโตรก |
| th-TH | `speech.publicUi.statusRateDevelopment` | อยู่ระหว่างการพัฒนา | ไม่ได้ประเมิน |
| th-TH | `speech.publicUi.statusRateNotUsed` | ยังไม่นำมาใช้ในการประเมินผล | ไม่ใช้ตัดสินผล |
| th-TH | `speech.publicUi.safetyNote` | [absent] | คัดกรองเบื้องต้นเท่านั้น · ไม่ใช่การวินิจฉัย · ผลนี้ไม่ยืนยันว่าไม่เป็นสโตรก |
| th-TH | `speech.publicUi.statusLabel` | Speech test status | การตรวจคำพูด |
| th-TH | `speech.publicUi.observationsLabel` | Speech observations | ผลเทียบประโยค |
| th-TH | `face.lookUp` | ⬇️ เงยหน้าขึ้นเล็กน้อย | ⬆️ เงยหน้าขึ้นเล็กน้อย |
| th-TH | `face.lookDown` | ⬆️ ก้มหน้าลงเล็กน้อย | ⬇️ ก้มหน้าลงเล็กน้อย |
| en-US | `speech.publicUi.displayNoAlertTitle` | No item to flag | Phrase Matched |
| en-US | `speech.publicUi.displayAttentionTitle` | Further review suggested | Phrase Mismatch |
| en-US | `speech.publicUi.displayIndeterminateTitle` | Unable to assess | Speech Check Failed |
| en-US | `speech.publicUi.displayNoAlertSummary` | No item needs attention | [empty] |
| en-US | `speech.publicUi.displayAttentionSummary` | {{count}} item(s) need attention | [empty] |
| en-US | `speech.publicUi.statusPhraseExact` | Matches the phrase | Phrase Matched |
| en-US | `speech.publicUi.statusPhraseAttention` | Needs attention | Phrase Mismatch |
| en-US | `speech.publicUi.statusPhraseUnavailable` | Unable to assess | Speech Check Failed |
| en-US | `speech.publicUi.domainPhraseLabel` | Speech | Phrase |
| en-US | `speech.publicUi.resultInvalid` | Unable to assess | Speech Check Failed |
| en-US | `speech.publicUi.fastIncomplete` | Sign found · Complete all 3 checks | Suspect stroke? Don’t wait · Call emergency services now |
| en-US | `speech.publicUi.micAccessError` | ⚠️ Cannot access the microphone:  | Microphone unavailable · Check permission and retry |
| en-US | `speech.publicUi.speechApiUnavailable` | [Speech API unavailable] | Speech unavailable · Try another browser |
| en-US | `speech.publicUi.insufficientData` | Insufficient data | Speech Check Failed · Try Again |
| en-US | `speech.publicUi.recognitionRecovery` | Listening... (ASR retry failed; using voice detection) | Speech unavailable · Retry after result |
| en-US | `speech.publicUi.detailsResearchNote` | The values below are retained for pre-pilot development and analysis. They are not a diagnosis. | Match percentage is not stroke risk. |
| en-US | `speech.publicUi.statusRateDevelopment` | Under development | Not assessed |
| en-US | `speech.publicUi.statusRateNotUsed` | Not currently used in the screening result | Not used for this result |
| en-US | `speech.publicUi.safetyNote` | [absent] | Preliminary screening only · Not a diagnosis · This result does not rule out stroke |
| en-US | `speech.publicUi.statusLabel` | Speech test status | Speech check |
| en-US | `speech.publicUi.observationsLabel` | Speech observations | Phrase result |
| en-US | `face.lookUp` | ⬇️ Lift your head slightly | ⬆️ Lift your head slightly |
| en-US | `face.lookDown` | ⬆️ Lower your head slightly | ⬇️ Lower your head slightly |
| en-US | `arm.vFinalBad` | Drift detected. Please see a doctor soon. | Possible arm drift. If stroke is suspected, call emergency services now. |
| en-US | `speech.retryingIncomplete` | [absent] | Phrase not fully recognized · Retrying… |
| ja-JP | `speech.publicUi.displayNoAlertTitle` | 注意項目はありません | 文が一致 |
| ja-JP | `speech.publicUi.displayAttentionTitle` | 追加の確認を推奨 | 文が不一致 |
| ja-JP | `speech.publicUi.displayIndeterminateTitle` | 評価できません | 発話を確認できません |
| ja-JP | `speech.publicUi.displayNoAlertSummary` | 注意が必要な項目はありません | [empty] |
| ja-JP | `speech.publicUi.displayAttentionSummary` | 確認したい項目が{{count}}件あります | [empty] |
| ja-JP | `speech.publicUi.statusPhraseExact` | 例文と一致 | 文が一致 |
| ja-JP | `speech.publicUi.statusPhraseAttention` | 確認が必要 | 文が不一致 |
| ja-JP | `speech.publicUi.statusPhraseUnavailable` | 評価できません | 発話を確認できません |
| ja-JP | `speech.publicUi.domainPhraseLabel` | 発話 | 例文 |
| ja-JP | `speech.publicUi.resultInvalid` | 判定できません | 発話を確認できません |
| ja-JP | `speech.publicUi.fastIncomplete` | サインあり · 3項目すべて実施 | 脳卒中が疑われたら、結果を待たず救急通報 |
| ja-JP | `speech.publicUi.micAccessError` | ⚠️ マイクにアクセスできません： | マイクを使えません · 許可を確認して再試行 |
| ja-JP | `speech.publicUi.speechApiUnavailable` | [Speech APIを利用できません] | 発話を確認できません · 別のブラウザーをお試しください |
| ja-JP | `speech.publicUi.insufficientData` | データ不足 | 発話を確認できません · 再試行 |
| ja-JP | `speech.publicUi.recognitionRecovery` | 聞いています... (ASR retry failed; using voice detection) | 言葉を確認できません · 結果の後に再試行 |
| ja-JP | `speech.publicUi.detailsResearchNote` | 以下の値はプレパイロットの開発・解析用に保存されます。診断結果ではありません。 | 一致率は脳卒中のリスクではありません。 |
| ja-JP | `speech.publicUi.statusRateDevelopment` | 開発中 | 判定対象外 |
| ja-JP | `speech.publicUi.statusRateNotUsed` | 現在は判定結果に使用していません | この結果には使用しません |
| ja-JP | `speech.publicUi.safetyNote` | [absent] | 初期チェックのみ · 医療診断ではありません · 脳卒中は否定できません |
| ja-JP | `speech.publicUi.statusLabel` | Speech test status | 発話チェック |
| ja-JP | `speech.publicUi.observationsLabel` | Speech observations | 例文の確認結果 |
| ja-JP | `face.lookUp` | ⬇️ 少し顔を上げる | ⬆️ 少し顔を上げる |
| ja-JP | `face.lookDown` | ⬆️ 少し顔を下げる | ⬇️ 少し顔を下げる |
| ja-JP | `arm.vFinalBad` | ずれが検出されました。早めに医師に相談してください。 | 腕下垂の可能性があります。脳卒中が疑われる場合は直ちに救急通報してください。 |
| ja-JP | `speech.retryingIncomplete` | [absent] | 文を最後まで認識できません · 再試行中… |
| th-TH | `index.publicStartError` | {error.message} / Unable to start screening/module. | เริ่มไม่ได้ · ลองใหม่ |
| th-TH | `index.publicChangeLanguageLabel` | Change language | เปลี่ยนภาษา |
| en-US | `index.publicStartError` | {error.message} / Unable to start screening/module. | Couldn’t start · Try again |
| en-US | `index.publicChangeLanguageLabel` | Change language | Change language |
| ja-JP | `index.publicStartError` | {error.message} / Unable to start screening/module. | 開始できません · 再試行 |
| ja-JP | `index.publicChangeLanguageLabel` | Change language | 言語を変更 |

## Hard-coded and accessibility substitutions

The JSON companion records exact before/after source operations. Existing translated guide steps supply Public Arm image alt text; their wording and image bytes are not edited. Face Home/Retry and Arm Home reuse existing navHome/retryBtn translations. Result region names reuse existing localized language/module names. All overrides are Public-only except explicitly approved Face symbol correction and EN/JA Arm spoken warning.

Locale-load fallbacks: TH “โหลดภาษาไม่ได้ · โหลดหน้าใหม่”, EN “Language unavailable · Reload”, JA “言語を読み込めません · 再読み込み”. Arm separates heading and Reload support. Research/Dev fallback strings and raw technical diagnostics remain unchanged. Public permissions show the localized generic error instead of raw exception names; raw errors and reason codes remain available to original logic. Public Home start-error alerts and compact language-picker accessible action labels are localized; original non-Public errors and language persistence remain unchanged.

## Semantics and audio boundary

Phrase Matched means an existing accepted variant matched, not verbatim identity or medical normality. Target, keywords, ASR normalization, thresholds and classifications are frozen. No new inference or retry policy.

EN/JA arm.vFinalBad use exactly the approved urgent conditional wording. Thai transcript, MP3 filename/content, runtime map, manifest and audio cache v4 remain unchanged. No recordings generated or replaced.

## Skipped for semantic/asset safety

- Incomplete speech TH/JA literal direction not applied to recognition-incomplete states: missing ASR transcript is not evidence the person failed to finish speaking. Existing displayAsrIncompleteSummary is retained; missing EN/JA retryingIncomplete translates recognition failure and automatic retry.
- No Arm posture copy, images, Thai voice transcript or recordings changed. Baked-in Thai 10-second labels need a separate asset revision.
- No broad Normal/reassurance rewrite, technical Research/Dev field rewrite, protected Research recovery-message rewrite or Speech Retry fix.

## Validation and UAT

Run power-words contracts, all existing core/Face/Arm/Speech/Result/emergency/language/navigation source suites, synthetic browser matrices, and same-origin old-v103 to new-v104 worker/locale update with offline reload. Calls are intercepted; external services blocked. Test 320/360/390/430 widths, TH/EN/JA, 100%/200% text. Check matched accepted variants, mismatch, unavailable/incomplete results, safety visibility, accessibility labels, and original navigation.

Physical iPhone/Android/native voice listening remains required. Face cold-entry failure/audio silence, Speech Retry unreliability and Arm illustration movement are unresolved. This copy patch does not fix them. Do not merge or deploy without separate authorization.

Local verification: 33 source/contract suites, 132 new Public-copy browser cases, 432 Face cases, 336 Speech layouts, 192 Result layouts, Arm completion checks, language return/reload/back/forward, inline-script syntax and diff whitespace checks passed. Synthetic Chromium tests are not physical-device acceptance; final GitHub CI is reported in the PR. Returning-PWA test upgrades exact PR124 v103 to v104, reloads HTML/locales offline and preserves storage.
