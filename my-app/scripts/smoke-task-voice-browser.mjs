const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || (() => { throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright module'); })());
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
assert.ok(process.argv.includes('--live-ai'), 'Pass --live-ai to run the API-backed app test');
assert.ok(process.env.TASK_TEST_OUTPUT, 'Set TASK_TEST_OUTPUT to the artifact directory');
const artifacts=process.env.TASK_TEST_OUTPUT;
const origin=process.env.TASK_TEST_ORIGIN || 'http://localhost:3000';
assert.ok(process.env.TASK_TEST_MICROPHONE, 'Set TASK_TEST_MICROPHONE to a WAV fixture');
await fs.mkdir(artifacts,{recursive:true});
const conversationId=randomUUID();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture='+process.env.TASK_TEST_MICROPHONE,'--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(id=>{
 localStorage.setItem('portfolio-chat-context',JSON.stringify({hiring:false}));
 localStorage.setItem('portfolio-chat-id',id);
 localStorage.setItem('portfolio-chat-v2','[]');
 const test={events:[],chunks:[],recorder:null,tracks:[]};
 window.voiceTest=test;
 const Original=window.RTCPeerConnection;
 window.RTCPeerConnection=class extends Original {
  constructor(...args) {
   super(...args);
   this.addEventListener('track', event=>{
    if(test.recorder) return;
    const recorder=new MediaRecorder(event.streams[0] ?? new MediaStream([event.track]),{mimeType:'audio/webm;codecs=opus'});
    test.recorder=recorder;
    recorder.ondataavailable=event=>test.chunks.push(event.data);
    recorder.start(1000);
   });
  }
  addTrack(track,...streams) {test.tracks.push(track);return super.addTrack(track,...streams);}
  createDataChannel(...args) {
   const channel=super.createDataChannel(...args);
   channel.addEventListener('message',event=>{try {test.events.push(JSON.parse(event.data));} catch {}});
   return channel;
  }
 };
},conversationId);
try {
 await page.goto(origin+'/chat');
 await page.getByRole('button',{name:'Talk to my AI',exact:true}).click();
 await page.getByRole('button',{name:'Hang up',exact:true}).waitFor({timeout:15000});
 const firstAccepted=await page.waitForResponse(response=>response.url().endsWith('/api/tasks') && response.request().method()==='POST' && response.status()===202 && JSON.parse(response.request().postData()||'{}').voice===true,{timeout:30000});
 assert.equal(firstAccepted.status(),202);
 await page.evaluate(()=>window.voiceTest.tracks.forEach(track=>{track.enabled=false;}));
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Also show me his resume.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 let state;
 const deadline=Date.now()+60000;
 while(Date.now()<deadline) {
  state=await page.evaluate(async id=>(await fetch('/api/tasks?conversationId='+id)).json(),conversationId);
  const voice=state.tasks.find(task=>task.input.voice && task.status==='completed' && ['submitted','interrupted'].includes(task.delivery));
  const resume=state.tasks.find(task=>task.events.some(e=>e.type==='widget' && e.widget.kind==='resume') && task.status==='completed');
  const transcript=await page.evaluate(()=>window.voiceTest.events.filter(e=>e.type==='session.output_transcript.delta').map(e=>e.delta).join(''));
  if(voice && resume && /built.*projects|projects.*(?:AI|iOS|screen)/is.test(transcript)) break;
  await new Promise(resolve=>setTimeout(resolve,750));
 }
 await fs.writeFile(artifacts+'/voice-events.json',JSON.stringify(await page.evaluate(()=>window.voiceTest.events),null,2));
 assert.ok(state.tasks.some(task=>task.input.voice && task.status==='completed' && ['submitted','interrupted'].includes(task.delivery)),JSON.stringify(state.tasks.map(t=>({goal:t.instruction,status:t.status,delivery:t.delivery}))));
 assert.ok(state.tasks.some(task=>task.events.some(e=>e.type==='widget' && e.widget.kind==='resume') && task.status==='completed'));
 await page.waitForTimeout(5000);
 const capture=await page.evaluate(async()=>{
  const test=window.voiceTest;
  if(test.recorder && test.recorder.state!=='inactive') await new Promise(resolve=>{test.recorder.onstop=resolve;test.recorder.stop();});
  const bytes=new Uint8Array(await new Blob(test.chunks,{type:'audio/webm'}).arrayBuffer());
  let raw='';for(const byte of bytes) raw+=String.fromCharCode(byte);
  return {audio:btoa(raw),transcript:test.events.filter(e=>e.type==='session.output_transcript.delta').map(e=>e.delta).join(''),delegations:test.events.filter(e=>e.type==='session.delegation.created').length};
 });
 assert.match(capture.transcript,/built.*projects|projects.*(?:AI|iOS|screen)/is);
 assert.deepEqual(errors,[]);
 await fs.writeFile(artifacts+'/task-voice.webm',Buffer.from(capture.audio,'base64'));
 await fs.writeFile(artifacts+'/voice-verification.json',JSON.stringify({transcript:capture.transcript,delegations:capture.delegations,tasks:state.tasks.map(t=>({goal:t.instruction,status:t.status,delivery:t.delivery})),pageErrors:errors},null,2));
 console.log('PASS actual voice app: Live handoff -> task worker -> sideband -> spoken project answer; typed additive resume preserved');
} finally {
 const hangup=page.getByRole('button',{name:'Hang up',exact:true});
 if(await hangup.count()) await hangup.click().catch(()=>{});
 await page.waitForTimeout(1500);
 await browser.close();
}
