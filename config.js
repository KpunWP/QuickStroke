window.QS_CONFIG = {
  appName: "QuickStroke",
  version: "1.0.21",
  buildId: "20260926-jssf-90day-retention-staging-v2",
  configVersion: "quickstroke-config-1.0.21",

  // Not collecting. 90-day primary DB retention is in place; eligibility,
  // browser/backup handling, withdrawal contact and final consent remain undecided.
  // The remote client and preview page are deliberately fail-closed.
  jssfRemote: {
    enabled: false,
    consentApproved: false,
    agePolicyApproved: false,
    retentionPolicyApproved: false,
    minimumAge18Enforced: false,
    consentVersion: null,
    retentionDays: 90,
    privacyContact: null,
    endpoint: "https://pzzjfnfwppdeketjdhfo.supabase.co/functions/v1/jssf-remote-ingest"
  },

  defaultLang: "th",
  supportedLangs: ["th", "en", "ja"],

  assetVersions: {
    localePack: "20260801-clinic-feasibility-v1",
    languageRegistry: "20260720-language-registry-v1"
  },

  emergency: {
    th: "1669",
    en: "local emergency services",
    ja: "救急"
  },

  scoring: {
    // Retained only for research summaries. These weights do not determine
    // the user-facing combined result in result-policy-1.1.0.
    faceWeight: 0.4,
    armWeight: 0.4,
    speechWeight: 0.2,
    singlePositiveOverride: true
  },

  resultPolicy: {
    version: "result-policy-1.1.0",
    combinedDecisionBasis: "categorical_module_status_only",
    repeatedRunSelectionPolicy: "any_valid_abnormal_within_session_sticky",
    selectionPolicyVersion: "quickstroke-selection-policy-1.0.0",
    weightedScoreUse: "research_only_not_user_facing"
  },

  resultDiagnostics: {
    version: "result-dev-diagnostics-1.3.0",
    enabledQuery: "dev=1",
    globalDevModeKey: "quickstroke_dev_mode",
    globalDevModeVersion: "quickstroke-dev-mode-0.3.0",
    sanitized: true,
    rawPayloadIncluded: false
  },

  appModes: {
    version: "quickstroke-app-mode-1.0.1",
    studyIdPolicyVersion: "quickstroke-study-id-random-1.0.0",
    defaultMode: "public",
    allowedModes: ["public", "research", "dev"]
  },

  research: {
    policyVersion: "quickstroke-research-policy-1.0.0",
    selectionPolicyVersion: "quickstroke-selection-policy-1.0.0",
    integrityPolicyVersion: "quickstroke-integrity-policy-1.0.0",
    microphonePrivacyVersion: "quickstroke-microphone-privacy-1.0.0",
    consent: {
      version: "PRE_IRB_TEST_ONLY",
      source: "deployment_config",
      status: "pre_irb_device_test"
    },
    activeProfile: "clinic_supervised",
    profiles: {
      clinic_supervised: { enabled: true, dataCollectionEnabled: true },
      community_remote_qr: { enabled: false, dataCollectionEnabled: false }
    },
    // maxProtocolModuleRuns limits protocol-selection eligibility only.
    // It does not block additional retries; later runs are repeatability runs.
    retryLimits: {
      face: { maxProtocolModuleRuns: 2 },
      arm: { maxProtocolModuleRuns: 2 },
      speech: { maxProtocolModuleRuns: 2 }
    },
    upload: { enabled: false, endpoint: null }
  },

  thresholds: {
    face: {
      // Version identifiers are stored with every Face result for reproducibility.
      version: "face-prepilot-1.4.0",
      algorithmVersion: "face-asymmetry-1.2.0",
      resultSchemaVersion: "face-result-1.3.0",
      researchPayloadVersion: "face-research-0.3.0",
      calibrationSeconds: 3,
      actionDurationMs: 4000,
      maxAssessAttempts: 3,
      retryDelayMs: 2500,
      smileNudgeMinMs: 2500,

      // Active pre-pilot threshold. A higher value is more sensitive because
      // weakRatio < threshold is classified as abnormal.
      weakSideRatioBad: 0.45,

      // Research-only shadow comparison. This value never changes the result.
      weakSideRatioShadow: 0.30,

      smileDetectMin: 0.030,
      smileDetectSide: 0.045,
      smileValidStrength: 0.020,
      realMoveMin: 0.0018,
      closedSmileRiseMin: 0.0018,
      smileRealMin: 0.018,

      // v1.1 algorithm policy:
      // - blendshape must support smile confirmation
      // - 2D normalized geometry may support/grade symmetry but cannot confirm alone
      // - x/y only; landmark z is not used
      geometryNormalization: "eye-centered-2d-roll-scale",
      geometryUsesLandmarkZ: false,
      yawPitchPolicy: "quality-gate-only",

      // v1.2 geometry policy:
      // keep signed displacement on every frame; do not clamp downward movement.
      // Aggregate valid smile frames robustly, then derive positive effective rise.
      geometryFrameDisplacement: "signed-baseline-minus-current",
      geometryRiseAggregation: "median-of-valid-smile-frames",
      geometryEffectiveRisePolicy: "max-zero-after-aggregation",
      geometryPerFrameClamp: false,

      minValidSmileFrames: 2,
      minVisibleMouthFrames: 5,
      minMouthVisibilityScore: 0.052,
      minMouthDarkRatio: 0.003,
      minMouthCentralDarkRatio: 0.002,
      minMouthLineScore: 0.010,
      handMouthOverlapMin: 0.08,

      maxWaitForSmileMs: 14000,
      baselineAlignmentTimeoutMs: 30000,
      smileLostGraceMs: 1400,
      smileOcclusionResetMs: 120,
      minValidSmileRatio: 0.05,

      smileAsymWarn: 0.22,
      smileAsymBad: 0.32,
      restAsymCritical: 0.30,
      criticalNoticeMs: 2000,

      maxAllowedYaw: 28,
      maxAllowedPitch: 24,
      maxAllowedRoll: 20,
      poseBadTripFrames: 3,
      poseGoodResumeFrames: 8,

      // During normal-volunteer pre-pilot, continue in degraded mode if the
      // hand model is unavailable and record HAND_MODEL_UNAVAILABLE.
      // Revisit enforceHandModel=true before testing with real patients.
      enforceHandModel: false,

      // Compact research telemetry. No image or video is stored.
      researchSampleIntervalMs: 100,

      // Attempt-level invalid-reason normalization. These values classify why an
      // attempt was invalid; they do not change the clinical score or thresholds.
      attemptMouthAssessableRatioMin: 0.25,
      attemptHandOverlapRatioMin: 0.15
    },

    arm: {
      // Formal data-contract identifiers. These label the existing pre-pilot
      // algorithm and do not imply clinical validation.
      version: "arm-prepilot-1.1.0",
      algorithmVersion: "arm-drift-1.0.0",
      resultSchemaVersion: "arm-result-1.0.1",
      researchPayloadVersion: "arm-research-1.0.1",
      sensorCapturePolicyVersion: "arm-sensor-capture-1.0.0",
      researchSampleIntervalMs: 100,
      sensorGapThresholdMs: 250,

      // ระยะเวลาวัดแขนแต่ละข้าง
      measureSec: 10,
    
      // มุมเปลี่ยนของ Gravity Vector
      // ต่ำกว่า 5° = ปกติ
      // 5° ถึงต่ำกว่า 10° = ยังไม่ชัดเจน ให้ทดสอบใหม่
      // ตั้งแต่ 10° = วิเคราะห์ต่อว่าเป็นแขนตกหรือข้อมือหมุน
      normalDriftMaxDeg: 5,
      driftFailDeg: 10,
    
      // แยกรูปแบบแขนตกออกจากการหมุนข้อมือ
      wristRatioThr: 0.20,
      dropZMin: 0.04,
    
      // ตรวจความนิ่งก่อนสร้าง Gravity baseline
      stableWindow: 20,
      stableAngleDeg: 2.5,
      stableHold: 25,
    
      // ตรวจว่าโทรศัพท์อยู่ในแนวตั้ง ไม่ได้วางราบ
      flatZThr: 0.90,
      portraitYMin: 0.55,
    
      // ต้องเกิน threshold ต่อเนื่องกี่มิลลิวินาที
      // thresholdAlertHoldMs เป็นชื่อหลักที่ arm-test ใช้
      thresholdAlertHoldMs: 600,
      // Legacy alias สำหรับไฟล์รุ่นเก่า ต้องให้ค่าเท่ากัน
      driftFailHoldMs: 600,

      // Technical sensor timing — ไม่ใช่ arm-drift/scoring threshold
      // ถ้าไม่มี DeviceMotion เกินช่วงนี้ จึงใช้ DeviceOrientation fallback
      motionFallbackMs: 1000,
      // คงพฤติกรรมเดิม: เริ่ม pre-measure recheck ทันทีหลัง baseline
      preMeasureDelayMs: 0,
    
      // เวลารอก่อนเริ่มทดสอบใหม่
      retrySec: 6,
    
      // Low-pass filter สำหรับลด sensor noise
      lpf: 0.15
    },

    // Readiness/configuration layer แยกจาก arm-drift algorithm เดิม
    armReadiness: {
      version: "arm-readiness-1.1.0",
      sampleFreshMs: 2000,
      sensorWaitTimeoutMs: 6000,
      preMeasureMaxDeltaDeg: 5,
      movedFromRestMinDeg: 8,

      // Hard gates ที่ใช้ในรอบนี้
      enforcePortraitScreen: true,

      // Hard gate: after correcting the iOS gravity-axis sign, reject upside-down posture.
      enforceTopUp: true,
      enforceMovedFromRest: false
    },

    speech: {
      // Version identifiers stored with every Speech result.
      version: "speech-prepilot-1.8.0",
      algorithmVersion: "speech-browser-asr-1.4.0",
      resultSchemaVersion: "speech-result-1.4.1",
      researchPayloadVersion: "speech-research-0.5.1",

      // Speech phrase scoring v1.1:
      // - browser ASR confidence is stored as a raw observation only
      // - phrase score comes from normalized transcript similarity against accepted variants
      // - an exact accepted variant receives 100
      phraseScoringPolicy: "normalized_levenshtein_similarity",
      asrConfidencePolicy: "raw_observation_only",

      // Pre-pilot result policy v1.3.1:
      // - no combined numeric score is shown or used as the primary decision
      // - phrase, rate, and technical quality are surfaced independently
      // - all numeric scores remain research variables for patient-data analysis
      // - interim-only ASR with coverage below 0.60 is indeterminate, not a phrase alert
      decisionPolicy: "unvalidated_domain_observation_v1_2",
      phraseAlertPolicy: "exact_variant_no_alert_else_attention",
      rateReferencePolicy: "outside_exploratory_range_attention",
      rateMinTranscriptCoverage: 0.60,
      combinedScorePolicy: "research_only_not_displayed",
      stabilityPolicy: "research_only",

      // Speech-rate scoring v1.2:
      // - rate is calculated independently from phrase correctness
      // - the fixed target phrase unit count is divided by the resolved active-speech duration
      // - ASR speech-start confirms onset; calibrated time-domain mic activity trims both ends
      rateScoringPolicy: "target_phrase_units_per_resolved_active_speech_duration",
      rateSpeechUnitSource: "target_phrase_fixed",
      rateTimingPolicy: "asr_mic_hybrid_v1_1",
      asrStartPrerollMs: 120,
      micStartPrerollMs: 80,
      micEndPostrollMs: 80,
      micOnsetHoldMs: 100,
      micHangoverMs: 180,
      micSignalOnsetMultiplier: 8,
      micSignalOffsetMultiplier: 4,
      micSignalOnsetMin: 0.018,
      micSignalOffsetMin: 0.010,
      speechPrerollBufferMs: 400,

      // iOS microphone streams can contain startup transients or prompt leakage.
      // Discard a short warm-up window, estimate the quiet baseline from a
      // low percentile, and cap only the technical time-domain VAD thresholds.
      micCalibrationPolicyVersion: "speech-mic-calibration-ios-robust-1.0.0",
      micCalibrationWarmupMs: 400,
      micCalibrationQuietPercentile: 0.35,
      micCalibrationHighPercentile: 0.90,
      micSignalOnsetMax: 0.12,
      micSignalOffsetMax: 0.06,

      calibrationMs: 300,
      noiseMultiplier: 2.5,
      noiseFloorCap: 0.08,
      
      normalMin: 2.5,
      normalMax: 6.0,
      
      // Pre-pilot policy: low SNR remains score-usable and is recorded as
      // a quality warning. It must not force a retry or become invalid.
      minSnrDb: 10,
      snrWarnDb: 10,
      lowSnrPolicy: "quality_flag_only",
      
      flatnessMax: 0.78,
      maxNoiseFlatness: 0.78,
      
      // A 6-unit phrase at the configured normal maximum (6 units/s) lasts 1.0 s.
      // Keep this as a technical minimum below the valid rate range so fast normal speech is not invalidated.
      minSpeechDurationSec: 0.6,
      minEnergyFrames: 10,

      // One automatic retry is allowed for no voice / voice not recognized.
      // Low SNR never triggers this retry.
      autoValidityRetryCount: 1,
      autoValidityRetryDelayMs: 1500,

      // Retry/session lifecycle. Reuse the iOS pipeline only after a real
      // signal health check; otherwise fully release and create a new session.
      keepMicAliveOnIOS: true,
      reuseHealthProbeMs: 450,
      reuseEnergyMin: 0.00001,
      retryFullReleaseWaitMs: 1200,
      resultKeepAliveMs: 20000,

      // Existing operational timings moved from the page without changing values.
      deadMicSilenceMs: 2000,
      deadMicEnergyMin: 0.00001,
      deadMicMaxAttempts: 4,
      recognitionSafetyMs: 8000,
      trailingGapMs: 800,
      researchSampleIntervalMs: 100
    }
  }
};
