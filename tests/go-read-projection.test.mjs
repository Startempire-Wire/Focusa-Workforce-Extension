import test from 'node:test';
import assert from 'node:assert/strict';
import {projectWorkforceForGo} from '../src/lib/go-read-projection.mjs';
const scope={projectRef:'project:p1',workstreamRef:'workstream:a',continuityId:'continuity:a'};
const snapshot=()=>({
 revision:'rev:10',generatedAt:'2026-11-22T00:00:00Z',freshness:'fresh',
 workstreams:[
 {projectRef:'project:p1',workstreamRef:'workstream:a',continuityId:'continuity:a',title:'A'},
 {projectRef:'project:p1',workstreamRef:'workstream:b',continuityId:'continuity:b',title:'B'}],
 foremen:[{foremanRef:'foreman:a',workstreamRef:'workstream:a',displayName:'A foreman'},
 {foremanRef:'foreman:b',workstreamRef:'workstream:b',displayName:'B foreman'}],
 agents:[{agentRef:'agent:a',workstreamRef:'workstream:a',class:'worker',status:'running'},
 {agentRef:'agent:b',workstreamRef:'workstream:b',class:'worker',status:'running'}],
 work:[{workRef:'work:a',workstreamRef:'workstream:a',evidenceRefs:['ev:a']},
 {workRef:'work:b',workstreamRef:'workstream:b'}],
 evidence:[{evidenceRef:'ev:a',workstreamRef:'workstream:a',deliveryState:'ready',verificationState:'pending'},
 {evidenceRef:'ev:b',workstreamRef:'workstream:b',deliveryState:'ready',verificationState:'accepted'}]
});
test('only explicit Project + Workstream + Continuity is projected',()=>{
 const r=projectWorkforceForGo(snapshot(),scope);
 assert.equal(r.status,'ready');
 assert.equal(r.workstreams.length,1);
 assert.deepEqual(r.workstreams[0].workers.map(x=>x.agent_ref),['agent:a']);
 assert.deepEqual(r.workstreams[0].evidence.map(x=>x.evidence_ref),['ev:a']);
 assert.equal(r.workstreams[0].foremen[0].foreman_ref,'foreman:a');
});
test('never interpret delivered evidence as verified or settled',()=>{
 const r=projectWorkforceForGo(snapshot(),scope).workstreams[0].evidence[0];
 assert.equal(r.delivery_state,'ready');assert.equal(r.verification_state,'pending');
 assert.equal(r.settlement_state,'unknown');
});
test('missing scope and ambiguous workstream refuse rather than guess',()=>{
 assert.equal(projectWorkforceForGo(snapshot(),{projectRef:'project:p1',workstreamRef:'workstream:a'}).status,'unavailable');
 const s=snapshot();s.workstreams.push({...s.workstreams[0]});
 assert.equal(projectWorkforceForGo(s,scope).status,'unavailable');
});
test('different source revision or missing owner selection fails closed',()=>{
 const s=snapshot();delete s.revision;
 assert.equal(projectWorkforceForGo(s,scope).status,'unavailable');
 assert.equal(projectWorkforceForGo(snapshot(),{}).status,'unavailable');
});
