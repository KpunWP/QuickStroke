(function initQuickStrokeSpeechCalibration(global) {
  'use strict';

  const VERSION = 'speech-mic-calibration-ios-robust-1.0.0';

  function finiteValues(values) {
    return Array.isArray(values)
      ? values.map(Number).filter(Number.isFinite)
      : [];
  }

  function percentile(values, q) {
    const sorted = finiteValues(values).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const bounded = Math.max(0, Math.min(1, Number(q) || 0));
    const index = Math.min(
      sorted.length - 1,
      Math.max(0, Math.round((sorted.length - 1) * bounded))
    );
    return sorted[index];
  }

  function deriveMicSignalCalibration(values, options = {}) {
    const frames = finiteValues(values);
    const quietPercentile = Math.max(0.05, Math.min(0.75, Number(options.quietPercentile) || 0.35));
    const highPercentile = Math.max(quietPercentile, Math.min(0.99, Number(options.highPercentile) || 0.90));
    const onsetMultiplier = Math.max(1, Number(options.onsetMultiplier) || 8);
    const offsetMultiplier = Math.max(1, Number(options.offsetMultiplier) || 4);
    const onsetMin = Math.max(0, Number(options.onsetMin) || 0.018);
    const offsetMin = Math.max(0, Number(options.offsetMin) || 0.010);
    const onsetMax = Math.max(onsetMin, Number(options.onsetMax) || 0.12);
    const offsetMax = Math.max(offsetMin, Number(options.offsetMax) || 0.06);

    const quietFloor = percentile(frames, quietPercentile);
    const highValue = percentile(frames, highPercentile);
    const rawOnsetThreshold = Math.max(onsetMin, quietFloor * onsetMultiplier);
    const rawOffsetThreshold = Math.max(offsetMin, quietFloor * offsetMultiplier);
    const onsetThreshold = Math.min(onsetMax, rawOnsetThreshold);
    const offsetThreshold = Math.min(offsetMax, rawOffsetThreshold);
    const outlierRatio = quietFloor > 0 ? highValue / quietFloor : null;

    return Object.freeze({
      policyVersion: VERSION,
      frameCount: frames.length,
      quietPercentile,
      highPercentile,
      quietFloor,
      highValue,
      outlierRatio,
      rawOnsetThreshold,
      rawOffsetThreshold,
      onsetThreshold,
      offsetThreshold,
      onsetCapped: rawOnsetThreshold > onsetThreshold,
      offsetCapped: rawOffsetThreshold > offsetThreshold
    });
  }

  global.QuickStrokeSpeechCalibration = Object.freeze({
    VERSION,
    percentile,
    deriveMicSignalCalibration
  });
})(typeof window !== 'undefined' ? window : globalThis);
