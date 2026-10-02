import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=fs.readFileSync(path.join(root,"jssf-consent.html"),"utf8");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const source=scripts.at(-1)?.[1] || "";
assert.ok(source.includes("function releaseReady()"),"Consent entry script not found");

function element(id){
  const handlers={};
  return {
    id,disabled:false,checked:false,hidden:false,textContent:"",innerHTML:"",
    attrs:new Map(),classList:{add(){},remove(){}},
    setAttribute(name,value){this.attrs.set(name,String(value));},
    addEventListener(name,fn){handlers[name]=fn;},
    async fire(name){return handlers[name]?.({target:this});}
  };
}

function harness({ready=false,initialContext=null,userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Safari"}={}){
  const ids=[
    "age-confirmation","consent-confirmation","start-testing","collection-state",
    "recruitment-badge","recruitment-notice","release-status-heading","consent-version-state",
    "resume-box","resume-meta","resume-testing","browser-guidance-text",
    "external-browser-gate","open-external-browser"
  ];
  const elements=Object.fromEntries(ids.map(id=>[id,element(id)]));
  const draft=[element("draft-1"),element("draft-2")];
  const sessionValues=new Map();
  let context=initialContext || {
    participantId:null,screeningSessionId:null,sessionStatus:null,appMode:"public",researchMetadata:null
  };
  let selectedMeta=null;
  const calls={configured:0,created:0,persisted:0,updated:0,enrolled:0,rollback:0,restored:0,resumeReads:0};
  const storedSessions=new Map();
  const window={
    QS_CONFIG:{jssfRemote:{consentVersion:"JSSF-CONSENT-TEST-1"}},
    QuickStrokeJssfRemote:{
      featureReady:()=>ready,
      enroll:async()=>{calls.enrolled++;return {sessionId:"remote-1"};},
      listWithdrawableEnrollments:async()=>[]
    },
    QuickStrokeAppMode:{
      configureResearchContext(input){
        calls.configured++;
        selectedMeta={...input,studyId:"QS-AAAA-BBBB-CCCC-DDDD-EEEE-FFFF"};
      },
      clearSessionSnapshot(){},
      clearResearchContext(){selectedMeta=null;},
      setMode(mode){if(mode==="public")calls.rollback++;}
    },
    QuickStrokeDataContract:{
      getSessionContext:()=>context,
      ensureScreeningContext(){
        context={
          participantId:"P-REMOTE-TEST",
          screeningSessionId:"S-REMOTE-TEST",
          sessionStatus:"active",
          sessionMode:null,
          appMode:"research",
          researchMetadata:{...selectedMeta}
        };
        calls.created++;
        return context;
      },
      restoreScreeningContext(record){
        context={
          participantId:record.participantId,
          screeningSessionId:record.screeningSessionId,
          sessionStatus:record.sessionStatus,
          sessionMode:record.sessionMode,
          appMode:"research",
          researchMetadata:record.researchMetadata
        };
        calls.restored++;
        return context;
      },
      createScreeningSessionRecord({context,sessionMode}){
        return {...context,sessionMode};
      }
    },
    QuickStrokeResearchStore:{
      stores:{screeningSessions:"screening_sessions"},
      get:async(_store,id)=>storedSessions.get(id)||null,
      getRemoteResumeBundle:async(id)=>{calls.resumeReads++;const session=storedSessions.get(id)||null;return session?{session,moduleRuns:[]}:null;},
      addScreeningSession:async record=>{storedSessions.set(record.screeningSessionId,record);calls.persisted++;},
      updateActiveScreeningSession:async(id,patch)=>{
        storedSessions.set(id,{...storedSessions.get(id),...patch});calls.updated++;
      }
    },
    location:{
      href:"https://quickstroke.vercel.app/jssf-consent.html",
      origin:"https://quickstroke.vercel.app"
    }
  };
  const document={
    getElementById:id=>elements[id],
    querySelectorAll:selector=>selector===".draft-only"?draft:[]
  };
  const sessionStorage={
    setItem:(k,v)=>sessionValues.set(k,v),
    getItem:k=>sessionValues.get(k)||null
  };
  const navigator={userAgent};
  new Function("window","document","sessionStorage","console","navigator",source)(window,document,sessionStorage,console,navigator);
  return {window,elements,draft,sessionValues,calls,storedSessions};
}

{
  const h=harness({ready:false});
  assert.equal(h.elements["age-confirmation"].disabled,true);
  assert.equal(h.elements["consent-confirmation"].disabled,true);
  assert.equal(h.elements["start-testing"].disabled,true);
  assert.match(h.elements["browser-guidance-text"].textContent,/Safari/);
  h.elements["age-confirmation"].checked=true;
  h.elements["consent-confirmation"].checked=true;
  await h.elements["start-testing"].fire("click");
  assert.equal(h.calls.enrolled,0);
  assert.equal(h.calls.persisted,0);
  assert.equal(h.window.location.href,"./jssf-consent.html");
  console.log("PASS: closed release gate keeps consent controls disabled and performs no enrollment");
}

{
  const h=harness({
    ready:true,
    userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Mobile Safari Line/15.20.0"
  });
  assert.equal(h.elements["external-browser-gate"].hidden,false);
  assert.equal(h.elements["age-confirmation"].disabled,true);
  assert.equal(h.elements["consent-confirmation"].disabled,true);
  assert.equal(h.elements["start-testing"].disabled,true);
  assert.match(h.elements["collection-state"].textContent,/เปิดด้วย Safari/);
  console.log("PASS: iPhone LINE in-app browser is gated before consent and start");
}

{
  const h=harness({ready:true});
  assert.equal(h.elements["age-confirmation"].disabled,false);
  assert.equal(h.elements["consent-confirmation"].disabled,false);
  h.elements["age-confirmation"].checked=true;
  h.elements["consent-confirmation"].checked=true;
  await h.elements["age-confirmation"].fire("change");
  await h.elements["consent-confirmation"].fire("change");
  assert.equal(h.elements["start-testing"].disabled,false);
  await h.elements["start-testing"].fire("click");
  assert.equal(h.calls.configured,1);
  assert.equal(h.calls.created,1);
  assert.equal(h.calls.persisted,1);
  assert.equal(h.calls.enrolled,1);
  assert.equal(h.sessionValues.get("fast_mode"),"full");
  assert.equal(h.sessionValues.get("fast_lang"),"th");
  assert.equal(h.window.location.href,"./face-test.html");
  const stored=[...h.storedSessions.values()][0];
  assert.equal(stored.appMode,"research");
  assert.equal(stored.researchMetadata.researchProfile,"community_remote_qr");
  assert.equal(stored.researchMetadata.operatorRole,"participant_self_service");
  assert.equal(stored.sessionMode,"full");
  console.log("PASS: open release gate requires both confirmations, persists remote Research full-flow, enrolls, then navigates to Face");
}

{
  const h=harness({ready:true,initialContext:{
    participantId:"P-CLINIC",screeningSessionId:"S-CLINIC",sessionStatus:"active",
    appMode:"research",researchMetadata:{researchProfile:"clinic_supervised",consentStatus:"consented"}
  }});
  h.elements["age-confirmation"].checked=true;
  h.elements["consent-confirmation"].checked=true;
  await h.elements["age-confirmation"].fire("change");
  await h.elements["consent-confirmation"].fire("change");
  await h.elements["start-testing"].fire("click");
  assert.equal(h.calls.configured,0);
  assert.equal(h.calls.created,0);
  assert.equal(h.calls.persisted,0);
  assert.equal(h.calls.enrolled,0);
  assert.equal(h.window.location.href,"./jssf-consent.html");
  assert.match(h.elements["collection-state"].textContent,/Research\/Dev session/);
  console.log("PASS: consent entry refuses to overwrite an active clinic or Dev session");
}
