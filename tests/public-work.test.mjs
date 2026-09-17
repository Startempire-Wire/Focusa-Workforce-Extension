import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { MAX_PUBLIC_WORK_BYTES, validatePublicWorkSnapshot } from '../src/lib/contracts.mjs';
import { loadPublicWorkSnapshot, renderPublicWork, mountPublicWork } from '../src/lib/public-work.mjs';

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
test('renderer uses text nodes and never represents snapshot as live telemetry',()=>{
  const document=dom(), value={...sample(),mission:'<img src=x onerror=alert(1)>'};
  renderPublicWork(document,document.host,value,()=>{});
  assert.ok(document.host.textContent.includes(value.mission));
  assert.ok(document.host.textContent.includes('not live agent telemetry'));
  assert.ok(document.host.textContent.includes('Next action'));
  assert.ok(document.host.textContent.includes('2026-09-08'));
  renderPublicWork(document,document.host,null,()=>{});
  assert.ok(document.host.textContent.includes('unavailable'));
  assert.ok(!document.host.textContent.includes(value.mission));
});
test('public mount hides private areas and exposes only read-only refresh',async()=>{
  const document=dom();
  await mountPublicWork(document,'chrome-extension://test/public-work.json',async()=>new Response(JSON.stringify(sample())));
  assert.equal(document.other.hidden,true);assert.equal(document.button.disabled,true);
  assert.equal(document.host.children.at(-1).textContent,'Refresh snapshot');
  assert.ok(document.host.textContent.includes(sample().mission));
});
test('explicit public bootstrap never reads private storage; normal route is retained',async()=>{
  const entry=await readFile(new URL('../src/startpage-app/main.js',import.meta.url),'utf8');
  const anchor="const isPublicWork = new URL(window.location.href).searchParams.get('public-work') === '1';";
  assert.ok(entry.includes(anchor), 'the start page decides public mode before touching extension state');
  // Public mode must be a closed branch: it mounts the public view and never
  // constructs the Workforce store (no connections, notifications or layout reads).
  const publicBranch=entry.slice(entry.indexOf('if (isPublicWork)'), entry.indexOf('} else {'));
  assert.match(publicBranch, /import\('\.\/public-work\.css'\)/, 'public mode loads only the public stylesheet');
  assert.match(publicBranch, /mountPublicWork\(document, chrome\.runtime\.getURL\('public-work\.json'\)\)/, 'public mode mounts the curated snapshot');
  assert.ok(!/createWorkforceStore/.test(publicBranch), 'public mode never builds the private runtime client');
});

test('real start-page module graph links and renders without private reads',async()=>{
  const document=dom();
  const replacements={document,
    window:{location:{href:'chrome-extension://test/startpage.html?public-work=1'},addEventListener(){}},
    chrome:{runtime:{getURL:path=>'chrome-extension://test/'+path},storage:{local:{get(){throw new Error('private read');},set(){throw new Error('private write');}}}},
    fetch:async()=>new Response(JSON.stringify(sample())),setInterval:()=>0};
  const originals=new Map(Object.keys(replacements).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  try {
    for(const [key,value] of Object.entries(replacements))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
    const { mountPublicWork } = await import(new URL('../src/lib/public-work.mjs',import.meta.url));
    await mountPublicWork(document, 'chrome-extension://test/public-work.json');
    assert.ok(document.host.textContent.includes(sample().mission));
    assert.ok(document.host.textContent.includes(sample().next_action));
  } finally {
    for(const [key,descriptor] of originals) {
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    }
  }
});
