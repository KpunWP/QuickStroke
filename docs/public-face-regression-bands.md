# Public Face: isolate presentation grids from the camera ancestor

Baseline: cb020f495a454bcb76b104a7ae1950b1560ef91d (PR #120).
Branch: fix/public-face-regression-bands-20261026.

## Evidence and hypothesis

The owner's same-iPhone historical tests establish: 17921ba and 428c34b good in every state; 9216866 first has bands at completion; 8ceba7b adds bands during measurement. Exact causal selectors and Safari painting mechanism remain unproven.

428c34b..9216866 adds a grid to body.result-visible and a blurred body::before background. 9216866..8ceba7b adds preparing/ready body grids and an observer that removes the startup attribute after BEFORE_START. Both alter the formatting context of the camera's ancestor. Rectangles can stay full-size while the painting context changes. Current active block override did not fix physical Safari. The targeted hypothesis is ancestor reformatting/paint interaction, not camera size, stream constraints or a confirmed Safari defect.

## Patch

Wrap only the existing score-box, dashboard and startup feedback in a presentation-only div, next to video-container. No original element is recreated, moved by script or duplicated; IDs/listeners and order remain. No role is added. display:contents preserves the original Research/Dev and normal active layouts.

Move the two startup grids and completion grid from body to this sibling wrapper. Move the completion ::before background to the wrapper, keeping its exact glass styling and rows. The wrapper is absolutely positioned over the existing viewport surface; it has no background of its own and pointer-events:none. Existing child surfaces accept pointer events. The completion background stays noninteractive. Startup grids exclude active/result states even if the observer has not removed the startup attribute yet.

Remove the superseded active-body block override. Public body stays PR #113's flow-root/visible-overflow throughout preparing, ready, active and completion. No html/body sizing/background/overflow override is added. No video, container, canvas, crop, mirror, stream or model change. Countdown CSS is unchanged.

The completion grid can grow beyond the viewport's minimum row when text is large; existing visible body overflow preserves scroll reachability. This is not a promise that all controls stay above the fold at 200%.

## Protected behavior

All original inline scripts remain byte-for-byte identical, including camera acquisition, MediaPipe, landmarks, thresholds, audio/primeSpeech, countdown timing, retry, navigation, startup projection and completion handlers. Diagnostic gate/helper, translations and Service Worker remain unchanged. Inline CSS mirrors source assets for atomic existing offline delivery.

Old whole-document tests required updates because the authorized presentation wrapper and CSS changed. They still freeze all original scripts and markup after removing only the two wrapper tags and style blocks; camera and engine contracts were not relaxed. Existing Research/Dev pixel comparisons remain.

## Validation and physical acceptance

Automated tests use synthetic Chromium presentation and actual existing UI/navigation handlers, not physical camera/MediaPipe/Safari. Additional 72 cases cover TH/EN/JA × 320/390/430 × 100%/200% × preparing/ready/countdown/completion: stable flow-root body, no body pseudo paint, presentation grid outside camera ancestry, same video/container rectangles, cover/mirror unchanged, no horizontal overflow, completion navigation visible after scrolling. Existing suites cover loading order, failure, retry, Full→Arm, Individual→Result, safe areas, Research/Dev and offline/PWA.

After separately authorized protected Preview, owner tests on the same iPhone/Safari/orientation/zoom as the confirmed historical comparisons:
1. Fresh JSSF Home → Individual Face. Observe Preparing and Ready; no unexplained bands.
2. Actual Start → alignment/countdown/capture. Record whether bands appear and when.
3. Completion: inspect camera and grouped result/actions; scroll at enlarged text. Retry once.
4. Full Screening: continue to Arm. Individual: continue to Result.
5. Repeat TH/JA and enlarged text; check Safari toolbar expanded/collapsed.

If bands remain, do not call this fixed or change stream/model/audio behavior. Preserve physical observations and compare presentation layers further. Face audio silence and Speech Retry remain unresolved and untouched. No deployment or merge is part of this task.

## Local results

PASS core 23/23; Face 432/432; completion 144 + 4 safe-area cases; active 96; startup 48 plus 72 root-stability cases. All original navigation/Retry boundary, language, Research/Dev/mesh pixel-isolation and offline/PWA checks passed. Existing diagnostic and A/B browser suites passed. All source suites from Public Face CI passed, including audio, capture, language, Home/Result/Arm/Speech and consent-entry synthetic contracts. The consent-entry test intentionally logs a rejected conflicting-session enrollment; its exit status is zero and no live enrollment is performed. No test failures remain from this local run. Physical Safari acceptance is pending.
