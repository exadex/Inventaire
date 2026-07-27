(function () {
  "use strict";
  const Storage = window.ExadexAgentsStorage;
  const migration = Storage.migrate(localStorage);
  let storageMessage = migration.ok ? "" : "La migration des données Agents n’a pas pu être terminée. L’ancienne sauvegarde a été conservée.";
  let state = load();
  let screen = "home", activeAuditId = null, activeSessionId = null, activeAlertId = null, selectedAuditIds = new Set();
  try {
    const restored=JSON.parse(sessionStorage.getItem("exadex_agents_active_comparison")||"null");
    if(restored&&state.audits.some(a=>a.id===restored.auditId&&a.alerts.some(x=>x.id===restored.alertId))){activeAuditId=restored.auditId;activeAlertId=restored.alertId;screen="audit-compare";}
  } catch {}
  function load() {
    try {
      const data = Storage.loadWorkspace(localStorage);
      return { version: 2, audits: Array.isArray(data.audits) ? data.audits : [], sessions: Array.isArray(data.sessions) ? data.sessions : [] };
    } catch { return { version: 2, audits: [], sessions: [] }; }
  }
  function save() {
    const result=Storage.saveWorkspace(state,localStorage);
    if(result.ok){state=result.data;storageMessage="";return result;}
    storageMessage=result.reason==="quota"
      ? "L’espace de stockage local réservé aux Agents est plein. Les données actives de l’inventaire ne sont pas affectées. Nettoyez d’anciens rapports ou exportez votre session avant de continuer."
      : "Les données Agents n’ont pas pu être enregistrées. Les données actives de l’inventaire ne sont pas affectées.";
    renderStorageMessage();
    return result;
  }
  function renderStorageMessage(){const existing=document.querySelector("#agentsStorageMessage");if(existing){existing.textContent=storageMessage;existing.classList.toggle("hidden",!storageMessage);}}
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const fmt = value => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
  const auditTypeLabel=value=>({full:"Audit complet",duplicates:"Doublons uniquement",stock:"Stocks et seuils",references:"Références"})[value]||"Type non renseigné";
  function renderAgents() {
    const root = document.querySelector("#agentsRoot"); if (!root) return;
    if (screen === "audit-config") return renderAuditConfig(root);
    if (screen === "audit-report") return renderAuditReport(root);
    if (screen === "audit-compare") return renderAuditComparison(root);
    if (screen === "audit-manage") return renderAuditManagement(root);
    if (screen === "session") return renderSession(root);
    const pending = state.sessions.reduce((n, row) => n + row.proposals.filter(p => p.decision === "pending").length, 0);
    const warnings = state.audits[0]?.alerts.filter(a => a.state !== "reviewed" && a.severity !== "info").length || 0;
    const diagnostic=Storage.diagnostics(localStorage);
    root.innerHTML = `<div id="agentsStorageMessage" class="agents-storage-message ${storageMessage?"":"hidden"}" role="alert">${esc(storageMessage)}</div><header class="agents-header"><div><p class="eyebrow">Outils assistés et contrôlés</p><h2 id="agentsTitle">Agents</h2><p>Analysez et préparez vos comptages sans changement automatique.</p></div><button class="ghost-btn" data-clean-reports>Nettoyer les anciens rapports</button></header>
      <div class="agent-card-grid">
        <article class="agent-card"><span class="agent-icon" aria-hidden="true">◇</span><div><h3>Auditeur Inventaire ${warnings ? `<span class="agent-count">${warnings}</span>` : ""}</h3><p>Analyse l’inventaire, détecte les anomalies et vous signale les éléments à vérifier. Cet agent ne modifie aucune donnée.</p><ul><li>Lecture seule</li><li>Analyse complète ou ciblée</li><li>Aucun changement automatique</li></ul></div><button class="primary-btn" data-agent-action="audit">Lancer un audit</button></article>
        <article class="agent-card"><span class="agent-icon" aria-hidden="true">▣</span><div><h3>Inventaire Physique ${pending ? `<span class="agent-count">${pending}</span>` : ""}</h3><p>Transforme un comptage physique du laboratoire en propositions de modifications que vous pouvez vérifier, corriger, valider ou ignorer.</p><ul><li>Préparation en brouillon</li><li>Comparaison avant/après</li><li>Validation obligatoire</li></ul></div><button class="primary-btn" data-agent-action="physical">Commencer un inventaire</button></article>
      </div>
      <div class="agents-recent"><section><h3>Audits récents</h3>${state.audits.slice(0,4).map(a => `<div class="agent-recent-row"><button data-open-audit="${esc(a.id)}"><span>${fmt(a.createdAt)}</span><span class="audit-type-badge">${esc(auditTypeLabel(a.auditType))}</span><strong>${a.totalAlertCount??a.alerts.length} alerte(s)</strong></button><button class="audit-delete-btn" data-delete-audit="${esc(a.id)}" aria-label="Supprimer le rapport du ${esc(fmt(a.createdAt))}">Supprimer</button></div>`).join("") || "<p>Aucun audit enregistré.</p>"}</section>
      <section><h3>Brouillons et inventaires récents</h3>${state.sessions.slice(0,4).map(s => `<button class="agent-recent-row" data-open-session="${esc(s.id)}"><span>${esc(s.name)}</span><strong>${esc(s.status)}</strong></button>`).join("") || "<p>Aucune session.</p>"}</section></div>
      <aside class="agents-diagnostic"><strong>Stockage Agents</strong><span>${formatBytes(diagnostic.bytes)} utilisés</span><span>${diagnostic.audits} audits</span><span>${diagnostic.sessions} sessions</span><span>${diagnostic.alerts} alertes</span><span>Plus gros rapport : ${formatBytes(diagnostic.biggestReportBytes)}</span></aside>`;
    bind(root);
    root.querySelector("[data-clean-reports]").onclick=()=>{selectedAuditIds.clear();screen="audit-manage";renderAgents();};
  }
  function formatBytes(bytes){return bytes<1024?`${bytes} o`:bytes<1048576?`${(bytes/1024).toFixed(1)} Ko`:`${(bytes/1048576).toFixed(2)} Mo`;}
  function renderAuditConfig(root) {
    const explanations={
      full:"Cet audit analyse l’ensemble de l’inventaire en exécutant tous les contrôles actuellement disponibles : doublons potentiels, stocks et seuils, et références principales. Les résultats sont ensuite regroupés par catégorie afin de distinguer clairement chaque type d’anomalie.",
      duplicates:"Cet audit recherche les fiches susceptibles de correspondre au même produit. La comparaison tient notamment compte du nom, de la référence, du fournisseur, de la catégorie, du conditionnement et des caractéristiques du produit. Les résultats sont des doublons potentiels à vérifier, et non des suppressions automatiques.",
      stock:"Cet audit recherche les fiches dont la quantité de stock ou le seuil n’est pas renseigné, ainsi que les valeurs invalides et les incohérences entre le stock global et le détail des contenants. Une quantité de 0 ou un seuil de 0 est parfaitement valide et ne sera pas considéré comme un problème. Un stock inférieur au seuil n’est pas non plus une incohérence : il relève des alertes habituelles de stock.",
      references:"Cet audit recherche les produits sans référence principale et les doublons potentiels qui possèdent des références principales différentes. Il ne contrôle pas les fournisseurs, les catégories ni les autres champs de la fiche."
    };
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Strictement en lecture seule</p><h2>Nouvel audit</h2><p>Aucune fonction d’écriture n’est accessible à l’Auditeur.</p></div></header>
      <form id="auditConfigForm" class="agent-panel"><div class="agent-form-grid"><label>Type d’audit<select name="scope" class="select"><option value="full">Audit complet</option><option value="duplicates">Doublons uniquement</option><option value="stock">Stocks et seuils</option><option value="references">Références</option></select></label>
      ${select("category","Catégorie", window.inventoryCategories || [])}${select("location","Localisation",window.inventoryLocations || [])}<label>Type<select name="usage" class="select"><option value="all">Tous</option><option value="normal">Normal</option><option value="routine">Routine</option><option value="backup">Back-up</option></select></label></div><section class="audit-explanation" aria-live="polite"><h3>Explication</h3><p>${esc(explanations.full)}</p></section><div class="modal-actions"><button class="primary-btn" type="submit">Analyser en lecture seule</button></div></form>`;
    bind(root);
    const form=root.querySelector("#auditConfigForm"),scopeSelect=form.elements.scope,explanation=form.querySelector(".audit-explanation p");
    scopeSelect.onchange=()=>{explanation.textContent=explanations[scopeSelect.value]||"";};
    form.addEventListener("submit", event => { event.preventDefault(); const options = Object.fromEntries(new FormData(event.currentTarget)); delete options.severity; root.innerHTML = `<div class="agent-loading" role="status"><span></span><strong>Analyse en cours…</strong></div>`; setTimeout(() => {
      const report = ExadexAgentsCore.audit({ items: window.items || [], orders: window.orders || [], locations: window.inventoryLocations || [], categories: window.inventoryCategories || [], stockTrackingApi:window.StockTracking }, options);
      state.audits.unshift(report); const saved=save(); activeAuditId = report.id; screen = "audit-report"; renderAgents(); if(!saved.ok)renderStorageMessage();
    }, 20); });
  }
  function select(name, label, values) { return `<label>${label}<select name="${name}" class="select"><option value="all">Tous</option>${values.map(v => `<option>${esc(v)}</option>`).join("")}</select></label>`; }
  function renderAuditReport(root) {
    const audit = state.audits.find(row => row.id === activeAuditId); if (!audit) { screen = "home"; return renderAgents(); }
    const counts=auditCounts(audit);
    const scopeSummary=audit.scopeSummary||{duplicates:audit.alerts.filter(a=>a.auditScope==="duplicates").length,stock:audit.alerts.filter(a=>a.auditScope==="stock").length,references:audit.alerts.filter(a=>a.auditScope==="references").length};
    const fullSummary=audit.scope==="full"?`<p class="audit-global-summary"><strong>${audit.alerts.length} anomalie(s) détectée(s)</strong> : ${scopeSummary.duplicates} doublon(s) · ${scopeSummary.stock} stock(s) et seuil(s) · ${scopeSummary.references} référence(s)</p>`:"";
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Rapport d’audit</p><h2>Audit du ${fmt(audit.createdAt)}</h2><p>${audit.itemCount} items analysés en ${audit.durationMs} ms.</p>${fullSummary}${(audit.rulesVersion||1)<3?`<p class="agent-legacy-notice">Ce rapport utilise une ancienne méthode de calcul. Relancez l’analyse pour obtenir le nouveau Score de doublon.</p>`:""}</div><button class="primary-btn" data-agent-action="audit">Relancer l’analyse</button></header>
      <div class="agent-metrics audit-live-metrics"><article><strong id="auditRemainingCount">${counts.active}</strong><span>Alertes restantes</span></article><article><strong id="auditReviewedCount">${counts.reviewed}</strong><span>Examinées</span></article><article><strong>${audit.totalAlertCount??audit.alerts.length}</strong><span>Total initial</span></article><article><strong>${audit.alerts.length}</strong><span>Conservées</span></article></div>
      <div id="auditAlerts"></div>`;
    bind(root);
    renderAuditAlerts(audit);
  }
  function auditCounts(audit){return{active:(audit.alerts||[]).filter(a=>a.state!=="reviewed").length,reviewed:(audit.alerts||[]).filter(a=>a.state==="reviewed").length};}
  function remainingAlerts(audit){return auditCounts(audit).active;}
  function reportSize(id){return Storage.byteSize(localStorage.getItem(Storage.KEYS.auditPrefix+id)||"");}
  function renderAuditManagement(root){
    root.innerHTML=`<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Rapports locaux uniquement</p><h2>Gérer les rapports d’audit</h2><p>La suppression n’affecte aucun item, stock ou brouillon d’inventaire physique.</p></div></header>
      <div id="agentsStorageMessage" class="agents-storage-message ${storageMessage?"":"hidden"}" role="alert">${esc(storageMessage)}</div>
      <div class="audit-management-actions"><button class="ghost-btn" data-select-all>Tout sélectionner</button><button class="danger-btn" data-delete-selected ${selectedAuditIds.size?"":"disabled"}>Supprimer les rapports sélectionnés</button></div>
      <div class="audit-management-list">${state.audits.map(a=>`<article><label><input type="checkbox" data-select-audit="${esc(a.id)}" ${selectedAuditIds.has(a.id)?"checked":""}><span class="sr-only">Sélectionner</span></label><button class="audit-management-main" data-open-audit="${esc(a.id)}"><strong>${esc(fmt(a.createdAt))}</strong><span>${a.totalAlertCount??a.alerts.length} alertes · ${remainingAlerts(a)} restantes · ${formatBytes(reportSize(a.id))} · règles v${a.rulesVersion||1}</span></button><button class="audit-delete-btn" data-delete-audit="${esc(a.id)}">Supprimer</button></article>`).join("")||`<div class="agent-empty">Aucun rapport conservé.</div>`}</div>`;
    bind(root);
    root.querySelectorAll("[data-select-audit]").forEach(box=>box.onchange=()=>{box.checked?selectedAuditIds.add(box.dataset.selectAudit):selectedAuditIds.delete(box.dataset.selectAudit);renderAuditManagement(root);});
    root.querySelector("[data-select-all]")?.addEventListener("click",()=>{state.audits.forEach(a=>selectedAuditIds.add(a.id));renderAuditManagement(root);});
    root.querySelector("[data-delete-selected]")?.addEventListener("click",event=>requestAuditDeletion([...selectedAuditIds],event.currentTarget));
  }
  function requestAuditDeletion(ids,trigger){
    const audits=ids.map(id=>state.audits.find(a=>a.id===id)).filter(Boolean);if(!audits.length)return;
    const remaining=audits.reduce((n,a)=>n+remainingAlerts(a),0),single=audits.length===1?audits[0]:null;
    const identity=single?`Rapport du ${fmt(single.createdAt)} · ${single.totalAlertCount??single.alerts.length} alerte(s).`:`${audits.length} rapports sélectionnés · ${audits.reduce((n,a)=>n+(a.totalAlertCount??a.alerts.length),0)} alerte(s).`;
    const warning=remaining?` Ce${single?" rapport contient":"s rapports contiennent"} encore ${remaining} alerte(s) non examinée(s).`:"";
    openDeleteConfirmation({title:single?"Supprimer définitivement ce rapport d’audit ?":"Supprimer définitivement les rapports sélectionnés ?",message:`${identity}${warning} Ce rapport et ses alertes seront supprimés de cet appareil. Aucun item ni aucune donnée de l’inventaire ne sera modifié. Cette action est irréversible.`,confirmText:single?"Supprimer le rapport":"Supprimer les rapports",trigger,onConfirm:()=>deleteAuditReports(ids)});
  }
  function deleteAuditReports(ids){
    const result=Storage.deleteAudits(ids,localStorage);
    if(!result.ok)throw new Error("La suppression du rapport n’a pas pu être enregistrée. Aucun succès n’a été déclaré.");
    state.audits=state.audits.filter(a=>!result.deletedIds.includes(a.id));result.deletedIds.forEach(id=>selectedAuditIds.delete(id));
    try{const temporary=JSON.parse(sessionStorage.getItem("exadex_agents_active_comparison")||"null");if(temporary&&result.deletedIds.includes(temporary.auditId))sessionStorage.removeItem("exadex_agents_active_comparison");}catch{sessionStorage.removeItem("exadex_agents_active_comparison");}
    const wasOpen=result.deletedIds.includes(activeAuditId);if(wasOpen){activeAuditId=null;activeAlertId=null;screen="home";}
    storageMessage=`${result.deletedIds.length===1?"Le rapport d’audit a été supprimé.":"Les rapports d’audit ont été supprimés."} Les données de l’inventaire n’ont pas été modifiées.`;
    renderAgents();
  }
  function renderAuditAlerts(audit) {
    const box = document.querySelector("#auditAlerts"),currentItems=window.items||[];
    const sorted=rows=>rows.map((alert,index)=>({...alert,_index:index})).sort((a,b)=>(a.state==="reviewed")-(b.state==="reviewed")||confidenceScore(b)-confidenceScore(a)||String(a.itemIds?.[0]||"").localeCompare(String(b.itemIds?.[0]||""))||a._index-b._index);
    const cards=rows=>sorted(rows).map(a=>renderAuditAlertCard(a,currentItems)).join("")||`<div class="agent-empty">Aucune anomalie détectée</div>`;
    if(audit.scope==="full"){
      const groups=[["duplicates","Doublons potentiels"],["stock","Stocks et seuils"],["references","Références"]];
      const legacyScope=alert=>alert.auditScope||(/doublon/i.test(alert.type)?"duplicates":/stock|seuil|contenant/i.test(alert.type)?"stock":"references");
      box.innerHTML=groups.map(([key,label])=>{const rows=audit.alerts.filter(a=>legacyScope(a)===key);return`<section class="audit-scope-group"><header><h3>${label}</h3><span>${rows.length} résultat(s)</span></header><div>${cards(rows)}</div></section>`;}).join("");
    }else box.innerHTML=cards(audit.alerts);
    box.querySelectorAll("[data-clear-alert]").forEach(btn=>btn.onclick=()=>requestClearAlert(audit,btn.dataset.clearAlert,btn));
    box.querySelectorAll("[data-review]").forEach(btn => btn.onclick = () => { const finding=audit.alerts.find(x => x.id === btn.dataset.review);if(finding.state!=="reviewed"){finding.state="reviewed";save();}renderAuditAlerts(audit);updateAuditCounters(audit); });
    box.querySelectorAll("[data-examine]").forEach(btn => btn.onclick = () => { const a = audit.alerts.find(x => x.id === btn.dataset.examine); if(a?.itemIds?.length===2){activeAlertId=a.id;screen="audit-compare";sessionStorage.setItem("exadex_agents_active_comparison",JSON.stringify({auditId:audit.id,alertId:a.id}));renderAgents();}else if(a?.itemIds?.[0]&&typeof window.openItemDetail==="function")window.openItemDetail(a.itemIds[0],{view:"agents"}); });
  }
  function confidenceScore(alert){return Math.max(0,Math.min(100,Number(alert.duplicateScore??alert.confidenceScore??alert.similarityScore??0)));}
  function confidenceBand(score){return score>=85?"score-dark-red":score>=65?"score-red":score>=40?"score-orange":"score-yellow";}
  function confidenceLabel(score){return score>=85?"Très élevée":score>=65?"Élevée":score>=40?"Moyenne":score>=21?"Faible":"Non affiché";}
  function alertReasons(alert){return alert.reasons?.length?alert.reasons:String(alert.observed||"").split(";").map(x=>x.trim()).filter(Boolean);}
  function formatReason(reason){return String(reason).replace(/^même référence \((.+)\)$/i,"Même référence : $1").replace(/^forte similarité des noms \((.+)\)$/i,"Forte similarité des noms : $1").replace(/^./,c=>c.toUpperCase());}
  function renderReasons(alert){return`<ul class="audit-reasons">${alertReasons(alert).map(reason=>`<li>${esc(formatReason(reason))}</li>`).join("")}</ul>`;}
  function renderScoreExplanation(alert){
    const d=alert.scoreDetails||{},score=confidenceScore(alert),positive=d.positive?.length?d.positive:alertReasons(alert),differences=d.differences||[],terms=d.terms||[];
    return`<div class="score-explanation"><section><h4>Indices positifs</h4>${positive.length?`<ul>${positive.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:`<p>Aucun indice positif.</p>`}</section>${differences.length?`<section class="score-contradictions"><h4>Contradictions ou différences</h4><ul>${differences.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>`:""}<section class="score-calculation"><h4>Calcul</h4><p>Score brut : ${terms.length?terms.map(n=>n>=0?`+${n}`:`−${Math.abs(n)}`).join(" "):d.rawScore??score} = ${d.rawScore??score}</p><p>Score ramené dans l’intervalle 0–100 : ${d.boundedScore??score} %</p>${d.capped?`<p class="score-cap">${esc(d.capReason||"Score plafonné à 25 %.")}</p>`:""}<strong>Score final de doublon : ${score} % — Confiance ${confidenceLabel(score).toLowerCase()}</strong></section></div>`;
  }
  function renderUsefulDifferences(alert){
    const differences=alert.scoreDetails?.differences||[];
    return differences.length?`<div class="audit-useful-differences"><strong>Contradictions ou incohérences à vérifier</strong><ul>${differences.map(value=>`<li>${esc(stripDisplayedPenalty(value))}</li>`).join("")}</ul></div>`:"";
  }
  function stripDisplayedPenalty(value){return String(value||"").replace(/\s*:\s*[−-]\s*(?:10|15|60)\s*$/,"").trim();}
  function renderAuditAlertCard(alert,items){
    if(alert.auditScope!=="duplicates"&&alert.type!=="Doublon potentiel"&&alert.type!=="Doublon potentiel avec références différentes"){
      const names=alert.itemIds.map(id=>items.find(item=>item.id===id)?.name||id),reasons=alert.reasons||[alert.explanation].filter(Boolean);
      return`<article class="audit-alert audit-data-alert ${alert.state==="reviewed"?"reviewed":""}"><header><h3>${esc(alert.type)}</h3>${alert.state==="reviewed"?`<span>✓ Examinée</span>`:""}</header><div class="audit-item-names">${names.map(name=>`<div><strong>${esc(name)}</strong></div>`).join("")}</div><ul class="audit-reasons">${reasons.map(reason=>`<li>${esc(reason)}</li>`).join("")}</ul><div class="audit-alert-meta"><span>ID : ${esc(alert.itemIds.join(" / "))}</span></div><footer><button class="ghost-btn compact-btn" data-examine="${esc(alert.id)}">Examiner</button><button class="ghost-btn compact-btn" data-review="${esc(alert.id)}" ${alert.state==="reviewed"?"disabled":""}>${alert.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn compact-btn" data-clear-alert="${esc(alert.id)}">Effacer l’alerte</button></footer></article>`;
    }
    const score=confidenceScore(alert),names=alert.itemIds.map(id=>items.find(item=>item.id===id)?.name||id);
    return`<article class="audit-alert duplicate ${alert.state==="reviewed"?"reviewed":confidenceBand(score)}" data-confidence-score="${score}"><header><h3>Doublon potentiel — confiance ${confidenceLabel(score).toLowerCase()}</h3><span class="confidence-text">${score} %</span></header><div class="audit-item-names">${names.map((name,index)=>`<div><span>Item ${index?"B":"A"}</span><strong>${esc(name)}</strong></div>`).join("")}</div>${renderUsefulDifferences(alert)}<div class="audit-alert-meta"><span>Score de doublon : ${score} % — Confiance ${confidenceLabel(score).toLowerCase()}</span><span>IDs : ${esc(alert.itemIds.join(" / "))}</span>${alert.state==="reviewed"?`<strong>✓ Examinée</strong>`:""}</div><footer><button class="ghost-btn compact-btn" data-examine="${esc(alert.id)}">Examiner</button><button class="ghost-btn compact-btn" data-review="${esc(alert.id)}" ${alert.state==="reviewed"?"disabled":""}>${alert.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn compact-btn" data-clear-alert="${esc(alert.id)}">Effacer l’alerte</button></footer></article>`;
  }
  function updateAuditCounters(audit){const counts=auditCounts(audit),remaining=document.querySelector("#auditRemainingCount"),reviewed=document.querySelector("#auditReviewedCount");if(remaining)remaining.textContent=counts.active;if(reviewed)reviewed.textContent=counts.reviewed;}
  function requestClearAlert(audit,id,trigger){const finding=audit.alerts.find(a=>a.id===id);if(!finding)return;openDeleteConfirmation({title:"Effacer cette alerte ?",message:"Cette alerte sera supprimée du rapport local. Aucun item ni aucune donnée de l’inventaire ne sera modifié.",confirmText:"Effacer l’alerte",trigger,onConfirm:()=>{audit.alerts=audit.alerts.filter(a=>a.id!==id);const saved=save();if(!saved.ok)throw new Error("L’alerte n’a pas pu être effacée.");if(screen==="audit-compare"){activeAlertId=null;sessionStorage.removeItem("exadex_agents_active_comparison");screen="audit-report";renderAgents();}else{renderAuditAlerts(audit);updateAuditCounters(audit);}}});}
  function renderAuditComparison(root){
    const audit=state.audits.find(x=>x.id===activeAuditId),finding=audit?.alerts.find(x=>x.id===activeAlertId),currentItems=window.items||[];
    const pair=(finding?.itemIds||[]).map(id=>currentItems.find(item=>item.id===id));
    if(!finding||pair.length!==2||pair.some(x=>!x)){screen="audit-report";return renderAgents();}
    const fields=comparisonFields(pair[0],pair[1]);
    root.innerHTML=`<header class="agents-header comparison-header"><div><p class="eyebrow">Comparaison d’audit</p><h2>Doublon potentiel — confiance ${confidenceLabel(confidenceScore(finding)).toLowerCase()}</h2><div class="comparison-summary"><span><strong>Score de doublon</strong>${confidenceScore(finding)} % — Confiance ${confidenceLabel(confidenceScore(finding)).toLowerCase()}</span><span><strong>IDs</strong>${esc(finding.itemIds.join(" / "))}</span></div></div><button class="ghost-btn" data-back-report>Retour au rapport</button></header>
      <div class="comparison-actions"><button class="ghost-btn" data-compare-review ${finding.state==="reviewed"?"disabled":""}>${finding.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn" data-compare-clear>Effacer l’alerte</button></div>
      <div class="audit-comparison"><section><header><span>Item A</span><h3>${esc(pair[0].name)}</h3><div class="comparison-item-actions"><button class="ghost-btn compact-btn" data-open-full="${esc(pair[0].id)}">Ouvrir la fiche complète</button><button class="danger-outline-btn compact-btn" data-delete-item="${esc(pair[0].id)}">Supprimer l’item</button></div></header>${renderComparisonValues(fields,0)}</section><section><header><span>Item B</span><h3>${esc(pair[1].name)}</h3><div class="comparison-item-actions"><button class="ghost-btn compact-btn" data-open-full="${esc(pair[1].id)}">Ouvrir la fiche complète</button><button class="danger-outline-btn compact-btn" data-delete-item="${esc(pair[1].id)}">Supprimer l’item</button></div></header>${renderComparisonValues(fields,1)}</section></div>`;
    root.querySelector("[data-back-report]").onclick=()=>{screen="audit-report";renderAgents();};
    root.querySelector("[data-compare-review]").onclick=()=>{if(finding.state!=="reviewed"){finding.state="reviewed";save();}renderAgents();};
    root.querySelector("[data-compare-clear]").onclick=event=>requestClearAlert(audit,finding.id,event.currentTarget);
    root.querySelectorAll("[data-open-full]").forEach(btn=>btn.onclick=()=>{sessionStorage.setItem("exadex_agents_active_comparison",JSON.stringify({auditId:audit.id,alertId:finding.id}));window.openItemDetail(btn.dataset.openFull,{view:"agents"});});
    root.querySelectorAll("[data-delete-item]").forEach(btn=>btn.onclick=()=>requestItemDeletionById(btn.dataset.deleteItem,{trigger:btn,onDeleted:item=>handleAuditedItemDeleted(audit,item)}));
  }
  function handleAuditedItemDeleted(audit,item){const removed=audit.alerts.filter(a=>a.itemIds.includes(item.id)).length;audit.alerts=audit.alerts.filter(a=>!a.itemIds.includes(item.id));save();sessionStorage.removeItem("exadex_agents_active_comparison");activeAlertId=null;screen="audit-report";storageMessage=`L’item « ${item.name} » a été supprimé par le workflow de l’inventaire. ${removed} alerte(s) devenue(s) obsolète(s) ont été retirées du rapport local.`;renderAgents();}
  function valueText(value){
    if(value===null||value===undefined||value===""||(Array.isArray(value)&&!value.length))return"Non renseigné";
    if(Array.isArray(value))return value.map(x=>typeof x==="object"?JSON.stringify(x):x).join(", ");
    return typeof value==="object"?JSON.stringify(value):String(value);
  }
  function primaryReference(item){const p=item.references?.primary;return p?.reference||item.reference||item.supplierReference||"";}
  function primarySupplier(item){return item.references?.primary?.supplier||item.supplier||item.fournisseur||"";}
  function comparisonFields(a,b){
    const rows=[
      ["Nom",a.name,b.name],["Référence",primaryReference(a),primaryReference(b)],["Fournisseur",primarySupplier(a),primarySupplier(b)],["Catégorie",a.category,b.category],["Sous-catégorie",a.subcategory||a.subCategory,b.subcategory||b.subCategory],["Unité",a.unit,b.unit],["Quantité actuelle",a.quantity,b.quantity],["Seuil minimum",a.minimum??a.minStock,b.minimum??b.minStock],["Type",a.usage||a.inventoryType,b.usage||b.inventoryType],["Localisation",a.locations?.length?a.locations:a.location,b.locations?.length?b.locations:b.location],["Lots",a.lots||a.lot,b.lots||b.lot],["Péremption",a.expiryDate||a.expirationDate,b.expiryDate||b.expirationDate],["Conditionnements",a.stockTracking?.packagingLevels,b.stockTracking?.packagingLevels],["Contenants fermés",a.stockTracking?.closedByLocation,b.stockTracking?.closedByLocation],["Contenants ouverts",a.stockTracking?.openContainers,b.stockTracking?.openContainers],["Préparations et aliquotes",a.aliquotTracking?.preparations,b.aliquotTracking?.preparations],["Notes ou description",a.notes||a.description,b.notes||b.description],["Dernière modification",a.updatedAt,b.updatedAt]
    ];
    return rows.map(([label,x,y])=>{const left=valueText(x),right=valueText(y),states=[left,right].map(v=>v==="Non renseigné"?"missing":"");const pairState=states.every(v=>v==="missing")?"missing":ExadexAgentsCore.normalize(left)===ExadexAgentsCore.normalize(right)?"same":"different";return{label,values:[left,right],state:pairState,states:states.map(v=>v||pairState)};});
  }
  function renderComparisonValues(fields,index){return`<dl class="comparison-values">${fields.map(row=>{const state=row.states?.[index]||row.state;return`<div class="${state}"><dt>${esc(row.label)} <span>${state==="same"?"✓ Identique":state==="different"?"◆ Différent":"○ Non renseigné"}</span></dt><dd>${esc(row.values[index])}</dd></div>`;}).join("")}</dl>`;}
  function renderSession(root) {
    const session = state.sessions.find(row => row.id === activeSessionId); if (!session) return renderNewSession(root);
    const step = session.proposals.length ? 4 : session.lines.length ? 3 : 2;
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Inventaire physique · Brouillon</p><h2>${esc(session.name)}</h2><p>Les données actives ne seront modifiées qu’après la validation finale.</p></div><span class="agent-session-status">${esc(session.status)}</span></header>${progress(step)}
      <section class="agent-panel"><label>Texte libre (interpréteur local prudent)<textarea id="physicalText" rows="9" placeholder="Une ligne par produit…">${esc(session.originalText)}</textarea></label><p class="agent-help">Les retours à la ligne sont conservés. Vous pourrez corriger et relier chaque ligne.</p><div class="modal-actions"><button class="ghost-btn" data-add-structured>Ajouter une ligne structurée</button><button class="primary-btn" data-interpret>Identifier les items</button></div></section>
      <div id="physicalLines"></div>${session.proposals.length ? renderProposals(session) : ""}`;
    bind(root); root.querySelector("[data-interpret]").onclick = () => { session.originalText = root.querySelector("#physicalText").value; session.lines = ExadexAgentsCore.parseFreeText(session.originalText).map(line => ({ ...line, match: ExadexAgentsCore.matchItem(line, window.items || []) })); session.proposals = ExadexAgentsCore.buildProposals(session, window.items || []); session.updatedAt = new Date().toISOString(); session.status = "À vérifier"; save(); renderAgents(); };
    root.querySelector("[data-add-structured]").onclick = () => { session.lines.push({ id:`manual-${Date.now()}`, raw:"", text:"", name:"", action:"count", quantity:null, parsed:true, match:{status:"unparsed",candidates:[]} }); save(); renderAgents(); };
    bindProposalActions(root, session);
  }
  function renderNewSession(root) {
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Nouveau brouillon</p><h2>Inventaire physique</h2></div></header>${progress(1)}<form id="sessionForm" class="agent-panel"><div class="agent-form-grid"><label>Nom de la session<input name="name" required value="Inventaire du ${new Date().toLocaleDateString("fr-FR")}"></label><label>Périmètre<select name="scope" class="select"><option value="full">Inventaire complet</option><option value="location">Inventaire d’une localisation</option><option value="category">Inventaire d’une catégorie</option><option value="free">Comptage libre</option></select></label>${select("location","Localisation facultative",window.inventoryLocations || [])}<label>Notes générales<textarea name="notes" rows="3"></textarea></label></div><div class="modal-actions"><button class="primary-btn">Créer le brouillon</button></div></form>`;
    bind(root); root.querySelector("#sessionForm").onsubmit = event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const session = ExadexAgentsCore.createSession({ ...data, location: data.location === "all" ? "" : data.location, author: window.currentName || "" }); state.sessions.unshift(session); activeSessionId = session.id; save(); renderAgents(); };
  }
  function progress(step) { return `<ol class="agent-progress">${["Définir le périmètre","Saisir le comptage","Identifier les items","Vérifier les propositions","Valider les modifications","Consulter le rapport"].map((label,i) => `<li class="${i+1<step?"done":i+1===step?"active":""}"><span>${i+1}</span><em>${label}</em></li>`).join("")}</ol>`; }
  function renderProposals(session) {
    return `<section class="agent-panel proposal-panel"><div class="section-heading"><h3>Propositions avant / après</h3><span>${session.proposals.length} ligne(s)</span></div><div class="proposal-list">${session.proposals.map(p => `<article class="proposal-row ${p.matchStatus}"><div><strong>${esc(p.itemName)}</strong><small>${labelMatch(p.matchStatus)} · confiance ${esc(p.confidence.toLowerCase())}</small></div><div><span>Avant</span><strong>${esc(p.beforeValue ?? "—")}</strong></div><div><span>Après</span><strong>${esc(p.afterValue || p.reason || "—")}</strong></div><div class="proposal-actions"><button class="ghost-btn compact-btn" data-decision="validated" data-id="${p.id}" ${!p.valid ? `disabled title="Résolvez la correspondance ou l’invalidité."` : ""}>Valider</button><button class="ghost-btn compact-btn" data-decision="ignored" data-id="${p.id}">Ignorer</button><button class="ghost-btn compact-btn" data-decision="pending" data-id="${p.id}">En attente</button></div></article>`).join("")}</div><div class="validation-notice"><strong>Validation obligatoire</strong><p>Les données actives ne seront modifiées qu’après cette validation.</p><button class="primary-btn" data-final-validate>Valider et appliquer les modifications</button><button class="ghost-btn" data-abandon>Abandonner le brouillon</button></div></section>`;
  }
  function labelMatch(status) { return ({ certain:"Correspondance certaine",probable:"Correspondance probable à confirmer",ambiguous:"Plusieurs correspondances possibles",not_found:"Aucun item trouvé",unparsed:"Ligne non comprise" })[status] || status; }
  function bindProposalActions(root, session) {
    root.querySelectorAll("[data-decision]").forEach(btn => btn.onclick = () => { const p=session.proposals.find(x=>x.id===btn.dataset.id); p.decision=btn.dataset.decision; session.decisions.push({proposalId:p.id,decision:p.decision,at:new Date().toISOString(),user:window.currentName||""}); save(); renderAgents(); });
    root.querySelector("[data-abandon]")?.addEventListener("click", () => { if(confirm("Abandonner ce brouillon ? Aucune donnée active ne sera modifiée.")){session.status="Abandonné";session.updatedAt=new Date().toISOString();save();screen="home";renderAgents();}});
    root.querySelector("[data-final-validate]")?.addEventListener("click", () => validateSession(session));
  }
  async function validateSession(session) {
    const selected = session.proposals.filter(p => p.decision === "validated");
    if (!selected.length) return alert("Sélectionnez au moins une proposition valide.");
    if (selected.some(p => !p.valid || ["ambiguous","not_found","unparsed"].includes(p.matchStatus))) return alert("La validation est bloquée : une proposition sélectionnée est ambiguë ou invalide.");
    const changes = selected.map(p => `${p.itemName} : ${p.beforeValue ?? "—"} → ${p.afterValue}`).join("\n");
    if (!confirm(`${selected.length} item(s) seront modifiés.\n\n${changes}\n\nValider et appliquer les modifications ?`)) return;
    const storage = window.ExadexGithubStorage;
    if (!storage?.mutateSharedData) return alert("La sauvegarde partagée sécurisée n’est pas disponible.");
    const operationId = `physical-session-${session.id}`;
    try {
      const result = await storage.mutateSharedData(operationId, latest => {
        const events = [], now = new Date().toISOString(), latestItems = latest.inventoryItems || [];
        selected.forEach(proposal => {
          const index = latestItems.findIndex(item => item.id === proposal.itemId), item = latestItems[index], conflict = ExadexAgentsCore.detectConflict(proposal, item);
          if (conflict.conflict) { proposal.conflict = conflict; return; }
          const before = ExadexAgentsCore.clone(item), op = proposal.operation;
          if (op.type === "physical_stock_recount") item.quantity = op.quantity;
          else if (op.type === "item_location_recount") { item.location = op.toLocation; item.locations = [op.toLocation]; }
          else { proposal.conflict = { conflict:true, reason:"Cette proposition détaillée doit être appliquée depuis le module de suivi existant." }; return; }
          item.updatedAt = now; item.version = Number(item.version || 0) + 1;
          events.push({ id:`movement-${session.id}-${proposal.id}`, operationId:`${operationId}-${proposal.id}`, itemId:item.id, timestamp:now, userName:window.currentName||session.author, type:"recounted", entityType:"item", before, after:ExadexAgentsCore.clone(item), comment:`Inventaire physique ${session.name}`, physicalInventorySessionId:session.id, physicalInventorySessionName:session.name });
          latest.history = Array.isArray(latest.history) ? latest.history : []; latest.history.unshift({ date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date(now)), user:window.currentName||session.author, action:"Inventaire physique validé", detail:`${session.name} · ${item.name} · ${proposal.beforeValue} → ${proposal.afterValue}`, sessionId:session.id });
        });
        if (selected.some(p => p.conflict)) throw new Error("CONFLICT: certaines lignes ont été modifiées depuis l’analyse.");
        latest.stockMovements = Array.isArray(latest.stockMovements) ? latest.stockMovements : []; latest.stockMovements.push(...events); latest.updatedAt=now; return latest;
      }, { maxAttempts: 3 });
      session.status="Validé"; session.updatedAt=new Date().toISOString(); session.report={applied:selected.length, ignored:session.proposals.filter(p=>p.decision==="ignored").length, at:session.updatedAt}; save(); if(typeof window.applySharedState==="function") window.applySharedState(result.data); screen="home"; renderAgents(); alert("Les modifications validées ont été appliquées et historisées.");
    } catch(error) { session.status="À vérifier"; save(); alert(/conflict|409/i.test(error.message) ? "Conflit détecté : aucune ligne n’a été appliquée. Rechargez ou réanalysez les propositions." : `Échec de la sauvegarde : ${error.message}`); }
  }
  function bind(root) {
    root.querySelectorAll("[data-agent-action]").forEach(btn => btn.onclick = () => { if(btn.dataset.agentAction==="home") screen="home"; if(btn.dataset.agentAction==="audit") screen="audit-config"; if(btn.dataset.agentAction==="physical"){screen="session";activeSessionId=null;} renderAgents(); });
    root.querySelectorAll("[data-open-audit]").forEach(btn => btn.onclick=()=>{activeAuditId=btn.dataset.openAudit;screen="audit-report";renderAgents();});
    root.querySelectorAll("[data-open-session]").forEach(btn => btn.onclick=()=>{activeSessionId=btn.dataset.openSession;screen="session";renderAgents();});
    root.querySelectorAll("[data-delete-audit]").forEach(btn=>btn.onclick=event=>{event.stopPropagation();requestAuditDeletion([btn.dataset.deleteAudit],btn);});
  }
  window.renderAgents = renderAgents;
  window.ExadexAgentsUI = { renderAgents, storageKeys: Storage.KEYS, comparisonFields, renderComparisonValues, deleteAuditReports, auditTypeLabel, _load: load, _save: save };
})();
