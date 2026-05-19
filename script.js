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
    priority: "muy urgente",
    supplier: "Worthington",
    notes: "Stock sous seuil minimum.",
    requestedBy: "CB",
    createdAt: "2026-05-19 09:12"
  },
  {
    id: "ord-003",
    itemName: "Cryotubes 2 mL steriles",
    quantity: "1 carton",
    priority: "no urgente",
    supplier: "Corning",
    notes: "Reassort pour cryostock.",
    requestedBy: "IR",
    createdAt: "2026-05-15 10:04"
  }
];

const defaultHistory = [
  { date: "Aujourd'hui 09:12", user: "Caroline", action: "Stock ajuste", detail: "Collagenase type I passee a 2 flacons." },
  { date: "Hier 17:35", user: "Marie", action: "Demande de commande", detail: "Kit ELISA Adiponectine ajoute a la liste A commander." },
  { date: "2026-05-16", user: "Ines", action: "Note modifiee", detail: "Anti-Perilipin A: dilution de travail confirmee." }
];

let items = migrateItems(load("exadex_items", load("adipovault_items", seedItems)));
let orders = load("exadex_orders", defaultOrders);
let history = load("exadex_history", load("adipovault_history", defaultHistory));
let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";
let selectedLocation = null;

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
const dialog = document.querySelector("#itemDialog");
const form = document.querySelector("#itemForm");
const orderDialog = document.querySelector("#orderDialog");
const orderForm = document.querySelector("#orderForm");
const secondaryReferencesList = document.querySelector("#secondaryReferencesList");
const addSecondaryReferenceBtn = document.querySelector("#addSecondaryReferenceBtn");

const fields = ["itemId", "name", "category", "quantity", "unit", "minStock", "maxStock", "location", "tags", "notes", "primaryReference", "primaryReferenceQuantity", "primaryReferencePrice"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = ["orderItemName", "orderQuantity", "orderPriority", "orderSupplier", "orderNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

renderCategoryOptions();
renderLocationOptions();

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
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
searchInput.addEventListener("input", renderInventory);
categoryFilter.addEventListener("change", renderInventory);

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
    controlBar.classList.toggle("hidden", activeView === "history");
    app.classList.toggle("history-mode", activeView === "history");
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

function render() {
  renderCategories();
  renderMetrics();
  renderAlerts();
  renderInventory();
  renderSamples();
  renderHistory();
  renderLocations();
  renderOrders();
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
    const haystack = normalizeSearch([item.name, item.location, item.category, ...item.tags, referenceText].join(" "));
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
        ${item.references?.primary?.reference ? `<small>Ref. principale : ${escapeHtml(item.references.primary.reference)}</small>` : ""}
        <div class="card-actions">
          <small>${escapeHtml(item.location)}</small>
          <button class="text-btn" onclick="openModal('${item.id}')">Modifier</button>
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
        <button class="text-btn" onclick="markOrderDone('${order.id}')">Marquer commande</button>
      </div>
    </article>
  `).join("");
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
  fields.tags.value = item?.tags?.join(", ") || "";
  fields.notes.value = item?.notes || "";
  fields.primaryReference.value = references.primary.reference;
  fields.primaryReferenceQuantity.value = references.primary.quantity;
  fields.primaryReferencePrice.value = references.primary.price;
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
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: fields.notes.value.trim(),
    references: getItemReferences()
  };
  const index = items.findIndex(entry => entry.id === id);
  if (index >= 0) {
    items[index] = item;
    addHistory("Item modifie", `${currentName} a modifie ${item.name}.`);
  } else {
    items.unshift(item);
    addHistory("Item ajoute", `${currentName} a ajoute ${item.name} dans ${item.category}.`);
  }
  persist();
  dialog.close();
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
  addHistory("Demande de commande", `${currentName} a ajoute ${order.itemName} a la liste A commander (${priorityLabel(order.priority)}).`);
  persist();
  orderDialog.close();
  renderOrders();
  renderHistory();
}

function markOrderDone(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;
  orders = orders.filter(entry => entry.id !== id);
  addHistory("Commande effectuee", `${currentName} a marque ${order.itemName} comme commande.`);
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
    references: normalizeReferences(item.references)
  }));
}

function addSecondaryReferenceRow(reference = {}) {
  const row = document.createElement("div");
  row.className = "secondary-reference-row";
  const referenceNumber = secondaryReferencesList.children.length + 1;
  row.innerHTML = `
    <label>R&eacute;f&eacute;rence secondaire ${referenceNumber}<input class="secondary-reference" value="${escapeHtml(reference.reference || "")}" /></label>
    <label>Quantit&eacute;<input class="secondary-reference-quantity" value="${escapeHtml(reference.quantity || "")}" /></label>
    <label>Prix<input class="secondary-reference-price" value="${escapeHtml(reference.price || "")}" /></label>
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
      quantity: row.querySelector(".secondary-reference-quantity").value.trim(),
      price: row.querySelector(".secondary-reference-price").value.trim()
    }))
    .filter(reference => reference.reference || reference.quantity || reference.price);

  return {
    primary: {
      reference: fields.primaryReference.value.trim(),
      quantity: fields.primaryReferenceQuantity.value.trim(),
      price: fields.primaryReferencePrice.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  return {
    primary: {
      reference: references?.primary?.reference || "",
      quantity: references?.primary?.quantity || "",
      price: references?.primary?.price || ""
    },
    secondary: Array.isArray(references?.secondary) ? references.secondary : []
  };
}

function itemReferencesText(references) {
  const normalized = normalizeReferences(references);
  return [
    normalized.primary.reference,
    normalized.primary.quantity,
    normalized.primary.price,
    ...normalized.secondary.flatMap(reference => [reference.reference, reference.quantity, reference.price])
  ].filter(Boolean).join(" ");
}

function priorityRank(priority) {
  return {
    critique: 0,
    "muy urgente": 1,
    urgente: 2,
    "no urgente": 3
  }[priority] ?? 9;
}

function priorityLabel(priority) {
  return {
    critique: "Critique",
    "muy urgente": "Muy urgente",
    urgente: "Urgente",
    "no urgente": "No urgente"
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
