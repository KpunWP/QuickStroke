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
      yawLimit: 18,
      pitchLimit: 18,
      rollLimit: 15,
      smileMin: 0.045,
      asymmetryWarn: 0.10,
      asymmetryFail: 0.16
    },

    arm: {
      holdSeconds: 10,
      driftWarnDeg: 12,
      driftFailDeg: 20
    },

    speech: {
      minSnrDb: 10,
      maxNoiseFlatness: 0.8,
      minSpeechDurationSec: 1.2
    }
  }
};
