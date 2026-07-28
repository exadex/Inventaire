(function () {
  "use strict";
  const Storage = window.ExadexAgentsStorage;
  const migration = Storage.migrate(localStorage);
  let storageMessage = migration.ok ? "" : "La migration des données Agents n’a pas pu être terminée. L’ancienne sauvegarde a été conservée.";
  let operationMessage = null;
  let state = load();
  let screen = "home", activeAuditId = null, activeSessionId = null, activeAlertId = null, newSessionMode = "", selectedAuditIds = new Set(), selectedAlertIds = new Set(), expandedAuditGroups = new Map();
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
  const currentAuditItems=()=>typeof items!=="undefined"?items:(window.items||[]);
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
    root.innerHTML = `${renderOperationMessage()}<div id="agentsStorageMessage" class="agents-storage-message ${storageMessage?"":"hidden"}" role="alert">${esc(storageMessage)}</div><header class="client-studies-header agents-main-header"><div><p class="eyebrow">Outils assistés et contrôlés</p><div class="client-studies-title-row"><h3 id="agentsTitle">Agents</h3></div><p class="main-section-subtitle">Analysez et préparez vos comptages sans changement automatique.</p></div><button class="ghost-btn" data-clean-reports>Nettoyer les anciens rapports</button></header>
      <div class="agent-card-grid">
        <article class="agent-card"><span class="agent-icon" aria-hidden="true">◇</span><div><h3>Auditeur Inventaire ${warnings ? `<span class="agent-count">${warnings}</span>` : ""}</h3><p>Analyse l’inventaire, détecte les anomalies et vous signale les éléments à vérifier. Cet agent ne modifie aucune donnée.</p><ul><li>Lecture seule</li><li>Analyse complète ou ciblée</li><li>Aucun changement automatique</li></ul></div><button class="primary-btn" data-agent-action="audit">Lancer un audit</button></article>
        <article class="agent-card"><span class="agent-icon" aria-hidden="true">▣</span><div><h3>Inventaire Physique ${pending ? `<span class="agent-count">${pending}</span>` : ""}</h3><p>Transforme un comptage physique ou une demande de modification massive en propositions que vous pouvez contrôler avant validation.</p><ul><li>Préparation en brouillon</li><li>Comparaison avant/après</li><li>Validation obligatoire</li></ul></div><button class="primary-btn" data-agent-action="physical">Commencer</button></article>
      </div>
      <div class="agents-recent"><section><h3>Audits récents</h3>${state.audits.slice(0,4).map(a => `<div class="agent-recent-row"><button data-open-audit="${esc(a.id)}"><span>${fmt(a.createdAt)}</span><span class="audit-type-badge">${esc(auditTypeLabel(a.auditType))}</span><strong>${remainingLabel(a)}</strong></button><button class="audit-delete-btn" data-delete-audit="${esc(a.id)}" aria-label="Supprimer le rapport du ${esc(fmt(a.createdAt))}">Supprimer</button></div>`).join("") || "<p>Aucun audit enregistré.</p>"}</section>
      <section><h3>Brouillons et inventaires récents</h3>${state.sessions.slice(0,6).map(s => `<div class="agent-recent-row agent-session-row"><button data-open-session="${esc(s.id)}"><span class="agent-recent-date">${fmt(s.createdAt)}</span><span class="agent-recent-main"><strong>${esc(s.name)}</strong><small>${sessionTypeLabel(s)}</small></span><span class="agent-session-status status-${statusClass(s.status)}">${esc(s.status)}</span>${s.proposals?.length?`<span class="agent-proposal-count">${s.proposals.length} proposition${s.proposals.length>1?"s":""}</span>`:""}</button><button class="audit-delete-btn" data-delete-session="${esc(s.id)}" aria-label="Supprimer ${esc(s.name)}">Supprimer</button></div>`).join("") || "<p>Aucune session.</p>"}</section></div>
      <aside class="agents-diagnostic"><strong>Stockage Agents</strong><span>${formatBytes(diagnostic.bytes)} utilisés</span><span>${diagnostic.audits} audits</span><span>${diagnostic.sessions} sessions</span><span>${diagnostic.alerts} alertes</span><span>Plus gros rapport : ${formatBytes(diagnostic.biggestReportBytes)}</span></aside>`;
    bind(root);
    root.querySelector("[data-clean-reports]").onclick=()=>{selectedAuditIds.clear();screen="audit-manage";renderAgents();};
  }
  function formatBytes(bytes){return bytes<1024?`${bytes} o`:bytes<1048576?`${(bytes/1024).toFixed(1)} Ko`:`${(bytes/1048576).toFixed(2)} Mo`;}
  function renderAuditConfig(root) {
    const explanations={
      full:"Cet audit analyse l’ensemble de l’inventaire en exécutant tous les contrôles actuellement disponibles : doublons potentiels, stocks et seuils, références manquantes, doublons possédant des références différentes et références non enregistrées dans la fiche du fournisseur correspondant dans Contacts. Les résultats sont ensuite regroupés par catégorie afin de distinguer clairement chaque type d’anomalie.",
      duplicates:"Cet audit recherche les fiches susceptibles de correspondre au même produit. La comparaison tient notamment compte du nom, de la référence, du fournisseur, de la catégorie, du conditionnement et des caractéristiques du produit. Les résultats sont des doublons potentiels à vérifier, et non des suppressions automatiques.",
      stock:"Cet audit recherche les fiches dont la quantité de stock ou le seuil n’est pas renseigné, ainsi que les valeurs invalides et les incohérences entre le stock global et le détail des contenants. Une quantité de 0 ou un seuil de 0 est parfaitement valide et ne sera pas considéré comme un problème. Un stock inférieur au seuil n’est pas non plus une incohérence : il relève des alertes habituelles de stock.",
      references:"Vérifie les références manquantes, les doublons possédant des références différentes et les références qui ne sont pas enregistrées dans la fiche du fournisseur correspondant dans Contacts."
    };
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Strictement en lecture seule</p><h2>Nouvel audit</h2><p>Aucune fonction d’écriture n’est accessible à l’Auditeur.</p></div></header>
      <form id="auditConfigForm" class="agent-panel"><div class="agent-form-grid"><label>Type d’audit<select name="scope" class="select"><option value="full">Audit complet</option><option value="duplicates">Doublons uniquement</option><option value="stock">Stocks et seuils</option><option value="references">Références</option></select></label>
      ${select("category","Catégorie", window.inventoryCategories || [])}${select("location","Localisation",window.inventoryLocations || [])}<label>Type<select name="usage" class="select"><option value="all">Tous</option><option value="normal">Normal</option><option value="routine">Routine</option><option value="backup">Back-up</option></select></label></div><section class="audit-explanation" aria-live="polite"><h3>Explication</h3><p>${esc(explanations.full)}</p></section><div class="modal-actions"><button class="primary-btn" type="submit">Analyser en lecture seule</button></div></form>`;
    bind(root);
    const form=root.querySelector("#auditConfigForm"),scopeSelect=form.elements.scope,explanation=form.querySelector(".audit-explanation p");
    scopeSelect.onchange=()=>{explanation.textContent=explanations[scopeSelect.value]||"";};
    form.addEventListener("submit", event => { event.preventDefault(); const options = Object.fromEntries(new FormData(event.currentTarget)); delete options.severity; root.innerHTML = `<div class="agent-loading" role="status"><span></span><strong>Analyse en cours…</strong></div>`; setTimeout(() => {
      const report = ExadexAgentsCore.audit({ items: currentAuditItems(), orders: window.orders || [], locations: window.inventoryLocations || [], categories: window.inventoryCategories || [], contacts:window.ExadexContacts?.getAll?.()||[], stockTrackingApi:window.StockTracking }, options);
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
      <div class="agent-metrics audit-live-metrics"><article><strong id="auditRemainingCount">${counts.active}</strong><span>Alertes restantes</span></article><article><strong id="auditInitialCount">${counts.initial}</strong><span>Alertes initiales</span></article><article><strong id="auditReviewedCount">${counts.reviewed}</strong><span>Examinées</span></article><article><strong id="auditDeletedCount">${counts.deleted}</strong><span>Effacées</span></article></div>
      <div id="auditAlerts"></div>`;
    bind(root);
    renderAuditAlerts(audit);
  }
  function auditCounts(audit){const alerts=audit.alerts||[],deleted=Math.max(0,Number(audit.deletedAlertCount)||0),reviewed=alerts.filter(a=>a.state==="reviewed").length,active=Math.max(0,alerts.length-reviewed),expectedInitial=alerts.length+deleted,storedInitial=Math.max(0,Number(audit.initialAlertCount)||0),initial=storedInitial===expectedInitial?storedInitial:expectedInitial;return{initial,active,reviewed,deleted};}
  function remainingAlerts(audit){return auditCounts(audit).active;}
  function remainingLabel(audit){const count=remainingAlerts(audit);return`${count} alerte${count===1?"":"s"} restante${count===1?"":"s"}`;}
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
    const box = document.querySelector("#auditAlerts"),currentItems=currentAuditItems();
    const sorted=rows=>rows.map((alert,index)=>({...alert,_index:index})).sort((a,b)=>(a.state==="reviewed")-(b.state==="reviewed")||confidenceScore(b)-confidenceScore(a)||String(a.itemIds?.[0]||"").localeCompare(String(b.itemIds?.[0]||""))||a._index-b._index);
    const cards=rows=>sorted(rows).map(a=>renderAuditAlertCard(a,currentItems)).join("")||`<div class="agent-empty">Aucune anomalie détectée</div>`;
    const referenceCriterion=alert=>alert.referenceCriterion||(/différentes/i.test(alert.type)?"different-duplicates":/non enregistrée/i.test(alert.type)?"unregistered-contact":"missing");
    const legacyScope=alert=>alert.auditScope||(/doublon/i.test(alert.type)?"duplicates":/stock|seuil|contenant/i.test(alert.type)?"stock":"references");
    const referenceDefinitions=[["different-duplicates","Doublons avec des références différentes"],["missing","Références manquantes"],["unregistered-contact","Références non enregistrées dans les Contacts"]];
    const referenceGroups=rows=>referenceDefinitions.map(([key,label])=>({key:`references-${key}`,label,rows:rows.filter(alert=>referenceCriterion(alert)===key)}));
    const groups=audit.scope==="full"
      ? [{key:"duplicates",label:"Doublons potentiels",rows:audit.alerts.filter(a=>legacyScope(a)==="duplicates")},{key:"stock",label:"Stocks et seuils",rows:audit.alerts.filter(a=>legacyScope(a)==="stock")},...referenceGroups(audit.alerts.filter(a=>legacyScope(a)==="references"))]
      : audit.scope==="references"?referenceGroups(audit.alerts):null;
    selectedAlertIds=new Set([...selectedAlertIds].filter(id=>audit.alerts.some(alert=>alert.id===id)));
    if(groups){
      if(!expandedAuditGroups.has(audit.id))expandedAuditGroups.set(audit.id,new Set());
      const expanded=expandedAuditGroups.get(audit.id),selectedCount=selectedAlertIds.size;
      const bulk=selectedCount?`<div class="audit-bulk-actions" role="region" aria-label="Actions sur les alertes sélectionnées"><strong>${selectedCount} sélectionnée${selectedCount>1?"s":""}</strong><button class="ghost-btn compact-btn" type="button" data-bulk-review>Marquer examinées</button><button class="danger-outline-btn compact-btn" type="button" data-bulk-clear>Effacer les alertes</button></div>`:"";
      box.innerHTML=bulk+groups.map(group=>{const open=expanded.has(group.key),remaining=group.rows.filter(alert=>alert.state!=="reviewed").length,panelId=`audit-group-${audit.id}-${group.key}`.replace(/[^a-z0-9_-]/gi,"-");return`<section class="audit-scope-group ${open?"open":""}" data-audit-group="${esc(group.key)}"><header><button class="audit-group-toggle" type="button" aria-expanded="${open}" aria-controls="${esc(panelId)}"><span>${esc(group.label)}</span><span class="audit-group-count">${remaining} alerte${remaining===1?"":"s"}</span><i aria-hidden="true">›</i></button></header><div id="${esc(panelId)}" class="audit-group-panel" ${open?"":"hidden"}>${cards(group.rows)}</div></section>`;}).join("");
    }else box.innerHTML=(selectedAlertIds.size?`<div class="audit-bulk-actions"><strong>${selectedAlertIds.size} sélectionnée${selectedAlertIds.size>1?"s":""}</strong><button class="ghost-btn compact-btn" type="button" data-bulk-review>Marquer examinées</button><button class="danger-outline-btn compact-btn" type="button" data-bulk-clear>Effacer les alertes</button></div>`:"")+cards(audit.alerts);
    box.querySelectorAll("[data-audit-group] .audit-group-toggle").forEach(button=>button.onclick=()=>{const key=button.closest("[data-audit-group]").dataset.auditGroup,set=expandedAuditGroups.get(audit.id)||new Set();set.has(key)?set.delete(key):set.add(key);expandedAuditGroups.set(audit.id,set);renderAuditAlerts(state.audits.find(row=>row.id===audit.id));});
    box.querySelectorAll("[data-select-alert]").forEach(input=>input.onchange=()=>{input.checked?selectedAlertIds.add(input.dataset.selectAlert):selectedAlertIds.delete(input.dataset.selectAlert);renderAuditAlerts(state.audits.find(row=>row.id===audit.id));});
    box.querySelector("[data-bulk-review]")?.addEventListener("click",()=>markAlertsReviewed(audit.id,[...selectedAlertIds]));
    box.querySelector("[data-bulk-clear]")?.addEventListener("click",event=>requestClearAlerts(audit.id,[...selectedAlertIds],event.currentTarget));
    box.querySelectorAll("[data-clear-alert]").forEach(btn=>btn.onclick=()=>requestClearAlert(audit,btn.dataset.clearAlert,btn));
    box.querySelectorAll("[data-review]").forEach(btn => btn.onclick = () => markAlertsReviewed(audit.id,[btn.dataset.review]));
    box.querySelectorAll("[data-examine]").forEach(btn => btn.onclick = () => { const a = audit.alerts.find(x => x.id === btn.dataset.examine); if(a?.itemIds?.length===2){activeAlertId=a.id;screen="audit-compare";sessionStorage.setItem("exadex_agents_active_comparison",JSON.stringify({auditId:audit.id,alertId:a.id}));renderAgents();}else if(a?.itemIds?.[0]&&typeof window.openItemDetail==="function")window.openItemDetail(a.itemIds[0],{view:"agents"}); });
  }
  function renderOperationMessage(){return operationMessage?`<div class="agent-operation-message ${esc(operationMessage.type||"info")}" role="${operationMessage.type==="error"?"alert":"status"}">${esc(operationMessage.text)}</div>`:"";}
  function setOperationMessage(text,type="info"){operationMessage={text:String(text||""),type};}
  function sessionTypeLabel(session){return(session.sessionType||"physical")==="bulk"?"Modification massive":"Inventaire physique";}
  function statusClass(value){return({"Brouillon":"draft","À vérifier":"review","À valider":"review","Validé":"validated","Abandonné":"abandoned","Erreur":"error"})[value]||"draft";}
  function requestSessionDeletion(id,trigger){
    const session=state.sessions.find(row=>row.id===id);if(!session)return;
    const bulk=(session.sessionType||"physical")==="bulk",description=bulk?`Le brouillon « ${session.name} » et ses propositions seront supprimés. Les données de l’Inventaire ne seront pas modifiées.`:`La session « ${session.name} » sera supprimée. Les données de l’Inventaire ne seront pas modifiées.`;
    openDeleteConfirmation({title:"Supprimer ce brouillon ?",message:description,confirmText:"Supprimer le brouillon",trigger,onConfirm:()=>{const before=state.sessions;state.sessions=state.sessions.filter(row=>row.id!==id);const saved=save();if(!saved.ok){state.sessions=before;throw new Error("Le brouillon n’a pas pu être supprimé.");}if(activeSessionId===id){activeSessionId=null;screen="home";}renderAgents();}});
  }
  function markAlertsReviewed(auditId,ids){
    const audit=state.audits.find(row=>row.id===auditId),targets=new Set(ids),changed=(audit?.alerts||[]).filter(alert=>targets.has(alert.id)&&alert.state!=="reviewed");
    if(!changed.length){selectedAlertIds.clear();return renderAgents();}
    changed.forEach(alert=>alert.state="reviewed");const result=save();
    if(!result.ok){changed.forEach(alert=>alert.state="pending");throw new Error("Le statut examiné n’a pas pu être enregistré.");}
    selectedAlertIds.clear();renderAgents();
  }
  function requestClearAlerts(auditId,ids,trigger){
    const audit=state.audits.find(row=>row.id===auditId),targets=[...new Set(ids)].filter(id=>audit?.alerts.some(alert=>alert.id===id));if(!targets.length)return;
    const title=targets.length===1?"Effacer cette alerte ?":`Effacer les ${targets.length} alertes sélectionnées ?`;
    openDeleteConfirmation({title,message:`${targets.length===1?"Cette alerte sera supprimée":"Ces alertes seront supprimées"} du rapport local. Aucun Agent ni aucune donnée de l’Inventaire ne sera modifié.`,confirmText:targets.length===1?"Effacer l’alerte":"Effacer les alertes",trigger,onConfirm:()=>{const before=audit.alerts,previousDeleted=audit.deletedAlertCount||0;audit.alerts=audit.alerts.filter(alert=>!targets.includes(alert.id));audit.deletedAlertCount=previousDeleted+targets.length;const result=save();if(!result.ok){audit.alerts=before;audit.deletedAlertCount=previousDeleted;throw new Error("Les alertes n’ont pas pu être effacées.");}selectedAlertIds.clear();renderAgents();}});
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
    const selection=`<label class="audit-alert-selection"><input type="checkbox" data-select-alert="${esc(alert.id)}" ${selectedAlertIds.has(alert.id)?"checked":""}><span class="sr-only">Sélectionner cette alerte</span></label>`;
    if(alert.auditScope!=="duplicates"&&alert.type!=="Doublon potentiel"&&alert.type!=="Doublon potentiel avec références différentes"){
      const names=alert.itemIds.map(id=>items.find(item=>item.id===id)?.name||id),reasons=alert.reasons||[alert.explanation].filter(Boolean);
      return`<article class="audit-alert audit-data-alert ${alert.state==="reviewed"?"reviewed":""}">${selection}<header><h3>${esc(alert.type)}</h3>${alert.state==="reviewed"?`<span>✓ Examinée</span>`:""}</header><div class="audit-item-names">${names.map(name=>`<div><strong>${esc(name)}</strong></div>`).join("")}</div><ul class="audit-reasons">${reasons.map(reason=>`<li>${esc(reason)}</li>`).join("")}</ul><div class="audit-alert-meta"><span>ID : ${esc(alert.itemIds.join(" / "))}</span></div><footer><button class="ghost-btn compact-btn" data-examine="${esc(alert.id)}">Examiner</button><button class="ghost-btn compact-btn" data-review="${esc(alert.id)}" ${alert.state==="reviewed"?"disabled":""}>${alert.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn compact-btn" data-clear-alert="${esc(alert.id)}">Effacer l’alerte</button></footer></article>`;
    }
    const score=confidenceScore(alert),names=alert.itemIds.map(id=>items.find(item=>item.id===id)?.name||id);
    return`<article class="audit-alert duplicate ${alert.state==="reviewed"?"reviewed":confidenceBand(score)}" data-confidence-score="${score}">${selection}<header><h3>Doublon potentiel — confiance ${confidenceLabel(score).toLowerCase()}</h3><span class="confidence-text">${score} %</span></header><div class="audit-item-names">${names.map((name,index)=>`<div><span>Item ${index?"B":"A"}</span><strong>${esc(name)}</strong></div>`).join("")}</div>${renderUsefulDifferences(alert)}<div class="audit-alert-meta"><span>Score de doublon : ${score} % — Confiance ${confidenceLabel(score).toLowerCase()}</span><span>IDs : ${esc(alert.itemIds.join(" / "))}</span>${alert.state==="reviewed"?`<strong>✓ Examinée</strong>`:""}</div><footer><button class="ghost-btn compact-btn" data-examine="${esc(alert.id)}">Examiner</button><button class="ghost-btn compact-btn" data-review="${esc(alert.id)}" ${alert.state==="reviewed"?"disabled":""}>${alert.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn compact-btn" data-clear-alert="${esc(alert.id)}">Effacer l’alerte</button></footer></article>`;
  }
  function updateAuditCounters(audit){const counts=auditCounts(audit),remaining=document.querySelector("#auditRemainingCount"),reviewed=document.querySelector("#auditReviewedCount"),deleted=document.querySelector("#auditDeletedCount"),initial=document.querySelector("#auditInitialCount");if(remaining)remaining.textContent=counts.active;if(reviewed)reviewed.textContent=counts.reviewed;if(deleted)deleted.textContent=counts.deleted;if(initial)initial.textContent=counts.initial;}
  function requestClearAlert(audit,id,trigger){const finding=audit.alerts.find(a=>a.id===id);if(!finding)return;openDeleteConfirmation({title:"Effacer cette alerte ?",message:"Cette alerte sera supprimée du rapport local. Aucun item ni aucune donnée de l’inventaire ne sera modifié.",confirmText:"Effacer l’alerte",trigger,onConfirm:()=>{const canonical=state.audits.find(row=>row.id===audit.id),before=canonical.alerts,previousDeleted=canonical.deletedAlertCount||0;canonical.alerts=canonical.alerts.filter(a=>a.id!==id);canonical.deletedAlertCount=previousDeleted+1;const saved=save();if(!saved.ok){canonical.alerts=before;canonical.deletedAlertCount=previousDeleted;throw new Error("L’alerte n’a pas pu être effacée.");}selectedAlertIds.delete(id);if(screen==="audit-compare"){activeAlertId=null;sessionStorage.removeItem("exadex_agents_active_comparison");screen="audit-report";}renderAgents();}});}
  function renderAuditComparison(root){
    const audit=state.audits.find(x=>x.id===activeAuditId),finding=audit?.alerts.find(x=>x.id===activeAlertId),currentItems=currentAuditItems();
    const pair=(finding?.itemIds||[]).map(id=>currentItems.find(item=>item.id===id));
    if(!finding||pair.length!==2||pair.some(x=>!x)){screen="audit-report";return renderAgents();}
    const fields=comparisonFields(pair[0],pair[1]);
    root.innerHTML=`<header class="agents-header comparison-header"><div><p class="eyebrow">Comparaison d’audit</p><h2>Doublon potentiel — confiance ${confidenceLabel(confidenceScore(finding)).toLowerCase()}</h2><div class="comparison-summary"><span><strong>Score de doublon</strong>${confidenceScore(finding)} % — Confiance ${confidenceLabel(confidenceScore(finding)).toLowerCase()}</span><span><strong>IDs</strong>${esc(finding.itemIds.join(" / "))}</span></div></div><button class="ghost-btn" data-back-report>Retour au rapport</button></header>
      <div class="comparison-actions"><button class="ghost-btn" data-compare-review ${finding.state==="reviewed"?"disabled":""}>${finding.state==="reviewed"?"Examinée ✓":"Marquer examinée"}</button><button class="ghost-btn" data-compare-clear>Effacer l’alerte</button></div>
      <div class="audit-comparison"><section><header><span>Item A</span><h3>${esc(pair[0].name)}</h3><div class="comparison-item-actions"><button class="ghost-btn compact-btn" data-open-full="${esc(pair[0].id)}">Ouvrir la fiche complète</button><button class="danger-outline-btn compact-btn" data-delete-item="${esc(pair[0].id)}">Supprimer l’item</button></div></header>${renderComparisonValues(fields,0)}</section><section><header><span>Item B</span><h3>${esc(pair[1].name)}</h3><div class="comparison-item-actions"><button class="ghost-btn compact-btn" data-open-full="${esc(pair[1].id)}">Ouvrir la fiche complète</button><button class="danger-outline-btn compact-btn" data-delete-item="${esc(pair[1].id)}">Supprimer l’item</button></div></header>${renderComparisonValues(fields,1)}</section></div>`;
    root.querySelector("[data-back-report]").onclick=()=>{screen="audit-report";renderAgents();};
    root.querySelector("[data-compare-review]").onclick=()=>markAlertsReviewed(audit.id,[finding.id]);
    root.querySelector("[data-compare-clear]").onclick=event=>requestClearAlert(audit,finding.id,event.currentTarget);
    root.querySelectorAll("[data-open-full]").forEach(btn=>btn.onclick=()=>{sessionStorage.setItem("exadex_agents_active_comparison",JSON.stringify({auditId:audit.id,alertId:finding.id}));window.openItemDetail(btn.dataset.openFull,{view:"agents"});});
    root.querySelectorAll("[data-delete-item]").forEach(btn=>btn.onclick=()=>requestItemDeletionById(btn.dataset.deleteItem,{trigger:btn,onDeleted:item=>handleAuditedItemDeleted(audit,item)}));
  }
  function handleAuditedItemDeleted(audit,item){const removed=audit.alerts.filter(a=>a.itemIds.includes(item.id)).length;audit.alerts=audit.alerts.filter(a=>!a.itemIds.includes(item.id));audit.initialAlertCount=Math.max(0,(audit.initialAlertCount??audit.alerts.length+removed)-removed);save();sessionStorage.removeItem("exadex_agents_active_comparison");activeAlertId=null;screen="audit-report";storageMessage=`L’item « ${item.name} » a été supprimé par le workflow de l’inventaire. ${removed} alerte(s) devenue(s) obsolète(s) ont été retirées du rapport local.`;renderAgents();}
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
    if(["Validé","Abandonné","Erreur"].includes(session.status))return renderTerminalSession(root,session);
    if((session.sessionType||"physical")==="bulk")return renderBulkSession(root,session);
    const step = session.proposals.length ? 4 : session.lines.length ? 3 : 2;
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Inventaire physique · Brouillon</p><h2>${esc(session.name)}</h2><p>Les données actives ne seront modifiées qu’après la validation finale.</p></div><span class="agent-session-status">${esc(session.status)}</span></header>${progress(step)}
      <section class="agent-panel"><label>Texte libre (interpréteur local prudent)<textarea id="physicalText" rows="9" placeholder="Une ligne par produit…">${esc(session.originalText)}</textarea></label><p class="agent-help">Les retours à la ligne sont conservés. Vous pourrez corriger et relier chaque ligne.</p><div class="modal-actions"><button class="ghost-btn" data-add-structured>Ajouter une ligne structurée</button><button class="primary-btn" data-interpret>Identifier les items</button></div></section>
      <div id="physicalLines"></div>${session.proposals.length ? renderProposals(session) : ""}`;
    bind(root); root.querySelector("[data-interpret]").onclick = () => { session.originalText = root.querySelector("#physicalText").value; session.lines = ExadexAgentsCore.parseFreeText(session.originalText).map(line => ({ ...line, match: ExadexAgentsCore.matchItem(line, window.items || []) })); session.proposals = ExadexAgentsCore.buildProposals(session, window.items || []); session.updatedAt = new Date().toISOString(); session.status = "À vérifier"; save(); renderAgents(); };
    root.querySelector("[data-add-structured]").onclick = () => { session.lines.push({ id:`manual-${Date.now()}`, raw:"", text:"", name:"", action:"count", quantity:null, parsed:true, match:{status:"unparsed",candidates:[]} }); save(); renderAgents(); };
    bindProposalActions(root, session);
  }
  function renderTerminalSession(root,session){
    const report=session.report||{},changes=Array.isArray(report.changes)?report.changes:[],validated=session.status==="Validé",type=sessionTypeLabel(session),at=report.at||session.updatedAt||session.createdAt,user=report.user||session.author||"Non renseigné",applied=Math.max(0,Number(report.applied)||0),ignored=Math.max(0,Number(report.ignored)||0),conflicts=Math.max(0,Number(report.conflicts)||0),errors=Math.max(0,Number(report.errors)||0);
    root.innerHTML=`<button class="agent-back ghost-btn" data-agent-action="home">← Retour aux Agents</button><header class="agents-header agent-result-header"><div><p class="eyebrow">${esc(type)}</p><h2>${esc(session.name)}</h2><p>Compte rendu enregistré de cette session terminée.</p></div><span class="agent-session-status status-${statusClass(session.status)}">${esc(session.status)}</span></header><section class="agent-panel session-result-panel"><div class="session-result-meta"><article><span>Validation</span><strong>${esc(fmt(at))}</strong></article><article><span>Utilisateur</span><strong>${esc(user)}</strong></article><article><span>Appliquées</span><strong>${applied}</strong></article><article><span>Exclues</span><strong>${ignored}</strong></article><article><span>Conflits</span><strong>${conflicts}</strong></article><article><span>Erreurs</span><strong>${errors}</strong></article></div>${changes.length?`<div class="session-result-table"><div class="session-result-table-head"><span>Article</span><span>Champ modifié</span><span>Avant</span><span>Après</span></div>${changes.map(change=>`<article><strong>${esc(change.itemName||change.itemId||"Article")}</strong><span>${esc(change.fieldLabel||change.field||"Modification")}</span><span>${esc(formatBulkValue(change.beforeValue))}</span><span>${esc(formatBulkValue(change.afterValue))}</span>${change.delta!==undefined&&change.delta!==null?`<small>Différence : ${esc(formatBulkValue(change.delta))}</small>`:""}</article>`).join("")}</div>`:`<div class="agent-empty session-result-legacy"><p>${validated&&applied?"Le détail historique de cette ancienne session n’a pas été conservé. Aucune modification n’est reconstituée.":"Aucune modification appliquée n’est enregistrée pour cette session."}</p></div>`}</section>`;
    bind(root);
  }
  function renderNewSession(root) {
    if(!newSessionMode){
      root.innerHTML=`<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Nouveau brouillon</p><h2>Que souhaitez-vous préparer ?</h2><p>Aucune donnée ne sera modifiée avant votre validation explicite.</p></div></header><div class="agent-mode-grid"><button class="agent-mode-card" data-session-mode="physical"><span class="agent-icon" aria-hidden="true">▣</span><strong>Réaliser un inventaire physique</strong><small>Interpréter un comptage et préparer les ajustements de stock.</small></button><button class="agent-mode-card" data-session-mode="bulk"><span class="agent-icon" aria-hidden="true">✎</span><strong>Préparer une modification massive</strong><small>Décrire une règle, contrôler chaque proposition puis appliquer la sélection.</small></button></div>`;
      bind(root);root.querySelectorAll("[data-session-mode]").forEach(button=>button.onclick=()=>{newSessionMode=button.dataset.sessionMode;renderAgents();});return;
    }
    if(newSessionMode==="bulk")return renderNewBulkSession(root);
    root.innerHTML = `<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Nouveau brouillon</p><h2>Inventaire physique</h2></div></header>${progress(1)}<form id="sessionForm" class="agent-panel"><div class="agent-form-grid"><label>Nom de la session<input name="name" required value="Inventaire du ${new Date().toLocaleDateString("fr-FR")}"></label><label>Périmètre<select name="scope" class="select"><option value="full">Inventaire complet</option><option value="location">Inventaire d’une localisation</option><option value="category">Inventaire d’une catégorie</option><option value="free">Comptage libre</option></select></label>${select("location","Localisation facultative",window.inventoryLocations || [])}<label>Notes générales<textarea name="notes" rows="3"></textarea></label></div><div class="modal-actions"><button class="primary-btn">Créer le brouillon</button></div></form>`;
    bind(root); root.querySelector("#sessionForm").onsubmit = event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const session = ExadexAgentsCore.createSession({ ...data, location: data.location === "all" ? "" : data.location, author: window.currentName || "" }); state.sessions.unshift(session); activeSessionId = session.id; save(); renderAgents(); };
  }
  function renderNewBulkSession(root){
    root.innerHTML=`<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Modification massive · Brouillon contrôlé</p><h2>Décrire la modification</h2><p>Votre instruction sera convertie en règle structurée appartenant à une liste d’opérations autorisées.</p></div></header><form id="bulkInstructionForm" class="agent-panel bulk-instruction-panel"><label>Instruction<textarea name="instruction" rows="7" required placeholder="Ex. Remplacer Sigma par Merck dans la référence de tous les articles concernés."></textarea></label><div class="agent-help bulk-examples"><strong>Exemples</strong><span>Déplacer une localisation · uniformiser une unité · renseigner un fournisseur vide · modifier un stock minimum.</span></div><div class="modal-actions"><button class="ghost-btn" type="button" data-session-mode-back>Changer de mode</button><button class="primary-btn">Analyser la demande</button></div></form>`;
    bind(root);root.querySelector("[data-session-mode-back]").onclick=()=>{newSessionMode="";renderAgents();};
    root.querySelector("#bulkInstructionForm").onsubmit=event=>{event.preventDefault();const instruction=new FormData(event.currentTarget).get("instruction"),parsed=ExadexAgentsCore.interpretBulkInstruction(instruction),session=ExadexAgentsCore.createSession({sessionType:"bulk",name:parsed.name||"Modification massive",author:window.currentName||"",originalText:instruction});session.bulkRule=parsed.rule||null;session.clarification=parsed.question||"";session.status="Brouillon";state.sessions.unshift(session);activeSessionId=session.id;save();renderAgents();};
  }
  function bulkFieldOptions(selected=""){return Object.entries(ExadexAgentsCore.BULK_FIELDS).map(([key,meta])=>`<option value="${esc(key)}" ${selected===key?"selected":""}>${esc(meta.label)}</option>`).join("");}
  function renderBulkSession(root,session){
    const rule=session.bulkRule||{},hasRule=Boolean(rule.field),proposals=session.proposals||[],query=String(session.proposalSearch||"").toLocaleLowerCase("fr"),visible=proposals.filter(p=>!query||`${p.itemName} ${p.beforeValue} ${p.afterValue}`.toLocaleLowerCase("fr").includes(query)),included=proposals.filter(p=>p.decision==="validated"&&p.valid&&!p.conflict).length,excluded=proposals.filter(p=>p.decision==="ignored").length,conflicts=proposals.filter(p=>p.conflict||!p.valid).length;
    root.innerHTML=`${renderOperationMessage()}<button class="agent-back ghost-btn" data-agent-action="home">← Agents</button><header class="agents-header"><div><p class="eyebrow">Modification massive · Brouillon</p><h2>${esc(session.name)}</h2><p>Aucune donnée active ne sera modifiée avant la validation finale.</p></div><span class="agent-session-status status-${statusClass(session.status)}">${esc(session.status)}</span></header>
      <section class="agent-panel bulk-rule-panel"><div class="section-heading"><h3>Interprétation structurée</h3><span>Règle modifiable</span></div>${session.clarification?`<div class="agent-clarification" role="alert">${esc(session.clarification)}</div>`:""}<form id="bulkRuleForm"><div class="bulk-rule-grid"><label>Nom du brouillon<input name="name" value="${esc(session.name)}" required></label><label>Action<select name="action" class="select"><option value="replace" ${rule.action==="replace"?"selected":""}>Remplacer une valeur</option><option value="set" ${rule.action==="set"?"selected":""}>Définir une valeur</option><option value="add" ${rule.action==="add"?"selected":""}>Ajouter une valeur</option></select></label><label>Mode de remplacement<select name="replaceMode" class="select"><option value="whole" ${(rule.replaceMode||(!String(rule.oldValue||"").trim()?"whole":"partial"))==="whole"?"selected":""}>Remplacer toute la valeur</option><option value="partial" ${(rule.replaceMode||(!String(rule.oldValue||"").trim()?"whole":"partial"))==="partial"?"selected":""}>Remplacer uniquement le texte correspondant</option></select></label><label>Champ à modifier<select name="field" class="select" required><option value="">Choisir…</option>${bulkFieldOptions(rule.field)}</select></label><label>Champ utilisé comme condition<select name="conditionField" class="select" required><option value="">Choisir…</option>${bulkFieldOptions(rule.conditionField)}</select></label><label>Correspondance<select name="match" class="select"><option value="exact" ${rule.match==="exact"?"selected":""}>Valeur exacte</option><option value="contains" ${rule.match==="contains"?"selected":""}>Contient</option><option value="starts" ${rule.match==="starts"?"selected":""}>Commence par</option><option value="ends" ${rule.match==="ends"?"selected":""}>Se termine par</option><option value="empty" ${rule.match==="empty"?"selected":""}>Champ vide</option><option value="gt" ${rule.match==="gt"?"selected":""}>Supérieure à</option><option value="lt" ${rule.match==="lt"?"selected":""}>Inférieure à</option><option value="eq" ${rule.match==="eq"?"selected":""}>Égale à</option><option value="all" ${rule.match==="all"?"selected":""}>Tous les articles</option></select></label><label>Valeur de condition<input name="conditionValue" value="${esc(rule.conditionValue||"")}"></label><label>Ancienne valeur<input name="oldValue" value="${esc(rule.oldValue||"")}"></label><label>Nouvelle valeur<input name="newValue" value="${esc(rule.newValue??"")}" required></label><label>Condition complémentaire<select name="extraConditionField" class="select"><option value="">Aucune</option>${bulkFieldOptions(rule.extraCondition?.field)}</select></label><label>Correspondance complémentaire<select name="extraConditionMatch" class="select"><option value="exact" ${rule.extraCondition?.match==="exact"?"selected":""}>Valeur exacte</option><option value="contains" ${rule.extraCondition?.match==="contains"?"selected":""}>Contient</option><option value="starts" ${rule.extraCondition?.match==="starts"?"selected":""}>Commence par</option><option value="empty" ${rule.extraCondition?.match==="empty"?"selected":""}>Champ vide</option></select></label><label>Valeur complémentaire<input name="extraConditionValue" value="${esc(rule.extraCondition?.value||"")}"></label></div><label class="bulk-case-option"><input type="checkbox" name="caseInsensitive" ${rule.caseInsensitive!==false?"checked":""}> Correspondance insensible à la casse</label><div class="modal-actions"><button class="primary-btn">Rechercher les articles</button></div></form></section>
      ${hasRule&&proposals.length===0?`<div class="agent-empty bulk-empty">Aucune proposition préparée. Vérifiez la règle puis recherchez les articles correspondants.</div>`:""}${proposals.length?renderBulkProposals(session,visible,{included,excluded,conflicts,total:proposals.length}):""}`;
    bind(root);const form=root.querySelector("#bulkRuleForm");form.onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));if(data.action==="replace"&&data.replaceMode==="partial"&&!String(data.oldValue||"").trim()){session.clarification="L’ancienne valeur est obligatoire pour remplacer uniquement une partie du texte.";session.proposals=[];save();return renderAgents();}session.name=data.name;session.bulkRule={...rule,action:data.action,replaceMode:data.replaceMode,field:data.field,conditionField:data.conditionField,match:data.match,conditionValue:data.conditionValue,oldValue:data.oldValue,newValue:data.newValue,caseInsensitive:Boolean(data.caseInsensitive),extraCondition:data.extraConditionField?{field:data.extraConditionField,match:data.extraConditionMatch,value:data.extraConditionValue}:null};session.clarification="";session.proposals=ExadexAgentsCore.buildBulkProposals(session,currentAuditItems());session.status=session.proposals.length?"À valider":"Brouillon";session.updatedAt=new Date().toISOString();save();renderAgents();};bindBulkProposalActions(root,session);
  }
  function renderBulkProposals(session,rows,counts){
    return`<section class="agent-panel proposal-panel bulk-proposal-panel"><div class="section-heading"><div><h3>Aperçu avant / après</h3><p>${counts.total} correspondance${counts.total>1?"s":""} · ${counts.included} incluse${counts.included>1?"s":""} · ${counts.excluded} exclue${counts.excluded>1?"s":""}${counts.conflicts?` · ${counts.conflicts} conflit${counts.conflicts>1?"s":""}`:""}</p></div><label class="bulk-proposal-search">Rechercher<input type="search" data-bulk-search value="${esc(session.proposalSearch||"")}" placeholder="Article ou valeur…"></label></div><div class="bulk-proposal-table"><div class="bulk-proposal-head"><span></span><span>Article</span><span>Champ</span><span>Avant</span><span>Après</span><span>État</span></div>${rows.map(p=>`<article class="bulk-proposal-row ${p.conflict?"conflict":p.decision==="ignored"?"excluded":""}"><label><input type="checkbox" data-bulk-proposal="${esc(p.id)}" ${p.decision==="validated"&&!p.conflict?"checked":""} ${p.conflict||!p.valid?"disabled":""}><span class="sr-only">Inclure ${esc(p.itemName)}</span></label><strong>${esc(p.itemName)}</strong><span>${esc(p.fieldLabel)}</span><span class="bulk-before">${esc(formatBulkValue(p.conflict?.current??p.beforeValue))}</span><span class="bulk-after">${esc(formatBulkValue(p.afterValue))}</span><span>${p.conflict?"Conflit":p.decision==="ignored"?"Exclue":"À appliquer"}</span>${p.conflict?`<small>Analyse : ${esc(formatBulkValue(p.beforeValue))} · Actuel : ${esc(formatBulkValue(p.conflict.current))} · Proposé : ${esc(formatBulkValue(p.afterValue))}</small>`:""}</article>`).join("")||`<div class="agent-empty">Aucune proposition ne correspond à cette recherche.</div>`}</div><div class="validation-notice"><strong>Validation obligatoire</strong><p>Les propositions exclues ou en conflit ne seront pas appliquées.</p><button class="primary-btn" data-final-bulk-validate ${counts.included?"":"disabled"}>Valider et appliquer ${counts.included} modification${counts.included>1?"s":""}</button><button class="ghost-btn" data-abandon>Abandonner le brouillon</button></div></section>`;
  }
  function formatBulkValue(value){return value===null||value===undefined||value===""?"—":Array.isArray(value)?value.join(", "):String(value);}
  function bindBulkProposalActions(root,session){
    root.querySelector("[data-bulk-search]")?.addEventListener("input",event=>{session.proposalSearch=event.target.value;save();renderAgents();const next=document.querySelector("[data-bulk-search]");next?.focus();next?.setSelectionRange?.(next.value.length,next.value.length);});
    root.querySelectorAll("[data-bulk-proposal]").forEach(input=>input.onchange=()=>{const proposal=session.proposals.find(p=>p.id===input.dataset.bulkProposal);proposal.decision=input.checked?"validated":"ignored";session.updatedAt=new Date().toISOString();save();renderAgents();});
    root.querySelector("[data-final-bulk-validate]")?.addEventListener("click",event=>requestBulkValidation(session,event.currentTarget));
    root.querySelector("[data-abandon]")?.addEventListener("click",()=>{if(confirm("Abandonner ce brouillon ? Aucune donnée active ne sera modifiée.")){session.status="Abandonné";session.updatedAt=new Date().toISOString();save();screen="home";renderAgents();}});
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
  function requestBulkValidation(session,trigger){
    if(session.status==="Validé"){setOperationMessage("Ce brouillon a déjà été appliqué. Aucune seconde modification n’a été lancée.","info");renderAgents();return;}
    refreshBulkConflicts(session,currentAuditItems());const selected=session.proposals.filter(p=>p.decision==="validated"&&p.valid&&!p.conflict);
    if(!selected.length){save();setOperationMessage("Aucune proposition valide n’est incluse.","error");renderAgents();return;}
    const uniqueIds=new Set(selected.map(p=>p.itemId));if(uniqueIds.size!==selected.length||selected.some(p=>!bulkProposalIsSafe(p))){setOperationMessage("La validation est bloquée : une proposition contient un champ ou une valeur non autorisée.","error");renderAgents();return;}
    openDeleteConfirmation({title:`Appliquer ${selected.length} modification${selected.length>1?"s":""} ?`,message:`${selected.length} article${selected.length>1?"s seront modifiés":" sera modifié"}. Vérifiez l’aperçu avant de continuer. Cette action sera enregistrée dans l’Historique.`,confirmText:"Appliquer les modifications",trigger,onConfirm:()=>applyBulkSession(session)});
  }
  function bulkProposalIsSafe(proposal){const meta=ExadexAgentsCore.BULK_FIELDS[proposal.field],requiredTextFields=new Set(["name","category","unit"]);if(!proposal.itemId||!meta||proposal.field==="id")return false;if(meta.type==="number"&&!Number.isFinite(Number(proposal.afterValue)))return false;if(meta.type==="array"&&!Array.isArray(proposal.afterValue))return false;if(requiredTextFields.has(proposal.field)&&!String(proposal.afterValue||"").trim())return false;return true;}
  function refreshBulkConflicts(session,latestItems){
    (session.proposals||[]).forEach(proposal=>{if(proposal.decision!=="validated")return;const item=(latestItems||[]).find(row=>row.id===proposal.itemId),conflict=ExadexAgentsCore.detectBulkConflict(proposal,item);proposal.conflict=conflict.conflict?conflict:null;});return session;
  }
  function proposalOutcome(proposal,appliedIds){return appliedIds.has(proposal.id)?"applied":proposal.conflict?"conflict":proposal.decision==="ignored"?"excluded":"not_applied";}
  function finalSessionResults(session,appliedProposals){
    const appliedIds=new Set(appliedProposals.map(row=>row.id));
    return(session.proposals||[]).map(proposal=>({proposalId:proposal.id,itemId:proposal.itemId,itemName:proposal.itemName||"",field:proposal.field||"",fieldLabel:proposal.fieldLabel||"",beforeValue:ExadexAgentsCore.clone(proposal.beforeValue),afterValue:ExadexAgentsCore.clone(proposal.afterValue),result:proposalOutcome(proposal,appliedIds)}));
  }
  function appliedSessionChanges(proposals,isPhysical=false){
    return proposals.map(proposal=>{
      const operation=proposal.operation||{};
      let field=proposal.field||(proposal.action==="item_location_recount"?"location":"quantity");
      let fieldLabel=proposal.fieldLabel||(proposal.action==="item_location_recount"?"Localisation":"Stock");
      let beforeValue=proposal.beforeValue,afterValue=proposal.afterValue,delta=null;
      if(isPhysical&&operation.type==="physical_stock_recount"){
        field="quantity";fieldLabel="Stock";afterValue=operation.quantity;
        if(Number.isFinite(Number(beforeValue))&&Number.isFinite(Number(afterValue)))delta=Number(afterValue)-Number(beforeValue);
      }else if(isPhysical&&operation.type==="item_location_recount"){
        field="location";fieldLabel="Localisation";beforeValue=proposal.conflictBasis?.location??beforeValue;afterValue=operation.toLocation;
      }
      return{proposalId:proposal.id,itemId:proposal.itemId,itemName:proposal.itemName||"",field,fieldLabel,beforeValue:ExadexAgentsCore.clone(beforeValue),afterValue:ExadexAgentsCore.clone(afterValue),delta};
    });
  }
  async function applyBulkSession(session){
    if(session.status==="Validé"){setOperationMessage("Ce brouillon a déjà été appliqué.","info");renderAgents();return;}
    const inventoryAgent=window.ExadexInventoryAgent;if(!inventoryAgent?.applyBulkChanges){setOperationMessage("Le mécanisme de sauvegarde de l’Inventaire n’est pas disponible.","error");renderAgents();return;}
    const selected=session.proposals.filter(p=>p.decision==="validated"&&p.valid&&!p.conflict),operationId=`bulk-session-${session.id}`;
    try{
      const result=await inventoryAgent.applyBulkChanges({operationId,sessionId:session.id,sessionName:session.name,user:window.currentName||session.author||"",proposals:selected.map(proposal=>ExadexAgentsCore.clone(proposal))});
      if(result.duplicate){session.status="Validé";session.updatedAt=new Date().toISOString();session.report=session.report||{applied:0,ignored:session.proposals.filter(p=>p.decision==="ignored").length,conflicts:0,errors:0,at:session.updatedAt,user:window.currentName||session.author||""};save();setOperationMessage("Ce brouillon avait déjà été appliqué. Aucune modification supplémentaire n’a été effectuée.","info");screen="home";renderAgents();return;}
      session.status="Validé";session.updatedAt=new Date().toISOString();session.report={applied:result.applied,ignored:session.proposals.filter(p=>p.decision==="ignored").length,conflicts:session.proposals.filter(p=>p.conflict).length||result.conflicts||0,errors:result.errors||0,at:session.updatedAt,user:window.currentName||session.author||"",changes:appliedSessionChanges(selected),results:finalSessionResults(session,selected)};save();setOperationMessage(`${result.applied} modification${result.applied>1?"s":""} appliquée${result.applied>1?"s":""} · ${result.conflicts||0} conflit · ${result.errors||0} erreur`,"success");screen="home";renderAgents();
    }catch(error){session.status="À valider";if(Array.isArray(error?.conflicts))error.conflicts.forEach(row=>{const proposal=session.proposals.find(p=>p.itemId===row.itemId);if(proposal)proposal.conflict={conflict:true,reason:row.reason};});else refreshBulkConflicts(session,currentAuditItems());const conflictCount=session.proposals.filter(p=>p.conflict).length;session.report={applied:0,ignored:session.proposals.filter(p=>p.decision==="ignored").length,conflicts:conflictCount,errors:conflictCount?0:1,at:new Date().toISOString(),user:window.currentName||session.author||""};save();console.error("Agent bulk save failed:",{code:String(error?.message||"UNKNOWN").slice(0,120),sessionId:session.id,proposalCount:selected.length});setOperationMessage(conflictCount?`${conflictCount} conflit${conflictCount>1?"s":""} détecté${conflictCount>1?"s":""}. Aucune modification n’a été appliquée.`:"Échec de la sauvegarde : aucune modification n’a été appliquée. Consultez la console pour le diagnostic technique.","error");renderAgents();}
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
      session.status="Validé"; session.updatedAt=new Date().toISOString(); session.report={applied:selected.length, ignored:session.proposals.filter(p=>p.decision==="ignored").length, conflicts:0, errors:0, at:session.updatedAt, user:window.currentName||session.author||"", changes:appliedSessionChanges(selected,true), results:finalSessionResults(session,selected)}; save(); if(typeof window.applySharedState==="function") window.applySharedState(result.data); screen="home"; renderAgents(); alert("Les modifications validées ont été appliquées et historisées.");
    } catch(error) { session.status="À vérifier"; save(); alert(/conflict|409/i.test(error.message) ? "Conflit détecté : aucune ligne n’a été appliquée. Rechargez ou réanalysez les propositions." : `Échec de la sauvegarde : ${error.message}`); }
  }
  function bind(root) {
    root.querySelectorAll("[data-agent-action]").forEach(btn => btn.onclick = () => { if(btn.dataset.agentAction==="home"){screen="home";selectedAlertIds.clear();newSessionMode="";} if(btn.dataset.agentAction==="audit") screen="audit-config"; if(btn.dataset.agentAction==="physical"){screen="session";activeSessionId=null;newSessionMode="";} renderAgents(); });
    root.querySelectorAll("[data-open-audit]").forEach(btn => btn.onclick=()=>{activeAuditId=btn.dataset.openAudit;selectedAlertIds.clear();expandedAuditGroups.set(activeAuditId,new Set());screen="audit-report";renderAgents();});
    root.querySelectorAll("[data-open-session]").forEach(btn => btn.onclick=()=>{activeSessionId=btn.dataset.openSession;screen="session";renderAgents();});
    root.querySelectorAll("[data-delete-audit]").forEach(btn=>btn.onclick=event=>{event.stopPropagation();requestAuditDeletion([btn.dataset.deleteAudit],btn);});
    root.querySelectorAll("[data-delete-session]").forEach(btn=>btn.onclick=event=>{event.stopPropagation();requestSessionDeletion(btn.dataset.deleteSession,btn);});
  }
  window.renderAgents = renderAgents;
  window.ExadexAgentsUI = { renderAgents, storageKeys: Storage.KEYS, comparisonFields, renderComparisonValues, deleteAuditReports, requestSessionDeletion, auditTypeLabel, auditCounts, remainingAlerts, remainingLabel, _load: load, _save: save };
})();
