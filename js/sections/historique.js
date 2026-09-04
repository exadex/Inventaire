// Section Historique : journal des modifications, filtres et pagination.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

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
