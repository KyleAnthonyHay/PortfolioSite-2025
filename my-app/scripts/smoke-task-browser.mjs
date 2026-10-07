const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || (() => { throw new Error('Set PLAYWRIGHT_MODULE to the installed Playwright module'); })());
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
assert.ok(process.argv.includes('--live-ai'), 'Pass --live-ai to run the API-backed app test');
assert.ok(process.env.TASK_TEST_OUTPUT, 'Set TASK_TEST_OUTPUT to the artifact directory');
const artifacts=process.env.TASK_TEST_OUTPUT;
const origin=process.env.TASK_TEST_ORIGIN || 'http://localhost:3000';
await fs.mkdir(artifacts,{recursive:true});
const conversationId=randomUUID();
const browser=await chromium.launch({headless:true, executablePath:process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror', error=>errors.push(error.message));
await page.addInitScript(id=>{
 if(!localStorage.getItem('task-browser-initialized')) {
  localStorage.setItem('portfolio-chat-context',JSON.stringify({hiring:false}));
  localStorage.setItem('portfolio-chat-id',id);
  localStorage.setItem('portfolio-chat-v2','[]');
  localStorage.setItem('task-browser-initialized','1');
 }
},conversationId);
try {
 await page.goto(origin+'/chat');
 await page.getByRole('textbox',{name:'Message',exact:true}).fill("Show me Kyle's projects and describe SelahNote.");
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Also show me his resume.');
 assert.equal(await page.getByRole('button',{name:'Send message',exact:true}).isEnabled(),true);
 const accepted=page.waitForResponse(response=>response.url().endsWith('/api/tasks') && response.request().method()==='POST' && response.status()===202);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await accepted;
 await page.reload();
 let state;
 const deadline=Date.now()+90000;
 while(Date.now()<deadline) {
  state=await page.evaluate(async id=>(await fetch('/api/tasks?conversationId='+id)).json(),conversationId);
  if(state.tasks.length>=2 && !state.turns.length && state.tasks.every(task=>task.status==='completed')) break;
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 assert.ok(state.tasks.length>=2);
 assert.ok(state.tasks.every(task=>task.status==='completed'),JSON.stringify(state.tasks.map(task=>({status:task.status,goal:task.instruction}))));
 await page.getByText('This task was canceled.',{exact:true}).count().then(n=>assert.equal(n,0));
 await page.waitForTimeout(1100);
 assert.ok((await page.locator('body').innerText()).includes('SelahNote'));
 assert.ok((await page.locator('body').innerText()).match(/résumé|resume/i));
 assert.deepEqual(errors,[]);
 await page.screenshot({path:artifacts+'/tasks-after-reload.png',fullPage:true});
 await fs.writeFile(artifacts+'/browser-verification.json',JSON.stringify({overlappingSendEnabled:true,reloadRetainsExecution:true,tasks:state.tasks.map(task=>({goal:task.instruction,status:task.status,revision:task.revision})),pageErrors:errors},null,2));
 console.log('PASS browser: can send while work is active; both tasks finish after reload; no page errors');
} finally {await browser.close();}
