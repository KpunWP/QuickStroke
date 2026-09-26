// Dependency-free browser-IndexedDB simulation for JSSF-only local deletion.
// Does not require a real participant, network, or browser.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const code=fs.readFileSync(path.join(root,"js/research-store.js"),"utf8");
const remoteId="S-REMOTESESSION1234567890";
const clinicId="S-CLINICSESSION1234567890";
const names=[
  "screening_sessions","module_runs","test_attempts","module_measurements",
  "sensor_observations","technical_events","result_projections","pending_sync",
  "session_amendments","audit_events"
];
const tables=new Map(names.map(name=>[name,new Map()]));
tables.set("metadata",new Map([["schema",{key:"schema",databaseVersion:2}]]));
tables.get("screening_sessions").set(remoteId,{
  screeningSessionId:remoteId,appMode:"research",researchProfile:"community_remote_qr"
});
tables.get("screening_sessions").set(clinicId,{
  screeningSessionId:clinicId,appMode:"research",researchProfile:"clinic_supervised"
});
for(const name of names.slice(1)) {
  tables.get(name).set(name+"-remote",{id:name+"-remote",screeningSessionId:remoteId});
  tables.get(name).set(name+"-clinic",{id:name+"-clinic",screeningSessionId:clinicId});
}
const engineering=new Map([["engineering-record",{secret:"must not touch"}]]);
let openedNames=[];
function transaction() {
  const tx={pending:0,aborted:false,completed:false};
  function settle() {
    if(tx.pending!==0||tx.aborted||tx.completed)return;
    Promise.resolve().then(()=>{
      if(tx.pending===0&&!tx.aborted&&!tx.completed) {
        tx.completed=true;tx.oncomplete?.();
      }
    });
  }
  function asyncRequest(action,req={}) {
    tx.pending++;
    Promise.resolve().then(()=>{
      try {
        if(tx.aborted)return;
        req.result=action();
        req.onsuccess?.({target:req});
      } catch(error) {
        req.error=error;
        req.onerror?.({target:req});
        tx.abort();
      } finally {tx.pending--;settle();}
    });
    return req;
  }
  tx.abort=()=>{
    if(tx.aborted)return;
    tx.aborted=true;
    Promise.resolve().then(()=>tx.onabort?.());
  };
  tx.objectStore=(name)=>{
    const data=tables.get(name);
    assert.ok(data,"Unknown store: "+name);
    return {
      get(key){return asyncRequest(()=>data.get(key)||null);},
      delete(key){return asyncRequest(()=>data.delete(key));},
      index(indexName) {
        assert.equal(indexName,"screeningSessionId");
        return {
          openCursor(value){
            const keys=[...data.keys()].filter(key=>data.get(key).screeningSessionId===value);
            const req={};
            let pointer=0;
            function next() {
              return asyncRequest(()=>{
                if(pointer>=keys.length)return null;
                const key=keys[pointer++];
                return {
                  delete(){return asyncRequest(()=>data.delete(key));},
                  continue(){next();}
                };
              },req);
            }
            return next();
          }
        };
      }
    };
  };
  return tx;
}
const database={transaction,close(){}};
const indexedDB={
  open(name,version){
    openedNames.push(name);
    assert.equal(name,"quickstroke_research");
    assert.equal(version,2);
    const req={};
    Promise.resolve().then(()=>{req.result=database;req.onsuccess?.({target:req});});
    return req;
  }
};
const global={
  console,indexedDB,QuickStrokeDataContract:{
    getSessionContext:()=>({appMode:"public"}),nowIso:()=>new Date().toISOString(),version:"quickstroke-common-data-0.2.0"
  },QuickStrokeAppMode:{resolveMode:()=>"public"},
  CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail;}}
};
new Function("window",code)(global);
const research=global.QuickStrokeResearchStore;
const remote=await research.purgeRemoteSessionLocal(remoteId);
assert.equal(remote.deleted,true);
assert.equal(tables.get("screening_sessions").has(remoteId),false);
for(const name of names.slice(1)) {
  assert.equal(tables.get(name).has(name+"-remote"),false,name);
  assert.equal(tables.get(name).has(name+"-clinic"),true,name);
}
assert.equal(tables.get("metadata").has("schema"),true);
assert.equal(engineering.has("engineering-record"),true);
console.log("PASS: erases every remote session-linked store without touching clinic, metadata, or Dev");

await assert.rejects(()=>research.purgeRemoteSessionLocal(clinicId),/Only a verified remote nonclinical session/);
assert.equal(tables.get("screening_sessions").has(clinicId),true);
assert.deepEqual(openedNames,["quickstroke_research","quickstroke_research"]);
const repeated=await research.purgeRemoteSessionLocal(remoteId);
assert.equal(repeated.alreadyAbsent,true);
console.log("PASS: refuses clinic deletion; repeat remote purge is idempotent");
