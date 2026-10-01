# JSSF Step 6B — Free isolated LOCAL HTTP + real PostgreSQL test

**Current approach: LOCAL ONLY; no Supabase Cloud development branch, no additional cloud charges, no real participants.** Do not merge `main` or release any QR during these tests. This is synthetic nonclinical engineering verification, not clinical validation.

## Verified before this test
- Supabase CLI 2.118.0 and Docker Desktop (Linux containers) available on Windows.
- `supabase db start` applied all three 14-digit JSSF migrations.
- Local PostgreSQL smoke passed real RLS, withdrawal cascade, 90-day purge and complete test rollback.
- A lightweight `supabase start -x gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor` booted PostgreSQL, Kong, PostgREST and Edge Runtime.
- `http://127.0.0.1:54321/functions/v1/jssf-remote-ingest/health` returned `ok:true`, `collectionEnabled:false`, correct contract version.

## Windows Docker Desktop: protect the published API and DB ports FIRST

**Important finding on Windows with Supabase CLI 2.118.0:** setting Docker network `host_binding_ipv4=127.0.0.1` and passing `--network-id` did **not** constrain the ports. `docker port` still showed `0.0.0.0:54321`, `[::]:54321`, `0.0.0.0:54322` and `[::]:54322`. Docker bridge defaults do not override explicit wildcard host port publishing. The earlier network-only approach was insufficient.

Do **not** create an enabled `supabase/functions/.env` or run synthetic HTTP enrollments while the ports are exposed without independently validated firewall isolation. First stop the stack without deleting its local database:

```powershell
npx --yes supabase@2.118.0 stop
```

In a **Windows PowerShell window launched as Administrator**, add two narrowly scoped inbound blocking rules:

```powershell
New-NetFirewallRule -Name "QuickStroke-JSSF-Local-54321" -DisplayName "QuickStroke JSSF Local API" -Enabled True -Direction Inbound -Action Block -Protocol TCP -LocalPort 54321 -RemoteAddress Any -Profile Any
New-NetFirewallRule -Name "QuickStroke-JSSF-Local-54322" -DisplayName "QuickStroke JSSF Local DB" -Enabled True -Direction Inbound -Action Block -Protocol TCP -LocalPort 54322 -RemoteAddress Any -Profile Any
Get-NetFirewallRule -Name "QuickStroke-JSSF-Local-54321","QuickStroke-JSSF-Local-54322" | Select-Object Name,Enabled,Direction,Action,Profile
Get-NetFirewallProfile | Select-Object Name,Enabled
```

Check each rule is **Enabled=True, Direction=Inbound, Action=Block, Profile=Any** and Windows Firewall is enabled on every profile. The rules block remote inbound TCP but should not prevent access from `127.0.0.1`.

Restart the already existing local stack; this command can reuse the `quickstroke-local-loopback` network even though Docker reports wildcard bindings:

```powershell
npx --yes supabase@2.118.0 start --network-id quickstroke-local-loopback -x gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,logflare,vector,supavisor
Invoke-RestMethod http://127.0.0.1:54321/functions/v1/jssf-remote-ingest/health
```

While **collection is still disabled**, independently test both ports from a **second device on the same LAN** to verify the firewall actually blocks Docker Desktop's published ports. Obtain your host's Wi-Fi/Ethernet IPv4 using `ipconfig` (not `127.0.0.1` or a Docker/WSL address). From another Windows PC:

```powershell
Test-NetConnection <HOST_LAN_IPV4> -Port 54321
Test-NetConnection <HOST_LAN_IPV4> -Port 54322
```

Both must report `TcpTestSucceeded: False`; a second-device browser probe to the API port alone does not test the DB port. Do not enable synthetic collection if either succeeds, if firewall profiles are off, or if you cannot verify both ports independently.

**After those checks** (and only then), continue below. The local E2E script recognizes either real loopback-only publishing or these precisely named enabled Windows Firewall block rules **plus** `QS_LAN_PROBE_BLOCKED=YES`, which asserts you completed the second-device checks. The rules may be removed via `Remove-NetFirewallRule -Name "QuickStroke-JSSF-Local-54321","QuickStroke-JSSF-Local-54322"` after the local stack is stopped permanently.

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
JSSF_RATE_LIMIT_SECRET=LOCAL_SYNTHETIC_RATE_LIMIT_SECRET_2026_09_ONLY
```

Stop/restart the loopback-only local stack with the same `start --network-id ... -x ...` command so Edge Runtime automatically loads `supabase/functions/.env`. Supabase injects its *local default* service-role credentials; do not copy cloud credentials. Confirm health returns `collectionEnabled:true` **only locally**.

After both second-device checks have failed and both Windows firewall rules are active, set `$env:QS_LAN_PROBE_BLOCKED = 'YES'` in the same PowerShell window and run `node tests/jssf-local-real-http-e2e.mjs`. The script hardcodes `127.0.0.1`, validates `supabase/config.toml` and disabled public client config, confirms loopback-only publishing **or** verified Windows Firewall isolation, requires empty local JSSF tables, and uses the Docker container `supabase_db_quickstroke-jssf-local`. It tests invalid consent and hostile origin, synthetic enrollment/token hashing, Face/Arm/Speech sanitized events with an Arm retry, event replay, malformed event rejection, completion lock, expired upload-token withdrawal, and PostgreSQL row counts. It deletes only the synthetic UUID it creates in a `finally` block and fails if cleanup is unverified.

The local environment is **not** an externally deployed HTTPS test and is not approved for community recruitment.

## Close the test gate immediately after testing

```powershell
Remove-Item .\supabase\functions\.env
npx --yes supabase@2.118.0 stop
```

This stops the synthetic-enabled runtime and preserves the local data backup. On the next start with the env file absent, verify `collectionEnabled:false`. Never commit the `.env` file.

**Before any real data collection**, separately review informed consent, age eligibility, withdrawal contact, actual device testing, non-primary retention (browser/backups/logs), and server abuse/rate limiting. The Free Supabase Cloud project remains unchanged and closed.
