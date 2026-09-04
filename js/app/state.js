// Structure des données :
// seedBaseItems vient du dépôt et sert uniquement de valeur initiale par défaut.
// sharedState contient les données vivantes : inventaire, expériences, commandes, échantillons et historique.
// GitHub shared_data.json est la source partagée ; localStorage sert uniquement de cache/secours.

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

let seedBaseItems;

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
let sharedState;


// Ne pas déplacer : buildItems est appelée depuis bootstrap.js pour initialiser « items ».
function buildItems() {
  return migrateItems(sharedState.inventoryItems).map(item => ({
    ...item,
    source: item.source || (isSeedItemId(item.id) ? "seed" : "web")
  }));
}

// Ces variables sont déclarées vides ici et reçoivent leur valeur dans bootstrap.js,
// car leur calcul a besoin de fonctions définies dans script.js.
let items;

let orders;
let experiments;
let history;
let stockMovements;
let sourcingPatients;
let clientSamples;
let clients;
let supplierContacts;
// protocoles "Nouveau protocole" enregistrés par les utilisateurs, en plus des protocoles intégrés (protocols.js)
let customProtocolTemplates;
let protocolTemplates;

let sharedDataReady;

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
let experimentDragSourceRow = null;
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
const sampleStudyTypeFilter = document.querySelector("#sampleStudyTypeFilter");
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
const sourcingCategoryFilter = document.querySelector("#sourcingCategoryFilter");
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
  "sampleStudyTypeClient",
  "sampleStudyTypeRd",
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

const SOURCING_YES_NO_FIELDS = ["patientNash", "patientSleepApnea", "patientT2d", "patientFreezing"];
const SOURCING_YES_NO_OPTION_MAP = [["Yes", "Oui"], ["No", "Non"]];
const SOURCING_STATUS_OPTION_MAP = [["Yes", "Oui"], ["No", "Non"], ["Fill", "À remplir"]];
const SOURCING_STATUS_DATE_FIELDS = [
  { base: "patientArnExplantT0", prefill: "reception", label: "Explant T0", section: "arn" },
  { base: "patientArnWatT14", prefill: "reception+14", label: "WAT T14", section: "arn" },
  { base: "patientArnBatT14", prefill: "reception+14", label: "BAT T14", section: "arn" },
  { base: "patientArnPrebatAmpc", prefill: null, label: "Prebat ± AMPc", section: "arn" },
  { base: "patientArnInducibleBat", prefill: null, label: "Inductible en BAT (qPCR UCP1 positif)", section: "arn" },
  { base: "patientSecretionsT0", prefill: "reception", label: "Sécrétions T0", section: "secretions" },
  { base: "patientSecretionsT14", prefill: "reception+14", label: "Sécrétions T14", section: "secretions" },
  { base: "patientSecretionsBatT14", prefill: "reception+14", label: "Sécrétions BAT T14", section: "secretions" },
  { base: "patientFixationT0", prefill: "reception", label: "Fixation T0", section: "fixation" },
  { base: "patientFixationT14", prefill: "reception+14", label: "Fixation T14", section: "fixation" }
];
const SOURCING_QC_TESTS = ["Myco", "Bacteria", "Yeast", "Xtt", "Collagenase", "Asc"];
const SOURCING_QC_TEST_LABELS = { Myco: "Myco", Bacteria: "Bactéries", Yeast: "Levures", Xtt: "XTT", Collagenase: "Collagénase", Asc: "ASC" };

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
  "patientOtherComorbidity",
  "patientIntervention",
  "patientBmiMax",
  "patientIntentionTreatment",
  ...SOURCING_QC_TESTS.flatMap(test => [`patientQc${test}Result`, `patientQc${test}Date`, `patientQc${test}Tx`, `patientQc${test}Remarks`]),
  ...SOURCING_STATUS_DATE_FIELDS.flatMap(({ base }) => [`${base}Date`]),
  "patientFreezingQuantity",
  "patientFreezingThaw",
  "patientGeneralRemark"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const SOURCING_GENERIC_LOOP_EXCLUDED_KEYS = new Set(["sourcingPatientId"]);

const orderFields = [
  "orderItemMode",
  "orderInventorySearch",
  "orderInventoryItem",
  "orderQuantity",
  "orderPriority",
  "orderNotes",
  "orderNewName"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});


// Dialogue pour confirmer la quantité à ajouter à l'inventaire lors de la réception d'une commande
const receiveInventoryDialog = document.querySelector("#receiveInventoryDialog");
const receiveInventoryForm = document.querySelector("#receiveInventoryForm");
const receiveInventoryFields = [
  "receiveOrderId",
  "receiveInventoryItemName",
  "receiveInventoryRequestedText",
  "receiveQuantity",
  "receiveUnit"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

// animation de démarrage
const loginLoader = document.querySelector("#loginLoader");
const authPanel = document.querySelector(".auth-panel");
