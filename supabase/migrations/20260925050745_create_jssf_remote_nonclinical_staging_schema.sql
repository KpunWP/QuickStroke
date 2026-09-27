-- Applied to Supabase project quickstroke-jssf on 2026-09-25.
-- Safe nonclinical JSSF staging only. No client-facing grants or production QR.
CREATE TABLE public.jssf_remote_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id text NOT NULL UNIQUE CHECK (study_id ~ '^QS-([A-F0-9]{4}-){5}[A-F0-9]{4}$'),
  client_session_id text NOT NULL UNIQUE CHECK (client_session_id ~ '^S-[A-Za-z0-9_-]{12,100}$'),
  upload_token_sha256 text NOT NULL UNIQUE CHECK (upload_token_sha256 ~ '^[0-9a-f]{64}$'),
  consent_version text NOT NULL CHECK (length(consent_version) BETWEEN 5 AND 80),
  consented_at timestamptz NOT NULL,
  age_18_or_older boolean NOT NULL CHECK (age_18_or_older = true),
  participation_scope text NOT NULL DEFAULT 'usability_nonclinical'
    CHECK (participation_scope = 'usability_nonclinical'),
  research_profile text NOT NULL DEFAULT 'community_remote_qr'
    CHECK (research_profile = 'community_remote_qr'),
  app_version text NOT NULL CHECK (length(app_version) BETWEEN 1 AND 40),
  app_build_id text NOT NULL CHECK (length(app_build_id) BETWEEN 1 AND 120),
  platform_family text CHECK (platform_family IN ('ios','android','desktop','other')),
  browser_family text CHECK (browser_family IN ('safari','chrome','firefox','edge','other')),
  locale text NOT NULL DEFAULT 'th' CHECK (locale IN ('th','en','ja')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz,
  completed_at timestamptz,
  withdrawn_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  CONSTRAINT jssf_sessions_completed_time CHECK (status <> 'completed' OR completed_at IS NOT NULL),
  CONSTRAINT jssf_sessions_withdrawn_time CHECK (status <> 'withdrawn' OR withdrawn_at IS NOT NULL)
);
CREATE INDEX jssf_sessions_created_idx ON public.jssf_remote_sessions(created_at DESC);
CREATE INDEX jssf_sessions_status_idx ON public.jssf_remote_sessions(status, last_event_at DESC);
COMMENT ON TABLE public.jssf_remote_sessions IS 'Nonclinical JSSF opt-in remote testing. No real-patient/clinical sessions. Token stored only as SHA-256 digest.';

CREATE TABLE public.jssf_remote_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.jssf_remote_sessions(id) ON DELETE CASCADE,
  client_event_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('module_run_completed','test_attempt_completed','technical_event','session_completed')),
  module text CHECK (module IS NULL OR module IN ('face','arm','speech')),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 16384),
  schema_version text NOT NULL DEFAULT 'jssf-remote-ingest-0.1.0',
  CONSTRAINT jssf_events_idempotency UNIQUE (session_id, client_event_id),
  CONSTRAINT jssf_events_module_presence CHECK (
    (event_type IN ('module_run_completed','test_attempt_completed') AND module IS NOT NULL)
    OR (event_type IN ('technical_event','session_completed'))
  )
);
CREATE INDEX jssf_events_session_time_idx ON public.jssf_remote_events(session_id, occurred_at DESC);
CREATE INDEX jssf_events_type_idx ON public.jssf_remote_events(event_type, module, received_at DESC);
COMMENT ON TABLE public.jssf_remote_events IS 'Append-only idempotent sanitized nonclinical events. Never store raw audio, video, names, precise device IDs or raw sensor streams.';

ALTER TABLE public.jssf_remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jssf_remote_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jssf_remote_sessions, public.jssf_remote_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.jssf_remote_events_id_seq FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.jssf_remote_sessions, public.jssf_remote_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.jssf_remote_events_id_seq TO service_role;
