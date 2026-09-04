// Rendu general, alertes et navigation entre les vues et les fiches detail.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

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

function renderSampleOptions() {
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
