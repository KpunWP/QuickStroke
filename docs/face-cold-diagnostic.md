# Temporary Face cold-entry diagnostic (not a fix)

Stacked on PR #124 / 28384b4b28eab2a4fb8292dfe47b60c0e1a99393.
No deployment is included. Remove this diagnostic before release integration.

## Authorization and privacy

Only an explicit `faceColdStartDebug=1&entry=cold` (or `entry=warm`) in ordinary
Public Face may request the empty POST gate. The server requires Vercel Preview,
no custom target, exact immutable VERCEL_URL Host and valid deployed Git SHA.
Vercel Authentication must remain enabled on the existing project. Production,
alias hosts, offline gate failure, missing flags, Research, Dev and mesh fail closed.
No protection settings or environment variables are changed.

The report is bounded and in memory only: four geometry snapshots, 48 event lines,
eight detailed gaps plus count/max, 12 rendering-opportunity callbacks. Sampling
ends on the first detection tick after 180 seconds; copy before that. No extra
animation loop, polling, storage writes, report requests or automatic uploads.
The only POST is an empty gate request, never diagnostic data.

No image, pixel array, inference result, landmark, score, audio, transcript,
participant/session identifier, raw URL, token or device identifier is retained.
The exact SHA comes from the gate. Text is whitelisted to instruction keys and
coarse state/reason codes. Labels cold/warm are manual, not inferred.

## Two physical-iPhone runs (after separately authorized Preview deployment)

Use the immutable protected hostname, same iPhone/Safari/orientation/language.
Sign into Vercel first. Use no real participant/Research session.

1. Cold-labelled run: fresh Face document in a fresh browsing context with no prior
   Face test in that context. Open JSSF Home first if event flow is being checked,
   then same-tab Face with `?mode=public&faceColdStartDebug=1&entry=cold`.
   Record whether this was truly a new hostname/cache/context; the label does not
   prove cold browser/OS/model caches. Do not erase existing Research storage.
2. Keep the diagnostic collapsed. Observe Preparing, Ready, Start, still-face to
   smile transition, completion. Note black regions visually; the tool does not
   capture images. Do not pause execution or switch tabs during measurement.
3. After completion, expand Owner diagnostics, tap Copy Summary. If additional
   parts appear, copy each separately. Clipboard failure exposes selectable text.
   Copy only after measuring: keyboard/focus and expanded UI can disturb the view.
4. Warm run: leave Face and reopen a NEW Face document on the same hostname/tab
   with `?mode=public&faceColdStartDebug=1&entry=warm`. Repeat the same steps.
   Do not use Safari Back/BFCache as the warm run: pagehide removes instrumentation.
5. Return both reports plus the observed pre-Start geometry, visible smile cue,
   audible smile cue and attempt outcome. Do not send raw camera/audio/clinical data.

Do not place emergency calls or submit Research records.

## Interpretation

Times start at diagnostic authorization/attachment, not navigation. Early video,
preparing or first inference events may already have happened. Missing stages are
explicit. Inference durations are FIRST OBSERVED after attachment, not necessarily
first in the document; model-present-at-attachment flags expose this uncertainty.

The diagnostic times the original calls with identical arguments/this/return/error.
First Face/Hand wrappers restore the model methods after one observed call.
The first mouth invocation temporarily wraps canvas draw/readback synchronously,
filters by the actual mouth context, and restores prototypes before returning.
It never reads or saves returned pixel data. Missing timings stay MISSING.

A rendering opportunity is NOT proof of visible paint. A long animation-frame gap
is NOT proof of main-thread blocking (backgrounding/throttling can also cause it).
Voice-request means function entry, not actual speech scheduling or audible output;
coarse existing TTS callback events are recorded separately, without utterances.
No timer, readiness gate, model parameter, score or application state is adjusted.

Instrumentation adds clock reads, wrapper calls, bounded event bookkeeping,
MutationObserver work, limited geometry reads and an overlay. Cold module import
and server authorization also add network work. It can perturb the issue. Compare
with an unflagged run; do not treat a non-reproduction as proof of a fix.

## Compact summary example (synthetic)

    QuickStroke face-cold-1 entry=cold
    SHA aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    preparing @20ms BEFORE_START viewport=390,696 visual=390,696,0,0
    html=0,0,390,696 body=0,0,390,696 container=0,0,390,696 video=0,0,390,696
    intrinsic=480,640 css(position,fit,object-position,transform,overflow)=static,cover,50% 50%,matrix(-1, 0, 0, 1, 0, 0),clip
    ready: MISSING (not observed after authorization)
    firstFaceMs=25
    firstHandMs=2300
    firstPixelReadMs=8
    4500ms state ACTION_PHASE cd=- attempts=0 invalid=-
    4510ms voice-request smile
    6900ms render-opportunity smile

Values above are illustrative, not physical-device findings. Summary parts are
split at whole lines (up to 2800 characters), with no silent stage truncation.

## Verification boundaries

Removing only the loader reproduces the complete PR #124 Face page SHA-256.
Accepted Face styles, body/camera relationship, countdown, startup and completion
panel are unchanged. Existing frozen-script and layout contracts still apply;
only the gated loader is excluded and tested separately. Historical layout/A-B
helpers remain absent. There is no service-worker/cache migration in this branch:
new immutable Preview HTML loads the helper only after opt-in; offline gate failure
must not activate diagnostics.
