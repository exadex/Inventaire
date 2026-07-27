"use strict";
(function(){
const S=window.ExadexAgentsStorage,C=window.ExadexAgentsCore;
let passed=0;
const ok=(value,message="assertion fausse")=>{if(!value)throw new Error(message);};
class MemoryStorage{
  constructor(limit=Infinity){this.data=new Map();this.limit=limit;this.writes=0;}
  getItem(k){return this.data.has(k)?this.data.get(k):null;}
  setItem(k,v){this.writes++;const next=new Map(this.data);next.set(k,String(v));const size=[...next.values()].reduce((n,x)=>n+new Blob([x]).size,0);if(size>this.limit){const e=new DOMException("quota","QuotaExceededError");throw e;}this.data=next;}
  removeItem(k){this.data.delete(k);}
}
function test(name,fn){fn();passed++;console.log("✓ "+name);}
const alertRow=(i,severity=i%20===0?"critical":"warning")=>({id:"a"+i,type:"Test",severity,confidence:"Moyenne",itemIds:["item-"+i],explanation:"message ".repeat(20),observed:"indice ".repeat(20),recommendation:"vérifier",state:"pending"});
const audit=(id,count=10)=>({id,createdAt:new Date(Date.now()-Number(id.replace(/\D/g,"")||0)*1000).toISOString(),itemCount:800,durationMs:20,alerts:Array.from({length:count},(_,i)=>alertRow(i)),summary:{critical:1,warnings:count-1,info:0,duplicates:0}});
test("type d’audit persisté et ancien rapport neutre",()=>{const st=new MemoryStorage(),typed={...audit("typed",1),auditType:"references"},legacy=audit("legacy",1);ok(S.saveWorkspace({audits:[typed,legacy],sessions:[]},st).ok);const loaded=S.loadWorkspace(st).audits;ok(loaded.find(x=>x.id==="typed").auditType==="references");ok(loaded.find(x=>x.id==="legacy").auditType==="");});
test("audit de 1000 alertes tronqué à 500",()=>{const a=S.compactAudit(audit("x",1000));ok(a.alerts.length===500);ok(a.truncated&&a.totalAlertCount===1000);});
test("cinq audits successifs conservés",()=>{const st=new MemoryStorage();const r=S.saveWorkspace({audits:[1,2,3,4,5].map(i=>audit("r"+i)),sessions:[]},st);ok(r.ok);ok(S.loadWorkspace(st).audits.length===5);});
test("sixième audit supprime le plus ancien",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[1,2,3,4,5,6].map(i=>audit("r"+i)),sessions:[]},st);ok(S.loadWorkspace(st).audits.length===5);});
test("quota simulé retourne quota sans exception",()=>{const st=new MemoryStorage(200);const r=S.saveWorkspace({audits:[audit("x",20)],sessions:[]},st);ok(!r.ok&&r.reason==="quota");});
test("nettoyage puis nouvelle tentative",()=>{const st=new MemoryStorage(250000);S.saveWorkspace({audits:[audit("old",400)],sessions:[]},st);const r=S.saveWorkspace({audits:[audit("new",20)],sessions:[]},st);ok(r.ok);});
test("brouillon conservé par la rétention",()=>{const sessions=Array.from({length:15},(_,i)=>C.createSession({name:"b"+i}));ok(S.retained({audits:[],sessions}).sessions.length===15);});
test("seulement dix sessions terminées",()=>{const sessions=Array.from({length:15},(_,i)=>({...C.createSession({name:"f"+i}),status:"Validé",updatedAt:new Date(Date.now()-i*1000).toISOString()}));ok(S.retained({audits:[],sessions}).sessions.length===10);});
test("migration v1 vers v2",()=>{const st=new MemoryStorage();st.setItem(S.KEYS.legacy,JSON.stringify({audits:[audit("m",3)],sessions:[C.createSession({name:"B"})]}));const r=S.migrate(st);ok(r.ok&&r.migrated);ok(!st.getItem(S.KEYS.legacy));ok(S.loadWorkspace(st).sessions.length===1);});
test("ancienne clé conservée si migration échoue",()=>{const st=new MemoryStorage(100);st.data.set(S.KEYS.legacy,JSON.stringify({audits:[audit("m",20)],sessions:[]}));const r=S.migrate(st);ok(!r.ok);ok(Boolean(st.getItem(S.KEYS.legacy)));});
test("proposition ne contient plus de snapshot complet",()=>{const item={id:"i",name:"A",quantity:1,stockTracking:{openContainers:Array.from({length:50},(_,i)=>({id:"c"+i,remaining:i}))},aliquotTracking:{preparations:[]}};const s=C.createSession();s.lines=[{id:"l",name:"A",action:"count",quantity:2,match:{status:"certain",itemId:"i",candidates:[]}}];const p=C.buildProposals(s,[item])[0];ok(!("before" in p));ok(JSON.stringify(p).length<JSON.stringify(item).length);});
test("diagnostic sans données sensibles",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("d",5)],sessions:[]},st);const d=S.diagnostics(st);ok(d.audits===1&&d.alerts===5&&d.bytes>0);ok(!("data" in d));});
test("écriture unique par rapport, jamais par alerte",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("w",100)],sessions:[]},st);ok(st.writes<20);});
test("taille compactée nettement inférieure à un snapshot répété",()=>{const huge={id:"i",name:"X",stockTracking:{openContainers:Array.from({length:100},(_,i)=>({id:i,label:"conteneur ".repeat(20),remaining:i}))}};const legacy={sessions:[{id:"s",status:"Brouillon",proposals:Array.from({length:100},(_,i)=>({id:"p"+i,itemId:"i",before:JSON.stringify(huge)}))}],audits:[]};const compact=S.retained(legacy);ok(JSON.stringify(compact).length<JSON.stringify(legacy).length*.1);});
test("suppression d'un audit de 500 alertes",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("bad",500)],sessions:[]},st);const r=S.deleteAudits(["bad"],st);ok(r.ok);ok(st.getItem(S.KEYS.auditPrefix+"bad")===null);ok(S.loadWorkspace(st).audits.length===0);});
test("suppression d'un audit non examiné autorisée",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("pending",20)],sessions:[]},st);ok(S.deleteAudits(["pending"],st).ok);});
test("un audit supprimé n'affecte pas les autres",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("one"),audit("two")],sessions:[]},st);S.deleteAudits(["one"],st);const left=S.loadWorkspace(st).audits;ok(left.length===1&&left[0].id==="two");});
test("suppression multiple met à jour l'index",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("one"),audit("two"),audit("three")],sessions:[]},st);const r=S.deleteAudits(["one","three"],st);ok(r.ok&&r.deletedIds.length===2);ok(JSON.parse(st.getItem(S.KEYS.auditIndex)).length===1);});
test("diagnostic recalculé après suppression",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("one",30),audit("two",30)],sessions:[]},st);const before=S.diagnostics(st);const r=S.deleteAudits(["one"],st);ok(r.diagnostic.audits===1&&r.diagnostic.bytes<before.bytes);});
test("sessions physiques intactes",()=>{const st=new MemoryStorage(),session=C.createSession({name:"Important"});S.saveWorkspace({audits:[audit("one")],sessions:[session]},st);const before=st.getItem(S.KEYS.sessionPrefix+session.id);S.deleteAudits(["one"],st);ok(st.getItem(S.KEYS.sessionPrefix+session.id)===before);});
test("échec d'index ne supprime pas le rapport",()=>{const st=new MemoryStorage();S.saveWorkspace({audits:[audit("one")],sessions:[]},st);st.limit=10;const r=S.deleteAudits(["one"],st);ok(!r.ok);ok(st.getItem(S.KEYS.auditPrefix+"one")!==null);});
const sampleAudit=audit("measure",1000),before=S.byteSize(JSON.stringify(sampleAudit)),after=S.byteSize(JSON.stringify(S.compactAudit(sampleAudit)));
document.querySelector("#storageTestResult").textContent=`${passed} tests stockage réussis. Mesure 1000 alertes : ${before} → ${after} octets.`;
})();
