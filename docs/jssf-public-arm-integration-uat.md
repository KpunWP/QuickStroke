# JSSF Public Arm integration — isolated Preview UAT

Branch: `integration/jssf-public-arm-uat-20261025`.

Verified current GitHub heads before integration, all Draft and unmerged:

| Source | Commit |
| --- | --- |
| Home PR #106 | 87388eb7dd39be24663e0364f66193aa72481966 |
| Result PR #108 | 03138c0c32a550d616eea2a5bc65c7eb70f2aa28 |
| Language PR #110 | 2cbe301376827490eaa1c7a82863e4cb4be0beb8 |
| Arm PR #109 | 16f3fe8ebe82659fe6342bc257b29d08b4a3f725 |

Created a new worktree/branch from latest Result head, then cherry-picked only the single language commit followed by the single Arm commit. Both applied without conflicts. Arm's original parent predates the Result grid; cherry-picking its additive commit (rather than copying the entire Arm branch tree) retains current Result files and evidence.

Runtime equality checked: Arm HTML/CSS match PR #109 exactly; Home/language registry match PR #110 exactly; Result HTML/CSS, Face, Speech and Service Worker match the Result baseline exactly. The Arm regression verifies every pre-existing inline engine/audio/state-machine script byte against its frozen hash and all six embedded illustrations against original image bytes. No new application behavior or translation changes.

The only integration-specific source additions are this document, a push-triggered read-only regression workflow, and selected screenshots refreshed from the combined application. No source PR branch or main is modified. No PR merge, production deployment, environment/domain/protection setting changes, or participant data writes are authorized.

Validation uses synthetic local fixtures with external service calls blocked. Sensor replay and duration tests cover the protected engine, while screenshot states are illustrative synthetic phase fixtures. Browser harnesses stub voice completion and stop hardware-start at control-test boundaries; actual sensor acquisition, physical orientation, real audible prompts and timing remain device UAT. BFCache persisted pageshow is simulated rather than proving browser admission. This does not establish iOS/Android compatibility.

Relevant deterministic suites: core 23/23; Public Arm/frozen scripts; sensor replay, dynamics/duration, device hardening, Research audit, guide persistence, post-task understanding; Public audio, TTS, iOS speaker-first and voice cues; Result/frozen script and sticky history; language continuity, event initialization and Home states; inline syntax. No failures in this selected set.

Browser checks: integrated TH/EN/JA language pickers/return/reload/back-forward; Arm 312 layout fixtures across 320/360/390/430px and normal/200% text, existing intro/left and right confirmation, Full→Speech, Individual→Result and retry→left IDLE; 192 Result grid fixtures and keyboard retry; Arm first-ever offline visit with actual Service Worker, six images and CSS; Research pixel comparison and Dev computed-style comparison against prior presentation. Updated screenshots are captured from actual integrated Arm markup using synthetic fixtures, not mockups.

Previously documented broader baseline issues (not repaired here): whitespace-sensitive jssf-remote-staging assertion and jssf-remote-sync-flow readiness fixture missing collection phase. No claim that all repository suites pass.

Physical UAT: iPhone Safari and Android Chrome/Samsung Internet; left/right one-handed guidance and illustration comprehension; IMU permissions/calibration/orientation drift and ten seconds per arm; audio order/volume/retries; foreground/background transitions; Home return and language changes; landscape/browser bars/cutouts/200% native text; installed PWA online upgrade and offline relaunch. Arm measures phone orientation drift, not absolute arm angle. Do not enroll Research participants, submit data or make emergency calls during UAT.

Visual inspection limitation: normal 360px English measurement screenshots show narrow Left/Right and Waiting text areas wrapping inside words. Geometry checks do not detect this readability issue. It is inherited unchanged from PR #109 and is flagged for owner/device review, not silently repaired during integration. The approved image's embedded Thai ten-second notation remains visible in EN/JA as in the source Arm implementation.
