// Section A commander : tableau des demandes, formulaire et historique des commandes.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

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


function normalizeOrderStatus(status) {
  const normalized = normalizeSearch(status || "");
  if (["ordered", "commandee", "commande"].includes(normalized)) return "ordered";
  if (["received", "arrived", "arrivee", "arrive"].includes(normalized)) return "received";
  if (["archived", "cancelled", "canceled", "annulee", "annule"].includes(normalized)) return "archived";
  return "requested";
}

function isRecentlyReceivedOrder(order, days = 7) {
  const date = parseHistoryDate(order.receivedAtRaw || order.receivedAt);
  if (!date) return true;
  return Date.now() - date.getTime() <= days * 86400000;
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
  const primaryHeaderAction = status === "requested"
    ? `<button class="primary-btn compact-btn" type="button" onclick="moveOrderToOrdered('${escapeHtml(order.id)}')">Marquer comme commandée</button>`
    : status === "ordered"
      ? `<button class="primary-btn compact-btn" type="button" onclick="moveOrderToReceived('${escapeHtml(order.id)}')">Marquer comme arrivée</button>`
      : status === "received" && !order.addedToInventory
        ? `<button class="primary-btn compact-btn" type="button" onclick="openReceiveInventoryDialog('${escapeHtml(order.id)}')">Ajouter l’item à l’inventaire</button>`
        : "";
  const headerActions = `${primaryHeaderAction}<button class="ghost-btn compact-btn" type="button" onclick="openOrderDatesModal('${escapeHtml(order.id)}')">Modifier les dates</button>`;

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
    .filter(order => normalizeOrderStatus(order.status) !== "received" || isRecentlyReceivedOrder(order))
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
        ${renderDetailRow(getStudyTypeLabel(sample), getSampleCanonicalClientCode(sample))}
        ${renderDetailRow("Date", formatDisplayDateFrench(sample.creationDate))}
        ${renderDetailRow("Quantité / format", formatSampleDisplayQuantity(sample))}
        ${renderDetailRow("Emplacement", placementFullPathDisplayName(getSamplePlacement(sample)) || sample.location)}
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

// fonction pour la date affichée sur les cartes de commandes : format JJ/MM/AA, ou « — » si la date est absente ou non reconnue
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

async function saveOrder() {
  if (orderFields.orderItemMode.value === "existing" && !orderFields.orderInventoryItem.value) {
    orderFields.orderInventorySearch.setCustomValidity("Veuillez sélectionner un item dans la liste.");
  } else {
    orderFields.orderInventorySearch.setCustomValidity("");
  }
  if (!orderForm.reportValidity()) return;

  const errorBox = document.querySelector("#saveOrderError");
  errorBox?.classList.add("hidden");

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

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    if (errorBox) { errorBox.textContent = "La sauvegarde GitHub en écriture est requise pour créer cette demande."; errorBox.classList.remove("hidden"); }
    return;
  }

  const button = document.querySelector("#saveOrderBtn");
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "Enregistrement…";
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-save-${order.id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.orders = Array.isArray(state.orders) ? state.orders : [];
      state.orders.unshift(order);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Demande créée",
        detail: `${currentName} a créé une demande pour ${order.itemName}.`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    orderDialog.close();
    renderOrders();
    renderHistory();
  } catch (error) {
    if (errorBox) { errorBox.textContent = error.message || String(error); errorBox.classList.remove("hidden"); }
  } finally {
    sharedDataIsSaving = false;
    button.disabled = false;
    button.textContent = originalLabel;
    renderAlerts();
  }
}

function orderDateToInputValue(raw) {
  const date = parseHistoryDate(raw);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function openOrderDatesModal(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;
  const errorBox = document.querySelector("#saveOrderDatesError");
  if (errorBox) { errorBox.textContent = ""; errorBox.classList.add("hidden"); }
  document.querySelector("#orderDatesOrderId").value = order.id;
  document.querySelector("#orderDatesRequested").value = orderDateToInputValue(order.requestedAtRaw || order.requestedAt);
  document.querySelector("#orderDatesOrdered").value = orderDateToInputValue(order.orderedAtRaw || order.orderedAt);
  document.querySelector("#orderDatesReceived").value = orderDateToInputValue(order.receivedAtRaw || order.receivedAt);
  document.querySelector("#orderDatesDialog").showModal();
}

function applyOrderDateEdit(target, atKey, rawKey, inputValue) {
  if (!inputValue) {
    target[atKey] = "";
    target[rawKey] = "";
    return;
  }
  const existing = parseHistoryDate(target[rawKey] || target[atKey]);
  const [year, month, day] = inputValue.split("-").map(Number);
  const hours = existing ? existing.getHours() : 12;
  const minutes = existing ? existing.getMinutes() : 0;
  const next = new Date(year, month - 1, day, hours, minutes);
  target[atKey] = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(next);
  target[rawKey] = next.toISOString();
}

async function saveOrderDates() {
  const id = document.querySelector("#orderDatesOrderId").value;
  const order = orders.find(entry => entry.id === id);
  if (!order) return;

  const requestedInput = document.querySelector("#orderDatesRequested").value;
  const orderedInput = document.querySelector("#orderDatesOrdered").value;
  const receivedInput = document.querySelector("#orderDatesReceived").value;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  const errorBox = document.querySelector("#saveOrderDatesError");
  if (errorBox) { errorBox.textContent = ""; errorBox.classList.add("hidden"); }
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    window.alert("La sauvegarde GitHub en écriture est requise pour modifier ces dates.");
    return;
  }

  const saveBtn = document.querySelector("#saveOrderDatesBtn");
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    if (saveBtn) saveBtn.disabled = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-dates-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      const target = (state.orders || []).find(entry => entry.id === id);
      if (!target) throw new Error("Cette demande n’existe plus.");
      applyOrderDateEdit(target, "requestedAt", "requestedAtRaw", requestedInput);
      applyOrderDateEdit(target, "orderedAt", "orderedAtRaw", orderedInput);
      applyOrderDateEdit(target, "receivedAt", "receivedAtRaw", receivedInput);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Dates de la demande modifiées",
        detail: `${currentName} a corrigé les dates de ${target.itemName}.`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    document.querySelector("#orderDatesDialog").close();
    renderOrders();
    renderHistory();
  } catch (error) {
    if (errorBox) { errorBox.textContent = error.message || String(error); errorBox.classList.remove("hidden"); }
    else window.alert(error.message || String(error));
  } finally {
    sharedDataIsSaving = false;
    if (saveBtn) saveBtn.disabled = false;
    renderAlerts();
  }
}

async function moveOrderToOrdered(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || normalizeOrderStatus(order.status) !== "requested") return;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    window.alert("La sauvegarde GitHub en écriture est requise pour marquer cette demande comme commandée.");
    return;
  }
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-ordered-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      const target = (state.orders || []).find(entry => entry.id === id);
      if (!target || normalizeOrderStatus(target.status) !== "requested") throw new Error("Cette demande n’est plus au statut attendu.");
      target.status = "ordered";
      target.orderedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
      target.orderedAtRaw = new Date().toISOString();
      target.orderedBy = currentName;
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Commande effectuée",
        detail: `${currentName} a marqué ${target.itemName} comme commandé.`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    renderOrders();
    renderHistory();
  } catch (error) {
    window.alert(error.message || String(error));
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

async function moveOrderToReceived(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "ordered") return;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    window.alert("La sauvegarde GitHub en écriture est requise pour marquer cette demande comme arrivée.");
    return;
  }
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-received-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      const target = (state.orders || []).find(entry => entry.id === id);
      if (!target || target.status !== "ordered") throw new Error("Cette demande n’est plus au statut attendu.");
      target.status = "received";
      target.receivedQuantity = getOrderRequestedNumericQuantity(target);
      target.receivedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
      target.receivedAtRaw = new Date().toISOString();
      target.receivedBy = currentName;
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Commande reçue",
        detail: `${currentName} a marqué ${target.itemName} comme arrivé.`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    renderOrders();
    renderHistory();
  } catch (error) {
    window.alert(error.message || String(error));
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

async function moveOrderBackToRequested(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "ordered") return;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    window.alert("La sauvegarde GitHub en écriture est requise pour rouvrir cette demande.");
    return;
  }
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-back-requested-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      const target = (state.orders || []).find(entry => entry.id === id);
      if (!target || target.status !== "ordered") throw new Error("Cette demande n’est plus au statut attendu.");
      target.status = "requested";
      target.orderedAt = "";
      target.orderedAtRaw = "";
      target.orderedBy = "";
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Commande rouverte",
        detail: `${currentName} a renvoyé ${target.itemName} vers "À demander".`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    renderOrders();
    renderHistory();
  } catch (error) {
    window.alert(error.message || String(error));
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

async function moveOrderBackToOrdered(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order || order.status !== "received" || order.addedToInventory) return;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    window.alert("La sauvegarde GitHub en écriture est requise pour annuler cette réception.");
    return;
  }
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`order-back-ordered-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      const target = (state.orders || []).find(entry => entry.id === id);
      if (!target || target.status !== "received" || target.addedToInventory) throw new Error("Cette demande n’est plus au statut attendu.");
      target.status = "ordered";
      target.receivedQuantity = 0;
      target.receivedAt = "";
      target.receivedAtRaw = "";
      target.receivedBy = "";
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Réception annulée",
        detail: `${currentName} a renvoyé ${target.itemName} vers "Commandé".`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    renderOrders();
    renderHistory();
  } catch (error) {
    window.alert(error.message || String(error));
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

// Fonction pour confirmer la quantité reçue avant de l'ajouter à l'inventaire, au lieu de supposer qu'elle est égale à la quantité demandée
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

async function deleteOrder(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) throw new Error("Cette demande de commande n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer cette demande.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`order-delete-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.orders = (Array.isArray(state.orders) ? state.orders : []).filter(entry => entry.id !== id);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Demande supprimée",
        detail: `${currentName} a supprimé la demande pour ${order.itemName}.`
      });
      return state;
    });
    sharedDataSha = result.sha;
    sharedDataMode = "github-write";
    sharedDataHasUnsavedChanges = false;
    sharedDataRemoteReady = true;
    sharedDataLastError = "";
    applySharedState(result.data);
    initializeSharedSaveCoordinator(result.data, result.sha);
    renderOrders();
    renderHistory();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}
