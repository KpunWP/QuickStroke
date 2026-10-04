import fs from "node:fs";
import assert from "node:assert/strict";

const consent=fs.readFileSync("jssf-consent.html","utf8");
const config=fs.readFileSync("config.js","utf8");

assert.match(config,/buildId:\s*"20261004-jssf-pilot-freeze-v4"/);
assert.match(consent,/function mobilePhoneEligibility\(\)/);
assert.match(consent,/navigator\.userAgentData\?\.mobile/);
assert.match(consent,/iPhone\|iPod/);
assert.match(consent,/Android/);
assert.match(consent,/requiresMobilePhone=!eligibility\.isPhone/);
assert.match(consent,/!requiresMobilePhone && age\.checked && consent\.checked/);
assert.match(consent,/age\.disabled=!ready \|\| requiresExternalBrowser \|\| requiresMobilePhone/);
assert.match(consent,/อุปกรณ์นี้ไม่รองรับการทดสอบ JSSF กรุณาใช้ iPhone หรือโทรศัพท์ Android/);
assert.match(consent,/การทดสอบนี้ต้องทำผ่านโทรศัพท์มือถือ/);
console.log("PASS: JSSF consent hard-gates desktop/tablet and requires a mobile phone before enrollment");
