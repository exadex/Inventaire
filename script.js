const seedSamples = [
  ["PAT-AX41", "Abdominal", "2026-05-12", "Hypoxie 1% O2", "RNA-seq", "LN2 / Canister 2 / Box 17"],
  ["PAT-NQ08", "Facial", "2026-05-03", "Temoin ex vivo 24h", "Histologie", "Freezer -80C / Box H-03"],
  ["PAT-KL77", "Abdominal", "2026-04-28", "IL-6 10 ng/mL", "ELISA", "Freezer -80C / Box C-11"],
  ["PAT-VM19", "Facial", "2026-04-19", "Insuline 100 nM", "qPCR", "LN2 / Canister 1 / Box 08"],
  ["PAT-TB52", "Abdominal", "2026-04-15", "Differenciation J7", "Immunofluorescence", "Freezer -20C / Slides S-02"]
];

const defaultOrders = [
  {
    id: "ord-001",
    itemName: "Kit ELISA Adiponectine",
    quantity: "2 kits",
    priority: "critique",
    supplier: "R&D Systems",
    notes: "Necessaire pour serie secretion adipokines.",
    requestedBy: "ML",
    createdAt: "2026-05-18 17:35"
  },
  {
    id: "ord-002",
    itemName: "Collagenase type I",
    quantity: "6 flacons",
    priority: "tres urgent",
    supplier: "Worthington",
    notes: "Stock sous seuil minimum.",
    requestedBy: "CB",
    createdAt: "2026-05-19 09:12"
  },
  {
    id: "ord-003",
    itemName: "Cryotubes 2 mL steriles",
    quantity: "1 carton",
    priority: "pas urgent",
    supplier: "Corning",
    notes: "Reassort pour cryostock.",
    requestedBy: "IR",
    createdAt: "2026-05-15 10:04"
  }
];

const defaultExperiments = [
  {
    id: "exp-001",
    name: "Adiponectine secretion pilot",
    templateId: "tpl-elisa",
    templateName: "ELISA adipokines",
    conditions: 4,
    replicates: 3,
    status: "draft",
    notes: "Premiere version a ajuster selon volume surnageants.",
    createdBy: "Caroline",
    updatedAt: "2026-05-19 16:20",
    items: protocolTemplates[1].items.map(templateItem => ({
      ...templateItem,
      quantity: Number((templateItem.perConditionQuantity * 12).toFixed(3))
    }))
  }
];

const defaultHistory = [
  { date: "Aujourd'hui 09:12", user: "Caroline", action: "Stock ajusté", detail: "Collagenase type I passée à 2 flacons." },
  { date: "Hier 17:35", user: "Marie", action: "Demande de commande", detail: "Kit ELISA Adiponectine ajouté à la liste À commander." },
  { date: "2026-05-16", user: "Ines", action: "Note modifiée", detail: "Anti-Perilipin A: dilution de travail confirmée." }
];

const storedItems = migrateItems(load("exadex_items", load("adipovault_items", [])));
const baseItems = migrateItems(seedItems);

let items = mergeItems(baseItems, storedItems);
let orders = load("exadex_orders", defaultOrders);
let experiments = migrateExperiments(load("exadex_experiments", defaultExperiments));
let history = load("exadex_history", load("adipovault_history", defaultHistory));

persist();

let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";
let alertsExpanded = false;
let selectedLocation = null;
let selectedExperimentId = null;
let selectedItemId = null;
let itemReturnContext = { view: "inventory", experimentId: null, location: null };
let selectedOrderId = null;
let ordersMode = "board";

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

const fields = [
  "itemId",
  "name",
  "category",
  "quantity",
  "unit",
  "minStock",
  "maxStock",
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

const experimentFields = ["experimentId", "experimentTemplate", "experimentName", "experimentConditions", "experimentReplicates", "experimentStatus", "experimentTotalConditions", "experimentNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = [
  "orderItemMode",
  "orderInventoryItem",
  "orderItemName",
  "orderQuantity",
  "orderPriority",
  "orderNotes",
  "orderNewName",
  "orderNewCategory",
  "orderNewUnit",
  "orderNewMinStock",
  "orderNewMaxStock",
  "orderNewLocation",
  "orderNewTags",
  "orderNewItemNotes"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

renderCategoryOptions();
renderLocationOptions();
renderTemplateOptions();

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

  setTimeout(() => {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
    persist();
    render();

    loginLoader.classList.remove("is-visible");
    authPanel?.classList.remove("is-loading");
    submitBtn.disabled = false;
  }, 3000);
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  persist();
  app.classList.add("hidden");
  auth.classList.remove("hidden");
});

document.querySelector("#addItemBtn").addEventListener("click", () => openModal());
document.querySelector("#saveItemBtn").addEventListener("click", saveItem);
document.querySelector("#deleteItemBtn").addEventListener("click", deleteItem);
document.querySelector("#saveStockBtn").addEventListener("click", saveStockUpdate);
document.querySelector("#addExperimentBtn").addEventListener("click", () => openExperimentModal());
document.querySelector("#saveExperimentBtn").addEventListener("click", saveExperiment);
document.querySelector("#addExperimentItemBtn").addEventListener("click", () => addExperimentItemRow());
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
document.querySelector("#closeOrderDialogBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#cancelOrderBtn").addEventListener("click", () => orderDialog.close());
searchInput.addEventListener("input", renderInventory);
categoryFilter.addEventListener("change", renderInventory);
experimentSearchInput.addEventListener("input", renderExperiments);
experimentStatusFilter.addEventListener("change", renderExperiments);
experimentDialog.addEventListener("close", () => {
  experimentFields.experimentTemplate.disabled = false;
});
experimentFields.experimentTemplate.addEventListener("change", () => buildExperimentItemsFromTemplate());
experimentFields.experimentConditions.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentFields.experimentReplicates.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentItemsList.addEventListener("input", updateExperimentModalStock);
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
    selectedExperimentId = null;
    selectedLocation = null;
    itemReturnContext = { view: activeView, experimentId: null };

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    document.querySelector(`#${activeView}View`).classList.add("active");

    controlBar.classList.toggle("hidden", activeView !== "inventory");
    app.classList.toggle("history-mode", activeView === "history");

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

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem("exadex_items", JSON.stringify(items));
  localStorage.setItem("exadex_orders", JSON.stringify(orders));
  localStorage.setItem("exadex_experiments", JSON.stringify(experiments));
  localStorage.setItem("exadex_history", JSON.stringify(history));
}

function updateUserIdentity() {
  const userIcon = userIcons[currentName] || "👤";
  currentUser.textContent = userIcon;
  sidebarUser.textContent = userIcon;
  currentUserName.textContent = currentName;
  sidebarUserName.textContent = currentName;
}

function itemStatus(item) {
  if (Number(item.quantity) <= Number(item.minStock)) return "critical";
  if (Number(item.quantity) <= Number(item.minStock) * 1.5) return "warning";
  return "ok";
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

function renderCategories() {
  const selected = categoryFilter.value || "all";
  categoryFilter.innerHTML = `<option value="all">Toutes categories</option>${inventoryCategories.map(category => `<option>${escapeHtml(category)}</option>`).join("")}`;
  categoryFilter.value = inventoryCategories.includes(selected) ? selected : "all";
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

  if (!critical.length) {
    alertsContainer.innerHTML = "";
    return;
  }

  alertsContainer.innerHTML = `
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

function renderInventory() {
  const query = normalizeSearch(searchInput.value);
  const category = categoryFilter.value;

  const filtered = items.filter((item) => {
    const referenceText = itemReferencesText(item.references);
    const haystack = normalizeSearch([
      item.name,
      ...getItemLocations(item),
      item.category,
      ...item.tags,
      referenceText
    ].join(" "));

    return (
      (!query || haystack.includes(query)) &&
      (statusFilter === "all" || itemStatus(item) === statusFilter) &&
      (category === "all" || item.category === category)
    );
  });

  document.querySelector("#resultCount").textContent =
    `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;

  const detail = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  document.querySelector("#inventoryDetail").innerHTML = detail
    ? renderInventoryDetail(detail)
    : "";

  document.querySelector("#inventoryGrid").classList.toggle("hidden", Boolean(detail));

  document.querySelector("#inventoryGrid").innerHTML = filtered.map((item) => {
    const status = itemStatus(item);
    const percent = Math.min(100, Math.round((Number(item.quantity) / Math.max(Number(item.maxStock), 1)) * 100));

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
          <span>${item.quantity} ${escapeHtml(item.unit)}</span>
          <span>Max ${item.maxStock} ${escapeHtml(item.unit)}</span>
        </div>

        ${item.tags?.length ? `
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        ` : ""}

        <small>${escapeHtml(formatLocations(item))}</small>

        <div class="card-actions">
          <span></span>
          <div class="card-button-stack">
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
              Stock update
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderInventoryDetail(item) {
  const status = itemStatus(item);
  const references = normalizeReferences(item.references);
  const percent = Math.min(
    100,
    Math.round((Number(item.quantity) / Math.max(Number(item.maxStock), 1)) * 100)
  );

  return `
    <section class="inventory-detail-panel">
      <div class="detail-topline">
        <button
          class="room-exit-btn"
          type="button"
          onclick="returnFromItemDetail()"
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
        <span>Maximum: ${item.maxStock} ${escapeHtml(item.unit)}</span>
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
                  ${renderDetailRow("Prix", references.primary.price)}
                  ${renderDetailRow("Prix unitaire", references.primary.unitPrice)}
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

function renderOrderDetail(order) {
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
    Math.round((Number(item.quantity) / Math.max(Number(item.maxStock), 1)) * 100)
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
        <span>Maximum: ${item.maxStock} ${escapeHtml(item.unit)}</span>
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
                  ${renderDetailRow("Prix", references.primary.price)}
                  ${renderDetailRow("Prix unitaire", references.primary.unitPrice)}
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
  document.querySelector("#sampleRows").innerHTML = seedSamples.map(sample => `
    <tr>${sample.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>
  `).join("");
}

function renderHistory() {
  document.querySelector("#historyList").innerHTML = history.filter(entry => !["Connexion", "Deconnexion"].includes(entry.action)).map(entry => {
    const action = entry.action === "Item supprime" ? "Item supprimé" : entry.action;
    const detail = entry.detail.replace(" a supprime ", " a supprimé ");
    return `
    <article class="history-entry">
      <div class="history-meta">
        <time>${escapeHtml(entry.date)}</time>
        <span class="history-user"><span>${userIcons[entry.user] || "👤"}</span>${escapeHtml(entry.user)}</span>
      </div>
      <div><strong>${escapeHtml(action)}</strong><br><span>${escapeHtml(detail)}</span></div>
    </article>
  `;
  }).join("");
}

function renderLocations() {
  const groups = items.reduce((acc, item) => {
    const places = getItemLocations(item);

    places.forEach(place => {
      if (!acc[place]) acc[place] = [];
      acc[place].push(item);
    });

    return acc;
  }, {});

  const locationGrid = document.querySelector("#locationGrid");

  if (selectedLocation) {
    const group = groups[selectedLocation] || [];
    locationGrid.innerHTML = `
      <div class="location-room">
        <div class="location-room-header">
          <button class="room-exit-btn" id="backToLocationsBtn" type="button" aria-label="Retour aux salles" title="Retour aux salles">↩️</button>
          <div>
            <span class="room-icon">${locationIcons[selectedLocation] || "📍"}</span>
            <h4>${escapeHtml(selectedLocation)}</h4>
            <p>${group.length} reference${group.length > 1 ? "s" : ""} dans cette salle</p>
          </div>
        </div>
        <div class="room-item-list">
          ${group.length ? group.map(item => `
            <article class="room-item">
            <div>
              <button
                class="text-btn location-item-link"
                type="button"
                onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'locations', location: '${escapeHtml(selectedLocation)}' })"
              >
                ${escapeHtml(item.name)}
              </button>
              <span>
                ${escapeHtml(item.category)} · ${item.quantity} ${escapeHtml(item.unit)} ·
                Tags: ${item.tags.map(tag => escapeHtml(tag)).join(", ") || "aucun"}
              </span>
            </div>
              <button class="text-btn" type="button" data-item-id="${escapeHtml(item.id)}">Modifier</button>
            </article>
          `).join("") : `<div class="empty-room">Aucun item dans cette salle pour le moment.</div>`}
        </div>
      </div>
    `;
    document.querySelector("#backToLocationsBtn").addEventListener("click", () => {
      selectedLocation = null;
      renderLocations();
    });
    locationGrid.querySelectorAll("[data-item-id]").forEach(button => {
      button.addEventListener("click", () => openModal(button.dataset.itemId));
    });
    return;
  }

  locationGrid.innerHTML = inventoryLocations.map(place => {
    const group = groups[place] || [];
    return `
    <button class="location-card" type="button" data-location="${escapeHtml(place)}">
      <span class="location-icon">${locationIcons[place] || "📍"}</span>
      <strong>${escapeHtml(place)}</strong>
      <p>${group.length} reference${group.length > 1 ? "s" : ""}</p>
      <div class="mini-list">${group.slice(0, 3).map(item => `<span>${escapeHtml(item.name)}</span>`).join("") || "<span>Salle vide</span>"}</div>
      <span class="enter-room"><span class="enter-room-icon">🚪</span> Entrer</span>
    </button>
  `;
  }).join("");
  locationGrid.querySelectorAll("[data-location]").forEach(card => {
    card.addEventListener("click", () => {
      selectedLocation = card.dataset.location;
      renderLocations();
    });
  });
}

function renderOrders() {
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

  const headerActions = document.querySelector(".orders-actions, .view-actions, .section-actions");
  if (headerActions && !headerActions.querySelector("#ordersHistoryBtn")) {
    const historyBtn = document.createElement("button");
    historyBtn.id = "ordersHistoryBtn";
    historyBtn.type = "button";
    historyBtn.className = "ghost-btn";
    historyBtn.textContent = "Historique";
    historyBtn.onclick = openOrdersHistory;
    headerActions.prepend(historyBtn);
  }

  if (ordersMode === "history") {
    renderOrdersHistory();
    return;
  }

  const visibleOrders = orders.filter((order) => {
    if (order.status !== "received") return true;
    if (!order.receivedAtRaw) return true;
    const age = Date.now() - new Date(order.receivedAtRaw).getTime();
    return age < 7 * 24 * 60 * 60 * 1000;
  });

  const requested = visibleOrders
    .filter((order) => order.status === "requested")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const ordered = visibleOrders
    .filter((order) => order.status === "ordered")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const received = visibleOrders
    .filter((order) => order.status === "received")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  if (requestedCount) requestedCount.textContent = ` (${requested.length})`;
  if (orderedCount) orderedCount.textContent = ` (${ordered.length})`;
  if (receivedCount) receivedCount.textContent = ` (${received.length})`;

  const detail = selectedOrderId
    ? visibleOrders.find((order) => order.id === selectedOrderId) ||
      orders.find((order) => order.id === selectedOrderId)
    : null;

  const renderOrderCard = (order) => `
    <article
      class="order-card order-status-${order.status} priority-${slugPriority(order.priority)} ${selectedOrderId === order.id ? "active" : ""}"
      onclick="selectOrder('${escapeHtml(order.id)}')"
    >
      <div class="item-head">
        <div>
          <strong>${escapeHtml(order.itemName)}</strong>
          <span class="order-quantity">
            Quantité demandée : ${escapeHtml(String(order.requestedQuantity ?? order.quantity ?? "—"))}
          </span>
          ${order.supplier ? `<span class="category">${escapeHtml(order.supplier)}</span>` : ""}
        </div>
        <span class="priority-badge">${escapeHtml(priorityLabel(order.priority))}</span>
      </div>

      <p>${escapeHtml(order.notes || "Aucune note")}</p>

      <div class="card-actions">
        <small>
          ${escapeHtml(order.status)} ·
          ${escapeHtml(order.requestedBy || "")} ·
          ${escapeHtml(formatOrderDate(order.requestedAt || order.createdAt))}
        </small>

        <div class="card-button-stack">
          ${
            order.status === "requested"
              ? `
                <button class="text-btn" type="button" onclick="event.stopPropagation(); moveOrderToOrdered('${escapeHtml(order.id)}')">Commandé</button>
                <button class="text-btn" type="button" onclick="event.stopPropagation(); markOrderDone('${escapeHtml(order.id)}')">Effacer</button>
              `
              : ""
          }

          ${
            order.status === "ordered"
              ? `
                <button class="text-btn" type="button" onclick="event.stopPropagation(); moveOrderBackToRequested('${escapeHtml(order.id)}')">← Retour</button>
                <button class="text-btn" type="button" onclick="event.stopPropagation(); moveOrderToReceived('${escapeHtml(order.id)}')">Arrivé</button>
              `
              : ""
          }

          ${
            order.status === "received"
              ? `
                <button class="text-btn" type="button" onclick="event.stopPropagation(); moveOrderBackToOrdered('${escapeHtml(order.id)}')">← Retour</button>
              `
              : ""
          }
        </div>
      </div>
    </article>
  `;

  orderDetail.innerHTML = detail ? renderOrderDetail(detail) : "";

  if (ordersSections) {
    ordersSections.classList.toggle("hidden", Boolean(detail));
  } else {
    [requestedSection, orderedSection, receivedSection].forEach((section) => {
      if (section) {
        section.classList.toggle("hidden", Boolean(detail));
      }
    });
  }

  if (detail) {
    return;
  }

  requestedList.innerHTML =
    requested.map(renderOrderCard).join("") || `<div class="empty-room">Aucune demande.</div>`;

  orderedList.innerHTML =
    ordered.map(renderOrderCard).join("") || `<div class="empty-room">Aucune commande en cours.</div>`;

  receivedList.innerHTML =
    received.map(renderOrderCard).join("") || `<div class="empty-room">Aucune réception récente.</div>`;
}

function renderOrderItemOptions() {
  orderFields.orderInventoryItem.innerHTML = items
    .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("");
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
  document.querySelector("#experimentGrid").innerHTML = filtered.map(experiment => {
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
  }).join("") || `<div class="empty-room">Aucune experience ne correspond a cette recherche.</div>`;
}

function renderExperimentDetail(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const rows = experiment.items.map(line => {
    const inventoryItem = findInventoryItem(line);
    const available = Number(inventoryItem?.quantity ?? 0);
    const needed = Number(line.quantity || 0);
    const comparable = inventoryItem && inventoryItem.unit === line.unit;
    const enough = comparable && available >= needed;
    const stateLabel = !inventoryItem ? "Non connecte" : !comparable ? "Unite differente" : enough ? "Suffisant" : "Insuffisant";
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
        <td><span class="stock-pill ${enough ? "ok" : "alert"}">${stateLabel}</span></td>
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
      <p>${escapeHtml(experiment.notes || "Aucune note")}</p>
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
  selectedExperimentId = id;
  renderExperiments();
}

function selectOrder(id) {
  selectedOrderId = id;
  renderOrders();
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
  app.classList.remove("history-mode");

  renderInventory();
}

function openItemDetail(id, context = {}) {
  itemReturnContext = {
    view: context.view || activeView || "inventory",
    experimentId: context.experimentId ?? selectedExperimentId ?? null,
    location: context.location ?? selectedLocation ?? null
  };

  selectedItemId = id;
  activeView = "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "inventory");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#inventoryView").classList.add("active");

  controlBar.classList.remove("hidden");
  app.classList.remove("history-mode");

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
    app.classList.remove("history-mode");

    renderExperiments();
    return;
  }

  activeView = itemReturnContext.view || "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${activeView}View`).classList.add("active");

  controlBar.classList.toggle("hidden", activeView !== "inventory");
  app.classList.toggle("history-mode", activeView === "history");

  render();
}

function openModal(id) {
  const item = items.find(entry => entry.id === id);
  const references = normalizeReferences(item?.references);
  document.querySelector("#modalTitle").textContent = item ? "Modifier item" : "Nouvel item";
  document.querySelector("#deleteItemBtn").style.display = item ? "inline-block" : "none";
  fields.itemId.value = item?.id || "";
  fields.name.value = item?.name || "";
  fields.category.value = item?.category || inventoryCategories[0];
  fields.quantity.value = item?.quantity ?? "";
  fields.unit.value = item?.unit || "";
  fields.minStock.value = item?.minStock ?? "";
  fields.maxStock.value = item?.maxStock ?? "";
  setSelectedLocations(item ? getItemLocations(item) : []);
  fields.tags.value = item?.tags?.join(", ") || "";
  fields.notes.value = item?.notes || "";
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

  const id = fields.itemId.value || `itm-${Date.now()}`;
  const selectedLocations = getSelectedLocations();

  const item = {
    id,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: Number(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: Number(fields.minStock.value),
    maxStock: Number(fields.maxStock.value),
    locations: selectedLocations,
    location: selectedLocations[0] || "",
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: fields.notes.value.trim(),
    references: getItemReferences()
  };

  const index = items.findIndex(entry => entry.id === id);

  if (index >= 0) {
    items[index] = item;
    addHistory("Item modifié", `${currentName} a modifié ${item.name}.`);
  } else {
    items.unshift(item);
    addHistory("Item ajouté", `${currentName} a ajouté ${item.name} dans ${item.category}.`);
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
  const previousQuantity = item.quantity;
  item.quantity = Number(nextQuantity.toFixed(3));

  const actionLabel = direction === "received" ? "reçu" : "pris";
  const note = stockFields.stockNotes.value.trim();
  addHistory(
    "Stock mis à jour",
    `${currentName} a ${actionLabel} ${amount} ${item.unit} pour ${item.name} (${title}). Stock: ${previousQuantity} -> ${item.quantity} ${item.unit}.${note ? ` Note: ${note}` : ""}`
  );

  persist();
  stockDialog.close();
  render();
}

function openExperimentModal(id) {
  const experiment = experiments.find(entry => entry.id === id);
  const template = protocolTemplates.find(entry => entry.id === (experiment?.templateId || protocolTemplates[0].id));
  experimentForm.reset();
  document.querySelector("#experimentModalTitle").textContent = experiment ? "Modifier experience" : "Nouvelle experience";
  experimentFields.experimentId.value = experiment?.id || "";
  experimentFields.experimentTemplate.value = experiment?.templateId || template.id;
  experimentFields.experimentName.value = experiment?.name || "";
  experimentFields.experimentConditions.value = experiment?.conditions || 1;
  experimentFields.experimentReplicates.value = experiment?.replicates || 1;
  experimentFields.experimentStatus.value = experiment?.status || "draft";
  experimentFields.experimentNotes.value = experiment?.notes || template.notes || "";
  experimentFields.experimentTemplate.disabled = Boolean(experiment);
  experimentItemsList.innerHTML = "";
  if (experiment) {
    experiment.items.forEach(line => addExperimentItemRow(line));
  } else {
    buildExperimentItemsFromTemplate();
  }
  updateExperimentTotalConditions();
  updateExperimentModalStock();
  experimentDialog.showModal();
}

function buildExperimentItemsFromTemplate() {
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  if (!template) return;
  if (!experimentFields.experimentId.value && !experimentFields.experimentName.value.trim()) {
    experimentFields.experimentName.value = `${template.name} - ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`;
  }
  if (!experimentFields.experimentNotes.value.trim()) {
    experimentFields.experimentNotes.value = template.notes || "";
  }
  experimentItemsList.innerHTML = "";
  const total = updateExperimentTotalConditions();
  template.items.forEach(templateItem => addExperimentItemRow({
    ...templateItem,
    quantity: Number((templateItem.perConditionQuantity * total).toFixed(3))
  }));
  updateExperimentModalStock();
}

function recalculateExperimentTemplateQuantities() {
  const total = updateExperimentTotalConditions();
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const perCondition = Number(row.dataset.perCondition || 0);
    if (perCondition > 0) {
      row.querySelector(".experiment-item-quantity").value = Number((perCondition * total).toFixed(3));
    }
  });
  updateExperimentModalStock();
}

function updateExperimentTotalConditions() {
  const total = Math.max(1, Number(experimentFields.experimentConditions.value || 1)) * Math.max(1, Number(experimentFields.experimentReplicates.value || 1));
  experimentFields.experimentTotalConditions.value = total;
  return total;
}

function addExperimentItemRow(line = {}) {
  const selectedItem = findInventoryItem(line) || items[0];
  const row = document.createElement("div");
  row.className = "experiment-item-row";
  row.dataset.perCondition = line.perConditionQuantity || "";
  row.innerHTML = `
    <select class="experiment-item-select" required>
      ${items.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
    </select>
    <input class="experiment-item-quantity" type="number" min="0" step="0.001" value="${escapeHtml(line.quantity ?? "")}" required />
    <input class="experiment-item-unit" value="${escapeHtml(line.unit || selectedItem?.unit || "")}" required />
    <span class="experiment-stock-state"></span>
    <button class="ghost-btn compact-btn" type="button">Retirer</button>
    <input class="experiment-item-notes" value="${escapeHtml(line.notes || "")}" placeholder="Notes ligne" />
  `;
  row.querySelector(".experiment-item-select").value = selectedItem?.id || "";
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateExperimentModalStock();
  });
  experimentItemsList.append(row);
  updateExperimentModalStock();
}

function hydrateExperimentItemRow(row, itemId) {
  const item = items.find(entry => entry.id === itemId);
  if (!row || !item) return;
  row.querySelector(".experiment-item-unit").value = item.unit;
  row.dataset.perCondition = "";
}

function updateExperimentModalStock() {
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const item = items.find(entry => entry.id === row.querySelector(".experiment-item-select").value);
    const needed = Number(row.querySelector(".experiment-item-quantity").value || 0);
    const unit = row.querySelector(".experiment-item-unit").value.trim();
    const state = row.querySelector(".experiment-stock-state");
    if (!item) {
      state.className = "experiment-stock-state stock-alert";
      state.textContent = "Non connecte";
      return;
    }
    if (unit && item.unit !== unit) {
      state.className = "experiment-stock-state stock-alert";
      state.textContent = `${item.quantity} ${item.unit} - unite differente`;
      return;
    }
    const ok = Number(item.quantity) >= needed;
    state.className = `experiment-stock-state ${ok ? "stock-ok" : "stock-alert"}`;
    state.textContent = `${item.quantity} ${item.unit}`;
  });
}

function saveExperiment() {
  if (!experimentForm.reportValidity()) return;
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  const id = experimentFields.experimentId.value || `exp-${Date.now()}`;
  const experiment = {
    id,
    name: experimentFields.experimentName.value.trim(),
    templateId: experimentFields.experimentTemplate.value,
    templateName: template?.name || "Template inconnu",
    conditions: Number(experimentFields.experimentConditions.value),
    replicates: Number(experimentFields.experimentReplicates.value),
    status: experimentFields.experimentStatus.value,
    notes: experimentFields.experimentNotes.value.trim(),
    createdBy: currentName,
    updatedAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    items: getExperimentRows()
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

function getExperimentRows() {
  return [...experimentItemsList.querySelectorAll(".experiment-item-row")]
    .map(row => {
      const item = items.find(entry => entry.id === row.querySelector(".experiment-item-select").value);
      return {
        itemId: item?.id || "",
        name: item?.name || "",
        quantity: Number(row.querySelector(".experiment-item-quantity").value || 0),
        unit: row.querySelector(".experiment-item-unit").value.trim(),
        notes: row.querySelector(".experiment-item-notes").value.trim(),
        perConditionQuantity: Number(row.dataset.perCondition || 0)
      };
    })
    .filter(line => line.itemId && line.quantity >= 0);
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
  experiment.items.forEach(line => {
    const item = findInventoryItem(line);
    if (item) item.quantity = Number((Number(item.quantity) - Number(line.quantity || 0)).toFixed(3));
  });
  experiment.status = "completed";
  experiment.updatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  addHistory("Experience consommée", `${currentName} a consommé le stock pour ${experiment.name}.`);
  persist();
  render();
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

function openOrderModal() {
  orderForm.reset();
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
    order = {
      id: `ord-${Date.now()}`,
      status: "requested",
      itemMode: "new",
      inventoryItemId: null,
      itemName: orderFields.orderNewName.value.trim(),
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
      newItemData: {
        name: orderFields.orderNewName.value.trim(),
        category: orderFields.orderNewCategory.value.trim(),
        quantity: 0,
        unit: orderFields.orderNewUnit.value.trim(),
        minStock: Number(orderFields.orderNewMinStock.value),
        maxStock: Number(orderFields.orderNewMaxStock.value),
        location: orderFields.orderNewLocation.value.trim(),
        tags: orderFields.orderNewTags.value.split(",").map(tag => tag.trim()).filter(Boolean),
        notes: orderFields.orderNewItemNotes.value.trim(),
        references: { primary: {}, secondary: [] }
      }
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
  if (!order || order.status !== "requested") return;

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

  const receivedAmount = Number(order.requestedQuantity || 0);

  order.status = "received";
  order.receivedQuantity = receivedAmount;
  order.receivedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  order.receivedAtRaw = new Date().toISOString();
  order.receivedBy = currentName;

  if (order.inventoryItemId) {
    const item = items.find(entry => entry.id === order.inventoryItemId);
    if (item) {
      item.quantity = Number((Number(item.quantity) + receivedAmount).toFixed(3));
    }
  } else if (order.newItemData) {
    const newItem = {
      id: `itm-${Date.now()}`,
      ...order.newItemData,
      quantity: receivedAmount
    };
    items.unshift(newItem);
    order.inventoryItemId = newItem.id;
  }

  addHistory("Commande reçue", `${currentName} a réceptionné ${order.itemName}.`);
  persist();
  render();
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
  if (!order || order.status !== "received") return;

  const receivedAmount = Number(order.receivedQuantity ?? order.requestedQuantity ?? 0);
  const item = order.inventoryItemId
    ? items.find(entry => entry.id === order.inventoryItemId)
    : null;

  if (item) {
    if (Number(item.quantity) < receivedAmount) {
      window.alert("Impossible de revenir en arrière : le stock actuel est inférieur à la quantité reçue.");
      return;
    }

    if (order.newItemData && Number(item.quantity) === receivedAmount) {
      items = items.filter(entry => entry.id !== item.id);
      order.inventoryItemId = "";
    } else {
      item.quantity = Number((Number(item.quantity) - receivedAmount).toFixed(3));
    }
  }

  order.status = "ordered";
  order.receivedQuantity = "";
  order.receivedAt = "";
  order.receivedAtRaw = "";
  order.receivedBy = "";

  addHistory("Réception annulée", `${currentName} a renvoyé ${order.itemName} vers "Commandé".`);
  persist();
  render();
}

function openOrdersHistory() {
  selectedOrderId = null;
  ordersMode = "history";
  renderOrders();
}

function closeOrdersHistory() {
  ordersMode = "board";
  renderOrders();
}

function formatOrderHistoryDate(value) {
  return value ? escapeHtml(value) : "—";
}

function renderOrdersHistory() {
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
                    <span>Quantité demandée : ${escapeHtml(String(order.requestedQuantity ?? "—"))}</span>
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

function markOrderDone(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;
  orders = orders.filter(entry => entry.id !== id);
  addHistory("Commande effectuée", `${currentName} a marqué ${order.itemName} comme commande.`);
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

function migrateItems(itemList) {
  return itemList.map(item => ({
    ...item,
    category: inventoryCategories.includes(item.category)
      ? item.category
      : legacyCategoryMap[item.category] || inventoryCategories[0],
    location: inventoryLocations.includes(item.location)
      ? item.location
      : legacyLocationMap[item.location] || inventoryLocations[0],
    tags: Array.isArray(item.tags) ? item.tags : [],
    references: normalizeReferences(item.references)
  }));
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
  return experimentList.map(experiment => ({
    ...experiment,
    status: ["draft", "running", "completed"].includes(experiment.status) ? experiment.status : "draft",
    conditions: Math.max(1, Number(experiment.conditions || 1)),
    replicates: Math.max(1, Number(experiment.replicates || 1)),
    items: Array.isArray(experiment.items) ? experiment.items : []
  }));
}

function findInventoryItem(line) {
  return items.find(item => item.id === line.itemId)
    || items.find(item => normalizeSearch(item.name) === normalizeSearch(line.name || ""));
}

function experimentStockSummary(experiment) {
  const missing = experiment.items.filter(line => {
    const item = findInventoryItem(line);
    return !item || item.unit !== line.unit || Number(item.quantity) < Number(line.quantity || 0);
  }).length;
  return { ok: missing === 0, missing };
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
