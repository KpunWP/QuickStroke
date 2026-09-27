# JSSF Step 6B — Free isolated LOCAL HTTP + real PostgreSQL test

**Current approach: LOCAL ONLY; no Supabase Cloud development branch, no additional cloud charges, no real participants.** Do not merge `main` or release any QR during these tests. This is synthetic nonclinical engineering verification, not clinical validation.

## Verified before this test
- Supabase CLI 2.118.0 and Docker Desktop (Linux containers) available on Windows.
- `supabase db start` applied all three 14-digit JSSF migrations.
- Local PostgreSQL smoke passed real RLS, withdrawal cascade, 90-day purge and complete test rollback.
- A lightweight `supabase start -x gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor` booted PostgreSQL, Kong, PostgREST and Edge Runtime.
- `http://127.0.0.1:54321/functions/v1/jssf-remote-ingest/health` returned `ok:true`, `collectionEnabled:false`, correct contract version.

## Safety prerequisite — bind all published ports to loopback
Supabase's local stack defaults to network-accessible `0.0.0.0` with shared default credentials; **do not temporarily enable enrollment while it is reachable over LAN**. The local test script aborts if either database or gateway has a published non-loopback host address.

From the QuickStroke repository on Windows PowerShell:

```powershell
npx --yes supabase@2.118.0 stop
docker network create -o "com.docker.network.bridge.host_binding_ipv4=127.0.0.1" quickstroke-local-loopback
npx --yes supabase@2.118.0 start --network-id quickstroke-local-loopback -x gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor
docker port supabase_kong_quickstroke-jssf-local
docker port supabase_db_quickstroke-jssf-local
```

The expected Docker **Host IP** for each published port is `127.0.0.1`, not `0.0.0.0` or `::`. If a container remains LAN-accessible, stop here; troubleshoot binding before enabling the synthetic test gate. Never use local development defaults on an untrusted network. See https://supabase.com/docs/guides/local-development .

## Closed state check before activating local-only synthetic mode

```powershell
Invoke-RestMethod http://127.0.0.1:54321/functions/v1/jssf-remote-ingest/health
```

Confirm `collectionEnabled: false`. Keep client `config.js` flags false. Do not use `supabase link`, `db push`, `secrets set`, `functions deploy`, or the hosted Supabase project.

## Synthetic-only local Edge environment, ONLY after port binding verified
Create `supabase/functions/.env` (already Git-ignored) with **no real participant or production secrets**:

```text
JSSF_REMOTE_ENABLED=true
JSSF_ALLOWED_ORIGINS=http://127.0.0.1:5173
JSSF_CONSENT_VERSION=LOCAL_SYNTHETIC_2026_09
```

Stop/restart the loopback-only local stack with the same `start --network-id ... -x ...` command so Edge Runtime automatically loads `supabase/functions/.env`. Supabase injects its *local default* service-role credentials; do not copy cloud credentials. Confirm health returns `collectionEnabled:true` **only locally**.

Run `node tests/jssf-local-real-http-e2e.mjs`. The script hardcodes `127.0.0.1`, validates `supabase/config.toml` and disabled public client config, confirms loopback-only published ports, requires empty local JSSF tables, and uses the Docker container `supabase_db_quickstroke-jssf-local`. It tests invalid consent and hostile origin, synthetic enrollment/token hashing, Face/Arm/Speech sanitized events with an Arm retry, event replay, malformed event rejection, completion lock, expired upload-token withdrawal, and PostgreSQL row counts. It deletes only the synthetic UUID it creates in a `finally` block and fails if cleanup is unverified.

The local environment is **not** an externally deployed HTTPS test and is not approved for community recruitment.

## Close the test gate immediately after testing

```powershell
Remove-Item .\supabase\functions\.env
npx --yes supabase@2.118.0 stop
```

This stops the synthetic-enabled runtime and preserves the local data backup. On the next start with the env file absent, verify `collectionEnabled:false`. Never commit the `.env` file.

**Before any real data collection**, separately review informed consent, age eligibility, withdrawal contact, actual device testing, non-primary retention (browser/backups/logs), and server abuse/rate limiting. The Free Supabase Cloud project remains unchanged and closed.
