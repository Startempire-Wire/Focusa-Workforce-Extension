/**
 * Small, READ-ONLY projection seam for a future owner-authenticated Wirebot Go
 * consumer. Reuses documented WorkforceSnapshot; does not pair/authenticate,
 * fetch EPWA media, grant source capabilities, or change Focusa state.
 *
 * This mapper MUST be called only after the owning adapter has verified the
 * viewer's exact Project + Workstream + Continuity scope and snapshot version.
 * It deliberately refuses missing/ambiguous Workstream identity.
 */
const MAX_WORKERS=12,MAX_WORK=16,MAX_EVIDENCE=12;
const clean=(v,n=180)=>typeof v==='string'&&v.length>0?v.slice(0,n):null;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const known=(value,set)=>set.has(value)?value:'unknown';
const DELIVERY=new Set(['ready','blocked','pending_reconcile','unavailable','corrupt','stale','redacted','degraded']);
const REVIEW=new Set(['unverified','pending','in_review','accepted','rejected','blocked','stale','unknown']);
const SETTLEMENT=new Set(['settled','pending','blocked','not_applicable','unknown']);
const unavailable=(reason)=>Object.freeze({schema:'wirebot.go.workstream_surface.v1',status:'unavailable',reason,workstreams:[]});

/** @param {object} snapshot Owner-authorized WorkforceSnapshot
 *  @param {{projectRef:string,workstreamRef:string,continuityId:string}} scope
 */
export function projectWorkforceForGo(snapshot,scope){
 if(!object(snapshot)||!object(scope)||!Array.isArray(snapshot.workstreams))
  return unavailable('Verified source snapshot and explicit Workstream scope required.');
 const projectRef=clean(scope.projectRef,200),workstreamRef=clean(scope.workstreamRef,200),continuityId=clean(scope.continuityId,200);
 if(!projectRef||!workstreamRef||!continuityId)
  return unavailable('Project, Workstream and Continuity must be specified.');
 if(snapshot.revision==null||!snapshot.generatedAt)
  return unavailable('Source revision and observation time required.');
 const candidates=snapshot.workstreams.filter(w=>w?.projectRef===projectRef&&w?.workstreamRef===workstreamRef&&w?.continuityId===continuityId);
 if(candidates.length!==1) return unavailable(candidates.length?'Ambiguous workstream scope.':'Workstream not in the permitted source snapshot.');
 const w=candidates[0];
 const related=record=>record?.workstreamRef===workstreamRef &&
     (!record?.projectRef||record.projectRef===projectRef) &&
     (!record?.continuityId||record.continuityId===continuityId);
 const foremen=(Array.isArray(snapshot.foremen)?snapshot.foremen:[]).filter(related).slice(0,1).map(f=>({
   foreman_ref:clean(f.foremanRef),display_name:clean(f.displayName),status:clean(f.status)||'unknown'
 }));
 const workers=(Array.isArray(snapshot.agents)?snapshot.agents:[]).filter(related).slice(0,MAX_WORKERS).map(a=>({
   agent_ref:clean(a.agentRef),display_name:clean(a.displayName),role_ref:clean(a.roleRef),
   class:clean(a.class)||'unknown',status:clean(a.status)||'unknown',assignment_ref:clean(a.assignmentRef)
 }));
 const work=(Array.isArray(snapshot.work)?snapshot.work:[]).filter(related).slice(0,MAX_WORK).map(x=>({
   work_ref:clean(x.workRef),workpoint_ref:clean(x.workpointRef),objective:clean(x.objective,350),
   state:clean(x.state)||'unknown',evidence_refs:(Array.isArray(x.evidenceRefs)?x.evidenceRefs:[]).filter(v=>clean(v)).slice(0,12)
 }));
 const evidence=(Array.isArray(snapshot.evidence)?snapshot.evidence:[]).filter(related).slice(0,MAX_EVIDENCE).map(e=>({
   evidence_ref:clean(e.evidenceRef),title:clean(e.title),workpoint_ref:clean(e.workpointRef),
   artifact_ref:clean(e.artifactRef),receipt_ref:clean(e.receiptRef),
   delivery_state:known(e.deliveryState,DELIVERY),verification_state:known(e.verificationState,REVIEW),
   settlement_state:known(e.settlementState,SETTLEMENT),source_ref:clean(e.sourceRef),
   captured_at:clean(e.capturedAt)
 }));
 return Object.freeze({
   schema:'wirebot.go.workstream_surface.v1',status:'ready',
   source:{system:'focusa',revision:snapshot.revision,observed_at:snapshot.generatedAt,freshness:snapshot.freshness??'unknown'},
   workstreams:[{project_ref:projectRef,workstream_ref:workstreamRef,continuity_id:continuityId,
     title:clean(w.title)||'Unnamed Workstream',foremen,workers,work,evidence}]
 });
}
