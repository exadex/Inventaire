const inventoryLocations = [
  "Laboratoire",
  "Culture",
  "Chambre froide",
  "-80°C",
  "-20°C blanc labo",
  "-20°C gris labo",
  "-20°C Floricia labo",
  "Bureau",
  "Frigo labo",
  "-20°C 1 salle -80",
  "-20°C 2 salle -80",
  "-20°C 3 salle -80"
];

const locationIcons = {
  "Laboratoire": "🔬",
  "Culture": "🧫",
  "Chambre froide": "❄️",
  "-80°C": "🧊",
  "-20°C blanc labo": "⬜",
  "-20°C gris labo": "◻️",
  "-20°C Floricia labo": "🌸",
  "Bureau": "💻",
  "Frigo labo": "🧃",
  "-20°C 1 salle -80": "1️⃣",
  "-20°C 2 salle -80": "2️⃣",
  "-20°C 3 salle -80": "3️⃣"
};

const userIcons = {
  Vincent: "🧬",
  Luigi: "⚗️",
  Elina: "🔬",
  Floricia: "🧫",
  Caroline: "🧪",
  Christian: "🧭"
};

const inventoryCategories = [
  "Procédé ExAdEx L2",
  "Culture Cell",
  "Biomol",
  "Microscopie",
  "Qualité",
  "FACS",
  "Muse",
  "Bureautique",
  "Code Famille",
  "Cones pipettes",
  "Indispensable"
];

const legacyCategoryMap = {
  Enzymes: "Procédé ExAdEx L2",
  Milieux: "Culture Cell",
  Anticorps: "Biomol",
  Primers: "Biomol",
  Composes: "Culture Cell",
  Consommables: "Indispensable",
  Kits: "Biomol"
};

const legacyLocationMap = {
  "Freezer -20C / Rack B2": "-20°C blanc labo",
  "Chambre froide / Etagere 3": "Chambre froide",
  "Freezer -80C / Boite AC-04": "-80°C",
  "Freezer -20C / Boite PR-12": "-20°C gris labo",
  "Freezer -20C / Rack C1": "-20°C Floricia labo",
  "Salle culture / Armoire A": "Culture",
  "Chambre froide / Kit shelf": "Chambre froide",
  "Stock central / Bac C": "Laboratoire"
};

const seedItems = [
  {
    id: "itm-001",
    name: "Collagenase type I",
    category: "Enzymes",
    quantity: 2,
    unit: "flacons",
    minStock: 3,
    maxStock: 12,
    location: "-20°C blanc labo",
    tags: ["digestion", "adipose"],
    notes: "Lot valide pour dissociation de tissu adipeux humain."
  },
  {
    id: "itm-002",
    name: "DMEM/F12 + GlutaMAX",
    category: "Milieux",
    quantity: 8,
    unit: "bouteilles",
    minStock: 4,
    maxStock: 16,
    location: "Chambre froide",
    tags: ["culture", "ex vivo"],
    notes: "A verifier avant mise en culture longue."
  },
  {
    id: "itm-003",
    name: "Anti-Perilipin A",
    category: "Anticorps",
    quantity: 35,
    unit: "uL",
    minStock: 25,
    maxStock: 100,
    location: "-80°C",
    tags: ["IF", "adipocyte"],
    notes: "Dilution courante 1:400."
  },
  {
    id: "itm-004",
    name: "Primer PPARG humain",
    category: "Primers",
    quantity: 12,
    unit: "tubes",
    minStock: 6,
    maxStock: 24,
    location: "-20°C gris labo",
    tags: ["qPCR", "differenciation"],
    notes: "Forward + reverse aliquotes."
  },
  {
    id: "itm-005",
    name: "Insuline humaine recombinante",
    category: "Composes",
    quantity: 1,
    unit: "flacon",
    minStock: 2,
    maxStock: 8,
    location: "-20°C Floricia labo",
    tags: ["stimulation", "metabolisme"],
    notes: "Preparer nouvel aliquotage."
  },
  {
    id: "itm-006",
    name: "Plaques 24 puits low attachment",
    category: "Consommables",
    quantity: 42,
    unit: "plaques",
    minStock: 20,
    maxStock: 80,
    location: "Culture",
    tags: ["culture", "explants"],
    notes: "Reservees aux fragments de tissu."
  },
  {
    id: "itm-007",
    name: "Kit ELISA Adiponectine",
    category: "Kits",
    quantity: 0,
    unit: "kit",
    minStock: 1,
    maxStock: 4,
    location: "Chambre froide",
    tags: ["ELISA", "secretion"],
    notes: "Commander avant prochaine serie."
  },
  {
    id: "itm-008",
    name: "Cryotubes 2 mL steriles",
    category: "Consommables",
    quantity: 350,
    unit: "tubes",
    minStock: 150,
    maxStock: 500,
    location: "Laboratoire",
    tags: ["cryostock", "aliquot"],
    notes: "Compatible azote liquide."
  }
];

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

const protocolTemplates = [
  {
    id: "tpl-rtqpcr",
    name: "RT-qPCR",
    protocol: "RT-qPCR",
    notes: "Preparation gene expression: extraction, reverse transcription et mix qPCR.",
    items: [
      { itemId: "itm-004", name: "Primer PPARG humain", perConditionQuantity: 1, unit: "tubes", notes: "Forward + reverse par condition" },
      { itemId: "itm-008", name: "Cryotubes 2 mL steriles", perConditionQuantity: 2, unit: "tubes", notes: "Aliquotage RNA/cDNA" }
    ]
  },
  {
    id: "tpl-elisa",
    name: "ELISA adipokines",
    protocol: "ELISA",
    notes: "Dosage proteique en plaques, compatible surnageants de culture.",
    items: [
      { itemId: "itm-007", name: "Kit ELISA Adiponectine", perConditionQuantity: 0.08, unit: "kit", notes: "Plaque et standards inclus" },
      { itemId: "itm-008", name: "Cryotubes 2 mL steriles", perConditionQuantity: 1, unit: "tubes", notes: "Stockage surnageants" }
    ]
  },
  {
    id: "tpl-lipolyse",
    name: "Lipolyse",
    protocol: "Lipolyse",
    notes: "Stimulation metabolique et collecte du milieu.",
    items: [
      { itemId: "itm-002", name: "DMEM/F12 + GlutaMAX", perConditionQuantity: 500, unit: "uL", notes: "Milieu par condition" },
      { itemId: "itm-005", name: "Insuline humaine recombinante", perConditionQuantity: 0.02, unit: "flacon", notes: "Stimulation" }
    ]
  },
  {
    id: "tpl-glucose",
    name: "Glucose uptake",
    protocol: "Glucose uptake",
    notes: "Mesure d'absorption du glucose sur adipocytes/explants.",
    items: [
      { itemId: "itm-002", name: "DMEM/F12 + GlutaMAX", perConditionQuantity: 500, unit: "uL", notes: "Milieu par condition" },
      { itemId: "itm-006", name: "Plaques 24 puits low attachment", perConditionQuantity: 0.05, unit: "plaques", notes: "Puits experimentaux" }
    ]
  },
  {
    id: "tpl-imagerie",
    name: "Imagerie",
    protocol: "Imagerie",
    notes: "Preparation echantillons et immunofluorescence.",
    items: [
      { itemId: "itm-003", name: "Anti-Perilipin A", perConditionQuantity: 3, unit: "uL", notes: "Anticorps primaire" },
      { itemId: "itm-006", name: "Plaques 24 puits low attachment", perConditionQuantity: 0.05, unit: "plaques", notes: "Culture/imagerie" }
    ]
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

let items = migrateItems(load("exadex_items", load("adipovault_items", seedItems)));
let orders = load("exadex_orders", defaultOrders);
let experiments = migrateExperiments(load("exadex_experiments", defaultExperiments));
let history = load("exadex_history", load("adipovault_history", defaultHistory));
let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";
let selectedLocation = null;
let selectedExperimentId = null;

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

const fields = ["itemId", "name", "category", "quantity", "unit", "minStock", "maxStock", "location", "protocol", "tags", "notes", "primaryReference", "primaryReferenceNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const stockFields = ["stockItemId", "stockItemName", "stockCurrentQuantity", "stockTitle", "stockAction", "stockAmount", "stockUnit", "stockNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const experimentFields = ["experimentId", "experimentTemplate", "experimentName", "experimentConditions", "experimentReplicates", "experimentStatus", "experimentTotalConditions", "experimentNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = ["orderItemName", "orderQuantity", "orderPriority", "orderSupplier", "orderNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

renderCategoryOptions();
renderLocationOptions();
renderTemplateOptions();

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentName = nameInput.value.trim();
  if (!currentName) return;
  updateUserIdentity();
  auth.classList.add("hidden");
  app.classList.remove("hidden");
  persist();
  render();
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

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.querySelector(`#${activeView}View`).classList.add("active");
    controlBar.classList.toggle("hidden", activeView !== "inventory");
    app.classList.toggle("history-mode", activeView === "history");
    if (activeView === "experiments") renderExperiments();
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
  document.querySelector("#alerts").innerHTML = critical.map(item => `
    <div class="alert">! ${escapeHtml(item.name)} - Rupture critique : ${item.quantity} ${escapeHtml(item.unit)} restants (min. ${item.minStock} ${escapeHtml(item.unit)})</div>
  `).join("");
}

function renderInventory() {
  const query = normalizeSearch(searchInput.value);
  const category = categoryFilter.value;
  const filtered = items.filter(item => {
    const referenceText = itemReferencesText(item.references);
    const haystack = normalizeSearch([item.name, item.location, item.category, item.protocol, ...item.tags, referenceText].join(" "));
    return (!query || haystack.includes(query))
      && (statusFilter === "all" || itemStatus(item) === statusFilter)
      && (category === "all" || item.category === category);
  });

  document.querySelector("#resultCount").textContent = `${filtered.length} resultat${filtered.length > 1 ? "s" : ""}`;
  document.querySelector("#inventoryGrid").innerHTML = filtered.map(item => {
    const status = itemStatus(item);
    const percent = Math.min(100, Math.round((Number(item.quantity) / Number(item.maxStock || 1)) * 100));
    return `
      <article class="item-card">
        <div class="item-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="badge ${status}">${statusLabel(status)}</span>
        </div>
        <span class="category">${escapeHtml(item.category)}</span>
        <div class="bar"><span class="${status}" style="width:${percent}%"></span></div>
        <div class="stock-line">
          <span>${item.quantity} ${escapeHtml(item.unit)}</span>
          <span>Max : ${item.maxStock} ${escapeHtml(item.unit)}</span>
        </div>
        <div class="tags">${item.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        ${item.protocol ? `<small>Protocole : ${escapeHtml(item.protocol)}</small>` : ""}
        ${item.references?.primary?.reference ? `<small>Ref. principale : ${escapeHtml(item.references.primary.reference)}</small>` : ""}
        <div class="card-actions">
          <small>${escapeHtml(item.location)}</small>
          <div class="card-button-stack">
            <button class="text-btn" onclick="openModal('${item.id}')">Modifier</button>
            <button class="text-btn" onclick="openStockModal('${item.id}')">Stock update</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
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
    const place = item.location;
    acc[place] ||= [];
    acc[place].push(item);
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
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(item.category)} · ${item.quantity} ${escapeHtml(item.unit)} · Tags: ${item.tags.map(tag => escapeHtml(tag)).join(", ") || "aucun"}</span>
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
  const sorted = [...orders].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  document.querySelector("#orderList").innerHTML = sorted.map(order => `
    <article class="order-card priority-${slugPriority(order.priority)}">
      <div class="item-head">
        <div>
          <strong>${escapeHtml(order.itemName)}</strong>
          <span class="category">${escapeHtml(order.quantity)}${order.supplier ? ` - ${escapeHtml(order.supplier)}` : ""}</span>
        </div>
        <span class="priority-badge">${escapeHtml(priorityLabel(order.priority))}</span>
      </div>
      <p>${escapeHtml(order.notes || "Aucune note")}</p>
      <div class="card-actions">
        <small>Ajoute par ${escapeHtml(order.requestedBy)} - ${escapeHtml(order.createdAt)}</small>
        <button class="text-btn" onclick="markOrderDone('${order.id}')">Effacer</button>
      </div>
    </article>
  `).join("");
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
      <article class="experiment-card">
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
          <span class="${stock.ok ? "stock-ok" : "stock-alert"}">${stock.ok ? "Stock OK" : `${stock.missing} alerte${stock.missing > 1 ? "s" : ""}`}</span>
        </div>
        <p>${escapeHtml(experiment.notes || "Aucune note")}</p>
        <div class="card-actions">
          <small>${escapeHtml(experiment.createdBy)} - ${escapeHtml(experiment.updatedAt)}</small>
          <div class="card-button-stack">
            <button class="text-btn" type="button" onclick="selectExperiment('${experiment.id}')">Ouvrir</button>
            <button class="text-btn" type="button" onclick="openExperimentModal('${experiment.id}')">Modifier</button>
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
        <td><strong>${escapeHtml(line.name)}</strong><br><span>${escapeHtml(line.notes || "")}</span></td>
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
        <button class="ghost-btn compact-btn" type="button" onclick="selectExperiment(null)">Retour</button>
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

function selectExperiment(id) {
  selectedExperimentId = id;
  renderExperiments();
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
  fields.location.value = item?.location || inventoryLocations[0];
  fields.protocol.value = item?.protocol || "";
  fields.tags.value = item?.tags?.join(", ") || "";
  fields.notes.value = item?.notes || "";
  fields.primaryReference.value = references.primary.reference;
  fields.primaryReferenceNotes.value = references.primary.notes;
  renderSecondaryReferences(references.secondary);
  dialog.showModal();
}

function saveItem() {
  if (!form.reportValidity()) return;
  const id = fields.itemId.value || `itm-${Date.now()}`;
  const item = {
    id,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: Number(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: Number(fields.minStock.value),
    maxStock: Number(fields.maxStock.value),
    location: fields.location.value.trim(),
    protocol: fields.protocol.value.trim(),
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
  render();
}

function openOrderModal() {
  orderForm.reset();
  orderFields.orderPriority.value = "critique";
  orderDialog.showModal();
}

function saveOrder() {
  if (!orderForm.reportValidity()) return;
  const order = {
    id: `ord-${Date.now()}`,
    itemName: orderFields.orderItemName.value.trim(),
    quantity: orderFields.orderQuantity.value.trim(),
    priority: orderFields.orderPriority.value,
    supplier: orderFields.orderSupplier.value.trim(),
    notes: orderFields.orderNotes.value.trim(),
    requestedBy: currentName,
    createdAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date())
  };
  orders.unshift(order);
  addHistory("Demande de commande", `${currentName} a ajouté ${order.itemName} à la liste À commander (${priorityLabel(order.priority)}).`);
  persist();
  orderDialog.close();
  renderOrders();
  renderHistory();
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
    protocol: item.protocol || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    references: normalizeReferences(item.references)
  }));
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
    .map(row => ({
      reference: row.querySelector(".secondary-reference").value.trim(),
      notes: row.querySelector(".secondary-reference-notes").value.trim()
    }))
    .filter(reference => reference.reference || reference.notes);

  return {
    primary: {
      reference: fields.primaryReference.value.trim(),
      notes: fields.primaryReferenceNotes.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  const legacyPrimaryNotes = [references?.primary?.quantity, references?.primary?.price].filter(Boolean).join(" - ");
  return {
    primary: {
      reference: references?.primary?.reference || "",
      notes: references?.primary?.notes || legacyPrimaryNotes
    },
    secondary: Array.isArray(references?.secondary)
      ? references.secondary.map(reference => ({
        reference: reference.reference || "",
        notes: reference.notes || [reference.quantity, reference.price].filter(Boolean).join(" - ")
      }))
      : []
  };
}

function itemReferencesText(references) {
  const normalized = normalizeReferences(references);
  return [
    normalized.primary.reference,
    normalized.primary.notes,
    ...normalized.secondary.flatMap(reference => [reference.reference, reference.notes])
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
