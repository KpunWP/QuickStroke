window.QS_CONFIG = {
  appName: "QuickStroke",
  version: "1.0.0",

  defaultLang: "th",
  supportedLangs: ["th", "en", "ja"],

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
      calibrationSeconds: 3,
      actionDurationMs: 4000,
      maxAssessAttempts: 3,
      retryDelayMs: 2500,
      weakSideRatioBad: 0.30,

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
      smileLostGraceMs: 1400,
      smileOcclusionResetMs: 120,
      minValidSmileRatio: 0.05,

      smileAsymWarn: 0.22,
      smileAsymBad: 0.32,
      weakSideRatioBad: 0.45,

      maxAllowedYaw: 28,
      maxAllowedPitch: 24,
      maxAllowedRoll: 20
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
      driftFailHoldMs: 600,
    
      // เวลารอก่อนเริ่มทดสอบใหม่
      retrySec: 6,
    
      // Low-pass filter สำหรับลด sensor noise
      lpf: 0.15
    },

    speech: {
      calibrationMs: 300,
      noiseMultiplier: 2.5,
      noiseFloorCap: 0.08,
      
      normalMin: 2.5,
      normalMax: 6.0,
      
      minSnrDb: 10,
      snrWarnDb: 10,
      
      flatnessMax: 0.78,
      maxNoiseFlatness: 0.78,
      
      minSpeechDurationSec: 1.2
    }
  }
};
