# JSSF Pilot Data Analysis Plan — 50–100 Participant Target

## Primary objective

Evaluate **usability, technical reliability, measurement completeness, and normal/community distributions** for the frozen QuickStroke JSSF pilot build.

This is not a diagnostic-accuracy study.

## Analysis population

Primary analysis cohort:
- `data_collection_phase = 'jssf_pilot'`
- consent version `JSSF-REMOTE-2026-10-04-v3`
- build `20261004-jssf-pilot-freeze-v5`

Exclude from participant outcome analysis:
- `engineering_preflight`
- explicit engineering probe events
- withdrawn/deleted sessions
- sessions from a later build/version unless analyzed as a separate cohort.

## Cohort accounting

Report:
1. enrollments,
2. completed/finalized sessions,
3. active/abandoned sessions,
4. withdrawn/deleted sessions,
5. completion rate with 95% confidence interval.

Preserve denominator definitions. Do not silently exclude failed sessions from usability/reliability summaries.

## Device/browser strata

At minimum summarize:
- iOS / Safari,
- Android / Chrome,
- other supported/observed combinations.

Report counts and rates rather than over-interpreting small strata.

## Face analysis

Report:
- attempt count per participant,
- valid / invalid / not-evaluable proportions,
- invalid reason distribution,
- no-alert / attention distribution,
- continuous research metrics when available,
- retry rate,
- device/browser differences.

Threshold interpretation:
- current numeric values remain provisional project thresholds.
- JSSF can estimate false-alert candidates in a community sample but cannot estimate stroke sensitivity.

## Arm analysis

Report:
- attempts per left/right arm,
- valid / invalid / uncertain / wrist-movement / possible-drift frequencies,
- driftMaxDeg distribution,
- ratioZX distribution,
- retry rate,
- sensor source and sensor-gap issues,
- post-task protocol-understanding response,
- device/browser differences.

Laterality:
- treat the stored left/right label as participant-confirmed.
- do not claim sensor verification of the actual hand.
- separately document observed/reported wrong-hand cases if available.

Explore the distribution relative to the current 5° and 10° bands, but do not reclassify the pilot retrospectively without clearly labeling it as a post-hoc/shadow analysis.

## Speech analysis

Report:
- valid/invalid/indeterminate attempt proportions,
- exact accepted phrase proportion,
- continuous phrase similarity,
- transcript coverage,
- ASR final/interim behavior,
- ASR restart/error counts,
- technical quality flags,
- platform/browser differences.

Speech rate:
- analyze only as exploratory telemetry.
- never use it to redefine the participant screening result in this frozen cohort.
- Android/iOS timing should not be pooled naively because measurement paths differ.

## Usability analysis

Primary usability/reliability indicators:
- full-flow completion rate,
- module-specific retry/invalid rates,
- median attempts per module,
- time-to-completion if reliably available,
- Arm post-task understanding response,
- abandonment location,
- technical failure codes.

If operator assistance is recorded outside the app, summarize assisted vs unassisted completion separately.

## Threshold analysis during pilot

For each active/project threshold:
- describe the observed normal/community distribution,
- count observations near the threshold,
- estimate how often the current threshold generates alert/retest/invalid outcomes,
- perform shadow sensitivity analyses only when pre-specified or clearly labeled post hoc.

Do not choose an 'optimal clinical cutoff' from this community-only cohort.

## Statistical reporting

For proportions:
- report numerator/denominator,
- percentage,
- 95% confidence interval.

For continuous metrics:
- median and IQR by default,
- mean/SD when distribution is reasonably symmetric and useful,
- minimum/maximum for engineering range checks.

For repeated attempts:
- distinguish participant-level from attempt-level summaries.
- do not treat repeated attempts from one participant as independent participants.

For device comparisons:
- use descriptive comparisons first.
- formal hypothesis tests should be exploratory unless sample sizes per stratum are adequate.

## Missingness

Report missingness explicitly by:
- module,
- metric,
- device/browser,
- reason code where available.

Technical unavailability is data, not something to drop silently.

## What 50–100 participants can answer

Reasonably useful for:
- whether the self-administered flow is workable,
- how often modules need retries,
- whether common phones/browsers fail,
- how often community participants trigger provisional thresholds,
- whether Arm instructions are understood,
- what normal/community metric distributions look like.

Not sufficient by itself for:
- stroke sensitivity/specificity,
- PPV/NPV for disease,
- clinical ROC-optimal thresholds,
- subgroup clinical validation,
- claims of diagnostic equivalence to FAST/NIHSS.

## Decision after pilot

After the JSSF cohort is frozen:
1. produce a participant flow diagram,
2. generate per-module reliability/usability tables,
3. review threshold-near observations,
4. identify platform-specific failure modes,
5. decide which thresholds merit modification or shadow evaluation,
6. version any subsequent algorithm change,
7. plan a separate governed clinical/reference validation phase if appropriate.


## Device/runtime provenance

The frozen pilot records coarse technical provenance needed to investigate device-specific reliability:
- platform family,
- OS major version when available,
- browser family and browser major version,
- device class,
- browser-exposed device model when available,
- runtime provenance contract version.

Raw User-Agent strings and persistent hardware identifiers such as serial number/IMEI/advertising ID are not stored.

Analyze Face/Arm/Speech reliability by these strata where sample size permits. Device model should be treated as optional because some browsers, especially iOS Safari, do not expose a specific model.
