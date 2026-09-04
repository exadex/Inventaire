// Section Sourcing : patients, prelevements et controle qualite.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

// ============ Sourcing (patients / prélèvements) ============

const SOURCING_PATIENT_NUMBER_FLOOR = 236;

function suggestNextPatientNumber() {
  const max = sourcingPatients.reduce((best, patient) => {
    const match = String(patient.patientNumber || "").trim().match(/^P(\d+)$/i);
    return match ? Math.max(best, Number(match[1])) : best;
  }, SOURCING_PATIENT_NUMBER_FLOOR);
  return `P${max + 1}`;
}

function normalizePatientNumber(value) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^P?\s*(\d+)$/i);
  return match ? `P${match[1]}` : trimmed;
}

function getPatientAssignmentStatus(patient) {
  const assignment = String(patient.patientStudyAssignment || "").trim();
  if (assignment) return { done: true, eliminated: false, label: `Assigné : ${assignment}`, date: patient.patientLotValidationDate || patient.patientCessionDate || "" };
  const lotEndDate = String(patient.patientLotEndDate || "").trim();
  if (lotEndDate) return { done: true, eliminated: true, label: "Éliminé", date: lotEndDate };
  return { done: false, eliminated: false, label: "En attente d’assignation", date: "" };
}

function getPatientCheckpointStage(patient) {
  const assignment = getPatientAssignmentStatus(patient);
  if (assignment.done) return assignment.eliminated ? "Éliminé" : "Assigné";
  if (String(patient.patientReceptionDate || "").trim()) return "En culture";
  return "Non démarré";
}

function sourcingStagePillMarkup(stage) {
  const map = {
    "Non démarré": "stock-pill neutral",
    "En culture": "experiment-status running",
    "Assigné": "experiment-status completed",
    "Éliminé": "stock-pill alert"
  };
  return `<span class="${map[stage] || "stock-pill neutral"}">${escapeHtml(stage)}</span>`;
}

function getFilteredSortedPatients(source, query = "", sort = "recent", category = "") {
  const normalizedQuery = normalizeSearch(query);
  return source.filter(patient => {
    if (category && patient.patientType !== category) return false;
    const haystack = normalizeSearch([patient.patientNumber, patient.patientInitials, patient.patientStudyAssignment, patient.patientType, patient.patientGender, patient.patientCollectionSite].join(" "));
    return !normalizedQuery || haystack.includes(normalizedQuery);
  }).slice().sort((a, b) => comparePatientsBySort(a, b, sort));
}

function comparePatientsBySort(a, b, sort) {
  if (sort === "number-asc" || sort === "number-desc") {
    const numA = Number(String(a.patientNumber || "").replace(/\D/g, "")) || 0;
    const numB = Number(String(b.patientNumber || "").replace(/\D/g, "")) || 0;
    return sort === "number-asc" ? numA - numB : numB - numA;
  }
  if (sort === "bmi-asc" || sort === "age-asc") {
    const key = sort === "bmi-asc" ? "patientBmi" : "patientAge";
    const valueA = StockTracking.parseLocalizedNumber(a[key]);
    const valueB = StockTracking.parseLocalizedNumber(b[key]);
    const hasA = valueA > 0, hasB = valueB > 0;
    if (hasA !== hasB) return hasA ? -1 : 1;
    if (!hasA) return 0;
    return valueA - valueB;
  }
  const createdDelta = (parseHistoryDate(b.createdAtRaw)?.getTime() || 0) - (parseHistoryDate(a.createdAtRaw)?.getTime() || 0);
  return sort === "oldest" ? -createdDelta : createdDelta;
}

function renderSourcingMetrics() {
  const metrics = document.querySelector("#sourcingMetrics");
  if (!metrics) return;
  let assigned = 0, eliminated = 0, inProgress = 0;
  sourcingPatients.forEach(patient => {
    const assignment = getPatientAssignmentStatus(patient);
    if (assignment.done && assignment.eliminated) eliminated += 1;
    else if (assignment.done) assigned += 1;
    else inProgress += 1;
  });
  metrics.innerHTML = [
    ["◐", "Total patients", sourcingPatients.length],
    ["↻", "En cours de culture", inProgress],
    ["✓", "Assignés à une étude", assigned],
    ["○", "Éliminés", eliminated]
  ].map(([icon, label, value]) => `<article class="client-kpi-card sourcing-kpi-card"><span class="client-kpi-icon" aria-hidden="true">${icon}</span><div><span>${label}</span><strong>${value}</strong></div></article>`).join("");
}

function renderSourcingTableRow(patient) {
  const stage = getPatientCheckpointStage(patient);
  return `<tr class="sourcing-list-row" data-patient-id="${escapeHtml(patient.id)}" tabindex="0" onclick="selectSourcingPatient('${escapeHtml(patient.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSourcingPatient('${escapeHtml(patient.id)}')}"><td data-label="N° patient"><strong>${escapeHtml(patient.patientNumber || "—")}</strong></td><td data-label="Genre">${escapeHtml(patient.patientGender || "—")}</td><td data-label="Âge">${escapeHtml(patient.patientAge || "—")}</td><td data-label="Type">${escapeHtml(patient.patientType || "—")}</td><td data-label="Date de réception">${patient.patientReceptionDate ? escapeHtml(formatDisplayDateFrench(patient.patientReceptionDate)) : "—"}</td><td data-label="Temps de culture">${patient.patientCultureWeeks ? `${escapeHtml(patient.patientCultureWeeks)} sem.` : "—"}</td><td data-label="Assignation étude">${escapeHtml(patient.patientStudyAssignment || "—")}</td><td data-label="Checkpoint">${sourcingStagePillMarkup(stage)}</td></tr>`;
}

function renderSourcingStatusDateDetail(patient, field) {
  const status = patient[`${field.base}Status`];
  const date = patient[`${field.base}Date`];
  return `${renderDetailRow(field.label, status)}${renderDetailRow(`${field.label} — Date`, date ? formatDisplayDateFrench(date) : "")}`;
}

function renderSourcingQcDetailTable(patient) {
  const rows = SOURCING_QC_TESTS.map(key => {
    const result = patient[`patientQc${key}Result`];
    const date = patient[`patientQc${key}Date`];
    const tx = patient[`patientQc${key}Tx`];
    const remarks = patient[`patientQc${key}Remarks`];
    return `<tr><th scope="row">${escapeHtml(SOURCING_QC_TEST_LABELS[key])}</th><td>${result ? escapeHtml(result) : "—"}</td><td>${date ? escapeHtml(formatDisplayDateFrench(date)) : "—"}</td><td>${tx ? escapeHtml(tx) : "—"}</td><td>${remarks ? escapeHtml(remarks) : "—"}</td></tr>`;
  }).join("");
  return `
    <div class="sample-table-wrap sourcing-qc-table-wrap">
      <table class="sample-table sourcing-qc-table">
        <thead><tr><th scope="col">Test</th><th scope="col">Résultat</th><th scope="col">Date</th><th scope="col">Tx</th><th scope="col">Remarques</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSourcingDetail(patient) {
  const stage = getPatientCheckpointStage(patient);
  return `
    <section class="sourcing-detail-panel">
      <div class="sourcing-detail-return-row">
        <button class="ghost-btn sourcing-back-btn" type="button" onclick="selectSourcingPatient(null)" aria-label="Retour aux patients">
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="sourcing-detail-header">
        <div class="sourcing-detail-title">
          <div class="sourcing-detail-badges">
            ${sourcingStagePillMarkup(stage)}
            ${patient.patientType ? `<span class="result-pill">${escapeHtml(patient.patientType)}</span>` : ""}
          </div>
          <h3>${escapeHtml(patient.patientNumber || "Patient")}</h3>
          <div class="sourcing-detail-meta">
            ${patient.patientInitials ? `<span>${escapeHtml(patient.patientInitials)}</span>` : ""}
            ${patient.patientGender ? `<span>${escapeHtml(patient.patientGender)}</span>` : ""}
            ${patient.patientAge ? `<span>${escapeHtml(patient.patientAge)} ans</span>` : ""}
          </div>
        </div>
        <div class="detail-actions sourcing-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openSourcingModal('${escapeHtml(patient.id)}')">Modifier</button>
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Informations de réception</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Type", patient.patientType)}
          ${renderDetailRow("Date de réception", patient.patientReceptionDate ? formatDisplayDateFrench(patient.patientReceptionDate) : "")}
          ${renderDetailRow("Temps de culture", patient.patientCultureWeeks ? `${patient.patientCultureWeeks} semaines` : "")}
          ${renderDetailRow("Quantité de départ", patient.patientStartQuantity)}
          ${renderDetailRow("Nombre de puits réalisés", patient.patientWellsCount)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Information du lot</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Date de validation du lot", patient.patientLotValidationDate ? formatDisplayDateFrench(patient.patientLotValidationDate) : "")}
          ${renderDetailRow("Assignation étude", patient.patientStudyAssignment)}
          ${renderDetailRow("Cession — à qui", patient.patientCessionTo)}
          ${renderDetailRow("Cession — quand", patient.patientCessionDate ? formatDisplayDateFrench(patient.patientCessionDate) : "")}
          ${renderDetailRow("Utilisation et stockage", patient.patientUsageStorage)}
          ${renderDetailRow("Date fin de lot et élimination", patient.patientLotEndDate ? formatDisplayDateFrench(patient.patientLotEndDate) : "")}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Informations Patient</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Initiales", patient.patientInitials)}
          ${renderDetailRow("Site du prélèvement", patient.patientCollectionSite)}
          ${renderDetailRow("Genre", patient.patientGender)}
          ${renderDetailRow("Âge", patient.patientAge)}
          ${renderDetailRow("Taille", patient.patientHeight ? `${patient.patientHeight} cm` : "")}
          ${renderDetailRow("Poids", patient.patientWeight ? `${patient.patientWeight} kg` : "")}
          ${renderDetailRow("IMC", patient.patientBmi)}
          ${renderDetailRow("Technique", patient.patientTechnique)}
          ${renderDetailRow("Chirurgien", patient.patientSurgeon)}
          ${renderDetailRow("Caractéristique patient", patient.patientCharacteristic)}
        </div>
      </div>

      ${patient.patientType === "Obèse" ? `
      <div class="client-detail-section">
        <h4>Co-morbidité / si obèse</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("NASH", patient.patientNash)}
          ${renderDetailRow("Apnée du sommeil", patient.patientSleepApnea)}
          ${renderDetailRow("DT2", patient.patientT2d)}
          ${renderDetailRow("Autre", patient.patientOtherComorbidity)}
          ${renderDetailRow("Intervention", patient.patientIntervention)}
          ${renderDetailRow("IMC MAX", patient.patientBmiMax)}
          ${renderDetailRow("Traitement d'intention", patient.patientIntentionTreatment)}
        </div>
      </div>
      ` : ""}

      <div class="client-detail-section">
        <h4>Contrôle Qualité</h4>
        ${renderSourcingQcDetailTable(patient)}
      </div>

      <div class="client-detail-section">
        <h4>ARN</h4>
        <div class="item-detail-stack">
          ${SOURCING_STATUS_DATE_FIELDS.filter(field => field.section === "arn").map(field => renderSourcingStatusDateDetail(patient, field)).join("")}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Milieu conditionné (sécrétions)</h4>
        <div class="item-detail-stack">
          ${SOURCING_STATUS_DATE_FIELDS.filter(field => field.section === "secretions").map(field => renderSourcingStatusDateDetail(patient, field)).join("")}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Fixation</h4>
        <div class="item-detail-stack">
          ${SOURCING_STATUS_DATE_FIELDS.filter(field => field.section === "fixation").map(field => renderSourcingStatusDateDetail(patient, field)).join("")}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Congélation</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Congélation", patient.patientFreezing)}
          ${renderDetailRow("Quantité", patient.patientFreezingQuantity)}
          ${renderDetailRow("Décongélation", patient.patientFreezingThaw)}
        </div>
      </div>

      <div class="client-detail-section">
        <h4>Remarque générale</h4>
        <div class="item-detail-stack">
          ${renderDetailRow("Remarque générale", patient.patientGeneralRemark)}
        </div>
      </div>
    </section>
  `;
}

function renderSourcing() {
  const query = sourcingSearchInput ? sourcingSearchInput.value : "";
  const filtered = getFilteredSortedPatients(sourcingPatients, query, sourcingSortSelect?.value || "recent", sourcingCategoryFilter?.value || "");

  const detail = selectedSourcingPatientId ? sourcingPatients.find(patient => patient.id === selectedSourcingPatientId) : null;
  const detailHost = document.querySelector("#sourcingDetail");
  if (detailHost) detailHost.innerHTML = detail ? renderSourcingDetail(detail) : "";
  document.querySelector("#sourcingGrid")?.classList.toggle("hidden", Boolean(detail));
  document.querySelector("#sourcingView")?.classList.toggle("sourcing-detail-mode", Boolean(detail));

  const resultCount = document.querySelector("#sourcingResultCount");
  if (resultCount) resultCount.textContent = `${filtered.length} patient${filtered.length > 1 ? "s" : ""}`;

  renderSourcingMetrics();

  const body = document.querySelector("#sourcingTableBody");
  if (body) body.innerHTML = filtered.length ? filtered.map(renderSourcingTableRow).join("") : `<tr><td colspan="8" class="empty-table-cell">${sourcingPatients.length ? "Aucun patient ne correspond à votre recherche." : "Aucun patient enregistré."}</td></tr>`;
}

function selectSourcingPatient(id) {
  selectedSourcingPatientId = id;
  renderSourcing();
}

function recalculatePatientBmi() {
  const bmiField = sourcingFields.patientBmi;
  if (!bmiField || bmiField.dataset.manual === "true") return;
  const height = StockTracking.parseLocalizedNumber(sourcingFields.patientHeight.value);
  const weight = StockTracking.parseLocalizedNumber(sourcingFields.patientWeight.value);
  if (!(height > 0) || !(weight > 0)) return;
  bmiField.value = Number((weight / ((height / 100) ** 2)).toFixed(1));
}

function syncSourcingComorbiditySection() {
  const section = document.querySelector("#patientComorbiditySection");
  if (!section) return;
  section.classList.toggle("hidden", sourcingFields.patientType?.value !== "Obèse");
}

function wireSourcingExclusiveCheckboxGroup(baseId, optionMap) {
  const boxes = optionMap.map(([suffix]) => document.querySelector(`#${baseId}${suffix}`));
  boxes.forEach((box, index) => {
    box?.addEventListener("change", () => {
      if (box.checked) boxes.forEach((other, otherIndex) => { if (otherIndex !== index && other) other.checked = false; });
    });
  });
}

function hydrateSourcingExclusiveCheckboxGroup(patient, baseId, optionMap) {
  const value = patient?.[baseId] || "";
  optionMap.forEach(([suffix, optionValue]) => {
    const box = document.querySelector(`#${baseId}${suffix}`);
    if (box) box.checked = value === optionValue;
  });
}

function readSourcingExclusiveCheckboxGroup(baseId, optionMap) {
  for (const [suffix, optionValue] of optionMap) {
    if (document.querySelector(`#${baseId}${suffix}`)?.checked) return optionValue;
  }
  return "";
}

function computeSourcingPrefillDate(kind, receptionDateValue) {
  if (!kind || !receptionDateValue) return "";
  const date = new Date(`${receptionDateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  if (kind === "reception+14") date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function syncSourcingPrefillDates() {
  const receptionDateValue = sourcingFields.patientReceptionDate?.value || "";
  SOURCING_STATUS_DATE_FIELDS.forEach(({ base, prefill }) => {
    if (!prefill) return;
    const dateField = sourcingFields[`${base}Date`];
    if (!dateField || dateField.value) return;
    const prefillDate = computeSourcingPrefillDate(prefill, receptionDateValue);
    if (prefillDate) dateField.value = prefillDate;
  });
}

function hydrateSourcingForm(patient) {
  Object.keys(sourcingFields).forEach(key => {
    if (SOURCING_GENERIC_LOOP_EXCLUDED_KEYS.has(key)) return;
    const field = sourcingFields[key];
    if (!field) return;
    field.value = key === "patientNumber" ? (patient?.patientNumber || suggestNextPatientNumber()) : (patient?.[key] || "");
  });
  SOURCING_YES_NO_FIELDS.forEach(field => hydrateSourcingExclusiveCheckboxGroup(patient, field, SOURCING_YES_NO_OPTION_MAP));
  SOURCING_STATUS_DATE_FIELDS.forEach(({ base }) => hydrateSourcingExclusiveCheckboxGroup(patient, `${base}Status`, SOURCING_STATUS_OPTION_MAP));
  syncSourcingComorbiditySection();
  syncSourcingPrefillDates();
}

function openSourcingModal(id) {
  const patient = id ? sourcingPatients.find(entry => entry.id === id) : null;
  sourcingForm.reset();
  document.querySelector("#sourcingModalTitle").textContent = patient ? "Modifier le patient" : "Nouveau patient";
  document.querySelector("#sourcingError")?.classList.add("hidden");
  const deleteBtn = document.querySelector("#deleteSourcingPatientBtn");
  if (deleteBtn) deleteBtn.style.display = patient ? "inline-flex" : "none";
  sourcingFields.sourcingPatientId.value = patient?.id || "";
  hydrateSourcingForm(patient);
  sourcingFields.patientBmi.dataset.manual = patient?.patientBmi ? "true" : "false";
  sourcingDialog.showModal();
}

async function saveSourcingPatient() {
  if (!sourcingForm.reportValidity()) return;
  const errorBox = document.querySelector("#sourcingError");
  errorBox?.classList.add("hidden");

  const patientNumber = normalizePatientNumber(sourcingFields.patientNumber.value);
  if (!patientNumber) {
    if (errorBox) { errorBox.textContent = "Le n° de patient est obligatoire."; errorBox.classList.remove("hidden"); }
    return;
  }

  const existingId = sourcingFields.sourcingPatientId.value;
  const duplicate = sourcingPatients.find(entry => entry.id !== existingId && normalizePatientNumber(entry.patientNumber).toLowerCase() === patientNumber.toLowerCase());
  if (duplicate) {
    if (errorBox) { errorBox.textContent = `Le n° de patient ${patientNumber} est déjà utilisé.`; errorBox.classList.remove("hidden"); }
    return;
  }

  const existingIndex = sourcingPatients.findIndex(entry => entry.id === existingId);
  const previousPatient = existingIndex >= 0 ? sourcingPatients[existingIndex] : null;
  const now = new Date();
  const displayNow = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(now);
  const isNew = existingIndex < 0;

  const patient = { id: existingId || createSafeItemId("pat"), source: "web" };
  Object.keys(sourcingFields).forEach(key => {
    if (SOURCING_GENERIC_LOOP_EXCLUDED_KEYS.has(key)) return;
    const field = sourcingFields[key];
    if (!field) return;
    patient[key] = /remark/i.test(key) ? normalizeMultilineText(field.value) : field.value.trim();
  });
  SOURCING_YES_NO_FIELDS.forEach(field => {
    patient[field] = readSourcingExclusiveCheckboxGroup(field, SOURCING_YES_NO_OPTION_MAP);
  });
  SOURCING_STATUS_DATE_FIELDS.forEach(({ base }) => {
    patient[`${base}Status`] = readSourcingExclusiveCheckboxGroup(`${base}Status`, SOURCING_STATUS_OPTION_MAP);
  });
  patient.patientNumber = patientNumber;
  patient.createdAtRaw = previousPatient?.createdAtRaw || now.toISOString();
  patient.createdAt = previousPatient?.createdAt || displayNow;
  patient.updatedAt = displayNow;

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    if (errorBox) { errorBox.textContent = "La sauvegarde GitHub en écriture est requise pour enregistrer ce patient."; errorBox.classList.remove("hidden"); }
    return;
  }

  const button = document.querySelector("#saveSourcingPatientBtn");
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "Enregistrement…";
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`sourcing-save-${patient.id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.sourcingPatients = Array.isArray(state.sourcingPatients) ? state.sourcingPatients : [];
      const at = state.sourcingPatients.findIndex(entry => entry.id === patient.id);
      if (at >= 0) state.sourcingPatients[at] = patient; else state.sourcingPatients.unshift(patient);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: isNew ? "Patient sourcing créé" : "Patient sourcing modifié",
        detail: isNew
          ? `${currentName} a créé le patient ${patient.patientNumber}.`
          : `${currentName} a modifié le patient ${patient.patientNumber}.`
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
    selectedSourcingPatientId = patient.id;
    sourcingDialog.close();
    renderSourcing();
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

function requestSourcingPatientDeletion() {
  const id = sourcingFields.sourcingPatientId.value;
  const patient = sourcingPatients.find(entry => entry.id === id);
  if (!patient) return;
  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer le patient ${patient.patientNumber || ""} ? Cette action est irréversible.`,
    onConfirm: () => deleteSourcingPatient(id)
  });
}

async function deleteSourcingPatient(id) {
  const patient = sourcingPatients.find(entry => entry.id === id);
  if (!patient) throw new Error("Ce patient n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer ce patient.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`sourcing-delete-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.sourcingPatients = (Array.isArray(state.sourcingPatients) ? state.sourcingPatients : []).filter(entry => entry.id !== id);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Patient sourcing supprimé",
        detail: `${currentName} a supprimé le patient ${patient.patientNumber}.`
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
    if (selectedSourcingPatientId === id) selectedSourcingPatientId = null;
    sourcingDialog.close();
    renderSourcing();
    renderHistory();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}
