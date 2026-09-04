// Section Localisations : hierarchie salles/localisations/sous-localisations et placements.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

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
function getSamplePlacement(sample) {
  return {
    roomId: sample?.roomId || null,
    locationId: sample?.locationId || null,
    sublocationId: sample?.sublocationId || null
  };
}

function readSamplePlacement() {
  const row = document.querySelector("#samplePlacementRow [data-sample-placement-row]");
  return {
    roomId: row?.querySelector("[data-sample-placement-room]")?.value || null,
    locationId: row?.querySelector("[data-sample-placement-location]")?.value || null,
    sublocationId: row?.querySelector("[data-sample-placement-sublocation]")?.value || null
  };
}

function validateSamplePlacement(placement, options = {}) {
  const error = document.querySelector("#samplePlacementError");
  if (error) { error.textContent = ""; error.classList.add("hidden"); }

  if (!placement.roomId) {
    const message = "Veuillez sélectionner une salle.";
    if (options.onSubmit && error) { error.textContent = message; error.classList.remove("hidden"); }
    return false;
  }

  const catalog = normalizeLocationCatalog(sharedState.locationCatalog);
  const location = placement.locationId && catalog.locations.find(row => row.id === placement.locationId);
  const sublocation = placement.sublocationId && catalog.sublocations.find(row => row.id === placement.sublocationId);
  const invalid = !FIXED_INVENTORY_ROOMS.some(row => row.id === placement.roomId) ||
    (placement.locationId && (!location || location.roomId !== placement.roomId)) ||
    (placement.sublocationId && (!placement.locationId || !sublocation || sublocation.locationId !== placement.locationId));

  const message = invalid ? "Un emplacement contient une hiérarchie incohérente." : "";
  if (error) { error.textContent = message; error.classList.toggle("hidden", !message); }
  return !invalid;
}

function renderSamplePlacementEditor(placement = readSamplePlacement()) {
  const container = document.querySelector("#samplePlacementRow");
  if (!container) return;

  const catalog = normalizeLocationCatalog(sharedState.locationCatalog);
  const roomLocations = catalog.locations.filter(row => row.roomId === placement.roomId);
  const sublocations = catalog.sublocations.filter(row => row.locationId === placement.locationId);

  container.innerHTML = `<div class="placement-row" data-sample-placement-row>
    <label>Salle<select data-sample-placement-room required><option value="">Sélectionner une salle</option>${FIXED_INVENTORY_ROOMS.map(room => `<option value="${room.id}" ${room.id === placement.roomId ? "selected" : ""}>${escapeHtml(room.name)}</option>`).join("")}</select></label>
    ${roomLocations.length ? `<label>Localisation<select data-sample-placement-location><option value="">Aucune — directement dans la salle</option>${roomLocations.map(location => `<option value="${location.id}" ${location.id === placement.locationId ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("")}</select></label>` : ""}
    ${sublocations.length ? `<label>Sous-localisation<select data-sample-placement-sublocation><option value="">Aucune — directement dans la localisation</option>${sublocations.map(sub => `<option value="${sub.id}" ${sub.id === placement.sublocationId ? "selected" : ""}>${escapeHtml(sub.name)}</option>`).join("")}</select></label>` : ""}
  </div>`;

  sampleFields.sampleLocation.value = placement.roomId ? "valid" : "";

  container.querySelector("[data-sample-placement-room]")?.addEventListener("change", event => {
    renderSamplePlacementEditor({ roomId: event.target.value || null, locationId: null, sublocationId: null });
  });
  container.querySelector("[data-sample-placement-location]")?.addEventListener("change", event => {
    renderSamplePlacementEditor({ roomId: placement.roomId, locationId: event.target.value || null, sublocationId: null });
  });
  container.querySelector("[data-sample-placement-sublocation]")?.addEventListener("change", () => {
    validateSamplePlacement(readSamplePlacement());
  });

  validateSamplePlacement(readSamplePlacement());
}


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
