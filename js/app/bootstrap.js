// Démarrage de l'application. Ce fichier est chargé EN DERNIER : c'est ici que les
// données sont initialisées et que tous les listeners sont enregistrés, une fois que
// toutes les fonctions existent déjà.

// L'ordre de ces initialisations est important : sharedState doit exister avant items,
// et items avant le reste (voir buildItems dans state.js).
seedBaseItems = migrateItems(seedItems).map(item => ({
  ...item,
  source: "seed"
}));
sharedState = createSharedState(readCachedSharedState(), { includeBootstrap: false });
items = buildItems();
orders = Array.isArray(sharedState.orders) ? sharedState.orders : [];
experiments = migrateExperiments(sharedState.experiments);
history = Array.isArray(sharedState.history) ? sharedState.history : [];
stockMovements = Array.isArray(sharedState.stockMovements) ? sharedState.stockMovements : [];
sourcingPatients = Array.isArray(sharedState.sourcingPatients) ? sharedState.sourcingPatients : [];
clientSamples = migrateClientSamples(sharedState.clientSamples);
clients = migrateClients(sharedState.clients, clientSamples);
supplierContacts = migrateSupplierContacts(sharedState.supplierContacts);
customProtocolTemplates = Array.isArray(sharedState.customProtocolTemplates) ? sharedState.customProtocolTemplates : [];
protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];
sharedDataReady = hydrateSharedData();

renderCategoryOptions();
renderLocationOptions();
renderSampleOptions();
renderTemplateOptions();

// À partir d'ici, tous les listeners de l'application.
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentName = nameInput.value.trim();
  if (!currentName) return;

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  updateUserIdentity();

  authPanel?.classList.add("is-loading");
  loginLoader.classList.add("is-visible");

  const loginDelay = new Promise(resolve => setTimeout(resolve, 3000));

  Promise.allSettled([sharedDataReady, loginDelay]).then(() => {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
    cacheSharedState();
    render();

    loginLoader.classList.remove("is-visible");
    authPanel?.classList.remove("is-loading");
    submitBtn.disabled = false;
  });
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  cacheSharedState();
  app.classList.add("hidden");
  auth.classList.remove("hidden");
});

document.querySelector("#addItemBtn").addEventListener("click", () => {
  if (activeView === "samples") {
    openSampleModal();
    return;
  }

  openModal();
});
addClientStudyBtn?.addEventListener("click", () => openSampleModal());
document.querySelector("#saveItemBtn").addEventListener("click", saveItem);
document.querySelector("#deleteItemBtn").addEventListener("click", requestItemDeletion);
document.querySelector("#saveSampleBtn").addEventListener("click", saveSample);
document.querySelector("#deleteSampleBtn").addEventListener("click", requestSampleDeletionFromModal);
document.querySelector("#saveStockBtn").addEventListener("click", saveStockUpdate);
stockFields.stockAction?.addEventListener("change", syncSimpleStockActionFields);
document.querySelector("#migrationOpenCount")?.addEventListener("input", renderMigrationOpenRows);
stockMigrationForm?.addEventListener("input", updateStockMigrationComparison);
document.querySelector("#migrationReason")?.addEventListener("change", syncMigrationReasonFields);
stockMigrationForm?.addEventListener("submit", confirmStockMigration);
document.querySelector("#closeStockMigrationBtn")?.addEventListener("click", closeStockMigration);
document.querySelector("#cancelStockMigrationBtn")?.addEventListener("click", closeStockMigration);
stockMigrationDialog?.addEventListener("cancel", event => { event.preventDefault(); closeStockMigration(); });
fields.unit?.addEventListener("input", syncPackagingLevelZeroUnit);
trackingFields.detailedPackagingEnabled?.addEventListener("change", () => syncTrackingOptionCheckboxes("packaging"));
trackingFields.aliquotTrackingEnabled?.addEventListener("change", () => syncTrackingOptionCheckboxes("aliquots"));
document.querySelector("#addPackagingLevelBtn")?.addEventListener("click", () => { if (trackingFields.packagingLevels.children.length < 3) { trackingFields.packagingLevels.insertAdjacentHTML("beforeend", renderPackagingLevelRow({}, trackingFields.packagingLevels.children.length)); updatePackagingPreview(); } });
trackingFields.packagingLevels?.addEventListener("input", updatePackagingPreview);
trackingFields.trackingUnitKey?.addEventListener("change", updatePackagingPreview);
trackingFields.packagingLevels?.addEventListener("click", event => { if (event.target.closest("[data-remove-packaging]")) { event.target.closest(".packaging-level-row")?.remove(); updatePackagingPreview(); } });
document.querySelector("#addExperimentBtn").addEventListener("click", openExperimentModal);
document.querySelector("#saveExperimentBtn").addEventListener("click", saveExperiment);
document.querySelector("#confirmSaveProtocolTemplateBtn")?.addEventListener("click", confirmSaveProtocolTemplate);
document.querySelector("#manageProtocolTemplatesBtn")?.addEventListener("click", openManageProtocolTemplatesDialog);
document.querySelector("#confirmConsumeExperimentBtn")?.addEventListener("click", confirmConsumeExperiment);
document.querySelector("#consumeExperimentItems")?.addEventListener("input", event => {
  if (event.target.classList.contains("consume-experiment-item-quantity")) updateConsumeExperimentItemStates();
});
document.querySelector("#consumeExperimentItems")?.addEventListener("click", event => {
  const removeBtn = event.target.closest("[data-remove-consume-item]");
  if (removeBtn) removeBtn.closest(".consume-experiment-item")?.remove();
});

const deleteExperimentBtn = document.querySelector("#deleteExperimentBtn");
if (deleteExperimentBtn) {
  deleteExperimentBtn.addEventListener("click", requestExperimentDeletion);
}

dialog.addEventListener("close", () => {
  pendingOrderInventoryLink = null;
});

document.querySelector("#addExperimentInventoryItemBtn").addEventListener("click", () => addExperimentItemRow({ type:"inventory", inventoryItemId:"", quantity:"", unit:"" }));
document.querySelector("#addExperimentCustomItemBtn").addEventListener("click", () => addExperimentItemRow({ type:"custom", name:"", quantity:"", unit:"" }));
document.addEventListener("click", handleExperimentComboboxOutsideClick);
experimentItemsList.addEventListener("dragover", handleExperimentItemDragOver);
experimentItemsList.addEventListener("drop", event => event.preventDefault());
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
document.querySelector("#closeOrderDialogBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#cancelOrderBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#saveOrderDatesBtn")?.addEventListener("click", saveOrderDates);
orderFields.orderItemMode.addEventListener("change", toggleOrderModeFields);
orderFields.orderInventorySearch.addEventListener("input", handleOrderComboboxInput);
orderFields.orderInventorySearch.addEventListener("keydown", handleOrderComboboxKeydown);
orderFields.orderInventorySearch.addEventListener("focus", () => renderOrderItemOptions({ open: true }));
document.querySelector("#clearOrderInventoryItem")?.addEventListener("click", clearOrderInventorySelection);
document.addEventListener("click", handleOrderComboboxOutsideClick);
searchInput.addEventListener("input", renderInventory);
categoryFilter.addEventListener("change", renderInventory);
inventorySortSelect?.addEventListener("change", renderInventory);
inventoryUsageFilter?.addEventListener("change", () => {
  inventoryUsageFilterValue = inventoryUsageFilter.value;
  renderInventory();
});
document.querySelector("#usageProfileRoutine")?.addEventListener("click", () => toggleUsageProfile("routine"));
document.querySelector("#usageProfileBackup")?.addEventListener("click", () => toggleUsageProfile("backup"));
sampleSearchInput?.addEventListener("input", resetSamplePagination);
sampleTypeFilter?.addEventListener("change", resetSamplePagination);
sampleStudyTypeFilter?.addEventListener("change", resetSamplePagination);
sampleClientFilter?.addEventListener("change", resetSamplePagination);
sampleSortSelect?.addEventListener("change", resetSamplePagination);
locationSearchInput?.addEventListener("input", renderLocations);
locationSortSelect?.addEventListener("change", renderLocations);
historySearchInput?.addEventListener("input", resetHistoryPagination);
historyActionFilter?.addEventListener("change", resetHistoryPagination);
historyUserFilter?.addEventListener("change", resetHistoryPagination);
historyPeriodFilter?.addEventListener("change", () => {
  syncHistoryCustomDates();
  resetHistoryPagination();
});
historyDateStart?.addEventListener("change", resetHistoryPagination);
historyDateEnd?.addEventListener("change", resetHistoryPagination);
historyPageSizeSelect?.addEventListener("change", () => {
  historyPageSize = Number(historyPageSizeSelect.value) || 50;
  historyCurrentPage = 1;
  renderHistory();
});
document.querySelector("#resetHistoryFiltersBtn")?.addEventListener("click", resetHistoryFilters);
document.querySelector("#historyPreviousPage")?.addEventListener("click", () => {
  historyCurrentPage = Math.max(1, historyCurrentPage - 1);
  renderHistory();
});
document.querySelector("#historyNextPage")?.addEventListener("click", () => {
  historyCurrentPage += 1;
  renderHistory();
});
orderBoardSearchInput?.addEventListener("input", renderOrders);
orderBoardPriorityFilter?.addEventListener("change", renderOrders);
orderBoardRequesterFilter?.addEventListener("change", renderOrders);
orderBoardSortSelect?.addEventListener("change", renderOrders);
document.querySelector("#resetOrderBoardFiltersBtn")?.addEventListener("click", resetOrderBoardFilters);
document.addEventListener("keydown", handleQuantityStepKeydown);
cancelConfirmDeleteBtn?.addEventListener("click", closeDeleteConfirmation);
closeConfirmDeleteBtn?.addEventListener("click", closeDeleteConfirmation);
confirmDeleteBtn?.addEventListener("click", confirmDeleteAction);
confirmDeleteForm?.addEventListener("submit", event => event.preventDefault());
confirmDeleteDialog?.addEventListener("cancel", event => {
  event.preventDefault();
  if (!deleteConfirmationPending) closeDeleteConfirmation();
});
confirmDeleteDialog?.addEventListener("close", restoreDeleteConfirmationFocus);
sampleFields.sampleType.addEventListener("change", syncSampleFormVisibility);
sampleFields.sampleCategory.addEventListener("change", () => syncSampleMeasureLabel({ clearOnUnitChange: true }));
sampleFields.sampleArnQiazol.addEventListener("change", () => {
  if (!sampleFields.sampleArnQiazol.checked) sampleFields.sampleArnBead.checked = false;
  syncSampleMeasureLabel({ clearOnUnitChange: true });
});
sampleFields.sampleClientCode.addEventListener("input", updateClientCodeHint);
sampleFields.sampleStudyTypeClient.addEventListener("change", syncSampleStudyTypeUI);
sampleFields.sampleStudyTypeRd.addEventListener("change", syncSampleStudyTypeUI);
experimentSearchInput.addEventListener("input", renderExperiments);
experimentSortSelect?.addEventListener("change", renderExperiments);
resetExperimentSearchBtn?.addEventListener("click", () => { experimentSearchInput.value = ""; if (experimentSortSelect) experimentSortSelect.value = EXPERIMENT_DEFAULT_SORT; renderExperiments(); experimentSearchInput.focus(); });
document.querySelector("#addSourcingPatientBtn")?.addEventListener("click", () => openSourcingModal());
document.querySelector("#saveSourcingPatientBtn")?.addEventListener("click", saveSourcingPatient);
document.querySelector("#deleteSourcingPatientBtn")?.addEventListener("click", requestSourcingPatientDeletion);
sourcingSearchInput?.addEventListener("input", renderSourcing);
sourcingSortSelect?.addEventListener("change", renderSourcing);
sourcingCategoryFilter?.addEventListener("change", renderSourcing);
sourcingFields.patientHeight?.addEventListener("input", recalculatePatientBmi);
sourcingFields.patientWeight?.addEventListener("input", recalculatePatientBmi);
sourcingFields.patientBmi?.addEventListener("input", () => { sourcingFields.patientBmi.dataset.manual = "true"; });
sourcingFields.patientType?.addEventListener("change", syncSourcingComorbiditySection);
sourcingFields.patientReceptionDate?.addEventListener("input", syncSourcingPrefillDates);
SOURCING_YES_NO_FIELDS.forEach(field => wireSourcingExclusiveCheckboxGroup(field, SOURCING_YES_NO_OPTION_MAP));
SOURCING_STATUS_DATE_FIELDS.forEach(({ base }) => wireSourcingExclusiveCheckboxGroup(`${base}Status`, SOURCING_STATUS_OPTION_MAP));
experimentDialog.addEventListener("close", () => {
  experimentFields.experimentTemplate.disabled = false;
});
experimentFields.experimentTemplate.addEventListener("change", () => {
  const nextId=experimentFields.experimentTemplate.value;
  if(experimentDraftHasUserData()&&!window.confirm("Changer de protocole remplacera les informations et les items actuellement saisis. Continuer ?")){experimentFields.experimentTemplate.value=previousExperimentTemplateId;return;}
  previousExperimentTemplateId=nextId;
  const template = protocolTemplates.find(
    entry => entry.id === nextId
  );
  if(!template){activateFreeProtocol({clear:true});return;}
  syncExperimentTemplateNotesVisibility(false);
  syncRtQpcrConfigVisibility(template);
  setDefaultExperimentName(template, true);
  buildExperimentItemsFromTemplate();
});
experimentFields.experimentConditions.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentFields.experimentReplicates.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentItemsList.addEventListener("input", updateExperimentModalStock);
[
  "rtqpcrPartRT",
  "rtqpcrPartDilution",
  "rtqpcrPartQPCR",
  "rtqpcrSampleConditions",
  "rtqpcrSampleReplicates",
  "rtqpcrQpcrConditions",
  "rtqpcrPrimerCount",
  "rtqpcrQpcrReplicates",
  "rtqpcrDeadVolumeConditions"
].forEach((key) => {
  const field = experimentFields[key];
  if (!field) return;
  field.addEventListener("input", recalculateExperimentTemplateQuantities);
  field.addEventListener("change", recalculateExperimentTemplateQuantities);
});
experimentItemsList.addEventListener("change", (event) => {
  if (event.target.classList.contains("experiment-item-select")) {
    const row=event.target.closest(".experiment-item-row");
    if(!row.dataset.lineType)hydrateExperimentItemRow(row, event.target.value);
  }
  updateExperimentModalStock();
});

document.querySelectorAll(".chip").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));
    button.classList.add("active");
    statusFilter = button.dataset.status;
    renderInventory();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;

    selectedItemId = null;
    selectedSampleId = null;
    selectedExperimentId = null;
    selectedSourcingPatientId = null;
    selectedLocation = null;
    selectedRoomId = null;
    selectedLocationId = null;
    selectedSublocationId = null;
    locationScopeMode = "direct";
    selectedContactId = null;
    itemReturnContext = { view: activeView, experimentId: null };

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    document.querySelector(`#${activeView}View`)?.classList.add("active");

    controlBar?.classList.toggle("hidden", activeView !== "inventory");
    syncAppViewMode();
    renderAlerts();

    if (activeView === "inventory") {
      renderInventory();
    } else if (activeView === "experiments") {
      renderExperiments();
    } else if (activeView === "sourcing") {
      renderSourcing();
    } else if (activeView === "locations") {
      renderLocations();
    } else if (activeView === "orders") {
      renderOrders();
    } else if (activeView === "history") {
      renderHistory();
    } else if (activeView === "samples") {
      renderSamples();
    } else if (activeView === "contacts") {
      renderContacts();
    } else if (activeView === "agents") {
      renderAgents();
    } else if (activeView === "backups") {
      renderBackups();
    }
  });
});

document.querySelector("#createFullBackupBtn")?.addEventListener("click", createManualFullBackup);
document.querySelectorAll("[data-close-backup-restore]").forEach(button => button.addEventListener("click", () => document.querySelector("#restoreBackupDialog")?.close()));
document.querySelector("#restoreBackupForm")?.addEventListener("submit", restoreSelectedBackup);
document.querySelectorAll("[data-close-backup-delete]").forEach(button => button.addEventListener("click", () => document.querySelector("#deleteBackupDialog")?.close()));
document.querySelector("#deleteBackupForm")?.addEventListener("submit", deleteSelectedBackup);
document.querySelectorAll("[data-close-backup-export]").forEach(button => button.addEventListener("click", closeBackupExportDialog));
document.querySelector("#exportBackupForm")?.addEventListener("submit", confirmBackupExport);

// Listeners du dialogue de réception d'inventaire lors de la réception d'une commande
document.querySelector("#confirmReceiveInventoryBtn").addEventListener("click", confirmReceiveInventory);
document.querySelector("#closeReceiveInventoryDialogBtn").addEventListener("click", () => receiveInventoryDialog.close());
document.querySelector("#cancelReceiveInventoryBtn").addEventListener("click", () => receiveInventoryDialog.close());
document.querySelector("#contactForm")?.addEventListener("submit", saveContact);
document.querySelector("#closeContactDialogBtn")?.addEventListener("click",()=>document.querySelector("#contactDialog").close());
document.querySelector("#cancelContactBtn")?.addEventListener("click",()=>document.querySelector("#contactDialog").close());
fields.primarySupplier?.addEventListener("input",syncPrimarySupplierContact);
fields.primarySupplier?.addEventListener("blur",syncPrimarySupplierContact);

// Code d'initialisation qui se trouvait auparavant au milieu de script.js :
// APIs exposees aux agents et listeners des sections. Ordre d'origine conserve.
Object.defineProperties(window, {
  items: { configurable: true, get: () => JSON.parse(JSON.stringify(items)) },
  orders: { configurable: true, get: () => JSON.parse(JSON.stringify(orders)) },
  clientSamples: { configurable: true, get: () => JSON.parse(JSON.stringify(clientSamples)) },
  clients: { configurable: true, get: () => JSON.parse(JSON.stringify(clients)) },
  supplierContacts: { configurable: true, get: () => JSON.parse(JSON.stringify(supplierContacts)) },
  applicationHistory: { configurable: true, get: () => JSON.parse(JSON.stringify(history)) },
  applicationExperiments: { configurable: true, get: () => JSON.parse(JSON.stringify(experiments)) },
  experimentDialog: { configurable: true, get: () => document.querySelector("#experimentDialog") },
  inventoryLocationCatalog: { configurable: true, get: () => JSON.parse(JSON.stringify({ rooms: FIXED_INVENTORY_ROOMS, ...normalizeLocationCatalog(sharedState.locationCatalog) })) },
  applicationUsers: { configurable: true, get: () => Object.entries(userIcons).map(([name, emoji]) => ({ id: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "-"), name, emoji })) },
  inventoryLocations: { configurable: true, get: () => [...inventoryLocations] },
  inventoryCategories: { configurable: true, get: () => [...inventoryCategories] },
  currentName: { configurable: true, get: () => currentName }
});

window.ExadexAssistantNavigation = {
  item: id => openItemDetail(id, { view: "agents" }),
  clientProduct: id => openSampleDetail(id, { view: "agents" }),
  clientStudy: id => { const sample=clientSamples.find(row=>row.clientId===id); if(sample)openSampleDetail(sample.id,{view:"agents"}); else document.querySelector('[data-view="samples"]')?.click(); },
  supplier: id => openSupplierContact(id),
  order: id => { document.querySelector('[data-view="orders"]')?.click(); selectedOrderId=id; renderOrders(); },
  orders: query => { document.querySelector('[data-view="orders"]')?.click(); ordersMode="history"; orderHistorySearch=String(query||""); selectedOrderId=null; renderOrders(); },
  location: () => document.querySelector('[data-view="locations"]')?.click(),
  history: () => document.querySelector('[data-view="history"]')?.click()
};

window.ExadexInventoryAgent = {
  async applyBulkChanges(request) {
    const storage = window.ExadexGithubStorage;
    const config = storage?.getConfig?.();
    const remoteWritable = Boolean(storage?.mutateSharedData && (!storage.getConfig || (config?.owner && config?.repo && config?.path && config?.token)));
    if (remoteWritable) {
      let mutationResult = null;
      const result = await storage.mutateSharedData(request.operationId, latest => {
        mutationResult = buildAgentBulkMutation(latest, request);
        return mutationResult.state;
      }, { maxAttempts: 3 });
      if (!mutationResult && result?.duplicate) return { applied: 0, conflicts: 0, errors: 0, duplicate: true, mode: "remote", data: result.data };
      applySharedState(result.data);
      return { applied: mutationResult.applied, conflicts: 0, errors: 0, duplicate: mutationResult.duplicate, mode: "remote", data: result.data };
    }
    const mutation = buildAgentBulkMutation(sharedState, request);
    if (mutation.duplicate) return { applied: 0, conflicts: 0, errors: 0, duplicate: true, mode: "local-cache", data: mutation.state };
    sharedState = mutation.state;
    syncRuntimeStateFromShared();
    persist();
    render();
    return { applied: mutation.applied, conflicts: 0, errors: 0, duplicate: false, mode: "local-cache", data: sharedState };
  }
};

window.addEventListener("focus", refreshSharedStateFromGithub);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshSharedStateFromGithub();
  }
});

setInterval(refreshSharedStateFromGithub, 30000);

window.addEventListener("beforeunload", event => {
  if (!sharedDataHasUnsavedChanges && sharedDataSyncStatus !== "conflict") return;
  event.preventDefault();
  event.returnValue = "";
});

document.querySelector("#addPlacementBtn")?.addEventListener("click", event => {
  event.currentTarget.disabled = true;
  const next = readPlacementEditor(); next.push({ id: newStableId("placement"), roomId: "", locationId: null, sublocationId: null }); renderPlacementEditor(next);
  event.currentTarget.disabled = false;
});

window.ExadexClientSampleRules = {
  getCreatedSampleUnit,
  getClientSampleCategoryLabel,
  migrateClientSamples,
  syncSampleMeasureLabel,
  fields: sampleFields
};

document.querySelector("#addContactCoordinateBtn")?.addEventListener("click",()=>{
  const list=document.querySelector("#contactCoordinatesList"),wrapper=document.createElement("div");wrapper.innerHTML=`<div class="contact-coordinate-editor"><label>Libellé<input data-coordinate-label placeholder="Ex. Support technique"></label><label>Type<select data-coordinate-type><option value="email">E-mail</option><option value="phone">Téléphone</option><option value="other">Autre</option></select></label><label>Valeur<textarea data-coordinate-value rows="2" placeholder="Coordonnée ou information libre"></textarea></label><button class="icon-btn" type="button" data-remove-coordinate aria-label="Supprimer cette coordonnée" title="Supprimer">×</button></div>`;const row=wrapper.firstElementChild;list.append(row);row.querySelector("[data-remove-coordinate]").onclick=()=>row.remove();row.querySelector("input").focus();
});

window.ExadexContacts={
  normalizeCompanyName,
  migrateSupplierContacts,
  findForItem:item=>findSupplierContactForItem(item),
  getAll:()=>JSON.parse(JSON.stringify(supplierContacts)),
  getAssociatedItems:id=>{const contact=supplierContacts.find(row=>row.id===id);return contact?JSON.parse(JSON.stringify(getContactItems(contact))):[];},
  exactMatches:(value,contacts=supplierContacts)=>JSON.parse(JSON.stringify(exactSupplierContacts(value,contacts))),
  resolveExact:(value,contacts=supplierContacts)=>JSON.parse(JSON.stringify(resolveExactSupplierContact(value,"",contacts))),
  open:openSupplierContact
};

document.querySelector("#hierarchyEntityForm")?.addEventListener("submit",saveHierarchyEntity);
document.querySelectorAll("[data-close-hierarchy-entity]").forEach(button=>button.addEventListener("click",closeHierarchyEntityModal));

document.querySelector("#sublocationItemSearch")?.addEventListener("input",renderSublocationItemResults);
document.querySelector("#clearSublocationItemSearch")?.addEventListener("click",()=>{const input=document.querySelector("#sublocationItemSearch");input.value="";renderSublocationItemResults();input.focus();});
document.querySelectorAll("[data-close-sublocation-item]").forEach(button=>button.addEventListener("click",()=>document.querySelector("#sublocationItemDialog")?.close()));
window.ExadexLocations = {
  rooms: () => JSON.parse(JSON.stringify(FIXED_INVENTORY_ROOMS)),
  catalog: () => JSON.parse(JSON.stringify(hierarchyCatalog())),
  migratePlacements: item => JSON.parse(JSON.stringify(migrateItemPlacements(item || {}, String(item?.id || "test-item")))),
  validatePlacement: placement => {
    const catalog=hierarchyCatalog(), location=placement?.locationId&&catalog.locations.find(row=>row.id===placement.locationId), sub=placement?.sublocationId&&catalog.sublocations.find(row=>row.id===placement.sublocationId);
    return Boolean(placement?.roomId&&hierarchyRoom(placement.roomId)&&(!placement.locationId||location?.roomId===placement.roomId)&&(!placement.sublocationId||sub?.locationId===placement.locationId));
  },
  uniqueCount: entries => uniqueEntryCount(entries || [])
};
