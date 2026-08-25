// Estructura de datos:
// seedBaseItems viene del repositorio y solo sirve como bootstrap/default.
// sharedState contiene los datos vivos: inventario, experimentos, pedidos, muestras e historial.
// GitHub shared_data.json es la fuente compartida; localStorage solo sirve como cache/fallback.

const clientSampleTypes = {
  client_product: "Produit reçu du client",
  created_sample: "Échantillon créé"
};

const clientSampleCategories = ["Fixation (galette)", "Fixation (tissu)", "ARN", "cDNA", "Sécrétion"];
const clientSampleCategoryAliases = {
  "Galette agarose": "Fixation (galette)",
  "Tissu": "Fixation (tissu)",
  "Secretion": "Sécrétion"
};
const INITIAL_SUPPLIER_CONTACTS = [
  { id:"contact-abcam", company:"Abcam", salesRepresentative:"", afterSalesService:"", customerService:"orders@abcam.com", salesAndQuotes:"", phone:"08 01 84 05 42", notes:"", aliases:[] },
  { id:"contact-bd-biosciences", company:"BD Biosciences", salesRepresentative:"Loras Damien", afterSalesService:"", customerService:"serviceclientbdf@europe.bd.com", salesAndQuotes:"devis@bd.com", phone:"06 31 75 07 07", notes:"", aliases:["BD","Becton Dickinson","BD France"] },
  { id:"contact-bexen-medical", company:"Bexen Medical", salesRepresentative:"", afterSalesService:"", customerService:"info@bexenmedical.com", salesAndQuotes:"brangerieau@bexenmedical.com", phone:"", notes:"", aliases:[] }
];

const seedBaseItems = migrateItems(seedItems).map(item => ({
  ...item,
  source: "seed"
}));

let sharedDataSha = null;
let sharedDataMode = "loading";
let sharedDataSaveTimer = null;
let sharedDataLastError = "";
let sharedDataRemoteReady = false;
let sharedDataHasUnsavedChanges = false;
let sharedDataIsSaving = false;
let sharedDataSyncStatus = "loading";
let sharedDataSaveCoordinator = null;
let sharedDataConflict = null;
let sharedDataRecovery = null;
let sharedState = createSharedState(readCachedSharedState(), { includeBootstrap: false });


// no mover esta funcion
function buildItems() {
  return migrateItems(sharedState.inventoryItems).map(item => ({
    ...item,
    source: item.source || (isSeedItemId(item.id) ? "seed" : "web")
  }));
}

// dejar despues de function(buildItems)
let items = buildItems();

let orders = Array.isArray(sharedState.orders) ? sharedState.orders : [];
let experiments = migrateExperiments(sharedState.experiments);
let history = Array.isArray(sharedState.history) ? sharedState.history : [];
let stockMovements = Array.isArray(sharedState.stockMovements) ? sharedState.stockMovements : [];
let sourcingPatients = Array.isArray(sharedState.sourcingPatients) ? sharedState.sourcingPatients : [];
let clientSamples = migrateClientSamples(sharedState.clientSamples);
let clients = migrateClients(sharedState.clients, clientSamples);
let supplierContacts = migrateSupplierContacts(sharedState.supplierContacts);
// protocoles "Nouveau protocole" enregistrés par les utilisateurs, en plus des protocoles intégrés (protocols.js)
let customProtocolTemplates = Array.isArray(sharedState.customProtocolTemplates) ? sharedState.customProtocolTemplates : [];
let protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];

const sharedDataReady = hydrateSharedData();

let statusFilter = "all";
let inventoryUsageFilterValue = "active";
let activeView = "inventory";
let currentName = "Caroline";
let alertsExpanded = false;
let selectedLocation = null;
let selectedRoomId = null;
let selectedLocationId = null;
let selectedSublocationId = null;
let locationScopeMode = "direct";
let locationDetailSearch = "";
let locationDetailStatus = "all";
let locationDetailFacet = "all";
let locationDetailSort = "name-asc";
let locationDetailPage = 1;
let locationDetailPageSize = 50;
let selectedLocationEntry = null;
let historyCurrentPage = 1;
let historyPageSize = 50;
const expandedHistoryEntries = new Set();
let selectedExperimentId = null;
let selectedSourcingPatientId = null;
let selectedItemId = null;
const stockJournalOpenByItem = new Map();
let selectedSampleId = null;
let selectedSampleGroupId = null;
let sampleEditContext = { scope: "new", groupId: null, sampleId: null };
let itemReturnContext = { view: "inventory", experimentId: null, location: null, scrollY: 0 };
let sampleReturnContext = { view: "samples", location: null, scrollY: 0 };
let viewReturnScrollY = { experiments: 0, locations: 0 };
let selectedOrderId = null;
let selectedContactId = null;
let contactsSearchValue = "";
let contactsFilterValue = "all";
let contactsSortValue = "company-asc";
let contactsLetterValue = "";
let contactProductsSearchValue = "";
let contactProductsCategoryValue = "all";
let contactProductsSortValue = "name-asc";
let pendingStockMigration = null;
let ordersMode = "board";
let orderHistorySearch = "";
let orderHistoryStatus = "all";
let orderHistoryRequester = "all";
let orderHistoryPeriod = "all";
let orderHistorySort = "newest";
let orderHistoryPage = 1;
let orderHistoryPageSize = 50;
let pendingOrderInventoryLink = null;
let backupsLoaded = false;
let pendingBackupExport = null;
const collapsedClientGroups = new Set();
const expandedReplicaGroups = new Set();
const SAMPLE_PAGE_SIZE = 50;
let sampleCurrentPage = 1;
let samplesDomWarningShown = false;
const QUANTITY_STEP = 1;

const auth = document.querySelector("#auth");
const app = document.querySelector("#app");
const loginForm = document.querySelector("#loginForm");
const nameInput = document.querySelector("#nameInput");
const currentUser = document.querySelector("#currentUser");
const currentUserName = document.querySelector("#currentUserName");
const sidebarUser = document.querySelector("#sidebarUser");
const sidebarUserName = document.querySelector("#sidebarUserName");
const searchInput = document.querySelector("#searchInput");
const controlBar = document.querySelector(".control-bar");
const categoryFilter = document.querySelector("#categoryFilter");
const inventorySortSelect = document.querySelector("#inventorySortSelect");
const inventoryUsageFilter = document.querySelector("#inventoryUsageFilter");
const sampleSearchInput = document.querySelector("#sampleSearchInput");
const sampleTypeFilter = document.querySelector("#sampleTypeFilter");
const sampleCategoryFilter = document.querySelector("#sampleCategoryFilter");
const sampleClientFilter = document.querySelector("#sampleClientFilter");
const sampleSortSelect = document.querySelector("#sampleSortSelect");
const addClientStudyBtn = document.querySelector("#addClientStudyBtn");
const sampleDialog = document.querySelector("#sampleDialog");
const sampleForm = document.querySelector("#sampleForm");
const experimentSearchInput = document.querySelector("#experimentSearchInput");
const experimentSortSelect = document.querySelector("#experimentSortSelect");
const resetExperimentSearchBtn = document.querySelector("#resetExperimentSearchBtn");
const sourcingSearchInput = document.querySelector("#sourcingSearchInput");
const sourcingSortSelect = document.querySelector("#sourcingSortSelect");
const sourcingDialog = document.querySelector("#sourcingDialog");
const sourcingForm = document.querySelector("#sourcingForm");
const dialog = document.querySelector("#itemDialog");
const form = document.querySelector("#itemForm");
const stockDialog = document.querySelector("#stockDialog");
const stockForm = document.querySelector("#stockForm");
const stockMigrationDialog = document.querySelector("#stockMigrationDialog");
const stockMigrationForm = document.querySelector("#stockMigrationForm");
const experimentDialog = document.querySelector("#experimentDialog");
const experimentForm = document.querySelector("#experimentForm");
const saveProtocolTemplateDialog = document.querySelector("#saveProtocolTemplateDialog");
const saveProtocolTemplateForm = document.querySelector("#saveProtocolTemplateForm");
const manageProtocolTemplatesDialog = document.querySelector("#manageProtocolTemplatesDialog");
const consumeExperimentDialog = document.querySelector("#consumeExperimentDialog");
const experimentItemsList = document.querySelector("#experimentItemsList");
const FREE_PROTOCOL_ID = "custom-protocol";
let previousExperimentTemplateId = FREE_PROTOCOL_ID;
const orderDialog = document.querySelector("#orderDialog");
const orderForm = document.querySelector("#orderForm");
const confirmDeleteDialog = document.querySelector("#confirmDeleteDialog");
const confirmDeleteForm = document.querySelector("#confirmDeleteForm");
const confirmDeleteTitle = document.querySelector("#confirmDeleteTitle");
const confirmDeleteMessage = document.querySelector("#confirmDeleteMessage");
const confirmDeleteError = document.querySelector("#confirmDeleteError");
const confirmDeleteBtn = document.querySelector("#confirmDeleteBtn");
const cancelConfirmDeleteBtn = document.querySelector("#cancelConfirmDeleteBtn");
const closeConfirmDeleteBtn = document.querySelector("#closeConfirmDeleteBtn");
let deleteConfirmationAction = null;
let deleteConfirmationTrigger = null;
let deleteConfirmationPending = false;
const secondaryReferencesList = document.querySelector("#secondaryReferencesList");
const addSecondaryReferenceBtn = document.querySelector("#addSecondaryReferenceBtn");
const placementsList = document.querySelector("#placementsList");
const placementsError = document.querySelector("#placementsError");
const locationSearchInput = document.querySelector("#locationSearchInput");
const locationSortSelect = document.querySelector("#locationSortSelect");
const historySearchInput = document.querySelector("#historySearchInput");
const historyActionFilter = document.querySelector("#historyActionFilter");
const historyUserFilter = document.querySelector("#historyUserFilter");
const historyPeriodFilter = document.querySelector("#historyPeriodFilter");
const historyDateStart = document.querySelector("#historyDateStart");
const historyDateEnd = document.querySelector("#historyDateEnd");
const historyCustomDates = document.querySelector("#historyCustomDates");
const historyPageSizeSelect = document.querySelector("#historyPageSize");
const orderBoardSearchInput = document.querySelector("#orderBoardSearchInput");
const orderBoardPriorityFilter = document.querySelector("#orderBoardPriorityFilter");
const orderBoardRequesterFilter = document.querySelector("#orderBoardRequesterFilter");
const orderBoardSortSelect = document.querySelector("#orderBoardSortSelect");

const fields = [
  "itemId",
  "name",
  "category",
  "quantity",
  "unit",
  "minStock",
  "usageProfile",
  "location",
  "tags",
  "notes",
  "primarySupplier",
  "primarySupplierContactId",
  "primaryReference",
  "primaryLink",
  "primaryReferenceNotes",
  "primaryPrice",
  "primaryUnitPrice",
  "primaryLeadTime"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const stockFields = ["stockItemId", "stockItemName", "stockCurrentQuantity", "stockTitle", "stockAction", "stockAmount", "stockUnit", "stockNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});
const trackingFields = ["stockTrackingMode", "detailedPackagingEnabled", "aliquotTrackingEnabled", "aliquotTrackingExplanation", "trackingOptionError", "packagingConfig", "packagingLevels", "trackingUnitField", "trackingUnitKey", "packagingPreview"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const sampleFields = [
  "sampleId",
  "sampleType",
  "sampleClientCode",
  "sampleProductName",
  "sampleBaseName",
  "sampleCategory",
  "sampleArnOptions",
  "sampleArnQiazol",
  "sampleArnBead",
  "sampleArnNotesHint",
  "sampleArrivalDate",
  "sampleCreationDate",
  "sampleQuantity",
  "sampleUnit",
  "sampleMeasureLabel",
  "sampleMeasureValue",
  "sampleReplicaCount",
  "sampleLocation",
  "sampleReferenceNumber",
  "sampleLotNumber",
  "sampleNotes"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const experimentFields = [
  "experimentId",
  "experimentTemplate",
  "experimentName",
  "experimentClientCode",
  "experimentConditions",
  "experimentReplicates",
  "experimentStatus",
  "experimentTotalConditions",
  "experimentTemplateNotes",
  "experimentNotes",
  "rtqpcrPartRT",
  "rtqpcrPartDilution",
  "rtqpcrPartQPCR",
  "rtqpcrSampleConditions",
  "rtqpcrSampleReplicates",
  "rtqpcrQpcrConditions",
  "rtqpcrPrimerCount",
  "rtqpcrQpcrReplicates",
  "rtqpcrDeadVolumeConditions"
].reduce((acc, id) => ({
  ...acc,
  [id]: document.querySelector(`#${id}`)
}), {});

const sourcingFields = [
  "sourcingPatientId",
  "patientNumber",
  "patientType",
  "patientReceptionDate",
  "patientCultureWeeks",
  "patientStartQuantity",
  "patientWellsCount",
  "patientLotValidationDate",
  "patientStudyAssignment",
  "patientCessionTo",
  "patientCessionDate",
  "patientUsageStorage",
  "patientLotEndDate",
  "patientInitials",
  "patientCollectionSite",
  "patientGender",
  "patientAge",
  "patientHeight",
  "patientWeight",
  "patientBmi",
  "patientTechnique",
  "patientSurgeon",
  "patientCharacteristic",
  "patientNash",
  "patientSleepApnea",
  "patientT2d",
  "patientOtherComorbidity",
  "patientIntervention",
  "patientBmiMax",
  "patientIntentionTreatment",
  "patientQcMyco",
  "patientQcBacteria",
  "patientQcYeast",
  "patientQcXtt",
  "patientQcCollagenase",
  "patientQcAsc",
  "patientQcRemarks",
  "patientArnExplantT0",
  "patientArnWatT14",
  "patientArnBatT14",
  "patientArnPrebatAmpc",
  "patientArnInducibleBat",
  "patientSecretionsT0",
  "patientSecretionsT14",
  "patientSecretionsBatT14",
  "patientFixationT0",
  "patientFixationT14",
  "patientFreezing",
  "patientFreezingQuantity",
  "patientFreezingThaw",
  "patientGeneralRemark"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = [
  "orderItemMode",
  "orderInventorySearch",
  "orderInventoryItem",
  "orderQuantity",
  "orderPriority",
  "orderNotes",
  "orderNewName"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

renderCategoryOptions();
renderLocationOptions();
renderSampleOptions();
renderTemplateOptions();

// Dialog para confirmar la cantidad a anadir al inventario al recibir una orden
const receiveInventoryDialog = document.querySelector("#receiveInventoryDialog");
const receiveInventoryForm = document.querySelector("#receiveInventoryForm");
const receiveInventoryFields = [
  "receiveOrderId",
  "receiveInventoryItemName",
  "receiveInventoryRequestedText",
  "receiveQuantity",
  "receiveUnit"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

// animacion de inicio
const loginLoader = document.querySelector("#loginLoader");
const authPanel = document.querySelector(".auth-panel");

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
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
document.querySelector("#closeOrderDialogBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#cancelOrderBtn").addEventListener("click", () => orderDialog.close());
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
sampleCategoryFilter?.addEventListener("change", resetSamplePagination);
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
experimentSearchInput.addEventListener("input", renderExperiments);
experimentSortSelect?.addEventListener("change", renderExperiments);
resetExperimentSearchBtn?.addEventListener("click", () => { experimentSearchInput.value = ""; if (experimentSortSelect) experimentSortSelect.value = EXPERIMENT_DEFAULT_SORT; renderExperiments(); experimentSearchInput.focus(); });
document.querySelector("#addSourcingPatientBtn")?.addEventListener("click", () => openSourcingModal());
document.querySelector("#saveSourcingPatientBtn")?.addEventListener("click", saveSourcingPatient);
document.querySelector("#deleteSourcingPatientBtn")?.addEventListener("click", requestSourcingPatientDeletion);
sourcingSearchInput?.addEventListener("input", renderSourcing);
sourcingSortSelect?.addEventListener("change", renderSourcing);
sourcingFields.patientHeight?.addEventListener("input", recalculatePatientBmi);
sourcingFields.patientWeight?.addEventListener("input", recalculatePatientBmi);
sourcingFields.patientBmi?.addEventListener("input", () => { sourcingFields.patientBmi.dataset.manual = "true"; });
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

// Listeners para dialogo de recepcion de inventario al recibir una orden
document.querySelector("#confirmReceiveInventoryBtn").addEventListener("click", confirmReceiveInventory);
document.querySelector("#closeReceiveInventoryDialogBtn").addEventListener("click", () => receiveInventoryDialog.close());
document.querySelector("#cancelReceiveInventoryBtn").addEventListener("click", () => receiveInventoryDialog.close());
document.querySelector("#contactForm")?.addEventListener("submit", saveContact);
document.querySelector("#closeContactDialogBtn")?.addEventListener("click",()=>document.querySelector("#contactDialog").close());
document.querySelector("#cancelContactBtn")?.addEventListener("click",()=>document.querySelector("#contactDialog").close());
fields.primarySupplier?.addEventListener("input",syncPrimarySupplierContact);
fields.primarySupplier?.addEventListener("blur",syncPrimarySupplierContact);

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

window.addEventListener("focus", refreshSharedStateFromGithub);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshSharedStateFromGithub();
  }
});

setInterval(refreshSharedStateFromGithub, 30000);

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
    } else {
      sharedState = createSharedState(null, { includeBootstrap: true });
      syncRuntimeStateFromShared();
      cacheSharedState();

      if (result.mode === "github-write") {
        initializeSharedSaveCoordinator(result.data, result.sha);
        scheduleSharedSave({ allowInitialSeed: true });
      }
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

// guarda una copia cache local y publica el estado compartido en GitHub cuando esta configurado
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

const STOCK_WARNING_MULTIPLIER = 1.5;
const ZERO_MINIMUM_HEALTHY_THRESHOLD = 0.5;
const STOCK_STATUS_EPSILON = 1e-9;

function parseStockMinimum(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getStockStatus(item) {
  const available = window.StockTracking ? StockTracking.available(item) : Number(item?.quantity);
  const currentStock = Number.isFinite(available) ? available : 0;
  const minimum = parseStockMinimum(item?.minStock);
  if (minimum === null) return { status: "undefined", currentStock, minimum: null, healthyThreshold: null, differenceFromMinimum: null, ratio: null };
  const healthyThreshold = minimum === 0 ? ZERO_MINIMUM_HEALTHY_THRESHOLD : minimum * STOCK_WARNING_MULTIPLIER;
  const tolerance = STOCK_STATUS_EPSILON * Math.max(1, Math.abs(currentStock), Math.abs(minimum), Math.abs(healthyThreshold));
  const status = currentStock <= minimum ? "critical" : currentStock + tolerance >= healthyThreshold ? "ok" : "warning";
  return { status, currentStock, minimum, healthyThreshold, differenceFromMinimum: currentStock - minimum, ratio: healthyThreshold > 0 ? currentStock / healthyThreshold : null };
}

function itemStatus(item) {
  return getStockStatus(item).status;
}

function stockLevelPercent(item) {
  const result=getStockStatus(item);if(result.status==="undefined")return 0;return Math.max(0,Math.min(100,Math.round((result.currentStock/result.healthyThreshold)*100)));
}

function statusLabel(status) {
  return { ok: "Stock sain", warning: "Attention", critical: "Critique", undefined: "Seuil non défini" }[status] || "Seuil non défini";
}

function stockSummaryStatusLabel(stockStatus) {
  if (stockStatus.currentStock <= 0) return "Stock épuisé";
  return { ok:"Stock sain", warning:"Stock faible", critical:"Stock critique", undefined:"Seuil non défini" }[stockStatus.status] || "Seuil non défini";
}

function statusLabelExperiment(status) {
  return { draft: "Brouillon", running: "En cours", completed: "Terminé" }[normalizeExperimentStatus(status)] || status || "—";
}

function normalizeExperimentStatus(status) {
  const value = normalizeSearch(status || "").replace(/\s+/g, "_");
  return { draft:"draft", brouillon:"draft", running:"running", in_progress:"running", en_cours:"running", completed:"completed", complete:"completed", termine:"completed" }[value] || status;
}

function render() {
  renderCategories();
  renderMetrics();
  renderAlerts();
  renderInventory();
  renderSamples();
  renderHistory();
  renderLocations();
  renderOrders();
  renderExperiments();
  renderSourcing();
  renderContacts();
}

function getPageScrollY() {
  return window.scrollY || window.pageYOffset || 0;
}

function restorePageScrollY(scrollY) {
  if (typeof scrollY !== "number" || Number.isNaN(scrollY)) return;
  const targetY = Math.max(0, scrollY);
  window.requestAnimationFrame(() => {
    window.scrollTo(0, targetY);
    window.requestAnimationFrame(() => window.scrollTo(0, targetY));
  });
}

function renderCategories() {
  categoryFilter.innerHTML = `<option value="all">Toutes categories</option>${inventoryCategories.map(category => `<option>${escapeHtml(category)}</option>`).join("")}`;
  categoryFilter.value = "all";
}

function renderCategoryOptions() {
  fields.category.innerHTML = inventoryCategories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderLocationOptions() {
  fields.location.innerHTML = inventoryLocations
    .map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");
}

function renderSampleOptions() {
  if (sampleFields.sampleLocation) {
    sampleFields.sampleLocation.innerHTML = inventoryLocations
      .map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
      .join("");
  }

  if (sampleCategoryFilter) {
    sampleCategoryFilter.innerHTML = `<option value="all">Toutes categories</option>${clientSampleCategories
      .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("")}`;
  }

  renderClientFilterOptions();
}

function renderTemplateOptions() {
  experimentFields.experimentTemplate.innerHTML = `<option value="${FREE_PROTOCOL_ID}">Nouveau protocole</option>` + protocolTemplates
    .map(template => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`)
    .join("");
}

function renderMetrics() {
  const activeItems = items.filter(isActiveInventoryItem);
  const counts = activeItems.reduce((acc, item) => {
    acc[itemStatus(item)] += 1;
    return acc;
  }, { ok: 0, warning: 0, critical: 0, undefined: 0 });
  document.querySelector("#metrics").innerHTML = [
    ["Total references", activeItems.length, ""],
    ["Stock OK", counts.ok, "ok"],
    ["Attention", counts.warning, "warning"],
    ["Rupture / critique", counts.critical, "critical"]
  ].map(([label, value, cls]) => `
    <article class="metric-card ${cls}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function renderAlerts() {
  const critical = items.filter(item =>
    isActiveInventoryItem(item) &&
    itemStatus(item) === "critical"
  );
  const alertsContainer = document.querySelector("#alerts");
  const visibleAlerts = alertsExpanded ? critical : critical.slice(0, 3);
  const hiddenCount = Math.max(critical.length - 3, 0);
  const sharedStatusAlert = renderSharedDataAlert();

  if (activeView !== "inventory") {
    alertsContainer.innerHTML = sharedStatusAlert;
    return;
  }

  if (!critical.length && !sharedStatusAlert) {
    alertsContainer.innerHTML = "";
    return;
  }

  if (!critical.length) {
    alertsContainer.innerHTML = sharedStatusAlert;
    return;
  }

  alertsContainer.innerHTML = `
    ${sharedStatusAlert}
    <div class="alerts-header-row">
      <div class="alerts-header-text">
        <strong>Alertes critiques</strong>
        <span>${critical.length} au total</span>
      </div>
      ${critical.length > 3 ? `
        <button type="button" class="alerts-toggle-btn" id="alertsToggleBtn">
          ${alertsExpanded ? "− Masquer" : `+ ${hiddenCount} alertes`}
        </button>
      ` : ""}
    </div>

    <div class="alerts-list">
      ${visibleAlerts.map(item => `
        <div
          class="alert critical-item-alert"
          role="button"
          tabindex="0"
          data-critical-item-id="${escapeHtml(item.id)}"
          aria-label="Ouvrir la fiche de ${escapeHtml(item.name)}"
        >
          ⚠ ${escapeHtml(item.name)} - Rupture / critique : ${StockTracking.format(getStockStatus(item).currentStock)} ${escapeHtml(item.unit)} restants / min. ${getStockStatus(item).minimum} ${escapeHtml(item.unit)}
        </div>
      `).join("")}
    </div>
  `;

  const toggleBtn = document.querySelector("#alertsToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      alertsExpanded = !alertsExpanded;
      renderAlerts();
    });
  }

  alertsContainer.querySelectorAll("[data-critical-item-id]").forEach(alert => {
    const openAlertItem = () => {
      const id = alert.dataset.criticalItemId;
      if (!items.some(item => item.id === id)) {
        renderAlerts();
        return;
      }
      openItemDetail(id, { view: "inventory" });
    };
    alert.addEventListener("click", openAlertItem);
    alert.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openAlertItem();
    });
  });
}

function renderSharedDataAlert() {
  if (sharedDataRecovery?.unsynced) {
    return `
      <div class="alert shared-data-alert danger" role="alert">
        Des modifications locales non synchronisées ont été retrouvées (${escapeHtml(sharedDataRecovery.modifiedAt || "date inconnue")}).
        <button type="button" class="btn ghost" onclick="downloadRecoveredSharedData()">Télécharger une copie</button>
        <button type="button" class="btn ghost" onclick="compareRecoveredSharedData()">Comparer et récupérer</button>
        <button type="button" class="btn ghost" onclick="ignoreRecoveredSharedData()">Ignorer</button>
      </div>
    `;
  }

  if (sharedDataSyncStatus === "conflict") {
    return `<div class="alert shared-data-alert danger" role="alert">Conflit détecté — récupération nécessaire. ${escapeHtml(sharedDataLastError)}</div>`;
  }

  if (sharedDataIsSaving) {
    return `
      <div class="alert shared-data-alert saving" role="status">
        Synchronisation GitHub en cours...
      </div>
    `;
  }

  if (sharedDataLastError) {
    return `
      <div class="alert shared-data-alert danger" role="alert">
        Données partagées non sauvegardées sur GitHub : ${escapeHtml(sharedDataLastError)}
      </div>
    `;
  }

  if (sharedDataHasUnsavedChanges && sharedDataMode !== "github-write") {
    return `
      <div class="alert shared-data-alert danger" role="alert">
        Modifications en cache local uniquement : la sauvegarde GitHub n'est pas active.
      </div>
    `;
  }

  if (sharedDataHasUnsavedChanges || sharedDataSyncStatus === "unsynced") {
    return `<div class="alert shared-data-alert danger" role="alert">Modifications non synchronisées — aucun enregistrement n'est en cours.</div>`;
  }

  return "";
}

function downloadRecoveredSharedData() {
  if (sharedDataRecovery) window.ExadexRecoveryStorage?.download?.(sharedDataRecovery);
}

function compareRecoveredSharedData() {
  sharedDataRecovery = null;
  sharedDataLastError = "";
  sharedDataHasUnsavedChanges = true;
  sharedDataSyncStatus = "unsynced";
  scheduleSharedSave();
  renderAlerts();
}

async function ignoreRecoveredSharedData() {
  sharedDataRecovery = null;
  await window.ExadexRecoveryStorage?.markSynced?.({ ignoredAt: new Date().toISOString() }).catch(() => null);
  const result = await window.ExadexGithubStorage.loadSharedData({ fresh: true });
  sharedDataSha = result.sha;
  sharedDataLastError = "";
  sharedDataSyncStatus = "saved";
  applySharedState(result.data);
  initializeSharedSaveCoordinator(result.data, result.sha);
  render();
}

window.addEventListener("beforeunload", event => {
  if (!sharedDataHasUnsavedChanges && sharedDataSyncStatus !== "conflict") return;
  event.preventDefault();
  event.returnValue = "";
});

function renderInventory() {
  renderUsageProfileFilterOptions();
  const query = normalizeSearch(searchInput.value);
  const category = categoryFilter.value;
  const sort = inventorySortSelect?.value || "recent";

  const filtered = items
    .filter(item => {
      const referenceText = itemReferencesText(item.references);
      const haystack = normalizeSearch([
        item.name,
        ...getItemLocations(item),
        item.category,
        ...item.tags,
        referenceText
      ].join(" "));

      return (!query || haystack.includes(query)) &&
        (statusFilter === "all" || itemStatus(item) === statusFilter) &&
        usageProfileMatchesFilter(item, inventoryUsageFilterValue) &&
        (category === "all" || item.category === category);
    })
    .sort((a, b) => compareInventoryItemsWithUsage(a, b, sort, inventoryUsageFilterValue));

  document.querySelector("#resultCount").textContent =
    `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;

  const detail = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(detail));

  document.querySelector("#inventoryDetail").innerHTML = detail
    ? renderInventoryDetail(detail)
    : "";
  syncStockJournalAccessibility(document.querySelector("#inventoryDetail"));

  controlBar.classList.toggle("hidden", activeView !== "inventory" || Boolean(detail));
  document.querySelector("#inventoryGrid").classList.toggle("hidden", Boolean(detail));

  document.querySelector("#inventoryGrid").innerHTML = filtered.map((item) => {
    const status = itemStatus(item);
    const percent = stockLevelPercent(item);
    const advancedSummary = StockTracking.summary(item);
    const availableQuantity = StockTracking.available(item);

    return `
      <article class="item-card item-preview-card" onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'inventory' })">
        <div class="item-head">
          <div class="inventory-card-title">
            ${renderRoutineStar(item)}
            <strong>${escapeHtml(item.name)}</strong>
          </div>
          <div class="inventory-card-badges">
            <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
            ${renderUsageProfileTag(item)}
          </div>
        </div>

        <span class="category">${escapeHtml(item.category)}</span>

        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>

        <div class="stock-line">
          <span>${formatInventoryCardQuantity(availableQuantity, item.unit)}</span>
          <span>Min ${formatInventoryCardQuantity(item.minStock, item.unit)}</span>
        </div>

        ${advancedSummary ? `<small class="advanced-stock-summary">${escapeHtml(advancedSummary)}</small>` : ""}

        ${item.tags?.length ? `
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        ` : ""}

        <small class="inventory-card-location">${escapeHtml(formatLocations(item))}</small>

        <div class="card-actions inventory-card-actions">
          <div class="card-button-stack inventory-card-button-group">
            <button
              class="text-btn"
              type="button"
              onclick="event.stopPropagation(); openModal('${escapeHtml(item.id)}')"
            >
              Modifier
            </button>
            <button
              class="text-btn"
              type="button"
              onclick="event.stopPropagation(); ${usesAdvancedStockManager(item) ? `openStockManager('${escapeHtml(item.id)}')` : `openStockModal('${escapeHtml(item.id)}')`}"
            >
              Mettre à jour le stock
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function normalizeUsageProfile(value) {
  return ["normal", "routine", "backup"].includes(value) ? value : "normal";
}

function getItemUsageProfile(item) {
  return normalizeUsageProfile(item?.usageProfile);
}

function isActiveInventoryItem(item) {
  const profile = getItemUsageProfile(item);
  return profile === "normal" || profile === "routine";
}

function isBackupInventoryItem(item) {
  return getItemUsageProfile(item) === "backup";
}

function getUsageProfileCounts(itemList = items) {
  const counts = {
    active: 0,
    normal: 0,
    routine: 0,
    backup: 0
  };

  (Array.isArray(itemList) ? itemList : []).forEach(item => {
    const profile = getItemUsageProfile(item);
    counts[profile] += 1;
  });
  counts.active = (Array.isArray(itemList) ? itemList : []).filter(isActiveInventoryItem).length;
  return counts;
}

function renderUsageProfileFilterOptions() {
  if (!inventoryUsageFilter) return;
  const counts = getUsageProfileCounts(items);
  const selectedValue = ["active", "routine", "backup"].includes(inventoryUsageFilterValue)
    ? inventoryUsageFilterValue
    : "active";
  inventoryUsageFilter.innerHTML = `
    <option value="active">Tous (${counts.active})</option>
    <option value="routine">Routine (${counts.routine})</option>
    <option value="backup">Back-up (${counts.backup})</option>
  `;
  inventoryUsageFilter.value = selectedValue;
  const accessibleLabels = {
    active: `Afficher : Tous, ${counts.active} items actifs`,
    routine: `Afficher : Routine, ${counts.routine} items`,
    backup: `Afficher : Back-up, ${counts.backup} items`
  };
  inventoryUsageFilter.setAttribute("aria-label", accessibleLabels[selectedValue]);
}

function usageProfileMatchesFilter(item, filterValue) {
  if (filterValue === "routine") return getItemUsageProfile(item) === "routine";
  if (filterValue === "backup") return isBackupInventoryItem(item);
  return isActiveInventoryItem(item);
}

function compareInventoryItemsWithUsage(a, b, sort, filterValue) {
  if (filterValue === "active") {
    const rank = { routine: 0, normal: 1, backup: 2 };
    const profileDifference =
      rank[getItemUsageProfile(a)] -
      rank[getItemUsageProfile(b)];
    if (profileDifference) return profileDifference;
  }
  return compareInventoryItems(a, b, sort);
}

function renderRoutineStar(item) {
  const profile = getItemUsageProfile(item);
  return profile === "routine"
    ? `<span class="routine-star" title="Item de routine prioritaire" aria-label="Item de routine prioritaire"><span aria-hidden="true">★</span></span>`
    : "";
}

function renderUsageProfileTag(item) {
  const profile = getItemUsageProfile(item);
  if (profile === "routine") return `<span class="usage-profile-tag routine">Routine</span>`;
  if (profile === "backup") return `<span class="usage-profile-tag backup">Back-up</span>`;
  return "";
}

function compareInventoryItems(a, b, sort = "recent") {
  if (sort === "oldest") {
    return getItemAddedTime(a) - getItemAddedTime(b);
  }

  if (sort === "az") {
    return String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" });
  }

  if (sort === "za") {
    return String(b.name || "").localeCompare(String(a.name || ""), "fr", { sensitivity: "base" });
  }

  return getItemAddedTime(b) - getItemAddedTime(a);
}

function formatInventoryCardQuantity(quantity, unit) {
  const displayUnit = formatInventoryDisplayUnit(quantity, unit);
  return `${escapeHtml(quantity)} ${escapeHtml(displayUnit)}`.trim();
}

function formatInventoryDisplayUnit(quantity, unit) {
  const rawUnit = String(unit || "").trim();
  if (!rawUnit) return "";

  const normalizedUnit = normalizeSearch(rawUnit);
  const singular = Number(quantity) === 1;
  const unitForms = {
    unite: ["unité", "unités"],
    unites: ["unité", "unités"],
    unit: ["unité", "unités"],
    units: ["unité", "unités"],
    piece: ["pièce", "pièces"],
    pieces: ["pièce", "pièces"],
    plaque: ["plaque", "plaques"],
    plaques: ["plaque", "plaques"],
    tube: ["tube", "tubes"],
    tubes: ["tube", "tubes"],
    boite: ["boîte", "boîtes"],
    boites: ["boîte", "boîtes"],
    flacon: ["flacon", "flacons"],
    flacons: ["flacon", "flacons"],
    seringue: ["seringue", "seringues"],
    seringues: ["seringue", "seringues"],
    syringe: ["seringue", "seringues"],
    syringes: ["seringue", "seringues"],
    sachet: ["sachet", "sachets"],
    sachets: ["sachet", "sachets"],
    kit: ["kit", "kits"],
    kits: ["kit", "kits"],
    test: ["test", "tests"],
    tests: ["test", "tests"]
  };

  const forms = unitForms[normalizedUnit];
  if (!forms) return rawUnit;
  return singular ? forms[0] : forms[1];
}

function renderInventoryDetail(item) {
  const status = itemStatus(item);
  const references = normalizeReferences(item.references);
  const locations = formatItemLocationPaths(item);

  return `
    <section class="inventory-detail-panel">
      <div class="inventory-detail-return-row">
        <button
          class="ghost-btn inventory-back-btn"
          type="button"
          onclick="returnFromItemDetail()"
          aria-label="Retour à l'inventaire"
        >
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="inventory-detail-header">
        <div class="inventory-detail-title">
          <div class="inventory-detail-badges">
            <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
            ${renderUsageProfileTag(item)}
          </div>
          <div class="inventory-detail-name-row">
            ${renderRoutineStar(item)}
            <h3>${escapeHtml(item.name)}</h3>
          </div>
          <div class="inventory-detail-meta">
            <span>ID : ${escapeHtml(item.id)}</span>
            <span>${escapeHtml(locations)}</span>
            <span>${escapeHtml(item.category)}</span>
          </div>
        </div>

        <div class="detail-actions inventory-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openModal('${escapeHtml(item.id)}')">
            Modifier la fiche
          </button>
          <button class="primary-btn compact-btn" type="button" onclick="${usesAdvancedStockManager(item) ? `openStockManager('${escapeHtml(item.id)}')` : `openStockModal('${escapeHtml(item.id)}')`}">
            Mettre à jour le stock
          </button>
        </div>
      </div>

      ${renderStockVisualCard(item)}

      ${renderAdvancedStockDetail(item)}

      <div class="inventory-detail-secondary-grid">
        ${renderInventoryReferencesPanel(references, item)}
        ${renderInventoryInfoPanel(item)}
      </div>
    </section>
  `;
}

function renderInventoryInfoPanel(item) {
  const sections = [
    item.tags?.length ? `
      <div class="inventory-info-group">
        <h4>Tags</h4>
        <div class="tags">
          ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    ` : "",
    item.protocol ? `
      <div class="inventory-info-group">
        <h4>Protocole</h4>
        <p>${escapeHtml(item.protocol)}</p>
      </div>
    ` : "",
    item.notes ? `
      <div class="inventory-info-group">
        <h4>Notes</h4>
        <p class="multiline-text">${escapeHtml(item.notes)}</p>
      </div>
    ` : ""
  ].filter(Boolean);

  if (!sections.length) return "";

  return `
    <section class="inventory-info-panel">
      <div class="inventory-panel-heading">
        <span class="inventory-panel-icon">i</span>
        <h3>Informations</h3>
      </div>
      ${sections.join("")}
    </section>
  `;
}

function renderInventoryReferencesPanel(references, item = null) {
  const primaryRows = [
    renderSupplierReferenceRow(references.primary.supplier, item),
    renderReferenceRow("Référence", references.primary.reference, { copyable: true }),
    renderReferenceLinkRow("Lien", references.primary.link),
    renderReferenceRow("Notes", references.primary.notes),
    renderReferenceRow("Prix", formatPriceEuro(references.primary.price)),
    renderReferenceRow("Prix unitaire", formatPriceEuro(references.primary.unitPrice)),
    renderReferenceRow("Délais de livraison", references.primary.leadTime)
  ].filter(Boolean);

  const secondaryBlocks = references.secondary
    .map((reference, index) => {
      const rows = [
        renderReferenceRow("Référence", reference.reference, { copyable: true }),
        renderReferenceRow("Notes", reference.notes)
      ].filter(Boolean);

      if (!rows.length) return "";

      return `
        <div class="reference-block secondary-reference-block">
          <strong>Référence secondaire ${index + 1}</strong>
          <div class="item-detail-stack">${rows.join("")}</div>
        </div>
      `;
    })
    .filter(Boolean);

  if (!primaryRows.length && !secondaryBlocks.length) {
    return `
      <section class="inventory-info-panel">
        <div class="inventory-panel-heading">
          <span class="inventory-panel-icon">↗</span>
          <h3>Références</h3>
        </div>
        <p>Aucune référence principale.</p>
      </section>
    `;
  }

  return `
    <section class="inventory-info-panel inventory-reference-panel">
      <div class="inventory-panel-heading">
        <span class="inventory-panel-icon">↗</span>
        <h3>Référence principale</h3>
      </div>
      ${
        primaryRows.length
          ? `<div class="item-detail-stack">${primaryRows.join("")}</div>`
          : `<p>Aucune référence principale.</p>`
      }
      ${secondaryBlocks.length ? `<div class="secondary-references">${secondaryBlocks.join("")}</div>` : ""}
    </section>
  `;
}

function renderSupplierReferenceRow(value, item = null) {
  if (!value || !String(value).trim()) return "";
  const contact = findSupplierContactForItem(item || { references: { primary: { supplier: value } } });
  if (!contact) return renderReferenceRow("Fournisseur", value);
  return `<div class="item-detail-row reference-detail-row"><span class="item-detail-label">Fournisseur</span><div class="item-detail-value reference-detail-value"><button class="supplier-contact-link" type="button" onclick="openSupplierContact('${escapeHtml(contact.id)}')">${escapeHtml(contact.company)} <span aria-hidden="true">↗</span></button></div></div>`;
}

function renderReferenceRow(label, value, options = {}) {
  if (!value || !String(value).trim()) return "";
  const isMultiline = /note|comment|description/i.test(String(label));

  return `
    <div class="item-detail-row reference-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value reference-detail-value${isMultiline ? " multiline-text" : ""}">
        <span>${escapeHtml(value)}</span>
        ${options.copyable ? `
          <button
            class="copy-reference-btn"
            type="button"
            data-copy-value="${escapeHtml(value)}"
            onclick="copyReferenceToClipboard(this)"
            aria-label="Copier la référence"
          >
            Copier
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

function renderReferenceLinkRow(label, value) {
  if (!value || !String(value).trim()) return "";

  return `
    <div class="item-detail-row reference-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value reference-detail-value">
        <a class="external-reference-link" href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(value)}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  `;
}

function copyReferenceToClipboard(button) {
  const value = button?.dataset?.copyValue || "";
  if (!value) return;

  const showCopied = () => {
    const previousText = button.textContent;
    button.textContent = "Copié";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = previousText;
      button.classList.remove("copied");
    }, 1400);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(showCopied).catch(() => {
      window.prompt("Copier la référence", value);
    });
    return;
  }

  window.prompt("Copier la référence", value);
  showCopied();
}

// Stock visual priority: explicit product/type override > category mapping > unit mapping > generic fallback.
const stockVisualProductRules = [
  {
    type: "syringe",
    match: ({ text }) => /\b(seringue|syringe|luer|aiguille|needle)\b/.test(text)
  },
  {
    type: "tubeRack",
    match: ({ text }) => /\b(tube|tubes|vial|vials|cryotube|eppendorf|falcon)\b/.test(text)
  },
  {
    type: "plate",
    match: ({ text }) => /\b(plaque|plate|well|puits|boite de petri|boîte de petri|petri)\b/.test(text)
  }
];

const stockVisualCategoryRules = [
  {
    type: "powder",
    match: ({ categoryText, text }) =>
      /\b(poudre|powder|solide|solid|granule|beads?|agarose)\b/.test(`${categoryText} ${text}`)
  },
  {
    type: "liquid",
    match: ({ categoryText, text }) =>
      /\b(liquide|liquid|reactif|reagent|tampon|buffer|milieu|media|solution|serum)\b/.test(`${categoryText} ${text}`)
  },
  {
    type: "unit",
    match: ({ categoryText, text }) =>
      /\b(consommable|consumable|plastique|plastic|materiel|matériel|embout|tip|gant|box|boite|boîte)\b/.test(`${categoryText} ${text}`)
  }
];

const stockVisualUnitMap = {
  ml: "liquid",
  l: "liquid",
  ul: "liquid",
  "µl": "liquid",
  g: "powder",
  mg: "powder",
  kg: "powder",
  unite: "unit",
  unites: "unit",
  unit: "unit",
  units: "unit",
  piece: "unit",
  pieces: "unit",
  "pièce": "unit",
  "pièces": "unit",
  plaque: "plate",
  plaques: "plate",
  tube: "tubeRack",
  tubes: "tubeRack",
  boite: "unit",
  boites: "unit",
  "boîte": "unit",
  "boîtes": "unit",
  flacon: "liquid",
  flacons: "liquid",
  sachet: "unit",
  sachets: "unit"
};

function getStockVisualType(item) {
  const unit = normalizeStockUnit(item?.unit);
  const categoryText = normalizeSearch(item?.category || "");
  const text = normalizeSearch([
    item?.name,
    item?.category,
    item?.unit,
    ...(Array.isArray(item?.tags) ? item.tags : [])
  ].join(" "));

  const context = { item, unit, categoryText, text };
  return stockVisualProductRules.find(rule => rule.match(context))?.type ||
    stockVisualCategoryRules.find(rule => rule.match(context))?.type ||
    stockVisualUnitMap[unit] ||
    "generic";
}

function normalizeStockUnit(unit) {
  return String(unit || "")
    .trim()
    .toLowerCase()
    .replace("μ", "µ")
    .replace(/^u(l)$/i, "ul")
    .replace(/\s+/g, "");
}

function renderStockVisualCard(item) {
  const stockStatus = getStockStatus(item);
  const { status, currentStock: quantity, minimum, healthyThreshold } = stockStatus;
  const visualType = getStockVisualType(item);
  const hasMinimum = minimum !== null;
  const visualPercent = hasMinimum
    ? Math.min(100, Math.max(0, (quantity / Math.max(quantity, healthyThreshold, 1)) * 100))
    : (quantity > 0 ? 70 : 0);
  const normalizedUnit = StockTracking.normalizeUnitLabel(item.unit);
  const unitSingular = normalizedUnit.singular;
  const currentUnit = StockTracking.plural(quantity, normalizedUnit.singular, normalizedUnit.plural);
  const minimumUnit = StockTracking.plural(minimum ?? 0, normalizedUnit.singular, normalizedUnit.plural);
  const quantityValue = escapeHtml(formatCleanNumber(quantity));
  const minimumValue = escapeHtml(formatCleanNumber(minimum));
  const health = stockHealthText(status, hasMinimum);
  const interpretation = stockInterpretationText(stockStatus, unitSingular, currentUnit);

  return `
    <div class="stock-visual-card ${hasMinimum ? status : "no-minimum"} stock-visual-${visualType}" style="--stock-fill:${visualPercent}%">
      <div class="stock-visual-figure" aria-hidden="true">
        ${renderStockVisualArt(visualType, visualPercent)}
      </div>

      <div class="stock-visual-facts">
        ${renderStockMetricRow("Stock actuel", `${quantityValue} ${escapeHtml(currentUnit)}`, "cube")}
        ${renderStockMetricRow("Minimum", hasMinimum ? `${minimumValue} ${escapeHtml(minimumUnit)}` : "Non défini", "sliders")}
        <p class="stock-interpretation ${interpretation.state}">${escapeHtml(interpretation.text)}</p>
      </div>

      <div class="stock-health-panel">
        <div class="stock-health-head">
          <span class="stock-health-icon">${hasMinimum && status === "ok" ? "✓" : hasMinimum ? "!" : "i"}</span>
          <div>
            <strong>${escapeHtml(health.title)}</strong>
            <span>${escapeHtml(health.description)}</span>
          </div>
        </div>

        ${hasMinimum ? renderStockThresholdScale(stockStatus, currentUnit) : ""}
      </div>
    </div>
  `;
}

function renderStockMetricRow(label, value, icon) {
  return `
    <div class="stock-metric-row">
      <span class="stock-metric-icon stock-metric-${icon}"></span>
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function stockHealthText(status, hasMinimum = true) {
  if (!hasMinimum) {
    return {
      title: "Seuil minimum non défini",
      description: "Définissez un minimum pour activer le suivi des alertes."
    };
  }

  if (status === "critical") {
    return {
      title: "Critique",
      description: "Le stock est au niveau minimum ou en dessous."
    };
  }

  if (status === "warning") {
    return {
      title: "Attention",
      description: "Le stock est proche du seuil minimum."
    };
  }

  return {
    title: "Stock sain",
    description: "Le stock est au-dessus du minimum."
  };
}

function stockInterpretationText(stockStatus, unitSingular, currentUnit) {
  const { currentStock, minimum, differenceFromMinimum } = stockStatus;
  if (minimum === null) {
    return {
      state: "neutral",
      text: `${formatCleanNumber(currentStock)} ${currentUnit} disponible${currentStock > 1 ? "s" : ""}`
    };
  }
  const difference = differenceFromMinimum;
  const absDifference = Math.abs(difference);
  const diffUnit = unitSingular;

  if (difference > 0) {
    return {
      state: "ok",
      text: `${formatCleanNumber(absDifference)} ${diffUnit} au-dessus du minimum`
    };
  }

  if (difference < 0) {
    return {
      state: "critical",
      text: `${formatCleanNumber(absDifference)} ${diffUnit} en dessous du minimum`
    };
  }

  return {
    state: "warning",
    text: "Stock au niveau minimum"
  };
}

function renderStockThresholdScale(stockStatus, unit) {
  const { currentStock: quantity, minimum, healthyThreshold, status } = stockStatus;
  const maxValue = Math.max(quantity, healthyThreshold * 1.25, 1);
  const currentPercent = Math.max(0, Math.min(100, (quantity / maxValue) * 100));
  const minimumPercent = Math.max(0, Math.min(100, (minimum / maxValue) * 100));
  const healthyPercent = Math.max(0, Math.min(100, (healthyThreshold / maxValue) * 100));

  return `
    <div
      class="stock-threshold-scale ${status}"
      style="--stock-current:${currentPercent}%; --stock-minimum:${minimumPercent}%; --stock-healthy:${healthyPercent}%"
      aria-label="Stock actuel ${escapeHtml(formatCleanNumber(quantity))}, minimum ${escapeHtml(formatCleanNumber(minimum))}"
    >
      <div class="stock-threshold-track">
        <span class="stock-threshold-fill"></span>
        <span class="stock-threshold-minimum"></span>
        <span class="stock-threshold-current">${escapeHtml(formatCleanNumber(quantity))}</span>
      </div>
      <div class="stock-health-scale">
        <span>0</span>
        <span>${escapeHtml(formatCleanNumber(maxValue))} ${escapeHtml(unit)}</span>
      </div>
      <div class="stock-minimum-label">Minimum : ${escapeHtml(formatCleanNumber(minimum))}</div>
      <div class="stock-minimum-label">Stock sain à partir de : ${escapeHtml(formatCleanNumber(healthyThreshold))} ${escapeHtml(unit)}</div>
    </div>
  `;
}

function formatCleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return String(value || "");
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(number);
}

function renderStockVisualArt(type, percent) {
  if (type === "syringe") return renderSyringeStockVisual(percent);
  if (type === "powder") return renderPowderStockVisual(percent);
  if (type === "unit") return renderUnitStockVisual(percent);
  if (type === "plate") return renderPlateStockVisual(percent);
  if (type === "tubeRack") return renderTubeRackStockVisual(percent);
  if (type === "liquid") return renderLiquidStockVisual(percent);
  return renderGenericStockVisual(percent);
}

function renderLiquidStockVisual(percent) {
  const fillHeight = Number((96 * percent / 100).toFixed(2));
  const fillY = Number((126 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 150" role="img" aria-label="Contenant liquide">
      <rect x="68" y="12" width="44" height="24" rx="8" class="stock-svg-cap" />
      <path d="M62 38h56l10 22v66c0 10-8 18-18 18H70c-10 0-18-8-18-18V60l10-22Z" class="stock-svg-shell" />
      <clipPath id="liquidClip"><path d="M62 42h56l7 18v64c0 8-7 15-15 15H70c-8 0-15-7-15-15V60l7-18Z" /></clipPath>
      <g clip-path="url(#liquidClip)">
        <rect x="54" y="${fillY}" width="72" height="${fillHeight}" class="stock-svg-fill" />
        <path d="M54 ${fillY + 8}c18-8 34 7 52-1 8-3 14-4 20-1v12H54Z" class="stock-svg-shine" />
      </g>
      <path d="M70 56h40" class="stock-svg-line" />
      <path d="M70 76h40" class="stock-svg-line" />
      <path d="M70 96h40" class="stock-svg-line" />
    </svg>
  `;
}

function renderSyringeStockVisual(percent) {
  const fillHeight = Number((64 * percent / 100).toFixed(2));
  const fillY = Number((108 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg stock-svg-syringe" viewBox="0 0 170 180" role="img" aria-label="Seringue">
      <path d="M78 18h14v18H78z" class="stock-svg-cap" />
      <path d="M74 36h22v12H74z" class="stock-svg-shell" />
      <path d="M64 48h42v82c0 10-8 18-18 18h-6c-10 0-18-8-18-18V48Z" class="stock-svg-shell" />
      <clipPath id="syringeVerticalClip"><path d="M70 53h30v75c0 7-6 13-13 13h-4c-7 0-13-6-13-13V53Z" /></clipPath>
      <g clip-path="url(#syringeVerticalClip)">
        <rect x="70" y="${fillY}" width="30" height="${fillHeight}" class="stock-svg-fill" />
        <path d="M70 ${fillY + 7}c8-5 14 4 22 0 4-2 6-2 8-1v10H70Z" class="stock-svg-shine" />
      </g>
      <path d="M73 62h24M73 74h14M73 86h24M73 98h14M73 110h24M73 122h14" class="stock-svg-line" />
      <path d="M85 148v18" class="stock-svg-line strong" />
      <path d="M58 166h54" class="stock-svg-line strong" />
      <path d="M52 130h66" class="stock-svg-line strong" />
      <ellipse cx="85" cy="170" rx="30" ry="5" class="stock-svg-shadow" />
    </svg>
  `;
}

function renderPowderStockVisual(percent) {
  const fillHeight = Number((78 * percent / 100).toFixed(2));
  const fillY = Number((122 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 150" role="img" aria-label="Pot de poudre">
      <rect x="52" y="22" width="76" height="18" rx="8" class="stock-svg-cap" />
      <path d="M58 42h64l8 18v62c0 10-8 18-18 18H68c-10 0-18-8-18-18V60l8-18Z" class="stock-svg-shell" />
      <clipPath id="powderClip"><path d="M58 46h64l5 15v59c0 8-7 15-15 15H68c-8 0-15-7-15-15V61l5-15Z" /></clipPath>
      <g clip-path="url(#powderClip)">
        <rect x="52" y="${fillY}" width="76" height="${fillHeight}" class="stock-svg-fill" />
        <circle cx="70" cy="118" r="3" class="stock-svg-dot" />
        <circle cx="88" cy="106" r="2.5" class="stock-svg-dot" />
        <circle cx="104" cy="124" r="3" class="stock-svg-dot" />
        <circle cx="116" cy="112" r="2" class="stock-svg-dot" />
      </g>
    </svg>
  `;
}

function renderUnitStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 10));
  const cells = Array.from({ length: 10 }, (_, index) => {
    const x = 44 + (index % 5) * 20;
    const y = 48 + Math.floor(index / 5) * 24;
    return `<rect x="${x}" y="${y}" width="14" height="14" rx="4" class="${index < activeCount ? "stock-svg-fill" : "stock-svg-empty"}" />`;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Boîte de consommables">
      <path d="M34 38h112v60c0 8-6 14-14 14H48c-8 0-14-6-14-14V38Z" class="stock-svg-shell" />
      <path d="M42 24h96l8 14H34l8-14Z" class="stock-svg-cap" />
      ${cells}
    </svg>
  `;
}

function renderPlateStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 12.5));
  const wells = Array.from({ length: 8 }, (_, index) => {
    const x = 54 + (index % 4) * 22;
    const y = 50 + Math.floor(index / 4) * 22;
    return `<circle cx="${x}" cy="${y}" r="6" class="${index < activeCount ? "stock-svg-fill" : "stock-svg-empty"}" />`;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Plaque laboratoire">
      <rect x="38" y="34" width="104" height="70" rx="14" class="stock-svg-shell" />
      <path d="M48 24h84" class="stock-svg-line strong" />
      <path d="M52 108h76" class="stock-svg-line" />
      ${wells}
    </svg>
  `;
}

function renderTubeRackStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 20));
  const tubes = Array.from({ length: 5 }, (_, index) => {
    const x = 44 + index * 22;
    const cls = index < activeCount ? "stock-svg-fill" : "stock-svg-empty";
    return `
      <g>
        <path d="M${x} 34h14v50c0 8-7 14-7 14s-7-6-7-14V34Z" class="stock-svg-shell" />
        <rect x="${x + 2}" y="${72 - (30 * (index < activeCount ? 1 : 0))}" width="10" height="${index < activeCount ? 30 : 0}" class="${cls}" />
      </g>
    `;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Rack de tubes">
      ${tubes}
      <path d="M34 84h112v24H34z" class="stock-svg-cap" />
      <path d="M40 108h100" class="stock-svg-line strong" />
    </svg>
  `;
}

function renderGenericStockVisual(percent) {
  const fillHeight = Number((62 * percent / 100).toFixed(2));
  const fillY = Number((104 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Contenant générique">
      <path d="M38 42h104v58c0 10-8 18-18 18H56c-10 0-18-8-18-18V42Z" class="stock-svg-shell" />
      <path d="M48 24h84l10 18H38l10-18Z" class="stock-svg-cap" />
      <clipPath id="genericClip"><path d="M44 48h92v50c0 8-6 14-14 14H58c-8 0-14-6-14-14V48Z" /></clipPath>
      <g clip-path="url(#genericClip)">
        <rect x="44" y="${fillY}" width="92" height="${fillHeight}" class="stock-svg-fill" />
      </g>
    </svg>
  `;
}

// Funcion para formatear precios con simbolo de euro, asegurando que el simbolo no se duplique si ya esta presente
function formatPriceEuro(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutEuro = raw.replace("€", "").trim();
  const normalized = withoutEuro
    .replace(/\s/g, "")
    .replace(",", ".");

  const numericOnly = /^\d+(?:\.\d+)?$/.test(normalized);
  if (!numericOnly) return raw;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(normalized));
}

function renderOrderDetailLegacy(order) {
  const item =
    items.find((entry) => entry.id === order.inventoryItemId) ||
    items.find((entry) => entry.name === order.itemName) ||
    null;

  const requestStatusMap = {
    requested: "Nouvelle demande",
    ordered: "Commandé",
    received: "Arrivé"
  };

  const requestStatus = requestStatusMap[order.status] || "Nouvelle demande";
  const requestQuantity = order.requestedQuantity ?? order.quantity ?? "";
  const requestNotes = order.notes?.trim() || "";

  if (!item) {
    return `
      <section class="inventory-detail-panel">
        <div class="detail-topline">
          <button
            class="room-exit-btn"
            type="button"
            onclick="selectOrder(null)"
            aria-label="Retour"
            title="Retour"
          >
            ↩️
          </button>
        </div>

        <div>
          <h4>Demande</h4>
          <div class="item-detail-stack">
            ${renderDetailRow("Statut", requestStatus)}
            ${renderDetailRow("Priorité", order.priority)}
            ${renderDetailRow("Quantité demandée", String(requestQuantity))}
            ${renderDetailRow("Notes", requestNotes)}
          </div>
        </div>

        <div>
          <h4>Item</h4>
          <p>Aucun item lié à cette demande pour le moment.</p>
        </div>
      </section>
    `;
  }

  const status = itemStatus(item);
  const references = normalizeReferences(item.references);
  const percent = Math.min(
    100,
    stockLevelPercent(item)
  );

  return `
    <section class="inventory-detail-panel">
      <div class="detail-topline">
        <button
          class="room-exit-btn"
          type="button"
          onclick="selectOrder(null)"
          aria-label="Retour"
          title="Retour"
        >
          ↩️
        </button>

        <div class="detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openModal('${escapeHtml(item.id)}')">
            Modifier
          </button>
          <button class="primary-btn compact-btn" type="button" onclick="${usesAdvancedStockManager(item) ? `openStockManager('${escapeHtml(item.id)}')` : `openStockModal('${escapeHtml(item.id)}')`}">
            Mettre à jour le stock
          </button>
        </div>
      </div>

      <div>
        <h4>Demande</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Statut", requestStatus)}
          ${renderDetailRow("Priorité", order.priority)}
          ${renderDetailRow("Quantité demandée", String(requestQuantity))}
          ${renderDetailRow("Notes", requestNotes)}
        </div>
      </div>

      <div class="experiment-detail-head">
        <div>
          <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.category)} - ${escapeHtml(formatLocations(item))}</p>
        </div>

        <small>ID: ${escapeHtml(item.id)}</small>
      </div>

      <div class="stock-summary">
        <strong>${item.quantity} ${escapeHtml(item.unit)}</strong>
        <span>Minimum: ${item.minStock} ${escapeHtml(item.unit)}</span>
        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>
      </div>

      ${item.tags?.length ? `
        <div>
          <h4>Tags</h4>
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      ${item.protocol ? `
        <div>
          <h4>Protocole</h4>
          <p>${escapeHtml(item.protocol)}</p>
        </div>
      ` : ""}

      ${item.notes ? `
        <div>
          <h4>Notes</h4>
          <p class="multiline-text">${escapeHtml(item.notes)}</p>
        </div>
      ` : ""}

      <div>
        <h4>Références</h4>

        ${
          references.primary.supplier ||
          references.primary.reference ||
          references.primary.link ||
          references.primary.notes ||
          references.primary.price ||
          references.primary.unitPrice ||
          references.primary.leadTime
            ? `
              <div class="reference-block">
                <strong>Référence principale</strong>

                <div class="item-detail-stack">
                  ${renderSupplierReferenceRow(references.primary.supplier, item)}
                  ${renderDetailRow("Référence", references.primary.reference)}

                  ${references.primary.link ? `
                    <div class="item-detail-row">
                      <span class="item-detail-label">Lien</span>
                      <div class="item-detail-value">
                        <a href="${escapeHtml(references.primary.link)}" target="_blank" rel="noopener noreferrer">
                          ${escapeHtml(references.primary.link)}
                        </a>
                      </div>
                    </div>
                  ` : ""}

                  ${renderDetailRow("Notes", references.primary.notes)}
                  ${renderDetailRow("Prix", formatPriceEuro(references.primary.price))}
                  ${renderDetailRow("Prix unitaire", formatPriceEuro(references.primary.unitPrice))}
                  ${renderDetailRow("Délais de livraison", references.primary.leadTime)}
                </div>
              </div>
            `
            : "<p>Aucune référence principale.</p>"
        }

        ${
          references.secondary.length
            ? `
              <div class="secondary-references">
                ${references.secondary.map((reference, index) => `
                  <div class="reference-block">
                    <strong>Référence secondaire ${index + 1}</strong>
                    <div class="item-detail-stack">
                      ${renderDetailRow("Référence", reference.reference)}
                      ${renderDetailRow("Notes", reference.notes)}
                    </div>
                  </div>
                `).join("")}
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderSamples() {
  const refs = getSampleViewRefs();
  warnMissingSampleViewRefs(refs);

  const query = normalizeSearch(sampleSearchInput?.value || "");
  const type = sampleTypeFilter?.value || "all";
  const category = sampleCategoryFilter?.value || "all";
  const client = sampleClientFilter?.value || "all";
  const sort = sampleSortSelect?.value || "recent";

  clients = migrateClients(clients, clientSamples);
  clientSamples = hydrateClientIdentityForSamples(migrateClientSamples(clientSamples), clients);
  renderClientFilterOptions(client);
  const selectedClient = client === "all"
    ? null
    : clients.find(entry => entry.id === client || entry.normalizedKey === client);

  const filtered = clientSamples
    .filter(sample => {
      const clientRecord = getClientForSample(sample);
      const haystack = normalizeSearch([
        sample.name,
        sample.baseName,
        sample.clientCode,
        sample.rawClientCode,
        sample.canonicalClientCode,
        clientRecord?.canonicalCode,
        sample.category,
        sample.location,
        sample.referenceNumber,
        sample.lotNumber
      ].join(" "));

      return (!query || haystack.includes(query)) &&
        (type === "all" || sample.type === type) &&
        (category === "all" || sample.category === category) &&
        (
          client === "all" ||
          sample.clientId === client ||
          sample.normalizedClientKey === client ||
          (selectedClient && sample.normalizedClientKey === selectedClient.normalizedKey)
        );
    })
    .sort((a, b) => compareClientSamples(a, b, sort));
  const displayUnits = buildClientSampleDisplayUnits(filtered);
  const pageCount = Math.max(1, Math.ceil(displayUnits.length / SAMPLE_PAGE_SIZE));
  sampleCurrentPage = Math.min(Math.max(sampleCurrentPage, 1), pageCount);
  const pageStart = (sampleCurrentPage - 1) * SAMPLE_PAGE_SIZE;
  const pagedUnits = displayUnits.slice(pageStart, pageStart + SAMPLE_PAGE_SIZE);

  const detail = selectedSampleId
    ? clientSamples.find(sample => sample.id === selectedSampleId)
    : null;
  const selectedGroup = selectedSampleGroupId
    ? getReplicaGroupSamples(selectedSampleGroupId)
    : [];

  if (refs.detail) {
    refs.detail.classList.toggle("has-selection", Boolean(detail || selectedGroup.length));
    refs.detail.innerHTML = selectedGroup.length
      ? renderReplicaGroupDetail(selectedSampleGroupId, selectedGroup)
      : detail
      ? renderSampleDetail(getEffectiveClientSample(detail))
      : renderSampleEmptyState();
  }

  renderClientStudyKpis(clientSamples);
  if (refs.resultCount) {
    refs.resultCount.textContent =
      `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;
  }

  if (refs.rows) {
    refs.rows.innerHTML = filtered.length
      ? renderClientSampleGroups(pagedUnits)
      : `<div class="client-study-empty"><div><strong>Aucune étude client</strong><p>Aucun produit ou échantillon ne correspond aux filtres actifs.</p></div></div>`;
  }

  if (refs.pagination) {
    refs.pagination.innerHTML = filtered.length
      ? renderSamplePagination(pageCount, displayUnits.length)
      : "";
  }
}

function getSampleViewRefs() {
  return {
    view: document.querySelector("#samplesView"),
    detail: document.querySelector("#sampleDetail"),
    resultCount: document.querySelector("#sampleResultCount"),
    rows: document.querySelector("#sampleRows"),
    pagination: document.querySelector("#samplePagination"),
    kpis: document.querySelector("#clientStudyKpis")
  };
}

function warnMissingSampleViewRefs(refs) {
  if (samplesDomWarningShown) return;

  const missing = Object.entries(refs)
    .filter(([, element]) => !element)
    .map(([key]) => `#${{
      view: "samplesView",
      detail: "sampleDetail",
      resultCount: "sampleResultCount",
      rows: "sampleRows",
      pagination: "samplePagination",
      kpis: "clientStudyKpis"
    }[key]}`);

  if (!missing.length) return;

  samplesDomWarningShown = true;
  console.warn(
    `Études clients: markup incomplet (${missing.join(", ")}). ` +
    "Vérifier que index.html déployé sur GitHub correspond à script.js."
  );
}

function syncAppViewMode() {
  app.classList.toggle("history-mode", activeView === "history");
  app.classList.toggle("experiments-mode", activeView === "experiments");
  app.classList.toggle("sourcing-mode", activeView === "sourcing");
  app.classList.toggle("samples-mode", activeView === "samples");
  app.classList.toggle("locations-mode", activeView === "locations");
  app.classList.toggle("orders-mode", activeView === "orders");
  app.classList.toggle("contacts-mode", activeView === "contacts");
  app.classList.toggle("agents-mode", activeView === "agents");
  app.classList.toggle("backups-mode", activeView === "backups");
  app.classList.remove("location-detail-mode");
  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(selectedItemId));
}

function renderSampleDetail(sample) {
  const clientRecord = getClientForSample(sample);
  const clientCode = getSampleCanonicalClientCode(sample);
  const sampleSubtitle = getClientSampleCategoryLabel(sample) || getClientSampleSubLabel(sample);

  return `
    <div class="client-detail-header">
      <div>
        <div class="client-detail-meta">
          <span class="client-type-badge ${escapeHtml(sample.type)}">${escapeHtml(clientSampleTypes[sample.type] || sample.type)}</span>
          <span class="result-pill">Client : ${escapeHtml(clientCode)}</span>
        </div>
        <h3>${escapeHtml(sample.name)}</h3>
        <p class="category">${escapeHtml(sampleSubtitle)}</p>
      </div>
    </div>

    <div class="client-detail-section">
      <h4>Informations</h4>
      <div class="item-detail-stack">
        ${renderDetailRow("Client", clientCode)}
        ${renderDetailRow("Date", formatDisplayDateFrench(formatClientSampleDate(sample)))}
        ${renderDetailRow("Quantité / format", formatSampleDisplayQuantity(sample))}
        ${renderDetailRow("Localisation", sample.location)}
        ${renderDetailRow("Identifiant client", clientRecord?.id)}
      </div>
    </div>

    ${sample.generalNotes ? `
      <div class="client-detail-section">
        <h4>Notes générales du groupe</h4>
        <p>${escapeHtml(sample.generalNotes)}</p>
      </div>
    ` : ""}

    ${sample.notes ? `
      <div class="client-detail-section">
        <h4>${sample.replicaNumber ? "Notes spécifiques du réplicat" : "Notes"}</h4>
        <p class="multiline-text">${escapeHtml(sample.notes)}</p>
      </div>
    ` : ""}

    <div class="client-detail-bottom-actions">
      <button class="ghost-btn compact-btn" type="button" onclick="openSampleModal('${escapeHtml(sample.id)}')">Modifier</button>
      <button class="danger-btn compact-btn" type="button" onclick="deleteSampleFromDetail('${escapeHtml(sample.id)}')">Supprimer</button>
    </div>
  `;
}

function renderSampleEmptyState() {
  return `
    <div class="client-study-empty">
      <div>
        <strong>Sélectionnez une ligne</strong>
        <p>Le détail du produit ou de l'échantillon client apparaîtra ici.</p>
      </div>
    </div>
  `;
}

function renderClientStudyKpis(samples) {
  const kpiContainer = document.querySelector("#clientStudyKpis");
  if (!kpiContainer) return;

  const productCount = samples.filter(sample => sample.type === "client_product").length;
  const createdCount = samples.filter(sample => sample.type === "created_sample").length;
  const activeClients = new Set(samples.map(sample => sample.clientId || sample.normalizedClientKey).filter(Boolean)).size;
  const usedLocations = new Set(samples.map(sample => sample.location).filter(Boolean)).size;

  const kpis = [
    ["📦", "Produits", productCount],
    ["🧪", "Échantillons", createdCount],
    ["🏷️", "Clients actifs", activeClients],
    ["📍", "Localisations", usedLocations]
  ];

  kpiContainer.innerHTML = kpis.map(([icon, label, value]) => `
    <article class="client-kpi-card">
      <span class="client-kpi-icon">${icon}</span>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    </article>
  `).join("");
}

function renderClientFilterOptions(selectedValue = sampleClientFilter?.value || "all") {
  if (!sampleClientFilter) return;

  const sortedClients = [...clients].sort((a, b) =>
    String(a.canonicalCode || "").localeCompare(String(b.canonicalCode || ""), "fr")
  );

  sampleClientFilter.innerHTML = `
    <option value="all">Tous clients</option>
    ${sortedClients.map(client => `
      <option value="${escapeHtml(client.id)}">${escapeHtml(client.canonicalCode)}</option>
    `).join("")}
  `;

  sampleClientFilter.value = [...sampleClientFilter.options].some(option => option.value === selectedValue)
    ? selectedValue
    : "all";
}

function resetSamplePagination() {
  sampleCurrentPage = 1;
  renderSamples();
}

function setSamplePage(page) {
  sampleCurrentPage = page;
  renderSamples();
  document.querySelector("#samplesView")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function buildClientSampleDisplayUnits(samples) {
  const familyBuckets = new Map();
  const familyKeysBySampleId = new Map();

  samples.forEach(sample => {
    const familyKey = getReplicaFamilyKey(sample);
    if (!familyKey) return;

    if (!familyBuckets.has(familyKey)) {
      familyBuckets.set(familyKey, []);
    }

    familyBuckets.get(familyKey).push(sample);
    familyKeysBySampleId.set(sample.id, familyKey);
  });

  const realReplicaFamilies = new Set(
    Array.from(familyBuckets.entries())
      .filter(([, entries]) => entries.length > 1)
      .map(([familyKey]) => familyKey)
  );
  const emittedFamilies = new Set();
  const units = [];

  samples.forEach(sample => {
    const familyKey = familyKeysBySampleId.get(sample.id);

    if (!familyKey || !realReplicaFamilies.has(familyKey)) {
      units.push(createSingleSampleUnit(sample));
      return;
    }

    if (emittedFamilies.has(familyKey)) return;

    const familySamples = [...familyBuckets.get(familyKey)]
      .sort(compareReplicaSamples);
    units.push(createReplicaFamilyUnit(familyKey, familySamples));
    emittedFamilies.add(familyKey);
  });

  return units;
}

function createSingleSampleUnit(sample) {
  const clientRecord = getClientForSample(sample);
  const clientGroupKey = clientRecord?.id || sample.normalizedClientKey || "client-unknown";

  return {
    kind: "sample",
    key: `sample-${sample.id}`,
    clientGroupKey,
    clientCode: getSampleCanonicalClientCode(sample),
    sample,
    count: 1
  };
}

function createReplicaFamilyUnit(familyKey, samples) {
  const firstSample = samples[0];
  const clientRecord = getClientForSample(firstSample);
  const clientGroupKey = clientRecord?.id || firstSample.normalizedClientKey || "client-unknown";

  return {
    kind: "replicaFamily",
    key: familyKey,
    clientGroupKey,
    clientCode: getSampleCanonicalClientCode(firstSample),
    baseName: getReplicaBaseName(firstSample),
    samples,
    count: samples.length
  };
}

function getReplicaFamilyKey(sample) {
  if (sample?.type !== "created_sample") return "";
  if (sample.groupId) return sample.groupId;
  const baseName = getReplicaBaseName(sample);
  if (!baseName || baseName === sample.name && Number(sample.replicaCount || 1) <= 1 && !sample.replicaNumber) return "";

  const clientKey = getClientForSample(sample)?.id || sample.normalizedClientKey || "client-unknown";
  return [
    "replica",
    clientKey,
    sample.type,
    sample.category || "none",
    sample.creationDate || "no-date",
    sample.location || "no-location",
    baseName
  ].map(toSafeKeyPart).join("-");
}

function getReplicaBaseName(sample) {
  const sampleName = String(sample?.name || "").trim();
  const explicitBaseName = String(sample?.baseName || "").trim();
  if (explicitBaseName && explicitBaseName !== sampleName) return explicitBaseName;

  return (explicitBaseName || sampleName).replace(/\s+\d+$/, "").trim();
}

function compareReplicaSamples(a, b) {
  const replicaA = Number(a.replicaNumber || 0);
  const replicaB = Number(b.replicaNumber || 0);
  if (replicaA || replicaB) return replicaA - replicaB;
  return String(a.name || "").localeCompare(String(b.name || ""), "fr", { numeric: true });
}

function toSafeKeyPart(value) {
  return normalizeSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "x";
}

function renderClientSampleGroups(units) {
  const groups = new Map();

  units.forEach(unit => {
    const groupKey = unit.clientGroupKey;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        code: unit.clientCode,
        units: [],
        sampleCount: 0
      });
    }
    groups.get(groupKey).units.push(unit);
    groups.get(groupKey).sampleCount += unit.count;
  });

  return Array.from(groups.entries()).map(([groupKey, group]) => {
    const isCollapsed = collapsedClientGroups.has(groupKey);
    return `
      <section class="client-group ${isCollapsed ? "is-collapsed" : ""}">
        <button
          class="client-group-header"
          type="button"
          aria-expanded="${isCollapsed ? "false" : "true"}"
          aria-label="${isCollapsed ? "Déplier" : "Replier"} le client ${escapeHtml(group.code)}"
          onclick="toggleClientGroup('${escapeHtml(groupKey)}')"
        >
          <span class="client-group-title">
            <span class="client-group-chevron" aria-hidden="true">›</span>
            <span class="client-group-label">Client</span>
            <strong>${escapeHtml(group.code)}</strong>
          </span>
          <span>${group.sampleCount} élément${group.sampleCount > 1 ? "s" : ""}</span>
        </button>
        ${isCollapsed ? "" : group.units.map(renderClientDisplayUnit).join("")}
      </section>
    `;
  }).join("");
}

function renderClientDisplayUnit(unit) {
  return unit.kind === "replicaFamily"
    ? renderReplicaFamilyRow(unit)
    : renderClientSampleRow(unit.sample);
}

function renderReplicaFamilyRow(unit) {
  const isExpanded = expandedReplicaGroups.has(unit.key);
  const firstSample = getEffectiveClientSample(unit.samples[0]);
  const isSelected = selectedSampleGroupId === unit.key;
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(firstSample)) || "—";
  const locations = Array.from(new Set(unit.samples.map(sample => sample.location).filter(Boolean)));
  const categoryTag = `<span class="client-type-badge created_sample sample-category-${getClientSampleCategoryColorKey(firstSample)}">${escapeHtml(getClientSampleCategoryLabel(firstSample) || "—")}</span>`;

  return `
    <div class="replica-family-block">
      <button
        class="client-sample-row replica-family-row ${isSelected ? "active" : ""}"
        type="button"
        aria-expanded="${isExpanded ? "true" : "false"}"
        onclick="selectReplicaGroup('${escapeHtml(unit.key)}')"
      >
        <div class="client-sample-main">
          <strong title="${escapeHtml(unit.baseName)}">${escapeHtml(unit.baseName)}</strong>
          <div class="client-sample-subline">
            <span class="client-type-badge ${escapeHtml(firstSample.type)}">${escapeHtml(clientSampleTypes[firstSample.type] || firstSample.type)}</span>
            <span class="client-replica-count">${unit.count} réplicat${unit.count > 1 ? "s" : ""}</span>
            <span
              class="client-sample-cell-muted replica-toggle-action"
              role="button"
              tabindex="0"
              onclick="event.stopPropagation(); toggleReplicaGroup('${escapeHtml(unit.key)}')"
              onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); toggleReplicaGroup('${escapeHtml(unit.key)}'); }"
            >${isExpanded ? "Replier" : "Déplier"}</span>
            <span
              class="client-delete-group-action"
              role="button"
              tabindex="0"
              onclick="event.stopPropagation(); deleteReplicaFamily('${escapeHtml(unit.key)}')"
              onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); deleteReplicaFamily('${escapeHtml(unit.key)}'); }"
            >
              Supprimer les réplicats
            </span>
          </div>
        </div>

        <span class="client-table-cell" data-label="Catégorie"><span class="client-quantity-category-value">${categoryTag}</span></span>
        <span class="client-table-cell" data-label="Localisation">${escapeHtml(locations.join(", ") || "—")}</span>
        <span class="client-table-cell" data-label="Date">${escapeHtml(formattedDate)}</span>
      </button>

      ${isExpanded ? `
        <div class="replica-child-list">
          ${unit.samples.map(sample => renderClientSampleRow(sample, { isReplicaChild: true })).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderClientSampleRow(sample, options = {}) {
  sample = getEffectiveClientSample(sample);
  const isSelected = selectedSampleId === sample.id;
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(sample)) || "—";
  const formattedQuantity = formatSampleDisplayQuantity(sample) || "—";
  const middleCell = sample.type === "created_sample"
    ? `<span class="client-type-badge created_sample sample-category-${getClientSampleCategoryColorKey(sample)}">${escapeHtml(getClientSampleCategoryLabel(sample) || "—")}</span>`
    : escapeHtml(formattedQuantity);

  return `
    <button
      class="client-sample-row ${options.isReplicaChild ? "replica-child-row" : ""} ${isSelected ? "active" : ""}"
      type="button"
      onclick="openSampleDetail('${escapeHtml(sample.id)}', { view: 'samples' })"
    >
      <div class="client-sample-main">
        <strong title="${escapeHtml(sample.name)}">${escapeHtml(sample.name)}</strong>
        <div class="client-sample-subline">
          <span class="client-type-badge ${escapeHtml(sample.type)}">${escapeHtml(clientSampleTypes[sample.type] || sample.type)}</span>
          <span>${escapeHtml(getClientSampleSubLabel(sample))}</span>
          ${isSelected ? `<span class="client-selected-pill"><span aria-hidden="true">✓</span> Sélectionné</span>` : ""}
        </div>
      </div>

      <span class="client-table-cell" data-label="${sample.type === "created_sample" ? "Catégorie" : "Quantité"}"><span class="client-quantity-category-value">${middleCell}</span></span>
      <span class="client-table-cell" data-label="Localisation">${escapeHtml(sample.location || "—")}</span>
      <span class="client-table-cell" data-label="Date">${escapeHtml(formattedDate)}</span>
    </button>
  `;
}

function toggleReplicaGroup(groupKey) {
  if (expandedReplicaGroups.has(groupKey)) {
    expandedReplicaGroups.delete(groupKey);
  } else {
    expandedReplicaGroups.add(groupKey);
  }
  renderSamples();
}

function openDeleteConfirmation(options = {}) {
  if (!confirmDeleteDialog || confirmDeleteDialog.open || deleteConfirmationPending) return;

  deleteConfirmationTrigger = options.trigger instanceof HTMLElement
    ? options.trigger
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  deleteConfirmationAction = typeof options.onConfirm === "function"
    ? options.onConfirm
    : null;

  confirmDeleteTitle.textContent = options.title || "Confirmer la suppression";
  confirmDeleteMessage.textContent = options.message || "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.";
  confirmDeleteBtn.textContent = options.confirmText || "Supprimer";
  confirmDeleteError.textContent = "";
  confirmDeleteError.classList.add("hidden");
  setDeleteConfirmationPending(false);

  confirmDeleteDialog.classList.remove("is-closing");
  confirmDeleteDialog.classList.add("is-opening");
  confirmDeleteDialog.showModal();
  window.setTimeout(() => confirmDeleteDialog.classList.remove("is-opening"), 160);
  cancelConfirmDeleteBtn.focus();
}

function setDeleteConfirmationPending(isPending) {
  deleteConfirmationPending = isPending;
  confirmDeleteBtn.disabled = isPending;
  cancelConfirmDeleteBtn.disabled = isPending;
  closeConfirmDeleteBtn.disabled = isPending;
  confirmDeleteBtn.setAttribute("aria-busy", String(isPending));
}

async function confirmDeleteAction() {
  if (deleteConfirmationPending || !deleteConfirmationAction) return;
  setDeleteConfirmationPending(true);
  confirmDeleteError.textContent = "";
  confirmDeleteError.classList.add("hidden");

  try {
    await deleteConfirmationAction();
    closeDeleteConfirmation({ force: true });
  } catch (error) {
    confirmDeleteError.textContent = error?.message || "La suppression n’a pas pu être effectuée. Veuillez réessayer.";
    confirmDeleteError.classList.remove("hidden");
    setDeleteConfirmationPending(false);
    confirmDeleteBtn.focus();
  }
}

function closeDeleteConfirmation(options = {}) {
  if (!confirmDeleteDialog?.open || deleteConfirmationPending && !options.force) return;
  confirmDeleteDialog.classList.remove("is-opening");
  confirmDeleteDialog.classList.add("is-closing");
  window.setTimeout(() => {
    if (confirmDeleteDialog.open) confirmDeleteDialog.close();
    confirmDeleteDialog.classList.remove("is-closing");
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 120);
}

function restoreDeleteConfirmationFocus() {
  setDeleteConfirmationPending(false);
  deleteConfirmationAction = null;
  const trigger = deleteConfirmationTrigger;
  deleteConfirmationTrigger = null;
  if (trigger?.isConnected) trigger.focus();
}

function deleteReplicaFamily(groupKey) {
  const familySamples = clientSamples.filter(sample => getReplicaFamilyKey(sample) === groupKey);
  if (!familySamples.length) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer ce groupe et ses ${familySamples.length} réplicat${familySamples.length > 1 ? "s" : ""} ? Cette action est irréversible.`,
    onConfirm: () => performReplicaFamilyDeletion(groupKey)
  });
}

function performReplicaFamilyDeletion(groupKey) {
  const familySamples = clientSamples.filter(sample => getReplicaFamilyKey(sample) === groupKey);
  if (!familySamples.length) throw new Error("Ce groupe de réplicats n’existe plus.");

  const deletedIds = new Set(familySamples.map(sample => sample.id));
  const baseName = getReplicaBaseName(familySamples[0]) || familySamples[0].name;
  clientSamples = clientSamples.filter(sample => !deletedIds.has(sample.id));

  addHistory(
    "Échantillons clients supprimés",
    `${currentName} a supprimé ${familySamples.length} réplicat${familySamples.length > 1 ? "s" : ""} ${baseName} des études clients.`
  );

  if (selectedSampleId && deletedIds.has(selectedSampleId)) {
    selectedSampleId = null;
  }
  if (selectedSampleGroupId === groupKey) {
    selectedSampleGroupId = null;
  }

  persist();
  render();
}

function deleteSampleFromDetail(id) {
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const message = sample.replicaNumber
    ? `Êtes-vous sûr de vouloir supprimer uniquement le réplicat ${sample.replicaNumber} ? Cette action est irréversible.`
    : `Êtes-vous sûr de vouloir supprimer “${sample.name}” de cette étude client ? Cette action est irréversible.`;
  openDeleteConfirmation({
    message,
    onConfirm: () => performSampleDeletion(id, { closeModal: false })
  });
}

function performSampleDeletion(id, options = {}) {
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) throw new Error("Ce produit ou échantillon n’existe plus.");

  clientSamples = clientSamples.filter(entry => entry.id !== id);

  addHistory("Produit client supprimé", `${currentName} a supprimé ${sample.name} des études clients.`);
  selectedSampleId = null;
  persist();
  if (options.closeModal) sampleDialog.close();
  render();
}

function formatReplicaFamilyQuantity(samples) {
  const units = new Set(samples.map(sample => sample.measureUnit || sample.unit).filter(Boolean));
  if (units.size !== 1) return `${samples.length} réplicats`;

  const unit = Array.from(units)[0];
  const total = samples.reduce((sum, sample) => sum + Number(sample.measureValue ?? sample.quantity ?? 0), 0);
  return formatFrenchQuantity(total, unit);
}

function toggleClientGroup(groupKey) {
  if (collapsedClientGroups.has(groupKey)) {
    collapsedClientGroups.delete(groupKey);
  } else {
    collapsedClientGroups.add(groupKey);
  }
  renderSamples();
}

function renderSamplePagination(pageCount, totalRows) {
  if (pageCount <= 1) {
    return `<div class="pagination-summary">${totalRows} ligne${totalRows > 1 ? "s" : ""}</div>`;
  }

  const pages = getVisibleSamplePages(pageCount);

  return `
    <div class="pagination-summary">
      Page ${sampleCurrentPage} sur ${pageCount} · ${totalRows} ligne${totalRows > 1 ? "s" : ""}
    </div>
    <div class="pagination-controls">
      <button class="ghost-btn compact-btn" type="button" onclick="setSamplePage(${sampleCurrentPage - 1})" ${sampleCurrentPage === 1 ? "disabled" : ""}>Précédent</button>
      ${pages.map(page => page === "ellipsis"
        ? `<span class="pagination-ellipsis">…</span>`
        : `<button class="pagination-page ${page === sampleCurrentPage ? "active" : ""}" type="button" onclick="setSamplePage(${page})">${page}</button>`
      ).join("")}
      <button class="ghost-btn compact-btn" type="button" onclick="setSamplePage(${sampleCurrentPage + 1})" ${sampleCurrentPage === pageCount ? "disabled" : ""}>Suivant</button>
    </div>
  `;
}

function getVisibleSamplePages(pageCount) {
  const pages = new Set([1, pageCount]);
  for (let page = sampleCurrentPage - 2; page <= sampleCurrentPage + 2; page += 1) {
    if (page >= 1 && page <= pageCount) pages.add(page);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    if (index === 0) return [page];
    return page - sorted[index - 1] > 1 ? ["ellipsis", page] : [page];
  });
}

function compareClientSamples(a, b, sort) {
  if (sort === "oldest") return getClientSampleTime(a) - getClientSampleTime(b);
  if (sort === "client-az") {
    return getSampleCanonicalClientCode(a).localeCompare(getSampleCanonicalClientCode(b), "fr") ||
      getClientSampleTime(b) - getClientSampleTime(a);
  }
  if (sort === "client-za") {
    return getSampleCanonicalClientCode(b).localeCompare(getSampleCanonicalClientCode(a), "fr") ||
      getClientSampleTime(b) - getClientSampleTime(a);
  }
  return getClientSampleTime(b) - getClientSampleTime(a);
}

function getClientSampleSubLabel(sample) {
  if (sample.type === "created_sample") return getClientSampleCategoryLabel(sample) || "Échantillon créé";
  return [sample.referenceNumber, sample.lotNumber].filter(Boolean).join(" · ") || "Produit reçu du client";
}

function getClientSampleCategoryLabel(sample) {
  if (!sample || sample.category !== "ARN") return sample?.category || "";
  return sample.arnQiazol === false ? "ARN extrait" : "ARN + Qiazol";
}

function getClientSampleCategoryColorKey(sample) {
  if (sample?.category === "ARN") return "arn";
  if (sample?.category === "Sécrétion") return "secretion";
  if (sample?.category === "cDNA") return "cdna";
  if (["Fixation (galette)", "Fixation (tissu)"].includes(sample?.category)) return "fixation";
  return "default";
}

function renderHistory() {
  const historyList = document.querySelector("#historyList");
  if (!historyList) return;

  syncHistoryCustomDates();
  renderHistoryUserOptions();
  const allEntries = getDisplayHistoryEntries();
  const filteredEntries = getFilteredHistoryEntries(allEntries);
  renderHistoryMetrics(allEntries);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / historyPageSize));
  historyCurrentPage = Math.min(Math.max(1, historyCurrentPage), totalPages);
  const startIndex = (historyCurrentPage - 1) * historyPageSize;
  const pageEntries = filteredEntries.slice(startIndex, startIndex + historyPageSize);

  document.querySelector("#historyResultCount").textContent = formatHistoryCount(filteredEntries.length);

  if (!allEntries.length) {
    historyList.innerHTML = `
      <div class="history-empty-state">
        <strong>Aucune modification enregistrée</strong>
        <p>Les prochaines actions réalisées dans l’inventaire apparaîtront ici.</p>
      </div>
    `;
  } else if (!pageEntries.length) {
    historyList.innerHTML = `
      <div class="history-empty-state">
        <strong>Aucune action trouvée</strong>
        <p>Modifiez votre recherche ou vos filtres.</p>
        <button class="ghost-btn compact-btn" type="button" data-reset-history>Réinitialiser les filtres</button>
      </div>
    `;
  } else {
    historyList.innerHTML = renderHistoryGroups(pageEntries);
  }

  bindHistoryEntryEvents(historyList);
  renderHistoryPagination(filteredEntries.length, startIndex, pageEntries.length);
}

function getDisplayHistoryEntries() {
  return history
    .map((entry, index) => ({
      ...entry,
      _index: index,
      _date: parseHistoryDate(entry.date),
      _type: getHistoryActionType(entry.action),
      _stock: parseHistoryStockMovement(entry.detail)
    }))
    .filter(entry => !["Connexion", "Deconnexion", "Déconnexion"].includes(entry.action))
    .sort((a, b) => {
      const timeA = a._date?.getTime();
      const timeB = b._date?.getTime();
      if (Number.isFinite(timeA) && Number.isFinite(timeB)) return timeB - timeA || a._index - b._index;
      if (Number.isFinite(timeA)) return -1;
      if (Number.isFinite(timeB)) return 1;
      return a._index - b._index;
    });
}

function parseHistoryDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\D+(\d{1,2})[:h](\d{2}))?/);
  if (match) {
    const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
    const date = new Date(year, Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTimeFrench(value, fallback = "Date inconnue") {
  const raw = typeof value === "string" ? value.trim() : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
  }
  let date = null;
  if (value instanceof Date) date = new Date(value.getTime());
  else if (typeof value === "number" && Number.isFinite(value)) date = new Date(value);
  else if (value !== null && value !== undefined && String(value).trim()) date = parseHistoryDate(value);
  if (!date || Number.isNaN(date.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date).replace(/\s(?:à|,)?\s(?=\d{2}:\d{2}$)/, " · ");
  } catch {
    return fallback;
  }
}

function getHistoryActionType(action) {
  const normalized = normalizeSearch(action || "");
  if (normalized.includes("supprim")) return "deletion";
  if (normalized.includes("stock") || normalized.includes("consomm")) return "stock";
  if (normalized.includes("ajout") || normalized.includes("cree") || normalized.includes("creee")) return "addition";
  return "modification";
}

function getHistoryTypePresentation(type) {
  return {
    addition: { label: "Ajout", icon: "addition" },
    modification: { label: "Modification", icon: "modification" },
    stock: { label: "Stock", icon: "stock" },
    deletion: { label: "Suppression", icon: "deletion" }
  }[type] || { label: "Modification", icon: "modification" };
}

function parseHistoryStockMovement(detail) {
  const match = String(detail || "").match(/Stock\s*:\s*(-?[\d.,]+)\s*->\s*(-?[\d.,]+)\s*([^.]*)/i);
  if (!match) return null;
  const previous = Number(match[1].replace(",", "."));
  const next = Number(match[2].replace(",", "."));
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return null;
  return { previous, next, variation: next - previous, unit: match[3].trim() };
}

function getHistoryPeriodBounds() {
  const now = new Date();
  let start = null;
  let end = null;
  const period = historyPeriodFilter?.value || "all";

  if (period === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "7" || period === "30") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Number(period) - 1));
  }

  if (period === "custom") {
    if (historyDateStart?.value) start = new Date(`${historyDateStart.value}T00:00:00`);
    if (historyDateEnd?.value) end = new Date(`${historyDateEnd.value}T23:59:59.999`);
  }
  return { start, end };
}

function getFilteredHistoryEntries(entries = getDisplayHistoryEntries()) {
  const query = normalizeSearch(historySearchInput?.value || "");
  const actionType = historyActionFilter?.value || "all";
  const user = historyUserFilter?.value || "all";
  const { start, end } = getHistoryPeriodBounds();

  return entries.filter(entry => {
    const timestamp = entry._date?.getTime();
    const searchable = normalizeSearch([entry.action, entry.detail, entry.user, getHistoryElement(entry).name].join(" "));
    return (!query || searchable.includes(query)) &&
      (actionType === "all" || entry._type === actionType) &&
      (user === "all" || entry.user === user) &&
      (!start || (Number.isFinite(timestamp) && timestamp >= start.getTime())) &&
      (!end || (Number.isFinite(timestamp) && timestamp <= end.getTime()));
  });
}

function renderHistoryUserOptions() {
  if (!historyUserFilter) return;
  const selected = historyUserFilter.value || "all";
  const users = Array.from(new Set(history.map(entry => entry.user).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  historyUserFilter.innerHTML = `<option value="all">Tous les utilisateurs</option>${users
    .map(user => `<option value="${escapeHtml(user)}">${escapeHtml(user)}</option>`).join("")}`;
  historyUserFilter.value = users.includes(selected) ? selected : "all";
}

function renderHistoryMetrics(entries) {
  const container = document.querySelector("#historyMetrics");
  if (!container) return;
  const { start, end } = getHistoryPeriodBounds();
  const periodEntries = entries.filter(entry => {
    const timestamp = entry._date?.getTime();
    return (!start || (Number.isFinite(timestamp) && timestamp >= start.getTime())) &&
      (!end || (Number.isFinite(timestamp) && timestamp <= end.getTime()));
  });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const metrics = [
    ["today", "Actions aujourd’hui", entries.filter(entry => entry._date && entry._date >= todayStart).length],
    ["stock", "Mises à jour du stock", periodEntries.filter(entry => entry._type === "stock").length],
    ["modification", "Modifications", periodEntries.filter(entry => entry._type === "modification").length],
    ["deletion", "Suppressions", periodEntries.filter(entry => entry._type === "deletion").length]
  ];
  container.innerHTML = metrics.map(([type, label, value]) => `
    <article class="client-kpi-card history-kpi-card ${type}">
      <span class="client-kpi-icon" aria-hidden="true">${renderHistoryIcon(type)}</span>
      <div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>
    </article>
  `).join("");
}

function renderHistoryIcon(type) {
  const icons = {
    today: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/></svg>`,
    addition: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>`,
    modification: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 16-.8 4 4-.8L18.5 7.9a2 2 0 0 0-2.8-2.8L4 16Zm9.8-8 2.8 2.8"/></svg>`,
    stock: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8"/></svg>`,
    deletion: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>`,
    chevron: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg>`
  };
  return icons[type] || icons.modification;
}

function renderHistoryGroups(entries) {
  const groups = new Map();
  entries.forEach(entry => {
    const key = entry._date ? historyDayKey(entry._date) : "date-inconnue";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  return Array.from(groups.values()).map(group => `
    <section class="history-day-group">
      <header class="history-day-header">
        <h4>${escapeHtml(formatHistoryDayLabel(group[0]._date))}</h4>
        <span class="history-day-count">${escapeHtml(formatHistoryCount(group.length))}</span>
      </header>
      <div class="history-day-entries">${group.map(renderHistoryEntry).join("")}</div>
    </section>
  `).join("");
}

function historyDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHistoryDayLabel(date) {
  if (!date) return "Date inconnue";
  const today = new Date();
  const isToday = historyDayKey(date) === historyDayKey(today);
  const formatted = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
  const label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  return isToday ? `Aujourd’hui · ${label.replace(/^[^ ]+ /, "")}` : label;
}

function renderHistoryEntry(entry) {
  const presentation = getHistoryTypePresentation(entry._type);
  const element = getHistoryElement(entry);
  const entryKey = `${entry._index}-${entry.date}-${entry.action}`;
  const isExpanded = expandedHistoryEntries.has(entryKey);
  const detail = formatHistoryDescription(entry);
  const userAvatar = getHistoryUserAvatar(entry.user);
  const time = entry._date
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(entry._date)
    : entry.date;

  return `
    <article class="history-log-entry ${entry._type}">
      <div class="history-log-main">
        <time class="history-log-time" datetime="${entry._date?.toISOString() || ""}">${escapeHtml(time)}</time>
        <span class="history-action-icon" aria-hidden="true">${renderHistoryIcon(presentation.icon)}</span>
        <span class="history-type-badge ${entry._type}">${presentation.label}</span>
        <div class="history-log-content">
          ${renderHistoryElementTitle(element, entry)}
          <p>${escapeHtml(detail)}</p>
        </div>
        <div class="history-stock-cell">${entry._stock ? renderHistoryStockMovement(entry._stock) : ""}</div>
        <div class="history-user-identity">
          <span class="history-user-avatar ${userAvatar.type}" aria-hidden="true">${escapeHtml(userAvatar.value)}</span>
          <span>${escapeHtml(entry.user || "Utilisateur inconnu")}</span>
        </div>
        <button class="history-chevron-btn ${isExpanded ? "is-open" : ""}" type="button"
          data-history-details="${escapeHtml(entryKey)}" aria-expanded="${isExpanded}"
          aria-label="${isExpanded ? "Masquer les détails" : "Afficher les détails"}">
          ${renderHistoryIcon("chevron")}
        </button>
      </div>
      ${renderHistoryDetails(entry, isExpanded)}
    </article>
  `;
}

function renderHistoryDetails(entry, isExpanded) {
  return `
    <div class="history-entry-details ${isExpanded ? "" : "hidden"}">
      <div><span>Type d’action</span><strong>${escapeHtml(entry.action)}</strong></div>
      <div><span>Date complète</span><strong>${escapeHtml(entry.date)}</strong></div>
      ${entry._stock ? `
        <div><span>Ancienne valeur</span><strong>${escapeHtml(formatHistoryStockValue(entry._stock.previous, entry._stock.unit))}</strong></div>
        <div><span>Nouvelle valeur</span><strong>${escapeHtml(formatHistoryStockValue(entry._stock.next, entry._stock.unit))}</strong></div>
      ` : ""}
    </div>
  `;
}

function getHistoryElement(entry) {
  const detail = normalizeSearch(entry.detail || "");
  const candidates = [
    ...items.map(record => ({ kind: "item", record })),
    ...clientSamples.map(record => ({ kind: "sample", record }))
  ].filter(candidate => candidate.record?.name && detail.includes(normalizeSearch(candidate.record.name)))
    .sort((a, b) => b.record.name.length - a.record.name.length);
  if (candidates.length) return { kind: candidates[0].kind, id: candidates[0].record.id, name: candidates[0].record.name };

  const stockName = String(entry.detail || "").match(/\bpour\s+(.+?)\s+\([^)]*\)\.\s*Stock/i)?.[1];
  const deletedName = entry._type === "deletion"
    ? String(entry.detail || "").match(/\ba supprim[eé]\s+(?:la demande pour\s+)?(.+?)(?:\s+de l['’]inventaire|\s+des études clients|\.)$/i)?.[1]
    : "";
  return { kind: null, id: null, name: stockName || deletedName || entry.action || "Action historique" };
}

function formatHistoryDescription(entry) {
  const corrected = String(entry.detail || "").replace(" a supprime ", " a supprimé ");
  const withoutTechnicalStock = entry._stock
    ? corrected.replace(/\s*Stock\s*:\s*-?[\d.,]+\s*->\s*-?[\d.,]+\s*[^.]*\./i, "").trim()
    : corrected;
  const userPrefix = `${entry.user || ""} a `;
  const concise = withoutTechnicalStock.toLocaleLowerCase("fr").startsWith(userPrefix.toLocaleLowerCase("fr"))
    ? withoutTechnicalStock.slice(userPrefix.length)
    : withoutTechnicalStock;
  return concise ? concise.charAt(0).toUpperCase() + concise.slice(1) : withoutTechnicalStock;
}

function renderHistoryElementTitle(element, entry) {
  if (element.id) {
    return `<button class="history-element-link" type="button" data-history-kind="${element.kind}" data-history-id="${escapeHtml(element.id)}">${escapeHtml(element.name)}</button>`;
  }
  return `<strong class="history-element-name">${escapeHtml(element.name)}</strong>${entry._type === "deletion" ? `<span class="history-deleted-label">Élément supprimé</span>` : ""}`;
}

function renderHistoryStockMovement(stock) {
  const sign = stock.variation > 0 ? "+" : stock.variation < 0 ? "−" : "";
  const variation = `${sign}${Math.abs(stock.variation)}${stock.unit ? ` ${stock.unit}` : ""}`;
  const direction = stock.variation > 0 ? "increase" : stock.variation < 0 ? "decrease" : "neutral";
  return `
    <div class="history-stock-movement ${direction}">
      <span>${escapeHtml(formatHistoryStockValue(stock.previous, stock.unit))} → ${escapeHtml(formatHistoryStockValue(stock.next, stock.unit))}</span>
      <strong class="history-stock-variation">${escapeHtml(variation)}</strong>
    </div>
  `;
}

function formatHistoryStockValue(value, unit) {
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function getHistoryUserInitials(user) {
  const parts = String(user || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || "?";
  return parts.map(part => part.charAt(0)).join("").slice(0, 2).toUpperCase() || "?";
}

function getHistoryUserAvatar(userName) {
  const normalizedName = normalizeSearch(String(userName || "").trim());
  const matchedName = Object.keys(userIcons).find(name => normalizeSearch(name.trim()) === normalizedName);
  const icon = matchedName ? userIcons[matchedName] : "";
  if (icon) return { type: "emoji", value: icon };
  return { type: "initials", value: getHistoryUserInitials(userName) };
}

function formatHistoryCount(count) {
  return `${count} ${count === 1 ? "action" : "actions"}`;
}

function bindHistoryEntryEvents(historyList) {
  historyList.querySelector("[data-reset-history]")?.addEventListener("click", resetHistoryFilters);
  historyList.querySelectorAll("[data-history-details]").forEach(button => button.addEventListener("click", () => {
    const key = button.dataset.historyDetails;
    if (expandedHistoryEntries.has(key)) expandedHistoryEntries.delete(key);
    else expandedHistoryEntries.add(key);
    renderHistory();
  }));
  historyList.querySelectorAll("[data-history-kind][data-history-id]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.historyKind === "item") openItemDetail(button.dataset.historyId, { view: "history" });
    if (button.dataset.historyKind === "sample") openSampleDetail(button.dataset.historyId, { view: "history" });
  }));
}

function renderHistoryPagination(total, startIndex, pageLength) {
  const pagination = document.querySelector("#historyPagination");
  if (!pagination) return;
  pagination.classList.toggle("hidden", total === 0);
  document.querySelector("#historyPageRange").textContent = `${total ? startIndex + 1 : 0}–${startIndex + pageLength} sur ${total}`;
  document.querySelector("#historyPreviousPage").disabled = historyCurrentPage <= 1;
  document.querySelector("#historyNextPage").disabled = startIndex + pageLength >= total;
  if (historyPageSizeSelect) historyPageSizeSelect.value = String(historyPageSize);
}

function resetHistoryPagination() {
  historyCurrentPage = 1;
  renderHistory();
}

function syncHistoryCustomDates() {
  historyCustomDates?.classList.toggle("hidden", historyPeriodFilter?.value !== "custom");
}

function resetHistoryFilters() {
  if (historySearchInput) historySearchInput.value = "";
  if (historyActionFilter) historyActionFilter.value = "all";
  if (historyUserFilter) historyUserFilter.value = "all";
  if (historyPeriodFilter) historyPeriodFilter.value = "all";
  if (historyDateStart) historyDateStart.value = "";
  if (historyDateEnd) historyDateEnd.value = "";
  historyCurrentPage = 1;
  renderHistory();
}

function renderLocations() {
  const groups = buildLocationGroups();
  const locationGrid = document.querySelector("#locationGrid");
  if (!locationGrid) return;

  if (selectedLocation) {
    syncAppViewMode();
    renderLocationDetail(locationGrid, groups[selectedLocation] || []);
    return;
  }

  syncAppViewMode();

  const query = normalizeSearch(locationSearchInput?.value || "");
  const sort = locationSortSelect?.value || "name";
  const locations = inventoryLocations
    .map(place => ({
      place,
      group: groups[place] || []
    }))
    .filter(({ place, group }) => {
      if (!query) return true;
      const haystack = normalizeSearch([
        place,
        ...group.map(entry => entry.record?.name || "")
      ].join(" "));
      return haystack.includes(query);
    })
    .sort((a, b) => compareLocationGroups(a, b, sort));

  const locationResultCount = document.querySelector("#locationResultCount");
  if (locationResultCount) {
    locationResultCount.textContent = formatLocationCount(locations.length, "zone");
  }

  locationGrid.innerHTML = locations.length ? locations.map(({ place, group }) => {
    const previewNames = group.slice(0, 3).map(entry => entry.record.name);
    const remainingCount = Math.max(group.length - previewNames.length, 0);
    const referenceLabel = formatLocationCount(group.length, "référence");

    return `
    <button
      class="location-card"
      type="button"
      data-location="${escapeHtml(place)}"
      aria-label="Entrer dans ${escapeHtml(place)}, ${escapeHtml(referenceLabel)}"
    >
      <span class="location-icon" aria-hidden="true">${locationIcons[place] || "📍"}</span>
      <span class="location-card-title">${escapeHtml(place)}</span>
      <span class="location-card-count">${escapeHtml(referenceLabel)}</span>
      <div class="mini-list">
        ${
          previewNames.length
            ? `
              ${previewNames.map(name => `<span>${escapeHtml(name)}</span>`).join("")}
              ${remainingCount ? `<span class="location-more-count">+ ${formatLocationCount(remainingCount, "autre référence", "autres références")}</span>` : ""}
            `
            : `<span class="location-empty-preview">Aucune référence stockée</span>`
        }
      </div>
      <span class="enter-room"><span class="enter-room-icon" aria-hidden="true">🚪</span> Entrer</span>
    </button>
  `;
  }).join("") : `<div class="location-empty-state">Aucune zone ne correspond à votre recherche.</div>`;

  locationGrid.querySelectorAll("[data-location]").forEach(card => {
    card.addEventListener("click", () => {
      viewReturnScrollY.locations = getPageScrollY();
      selectedLocation = card.dataset.location;
      locationDetailSearch = "";
      locationDetailStatus = "all";
      locationDetailFacet = "all";
      locationDetailSort = "name-asc";
      locationDetailPage = 1;
      selectedLocationEntry = null;
      renderLocations();
    });
  });
}

function renderLocationDetail(locationGrid, group) {
  const facets = Array.from(new Set(group.flatMap(entry => {
    const record = entry.record;
    return [record.category || clientSampleTypes[record.type] || record.type, ...(record.tags || [])]
      .filter(Boolean);
  }))).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

  if (locationDetailFacet !== "all" && !facets.includes(locationDetailFacet)) {
    locationDetailFacet = "all";
  }

  const filtered = group
    .filter(entry => locationDetailMatches(entry))
    .sort(compareLocationDetailEntries);
  const totalPages = Math.max(1, Math.ceil(filtered.length / locationDetailPageSize));
  locationDetailPage = Math.min(Math.max(1, locationDetailPage), totalPages);
  const pageStart = (locationDetailPage - 1) * locationDetailPageSize;
  const pageEntries = filtered.slice(pageStart, pageStart + locationDetailPageSize);
  const rangeStart = filtered.length ? pageStart + 1 : 0;
  const rangeEnd = Math.min(pageStart + locationDetailPageSize, filtered.length);

  locationGrid.innerHTML = `
    <section class="location-room inventory-detail-panel" aria-labelledby="locationRoomTitle">
      <div class="inventory-detail-return-row">
        <button class="ghost-btn inventory-back-btn" id="backToLocationsBtn" type="button" aria-label="Retour aux localisations">
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <header class="inventory-detail-header">
        <div class="inventory-detail-title location-detail-title">
          <span class="room-icon" aria-hidden="true">${locationIcons[selectedLocation] || "📍"}</span>
          <div class="location-detail-title-text">
            <h3 id="locationRoomTitle">${escapeHtml(selectedLocation)}</h3>
            <div class="inventory-detail-meta">
              <span>${escapeHtml(formatLocationCount(group.length, "référence"))} dans cette salle</span>
            </div>
          </div>
        </div>

        <div class="detail-actions inventory-detail-actions">
          <button class="primary-btn compact-btn" type="button" data-add-location-item>Ajouter une référence</button>
        </div>
      </header>

      ${group.length ? `
        <section class="location-detail-controls" aria-label="Contrôles de la localisation">
          <label class="location-detail-search" for="locationDetailSearch">
            <span>Rechercher</span>
            <input id="locationDetailSearch" type="search" value="${escapeHtml(locationDetailSearch)}" placeholder="Nom, référence ou tag…">
          </label>
          <label for="locationDetailStatus">
            <span>Statut</span>
            <select id="locationDetailStatus">
              <option value="all" ${locationDetailStatus === "all" ? "selected" : ""}>Tous les statuts</option>
              <option value="ok" ${locationDetailStatus === "ok" ? "selected" : ""}>En stock</option>
              <option value="warning" ${locationDetailStatus === "warning" ? "selected" : ""}>Attention</option>
              <option value="critical" ${locationDetailStatus === "critical" ? "selected" : ""}>Critique</option>
            </select>
          </label>
          <label for="locationDetailFacet">
            <span>Catégorie ou tag</span>
            <select id="locationDetailFacet">
              <option value="all">Toutes les catégories et tags</option>
              ${facets.map(facet => `<option value="${escapeHtml(facet)}" ${locationDetailFacet === facet ? "selected" : ""}>${escapeHtml(facet)}</option>`).join("")}
            </select>
          </label>
          <label for="locationDetailSort">
            <span>Tri</span>
            <select id="locationDetailSort">
              <option value="name-asc" ${locationDetailSort === "name-asc" ? "selected" : ""}>Nom A–Z</option>
              <option value="name-desc" ${locationDetailSort === "name-desc" ? "selected" : ""}>Nom Z–A</option>
              <option value="stock-asc" ${locationDetailSort === "stock-asc" ? "selected" : ""}>Stock le plus faible</option>
              <option value="stock-desc" ${locationDetailSort === "stock-desc" ? "selected" : ""}>Stock le plus élevé</option>
            </select>
          </label>
          <strong class="location-detail-result-count" aria-live="polite">${escapeHtml(formatLocationCount(filtered.length, "résultat"))}</strong>
        </section>

        ${pageEntries.length ? renderLocationDetailTable(pageEntries) : `
          <div class="location-detail-empty">
            <strong>Aucune référence trouvée</strong>
            <p>Modifiez votre recherche ou vos filtres.</p>
            <button class="ghost-btn compact-btn" id="resetLocationDetailFilters" type="button">Réinitialiser les filtres</button>
          </div>
        `}

        ${pageEntries.length ? `
          <footer class="location-detail-pagination" aria-label="Pagination des références">
            <label for="locationDetailPageSize">
              <span>Références par page</span>
              <select id="locationDetailPageSize">
                ${[10, 25, 50, 75, 100].map(size => `<option value="${size}" ${locationDetailPageSize === size ? "selected" : ""}>${size}</option>`).join("")}
              </select>
            </label>
            <span>${rangeStart}–${rangeEnd} sur ${filtered.length}</span>
            <div class="location-pagination-actions">
              <button class="ghost-btn compact-btn" id="locationDetailPrevious" type="button" ${locationDetailPage <= 1 ? "disabled" : ""}>Précédent</button>
              <button class="ghost-btn compact-btn" id="locationDetailNext" type="button" ${locationDetailPage >= totalPages ? "disabled" : ""}>Suivant</button>
            </div>
          </footer>
        ` : ""}
      ` : `
        <div class="location-detail-empty location-detail-empty-room">
          <strong>Cette localisation est vide</strong>
          <button class="primary-btn compact-btn" type="button" data-add-location-item>Ajouter une référence ici</button>
        </div>
      `}
    </section>
  `;

  bindLocationDetailEvents(locationGrid);
}

function locationDetailMatches(entry) {
  const record = entry.record;
  const isClientSample = entry.kind === "clientSample";
  const category = record.category || clientSampleTypes[record.type] || record.type || "";
  const references = isClientSample ? record.clientCode : itemReferencesText(record.references);
  const haystack = normalizeSearch([record.name, references, category, ...(record.tags || [])].join(" "));
  const status = getLocationEntryStatus(entry);
  const facetValues = [category, ...(record.tags || [])];

  return (!locationDetailSearch || haystack.includes(normalizeSearch(locationDetailSearch))) &&
    (locationDetailStatus === "all" || status === locationDetailStatus) &&
    (locationDetailFacet === "all" || facetValues.includes(locationDetailFacet));
}

function compareLocationDetailEntries(a, b) {
  const nameComparison = String(a.record.name || "").localeCompare(String(b.record.name || ""), "fr", { sensitivity: "base" });
  if (locationDetailSort === "name-desc") return -nameComparison;
  if (locationDetailSort === "stock-asc" || locationDetailSort === "stock-desc") {
    const quantityA = Number(a.record.quantity ?? 0);
    const quantityB = Number(b.record.quantity ?? 0);
    const stockComparison = quantityA - quantityB;
    return locationDetailSort === "stock-asc" ? stockComparison || nameComparison : -stockComparison || nameComparison;
  }
  return nameComparison;
}

function getLocationEntryStatus(entry) {
  if (entry.kind === "clientSample") return "undefined";
  return getStockStatus(entry.record).status;
}

function getLocationDisplayedStatus(entry) {
  if (entry.kind === "clientSample") {
    return { label: "Étude client", className: "badge--client-study" };
  }
  const status = getLocationEntryStatus(entry);
  return {
    label: status === "undefined" ? "Seuil non défini" : statusLabel(status),
    className: status
  };
}

function renderLocationDetailTable(entries) {
  return `
    <div class="location-detail-table-wrap">
      <table class="location-detail-table">
        <thead>
          <tr>
            <th scope="col">Référence</th>
            <th scope="col">Stock actuel</th>
            <th scope="col">Minimum</th>
            <th scope="col">Statut</th>
            <th scope="col">Tags</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(renderLocationDetailRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLocationDetailRow(entry) {
  const record = entry.record;
  const isClientSample = entry.kind === "clientSample";
  const entryKey = `${entry.kind}:${record.id}`;
  const status = getLocationEntryStatus(entry);
  const displayedStatus = getLocationDisplayedStatus(entry);
  const category = record.category || clientSampleTypes[record.type] || record.type || "";
  const currentStock = isClientSample
    ? escapeHtml(formatClientSampleQuantity(record))
    : (StockTracking.normalizeTracking(record).mode === "containers" ? escapeHtml(StockTracking.summary(record, selectedLocation)) : formatInventoryCardQuantity(record.quantity, record.unit));
  const minimum = status === "undefined" ? "—" : formatInventoryCardQuantity(record.minStock, record.unit);
  const tags = record.tags || [];

  return `
    <tr class="location-detail-row ${isClientSample ? "is-client-study" : ""} ${selectedLocationEntry === entryKey ? "is-selected" : ""}"
      tabindex="0" data-entry-kind="${escapeHtml(entry.kind)}" data-entry-id="${escapeHtml(record.id)}">
      <td data-label="Référence">
        <button class="location-reference-button" type="button" data-open-entry>
          <span class="location-reference-title">
            ${isClientSample ? "" : renderRoutineStar(record)}
            <strong>${escapeHtml(record.name)}</strong>
          </span>
          ${category ? `<span>${escapeHtml(category)}</span>` : ""}
        </button>
      </td>
      <td data-label="Stock actuel"><strong>${currentStock}</strong></td>
      <td data-label="Minimum">${minimum}</td>
      <td data-label="Statut"><span class="location-status-badge ${displayedStatus.className}">${escapeHtml(displayedStatus.label)}</span></td>
      <td data-label="Tags">
        <div class="location-table-tags">${tags.length ? tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("") : `<span class="location-no-tags">Aucun tag</span>`}</div>
      </td>
      <td data-label="Actions">
        <div class="location-row-actions">
          ${isClientSample ? "" : `<button class="primary-btn compact-btn" type="button" data-update-stock="${escapeHtml(record.id)}">Mettre à jour le stock</button>`}
          <button class="ghost-btn compact-btn" type="button" ${isClientSample ? `data-edit-sample="${escapeHtml(record.id)}"` : `data-edit-item="${escapeHtml(record.id)}"`}>Modifier</button>
        </div>
      </td>
    </tr>
  `;
}

function bindLocationDetailEvents(locationGrid) {
  locationGrid.querySelector("#backToLocationsBtn")?.addEventListener("click", () => {
    selectedLocation = null;
    selectedLocationEntry = null;
    syncAppViewMode();
    renderLocations();
    restorePageScrollY(viewReturnScrollY.locations);
  });

  const rerenderFromControl = (property, value, focusId = null) => {
    if (property === "search") locationDetailSearch = value;
    if (property === "status") locationDetailStatus = value;
    if (property === "facet") locationDetailFacet = value;
    if (property === "sort") locationDetailSort = value;
    locationDetailPage = 1;
    renderLocations();
    if (focusId) {
      const input = document.querySelector(`#${focusId}`);
      input?.focus();
      if (input?.setSelectionRange) input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  locationGrid.querySelector("#locationDetailSearch")?.addEventListener("input", event => rerenderFromControl("search", event.target.value, "locationDetailSearch"));
  locationGrid.querySelector("#locationDetailStatus")?.addEventListener("change", event => rerenderFromControl("status", event.target.value));
  locationGrid.querySelector("#locationDetailFacet")?.addEventListener("change", event => rerenderFromControl("facet", event.target.value));
  locationGrid.querySelector("#locationDetailSort")?.addEventListener("change", event => rerenderFromControl("sort", event.target.value));
  locationGrid.querySelector("#locationDetailPageSize")?.addEventListener("change", event => {
    locationDetailPageSize = Number(event.target.value) || 50;
    locationDetailPage = 1;
    renderLocations();
  });
  locationGrid.querySelector("#locationDetailPrevious")?.addEventListener("click", () => {
    locationDetailPage = Math.max(1, locationDetailPage - 1);
    renderLocations();
  });
  locationGrid.querySelector("#locationDetailNext")?.addEventListener("click", () => {
    locationDetailPage += 1;
    renderLocations();
  });
  locationGrid.querySelector("#resetLocationDetailFilters")?.addEventListener("click", () => {
    locationDetailSearch = "";
    locationDetailStatus = "all";
    locationDetailFacet = "all";
    locationDetailPage = 1;
    renderLocations();
  });
  locationGrid.querySelectorAll("[data-add-location-item]").forEach(button => button.addEventListener("click", () => {
    openModal(null, { prefill: { locations: [selectedLocation] } });
  }));

  const openEntry = row => {
    if (!row) return;
    selectedLocationEntry = `${row.dataset.entryKind}:${row.dataset.entryId}`;
    if (row.dataset.entryKind === "clientSample") {
      renderLocations();
      return;
    }
    const context = { view: "locations", location: selectedLocation };
    openItemDetail(row.dataset.entryId, context);
  };

  locationGrid.querySelectorAll(".location-detail-row").forEach(row => {
    row.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      openEntry(row);
    });
    row.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.target.closest("button")) {
        event.preventDefault();
        openEntry(row);
      }
    });
    row.querySelector("[data-open-entry]")?.addEventListener("click", event => {
      event.stopPropagation();
      openEntry(row);
    });
  });

  locationGrid.querySelectorAll("[data-update-stock]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    const item = items.find(row => row.id === button.dataset.updateStock);
    if (usesAdvancedStockManager(item)) openStockManager(button.dataset.updateStock);
    else openStockModal(button.dataset.updateStock);
  }));
  locationGrid.querySelectorAll("[data-edit-item]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    openModal(button.dataset.editItem);
  }));
  locationGrid.querySelectorAll("[data-edit-sample]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    openSampleModal(button.dataset.editSample);
  }));
}

function formatLocationCount(count, singular, plural = `${singular}s`) {
  const safeCount = Number(count || 0);
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
}

function buildLocationGroups() {
  const groups = inventoryLocations.reduce((acc, place) => {
    acc[place] = [];
    return acc;
  }, {});

  items.forEach(item => {
    getItemLocations(item).forEach(place => {
      if (!groups[place]) groups[place] = [];
      groups[place].push({ kind: "inventory", record: item });
    });
  });

  clientSamples.forEach(sample => {
    const place = sample.location;
    if (!place) return;
    if (!groups[place]) groups[place] = [];
    groups[place].push({ kind: "clientSample", record: sample });
  });

  return groups;
}

function compareLocationGroups(a, b, sort = "name") {
  if (sort === "most") {
    return b.group.length - a.group.length || a.place.localeCompare(b.place, "fr");
  }

  if (sort === "least") {
    return a.group.length - b.group.length || a.place.localeCompare(b.place, "fr");
  }

  return a.place.localeCompare(b.place, "fr");
}

function handleQuantityStepKeydown(event) {
  const input = event.target.closest?.('input[data-quantity-step="1"]');
  if (!input || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;

  event.preventDefault();
  const current = input.value === "" ? 0 : StockTracking.parseLocalizedNumber(input.value);
  if (!Number.isFinite(current)) return;

  const direction = event.key === "ArrowUp" ? 1 : -1;
  const minimum = input.min === "" ? -Infinity : Number(input.min);
  const next = Number((current + direction * QUANTITY_STEP).toFixed(12));
  input.value = String(Number.isFinite(minimum) ? Math.max(minimum, next) : next);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function normalizeOrderStatus(status) {
  const normalized = normalizeSearch(status || "");
  if (["ordered", "commandee", "commande"].includes(normalized)) return "ordered";
  if (["received", "arrived", "arrivee", "arrive"].includes(normalized)) return "received";
  if (["archived", "cancelled", "canceled", "annulee", "annule"].includes(normalized)) return "archived";
  return "requested";
}

function getOrdersByStatus(allOrders = orders) {
  const source = Array.isArray(allOrders) ? allOrders : [];
  return {
    requested: source.filter(order => normalizeOrderStatus(order.status) === "requested"),
    ordered: source.filter(order => normalizeOrderStatus(order.status) === "ordered"),
    received: source.filter(order => normalizeOrderStatus(order.status) === "received"),
    archived: source.filter(order => normalizeOrderStatus(order.status) === "archived")
  };
}

function orderStatusLabel(status) {
  return {
    requested: "Nouvelle demande",
    ordered: "Commandée",
    received: "Arrivée",
    archived: "Annulée"
  }[normalizeOrderStatus(status)];
}

function renderOrderDetail(order) {
  const item = order.inventoryItemId
    ? items.find(entry => entry.id === order.inventoryItemId) || null
    : null;
  const status = normalizeOrderStatus(order.status);
  const priority = getOrderPriorityPresentation(order.priority);
  const avatar = getHistoryUserAvatar(order.requestedBy);
  const unit = getOrderUnit(order);
  const references = item ? normalizeReferences(item.references) : normalizeReferences({});
  const headerActions = status === "requested"
    ? `<button class="primary-btn compact-btn" type="button" onclick="moveOrderToOrdered('${escapeHtml(order.id)}')">Marquer comme commandée</button>`
    : status === "ordered"
      ? `<button class="primary-btn compact-btn" type="button" onclick="moveOrderToReceived('${escapeHtml(order.id)}')">Marquer comme arrivée</button>`
      : status === "received" && !order.addedToInventory
        ? `<button class="primary-btn compact-btn" type="button" onclick="openReceiveInventoryDialog('${escapeHtml(order.id)}')">Ajouter l’item à l’inventaire</button>`
        : "";

  return `
    <section class="inventory-detail-panel order-detail-view">
      <div class="inventory-detail-return-row">
        <button class="ghost-btn inventory-back-btn" type="button" onclick="selectOrder(null)" aria-label="Retour aux demandes">
          <span aria-hidden="true">←</span> Retour
        </button>
      </div>

      <div class="inventory-detail-header order-detail-header">
        <div class="inventory-detail-title">
          <span class="order-priority-badge ${priority.className}">${escapeHtml(status === "requested" ? priority.label : orderStatusLabel(status))}</span>
          <h3>${escapeHtml(order.itemName)}</h3>
          <div class="inventory-detail-meta">
            <span>${escapeHtml(orderStatusLabel(status))}</span>
            <span>${escapeHtml(order.requestedBy || "Utilisateur inconnu")}</span>
            <span>${escapeHtml(formatOrderBoardDate(order.requestedAtRaw || order.requestedAt || order.createdAt))}</span>
          </div>
        </div>
        ${headerActions ? `<div class="detail-actions inventory-detail-actions">${headerActions}</div>` : ""}
      </div>

      ${renderOrderWorkflow(order)}

      <div class="order-detail-grid">
        <section class="inventory-info-panel">
          <div class="inventory-panel-heading"><span class="inventory-panel-icon">i</span><h3>Informations de la demande</h3></div>
          <div class="item-detail-stack">
            ${renderDetailRow("Statut", orderStatusLabel(status))}
            ${renderDetailRow("Priorité", priority.label)}
            ${renderDetailRow("Quantité demandée", formatOrderBoardQuantity(order.requestedQuantity ?? order.quantity, unit, "demandée"))}
            <div class="item-detail-row"><span class="item-detail-label">Demandeur</span><div class="item-detail-value order-detail-user"><span class="history-user-avatar ${avatar.type}" aria-hidden="true">${escapeHtml(avatar.value)}</span>${escapeHtml(order.requestedBy || "Utilisateur inconnu")}</div></div>
            ${renderDetailRow("Date de création", formatOrderBoardDate(order.requestedAtRaw || order.requestedAt || order.createdAt))}
            ${order.notes?.trim() ? renderDetailRow("Note", order.notes.trim()) : ""}
          </div>
        </section>

        ${item ? `
          <section class="inventory-info-panel order-linked-stock">
            <div class="inventory-panel-heading"><span class="inventory-panel-icon">S</span><h3>Stock et item lié</h3></div>
            <div class="item-detail-stack">
              ${renderDetailRow("Stock actuel", formatInventoryCardQuantity(item.quantity, item.unit))}
              ${getStockStatus(item).minimum !== null ? renderDetailRow("Minimum", formatInventoryCardQuantity(getStockStatus(item).minimum, item.unit)) : ""}
              ${renderDetailRow("Statut du stock", statusLabel(itemStatus(item)))}
              ${renderDetailRow("Localisation", formatLocations(item))}
              ${renderDetailRow("Catégorie", item.category)}
            </div>
            <div class="order-detail-panel-actions">
              <button class="ghost-btn compact-btn" type="button" onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'orders' })">Voir la fiche inventaire</button>
            </div>
          </section>
        ` : `
          <section class="inventory-info-panel order-linked-stock">
            <div class="inventory-panel-heading"><span class="inventory-panel-icon">S</span><h3>Stock et item lié</h3></div>
            <p>Aucun item lié à cette demande pour le moment.</p>
          </section>
        `}

        ${item ? renderInventoryReferencesPanel(references, item) : ""}
      </div>
    </section>
  `;
}

function renderOrderWorkflow(order) {
  const status = normalizeOrderStatus(order.status);
  const rank = { requested: 0, ordered: 1, received: 2 }[status] ?? 0;
  const steps = [
    ["Demandée", order.requestedAtRaw || order.requestedAt || order.createdAt],
    ["Commandée", order.orderedAtRaw || order.orderedAt],
    ["Arrivée", order.receivedAtRaw || order.receivedAt]
  ];
  return `<ol class="order-workflow" aria-label="Progression de la commande">${steps.map(([label, date], index) => `
    <li class="${index < rank ? "complete" : index === rank ? "current" : "future"}">
      <span class="order-workflow-marker" aria-hidden="true">${index + 1}</span>
      <div><strong>${label}</strong>${date ? `<small>${escapeHtml(formatOrderBoardDate(date))}</small>` : ""}</div>
    </li>`).join("")}</ol>`;
}

function renderOrders() {
  const ordersView = document.querySelector("#ordersView");
  const orderDetail = document.querySelector("#orderDetail");
  const requestedList = document.querySelector("#requestedOrderList");
  const orderedList = document.querySelector("#orderedOrderList");
  const receivedList = document.querySelector("#receivedOrderList");
  const requestedCount = document.querySelector("#requestedCount");
  const orderedCount = document.querySelector("#orderedCount");
  const receivedCount = document.querySelector("#receivedCount");

  const ordersSections = document.querySelector("#ordersSections");
  const requestedSection = requestedList?.closest(".order-section") || requestedList?.parentElement;
  const orderedSection = orderedList?.closest(".order-section") || orderedList?.parentElement;
  const receivedSection = receivedList?.closest(".order-section") || receivedList?.parentElement;

  if (!orderDetail || !requestedList || !orderedList || !receivedList) {
    console.warn("Orders view: faltan contenedores en el HTML.");
    return;
  }

  ordersView?.classList.toggle("orders-history-mode", ordersMode === "history");
  if (ordersMode === "history") ordersView?.classList.remove("orders-detail-mode");

  if (ordersMode === "history") {
    renderOrdersHistory();
    return;
  }

  const visibleOrders = [...orders];

  renderOrderBoardRequesterOptions(visibleOrders);
  const filteredOrders = visibleOrders
    .filter(order => orderMatchesBoardFilters(order))
    .sort(compareOrderBoardEntries);
  const groupedOrders = getOrdersByStatus(filteredOrders);
  const requested = groupedOrders.requested;
  const ordered = groupedOrders.ordered;
  const received = groupedOrders.received;

  if (requestedCount) requestedCount.textContent = String(requested.length);
  if (orderedCount) orderedCount.textContent = String(ordered.length);
  if (receivedCount) receivedCount.textContent = String(received.length);
  const resultCount = document.querySelector("#orderBoardResultCount");
  if (resultCount) resultCount.textContent = formatOrderRequestCount(filteredOrders.length);
  renderOrderBoardMetrics(filteredOrders);

  const detail = selectedOrderId
    ? visibleOrders.find((order) => order.id === selectedOrderId) ||
      orders.find((order) => order.id === selectedOrderId)
    : null;
  ordersView?.classList.toggle("orders-detail-mode", Boolean(detail));

  orderDetail.innerHTML = detail ? renderOrderDetail(detail) : "";

  if (ordersSections) {
    ordersSections.classList.toggle("hidden", Boolean(detail));
  }
  [requestedSection, orderedSection, receivedSection].forEach((section) => {
    section?.classList.toggle("hidden", Boolean(detail));
  });

  if (detail) {
    return;
  }

  requestedList.innerHTML =
    requested.map(renderOrderBoardCard).join("") || renderOrderLaneEmpty("requested");

  orderedList.innerHTML =
    ordered.map(renderOrderBoardCard).join("") || renderOrderLaneEmpty("ordered");

  receivedList.innerHTML =
    received.map(renderOrderBoardCard).join("") || renderOrderLaneEmpty("received");
}

function renderOrderBoardRequesterOptions(visibleOrders) {
  if (!orderBoardRequesterFilter) return;
  const selected = orderBoardRequesterFilter.value || "all";
  const users = Array.from(new Set(visibleOrders.map(order => order.requestedBy).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  orderBoardRequesterFilter.innerHTML = `<option value="all">Tous les demandeurs</option>${users
    .map(user => `<option value="${escapeHtml(user)}">${escapeHtml(user)}</option>`).join("")}`;
  orderBoardRequesterFilter.value = users.includes(selected) ? selected : "all";
}

function getOrderPriorityGroup(priority) {
  const normalized = normalizeSearch(priority || "");
  if (normalized === "critique") return "critical";
  if (["tres urgent", "urgent", "muy urgente"].includes(normalized)) return "attention";
  return "standard";
}

function getOrderPriorityPresentation(priority) {
  const group = getOrderPriorityGroup(priority);
  return {
    critical: { label: "Critique", className: "critical" },
    attention: { label: "Attention", className: "attention" },
    standard: { label: "Standard", className: "standard" }
  }[group];
}

function orderMatchesBoardFilters(order) {
  const query = normalizeSearch(orderBoardSearchInput?.value || "");
  const priority = orderBoardPriorityFilter?.value || "all";
  const requester = orderBoardRequesterFilter?.value || "all";
  const haystack = normalizeSearch([
    order.itemName,
    order.requestedBy,
    order.orderedBy,
    order.receivedBy,
    order.notes,
    order.supplier,
    order.requestedQuantity,
    order.receivedQuantity,
    order.status,
    order.status === "requested" ? "demande" : order.status === "ordered" ? "commandee" : "arrivee",
    order.priority,
    order.requestedAt,
    order.orderedAt,
    order.receivedAt
  ].join(" "));
  return (!query || haystack.includes(query)) &&
    (priority === "all" || getOrderPriorityGroup(order.priority) === priority) &&
    (requester === "all" || order.requestedBy === requester);
}

function compareOrderBoardEntries(a, b) {
  const sort = orderBoardSortSelect?.value || "newest";
  const timeA = getOrderBoardTime(a);
  const timeB = getOrderBoardTime(b);
  if (sort === "oldest") return timeA - timeB;
  if (sort === "priority") return priorityRank(a.priority) - priorityRank(b.priority) || timeB - timeA;
  if (sort === "name") return String(a.itemName || "").localeCompare(String(b.itemName || ""), "fr", { sensitivity: "base" });
  return timeB - timeA;
}

function getOrderBoardTime(order) {
  const raw = order.requestedAtRaw || order.orderedAtRaw || order.receivedAtRaw;
  const parsed = raw ? new Date(raw) : parseHistoryDate(order.requestedAt || order.createdAt);
  const time = parsed?.getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatOrderRequestCount(count) {
  return `${count} ${count === 1 ? "demande" : "demandes"}`;
}

function renderOrderBoardMetrics(filteredOrders) {
  const container = document.querySelector("#orderBoardMetrics");
  if (!container) return;
  const metrics = [
    ["requested", "Demandes en attente", filteredOrders.filter(order => normalizeOrderStatus(order.status) === "requested").length],
    ["ordered", "Commandées", filteredOrders.filter(order => normalizeOrderStatus(order.status) === "ordered").length],
    ["received", "Arrivées", filteredOrders.filter(order => normalizeOrderStatus(order.status) === "received").length],
    ["critical", "Demandes critiques", filteredOrders.filter(order => normalizeOrderStatus(order.status) === "requested" && getOrderPriorityGroup(order.priority) === "critical").length]
  ];
  container.innerHTML = metrics.map(([type, label, value]) => `
    <article class="client-kpi-card order-kpi-card ${type}">
      <span class="client-kpi-icon" aria-hidden="true">${renderOrderBoardIcon(type)}</span>
      <div><span>${escapeHtml(label)}</span><strong>${value}</strong></div>
    </article>
  `).join("");
}

function renderOrderBoardIcon(type) {
  const icons = {
    requested: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    ordered: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8M12 12v8"/></svg>`,
    received: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h11v11H3zM14 10h4l3 4v3h-7zM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>`,
    critical: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4 3 20h18L12 4Zm0 5v5m0 3h.01"/></svg>`,
    empty: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v8l8 4 8-4V8"/></svg>`
  };
  return icons[type] || icons.empty;
}

function renderOrderBoardCard(order) {
  const status = normalizeOrderStatus(order.status);
  const priority = getOrderPriorityPresentation(order.priority);
  const unit = getOrderUnit(order);
  const quantity = status === "received"
    ? (order.receivedQuantity || order.requestedQuantity || order.quantity)
    : (order.requestedQuantity ?? order.quantity);
  const requestedQuantity = formatOrderBoardQuantity(quantity, unit, status === "received" ? "reçue" : "demandée");
  const dateValue = status === "received"
    ? (order.receivedAtRaw || order.receivedAt)
    : status === "ordered"
      ? (order.orderedAtRaw || order.orderedAt)
      : (order.requestedAtRaw || order.requestedAt || order.createdAt);
  const userName = status === "received" ? (order.receivedBy || order.requestedBy) : order.requestedBy;
  const displayAvatar = getHistoryUserAvatar(userName);

  return `
    <article class="order-board-card order-status-${status} priority-${priority.className} ${selectedOrderId === order.id ? "active" : ""}"
      tabindex="0" onclick="selectOrder('${escapeHtml(order.id)}')"
      onkeydown="if ((event.key === 'Enter' || event.key === ' ') && event.target === this) { event.preventDefault(); selectOrder('${escapeHtml(order.id)}'); }">
      <div class="order-card-heading">
        <span class="order-priority-badge ${priority.className}">${priority.label}</span>
        ${status === "received" ? `<span class="order-status-badge received">Arrivée</span>` : ""}
      </div>
      <strong class="order-card-title" title="${escapeHtml(order.itemName)}">${escapeHtml(order.itemName)}</strong>
      <span class="order-card-quantity">${escapeHtml(requestedQuantity)}</span>
      <div class="order-card-note-space">
        ${order.notes ? `<p class="order-card-note multiline-text" title="${escapeHtml(order.notes)}">${escapeHtml(order.notes)}</p>` : ""}
      </div>
      <div class="order-card-person">
        <span class="history-user-avatar ${displayAvatar.type}" aria-hidden="true">${escapeHtml(displayAvatar.value)}</span>
        <span>${escapeHtml(userName || "Utilisateur inconnu")}</span>
        <time>${escapeHtml(formatOrderBoardDate(dateValue))}</time>
      </div>
      <div class="order-board-actions">
        ${renderOrderBoardActions(order)}
      </div>
    </article>
  `;
}

function formatOrderBoardQuantity(quantity, unit, suffix) {
  const numeric = Number(quantity);
  const value = Number.isFinite(numeric) ? numeric : quantity ?? "—";
  const displayUnit = formatInventoryDisplayUnit(value, unit);
  return `${value}${displayUnit ? ` ${displayUnit}` : ""} ${suffix}`.trim();
}

function formatOrderBoardDate(value) {
  const date = value instanceof Date ? value : parseHistoryDate(value) || new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "—");
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function renderOrderBoardActions(order) {
  const status = normalizeOrderStatus(order.status);
  if (status === "requested") {
    return `
      <button class="primary-btn compact-btn" type="button" onclick="event.stopPropagation(); moveOrderToOrdered('${escapeHtml(order.id)}')">Marquer comme commandée</button>
      <button class="ghost-btn compact-btn" type="button" onclick="event.stopPropagation(); markOrderDone('${escapeHtml(order.id)}')">Supprimer</button>
    `;
  }
  if (status === "ordered") {
    return `
      <button class="primary-btn compact-btn" type="button" onclick="event.stopPropagation(); moveOrderToReceived('${escapeHtml(order.id)}')">Marquer comme arrivée</button>
      <button class="ghost-btn compact-btn" type="button" onclick="event.stopPropagation(); moveOrderBackToRequested('${escapeHtml(order.id)}')">Retour aux demandes</button>
    `;
  }
  if (order.addedToInventory) return "";
  return `
    <button class="primary-btn compact-btn" type="button" onclick="event.stopPropagation(); openReceiveInventoryDialog('${escapeHtml(order.id)}')">Ajouter à l’inventaire</button>
    <button class="ghost-btn compact-btn" type="button" onclick="event.stopPropagation(); moveOrderBackToOrdered('${escapeHtml(order.id)}')">Retour aux commandes</button>
  `;
}

function renderOrderLaneEmpty(status) {
  const content = {
    requested: ["Aucune demande en attente", "Les nouvelles demandes apparaîtront ici."],
    ordered: ["Aucune commande en cours", "Les demandes commandées apparaîtront ici."],
    received: ["Aucune réception récente", "Les réceptions apparaîtront ici."]
  }[status];
  return `
    <div class="order-lane-empty">
      <span aria-hidden="true">${renderOrderBoardIcon("empty")}</span>
      <strong>${content[0]}</strong>
      <p>${content[1]}</p>
    </div>
  `;
}

function resetOrderBoardFilters() {
  if (orderBoardSearchInput) orderBoardSearchInput.value = "";
  if (orderBoardPriorityFilter) orderBoardPriorityFilter.value = "all";
  if (orderBoardRequesterFilter) orderBoardRequesterFilter.value = "all";
  if (orderBoardSortSelect) orderBoardSortSelect.value = "newest";
  renderOrders();
}

function renderOrderItemOptions(options = {}) {
  const list = document.querySelector("#orderInventoryOptions");
  if (!list) return;
  const query = normalizeSearch(orderFields.orderInventorySearch?.value || "");
  const filtered = items.filter(item => {
    const haystack = normalizeSearch([
      item.name,
      item.category,
      ...getItemLocations(item),
      ...item.tags
    ].join(" "));

    return !query || haystack.includes(query);
  });

  list.innerHTML = filtered.length
    ? filtered.map((item, index) => `
        <button
          type="button"
          role="option"
          id="order-item-option-${index}"
          class="order-combobox-option"
          data-order-item-id="${escapeHtml(item.id)}"
          aria-selected="${orderFields.orderInventoryItem.value === item.id ? "true" : "false"}"
        >
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml([item.category, formatLocations(item)].filter(Boolean).join(" · "))}</span>
        </button>
      `).join("")
    : `<p class="order-combobox-empty">Aucun item trouvé</p>`;

  list.querySelectorAll("[data-order-item-id]").forEach(option => {
    option.addEventListener("click", () => selectOrderInventoryItem(option.dataset.orderItemId));
    option.addEventListener("keydown", event => {
      const optionButtons = [...list.querySelectorAll("[data-order-item-id]")];
      const index = optionButtons.indexOf(option);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = event.key === "ArrowDown"
          ? Math.min(index + 1, optionButtons.length - 1)
          : Math.max(index - 1, 0);
        optionButtons[next]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeOrderInventoryOptions();
        orderFields.orderInventorySearch.focus();
      }
    });
  });

  if (options.open) {
    list.classList.remove("hidden");
    orderFields.orderInventorySearch.setAttribute("aria-expanded", "true");
  }
}

function renderReplicaGroupDetail(groupId, samples) {
  const sample = getEffectiveClientSample(samples[0]);
  return `
    <div class="client-detail-header">
      <div>
        <div class="client-detail-meta">
          <span class="client-type-badge created_sample">${escapeHtml(clientSampleTypes.created_sample)}</span>
          <span class="result-pill">${samples.length} réplicats</span>
        </div>
        <h3>${escapeHtml(getReplicaBaseName(sample))}</h3>
        <p class="category">${escapeHtml(getClientSampleCategoryLabel(sample))}</p>
      </div>
    </div>
    <div class="client-detail-section">
      <h4>Informations générales</h4>
      <div class="item-detail-stack">
        ${renderDetailRow("Client", getSampleCanonicalClientCode(sample))}
        ${renderDetailRow("Date", formatDisplayDateFrench(sample.creationDate))}
        ${renderDetailRow("Quantité / format", formatSampleDisplayQuantity(sample))}
        ${renderDetailRow("Localisation", sample.location)}
      </div>
    </div>
    ${sample.generalNotes ? `<div class="client-detail-section"><h4>Notes générales</h4><p>${escapeHtml(sample.generalNotes)}</p></div>` : ""}
    <div class="client-detail-bottom-actions">
      <button class="ghost-btn compact-btn" type="button" onclick="openSampleModal(null, { groupId: '${escapeHtml(groupId)}' })">Modifier</button>
    </div>
  `;
}

function selectReplicaGroup(groupId) {
  selectedSampleGroupId = groupId;
  selectedSampleId = null;
  renderSamples();
}

function getReplicaGroupSamples(groupId) {
  return clientSamples
    .filter(sample => sample.type === "created_sample" && getReplicaFamilyKey(sample) === groupId)
    .sort(compareReplicaSamples);
}

function getEffectiveClientSample(sample) {
  if (!sample || sample.type !== "created_sample") return sample;
  const general = sample.generalData || {};
  const specific = sample.specificData || {};
  return {
    ...sample,
    ...general,
    ...specific,
    id: sample.id,
    groupId: sample.groupId,
    replicaId: sample.replicaId || sample.id,
    notes: specific.notes || "",
    generalNotes: general.notes || ""
  };
}

function selectOrderInventoryItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  orderFields.orderInventoryItem.value = item.id;
  orderFields.orderInventorySearch.value = item.name;
  orderFields.orderInventorySearch.setCustomValidity("");
  document.querySelector("#clearOrderInventoryItem")?.classList.remove("hidden");
  closeOrderInventoryOptions();
}

function clearOrderInventorySelection() {
  orderFields.orderInventoryItem.value = "";
  orderFields.orderInventorySearch.value = "";
  document.querySelector("#clearOrderInventoryItem")?.classList.add("hidden");
  renderOrderItemOptions({ open: true });
  orderFields.orderInventorySearch.focus();
}

function handleOrderComboboxInput() {
  orderFields.orderInventoryItem.value = "";
  document.querySelector("#clearOrderInventoryItem")?.classList.add("hidden");
  orderFields.orderInventorySearch.setCustomValidity("");
  renderOrderItemOptions({ open: true });
}

function handleOrderComboboxKeydown(event) {
  const list = document.querySelector("#orderInventoryOptions");
  const options = [...(list?.querySelectorAll("[data-order-item-id]") || [])];
  const activeIndex = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    closeOrderInventoryOptions();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (list?.classList.contains("hidden")) renderOrderItemOptions({ open: true });
    const nextIndex = event.key === "ArrowDown"
      ? Math.min(activeIndex + 1, options.length - 1)
      : Math.max(activeIndex < 0 ? options.length - 1 : activeIndex - 1, 0);
    options[nextIndex]?.focus();
    return;
  }
  if (event.key === "Enter" && options.length === 1) {
    event.preventDefault();
    selectOrderInventoryItem(options[0].dataset.orderItemId);
  }
}

function closeOrderInventoryOptions() {
  document.querySelector("#orderInventoryOptions")?.classList.add("hidden");
  orderFields.orderInventorySearch.setAttribute("aria-expanded", "false");
}

function handleOrderComboboxOutsideClick(event) {
  const combobox = document.querySelector("#orderInventoryCombobox");
  if (combobox && !combobox.contains(event.target)) closeOrderInventoryOptions();
}

// funcion para la fecha que aparece en las tarjetas de ordenes, para mostrarla en formato DD/MM/YY o devolver "—" si no hay fecha o si el formato no se reconoce
function formatOrderDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    }).format(parsed);
  }

  const match = String(value).match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (match) return `${match[1]}/${match[2]}/${String(match[3]).slice(-2)}`;

  return String(value);
}

function toggleOrderModeFields() {
  const existingBlock = document.querySelector("#existingItemFields");
  const newBlock = document.querySelector("#newItemFields");

  if (!orderFields.orderItemMode || !existingBlock || !newBlock) {
    return;
  }

  const isExisting = orderFields.orderItemMode.value === "existing";
  existingBlock.classList.toggle("hidden", !isExisting);
  newBlock.classList.toggle("hidden", isExisting);
  orderFields.orderInventorySearch.required = isExisting;
  orderFields.orderNewName.required = !isExisting;
}

function renderExperiments() {
  const query = normalizeSearch(experimentSearchInput.value);
  const filtered = getFilteredSortedExperiments(experiments, query, clients, clientSamples, experimentSortSelect?.value || EXPERIMENT_DEFAULT_SORT);

  const detail = selectedExperimentId ? experiments.find(experiment => experiment.id === selectedExperimentId) : null;
  document.querySelector("#experimentDetail").innerHTML = detail ? renderExperimentDetail(detail) : "";
  document.querySelector("#experimentGrid").classList.toggle("hidden", Boolean(detail));
  document.querySelector("#experimentsView")?.classList.toggle("experiments-detail-mode", Boolean(detail));
  const resultCount = document.querySelector("#experimentResultCount");
  if (resultCount) resultCount.textContent = `${filtered.length} expérience${filtered.length > 1 ? "s" : ""}`;
  renderExperimentMetrics();
  const body = document.querySelector("#experimentTableBody");
  if (body) body.innerHTML = filtered.length ? filtered.map(renderExperimentTableRow).join("") : `<tr><td colspan="6" class="empty-table-cell">${experiments.length ? "Aucune expérience ne correspond à votre recherche." : "Aucune expérience enregistrée."}</td></tr>`;
}

function getExperimentClientCodes(experiment, clientList = clients, sampleList = clientSamples) {
  const ids = [experiment?.clientId, ...(Array.isArray(experiment?.clientIds) ? experiment.clientIds : [])].filter(Boolean);
  const sampleIds = [experiment?.clientSampleId, ...(Array.isArray(experiment?.clientSampleIds) ? experiment.clientSampleIds : [])].filter(Boolean);
  const codes = sampleList.filter(sample => sampleIds.includes(sample.id) || ids.includes(sample.clientId)).map(sample => {
    const client = clientList.find(entry => entry.id === sample.clientId);
    return client?.canonicalCode || sample.canonicalClientCode || normalizeClientCode(sample.clientCode).canonicalCode;
  });
  ids.forEach(id => { const client = clientList.find(entry => entry.id === id); if (client?.canonicalCode) codes.push(client.canonicalCode); });
  [experiment?.clientCode, ...(Array.isArray(experiment?.clientCodes) ? experiment.clientCodes : [])].filter(Boolean).forEach(code => {
    const normalized = normalizeClientCode(code);
    if (normalized.canonicalCode) codes.push(normalized.canonicalCode);
  });
  return [...new Set(codes.filter(code => code && code !== "Client inconnu"))];
}

function getExperimentStatusDate(experiment) {
  if (experiment?.statusChangedAt && parseHistoryDate(experiment.statusChangedAt)) return experiment.statusChangedAt;
  if (normalizeExperimentStatus(experiment?.status) === "draft" && experiment?.createdAt && parseHistoryDate(experiment.createdAt)) return experiment.createdAt;
  return null;
}

function formatExperimentStatusDate(experiment) {
  const value = getExperimentStatusDate(experiment);
  return value ? formatDateTimeFrench(value, "—").split(" · ")[0] : "—";
}

function getExperimentAvailabilityCounts(experiment, inventoryList = items) {
  const counts = (experiment?.items || []).reduce((counts, line) => {
    if (line?.type === "custom") return counts;
    const stableId = line?.inventoryItemId || line?.itemId;
    const inventoryItem = stableId ? inventoryList.find(item => item.id === stableId) : (inventoryList === items ? findInventoryItem(line) : null);
    const quantity = StockTracking.parseLocalizedNumber(line?.quantity);
    if (!inventoryItem || !Number.isFinite(quantity) || quantity <= 0 || !line?.unit) return counts;
    const availability = getExperimentItemAvailability(inventoryItem, quantity, line.unit);
    if (availability.kind === "ok") counts.sufficient += 1;
    else if (availability.kind === "low") counts.insufficient += 1;
    return counts;
  }, { sufficient: 0, insufficient: 0 });
  counts.total = (experiment?.items || []).length;
  return counts;
}

// orden de las tarjetas KPI (Brouillons, En cours, Terminées) para que el tri "Statut" siga la misma secuencia
const EXPERIMENT_STATUS_ORDER = { draft: 0, running: 1, completed: 2 };
const EXPERIMENT_DEFAULT_SORT = "az";

function compareExperimentNames(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "fr", { sensitivity: "base", numeric: true });
}

// las expériences sin code client se quedan al final para no ensuciar el principio de la lista
function getExperimentSortClientCode(experiment, clientList, sampleList) {
  return getExperimentClientCodes(experiment, clientList, sampleList).slice().sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true }))[0] || "";
}

function compareExperimentsBySort(a, b, sort, clientList, sampleList) {
  if (sort === "az") return compareExperimentNames(a, b);
  if (sort === "za") return compareExperimentNames(b, a);
  if (sort === "client") {
    const codeA = getExperimentSortClientCode(a, clientList, sampleList);
    const codeB = getExperimentSortClientCode(b, clientList, sampleList);
    if (!codeA !== !codeB) return codeA ? -1 : 1;
    return codeA.localeCompare(codeB, "fr", { sensitivity: "base", numeric: true }) || compareExperimentNames(a, b);
  }
  if (sort === "status") {
    const rankA = EXPERIMENT_STATUS_ORDER[normalizeExperimentStatus(a?.status)] ?? Number.MAX_SAFE_INTEGER;
    const rankB = EXPERIMENT_STATUS_ORDER[normalizeExperimentStatus(b?.status)] ?? Number.MAX_SAFE_INTEGER;
    return (rankA - rankB) || compareExperimentNames(a, b);
  }
  const statusDelta = (parseHistoryDate(getExperimentStatusDate(b))?.getTime() || 0) - (parseHistoryDate(getExperimentStatusDate(a))?.getTime() || 0);
  const createdDelta = (parseHistoryDate(b.createdAt)?.getTime() || 0) - (parseHistoryDate(a.createdAt)?.getTime() || 0);
  return statusDelta || createdDelta || compareExperimentNames(a, b);
}

function getFilteredSortedExperiments(source, query = "", clientList = clients, sampleList = clientSamples, sort = EXPERIMENT_DEFAULT_SORT) {
  return source.filter(experiment => {
    const haystack = normalizeSearch([...getExperimentClientCodes(experiment, clientList, sampleList), experiment.name, experiment.templateName, experiment.status, statusLabelExperiment(experiment.status)].join(" "));
    const compactQuery = query.replace(/[\s._\-\/\\]+/g, "");
    const compactHaystack = haystack.replace(/[\s._\-\/\\]+/g, "");
    return !query || haystack.includes(query) || (compactQuery && compactHaystack.includes(compactQuery));
  }).slice().sort((a, b) => compareExperimentsBySort(a, b, sort, clientList, sampleList));
}

function renderExperimentMetrics() {
  const metrics = document.querySelector("#experimentMetrics");
  if (!metrics) return;
  const counts = experiments.reduce((result, experiment) => { const status = normalizeExperimentStatus(experiment.status); if (status in result) result[status] += 1; return result; }, { draft:0, running:0, completed:0 });
  metrics.innerHTML = [["draft","Brouillons","○"],["running","En cours","↻"],["completed","Terminées","✓"]].map(([status,label,icon]) => `<article class="client-kpi-card experiment-kpi-card ${status}"><span class="client-kpi-icon" aria-hidden="true">${icon}</span><div><span>${label}</span><strong>${counts[status]}</strong></div></article>`).join("");
}

function renderExperimentTableRow(experiment) {
  const codes = getExperimentClientCodes(experiment), availability = getExperimentAvailabilityCounts(experiment), status = normalizeExperimentStatus(experiment.status);
  const template = experiment.templateId === FREE_PROTOCOL_ID ? "Nouveau protocole" : experiment.templateName;
  return `<tr class="experiment-list-row" data-experiment-id="${escapeHtml(experiment.id)}" tabindex="0" onclick="selectExperiment('${escapeHtml(experiment.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectExperiment('${escapeHtml(experiment.id)}')}"><td data-label="Code client">${codes.length ? codes.map(code => `<span class="result-pill experiment-client-code">${escapeHtml(code)}</span>`).join(" ") : "—"}</td><td data-label="Nom"><strong class="experiment-list-name">${escapeHtml(experiment.name || "—")}</strong>${template ? `<span class="table-subtext">${escapeHtml(template)}</span>` : ""}</td><td data-label="Date du statut">${escapeHtml(formatExperimentStatusDate(experiment))}</td><td data-label="Statut"><span class="experiment-status ${escapeHtml(status)}">${escapeHtml(statusLabelExperiment(status))}</span></td><td data-label="Items suffisants" class="experiment-count-cell"><span class="stock-pill ok" title="Les items libres et indéterminés ne sont pas inclus.">${availability.sufficient}/${availability.total}</span></td><td data-label="Items insuffisants" class="experiment-count-cell"><span class="stock-pill ${availability.insufficient ? "alert" : "neutral"}" title="Les items libres et indéterminés ne sont pas inclus.">${availability.insufficient}/${availability.total}</span></td></tr>`;
}

function renderExperimentCard(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const stock = experimentStockSummary(experiment);

  return `
    <article class="experiment-card experiment-preview-card" onclick="selectExperiment('${escapeHtml(experiment.id)}')">
      <div class="item-head">
        <div>
          <strong>${escapeHtml(experiment.name)}</strong>
          <span class="category">${escapeHtml(experiment.templateName)} - ${totalConditions} conditions totales</span>
        </div>
        <span class="experiment-status ${escapeHtml(experiment.status)}">${escapeHtml(statusLabelExperiment(experiment.status))}</span>
      </div>

      <div class="experiment-stats">
        <span>${experiment.conditions} conditions</span>
        <span>${experiment.replicates} replicats</span>
        <span class="${stock.ok ? "stock-ok" : "stock-alert"}">
          ${stock.ok ? "Stock OK" : `${stock.missing} alerte${stock.missing > 1 ? "s" : ""}`}
        </span>
      </div>

      <p class="multiline-text">${escapeHtml(experiment.notes || "Aucune note")}</p>

      <div class="card-actions">
        <small>${escapeHtml(experiment.createdBy)} - ${escapeHtml(experiment.updatedAt)}</small>

        <div class="card-button-stack">
          <button
            class="text-btn"
            type="button"
            onclick="event.stopPropagation(); openExperimentModal('${escapeHtml(experiment.id)}')"
          >
            Modifier
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderExperimentDetail(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const status = normalizeExperimentStatus(experiment.status);
  const detailLines=experiment.templateId===FREE_PROTOCOL_ID?(experiment.items||[]):getMergedExperimentLines(experiment.items);
  const consumedIds = getExperimentConsumedItemIds(experiment);
  const rows = detailLines.map(line => {
    const inventoryItem = findInventoryItem(line);
    const needed = Number(line.quantity || 0);
    const availability = getExperimentLineAvailability(inventoryItem, needed, line.unit);
    const isConsumed = Boolean(inventoryItem) && consumedIds.has(inventoryItem.id);
    const stateLabel = isConsumed
      ? "Consommé"
      : !inventoryItem
        ? "Manquant"
        : !availability.compatible
          ? "Unité incompatible"
          : availability.kind !== "ok"
            ? "Stock bas"
            : availability.converted
              ? "Connecté (converti)"
              : "Connecté";
    const stateClass = isConsumed
      ? "neutral"
      : !inventoryItem || !availability.compatible
        ? "alert"
        : availability.kind !== "ok"
          ? "warning"
          : "ok";
    const stockDisplay = !inventoryItem
      ? "Non connecte"
      : !availability.compatible
        ? `${StockTracking.format(inventoryItem.quantity)} ${escapeHtml(inventoryItem.unit)} · attendu ${escapeHtml(availability.referenceUnit.plural)}`
        : `${StockTracking.format(availability.availableInReferenceUnit)} ${escapeHtml(StockTracking.plural(availability.availableInReferenceUnit, availability.referenceUnit.singular, availability.referenceUnit.plural))}`;
    const displayName = line.name || inventoryItem?.name || "Item";
    return `
      <tr>
      <td>
        ${
          inventoryItem
            ? `<button
                class="text-btn experiment-product-link"
                type="button"
                onclick="openItemDetail('${escapeHtml(inventoryItem.id)}', { view: 'experiments', experimentId: '${escapeHtml(experiment.id)}' })"
              >
                ${escapeHtml(displayName)}
              </button>`
            : `<strong>${escapeHtml(displayName)}</strong>`
        }
        <br>
        <span>${escapeHtml(line.notes || "")}</span>
      </td>
        <td>${formatQuantity(needed, line.unit)}</td>
        <td>${stockDisplay}</td>
        <td><span class="stock-pill ${stateClass}">${stateLabel}</span></td>
      </tr>
    `;
  }).join("");
  const canConsume = experiment.status !== "completed" && experimentHasConsumableItems(experiment);

  return `
    <section class="experiment-detail-panel">
      <div class="experiment-detail-return-row">
        <button
          class="ghost-btn experiment-back-btn"
          type="button"
          onclick="selectExperiment(null)"
          aria-label="Retour aux expériences"
        >
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="experiment-detail-header">
        <div class="experiment-detail-title">
          <div class="experiment-detail-badges">
            <span class="experiment-status ${escapeHtml(status)}">${escapeHtml(statusLabelExperiment(experiment.status))}</span>
          </div>
          <h3>${escapeHtml(experiment.name)}</h3>
          <div class="experiment-detail-meta">
            <span>${escapeHtml(experiment.templateName)}</span>
            <span>${experiment.conditions} conditions × ${experiment.replicates} réplicats = ${totalConditions} conditions totales</span>
          </div>
          <small class="experiment-detail-footnote">Mis à jour par ${escapeHtml(experiment.createdBy)} · ${escapeHtml(experiment.updatedAt)}</small>
        </div>

        <div class="detail-actions experiment-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openExperimentModal('${experiment.id}')">Modifier</button>
          ${experiment.templateId === FREE_PROTOCOL_ID ? `<button class="ghost-btn compact-btn" type="button" onclick="openSaveProtocolTemplateDialog('${experiment.id}')">Enregistrer le protocole</button>` : ""}
          <button class="primary-btn compact-btn" type="button" onclick="openConsumeExperimentDialog('${experiment.id}')" ${canConsume ? "" : "disabled"}>Consommer le stock</button>
        </div>
      </div>
      ${experiment.notes ? `<div class="experiment-notes-compact">
        <h4>Notes</h4>
        <p class="multiline-text">${escapeHtml(experiment.notes)}</p>
      </div>` : ""}
      <div class="sample-table-wrap">
        <table class="sample-table experiment-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Besoin total</th>
              <th>Stock disponible</th>
              <th>Controle</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

// funcion para ocultar filas vacias o con datos no relevantes en el detalle del item
function renderDetailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  const isMultiline = /note|comment|description|justification|motif|raison|remarque/i.test(String(label));
  return `
    <div class="item-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value${isMultiline ? " multiline-text" : ""}">${escapeHtml(value)}</div>
    </div>
  `;
}

function normalizeMultilineText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n");
}

// ============ Sourcing (patients / prélèvements) ============

const SOURCING_PATIENT_NUMBER_FLOOR = 236;

function suggestNextPatientNumber() {
  const max = sourcingPatients.reduce((best, patient) => {
    const match = String(patient.patientNumber || "").trim().match(/^P(\d+)$/i);
    return match ? Math.max(best, Number(match[1])) : best;
  }, SOURCING_PATIENT_NUMBER_FLOOR);
  return `P${max + 1}`;
}

function normalizePatientNumber(value) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^P?\s*(\d+)$/i);
  return match ? `P${match[1]}` : trimmed;
}

function getPatientAssignmentStatus(patient) {
  const assignment = String(patient.patientStudyAssignment || "").trim();
  if (assignment) return { done: true, eliminated: false, label: `Assigné : ${assignment}`, date: patient.patientLotValidationDate || patient.patientCessionDate || "" };
  const lotEndDate = String(patient.patientLotEndDate || "").trim();
  if (lotEndDate) return { done: true, eliminated: true, label: "Éliminé", date: lotEndDate };
  return { done: false, eliminated: false, label: "En attente d’assignation", date: "" };
}

function getPatientCheckpointStage(patient) {
  const assignment = getPatientAssignmentStatus(patient);
  if (assignment.done) return assignment.eliminated ? "Éliminé" : "Assigné";
  if (String(patient.patientReceptionDate || "").trim()) return "En culture";
  return "Non démarré";
}

function sourcingStagePillMarkup(stage) {
  const map = {
    "Non démarré": "stock-pill neutral",
    "En culture": "experiment-status running",
    "Assigné": "experiment-status completed",
    "Éliminé": "stock-pill alert"
  };
  return `<span class="${map[stage] || "stock-pill neutral"}">${escapeHtml(stage)}</span>`;
}

function getFilteredSortedPatients(source, query = "", sort = "recent") {
  const normalizedQuery = normalizeSearch(query);
  return source.filter(patient => {
    const haystack = normalizeSearch([patient.patientNumber, patient.patientInitials, patient.patientStudyAssignment, patient.patientType, patient.patientGender, patient.patientCollectionSite].join(" "));
    return !normalizedQuery || haystack.includes(normalizedQuery);
  }).slice().sort((a, b) => comparePatientsBySort(a, b, sort));
}

function comparePatientsBySort(a, b, sort) {
  if (sort === "number-asc" || sort === "number-desc") {
    const numA = Number(String(a.patientNumber || "").replace(/\D/g, "")) || 0;
    const numB = Number(String(b.patientNumber || "").replace(/\D/g, "")) || 0;
    return sort === "number-asc" ? numA - numB : numB - numA;
  }
  const createdDelta = (parseHistoryDate(b.createdAtRaw)?.getTime() || 0) - (parseHistoryDate(a.createdAtRaw)?.getTime() || 0);
  return sort === "oldest" ? -createdDelta : createdDelta;
}

function renderSourcingMetrics() {
  const metrics = document.querySelector("#sourcingMetrics");
  if (!metrics) return;
  let assigned = 0, eliminated = 0, inProgress = 0;
  sourcingPatients.forEach(patient => {
    const assignment = getPatientAssignmentStatus(patient);
    if (assignment.done && assignment.eliminated) eliminated += 1;
    else if (assignment.done) assigned += 1;
    else inProgress += 1;
  });
  metrics.innerHTML = [
    ["◐", "Total patients", sourcingPatients.length],
    ["↻", "En cours de culture", inProgress],
    ["✓", "Assignés à une étude", assigned],
    ["○", "Éliminés", eliminated]
  ].map(([icon, label, value]) => `<article class="client-kpi-card sourcing-kpi-card"><span class="client-kpi-icon" aria-hidden="true">${icon}</span><div><span>${label}</span><strong>${value}</strong></div></article>`).join("");
}

function renderSourcingTableRow(patient) {
  const stage = getPatientCheckpointStage(patient);
  return `<tr class="sourcing-list-row" data-patient-id="${escapeHtml(patient.id)}" tabindex="0" onclick="selectSourcingPatient('${escapeHtml(patient.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSourcingPatient('${escapeHtml(patient.id)}')}"><td data-label="N° patient"><strong>${escapeHtml(patient.patientNumber || "—")}</strong></td><td data-label="Genre">${escapeHtml(patient.patientGender || "—")}</td><td data-label="Âge">${escapeHtml(patient.patientAge || "—")}</td><td data-label="Type">${escapeHtml(patient.patientType || "—")}</td><td data-label="Date de réception">${patient.patientReceptionDate ? escapeHtml(formatDisplayDateFrench(patient.patientReceptionDate)) : "—"}</td><td data-label="Temps de culture">${patient.patientCultureWeeks ? `${escapeHtml(patient.patientCultureWeeks)} sem.` : "—"}</td><td data-label="Assignation étude">${escapeHtml(patient.patientStudyAssignment || "—")}</td><td data-label="Checkpoint">${sourcingStagePillMarkup(stage)}</td></tr>`;
}

function renderSourcingDetail(patient) {
  const stage = getPatientCheckpointStage(patient);
  return `
    <section class="sourcing-detail-panel">
      <div class="sourcing-detail-return-row">
        <button class="ghost-btn sourcing-back-btn" type="button" onclick="selectSourcingPatient(null)" aria-label="Retour aux patients">
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="sourcing-detail-header">
        <div class="sourcing-detail-title">
          <div class="sourcing-detail-badges">
            ${sourcingStagePillMarkup(stage)}
            ${patient.patientType ? `<span class="result-pill">${escapeHtml(patient.patientType)}</span>` : ""}
          </div>
          <h3>${escapeHtml(patient.patientNumber || "Patient")}</h3>
          <div class="sourcing-detail-meta">
            ${patient.patientInitials ? `<span>${escapeHtml(patient.patientInitials)}</span>` : ""}
            ${patient.patientGender ? `<span>${escapeHtml(patient.patientGender)}</span>` : ""}
            ${patient.patientAge ? `<span>${escapeHtml(patient.patientAge)} ans</span>` : ""}
          </div>
        </div>
        <div class="detail-actions sourcing-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openSourcingModal('${escapeHtml(patient.id)}')">Modifier</button>
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Informations de réception</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Type", patient.patientType)}
          ${renderDetailRow("Date de réception", patient.patientReceptionDate ? formatDisplayDateFrench(patient.patientReceptionDate) : "")}
          ${renderDetailRow("Temps de culture", patient.patientCultureWeeks ? `${patient.patientCultureWeeks} semaines` : "")}
          ${renderDetailRow("Quantité de départ", patient.patientStartQuantity)}
          ${renderDetailRow("Nombre de puits réalisés", patient.patientWellsCount)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Information du lot</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Date de validation du lot", patient.patientLotValidationDate ? formatDisplayDateFrench(patient.patientLotValidationDate) : "")}
          ${renderDetailRow("Assignation étude", patient.patientStudyAssignment)}
          ${renderDetailRow("Cession — à qui", patient.patientCessionTo)}
          ${renderDetailRow("Cession — quand", patient.patientCessionDate ? formatDisplayDateFrench(patient.patientCessionDate) : "")}
          ${renderDetailRow("Utilisation et stockage", patient.patientUsageStorage)}
          ${renderDetailRow("Date fin de lot et élimination", patient.patientLotEndDate ? formatDisplayDateFrench(patient.patientLotEndDate) : "")}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Informations Patient</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Initiales", patient.patientInitials)}
          ${renderDetailRow("Site du prélèvement", patient.patientCollectionSite)}
          ${renderDetailRow("Genre", patient.patientGender)}
          ${renderDetailRow("Âge", patient.patientAge)}
          ${renderDetailRow("Taille", patient.patientHeight ? `${patient.patientHeight} cm` : "")}
          ${renderDetailRow("Poids", patient.patientWeight ? `${patient.patientWeight} kg` : "")}
          ${renderDetailRow("IMC", patient.patientBmi)}
          ${renderDetailRow("Technique", patient.patientTechnique)}
          ${renderDetailRow("Chirurgien", patient.patientSurgeon)}
          ${renderDetailRow("Caractéristique patient", patient.patientCharacteristic)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Co-morbidité / si obèse</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("NASH", patient.patientNash)}
          ${renderDetailRow("Apnée du sommeil", patient.patientSleepApnea)}
          ${renderDetailRow("DT2", patient.patientT2d)}
          ${renderDetailRow("Autre", patient.patientOtherComorbidity)}
          ${renderDetailRow("Intervention", patient.patientIntervention)}
          ${renderDetailRow("IMC MAX", patient.patientBmiMax)}
          ${renderDetailRow("Traitement d'intention", patient.patientIntentionTreatment)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Contrôle Qualité</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Myco", patient.patientQcMyco)}
          ${renderDetailRow("Bactéries", patient.patientQcBacteria)}
          ${renderDetailRow("Levures", patient.patientQcYeast)}
          ${renderDetailRow("XTT", patient.patientQcXtt)}
          ${renderDetailRow("Collagénase", patient.patientQcCollagenase)}
          ${renderDetailRow("ASC", patient.patientQcAsc)}
          ${renderDetailRow("Remarques", patient.patientQcRemarks)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>ARN</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Explant T0", patient.patientArnExplantT0)}
          ${renderDetailRow("WAT T14", patient.patientArnWatT14)}
          ${renderDetailRow("BAT T14", patient.patientArnBatT14)}
          ${renderDetailRow("Prebat ± AMPc", patient.patientArnPrebatAmpc)}
          ${renderDetailRow("Inductible en BAT (qPCR UCP1 positif)", patient.patientArnInducibleBat)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Milieu conditionné (sécrétions)</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Sécrétions T0", patient.patientSecretionsT0)}
          ${renderDetailRow("Sécrétions T14", patient.patientSecretionsT14)}
          ${renderDetailRow("Sécrétions BAT T14", patient.patientSecretionsBatT14)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Fixation</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Fixation T0", patient.patientFixationT0)}
          ${renderDetailRow("Fixation T14", patient.patientFixationT14)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Congélation</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Congélation", patient.patientFreezing)}
          ${renderDetailRow("Quantité", patient.patientFreezingQuantity)}
          ${renderDetailRow("Décongélation", patient.patientFreezingThaw)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Remarque générale</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Remarque générale", patient.patientGeneralRemark)}
        </div>
      </div>
    </section>
  `;
}

function renderSourcing() {
  const query = sourcingSearchInput ? sourcingSearchInput.value : "";
  const filtered = getFilteredSortedPatients(sourcingPatients, query, sourcingSortSelect?.value || "recent");

  const detail = selectedSourcingPatientId ? sourcingPatients.find(patient => patient.id === selectedSourcingPatientId) : null;
  const detailHost = document.querySelector("#sourcingDetail");
  if (detailHost) detailHost.innerHTML = detail ? renderSourcingDetail(detail) : "";
  document.querySelector("#sourcingGrid")?.classList.toggle("hidden", Boolean(detail));
  document.querySelector("#sourcingView")?.classList.toggle("sourcing-detail-mode", Boolean(detail));

  const resultCount = document.querySelector("#sourcingResultCount");
  if (resultCount) resultCount.textContent = `${filtered.length} patient${filtered.length > 1 ? "s" : ""}`;

  renderSourcingMetrics();

  const body = document.querySelector("#sourcingTableBody");
  if (body) body.innerHTML = filtered.length ? filtered.map(renderSourcingTableRow).join("") : `<tr><td colspan="8" class="empty-table-cell">${sourcingPatients.length ? "Aucun patient ne correspond à votre recherche." : "Aucun patient enregistré."}</td></tr>`;
}

function selectSourcingPatient(id) {
  selectedSourcingPatientId = id;
  renderSourcing();
}

function recalculatePatientBmi() {
  const bmiField = sourcingFields.patientBmi;
  if (!bmiField || bmiField.dataset.manual === "true") return;
  const height = StockTracking.parseLocalizedNumber(sourcingFields.patientHeight.value);
  const weight = StockTracking.parseLocalizedNumber(sourcingFields.patientWeight.value);
  if (!(height > 0) || !(weight > 0)) return;
  bmiField.value = Number((weight / ((height / 100) ** 2)).toFixed(1));
}

function hydrateSourcingForm(patient) {
  Object.keys(sourcingFields).forEach(key => {
    if (key === "sourcingPatientId") return;
    const field = sourcingFields[key];
    if (!field) return;
    field.value = key === "patientNumber" ? (patient?.patientNumber || suggestNextPatientNumber()) : (patient?.[key] || "");
  });
}

function openSourcingModal(id) {
  const patient = id ? sourcingPatients.find(entry => entry.id === id) : null;
  sourcingForm.reset();
  document.querySelector("#sourcingModalTitle").textContent = patient ? "Modifier le patient" : "Nouveau patient";
  document.querySelector("#sourcingError")?.classList.add("hidden");
  const deleteBtn = document.querySelector("#deleteSourcingPatientBtn");
  if (deleteBtn) deleteBtn.style.display = patient ? "inline-flex" : "none";
  sourcingFields.sourcingPatientId.value = patient?.id || "";
  hydrateSourcingForm(patient);
  sourcingFields.patientBmi.dataset.manual = patient?.patientBmi ? "true" : "false";
  sourcingDialog.showModal();
}

function saveSourcingPatient() {
  if (!sourcingForm.reportValidity()) return;
  const errorBox = document.querySelector("#sourcingError");
  errorBox?.classList.add("hidden");

  const patientNumber = normalizePatientNumber(sourcingFields.patientNumber.value);
  if (!patientNumber) {
    if (errorBox) { errorBox.textContent = "Le n° de patient est obligatoire."; errorBox.classList.remove("hidden"); }
    return;
  }

  const existingId = sourcingFields.sourcingPatientId.value;
  const duplicate = sourcingPatients.find(entry => entry.id !== existingId && normalizePatientNumber(entry.patientNumber).toLowerCase() === patientNumber.toLowerCase());
  if (duplicate) {
    if (errorBox) { errorBox.textContent = `Le n° de patient ${patientNumber} est déjà utilisé.`; errorBox.classList.remove("hidden"); }
    return;
  }

  const existingIndex = sourcingPatients.findIndex(entry => entry.id === existingId);
  const previousPatient = existingIndex >= 0 ? sourcingPatients[existingIndex] : null;
  const now = new Date();
  const displayNow = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(now);

  const patient = { id: existingId || createSafeItemId("pat"), source: "web" };
  Object.keys(sourcingFields).forEach(key => {
    if (key === "sourcingPatientId") return;
    const field = sourcingFields[key];
    if (!field) return;
    patient[key] = /remark/i.test(key) ? normalizeMultilineText(field.value) : field.value.trim();
  });
  patient.patientNumber = patientNumber;
  patient.createdAtRaw = previousPatient?.createdAtRaw || now.toISOString();
  patient.createdAt = previousPatient?.createdAt || displayNow;
  patient.updatedAt = displayNow;

  if (existingIndex >= 0) {
    sourcingPatients[existingIndex] = patient;
    addHistory("Patient sourcing modifié", `${currentName} a modifié le patient ${patient.patientNumber}.`);
  } else {
    sourcingPatients.unshift(patient);
    addHistory("Patient sourcing créé", `${currentName} a créé le patient ${patient.patientNumber}.`);
  }

  persist();
  selectedSourcingPatientId = patient.id;
  sourcingDialog.close();
  renderSourcing();
  renderHistory();
}

function requestSourcingPatientDeletion() {
  const id = sourcingFields.sourcingPatientId.value;
  const patient = sourcingPatients.find(entry => entry.id === id);
  if (!patient) return;
  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer le patient ${patient.patientNumber || ""} ? Cette action est irréversible.`,
    onConfirm: () => deleteSourcingPatient(id)
  });
}

function deleteSourcingPatient(id) {
  const patient = sourcingPatients.find(entry => entry.id === id);
  if (!patient) throw new Error("Ce patient n’existe plus.");
  sourcingPatients = sourcingPatients.filter(entry => entry.id !== id);
  addHistory("Patient sourcing supprimé", `${currentName} a supprimé le patient ${patient.patientNumber}.`);
  if (selectedSourcingPatientId === id) selectedSourcingPatientId = null;
  sourcingDialog.close();
  persist();
  renderSourcing();
  renderHistory();
}

function getItemLocations(item) {
  if (Array.isArray(item.placements) && item.placements.length) {
    return Array.from(new Set(item.placements.map(placementDisplayName).filter(Boolean)));
  }
  if (Array.isArray(item.locations)) return item.locations;
  if (item.location) return [item.location];
  return [];
}

function formatLocations(item) {
  const locations = getItemLocations(item);
  return locations.length ? locations.join(", ") : "Sans localisation";
}

function newStableId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
}

function placementDisplayName(placement) {
  const catalog = normalizeLocationCatalog(sharedState?.locationCatalog);
  const sublocation = catalog.sublocations.find(row => row.id === placement?.sublocationId);
  const location = catalog.locations.find(row => row.id === placement?.locationId);
  const room = FIXED_INVENTORY_ROOMS.find(row => row.id === placement?.roomId);
  return sublocation?.name || location?.name || room?.name || placement?.legacyValue || "";
}

function placementFullPathDisplayName(placement) {
  const catalog = normalizeLocationCatalog(sharedState?.locationCatalog);
  const sublocation = catalog.sublocations.find(row => row.id === placement?.sublocationId);
  const location = catalog.locations.find(row => row.id === (placement?.locationId || sublocation?.locationId));
  const room = FIXED_INVENTORY_ROOMS.find(row => row.id === (placement?.roomId || location?.roomId));
  const path = [room?.name, location?.name, sublocation?.name].filter(Boolean);
  return path.length ? path.join(" → ") : placement?.legacyValue || "";
}

function formatItemLocationPaths(item) {
  if (!Array.isArray(item?.placements) || !item.placements.length) return formatLocations(item);
  const paths = Array.from(new Set(item.placements.map(placementFullPathDisplayName).filter(Boolean)));
  return paths.length ? paths.join(", ") : "Sans localisation";
}

function readPlacementEditor() {
  return [...(placementsList?.querySelectorAll("[data-placement-row]") || [])].map(row => ({
    id: row.dataset.placementId || newStableId("placement"),
    roomId: row.querySelector("[data-placement-room]")?.value || null,
    locationId: row.querySelector("[data-placement-location]")?.value || null,
    sublocationId: row.querySelector("[data-placement-sublocation]")?.value || null
  }));
}

// Compatibilité avec les écrans de suivi de stock encore fondés sur un libellé plat.
function getSelectedLocations() {
  return readPlacementEditor().map(placementDisplayName).filter(Boolean);
}

function validatePlacements(placements, options = {}) {
  const catalog = normalizeLocationCatalog(sharedState.locationCatalog);
  const rows = [...(placementsList?.querySelectorAll("[data-placement-row]") || [])];
  rows.forEach(row => { const error=row.querySelector("[data-placement-row-error]"); if(error){error.textContent="";error.classList.add("hidden");} });
  let hasEmpty = false, invalid = false;
  placements.forEach((placement,index) => {
    const empty = !placement.roomId && !placement.locationId && !placement.sublocationId;
    if (empty) {
      hasEmpty = true;
      if (options.onSubmit) { const error=rows[index]?.querySelector("[data-placement-row-error]"); if(error){error.textContent="Veuillez sélectionner une salle ou supprimer cet emplacement vide.";error.classList.remove("hidden");} }
      return;
    }
    const location = placement.locationId && catalog.locations.find(row => row.id === placement.locationId);
    const sublocation = placement.sublocationId && catalog.sublocations.find(row => row.id === placement.sublocationId);
    invalid = invalid || (!placement.roomId && Boolean(placement.locationId || placement.sublocationId)) ||
      (placement.roomId && !FIXED_INVENTORY_ROOMS.some(row => row.id === placement.roomId)) ||
      (placement.locationId && (!location || location.roomId !== placement.roomId)) ||
      (placement.sublocationId && (!placement.locationId || !sublocation || sublocation.locationId !== placement.locationId));
  });
  const keys = placements.filter(row => row.roomId || row.locationId || row.sublocationId).map(row => `${row.roomId}|${row.locationId || ""}|${row.sublocationId || ""}`);
  const message = invalid ? "Un emplacement contient une hiérarchie incohérente." : new Set(keys).size !== keys.length ? "Un même chemin ne peut pas être ajouté deux fois." : "";
  placementsError?.classList.toggle("hidden", !message);
  if (placementsError) placementsError.textContent = message;
  fields.location.setCustomValidity(message);
  return !message && !(options.onSubmit && hasEmpty);
}

function renderPlacementEditor(placements = readPlacementEditor()) {
  if (!placementsList) return;
  const catalog = normalizeLocationCatalog(sharedState.locationCatalog);
  const safePlacements = placements.length ? placements : [{ id: newStableId("placement"), roomId: "", locationId: null, sublocationId: null }];
  placementsList.innerHTML = safePlacements.map((placement, index) => {
    const roomLocations = catalog.locations.filter(row => row.roomId === placement.roomId);
    const sublocations = catalog.sublocations.filter(row => row.locationId === placement.locationId);
    return `<section class="placement-row" data-placement-row data-placement-id="${escapeHtml(placement.id)}">
      <div class="placement-row-title"><strong>Emplacement ${index + 1}</strong><button class="icon-btn" type="button" data-remove-placement aria-label="Retirer cet emplacement" ${safePlacements.length === 1 ? "disabled" : ""}>×</button></div>
      <label>Salle<select data-placement-room required><option value="">Sélectionner une salle</option>${FIXED_INVENTORY_ROOMS.map(room => `<option value="${room.id}" ${room.id === placement.roomId ? "selected" : ""}>${escapeHtml(room.name)}</option>`).join("")}</select></label>
      ${roomLocations.length ? `<label>Localisation<select data-placement-location><option value="">Aucune — directement dans la salle</option>${roomLocations.map(location => `<option value="${location.id}" ${location.id === placement.locationId ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("")}</select></label>` : ""}
      ${sublocations.length ? `<label>Sous-localisation<select data-placement-sublocation><option value="">Aucune — directement dans la localisation</option>${sublocations.map(sub => `<option value="${sub.id}" ${sub.id === placement.sublocationId ? "selected" : ""}>${escapeHtml(sub.name)}</option>`).join("")}</select></label>` : ""}
      <small class="field-validation-message hidden placement-row-error" data-placement-row-error aria-live="polite"></small>
    </section>`;
  }).join("");
  fields.location.value = safePlacements.every(row => row.roomId) ? "valid" : "";
  placementsList.querySelectorAll("[data-placement-room]").forEach((select, index) => select.addEventListener("change", () => {
    const next = readPlacementEditor(); next[index].roomId = select.value; next[index].locationId = null; next[index].sublocationId = null; renderPlacementEditor(next);
  }));
  placementsList.querySelectorAll("[data-placement-location]").forEach(select => select.addEventListener("change", () => {
    const row = select.closest("[data-placement-row]"), next = readPlacementEditor(), index = [...placementsList.children].indexOf(row); next[index].locationId = select.value || null; next[index].sublocationId = null; renderPlacementEditor(next);
  }));
  placementsList.querySelectorAll("[data-placement-sublocation]").forEach(select => select.addEventListener("change", () => validatePlacements(readPlacementEditor())));
  placementsList.querySelectorAll("[data-remove-placement]").forEach((button, index) => button.addEventListener("click", () => { const next = readPlacementEditor(); next.splice(index, 1); renderPlacementEditor(next); }));
  validatePlacements(readPlacementEditor());
}

function renderLocationOptions() { renderPlacementEditor([]); }
document.querySelector("#addPlacementBtn")?.addEventListener("click", event => {
  event.currentTarget.disabled = true;
  const next = readPlacementEditor(); next.push({ id: newStableId("placement"), roomId: "", locationId: null, sublocationId: null }); renderPlacementEditor(next);
  event.currentTarget.disabled = false;
});

function selectItem(id) {
  selectedItemId = id;
  renderInventory();
}

function selectExperiment(id) {
  if (id) {
    viewReturnScrollY.experiments = getPageScrollY();
  }

  selectedExperimentId = id;
  renderExperiments();

  if (!id) {
    restorePageScrollY(viewReturnScrollY.experiments);
  }
}

function selectOrder(id) {
  selectedOrderId = id;
  renderOrders();
}

function openSampleDetail(id, context = {}) {
  if (selectedSampleId === id) {
    returnFromSampleDetail();
    return;
  }

  sampleReturnContext = {
    view: context.view || activeView || "samples",
    location: context.location ?? selectedLocation ?? null,
    scrollY: getPageScrollY()
  };

  selectedSampleId = id;
  selectedSampleGroupId = null;
  activeView = "samples";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "samples");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#samplesView")?.classList.add("active");

  controlBar?.classList.add("hidden");
  syncAppViewMode();

  renderSamples();
}

function returnFromSampleDetail() {
  selectedSampleId = null;
  activeView = sampleReturnContext.view || "samples";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${activeView}View`)?.classList.add("active");

  controlBar?.classList.toggle("hidden", activeView !== "inventory");
  syncAppViewMode();

  if (activeView === "locations") {
    selectedLocation = sampleReturnContext.location;
    renderLocations();
  } else {
    render();
  }

  restorePageScrollY(sampleReturnContext.scrollY);
}

function openItemFromExperiment(id) {
  selectedItemId = id;
  activeView = "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "inventory");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#inventoryView").classList.add("active");

  controlBar.classList.remove("hidden");
  syncAppViewMode();

  renderInventory();
}

function openItemDetail(id, context = {}) {
  itemReturnContext = {
    view: context.view || activeView || "inventory",
    experimentId: context.experimentId ?? selectedExperimentId ?? null,
    location: context.location ?? selectedLocation ?? null,
    scrollY: getPageScrollY()
  };

  if (selectedItemId !== id) stockJournalOpenByItem.set(id, false);
  selectedItemId = id;
  activeView = "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "inventory");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#inventoryView").classList.add("active");

  controlBar.classList.remove("hidden");
  syncAppViewMode();

  renderInventory();
}

function returnFromItemDetail() {
  selectedItemId = null;

  if (itemReturnContext.view === "experiments" && itemReturnContext.experimentId) {
    activeView = "experiments";
    selectedExperimentId = itemReturnContext.experimentId;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === "experiments");
    });

    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    document.querySelector("#experimentsView").classList.add("active");

    controlBar.classList.add("hidden");
    syncAppViewMode();

    renderExperiments();
    restorePageScrollY(itemReturnContext.scrollY);
    return;
  }

  activeView = itemReturnContext.view || "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${activeView}View`).classList.add("active");

  controlBar.classList.toggle("hidden", activeView !== "inventory");
  syncAppViewMode();

  if (activeView === "inventory") {
    renderMetrics();
    renderAlerts();
    renderInventory();
    restorePageScrollY(itemReturnContext.scrollY);
    return;
  }

  render();
  restorePageScrollY(itemReturnContext.scrollY);
}

function openSampleModal(id, options = {}) {
  const groupSamples = options.groupId ? getReplicaGroupSamples(options.groupId) : [];
  const storedSample = id ? clientSamples.find(entry => entry.id === id) : null;
  const sample = getEffectiveClientSample(storedSample || groupSamples[0]);
  const sampleClientCode = sample ? getSampleCanonicalClientCode(sample) : "";
  sampleEditContext = groupSamples.length
    ? { scope: "group", groupId: options.groupId, sampleId: null }
    : storedSample?.replicaNumber
      ? { scope: "replica", groupId: storedSample.groupId || getReplicaFamilyKey(storedSample), sampleId: storedSample.id }
      : storedSample
        ? { scope: "single", groupId: null, sampleId: storedSample.id }
        : { scope: "new", groupId: null, sampleId: null };

  sampleForm.reset();
  document.querySelector("#sampleModalTitle").textContent = groupSamples.length
    ? `Modifier le groupe et ses ${groupSamples.length} réplicats`
    : storedSample?.replicaNumber
      ? `Modifier uniquement le réplicat ${storedSample.replicaNumber}`
      : sample
        ? "Modifier produit / échantillon client"
        : "Nouveau produit / échantillon client";
  document.querySelector("#deleteSampleBtn").style.display = storedSample ? "inline-block" : "none";

  sampleFields.sampleId.value = storedSample?.id || "";
  sampleFields.sampleType.value = sample?.type || "client_product";
  sampleFields.sampleClientCode.value = sample?.rawClientCode || sampleClientCode;
  sampleFields.sampleProductName.value = sample?.type === "client_product" ? sample.name : "";
  sampleFields.sampleBaseName.value = sample?.baseName || (sample?.type === "created_sample" ? sample.name : "");
  sampleFields.sampleCategory.value = sample?.category || clientSampleCategories[0];
  sampleFields.sampleArnQiazol.checked = sample?.category === "ARN"
    ? sample.arnQiazol !== false
    : true;
  sampleFields.sampleArnBead.checked = sample?.category === "ARN"
    ? Boolean(sample.arnBead && sample?.arnQiazol !== false)
    : false;
  sampleFields.sampleArrivalDate.value = sample?.arrivalDate || "";
  sampleFields.sampleCreationDate.value = sample?.creationDate || "";
  sampleFields.sampleQuantity.value = sample?.type === "client_product" ? sample.quantity ?? "" : "";
  sampleFields.sampleUnit.value = sample?.type === "client_product" ? sample.unit || "" : "";
  sampleFields.sampleMeasureValue.value = sample?.measureValue ?? "";
  sampleFields.sampleReplicaCount.value = "1";
  sampleFields.sampleReplicaCount.disabled = Boolean(sample);
  sampleFields.sampleLocation.value = sample?.location || inventoryLocations[0];
  sampleFields.sampleReferenceNumber.value = sample?.referenceNumber || "";
  sampleFields.sampleLotNumber.value = sample?.lotNumber || "";
  sampleFields.sampleNotes.value = sampleEditContext.scope === "group"
    ? sample?.generalNotes || sample?.generalData?.notes || ""
    : sample?.notes || "";

  syncSampleFormVisibility();
  updateClientCodeHint();
  sampleDialog.showModal();
}

function syncSampleFormVisibility() {
  const type = sampleFields.sampleType.value;
  const isCreated = type === "created_sample";

  document.querySelectorAll(".sample-client-product-field").forEach(element => {
    element.classList.toggle("hidden", isCreated);
  });

  document.querySelectorAll(".sample-created-field").forEach(element => {
    element.classList.toggle("hidden", !isCreated);
  });

  sampleFields.sampleProductName.required = !isCreated;
  sampleFields.sampleArrivalDate.required = !isCreated;
  sampleFields.sampleQuantity.required = !isCreated;
  sampleFields.sampleUnit.required = !isCreated;
  sampleFields.sampleBaseName.required = isCreated;
  sampleFields.sampleCategory.required = isCreated;
  sampleFields.sampleCreationDate.required = isCreated;
  sampleFields.sampleMeasureValue.required = isCreated;

  syncSampleMeasureLabel();
}

function getCreatedSampleUnit(category, arnQiazol = true) {
  if (category === "ARN") return arnQiazol ? "mg" : "µL";
  if (category === "cDNA") return "µL";
  if (category === "Sécrétion") return "mL";
  return "mg";
}

function syncSampleMeasureLabel(options = {}) {
  const category = sampleFields.sampleCategory.value;
  const isArn = sampleFields.sampleType.value === "created_sample" && category === "ARN";
  const previousUnit = sampleFields.sampleMeasureValue.dataset.measureUnit || "";
  const unit = getCreatedSampleUnit(category, sampleFields.sampleArnQiazol.checked);
  sampleFields.sampleArnOptions.classList.toggle("hidden", !isArn);
  sampleFields.sampleArnNotesHint.classList.toggle("hidden", !isArn);
  sampleFields.sampleArnBead.disabled = !isArn || !sampleFields.sampleArnQiazol.checked;
  if (!isArn || !sampleFields.sampleArnQiazol.checked) sampleFields.sampleArnBead.checked = false;
  if (options.clearOnUnitChange && previousUnit && previousUnit !== unit) {
    sampleFields.sampleMeasureValue.value = "";
  }
  sampleFields.sampleMeasureValue.dataset.measureUnit = unit;
  sampleFields.sampleMeasureLabel.innerHTML = `${unit === "mg" ? "Poids" : "Volume"} (${unit}) <span class="required-star">*</span>`;
}

window.ExadexClientSampleRules = {
  getCreatedSampleUnit,
  getClientSampleCategoryLabel,
  migrateClientSamples,
  syncSampleMeasureLabel,
  fields: sampleFields
};

function saveSample() {
  syncSampleFormVisibility();
  if (!sampleForm.reportValidity()) return;

  const existingId = sampleFields.sampleId.value.trim();
  const existingSample = existingId
    ? clientSamples.find(entry => entry.id === existingId)
    : null;

  const type = sampleFields.sampleType.value;
  const now = new Date();
  const clientInfo = ensureClientForCode(sampleFields.sampleClientCode.value.trim());
  if (!clientInfo.normalizedKey) {
    window.alert("Merci d'entrer un code client valide.");
    return;
  }

  const base = {
    id: existingId || "",
    type,
    clientCode: clientInfo.canonicalCode,
    rawClientCode: clientInfo.rawCode,
    normalizedClientKey: clientInfo.normalizedKey,
    clientId: clientInfo.id,
    canonicalClientCode: clientInfo.canonicalCode,
    location: sampleFields.sampleLocation.value,
    notes: normalizeMultilineText(sampleFields.sampleNotes.value),
    createdAtRaw: existingSample?.createdAtRaw || now.toISOString(),
    createdAt: existingSample?.createdAt || new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(now)
  };

  if (type === "client_product") {
    const sample = {
      ...base,
      id: existingId || createSafeItemId("sample-client"),
      name: sampleFields.sampleProductName.value.trim(),
      arrivalDate: sampleFields.sampleArrivalDate.value,
      quantity: Number(sampleFields.sampleQuantity.value),
      unit: sampleFields.sampleUnit.value.trim(),
      referenceNumber: sampleFields.sampleReferenceNumber.value.trim(),
      lotNumber: sampleFields.sampleLotNumber.value.trim(),
      category: "",
      baseName: ""
    };

    upsertClientSamples([sample], existingId);
    addHistory(
      existingId ? "Produit client modifié" : "Produit client ajouté",
      `${currentName} a ${existingId ? "modifié" : "ajouté"} ${sample.name} pour ${sample.canonicalClientCode}.`
    );
  } else {
    const baseName = sampleFields.sampleBaseName.value.trim();
    const replicaCount = sampleEditContext.scope === "new"
      ? Math.max(1, Number(sampleFields.sampleReplicaCount.value || 1))
      : sampleEditContext.scope === "group"
        ? getReplicaGroupSamples(sampleEditContext.groupId).length
        : 1;
    const category = sampleFields.sampleCategory.value;
    const arnQiazol = category === "ARN" ? sampleFields.sampleArnQiazol.checked : null;
    const arnBead = category === "ARN" ? Boolean(arnQiazol && sampleFields.sampleArnBead.checked) : null;
    const measureUnit = getCreatedSampleUnit(category, arnQiazol !== false);
    const measureValue = Number(sampleFields.sampleMeasureValue.value);
    const editableData = {
      type,
      clientCode: base.clientCode,
      rawClientCode: base.rawClientCode,
      normalizedClientKey: base.normalizedClientKey,
      clientId: base.clientId,
      canonicalClientCode: base.canonicalClientCode,
      location: base.location,
      baseName,
      category,
      arnQiazol,
      arnBead,
      creationDate: sampleFields.sampleCreationDate.value,
      measureValue,
      measureUnit,
      quantity: measureValue,
      unit: measureUnit,
      arrivalDate: "",
      referenceNumber: "",
      lotNumber: ""
    };

    if (sampleEditContext.scope === "group") {
      const groupSamples = getReplicaGroupSamples(sampleEditContext.groupId);
      clientSamples = clientSamples.map(sample => {
        if (!groupSamples.some(entry => entry.id === sample.id)) return sample;
        const generalData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
        const effective = { ...sample, ...generalData, ...(sample.specificData || {}) };
        return {
          ...effective,
          id: sample.id,
          replicaId: sample.replicaId || sample.id,
          groupId: sampleEditContext.groupId,
          replicaNumber: sample.replicaNumber,
          replicaCount: groupSamples.length,
          name: `${effective.baseName || baseName} ${sample.replicaNumber}`,
          generalData,
          specificData: sample.specificData || {}
        };
      });
    } else if (sampleEditContext.scope === "replica" && existingSample) {
      const specificData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
      const index = clientSamples.findIndex(entry => entry.id === existingSample.id);
      clientSamples[index] = {
        ...existingSample,
        ...(existingSample.generalData || {}),
        ...specificData,
        id: existingSample.id,
        replicaId: existingSample.replicaId || existingSample.id,
        groupId: existingSample.groupId || sampleEditContext.groupId,
        replicaNumber: existingSample.replicaNumber,
        replicaCount: existingSample.replicaCount,
        name: `${baseName} ${existingSample.replicaNumber}`,
        generalData: existingSample.generalData || {},
        specificData
      };
    } else {
      const groupId = replicaCount > 1 ? createSafeItemId("sample-group") : "";
      const generalData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
      const samplesToSave = Array.from({ length: replicaCount }, (_, index) => {
      const replicaNumber = index + 1;
      const name = replicaCount > 1 ? `${baseName} ${replicaNumber}` : baseName;
      const id = existingId || createSafeItemId("sample-created");

      return {
        ...base,
        ...generalData,
        id,
        replicaId: id,
        groupId,
        name,
        replicaNumber: replicaCount > 1 ? replicaNumber : existingSample?.replicaNumber || null,
        replicaCount: replicaCount > 1 ? replicaCount : existingSample?.replicaCount || 1,
        generalData: replicaCount > 1 ? generalData : {},
        specificData: {}
      };
      });

      upsertClientSamples(samplesToSave, existingId);
    }
    addHistory(
      existingId ? "Échantillon client modifié" : "Échantillons clients ajoutés",
      `${currentName} a ${sampleEditContext.scope === "new" ? "ajouté" : "modifié"} ${replicaCount} échantillon${replicaCount > 1 ? "s" : ""} ${baseName} pour ${base.canonicalClientCode}.`
    );
  }

  persist();
  sampleDialog.close();
  selectedSampleId = null;
  selectedSampleGroupId = null;
  render();
}

function upsertClientSamples(samplesToSave, existingId = "") {
  if (existingId) {
    const index = clientSamples.findIndex(entry => entry.id === existingId);
    if (index >= 0) {
      clientSamples[index] = samplesToSave[0];
      return;
    }
  }

  clientSamples = [...samplesToSave, ...clientSamples];
}

function requestSampleDeletionFromModal() {
  const id = sampleFields.sampleId.value;
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const message = sample.replicaNumber
    ? `Êtes-vous sûr de vouloir supprimer uniquement le réplicat ${sample.replicaNumber} ? Cette action est irréversible.`
    : `Êtes-vous sûr de vouloir supprimer “${sample.name}” de cette étude client ? Cette action est irréversible.`;
  openDeleteConfirmation({
    message,
    onConfirm: () => performSampleDeletion(id, { closeModal: true })
  });
}

function preparePlacementsForTarget(existingPlacements, targetPlacement) {
  const placements = (Array.isArray(existingPlacements) ? existingPlacements : []).map(row => ({ ...row }));
  if (!targetPlacement) return placements;
  const exact = placements.some(row => row.roomId === targetPlacement.roomId && row.locationId === targetPlacement.locationId && row.sublocationId === targetPlacement.sublocationId);
  if (exact) return placements;
  const directIndex = placements.findIndex(row => row.roomId === targetPlacement.roomId && !row.locationId && !row.sublocationId);
  if (directIndex >= 0) placements[directIndex] = { ...placements[directIndex], roomId: targetPlacement.roomId, locationId: targetPlacement.locationId, sublocationId: targetPlacement.sublocationId };
  else placements.push({ ...targetPlacement, id: targetPlacement.id || newStableId("placement") });
  return placements;
}

function openModal(id, options = {}) {
  const item = items.find(entry => entry.id === id);
  const prefill = options.prefill || {};
  const references = normalizeReferences(item?.references);
  document.querySelector("#modalTitle").textContent = item ? "Modifier item" : "Nouvel item";
  document.querySelector("#deleteItemBtn").style.display = item ? "inline-block" : "none";
  fields.itemId.value = item?.id || "";
  fields.name.value = item?.name || prefill.name || "";
  fields.category.value = item?.category || prefill.category || inventoryCategories[0];
  fields.quantity.value = item?.quantity ?? prefill.quantity ?? "";
  fields.unit.value = item?.unit || prefill.unit || "";
  fields.minStock.value = item?.minStock ?? prefill.minStock ?? "";
  setUsageProfile(item?.usageProfile || "normal");
  const prefillPlacements = prefill.placements || (prefill.roomId ? [{ id: newStableId("placement"), roomId: prefill.roomId, locationId: prefill.locationId || null, sublocationId: prefill.sublocationId || null }] : []);
  let modalPlacements = item?.placements ? item.placements.map(row=>({...row})) : prefillPlacements;
  modalPlacements = preparePlacementsForTarget(modalPlacements, options.targetPlacement || options.appendPlacement);
  renderPlacementEditor(modalPlacements);
  fields.tags.value = item?.tags?.join(", ") || prefill.tags?.join(", ") || "";
  fields.notes.value = item?.notes || prefill.notes || "";
  fields.primarySupplier.value = references.primary.supplier || "";
  fields.primarySupplierContactId.value = resolveExactSupplierContact(fields.primarySupplier.value,item?.supplierContactId)?.id || "";
  hydrateSupplierContactOptions();
  fields.primaryReference.value = references.primary.reference || "";
  fields.primaryLink.value = references.primary.link || "";
  fields.primaryReferenceNotes.value = references.primary.notes || "";
  fields.primaryPrice.value = references.primary.price || "";
  fields.primaryUnitPrice.value = references.primary.unitPrice || "";
  fields.primaryLeadTime.value = references.primary.leadTime || "";
  renderSecondaryReferences(references.secondary);
  hydrateTrackingForm(item);
  dialog.showModal();
}

function saveItem() {
  syncTrackingConfigVisibility();
  if (!validateTrackingUnitSelection()) return;
  const placements = readPlacementEditor();
  if (!validatePlacements(placements, { onSubmit: true })) return;
  if (!form.reportValidity()) return;
  syncPrimarySupplierContact();
  const existingId = fields.itemId.value.trim();

  const existingItem = existingId
    ? items.find(entry => entry.id === existingId)
    : null;
  const actionManagedStock = Boolean(existingItem);

  const item = {
    id: existingId || `web-${Date.now()}`,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: actionManagedStock ? Number(existingItem.quantity) : StockTracking.parseLocalizedNumber(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: parseStockMinimum(fields.minStock.value),
    usageProfile: normalizeUsageProfile(fields.usageProfile.value),
    placements,
    locations: Array.from(new Set(placements.map(placementDisplayName).filter(Boolean))),
    location: placementDisplayName(placements[0]) || "",
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: normalizeMultilineText(fields.notes.value),
    references: getItemReferences(),
    supplierContactId: fields.primarySupplierContactId.value || undefined,
    createdAtRaw: existingItem?.createdAtRaw || new Date().toISOString(),
    createdAt: existingItem?.createdAt || new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date())
  };
  let trackingConfig;
  try {
    trackingConfig = readTrackingForm(existingItem || item);
  } catch (error) {
    if (error.code === "MIGRATION_PENDING") return;
    trackingFields.packagingPreview.textContent = error.message || String(error);
    trackingFields.packagingPreview.classList.add("confirmation-modal-error");
    (/aliquote|préparation/i.test(error.message || "") ? trackingFields.aliquotTrackingEnabled : trackingFields.detailedPackagingEnabled).focus();
    return;
  }
  trackingFields.packagingPreview.classList.remove("confirmation-modal-error");
  item.stockTracking = trackingConfig.stockTracking;
  item.aliquotTracking = trackingConfig.aliquotTracking;
  if (trackingConfig.migrationEvent) item.quantity = StockTracking.available(item);

  const isSeedItem = seedBaseItems.some(entry => entry.id === item.id);
  const itemIndex = items.findIndex(entry => entry.id === item.id);

  if (itemIndex >= 0) {
    items[itemIndex] = {
      ...items[itemIndex],
      ...item,
      source: isSeedItem ? "seed" : (items[itemIndex].source || "web")
    };
    addHistory("Item modifié", `${currentName} a modifié ${item.name}.`);
  } else {
    items.unshift({ ...item, source: "web" });
    addHistory("Item ajouté", `${currentName} a ajouté ${item.name} dans ${item.category}.`);
  }

  if (trackingConfig.migrationEvent) stockMovements.push(trackingConfig.migrationEvent);

  if (pendingOrderInventoryLink && !existingId) {
    linkCreatedItemToOrder(pendingOrderInventoryLink.orderId, item);
    pendingOrderInventoryLink = null;
  }

  persist();
  dialog.close();
  render();
}

function renderPackagingLevelRow(level = {}, index = 0) {
  const unit = level.singular || "";
  return `<section class="packaging-level-row" data-level-index="${index}">
    <div class="packaging-level-heading"><strong>${index === 0 ? "Contenant principal fermé" : "Contenu"}</strong><span aria-hidden="true">—</span><small>${index === 0 ? "Il s’agit du contenant que vous recevez et stockez fermé." : "Définissez ce que contient le niveau précédent."}</small></div>
    <div class="packaging-level-fields">
      <label>Unité<input data-packaging-unit required placeholder="${index === 0 ? "carton" : index === 1 ? "sachet" : "tube"}" value="${escapeHtml(unit)}"></label>
      ${index ? `<label data-contains-label>Quantité contenue<input data-packaging-contains type="number" min="1" step="1" required value="${Number(level.contains || 1)}"></label>` : `<span class="packaging-empty-field" aria-hidden="true"></span>`}
      <button class="icon-btn" type="button" data-remove-packaging aria-label="Supprimer ce niveau" ${index === 0 ? "disabled" : ""}>×</button>
    </div>
  </section>`;
}

function hydrateTrackingForm(item) {
  const tracking = StockTracking.normalizeTracking(item || {});
  const aliquots = StockTracking.normalizeAliquots(item || {});
  trackingFields.stockTrackingMode.value = tracking.mode;
  trackingFields.detailedPackagingEnabled.checked = tracking.mode === "containers";
  trackingFields.aliquotTrackingEnabled.checked = aliquots.enabled;
  fields.quantity.readOnly = Boolean(item);
  fields.quantity.title = fields.quantity.readOnly ? "Utilisez « Mettre à jour le stock » pour modifier cette quantité de manière tracée." : "";
  trackingFields.packagingLevels.innerHTML = tracking.packagingLevels.map(renderPackagingLevelRow).join("");
  syncTrackingConfigVisibility(); updateTrackingUnitOptions(tracking.trackingUnitKey); updatePackagingPreview();
}

function syncTrackingOptionCheckboxes(changedOption = "") {
  const existingItem = items.find(entry => entry.id === fields.itemId.value.trim());
  const previousTracking = StockTracking.normalizeTracking(existingItem || {}), previousAliquots = StockTracking.normalizeAliquots(existingItem || {});
  let message = "";
  if (changedOption === "packaging" && !trackingFields.detailedPackagingEnabled.checked && previousTracking.mode === "containers" && (StockTracking.totalClosed(previousTracking) > 0 || previousTracking.openContainers.some(row => row.status === "open"))) {
    trackingFields.detailedPackagingEnabled.checked = true;
    message = "Le suivi détaillé ne peut pas être désactivé tant que les contenants actifs n’ont pas été consolidés proprement.";
  }
  const hasAliquotHistory = existingItem && stockMovements.some(event => event.itemId === existingItem.id && String(event.type || "").includes("aliquot"));
  if (changedOption === "aliquots" && !trackingFields.aliquotTrackingEnabled.checked && (previousAliquots.preparations.length > 0 || hasAliquotHistory)) {
    trackingFields.aliquotTrackingEnabled.checked = true;
    message = "Cette option ne peut pas être désactivée tant que des préparations, des aliquotes actives ou un historique associé existent.";
  }
  trackingFields.stockTrackingMode.value = trackingFields.detailedPackagingEnabled.checked ? "containers" : "simple";
  trackingFields.aliquotTrackingExplanation.classList.toggle("hidden", !trackingFields.aliquotTrackingEnabled.checked);
  trackingFields.aliquotTrackingExplanation.textContent = trackingFields.detailedPackagingEnabled.checked ? "Vous pourrez sélectionner le contenant utilisé pour chaque préparation." : "Les préparations utiliseront directement le stock global de l’item.";
  trackingFields.trackingOptionError.textContent = message;
  trackingFields.trackingOptionError.classList.toggle("hidden", !message);
  if (existingItem) { fields.quantity.readOnly = true; fields.quantity.title = "Utilisez « Mettre à jour le stock » pour modifier cette quantité de manière tracée."; }
  syncTrackingConfigVisibility();
}

function syncTrackingConfigVisibility() {
  trackingFields.stockTrackingMode.value = trackingFields.detailedPackagingEnabled?.checked ? "containers" : "simple";
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  trackingFields.packagingConfig?.classList.toggle("hidden", !advancedMode);
  trackingFields.packagingConfig?.querySelectorAll("input, select").forEach(control => {
    control.disabled = !advancedMode;
  });
  const hasInteriorLevel = Boolean(trackingFields.packagingLevels?.querySelectorAll(".packaging-level-row").length > 1);
  trackingFields.trackingUnitField?.classList.toggle("hidden", !advancedMode || !hasInteriorLevel);
  if (trackingFields.aliquotTrackingExplanation) {
    trackingFields.aliquotTrackingExplanation.classList.toggle("hidden", !trackingFields.aliquotTrackingEnabled?.checked);
    trackingFields.aliquotTrackingExplanation.textContent = advancedMode ? "Vous pourrez sélectionner le contenant utilisé pour chaque préparation." : "Les préparations utiliseront directement le stock global de l’item.";
  }
  syncTrackingUnitValidationState();
}

function getTrackingUnitValidationState() {
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  const rows = Array.from(trackingFields.packagingLevels?.querySelectorAll(".packaging-level-row") || []);
  const validInteriorLevels = rows.length >= 2 && rows.slice(1).every(row => {
    const unit = row.querySelector("[data-packaging-unit]")?.value.trim();
    const contains = Number(row.querySelector("[data-packaging-contains]")?.value);
    return Boolean(unit) && Number.isFinite(contains) && contains > 0;
  });
  return { advancedMode, validInteriorLevels, applicable: advancedMode && validInteriorLevels };
}

function syncTrackingUnitValidationState() {
  const select = trackingFields.trackingUnitKey;
  if (!select) return;
  const { applicable } = getTrackingUnitValidationState();
  select.disabled = !applicable;
  select.required = applicable;
  if (applicable) select.setAttribute("name", "trackingUnitKey");
  else select.removeAttribute("name");
  if (!applicable || select.value) {
    select.setCustomValidity("");
    document.querySelector("#trackingUnitError")?.classList.add("hidden");
  }
}

function validateTrackingUnitSelection() {
  const select = trackingFields.trackingUnitKey;
  const { applicable } = getTrackingUnitValidationState();
  if (!select || !applicable || select.value) return true;
  const message = "Sélectionnez l’unité utilisée pour compter le contenu des contenants ouverts.";
  select.setCustomValidity(message);
  const details = trackingFields.packagingConfig?.closest("details");
  if (details) details.open = true;
  trackingFields.trackingUnitField?.classList.remove("hidden");
  const error = document.querySelector("#trackingUnitError");
  if (error) { error.textContent = message; error.classList.remove("hidden"); }
  select.scrollIntoView({ behavior: "smooth", block: "center" });
  select.reportValidity();
  select.focus({ preventScroll: true });
  return false;
}

function getPackagingLevelsFromForm() {
  return Array.from(trackingFields.packagingLevels.querySelectorAll(".packaging-level-row")).map((row, index) => ({ id: `level-${index + 1}`, ...StockTracking.normalizeUnitLabel(row.querySelector("[data-packaging-unit]").value), contains: index ? Number(row.querySelector("[data-packaging-contains]").value) : 1 }));
}

function updatePackagingPreview() {
  const rows = Array.from(trackingFields.packagingLevels.querySelectorAll(".packaging-level-row"));
  const levels = getPackagingLevelsFromForm();
  rows.forEach((row, index) => { const level = levels[index], previous = levels[index - 1]; row.querySelector(".packaging-level-heading strong").textContent = index === 0 ? "Contenant principal fermé" : `Contenu du ${previous?.singular || "contenant"}`; const label = row.querySelector("[data-contains-label]"); if (label) label.childNodes[0].textContent = `Combien de ${level.plural} contient un ${previous?.singular || "contenant"} ?`; });
  updateTrackingUnitOptions(trackingFields.trackingUnitKey?.value);
  const complete = levels.length >= 2 && rows.every((row, index) => row.querySelector("[data-packaging-unit]").value.trim() && (!index || Number(row.querySelector("[data-packaging-contains]").value) > 0));
  if (!complete || !trackingFields.trackingUnitKey.value) { trackingFields.packagingPreview.textContent = "Complétez les informations ci-dessus pour voir un exemple."; return; }
  const preview = StockTracking.packagingPreview(levels, trackingFields.trackingUnitKey.value);
  trackingFields.packagingPreview.innerHTML = `<strong>${escapeHtml(preview.equation)}</strong><span>${escapeHtml(preview.sentence)}</span>`;
}

function updateTrackingUnitOptions(selectedKey = "") {
  const levels = getPackagingLevelsFromForm(), inner = levels.slice(1);
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  trackingFields.trackingUnitField.classList.toggle("hidden", !advancedMode || !inner.length);
  const current = selectedKey || trackingFields.trackingUnitKey.value;
  trackingFields.trackingUnitKey.innerHTML = `<option value="">Sélectionner une unité</option>${inner.map(level => `<option value="${escapeHtml(level.key)}">${escapeHtml(level.plural)}</option>`).join("")}`;
  if (inner.some(level => level.key === current)) trackingFields.trackingUnitKey.value = current;
  syncTrackingUnitValidationState();
}

function readTrackingForm(existingItem) {
  const previous = StockTracking.normalizeTracking(existingItem || {}), mode = trackingFields.stockTrackingMode.value;
  const previousAliquots = StockTracking.normalizeAliquots(existingItem || {}), activeContainers = previous.openContainers.some(row => row.status === "open") || StockTracking.totalClosed(previous) > 0;
  if (previous.mode === "containers" && mode === "simple" && activeContainers) throw new Error("Le suivi avancé ne peut pas être désactivé tant que des contenants sont actifs.");
  if (!trackingFields.aliquotTrackingEnabled.checked && (previousAliquots.preparations.length > 0 || stockMovements.some(event => event.itemId === existingItem?.id && String(event.type || "").includes("aliquot")))) throw new Error("Cette option ne peut pas être désactivée tant que des préparations ou un historique d’aliquotes existent.");
  const activeEntities = activeContainers || previousAliquots.preparations.some(row => row.status === "active");
  const levels = getPackagingLevelsFromForm();
  if (mode === "containers" && levels.length < 2) throw new Error("Ajoutez au moins un niveau de contenu pour suivre un contenant ouvert.");
  if (!levels.length || levels.some(level => !level.singular || !level.plural || level.contains <= 0)) throw new Error("La configuration du conditionnement est incomplète.");
  const selectedTrackingUnit = levels.find(level => level.key === trackingFields.trackingUnitKey.value);
  if (mode === "containers" && !selectedTrackingUnit) throw new Error("Sélectionnez l’unité de comptage des contenants ouverts.");
  const structuralChanged = JSON.stringify(previous.packagingLevels.map(({ singular, plural, contains }) => ({ singular, plural, contains }))) !== JSON.stringify(levels.map(({ singular, plural, contains }) => ({ singular, plural, contains })));
  if (previous.mode === "containers" && structuralChanged && activeEntities) throw new Error("Le conditionnement ne peut pas être modifié tant que des sous-entités sont actives.");
  const now = new Date().toISOString();
  let closedByLocation = previous.closedByLocation, closedContainers = previous.closedContainers, openContainers = previous.openContainers;
  if (previous.mode === "simple" && mode === "containers" && !closedByLocation.length && !openContainers.length) {
    const quantity = existingItem?.quantity || StockTracking.parseLocalizedNumber(fields.quantity.value) || 0;
    if (!Number.isInteger(quantity)) {
      const migration = pendingStockMigration?.confirmed && pendingStockMigration.itemId === existingItem.id ? pendingStockMigration : null;
      if (!migration) {
        openStockMigrationAssistant(existingItem, levels);
        const pendingError = new Error("Migration en attente");
        pendingError.code = "MIGRATION_PENDING";
        throw pendingError;
      }
      closedByLocation = migration.closedByLocation;
      closedContainers = null;
      openContainers = migration.openContainers;
      const migrationEvent = createStockMigrationEvent(existingItem, migration);
      pendingStockMigration = null;
      return { stockTracking: { version: 1, mode, traceabilityMode: "detailed", packagingLevels: levels, trackingUnitKey: selectedTrackingUnit.key, trackingUnit: selectedTrackingUnit.plural, quantityStep: 1, precision: selectedTrackingUnit.kind === "continuous" ? 6 : 0, closedByLocation, closedContainers, openContainers }, aliquotTracking: { ...StockTracking.normalizeAliquots(existingItem || {}), enabled: trackingFields.aliquotTrackingEnabled.checked }, migrationEvent };
    }
    const locations = getSelectedLocations();
    if (locations.length !== 1 && quantity > 0) throw new Error("Pour la migration initiale, sélectionnez une seule localisation. Vous pourrez ensuite déplacer les contenants de façon tracée.");
    closedByLocation = quantity ? [{ location: locations[0], quantity, updatedAt: now, updatedBy: currentName }] : [];
    closedContainers = null;
  }
  return { stockTracking: { version: 1, mode, traceabilityMode: "detailed", packagingLevels: levels, trackingUnitKey: selectedTrackingUnit?.key || previous.trackingUnitKey, trackingUnit: selectedTrackingUnit?.plural || previous.trackingUnit, quantityStep: 1, precision: selectedTrackingUnit?.kind === "continuous" ? 6 : 0, closedByLocation, closedContainers, openContainers }, aliquotTracking: { ...StockTracking.normalizeAliquots(existingItem || {}), enabled: trackingFields.aliquotTrackingEnabled.checked } };
}

function openStockMigrationAssistant(item, levels) {
  const oldQuantity = Number(item.quantity || 0);
  const trackingUnitKey = trackingFields.trackingUnitKey.value;
  const draftTracking = StockTracking.normalizeTracking({ stockTracking: { mode: "containers", packagingLevels: levels, trackingUnitKey } });
  pendingStockMigration = { itemId: item.id, oldQuantity, levels, trackingUnitKey, draftTracking, trackingUnit: StockTracking.trackingLevel(draftTracking), trackingCapacity: StockTracking.trackingCapacity(draftTracking), baseFactor: StockTracking.trackingFactor(draftTracking), baseCapacity: StockTracking.capacity(draftTracking), confirmed: false };
  stockMigrationForm.reset();
  const outer = levels[0], feminine = isLikelyFeminineUnit(outer.singular), closedAdjective = feminine ? "fermées" : "fermés", openAdjective = feminine ? "ouvertes" : "ouverts";
  document.querySelector("#stockMigrationItemName").textContent = item.name;
  document.querySelector("#migrationClosedTitle").textContent = `${capitalizeFrenchLabel(outer.plural)} ${closedAdjective}`;
  document.querySelector("#migrationClosedCountLabel").textContent = `Nombre de ${outer.plural} ${closedAdjective}`;
  document.querySelector("#migrationOpenTitle").textContent = `${capitalizeFrenchLabel(outer.plural)} ${openAdjective}`;
  document.querySelector("#migrationOpenCountLabel").textContent = `Nombre de ${outer.plural} ${openAdjective}`;
  document.querySelector("#stockMigrationOldValue").textContent = `${StockTracking.format(oldQuantity)} ${levels[0].plural}`;
  document.querySelector("#migrationClosedCount").value = Math.floor(oldQuantity);
  document.querySelector("#migrationOpenCount").value = oldQuantity > Math.floor(oldQuantity) ? 1 : 0;
  document.querySelector("#migrationReason").value = "Correction après comptage";
  document.querySelector("#migrationOtherReason").value = "";
  syncMigrationReasonFields();
  const locationOptions = inventoryLocations.map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("");
  document.querySelector("#migrationClosedLocation").innerHTML = locationOptions;
  document.querySelector("#migrationClosedLocation").value = getSelectedLocations()[0] || item.location || inventoryLocations[0];
  renderMigrationOpenRows();
  updateStockMigrationComparison();
  stockMigrationDialog.showModal();
}

function renderMigrationOpenRows() {
  if (!pendingStockMigration) return;
  const list = document.querySelector("#migrationOpenContainers");
  const previous = Array.from(list.querySelectorAll(".migration-open-row")).map(row => ({ remaining: row.querySelector("[data-migration-remaining]")?.value || "", location: row.querySelector("[data-migration-location]")?.value || "" }));
  const count = Math.min(50, Math.max(0, Math.trunc(Number(document.querySelector("#migrationOpenCount").value) || 0)));
  const capacity = pendingStockMigration.trackingCapacity, unit = pendingStockMigration.trackingUnit, outer = pendingStockMigration.levels[0];
  const theoretical = count === 1 ? (pendingStockMigration.oldQuantity - Math.floor(pendingStockMigration.oldQuantity)) * capacity : NaN;
  const defaultRemaining = Number.isFinite(theoretical) && (unit.kind === "continuous" || Number.isInteger(theoretical)) ? StockTracking.format(theoretical, 6).replace(/\s/g, "").replace(",", ".") : "";
  list.innerHTML = Array.from({ length: count }, (_, index) => `<div class="migration-open-row"><strong>${escapeHtml(capitalizeFrenchLabel(outer.singular))} nº${index + 1}</strong><div class="migration-open-fields"><label>Contenu restant — ${escapeHtml(unit.plural)}<input data-migration-remaining type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" data-quantity-step="1" required value="${escapeHtml(previous[index]?.remaining || (index === 0 ? defaultRemaining : ""))}"><small data-migration-remaining-help></small></label><label>Localisation<select data-migration-location required>${inventoryLocations.map(location => `<option value="${escapeHtml(location)}" ${location === (previous[index]?.location || getSelectedLocations()[0]) ? "selected" : ""}>${escapeHtml(location)}</option>`).join("")}</select></label></div></div>`).join("");
  updateStockMigrationComparison();
}

function capitalizeFrenchLabel(value) {
  const label = String(value || "");
  return label ? `${label.charAt(0).toLocaleUpperCase("fr-FR")}${label.slice(1)}` : label;
}

function isLikelyFeminineUnit(value) {
  return /(ille|[îi]te|ote|que|ité|oule|otte|ette|ance|ence|tion|souris)$/i.test(String(value || ""));
}

function getStockMigrationDraft() {
  if (!pendingStockMigration) return null;
  const capacity = pendingStockMigration.trackingCapacity;
  const closedCount = Math.trunc(Number(document.querySelector("#migrationClosedCount").value) || 0);
  const closedLocation = document.querySelector("#migrationClosedLocation").value;
  const opened = Array.from(document.querySelectorAll("#migrationOpenContainers .migration-open-row")).map((row, index) => ({ index, remaining: StockTracking.parseLocalizedNumber(row.querySelector("[data-migration-remaining]").value), location: row.querySelector("[data-migration-location]").value }));
  const comparison = StockTracking.migrationComparison(pendingStockMigration.oldQuantity, closedCount, opened.map(row => row.remaining), pendingStockMigration.draftTracking);
  return { capacity, closedCount, closedLocation, opened, newEquivalent: comparison.newEquivalent, difference: comparison.difference, differenceTrackingUnits: comparison.differenceTrackingUnits };
}

function updateStockMigrationComparison() {
  if (!pendingStockMigration) return;
  const draft = getStockMigrationDraft();
  const presentation = StockTracking.migrationPresentation(pendingStockMigration.oldQuantity, draft.closedCount, draft.opened.map(row => row.remaining), pendingStockMigration.draftTracking);
  document.querySelectorAll("[data-migration-remaining-help]").forEach((help, index) => { help.textContent = presentation.helpTexts[index] || ""; });
  document.querySelector("#migrationComparisonOld").textContent = presentation.oldText;
  document.querySelector("#migrationPhysicalSummary").textContent = presentation.physicalSummary;
  document.querySelector("#migrationComparisonNew").textContent = presentation.equivalentText;
  document.querySelector("#migrationComparisonDifference").textContent = presentation.correctionText;
  document.querySelector("#migrationComparisonSecondary").textContent = presentation.secondaryText;
  const hasDifference = presentation.complete && Math.abs(presentation.difference) > 1e-8;
  document.querySelector("#migrationReasonField").classList.toggle("hidden", !hasDifference);
  syncMigrationReasonFields();
}

function syncMigrationReasonFields() {
  const reason = document.querySelector("#migrationReason")?.value || "";
  const visible = !document.querySelector("#migrationReasonField")?.classList.contains("hidden") && reason === "Autre";
  document.querySelector("#migrationOtherReasonField")?.classList.toggle("hidden", !visible);
  if (document.querySelector("#migrationOtherReason")) document.querySelector("#migrationOtherReason").required = visible;
}

function confirmStockMigration(event) {
  event.preventDefault();
  const errorBox = document.querySelector("#stockMigrationError"); errorBox.classList.add("hidden");
  if (!stockMigrationForm.reportValidity() || !pendingStockMigration) return;
  try {
    const draft = getStockMigrationDraft(), unit = pendingStockMigration.trackingUnit;
    if (!Number.isInteger(draft.closedCount) || draft.closedCount < 0) throw new Error("Le nombre de contenants fermés doit être un entier positif.");
    draft.opened.forEach(row => { StockTracking.validateUnitQuantity(row.remaining, unit); if (row.remaining > draft.capacity) throw new Error(`Le contenu du contenant ouvert nº${row.index + 1} doit être compris entre 0 et ${draft.capacity} ${unit.plural}.`); });
    const selectedReason = document.querySelector("#migrationReason").value;
    const otherReason = normalizeMultilineText(document.querySelector("#migrationOtherReason").value);
    const reason = Math.abs(draft.difference) <= 1e-8 ? "" : selectedReason === "Autre" ? otherReason : selectedReason;
    if (Math.abs(draft.difference) > 1e-8 && !reason) throw new Error("Précisez la raison de la correction.");
    const now = new Date().toISOString(), actor = { userId: currentName.toLowerCase().replace(/\W+/g, "-"), userName: currentName, userEmoji: userIcons[currentName] || "", userInitials: userIcons[currentName] ? "" : getHistoryUserInitials(currentName) };
    pendingStockMigration = { ...pendingStockMigration, confirmed: true, newEquivalent: draft.newEquivalent, difference: draft.difference, differenceTrackingUnits: draft.differenceTrackingUnits, reason, closedByLocation: draft.closedCount ? [{ location: draft.closedLocation, quantity: draft.closedCount, updatedAt: now, updatedBy: actor.userId }] : [], openContainers: draft.opened.map((row, index) => ({ id: StockTracking.id("container"), label: `${pendingStockMigration.levels[0].singular} ouvert nº${index + 1}`, location: row.location, remaining: StockTracking.round ? StockTracking.round(row.remaining * pendingStockMigration.baseFactor) : Number((row.remaining * pendingStockMigration.baseFactor).toFixed(6)), capacity: pendingStockMigration.baseCapacity, status: "open", openedAt: now, openedBy: actor, updatedAt: now, updatedBy: actor.userId, version: 1 })) };
    stockMigrationDialog.close(); saveItem();
  } catch (error) { errorBox.textContent = error.message || String(error); errorBox.classList.remove("hidden"); }
}

function createStockMigrationEvent(item, migration) {
  const now = new Date().toISOString(), emoji = userIcons[currentName] || "";
  return { id: StockTracking.id("movement"), operationId: StockTracking.id("migration"), itemId: item.id, timestamp: now, userId: currentName.toLowerCase().replace(/\W+/g, "-"), userName: currentName, userEmoji: emoji, userInitials: emoji ? "" : getHistoryUserInitials(currentName), type: Math.abs(migration.difference) > 1e-8 ? "corrected" : "configuration_changed", entityType: "item", entityId: item.id, before: { mode: "simple", quantity: migration.oldQuantity }, after: { mode: "containers", equivalentQuantity: migration.newEquivalent, closedByLocation: migration.closedByLocation, openContainers: migration.openContainers.map(row => ({ id: row.id, location: row.location, remaining: row.remaining })) }, quantity: Math.abs(migration.difference) > 1e-8 ? migration.differenceTrackingUnits : 0, unit: Math.abs(migration.difference) > 1e-8 ? migration.trackingUnit.plural : migration.levels[0].plural, fromLocation: "", toLocation: "", comment: "Migration validée du suivi simple vers le suivi par contenants.", correctionReason: migration.reason || "" };
}

function closeStockMigration() { pendingStockMigration = null; stockMigrationDialog?.close(); }

function toggleUsageProfile(profile) {
  const normalized = normalizeUsageProfile(profile);
  const current = normalizeUsageProfile(fields.usageProfile.value);
  setUsageProfile(current === normalized ? "normal" : normalized);
}

function setUsageProfile(profile) {
  const normalized = normalizeUsageProfile(profile);
  fields.usageProfile.value = normalized;
  [
    ["#usageProfileRoutine", "routine"],
    ["#usageProfileBackup", "backup"]
  ].forEach(([selector, value]) => {
    const button = document.querySelector(selector);
    const isActive = normalized === value;
    button?.setAttribute("aria-pressed", String(isActive));
    button?.classList.toggle("is-selected", isActive);
  });
}

function openStockModal(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  stockForm.reset();
  stockFields.stockItemId.value = item.id;
  stockFields.stockItemName.value = item.name;
  stockFields.stockCurrentQuantity.value = `${item.quantity} ${item.unit}`;
  stockFields.stockAction.value = "used";
  stockFields.stockTitle.value = "";
  stockFields.stockAmount.value = "";
  stockFields.stockUnit.value = item.unit;
  stockFields.stockNotes.value = "";
  stockFields.stockUnit.readOnly = true;
  document.querySelector("#stockUpdateError")?.classList.add("hidden");
  syncSimpleStockActionFields();
  stockDialog.showModal();
}

function syncSimpleStockActionFields() {
  const action=stockFields.stockAction?.value,label=document.querySelector("#stockAmountLabel");
  if(label)label.textContent=action==="recounted"?"Stock physique compté":action==="received"?"Quantité reçue":"Quantité utilisée";
  if(stockFields.stockTitle)stockFields.stockTitle.placeholder=action==="recounted"?"Ex. inventaire mensuel, comptage physique...":action==="received"?"Ex. réception fournisseur...":"Ex. expérience pilote...";
}

function renderAdvancedStockDetail(item) {
  const tracking = StockTracking.normalizeTracking(item), aliquots = StockTracking.normalizeAliquots(item);
  const movements = stockMovements.filter(row => row?.itemId === item.id).slice().sort((a,b) => stockMovementTime(b) - stockMovementTime(a)).slice(0,10);
  const showDistribution = tracking.mode === "containers", showPreparations = aliquots.enabled, showJournal = movements.length > 0;
  if (!showDistribution && !showPreparations && !showJournal) return "";
  const outerUnit = tracking.packagingLevels[0], closedCount = tracking.closedByLocation.reduce((sum, row) => sum + row.quantity, 0);
  const closed = tracking.closedByLocation.map(row => `<article class="stock-distribution-card stock-distribution-card--closed"><div class="stock-distribution-card-head"><div><strong class="stock-distribution-primary">${row.quantity} ${escapeHtml(StockTracking.plural(row.quantity, outerUnit.singular, outerUnit.plural))} fermé${row.quantity > 1 ? "s" : ""}</strong><span class="stock-distribution-location"><span aria-hidden="true">⌖</span>${escapeHtml(row.location || "—")}</span></div><span class="stock-distribution-badge stock-distribution-badge--closed">Fermé</span></div></article>`).join("");
  const openUnit = StockTracking.trackingLevel(tracking);
  const openContainers = tracking.openContainers.filter(row => row.status === "open");
  const opened = openContainers.map(row => { const remaining = StockTracking.fromBaseQuantity(row.remaining, tracking), capacity = StockTracking.fromBaseQuantity(row.capacity, tracking), title = formatOpenContainerDisplayTitle(row.label, outerUnit.singular), identity = getOpenedContainerIdentity(row.openedBy), openedDate = formatDateTimeFrench(row.openedAt).replace(" · ", " à "); return `<article class="stock-distribution-card stock-distribution-card--open" id="stock-${escapeHtml(row.id)}"><div class="stock-distribution-open-head"><div class="stock-distribution-title-group"><strong>${escapeHtml(title)}</strong><span class="stock-distribution-badge stock-distribution-badge--open">Ouvert</span></div><span class="stock-distribution-location"><span aria-hidden="true">⌖</span>${escapeHtml(row.location || "—")}</span></div><div class="stock-distribution-quantity-row"><strong>${StockTracking.format(remaining)} ${escapeHtml(StockTracking.plural(remaining, openUnit.singular, openUnit.plural))} restants</strong><span>${StockTracking.format(remaining)} sur ${StockTracking.format(capacity)}</span></div><progress max="${capacity}" value="${remaining}"></progress><div class="stock-distribution-meta"><span>Ouvert par</span><span class="history-user-avatar ${identity.type}" aria-hidden="true">${escapeHtml(identity.value)}</span><strong>${escapeHtml(identity.name)}</strong><span aria-hidden="true">·</span><time>${escapeHtml(openedDate)}</time></div></article>`; }).join("");
  const preparations = activePreparationViews(item).map(view => renderPreparationStockCard(item, view.preparation, view.label)).join("");
  const distributionModule = showDistribution ? `<details open><summary>Répartition du stock</summary><div class="advanced-stock-block stock-distribution"><section class="stock-distribution-section"><div class="stock-distribution-section-title"><strong>Stock fermé</strong><span>${closedCount} ${escapeHtml(StockTracking.plural(closedCount, outerUnit.singular, outerUnit.plural))}</span></div><div class="stock-distribution-list">${closed || "<p class=\"stock-distribution-empty\">Aucun contenant fermé.</p>"}</div></section><section class="stock-distribution-section"><div class="stock-distribution-section-title"><strong>Stock ouvert</strong><span>${openContainers.length} ${escapeHtml(StockTracking.plural(openContainers.length, outerUnit.singular, outerUnit.plural))}</span></div><div class="stock-distribution-list">${opened || "<p class=\"stock-distribution-empty\">Aucun contenant ouvert.</p>"}</div></section></div></details>` : "";
  const preparationsModule = showPreparations ? `<details open><summary>Préparations et aliquotes</summary><div class="advanced-stock-block">${preparations || `<div class="stock-distribution-empty"><p>Aucune préparation active.</p><button class="ghost-btn compact-btn" type="button" onclick="openStockManager('${escapeHtml(item.id)}',{action:'aliquots_prepared'})">Préparer des aliquotes</button></div>`}</div></details>` : "";
  const journalOpen = stockJournalOpenByItem.get(item.id) === true;
  const journalModule = showJournal ? `<details class="stock-movement-journal" data-stock-journal-item="${escapeHtml(item.id)}"${journalOpen ? " open" : ""} ontoggle="handleStockJournalToggle(event)"><summary aria-expanded="${journalOpen}"><span class="stock-journal-indicator" aria-hidden="true">${journalOpen ? "▼" : "▶"}</span><span>Journal des mouvements</span></summary><div class="advanced-stock-block movement-list">${movements.map(renderStockMovementSafely).join("")}</div></details>` : "";
  const stockStatus = getStockStatus(item);
  const equivalentLevels = StockTracking.equivalentLevels(item, stockStatus.currentStock);
  const equivalentText = equivalentLevels.map(level => `<span class="advanced-stock-equivalent-value">${StockTracking.format(level.value)}&nbsp;${escapeHtml(StockTracking.plural(level.value, level.singular, level.plural))}</span>`).join('<span class="advanced-stock-kpi-separator" aria-hidden="true">·</span>');
  const overview = showDistribution ? `<div class="advanced-stock-kpis"><strong class="advanced-stock-physical-summary">${escapeHtml(StockTracking.summary(item))}</strong><span class="advanced-stock-equivalent-summary"><span>Équivalence :</span>${equivalentText ? `<span class="advanced-stock-equivalent-list">${equivalentText}</span><span class="advanced-stock-kpi-separator" aria-hidden="true">·</span>` : ""}<span>${escapeHtml(stockSummaryStatusLabel(stockStatus))}</span></span></div>` : "";
  return `<section class="advanced-stock-overview">${overview}${distributionModule}${preparationsModule}${journalModule}</section>`;
}

function handleStockJournalToggle(event) {
  const journal = event.currentTarget;
  if (!journal?.matches?.("details.stock-movement-journal")) return;
  stockJournalOpenByItem.set(journal.dataset.stockJournalItem, journal.open);
  const summary = journal.querySelector(":scope > summary");
  summary?.setAttribute("aria-expanded", String(journal.open));
  const indicator = summary?.querySelector(".stock-journal-indicator");
  if (indicator) indicator.textContent = journal.open ? "▼" : "▶";
}

function syncStockJournalAccessibility(root = document) {
  root?.querySelectorAll?.("details.stock-movement-journal").forEach(journal => {
    const summary = journal.querySelector(":scope > summary");
    summary?.setAttribute("aria-expanded", String(journal.open));
  });
}

function formatOpenContainerDisplayTitle(label, fallbackUnit) {
  const raw = String(label || "").trim().replace(/\s+ouvert(?:e)?(?=\s+n[º°o])/i, "");
  const safe = raw || `${fallbackUnit || "Contenant"} nº—`;
  return `${safe.charAt(0).toLocaleUpperCase("fr-FR")}${safe.slice(1)}`;
}

function getOpenedContainerIdentity(openedBy) {
  const name = String(openedBy?.userName || openedBy?.name || "—");
  if (openedBy?.userEmoji || openedBy?.emoji) return { name, type: "emoji", value: openedBy.userEmoji || openedBy.emoji };
  if (openedBy?.userInitials || openedBy?.initials) return { name, type: "", value: openedBy.userInitials || openedBy.initials };
  const avatar = getHistoryUserAvatar(name);
  return { name, type: avatar.type, value: avatar.value };
}

function renderPreparationStockCard(item, prep) {
  const unopened = StockTracking.remainingAliquots(prep), opened = (prep.openAliquots || []).filter(row => row.status === "open"), identity = getOpenedContainerIdentity(prep.preparedBy), preparedDate = formatDateTimeFrench(prep.preparedAt).replace(" · ", " à ");
  const openCards = opened.map(open => { const openIdentity = getOpenedContainerIdentity(open.openedBy), date = formatDateTimeFrench(open.openedAt).replace(" · ", " à "), max = open.initialVolume || 1; return `<article class="open-aliquot-card"><div class="stock-distribution-open-head"><div class="stock-distribution-title-group"><strong>${escapeHtml(open.label)}</strong><span class="stock-distribution-badge stock-distribution-badge--open">Ouverte</span></div><span class="stock-distribution-location"><span aria-hidden="true">⌖</span>${escapeHtml(open.location || "—")}</span></div><div class="stock-distribution-quantity-row"><strong>${StockTracking.format(open.remainingVolume)} ${escapeHtml(open.volumeUnit)} restants</strong><span>sur ${StockTracking.format(open.initialVolume)} ${escapeHtml(open.volumeUnit)}</span></div><progress max="${max}" value="${open.remainingVolume}"></progress><div class="stock-distribution-meta"><span>Ouverte par</span><span class="history-user-avatar ${openIdentity.type}">${escapeHtml(openIdentity.value)}</span><strong>${escapeHtml(openIdentity.name)}</strong><span>·</span><time>${escapeHtml(date)}</time></div><button class="ghost-btn compact-btn" type="button" onclick="openStockManager('${escapeHtml(item.id)}',{action:'aliquots_consumed',entityId:'${escapeHtml(open.id)}'})">Gérer</button></article>`; }).join("");
  return `<article class="tracked-entity-card preparation-stock-card"><div><strong>${escapeHtml(prep.label)}</strong><span>${unopened} aliquote${unopened > 1 ? "s" : ""} non ouverte${unopened > 1 ? "s" : ""} · ${opened.length} aliquote${opened.length > 1 ? "s" : ""} ouverte${opened.length > 1 ? "s" : ""}</span></div><small>Préparée par ${escapeHtml(identity.value)} ${escapeHtml(identity.name)} · ${escapeHtml(preparedDate)}</small><small>${escapeHtml(prep.volume ? `${StockTracking.format(prep.volume)} ${prep.volumeUnit}` : "Volume individuel non défini")} ${escapeHtml(prep.concentration ? `· ${StockTracking.format(prep.concentration)} ${prep.concentrationUnit}` : "")}</small><ul>${prep.locations.map(row => `<li>${escapeHtml(row.location)} — ${row.quantity} non ouverte${row.quantity > 1 ? "s" : ""}</li>`).join("")}</ul>${openCards ? `<div class="open-aliquot-list">${openCards}</div>` : ""}</article>`;
}

function activePreparationViews(item){const preparations=StockTracking.normalizeAliquots(item||{}).preparations,labels=StockTracking.activePreparationLabels(item||{});return labels.map(view=>({preparation:preparations.find(row=>row.id===view.id),index:view.index,label:view.label}));}
function activePreparationLabel(item,id){return activePreparationViews(item).find(view=>view.preparation.id===id)?.label||"Préparation inactive";}
function renderPreparationStockCard(item,prep,displayLabel=activePreparationLabel(item,prep.id)){const unopened=StockTracking.remainingAliquots(prep),opened=(prep.openAliquots||[]).filter(row=>row.status==="open"&&row.remainingVolume>0),available=unopened+opened.length,identity=getOpenedContainerIdentity(prep.preparedBy),preparedDate=formatDateTimeFrench(prep.preparedAt).replace(" · "," à "),locations=(prep.locations||[]).map(row=>row.location).filter(Boolean);return `<article class="tracked-entity-card preparation-stock-card preparation-stock-card--summary" data-preparation-id="${escapeHtml(prep.id)}"><header><strong>${escapeHtml(displayLabel)}</strong></header><dl class="preparation-key-metrics"><div><dt>Disponibles</dt><dd>${available} aliquote${available>1?"s":""}</dd></div><div><dt>Volume / aliquote</dt><dd>${prep.volume?`${StockTracking.format(prep.volume)} ${escapeHtml(prep.volumeUnit||"")}`:"Non défini"}</dd></div><div><dt>Concentration</dt><dd>${prep.concentration?`${StockTracking.format(prep.concentration)} ${escapeHtml(prep.concentrationUnit||"")}`:"Non définie"}</dd></div><div><dt>Localisation</dt><dd>${escapeHtml(locations.join(" · ")||"—")}</dd></div></dl><p class="preparation-note"><strong>Notes :</strong> ${escapeHtml(prep.note||"—")}</p><div class="preparation-secondary"><span>Préparée par ${escapeHtml(identity.value)} ${escapeHtml(identity.name)} · ${escapeHtml(preparedDate)}</span></div></article>`;}

function getStockMovementDate(entry) {
  return entry?.timestamp ?? entry?.createdAt ?? entry?.date ?? null;
}

function stockMovementTime(entry) {
  const value = getStockMovementDate(entry);
  const date = value instanceof Date ? value : typeof value === "number" ? new Date(value) : parseHistoryDate(value);
  const time = date?.getTime();
  return Number.isFinite(time) ? time : 0;
}

function renderStockMovementSafely(entry) {
  try {
    return renderStockMovement(entry && typeof entry === "object" ? entry : {});
  } catch (error) {
    console.warn("Mouvement de stock malformé ignoré dans le rendu.", error);
    return `<article class="movement-entry"><span class="history-user-avatar">?</span><div><strong>Mouvement de stock</strong><small>Date inconnue</small><p>Détails indisponibles.</p></div></article>`;
  }
}

const STOCK_MOVEMENT_TYPE_LABELS = { received:"Réception", order_received:"Réception de commande", container_opened:"Ouverture", consumed:"Utilisation", recounted:"Mise à jour du stock", moved:"Déplacement", container_finished:"Contenant terminé", aliquots_prepared:"Préparation", aliquots_consumed:"Aliquotes utilisées", aliquots_moved:"Aliquotes déplacées", aliquot_opened:"Aliquote ouverte", open_aliquot_consumed:"Aliquote ouverte utilisée", open_aliquot_moved:"Aliquote ouverte déplacée", open_aliquot_discarded:"Reliquat jeté", preparation_recounted:"Mise à jour du stock", corrected:"Mise à jour du stock", configuration_changed:"Configuration", automatic_repair:"Régularisation automatique" };
function stockMovementTypeLabel(type) { return STOCK_MOVEMENT_TYPE_LABELS[type] || type || "Mouvement de stock"; }

function renderStockMovement(entry = {}) {
  const formattedDate = formatDateTimeFrench(getStockMovementDate(entry));
  const [date, time] = formattedDate.includes(" · ") ? formattedDate.split(" · ") : [formattedDate, ""];
  const reason = String(entry.comment || "").trim();
  const deleteBtn = entry.id ? `<button class="movement-entry-delete" type="button" title="Supprimer cette entrée" aria-label="Supprimer cette entrée du journal" onclick="requestStockMovementDeletion('${escapeHtml(entry.id)}', this)">−</button>` : "";
  return `<article class="movement-entry"><span class="history-user-avatar ${entry.userEmoji ? "emoji" : ""}" aria-hidden="true">${escapeHtml(entry.userEmoji || entry.userInitials || "?")}</span><div class="movement-entry-content"><div class="movement-heading"><strong>${escapeHtml(stockMovementTypeLabel(entry.type))}</strong><span class="movement-meta">${escapeHtml(entry.userName || "Utilisateur")}</span><time class="movement-meta">${escapeHtml(date)}</time>${time ? `<time class="movement-meta">${escapeHtml(time)}</time>` : ""}</div><div class="movement-detail"><span class="movement-change multiline-text">${formatStockMovementDescription({...entry, comment:""})}</span>${reason ? `<span class="movement-reason multiline-text"><strong>Motif :</strong> ${escapeHtml(reason)}</span>` : `<span class="movement-reason movement-reason--missing">Motif non renseigné</span>`}</div></div>${deleteBtn}</article>`;
}

function requestStockMovementDeletion(movementId, trigger) {
  const movement = stockMovements.find(row => row?.id === movementId);
  if (!movement) return;
  openDeleteConfirmation({
    title: "Supprimer cette entrée du journal ?",
    message: `« ${stockMovementTypeLabel(movement.type)} » du ${formatDateTimeFrench(getStockMovementDate(movement))} sera définitivement retirée du journal des mouvements. Le stock actuel de l’item ne sera pas modifié.`,
    confirmText: "Supprimer",
    trigger,
    onConfirm: async () => { await deleteStockMovement(movementId); render(); }
  });
}

async function deleteStockMovement(movementId) {
  const storage=window.ExadexGithubStorage, config=storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer un mouvement de stock.");
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving=true; renderAlerts();
  try {
    const result=await storage.mutateSharedData(StockTracking.id("operation"), latest => {
      const state=createSharedState(latest,{includeBootstrap:false});
      state.stockMovements=(Array.isArray(state.stockMovements)?state.stockMovements:[]).filter(row=>row?.id!==movementId);
      return state;
    });
    sharedDataSha=result.sha; sharedDataMode="github-write"; sharedDataHasUnsavedChanges=false; sharedDataRemoteReady=true; sharedDataLastError=""; applySharedState(result.data); initializeSharedSaveCoordinator(result.data,result.sha);
  } finally { sharedDataIsSaving=false; renderAlerts(); }
}

function formatStockMovementDescription(entry) {
  if(entry.type==="automatic_repair"){const status={open:"Ouvert",closed:"Fermé",finished:"Terminé"};return `${escapeHtml(formatStockMovementContainerLabel(entry.containerLabel||entry.containerId||"Contenant"))} : statut ${status[entry.containerStatusBefore]||escapeHtml(entry.containerStatusBefore)} → Terminé · Quantité déjà enregistrée : 0 ${escapeHtml(entry.unit||"")}`;}
  if(entry.type==="received"&&entry.entityType==="container"){const status=entry.containerStatusAfter==="open"?"ouvert":"fermé",capacity=entry.afterCapacity??entry.after?.capacity;return `Ajout du contenant ${status} ${escapeHtml(entry.containerLabel||entry.containerId)} : ${StockTracking.format(entry.afterQuantity??entry.quantity)} ${escapeHtml(entry.unitAfter||entry.unit||"")} disponibles${capacity!==null&&capacity!==undefined?` sur une capacité de ${StockTracking.format(capacity)} ${escapeHtml(entry.unitAfter||entry.unit||"")}`:""}${entry.toLocation?` dans ${escapeHtml(entry.toLocation)}`:""}.`;}
  if(entry.type==="recounted"&&entry.entityType==="item"){const before=entry.beforeQuantity??entry.before??0,after=entry.afterQuantity??entry.after??0,difference=entry.difference??after-before;return `Stock précédent : ${StockTracking.format(before)} ${escapeHtml(entry.unit||"")} · Stock compté : ${StockTracking.format(after)} ${escapeHtml(entry.unit||"")} · Écart : ${difference>0?"+":""}${StockTracking.format(difference)} ${escapeHtml(entry.unit||"")}.${entry.comment?` Note : ${escapeHtml(entry.comment)}`:""}`;}
  if (Array.isArray(entry.containerTransitions) && entry.containerTransitions.length) {
    return entry.containerTransitions.map(transition => {
      const label=escapeHtml(transition.containerLabel || transition.containerId || "Contenant");
      if (transition.automaticOpen) return `${label} ouvert automatiquement avec ${StockTracking.format(transition.after)} ${escapeHtml(transition.unit || "")} disponibles${transition.location?` à ${escapeHtml(transition.location)}`:""}.`;
      if (transition.automaticFinish) return `${label} terminé automatiquement après utilisation : ${StockTracking.format(transition.before)} → 0 ${escapeHtml(transition.unit || "")} (${StockTracking.format(transition.difference)}).`;
      return `${label} : ${StockTracking.format(transition.before)} → ${StockTracking.format(transition.after)} ${escapeHtml(transition.unit || "")} (${transition.difference>0?"+":""}${StockTracking.format(transition.difference)}).`;
    }).join(" ");
  }
  if (entry.type === "consumed" && entry.entityType === "container") {
    const before=entry.beforeQuantity ?? entry.before?.remaining ?? entry.before,after=entry.afterQuantity ?? entry.after?.remaining ?? entry.after;
    const status=entry.containerStatusBefore&&entry.containerStatusAfter&&entry.containerStatusBefore!==entry.containerStatusAfter?` · Statut : ${entry.containerStatusBefore==="open"?"Ouvert":"Fermé"} → Terminé`:"";
    return `${escapeHtml(formatStockMovementContainerLabel(entry.containerLabel || entry.containerId || "Contenant"))} : ${StockTracking.format(before)} ${escapeHtml(entry.unit || "")} → ${StockTracking.format(after)} ${escapeHtml(entry.unit || "")} (${formatStockMovementDifference(entry.difference ?? after-before)})${status}`;
  }
  if (entry.type === "recounted" && ["container","closed"].includes(entry.entityType)) {
    const rawBefore=entry.beforeQuantity ?? (entry.entityType==="closed"?entry.before?.quantity:entry.before?.remaining),rawAfter=entry.afterQuantity ?? (entry.entityType==="closed"?entry.after?.quantity:entry.after?.remaining);
    const beforeUnit=entry.unitBefore||entry.unit,afterUnit=entry.unitAfter||entry.unit,changes=[];
    if(beforeUnit!==afterUnit)changes.push(`unité ${escapeHtml(beforeUnit||"—")} → ${escapeHtml(afterUnit||"—")}`);
    if(rawBefore!==rawAfter||beforeUnit!==afterUnit)changes.push(`${StockTracking.format(rawBefore)} ${escapeHtml(beforeUnit||"")} → ${StockTracking.format(rawAfter)} ${escapeHtml(afterUnit||"")}${beforeUnit===afterUnit?` (${formatStockMovementDifference(entry.difference??rawAfter-rawBefore)})`:""}`);
    const capacityBefore=entry.beforeCapacity??entry.before?.capacity,capacityAfter=entry.afterCapacity??entry.after?.capacity;
    if(capacityBefore!==null&&capacityAfter!==null&&capacityBefore!==undefined&&capacityAfter!==undefined&&(capacityBefore!==capacityAfter||beforeUnit!==afterUnit))changes.push(`capacité ${StockTracking.format(capacityBefore)} ${escapeHtml(beforeUnit||"")} → ${StockTracking.format(capacityAfter)} ${escapeHtml(afterUnit||"")}`);
    if(entry.fromLocation&&entry.toLocation&&entry.fromLocation!==entry.toLocation)changes.push(`localisation ${escapeHtml(entry.fromLocation)} → ${escapeHtml(entry.toLocation)}`);
    if(entry.containerStatusBefore&&entry.containerStatusAfter&&entry.containerStatusBefore!==entry.containerStatusAfter){const labels={closed:"Fermé",open:"Ouvert",finished:"Terminé"};changes.push(`Statut : ${labels[entry.containerStatusBefore]||escapeHtml(entry.containerStatusBefore)} → ${labels[entry.containerStatusAfter]||escapeHtml(entry.containerStatusAfter)}`);}
    const rawLabel = entry.entityType === "closed" ? (entry.containerLabel || "Stock simple") : (entry.containerLabel || entry.containerId || "Contenant");
    return `${escapeHtml(formatStockMovementContainerLabel(rawLabel))} : ${changes.join(" · ")||"informations corrigées"}`;
  }
  if (entry.type === "container_opened") {
    const label=escapeHtml(entry.containerLabel || entry.after?.label || entry.containerId || "Contenant"),from=entry.fromLocation||entry.before?.location,to=entry.toLocation||entry.after?.location;
    return from&&to&&from!==to?`${label} ouvert${entry.automatic?" automatiquement":""} : ${escapeHtml(from)} → ${escapeHtml(to)}.`:`${label} ouvert${entry.automatic?" automatiquement":""}${entry.after?.remaining!==undefined?` avec ${StockTracking.format(entry.after.remaining)} ${escapeHtml(entry.unit||"")} disponibles`:""}.`;
  }
  if (entry.type === "aliquots_consumed") { const before=StockTracking.remainingAliquots(entry.before || {locations:[]}),after=StockTracking.remainingAliquots(entry.after || {locations:[]}); return `${StockTracking.format(entry.quantity)} aliquote${entry.quantity>1?"s":""} utilisée${entry.quantity>1?"s":""}. ${before} → ${after} aliquotes.${entry.comment?` ${escapeHtml(entry.comment)}`:""}`; }
  if (entry.type === "open_aliquot_consumed") return `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit)} utilisés. ${StockTracking.format(entry.before?.remainingVolume)} → ${StockTracking.format(entry.after?.remainingVolume)} ${escapeHtml(entry.unit)}.${entry.comment?` ${escapeHtml(entry.comment)}`:""}`;
  if (entry.type === "aliquot_opened") return `${escapeHtml(entry.after?.label || "Aliquote")} ouverte à ${escapeHtml(entry.after?.location || entry.toLocation || "—")} · ${StockTracking.format(entry.after?.remainingVolume)} ${escapeHtml(entry.after?.volumeUnit || "")}.`;
  if (entry.type === "open_aliquot_moved") return `${escapeHtml(entry.before?.label || "Aliquote")} déplacée de ${escapeHtml(entry.fromLocation || "—")} vers ${escapeHtml(entry.toLocation || "—")}.`;
  if (entry.type === "open_aliquot_discarded") return `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit)} jetés. Motif : ${escapeHtml(entry.correctionReason || "—")}.`;
  return `${entry.quantity ? `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit || "")}. ` : ""}${entry.fromLocation ? `${escapeHtml(entry.fromLocation)} → ` : ""}${escapeHtml(entry.toLocation || "")}${entry.comment ? ` · ${escapeHtml(entry.comment)}` : ""}`;
}

function formatStockMovementDifference(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return escapeHtml(value ?? "—");
  return `${number < 0 ? "−" : number > 0 ? "+" : ""}${StockTracking.format(Math.abs(number))}`;
}

function formatStockMovementContainerLabel(value) {
  const label = String(value || "Contenant").trim().replace(/n[º°o]\s*(\d+)/i, "n° $1");
  return `${label.charAt(0).toLocaleUpperCase("fr-FR")}${label.slice(1)}`;
}

function ensureStockManagerDialog() {
  let modal = document.querySelector("#stockManagerDialog"); if (modal) return modal;
  document.body.insertAdjacentHTML("beforeend", `<dialog id="stockManagerDialog" class="modal stock-manager-modal"><form id="stockManagerForm"><div class="modal-header"><div><h3>Mise à jour du stock</h3><small id="stockManagerItemName"></small></div><button class="icon-btn" type="button" data-close-stock-manager>×</button></div><input id="stockManagerItemId" type="hidden"><label>Action<select id="stockManagerAction"></select></label><p id="stockManagerAvailabilityNote" class="tracking-option-explanation hidden"></p><div id="stockManagerFields" class="form-grid"></div><label class="full-label">Motif de la modification *<textarea id="stockManagerComment" rows="2" required placeholder="Précisez la raison de la modification (réception d’un colis, étude client XXX, inventaire, correction d’une erreur, etc.) afin d’assurer la traçabilité."></textarea></label><p id="stockManagerError" class="confirmation-modal-error hidden" role="alert"></p><div class="modal-actions"><button class="ghost-btn" type="button" data-close-stock-manager>Annuler</button><button id="executeStockManagerBtn" class="primary-btn" type="submit">Enregistrer</button></div></form></dialog>`);
  modal = document.querySelector("#stockManagerDialog");
  const reasonLabel=modal.querySelector("#stockManagerComment")?.closest("label");if(reasonLabel?.firstChild){reasonLabel.firstChild.remove();reasonLabel.querySelector("textarea").insertAdjacentHTML("beforebegin",'<span>Motif de la modification <b class="required-star">*</b></span>');}
  modal.querySelectorAll("[data-close-stock-manager]").forEach(btn => btn.addEventListener("click", () => modal.close()));
  modal.querySelector("#stockManagerAction").addEventListener("change", renderStockManagerFields);
  modal.querySelector("form").addEventListener("submit", submitStockManager);
  return modal;
}

function usesAdvancedStockManager(item) {
  const tracking = StockTracking.normalizeTracking(item || {});
  return tracking.mode === "containers" || tracking.traceabilityMode === "detailed" || StockTracking.normalizeAliquots(item || {}).enabled;
}

function getStockManagerActionState(item) {
  const tracking=StockTracking.normalizeTracking(item),aliquots=StockTracking.normalizeAliquots(item),actions=[];
  if(tracking.mode==="containers")actions.push(["recounted","Mise à jour du stock"]);else actions.push(["stock_recounted","Mise à jour du stock"]);
  const activePreparations=aliquots.preparations.filter(row=>row.status==="active"),hasUnopened=activePreparations.some(row=>StockTracking.remainingAliquots(row)>0),hasOpenable=activePreparations.some(row=>StockTracking.remainingAliquots(row)>0&&row.volume>0&&row.volumeUnit),hasOpen=activePreparations.some(row=>row.openAliquots.some(open=>open.status==="open"&&open.remainingVolume>0));
  if(aliquots.enabled)actions.push(["aliquots_prepared","Préparer des aliquotes",false]);
  if(activePreparations.length)actions.push(["preparation_recounted","Mise à jour des aliquotes disponibles",false]);
  return {tracking,aliquots,actions,activePreparations,hasUnopened,hasOpenable,hasOpen};
}

function openStockManager(itemId, options = {}) {
  const item = items.find(row => row.id === itemId); if (!item) return;
  const modal=ensureStockManagerDialog(),{tracking,aliquots,actions,hasUnopened,hasOpen}=getStockManagerActionState(item);
  modal.querySelector("#stockManagerItemId").value = itemId; modal.querySelector("#stockManagerItemName").textContent = item.name; modal.querySelector("#stockManagerAction").innerHTML = actions.map(([value,label,disabled]) => `<option value="${value}" ${disabled ? "disabled" : ""}>${label}</option>`).join(""); if (options.action && actions.some(([value,,disabled]) => value === options.action && !disabled)) modal.querySelector("#stockManagerAction").value = options.action; modal.dataset.entityId = options.entityId || ""; modal.querySelector("#stockManagerComment").value = ""; modal.querySelector("#stockManagerError").classList.add("hidden"); const note=modal.querySelector("#stockManagerAvailabilityNote"); note.textContent=!hasUnopened&&!hasOpen&&aliquots.enabled?"Aucune aliquote disponible. Préparez d’abord des aliquotes.":tracking.traceabilityMode === "detailed"?"Chaque utilisation doit être enregistrée individuellement.":""; note.classList.toggle("hidden",!note.textContent); renderStockManagerFields(); modal.showModal();
}

function stockSelect(id, label, values, extra="") { return `<label><span>${label}</span><select id="${id}" required>${values.map(([value,text]) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join("")}</select>${extra}</label>`; }
function stockNumber(id,label,max="") { return `<label><span>${label}</span><input id="${id}" type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" data-quantity-step="1" ${max !== "" ? `max="${max}"` : ""} required></label>`; }

function hierarchyPathForIds(roomId,locationId,sublocationId){const room=hierarchyRoom(roomId),location=hierarchyLocation(locationId),sub=hierarchySublocation(sublocationId);return[room?.name,location?.name,sub?.name].filter(Boolean).join(" → ");}
function hierarchySelectorsHtml(prefix,values={}){
  const catalog=hierarchyCatalog(),rooms=FIXED_INVENTORY_ROOMS,locations=values.roomId?catalog.locations.filter(row=>row.roomId===values.roomId):[],subs=values.locationId?catalog.sublocations.filter(row=>row.locationId===values.locationId):[],explicitEmptySub=/aliquot-preparation|preparation-correction/.test(prefix);
  return `<div class="stock-hierarchy-selectors" data-hierarchy-prefix="${prefix}"><label><span>Salle</span><select data-hierarchy-room required><option value="">Sélectionner…</option>${rooms.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.roomId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label><label data-hierarchy-location-field ${locations.length?"":"class=\"hidden\""}><span>Loc.</span><select data-hierarchy-location ${locations.length?"required":"disabled"}><option value="">Sélectionner…</option>${locations.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.locationId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label><label data-hierarchy-sublocation-field ${subs.length||explicitEmptySub?"":"class=\"hidden\""}><span>Sous-loc.</span><select data-hierarchy-sublocation ${subs.length?"required":"disabled"}><option value="">Aucune sous-localisation</option>${subs.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.sublocationId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label></div>`;
}
function bindHierarchySelectors(root){root.querySelectorAll("[data-hierarchy-prefix]").forEach(group=>{
  if(group.dataset.hierarchyBound==="true")return;group.dataset.hierarchyBound="true";
  const room=group.querySelector("[data-hierarchy-room]"),location=group.querySelector("[data-hierarchy-location]"),sub=group.querySelector("[data-hierarchy-sublocation]"),locationField=group.querySelector("[data-hierarchy-location-field]"),subField=group.querySelector("[data-hierarchy-sublocation-field]"),hidden=group.parentElement.querySelector("[data-recount-location]");
  const explicitEmptySub=/aliquot-preparation|preparation-correction/.test(group.dataset.hierarchyPrefix),update=()=>{if(hidden)hidden.value=hierarchyPathForIds(room.value,location.value,sub.value);},syncSubs=()=>{const rows=hierarchyCatalog().sublocations.filter(row=>row.locationId===location.value);sub.innerHTML=`<option value="">Aucune sous-localisation</option>${rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`).join("")}`;subField.classList.toggle("hidden",!rows.length&&!explicitEmptySub);sub.disabled=!rows.length;sub.required=Boolean(rows.length);if(!rows.length)sub.value="";update();},syncLocations=()=>{const rows=hierarchyCatalog().locations.filter(row=>row.roomId===room.value);location.innerHTML=`<option value="">Sélectionner…</option>${rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`).join("")}`;locationField.classList.toggle("hidden",!rows.length);location.disabled=!rows.length;location.required=Boolean(rows.length);if(!rows.length)location.value="";syncSubs();};
  room.addEventListener("change",syncLocations);location.addEventListener("change",syncSubs);sub.addEventListener("change",update);
});}

function containerValueForUnit(value, tracking, unitKey) {
  const index=tracking.packagingLevels.findIndex(level=>level.key===unitKey),factor=index<0?StockTracking.trackingFactor(tracking):tracking.packagingLevels.slice(index+1).reduce((value,level)=>value*level.contains,1);
  return Number((Number(value||0)/factor).toFixed(6));
}

function renderContainerRecountRow(container, tracking, locations, options = {}) {
  const isNew=Boolean(options.isNew),unitKey=container.unitKey||tracking.trackingUnitKey,quantity=containerValueForUnit(container.remaining,tracking,unitKey),units=tracking.packagingLevels.map(level=>[level.key,level.plural]),places=Array.from(new Set(["",...locations,container.location].filter(value=>value!==undefined)));
  return `<section class="container-recount-row" data-container-id="${escapeHtml(container.id)}" data-version="${Number(container.version||0)}" data-original-status="${isNew?"":escapeHtml(container.status)}" data-original-unit="${isNew?"":escapeHtml(unitKey)}" data-current-unit="${escapeHtml(unitKey)}" data-capacity-base="${Number(container.capacity||0)}" data-original-location="${isNew?"":escapeHtml(container.location||"")}" data-original-quantity="${isNew?"":quantity}" data-new-container="${isNew?"true":"false"}">
    <header><strong data-container-display-title>${escapeHtml(container.label||container.id)}</strong>${isNew?`<span class="stock-distribution-badge">Nouveau</span>`:""}<button class="container-recount-remove" type="button" data-remove-container>${isNew?"Supprimer":"Retirer"}</button><span class="stock-distribution-badge stock-distribution-badge--${container.status==="closed"?"closed":"open"}">${container.status==="closed"?"Fermé":"Ouvert"}</span></header>
    <label><span>Statut</span><select data-recount-status><option value="closed" ${container.status==="closed"?"selected":""}>Fermé</option><option value="open" ${container.status==="open"?"selected":""}>Ouvert</option>${isNew?"":`<option value="finished">Terminé</option>`}</select></label>
    <label><span data-recount-quantity-label>${container.status==="open"?"Quantité restante":"Quantité actuelle"}</span><input data-recount-quantity type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" value="${quantity}" required></label>
    <label><span>Unité</span><select data-recount-unit>${units.map(([value,label])=>`<option value="${escapeHtml(value)}" ${value===unitKey?"selected":""}>${escapeHtml(label)}</option>`).join("")}</select></label>
    ${hierarchySelectorsHtml(`container-${container.id}`,container)}<input type="hidden" data-recount-location value="${escapeHtml(container.location||"")}">
  </section>`;
}

function renderContainerRecountFields(item) {
  const tracking=StockTracking.normalizeTracking(item),active=[...tracking.openContainers.filter(row=>row.status==="open"),...tracking.closedContainers];
  const fallbackPlacement=(item.placements||[])[0]||{};active.forEach(container=>{if(!container.roomId)Object.assign(container,{roomId:fallbackPlacement.roomId||"",locationId:fallbackPlacement.locationId||"",sublocationId:fallbackPlacement.sublocationId||""});});
  const locations=Array.from(new Set([...inventoryLocations,...active.map(row=>row.location)].filter(Boolean))),outer=tracking.packagingLevels[0];
  return `<div class="container-recount-list">${active.length?active.map(container=>renderContainerRecountRow(container,tracking,locations)).join(""):`<div class="stock-source-empty"><strong>Aucun contenant actif à compter.</strong></div>`}<div class="container-recount-new-rows"></div><button class="ghost-btn compact-btn container-recount-add" type="button" data-add-primary-container>+ Ajouter un ${escapeHtml(outer.singular)}</button></div>`;
}

function bindContainerRecountControls(root, item, tracking = StockTracking.normalizeTracking(item)) {
  const list=root.querySelector(".container-recount-new-rows"),button=root.querySelector("[data-add-primary-container]");
  bindHierarchySelectors(root);
  const reorderRows=(changedRow=null)=>{const host=root.querySelector(".container-recount-list"),anchor=host.querySelector(".container-recount-new-rows"),rows=[...host.querySelectorAll(":scope > .container-recount-row, .container-recount-new-rows > .container-recount-row")].filter(row=>!row.classList.contains("hidden"));if(changedRow){const status=changedRow.querySelector("[data-recount-status]").value,last=rows.filter(row=>row!==changedRow&&row.querySelector("[data-recount-status]").value===status).at(-1);if(last)last.after(changedRow);}const ordered=[...host.querySelectorAll(":scope > .container-recount-row, .container-recount-new-rows > .container-recount-row")].sort((a,b)=>{const rank=row=>row.querySelector("[data-recount-status]").value==="open"?0:1;return rank(a)-rank(b);});ordered.forEach(row=>host.insertBefore(row,anchor));};
  const refreshTitles=()=>{const counters={closed:0,open:0},unit=tracking.packagingLevels[0].singular,feminine=isLikelyFeminineUnit(unit);root.querySelectorAll(".container-recount-row").forEach(row=>{const status=row.querySelector("[data-recount-status]")?.value;if(status==="finished"){row.classList.add("hidden");return;}row.classList.remove("hidden");counters[status]=(counters[status]||0)+1;const adjective=status==="closed"?(feminine?"fermée":"fermé"):(feminine?"ouverte":"ouvert"),title=`${unit.charAt(0).toLocaleUpperCase("fr-FR")}${unit.slice(1)} ${adjective} ${counters[status]}`;row.querySelector("[data-container-display-title]").textContent=title;row.querySelector("[data-container-display-title]").title=title;});};
  const closedLocations=Array.from(new Set(tracking.closedContainers.map(row=>row.location).filter(Boolean)));
  const configuredLocation=item.stockTracking?.closedContainerLocation||item.stockTracking?.defaultClosedLocation||"";
  const defaultLocation=closedLocations.length===1?closedLocations[0]:configuredLocation||(closedLocations.length===0?item.location||"":"");
  button?.addEventListener("click",()=>{
    const index=list.querySelectorAll("[data-new-container='true']").length+1,outer=tracking.packagingLevels[0];
    const draft={id:`draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,label:`Nouveau ${outer.singular} ${index}`,location:defaultLocation,remaining:StockTracking.capacity(tracking),capacity:StockTracking.capacity(tracking),unitKey:tracking.trackingUnitKey,status:"closed",version:0};
    list.insertAdjacentHTML("beforeend",renderContainerRecountRow(draft,tracking,inventoryLocations,{isNew:true}));bindHierarchySelectors(list);refreshTitles();
  });
  root.querySelector(".container-recount-list")?.addEventListener("click",event=>{const remove=event.target.closest("[data-remove-container]");if(!remove)return;const row=remove.closest(".container-recount-row");if(row.dataset.newContainer==="true")row.remove();else{row.querySelector("[data-recount-status]").value="finished";row.querySelector("[data-recount-quantity]").value="0";}refreshTitles();});
  root.querySelector(".container-recount-list")?.addEventListener("change",event=>{
    const row=event.target.closest(".container-recount-row");if(!row)return;
    if(event.target.matches("[data-recount-unit]")){
      const previousKey=row.dataset.currentUnit,newKey=event.target.value,previousIndex=tracking.packagingLevels.findIndex(level=>level.key===previousKey),newIndex=tracking.packagingLevels.findIndex(level=>level.key===newKey);
      if(previousIndex>=0&&newIndex>=0){const previousFactor=tracking.packagingLevels.slice(previousIndex+1).reduce((value,level)=>value*level.contains,1),newFactor=tracking.packagingLevels.slice(newIndex+1).reduce((value,level)=>value*level.contains,1),input=row.querySelector("[data-recount-quantity]"),parsed=StockTracking.parseLocalizedNumber(input.value);if(Number.isFinite(parsed))input.value=Number((parsed*previousFactor/newFactor).toFixed(6));row.dataset.currentUnit=newKey;}
      return;
    }
    if(!event.target.matches("[data-recount-status]"))return;
    const badge=[...row.querySelectorAll(".stock-distribution-badge")].at(-1),quantityLabel=row.querySelector("[data-recount-quantity-label]");if(!badge)return;
    badge.classList.remove("stock-distribution-badge--closed","stock-distribution-badge--open");
    if(event.target.value==="closed"){badge.textContent="Fermé";badge.classList.add("stock-distribution-badge--closed");quantityLabel.textContent="Quantité actuelle";}
    else if(event.target.value==="open"){badge.textContent="Ouvert";badge.classList.add("stock-distribution-badge--open");quantityLabel.textContent="Quantité restante";}
    else{badge.textContent="Terminé";quantityLabel.textContent="Quantité restante";row.querySelector("[data-recount-quantity]").value="0";}reorderRows(row);refreshTitles();
  });
  reorderRows();refreshTitles();
}

function getAliquotPreparationSources(item) {
  const tracking = StockTracking.normalizeTracking(item);
  if (tracking.mode === "simple") {
    const quantity = StockTracking.simpleRawAvailable(item);
    return { mode: "simple", quantity, unit: StockTracking.normalizeUnitLabel(item.unit), location: getItemLocations(item)[0] || item.location || "—", groups: quantity > 0 ? [{ type: "simple", label: "Stock disponible", sources: [{ id: "global", quantity, location: getItemLocations(item)[0] || item.location || "—" }] }] : [] };
  }
  const openUnit = StockTracking.trackingLevel(tracking), outer = tracking.packagingLevels[0];
  const open = tracking.openContainers.filter(row => row.status === "open" && row.remaining > 0).map(row => { const quantity = StockTracking.fromBaseQuantity(row.remaining, tracking); return { id: row.id, quantity, location: row.location || "—",roomId:row.roomId||"",locationId:row.locationId||"",sublocationId:row.sublocationId||"", label: `${formatOpenContainerDisplayTitle(row.label, outer.singular)} · Ouvert · ${StockTracking.format(quantity)} ${StockTracking.plural(quantity, openUnit.singular, openUnit.plural)} · ${row.location || "—"}` }; });
  const closed = tracking.closedContainers.filter(row=>row.status==="closed"&&row.remaining>0).map(row=>{const quantity=StockTracking.fromBaseQuantity(row.remaining,tracking);return{id:row.id,quantity,location:row.location,roomId:row.roomId||"",locationId:row.locationId||"",sublocationId:row.sublocationId||"",label:`${row.label||row.id} · Fermé · ${StockTracking.format(quantity)} ${StockTracking.plural(quantity,openUnit.singular,openUnit.plural)} · ${row.location||"—"}`};});
  return { mode: "containers", unit: openUnit, groups: [...(open.length ? [{ type: "container", label: "Contenant ouvert", sources: open }] : []), ...(closed.length ? [{ type: "closed", label: "Contenant fermé", sources: closed }] : [])] };
}

function renderAliquotPreparationFields(item, locations) {
  const sourceState = getAliquotPreparationSources(item), unit = sourceState.unit;
  if (!sourceState.groups.length) return `<div class="stock-source-empty"><strong>Aucun stock disponible pour préparer des aliquotes.</strong><button class="ghost-btn compact-btn" type="button" data-empty-stock-action>${sourceState.mode === "containers" ? "Réceptionner du stock" : "Réceptionner du stock"}</button></div>`;
  const sources=sourceState.groups.flatMap(group=>group.sources.map(source=>({...source,type:group.type}))),sourceOptions=sources.map(source=>`<option value="${escapeHtml(`${source.type}|${source.id}`)}">${escapeHtml(source.label||`${source.location} · ${StockTracking.format(source.quantity)} ${unit.plural}`)}</option>`).join("");
  const sourceControls=`<label><span>Stock source <b class="required-star">*</b></span><select id="smStockSource" required>${sourceOptions}</select></label><input id="smSourceType" type="hidden"><input id="smSourceId" type="hidden">`;
  const initialMax = sourceState.mode === "simple" ? sourceState.quantity : "";
  return `<div class="aliquot-preparation-grid">${sourceControls}<label><span>Nombre d’aliquotes <b class="required-star">*</b></span><input id="smCreated" type="number" min="1" step="1" required></label><label><span>Volume d’une aliquote <b class="required-star">*</b></span><input id="smVolume" type="number" min="0" step="any" required></label><label><span>Unité de volume <b class="required-star">*</b></span><input id="smVolumeUnit" value="µL" required></label><label><span>Concentration d’une aliquote <b class="required-star">*</b></span><input id="smConcentration" type="number" min="0" step="any" required></label><label><span>Unité de concentration <b class="required-star">*</b></span><input id="smConcentrationUnit" value="mM" required></label><label class="full-label"><span id="smSourceQuantityLabel">Quantité source utilisée — ${escapeHtml(unit.plural)} <b class="required-star">*</b></span><input id="smSourceQuantity" type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" ${initialMax!==""?`max="${initialMax}"`:""} required><small id="smSourceQuantityNotice"></small></label><div class="aliquot-preparation-location">${hierarchySelectorsHtml("aliquot-preparation",{})}<input id="smTo" type="hidden" data-recount-location></div><label><span>Nombre d’aliquotes dans cette localisation <b class="required-star">*</b></span><input id="smLocationQuantity" type="number" min="1" step="1" required></label></div>`;
}

function setAdditionalAliquotLocationVisible(modal, visible, values = {}) {
  const row = modal.querySelector("#additionalAliquotLocationRow"), addButton = modal.querySelector("#addAliquotLocationBtn"), location = modal.querySelector("#smTo2"), quantity = modal.querySelector("#smLocationQuantity2");
  if (!row || !location || !quantity) return;
  row.classList.toggle("hidden", !visible);
  addButton?.classList.toggle("hidden", visible);
  location.disabled = !visible;
  quantity.disabled = !visible;
  location.required = visible;
  quantity.required = visible;
  quantity.min = visible ? "1" : "0";
  if (visible) {
    location.value = values.location || "";
    quantity.value = values.quantity ?? "";
  } else {
    location.value = "";
    quantity.value = "";
    location.setCustomValidity("");
    quantity.setCustomValidity("");
  }
}

function validateAliquotDistribution(modal) {
  const errorBox = modal.querySelector("#stockManagerError"), total = StockTracking.parseLocalizedNumber(modal.querySelector("#smCreated")?.value), firstLocation = modal.querySelector("#smTo"), firstQuantity = modal.querySelector("#smLocationQuantity"), secondLocation = modal.querySelector("#smTo2"), secondQuantity = modal.querySelector("#smLocationQuantity2"), secondVisible = Boolean(secondLocation && !secondLocation.disabled);
  [firstLocation, firstQuantity, secondLocation, secondQuantity].forEach(control => control?.setCustomValidity(""));
  if (!Number.isFinite(total) || total <= 0 || !firstLocation?.value || !Number.isFinite(StockTracking.parseLocalizedNumber(firstQuantity?.value))) return true;
  if (secondVisible && secondLocation.value === firstLocation.value) {
    const message = "Sélectionnez deux localisations différentes.";
    secondLocation.setCustomValidity(message); errorBox.textContent = message; errorBox.classList.remove("hidden"); secondLocation.focus(); return false;
  }
  const first = StockTracking.parseLocalizedNumber(firstQuantity.value), second = secondVisible ? StockTracking.parseLocalizedNumber(secondQuantity.value) : 0;
  if (secondVisible && (!secondLocation.value || !Number.isFinite(second) || second <= 0)) return true;
  const difference = total - first - second;
  if (Math.abs(difference) > 1e-8) {
    const message = difference > 0 ? `Répartissez les ${StockTracking.format(total)} aliquotes entre les localisations sélectionnées. Il reste ${StockTracking.format(difference)} aliquote${difference > 1 ? "s" : ""} à attribuer.` : `La répartition dépasse de ${StockTracking.format(Math.abs(difference))} aliquote${Math.abs(difference) > 1 ? "s" : ""} le nombre préparé.`;
    firstQuantity.setCustomValidity(message); errorBox.textContent = message; errorBox.classList.remove("hidden"); firstQuantity.focus(); return false;
  }
  errorBox.classList.add("hidden");
  return true;
}

function buildAliquotPreparationOperation(modal, sourceItem) {
  const value = id => modal.querySelector(`#${id}`)?.value || "", numeric = id => StockTracking.parseLocalizedNumber(value(id)), sourceType = value("smSourceType"), sourceId = value("smSourceId"), sourceTracking = StockTracking.normalizeTracking(sourceItem || {}), normalizedSourceQuantity = numeric("smSourceQuantity");
  const hierarchy=modal.querySelector("[data-hierarchy-prefix='aliquot-preparation']"),roomId=hierarchy?.querySelector("[data-hierarchy-room]").value||"",locationId=hierarchy?.querySelector("[data-hierarchy-location]").value||"",sublocationId=hierarchy?.querySelector("[data-hierarchy-sublocation]").value||"";
  return { sourceType, sourceId, fromLocation: value("smFrom"), sourceQuantity: normalizedSourceQuantity, representedSourceQuantity: normalizedSourceQuantity, createdCount: numeric("smCreated"), volume: numeric("smVolume"), volumeUnit: value("smVolumeUnit"), concentration: numeric("smConcentration"), concentrationUnit: value("smConcentrationUnit"), sourceUnit: sourceTracking.mode === "simple" ? (sourceItem?.unit || "") : StockTracking.trackingLevel(sourceTracking).plural, preparedAt: new Date().toISOString(), locations: [{ location: value("smTo"),roomId,locationId,sublocationId, quantity: numeric("smLocationQuantity") }].filter(row => row.location && row.quantity) };
}

function syncAliquotSourceEntity(modal, item) {
  const selector=modal.querySelector("#smStockSource"),sourceState=getAliquotPreparationSources(item);if(!selector)return;
  const syncLimit = () => {
    const [type,id]=selector.value.split("|"),group=sourceState.groups.find(entry=>entry.type===type),selected=group?.sources.find(source=>source.id===id),quantity=modal.querySelector("#smSourceQuantity");modal.querySelector("#smSourceType").value=type;modal.querySelector("#smSourceId").value=id;
    const destination=modal.querySelector("[data-hierarchy-prefix='aliquot-preparation']");if(selected&&destination&&(selected.roomId||selected.locationId)){destination.outerHTML=hierarchySelectorsHtml("aliquot-preparation",selected);bindHierarchySelectors(modal);const hidden=modal.querySelector("#smTo");if(hidden)hidden.value=hierarchyPathForIds(selected.roomId,selected.locationId,selected.sublocationId);}
    if (!quantity) return;
    const capacity=selected?.quantity,label=modal.querySelector("#smSourceQuantityLabel");if(label)label.innerHTML=`Quantité source utilisée — ${escapeHtml(sourceState.unit.plural)} <b class="required-star">*</b>`;
    quantity.max = Number.isFinite(capacity) ? capacity : "";
    if (!quantity.dataset.manual) quantity.value = "";
    quantity.readOnly = false;
  };
  selector.addEventListener("change",syncLimit);
  syncLimit();
}

function formatPreparationOption(prep) {
  const parsedDate = prep.preparedAt ? new Date(`${prep.preparedAt}T12:00:00`) : null, date = parsedDate && Number.isFinite(parsedDate.getTime()) ? new Intl.DateTimeFormat("fr-FR").format(parsedDate) : "Date inconnue";
  const available = StockTracking.remainingAliquots(prep);
  return `Préparation du ${date} · ${available} disponible${available > 1 ? "s" : ""}${prep.volume ? ` · ${StockTracking.format(prep.volume)} ${prep.volumeUnit}` : ""}${prep.concentration ? ` · ${StockTracking.format(prep.concentration)} ${prep.concentrationUnit}` : ""}`;
}

function getActiveOpenAliquots(aliquots) { return aliquots.preparations.flatMap(prep => prep.openAliquots.filter(open => open.status === "open" && open.remainingVolume > 0).map(open => ({ prep, open }))); }

function renderAliquotUseFields(item) {
  const aliquots = StockTracking.normalizeAliquots(item), unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0), partial = unopened.filter(prep => prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots), modes = [];
  if (unopened.length) modes.push(["whole", "Aliquotes entières"]);
  if (partial.length) modes.push(["open_new", "Utiliser partiellement une nouvelle aliquote"]);
  if (opened.length) modes.push(["open_existing", "Utiliser une aliquote déjà ouverte"]);
  if (!modes.length) return `<div class="stock-source-empty"><strong>Aucune aliquote disponible. Préparez d’abord des aliquotes.</strong></div>`;
  const legacyNote = unopened.length && !partial.length ? `<p class="tracking-option-explanation">Le volume individuel de cette préparation n’est pas défini. Seule la consommation d’aliquotes entières est disponible.</p>` : "";
  return `${stockSelect("smAliquotUseMode", "Mode d’utilisation", modes)}${legacyNote}<div id="smAliquotUseFields" class="form-grid nested-stock-fields"></div>`;
}

function renderPreparationCorrectionFields(item){const views=activePreparationViews(item),options=views.map(view=>[view.preparation.id,`${view.label} · ${StockTracking.remainingAliquots(view.preparation)+(view.preparation.openAliquots||[]).filter(row=>row.status==="open").length} disponibles`]);return `<div class="preparation-correction-picker">${stockSelect("smEntity","Préparation ou lot",options)}</div><div id="smPreparationCorrection"></div>`;}
function syncPreparationCorrectionFields(modal,item){const view=activePreparationViews(item).find(row=>row.preparation.id===modal.querySelector("#smEntity")?.value),prep=view?.preparation,host=modal.querySelector("#smPreparationCorrection");if(!prep||!host)return;const open=(prep.openAliquots||[]).filter(row=>row.status==="open").length,total=StockTracking.remainingAliquots(prep)+open,location=(prep.locations||[])[0]||{};host.innerHTML=`<section class="preparation-correction-card" data-preparation-id="${escapeHtml(prep.id)}"><header><strong>${escapeHtml(view.label)}</strong></header><div class="preparation-correction-grid"><label><span>Nombre d’aliquotes disponibles <b class="required-star">*</b></span><input id="smAvailableCount" type="number" min="0" step="1" required value="${total}"></label><label><span>Volume d’une aliquote <b class="required-star">*</b></span><input id="smVolume" type="number" min="0" step="any" required value="${prep.volume||0}"></label><label><span>Unité de volume <b class="required-star">*</b></span><input id="smVolumeUnit" value="${escapeHtml(prep.volumeUnit||"")}" required></label><label><span>Concentration <b class="required-star">*</b></span><input id="smConcentration" type="number" min="0" step="any" required value="${prep.concentration||0}"></label><label><span>Unité de concentration <b class="required-star">*</b></span><input id="smConcentrationUnit" value="${escapeHtml(prep.concentrationUnit||"")}" required></label>${hierarchySelectorsHtml("preparation-correction",location)}<input id="smPrepLocation" type="hidden" data-recount-location value="${escapeHtml(location.location||"")}"></div></section>`;bindHierarchySelectors(host);}

function syncAliquotUseFields(modal, item) {
  const host = modal.querySelector("#smAliquotUseFields"), mode = modal.querySelector("#smAliquotUseMode")?.value, aliquots = StockTracking.normalizeAliquots(item); if (!host || !mode) return;
  const unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0), partial = unopened.filter(prep => prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots);
  if (mode === "whole") host.innerHTML = stockSelect("smEntity", "Préparation concernée", unopened.map(prep => [prep.id, formatPreparationOption(prep)])) + `<div id="smAliquotLocationField"></div>` + stockNumber("smQuantity", "Nombre d’aliquotes utilisées");
  else if (mode === "open_new") host.innerHTML = stockSelect("smEntity", "Préparation", partial.map(prep => [prep.id, formatPreparationOption(prep)])) + `<div id="smAliquotLocationField"></div>` + stockNumber("smQuantity", `Volume utilisé`);
  else host.innerHTML = stockSelect("smEntity", "Aliquote ouverte", opened.map(({ prep, open }) => [open.id, `${open.label} · ${StockTracking.format(open.remainingVolume)} ${open.volumeUnit} restants · ${open.location || "—"} · ${prep.label}`])) + stockNumber("smQuantity", "Volume utilisé");
  const preferred = modal.dataset.entityId; if (preferred && Array.from(host.querySelector("#smEntity")?.options || []).some(option => option.value === preferred)) host.querySelector("#smEntity").value = preferred;
  const syncLocation = () => { const prep = aliquots.preparations.find(row => row.id === host.querySelector("#smEntity")?.value), locationHost = host.querySelector("#smAliquotLocationField"); if (!locationHost || !prep) return; locationHost.innerHTML = stockSelect("smFrom", "Localisation source", prep.locations.filter(row => row.quantity > 0).map(row => [row.location, `${row.location} · ${row.quantity} disponible${row.quantity > 1 ? "s" : ""}`])); const quantity = host.querySelector("#smQuantity"); if (quantity && mode === "open_new") { quantity.max = prep.volume; quantity.closest("label")?.querySelector("span")?.replaceChildren(`Volume utilisé — ${prep.volumeUnit}`); } };
  const syncOpenLimit = () => { if(mode!=="open_existing")return;const pair=opened.find(({open})=>open.id===host.querySelector("#smEntity")?.value),quantity=host.querySelector("#smQuantity");if(pair&&quantity){quantity.max=pair.open.remainingVolume;quantity.closest("label")?.querySelector("span")?.replaceChildren(`Volume utilisé — ${pair.open.volumeUnit}`);} };
  host.querySelector("#smEntity")?.addEventListener("change", mode === "open_existing" ? syncOpenLimit : syncLocation); syncLocation(); syncOpenLimit();
}

function renderOpenAliquotActionFields(item, action) {
  const aliquots = StockTracking.normalizeAliquots(item), unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0 && prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots);
  if (action === "aliquot_opened") return unopened.length ? `${stockSelect("smEntity", "Préparation", unopened.map(prep => [prep.id, formatPreparationOption(prep)]))}<div id="smAliquotLocationField"></div><label>Localisation de l’aliquote ouverte<select id="smTo" required></select></label>` : `<div class="stock-source-empty"><strong>Le volume individuel de cette préparation n’est pas défini ou aucune aliquote n’est disponible.</strong></div>`;
  const options = opened.map(({ prep, open }) => [open.id, `${open.label} · ${StockTracking.format(open.remainingVolume)} ${open.volumeUnit} restants · ${open.location || "—"} · ${prep.label}`]);
  if (action === "open_aliquot_moved") return stockSelect("smEntity", "Aliquote ouverte", options) + stockSelect("smTo", "Nouvelle localisation", inventoryLocations.map(place => [place, place]));
  return stockSelect("smEntity", "Aliquote ouverte", options) + `<label>Raison<select id="smDiscardReason" required><option>Reliquat non conservable</option><option>Contamination</option><option>Fin d’expérience</option><option>Erreur de préparation</option><option>Autre</option></select></label><label id="smDiscardOtherField" class="hidden">Précisez la raison<textarea id="smDiscardOther" rows="2" disabled></textarea></label>`;
}

function syncAliquotOpeningLocations(modal, item) {
  const aliquots = StockTracking.normalizeAliquots(item), prep = aliquots.preparations.find(row => row.id === modal.querySelector("#smEntity")?.value), host = modal.querySelector("#smAliquotLocationField"); if (!prep || !host) return;
  host.innerHTML = stockSelect("smFrom", "Localisation source", prep.locations.filter(row => row.quantity > 0).map(row => [row.location, `${row.location} · ${row.quantity} disponible${row.quantity > 1 ? "s" : ""}`]));
  const destination = modal.querySelector("#smTo"); if (destination) { const syncDestination=()=>{const source=host.querySelector("#smFrom")?.value||"",places=Array.from(new Set([source,...inventoryLocations].filter(Boolean)));destination.innerHTML=places.map(place => `<option value="${escapeHtml(place)}">${escapeHtml(place)}</option>`).join("");destination.value=source;};host.querySelector("#smFrom")?.addEventListener("change",syncDestination);syncDestination(); }
}
function renderStockManagerFields() {
  const modal = document.querySelector("#stockManagerDialog"), item = items.find(row => row.id === modal.querySelector("#stockManagerItemId").value); if (!item) return;
  const action = modal.querySelector("#stockManagerAction").value, tracking = StockTracking.normalizeTracking(item), openUnit = StockTracking.trackingLevel(tracking), aliquots = StockTracking.normalizeAliquots(item), locations = inventoryLocations.map(place => [place,place]), containers = tracking.openContainers.filter(row => row.status === "open").map(row => { const remaining=StockTracking.fromBaseQuantity(row.remaining,tracking); return [row.id,`${row.label} · ${row.location} · ${StockTracking.format(remaining)} ${StockTracking.plural(remaining,openUnit.singular,openUnit.plural)}`]; }), preps = aliquots.preparations.filter(row => row.status === "active").map(row => [row.id,`${row.label} · ${StockTracking.remainingAliquots(row)} restantes`]); let html="";
  if (action === "received") html = tracking.mode === "simple" ? stockNumber("smQuantity",`Quantité reçue — ${item.unit}`) : stockSelect("smTo","Localisation",locations)+stockNumber("smQuantity","Nombre de contenants fermés");
  else if (action === "container_opened") html = stockSelect("smFrom","Localisation du contenant fermé",tracking.closedByLocation.filter(row=>row.quantity).map(row=>[row.location,`${row.location} (${row.quantity})`]));
  else if (action === "consumed" && tracking.mode === "simple") html = stockNumber("smQuantity",`Quantité utilisée — ${item.unit}`,StockTracking.simpleRawAvailable(item));
  else if (action === "consumed") html = (containers.length ? stockSelect("smEntity","Contenant à utiliser en premier",containers) : `<input id="smEntity" type="hidden" value="">`)+stockNumber("smQuantity",`Quantité utilisée — ${openUnit.plural}`);
  else if (action === "stock_recounted" && tracking.mode === "simple") html=`<div class="stock-source-summary"><span>Stock enregistré</span><strong>${StockTracking.format(item.quantity)} ${escapeHtml(item.unit)}</strong><small>La quantité saisie remplacera le stock enregistré.</small></div>${stockNumber("smQuantity",`Stock physique compté — ${item.unit}`)}`;
  else if (action === "stock_recounted") { const recountLocations=Array.from(new Set([item.location,...getItemLocations(item),...tracking.closedByLocation.map(row=>row.location),...inventoryLocations].filter(Boolean))),outer=tracking.packagingLevels[0],feminine=isLikelyFeminineUnit(outer.singular),closed=feminine?"fermées":"fermés",registered=feminine?"enregistrées":"enregistrés",counted=feminine?"comptées":"comptés";html=`<div class="stock-source-summary"><span>Comptage absolu</span><strong>${StockTracking.totalClosed(tracking)} ${escapeHtml(outer.plural)} ${closed} ${registered}</strong><small>Le nombre saisi remplacera uniquement les contenants ${closed} de la localisation choisie. Les contenants ouverts resteront inchangés.</small></div>${stockSelect("smFrom","Localisation",recountLocations.map(place=>{const current=tracking.closedByLocation.find(row=>row.location===place)?.quantity||0;return[place,`${place} — ${current} ${outer.plural} ${closed}`]}))}${stockNumber("smQuantity",`Nombre de ${outer.plural} ${closed} ${counted}`)}`; }
  else if (action === "recounted") html=renderContainerRecountFields(item);
  else if (action === "moved") html = stockSelect("smEntityType","Type",[["closed","Contenant fermé"],["container","Contenant ouvert"]])+stockSelect("smFrom","Origine",locations)+stockSelect("smTo","Destination",locations)+stockNumber("smQuantity","Quantité (1 pour un contenant ouvert)");
  else if (action === "aliquots_prepared") html = renderAliquotPreparationFields(item, locations);
  else if (action === "aliquots_consumed") html = renderAliquotUseFields(item);
  else if (["aliquot_opened","open_aliquot_moved","open_aliquot_discarded"].includes(action)) html = renderOpenAliquotActionFields(item, action);
  else if (action==="preparation_recounted") html=renderPreparationCorrectionFields(item);
  else if (["aliquots_moved","preparation_finished"].includes(action)) html = stockSelect("smEntity","Préparation",preps)+stockSelect("smFrom","Localisation",locations)+(action==="aliquots_moved"?stockSelect("smTo","Destination",locations):"")+(action!=="preparation_finished"?stockNumber("smQuantity","Nombre d’aliquotes"):"");
  modal.querySelector("#stockManagerFields").innerHTML = html;
  const executeButton = modal.querySelector("#executeStockManagerBtn"), noSource = action === "aliquots_prepared" && !getAliquotPreparationSources(item).groups.length;
  executeButton.disabled = noSource;
  if (action === "aliquots_prepared" && !noSource) {
    syncAliquotSourceEntity(modal, item);
    bindHierarchySelectors(modal);
    modal.querySelector("#smSourceType")?.addEventListener("change", () => syncAliquotSourceEntity(modal, item));
    setAdditionalAliquotLocationVisible(modal, false);
    modal.querySelector("#addAliquotLocationBtn")?.addEventListener("click", () => setAdditionalAliquotLocationVisible(modal, true));
    modal.querySelector("#removeAliquotLocationBtn")?.addEventListener("click", () => setAdditionalAliquotLocationVisible(modal, false));
    const sourceQuantity=modal.querySelector("#smSourceQuantity"),created=modal.querySelector("#smCreated"),volume=modal.querySelector("#smVolume"),notice=modal.querySelector("#smSourceQuantityNotice");
    const recalculate=()=>{const count=StockTracking.parseLocalizedNumber(created?.value),perAliquot=StockTracking.parseLocalizedNumber(volume?.value);if(Number.isFinite(count)&&Number.isFinite(perAliquot)){sourceQuantity.value=Number((count*perAliquot).toFixed(6));sourceQuantity.dataset.manual="false";notice.textContent="Quantité source actualisée à partir du nombre et du volume final.";}};
    sourceQuantity?.addEventListener("input",()=>{sourceQuantity.dataset.manual="true";notice.textContent="Valeur corrigée manuellement ; elle sera conservée à la validation.";});created?.addEventListener("input",recalculate);volume?.addEventListener("input",recalculate);
  }
  if (action === "aliquots_consumed") { const preferred=modal.dataset.entityId, opened=getActiveOpenAliquots(aliquots); if (preferred && opened.some(({open})=>open.id===preferred)) modal.querySelector("#smAliquotUseMode").value="open_existing"; syncAliquotUseFields(modal,item); modal.querySelector("#smAliquotUseMode")?.addEventListener("change",()=>syncAliquotUseFields(modal,item)); }
  if (action === "aliquot_opened") { syncAliquotOpeningLocations(modal,item); modal.querySelector("#smEntity")?.addEventListener("change",()=>syncAliquotOpeningLocations(modal,item)); }
  if (action === "open_aliquot_discarded") modal.querySelector("#smDiscardReason")?.addEventListener("change", event => { const other=modal.querySelector("#smDiscardOtherField"), input=modal.querySelector("#smDiscardOther"), visible=event.target.value==="Autre"; other.classList.toggle("hidden",!visible); input.disabled=!visible; input.required=visible; if(!visible)input.value=""; });
  if(action==="recounted"&&tracking.mode==="containers")bindContainerRecountControls(modal,item,tracking);
  if(action==="preparation_recounted"){syncPreparationCorrectionFields(modal,item);modal.querySelector("#smEntity")?.addEventListener("change",()=>syncPreparationCorrectionFields(modal,item));}
  modal.querySelector("[data-empty-stock-action]")?.addEventListener("click", () => { modal.close(); if (StockTracking.normalizeTracking(item).mode === "simple") openStockModal(item.id); else { openStockManager(item.id); const nextModal = document.querySelector("#stockManagerDialog"); nextModal.querySelector("#stockManagerAction").value = "received"; renderStockManagerFields(); } });
}

function validateAliquotManagerFields(modal,action){const error=modal.querySelector("#stockManagerError"),set=(control,message,valid)=>{control?.setCustomValidity(valid?"":message);return valid;};let valid=true;if(action==="aliquots_prepared"){const positive=[ ["#smCreated","Le nombre d’aliquotes doit être strictement positif."],["#smVolume","Le volume d’une aliquote doit être strictement positif."],["#smSourceQuantity","La quantité source utilisée doit être strictement positive."],["#smLocationQuantity","Le nombre d’aliquotes attribué doit être strictement positif."]];positive.forEach(([selector,message])=>{const control=modal.querySelector(selector),ok=StockTracking.parseLocalizedNumber(control?.value)>0;valid=set(control,message,ok)&&valid;});["#smVolumeUnit","#smConcentrationUnit"].forEach(selector=>{const control=modal.querySelector(selector),ok=Boolean(control?.value.trim());valid=set(control,"Ce champ est obligatoire.",ok)&&valid;});const concentration=modal.querySelector("#smConcentration"),concentrationOk=StockTracking.parseLocalizedNumber(concentration?.value)>0;valid=set(concentration,"La concentration doit être strictement positive.",concentrationOk)&&valid;const source=modal.querySelector("#smSourceQuantity"),max=Number(source?.max);if(valid&&Number.isFinite(max)&&StockTracking.parseLocalizedNumber(source.value)>max){valid=set(source,"La quantité source dépasse la quantité disponible.",false);}}
if(action==="preparation_recounted"){["#smAvailableCount","#smVolume","#smVolumeUnit","#smConcentration","#smConcentrationUnit"].forEach(selector=>{const control=modal.querySelector(selector),numeric=control?.type==="number",ok=numeric?Number.isFinite(StockTracking.parseLocalizedNumber(control.value))&&StockTracking.parseLocalizedNumber(control.value)>=0:Boolean(control?.value.trim());valid=set(control,"Ce champ est obligatoire et doit être valide.",ok)&&valid;});}if(!valid){const invalid=modal.querySelector(":invalid");error.textContent=invalid?.validationMessage||"Veuillez compléter tous les champs obligatoires.";error.classList.remove("hidden");invalid?.focus();}return valid;}

async function submitStockManager(event) {
  event.preventDefault(); const modal = event.currentTarget.closest("dialog"), button = modal.querySelector("#executeStockManagerBtn"), errorBox = modal.querySelector("#stockManagerError");
  if (button.disabled) return;
  const reason=modal.querySelector("#stockManagerComment");reason.setCustomValidity(reason.value.trim()?"":"Veuillez préciser le motif de la modification afin d’assurer la traçabilité.");
  if(!validateAliquotManagerFields(modal,modal.querySelector("#stockManagerAction")?.value))return;
  if (modal.querySelector("#stockManagerAction")?.value === "aliquots_prepared" && !validateAliquotDistribution(modal)) return;
  if (!event.currentTarget.reportValidity()) { errorBox.textContent=reason.validationMessage;errorBox.classList.remove("hidden");return; }
  const value = id => modal.querySelector(`#${id}`)?.value || "", numeric = id => StockTracking.parseLocalizedNumber(value(id)), action = value("stockManagerAction"), operationId = StockTracking.id("operation"), comment = normalizeMultilineText(value("stockManagerComment")), operation = { operationId, type: action, entityId:value("smEntity"), entityType: action.startsWith("aliquot") || action.startsWith("preparation") ? "preparation" : "container", quantity:numeric("smQuantity"), fromLocation:value("smFrom"), toLocation:value("smTo"), comment, correctionReason:["container_finished","preparation_finished"].includes(action)?comment:"" };
  const sourceItem = items.find(row => row.id === value("stockManagerItemId")), sourceTracking = StockTracking.normalizeTracking(sourceItem || {});
  if(action==="stock_recounted"){operation.type="recounted";operation.entityType=sourceTracking.mode==="containers"?"closed":"item";}
  if (action === "recounted" && sourceTracking.mode === "containers") {
    const changes=Array.from(modal.querySelectorAll(".container-recount-row")).map(row=>{
      const status=row.querySelector("[data-recount-status]").value,unitKey=row.querySelector("[data-recount-unit]").value,location=row.querySelector("[data-recount-location]").value,quantity=StockTracking.parseLocalizedNumber(row.querySelector("[data-recount-quantity]").value),levelIndex=sourceTracking.packagingLevels.findIndex(level=>level.key===unitKey),factor=sourceTracking.packagingLevels.slice(levelIndex+1).reduce((value,level)=>value*level.contains,1),capacity=Number(row.dataset.capacityBase)/factor;
      const changed=status!==row.dataset.originalStatus||unitKey!==row.dataset.originalUnit||location!==row.dataset.originalLocation||Math.abs(quantity-Number(row.dataset.originalQuantity))>1e-8;
      return changed?{containerId:row.dataset.containerId,expectedVersion:Number(row.dataset.version),status,unitKey,location,quantity,capacity,beforeStatus:row.dataset.originalStatus,isNew:row.dataset.newContainer==="true"}:null;
    }).filter(Boolean);
    changes.forEach(change=>{const row=modal.querySelector(`.container-recount-row[data-container-id="${CSS.escape(change.containerId)}"]`),group=row?.querySelector("[data-hierarchy-prefix]");if(group){change.roomId=group.querySelector("[data-hierarchy-room]").value;change.locationId=group.querySelector("[data-hierarchy-location]").value;change.sublocationId=group.querySelector("[data-hierarchy-sublocation]").value;}});
    if(!changes.length){errorBox.textContent="Aucun contenant n’a été modifié.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>!Number.isFinite(change.quantity)||change.quantity<0||!Number.isFinite(change.capacity)||change.capacity<=0)){errorBox.textContent="Chaque quantité doit être positive ou nulle et chaque capacité doit être strictement positive.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>change.quantity>change.capacity)){errorBox.textContent="La quantité actuelle ou restante ne peut pas dépasser la capacité totale.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>change.isNew&&change.status==="open"&&change.quantity===0)){errorBox.textContent="Un nouveau contenant ouvert doit avoir une quantité restante positive.";errorBox.classList.remove("hidden");return;}
    for(const change of changes){if(change.beforeStatus==="open"&&change.status==="open"&&change.quantity===0){if(!window.confirm(`${change.containerId} ne contient plus de stock. Le marquer comme terminé ?`))return;change.status="finished";}}
    const confirmations=[];
    changes.forEach(change=>{
      if(!change.isNew&&change.beforeStatus!==change.status)confirmations.push(`${change.containerId} : confirmer la transition ${change.beforeStatus==="closed"?"Fermé":"Ouvert"} → ${change.status==="closed"?"Fermé":change.status==="open"?"Ouvert":"Terminé"}.`);
    });
    if(confirmations.length&&!window.confirm(`${confirmations.join("\n")}\n\nEnregistrer ces modifications ?`))return;
    operation.type="containers_recounted";operation.entityType="containers";operation.changes=changes;
  }
  if (action === "consumed" && sourceTracking.mode === "containers") {
    const quantity=numeric("smQuantity"), openUnit=StockTracking.trackingLevel(sourceTracking), required=StockTracking.toBaseQuantity(quantity,sourceTracking), opened=sourceTracking.openContainers.filter(row=>row.status==="open"&&row.remaining>0), openAvailable=opened.reduce((sum,row)=>sum+row.remaining,0), closedCount=StockTracking.totalClosed(sourceTracking), totalAvailable=openAvailable+closedCount*StockTracking.capacity(sourceTracking);
    if (!(quantity>0) || required>totalAvailable) { errorBox.textContent="Aucun stock ouvert ou fermé suffisant ne permet d’enregistrer cette utilisation."; errorBox.classList.remove("hidden"); return; }
    const needsOpen=required>openAvailable, finishes=required>=openAvailable&&opened.length>0 || opened.some(row=>row.id===operation.entityId&&required>=row.remaining);
    const messages=[];
    if(needsOpen)messages.push(`Aucun contenant ouvert suffisant n’est disponible. Un contenant fermé sera ouvert automatiquement avant d’enregistrer cette utilisation.`);
    if(finishes)messages.push(`Cette utilisation consommera tout le stock restant d’au moins un contenant, qui sera automatiquement marqué comme terminé.`);
    if(messages.length&&!window.confirm(`${messages.join("\n\n")}\n\nContinuer ?`))return;
    operation.entityType="containers_auto";
  }
  if (action === "moved") { operation.entityType=value("smEntityType"); if (operation.entityType === "container") { const item=items.find(row=>row.id===value("stockManagerItemId")); const candidate=StockTracking.normalizeTracking(item).openContainers.find(row=>row.location===operation.fromLocation&&row.status==="open"); if(!candidate) { errorBox.textContent="Aucun contenant ouvert dans cette localisation."; errorBox.classList.remove("hidden"); return; } operation.entityId=candidate.id; operation.quantity=1; } }
  if (action === "aliquots_prepared") Object.assign(operation, buildAliquotPreparationOperation(modal, items.find(row => row.id === value("stockManagerItemId"))));
  const sourceAliquots = StockTracking.normalizeAliquots(sourceItem || {});
  if(action==="preparation_recounted"){const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")),group=modal.querySelector("[data-hierarchy-prefix='preparation-correction']");Object.assign(operation,{type:"preparation_corrected",entityId:prep?.id,entityType:"preparation",expectedVersion:prep?.version,availableCount:numeric("smAvailableCount"),volume:numeric("smVolume"),volumeUnit:value("smVolumeUnit"),concentration:numeric("smConcentration"),concentrationUnit:value("smConcentrationUnit"),roomId:group?.querySelector("[data-hierarchy-room]").value||"",locationId:group?.querySelector("[data-hierarchy-location]").value||"",sublocationId:group?.querySelector("[data-hierarchy-sublocation]").value||"",location:value("smPrepLocation")});}
  if (action === "aliquots_consumed") {
    const mode=value("smAliquotUseMode");
    if (mode === "whole") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); Object.assign(operation,{type:"aliquots_consumed",entityId:value("smEntity"),entityType:"preparation",expectedVersion:prep?.version}); }
    else if (mode === "open_new") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); Object.assign(operation,{type:"open_aliquot_consumed",entityId:value("smEntity"),entityType:"preparation",openNew:true,expectedVersion:prep?.version}); }
    else { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===value("smEntity")); Object.assign(operation,{type:"open_aliquot_consumed",entityId:value("smEntity"),entityType:"open_aliquot",expectedVersion:pair?.open.version}); }
  }
  if (action === "aliquot_opened") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); operation.expectedVersion=prep?.version; operation.entityType="preparation"; }
  if (["open_aliquot_moved","open_aliquot_discarded"].includes(action)) { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===value("smEntity")); operation.expectedVersion=pair?.open.version; operation.entityType="open_aliquot"; if(action==="open_aliquot_discarded"){const reason=value("smDiscardReason"),other=normalizeMultilineText(value("smDiscardOther"));operation.correctionReason=reason==="Autre"?other:reason;} }
  button.disabled=true; errorBox.classList.add("hidden");
  const execute = async () => { try { await executeAtomicStockOperation(value("stockManagerItemId"), operation); modal.close(); render(); } catch (error) { errorBox.textContent=error.message || String(error); errorBox.classList.remove("hidden"); } finally { button.disabled=false; } };
  if (action === "open_aliquot_discarded") { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===operation.entityId); button.disabled=false; openDeleteConfirmation({title:"Jeter le reliquat",message:`${StockTracking.format(pair?.open.remainingVolume || 0)} ${pair?.open.volumeUnit || ""} seront définitivement retirés du stock disponible.`,confirmText:"Jeter le reliquat",trigger:button,onConfirm:execute}); return; }
  await execute();
}

async function executeAtomicStockOperation(itemId, operation) {
  const storage=window.ExadexGithubStorage, config=storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) throw new Error("La sauvegarde GitHub en écriture est requise pour une opération de stock avancée.");
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving=true; renderAlerts();
  try {
    const result=await storage.mutateSharedData(operation.operationId, latest => {
      const state=createSharedState(latest,{includeBootstrap:false}), index=state.inventoryItems.findIndex(row=>row.id===itemId); if(index<0) throw new Error("Cet item n’existe plus.");
      const sourceItem=state.inventoryItems[index],previousQuantity=StockTracking.available(sourceItem),applied=StockTracking.apply(sourceItem,{...operation},{name:currentName,emoji:userIcons[currentName]||""}),events=applied.events||[applied.event],isRecount=["recounted","containers_recounted"].includes(operation.type),currentQuantity=StockTracking.available(applied.item),historyUnit=StockTracking.normalizeTracking(applied.item).mode==="containers"?StockTracking.normalizeTracking(applied.item).packagingLevels[0].plural:applied.item.unit,difference=Number((currentQuantity-previousQuantity).toFixed(6)),note=normalizeMultilineText(operation.comment||"");
      state.inventoryItems[index]={...sourceItem,quantity:applied.item.quantity,stockTracking:applied.item.stockTracking,aliquotTracking:applied.item.aliquotTracking,locations:applied.item.locations,location:applied.item.location};
      state.stockMovements=Array.isArray(state.stockMovements)?state.stockMovements:[];
      state.stockMovements.push(...events);
      state.stockOperations=Array.isArray(state.stockOperations)?state.stockOperations:[];
      state.stockOperations.push({operationId:operation.operationId,itemId,at:applied.event.timestamp,type:operation.type});
      state.history=Array.isArray(state.history)?state.history:[];
      state.history.unshift(isRecount?{id:`history-${operation.operationId}`,operationId:operation.operationId,date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date(applied.event.timestamp)),action:"Comptage / Ajustement",detail:`${applied.event.userName} · ${applied.item.name} · Stock précédent : ${StockTracking.format(previousQuantity)} ${historyUnit} · Stock compté : ${StockTracking.format(currentQuantity)} ${historyUnit} · Écart : ${difference>0?"+":""}${StockTracking.format(difference)} ${historyUnit}${note?` · Note : ${note}`:""}`,user:applied.event.userName,itemId,type:"recounted",previousQuantity,countedQuantity:currentQuantity,difference,unit:historyUnit,note}:{id:`history-${operation.operationId}`,operationId:operation.operationId,date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date(applied.event.timestamp)),action:"Stock mis à jour",detail:`${applied.event.userName} · ${applied.event.type} · ${applied.item.name}${note?` · ${note}`:""}`,user:applied.event.userName,itemId});
      state.updatedAt=applied.event.timestamp;
      return state;
    });
    sharedDataSha=result.sha; sharedDataMode="github-write"; sharedDataHasUnsavedChanges=false; sharedDataRemoteReady=true; sharedDataLastError=""; applySharedState(result.data); initializeSharedSaveCoordinator(result.data,result.sha);
  } finally { sharedDataIsSaving=false; renderAlerts(); }
}

function isSeedItemId(id) {
  return seedBaseItems.some(item => item.id === id);
}

function requestItemDeletion() {
  const id = fields.itemId.value;
  requestItemDeletionById(id);
}

function requestItemDeletionById(id, options = {}) {
  const item = items.find(entry => entry.id === id);
  if (!item) throw new Error("Cet item n’existe plus.");
  openDeleteConfirmation({
    title: `Supprimer définitivement l’item “${item.name}” ?`,
    message: `Cette suppression utilise le workflow de l’inventaire et peut concerner son stock, ses contenants, ses aliquotes, ses commandes ou autres dépendances associées. Cette action est irréversible.`,
    confirmText: "Supprimer l’item",
    trigger: options.trigger,
    onConfirm: () => {
      deleteItem(id);
      if (typeof options.onDeleted === "function") options.onDeleted(item);
    }
  });
}

function deleteItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) throw new Error("Cet item n’existe plus.");

  items = items.filter(entry => entry.id !== id);

  addHistory("Item supprimé", `${currentName} a supprimé ${item.name} de l'inventaire.`);
  persist();
  dialog.close();

  if (selectedItemId === id) {
    selectedItemId = null;
  }

  render();
}

function patchStoredItem(id, patch) {
  const current = items.find(entry => entry.id === id);
  if (!current) return null;

  const nextPatch = typeof patch === "function" ? patch(current) : patch;
  if (!nextPatch || typeof nextPatch !== "object") return current;

  if (isSeedItemId(id)) {
    const index = items.findIndex(entry => entry.id === id);
    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...nextPatch,
        source: "seed"
      };
    }
  } else {
    const index = items.findIndex(entry => entry.id === id);

    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...nextPatch,
        source: "web"
      };
    } else {
      items.unshift({
        ...current,
        ...nextPatch,
        source: "web"
      });
    }
  }

  return items.find(entry => entry.id === id) || null;
}

// funcion para crear un nuevo item dentro del inventario compartido, sin pasar por el formulario
function createStoredItem(itemData) {
  const now = new Date();

  const newItem = {
    id: `itm-${Date.now()}`,
    name: itemData.name?.trim() || "",
    category: itemData.category?.trim() || inventoryCategories[0],
    quantity: Number(itemData.quantity ?? 0),
    unit: itemData.unit?.trim() || "",
    minStock: Number(itemData.minStock ?? 0),
    locations: Array.isArray(itemData.locations)
      ? itemData.locations
      : itemData.location
        ? [itemData.location]
        : [],
    location: Array.isArray(itemData.locations)
      ? (itemData.locations[0] || "")
      : (itemData.location || ""),
    tags: Array.isArray(itemData.tags) ? itemData.tags : [],
    notes: normalizeMultilineText(itemData.notes),
    references: normalizeReferences(itemData.references),
    createdAtRaw: now.toISOString(),
    createdAt: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(now),
    source: "web"
  };

  items.unshift(newItem);
  return items.find(entry => entry.id === newItem.id) || newItem;
}

async function saveStockUpdate() {
  if (!stockForm.reportValidity()) return;

  const id = stockFields.stockItemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const amount = StockTracking.parseLocalizedNumber(stockFields.stockAmount.value);
  const direction = stockFields.stockAction.value;
  if(!Number.isFinite(amount)||amount<0||(direction!=="recounted"&&amount<=0)){
    stockFields.stockAmount.setCustomValidity(direction==="recounted"?"Le stock compté doit être positif ou nul.":"La quantité doit être strictement positive.");
    stockForm.reportValidity();
    stockFields.stockAmount.setCustomValidity("");
    return;
  }
  const title = stockFields.stockTitle.value.trim();
  const note = normalizeMultilineText(stockFields.stockNotes.value);
  const operation={operationId:StockTracking.id("operation"),type:direction==="used"?"consumed":direction,entityType:"item",quantity:amount,comment:[title,note].filter(Boolean).join(" · ")};
  const button=document.querySelector("#saveStockBtn"),errorBox=document.querySelector("#stockUpdateError");
  button.disabled=true;errorBox?.classList.add("hidden");
  try{await executeAtomicStockOperation(id,operation);stockDialog.close();render();}
  catch(error){if(errorBox){errorBox.textContent=error.message||String(error);errorBox.classList.remove("hidden");}}
  finally{button.disabled=false;}
}

function openExperimentModal(id) {
  renderTemplateOptions();
  const experiment = experiments.find(entry => entry.id === id);
  const template = protocolTemplates.find(
    entry => entry.id === experiment?.templateId
  );

  experimentForm.reset();

  document.querySelector("#experimentModalTitle").textContent =
    experiment ? "Modifier experience" : "Nouvelle experience";

  const deleteExperimentBtn = document.querySelector("#deleteExperimentBtn");
  if (deleteExperimentBtn) {
    deleteExperimentBtn.style.display = experiment ? "inline-flex" : "none";
  }

  experimentFields.experimentId.value = experiment?.id || "";
  experimentFields.experimentTemplate.value = experiment?.templateId || FREE_PROTOCOL_ID;
  previousExperimentTemplateId = experimentFields.experimentTemplate.value;
  experimentFields.experimentName.value = experiment?.name || "";
  experimentFields.experimentClientCode.value = experiment?.clientCode || "";
  experimentFields.experimentConditions.value = experiment?.conditions || 1;
  experimentFields.experimentReplicates.value = experiment?.replicates || 1;
  experimentFields.experimentStatus.value = experiment?.status || "draft";
  experimentFields.experimentTemplateNotes.value = template?.notes || experiment?.templateNotes || "";
  experimentFields.experimentNotes.value = experiment?.notes || "";
  experimentFields.experimentTemplate.disabled = Boolean(experiment);

  const isRtQpcr = template?.mode === "rtqpcr";
  const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");
  const rtqpcrConfigData = experiment?.rtqpcrConfig || {};

  syncRtQpcrConfigVisibility(template);
  syncExperimentTemplateNotesVisibility(!template);

  if (isRtQpcr) {
    experimentFields.rtqpcrPartRT.checked = rtqpcrConfigData.parts?.rt ?? true;
    experimentFields.rtqpcrPartDilution.checked = rtqpcrConfigData.parts?.dilution ?? true;
    experimentFields.rtqpcrPartQPCR.checked = rtqpcrConfigData.parts?.qpcr ?? true;

    experimentFields.experimentConditions.value =
      rtqpcrConfigData.sampleConditions ?? experiment?.conditions ?? 1;
    experimentFields.experimentReplicates.value =
      rtqpcrConfigData.sampleReplicates ?? experiment?.replicates ?? 1;
    if (experimentFields.rtqpcrSampleConditions) {
      experimentFields.rtqpcrSampleConditions.value = experimentFields.experimentConditions.value;
    }
    if (experimentFields.rtqpcrSampleReplicates) {
      experimentFields.rtqpcrSampleReplicates.value = experimentFields.experimentReplicates.value;
    }
    if (experimentFields.rtqpcrQpcrConditions) {
      experimentFields.rtqpcrQpcrConditions.value =
        rtqpcrConfigData.qpcrConditions ?? rtqpcrConfigData.sampleConditions ?? experiment?.conditions ?? 1;
    }
    experimentFields.rtqpcrPrimerCount.value =
      rtqpcrConfigData.primerCount ?? template.sections.qpcr.defaults.primerCount;
    experimentFields.rtqpcrQpcrReplicates.value =
      rtqpcrConfigData.qpcrReplicates ?? template.sections.qpcr.defaults.qpcrReplicates;
    experimentFields.rtqpcrDeadVolumeConditions.value =
      rtqpcrConfigData.deadVolumeConditions ?? template.sections.qpcr.defaults.deadVolumeConditions;

    rtqpcrQPCRBlock?.classList.toggle("hidden", !experimentFields.rtqpcrPartQPCR.checked);
    experimentFields.experimentTotalConditions.value = getRtQpcrSampleTotal();
  }

  experimentItemsList.innerHTML = "";

  if (experiment) {
    const isFree=experiment.templateId===FREE_PROTOCOL_ID,restored=isFree?(experiment.items||[]):getMergedExperimentLines(experiment.items);
    restored.forEach(line => addExperimentItemRow(isFree?normalizeExperimentConsumedLine(line):line));
  } else if (template) {
    buildExperimentItemsFromTemplate();
  } else {
    activateFreeProtocol({clear:true});
  }

  updateExperimentTotalConditions();
  updateExperimentModalStock();
  experimentDialog.showModal();
}

function syncExperimentTemplateNotesVisibility(hidden) {
  document.querySelector("#experimentTemplateNotesField")?.classList.toggle("hidden", hidden);
  if(hidden) experimentFields.experimentTemplateNotes.value="";
}

function experimentDraftHasUserData() {
  return Boolean(experimentFields.experimentName.value.trim()||experimentFields.experimentClientCode.value.trim()||experimentFields.experimentNotes.value.trim()||experimentItemsList.children.length);
}

function activateFreeProtocol({clear=false}={}) {
  syncRtQpcrConfigVisibility(null);
  syncExperimentTemplateNotesVisibility(true);
  if(clear){experimentFields.experimentName.value="";experimentItemsList.innerHTML="";}
  updateExperimentTotalConditions();updateExperimentModalStock();
}

function syncRtQpcrConfigVisibility(template) {
  const currentTemplate =
    template ||
    protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);

  const isRtQpcr = currentTemplate?.mode === "rtqpcr";
  const rtqpcrConfigBox = document.querySelector("#rtqpcrConfig");
  const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");

  rtqpcrConfigBox?.classList.toggle("hidden", !isRtQpcr);
  rtqpcrQPCRBlock?.classList.toggle(
    "hidden",
    !isRtQpcr || !experimentFields.rtqpcrPartQPCR?.checked
  );
}

function setDefaultExperimentName(template, force = false) {
  if (!template || experimentFields.experimentId.value) return;
  if (!force && experimentFields.experimentName.value.trim()) return;

  const today = new Intl.DateTimeFormat("fr-FR").format(new Date());
  experimentFields.experimentName.value = `${template.name} - ${today}`;
}

function buildExperimentItemsFromTemplate() {
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  if (!template) return;

  syncRtQpcrConfigVisibility(template);

  setDefaultExperimentName(template);

  experimentFields.experimentTemplateNotes.value = template.notes || "";

  experimentItemsList.innerHTML = "";

  if (template.mode === "rtqpcr") {
    buildRtQpcrItemsFromTemplate(template);
    updateExperimentModalStock();
    return;
  }

  const total = updateExperimentTotalConditions();
  const templateLines = template.items.map(templateItem => ({
      ...templateItem,
      quantity: Number((templateItem.perConditionQuantity * total).toFixed(3))
    }));

  getMergedExperimentLines(templateLines).forEach(line => addExperimentItemRow(line));

  updateExperimentModalStock();
}

function normalizeExperimentConsumedLine(line={}) {
  if(line.type==="inventory"||line.type==="custom")return{...line,inventoryItemId:line.inventoryItemId||line.itemId||""};
  return line.itemId?{...line,type:"inventory",inventoryItemId:line.itemId}:{...line,type:"custom"};
}

function buildRtQpcrItemsFromTemplate(template) {
  syncRtQpcrSampleFields();

  const sampleTotal = getRtQpcrSampleTotal();
  const qpcrReactionBaseTotal = getRtQpcrReactionBaseTotal();
  const qpcrReactionTotal = getRtQpcrReactionTotalWithDeadVolume();
  const lines = [];

  if (experimentFields.rtqpcrPartRT?.checked) {
    template.sections.rt.items.forEach(item => {
      if (item.quantityMode === "rtWaterRange") {
        lines.push({
          isManual: true,
          manualLinkOnly: true,
          itemId: "",
          name: item.name,
          quantity: 0,
          quantityMin: item.minPerSample * sampleTotal,
          quantityMax: item.maxPerSample * sampleTotal,
          quantityDisplay: formatRange(
            item.minPerSample * sampleTotal,
            item.maxPerSample * sampleTotal,
            item.unit
          ),
          unit: item.unit,
          notes: item.notes,
          quantityEditable: false
        });
        return;
      }

      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number((item.perSample * sampleTotal).toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  if (experimentFields.rtqpcrPartDilution?.checked) {
    template.sections.dilution.items.forEach(item => {
      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number((item.perSample * sampleTotal).toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  if (experimentFields.rtqpcrPartQPCR?.checked) {
    template.sections.qpcr.items.forEach(item => {
      let total = 0;

      if (item.quantityMode === "qpcrSample") {
        total = item.perReaction * qpcrReactionBaseTotal;
      } else {
        total = item.perReaction * qpcrReactionTotal;
      }

      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number(total.toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  getMergedExperimentLines(lines).forEach(line => addExperimentItemRow(line));
}

function recalculateExperimentTemplateQuantities() {
  const template = protocolTemplates.find(
    entry => entry.id === experimentFields.experimentTemplate.value
  );
  if (!template) { updateExperimentTotalConditions(); updateExperimentModalStock(); return; }

  if (template.mode === "rtqpcr") {
    const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");
    rtqpcrQPCRBlock?.classList.toggle("hidden", !experimentFields.rtqpcrPartQPCR?.checked);

    syncRtQpcrSampleFields();
    experimentFields.experimentTotalConditions.value = getRtQpcrSampleTotal();
    buildExperimentItemsFromTemplate();
    return;
  }

  const total = updateExperimentTotalConditions();

  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const perCondition = Number(row.dataset.perCondition || 0);
    if (perCondition > 0) {
      row.querySelector(".experiment-item-quantity").value = Number(
        (perCondition * total).toFixed(3)
      );
    }
  });

  updateExperimentModalStock();
}

function updateExperimentTotalConditions() {
  const total = Math.max(1, Number(experimentFields.experimentConditions.value || 1)) * Math.max(1, Number(experimentFields.experimentReplicates.value || 1));
  experimentFields.experimentTotalConditions.value = total;
  return total;
}

function syncRtQpcrSampleFields() {
  if (experimentFields.rtqpcrSampleConditions) {
    experimentFields.rtqpcrSampleConditions.value = experimentFields.experimentConditions.value || 1;
  }

  if (experimentFields.rtqpcrSampleReplicates) {
    experimentFields.rtqpcrSampleReplicates.value = experimentFields.experimentReplicates.value || 1;
  }
}

//funciones para el protocolo qPCR
function isRtQpcrTemplate(templateId = experimentFields.experimentTemplate.value) {
  const template = protocolTemplates.find(entry => entry.id === templateId);
  return template?.mode === "rtqpcr";
}

function getRtQpcrSampleTotal() {
  const conditions = Math.max(1, Number(experimentFields.experimentConditions?.value || 1));
  const replicates = Math.max(1, Number(experimentFields.experimentReplicates?.value || 1));
  return conditions * replicates;
}

function getRtQpcrReactionBaseTotal() {
  const qpcrConditions = Math.max(1, Number(experimentFields.rtqpcrQpcrConditions?.value || experimentFields.experimentConditions?.value || 1));
  const primerCount = Math.max(1, Number(experimentFields.rtqpcrPrimerCount?.value || 1));
  const qpcrReplicates = Math.max(1, Number(experimentFields.rtqpcrQpcrReplicates?.value || 2));
  return qpcrConditions * primerCount * qpcrReplicates;
}

function getRtQpcrReactionTotalWithDeadVolume() {
  const base = getRtQpcrReactionBaseTotal();
  const deadVolumeConditions = Math.max(0, Number(experimentFields.rtqpcrDeadVolumeConditions?.value || 2));
  return base + deadVolumeConditions;
}

function formatRange(min, max, unit) {
  return `${Number(min.toFixed(3))} - ${Number(max.toFixed(3))} ${unit}`;
}

function getMergedExperimentLines(lines = []) {
  const merged = new Map();

  lines.forEach(line => {
    const unit = line.unit || "";
    const name = line.name || "";
    const itemKey = line.inventoryItemId || line.itemId || "";
    const key = `${normalizeSearch(name)}|${normalizeSearch(unit)}|${itemKey}`;
    const quantity = Number(line.quantity || 0);
    const quantityMin = line.quantityMin !== undefined
      ? Number(line.quantityMin || 0)
      : quantity;
    const quantityMax = line.quantityMax !== undefined
      ? Number(line.quantityMax || 0)
      : quantity;

    if (!key.trim()) {
      merged.set(`unique-${merged.size}`, { ...line });
      return;
    }

    if (!merged.has(key)) {
      const normalizedLine = {
        ...line,
        quantity: Number(quantityMax.toFixed(3)),
        quantityMin: Number(quantityMin.toFixed(3)),
        quantityMax: Number(quantityMax.toFixed(3))
      };

      normalizedLine.quantityDisplay = quantityMin !== quantityMax
        ? formatRange(quantityMin, quantityMax, unit)
        : line.quantityDisplay || "";

      merged.set(key, normalizedLine);
      return;
    }

    const existing = merged.get(key);
    const existingMin = Number(existing.quantityMin ?? existing.quantity ?? 0);
    const existingMax = Number(existing.quantityMax ?? existing.quantity ?? 0);
    const nextMin = Number((existingMin + quantityMin).toFixed(3));
    const nextMax = Number((existingMax + quantityMax).toFixed(3));
    const existingNotes = String(existing.notes || "");
    const nextNotes = String(line.notes || "");
    const notes = [existingNotes, nextNotes]
      .filter(Boolean)
      .filter((note, index, all) => all.indexOf(note) === index)
      .join(" + ");

    merged.set(key, {
      ...existing,
      quantity: nextMax,
      quantityMin: nextMin,
      quantityMax: nextMax,
      quantityDisplay: nextMin !== nextMax ? formatRange(nextMin, nextMax, unit) : "",
      notes,
      perConditionQuantity: Number((Number(existing.perConditionQuantity || 0) + Number(line.perConditionQuantity || 0)).toFixed(3))
    });
  });

  return Array.from(merged.values());
}


// items de experimentos no vinculados con items del inventarios por ahora
function addExperimentItemRow(line = {}, options = {}) {
  if(line.type==="inventory"||line.type==="custom"){addFreeExperimentItemRow(line);return;}
  const isManual =
    line.isManual === true ||
    line.manualLinkOnly === true ||
    !line.itemId;

  const explicitItem = line.itemId
    ? items.find(entry => entry.id === line.itemId)
    : null;

  const selectedItem = explicitItem || findInventoryItem(line);
  const quantityEditable = line.quantityEditable !== false;
  const quantityHint = line.quantityDisplay
    ? `<small class="experiment-quantity-hint">${escapeHtml(line.quantityDisplay)}</small>`
    : "";

  const protocolName = line.name || selectedItem?.name || "";
  const unitValue = line.unit || selectedItem?.unit || "";
  const showInventorySelect = options.showInventorySelect === true;

  const row = document.createElement("div");
  row.className = "experiment-item-row";
  row.dataset.rowMode = isManual ? "manual" : "template";
  row.dataset.perCondition = Number(line.perConditionQuantity ?? 0);
  row.dataset.protocolName = protocolName;
  row.dataset.quantityEditable = quantityEditable ? "true" : "false";
  row.dataset.manualLinkOnly = line.manualLinkOnly ? "true" : "false";
  row.dataset.itemId = line.itemId || selectedItem?.id || "";
  row.dataset.lineNotes = line.notes || "";
  row.dataset.quantityDisplay = line.quantityDisplay || "";
  row.dataset.quantityMin = line.quantityMin ?? "";
  row.dataset.quantityMax = line.quantityMax ?? "";

  if (showInventorySelect) {
    row.innerHTML = `
      <div class="experiment-item-linker">
        <div class="experiment-item-label">
          <strong>${escapeHtml(protocolName)}</strong>
        </div>

        <select class="experiment-item-select">
          <option value="">Choisir un item inventaire</option>
          ${items.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
        </select>
      </div>

      <div class="experiment-quantity-wrap">
        <input
          class="experiment-item-quantity"
          type="number"
          min="0"
          step="any"
          data-quantity-step="1"
          value="${escapeHtml(line.quantity ?? "")}"
          ${quantityEditable ? "" : "readonly"}
          required
        >
        ${quantityHint}
      </div>

      <input
        class="experiment-item-unit"
        value="${escapeHtml(unitValue)}"
        readonly
        required
      >

      <span class="experiment-stock-state"></span>

      <button class="ghost-btn compact-btn" type="button">Retirer</button>
    `;

    row.querySelector(".experiment-item-select").value = line.itemId || "";
  } else {
    row.innerHTML = `
      <div class="experiment-item-label">
        <strong>${escapeHtml(protocolName || "Produit")}</strong>
      </div>

      <input
        type="hidden"
        class="experiment-item-id"
        value="${escapeHtml(line.itemId || selectedItem?.id || "")}"
      >

      <div class="experiment-quantity-wrap">
        <input
          class="experiment-item-quantity"
          type="number"
          min="0"
          step="any"
          data-quantity-step="1"
          value="${escapeHtml(line.quantity ?? "")}"
          ${quantityEditable ? "" : "readonly"}
          required
        >
        ${quantityHint}
      </div>

      <input
        class="experiment-item-unit"
        value="${escapeHtml(unitValue)}"
        readonly
        required
      >

      <span class="experiment-stock-state"></span>

      <button class="ghost-btn compact-btn" type="button">Retirer</button>
    `;
  }

  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateExperimentModalStock();
  });

  experimentItemsList.append(row);
  updateExperimentModalStock();
}

function getExperimentItemUnits(item) {
  if(!item)return[];
  const equivalents=StockTracking.equivalentLevels(item,StockTracking.available(item));
  return equivalents.slice().reverse().map(level=>({key:level.key,singular:level.singular,plural:level.plural,value:level.value}));
}

function addFreeExperimentItemRow(line={}) {
  const type=line.type==="custom"?"custom":"inventory",row=document.createElement("div");row.className="experiment-item-row";row.dataset.lineType=type;
  if(type==="inventory"){
    const selectedId=line.inventoryItemId||line.itemId||"",selected=items.find(item=>item.id===selectedId),units=getExperimentItemUnits(selected),unit=line.unit||units[0]?.key||"";
    row.innerHTML=`<label class="experiment-item-field"><span>Item de l’inventaire</span><select class="experiment-item-select" aria-label="Item de l’inventaire"><option value="">Choisir un item de l’inventaire</option>${items.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}</select></label><label class="experiment-item-field"><span>Quantité</span><input class="experiment-item-quantity" inputmode="decimal" placeholder="Quantité" value="${escapeHtml(line.quantity??"")}"></label><label class="experiment-item-field"><span>Unité</span><select class="experiment-item-unit" aria-label="Unité">${renderExperimentUnitOptions(units,unit)}</select></label><span class="experiment-stock-state stock-neutral" role="status">À compléter</span><button class="ghost-btn compact-btn experiment-remove-line" type="button" aria-label="Retirer cet item de l’expérience">Retirer</button><p class="experiment-line-error hidden" role="alert"></p>`;
    row.querySelector(".experiment-item-select").value=selectedId;
    row.addEventListener("change",event=>{if(event.target.matches(".experiment-item-select"))hydrateFreeExperimentInventoryRow(row,event.target.value);updateExperimentModalStock()});row.addEventListener("input",updateExperimentModalStock);
  }else{
    row.innerHTML=`<label class="experiment-item-field"><span>Nom de l’item libre</span><input class="experiment-custom-name" placeholder="Nom de l’item" value="${escapeHtml(line.name||"")}"></label><label class="experiment-item-field"><span>Quantité</span><input class="experiment-item-quantity" inputmode="decimal" placeholder="Quantité" value="${escapeHtml(line.quantity??"")}"></label><label class="experiment-item-field"><span>Unité</span><input class="experiment-item-unit" placeholder="Unité" value="${escapeHtml(line.unit||"")}"></label><span class="experiment-stock-state stock-neutral" role="status">Item libre · Non connecté</span><button class="ghost-btn compact-btn experiment-remove-line" type="button" aria-label="Retirer cet item libre de l’expérience">Retirer</button><p class="experiment-line-error hidden" role="alert"></p>`;
  }
  row.querySelector(".experiment-remove-line").addEventListener("click",()=>{row.remove();updateExperimentModalStock()});experimentItemsList.append(row);updateExperimentModalStock();
}

function renderExperimentUnitOptions(units,selected="") {
  if(!units.length)return'<option value="">Sélectionnez d’abord un item</option>';
  return units.map(unit=>`<option value="${escapeHtml(unit.key)}"${unit.key===selected?" selected":""}>${escapeHtml(unit.plural||unit.singular)}</option>`).join("");
}

function hydrateFreeExperimentInventoryRow(row,itemId) {
  const item=items.find(entry=>entry.id===itemId),units=getExperimentItemUnits(item),select=row.querySelector(".experiment-item-unit");select.innerHTML=renderExperimentUnitOptions(units,units[0]?.key||"");
}

function parseExperimentQuantity(value) { return StockTracking.parseLocalizedNumber(value); }

function getExperimentInventoryAvailability(itemId,quantity,unitKey) {
  return getExperimentItemAvailability(items.find(entry=>entry.id===itemId),quantity,unitKey);
}

function getExperimentItemAvailability(item,quantity,unitKey) {
  if(!item||!unitKey||!Number.isFinite(quantity)||quantity<=0)return{kind:"neutral",label:"À compléter"};
  const equivalent=StockTracking.equivalentLevels(item,StockTracking.available(item)).find(level=>level.key===unitKey);if(!equivalent)return{kind:"warning",label:"Conversion impossible"};
  if(equivalent.value<=0)return{kind:"low",label:"Stock épuisé"};
  if(equivalent.value+1e-8>=quantity)return{kind:"ok",label:`Stock suffisant · ${StockTracking.format(equivalent.value)} ${StockTracking.plural(equivalent.value,equivalent.singular,equivalent.plural)} disponibles`};
  return{kind:"low",label:`Stock insuffisant · Il manque ${StockTracking.format(quantity-equivalent.value)} ${StockTracking.plural(quantity-equivalent.value,equivalent.singular,equivalent.plural)}`};
}

function hydrateExperimentItemRow(row, itemId) {
  if (!row) return;

  const item = items.find(entry => entry.id === itemId);
  row.dataset.itemId = item?.id || "";
  // l'unité du protocole reste la référence à comparer ; on ne l'écrase que si elle est vide
  const unitField = row.querySelector(".experiment-item-unit");
  if (!unitField.value.trim()) unitField.value = item?.unit || "";
  updateExperimentModalStock();
}

function updateExperimentModalStock() {
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    if(row.dataset.lineType==="custom"){const state=row.querySelector(".experiment-stock-state");state.className="experiment-stock-state stock-neutral";state.textContent="Item libre · Non connecté";return;}
    if(row.dataset.lineType==="inventory"){
      const availability=getExperimentInventoryAvailability(row.querySelector(".experiment-item-select").value,parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),row.querySelector(".experiment-item-unit").value),state=row.querySelector(".experiment-stock-state");state.className=`experiment-stock-state ${availability.kind==="ok"?"stock-ok":availability.kind==="low"?"stock-low":availability.kind==="warning"?"stock-warning":"stock-neutral"}`;state.textContent=availability.label;return;
    }
    const item = getExperimentRowItem(row);
    const needed = Number(row.querySelector(".experiment-item-quantity").value || 0);
    const unit = row.querySelector(".experiment-item-unit").value.trim();
    const state = row.querySelector(".experiment-stock-state");

    if (!item) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = "Manquant";
      return;
    }

    if (!unit) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = `${item.quantity} ${item.unit} - unité manquante`;
      return;
    }

    const availability = getExperimentLineAvailability(item, needed, unit);
    if (!availability.compatible) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = `${item.quantity} ${item.unit} - unité incompatible (attendu ${availability.referenceUnit.plural})`;
      return;
    }

    const lowStock = availability.kind !== "ok" || itemStatus(item) !== "ok";
    state.className = `experiment-stock-state ${lowStock ? "stock-low" : "stock-ok"}`;
    state.textContent = `${lowStock ? "Stock bas" : "Connecte"} · ${StockTracking.format(availability.availableInReferenceUnit)} ${availability.referenceUnit.plural}${availability.converted ? ` (converti depuis ${unit})` : ""}`;
  });
}

function getExperimentRows() {
  return [...experimentItemsList.querySelectorAll(".experiment-item-row")]
    .map(row => {
      if(row.dataset.lineType==="inventory")return{type:"inventory",inventoryItemId:row.querySelector(".experiment-item-select").value,quantity:parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),unit:row.querySelector(".experiment-item-unit").value};
      if(row.dataset.lineType==="custom")return{type:"custom",name:row.querySelector(".experiment-custom-name").value.trim(),quantity:parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),unit:row.querySelector(".experiment-item-unit").value.trim()};
      const item = getExperimentRowItem(row);
      const isManual = row.dataset.rowMode === "manual";

      return {
        isManual,
        itemId: item?.id || row.dataset.itemId || "",
        name: row.dataset.protocolName || item?.name || "",
        quantity: Number(row.querySelector(".experiment-item-quantity").value || 0),
        unit: row.querySelector(".experiment-item-unit").value.trim(),
        notes: row.dataset.lineNotes || "",
        perConditionQuantity: Number(row.dataset.perCondition || 0),
        quantityEditable: row.dataset.quantityEditable === "true",
        manualLinkOnly: row.dataset.manualLinkOnly === "true",
        quantityDisplay: row.dataset.quantityDisplay || "",
        quantityMin: row.dataset.quantityMin === "" ? undefined : Number(row.dataset.quantityMin),
        quantityMax: row.dataset.quantityMax === "" ? undefined : Number(row.dataset.quantityMax)
      };
    })
    .filter(line =>
      line.name ||
      line.itemId ||
      line.inventoryItemId ||
      line.quantity > 0 ||
      line.quantityDisplay
    );
}

function getExperimentRowItem(row) {
  if (!row) return null;

  const select = row.querySelector(".experiment-item-select");
  const hiddenId = row.querySelector(".experiment-item-id")?.value || row.dataset.itemId || "";
  const itemId = select?.value || hiddenId;

  return itemId
    ? items.find(entry => entry.id === itemId) || null
    : null;
}

function validateExperimentConsumedRows() {
  let valid=true;experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row=>{const error=row.querySelector(".experiment-line-error");if(!error)return;let message="";const quantity=parseExperimentQuantity(row.querySelector(".experiment-item-quantity")?.value);if(row.dataset.lineType==="inventory"){const id=row.querySelector(".experiment-item-select").value,item=items.find(entry=>entry.id===id),units=getExperimentItemUnits(item);if(!item)message="Sélectionnez un item de l’inventaire.";else if(!Number.isFinite(quantity)||quantity<=0)message="Saisissez une quantité strictement positive.";else if(!units.some(unit=>unit.key===row.querySelector(".experiment-item-unit").value))message="Sélectionnez une unité configurée pour cet item.";}else if(row.dataset.lineType==="custom"){if(!row.querySelector(".experiment-custom-name").value.trim())message="Saisissez le nom de l’item libre.";else if(!Number.isFinite(quantity)||quantity<=0)message="Saisissez une quantité strictement positive.";else if(!row.querySelector(".experiment-item-unit").value.trim())message="Saisissez l’unité de l’item libre.";}error.textContent=message;error.classList.toggle("hidden",!message);if(message)valid=false;});return valid;
}

function saveExperiment() {
  if (!experimentForm.reportValidity()) return;
  if (!validateExperimentConsumedRows()) return;

  if (
    isRtQpcrTemplate() &&
    !experimentFields.rtqpcrPartRT.checked &&
    !experimentFields.rtqpcrPartDilution.checked &&
    !experimentFields.rtqpcrPartQPCR.checked
  ) {
    window.alert("Merci de sélectionner au moins une partie : RT, dilution cDNA ou qPCR.");
    return;
  }

  const template = protocolTemplates.find(
    entry => entry.id === experimentFields.experimentTemplate.value
  );

  const id = experimentFields.experimentId.value || `exp-${Date.now()}`;

  const index = experiments.findIndex(entry => entry.id === id);
  const previousExperiment = index >= 0 ? experiments[index] : null;
  const experiment = serializeExperimentDraft(id, template, previousExperiment);

  if (index >= 0) {
    experiment.createdBy = experiments[index].createdBy || currentName;
    experiments[index] = experiment;
    addHistory("Experience modifiée", `${currentName} a modifié ${experiment.name}.`);
  } else {
    experiments.unshift(experiment);
    addHistory("Experience créée", `${currentName} a créé ${experiment.name} depuis ${experiment.templateName}.`);
  }

  persist();
  selectedExperimentId = id;
  experimentFields.experimentTemplate.disabled = false;
  experimentDialog.close();
  renderExperiments();
  renderHistory();
}

function serializeExperimentDraft(id,template=protocolTemplates.find(entry=>entry.id===experimentFields.experimentTemplate.value),previousExperiment=null) {
  const now = new Date().toISOString();
  const status = normalizeExperimentStatus(experimentFields.experimentStatus.value);
  const createdAt = previousExperiment?.createdAt || now;
  return {
    id,
    name: experimentFields.experimentName.value.trim(),
    clientCode: experimentFields.experimentClientCode.value.trim(),
    templateId: experimentFields.experimentTemplate.value,
    templateName: template?.name || "Nouveau protocole",

    conditions: Number(experimentFields.experimentConditions.value || 1),

    replicates: Number(experimentFields.experimentReplicates.value || 1),

    status,
    createdAt,
    statusChangedAt: previousExperiment && normalizeExperimentStatus(previousExperiment.status) === status
      ? (previousExperiment.statusChangedAt || (status === "draft" ? createdAt : null))
      : now,
    notes: normalizeMultilineText(experimentFields.experimentNotes.value),

    rtqpcrConfig: isRtQpcrTemplate()
      ? {
          parts: {
            rt: experimentFields.rtqpcrPartRT.checked,
            dilution: experimentFields.rtqpcrPartDilution.checked,
            qpcr: experimentFields.rtqpcrPartQPCR.checked
          },
          sampleConditions: Number(experimentFields.experimentConditions.value || 1),
          sampleReplicates: Number(experimentFields.experimentReplicates.value || 1),
          qpcrConditions: Number(experimentFields.rtqpcrQpcrConditions?.value || experimentFields.experimentConditions.value || 1),
          primerCount: Number(experimentFields.rtqpcrPrimerCount.value || 1),
          qpcrReplicates: Number(experimentFields.rtqpcrQpcrReplicates.value || 2),
          deadVolumeConditions: Number(experimentFields.rtqpcrDeadVolumeConditions.value || 2)
        }
      : null,

    createdBy: currentName,
    updatedAt: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date()),

    templateNotes: normalizeMultilineText(experimentFields.experimentTemplateNotes.value),
    items: experimentFields.experimentTemplate.value===FREE_PROTOCOL_ID?getExperimentRows():getMergedExperimentLines(getExperimentRows()),
    consumedItems: Array.isArray(previousExperiment?.consumedItems) ? previousExperiment.consumedItems : []
  };
}

function requestExperimentDeletion() {
  const id = experimentFields.experimentId.value;
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer l’expérience “${experiment.name}” ? Cette action est irréversible.`,
    onConfirm: () => deleteExperiment(id)
  });
}

function deleteExperiment(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) throw new Error("Cette expérience n’existe plus.");
  experiments = experiments.filter(entry => entry.id !== id);

  addHistory(
    "Experience supprimee",
    `${currentName} a supprime ${experiment.name}.`
  );

  if (selectedExperimentId === id) {
    selectedExperimentId = null;
  }

  experimentFields.experimentTemplate.disabled = false;
  experimentDialog.close();
  persist();
  renderExperiments();
  renderHistory();
}

// une expérience peut être consommée dès qu'au moins un item est connecté, dans une unité compatible,
// et pas déjà consommé pour cette expérience — un produit ne peut être consommé qu'une seule fois par expérience
function getExperimentConsumedItemIds(experiment) {
  return new Set((Array.isArray(experiment?.consumedItems) ? experiment.consumedItems : []).map(entry => entry.itemId));
}

function experimentHasConsumableItems(experiment) {
  const consumedIds = getExperimentConsumedItemIds(experiment);
  return getMergedExperimentLines(experiment.items).some(line => {
    if (line?.type === "custom") return false;
    const item = findInventoryItem(line);
    if (!item || consumedIds.has(item.id)) return false;
    return resolveExperimentLineUnitMatch(item, line.quantity, line.unit).compatible;
  });
}

// construit l'opération de stock native (simple ou containers) équivalente à la quantité déjà validée pour la ligne du protocole
function buildExperimentConsumeOperation(item, quantity, unit, comment) {
  const match = resolveExperimentLineUnitMatch(item, quantity, unit);
  if (!match.compatible) throw new Error(`Unité incompatible pour « ${item.name} ».`);
  const tracking = StockTracking.normalizeTracking(item);
  const quantityInTrackingUnit = StockTracking.fromBaseQuantity(match.neededInReferenceUnit, tracking);
  return {
    operationId: StockTracking.id("operation"),
    type: "consumed",
    entityType: tracking.mode === "containers" ? "containers_auto" : "item",
    quantity: quantityInTrackingUnit,
    comment
  };
}

function openConsumeExperimentDialog(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment || experiment.status === "completed") return;

  const consumedIds = getExperimentConsumedItemIds(experiment);
  const mergedLines = getMergedExperimentLines(experiment.items);
  const consumable = [];
  let skippedCount = 0;
  let alreadyConsumedCount = 0;

  mergedLines.forEach(line => {
    if (line.type === "custom") { skippedCount += 1; return; }
    const item = findInventoryItem(line);
    if (item && consumedIds.has(item.id)) { alreadyConsumedCount += 1; return; }
    const match = item ? resolveExperimentLineUnitMatch(item, line.quantity, line.unit) : null;
    if (!item || !match.compatible) { skippedCount += 1; return; }
    consumable.push({ item, line });
  });

  if (!consumable.length) {
    window.alert(alreadyConsumedCount
      ? "Tous les items compatibles de cette expérience ont déjà été consommés."
      : "Aucun item connecté et compatible à consommer pour cette expérience.");
    return;
  }

  document.querySelector("#consumeExperimentId").value = experiment.id;
  const errorBox = document.querySelector("#consumeExperimentError");
  errorBox.textContent = "";
  errorBox.classList.add("hidden");

  const skippedNote = document.querySelector("#consumeExperimentSkippedNote");
  const notes = [];
  if (alreadyConsumedCount) notes.push(`${alreadyConsumedCount} item${alreadyConsumedCount > 1 ? "s" : ""} déjà consommé${alreadyConsumedCount > 1 ? "s" : ""} pour cette expérience — non modifiable.`);
  if (skippedCount) notes.push(`${skippedCount} item${skippedCount > 1 ? "s" : ""} ignoré${skippedCount > 1 ? "s" : ""} (item libre, manquant ou unité incompatible).`);
  if (notes.length) {
    skippedNote.textContent = notes.join(" ");
    skippedNote.classList.remove("hidden");
  } else {
    skippedNote.classList.add("hidden");
  }

  document.querySelector("#consumeExperimentItems").innerHTML = consumable.map(({ item, line }) => {
    const displayName = line.name || item.name;
    return `
      <div class="consume-experiment-item" data-item-id="${escapeHtml(item.id)}" data-unit="${escapeHtml(line.unit || "")}" data-name="${escapeHtml(displayName)}">
        <div class="consume-experiment-item-info">
          <strong>${escapeHtml(displayName)}</strong>
          <span class="consume-experiment-item-state"></span>
        </div>
        <div class="consume-experiment-item-qty">
          <input type="number" min="0" step="any" class="consume-experiment-item-quantity" value="${Number(line.quantity || 0)}">
          <span class="consume-experiment-item-unit">${escapeHtml(line.unit || "")}</span>
        </div>
        <button class="ghost-btn compact-btn" type="button" data-remove-consume-item aria-label="Retirer ${escapeHtml(displayName)} de la consommation">Retirer</button>
      </div>
    `;
  }).join("");

  updateConsumeExperimentItemStates();
  consumeExperimentDialog.showModal();
}

function updateConsumeExperimentItemStates() {
  document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").forEach(row => {
    const item = items.find(entry => entry.id === row.dataset.itemId);
    const unit = row.dataset.unit;
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".consume-experiment-item-quantity").value);
    const state = row.querySelector(".consume-experiment-item-state");

    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      state.textContent = "Quantité invalide";
      state.className = "consume-experiment-item-state alert";
      return;
    }

    const availability = getExperimentLineAvailability(item, quantity, unit);
    if (!availability.compatible) {
      state.textContent = "Unité incompatible";
      state.className = "consume-experiment-item-state alert";
      return;
    }
    if (availability.kind !== "ok") {
      state.textContent = `Stock insuffisant · ${StockTracking.format(availability.availableInReferenceUnit)} ${availability.referenceUnit.plural} disponibles`;
      state.className = "consume-experiment-item-state alert";
      return;
    }

    state.textContent = "Stock suffisant";
    state.className = "consume-experiment-item-state ok";
  });
}

async function confirmConsumeExperiment() {
  const id = document.querySelector("#consumeExperimentId").value;
  const errorBox = document.querySelector("#consumeExperimentError");
  errorBox.textContent = "";
  errorBox.classList.add("hidden");

  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;

  const rows = [...document.querySelectorAll("#consumeExperimentItems .consume-experiment-item")];
  if (!rows.length) {
    errorBox.textContent = "Ajoutez au moins un item à consommer, ou fermez cette fenêtre.";
    errorBox.classList.remove("hidden");
    return;
  }

  // validation à froid de toutes les lignes avant de lancer la moindre opération réseau
  const plan = [];
  for (const row of rows) {
    const item = items.find(entry => entry.id === row.dataset.itemId);
    const unit = row.dataset.unit;
    const name = row.dataset.name;
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".consume-experiment-item-quantity").value);

    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      errorBox.textContent = `Quantité invalide pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }
    const availability = getExperimentLineAvailability(item, quantity, unit);
    if (!availability.compatible) {
      errorBox.textContent = `Unité incompatible pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }
    if (availability.kind !== "ok") {
      errorBox.textContent = `Stock insuffisant pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }

    plan.push({ itemId: item.id, unit, name, quantity });
  }

  const confirmBtn = document.querySelector("#confirmConsumeExperimentBtn");
  confirmBtn.disabled = true;

  try {
    for (const entry of plan) {
      const item = items.find(row => row.id === entry.itemId);
      if (!item) throw new Error(`« ${entry.name} » n’existe plus dans l’inventaire.`);

      const operation = buildExperimentConsumeOperation(item, entry.quantity, entry.unit, `Item consommé par expérience « ${experiment.name} »`);
      await executeAtomicStockOperation(item.id, operation);

      const liveExperiment = experiments.find(row => row.id === id);
      if (!liveExperiment) throw new Error("Cette expérience n’existe plus.");
      liveExperiment.consumedItems = Array.isArray(liveExperiment.consumedItems) ? liveExperiment.consumedItems : [];
      liveExperiment.consumedItems.push({
        itemId: entry.itemId,
        name: entry.name,
        quantity: entry.quantity,
        unit: entry.unit,
        consumedAt: new Date().toISOString(),
        consumedBy: currentName
      });
      addHistory("Item consommé", `${currentName} a consommé ${entry.name} pour l’expérience ${liveExperiment.name}.`);
      persist();

      document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").forEach(row => {
        if (row.dataset.itemId === entry.itemId) row.remove();
      });
    }
  } catch (error) {
    errorBox.textContent = error.message || String(error);
    errorBox.classList.remove("hidden");
    confirmBtn.disabled = false;
    render();
    return;
  }

  confirmBtn.disabled = false;
  render();
  if (!document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").length) {
    consumeExperimentDialog.close();
  }
}

function renderSaveProtocolTemplateItemRow(item) {
  return `
    <div class="save-protocol-template-item" data-item-id="${escapeHtml(item.itemId || "")}" data-name="${escapeHtml(item.name || "")}" data-unit="${escapeHtml(item.unit || "")}">
      <span class="save-protocol-template-item-name">${escapeHtml(item.name || "")}</span>
      <div class="save-protocol-template-item-qty">
        <input type="number" min="0" step="any" class="save-protocol-template-item-quantity" value="${Number(item.perConditionQuantity || 0)}">
        <span class="save-protocol-template-item-unit">${escapeHtml(item.unit || "")}</span>
      </div>
    </div>
  `;
}

// transforme une expérience "Nouveau protocole" en protocol template réutilisable : les quantités sont ramenées à 1 réplica
function openSaveProtocolTemplateDialog(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment || experiment.templateId !== FREE_PROTOCOL_ID) return;

  const lines = (experiment.items || []).filter(line => line?.type === "inventory" || line?.type === "custom");
  if (!lines.length) {
    window.alert("Ajoutez au moins un item à l'expérience avant d'enregistrer un protocole.");
    return;
  }

  const totalConditions = Math.max(1, Number(experiment.conditions || 1)) * Math.max(1, Number(experiment.replicates || 1));

  document.querySelector("#saveProtocolTemplateMode").value = "create";
  document.querySelector("#saveProtocolTemplateId").value = "";
  document.querySelector("#saveProtocolTemplateExperimentId").value = experiment.id;
  document.querySelector("#saveProtocolTemplateTitle").textContent = "Enregistrer le protocole";
  document.querySelector("#confirmSaveProtocolTemplateBtn").textContent = "Enregistrer le protocole";
  document.querySelector("#saveProtocolTemplateName").value = experiment.name || "";
  document.querySelector("#saveProtocolTemplateNotes").value = "";

  document.querySelector("#saveProtocolTemplateItems").innerHTML = lines.map(line => {
    const inventoryItem = line.type === "inventory" ? items.find(item => item.id === line.inventoryItemId) : null;
    const name = line.type === "inventory" ? (inventoryItem?.name || "Item introuvable") : line.name;
    const perReplica = Number((Number(line.quantity || 0) / totalConditions).toFixed(3));
    return renderSaveProtocolTemplateItemRow({
      itemId: line.type === "inventory" ? (line.inventoryItemId || "") : "",
      name,
      unit: line.unit || "",
      perConditionQuantity: perReplica
    });
  }).join("");

  saveProtocolTemplateDialog.showModal();
}

// ouvre le meme dialogue en mode edition pour un protocole personnalise deja enregistre
function openEditProtocolTemplateDialog(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) return;

  document.querySelector("#saveProtocolTemplateMode").value = "edit";
  document.querySelector("#saveProtocolTemplateId").value = template.id;
  document.querySelector("#saveProtocolTemplateExperimentId").value = "";
  document.querySelector("#saveProtocolTemplateTitle").textContent = "Modifier le protocole";
  document.querySelector("#confirmSaveProtocolTemplateBtn").textContent = "Enregistrer les modifications";
  document.querySelector("#saveProtocolTemplateName").value = template.name || "";
  document.querySelector("#saveProtocolTemplateNotes").value = template.notes || "";

  document.querySelector("#saveProtocolTemplateItems").innerHTML = (template.items || [])
    .map(renderSaveProtocolTemplateItemRow)
    .join("");

  saveProtocolTemplateDialog.showModal();
}

function confirmSaveProtocolTemplate() {
  if (!saveProtocolTemplateForm.reportValidity()) return;

  const name = document.querySelector("#saveProtocolTemplateName").value.trim();
  const notes = normalizeMultilineText(document.querySelector("#saveProtocolTemplateNotes").value);
  const templateItems = [...document.querySelectorAll("#saveProtocolTemplateItems .save-protocol-template-item")].map(row => {
    const itemId = row.dataset.itemId || "";
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".save-protocol-template-item-quantity").value);
    return {
      name: row.dataset.name,
      unit: row.dataset.unit,
      perConditionQuantity: Number.isFinite(quantity) ? quantity : 0,
      notes: "",
      quantityEditable: true,
      manualLinkOnly: !itemId,
      ...(itemId ? { itemId } : {})
    };
  });

  if (document.querySelector("#saveProtocolTemplateMode").value === "edit") {
    const template = customProtocolTemplates.find(entry => entry.id === document.querySelector("#saveProtocolTemplateId").value);
    if (!template) return;
    template.name = name;
    template.notes = notes;
    template.items = templateItems;
    template.updatedBy = currentName;
    template.updatedAt = new Date().toISOString();
    protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];

    addHistory("Protocole modifié", `${currentName} a modifié le protocole « ${template.name} ».`);
    persist();
    saveProtocolTemplateDialog.close();
    renderManageProtocolTemplates();
    renderHistory();
    return;
  }

  const experimentId = document.querySelector("#saveProtocolTemplateExperimentId").value;
  const experiment = experiments.find(entry => entry.id === experimentId);
  if (!experiment) return;

  const template = {
    id: `custom-tpl-${Date.now()}`,
    name,
    notes,
    source: "custom",
    createdBy: currentName,
    createdAt: new Date().toISOString(),
    items: templateItems
  };

  customProtocolTemplates.push(template);
  protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];

  addHistory("Protocole enregistré", `${currentName} a enregistré le protocole « ${template.name} » depuis ${experiment.name}.`);
  persist();
  saveProtocolTemplateDialog.close();
  renderHistory();
}

function openManageProtocolTemplatesDialog() {
  renderManageProtocolTemplates();
  manageProtocolTemplatesDialog.showModal();
}

function renderManageProtocolTemplates() {
  const list = document.querySelector("#manageProtocolTemplatesList");
  if (!list) return;
  if (!customProtocolTemplates.length) {
    list.innerHTML = `<p class="manage-protocol-templates-empty">Aucun protocole personnalisé enregistré pour le moment. Ouvrez une expérience "Nouveau protocole" et utilisez "Enregistrer le protocole".</p>`;
    return;
  }
  list.innerHTML = customProtocolTemplates.map(template => `
    <div class="manage-protocol-template-row">
      <div class="manage-protocol-template-info">
        <strong>${escapeHtml(template.name)}</strong>
        <span class="table-subtext">${template.items.length} item${template.items.length > 1 ? "s" : ""} · ajouté par ${escapeHtml(template.createdBy || "—")}</span>
      </div>
      <div class="manage-protocol-template-actions">
        <button class="ghost-btn compact-btn" type="button" onclick="openEditProtocolTemplateDialog('${escapeHtml(template.id)}')">Modifier</button>
        <button class="danger-btn compact-btn" type="button" onclick="requestProtocolTemplateDeletion('${escapeHtml(template.id)}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

function requestProtocolTemplateDeletion(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer le protocole "${template.name}" ? Cette action est irréversible.`,
    onConfirm: () => deleteProtocolTemplate(templateId)
  });
}

function deleteProtocolTemplate(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) throw new Error("Ce protocole n’existe plus.");

  customProtocolTemplates = customProtocolTemplates.filter(entry => entry.id !== templateId);
  protocolTemplates = [...builtInProtocolTemplates, ...customProtocolTemplates];

  addHistory("Protocole supprimé", `${currentName} a supprimé le protocole "${template.name}".`);
  persist();
  renderManageProtocolTemplates();
  renderHistory();
}

function openOrderModal() {
  orderForm.reset();
  orderFields.orderInventoryItem.value = "";
  orderFields.orderInventorySearch.value = "";
  orderFields.orderNewName.value = "";
  renderOrderItemOptions();
  document.querySelector("#clearOrderInventoryItem")?.classList.add("hidden");
  orderFields.orderItemMode.value = "existing";
  orderFields.orderPriority.value = "critique";
  toggleOrderModeFields();
  orderDialog.showModal();
}

function saveOrder() {
  if (orderFields.orderItemMode.value === "existing" && !orderFields.orderInventoryItem.value) {
    orderFields.orderInventorySearch.setCustomValidity("Veuillez sélectionner un item dans la liste.");
  } else {
    orderFields.orderInventorySearch.setCustomValidity("");
  }
  if (!orderForm.reportValidity()) return;

  const itemMode = orderFields.orderItemMode.value;

  let order;

  if (itemMode === "existing") {
    const item = items.find(entry => entry.id === orderFields.orderInventoryItem.value);
    if (!item) return;

    order = {
      id: `ord-${Date.now()}`,
      status: "requested",
      itemMode: "existing",
      inventoryItemId: item.id,
      inventoryUnit: item.unit,
      itemName: item.name,
      requestedQuantity: Number(orderFields.orderQuantity.value),
      receivedQuantity: 0,
      priority: orderFields.orderPriority.value,
      notes: normalizeMultilineText(orderFields.orderNotes.value),
      requestedBy: currentName,
      requestedAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      requestedAtRaw: new Date().toISOString(),
      orderedBy: "",
      orderedAt: "",
      orderedAtRaw: "",
      receivedBy: "",
      receivedAt: "",
      receivedAtRaw: "",
      newItemData: null
    };
  } else {
    const newItemName = orderFields.orderNewName.value.trim();
    if (!newItemName) return;

    order = {
      id: `ord-${Date.now()}`,
      status: "requested",
      itemMode: "new",
      inventoryItemId: null,
      itemName: newItemName,
      requestedQuantity: Number(orderFields.orderQuantity.value),
      receivedQuantity: 0,
      priority: orderFields.orderPriority.value,
      notes: normalizeMultilineText(orderFields.orderNotes.value),
      requestedBy: currentName,
      requestedAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      requestedAtRaw: new Date().toISOString(),
      orderedBy: "",
      orderedAt: "",
      orderedAtRaw: "",
      receivedBy: "",
      receivedAt: "",
      receivedAtRaw: "",
      newItemData: { name: newItemName }
    };
  }

  orders.unshift(order);
  addHistory("Demande créée", `${currentName} a créé une demande pour ${order.itemName}.`);
  persist();
  orderDialog.close();
  renderOrders();
  renderHistory();
}

function moveOrderToOrdered(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || normalizeOrderStatus(order.status) !== "requested") return;

  order.status = "ordered";
  order.orderedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  order.orderedAtRaw = new Date().toISOString();
  order.orderedBy = currentName;

  addHistory("Commande effectuée", `${currentName} a marqué ${order.itemName} comme commandé.`);
  persist();
  renderOrders();
  renderHistory();
}

function moveOrderToReceived(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "ordered") return;

  order.status = "received";
  order.receivedQuantity = getOrderRequestedNumericQuantity(order);
  order.receivedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  order.receivedAtRaw = new Date().toISOString();
  order.receivedBy = currentName;

  addHistory("Commande reçue", `${currentName} a marqué ${order.itemName} comme arrivé.`);
  persist();
  renderOrders();
  renderHistory();
}

function moveOrderBackToRequested(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "ordered") return;

  order.status = "requested";
  order.orderedAt = "";
  order.orderedAtRaw = "";
  order.orderedBy = "";

  addHistory("Commande rouverte", `${currentName} a renvoyé ${order.itemName} vers "À demander".`);
  persist();
  renderOrders();
  renderHistory();
}

function moveOrderBackToOrdered(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "received" || order.addedToInventory) return;

  order.status = "ordered";
  order.receivedQuantity = 0;
  order.receivedAt = "";
  order.receivedAtRaw = "";
  order.receivedBy = "";

  addHistory("Réception annulée", `${currentName} a renvoyé ${order.itemName} vers "Commandé".`);
  persist();
  renderOrders();
  renderHistory();
}

// Funcion para confirmar la cantidad recibida antes de agregarla al inventario, en lugar de asumir que es igual a la cantidad solicitada
function openReceiveInventoryDialog(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || normalizeOrderStatus(order.status) !== "received") return;
  if (order.addedToInventory) {
    window.alert("Cette réception a déjà été ajoutée à l’inventaire.");
    return;
  }

  if (!order.inventoryItemId && (order.itemMode === "new" || !order.newItemData)) {
    const quantity = Number(order.receivedQuantity) || getOrderRequestedNumericQuantity(order);
    pendingOrderInventoryLink = { orderId: order.id };
    openModal(null, {
      prefill: {
        name: order.itemName || order.newItemData?.name || "",
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : "",
        notes: order.notes || ""
      }
    });
    return;
  }

  const linkedItem = order.inventoryItemId
    ? items.find(entry => entry.id === order.inventoryItemId)
    : null;

  const unit = linkedItem?.unit || order.newItemData?.unit || "";
  const requestedQuantity = getOrderRequestedNumericQuantity(order);
  const alreadyAdded = Number(order.addedToInventoryQuantity || 0);
  const remainingQuantity = Math.max(0, Number((requestedQuantity - alreadyAdded).toFixed(6)));

  receiveInventoryFields.receiveOrderId.value = order.id;
  receiveInventoryFields.receiveInventoryItemName.textContent = order.itemName;
  receiveInventoryFields.receiveInventoryRequestedText.textContent = `Quantité demandée : ${requestedQuantity} ${unit} · Déjà ajoutée : ${alreadyAdded} ${unit}`.trim();
  receiveInventoryFields.receiveQuantity.value = remainingQuantity;
  receiveInventoryFields.receiveUnit.value = unit;
  delete receiveInventoryForm.dataset.operationId;

  receiveInventoryDialog.showModal();
}

function linkCreatedItemToOrder(orderId, item) {
  const order = orders.find(entry => entry.id === orderId);
  if (!order || !item) return;

  order.inventoryItemId = item.id;
  order.addedToInventory = true;
  order.addedToInventoryQuantity = Number(item.quantity || 0);
  order.addedToInventoryAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());
  order.addedToInventoryAtRaw = new Date().toISOString();

  addHistory(
    "Ajout à l'inventaire",
    `${currentName} a créé ${item.name} depuis la demande de commande ${order.itemName}.`
  );
}

// idem que la anterior
async function confirmReceiveInventory() {
  if (!receiveInventoryForm.reportValidity()) return;

  const id = receiveInventoryFields.receiveOrderId.value;
  const order = orders.find(entry => entry.id === id);
  if (!order || normalizeOrderStatus(order.status) !== "received") return;
  if (order.addedToInventory) {
    receiveInventoryDialog.close();
    window.alert("Cette réception a déjà été ajoutée à l’inventaire.");
    return;
  }

  const confirmedQuantity = StockTracking.parseLocalizedNumber(receiveInventoryFields.receiveQuantity.value);
  const unit = receiveInventoryFields.receiveUnit.value || "";

  if (!Number.isFinite(confirmedQuantity) || confirmedQuantity < 0) {
    window.alert("Merci d'entrer une quantité valide.");
    return;
  }

  const finalQuantity = Number(confirmedQuantity.toFixed(3));

  if (order.inventoryItemId) {
    const button = document.querySelector("#confirmReceiveInventoryBtn");
    const operationId = receiveInventoryForm.dataset.operationId
      || `order-receipt-${order.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    receiveInventoryForm.dataset.operationId = operationId;
    button.disabled = true;
    try {
      await executeAtomicOrderInventoryReceipt({
        orderId: order.id,
        operationId,
        quantity: finalQuantity,
        unit
      });
      receiveInventoryDialog.close();
      delete receiveInventoryForm.dataset.operationId;
    } catch (error) {
      window.alert(error.message || String(error));
    } finally {
      button.disabled = false;
    }
    return;
  } else if (order.newItemData) {
    const createdItem = createStoredItem({
      ...order.newItemData,
      quantity: finalQuantity,
      locations: order.newItemData.locations || (
        order.newItemData.location ? [order.newItemData.location] : []
      )
    });

    order.inventoryItemId = createdItem.id;
  } else {
    window.alert("Impossible d'ajouter cette commande à l'inventaire.");
    return;
  }

  order.receivedQuantity = finalQuantity;
  order.addedToInventory = true;
  order.addedToInventoryQuantity = finalQuantity;
  order.addedToInventoryAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());
  order.addedToInventoryAtRaw = new Date().toISOString();

  addHistory(
    "Ajout à l'inventaire",
    `${currentName} a ajouté ${finalQuantity} ${unit} de ${order.itemName} à l'inventaire.`
  );

  receiveInventoryDialog.close();
  persist();
  render();
}

async function executeAtomicOrderInventoryReceipt(request) {
  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.path || !config?.token) {
    throw new Error("La sauvegarde partagée GitHub en écriture est requise pour ajouter cette réception au stock.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    let mutation = null;
    const result = await storage.mutateSharedData(request.operationId, latest => {
      mutation = window.ExadexOrderInventory.applyReceipt(latest, {
        ...request,
        user: { name: currentName, emoji: userIcons[currentName] || "" }
      }, { stockTracking: window.StockTracking });
      return mutation.state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data,result.sha);
    return { duplicate: Boolean(result.duplicate || mutation?.duplicate), data: result.data };
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

function openOrdersHistory() {
  selectedOrderId = null;
  ordersMode = "history";
  orderHistoryPage = 1;
  renderOrders();
}

function getOrderRequestedNumericQuantity(order) {
  const raw = order?.requestedQuantity ?? order?.quantity ?? 0;
  const direct = Number(raw);
  if (Number.isFinite(direct)) return direct;
  const match = String(raw).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function closeOrdersHistory() {
  ordersMode = "board";
  renderOrders();
}

function formatOrderHistoryDate(value) {
  return value ? escapeHtml(value) : "—";
}

function formatOrderHistoryDateOnly(value) {
  if (!value) return "—";
  const parsed = parseHistoryDate(value);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return escapeHtml(new Intl.DateTimeFormat("fr-FR").format(parsed));
  }
  return escapeHtml(String(value).replace(/\s+\d{1,2}:\d{2}(?::\d{2})?$/, ""));
}

function getOrderUnit(order) {
  const linkedItem = order.inventoryItemId
    ? items.find(entry => entry.id === order.inventoryItemId)
    : null;

  return linkedItem?.unit || order.newItemData?.unit || "";
}

function formatOrderHistoryQuantity(order) {
  const unit = getOrderUnit(order);

  if (order.addedToInventoryQuantity !== undefined && order.addedToInventoryQuantity !== null && order.addedToInventoryQuantity !== "") {
    return `Quantité ajoutée à l'inventaire : ${order.addedToInventoryQuantity} ${unit}`.trim();
  }

  return `Quantité demandée : ${order.requestedQuantity ?? "—"} ${unit}`.trim();
}

function renderOrdersHistoryLegacy() {
  const orderDetail = document.querySelector("#orderDetail");
  const requestedList = document.querySelector("#requestedOrderList");
  const orderedList = document.querySelector("#orderedOrderList");
  const receivedList = document.querySelector("#receivedOrderList");
  const ordersSections = document.querySelector("#ordersSections");

  const requestedSection = requestedList?.closest(".order-section") || requestedList?.parentElement;
  const orderedSection = orderedList?.closest(".order-section") || orderedList?.parentElement;
  const receivedSection = receivedList?.closest(".order-section") || receivedList?.parentElement;

  if (!orderDetail || !requestedList || !orderedList || !receivedList) return;

  if (ordersSections) {
    ordersSections.classList.add("hidden");
  }

  [requestedSection, orderedSection, receivedSection].forEach((section) => {
    if (section) section.classList.add("hidden");
  });

  requestedList.innerHTML = "";
  orderedList.innerHTML = "";
  receivedList.innerHTML = "";

  const historyOrders = [...orders]
    .filter(order => order.status === "ordered" || order.status === "received")
    .sort((a, b) => {
      const aTime = new Date(a.receivedAtRaw || a.orderedAtRaw || 0).getTime();
      const bTime = new Date(b.receivedAtRaw || b.orderedAtRaw || 0).getTime();
      return bTime - aTime;
    });

  orderDetail.innerHTML = `
    <section class="inventory-detail-panel order-history-detail">
      <div class="order-history-topbar">
        <button
          class="room-exit-btn"
          type="button"
          onclick="closeOrdersHistory()"
          aria-label="Retour"
          title="Retour"
        >
          ↩️
        </button>
      </div>

      <div class="order-history-header">
        <h3>Historique des commandes</h3>
      </div>

      ${
        historyOrders.length
          ? `
            <div class="order-history-table">
              <div class="order-history-table-head">
                <div>Produit</div>
                <div>Demandé le</div>
                <div>Commandé le</div>
                <div>Arrivé le</div>
              </div>

              ${historyOrders.map(order => `
                <div class="order-history-table-row">
                  <div class="order-history-product">
                    <strong>${escapeHtml(order.itemName)}</strong>
                    <span>${escapeHtml(formatOrderHistoryQuantity(order))}</span>
                  </div>
                  <div>${formatOrderHistoryDate(order.requestedAt || order.createdAt)}</div>
                  <div>${formatOrderHistoryDate(order.orderedAt)}</div>
                  <div>${formatOrderHistoryDate(order.receivedAt)}</div>
                </div>
              `).join("")}
            </div>
          `
          : `<div class="empty-room">Aucune commande passée.</div>`
      }
    </section>
  `;
}

function renderOrdersHistory() {
  const container = document.querySelector("#orderDetail");
  if (!container) return;
  const source = [...orders].filter(order => ["ordered", "received", "archived"].includes(normalizeOrderStatus(order.status)));
  const hasArchived = source.some(order => normalizeOrderStatus(order.status) === "archived");
  const requesters = Array.from(new Set(source.map(order => order.requestedBy).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  const filtered = source.filter(orderMatchesHistoryFilters).sort(compareOrderHistoryEntries);
  const pageCount = Math.max(1, Math.ceil(filtered.length / orderHistoryPageSize));
  orderHistoryPage = Math.min(Math.max(orderHistoryPage, 1), pageCount);
  const start = (orderHistoryPage - 1) * orderHistoryPageSize;
  const pageEntries = filtered.slice(start, start + orderHistoryPageSize);
  const received = filtered.filter(order => normalizeOrderStatus(order.status) === "received").length;
  const requesterCount = new Set(filtered.map(order => order.requestedBy).filter(Boolean)).size;

  container.innerHTML = `
    <section class="order-history-view">
      <div class="inventory-detail-return-row">
        <button class="ghost-btn inventory-back-btn" type="button" onclick="closeOrdersHistory()" aria-label="Retour aux demandes"><span aria-hidden="true">←</span> Retour</button>
      </div>
      <header class="client-studies-header order-history-page-header">
        <div><p class="eyebrow">ACHATS ET APPROVISIONNEMENT</p><div class="client-studies-title-row"><h3>Historique des commandes</h3></div><p class="order-history-subtitle">Consultez les commandes terminées et les réceptions enregistrées.</p></div>
      </header>

      <section class="client-study-controls order-history-controls" aria-label="Filtres de l’historique des commandes">
        <label class="client-study-search order-control-field"><span>Rechercher</span><input type="search" value="${escapeHtml(orderHistorySearch)}" placeholder="Produit, demandeur ou référence…" oninput="setOrderHistoryFilter('search', this.value)"><strong class="client-study-result-count">${formatOrderHistoryCount(filtered.length)}</strong></label>
        <label class="order-control-field"><span>Statut</span><select class="select" onchange="setOrderHistoryFilter('status', this.value)">${renderOrderHistoryOptions([["all","Tous les statuts"],["ordered","Commandées"],["received","Arrivées"], ...(hasArchived ? [["archived","Annulées"]] : [])], orderHistoryStatus)}</select><span></span></label>
        <label class="order-control-field"><span>Demandeur</span><select class="select" onchange="setOrderHistoryFilter('requester', this.value)">${renderOrderHistoryOptions([["all","Tous les demandeurs"], ...requesters.map(name => [name, name])], orderHistoryRequester)}</select><span></span></label>
        <label class="order-control-field"><span>Période</span><select class="select" onchange="setOrderHistoryFilter('period', this.value)">${renderOrderHistoryOptions([["all","Toute la période"],["30","30 derniers jours"],["90","3 derniers mois"],["year","Cette année"]], orderHistoryPeriod)}</select><span></span></label>
        <label class="order-control-field"><span>Tri</span><select class="select" onchange="setOrderHistoryFilter('sort', this.value)">${renderOrderHistoryOptions([["newest","Plus récentes"],["oldest","Plus anciennes"],["name","Nom A–Z"]], orderHistorySort)}</select><span></span></label>
      </section>

      <div class="client-study-kpis order-history-kpis">
        ${renderOrderHistoryMetric("ordered", "Commandes enregistrées", filtered.length)}
        ${renderOrderHistoryMetric("received", "Réceptions terminées", received)}
        ${renderOrderHistoryMetric("requested", "Demandeurs", requesterCount)}
      </div>

      <section class="order-history-panel">
        ${pageEntries.length ? renderOrderHistoryTable(pageEntries) : `<div class="order-history-empty"><strong>Aucune commande passée</strong><p>Les commandes et réceptions terminées apparaîtront ici.</p></div>`}
        ${renderOrderHistoryPagination(filtered.length, start, pageEntries.length)}
      </section>
    </section>`;
}

function renderOrderHistoryOptions(options, selected) {
  return options.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function formatOrderHistoryCount(count) { return `${count} ${count === 1 ? "commande" : "commandes"}`; }

function setOrderHistoryFilter(key, value) {
  if (key === "search") orderHistorySearch = value;
  if (key === "status") orderHistoryStatus = value;
  if (key === "requester") orderHistoryRequester = value;
  if (key === "period") orderHistoryPeriod = value;
  if (key === "sort") orderHistorySort = value;
  orderHistoryPage = 1;
  renderOrdersHistory();
  if (key === "search") {
    const input = document.querySelector(".order-history-controls input[type='search']");
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }
}

function orderMatchesHistoryFilters(order) {
  const query = normalizeSearch(orderHistorySearch);
  const status = normalizeOrderStatus(order.status);
  const reference = normalizeReferences((items.find(item => item.id === order.inventoryItemId) || {}).references).primary.reference;
  const haystack = normalizeSearch([order.itemName, order.requestedBy, order.orderedBy, order.receivedBy, reference, order.notes, orderStatusLabel(status)].join(" "));
  if (query && !haystack.includes(query)) return false;
  if (orderHistoryStatus !== "all" && status !== orderHistoryStatus) return false;
  if (orderHistoryRequester !== "all" && order.requestedBy !== orderHistoryRequester) return false;
  if (orderHistoryPeriod === "all") return true;
  const date = getOrderHistoryDate(order);
  if (!date) return false;
  if (orderHistoryPeriod === "year") return date.getFullYear() === new Date().getFullYear();
  const days = Number(orderHistoryPeriod);
  return Date.now() - date.getTime() <= days * 86400000;
}

function getOrderHistoryDate(order) {
  const raw = order.receivedAtRaw || order.orderedAtRaw || order.requestedAtRaw || order.receivedAt || order.orderedAt || order.requestedAt;
  const parsed = parseHistoryDate(raw);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function compareOrderHistoryEntries(a, b) {
  if (orderHistorySort === "name") return String(a.itemName || "").localeCompare(String(b.itemName || ""), "fr", { sensitivity: "base" });
  const aTime = getOrderHistoryDate(a)?.getTime() || 0;
  const bTime = getOrderHistoryDate(b)?.getTime() || 0;
  return orderHistorySort === "oldest" ? aTime - bTime : bTime - aTime;
}

function renderOrderHistoryMetric(type, label, value) {
  return `<article class="client-kpi-card order-kpi-card ${type}"><span class="client-kpi-icon" aria-hidden="true">${renderOrderBoardIcon(type)}</span><div><span>${escapeHtml(label)}</span><strong>${value}</strong></div></article>`;
}

function renderOrderHistoryTable(entries) {
  return `<div class="order-history-table"><div class="order-history-table-head"><div>Produit</div><div>Quantité</div><div>Demandeur</div><div>Commandée</div><div>Arrivée</div><div>Statut</div><div>Action</div></div>${entries.map(order => {
    const status = normalizeOrderStatus(order.status);
    const avatar = getHistoryUserAvatar(order.requestedBy);
    return `<div class="order-history-table-row"><div class="order-history-product"><strong>${escapeHtml(order.itemName)}</strong></div><div>${escapeHtml(formatOrderBoardQuantity(order.receivedQuantity || order.requestedQuantity, getOrderUnit(order), ""))}</div><div class="order-history-requester"><span class="history-user-avatar ${avatar.type}" aria-hidden="true">${escapeHtml(avatar.value)}</span>${escapeHtml(order.requestedBy || "—")}</div><div>${formatOrderHistoryDateOnly(order.orderedAt)}</div><div>${formatOrderHistoryDateOnly(order.receivedAt)}</div><div><span class="order-history-status ${status}">${escapeHtml(orderStatusLabel(status))}</span></div><div><button class="ghost-btn compact-btn" type="button" onclick="openOrderFromHistory('${escapeHtml(order.id)}')">Ouvrir</button></div></div>`;
  }).join("")}</div>`;
}

function renderOrderHistoryPagination(total, start, shown) {
  const first = total ? start + 1 : 0;
  const last = total ? start + shown : 0;
  return `<div class="order-history-pagination"><span>${first}–${last} sur ${total}</span><label><span class="sr-only">Commandes par page</span><select class="select" onchange="setOrderHistoryPageSize(this.value)">${[25,50,75,100].map(size => `<option value="${size}" ${size === orderHistoryPageSize ? "selected" : ""}>${size}</option>`).join("")}</select></label><button class="ghost-btn compact-btn" type="button" onclick="changeOrderHistoryPage(-1)" ${orderHistoryPage <= 1 ? "disabled" : ""}>Précédent</button><button class="primary-btn compact-btn" type="button" onclick="changeOrderHistoryPage(1)" ${last >= total ? "disabled" : ""}>Suivant</button></div>`;
}

function setOrderHistoryPageSize(value) { orderHistoryPageSize = Number(value) || 50; orderHistoryPage = 1; renderOrdersHistory(); }
function changeOrderHistoryPage(delta) { orderHistoryPage += delta; renderOrdersHistory(); }
function openOrderFromHistory(id) { ordersMode = "board"; selectedOrderId = id; renderOrders(); }

function markOrderDone(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;

  const status = normalizeOrderStatus(order.status);
  const elementLabel = status === "received"
    ? "l’arrivée"
    : status === "ordered"
      ? "la commande"
      : "la demande";
  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer ${elementLabel} “${order.itemName}” ? Cette action est irréversible.`,
    onConfirm: () => deleteOrder(id)
  });
}

function deleteOrder(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) throw new Error("Cette demande de commande n’existe plus.");
  orders = orders.filter(entry => entry.id !== id);

  addHistory(
    "Demande supprimée",
    `${currentName} a supprimé la demande pour ${order.itemName}.`
  );

  persist();
  renderOrders();
  renderHistory();
}

function normalizeCompanyName(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function migrateSupplierContacts(list, options = {}) {
  const source=Array.isArray(list)?list:[],seenIds=new Set(),seenNames=new Set(),normalized=[];
  source.forEach((contact,index)=>{
    const company=String(contact?.company||contact?.society||"").trim();if(!company)return;
    let id=String(contact.id||"").trim()||`contact-${Date.now()}-${index}`;while(seenIds.has(id))id=`${id}-${index+1}`;
    const key=normalizeCompanyName(company);if(seenNames.has(key))return;seenIds.add(id);seenNames.add(key);
    const coordinates=(Array.isArray(contact.coordinates)?contact.coordinates:[]).map((row,rowIndex)=>({id:String(row?.id||`coordinate-${rowIndex}`),label:String(row?.label||"").trim(),type:["email","phone","other"].includes(row?.type)?row.type:"other",value:normalizeMultilineText(row?.value||"")})).filter(row=>row.value);
    normalized.push({id,company,salesRepresentative:String(contact.salesRepresentative||"").trim(),afterSalesService:String(contact.afterSalesService||"").trim(),customerService:String(contact.customerService||"").trim(),salesAndQuotes:String(contact.salesAndQuotes||"").trim(),phone:String(contact.phone||"").trim(),notes:normalizeMultilineText(contact.notes||""),aliases:[...new Set((Array.isArray(contact.aliases)?contact.aliases:[]).map(value=>String(value).trim()).filter(Boolean))],coordinates});
  });
  if(options.includeDefaults)INITIAL_SUPPLIER_CONTACTS.forEach(seed=>{if(!seenNames.has(normalizeCompanyName(seed.company))){normalized.push({...seed,aliases:[...seed.aliases]});seenNames.add(normalizeCompanyName(seed.company));}});
  return normalized.sort((a,b)=>a.company.localeCompare(b.company,"fr",{sensitivity:"base"}));
}

function contactNames(contact){return[contact.company,...(contact.aliases||[])].map(normalizeCompanyName).filter(Boolean);}
function exactSupplierContacts(value,contacts=supplierContacts){return contacts.filter(contact=>contact.company===String(value??""));}
function resolveExactSupplierContact(value,preferredId="",contacts=supplierContacts){
  const matches=exactSupplierContacts(value,contacts);
  if(matches.length!==1)return null;
  if(preferredId&&matches[0].id!==preferredId)return null;
  return matches[0];
}
function syncPrimarySupplierContact(){
  if(!fields.primarySupplier||!fields.primarySupplierContactId)return null;
  const value=fields.primarySupplier.value,currentId=fields.primarySupplierContactId.value,current=supplierContacts.find(contact=>contact.id===currentId);
  if(current?.company===value)return current;
  const exact=resolveExactSupplierContact(value);
  fields.primarySupplierContactId.value=exact?.id||"";
  return exact;
}
function getItemSupplier(item){return String(item?.references?.primary?.supplier||item?.supplier||item?.fournisseur||"").trim();}
function findSupplierContactForItem(item){
  if(item?.supplierContactId){const explicit=supplierContacts.find(contact=>contact.id===item.supplierContactId);if(explicit)return explicit;}
  const supplierKey=normalizeCompanyName(getItemSupplier(item));if(!supplierKey)return null;
  return supplierContacts.find(contact=>contactNames(contact).includes(supplierKey))||null;
}
function getContactItems(contact){return items.filter(item=>item.supplierContactId===contact.id||contactNames(contact).includes(normalizeCompanyName(getItemSupplier(item))));}
function contactPrimaryAddress(contact){return contact.customerService||contact.salesAndQuotes||contact.afterSalesService||(contact.coordinates||[]).find(row=>row.type==="email")?.value||"";}
function contactEmails(value){return String(value||"").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[];}
function contactPhones(value){
  const matches=String(value||"").match(/(?:\+?\d[\d\s().-]{6,}\d)/g)||[];
  return matches.map(value=>value.trim()).filter(value=>value.replace(/\D/g,"").length>=7);
}
function isValidContactEmail(value){return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(String(value||"").trim());}
function contactAllValues(contact){
  return [
    {label:"Commercial",value:contact.salesRepresentative,type:"other"},
    {label:"Commercial / devis",value:contact.salesAndQuotes,type:"other"},
    {label:"Service client",value:contact.customerService,type:"other"},
    {label:"SAV",value:contact.afterSalesService,type:"other"},
    {label:"Téléphone",value:contact.phone,type:"phone"},
    ...(contact.coordinates||[]).map(row=>({label:row.label||({email:"E-mail",phone:"Téléphone",other:"Autre coordonnée"}[row.type]),value:row.value,type:row.type}))
  ].filter(row=>String(row.value||"").trim());
}
function contactCountLabel(count){return count===0?"Aucun produit associé":count===1?"1 produit associé":`${count} produits associés`;}
function contactInitial(value){
  return String(value||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").charAt(0).toUpperCase();
}
function renderContactValue(value,type="other"){
  const text=String(value||""),emails=contactEmails(text),phones=contactPhones(text);
  if(type==="email"&&isValidContactEmail(text))return`<a href="mailto:${escapeHtml(text)}">${escapeHtml(text)}</a>`;
  if(type==="phone"&&phones.length===1&&phones[0]===text.trim())return escapeHtml(text);
  let html=escapeHtml(text);
  emails.filter(isValidContactEmail).forEach(email=>{html=html.replace(escapeHtml(email),`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`)});
  return html;
}
function contactValueRow(label,value,type="other"){
  if(!String(value||"").trim())return"";
  const emails=contactEmails(value).filter(isValidContactEmail),phones=contactPhones(value),directEmail=type==="email"&&isValidContactEmail(value),directPhone=type==="phone"&&phones.length;
  if(emails.length>1){
    const remainder=String(value).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"").replace(/[\s,;|/]+/g,"").trim();
    return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-multiple-values">${remainder?`<p class="multiline-text">${renderContactValue(value,type)}</p>`:""}${emails.map(email=>`<div><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><span class="contact-inline-actions"><a class="contact-icon-action" href="mailto:${escapeHtml(email)}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail à ${escapeHtml(email)}">✉</a><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(email)}" title="Copier" aria-label="Copier ${escapeHtml(email)}">⧉</button></span></div>`).join("")}</div></div>`;
  }
  if(phones.length>1&&!emails.length){
    const remainder=phones.reduce((text,phone)=>text.replace(phone,""),String(value)).replace(/[\s,;|/]+/g,"").trim();
    return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-multiple-values">${remainder?`<p class="multiline-text">${renderContactValue(value,type)}</p>`:""}${phones.map(phone=>`<div><span>${escapeHtml(phone)}</span><span class="contact-inline-actions"><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(phone)}" title="Copier le numéro" aria-label="Copier ${escapeHtml(phone)}">⧉</button></span></div>`).join("")}</div></div>`;
  }
  return`<div class="contact-detail-row"><span>${escapeHtml(label)}</span><div class="contact-value-content"><strong>${renderContactValue(value,type)}</strong><span class="contact-inline-actions">${(directEmail||emails.length)?`<a class="contact-icon-action" href="mailto:${escapeHtml(directEmail?value:emails[0])}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail">✉</a>`:""}<button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(value)}" title="${directPhone||phones.length?"Copier le numéro":"Copier"}" aria-label="${directPhone||phones.length?"Copier ce numéro":"Copier cette coordonnée"}">⧉</button></span></div></div>`;
}
function renderContactCoordinateCard(row,index){
  const value=String(row.value||"").trim(),emails=[...new Set(contactEmails(value).filter(isValidContactEmail))],phones=[...new Set(contactPhones(value))];
  let remainder=value;emails.forEach(email=>remainder=remainder.replace(email,""));phones.forEach(phone=>remainder=remainder.replace(phone,""));remainder=remainder.replace(/^[\s,;|/·:–—-]+|[\s,;|/·:–—-]+$/g,"").trim();
  const normalizedLabel=normalizeCompanyName(row.label),icon=normalizedLabel==="commercial"?"👤":normalizedLabel.includes("service client")||normalizedLabel.includes("sav")?"🎧":normalizedLabel.includes("commercial devis")||row.type==="email"?"✉":row.type==="phone"?"☎":"@";
  const values=[
    ...(remainder?[`<div class="contact-coordinate-free-text multiline-text">${escapeHtml(remainder)}</div>`]:[]),
    ...emails.map(email=>`<div class="contact-coordinate-line"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><span class="contact-inline-actions"><a class="contact-icon-action" href="mailto:${escapeHtml(email)}" title="Envoyer un e-mail" aria-label="Envoyer un e-mail à ${escapeHtml(email)}">✉</a><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(email)}" title="Copier" aria-label="Copier ${escapeHtml(email)}">⧉</button></span></div>`),
    ...phones.map(phone=>`<div class="contact-coordinate-line"><span class="contact-phone-text">${escapeHtml(phone)}</span><span class="contact-inline-actions"><button class="contact-icon-action" type="button" data-copy-contact="${escapeHtml(phone)}" title="Copier le numéro" aria-label="Copier ${escapeHtml(phone)}">⧉</button></span></div>`)
  ];
  if(!values.length)values.push(`<div class="contact-coordinate-free-text multiline-text">${escapeHtml(value)}</div>`);
  return`<article class="contact-coordinate-card"><span class="contact-coordinate-icon" aria-hidden="true">${icon}</span><div class="contact-coordinate-card-content"><h4>${escapeHtml(row.label||`Coordonnée ${index+1}`)}</h4><div class="contact-coordinate-values">${values.join("")}</div></div></article>`;
}
function contactCardInitial(value){
  const text=String(value||"").trim(),match=text.match(/[A-ZÀ-ÖØ-Þ0-9]/i);
  return (match?.[0]||text.charAt(0)||"?").toUpperCase();
}
function contactCardAccent(contact){
  const initial=contactCardInitial(contact.company).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase(),code=initial.charCodeAt(0);
  return ((code>=65&&code<=90?code-65:code)||0)%5;
}
function renderContactCardDetails(contact){
  const values=contactAllValues(contact),emails=[...new Set(values.flatMap(row=>contactEmails(row.value).filter(isValidContactEmail)))],phones=[...new Set(values.flatMap(row=>contactPhones(row.value)))],hiddenCount=Math.max(0,emails.length-1)+Math.max(0,phones.length-1);
  const freeValues=[
    {label:"Commercial / devis",value:contact.salesAndQuotes},
    {label:"Service client",value:contact.customerService},
    {label:"SAV",value:contact.afterSalesService},
    ...(contact.coordinates||[]).map(row=>({label:row.label||"Autre coordonnée",value:row.value}))
  ].filter(row=>String(row.value||"").trim()&&!contactEmails(row.value).length&&!contactPhones(row.value).length);
  return`${contact.salesRepresentative?`<div class="contact-card-info contact-card-person"><span aria-hidden="true">👤</span><span>${escapeHtml(contact.salesRepresentative)}</span></div>`:""}${emails[0]?`<div class="contact-card-info"><span aria-hidden="true">✉</span><span class="contact-card-value">${escapeHtml(emails[0])}</span></div>`:""}${phones[0]?`<div class="contact-card-info"><span aria-hidden="true">☎</span><span class="contact-card-value">${escapeHtml(phones[0])}</span></div>`:""}${hiddenCount?`<small class="contact-card-more">+ ${hiddenCount} coordonnée${hiddenCount>1?"s":""} supplémentaire${hiddenCount>1?"s":""}</small>`:""}${!emails.length&&!phones.length?`<p class="contact-card-empty">Aucune coordonnée enregistrée</p>`:""}${freeValues.map(row=>`<div class="contact-card-info contact-card-free"><span>${escapeHtml(row.label)}</span><span class="contact-card-value">${escapeHtml(row.value)}</span></div>`).join("")}`;
}
function renderContactPreviewCard(contact){
  const count=getContactItems(contact).length,details=renderContactCardDetails(contact);
  return`<article class="contact-card contact-accent-${contactCardAccent(contact)}" tabindex="0" role="button" data-contact-id="${escapeHtml(contact.id)}" aria-label="Ouvrir la fiche de ${escapeHtml(contact.company)}"><div class="contact-card-heading"><div class="contact-card-identity"><span class="contact-card-avatar" aria-hidden="true">${escapeHtml(contactCardInitial(contact.company))}</span><h3>${escapeHtml(contact.company)}</h3></div><span class="contact-product-count ${count?"has-products":"no-products"}">${count?`<span aria-hidden="true">📦</span> `:""}${contactCountLabel(count)}</span></div><div class="contact-card-body">${details||`<p class="contact-card-empty">Aucune coordonnée enregistrée</p>`}</div></article>`;
}
function groupContactsByInitial(rows){
  const groups=[],byInitial=new Map();
  rows.forEach(contact=>{const initial=contactCardInitial(contact.company).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();if(!byInitial.has(initial)){const group={initial,contacts:[]};byInitial.set(initial,group);groups.push(group);}byInitial.get(initial).contacts.push(contact);});
  return groups;
}
function renderContactPreviewGrid(rows){
  return groupContactsByInitial(rows).map(group=>{const accent=contactCardAccent(group.contacts[0]);return`<div class="contact-letter-group contact-accent-${accent}" data-contact-initial="${escapeHtml(group.initial)}"><div class="contact-letter-separator" aria-label="Sociétés commençant par ${escapeHtml(group.initial)}"><span>${escapeHtml(group.initial)}</span><i aria-hidden="true"></i></div>${group.contacts.map(renderContactPreviewCard).join("")}</div>`;}).join("");
}

function renderContacts(){
  const root=document.querySelector("#contactsRoot");if(!root)return;
  const query=normalizeCompanyName(contactsSearchValue),letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),availableLetters=new Set(supplierContacts.map(contact=>contactInitial(contact.company)).filter(letter=>letters.includes(letter)));
  if(selectedContactId){const contact=supplierContacts.find(row=>row.id===selectedContactId);if(contact)return renderContactDetail(root,contact);selectedContactId=null;}
  if(contactsLetterValue&&!availableLetters.has(contactsLetterValue))contactsLetterValue="";
  const hasEmail=contact=>contactAllValues(contact).some(row=>contactEmails(row.value).length||row.type==="email"),hasPhone=contact=>contactAllValues(contact).some(row=>contactPhones(row.value).length||row.type==="phone");
  const rows=supplierContacts.filter(contact=>!query||normalizeCompanyName([contact.company,contact.salesRepresentative,contact.customerService,contact.salesAndQuotes,contact.afterSalesService,contact.phone,contact.notes,(contact.aliases||[]).join(" "),(contact.coordinates||[]).map(row=>`${row.label} ${row.value}`).join(" ")].join(" ")).includes(query)).filter(contact=>!contactsLetterValue||contactInitial(contact.company)===contactsLetterValue).filter(contact=>contactsFilterValue==="all"||(contactsFilterValue==="representative"&&contact.salesRepresentative)||(contactsFilterValue==="email"&&hasEmail(contact))||(contactsFilterValue==="phone"&&hasPhone(contact))||(contactsFilterValue==="no-products"&&!getContactItems(contact).length)).sort((a,b)=>contactsSortValue==="company-desc"?b.company.localeCompare(a.company,"fr",{sensitivity:"base"}):contactsSortValue==="products"?getContactItems(b).length-getContactItems(a).length:a.company.localeCompare(b.company,"fr",{sensitivity:"base"}));
  root.innerHTML=`<header class="client-studies-header contacts-main-header"><div><p class="eyebrow">Carnet fournisseurs</p><div class="client-studies-title-row"><h3 id="contactsTitle">Contacts</h3></div><p class="main-section-subtitle">Retrouvez rapidement les sociétés et leurs coordonnées.</p></div><div class="contacts-header-meta"><span>${supplierContacts.length} société${supplierContacts.length>1?"s":""}</span><button class="primary-btn" type="button" data-add-contact>Ajouter un contact</button></div></header><section class="contacts-toolbar" aria-label="Recherche et filtres"><label class="contacts-search"><span class="sr-only">Rechercher un contact</span><input type="search" id="contactsSearch" placeholder="Rechercher une société, un commercial, un e-mail ou un téléphone…" value="${escapeHtml(contactsSearchValue)}"></label><select id="contactsFilter" aria-label="Filtrer les sociétés"><option value="all">Toutes les sociétés</option><option value="representative">Avec commercial</option><option value="email">Avec e-mail</option><option value="phone">Avec téléphone</option><option value="no-products">Sans produit associé</option></select><select id="contactsSort" aria-label="Trier les sociétés"><option value="company-asc">Société A–Z</option><option value="company-desc">Société Z–A</option><option value="products">Nombre de produits associés</option></select></section><nav class="contacts-alphabet" aria-label="Filtrer les sociétés par initiale"><div><button type="button" data-contact-letter="" class="${contactsLetterValue?"":"active"}" aria-pressed="${contactsLetterValue?"false":"true"}" title="Afficher toutes les sociétés">Toutes</button>${letters.map(letter=>`<button type="button" data-contact-letter="${letter}" class="${contactsLetterValue===letter?"active":""}" aria-label="${availableLetters.has(letter)?`Afficher les sociétés commençant par ${letter}`:`Aucune société commençant par ${letter}`}" title="${availableLetters.has(letter)?`Afficher les sociétés commençant par ${letter}`:`Aucune société commençant par ${letter}`}" aria-pressed="${contactsLetterValue===letter?"true":"false"}" ${availableLetters.has(letter)?"":'disabled aria-disabled="true"'}>${letter}</button>`).join("")}</div></nav><section class="contacts-results-zone"><p class="contacts-results" aria-live="polite">${rows.length} société${rows.length>1?"s":""} trouvée${rows.length>1?"s":""}</p><div class="contacts-list">${renderContactPreviewGrid(rows)||`<div class="agent-empty contacts-empty"><p>Aucune société ne correspond à cette combinaison de filtres.</p><button class="ghost-btn compact-btn" type="button" data-reset-contacts>Réinitialiser les filtres</button></div>`}</div></section>`;
  root.querySelector("[data-add-contact]").onclick=()=>openContactModal();
  root.querySelector("#contactsSearch").oninput=event=>{contactsSearchValue=event.target.value;renderContacts();const input=document.querySelector("#contactsSearch");input?.focus();input?.setSelectionRange(contactsSearchValue.length,contactsSearchValue.length);};
  root.querySelector("#contactsFilter").value=contactsFilterValue;root.querySelector("#contactsFilter").onchange=event=>{contactsFilterValue=event.target.value;renderContacts();};
  root.querySelector("#contactsSort").value=contactsSortValue;root.querySelector("#contactsSort").onchange=event=>{contactsSortValue=event.target.value;renderContacts();};
  root.querySelectorAll("[data-contact-letter]").forEach(button=>button.onclick=()=>{const letter=button.dataset.contactLetter;contactsLetterValue=contactsLetterValue===letter?"":letter;renderContacts();if(contactsLetterValue)requestAnimationFrame(()=>root.querySelector(`[data-contact-letter="${contactsLetterValue}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"}));});
  root.querySelector("[data-reset-contacts]")?.addEventListener("click",()=>{contactsSearchValue="";contactsFilterValue="all";contactsSortValue="company-asc";contactsLetterValue="";renderContacts();});
  root.querySelectorAll("[data-copy-contact]").forEach(button=>button.onclick=event=>{event.stopPropagation();copyContactValue(button.dataset.copyContact,button);});
  root.querySelectorAll(".contact-icon-action").forEach(action=>action.onclick=event=>{event.stopPropagation();if(action.getAttribute("aria-disabled")==="true")event.preventDefault();});
  root.querySelectorAll("[data-contact-id]").forEach(card=>{card.onclick=()=>{selectedContactId=card.dataset.contactId;contactProductsSearchValue="";contactProductsCategoryValue="all";contactProductsSortValue="name-asc";renderContacts();};card.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();card.click();}};});
}

function renderContactDetail(root,contact){
  const associated=getContactItems(contact),query=normalizeCompanyName(contactProductsSearchValue),categories=[...new Set(associated.map(item=>String(item.category||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr",{sensitivity:"base"}));
  if(contactProductsCategoryValue!=="all"&&!categories.includes(contactProductsCategoryValue))contactProductsCategoryValue="all";
  const coordinateCards=[
    {label:"Commercial",value:contact.salesRepresentative,type:"other"},
    {label:"Commercial / devis",value:contact.salesAndQuotes,type:"email"},
    {label:"Service client",value:contact.customerService,type:"email"},
    {label:"SAV",value:contact.afterSalesService,type:"email"},
    ...(contact.coordinates||[]).map(row=>({label:row.label||({email:"E-mail",phone:"Téléphone",other:"Autre coordonnée"}[row.type]),value:row.value,type:row.type}))
  ].filter(row=>String(row.value||"").trim());
  const visibleProducts=associated.filter(item=>(!query||normalizeCompanyName([item.name,item.references?.primary?.reference,item.category].join(" ")).includes(query))&&(contactProductsCategoryValue==="all"||item.category===contactProductsCategoryValue)).sort((a,b)=>contactProductsSortValue==="name-desc"?b.name.localeCompare(a.name,"fr",{sensitivity:"base"}):contactProductsSortValue==="stock-desc"?getStockStatus(b).currentStock-getStockStatus(a).currentStock:a.name.localeCompare(b.name,"fr",{sensitivity:"base"}));
  const practical=[contact.phone?{label:"Téléphone général",value:contact.phone,type:"phone"}:null,contact.notes?{label:"Notes",value:contact.notes,type:"text"}:null].filter(Boolean);
  root.innerHTML=`<button class="agent-back ghost-btn" type="button" data-back-contacts>← Retour aux contacts</button><header class="contact-identity-header"><div class="contact-identity"><span class="contact-avatar" aria-hidden="true">${escapeHtml(contactInitial(contact.company)||"?")}</span><div><h2>${escapeHtml(contact.company)}</h2><p>${contactCountLabel(associated.length)}</p></div></div><div class="contact-header-actions"><button class="primary-btn contact-edit-btn" type="button" data-edit-contact><span aria-hidden="true">✎</span> Modifier</button><button class="danger-btn" type="button" data-delete-contact>Supprimer</button></div></header><section class="contact-coordinates-section"><div class="contact-section-title"><h3>Coordonnées</h3><span>${coordinateCards.length} fonction${coordinateCards.length>1?"s":""} renseignée${coordinateCards.length>1?"s":""}</span></div>${coordinateCards.length?`<div class="contact-coordinate-grid">${coordinateCards.map(renderContactCoordinateCard).join("")}</div>`:`<div class="contact-empty-state contact-empty-card"><p>Aucune coordonnée renseignée</p><button class="ghost-btn compact-btn" type="button" data-edit-contact>Compléter la fiche</button></div>`}</section>${practical.length?`<section class="contact-practical"><h3>Informations pratiques</h3><div>${practical.map(row=>`<article><span>${row.type==="phone"?'<span class="contact-practical-phone-icon" aria-hidden="true">☎️</span> ':""}${escapeHtml(row.label)}</span>${row.type==="phone"?contactValueRow("",row.value,"phone"):`<p class="multiline-text">${escapeHtml(row.value)}</p>`}</article>`).join("")}</div></section>`:""}<section class="contact-products contact-products-table-card"><div class="contact-products-header"><div class="section-heading"><h3>Produits associés</h3><span class="contact-count-badge">${associated.length}</span></div>${associated.length?`<div class="contact-product-controls"><label><span class="sr-only">Rechercher dans les produits associés</span><input type="search" id="contactProductsSearch" placeholder="Rechercher dans les produits associés…" value="${escapeHtml(contactProductsSearchValue)}"></label><select id="contactProductsCategory" aria-label="Filtrer par catégorie"><option value="all">Toutes catégories</option>${categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select><select id="contactProductsSort" aria-label="Trier les produits"><option value="name-asc">Nom A–Z</option><option value="name-desc">Nom Z–A</option><option value="stock-desc">Stock décroissant</option></select></div>`:""}</div>${associated.length?`<div class="contact-products-result">${visibleProducts.length} produit${visibleProducts.length>1?"s":""} affiché${visibleProducts.length>1?"s":""}</div><div class="contact-products-table" role="table" aria-label="Produits associés"><div class="contact-products-table-head" role="row"><span role="columnheader">Produit</span><span role="columnheader">Référence</span><span role="columnheader">Stock</span><span aria-hidden="true"></span></div>${visibleProducts.map(item=>{const stock=getStockStatus(item),status=stock.status;return`<button type="button" role="row" data-contact-item="${escapeHtml(item.id)}"><span role="cell"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category||"Catégorie non renseignée")}</small></span><span role="cell" data-label="Référence">${escapeHtml(item.references?.primary?.reference||"—")}</span><span role="cell" data-label="Stock" class="contact-stock contact-stock-${escapeHtml(status)}"><i aria-hidden="true"></i>${escapeHtml(formatCleanNumber(stock.currentStock))} ${escapeHtml(item.unit||"")}</span><span aria-hidden="true">›</span></button>`;}).join("")||`<div class="contact-empty-state"><p>Aucun produit ne correspond à ces critères.</p></div>`}</div>`:`<div class="contact-empty-state"><p>Aucun produit associé à cette société</p></div>`}</section>`;
  root.querySelectorAll("[data-back-contacts]").forEach(button=>button.onclick=()=>{selectedContactId=null;renderContacts();});
  root.querySelectorAll("[data-edit-contact]").forEach(button=>button.onclick=()=>openContactModal(contact.id));
  root.querySelector("[data-delete-contact]").onclick=event=>requestContactDeletion(contact.id,event.currentTarget);
  root.querySelectorAll("[data-copy-contact]").forEach(button=>button.onclick=()=>copyContactValue(button.dataset.copyContact,button));
  root.querySelectorAll("[data-contact-item]").forEach(button=>button.onclick=()=>openItemDetail(button.dataset.contactItem,{view:"contacts"}));
  const productsSearch=root.querySelector("#contactProductsSearch");if(productsSearch)productsSearch.oninput=event=>{contactProductsSearchValue=event.target.value;renderContactDetail(root,contact);const input=root.querySelector("#contactProductsSearch");input?.focus();input?.setSelectionRange(contactProductsSearchValue.length,contactProductsSearchValue.length);};
  const category=root.querySelector("#contactProductsCategory");if(category){category.value=contactProductsCategoryValue;category.onchange=event=>{contactProductsCategoryValue=event.target.value;renderContactDetail(root,contact);};}
  const sort=root.querySelector("#contactProductsSort");if(sort){sort.value=contactProductsSortValue;sort.onchange=event=>{contactProductsSortValue=event.target.value;renderContactDetail(root,contact);};}
}

function openSupplierContact(id){
  if(!supplierContacts.some(contact=>contact.id===id))return;
  selectedContactId=id;contactProductsSearchValue="";contactProductsCategoryValue="all";contactProductsSortValue="name-asc";activeView="contacts";document.querySelectorAll(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.view==="contacts"));document.querySelectorAll(".view").forEach(view=>view.classList.remove("active"));document.querySelector("#contactsView")?.classList.add("active");controlBar?.classList.add("hidden");syncAppViewMode();renderContacts();
}

async function copyContactValue(value,button){
  try{await navigator.clipboard.writeText(value);const old=button.textContent;button.textContent="Copié";setTimeout(()=>button.textContent=old,1200);}catch{button.title="Copie impossible dans ce navigateur.";}
}

function openContactModal(id=""){
  const contact=id?supplierContacts.find(row=>row.id===id):null,dialog=document.querySelector("#contactDialog"),form=document.querySelector("#contactForm");
  form.reset();form.dataset.duplicateConfirmed="";document.querySelector("#contactDuplicateWarning").classList.add("hidden");document.querySelector("#contactDialogTitle").textContent=contact?"Modifier le contact":"Ajouter un contact";document.querySelector("#contactId").value=contact?.id||"";document.querySelector("#contactCompany").value=contact?.company||"";document.querySelector("#contactSalesRepresentative").value=contact?.salesRepresentative||"";document.querySelector("#contactAfterSalesService").value=contact?.afterSalesService||"";document.querySelector("#contactCustomerService").value=contact?.customerService||"";document.querySelector("#contactSalesAndQuotes").value=contact?.salesAndQuotes||"";document.querySelector("#contactPhone").value=contact?.phone||"";document.querySelector("#contactAliases").value=(contact?.aliases||[]).join(", ");document.querySelector("#contactNotes").value=contact?.notes||"";renderContactCoordinateEditors(contact?.coordinates||[]);dialog.showModal();
}

function renderContactCoordinateEditors(coordinates=[]){
  const list=document.querySelector("#contactCoordinatesList");if(!list)return;
  list.innerHTML=coordinates.map((row,index)=>`<div class="contact-coordinate-editor" data-coordinate-id="${escapeHtml(row.id||`coordinate-${index}`)}"><label>Libellé<input data-coordinate-label value="${escapeHtml(row.label||"")}" placeholder="Ex. Support technique"></label><label>Type<select data-coordinate-type><option value="email">E-mail</option><option value="phone">Téléphone</option><option value="other">Autre</option></select></label><label>Valeur<textarea data-coordinate-value rows="2" placeholder="Coordonnée ou information libre">${escapeHtml(row.value||"")}</textarea></label><button class="icon-btn" type="button" data-remove-coordinate aria-label="Supprimer cette coordonnée" title="Supprimer">×</button></div>`).join("");
  list.querySelectorAll("[data-coordinate-type]").forEach((select,index)=>select.value=coordinates[index]?.type||"other");
  list.querySelectorAll("[data-remove-coordinate]").forEach(button=>button.onclick=()=>{button.closest(".contact-coordinate-editor").remove();});
}
document.querySelector("#addContactCoordinateBtn")?.addEventListener("click",()=>{
  const list=document.querySelector("#contactCoordinatesList"),wrapper=document.createElement("div");wrapper.innerHTML=`<div class="contact-coordinate-editor"><label>Libellé<input data-coordinate-label placeholder="Ex. Support technique"></label><label>Type<select data-coordinate-type><option value="email">E-mail</option><option value="phone">Téléphone</option><option value="other">Autre</option></select></label><label>Valeur<textarea data-coordinate-value rows="2" placeholder="Coordonnée ou information libre"></textarea></label><button class="icon-btn" type="button" data-remove-coordinate aria-label="Supprimer cette coordonnée" title="Supprimer">×</button></div>`;const row=wrapper.firstElementChild;list.append(row);row.querySelector("[data-remove-coordinate]").onclick=()=>row.remove();row.querySelector("input").focus();
});

function similarCompanyContact(company,excludeId=""){
  const key=normalizeCompanyName(company);
  const distance=(a,b)=>{const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const saved=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=saved;}}return row[b.length];};
  return supplierContacts.find(contact=>contact.id!==excludeId&&contactNames(contact).some(name=>name===key||(Math.min(name.length,key.length)>=6&&distance(name,key)<=1)));
}

function saveContact(event){
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const id=document.querySelector("#contactId").value,company=document.querySelector("#contactCompany").value.trim(),warning=document.querySelector("#contactDuplicateWarning");
  if(!company){warning.textContent="La société est obligatoire.";warning.classList.remove("hidden");document.querySelector("#contactCompany").focus();return;}
  const duplicate=similarCompanyContact(company,id);
  if(duplicate&&form.dataset.duplicateConfirmed!==normalizeCompanyName(company)){warning.textContent=`Une fiche « ${duplicate.company} » existe déjà. Vérifiez-la avant de confirmer une seconde fois.`;warning.classList.remove("hidden");form.dataset.duplicateConfirmed=normalizeCompanyName(company);return;}
  const previous=id?supplierContacts.find(contact=>contact.id===id):null,aliases=document.querySelector("#contactAliases").value.split(",").map(value=>value.trim()).filter(Boolean);
  if(previous&&normalizeCompanyName(previous.company)!==normalizeCompanyName(company)&&!aliases.some(alias=>normalizeCompanyName(alias)===normalizeCompanyName(previous.company)))aliases.push(previous.company);
  const coordinates=[...document.querySelectorAll(".contact-coordinate-editor")].map((row,index)=>({id:row.dataset.coordinateId||`coordinate-${Date.now()}-${index}`,label:row.querySelector("[data-coordinate-label]").value.trim(),type:row.querySelector("[data-coordinate-type]").value,value:normalizeMultilineText(row.querySelector("[data-coordinate-value]").value)})).filter(row=>row.value);
  const contact={id:previous?.id||`contact-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,company,salesRepresentative:document.querySelector("#contactSalesRepresentative").value.trim(),afterSalesService:document.querySelector("#contactAfterSalesService").value.trim(),customerService:document.querySelector("#contactCustomerService").value.trim(),salesAndQuotes:document.querySelector("#contactSalesAndQuotes").value.trim(),phone:document.querySelector("#contactPhone").value.trim(),notes:normalizeMultilineText(document.querySelector("#contactNotes").value),aliases:[...new Set(aliases)],coordinates};
  if(previous)supplierContacts=supplierContacts.map(row=>row.id===contact.id?contact:row);else supplierContacts.push(contact);
  supplierContacts=migrateSupplierContacts(supplierContacts);addHistory(previous?"Contact modifié":"Contact ajouté",`${currentName} a ${previous?"modifié":"ajouté"} le contact ${contact.company}.`);persist();document.querySelector("#contactDialog").close();selectedContactId=contact.id;renderContacts();renderHistory();hydrateSupplierContactOptions();
}

function requestContactDeletion(id,trigger){
  const contact=supplierContacts.find(row=>row.id===id);if(!contact)return;const count=getContactItems(contact).length;
  openDeleteConfirmation({title:`Supprimer définitivement le contact « ${contact.company} » ?`,message:`${count?`${count} item(s) sont associés à cette société. `:""}Les items ne seront pas supprimés et conserveront leur fournisseur sous forme de texte, mais le lien vers cette fiche disparaîtra.`,confirmText:"Supprimer le contact",trigger,onConfirm:()=>{supplierContacts=supplierContacts.filter(row=>row.id!==id);addHistory("Contact supprimé",`${currentName} a supprimé le contact ${contact.company}.`);persist();selectedContactId=null;hydrateSupplierContactOptions();renderContacts();renderHistory();}});
}

function hydrateSupplierContactOptions(){
  const list=document.querySelector("#supplierContactsList");if(!list)return;list.innerHTML=supplierContacts.map(contact=>`<option value="${escapeHtml(contact.company)}"></option>`).join("");
}

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

function addHistory(action, detail) {
  history.unshift({
    date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    user: currentName,
    action,
    detail
  });
}

function createSafeItemId(prefix = "itm-web") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLocationCatalog(rawCatalog) {
  const raw = rawCatalog && typeof rawCatalog === "object" ? rawCatalog : {};
  const locations = new Map(INITIAL_INVENTORY_LOCATION_CATALOG.locations.map(row => [row.id, { ...row }]));
  (Array.isArray(raw.locations) ? raw.locations : []).forEach(row => {
    if (!row?.id || !FIXED_INVENTORY_ROOMS.some(room => room.id === row.roomId)) return;
    locations.set(row.id, { id: String(row.id), roomId: String(row.roomId), name: String(row.name || "").trim(), icon: row.icon || "📍", ...(Number.isFinite(Number(row.order)) ? { order: Number(row.order) } : {}) });
  });
  const sublocations = new Map();
  (Array.isArray(raw.sublocations) ? raw.sublocations : []).forEach(row => {
    if (!row?.id || !locations.has(row.locationId)) return;
    sublocations.set(row.id, { id: String(row.id), locationId: String(row.locationId), name: String(row.name || "").trim(), ...(Number.isFinite(Number(row.order)) ? { order: Number(row.order) } : {}) });
  });
  return { locations: [...locations.values()].filter(row => row.name), sublocations: [...sublocations.values()].filter(row => row.name) };
}

function stablePlacementId(itemId, value, index) {
  let hash = 2166136261;
  for (const char of `${itemId}|${value}|${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `placement-legacy-${(hash >>> 0).toString(36)}`;
}

function migrateItemPlacements(item, itemId) {
  if (Array.isArray(item?.placements) && item.placements.length) {
    const seen = new Set();
    return item.placements.map((row, index) => ({
      id: String(row?.id || stablePlacementId(itemId, `${row?.roomId}|${row?.locationId}|${row?.sublocationId}`, index)),
      roomId: row?.roomId || null,
      locationId: row?.locationId || null,
      sublocationId: row?.sublocationId || null,
      ...(row?.legacyValue ? { legacyValue: String(row.legacyValue) } : {})
    })).filter(row => {
      const key = `${row.roomId}|${row.locationId}|${row.sublocationId}|${row.legacyValue || ""}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  const values = Array.from(new Set([...(Array.isArray(item?.locations) ? item.locations : []), item?.location].map(value => String(value || "").trim()).filter(Boolean)));
  return values.map((value, index) => {
    const canonical = legacyLocationMap[value] || value;
    const mapped = LEGACY_PLACEMENT_MAP[canonical];
    if (!mapped) {
      console.warn(`[Migration localisations] Valeur inconnue conservée pour l'item ${itemId}:`, value);
      return { id: stablePlacementId(itemId, value, index), roomId: null, locationId: null, sublocationId: null, legacyValue: value };
    }
    return { id: stablePlacementId(itemId, canonical, index), roomId: mapped[0], locationId: mapped[1], sublocationId: null };
  });
}

function migrateItems(itemList) {
  const safeList = Array.isArray(itemList) ? itemList : [];
  const seenIds = new Set();

  return safeList.map((item) => {
    const { maxStock, ...itemWithoutMaxStock } = item || {};
    let id = typeof item?.id === "string" ? item.id.trim() : "";

    if (!id || seenIds.has(id)) {
      id = createSafeItemId();
    }

    seenIds.add(id);

    const placements = migrateItemPlacements(item, id);
    const previousNames = Array.isArray(item?.locations) ? item.locations : [item?.location].filter(Boolean);
    const compatibilityNames = placements.map((placement, placementIndex) => {
      const location = INITIAL_INVENTORY_LOCATION_CATALOG.locations.find(row => row.id === placement.locationId);
      const room = FIXED_INVENTORY_ROOMS.find(row => row.id === placement.roomId);
      return location?.name || room?.name || placement.legacyValue || previousNames[placementIndex] || "";
    }).filter(Boolean);
    return {
      ...itemWithoutMaxStock,
      id,
      category: inventoryCategories.includes(item?.category)
        ? item.category
        : legacyCategoryMap[item?.category] || inventoryCategories[0],
      placements,
      locations: compatibilityNames,
      location: compatibilityNames[0] || "",
      tags: Array.isArray(item?.tags) ? item.tags : [],
      references: normalizeReferences(item?.references)
    };
  });
}

// funcion para conservar both los items que yo genero en VS como los items que cualquiera anade a github
function mergeItems(baseItems, storedItems) {
  const merged = new Map();

  baseItems.forEach(item => {
    merged.set(item.id, item);
  });

  storedItems.forEach(item => {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? { ...existing, ...item } : item);
  });

  return Array.from(merged.values());
}

function migrateExperiments(experimentList) {
  const safeList = Array.isArray(experimentList) ? experimentList : [];

  return safeList.map(experiment => ({
    ...experiment,
    status: ["draft", "running", "completed"].includes(experiment?.status)
      ? experiment.status
      : "draft",
    conditions: Math.max(1, Number(experiment?.conditions || 1)),
    replicates: Math.max(1, Number(experiment?.replicates || 1)),
    items: Array.isArray(experiment?.items) ? experiment.items : [],
    consumedItems: Array.isArray(experiment?.consumedItems) ? experiment.consumedItems : []
  }));
}

function normalizeClientCode(value) {
  const raw = String(value || "").trim();
  const compact = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s._\-\/\\]+/g, "");

  if (!compact) {
    return {
      raw,
      normalizedKey: "",
      canonicalCode: ""
    };
  }

  const match = compact.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return {
      raw,
      normalizedKey: compact,
      canonicalCode: compact
    };
  }

  const prefix = match[1];
  const numericValue = String(Number.parseInt(match[2], 10));
  const safeNumber = numericValue === "NaN" ? match[2].replace(/^0+/, "") || "0" : numericValue;

  return {
    raw,
    normalizedKey: `${prefix}${safeNumber}`,
    canonicalCode: `${prefix}${safeNumber.padStart(3, "0")}`
  };
}

function createClientRecordFromCode(code, existing = {}) {
  const normalized = normalizeClientCode(code || existing.canonicalCode || existing.rawCode);
  const normalizedKey = existing.normalizedKey || normalized.normalizedKey;
  const canonicalCode = existing.canonicalCode || normalized.canonicalCode || normalized.raw || "CLIENT";

  return {
    ...existing,
    id: existing.id || `client-${normalizedKey || createSafeItemId("unknown-client")}`,
    normalizedKey,
    canonicalCode,
    rawCodes: Array.from(new Set([
      ...(Array.isArray(existing.rawCodes) ? existing.rawCodes : []),
      existing.rawCode,
      normalized.raw
    ].filter(Boolean))),
    createdAtRaw: existing.createdAtRaw || new Date().toISOString(),
    updatedAtRaw: existing.updatedAtRaw || new Date().toISOString()
  };
}

function migrateClients(clientList = [], sampleList = []) {
  const merged = new Map();

  (Array.isArray(clientList) ? clientList : []).forEach(client => {
    const record = createClientRecordFromCode(client?.canonicalCode || client?.rawCode || client?.normalizedKey, client || {});
    if (!record.normalizedKey) return;
    merged.set(record.normalizedKey, record);
  });

  (Array.isArray(sampleList) ? sampleList : []).forEach(sample => {
    const normalized = normalizeClientCode(
      sample?.rawClientCode ||
      sample?.canonicalClientCode ||
      sample?.clientCode
    );
    if (!normalized.normalizedKey) return;

    const existing = merged.get(normalized.normalizedKey);
    const next = createClientRecordFromCode(normalized.raw || normalized.canonicalCode, {
      ...(existing || {}),
      normalizedKey: normalized.normalizedKey,
      canonicalCode: existing?.canonicalCode || normalized.canonicalCode,
      rawCodes: [
        ...(existing?.rawCodes || []),
        sample?.rawClientCode,
        sample?.clientCode,
        sample?.canonicalClientCode
      ].filter(Boolean)
    });
    merged.set(normalized.normalizedKey, next);
  });

  return Array.from(merged.values()).sort((a, b) =>
    String(a.canonicalCode || "").localeCompare(String(b.canonicalCode || ""), "fr")
  );
}

function getClientByNormalizedKey(normalizedKey) {
  if (!normalizedKey) return null;
  return clients.find(client => client.normalizedKey === normalizedKey) || null;
}

function ensureClientForCode(code) {
  const normalized = normalizeClientCode(code);
  if (!normalized.normalizedKey) {
    return {
      id: "",
      rawCode: normalized.raw,
      normalizedKey: "",
      canonicalCode: ""
    };
  }

  const existing = getClientByNormalizedKey(normalized.normalizedKey);
  if (existing) {
    if (normalized.raw && !existing.rawCodes?.includes(normalized.raw)) {
      existing.rawCodes = [...(existing.rawCodes || []), normalized.raw];
      existing.updatedAtRaw = new Date().toISOString();
    }

    return {
      id: existing.id,
      rawCode: normalized.raw,
      normalizedKey: existing.normalizedKey,
      canonicalCode: existing.canonicalCode
    };
  }

  const created = createClientRecordFromCode(normalized.raw || normalized.canonicalCode);
  clients = [...clients, created].sort((a, b) =>
    String(a.canonicalCode || "").localeCompare(String(b.canonicalCode || ""), "fr")
  );

  return {
    id: created.id,
    rawCode: normalized.raw,
    normalizedKey: created.normalizedKey,
    canonicalCode: created.canonicalCode
  };
}

function getClientForSample(sample) {
  if (!sample) return null;
  return clients.find(client => client.id === sample.clientId) ||
    getClientByNormalizedKey(sample.normalizedClientKey) ||
    getClientByNormalizedKey(normalizeClientCode(sample.clientCode).normalizedKey) ||
    null;
}

function hydrateClientIdentityForSamples(sampleList, clientList) {
  const registry = Array.isArray(clientList) ? clientList : [];

  return (Array.isArray(sampleList) ? sampleList : []).map(sample => {
    const normalizedKey = sample.normalizedClientKey ||
      normalizeClientCode(sample.rawClientCode || sample.clientCode).normalizedKey;
    const client = registry.find(entry => entry.id === sample.clientId) ||
      registry.find(entry => entry.normalizedKey === normalizedKey);

    if (!client) return sample;

    return {
      ...sample,
      clientId: client.id,
      normalizedClientKey: client.normalizedKey,
      canonicalClientCode: client.canonicalCode,
      clientCode: client.canonicalCode
    };
  });
}

function getSampleCanonicalClientCode(sample) {
  const client = getClientForSample(sample);
  if (client?.canonicalCode) return client.canonicalCode;
  return sample?.canonicalClientCode ||
    normalizeClientCode(sample?.rawClientCode || sample?.clientCode).canonicalCode ||
    sample?.clientCode ||
    "Client inconnu";
}

function getSimilarClientSuggestion(rawCode) {
  const normalized = normalizeClientCode(rawCode);
  if (!normalized.normalizedKey) return "";
  if (getClientByNormalizedKey(normalized.normalizedKey)) return "";

  const normalizedPrefix = normalized.normalizedKey.match(/^([A-Z]+)/)?.[1] || "";
  if (!normalizedPrefix) return "";

  const similar = clients.find(client => {
    const clientPrefix = String(client.normalizedKey || "").match(/^([A-Z]+)/)?.[1] || "";
    if (clientPrefix !== normalizedPrefix) return false;
    return client.normalizedKey !== normalized.normalizedKey;
  });

  return similar?.canonicalCode || "";
}

function updateClientCodeHint() {
  const hint = document.querySelector("#sampleClientCodeHint");
  if (!hint) return;

  const normalized = normalizeClientCode(sampleFields.sampleClientCode.value);
  if (!normalized.normalizedKey) {
    hint.textContent = "";
    return;
  }

  const existing = getClientByNormalizedKey(normalized.normalizedKey);
  if (existing) {
    hint.textContent = `Client reconnu : ${existing.canonicalCode}`;
    return;
  }

  const suggestion = getSimilarClientSuggestion(sampleFields.sampleClientCode.value);
  hint.textContent = suggestion
    ? `Nouveau client. Code proche existant : ${suggestion}`
    : `Nouveau client : ${normalized.canonicalCode}`;
}

function migrateClientSamples(sampleList) {
  const safeList = Array.isArray(sampleList) ? sampleList : [];
  const seenIds = new Set();

  return safeList.map(sample => {
    let id = typeof sample?.id === "string" ? sample.id.trim() : "";
    if (!id || seenIds.has(id)) {
      id = createSafeItemId("sample");
    }
    seenIds.add(id);

    const type = sample?.type === "created_sample" ? "created_sample" : "client_product";
    const mappedCategory = clientSampleCategoryAliases[sample?.category] || sample?.category;
    const category = clientSampleCategories.includes(mappedCategory)
      ? mappedCategory
      : (type === "created_sample" ? String(sample?.category || clientSampleCategories[0]) : "");
    const historicalUnit = String(sample?.measureUnit || sample?.unit || "").trim();
    const legacyArnQiazol = category === "ARN"
      ? (typeof sample?.arnQiazol === "boolean" ? sample.arnQiazol : historicalUnit === "µL" ? false : true)
      : null;
    const legacyArnBead = category === "ARN" ? Boolean(legacyArnQiazol && sample?.arnBead) : null;
    const measureUnit = type === "created_sample"
      ? (historicalUnit || getCreatedSampleUnit(category, legacyArnQiazol !== false))
      : (sample?.unit || "");
    const location = inventoryLocations.includes(sample?.location)
      ? sample.location
      : legacyLocationMap[sample?.location] || inventoryLocations[0];
    const rawClientCode = String(
      sample?.rawClientCode ||
      sample?.clientCode ||
      sample?.canonicalClientCode ||
      ""
    ).trim();
    const normalizedClient = normalizeClientCode(
      sample?.canonicalClientCode ||
      rawClientCode
    );
    const canonicalClientCode = sample?.canonicalClientCode || normalizedClient.canonicalCode || rawClientCode;
    const hasReplicaFamily = type === "created_sample" &&
      (Number(sample?.replicaCount || 1) > 1 || Number(sample?.replicaNumber || 0) > 0);
    const legacyGroupId = hasReplicaFamily
      ? [
          "sample-group-legacy",
          normalizedClient.normalizedKey || "client",
          sample?.baseName || String(sample?.name || "").replace(/\s+\d+$/, ""),
          sample?.creationDate || "date",
          sample?.category || "category",
          sample?.location || "location"
        ].map(toSafeKeyPart).join("-")
      : "";
    const generalData = type === "created_sample"
      ? {
          ...(sample?.generalData || {}),
          notes: normalizeMultilineText(sample?.generalData?.notes ?? (hasReplicaFamily ? sample?.notes : ""))
        }
      : {};
    const specificData = type === "created_sample"
      ? {
          ...(sample?.specificData || {}),
          notes: normalizeMultilineText(sample?.specificData?.notes ?? (hasReplicaFamily ? "" : sample?.notes))
        }
      : {};

    return {
      ...sample,
      id,
      type,
      name: String(sample?.name || sample?.baseName || "").trim(),
      baseName: String(sample?.baseName || sample?.name || "").trim(),
      clientCode: canonicalClientCode,
      rawClientCode,
      normalizedClientKey: sample?.normalizedClientKey || normalizedClient.normalizedKey,
      clientId: sample?.clientId || (normalizedClient.normalizedKey ? `client-${normalizedClient.normalizedKey}` : ""),
      canonicalClientCode,
      category,
      arnQiazol: legacyArnQiazol,
      arnBead: legacyArnBead,
      location,
      arrivalDate: sample?.arrivalDate || "",
      creationDate: sample?.creationDate || "",
      quantity: sample?.quantity ?? sample?.measureValue ?? "",
      unit: type === "created_sample" ? measureUnit : String(sample?.unit || "").trim(),
      measureValue: sample?.measureValue ?? sample?.quantity ?? "",
      measureUnit,
      referenceNumber: String(sample?.referenceNumber || "").trim(),
      lotNumber: String(sample?.lotNumber || "").trim(),
      notes: normalizeMultilineText(sample?.notes),
      generalData,
      specificData,
      groupId: sample?.groupId || legacyGroupId,
      replicaId: sample?.replicaId || id,
      replicaNumber: sample?.replicaNumber || null,
      replicaCount: sample?.replicaCount || 1,
      createdAtRaw: sample?.createdAtRaw || "",
      createdAt: sample?.createdAt || ""
    };
  }).filter(sample => sample.name || sample.clientCode);
}

function getClientSampleTime(sample) {
  const rawDate = sample?.creationDate || sample?.arrivalDate || sample?.createdAtRaw || "";
  const parsed = new Date(rawDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatClientSampleDate(sample) {
  return sample?.type === "created_sample"
    ? sample.creationDate || ""
    : sample.arrivalDate || "";
}

function formatClientSampleQuantity(sample) {
  if (sample?.type === "created_sample") {
    const label = sample.measureUnit === "mL" ? "Volume" : "Poids";
    return `${label}: ${sample.measureValue} ${sample.measureUnit}`;
  }

  return `${sample.quantity} ${sample.unit}`.trim();
}

function formatSampleDisplayQuantity(sample) {
  if (!sample) return "";

  const value = sample.type === "created_sample"
    ? sample.measureValue ?? sample.quantity
    : sample.quantity;
  const unit = sample.type === "created_sample"
    ? sample.measureUnit || sample.unit
    : sample.unit;

  return formatFrenchQuantity(value, unit);
}

function formatFrenchQuantity(value, unit) {
  const rawUnit = String(unit || "").trim();
  if (value === undefined || value === null || value === "") return rawUnit;

  const number = Number(value);
  const formattedValue = Number.isFinite(number)
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(number)
    : String(value);

  return `${formattedValue} ${rawUnit}`.trim();
}

function formatDisplayDateFrench(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

function findInventoryItem(line) {
  if(line?.type==="custom")return null;
  const stableId=line?.inventoryItemId||line?.itemId;
  if (stableId) {
    return items.find(item => item.id === stableId) || null;
  }
  if(line?.type==="inventory")return null;
  return findInventoryItemByProtocolName(line?.name);
}

function findInventoryItemByProtocolName(name) {
  const rawName = String(name || "").trim();
  if (!rawName) return null;

  const exact = items.filter(item => String(item.name || "").trim() === rawName);
  if (exact.length === 1) return exact[0];

  const lowerName = rawName.toLowerCase();
  const lowerMatches = items.filter(item => String(item.name || "").trim().toLowerCase() === lowerName);
  if (lowerMatches.length === 1) return lowerMatches[0];

  const normalizedName = normalizeSearch(rawName);
  const normalizedMatches = items.filter(item => normalizeSearch(item.name) === normalizedName);
  if (normalizedMatches.length === 1) return normalizedMatches[0];

  const relaxedName = normalizeProtocolMatchText(rawName);
  const relaxedMatches = items.filter(item => normalizeProtocolMatchText(item.name) === relaxedName);
  if (relaxedMatches.length === 1) return relaxedMatches[0];

  return null;
}

function normalizeProtocolMatchText(value) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "");
}

// compare l'unité écrite dans le protocole à l'unité de référence réelle de l'item (dernier niveau de conditionnement),
// avec conversion métrique automatique si compatible (ex. uL vs mL) ; incompatible sinon (ex. mg vs tube)
function resolveExperimentLineUnitMatch(item, quantity, rawUnit) {
  const referenceUnit = StockTracking.referenceUnit(item);
  const protocolUnit = StockTracking.normalizeUnitLabel(rawUnit);
  const needed = Number(quantity || 0);
  if (protocolUnit.key === referenceUnit.key) {
    return { compatible: true, referenceUnit, protocolUnit, neededInReferenceUnit: needed, converted: false };
  }
  const factor = StockTracking.metricConversionFactor(protocolUnit.key, referenceUnit.key);
  if (factor === null) return { compatible: false, referenceUnit, protocolUnit };
  return { compatible: true, referenceUnit, protocolUnit, neededInReferenceUnit: needed * factor, converted: true };
}

function getExperimentLineAvailability(item, quantity, rawUnit) {
  if (!item) return { connected: false, compatible: false, kind: "missing" };
  const match = resolveExperimentLineUnitMatch(item, quantity, rawUnit);
  if (!match.compatible) return { connected: true, compatible: false, kind: "incompatible", referenceUnit: match.referenceUnit, protocolUnit: match.protocolUnit };
  const equivalent = StockTracking.equivalentLevels(item, StockTracking.available(item)).find(level => level.key === match.referenceUnit.key);
  const availableInReferenceUnit = equivalent ? equivalent.value : 0;
  const enough = availableInReferenceUnit + 1e-8 >= match.neededInReferenceUnit;
  return {
    connected: true,
    compatible: true,
    kind: enough ? "ok" : "low",
    referenceUnit: match.referenceUnit,
    availableInReferenceUnit,
    neededInReferenceUnit: match.neededInReferenceUnit,
    converted: match.converted
  };
}

function experimentStockSummary(experiment) {
  const missing = getMergedExperimentLines(experiment.items).filter(line => {
    if(line.type==="custom")return false;
    const item = findInventoryItem(line);
    const availability = getExperimentLineAvailability(item, line.quantity, line.unit);
    return availability.kind !== "ok";
  }).length;
  return { ok: missing === 0, missing };
}

function getItemAddedTime(item) {
  if (item?.createdAtRaw) {
    const parsed = new Date(item.createdAtRaw).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (item?.createdAt) {
    const parsed = new Date(item.createdAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const idMatch = String(item?.id || "").match(/^(?:web|itm)-(\d{10,})$/);
  if (idMatch) {
    return Number(idMatch[1]);
  }

  return 0;
}

function formatQuantity(quantity, unit) {
  const value = Number(quantity || 0);
  if (unit === "uL" && value >= 1000) return `${Number((value / 1000).toFixed(3))} mL`;
  return `${Number(value.toFixed(3))} ${escapeHtml(unit)}`;
}

function addSecondaryReferenceRow(reference = {}) {
  const row = document.createElement("div");
  row.className = "secondary-reference-row";
  const referenceNumber = secondaryReferencesList.children.length + 1;
  row.innerHTML = `
    <label>R&eacute;f&eacute;rence secondaire ${referenceNumber}<input class="secondary-reference" value="${escapeHtml(reference.reference || "")}" /></label>
    <label>Notes<textarea class="secondary-reference-notes" rows="2">${escapeHtml(reference.notes || "")}</textarea></label>
    <button class="ghost-btn" type="button">Retirer</button>
  `;
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    renumberSecondaryReferences();
  });
  secondaryReferencesList.append(row);
}

function renderSecondaryReferences(references = []) {
  secondaryReferencesList.innerHTML = "";
  references.forEach(reference => addSecondaryReferenceRow(reference));
}

function renumberSecondaryReferences() {
  secondaryReferencesList.querySelectorAll(".secondary-reference-row").forEach((row, index) => {
    row.querySelector("label").firstChild.textContent = `Référence secondaire ${index + 1}`;
  });
}

function getItemReferences() {
  const secondary = [...secondaryReferencesList.querySelectorAll(".secondary-reference-row")]
    .map((row) => ({
      reference: row.querySelector(".secondary-reference").value.trim(),
      notes: normalizeMultilineText(row.querySelector(".secondary-reference-notes").value)
    }))
    .filter((reference) => reference.reference || reference.notes);

  return {
    primary: {
      supplier: fields.primarySupplier.value.trim(),
      reference: fields.primaryReference.value.trim(),
      link: fields.primaryLink.value.trim(),
      notes: normalizeMultilineText(fields.primaryReferenceNotes.value),
      price: fields.primaryPrice.value.trim(),
      unitPrice: fields.primaryUnitPrice.value.trim(),
      leadTime: fields.primaryLeadTime.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  // Older records could store a free-form quantity alongside the reference.
  // A price, however, is already a first-class field and must never be copied
  // into the reference notes when those notes are empty.
  const legacyPrimaryNotes = references?.primary?.quantity || "";

  return {
    primary: {
      supplier: references?.primary?.supplier || "",
      reference: references?.primary?.reference || "",
      link: references?.primary?.link || "",
      notes: references?.primary?.notes || legacyPrimaryNotes || "",
      price: references?.primary?.price || "",
      unitPrice: references?.primary?.unitPrice || "",
      leadTime: references?.primary?.leadTime || ""
    },
    secondary: Array.isArray(references?.secondary)
      ? references.secondary.map((reference) => ({
          reference: reference.reference || "",
          notes: reference.notes || [reference.quantity, reference.price].filter(Boolean).join(" - ")
        }))
      : []
  };
}

function itemReferencesText(references) {
  const normalized = normalizeReferences(references);
  return [
    normalized.primary.supplier,
    normalized.primary.reference,
    normalized.primary.link,
    normalized.primary.notes,
    normalized.primary.price,
    normalized.primary.unitPrice,
    normalized.primary.leadTime,
    ...normalized.secondary.flatMap((reference) => [reference.reference, reference.notes])
  ].filter(Boolean).join(" ");
}

function priorityRank(priority) {
  return {
    critique: 0,
    "tres urgent": 1,
    urgent: 2,
    "pas urgent": 3
  }[priority] ?? 9;
}

function priorityLabel(priority) {
  return {
    critique: "Critique",
    "tres urgent": "Très urgent",
    urgent: "Urgent",
    "pas urgent": "Pas urgent"
  }[priority] || priority;
}

function slugPriority(priority) {
  return priority.replace(/\s+/g, "-");
}

function normalizeSearch(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Navigation hiérarchique des emplacements (salle → localisation → sous-localisation).
function hierarchyCatalog() { return normalizeLocationCatalog(sharedState.locationCatalog); }
function hierarchyRoom(id) { return FIXED_INVENTORY_ROOMS.find(row => row.id === id); }
function hierarchyLocation(id) { return hierarchyCatalog().locations.find(row => row.id === id); }
function hierarchySublocation(id) { return hierarchyCatalog().sublocations.find(row => row.id === id); }
function uniqueEntryCount(entries) { return new Set(entries.map(entry => `${entry.kind}:${entry.record.id}`)).size; }
function inventoryPlacementEntries(predicate) {
  return items.flatMap(item => (item.placements || []).filter(predicate).map(placement => ({ kind: "inventory", record: item, placement })));
}
function roomEntries(roomId, directOnly = false) { return inventoryPlacementEntries(row => row.roomId === roomId && (!directOnly || (!row.locationId && !row.sublocationId))); }
function locationEntries(locationId, directOnly = false) { return inventoryPlacementEntries(row => row.locationId === locationId && (!directOnly || !row.sublocationId)); }
function sublocationEntries(sublocationId) { return inventoryPlacementEntries(row => row.sublocationId === sublocationId); }
function hierarchyPreview(entries) {
  const unique = [], seen = new Set();
  entries.forEach(entry => { if (!seen.has(entry.record.id)) { seen.add(entry.record.id); unique.push(entry.record.name); } });
  const preview = unique.slice(0, 3), remaining = Math.max(0, unique.length - preview.length);
  return preview.length ? `${preview.map(name => `<span>${escapeHtml(name)}</span>`).join("")}${remaining ? `<span class="location-more-count">+ ${formatLocationCount(remaining,"autre référence","autres références")}</span>` : ""}` : `<span class="location-empty-preview">Aucune référence stockée</span>`;
}
function hierarchyRow(entity, entries, type, selected = false) {
  const count = uniqueEntryCount(entries);
  const icon = type === "sublocation" ? `<span class="location-explorer-icon location-sublocation-marker-wrap" aria-hidden="true"><i class="location-sublocation-marker"></i></span>` : `<span class="location-explorer-icon" aria-hidden="true">${entity.icon || "📍"}</span>`;
  const actions = type === "room" ? "" : `<span class="location-order-actions"><button class="icon-btn" type="button" data-move-hierarchy="up" title="Monter" aria-label="Monter ${escapeHtml(entity.name)}" ${entity._first?"disabled":""}>↑</button><button class="icon-btn" type="button" data-move-hierarchy="down" title="Descendre" aria-label="Descendre ${escapeHtml(entity.name)}" ${entity._last?"disabled":""}>↓</button></span><span class="location-row-actions-menu"><button class="location-menu-trigger" type="button" data-toggle-location-menu aria-haspopup="menu" aria-expanded="false" aria-label="Actions pour ${escapeHtml(entity.name)}">⋮</button><span class="location-actions-popover hidden" role="menu"><button type="button" role="menuitem" data-edit-hierarchy="${type}">Modifier</button><button type="button" role="menuitem" data-delete-hierarchy="${type}">Supprimer</button></span></span>`;
  return `<article class="location-explorer-row${selected ? " is-selected" : ""}" tabindex="0" role="option" aria-selected="${selected}" data-${type}-id="${escapeHtml(entity.id)}">${icon}<strong class="location-explorer-name" title="${escapeHtml(entity.name)}">${escapeHtml(entity.name)}</strong><span class="location-explorer-count">${escapeHtml(formatLocationCount(count,"item"))}</span>${actions}</article>`;
}
function resetLocationDetailState() { locationDetailSearch = ""; locationDetailStatus = "all"; locationDetailFacet = "all"; locationDetailSort = "name-asc"; locationDetailPage = 1; selectedLocationEntry = null; }

function renderLocations() {
  const grid = document.querySelector("#locationGrid"); if (!grid) return;
  selectedLocation = selectedRoomId || null; syncAppViewMode();
  const query = normalizeSearch(locationSearchInput?.value || "");
  const rooms = FIXED_INVENTORY_ROOMS.map((room,index) => ({ room, entries: roomEntries(room.id), index })).filter(({ room, entries }) => !query || normalizeSearch(`${room.name} ${entries.map(row => row.record.name).join(" ")}`).includes(query)).sort((a,b)=>uniqueEntryCount(b.entries)-uniqueEntryCount(a.entries)||a.index-b.index);
  document.querySelector("#locationResultCount").textContent = formatLocationCount(rooms.length, "salle");
  const catalog=hierarchyCatalog(), ordered=rows=>rows.sort((a,b)=>(a.order??Number.MAX_SAFE_INTEGER)-(b.order??Number.MAX_SAFE_INTEGER)||a._index-b._index).map((row,index,array)=>({...row,_first:index===0,_last:index===array.length-1})), locations=selectedRoomId?ordered(catalog.locations.filter(row=>row.roomId===selectedRoomId).map((row,_index)=>({...row,_index}))):[], subs=selectedLocationId?ordered(catalog.sublocations.filter(row=>row.locationId===selectedLocationId).map((row,_index)=>({...row,_index}))):[];
  grid.innerHTML = `<section class="location-explorer-card" aria-label="Explorateur des emplacements"><h3>Explorateur des emplacements</h3><div class="location-explorer">${renderExplorerColumn(1,"Salles",rooms.map(({room,entries})=>hierarchyRow(room,entries,"room",room.id===selectedRoomId)).join("")||"Aucune salle ne correspond à votre recherche.","room")}${renderExplorerColumn(2,"Localisations",selectedRoomId?(locations.map(row=>hierarchyRow(row,locationEntries(row.id),"location",row.id===selectedLocationId)).join("")||"Aucune localisation dans cette salle") : "Sélectionnez une salle","location")}${renderExplorerColumn(3,"Sous-localisations",selectedLocationId?(subs.map(row=>hierarchyRow(row,sublocationEntries(row.id),"sublocation",row.id===selectedSublocationId)).join("")||"Aucune sous-localisation dans cette localisation") : "Sélectionnez une localisation","sublocation")}</div>${renderLocationPathBar()}</section>${renderHierarchyContent()}`;
  bindHierarchyEvents(grid);
}

function renderExplorerColumn(number,title,content,type){const canAdd=(type==="location"&&selectedRoomId)||(type==="sublocation"&&selectedLocationId),addLabel=type==="location"?"Localisation":"Sous-localisation";return `<section class="location-explorer-column"><header><span class="location-step">${number}</span><strong>${title}</strong>${type!=="room"?`<button class="text-btn location-column-add" type="button" data-add-hierarchy="${type}" ${canAdd?"":"disabled"}>+ ${addLabel}</button>`:""}</header><div class="location-explorer-panel"><div class="location-explorer-list" role="listbox">${content&&content.startsWith("<")?content:`<p class="location-column-empty">${escapeHtml(content)}</p>`}</div></div></section>`;}
function renderLocationPathBar(){const room=hierarchyRoom(selectedRoomId),location=hierarchyLocation(selectedLocationId),sub=hierarchySublocation(selectedSublocationId),segments=[];if(room)segments.push(`<button type="button" data-breadcrumb-level="room"><span aria-hidden="true">${room.icon||"📍"}</span>${escapeHtml(room.name)}</button>`);if(location)segments.push(`<button type="button" data-breadcrumb-level="location"><span aria-hidden="true">${location.icon||"📍"}</span>${escapeHtml(location.name)}</button>`);if(sub)segments.push(`<strong><span class="location-path-sublocation-marker" aria-hidden="true"></span>${escapeHtml(sub.name)}</strong>`);return `<div class="location-path-bar"><nav class="location-path" aria-label="Chemin sélectionné">${segments.length?segments.join('<span class="location-path-chevron" aria-hidden="true">›</span>'):`<span class="location-path-empty">Sélectionnez une salle pour commencer</span>`}</nav><div class="location-path-actions"><button class="primary-btn compact-btn" type="button" data-add-hierarchy="item" ${room?"":"disabled"}>+ Ajouter un item</button></div></div>`;}
function renderHierarchyContent(){if(!selectedRoomId)return `<section class="location-content-welcome"><span aria-hidden="true">📍</span><p>Sélectionnez une salle pour explorer ses localisations et ses items.</p></section>`;const room=hierarchyRoom(selectedRoomId),location=hierarchyLocation(selectedLocationId),sub=hierarchySublocation(selectedSublocationId);let title=room.name,meta=`Salle · ${formatLocationCount(uniqueEntryCount(roomEntries(room.id)),"item")}`,entries=roomEntries(room.id,true),sectionTitle="Items directement dans cette salle",empty="Aucun item directement dans cette salle.",hide=true,actions=allItemsButton();if(location){title=location.name;meta=`Localisation dans ${room.name} · ${formatLocationCount(uniqueEntryCount(locationEntries(location.id)),"item")}`;entries=locationEntries(location.id,true);sectionTitle="Items directement dans cette localisation";empty="Aucun item directement dans cette localisation.";hide=false;}if(sub){title=sub.name;meta=`Sous-localisation dans ${location.name} · ${formatLocationCount(uniqueEntryCount(sublocationEntries(sub.id)),"item")}`;entries=sublocationEntries(sub.id);sectionTitle="Items dans cette sous-localisation";empty="Aucun item dans cette sous-localisation.";actions="";}else if(location&&locationScopeMode==="all"){entries=locationEntries(location.id);sectionTitle="Tous les items de la localisation";}else if(!location&&locationScopeMode==="all"){entries=roomEntries(room.id);sectionTitle="Tous les items de la salle";hide=false;}const printScope=sub?"sublocation":location?"location":"room",printId=sub?sub.id:location?location.id:room.id;actions+=renderLocationPrintButton(printScope,printId);return `<section class="location-active-content"><header><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(meta)}</p></div><div class="location-content-actions">${actions}</div></header>${directItemsSection(entries,sectionTitle,empty,hide)}</section>`;}

function hierarchyHeader(title, icon, meta, backLabel, backAction, addLabel = "", addType = "") {
  return `<div class="inventory-detail-return-row"><button class="ghost-btn inventory-back-btn" type="button" data-hierarchy-back><span aria-hidden="true">←</span> ${escapeHtml(backLabel)}</button></div><header class="inventory-detail-header"><div class="inventory-detail-title location-detail-title">${icon ? `<span class="room-icon" aria-hidden="true">${icon}</span>` : ""}<div class="location-detail-title-text"><h3>${escapeHtml(title)}</h3><div class="inventory-detail-meta"><span>${escapeHtml(meta)}</span></div></div></div>${addLabel ? `<div class="detail-actions inventory-detail-actions"><button class="primary-btn compact-btn" type="button" data-add-hierarchy="${addType}">${escapeHtml(addLabel)}</button></div>` : ""}</header>`;
}
function directItemsSection(entries, title, emptyText, hidePathColumns = false) { return `<section class="hierarchy-direct-items"><h4>${escapeHtml(title)}</h4>${entries.length ? renderLocationDetailTable(entries,{hidePathColumns}) : `<div class="location-detail-empty"><p>${escapeHtml(emptyText)}</p></div>`}</section>`; }
function allItemsButton() { return `<button class="ghost-btn hierarchy-all-items" type="button" data-show-all-items>${locationScopeMode === "all" ? "Afficher uniquement les items directs" : "Afficher tous les items"}</button>`; }

function renderLocationPrintButton(scope, id) {
  return `<button class="ghost-btn hierarchy-print-btn" type="button" onclick="printLocationInventory('${escapeHtml(scope)}','${escapeHtml(id)}')"><span aria-hidden="true">🖨️</span> Imprimer</button>`;
}

function resolveHierarchyPrintTarget(scope, id) {
  if (scope === "room") { const room = hierarchyRoom(id); return { room, location: null, sub: null, entries: room ? roomEntries(id) : [] }; }
  if (scope === "location") { const location = hierarchyLocation(id), room = hierarchyRoom(location?.roomId); return { room, location, sub: null, entries: location ? locationEntries(id) : [] }; }
  const sub = hierarchySublocation(id), location = hierarchyLocation(sub?.locationId), room = hierarchyRoom(location?.roomId);
  return { room, location, sub, entries: sub ? sublocationEntries(id) : [] };
}

function printPlacementLocationParts(placement, scope) {
  const location = placement?.locationId ? hierarchyLocation(placement.locationId) : null;
  const sub = placement?.sublocationId ? hierarchySublocation(placement.sublocationId) : null;
  if (scope === "room") return [location?.name, sub?.name].filter(Boolean);
  if (scope === "location") return [sub?.name].filter(Boolean);
  return [];
}

function printQuantityLabel(record) {
  const tracking = StockTracking.normalizeTracking(record);
  if (tracking.mode !== "containers") return formatInventoryCardQuantity(record.quantity, record.unit);
  const outer = tracking.packagingLevels[0];
  const aliquots = StockTracking.normalizeAliquots(record);
  const closed = tracking.closedByLocation.reduce((sum, row) => sum + row.quantity, 0);
  const opened = tracking.openContainers.filter(row => row.status === "open");
  const aliquotCount = aliquots.preparations.filter(row => row.status === "active").reduce((sum, prep) => sum + prep.locations.reduce((n, row) => n + row.quantity, 0), 0);
  const parts = [];
  if (closed) parts.push(`${closed} ${StockTracking.plural(closed, outer.singular, outer.plural)} fermé${closed > 1 ? "s" : ""}`);
  if (opened.length) {
    const unit = StockTracking.trackingLevel(tracking), remaining = StockTracking.fromBaseQuantity(opened.reduce((sum, row) => sum + row.remaining, 0), tracking);
    parts.push(`${opened.length} ${StockTracking.plural(opened.length, outer.singular, outer.plural)} ouvert${opened.length > 1 ? "s" : ""} (${StockTracking.format(remaining)} ${StockTracking.plural(remaining, unit.singular, unit.plural)} restants)`);
  }
  if (aliquotCount) parts.push(`${aliquotCount} aliquote${aliquotCount > 1 ? "s" : ""}`);
  return escapeHtml(parts.join(" · ") || "Aucun stock");
}

function printLocationInventory(scope, id) {
  const printArea = document.querySelector("#printArea");
  const target = resolveHierarchyPrintTarget(scope, id);
  if (!printArea || !target.room) return;
  const path = [target.room.name, target.location?.name, target.sub?.name].filter(Boolean);
  const locationEligible = scope !== "sublocation";
  const itemRows = new Map();
  target.entries.forEach(entry => {
    const key = entry.record.id;
    if (!itemRows.has(key)) itemRows.set(key, { record: entry.record, locations: new Set() });
    const parts = locationEligible ? printPlacementLocationParts(entry.placement, scope) : [];
    itemRows.get(key).locations.add(parts.join("\n") || "—");
  });
  const sortedRows = Array.from(itemRows.values()).sort((a, b) => String(a.record.name || "").localeCompare(String(b.record.name || ""), "fr", { sensitivity: "base" }));
  const rowsWithLocationText = sortedRows.map(row => ({ ...row, locationText: Array.from(row.locations).join("\n\n") }));
  const distinctLocations = new Set(rowsWithLocationText.map(row => row.locationText));
  const showLocationColumn = locationEligible && distinctLocations.size > 1;
  const columnCount = showLocationColumn ? 6 : 5;
  const rows = rowsWithLocationText
    .map(({ record, locationText }) => {
      const references = normalizeReferences(record.references);
      const quantity = printQuantityLabel(record);
      const locationCell = showLocationColumn ? `<td>${escapeHtml(locationText).replace(/\n/g, "<br>")}</td>` : "";
      return `<tr><td>${escapeHtml(record.name || "")}</td>${locationCell}<td>${escapeHtml(references.primary.reference || "—")}<br>${escapeHtml(references.primary.supplier || "—")}</td><td>${quantity}</td><td class="print-blank-cell"></td><td class="print-blank-cell"></td></tr>`;
    }).join("");
  printArea.innerHTML = `
    <header class="print-header">
      <h1>${escapeHtml(path.join(" → "))}</h1>
      <p>Inventaire imprimé le ${escapeHtml(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date()))} par ${escapeHtml(currentName)}</p>
    </header>
    <table class="print-table">
      <thead><tr><th>Nom de l’item</th>${showLocationColumn ? "<th>Localisation</th>" : ""}<th>Référence</th><th>Quantité</th><th>Quantité réelle</th><th>Remarques</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${columnCount}">Aucun item enregistré à cet emplacement.</td></tr>`}</tbody>
    </table>
  `;
  window.print();
}

let hierarchyCreationPending = false;
let hierarchyEntityContext = null;
function openHierarchyEntityModal(type, entityId = null) {
  const dialog=document.querySelector("#hierarchyEntityDialog"), form=document.querySelector("#hierarchyEntityForm"), input=document.querySelector("#hierarchyEntityName"), error=document.querySelector("#hierarchyEntityError"), entity=type==="location"?hierarchyLocation(entityId):hierarchySublocation(entityId);
  hierarchyEntityContext={type,entityId}; hierarchyCreationPending=false; form.reset(); input.value=entity?.name||""; error.textContent=""; error.classList.add("hidden"); document.querySelector("#hierarchyEntityTitle").textContent=`${entity?"Modifier":"Ajouter"} ${type==="location"?"une localisation":"une sous-localisation"}`; document.querySelector("#saveHierarchyEntityBtn").disabled=false; dialog.showModal(); window.setTimeout(()=>input.focus(),0);
}
function closeHierarchyEntityModal(){const dialog=document.querySelector("#hierarchyEntityDialog");if(dialog?.open)dialog.close();hierarchyEntityContext=null;hierarchyCreationPending=false;}
function saveHierarchyEntity(event){
  event.preventDefault(); if(hierarchyCreationPending||!hierarchyEntityContext)return; const input=document.querySelector("#hierarchyEntityName"),error=document.querySelector("#hierarchyEntityError"),button=document.querySelector("#saveHierarchyEntityBtn"),name=input.value.trim().replace(/\s+/g," ");
  if(!name){input.setCustomValidity("Le titre est obligatoire.");input.reportValidity();return;} input.setCustomValidity(""); const {type,entityId}=hierarchyEntityContext,catalog=hierarchyCatalog(),siblings=type==="location"?catalog.locations.filter(row=>row.roomId===selectedRoomId):catalog.sublocations.filter(row=>row.locationId===selectedLocationId);
  if(siblings.some(row=>row.id!==entityId&&row.name===name)){error.textContent="Ce titre existe déjà sous ce parent.";error.classList.remove("hidden");return;}
  hierarchyCreationPending=true;button.disabled=true;if(entityId){const collection=type==="location"?catalog.locations:catalog.sublocations,entity=collection.find(row=>row.id===entityId);entity.name=name;}else if(type==="location")catalog.locations.push({id:newStableId("location"),roomId:selectedRoomId,name,icon:"📍"});else catalog.sublocations.push({id:newStableId("sublocation"),locationId:selectedLocationId,name});
  sharedState.locationCatalog=catalog;
  if(entityId) items=items.map(item=>{if(!(item.placements||[]).some(row=>type==="location"?row.locationId===entityId:row.sublocationId===entityId))return item;const names=Array.from(new Set(item.placements.map(placementDisplayName).filter(Boolean)));return{...item,locations:names,location:names[0]||""};});
  addHistory(entityId?"Emplacement modifié":type==="location"?"Localisation ajoutée":"Sous-localisation ajoutée",`${currentName} a ${entityId?"renommé":"ajouté"} ${name}.`);persist();closeHierarchyEntityModal();renderLocations();
}
document.querySelector("#hierarchyEntityForm")?.addEventListener("submit",saveHierarchyEntity);
document.querySelectorAll("[data-close-hierarchy-entity]").forEach(button=>button.addEventListener("click",closeHierarchyEntityModal));

function reparentItemsForHierarchyDeletion(sourceItems,type,id){
  return sourceItems.map(item=>{let changed=false;const deduped=[],seen=new Set();(item.placements||[]).forEach(placement=>{let next={...placement};if(type==="sublocation"&&placement.sublocationId===id){next.sublocationId=null;changed=true;}else if(type==="location"&&placement.locationId===id){next.locationId=null;next.sublocationId=null;changed=true;}const key=`${next.roomId||""}|${next.locationId||""}|${next.sublocationId||""}`;if(!seen.has(key)){seen.add(key);deduped.push(next);}});return changed?{...item,placements:deduped}:item;});
}
function requestHierarchyDeletion(type,id,trigger){
  const catalog=hierarchyCatalog(),entity=type==="location"?hierarchyLocation(id):hierarchySublocation(id);if(!entity)return;
  const parentLocation=type==="sublocation"?hierarchyLocation(entity.locationId):null,room=hierarchyRoom(type==="location"?entity.roomId:parentLocation?.roomId),affected=type==="location"?locationEntries(id):sublocationEntries(id),count=uniqueEntryCount(affected),destination=type==="location"?room?.name:`${room?.name} > ${parentLocation?.name}`;
  const message=type==="location"?`${count?`Cette localisation contient ${formatLocationCount(count,"item")}. Ils seront déplacés vers « ${room?.name} ». Aucun item ne sera supprimé. `:""}Les sous-localisations associées seront également supprimées.`:`${count?`Cette sous-localisation contient ${formatLocationCount(count,"item")}. Ils seront déplacés vers « ${destination} ». Aucun item ne sera supprimé.`:"Cette sous-localisation est vide."}`;
  openDeleteConfirmation({title:`Supprimer ${type==="location"?"la localisation":"la sous-localisation"} « ${entity.name} » ?`,message,confirmText:"Supprimer",trigger,onConfirm:()=>{
    const previousItems=items,previousCatalog=sharedState.locationCatalog;
    try{
      const nextItems=reparentItemsForHierarchyDeletion(items,type,id),nextCatalog=hierarchyCatalog();
      if(type==="location"){nextCatalog.locations=nextCatalog.locations.filter(row=>row.id!==id);nextCatalog.sublocations=nextCatalog.sublocations.filter(row=>row.locationId!==id);}else nextCatalog.sublocations=nextCatalog.sublocations.filter(row=>row.id!==id);
      sharedState.locationCatalog=nextCatalog;items=nextItems.map(item=>{if(item===previousItems.find(row=>row.id===item.id))return item;const names=Array.from(new Set((item.placements||[]).map(placementDisplayName).filter(Boolean)));return{...item,locations:names,location:names[0]||""};});
      const orphan=items.some(item=>(item.placements||[]).some(row=>type==="location"?(row.locationId===id||nextCatalog.sublocations.some(sub=>sub.locationId===id&&row.sublocationId===sub.id)):row.sublocationId===id));
      if(orphan)throw new Error("La réaffectation des items n’a pas pu être vérifiée.");
      if(type==="location"){selectedLocationId=null;selectedSublocationId=null;}else selectedSublocationId=null;
      addHistory("Emplacement supprimé",`${currentName} a supprimé ${entity.name}. ${count?`${formatLocationCount(count,"item")} remonté${count>1?"s":""} vers ${destination}.`:""}`);persist();renderLocations();
    }catch(error){items=previousItems;sharedState.locationCatalog=previousCatalog;throw error;}
  }});
}

function openSublocationItemPicker(){
  const pickerDialog=document.querySelector("#sublocationItemDialog"),input=document.querySelector("#sublocationItemSearch"),error=document.querySelector("#sublocationItemError");
  input.value=""; error.textContent=""; error.classList.add("hidden"); renderSublocationItemResults(); pickerDialog.showModal(); window.setTimeout(()=>input.focus(),0);
}
function renderSublocationItemResults(){
  const input=document.querySelector("#sublocationItemSearch"),host=document.querySelector("#sublocationItemResults"),clearButton=document.querySelector("#clearSublocationItemSearch"),query=normalizeSearch(input?.value||"");
  clearButton?.classList.toggle("hidden",!query);
  if(!query){host.innerHTML=`<p class="sublocation-search-state">Saisissez un nom ou une référence pour rechercher un item.</p>`;return;}
  const matches=items.filter(item=>{
    const references=normalizeReferences(item?.references),name=normalizeSearch(item?.name),reference=normalizeSearch(references.primary.reference);
    return name.includes(query)||reference.includes(query);
  });
  host.innerHTML=matches.length?matches.map(item=>{
    const reference=normalizeReferences(item.references).primary.reference;
    return `<article class="sublocation-item-result" role="option">
      <div class="sublocation-item-result-copy"><strong>${escapeHtml(item.name||"Item sans nom")}</strong><span>Réf. principale : ${escapeHtml(reference||"Non renseignée")}${item.category?` · ${escapeHtml(item.category)}`:""}</span></div>
      <button class="ghost-btn compact-btn" type="button" data-pick-sublocation-item="${escapeHtml(item.id)}">Sélectionner</button>
    </article>`;
  }).join(""):`<p class="sublocation-search-state">Aucun item trouvé pour cette recherche.</p>`;
  host.querySelectorAll("[data-pick-sublocation-item]").forEach(button=>button.addEventListener("click",()=>selectSublocationItem(button.dataset.pickSublocationItem)));
}
function selectSublocationItem(id){const item=items.find(row=>row.id===id),sub=hierarchySublocation(selectedSublocationId),location=hierarchyLocation(sub.locationId),placement={id:newStableId("placement"),roomId:location.roomId,locationId:location.id,sublocationId:sub.id},duplicate=(item.placements||[]).some(row=>row.roomId===placement.roomId&&row.locationId===placement.locationId&&row.sublocationId===placement.sublocationId);if(duplicate){const error=document.querySelector("#sublocationItemError");error.textContent="Cet item est déjà présent dans cette sous-localisation.";error.classList.remove("hidden");return;}document.querySelector("#sublocationItemDialog").close();openModal(id,{targetPlacement:placement});}
document.querySelector("#sublocationItemSearch")?.addEventListener("input",renderSublocationItemResults);
document.querySelector("#clearSublocationItemSearch")?.addEventListener("click",()=>{const input=document.querySelector("#sublocationItemSearch");input.value="";renderSublocationItemResults();input.focus();});
document.querySelectorAll("[data-close-sublocation-item]").forEach(button=>button.addEventListener("click",()=>document.querySelector("#sublocationItemDialog")?.close()));
function bindHierarchyEvents(grid) {
  const selectRow=row=>{if(row.dataset.roomId){selectedRoomId=row.dataset.roomId;selectedLocationId=null;selectedSublocationId=null;}else if(row.dataset.locationId){selectedLocationId=row.dataset.locationId;selectedSublocationId=null;}else if(row.dataset.sublocationId)selectedSublocationId=row.dataset.sublocationId;locationScopeMode="direct";resetLocationDetailState();renderLocations();};
  grid.querySelectorAll(".location-explorer-row").forEach(row=>{row.addEventListener("click",event=>{if(!event.target.closest("button"))selectRow(row);});row.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&!event.target.closest("button")){event.preventDefault();selectRow(row);}});});
  grid.querySelectorAll("[data-breadcrumb-level]").forEach(button=>button.onclick=()=>{const level=button.dataset.breadcrumbLevel;if(level==="all"){selectedRoomId=null;selectedLocationId=null;selectedSublocationId=null;}else if(level==="room"){selectedLocationId=null;selectedSublocationId=null;}else selectedSublocationId=null;locationScopeMode="direct";renderLocations();});
  grid.querySelectorAll("[data-toggle-location-menu]").forEach(button=>button.onclick=event=>{event.stopPropagation();const menu=button.nextElementSibling,willOpen=menu.classList.contains("hidden");grid.querySelectorAll(".location-actions-popover").forEach(row=>row.classList.add("hidden"));grid.querySelectorAll("[data-toggle-location-menu]").forEach(row=>row.setAttribute("aria-expanded","false"));menu.classList.toggle("hidden",!willOpen);button.setAttribute("aria-expanded",String(willOpen));});
  grid.querySelector("[data-show-all-items]")?.addEventListener("click",()=>{locationScopeMode=locationScopeMode==="all"?"direct":"all";renderLocations();});
  grid.querySelectorAll("[data-add-hierarchy]").forEach(button=>button.addEventListener("click",event=>{const type=event.currentTarget.dataset.addHierarchy;if(type!=="item"){openHierarchyEntityModal(type);return;}if(!selectedRoomId)return;openModal(null,{prefill:{roomId:selectedRoomId,locationId:selectedLocationId||null,sublocationId:selectedSublocationId||null}});}));
  grid.querySelectorAll("[data-edit-hierarchy]").forEach(button=>button.onclick=()=>{const type=button.dataset.editHierarchy,card=button.closest(type==="location"?"[data-location-id]":"[data-sublocation-id]");openHierarchyEntityModal(type,card.dataset[`${type}Id`]);});
  grid.querySelectorAll("[data-delete-hierarchy]").forEach(button=>button.onclick=()=>{const type=button.dataset.deleteHierarchy,card=button.closest(type==="location"?"[data-location-id]":"[data-sublocation-id]");requestHierarchyDeletion(type,card.dataset[`${type}Id`],button);});
  grid.querySelectorAll("[data-move-hierarchy]").forEach(button=>button.onclick=()=>{
    const card=button.closest("[data-location-id],[data-sublocation-id]"),type=card.dataset.locationId?"location":"sublocation",id=card.dataset[`${type}Id`],catalog=hierarchyCatalog(),collection=type==="location"?catalog.locations:catalog.sublocations,entity=collection.find(row=>row.id===id),siblings=collection.filter(row=>type==="location"?row.roomId===entity.roomId:row.locationId===entity.locationId),ordered=siblings.map((row,index)=>({...row,_index:index})).sort((a,b)=>(a.order??Number.MAX_SAFE_INTEGER)-(b.order??Number.MAX_SAFE_INTEGER)||a._index-b._index),index=ordered.findIndex(row=>row.id===id),target=index+(button.dataset.moveHierarchy==="up"?-1:1);
    if(target<0||target>=ordered.length)return;
    [ordered[index],ordered[target]]=[ordered[target],ordered[index]];ordered.forEach((row,order)=>{collection.find(entry=>entry.id===row.id).order=order;});sharedState.locationCatalog=catalog;addHistory("Ordre des emplacements modifié",`${currentName} a déplacé ${entity.name}.`);persist();renderLocations();
  });
  grid.querySelectorAll("[data-update-stock]").forEach(button=>button.onclick=()=>{const item=items.find(row=>row.id===button.dataset.updateStock);usesAdvancedStockManager(item)?openStockManager(item.id):openStockModal(item.id);});
  grid.querySelectorAll("[data-edit-item]").forEach(button=>button.onclick=()=>openModal(button.dataset.editItem));
  grid.querySelectorAll("[data-open-entry]").forEach(button=>button.onclick=()=>openItemDetail(button.closest("tr").dataset.entryId,{view:"locations",location:selectedRoomId}));
}

function renderLocationDetailTable(entries,options={}) { const hide=Boolean(options.hidePathColumns),rows=entries.map(entry=>renderLocationDetailRow(entry,{hidePathColumns:hide}).replace(/<td data-label="Minimum">[\s\S]*?<\/td>/,""));return `<div class="location-detail-table-wrap"><table class="location-detail-table ${hide?"location-detail-table--direct-room":""}"><thead><tr><th>Référence</th><th>Stock actuel</th><th>Statut</th><th>Tags</th>${hide?"":"<th>Localisation</th><th>Sous-localisation</th>"}<th>Actions</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`; }
function renderLocationDetailRow(entry,options={}) {
  const record=entry.record, status=getLocationEntryStatus(entry), displayed=getLocationDisplayedStatus(entry), location=hierarchyLocation(entry.placement?.locationId), sub=hierarchySublocation(entry.placement?.sublocationId), tracking=StockTracking.normalizeTracking(record), total=StockTracking.available(record), primaryUnit=tracking.mode==="containers"?tracking.packagingLevels[0]:StockTracking.normalizeUnitLabel(record.unit), current=`${StockTracking.format(total)} ${escapeHtml(StockTracking.plural(total,primaryUnit.singular,primaryUnit.plural))}`, minimum=status==="undefined"?"—":formatInventoryCardQuantity(record.minStock,record.unit);
  const pathCells=options.hidePathColumns?"":`<td data-label="Localisation">${escapeHtml(location?.name||"-")}</td><td data-label="Sous-localisation">${escapeHtml(sub?.name||"-")}</td>`;
  return `<tr class="location-detail-row" tabindex="0" data-entry-kind="inventory" data-entry-id="${escapeHtml(record.id)}"><td data-label="Référence"><button class="location-reference-button" type="button" data-open-entry><span class="location-reference-title">${renderRoutineStar(record)}<strong>${escapeHtml(record.name)}</strong></span><span>${escapeHtml(record.category||"")}</span></button></td><td data-label="Stock actuel"><strong>${current}</strong></td><td data-label="Minimum">${minimum}</td><td data-label="Statut"><span class="location-status-badge ${displayed.className}">${escapeHtml(displayed.label)}</span></td><td data-label="Tags"><div class="location-table-tags">${(record.tags||[]).length?(record.tags||[]).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join(""):`<span class="location-no-tags">Aucun tag</span>`}</div></td>${pathCells}<td data-label="Actions"><div class="location-row-actions"><button class="primary-btn compact-btn" type="button" data-update-stock="${escapeHtml(record.id)}">Mettre à jour le stock</button><button class="ghost-btn compact-btn" type="button" data-edit-item="${escapeHtml(record.id)}">Modifier</button></div></td></tr>`;
}

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
