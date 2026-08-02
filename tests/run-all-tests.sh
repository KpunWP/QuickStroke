#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo '== Policy and source-freeze tests =='
node tests/run-tests.mjs
echo
echo '== External JavaScript syntax =='
for file in config.js service-worker.js js/*.js; do
  node --check "$file"
  echo "PASS $file"
done
echo
echo '== Inline JavaScript syntax =='
python3 tests/check-inline-scripts.py index.html face-test.html arm-test.html speech-test.html result.html
