// Section Etudes clients : echantillons, replicats et formulaire.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

function renderSamples() {
  const refs = getSampleViewRefs();
  warnMissingSampleViewRefs(refs);

  const query = normalizeSearch(sampleSearchInput?.value || "");
  const type = sampleTypeFilter?.value || "all";
  const studyType = sampleStudyTypeFilter?.value || "all";
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
        (studyType === "all" || getSampleStudyType(sample) === studyType) &&
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
  const selectedGroup = selectedSampleGroupId
    ? getReplicaGroupSamples(selectedSampleGroupId)
    : [];

  if (refs.detail) {
    refs.detail.classList.toggle("has-selection", Boolean(detail || selectedGroup.length));
    refs.detail.innerHTML = selectedGroup.length
      ? renderReplicaGroupDetail(selectedSampleGroupId, selectedGroup)
      : detail
      ? renderSampleDetail(getEffectiveClientSample(detail))
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
  app.classList.toggle("experiments-mode", activeView === "experiments");
  app.classList.toggle("sourcing-mode", activeView === "sourcing");
  app.classList.toggle("samples-mode", activeView === "samples");
  app.classList.toggle("locations-mode", activeView === "locations");
  app.classList.toggle("orders-mode", activeView === "orders");
  app.classList.toggle("contacts-mode", activeView === "contacts");
  app.classList.toggle("agents-mode", activeView === "agents");
  app.classList.toggle("backups-mode", activeView === "backups");
  app.classList.remove("location-detail-mode");
  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(selectedItemId));
}

function renderSampleDetail(sample) {
  const clientRecord = getClientForSample(sample);
  const clientCode = getSampleCanonicalClientCode(sample);
  const studyTypeLabel = getStudyTypeLabel(sample);
  const sampleSubtitle = getClientSampleCategoryLabel(sample) || getClientSampleSubLabel(sample);

  return `
    <div class="client-detail-header">
      <div>
        <div class="client-detail-meta">
          <span class="client-type-badge ${escapeHtml(sample.type)}">${escapeHtml(clientSampleTypes[sample.type] || sample.type)}</span>
          <span class="result-pill">${escapeHtml(studyTypeLabel)} : ${escapeHtml(clientCode)}</span>
        </div>
        <h3>${escapeHtml(sample.name)}</h3>
        <p class="category">${escapeHtml(sampleSubtitle)}</p>
      </div>
    </div>

    <div class="client-detail-section">
      <h4>Informations</h4>
      <div class="item-detail-stack">
        ${renderDetailRow(studyTypeLabel, clientCode)}
        ${renderDetailRow("Date", formatDisplayDateFrench(formatClientSampleDate(sample)))}
        ${renderDetailRow("Quantité / format", formatSampleDisplayQuantity(sample))}
        ${renderDetailRow("Emplacement", placementFullPathDisplayName(getSamplePlacement(sample)) || sample.location)}
        ${renderDetailRow("Identifiant client", clientRecord?.id)}
      </div>
    </div>

    ${sample.generalNotes ? `
      <div class="client-detail-section">
        <h4>Notes générales du groupe</h4>
        <p>${escapeHtml(sample.generalNotes)}</p>
      </div>
    ` : ""}

    ${sample.notes ? `
      <div class="client-detail-section">
        <h4>${sample.replicaNumber ? "Notes spécifiques du réplicat" : "Notes"}</h4>
        <p class="multiline-text">${escapeHtml(sample.notes)}</p>
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
  const rdStudyCount = new Set(
    samples
      .filter(sample => getSampleStudyType(sample) === "rd")
      .map(sample => sample.clientId || sample.normalizedClientKey)
      .filter(Boolean)
  ).size;
  const clientStudyCount = new Set(
    samples
      .filter(sample => getSampleStudyType(sample) === "client")
      .map(sample => sample.clientId || sample.normalizedClientKey)
      .filter(Boolean)
  ).size;

  const kpis = [
    ["🔬", "Études R&D", rdStudyCount],
    ["🏷️", "Études clients", clientStudyCount],
    ["📦", "Produits", productCount],
    ["🧪", "Échantillons", createdCount]
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
    <option value="all">Tous codes</option>
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
    studyTypeLabel: getStudyTypeLabel(sample),
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
    studyTypeLabel: getStudyTypeLabel(firstSample),
    baseName: getReplicaBaseName(firstSample),
    samples,
    count: samples.length
  };
}

function getReplicaFamilyKey(sample) {
  if (sample?.type !== "created_sample") return "";
  if (sample.groupId) return sample.groupId;
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

  return (explicitBaseName || sampleName).replace(/[\s_]+\d+$/, "").trim();
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
        studyTypeLabel: unit.studyTypeLabel,
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
          aria-label="${isCollapsed ? "Déplier" : "Replier"} ${escapeHtml(group.code)}"
          onclick="toggleClientGroup('${escapeHtml(groupKey)}')"
        >
          <span class="client-group-title">
            <span class="client-group-chevron" aria-hidden="true">›</span>
            <span class="client-group-label">${escapeHtml(group.studyTypeLabel)}</span>
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
  const firstSample = getEffectiveClientSample(unit.samples[0]);
  const isSelected = selectedSampleGroupId === unit.key;
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(firstSample)) || "—";
  const locations = Array.from(new Set(unit.samples.map(sample => sample.location).filter(Boolean)));
  const categoryTag = `<span class="client-type-badge created_sample sample-category-${getClientSampleCategoryColorKey(firstSample)}">${escapeHtml(getClientSampleCategoryLabel(firstSample) || "—")}</span>`;

  return `
    <div class="replica-family-block">
      <button
        class="client-sample-row replica-family-row ${isSelected ? "active" : ""}"
        type="button"
        aria-expanded="${isExpanded ? "true" : "false"}"
        onclick="selectReplicaGroup('${escapeHtml(unit.key)}')"
      >
        <div class="client-sample-main">
          <strong title="${escapeHtml(unit.baseName)}">${escapeHtml(unit.baseName)}</strong>
          <div class="client-sample-subline">
            <span class="client-type-badge ${escapeHtml(firstSample.type)}">${escapeHtml(clientSampleTypes[firstSample.type] || firstSample.type)}</span>
            <span class="client-replica-count">${unit.count} réplicat${unit.count > 1 ? "s" : ""}</span>
            <span
              class="client-sample-cell-muted replica-toggle-action"
              role="button"
              tabindex="0"
              onclick="event.stopPropagation(); toggleReplicaGroup('${escapeHtml(unit.key)}')"
              onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); toggleReplicaGroup('${escapeHtml(unit.key)}'); }"
            >${isExpanded ? "Replier" : "Déplier"}</span>
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

        <span class="client-table-cell" data-label="Catégorie"><span class="client-quantity-category-value">${categoryTag}</span></span>
        <span class="client-table-cell" data-label="Localisation">${escapeHtml(locations.join(", ") || "—")}</span>
        <span class="client-table-cell" data-label="Date">${escapeHtml(formattedDate)}</span>
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
  sample = getEffectiveClientSample(sample);
  const isSelected = selectedSampleId === sample.id;
  const formattedDate = formatDisplayDateFrench(formatClientSampleDate(sample)) || "—";
  const formattedQuantity = formatSampleDisplayQuantity(sample) || "—";
  const middleCell = sample.type === "created_sample"
    ? `<span class="client-type-badge created_sample sample-category-${getClientSampleCategoryColorKey(sample)}">${escapeHtml(getClientSampleCategoryLabel(sample) || "—")}</span>`
    : escapeHtml(formattedQuantity);

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

      <span class="client-table-cell" data-label="${sample.type === "created_sample" ? "Catégorie" : "Quantité"}"><span class="client-quantity-category-value">${middleCell}</span></span>
      <span class="client-table-cell" data-label="Localisation">${escapeHtml(sample.location || "—")}</span>
      <span class="client-table-cell" data-label="Date">${escapeHtml(formattedDate)}</span>
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

function openDeleteConfirmation(options = {}) {
  if (!confirmDeleteDialog || confirmDeleteDialog.open || deleteConfirmationPending) return;

  deleteConfirmationTrigger = options.trigger instanceof HTMLElement
    ? options.trigger
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  deleteConfirmationAction = typeof options.onConfirm === "function"
    ? options.onConfirm
    : null;

  confirmDeleteTitle.textContent = options.title || "Confirmer la suppression";
  confirmDeleteMessage.textContent = options.message || "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.";
  confirmDeleteBtn.textContent = options.confirmText || "Supprimer";
  confirmDeleteError.textContent = "";
  confirmDeleteError.classList.add("hidden");
  setDeleteConfirmationPending(false);

  confirmDeleteDialog.classList.remove("is-closing");
  confirmDeleteDialog.classList.add("is-opening");
  confirmDeleteDialog.showModal();
  window.setTimeout(() => confirmDeleteDialog.classList.remove("is-opening"), 160);
  cancelConfirmDeleteBtn.focus();
}

function setDeleteConfirmationPending(isPending) {
  deleteConfirmationPending = isPending;
  confirmDeleteBtn.disabled = isPending;
  cancelConfirmDeleteBtn.disabled = isPending;
  closeConfirmDeleteBtn.disabled = isPending;
  confirmDeleteBtn.setAttribute("aria-busy", String(isPending));
}

async function confirmDeleteAction() {
  if (deleteConfirmationPending || !deleteConfirmationAction) return;
  setDeleteConfirmationPending(true);
  confirmDeleteError.textContent = "";
  confirmDeleteError.classList.add("hidden");

  try {
    await deleteConfirmationAction();
    closeDeleteConfirmation({ force: true });
  } catch (error) {
    confirmDeleteError.textContent = error?.message || "La suppression n’a pas pu être effectuée. Veuillez réessayer.";
    confirmDeleteError.classList.remove("hidden");
    setDeleteConfirmationPending(false);
    confirmDeleteBtn.focus();
  }
}

function closeDeleteConfirmation(options = {}) {
  if (!confirmDeleteDialog?.open || deleteConfirmationPending && !options.force) return;
  confirmDeleteDialog.classList.remove("is-opening");
  confirmDeleteDialog.classList.add("is-closing");
  window.setTimeout(() => {
    if (confirmDeleteDialog.open) confirmDeleteDialog.close();
    confirmDeleteDialog.classList.remove("is-closing");
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 120);
}

function restoreDeleteConfirmationFocus() {
  setDeleteConfirmationPending(false);
  deleteConfirmationAction = null;
  const trigger = deleteConfirmationTrigger;
  deleteConfirmationTrigger = null;
  if (trigger?.isConnected) trigger.focus();
}

function deleteReplicaFamily(groupKey) {
  const familySamples = clientSamples.filter(sample => getReplicaFamilyKey(sample) === groupKey);
  if (!familySamples.length) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer ce groupe et ses ${familySamples.length} réplicat${familySamples.length > 1 ? "s" : ""} ? Cette action est irréversible.`,
    onConfirm: () => performReplicaFamilyDeletion(groupKey)
  });
}

async function performReplicaFamilyDeletion(groupKey) {
  const familySamples = clientSamples.filter(sample => getReplicaFamilyKey(sample) === groupKey);
  if (!familySamples.length) throw new Error("Ce groupe de réplicats n’existe plus.");

  const deletedIds = new Set(familySamples.map(sample => sample.id));
  const baseName = getReplicaBaseName(familySamples[0]) || familySamples[0].name;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer ces réplicats.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`sample-family-delete-${groupKey}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.clientSamples = (Array.isArray(state.clientSamples) ? state.clientSamples : []).filter(sample => !deletedIds.has(sample.id));
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Échantillons clients supprimés",
        detail: `${currentName} a supprimé ${familySamples.length} réplicat${familySamples.length > 1 ? "s" : ""} ${baseName} des études clients.`
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
    if (selectedSampleId && deletedIds.has(selectedSampleId)) selectedSampleId = null;
    if (selectedSampleGroupId === groupKey) selectedSampleGroupId = null;
    render();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

function deleteSampleFromDetail(id) {
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const message = sample.replicaNumber
    ? `Êtes-vous sûr de vouloir supprimer uniquement le réplicat ${sample.replicaNumber} ? Cette action est irréversible.`
    : `Êtes-vous sûr de vouloir supprimer “${sample.name}” de cette étude client ? Cette action est irréversible.`;
  openDeleteConfirmation({
    message,
    onConfirm: () => performSampleDeletion(id, { closeModal: false })
  });
}

async function performSampleDeletion(id, options = {}) {
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) throw new Error("Ce produit ou échantillon n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer ce produit.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`sample-delete-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.clientSamples = (Array.isArray(state.clientSamples) ? state.clientSamples : []).filter(entry => entry.id !== id);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Produit client supprimé",
        detail: `${currentName} a supprimé ${sample.name} des études clients.`
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
    selectedSampleId = null;
    if (options.closeModal) sampleDialog.close();
    render();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
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
  if (sample.type === "created_sample") return getClientSampleCategoryLabel(sample) || "Échantillon créé";
  return [sample.referenceNumber, sample.lotNumber].filter(Boolean).join(" · ") || "Produit reçu du client";
}

function getClientSampleCategoryLabel(sample) {
  if (!sample || sample.category !== "ARN") return sample?.category || "";
  return sample.arnQiazol === false ? "ARN extrait" : "ARN + Qiazol";
}

function getClientSampleCategoryColorKey(sample) {
  if (sample?.category === "ARN") return "arn";
  if (sample?.category === "Sécrétion") return "secretion";
  if (sample?.category === "cDNA") return "cdna";
  if (["Fixation (galette)", "Fixation (tissu)"].includes(sample?.category)) return "fixation";
  return "default";
}


function openSampleModal(id, options = {}) {
  const groupSamples = options.groupId ? getReplicaGroupSamples(options.groupId) : [];
  const storedSample = id ? clientSamples.find(entry => entry.id === id) : null;
  const sample = getEffectiveClientSample(storedSample || groupSamples[0]);
  const sampleClientCode = sample ? getSampleCanonicalClientCode(sample) : "";
  sampleEditContext = groupSamples.length
    ? { scope: "group", groupId: options.groupId, sampleId: null }
    : storedSample?.replicaNumber
      ? { scope: "replica", groupId: storedSample.groupId || getReplicaFamilyKey(storedSample), sampleId: storedSample.id }
      : storedSample
        ? { scope: "single", groupId: null, sampleId: storedSample.id }
        : { scope: "new", groupId: null, sampleId: null };

  sampleForm.reset();
  document.querySelector("#sampleModalTitle").textContent = groupSamples.length
    ? `Modifier le groupe et ses ${groupSamples.length} réplicats`
    : storedSample?.replicaNumber
      ? `Modifier uniquement le réplicat ${storedSample.replicaNumber}`
      : sample
        ? "Modifier produit / échantillon"
        : "Nouveau produit / échantillon";
  document.querySelector("#deleteSampleBtn").style.display = storedSample ? "inline-block" : "none";

  sampleFields.sampleId.value = storedSample?.id || "";
  sampleFields.sampleType.value = sample?.type || "client_product";
  const sampleStudyType = sample ? getSampleStudyType(sample) : "client";
  sampleFields.sampleStudyTypeClient.checked = sampleStudyType !== "rd";
  sampleFields.sampleStudyTypeRd.checked = sampleStudyType === "rd";
  sampleFields.sampleClientCode.value = sample?.rawClientCode || sampleClientCode;
  sampleFields.sampleProductName.value = sample?.type === "client_product" ? sample.name : "";
  sampleFields.sampleBaseName.value = sample?.baseName || (sample?.type === "created_sample" ? sample.name : "");
  sampleFields.sampleCategory.value = sample?.category || clientSampleCategories[0];
  sampleFields.sampleArnQiazol.checked = sample?.category === "ARN"
    ? sample.arnQiazol !== false
    : true;
  sampleFields.sampleArnBead.checked = sample?.category === "ARN"
    ? Boolean(sample.arnBead && sample?.arnQiazol !== false)
    : false;
  sampleFields.sampleArrivalDate.value = sample?.arrivalDate || "";
  sampleFields.sampleCreationDate.value = sample?.creationDate || "";
  sampleFields.sampleQuantity.value = sample?.type === "client_product" ? sample.quantity ?? "" : "";
  sampleFields.sampleUnit.value = sample?.type === "client_product" ? sample.unit || "" : "";
  sampleFields.sampleMeasureValue.value = sample?.measureValue ?? "";
  sampleFields.sampleReplicaCount.value = "1";
  sampleFields.sampleReplicaCount.disabled = Boolean(sample);
  renderSamplePlacementEditor(getSamplePlacement(sample));
  sampleFields.sampleReferenceNumber.value = sample?.referenceNumber || "";
  sampleFields.sampleLotNumber.value = sample?.lotNumber || "";
  sampleFields.sampleNotes.value = sampleEditContext.scope === "group"
    ? sample?.generalNotes || sample?.generalData?.notes || ""
    : sample?.notes || "";

  syncSampleFormVisibility();
  syncSampleStudyTypeUI();
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

function getCreatedSampleUnit(category, arnQiazol = true) {
  if (category === "ARN") return arnQiazol ? "mg" : "µL";
  if (category === "cDNA") return "µL";
  if (category === "Sécrétion") return "mL";
  return "mg";
}

function syncSampleMeasureLabel(options = {}) {
  const category = sampleFields.sampleCategory.value;
  const isArn = sampleFields.sampleType.value === "created_sample" && category === "ARN";
  const previousUnit = sampleFields.sampleMeasureValue.dataset.measureUnit || "";
  const unit = getCreatedSampleUnit(category, sampleFields.sampleArnQiazol.checked);
  sampleFields.sampleArnOptions.classList.toggle("hidden", !isArn);
  sampleFields.sampleArnNotesHint.classList.toggle("hidden", !isArn);
  sampleFields.sampleArnBead.disabled = !isArn || !sampleFields.sampleArnQiazol.checked;
  if (!isArn || !sampleFields.sampleArnQiazol.checked) sampleFields.sampleArnBead.checked = false;
  if (options.clearOnUnitChange && previousUnit && previousUnit !== unit) {
    sampleFields.sampleMeasureValue.value = "";
  }
  sampleFields.sampleMeasureValue.dataset.measureUnit = unit;
  sampleFields.sampleMeasureLabel.innerHTML = `${unit === "mg" ? "Poids" : "Volume"} (${unit}) <span class="required-star">*</span>`;
}

function saveSample() {
  syncSampleFormVisibility();
  const placement = readSamplePlacement();
  if (!validateSamplePlacement(placement, { onSubmit: true })) return;
  if (!sampleForm.reportValidity()) return;

  const existingId = sampleFields.sampleId.value.trim();
  const existingSample = existingId
    ? clientSamples.find(entry => entry.id === existingId)
    : null;

  const type = sampleFields.sampleType.value;
  const studyType = getSelectedSampleStudyType();
  const now = new Date();
  const clientInfo = ensureClientForCode(sampleFields.sampleClientCode.value.trim(), studyType);
  if (!clientInfo.normalizedKey) {
    window.alert("Merci d'entrer un code valide.");
    return;
  }

  const base = {
    id: existingId || "",
    type,
    studyType: clientInfo.studyType,
    clientCode: clientInfo.canonicalCode,
    rawClientCode: clientInfo.rawCode,
    normalizedClientKey: clientInfo.normalizedKey,
    clientId: clientInfo.id,
    canonicalClientCode: clientInfo.canonicalCode,
    roomId: placement.roomId,
    locationId: placement.locationId,
    sublocationId: placement.sublocationId,
    location: placementDisplayName(placement),
    notes: normalizeMultilineText(sampleFields.sampleNotes.value),
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
    const replicaCount = sampleEditContext.scope === "new"
      ? Math.max(1, Number(sampleFields.sampleReplicaCount.value || 1))
      : sampleEditContext.scope === "group"
        ? getReplicaGroupSamples(sampleEditContext.groupId).length
        : 1;
    const category = sampleFields.sampleCategory.value;
    const arnQiazol = category === "ARN" ? sampleFields.sampleArnQiazol.checked : null;
    const arnBead = category === "ARN" ? Boolean(arnQiazol && sampleFields.sampleArnBead.checked) : null;
    const measureUnit = getCreatedSampleUnit(category, arnQiazol !== false);
    const measureValue = Number(sampleFields.sampleMeasureValue.value);
    const editableData = {
      type,
      studyType: base.studyType,
      clientCode: base.clientCode,
      rawClientCode: base.rawClientCode,
      normalizedClientKey: base.normalizedClientKey,
      clientId: base.clientId,
      canonicalClientCode: base.canonicalClientCode,
      roomId: base.roomId,
      locationId: base.locationId,
      sublocationId: base.sublocationId,
      location: base.location,
      baseName,
      category,
      arnQiazol,
      arnBead,
      creationDate: sampleFields.sampleCreationDate.value,
      measureValue,
      measureUnit,
      quantity: measureValue,
      unit: measureUnit,
      arrivalDate: "",
      referenceNumber: "",
      lotNumber: ""
    };

    if (sampleEditContext.scope === "group") {
      const groupSamples = getReplicaGroupSamples(sampleEditContext.groupId);
      clientSamples = clientSamples.map(sample => {
        if (!groupSamples.some(entry => entry.id === sample.id)) return sample;
        const generalData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
        const effective = { ...sample, ...generalData, ...(sample.specificData || {}) };
        return {
          ...effective,
          id: sample.id,
          replicaId: sample.replicaId || sample.id,
          groupId: sampleEditContext.groupId,
          replicaNumber: sample.replicaNumber,
          replicaCount: groupSamples.length,
          name: `${effective.baseName || baseName}_${sample.replicaNumber}`,
          generalData,
          specificData: sample.specificData || {}
        };
      });
    } else if (sampleEditContext.scope === "replica" && existingSample) {
      const specificData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
      const index = clientSamples.findIndex(entry => entry.id === existingSample.id);
      clientSamples[index] = {
        ...existingSample,
        ...(existingSample.generalData || {}),
        ...specificData,
        id: existingSample.id,
        replicaId: existingSample.replicaId || existingSample.id,
        groupId: existingSample.groupId || sampleEditContext.groupId,
        replicaNumber: existingSample.replicaNumber,
        replicaCount: existingSample.replicaCount,
        name: `${baseName}_${existingSample.replicaNumber}`,
        generalData: existingSample.generalData || {},
        specificData
      };
    } else {
      const groupId = replicaCount > 1 ? createSafeItemId("sample-group") : "";
      const generalData = { ...editableData, notes: normalizeMultilineText(sampleFields.sampleNotes.value) };
      const samplesToSave = Array.from({ length: replicaCount }, (_, index) => {
      const replicaNumber = index + 1;
      const name = replicaCount > 1 ? `${baseName}_${replicaNumber}` : baseName;
      const id = existingId || createSafeItemId("sample-created");

      return {
        ...base,
        ...generalData,
        id,
        replicaId: id,
        groupId,
        name,
        replicaNumber: replicaCount > 1 ? replicaNumber : existingSample?.replicaNumber || null,
        replicaCount: replicaCount > 1 ? replicaCount : existingSample?.replicaCount || 1,
        generalData: replicaCount > 1 ? generalData : {},
        specificData: {}
      };
      });

      upsertClientSamples(samplesToSave, existingId);
    }
    addHistory(
      existingId ? "Échantillon client modifié" : "Échantillons clients ajoutés",
      `${currentName} a ${sampleEditContext.scope === "new" ? "ajouté" : "modifié"} ${replicaCount} échantillon${replicaCount > 1 ? "s" : ""} ${baseName} pour ${base.canonicalClientCode}.`
    );
  }

  persist();
  sampleDialog.close();
  selectedSampleId = null;
  selectedSampleGroupId = null;
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

function requestSampleDeletionFromModal() {
  const id = sampleFields.sampleId.value;
  const sample = clientSamples.find(entry => entry.id === id);
  if (!sample) return;

  const message = sample.replicaNumber
    ? `Êtes-vous sûr de vouloir supprimer uniquement le réplicat ${sample.replicaNumber} ? Cette action est irréversible.`
    : `Êtes-vous sûr de vouloir supprimer “${sample.name}” de cette étude client ? Cette action est irréversible.`;
  openDeleteConfirmation({
    message,
    onConfirm: () => performSampleDeletion(id, { closeModal: true })
  });
}
