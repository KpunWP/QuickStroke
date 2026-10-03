-- P0-A Face research telemetry for the JSSF nonclinical reliability/usability pilot.
-- No new identifiers or media tables are introduced. Derived telemetry remains a child
-- of jssf_remote_sessions through jssf_remote_events, so the existing withdrawal and
-- 90-day parent-session deletion continue to CASCADE across every research event.
ALTER TABLE public.jssf_remote_events
  DROP CONSTRAINT IF EXISTS jssf_remote_events_event_type_check;

ALTER TABLE public.jssf_remote_events
  ADD CONSTRAINT jssf_remote_events_event_type_check
  CHECK (event_type IN (
    'module_run_completed',
    'test_attempt_completed',
    'technical_event',
    'face_research_attempt',
    'face_research_samples',
    'session_completed'
  ));

ALTER TABLE public.jssf_remote_events
  DROP CONSTRAINT IF EXISTS jssf_events_module_presence;

ALTER TABLE public.jssf_remote_events
  ADD CONSTRAINT jssf_events_module_presence CHECK (
    (event_type IN ('module_run_completed','test_attempt_completed','face_research_attempt','face_research_samples') AND module IS NOT NULL)
    OR (event_type IN ('technical_event','session_completed'))
  );

COMMENT ON TABLE public.jssf_remote_events IS
  'Append-only idempotent sanitized nonclinical events, including derived numeric Face research telemetry. Never stores raw audio, video, images, transcripts, names, precise device IDs or raw biometric media.';
