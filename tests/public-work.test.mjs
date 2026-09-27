import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { MAX_PUBLIC_WORK_BYTES, validatePublicWorkSnapshot } from '../src/lib/contracts.mjs';
import { loadPublicWorkSnapshot } from '../src/lib/public-work.mjs';

const sample = () => ({ schema:'focusa.public_work_snapshot.v1', visibility:'public', project:'Example project',
  mission:'Deliver the Work view', state:'active', stage:'Verification', next_action:'Verify the visible view',
  checkpoint_at:'2026-09-08T20:00:00Z', published_at:'2026-09-08T20:01:00Z', stale:false });
class Element {
  constructor(tag='div') { this.tagName=tag; this.children=[]; this.value=''; this.listeners={}; this.classList={add(){}}; }
  set textContent(value) { this.value=String(value); this.children=[]; }
  get textContent() { return this.value + this.children.map(child=>child.textContent).join(' '); }
  set innerHTML(_) { throw new Error('HTML injection forbidden'); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.value=''; this.children=children; }
  addEventListener(type, callback) { this.listeners[type]=callback; }
}
function dom() {
  const host=new Element(), other=new Element(), button=new Element('button'), nodes=new Map();
  nodes.set('[data-widget="focus"]',host);
  return {host,other,button, body:new Element('body'),createElement:tag=>new Element(tag),
    querySelector(selector){if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector);},
    querySelectorAll(selector){return selector==='[data-widget]'?[host,other]:selector==='button'?[button]:[];}};
}

test('public contract rejects extra private fields, versions, states and malformed timestamps',()=>{
  assert.equal(validatePublicWorkSnapshot(sample()).state,'active');
  for(const change of [{token:'PRIVATE'},{schema:'focusa.public_work_snapshot.v2'}, {visibility:'private'},
    {state:'running-workers'},{stale:'false'},{published_at:'invalid'},{mission:'x'.repeat(481)}]) {
    assert.throws(()=>validatePublicWorkSnapshot({...sample(),...change}));
  }
});
test('loader omits credentials and authorization, reads bounded JSON',async()=>{
  const result=await loadPublicWorkSnapshot('chrome-extension://test/public-work.json',async(url,options)=>{
    assert.equal(options.credentials,'omit'); assert.equal(options.headers,undefined);
    assert.equal(options.cache,'no-store'); assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(sample()));
  });
  assert.equal(result.project,sample().project);
});
test('loader rejects errors, invalid JSON and excessive output',async()=>{
  for(const response of [new Response('',{status:404}),new Response('not JSON'),new Response('x'.repeat(MAX_PUBLIC_WORK_BYTES+1))]) {
    await assert.rejects(loadPublicWorkSnapshot('chrome-extension://test/public-work.json',async()=>response));
  }
});


test('public bootstrap loads a dedicated module and never reads private state', async () => {
  const startpage = await readFile(new URL('../src/startpage.mjs', import.meta.url), 'utf8');
  const publicModule = await readFile(new URL('../src/startpage-public.mjs', import.meta.url), 'utf8');
  // The private start page branches to a separate public module (docs/17 §5).
  assert.ok(startpage.includes("searchParams.get('public-work') === '1') {"));
  assert.match(startpage, /await import\('\.\/startpage-public\.mjs'\)/);
  // The public module must not reach private storage or private projections.
  for (const forbidden of [/chrome\.storage/, /listConnections/, /listLocalEnvironments/, /listNotifications/, /notificationFromEvent/, /runReliableEventStream/]) {
    assert.doesNotMatch(publicModule, forbidden, `public module must not use ${forbidden}`);
  }
  // The private route is retained for the normal (non-public) start page.
  assert.match(startpage, /loadSelectedConnection\(\)/);
  assert.match(startpage, /startStream\(\)/);
});

test('public module renders the docs/17 §5 layout from a validated snapshot', async () => {
  const publicModule = await readFile(new URL('../src/startpage-public.mjs', import.meta.url), 'utf8');
  const html = await readFile(new URL('../src/startpage.html', import.meta.url), 'utf8');
  // Atlas regions: PUBLIC SNAPSHOT date, mission, WORKFORCE | CURRENT WORK, PROOF, CTA.
  for (const id of ['public-date', 'public-mission', 'public-workforce', 'public-current', 'public-proof', 'public-cta', 'public-failure', 'public-disclaimer']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  // It renders from the validated contract, and never represents it as live telemetry.
  assert.match(publicModule, /loadPublicWorkSnapshot/);
  // The snapshot is presented as dated, and public mode never streams.
  assert.match(publicModule, /dated snapshot, not live agent telemetry/i);
  assert.match(html, /dated snapshot, not live agent telemetry/);
  assert.doesNotMatch(publicModule, /runReliableEventStream|EventSource|setInterval/);
  // Failure replaces the body rather than falling through to private mode.
  assert.match(publicModule, /showFailure\(\)/);
  assert.doesNotMatch(publicModule, /start-private|workforce\.html/);
});

