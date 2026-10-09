SET lock_timeout = '5s';
ALTER TABLE public.jssf_remote_sessions
  DROP CONSTRAINT jssf_remote_sessions_browser_family_check,
  ADD CONSTRAINT jssf_remote_sessions_browser_family_check
    CHECK (browser_family IN ('safari','chrome','samsung_internet','firefox','edge','other'));
