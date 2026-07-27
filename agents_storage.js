(function (root, factory) {
  const api = factory();
  root.ExadexAgentsStorage = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";
  const KEYS = {
    legacy: "exadex_agents_workspace_v1",
    settings: "exadex_agents_settings_v2",
    auditIndex: "exadex_agents_audit_index_v2",
    auditPrefix: "exadex_agents_audit_v2_",
    sessionIndex: "exadex_agents_session_index_v2",
    sessionPrefix: "exadex_agents_session_v2_"
  };
  const MAX_AUDITS = 5, MAX_ALERTS = 500, MAX_FINISHED_SESSIONS = 10;
  const byteSize = value => new Blob([String(value || "")]).size;
  const read = (storage, key, fallback) => { try { const raw=storage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const write = (storage, key, value) => {
    let serialized;
    try { serialized=JSON.stringify(value); } catch(error) { return {ok:false,reason:"serialization",error}; }
    try { storage.setItem(key,serialized); return {ok:true,bytes:byteSize(serialized)}; }
    catch(error) { return {ok:false,reason:isQuota(error)?"quota":"storage",error}; }
  };
  const isQuota = error => error?.name === "QuotaExceededError" || error?.code === 22 || /quota/i.test(error?.message || "");
  const severityRank = { critical:0, warning:1, info:2 };
  function compactAlert(row) {
    const details=row.scoreDetails||{};
    return { id:row.id, type:String(row.type||"").slice(0,100), auditScope:row.auditScope||"", severity:row.severity||"info", confidence:row.confidence||"", confidenceScore:Number(row.duplicateScore??row.confidenceScore??row.similarityScore??0), duplicateScore:Number(row.duplicateScore??row.confidenceScore??row.similarityScore??0), itemIds:[...new Set(row.itemIds||[])].slice(0,10), explanation:String(row.explanation||row.message||"").slice(0,500), observed:String(row.observed||row.clues||"").slice(0,500), reasons:(row.reasons||[]).slice(0,12), scoreDetails:{positive:(details.positive||row.reasons||[]).slice(0,12),differences:(details.differences||[]).slice(0,12),terms:(details.terms||[]).slice(0,20),rawScore:Number(details.rawScore??row.confidenceScore??0),boundedScore:Number(details.boundedScore??row.confidenceScore??0),capped:Boolean(details.capped),capReason:String(details.capReason||"").slice(0,300),nameSimilarity:Number(details.nameSimilarity||0)}, state:row.state||"pending", createdAt:row.createdAt||"" };
  }
  function compactAudit(report) {
    const dedup=new Map();
    (report?.alerts||[]).forEach(row => {
      const value=compactAlert(row), key=[value.type,value.severity,[...value.itemIds].sort().join("|"),value.observed].join("::");
      if(!dedup.has(key)) dedup.set(key,value);
    });
    const all=[...dedup.values()], kept=all.sort((a,b)=>(severityRank[a.severity]??9)-(severityRank[b.severity]??9)).slice(0,MAX_ALERTS);
    return { id:report.id, auditType:report.auditType||"", rulesVersion:report.rulesVersion||1, scoreEngine:report.scoreEngine||"", scope:report.scope||"full", createdAt:report.createdAt, durationMs:report.durationMs||0, itemCount:report.itemCount||0, totalAlertCount:report.totalAlertCount??all.length, persistedAlertCount:kept.length, truncated:all.length>kept.length, alerts:kept, summary:report.summary||summary(all), scopeSummary:report.scopeSummary||null };
  }
  function summary(rows){return{critical:rows.filter(x=>x.severity==="critical").length,warnings:rows.filter(x=>x.severity==="warning").length,info:rows.filter(x=>x.severity==="info").length,duplicates:rows.filter(x=>/doublon|référence partagée/i.test(x.type)).length};}
  function compactProposal(p) {
    return { id:p.id,lineId:p.lineId,itemId:p.itemId,itemName:String(p.itemName||"").slice(0,200),matchStatus:p.matchStatus,candidates:(p.candidates||[]).slice(0,5).map(c=>({itemId:c.itemId,name:String(c.name||"").slice(0,200),score:c.score,reasons:(c.reasons||[]).slice(0,4)})),confidence:p.confidence,decision:p.decision||"pending",valid:Boolean(p.valid),action:p.action,operation:p.operation||null,conflictBasis:p.conflictBasis||null,beforeValue:p.beforeValue,afterValue:p.afterValue,readAt:p.readAt,reason:String(p.reason||"").slice(0,300),conflict:p.conflict?{conflict:true,reason:p.conflict.reason}:null};
  }
  function compactSession(s) {
    return { id:s.id,name:String(s.name||"").slice(0,200),author:s.author||"",createdAt:s.createdAt,updatedAt:s.updatedAt,readAt:s.readAt,scope:s.scope,location:s.location||"",category:s.category||"",notes:String(s.notes||"").slice(0,3000),originalText:String(s.originalText||"").slice(0,50000),status:s.status||"Brouillon",lines:(s.lines||[]).map(l=>({id:l.id,raw:String(l.raw||"").slice(0,2000),text:String(l.text||"").slice(0,500),name:String(l.name||"").slice(0,300),action:l.action,location:l.location,quantity:l.quantity,closed:l.closed,openRemaining:l.openRemaining,openUnit:l.openUnit,aliquots:l.aliquots,openAliquotVolume:l.openAliquotVolume,openAliquotUnit:l.openAliquotUnit,parsed:l.parsed,match:l.match?{status:l.match.status,itemId:l.match.itemId,candidates:(l.match.candidates||[]).slice(0,5).map(c=>({itemId:c.itemId,name:c.name,score:c.score,reasons:c.reasons}))}:null})),proposals:(s.proposals||[]).map(compactProposal),decisions:(s.decisions||[]).slice(-1000),report:s.report||null};
  }
  const active = s => !["Validé","Abandonné"].includes(s.status);
  function retained(state) {
    const audits=(state.audits||[]).map(compactAudit).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,MAX_AUDITS);
    const sessions=(state.sessions||[]).map(compactSession), open=sessions.filter(active), finished=sessions.filter(s=>!active(s)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,MAX_FINISHED_SESSIONS);
    return {audits,sessions:[...open,...finished]};
  }
  function removeRecord(storage,key){try{storage.removeItem(key);}catch{}}
  function saveWorkspace(state, storage=root.localStorage, options={}) {
    const data=retained(state), oldAuditIds=read(storage,KEYS.auditIndex,[]).map(x=>x.id), oldSessionIds=read(storage,KEYS.sessionIndex,[]).map(x=>x.id);
    const auditIndex=data.audits.map(a=>({id:a.id,auditType:a.auditType||"",createdAt:a.createdAt,totalAlertCount:a.totalAlertCount,persistedAlertCount:a.persistedAlertCount,truncated:a.truncated,rulesVersion:a.rulesVersion||1,summary:a.summary}));
    const sessionIndex=data.sessions.map(s=>({id:s.id,name:s.name,status:s.status,createdAt:s.createdAt,updatedAt:s.updatedAt}));
    const writes=[[KEYS.settings,{version:2,updatedAt:new Date().toISOString()}],[KEYS.auditIndex,auditIndex],[KEYS.sessionIndex,sessionIndex],...data.audits.map(a=>[KEYS.auditPrefix+a.id,a]),...data.sessions.map(s=>[KEYS.sessionPrefix+s.id,s])];
    let bytes=0;
    for(const [key,value] of writes){const result=write(storage,key,value);if(!result.ok){if(result.reason==="quota"&&!options.retried){cleanupOldReports(storage,data.audits.map(a=>a.id));return saveWorkspace(state,storage,{retried:true});}return result;}bytes+=result.bytes||0;}
    oldAuditIds.filter(id=>!data.audits.some(a=>a.id===id)).forEach(id=>removeRecord(storage,KEYS.auditPrefix+id));
    oldSessionIds.filter(id=>!data.sessions.some(s=>s.id===id)).forEach(id=>removeRecord(storage,KEYS.sessionPrefix+id));
    return {ok:true,bytes,data};
  }
  function cleanupOldReports(storage=root.localStorage, keepIds=[]) {
    const index=read(storage,KEYS.auditIndex,[]);
    index.filter((row,i)=>i>=MAX_AUDITS||!keepIds.includes(row.id)).forEach(row=>removeRecord(storage,KEYS.auditPrefix+row.id));
    const kept=index.filter((row,i)=>i<MAX_AUDITS&&keepIds.includes(row.id)); write(storage,KEYS.auditIndex,kept);
    return {ok:true,removed:index.length-kept.length};
  }
  function deleteAudits(ids,storage=root.localStorage){
    const targets=[...new Set((ids||[]).filter(Boolean))],current=read(storage,KEYS.auditIndex,[]);
    if(!targets.length)return{ok:false,reason:"empty"};
    const existing=new Set(current.map(row=>row.id)),actual=targets.filter(id=>existing.has(id));
    if(!actual.length)return{ok:false,reason:"not_found"};
    const backups=new Map(actual.map(id=>[id,storage.getItem(KEYS.auditPrefix+id)]));
    const next=current.filter(row=>!actual.includes(row.id)),indexResult=write(storage,KEYS.auditIndex,next);
    if(!indexResult.ok)return indexResult;
    try{
      actual.forEach(id=>storage.removeItem(KEYS.auditPrefix+id));
      const failed=actual.filter(id=>storage.getItem(KEYS.auditPrefix+id)!==null);
      if(failed.length)throw new Error("La suppression complète du rapport a échoué.");
      return{ok:true,deletedIds:actual,diagnostic:diagnostics(storage)};
    }catch(error){
      backups.forEach((raw,id)=>{if(raw!==null)try{storage.setItem(KEYS.auditPrefix+id,raw);}catch{}});
      const rollback=write(storage,KEYS.auditIndex,current);
      return{ok:false,reason:"storage",error,rollback:rollback.ok};
    }
  }
  function loadWorkspace(storage=root.localStorage) {
    const auditIndex=read(storage,KEYS.auditIndex,[]),sessionIndex=read(storage,KEYS.sessionIndex,[]);
    return {version:2,audits:auditIndex.map(row=>read(storage,KEYS.auditPrefix+row.id,null)).filter(Boolean),sessions:sessionIndex.map(row=>read(storage,KEYS.sessionPrefix+row.id,null)).filter(Boolean)};
  }
  function migrate(storage=root.localStorage) {
    const raw=storage.getItem(KEYS.legacy); if(!raw)return{ok:true,migrated:false,beforeBytes:0,afterBytes:diagnostics(storage).bytes};
    let legacy;try{legacy=JSON.parse(raw);}catch(error){return{ok:false,reason:"serialization",error,beforeBytes:byteSize(raw)};}
    const result=saveWorkspace({audits:legacy.audits||[],sessions:legacy.sessions||[]},storage);
    if(!result.ok)return{...result,migrated:false,beforeBytes:byteSize(raw)};
    const loaded=loadWorkspace(storage);if(!loaded||!Array.isArray(loaded.audits)||!Array.isArray(loaded.sessions))return{ok:false,reason:"verification",migrated:false,beforeBytes:byteSize(raw)};
    removeRecord(storage,KEYS.legacy);return{ok:true,migrated:true,beforeBytes:byteSize(raw),afterBytes:diagnostics(storage).bytes};
  }
  function diagnostics(storage=root.localStorage) {
    const auditIndex=read(storage,KEYS.auditIndex,[]),sessionIndex=read(storage,KEYS.sessionIndex,[]);let bytes=0,biggest=0,alerts=0;
    [KEYS.settings,KEYS.auditIndex,KEYS.sessionIndex,...auditIndex.map(x=>KEYS.auditPrefix+x.id),...sessionIndex.map(x=>KEYS.sessionPrefix+x.id)].forEach(key=>{const size=byteSize(storage.getItem(key)||"");bytes+=size;if(key.startsWith(KEYS.auditPrefix))biggest=Math.max(biggest,size);});
    auditIndex.forEach(x=>alerts+=x.persistedAlertCount||0);return{bytes,audits:auditIndex.length,sessions:sessionIndex.length,alerts,biggestReportBytes:biggest};
  }
  return {KEYS,MAX_AUDITS,MAX_ALERTS,MAX_FINISHED_SESSIONS,byteSize,compactAudit,compactSession,retained,saveWorkspace,loadWorkspace,migrate,cleanupOldReports,deleteAudits,diagnostics,isQuota};
});
