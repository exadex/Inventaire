// Synchronisation avec GitHub (shared_data.json) et sauvegardes.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.


function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function readCachedSharedState() {
  const cached = load("exadex_shared_state_cache", null);
  if (!cached || typeof cached !== "object") return null;
  return cached.data && typeof cached.data === "object" ? cached.data : cached;
}

function cacheSharedState() {
  localStorage.setItem("exadex_shared_state_cache", JSON.stringify(sharedState));
}

function createBootstrapSharedState() {
  const legacyWebItems = migrateItems(
    load("exadex_web_items", load("adipovault_web_items", []))
  ).map(item => ({
    ...item,
    source: "web"
  }));

  const legacySeedOverrides = load(
    "exadex_seed_overrides",
    load("adipovault_seed_overrides", {})
  ) || {};

  const legacyDeletedSeedIds = load(
    "exadex_deleted_seed_ids",
    load("adipovault_deleted_seed_ids", [])
  ) || [];

  const migratedSeedItems = seedBaseItems
    .filter(item => !legacyDeletedSeedIds.includes(item.id))
    .map(item => ({
      ...item,
      ...(legacySeedOverrides[item.id] || {}),
      source: "seed"
    }));

  const seedIds = new Set(migratedSeedItems.map(item => item.id));
  const migratedInventoryItems = [
    ...migratedSeedItems,
    ...legacyWebItems.filter(item => !seedIds.has(item.id))
  ];

  return {
    version: 1,
    inventoryItems: migrateItems(migratedInventoryItems),
    experiments: migrateExperiments(load("exadex_experiments", [])),
    orders: Array.isArray(load("exadex_orders", [])) ? load("exadex_orders", []) : [],
    clientSamples: migrateClientSamples(load("exadex_client_samples", [])),
    clients: migrateClients([], migrateClientSamples(load("exadex_client_samples", []))),
    supplierContacts: migrateSupplierContacts([], { includeDefaults: true }),
    history: Array.isArray(load("exadex_history", load("adipovault_history", [])))
      ? load("exadex_history", load("adipovault_history", []))
      : [],
    updatedAt: new Date().toISOString()
  };
}

function createSharedState(rawState = null, options = {}) {
  const { includeBootstrap = false } = options;
  const source = rawState && typeof rawState === "object" ? rawState : {};
  const bootstrap = includeBootstrap ? createBootstrapSharedState() : null;

  const normalized = {
    version: 2,
    locationCatalog: normalizeLocationCatalog(source.locationCatalog || bootstrap?.locationCatalog),
    inventoryItems: migrateItems(
      Array.isArray(source.inventoryItems)
        ? source.inventoryItems
        : bootstrap?.inventoryItems || []
    ),
    experiments: migrateExperiments(Array.isArray(source.experiments) ? source.experiments : bootstrap?.experiments || []),
    orders: Array.isArray(source.orders)
      ? source.orders
      : bootstrap?.orders || [],
    clientSamples: migrateClientSamples(
      Array.isArray(source.clientSamples)
        ? source.clientSamples
        : bootstrap?.clientSamples || []
    ),
    clients: migrateClients(
      Array.isArray(source.clients) ? source.clients : bootstrap?.clients || [],
      Array.isArray(source.clientSamples) ? source.clientSamples : bootstrap?.clientSamples || []
    ),
    supplierContacts: migrateSupplierContacts(Array.isArray(source.supplierContacts) ? source.supplierContacts : bootstrap?.supplierContacts || [], { includeDefaults: !Array.isArray(source.supplierContacts) && !bootstrap }),
    history: Array.isArray(source.history)
      ? source.history
      : bootstrap?.history || [],
    stockMovements: Array.isArray(source.stockMovements) ? source.stockMovements : [],
    sourcingPatients: Array.isArray(source.sourcingPatients) ? source.sourcingPatients : bootstrap?.sourcingPatients || [],
    stockOperations: Array.isArray(source.stockOperations) ? source.stockOperations : [],
    agentOperations: Array.isArray(source.agentOperations) ? source.agentOperations : [],
    customProtocolTemplates: Array.isArray(source.customProtocolTemplates) ? source.customProtocolTemplates : bootstrap?.customProtocolTemplates || [],
    updatedAt: source.updatedAt || bootstrap?.updatedAt || ""
  };
  return repairHistoricalZeroContainers(normalized);
}

function repairHistoricalZeroContainers(state) {
  if (!window.StockTracking?.repairZeroRemainingContainers) return state;
  const movements=[...(state.stockMovements||[])],items=state.inventoryItems.map(item=>{const repair=StockTracking.repairZeroRemainingContainers(item,movements);if(repair.events.length)movements.push(...repair.events);return repair.item});
  return {...state,inventoryItems:items,stockMovements:movements};
}

function hasSharedDataPayload(data) {
  if (!data || typeof data !== "object") return false;

  return [
    data.inventoryItems,
    data.orders,
    data.experiments,
    data.clientSamples,
    data.clients,
    data.supplierContacts,
    data.history
    ,data.stockMovements
    ,data.sourcingPatients
  ].some(value => Array.isArray(value)) || Boolean(data.updatedAt);
}

function needsHierarchyMigration(data) {
  return Number(data?.version || 0) < 2 || !data?.locationCatalog;
}

function applySharedState(incomingState) {
  if (!incomingState || typeof incomingState !== "object") return;

  sharedState = createSharedState(incomingState, { includeBootstrap: false });
  syncRuntimeStateFromShared();
  cacheSharedState();
  render();
}

// Expose un contexte en lecture seule aux agents sans leur transmettre de fonction de sauvegarde.
function buildAgentBulkMutation(sourceState, request) {
  const state = createSharedState(sourceState, { includeBootstrap: false });
  const proposals = Array.isArray(request?.proposals) ? request.proposals : [];
  const operationId = String(request?.operationId || "");
  if (!operationId || !proposals.length) throw new Error("BULK_INVALID_REQUEST");
  state.agentOperations = Array.isArray(state.agentOperations) ? state.agentOperations : [];
  if (state.agentOperations.some(entry => entry.operationId === operationId)) return { state, duplicate: true, applied: 0 };
  const ids = proposals.map(row => String(row?.itemId || ""));
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) throw new Error("BULK_INVALID_ITEM_IDS");
  const allowed = new Set(Object.keys(window.ExadexAgentsCore?.BULK_FIELDS || {}));
  if (proposals.some(row => !allowed.has(row.field) || row.field === "id" || row.decision !== "validated" || !row.valid)) throw new Error("BULK_INVALID_PROPOSAL");
  if (proposals.some(row => {
    const meta = window.ExadexAgentsCore.BULK_FIELDS[row.field];
    if (meta.type === "number" && !Number.isFinite(Number(row.afterValue))) return true;
    if (meta.type === "array" && !Array.isArray(row.afterValue)) return true;
    return ["name", "category", "unit"].includes(row.field) && !String(row.afterValue || "").trim();
  })) throw new Error("BULK_INVALID_VALUE");
  const conflicts = [];
  proposals.forEach(proposal => {
    const item = state.inventoryItems.find(row => row.id === proposal.itemId);
    const conflict = window.ExadexAgentsCore.detectBulkConflict(proposal, item);
    if (conflict.conflict) conflicts.push({ itemId: proposal.itemId, reason: conflict.reason });
  });
  if (conflicts.length) {
    const error = new Error("BULK_CONFLICT");
    error.conflicts = conflicts;
    throw error;
  }
  const now = new Date().toISOString();
  const user = String(request.user || currentName || "");
  const entries = [];
  proposals.forEach(proposal => {
    const item = state.inventoryItems.find(row => row.id === proposal.itemId);
    const before = window.ExadexAgentsCore.clone(window.ExadexAgentsCore.bulkValue(item, proposal.field));
    window.ExadexAgentsCore.applyBulkValue(item, proposal.field, proposal.afterValue);
    if (proposal.field === "supplier") {
      if (proposal.supplierContactId) item.supplierContactId = proposal.supplierContactId;
      else delete item.supplierContactId;
    }
    item.updatedAt = now;
    item.version = Number(item.version || 0) + 1;
    entries.push({
      date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(now)),
      user,
      action: "Modification massive par Agent",
      detail: `${request.sessionName} · ${item.name} · ${proposal.fieldLabel} : ${before ?? "—"} → ${proposal.afterValue ?? "—"}`,
      sessionId: request.sessionId,
      itemId: item.id,
      field: proposal.field,
      before,
      after: window.ExadexAgentsCore.clone(proposal.afterValue)
    });
  });
  state.history.unshift(...entries, {
    date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(now)),
    user,
    action: "Modification massive par Agent",
    detail: `${proposals.length} modification${proposals.length > 1 ? "s" : ""} appliquée${proposals.length > 1 ? "s" : ""} · ${request.sessionName}`,
    sessionId: request.sessionId
  });
  state.agentOperations.push({ operationId, sessionId: request.sessionId, applied: proposals.length, at: now });
  state.updatedAt = now;
  return { state, duplicate: false, applied: proposals.length };
}

async function refreshSharedStateFromGithub() {
  try {
    const storage = window.ExadexGithubStorage;
    if (!storage) return;
    if (sharedDataIsSaving || sharedDataHasUnsavedChanges) return;

    const result = await storage.loadSharedData();
    if (!hasSharedDataPayload(result?.data)) return;

    sharedDataMode = result.mode;
    sharedDataSha = result.sha;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
  } catch (error) {
    sharedDataLastError = error.message || String(error);
    console.error("Shared refresh failed:", error);
    renderAlerts();
  }
}

function syncRuntimeStateFromShared() {
  sharedState.locationCatalog = normalizeLocationCatalog(sharedState.locationCatalog);
  sharedState.inventoryItems = migrateItems(sharedState.inventoryItems);
  sharedState.experiments = migrateExperiments(sharedState.experiments);
  sharedState.orders = Array.isArray(sharedState.orders) ? sharedState.orders : [];
  sharedState.clientSamples = migrateClientSamples(sharedState.clientSamples);
  sharedState.clients = migrateClients(sharedState.clients, sharedState.clientSamples);
  sharedState.supplierContacts = migrateSupplierContacts(sharedState.supplierContacts);
  sharedState.clientSamples = hydrateClientIdentityForSamples(sharedState.clientSamples, sharedState.clients);
  sharedState.history = Array.isArray(sharedState.history) ? sharedState.history : [];
  sharedState.stockMovements = Array.isArray(sharedState.stockMovements) ? sharedState.stockMovements : [];
  sharedState.sourcingPatients = Array.isArray(sharedState.sourcingPatients) ? sharedState.sourcingPatients : [];
  sharedState.agentOperations = Array.isArray(sharedState.agentOperations) ? sharedState.agentOperations : [];
  sharedState.customProtocolTemplates = Array.isArray(sharedState.customProtocolTemplates) ? sharedState.customProtocolTemplates : [];

  items = buildItems();
  orders = sharedState.orders;
  experiments = sharedState.experiments;
  clientSamples = sharedState.clientSamples;
  clients = sharedState.clients;
  supplierContacts = sharedState.supplierContacts;
  history = sharedState.history;
  stockMovements = sharedState.stockMovements;
  sourcingPatients = sharedState.sourcingPatients;
  customProtocolTemplates = sharedState.customProtocolTemplates;
  protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];
}

function syncSharedStateFromRuntime() {
  sharedState.locationCatalog = normalizeLocationCatalog(sharedState.locationCatalog);
  sharedState.inventoryItems = migrateItems(items);
  sharedState.experiments = migrateExperiments(experiments);
  sharedState.orders = Array.isArray(orders) ? orders : [];
  sharedState.clientSamples = migrateClientSamples(clientSamples);
  sharedState.clients = migrateClients(clients, sharedState.clientSamples);
  sharedState.supplierContacts = migrateSupplierContacts(supplierContacts);
  sharedState.clientSamples = hydrateClientIdentityForSamples(sharedState.clientSamples, sharedState.clients);
  sharedState.history = Array.isArray(history) ? history : [];
  sharedState.stockMovements = Array.isArray(stockMovements) ? stockMovements : [];
  sharedState.sourcingPatients = Array.isArray(sourcingPatients) ? sourcingPatients : [];
  sharedState.agentOperations = Array.isArray(sharedState.agentOperations) ? sharedState.agentOperations : [];
  sharedState.updatedAt = new Date().toISOString();
}

async function hydrateSharedData() {
  try {
    const storage = window.ExadexGithubStorage;

    if (!storage) {
      sharedDataMode = "cache-only";
      syncRuntimeStateFromShared();
      cacheSharedState();
      return;
    }

    const recovery = await window.ExadexRecoveryStorage?.load?.().catch(() => null);
    const result = await storage.loadSharedData({ cache: !recovery?.unsynced });
    sharedDataMode = result.mode;
    sharedDataSha = result.sha;
    sharedDataRemoteReady = true;

    if (recovery?.unsynced && hasSharedDataPayload(recovery.data)) {
      sharedDataRecovery = recovery;
      sharedDataSyncStatus = "recovery";
      sharedDataLastError = "Des modifications locales non synchronisées ont été retrouvées.";
      sharedState = createSharedState(recovery.data, { includeBootstrap: false });
      syncRuntimeStateFromShared();
      initializeSharedSaveCoordinator(recovery.baseData || result.data, recovery.lastKnownSha || result.sha);
      if (!app.classList.contains("hidden")) render();
      return;
    }

    if (hasSharedDataPayload(result.data)) {
      sharedState = createSharedState(result.data, { includeBootstrap: false });
      syncRuntimeStateFromShared();
      cacheSharedState();
      sharedDataLastError = "";
      sharedDataSyncStatus = "saved";
      initializeSharedSaveCoordinator(result.data, result.sha);

      if (!app.classList.contains("hidden")) {
        render();
      }
    } else if (!result.sha) {
      // Aucun fichier distant (404) : premier démarrage, on amorce avec les données de base.
      sharedState = createSharedState(null, { includeBootstrap: true });
      syncRuntimeStateFromShared();
      cacheSharedState();

      if (result.mode === "github-write") {
        initializeSharedSaveCoordinator(result.data, result.sha);
        scheduleSharedSave({ allowInitialSeed: true });
      }
    } else {
      // Le fichier distant existe (sha présent) mais son contenu n'a pas pu être lu
      // correctement : ne jamais écraser les données partagées avec un état vide,
      // on retombe sur le cache local sans déclencher de sauvegarde.
      sharedDataMode = "cache-fallback";
      sharedDataLastError = "Impossible de lire les données partagées reçues de GitHub (contenu vide ou illisible).";
      sharedDataRemoteReady = false;
      console.warn("Shared data read returned no usable payload despite an existing remote file; keeping local cache to avoid overwriting it.", result);
      syncRuntimeStateFromShared();
      cacheSharedState();
      renderAlerts();
    }
  } catch (error) {
    sharedDataMode = "cache-fallback";
    sharedDataLastError = error.message || String(error);
    sharedDataRemoteReady = false;
    console.warn("Shared storage unavailable; using local cache.", error);
    syncRuntimeStateFromShared();
    cacheSharedState();
    renderAlerts();
  }
}

function initializeSharedSaveCoordinator(baseData, initialSha) {
  const storage = window.ExadexGithubStorage;
  if (!storage || !window.ExadexSharedSync) return;
  sharedDataSaveCoordinator = window.ExadexSharedSync.createSaveCoordinator({
    initialBase: baseData,
    initialSha,
    save: (data, sha) => storage.saveSharedData(data, sha, { user: currentName }),
    loadRemote: () => storage.loadSharedData({ fresh: true, cache: false }),
    onStatus(status, error) {
      sharedDataSyncStatus = status;
      sharedDataIsSaving = status === "saving";
      if (status === "saving") sharedDataLastError = "";
      if (error) sharedDataLastError = error.message || String(error);
      renderAlerts();
    },
    async onSaved(result) {
      sharedDataSha = result.sha;
      sharedDataMode = "github-write";
      sharedDataLastError = "";
      sharedDataRemoteReady = true;
      sharedDataConflict = null;
      sharedDataHasUnsavedChanges = Boolean(result.pending);
      if (!result.pending) {
        await window.ExadexRecoveryStorage?.markSynced?.({ lastKnownSha: result.sha, lastGithubSavedAt: new Date().toISOString() }).catch(() => null);
      }
    },
    async onMerged(result) {
      sharedState = createSharedState(result.data, { includeBootstrap: false });
      syncRuntimeStateFromShared();
      cacheSharedState();
      render();
    },
    onConflict(conflict) {
      sharedDataConflict = conflict;
      sharedDataHasUnsavedChanges = true;
      sharedDataLastError = `${conflict.conflicts.length} conflit(s) précis nécessitent une résolution. Les données locales restent intactes.`;
    }
  });
}

function scheduleSharedSave(options = {}) {
  window.clearTimeout(sharedDataSaveTimer);
  sharedDataSaveTimer = window.setTimeout(async () => {
    try {
      const storage = window.ExadexGithubStorage;
      if (!storage) {
        throw new Error("GitHub storage helper is unavailable; changes are only cached locally.");
      }
      const config = storage.getConfig();
      if (!config.owner || !config.repo || !config.path) {
        throw new Error("GitHub storage is not configured; changes are only cached locally.");
      }
      if (!config.token) {
        throw new Error("GitHub token is missing; shared data is read-only and changes were not saved remotely.");
      }
      if (!sharedDataRemoteReady && !options.allowInitialSeed) {
        throw new Error("Remote shared data was not loaded, so saving is blocked to protect GitHub data.");
      }

      if (!sharedDataSaveCoordinator) initializeSharedSaveCoordinator(sharedState, sharedDataSha);
      await sharedDataSaveCoordinator.enqueue(sharedState);
    } catch (error) {
      sharedDataLastError = error.message || String(error);
      sharedDataHasUnsavedChanges = true;
      sharedDataSyncStatus = "error";
      console.warn("Shared storage save failed.", error);
    } finally {
      sharedDataIsSaving = false;
      renderAlerts();
    }
  }, 400);
}

async function flushPendingSharedDataBeforeAtomicOperation() {
  window.clearTimeout(sharedDataSaveTimer);
  if (!sharedDataHasUnsavedChanges && !sharedDataSaveCoordinator?.getState?.().pending) return;
  const storage=window.ExadexGithubStorage,config=storage?.getConfig?.();
  if(!storage?.saveSharedData||!config?.owner||!config?.repo||!config?.path||!config?.token)throw new Error("Les modifications de la fiche doivent être synchronisées sur GitHub avant de gérer le stock.");
  syncSharedStateFromRuntime();
  if(!sharedDataSaveCoordinator)initializeSharedSaveCoordinator(sharedState,sharedDataSha);
  await sharedDataSaveCoordinator.enqueue(sharedState);
  const coordinatorState=sharedDataSaveCoordinator.getState();
  if(coordinatorState.pending||sharedDataSyncStatus==="conflict"||sharedDataSyncStatus==="error")throw new Error(sharedDataLastError||"La fiche n’a pas pu être synchronisée avant l’opération de stock.");
  sharedDataSha=coordinatorState.sha;
  sharedDataHasUnsavedChanges=false;
  sharedDataRemoteReady=true;
  sharedDataLastError="";
}

// enregistre une copie en cache local et publie l'état partagé sur GitHub quand il est configuré
function persist(options = {}) {
  syncSharedStateFromRuntime();
  cacheSharedState();
  sharedDataHasUnsavedChanges = true;
  sharedDataSyncStatus = "unsynced";
  window.ExadexRecoveryStorage?.save?.({
    data: sharedState,
    baseData: sharedDataSaveCoordinator?.getState?.().base || null,
    lastKnownSha: sharedDataSha,
    user: currentName,
    sessionId: sessionStorage.getItem("exadex_session_id") || "browser-session",
    syncStatus: "unsynced"
  }).catch(error => console.warn("Local recovery copy failed.", error));

  if (!options.skipRemote) {
    scheduleSharedSave();
  }
}

function backupSummaryMarkup(summary = {}) {
  return [["Items",summary.inventoryItems],["Études clients",summary.clientSamples],["Localisations",summary.locations],["Expériences",summary.experiments],["Sourcing",summary.sourcingPatients],["Commandes",summary.orders],["Contacts",summary.contacts],["Historique",summary.history]]
    .map(([label,value])=>`<span><strong>${Number(value||0)}</strong> ${escapeHtml(label)}</span>`).join(" · ");
}

function backupDisplayTitle(name = "") {
  const match = String(name).match(/^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]} à ${match[4]}:${match[5]}` : String(name).replace(/\.json$/i, "");
}

function nextBackupExecutionLabel(now = new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
  const year=Number(parts.year),month=Number(parts.month),day=Number(parts.day),minutes=Number(parts.hour)*60+Number(parts.minute),today=Date.UTC(year,month-1,day),weekday=new Date(today).getUTCDay();
  let daysUntilMonday=(8-weekday)%7;if(daysUntilMonday===0&&minutes>=360)daysUntilMonday=7;
  const monday=today+daysUntilMonday*86400000;
  const monthly=day===1&&minutes<360?today:Date.UTC(year,month,1);
  const next=new Date(Math.min(monday,monthly));
  return `${String(next.getUTCDate()).padStart(2,"0")}/${String(next.getUTCMonth()+1).padStart(2,"0")}/${next.getUTCFullYear()} à 06:00`;
}

async function renderBackups(force = false) {
  const root=document.querySelector("#backupsRoot"),status=document.querySelector("#backupsStatus");
  if(!root||!status||(backupsLoaded&&!force))return;
  root.innerHTML=`<div class="backup-empty">Chargement des sauvegardes…</div>`;status.textContent="";status.classList.remove("error");
  try{
    const backups=await window.ExadexGithubStorage.listBackups();backupsLoaded=true;
    const lastError=localStorage.getItem("exadex_backup_last_error");
    if(lastError){status.textContent=`Dernière sauvegarde automatique incomplète : ${lastError}`;status.classList.add("error");}
    else status.textContent=`${backups.length} sauvegarde(s) disponible(s). Prochaine exécution planifiée le ${nextBackupExecutionLabel()}.`;
    root.innerHTML=backups.length?backups.map(entry=>`<article class="backup-card" data-backup-path="${escapeHtml(entry.path)}" data-backup-folder="${escapeHtml(entry.folder)}" data-backup-name="${escapeHtml(entry.name)}" data-backup-label="${escapeHtml(entry.label)}" role="button" tabindex="0" aria-expanded="false"><div class="backup-card-main"><div class="backup-card-title"><strong>${escapeHtml(backupDisplayTitle(entry.name))}</strong><span class="backup-type ${entry.folder==="inventory"?"backup-type-weekly":"backup-type-full"}">${escapeHtml(entry.label)}</span></div><small>${Math.max(1,Math.round(Number(entry.size||0)/1024))} Ko · cliquez sur la copie pour afficher son contenu</small><div class="backup-preview hidden" data-backup-preview></div></div><div class="backup-card-actions"><button class="ghost-btn compact-btn" type="button" data-export-backup="xlsx">Exporter Excel</button><button class="ghost-btn compact-btn" type="button" data-export-backup="json">Exporter JSON</button><button class="primary-btn compact-btn" type="button" data-restore-backup>Restaurer</button><button class="danger-btn compact-btn" type="button" data-delete-backup>Supprimer</button></div></article>`).join(""):`<div class="backup-empty"><strong>Aucune sauvegarde planifiée pour le moment.</strong><br>La première sera créée à la prochaine échéance, ou utilisez « Créer une copie complète ».</div>`;
    root.querySelectorAll(".backup-card").forEach(card=>{card.addEventListener("click",toggleBackupCard);card.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&!event.target.closest("button")){event.preventDefault();toggleBackupCard({currentTarget:card,target:card});}});});
    root.querySelectorAll("[data-restore-backup]").forEach(button=>button.addEventListener("click",openRestoreBackupDialog));
    root.querySelectorAll("[data-delete-backup]").forEach(button=>button.addEventListener("click",openDeleteBackupDialog));
    root.querySelectorAll("[data-export-backup]").forEach(button=>button.addEventListener("click",openBackupExportDialog));
  }catch(error){backupsLoaded=false;root.innerHTML=`<div class="backup-empty">Impossible de charger les sauvegardes.</div>`;status.textContent=error.message||String(error);status.classList.add("error");}
}

function openBackupExportDialog(event){
  const button=event.currentTarget,card=button.closest("[data-backup-path]"),dialog=document.querySelector("#exportBackupDialog");if(!card||!dialog)return;
  pendingBackupExport={button,format:button.dataset.exportBackup,entry:{path:card.dataset.backupPath,folder:card.dataset.backupFolder,name:card.dataset.backupName,label:card.dataset.backupLabel}};
  document.querySelector("#exportBackupTitle").textContent=`Exporter cette sauvegarde en ${pendingBackupExport.format==="json"?"JSON":"Excel"} ?`;
  document.querySelector("#exportBackupPassword").value="";document.querySelector("#exportBackupError").classList.add("hidden");dialog.showModal();document.querySelector("#exportBackupPassword").focus();
}

function closeBackupExportDialog(){document.querySelector("#exportBackupDialog")?.close();pendingBackupExport=null;}

async function confirmBackupExport(event){
  event.preventDefault();const errorBox=document.querySelector("#exportBackupError");
  if(document.querySelector("#exportBackupPassword").value!=="645443"){errorBox.textContent="Code administrateur incorrect.";errorBox.classList.remove("hidden");return;}
  const request=pendingBackupExport;if(!request)return;document.querySelector("#exportBackupDialog").close();pendingBackupExport=null;await exportSelectedBackup(request);
}

async function exportSelectedBackup(request){
  const {button,format,entry}=request,status=document.querySelector("#backupsStatus"),originalText=button.textContent;if(!window.ExadexBackupExport)return;
  button.disabled=true;button.textContent="Export…";status.classList.remove("error");status.textContent=`Préparation de l'export ${format==="json"?"JSON":"Excel"}…`;
  try{const backup=await window.ExadexGithubStorage.loadBackup(entry.path),result=format==="json"?await window.ExadexBackupExport.exportJson(backup,entry):await window.ExadexBackupExport.exportExcel(backup,entry);status.textContent=`Export créé : ${result.filename}`;}catch(error){status.textContent=error.message||String(error);status.classList.add("error");}finally{button.disabled=false;button.textContent=originalText;}
}

async function toggleBackupCard(event){
  const card=event.currentTarget.closest("[data-backup-path]"),preview=card?.querySelector("[data-backup-preview]");if(!card||!preview||event.target.closest("button"))return;
  if(!preview.classList.contains("hidden")){preview.classList.add("hidden");card.setAttribute("aria-expanded","false");return;}
  card.setAttribute("aria-expanded","true");
  preview.classList.remove("hidden");preview.textContent="Chargement…";
  try{const backup=await window.ExadexGithubStorage.loadBackup(card.dataset.backupPath),backupState=backup?.snapshot||(backup?.version&&Array.isArray(backup?.inventoryItems)?backup:null),summary=backup?.summary||window.ExadexGithubStorage.backupSummary(backupState||{inventoryItems:backup?.inventoryItems||[]}),inventoryOnly=backup?.type==="inventory"||card.dataset.backupPath.includes("/inventory/"),details=inventoryOnly?`<span><strong>${Number(summary.inventoryItems||0)}</strong> Items</span>`:backupSummaryMarkup(summary);preview.innerHTML=`${details}<br><small>Créée le ${escapeHtml(backup?.createdAt?new Date(backup.createdAt).toLocaleString("fr-FR"):"date du fichier")} par ${escapeHtml(backup?.createdBy||"utilisateur inventaire")}.</small>`;}catch(error){preview.textContent=error.message||String(error);}
}

function openRestoreBackupDialog(event){
  const card=event.currentTarget.closest("[data-backup-path]"),dialog=document.querySelector("#restoreBackupDialog");if(!card||!dialog)return;
  document.querySelector("#restoreBackupPath").value=card.dataset.backupPath;document.querySelector("#restoreBackupPassword").value="";document.querySelector("#restoreBackupDescription").textContent=`Une copie complète de l'état actuel sera créée avant de restaurer ${card.dataset.backupPath}.`;document.querySelector("#restoreBackupError").classList.add("hidden");dialog.showModal();document.querySelector("#restoreBackupPassword").focus();
}

function openDeleteBackupDialog(event){
  const card=event.currentTarget.closest("[data-backup-path]"),dialog=document.querySelector("#deleteBackupDialog");if(!card||!dialog)return;
  document.querySelector("#deleteBackupPath").value=card.dataset.backupPath;document.querySelector("#deleteBackupPassword").value="";document.querySelector("#deleteBackupError").classList.add("hidden");dialog.showModal();document.querySelector("#deleteBackupPassword").focus();
}

async function deleteSelectedBackup(event){
  event.preventDefault();const password=document.querySelector("#deleteBackupPassword").value,path=document.querySelector("#deleteBackupPath").value,errorBox=document.querySelector("#deleteBackupError"),button=document.querySelector("#confirmDeleteBackupBtn");errorBox.classList.add("hidden");
  if(password!=="645443"){errorBox.textContent="Mot de passe incorrect.";errorBox.classList.remove("hidden");return;}
  button.disabled=true;button.textContent="Suppression…";
  try{await window.ExadexGithubStorage.deleteBackup(path);document.querySelector("#deleteBackupDialog").close();backupsLoaded=false;await renderBackups(true);document.querySelector("#backupsStatus").textContent="Sauvegarde supprimée.";}catch(error){errorBox.textContent=error.message||String(error);errorBox.classList.remove("hidden");}finally{button.disabled=false;button.textContent="Supprimer";}
}

async function restoreSelectedBackup(event){
  event.preventDefault();const password=document.querySelector("#restoreBackupPassword").value,path=document.querySelector("#restoreBackupPath").value,errorBox=document.querySelector("#restoreBackupError"),button=document.querySelector("#confirmRestoreBackupBtn");errorBox.classList.add("hidden");
  if(password!=="645443"){errorBox.textContent="Mot de passe incorrect.";errorBox.classList.remove("hidden");return;}
  button.disabled=true;button.textContent="Restauration…";
  try{const storage=window.ExadexGithubStorage,[backup,latest]=await Promise.all([storage.loadBackup(path),storage.loadSharedData({fresh:true,cache:false})]);if(!backup||!latest?.data)throw new Error("La sauvegarde ou l'état actuel est illisible.");await storage.createNamedFullBackup(latest.data,currentName,"pre-restore");const inventoryOnly=backup.type==="inventory"||path.includes("/inventory/"),restored=inventoryOnly?{...latest.data,inventoryItems:backup.inventoryItems||[]}:(backup.snapshot||backup);if(!restored||!Array.isArray(restored.inventoryItems))throw new Error("Cette sauvegarde n'est pas valide.");const sha=await storage.saveSharedData(restored,latest.sha,{allowCatastrophic:true,skipScheduledBackups:true,user:currentName});sharedDataSha=sha;sharedDataMode="github-write";sharedDataSyncStatus="saved";sharedDataHasUnsavedChanges=false;await window.ExadexRecoveryStorage?.markSynced?.({lastKnownSha:sha,restoredAt:new Date().toISOString()}).catch(()=>null);applySharedState(restored);initializeSharedSaveCoordinator(restored,sha);document.querySelector("#restoreBackupDialog").close();backupsLoaded=false;await renderBackups(true);document.querySelector("#backupsStatus").textContent="Restauration terminée et confirmée sur GitHub.";}catch(error){errorBox.textContent=error.message||String(error);errorBox.classList.remove("hidden");}finally{button.disabled=false;button.textContent="Restaurer";}
}

async function createManualFullBackup(){
  const button=document.querySelector("#createFullBackupBtn"),status=document.querySelector("#backupsStatus");button.disabled=true;status.classList.remove("error");status.textContent="Création de la sauvegarde complète…";
  try{const latest=await window.ExadexGithubStorage.loadSharedData({fresh:true,cache:false});await window.ExadexGithubStorage.createNamedFullBackup(latest.data,currentName,"manual");backupsLoaded=false;await renderBackups(true);status.textContent="Sauvegarde complète créée.";}catch(error){status.textContent=error.message||String(error);status.classList.add("error");}finally{button.disabled=false;}
}

function updateUserIdentity() {
  const userIcon = userIcons[currentName] || "👤";
  currentUser.textContent = userIcon;
  sidebarUser.textContent = userIcon;
  currentUserName.textContent = currentName;
  sidebarUserName.textContent = currentName;
}
