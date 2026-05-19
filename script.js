const seedItems = [
  {
    id: "itm-001",
    name: "Collagenase type I",
    category: "Enzymes",
    quantity: 2,
    unit: "flacons",
    minStock: 3,
    maxStock: 12,
    location: "Freezer -20C / Rack B2",
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
    location: "Chambre froide / Etagere 3",
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
    location: "Freezer -80C / Boite AC-04",
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
    location: "Freezer -20C / Boite PR-12",
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
    location: "Freezer -20C / Rack C1",
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
    location: "Salle culture / Armoire A",
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
    location: "Chambre froide / Kit shelf",
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
    location: "Stock central / Bac C",
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

let items = load("exadex_items", load("adipovault_items", seedItems));
let orders = load("exadex_orders", defaultOrders);
let history = load("exadex_history", load("adipovault_history", defaultHistory));
let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";

const auth = document.querySelector("#auth");
const app = document.querySelector("#app");
const loginForm = document.querySelector("#loginForm");
const nameInput = document.querySelector("#nameInput");
const currentUser = document.querySelector("#currentUser");
const currentUserName = document.querySelector("#currentUserName");
const sidebarUser = document.querySelector("#sidebarUser");
const sidebarUserName = document.querySelector("#sidebarUserName");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const dialog = document.querySelector("#itemDialog");
const form = document.querySelector("#itemForm");
const orderDialog = document.querySelector("#orderDialog");
const orderForm = document.querySelector("#orderForm");

const fields = ["itemId", "name", "category", "quantity", "unit", "minStock", "maxStock", "location", "tags", "notes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = ["orderItemName", "orderQuantity", "orderPriority", "orderSupplier", "orderNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentName = nameInput.value.trim();
  if (!currentName) return;
  updateUserIdentity();
  auth.classList.add("hidden");
  app.classList.remove("hidden");
  addHistory("Connexion", `${currentName} a ouvert une session.`);
  persist();
  render();
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  addHistory("Deconnexion", `${currentName} a ferme sa session.`);
  persist();
  app.classList.add("hidden");
  auth.classList.remove("hidden");
});

document.querySelector("#addItemBtn").addEventListener("click", () => openModal());
document.querySelector("#saveItemBtn").addEventListener("click", saveItem);
document.querySelector("#deleteItemBtn").addEventListener("click", deleteItem);
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
  const initials = currentName
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  currentUser.textContent = initials;
  sidebarUser.textContent = initials;
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
  const categories = [...new Set(items.map(item => item.category))].sort();
  categoryFilter.innerHTML = `<option value="all">Toutes categories</option>${categories.map(category => `<option>${escapeHtml(category)}</option>`).join("")}`;
  categoryFilter.value = categories.includes(selected) ? selected : "all";
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
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filtered = items.filter(item => {
    const haystack = [item.name, item.category, item.location, item.notes, ...item.tags].join(" ").toLowerCase();
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
  document.querySelector("#historyList").innerHTML = history.map(entry => `
    <article class="history-entry">
      <time>${escapeHtml(entry.date)}</time>
      <div><strong>${escapeHtml(entry.action)}</strong> - ${escapeHtml(entry.user)}<br><span>${escapeHtml(entry.detail)}</span></div>
    </article>
  `).join("");
}

function renderLocations() {
  const groups = items.reduce((acc, item) => {
    const place = item.location.split("/")[0].trim();
    acc[place] ||= [];
    acc[place].push(item);
    return acc;
  }, {});
  document.querySelector("#locationGrid").innerHTML = Object.entries(groups).map(([place, group]) => `
    <article class="location-card">
      <strong>${escapeHtml(place)}</strong>
      <p>${group.length} reference${group.length > 1 ? "s" : ""}</p>
      <div class="mini-list">${group.slice(0, 4).map(item => `<span>${escapeHtml(item.name)} - ${escapeHtml(item.location.split("/").slice(1).join("/").trim())}</span>`).join("")}</div>
    </article>
  `).join("");
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
  document.querySelector("#modalTitle").textContent = item ? "Modifier item" : "Nouvel item";
  document.querySelector("#deleteItemBtn").style.display = item ? "inline-block" : "none";
  fields.itemId.value = item?.id || "";
  fields.name.value = item?.name || "";
  fields.category.value = item?.category || "";
  fields.quantity.value = item?.quantity ?? "";
  fields.unit.value = item?.unit || "";
  fields.minStock.value = item?.minStock ?? "";
  fields.maxStock.value = item?.maxStock ?? "";
  fields.location.value = item?.location || "";
  fields.tags.value = item?.tags?.join(", ") || "";
  fields.notes.value = item?.notes || "";
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
    notes: fields.notes.value.trim()
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
  addHistory("Item supprime", `${currentName} a supprime ${item.name} de l'inventaire.`);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
