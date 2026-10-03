-- P0 Face research telemetry for JSSF nonclinical analysis.
-- Adds sanitized derived Face summary/chunk event types only.
-- No images, video, audio, transcripts or raw biometric media are stored.

ALTER TABLE public.jssf_remote_events
  DROP CONSTRAINT IF EXISTS jssf_remote_events_event_type_check;

ALTER TABLE public.jssf_remote_events
  ADD CONSTRAINT jssf_remote_events_event_type_check
  CHECK (event_type IN (
    'module_run_completed',
    'test_attempt_completed',
    'technical_event',
    'face_research_summary',
    'face_research_chunk',
    'session_completed'
  ));

ALTER TABLE public.jssf_remote_events
  DROP CONSTRAINT IF EXISTS jssf_events_module_presence;

ALTER TABLE public.jssf_remote_events
  ADD CONSTRAINT jssf_events_module_presence CHECK (
    (
      event_type IN (
        'module_run_completed',
        'test_attempt_completed',
        'face_research_summary',
        'face_research_chunk'
      )
      AND module IS NOT NULL
    )
    OR event_type IN ('technical_event','session_completed')
  );

COMMENT ON TABLE public.jssf_remote_events IS
  'Append-only idempotent sanitized nonclinical JSSF events, including derived Face research summaries/chunks. Never stores raw audio, video, images, transcripts, names, precise device IDs or raw sensor streams.';
