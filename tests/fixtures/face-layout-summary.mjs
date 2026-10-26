export function summaryFixture() {
  const keys=['display','position','object-fit','object-position','overflow-x','overflow-y','background-color','opacity','visibility'];
  const values=[['block','absolute','fill','50% 50%','hidden','hidden','rgb(0, 0, 0)','1','visible'],
    ['block','static','cover','50% 50%','clip','clip','rgb(14, 22, 32)','1','visible'],
    ['block','absolute','fill','50% 50%','visible','visible','rgba(0, 0, 0, 0)','1','visible'],
    ['none','relative','fill','50% 50%','visible','visible','rgba(0, 0, 0, 0)','1','visible']];
  const node=cs=>({r:[0,0,390,696],cs});
  return {schema:1,tool:'face-layout-20261026-v1',build:{sha:'a'.repeat(40),host:'PRIVATE_HOST_TOKEN'},css:{keys,values},starts:1,pendingSnapshots:0,
    snapshots:['before-start','after-start','after-start-250ms','after-start-1000ms','bands-visible','after-result-visible'].map((kind,i)=>({kind,at:[50,220,470,1220,1800,6000][i],
      viewport:{visual:[390,696,0,0,1]},elements:{body:node(2),'video-container':node(0),video:node(1),canvas:node(2),dashboard:{r:[12,72,366,i?50:0],cs:2},'score-box':{r:[12,560,366,i===5?120:0],cs:i===5?2:3}},
      video:{intrinsic:[480,640],track:{width:480,height:640,aspectRatio:.75}},
      state:{lang:'en-US',classes:i===0?['start-ready']:i===5?['result-visible']:['screening-active','notice-status'],startup:i===0?'ready':null}}))};
}
