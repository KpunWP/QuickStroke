# JSSF Step 6B — Closed, isolated Supabase HTTPS verification

**Status: planned; NOT RUN.** This plan is for synthetic engineering data only. It is **not** clinical validation, community recruitment, or approval to enable production collection.

## Confirmed prerequisites (reverify immediately before execution)
- GitHub working branch: `fix/jssf-public-sticky-v6`. Never merge or modify `main` without explicit approval.
- Deno check and lint are clean; core Node regression suite passed 19/19 on 27 September 2026.
- Local loopback HTTP Edge handler test passed all eight checks before the import-map-only change. Repeat staging and local HTTP tests against the deployment candidate.
- `deno.lock` committed to the feature branch.
- Existing Supabase `quickstroke-jssf` is production/staging **closed to participants**. Do not enable `JSSF_REMOTE_ENABLED` there. Existing database has no JSSF sessions or events at latest read-only check.
- No development branch presently exists; creating one may incur charges. Confirm the exact parent organization and quoted cost with the project owner before creating it.

## Isolation and required safeguards
1. Obtain the owner's approval of any development-branch cost; create a **new isolated Supabase development branch**. Verify its unique project ref and that it differs from the original `pzzjfnfwppdeketjdhfo`. Never run this test against that original ref.
2. Verify the new branch has all three intended migrations, including `withdraw_jssf_session` and 90-day retention. Confirm RLS and the service-role-only RPC grants.
3. Before setting collection enabled on the development branch, implement and test a **developer-only admission gate** at the Edge layer (unguessable server-side test credential, reject missing/wrong credential BEFORE consent enrollment or event ingestion). An Origin allowlist alone is not authentication. Keep the public-facing app disabled. The existing handler does **not** yet implement this gate.
4. Deploy the reviewed handler, `payload.mjs`, and `deno.json` to **only** the isolated branch; use its own temporary allowlisted Origin and test-only consent version. Do not put credentials in Git, chat, browser JavaScript, screenshots, or logs.
5. Fail-closed test script must assert that the HTTPS target host equals the isolated branch project ref and that the ref is not the original. The script should verify missing/wrong developer credentials fail before any valid synthetic enrollment. Abort if these negative checks fail.
6. Only in this isolated gated branch, enable `JSSF_REMOTE_ENABLED=true` for the short test window. Do not distribute the endpoint/QR or recruit volunteers.

## Synthetic HTTP test matrix
- Disabled gate / no origin / wrong developer credential / invalid synthetic consent are all rejected; branch database remains empty.
- Authorized synthetic enrollment creates one session and a 256-bit capability whose **hash**, never raw token, is persisted.
- Upload allowlisted summaries for Face, Arm, Speech and an Arm retry; no raw recordings, images, transcripts or raw sensor streams are persisted.
- Retry identical client event IDs and simulate a lost acknowledgement; verify unique event counts and identical acknowledgements.
- Mark the synthetic session completed; replay the completion event (idempotent), reject new events after completion.
- Reject unauthorized event/withdraw requests and invalid payloads without changing recorded rows.
- Withdraw the session with its capability; confirm the atomic SQL deletion removes the session and all related events. Repeat withdrawal with a lost-acknowledgement scenario.
- Check zero JSSF rows on the **development branch** and investigate any leftover data before ending the test. Check logs do not contain capability tokens.
- Verify withdrawal while collection is paused and, if feasible, after upload expiry. Do not edit real participant data or production retention settings.

## Stop conditions and closeout
- On any unexpected success without developer credentials, stop immediately and disable the branch's remote collection.
- Do not report this step as complete until **deployed** HTTPS Edge requests and real isolated PostgreSQL reads verify the full sequence. Local fake database tests are necessary but insufficient.
- Record observed HTTP status codes, sanitized event counts, deployment version, development-branch ref (never keys), evidence of zero remaining rows, unresolved security gaps, and reviewer approval.
- Disable branch collection after tests. Agree with the owner when to delete the development branch to stop any ongoing charges.
- Production remains disabled; separate release gates still include age policy, approved consent, withdrawal contact, backups/log retention, anti-abuse/rate limiting, browser/Safari offline checks and institution/ethics requirements where relevant.
