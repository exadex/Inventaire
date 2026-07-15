// Estructura de datos:
// seedBaseItems viene del repositorio y solo sirve como bootstrap/default.
// sharedState contiene los datos vivos: inventario, experimentos, pedidos, muestras e historial.
// GitHub shared_data.json es la fuente compartida; localStorage solo sirve como cache/fallback.

const clientSampleTypes = {
  client_product: "Produit reçu du client",
  created_sample: "Échantillon créé"
};

const clientSampleCategories = ["Galette agarose", "Secretion", "ARN", "Tissu"];

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
let clientSamples = migrateClientSamples(sharedState.clientSamples);
let clients = migrateClients(sharedState.clients, clientSamples);

const sharedDataReady = hydrateSharedData();

let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";
let alertsExpanded = false;
let selectedLocation = null;
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
let selectedItemId = null;
let selectedSampleId = null;
let itemReturnContext = { view: "inventory", experimentId: null, location: null, scrollY: 0 };
let sampleReturnContext = { view: "samples", location: null, scrollY: 0 };
let viewReturnScrollY = { experiments: 0, locations: 0 };
let selectedOrderId = null;
let ordersMode = "board";
let orderHistorySearch = "";
let orderHistoryStatus = "all";
let orderHistoryRequester = "all";
let orderHistoryPeriod = "all";
let orderHistorySort = "newest";
let orderHistoryPage = 1;
let orderHistoryPageSize = 50;
let pendingOrderInventoryLink = null;
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
const sampleSearchInput = document.querySelector("#sampleSearchInput");
const sampleTypeFilter = document.querySelector("#sampleTypeFilter");
const sampleCategoryFilter = document.querySelector("#sampleCategoryFilter");
const sampleClientFilter = document.querySelector("#sampleClientFilter");
const sampleSortSelect = document.querySelector("#sampleSortSelect");
const addClientStudyBtn = document.querySelector("#addClientStudyBtn");
const sampleDialog = document.querySelector("#sampleDialog");
const sampleForm = document.querySelector("#sampleForm");
const experimentSearchInput = document.querySelector("#experimentSearchInput");
const experimentStatusFilter = document.querySelector("#experimentStatusFilter");
const dialog = document.querySelector("#itemDialog");
const form = document.querySelector("#itemForm");
const stockDialog = document.querySelector("#stockDialog");
const stockForm = document.querySelector("#stockForm");
const experimentDialog = document.querySelector("#experimentDialog");
const experimentForm = document.querySelector("#experimentForm");
const experimentItemsList = document.querySelector("#experimentItemsList");
const orderDialog = document.querySelector("#orderDialog");
const orderForm = document.querySelector("#orderForm");
const secondaryReferencesList = document.querySelector("#secondaryReferencesList");
const addSecondaryReferenceBtn = document.querySelector("#addSecondaryReferenceBtn");
const locationDropdown = document.querySelector("#locationDropdown");
const locationTrigger = document.querySelector("#locationTrigger");
const locationTriggerText = document.querySelector("#locationTriggerText");
const locationMenu = document.querySelector("#locationMenu");
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
  "location",
  "tags",
  "notes",
  "primarySupplier",
  "primaryReference",
  "primaryLink",
  "primaryReferenceNotes",
  "primaryPrice",
  "primaryUnitPrice",
  "primaryLeadTime"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const stockFields = ["stockItemId", "stockItemName", "stockCurrentQuantity", "stockTitle", "stockAction", "stockAmount", "stockUnit", "stockNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const sampleFields = [
  "sampleId",
  "sampleType",
  "sampleClientCode",
  "sampleProductName",
  "sampleBaseName",
  "sampleCategory",
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
document.querySelector("#deleteItemBtn").addEventListener("click", deleteItem);
document.querySelector("#saveSampleBtn").addEventListener("click", saveSample);
document.querySelector("#deleteSampleBtn").addEventListener("click", deleteSample);
document.querySelector("#saveStockBtn").addEventListener("click", saveStockUpdate);
document.querySelector("#addExperimentBtn").addEventListener("click", openExperimentModal);
document.querySelector("#saveExperimentBtn").addEventListener("click", saveExperiment);

const deleteExperimentBtn = document.querySelector("#deleteExperimentBtn");
if (deleteExperimentBtn) {
  deleteExperimentBtn.addEventListener("click", deleteExperiment);
}

dialog.addEventListener("close", () => {
  pendingOrderInventoryLink = null;
});

document.querySelector("#addExperimentItemBtn").addEventListener("click", () =>
  addExperimentItemRow({}, { showInventorySelect: true })
);
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
document.querySelector("#closeOrderDialogBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#cancelOrderBtn").addEventListener("click", () => orderDialog.close());
orderFields.orderItemMode.addEventListener("change", toggleOrderModeFields);
orderFields.orderInventorySearch.addEventListener("input", renderOrderItemOptions);
searchInput.addEventListener("input", renderInventory);
categoryFilter.addEventListener("change", renderInventory);
inventorySortSelect?.addEventListener("change", renderInventory);
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
sampleFields.sampleType.addEventListener("change", syncSampleFormVisibility);
sampleFields.sampleCategory.addEventListener("change", syncSampleMeasureLabel);
sampleFields.sampleClientCode.addEventListener("input", updateClientCodeHint);
experimentSearchInput.addEventListener("input", renderExperiments);
experimentStatusFilter.addEventListener("change", renderExperiments);
experimentDialog.addEventListener("close", () => {
  experimentFields.experimentTemplate.disabled = false;
});
experimentFields.experimentTemplate.addEventListener("change", () => {
  const template = protocolTemplates.find(
    entry => entry.id === experimentFields.experimentTemplate.value
  );

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
    hydrateExperimentItemRow(event.target.closest(".experiment-item-row"), event.target.value);
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
    selectedLocation = null;
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
    } else if (activeView === "locations") {
      renderLocations();
    } else if (activeView === "orders") {
      renderOrders();
    } else if (activeView === "history") {
      renderHistory();
    } else if (activeView === "samples") {
      renderSamples();
    }
  });
});

// Listeners para dialogo de recepcion de inventario al recibir una orden
document.querySelector("#confirmReceiveInventoryBtn").addEventListener("click", confirmReceiveInventory);
document.querySelector("#closeReceiveInventoryDialogBtn").addEventListener("click", () => receiveInventoryDialog.close());
document.querySelector("#cancelReceiveInventoryBtn").addEventListener("click", () => receiveInventoryDialog.close());

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

  return {
    version: 1,
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
    history: Array.isArray(source.history)
      ? source.history
      : bootstrap?.history || [],
    updatedAt: source.updatedAt || bootstrap?.updatedAt || ""
  };
}

function hasSharedDataPayload(data) {
  if (!data || typeof data !== "object") return false;

  return [
    data.inventoryItems,
    data.orders,
    data.experiments,
    data.clientSamples,
    data.clients,
    data.history
  ].some(value => Array.isArray(value)) || Boolean(data.updatedAt);
}

function applySharedState(incomingState) {
  if (!incomingState || typeof incomingState !== "object") return;

  sharedState = createSharedState(incomingState, { includeBootstrap: false });
  syncRuntimeStateFromShared();
  cacheSharedState();
  render();
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

window.addEventListener("focus", refreshSharedStateFromGithub);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshSharedStateFromGithub();
  }
});

setInterval(refreshSharedStateFromGithub, 30000);

function syncRuntimeStateFromShared() {
  sharedState.inventoryItems = migrateItems(sharedState.inventoryItems);
  sharedState.experiments = migrateExperiments(sharedState.experiments);
  sharedState.orders = Array.isArray(sharedState.orders) ? sharedState.orders : [];
  sharedState.clientSamples = migrateClientSamples(sharedState.clientSamples);
  sharedState.clients = migrateClients(sharedState.clients, sharedState.clientSamples);
  sharedState.clientSamples = hydrateClientIdentityForSamples(sharedState.clientSamples, sharedState.clients);
  sharedState.history = Array.isArray(sharedState.history) ? sharedState.history : [];

  items = buildItems();
  orders = sharedState.orders;
  experiments = sharedState.experiments;
  clientSamples = sharedState.clientSamples;
  clients = sharedState.clients;
  history = sharedState.history;
}

function syncSharedStateFromRuntime() {
  sharedState.inventoryItems = migrateItems(items);
  sharedState.experiments = migrateExperiments(experiments);
  sharedState.orders = Array.isArray(orders) ? orders : [];
  sharedState.clientSamples = migrateClientSamples(clientSamples);
  sharedState.clients = migrateClients(clients, sharedState.clientSamples);
  sharedState.clientSamples = hydrateClientIdentityForSamples(sharedState.clientSamples, sharedState.clients);
  sharedState.history = Array.isArray(history) ? history : [];
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

    const result = await storage.loadSharedData();
    sharedDataMode = result.mode;
    sharedDataSha = result.sha;
    sharedDataRemoteReady = true;

    if (hasSharedDataPayload(result.data)) {
      sharedState = createSharedState(result.data, { includeBootstrap: false });
      syncRuntimeStateFromShared();
      cacheSharedState();
      sharedDataLastError = "";

      if (!app.classList.contains("hidden")) {
        render();
      }
    } else {
      sharedState = createSharedState(null, { includeBootstrap: true });
      syncRuntimeStateFromShared();
      cacheSharedState();

      if (result.mode === "github-write") {
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

      sharedDataIsSaving = true;
      renderAlerts();
      sharedDataSha = await storage.saveSharedData(sharedState, sharedDataSha);
      sharedDataMode = "github-write";
      sharedDataLastError = "";
      sharedDataHasUnsavedChanges = false;
      sharedDataRemoteReady = true;
    } catch (error) {
      sharedDataLastError = error.message || String(error);
      sharedDataHasUnsavedChanges = true;
      console.warn("Shared storage save failed.", error);
    } finally {
      sharedDataIsSaving = false;
      renderAlerts();
    }
  }, 400);
}

// guarda una copia cache local y publica el estado compartido en GitHub cuando esta configurado
function persist(options = {}) {
  syncSharedStateFromRuntime();
  cacheSharedState();
  sharedDataHasUnsavedChanges = true;

  if (!options.skipRemote) {
    scheduleSharedSave();
  }
}

function updateUserIdentity() {
  const userIcon = userIcons[currentName] || "👤";
  currentUser.textContent = userIcon;
  sidebarUser.textContent = userIcon;
  currentUserName.textContent = currentName;
  sidebarUserName.textContent = currentName;
}

const STOCK_WARNING_MULTIPLIER = 1.5;

function itemStatus(item) {
  const quantity = Number(item.quantity || 0);
  const minStock = Number(item.minStock || 0);

  if (minStock <= 0) return quantity < 0 ? "critical" : "ok";
  if (quantity <= minStock) return "critical";
  if (quantity <= minStock * STOCK_WARNING_MULTIPLIER) return "warning";
  return "ok";
}

function stockLevelPercent(item) {
  const quantity = Number(item.quantity || 0);
  const minStock = Number(item.minStock || 0);

  if (minStock <= 0) return quantity < 0 ? 0 : 100;

  return Math.max(
    0,
    Math.min(100, Math.round((quantity / (minStock * STOCK_WARNING_MULTIPLIER)) * 100))
  );
}

function statusLabel(status) {
  return { ok: "En stock", warning: "Attention", critical: "Critique" }[status];
}

function statusLabelExperiment(status) {
  return { draft: "Draft", running: "Running", completed: "Completed" }[status] || status;
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
  experimentFields.experimentTemplate.innerHTML = protocolTemplates
    .map(template => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`)
    .join("");
}

function renderMetrics() {
  const counts = items.reduce((acc, item) => {
    acc[itemStatus(item)] += 1;
    return acc;
  }, { ok: 0, warning: 0, critical: 0 });
  document.querySelector("#metrics").innerHTML = [
    ["Total references", items.length, ""],
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
  const critical = items.filter(item => itemStatus(item) === "critical");
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
        <div class="alert">
          ⚠ ${escapeHtml(item.name)} - Rupture / critique : ${item.quantity} ${escapeHtml(item.unit)} restants / min. ${item.minStock} ${escapeHtml(item.unit)}
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
}

function renderSharedDataAlert() {
  if (sharedDataLastError) {
    return `
      <div class="alert shared-data-alert">
        Données partagées non sauvegardées sur GitHub : ${escapeHtml(sharedDataLastError)}
      </div>
    `;
  }

  if (sharedDataIsSaving) {
    return `
      <div class="alert shared-data-alert saving">
        Synchronisation GitHub en cours...
      </div>
    `;
  }

  if (sharedDataHasUnsavedChanges && sharedDataMode !== "github-write") {
    return `
      <div class="alert shared-data-alert">
        Modifications en cache local uniquement : la sauvegarde GitHub n'est pas active.
      </div>
    `;
  }

  return "";
}

function renderInventory() {
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
        (category === "all" || item.category === category);
    })
    .sort((a, b) => compareInventoryItems(a, b, sort));

  document.querySelector("#resultCount").textContent =
    `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;

  const detail = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(detail));

  document.querySelector("#inventoryDetail").innerHTML = detail
    ? renderInventoryDetail(detail)
    : "";

  controlBar.classList.toggle("hidden", activeView !== "inventory" || Boolean(detail));
  document.querySelector("#inventoryGrid").classList.toggle("hidden", Boolean(detail));

  document.querySelector("#inventoryGrid").innerHTML = filtered.map((item) => {
    const status = itemStatus(item);
    const percent = stockLevelPercent(item);

    return `
      <article class="item-card item-preview-card" onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'inventory' })">
        <div class="item-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
        </div>

        <span class="category">${escapeHtml(item.category)}</span>

        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>

        <div class="stock-line">
          <span>${formatInventoryCardQuantity(item.quantity, item.unit)}</span>
          <span>Min ${formatInventoryCardQuantity(item.minStock, item.unit)}</span>
        </div>

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
              onclick="event.stopPropagation(); openStockModal('${escapeHtml(item.id)}')"
            >
              Mettre à jour le stock
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
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
  const locations = formatLocations(item);

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
          <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
          <h3>${escapeHtml(item.name)}</h3>
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
          <button class="primary-btn compact-btn" type="button" onclick="openStockModal('${escapeHtml(item.id)}')">
            Mettre à jour le stock
          </button>
        </div>
      </div>

      ${renderStockVisualCard(item)}

      <div class="inventory-detail-secondary-grid">
        ${renderInventoryReferencesPanel(references)}
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
        <p>${escapeHtml(item.notes)}</p>
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

function renderInventoryReferencesPanel(references) {
  const primaryRows = [
    renderReferenceRow("Fournisseur", references.primary.supplier),
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

function renderReferenceRow(label, value, options = {}) {
  if (!value || !String(value).trim()) return "";

  return `
    <div class="item-detail-row reference-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value reference-detail-value">
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
  const status = itemStatus(item);
  const visualType = getStockVisualType(item);
  const quantity = Number(item.quantity || 0);
  const minimum = Number(item.minStock || 0);
  const hasMinimum = minimum > 0;
  const visualPercent = hasMinimum
    ? Math.min(100, Math.max(0, (quantity / Math.max(quantity, minimum * 2, 1)) * 100))
    : (quantity > 0 ? 70 : 0);
  const unitSingular = formatInventoryDisplayUnit(1, item.unit);
  const currentUnit = formatInventoryDisplayUnit(quantity, item.unit);
  const minimumUnit = formatInventoryDisplayUnit(minimum, item.unit);
  const quantityValue = escapeHtml(formatCleanNumber(quantity));
  const minimumValue = escapeHtml(formatCleanNumber(minimum));
  const health = stockHealthText(status, hasMinimum);
  const interpretation = stockInterpretationText(quantity, minimum, unitSingular, currentUnit);

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

        ${hasMinimum ? renderStockThresholdScale(quantity, minimum, currentUnit, status) : ""}
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
      description: "Le stock approche du seuil minimum."
    };
  }

  return {
    title: "Stock sain",
    description: "Le stock est au-dessus du minimum."
  };
}

function stockInterpretationText(quantity, minimum, unitSingular, currentUnit) {
  const safeQuantity = Math.max(0, Number(quantity || 0));
  const safeMinimum = Number(minimum || 0);

  if (safeMinimum <= 0) {
    return {
      state: "neutral",
      text: `${formatCleanNumber(safeQuantity)} ${currentUnit} disponible${safeQuantity > 1 ? "s" : ""}`
    };
  }

  const difference = Number((safeQuantity - safeMinimum).toFixed(3));
  const absDifference = Math.abs(difference);
  const diffUnit = formatInventoryDisplayUnit(absDifference, unitSingular);

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

function renderStockThresholdScale(quantity, minimum, unit, status) {
  const maxValue = Math.max(quantity, minimum * 2, 1);
  const currentPercent = Math.max(0, Math.min(100, (quantity / maxValue) * 100));
  const minimumPercent = Math.max(0, Math.min(100, (minimum / maxValue) * 100));

  return `
    <div
      class="stock-threshold-scale ${status}"
      style="--stock-current:${currentPercent}%; --stock-minimum:${minimumPercent}%"
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
    </div>
  `;
}

function formatCleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return String(value || "");
  return Number(number.toFixed(3)).toString();
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
          <button class="primary-btn compact-btn" type="button" onclick="openStockModal('${escapeHtml(item.id)}')">
            Stock update
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
          <p>${escapeHtml(item.notes)}</p>
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
                  ${renderDetailRow("Fournisseur", references.primary.supplier)}
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

  if (refs.detail) {
    refs.detail.classList.toggle("has-selection", Boolean(detail));
    refs.detail.innerHTML = detail
      ? renderSampleDetail(detail)
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
  app.classList.toggle("samples-mode", activeView === "samples");
  app.classList.toggle("locations-mode", activeView === "locations");
  app.classList.toggle("orders-mode", activeView === "orders");
  app.classList.toggle("location-detail-mode", activeView === "locations" && Boolean(selectedLocation));
  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(selectedItemId));
}

function renderSampleDetail(sample) {
  const clientRecord = getClientForSample(sample);
  const clientCode = getSampleCanonicalClientCode(sample);
  const sampleSubtitle = sample.category || getClientSampleSubLabel(sample);

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

    ${sample.notes ? `
      <div class="client-detail-section">
        <h4>Notes</h4>
        <p>${escapeHtml(sample.notes)}</p>
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
  const firstSample = unit.samples[0];
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(firstSample)) || "—";
  const locations = Array.from(new Set(unit.samples.map(sample => sample.location).filter(Boolean)));
  const formattedQuantity = formatReplicaFamilyQuantity(unit.samples);

  return `
    <div class="replica-family-block">
      <button
        class="client-sample-row replica-family-row"
        type="button"
        aria-expanded="${isExpanded ? "true" : "false"}"
        onclick="toggleReplicaGroup('${escapeHtml(unit.key)}')"
      >
        <div class="client-sample-main">
          <strong title="${escapeHtml(unit.baseName)}">${escapeHtml(unit.baseName)}</strong>
          <div class="client-sample-subline">
            <span class="client-type-badge ${escapeHtml(firstSample.type)}">${escapeHtml(clientSampleTypes[firstSample.type] || firstSample.type)}</span>
            <span class="client-replica-count">${unit.count} réplicat${unit.count > 1 ? "s" : ""}</span>
            <span class="client-sample-cell-muted">${isExpanded ? "Replier" : "Déplier"}</span>
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

        <span class="client-table-cell">${escapeHtml(locations.join(", ") || "—")}</span>
        <span class="client-table-cell">${escapeHtml(formattedQuantity)}</span>
        <span class="client-table-cell">${escapeHtml(formattedDate)}</span>
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
  const isSelected = selectedSampleId === sample.id;
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(sample)) || "—";
  const formattedQuantity = formatSampleDisplayQuantity(sample) || "—";

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

      <span class="client-table-cell">${escapeHtml(sample.location || "—")}</span>
      <span class="client-table-cell">${escapeHtml(formattedQuantity)}</span>
      <span class="client-table-cell">${escapeHtml(formattedDate)}</span>
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

function deleteReplicaFamily(groupKey) {
  const familySamples = clientSamples.filter(sample => getReplicaFamilyKey(sample) === groupKey);
  if (!familySamples.length) return;

  const confirmed = window.confirm(
    `Êtes-vous sûre de vouloir supprimer ${familySamples.length} réplicat${familySamples.length > 1 ? "s" : ""} ?`
  );
  if (!confirmed) return;

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

  persist();
  render();
}

function deleteSampleFromDetail(id) {
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const confirmed = window.confirm(`Êtes-vous sûre de vouloir supprimer "${sample.name}" ?`);
  if (!confirmed) return;

  clientSamples = clientSamples.filter(entry => entry.id !== id);

  addHistory("Produit client supprimé", `${currentName} a supprimé ${sample.name} des études clients.`);
  selectedSampleId = null;
  persist();
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
  if (sample.type === "created_sample") return sample.category || "Échantillon créé";
  return [sample.referenceNumber, sample.lotNumber].filter(Boolean).join(" · ") || "Produit reçu du client";
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

  renderLocationMetrics(groups);

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
  return Number(entry.record.minStock || 0) <= 0 ? "undefined" : itemStatus(entry.record);
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
    : formatInventoryCardQuantity(record.quantity, record.unit);
  const minimum = status === "undefined" ? "—" : formatInventoryCardQuantity(record.minStock, record.unit);
  const tags = record.tags || [];

  return `
    <tr class="location-detail-row ${selectedLocationEntry === entryKey ? "is-selected" : ""}"
      tabindex="0" data-entry-kind="${escapeHtml(entry.kind)}" data-entry-id="${escapeHtml(record.id)}">
      <td data-label="Référence">
        <button class="location-reference-button" type="button" data-open-entry>
          <strong>${escapeHtml(record.name)}</strong>
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
    const context = { view: "locations", location: selectedLocation };
    if (row.dataset.entryKind === "clientSample") openSampleDetail(row.dataset.entryId, context);
    else openItemDetail(row.dataset.entryId, context);
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
    row.querySelector("[data-open-entry]")?.addEventListener("click", () => openEntry(row));
  });

  locationGrid.querySelectorAll("[data-update-stock]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    openStockModal(button.dataset.updateStock);
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

function renderLocationMetrics(groups) {
  const metricsContainer = document.querySelector("#locationMetrics");
  if (!metricsContainer) return;

  const zones = inventoryLocations.length;
  const localizedReferences = inventoryLocations.reduce(
    (total, place) => total + (groups[place]?.length || 0),
    0
  );
  const busiest = inventoryLocations
    .map(place => ({ place, count: groups[place]?.length || 0 }))
    .sort((a, b) => b.count - a.count || a.place.localeCompare(b.place, "fr"))[0];

  const metrics = [
    ["📍", "Zones de stockage", zones],
    ["📦", "Références localisées", localizedReferences],
    ["🏷️", "Zone la plus remplie", busiest ? `${busiest.place} · ${busiest.count}` : ""]
  ].filter(([, , value]) => value !== "");

  metricsContainer.innerHTML = metrics.map(([icon, label, value]) => `
    <article class="client-kpi-card">
      <span class="client-kpi-icon" aria-hidden="true">${icon}</span>
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    </article>
  `).join("");
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
  const input = event.target.closest?.('input[type="number"][data-quantity-step="1"]');
  if (!input || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;

  event.preventDefault();
  const current = input.value === "" ? 0 : Number(input.value);
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
              ${Number(item.minStock) > 0 ? renderDetailRow("Minimum", formatInventoryCardQuantity(item.minStock, item.unit)) : ""}
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

        ${item ? renderInventoryReferencesPanel(references) : ""}
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
        ${order.notes ? `<p class="order-card-note" title="${escapeHtml(order.notes)}">${escapeHtml(order.notes)}</p>` : ""}
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

function renderOrderItemOptions() {
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

  orderFields.orderInventoryItem.innerHTML = filtered
    .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("") || `<option value="">Aucun item trouvé</option>`;
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
  orderFields.orderInventoryItem.required = isExisting;
  orderFields.orderNewName.required = !isExisting;
}

function renderExperiments() {
  const query = normalizeSearch(experimentSearchInput.value);
  const status = experimentStatusFilter.value;
  const filtered = experiments.filter(experiment => {
    const haystack = normalizeSearch([experiment.name, experiment.templateName, experiment.createdBy, experiment.status].join(" "));
    return (!query || haystack.includes(query))
      && (status === "all" || experiment.status === status);
  });

  const detail = selectedExperimentId ? experiments.find(experiment => experiment.id === selectedExperimentId) : null;
  document.querySelector("#experimentDetail").innerHTML = detail ? renderExperimentDetail(detail) : "";
  document.querySelector("#experimentGrid").classList.toggle("hidden", Boolean(detail));

  const lists = {
    draft: document.querySelector("#draftExperimentList"),
    running: document.querySelector("#runningExperimentList"),
    completed: document.querySelector("#completedExperimentList")
  };

  const counts = {
    draft: document.querySelector("#draftExperimentCount"),
    running: document.querySelector("#runningExperimentCount"),
    completed: document.querySelector("#completedExperimentCount")
  };

  Object.values(lists).forEach(list => {
    if (list) list.innerHTML = "";
  });

  ["draft", "running", "completed"].forEach(state => {
    const stateExperiments = filtered.filter(experiment => experiment.status === state);
    if (counts[state]) counts[state].textContent = `(${stateExperiments.length})`;
    if (!lists[state]) return;

    lists[state].innerHTML = stateExperiments.length
      ? stateExperiments.map(renderExperimentCard).join("")
      : `<div class="empty-room">Aucune experience.</div>`;
  });
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

      <p>${escapeHtml(experiment.notes || "Aucune note")}</p>

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

function getExperimentTemplateNotes(experiment) {
  const template = protocolTemplates.find(entry => entry.id === experiment.templateId);
  return template?.notes || experiment.templateNotes || "";
}

function renderExperimentDetail(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const templateNotes = getExperimentTemplateNotes(experiment);
  const rows = getMergedExperimentLines(experiment.items).map(line => {
    const inventoryItem = findInventoryItem(line);
    const available = Number(inventoryItem?.quantity ?? 0);
    const needed = Number(line.quantity || 0);
    const comparable = inventoryItem && inventoryItem.unit === line.unit;
    const enough = comparable && available >= needed;
    const lowStock = comparable && (!enough || itemStatus(inventoryItem) !== "ok");
    const stateLabel = !inventoryItem
      ? "Manquant"
      : !comparable
        ? "Unite differente"
        : lowStock
          ? "Stock bas"
          : "Connecte";
    const stateClass = !inventoryItem || !comparable
      ? "alert"
      : lowStock
        ? "warning"
        : "ok";
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
                ${escapeHtml(line.name)}
              </button>`
            : `<strong>${escapeHtml(line.name)}</strong>`
        }
        <br>
        <span>${escapeHtml(line.notes || "")}</span>
      </td>
        <td>${formatQuantity(needed, line.unit)}</td>
        <td>${inventoryItem ? `${inventoryItem.quantity} ${escapeHtml(inventoryItem.unit)}` : "Non connecte"}</td>
        <td><span class="stock-pill ${stateClass}">${stateLabel}</span></td>
      </tr>
    `;
  }).join("");
  const canConsume = experiment.status !== "completed" && experimentStockSummary(experiment).ok;

  return `
    <section class="experiment-detail-panel">
      <div class="detail-topline">
        <button
          class="room-exit-btn"
          type="button"
          onclick="selectExperiment(null)"
          aria-label="Retour"
          title="Retour"
        >
          ↩️
        </button>
        <div class="detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openExperimentModal('${experiment.id}')">Modifier</button>
          <button class="primary-btn compact-btn" type="button" onclick="consumeExperimentStock('${experiment.id}')" ${canConsume ? "" : "disabled"}>Consommer le stock</button>
        </div>
      </div>
      <div class="experiment-detail-head">
        <div>
          <span class="experiment-status ${escapeHtml(experiment.status)}">${escapeHtml(statusLabelExperiment(experiment.status))}</span>
          <h3>${escapeHtml(experiment.name)}</h3>
          <p>${escapeHtml(experiment.templateName)} - ${experiment.conditions} conditions x ${experiment.replicates} replicats = ${totalConditions} conditions totales</p>
        </div>
        <small>Mis a jour par ${escapeHtml(experiment.createdBy)} - ${escapeHtml(experiment.updatedAt)}</small>
      </div>
      <div class="experiment-notes-grid">
        <div>
          <h4>Template Notes</h4>
          <p>${escapeHtml(templateNotes || "Aucune note de template")}</p>
        </div>
        <div>
          <h4>Experience Notes</h4>
          <p>${escapeHtml(experiment.notes || "Aucune note")}</p>
        </div>
      </div>
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
  return `
    <div class="item-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function getSelectedLocations() {
  return Array.from(
    locationMenu.querySelectorAll('input[type="checkbox"]:checked')
  ).map(input => input.value);
}

function setSelectedLocations(values = []) {
  locationMenu.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = values.includes(input.value);
  });
  syncLocationField();
}

function getItemLocations(item) {
  if (Array.isArray(item.locations)) return item.locations;
  if (item.location) return [item.location];
  return [];
}

function formatLocations(item) {
  const locations = getItemLocations(item);
  return locations.length ? locations.join(", ") : "Sans localisation";
}

function syncLocationField() {
  const selected = getSelectedLocations();
  fields.location.value = selected.join("|");
  locationTriggerText.textContent = selected.length
    ? selected.join(", ")
    : "Sélectionner une ou plusieurs localisations";
}

function renderLocationOptions() {
  locationMenu.innerHTML = inventoryLocations.map(location => `
    <label class="location-option">
      <input type="checkbox" value="${escapeHtml(location)}" />
      <span>${escapeHtml(location)}</span>
    </label>
  `).join("");

  locationMenu.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener("change", syncLocationField);
  });

  syncLocationField();
}

locationTrigger.addEventListener("click", () => {
  const isHidden = locationMenu.classList.contains("hidden");
  locationMenu.classList.toggle("hidden", !isHidden);
  locationTrigger.setAttribute("aria-expanded", String(isHidden));
});

document.addEventListener("click", event => {
  if (!locationDropdown.contains(event.target)) {
    locationMenu.classList.add("hidden");
    locationTrigger.setAttribute("aria-expanded", "false");
  }
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

function openSampleModal(id) {
  const sample = clientSamples.find(entry => entry.id === id);
  const sampleClientCode = sample ? getSampleCanonicalClientCode(sample) : "";

  sampleForm.reset();
  document.querySelector("#sampleModalTitle").textContent = sample
    ? "Modifier produit / échantillon client"
    : "Nouveau produit / échantillon client";
  document.querySelector("#deleteSampleBtn").style.display = sample ? "inline-block" : "none";

  sampleFields.sampleId.value = sample?.id || "";
  sampleFields.sampleType.value = sample?.type || "client_product";
  sampleFields.sampleClientCode.value = sample?.rawClientCode || sampleClientCode;
  sampleFields.sampleProductName.value = sample?.type === "client_product" ? sample.name : "";
  sampleFields.sampleBaseName.value = sample?.baseName || (sample?.type === "created_sample" ? sample.name : "");
  sampleFields.sampleCategory.value = sample?.category || clientSampleCategories[0];
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
  sampleFields.sampleNotes.value = sample?.notes || "";

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

function syncSampleMeasureLabel() {
  const isSecretion = sampleFields.sampleCategory.value === "Secretion";
  sampleFields.sampleMeasureLabel.innerHTML = `${isSecretion ? "Volume (mL)" : "Poids (mg)"} <span class="required-star">*</span>`;
}

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
    notes: sampleFields.sampleNotes.value.trim(),
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
    const replicaCount = existingId ? 1 : Math.max(1, Number(sampleFields.sampleReplicaCount.value || 1));
    const category = sampleFields.sampleCategory.value;
    const measureUnit = category === "Secretion" ? "mL" : "mg";
    const measureValue = Number(sampleFields.sampleMeasureValue.value);

    const samplesToSave = Array.from({ length: replicaCount }, (_, index) => {
      const replicaNumber = index + 1;
      const name = replicaCount > 1 ? `${baseName} ${replicaNumber}` : baseName;

      return {
        ...base,
        id: existingId || createSafeItemId("sample-created"),
        name,
        baseName,
        replicaNumber: replicaCount > 1 ? replicaNumber : existingSample?.replicaNumber || null,
        replicaCount: replicaCount > 1 ? replicaCount : existingSample?.replicaCount || 1,
        category,
        creationDate: sampleFields.sampleCreationDate.value,
        measureValue,
        measureUnit,
        quantity: measureValue,
        unit: measureUnit,
        arrivalDate: "",
        referenceNumber: "",
        lotNumber: ""
      };
    });

    upsertClientSamples(samplesToSave, existingId);
    addHistory(
      existingId ? "Échantillon client modifié" : "Échantillons clients ajoutés",
      `${currentName} a ${existingId ? "modifié" : "ajouté"} ${replicaCount} échantillon${replicaCount > 1 ? "s" : ""} ${baseName} pour ${base.canonicalClientCode}.`
    );
  }

  persist();
  sampleDialog.close();
  selectedSampleId = null;
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

function deleteSample() {
  const id = sampleFields.sampleId.value;
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const confirmed = window.confirm(`Êtes-vous sûre de vouloir supprimer "${sample.name}" ?`);
  if (!confirmed) return;

  clientSamples = clientSamples.filter(entry => entry.id !== id);

  addHistory("Produit client supprimé", `${currentName} a supprimé ${sample.name} des études clients.`);
  persist();
  sampleDialog.close();

  if (selectedSampleId === id) {
    selectedSampleId = null;
  }

  render();
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
  setSelectedLocations(item ? getItemLocations(item) : (prefill.locations || []));
  fields.tags.value = item?.tags?.join(", ") || prefill.tags?.join(", ") || "";
  fields.notes.value = item?.notes || prefill.notes || "";
  fields.primarySupplier.value = references.primary.supplier || "";
  fields.primaryReference.value = references.primary.reference || "";
  fields.primaryLink.value = references.primary.link || "";
  fields.primaryReferenceNotes.value = references.primary.notes || "";
  fields.primaryPrice.value = references.primary.price || "";
  fields.primaryUnitPrice.value = references.primary.unitPrice || "";
  fields.primaryLeadTime.value = references.primary.leadTime || "";
  renderSecondaryReferences(references.secondary);
  dialog.showModal();
}

function saveItem() {
  if (!form.reportValidity()) return;

  const selectedLocations = getSelectedLocations();
  const existingId = fields.itemId.value.trim();

  const existingItem = existingId
    ? items.find(entry => entry.id === existingId)
    : null;

  const item = {
    id: existingId || `web-${Date.now()}`,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: Number(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: Number(fields.minStock.value),
    locations: selectedLocations,
    location: selectedLocations[0] || "",
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: fields.notes.value.trim(),
    references: getItemReferences(),
    createdAtRaw: existingItem?.createdAtRaw || new Date().toISOString(),
    createdAt: existingItem?.createdAt || new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date())
  };

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

  if (pendingOrderInventoryLink && !existingId) {
    linkCreatedItemToOrder(pendingOrderInventoryLink.orderId, item);
    pendingOrderInventoryLink = null;
  }

  persist();
  dialog.close();
  render();
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
  stockDialog.showModal();
}

function isSeedItemId(id) {
  return seedBaseItems.some(item => item.id === id);
}

function deleteItem() {
  const id = fields.itemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;

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
    notes: itemData.notes?.trim() || "",
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

function saveStockUpdate() {
  if (!stockForm.reportValidity()) return;

  const id = stockFields.stockItemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const amount = Number(stockFields.stockAmount.value);
  const direction = stockFields.stockAction.value;
  const nextQuantity = direction === "received"
    ? Number(item.quantity) + amount
    : Number(item.quantity) - amount;

  if (nextQuantity < 0) {
    stockFields.stockAmount.setCustomValidity("La quantite ne peut pas devenir negative.");
    stockForm.reportValidity();
    stockFields.stockAmount.setCustomValidity("");
    return;
  }

  const title = stockFields.stockTitle.value.trim();
  const note = stockFields.stockNotes.value.trim();
  const previousQuantity = Number(item.quantity);
  const updatedItem = patchStoredItem(id, {
    quantity: Number(nextQuantity.toFixed(3))
  });

  if (!updatedItem) return;

  const actionLabel = direction === "received" ? "reçu" : "pris";
  addHistory(
    "Stock mis à jour",
    `${currentName} a ${actionLabel} ${amount} ${updatedItem.unit} pour ${updatedItem.name} (${title}). Stock: ${previousQuantity} -> ${updatedItem.quantity} ${updatedItem.unit}.${note ? ` Note: ${note}` : ""}`
  );

  persist();
  stockDialog.close();
  render();
}

function openExperimentModal(id) {
  const experiment = experiments.find(entry => entry.id === id);
  const template = protocolTemplates.find(
    entry => entry.id === (experiment?.templateId || protocolTemplates[0].id)
  );

  experimentForm.reset();

  document.querySelector("#experimentModalTitle").textContent =
    experiment ? "Modifier experience" : "Nouvelle experience";

  const deleteExperimentBtn = document.querySelector("#deleteExperimentBtn");
  if (deleteExperimentBtn) {
    deleteExperimentBtn.style.display = experiment ? "inline-flex" : "none";
  }

  experimentFields.experimentId.value = experiment?.id || "";
  experimentFields.experimentTemplate.value = experiment?.templateId || template.id;
  experimentFields.experimentName.value = experiment?.name || "";
  experimentFields.experimentConditions.value = experiment?.conditions || 1;
  experimentFields.experimentReplicates.value = experiment?.replicates || 1;
  experimentFields.experimentStatus.value = experiment?.status || "draft";
  experimentFields.experimentTemplateNotes.value = template?.notes || "";
  experimentFields.experimentNotes.value = experiment?.notes || "";
  experimentFields.experimentTemplate.disabled = Boolean(experiment);

  const isRtQpcr = template?.mode === "rtqpcr";
  const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");
  const rtqpcrConfigData = experiment?.rtqpcrConfig || {};

  syncRtQpcrConfigVisibility(template);

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
    getMergedExperimentLines(experiment.items).forEach(line => addExperimentItemRow(line));
  } else {
    buildExperimentItemsFromTemplate();
  }

  updateExperimentTotalConditions();
  updateExperimentModalStock();
  experimentDialog.showModal();
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
  if (!template) return;

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
    const itemKey = line.itemId || "";
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

function hydrateExperimentItemRow(row, itemId) {
  if (!row) return;

  const item = items.find(entry => entry.id === itemId);
  row.dataset.itemId = item?.id || "";
  row.querySelector(".experiment-item-unit").value = item?.unit || "";
  updateExperimentModalStock();
}

function updateExperimentModalStock() {
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const item = getExperimentRowItem(row);
    const needed = Number(row.querySelector(".experiment-item-quantity").value || 0);
    const unit = row.querySelector(".experiment-item-unit").value.trim();
    const state = row.querySelector(".experiment-stock-state");

    if (!item) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = "Manquant";
      return;
    }

    if (unit !== item.unit || !unit) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = `${item.quantity} ${item.unit} - unite differente`;
      return;
    }

    const ok = Number(item.quantity) >= needed;
    const lowStock = !ok || itemStatus(item) !== "ok";
    state.className = `experiment-stock-state ${lowStock ? "stock-low" : "stock-ok"}`;
    state.textContent = `${lowStock ? "Stock bas" : "Connecte"} · ${item.quantity} ${item.unit}`;
  });
}

function getExperimentRows() {
  return [...experimentItemsList.querySelectorAll(".experiment-item-row")]
    .map(row => {
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

function saveExperiment() {
  if (!experimentForm.reportValidity()) return;

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

  const experiment = {
    id,
    name: experimentFields.experimentName.value.trim(),
    templateId: experimentFields.experimentTemplate.value,
    templateName: template?.name || "Template inconnu",

    conditions: Number(experimentFields.experimentConditions.value || 1),

    replicates: Number(experimentFields.experimentReplicates.value || 1),

    status: experimentFields.experimentStatus.value,
    notes: experimentFields.experimentNotes.value.trim(),

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

    templateNotes: experimentFields.experimentTemplateNotes.value,
    items: getMergedExperimentLines(getExperimentRows())
  };

  const index = experiments.findIndex(entry => entry.id === id);

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

function deleteExperiment() {
  const id = experimentFields.experimentId.value;
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;

  const confirmed = window.confirm(`Supprimer l'expérience "${experiment.name}" ?`);
  if (!confirmed) return;

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

function consumeExperimentStock(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;
  if (experiment.status === "completed") return;

  const summary = experimentStockSummary(experiment);
  if (!summary.ok) {
    addHistory("Consommation bloquée", `${currentName} a tente de consommer ${experiment.name}, mais le stock est insuffisant.`);
    window.alert("Stock insuffisant ou unité différente: consommation bloquée.");
    renderHistory();
    return;
  }

  for (const line of getMergedExperimentLines(experiment.items)) {
    const item = findInventoryItem(line);
    if (!item) continue;

    const nextQuantity = Number(
      (Number(item.quantity) - Number(line.quantity || 0)).toFixed(3)
    );

    patchStoredItem(item.id, {
      quantity: nextQuantity
    });
  }

  experiment.status = "completed";
  experiment.updatedAt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());

  addHistory("Experience consommée", `${currentName} a consommé le stock pour ${experiment.name}.`);
  persist();
  render();
}

function openOrderModal() {
  orderForm.reset();
  orderFields.orderInventorySearch.value = "";
  orderFields.orderNewName.value = "";
  renderOrderItemOptions();
  orderFields.orderItemMode.value = "existing";
  orderFields.orderPriority.value = "critique";
  toggleOrderModeFields();
  orderDialog.showModal();
}

function saveOrder() {
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
      itemName: item.name,
      requestedQuantity: Number(orderFields.orderQuantity.value),
      receivedQuantity: 0,
      priority: orderFields.orderPriority.value,
      notes: orderFields.orderNotes.value.trim(),
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
      notes: orderFields.orderNotes.value.trim(),
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

  receiveInventoryFields.receiveOrderId.value = order.id;
  receiveInventoryFields.receiveInventoryItemName.textContent = order.itemName;
  receiveInventoryFields.receiveInventoryRequestedText.textContent = `Quantité demandée : ${requestedQuantity} ${unit}`.trim();
  receiveInventoryFields.receiveQuantity.value = requestedQuantity;
  receiveInventoryFields.receiveUnit.value = unit;

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
function confirmReceiveInventory() {
  if (!receiveInventoryForm.reportValidity()) return;

  const id = receiveInventoryFields.receiveOrderId.value;
  const order = orders.find(entry => entry.id === id);
  if (!order || normalizeOrderStatus(order.status) !== "received") return;
  if (order.addedToInventory) {
    receiveInventoryDialog.close();
    window.alert("Cette réception a déjà été ajoutée à l’inventaire.");
    return;
  }

  const confirmedQuantity = Number(receiveInventoryFields.receiveQuantity.value);
  const unit = receiveInventoryFields.receiveUnit.value || "";

  if (!Number.isFinite(confirmedQuantity) || confirmedQuantity < 0) {
    window.alert("Merci d'entrer une quantité valide.");
    return;
  }

  const finalQuantity = Number(confirmedQuantity.toFixed(3));

  if (order.inventoryItemId) {
    const item = items.find(entry => entry.id === order.inventoryItemId);
    if (!item) {
      window.alert("L'article lié dans l'inventaire est introuvable.");
      return;
    }

    patchStoredItem(item.id, {
      quantity: Number((Number(item.quantity) + finalQuantity).toFixed(3))
    });
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

  const confirmed = window.confirm(`Supprimer la demande pour « ${order.itemName} » ?`);
  if (!confirmed) return;

  orders = orders.filter(entry => entry.id !== id);

  addHistory(
    "Demande supprimée",
    `${currentName} a supprimé la demande pour ${order.itemName}.`
  );

  persist();
  renderOrders();
  renderHistory();
}

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

    return {
      ...itemWithoutMaxStock,
      id,
      category: inventoryCategories.includes(item?.category)
        ? item.category
        : legacyCategoryMap[item?.category] || inventoryCategories[0],
      location: inventoryLocations.includes(item?.location)
        ? item.location
        : legacyLocationMap[item?.location] || inventoryLocations[0],
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
    items: Array.isArray(experiment?.items) ? experiment.items : []
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
    const category = clientSampleCategories.includes(sample?.category)
      ? sample.category
      : (type === "created_sample" ? clientSampleCategories[0] : "");
    const measureUnit = type === "created_sample"
      ? (category === "Secretion" ? "mL" : "mg")
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
      location,
      arrivalDate: sample?.arrivalDate || "",
      creationDate: sample?.creationDate || "",
      quantity: sample?.quantity ?? sample?.measureValue ?? "",
      unit: type === "created_sample" ? measureUnit : String(sample?.unit || "").trim(),
      measureValue: sample?.measureValue ?? sample?.quantity ?? "",
      measureUnit,
      referenceNumber: String(sample?.referenceNumber || "").trim(),
      lotNumber: String(sample?.lotNumber || "").trim(),
      notes: String(sample?.notes || "").trim(),
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
  if (line?.itemId) {
    return items.find(item => item.id === line.itemId) || null;
  }

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

function experimentStockSummary(experiment) {
  const missing = getMergedExperimentLines(experiment.items).filter(line => {
    const item = findInventoryItem(line);
    return !item || item.unit !== line.unit || Number(item.quantity) < Number(line.quantity || 0);
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
    <label>Notes<input class="secondary-reference-notes" value="${escapeHtml(reference.notes || "")}" /></label>
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
      notes: row.querySelector(".secondary-reference-notes").value.trim()
    }))
    .filter((reference) => reference.reference || reference.notes);

  return {
    primary: {
      supplier: fields.primarySupplier.value.trim(),
      reference: fields.primaryReference.value.trim(),
      link: fields.primaryLink.value.trim(),
      notes: fields.primaryReferenceNotes.value.trim(),
      price: fields.primaryPrice.value.trim(),
      unitPrice: fields.primaryUnitPrice.value.trim(),
      leadTime: fields.primaryLeadTime.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  const legacyPrimaryNotes = [
    references?.primary?.quantity,
    references?.primary?.price
  ].filter(Boolean).join(" - ");

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
