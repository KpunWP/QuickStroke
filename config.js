window.QS_CONFIG = {
  appName: "QuickStroke",
  version: "1.0.4",

  defaultLang: "th",
  supportedLangs: ["th", "en", "ja"],

  assetVersions: {
    localePack: "20260721-speech-review-v1",
    languageRegistry: "20260720-language-registry-v1"
  },

  emergency: {
    th: "1669",
    en: "local emergency services",
    ja: "救急"
  },

  scoring: {
    faceWeight: 0.4,
    armWeight: 0.4,
    speechWeight: 0.2,
    singlePositiveOverride: true
  },

  thresholds: {
    face: {
      // Version identifiers are stored with every Face result for reproducibility.
      version: "face-prepilot-1.2.3",
      algorithmVersion: "face-asymmetry-1.0.0",
      resultSchemaVersion: "face-result-1.1.0",
      researchPayloadVersion: "face-research-0.1.1",
      researchHistoryLimit: 8,

      calibrationSeconds: 3,
      actionDurationMs: 4000,
      maxAssessAttempts: 3,
      retryDelayMs: 2500,

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
      researchSampleIntervalMs: 100
    },

    arm: {
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
      version: "arm-readiness-1.0.1",
      sampleFreshMs: 2000,
      sensorWaitTimeoutMs: 6000,
      preMeasureMaxDeltaDeg: 5,
      movedFromRestMinDeg: 8,

      // Hard gates ที่ใช้ในรอบนี้
      enforcePortraitScreen: true,

      // Shadow mode: เก็บค่าและ log แต่ยังไม่ปฏิเสธ measurement
      enforceTopUp: false,
      enforceMovedFromRest: false
    },

    speech: {
      // Version identifiers stored with every Speech result.
      version: "speech-prepilot-1.3.0",
      algorithmVersion: "speech-browser-asr-1.0.0",
      resultSchemaVersion: "speech-result-1.0.0",

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
      
      minSpeechDurationSec: 1.2,
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
