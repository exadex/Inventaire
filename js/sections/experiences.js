// Section Experiences : liste, protocoles, formulaire et consommation de stock.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

function renderExperiments() {
  const query = normalizeSearch(experimentSearchInput.value);
  const filtered = getFilteredSortedExperiments(experiments, query, clients, clientSamples, experimentSortSelect?.value || EXPERIMENT_DEFAULT_SORT);

  const detail = selectedExperimentId ? experiments.find(experiment => experiment.id === selectedExperimentId) : null;
  document.querySelector("#experimentDetail").innerHTML = detail ? renderExperimentDetail(detail) : "";
  document.querySelector("#experimentGrid").classList.toggle("hidden", Boolean(detail));
  document.querySelector("#experimentsView")?.classList.toggle("experiments-detail-mode", Boolean(detail));
  const resultCount = document.querySelector("#experimentResultCount");
  if (resultCount) resultCount.textContent = `${filtered.length} expérience${filtered.length > 1 ? "s" : ""}`;
  renderExperimentMetrics();
  const body = document.querySelector("#experimentTableBody");
  if (body) body.innerHTML = filtered.length ? filtered.map(renderExperimentTableRow).join("") : `<tr><td colspan="6" class="empty-table-cell">${experiments.length ? "Aucune expérience ne correspond à votre recherche." : "Aucune expérience enregistrée."}</td></tr>`;
}

function getExperimentClientCodes(experiment, clientList = clients, sampleList = clientSamples) {
  const ids = [experiment?.clientId, ...(Array.isArray(experiment?.clientIds) ? experiment.clientIds : [])].filter(Boolean);
  const sampleIds = [experiment?.clientSampleId, ...(Array.isArray(experiment?.clientSampleIds) ? experiment.clientSampleIds : [])].filter(Boolean);
  const codes = sampleList.filter(sample => sampleIds.includes(sample.id) || ids.includes(sample.clientId)).map(sample => {
    const client = clientList.find(entry => entry.id === sample.clientId);
    return client?.canonicalCode || sample.canonicalClientCode || normalizeClientCode(sample.clientCode).canonicalCode;
  });
  ids.forEach(id => { const client = clientList.find(entry => entry.id === id); if (client?.canonicalCode) codes.push(client.canonicalCode); });
  [experiment?.clientCode, ...(Array.isArray(experiment?.clientCodes) ? experiment.clientCodes : [])].filter(Boolean).forEach(code => {
    const normalized = normalizeClientCode(code);
    if (normalized.canonicalCode) codes.push(normalized.canonicalCode);
  });
  return [...new Set(codes.filter(code => code && code !== "Client inconnu"))];
}

function getExperimentStatusDate(experiment) {
  if (experiment?.statusChangedAt && parseHistoryDate(experiment.statusChangedAt)) return experiment.statusChangedAt;
  if (normalizeExperimentStatus(experiment?.status) === "draft" && experiment?.createdAt && parseHistoryDate(experiment.createdAt)) return experiment.createdAt;
  return null;
}

function formatExperimentStatusDate(experiment) {
  const value = getExperimentStatusDate(experiment);
  return value ? formatDateTimeFrench(value, "—").split(" · ")[0] : "—";
}

function getExperimentAvailabilityCounts(experiment, inventoryList = items) {
  const counts = (experiment?.items || []).reduce((counts, line) => {
    const quantity = StockTracking.parseLocalizedNumber(line?.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return counts;

    if (line?.type === "custom") {
      const theoreticalRaw = line?.theoreticalStock;
      const hasTheoretical = theoreticalRaw !== undefined && theoreticalRaw !== null && theoreticalRaw !== "" && Number.isFinite(Number(theoreticalRaw));
      if (!hasTheoretical || quantity > Number(theoreticalRaw)) counts.insufficient += 1;
      else counts.sufficient += 1;
      return counts;
    }

    const stableId = line?.inventoryItemId || line?.itemId;
    const inventoryItem = stableId ? inventoryList.find(item => item.id === stableId) : (inventoryList === items ? findInventoryItem(line) : null);
    if (!inventoryItem || !line?.unit) return counts;
    const availability = getExperimentItemAvailability(inventoryItem, quantity, line.unit);
    if (availability.kind === "ok") counts.sufficient += 1;
    else if (availability.kind === "low") counts.insufficient += 1;
    return counts;
  }, { sufficient: 0, insufficient: 0 });
  counts.total = (experiment?.items || []).length;
  return counts;
}

// ordre des cartes KPI (Brouillons, En cours, Terminées) pour que le tri « Statut » suive la même séquence
const EXPERIMENT_STATUS_ORDER = { draft: 0, running: 1, completed: 2 };
const EXPERIMENT_DEFAULT_SORT = "az";

function compareExperimentNames(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "fr", { sensitivity: "base", numeric: true });
}

// les expériences sans code client restent à la fin pour ne pas encombrer le début de la liste
function getExperimentSortClientCode(experiment, clientList, sampleList) {
  return getExperimentClientCodes(experiment, clientList, sampleList).slice().sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true }))[0] || "";
}

function compareExperimentsBySort(a, b, sort, clientList, sampleList) {
  if (sort === "az") return compareExperimentNames(a, b);
  if (sort === "za") return compareExperimentNames(b, a);
  if (sort === "client") {
    const codeA = getExperimentSortClientCode(a, clientList, sampleList);
    const codeB = getExperimentSortClientCode(b, clientList, sampleList);
    if (!codeA !== !codeB) return codeA ? -1 : 1;
    return codeA.localeCompare(codeB, "fr", { sensitivity: "base", numeric: true }) || compareExperimentNames(a, b);
  }
  if (sort === "status") {
    const rankA = EXPERIMENT_STATUS_ORDER[normalizeExperimentStatus(a?.status)] ?? Number.MAX_SAFE_INTEGER;
    const rankB = EXPERIMENT_STATUS_ORDER[normalizeExperimentStatus(b?.status)] ?? Number.MAX_SAFE_INTEGER;
    return (rankA - rankB) || compareExperimentNames(a, b);
  }
  const statusDelta = (parseHistoryDate(getExperimentStatusDate(b))?.getTime() || 0) - (parseHistoryDate(getExperimentStatusDate(a))?.getTime() || 0);
  const createdDelta = (parseHistoryDate(b.createdAt)?.getTime() || 0) - (parseHistoryDate(a.createdAt)?.getTime() || 0);
  return statusDelta || createdDelta || compareExperimentNames(a, b);
}

function getFilteredSortedExperiments(source, query = "", clientList = clients, sampleList = clientSamples, sort = EXPERIMENT_DEFAULT_SORT) {
  return source.filter(experiment => {
    const haystack = normalizeSearch([...getExperimentClientCodes(experiment, clientList, sampleList), experiment.name, experiment.templateName, experiment.status, statusLabelExperiment(experiment.status)].join(" "));
    const compactQuery = query.replace(/[\s._\-\/\\]+/g, "");
    const compactHaystack = haystack.replace(/[\s._\-\/\\]+/g, "");
    return !query || haystack.includes(query) || (compactQuery && compactHaystack.includes(compactQuery));
  }).slice().sort((a, b) => compareExperimentsBySort(a, b, sort, clientList, sampleList));
}

function renderExperimentMetrics() {
  const metrics = document.querySelector("#experimentMetrics");
  if (!metrics) return;
  const counts = experiments.reduce((result, experiment) => { const status = normalizeExperimentStatus(experiment.status); if (status in result) result[status] += 1; return result; }, { draft:0, running:0, completed:0 });
  metrics.innerHTML = [["draft","Brouillons","○"],["running","En cours","↻"],["completed","Terminées","✓"]].map(([status,label,icon]) => `<article class="client-kpi-card experiment-kpi-card ${status}"><span class="client-kpi-icon" aria-hidden="true">${icon}</span><div><span>${label}</span><strong>${counts[status]}</strong></div></article>`).join("");
}

function renderExperimentTableRow(experiment) {
  const codes = getExperimentClientCodes(experiment), availability = getExperimentAvailabilityCounts(experiment), status = normalizeExperimentStatus(experiment.status);
  const template = experiment.templateId === FREE_PROTOCOL_ID ? "Nouveau protocole" : experiment.templateName;
  return `<tr class="experiment-list-row" data-experiment-id="${escapeHtml(experiment.id)}" tabindex="0" onclick="selectExperiment('${escapeHtml(experiment.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectExperiment('${escapeHtml(experiment.id)}')}"><td data-label="Code client">${codes.length ? codes.map(code => `<span class="result-pill experiment-client-code">${escapeHtml(code)}</span>`).join(" ") : "—"}</td><td data-label="Nom"><strong class="experiment-list-name">${escapeHtml(experiment.name || "—")}</strong>${template ? `<span class="table-subtext">${escapeHtml(template)}</span>` : ""}</td><td data-label="Date du statut">${escapeHtml(formatExperimentStatusDate(experiment))}</td><td data-label="Statut"><span class="experiment-status ${escapeHtml(status)}">${escapeHtml(statusLabelExperiment(status))}</span></td><td data-label="Items suffisants" class="experiment-count-cell"><span class="stock-pill ok" title="Les lignes incomplètes (quantité ou item manquant) ne sont pas incluses.">${availability.sufficient}/${availability.total}</span></td><td data-label="Items insuffisants" class="experiment-count-cell"><span class="stock-pill ${availability.insufficient ? "alert" : "neutral"}" title="Les lignes incomplètes (quantité ou item manquant) ne sont pas incluses.">${availability.insufficient}/${availability.total}</span></td></tr>`;
}

function renderExperimentCard(experiment) {
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

      <p class="multiline-text">${escapeHtml(experiment.notes || "Aucune note")}</p>

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
}

function renderExperimentDetail(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const status = normalizeExperimentStatus(experiment.status);
  const detailLines=experiment.templateId===FREE_PROTOCOL_ID?(experiment.items||[]):getMergedExperimentLines(experiment.items);
  const consumedIds = getExperimentConsumedItemIds(experiment);
  const rows = detailLines.map(line => {
    const isTheoreticalFree = line.type === "custom";
    const inventoryItem = isTheoreticalFree ? null : findInventoryItem(line);
    const needed = Number(line.quantity || 0);
    let stateLabel, stateClass, stockDisplay, isConsumed = false;

    if (isTheoreticalFree) {
      const theoreticalRaw = line.theoreticalStock;
      const hasTheoretical = theoreticalRaw !== undefined && theoreticalRaw !== null && theoreticalRaw !== "" && Number.isFinite(Number(theoreticalRaw));
      const theoretical = hasTheoretical ? Number(theoreticalRaw) : null;
      stockDisplay = hasTheoretical
        ? `${StockTracking.format(theoretical)} ${escapeHtml(line.unit || "")} (théorique)`
        : "Non connecté";
      stateLabel = !hasTheoretical
        ? "Non connecté"
        : needed < theoretical
          ? "Stock suffisant"
          : needed > theoretical
            ? "Stock insuffisant"
            : "Stock juste";
      stateClass = !hasTheoretical
        ? "neutral"
        : needed < theoretical
          ? "ok"
          : needed > theoretical
            ? "alert"
            : "warning";
    } else {
      const availability = getExperimentLineAvailability(inventoryItem, needed, line.unit);
      isConsumed = Boolean(inventoryItem) && consumedIds.has(inventoryItem.id);
      stateLabel = isConsumed
        ? "Consommé"
        : !inventoryItem
          ? "Manquant"
          : !availability.compatible
            ? "Unité incompatible"
            : availability.kind !== "ok"
              ? "Stock bas"
              : availability.converted
                ? "Connecté (converti)"
                : "Connecté";
      stateClass = isConsumed
        ? "neutral"
        : !inventoryItem || !availability.compatible
          ? "alert"
          : availability.kind !== "ok"
            ? "warning"
            : "ok";
      stockDisplay = !inventoryItem
        ? "Non connecte"
        : !availability.compatible
          ? `${StockTracking.format(inventoryItem.quantity)} ${escapeHtml(inventoryItem.unit)} · attendu ${escapeHtml(availability.referenceUnit.plural)}`
          : `${StockTracking.format(availability.availableInReferenceUnit)} ${escapeHtml(StockTracking.plural(availability.availableInReferenceUnit, availability.referenceUnit.singular, availability.referenceUnit.plural))}`;
    }
    const displayName = line.name || inventoryItem?.name || "Item";
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
                ${escapeHtml(displayName)}
              </button>`
            : `<strong>${escapeHtml(displayName)}</strong>`
        }
        <br>
        <span>${escapeHtml(line.notes || "")}</span>
      </td>
        <td>${formatQuantity(needed, line.unit)}</td>
        <td>${stockDisplay}</td>
        <td><span class="stock-pill ${stateClass}">${stateLabel}</span></td>
      </tr>
    `;
  }).join("");
  const canConsume = experiment.status !== "completed" && experimentHasConsumableItems(experiment);

  return `
    <section class="experiment-detail-panel">
      <div class="experiment-detail-return-row">
        <button
          class="ghost-btn experiment-back-btn"
          type="button"
          onclick="selectExperiment(null)"
          aria-label="Retour aux expériences"
        >
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="experiment-detail-header">
        <div class="experiment-detail-title">
          <div class="experiment-detail-badges">
            <span class="experiment-status ${escapeHtml(status)}">${escapeHtml(statusLabelExperiment(experiment.status))}</span>
          </div>
          <h3>${escapeHtml(experiment.name)}</h3>
          <div class="experiment-detail-meta">
            <span>${escapeHtml(experiment.templateName)}</span>
            <span>${experiment.conditions} conditions × ${experiment.replicates} réplicats = ${totalConditions} conditions totales</span>
          </div>
          <small class="experiment-detail-footnote">Mis à jour par ${escapeHtml(experiment.createdBy)} · ${escapeHtml(experiment.updatedAt)}</small>
        </div>

        <div class="detail-actions experiment-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openExperimentModal('${experiment.id}')">Modifier</button>
          ${experiment.templateId === FREE_PROTOCOL_ID ? `<button class="ghost-btn compact-btn" type="button" onclick="openSaveProtocolTemplateDialog('${experiment.id}')">Enregistrer le protocole</button>` : ""}
          <button class="primary-btn compact-btn" type="button" onclick="openConsumeExperimentDialog('${experiment.id}')" ${canConsume ? "" : "disabled"}>Consommer le stock</button>
        </div>
      </div>
      ${experiment.notes ? `<div class="experiment-notes-compact">
        <h4>Notes</h4>
        <p class="multiline-text">${escapeHtml(experiment.notes)}</p>
      </div>` : ""}
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

// fonction pour masquer les lignes vides ou sans donnée pertinente dans le détail de l'item
function renderDetailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  const isMultiline = /note|comment|description|justification|motif|raison|remarque/i.test(String(label));
  return `
    <div class="item-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value${isMultiline ? " multiline-text" : ""}">${escapeHtml(value)}</div>
    </div>
  `;
}

function normalizeMultilineText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n");
}


function openExperimentModal(id) {
  renderTemplateOptions();
  const experiment = experiments.find(entry => entry.id === id);
  const template = protocolTemplates.find(
    entry => entry.id === experiment?.templateId
  );

  experimentForm.reset();

  document.querySelector("#experimentModalTitle").textContent =
    experiment ? "Modifier experience" : "Nouvelle experience";

  const deleteExperimentBtn = document.querySelector("#deleteExperimentBtn");
  if (deleteExperimentBtn) {
    deleteExperimentBtn.style.display = experiment ? "inline-flex" : "none";
  }

  experimentFields.experimentId.value = experiment?.id || "";
  experimentFields.experimentTemplate.value = experiment?.templateId || FREE_PROTOCOL_ID;
  previousExperimentTemplateId = experimentFields.experimentTemplate.value;
  experimentFields.experimentName.value = experiment?.name || "";
  experimentFields.experimentClientCode.value = experiment?.clientCode || "";
  experimentFields.experimentConditions.value = experiment?.conditions || 1;
  experimentFields.experimentReplicates.value = experiment?.replicates || 1;
  experimentFields.experimentStatus.value = experiment?.status || "draft";
  experimentFields.experimentTemplateNotes.value = template?.notes || experiment?.templateNotes || "";
  experimentFields.experimentNotes.value = experiment?.notes || "";
  experimentFields.experimentTemplate.disabled = Boolean(experiment);

  const isRtQpcr = template?.mode === "rtqpcr";
  const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");
  const rtqpcrConfigData = experiment?.rtqpcrConfig || {};

  syncRtQpcrConfigVisibility(template);
  syncExperimentTemplateNotesVisibility(!template);

  if (isRtQpcr) {
    experimentFields.rtqpcrPartRT.checked = rtqpcrConfigData.parts?.rt ?? true;
    experimentFields.rtqpcrPartDilution.checked = rtqpcrConfigData.parts?.dilution ?? true;
    experimentFields.rtqpcrPartQPCR.checked = rtqpcrConfigData.parts?.qpcr ?? true;

    experimentFields.experimentConditions.value =
      rtqpcrConfigData.sampleConditions ?? experiment?.conditions ?? 1;
    experimentFields.experimentReplicates.value =
      rtqpcrConfigData.sampleReplicates ?? experiment?.replicates ?? 1;
    if (experimentFields.rtqpcrSampleConditions) {
      experimentFields.rtqpcrSampleConditions.value = experimentFields.experimentConditions.value;
    }
    if (experimentFields.rtqpcrSampleReplicates) {
      experimentFields.rtqpcrSampleReplicates.value = experimentFields.experimentReplicates.value;
    }
    if (experimentFields.rtqpcrQpcrConditions) {
      experimentFields.rtqpcrQpcrConditions.value =
        rtqpcrConfigData.qpcrConditions ?? rtqpcrConfigData.sampleConditions ?? experiment?.conditions ?? 1;
    }
    experimentFields.rtqpcrPrimerCount.value =
      rtqpcrConfigData.primerCount ?? template.sections.qpcr.defaults.primerCount;
    experimentFields.rtqpcrQpcrReplicates.value =
      rtqpcrConfigData.qpcrReplicates ?? template.sections.qpcr.defaults.qpcrReplicates;
    experimentFields.rtqpcrDeadVolumeConditions.value =
      rtqpcrConfigData.deadVolumeConditions ?? template.sections.qpcr.defaults.deadVolumeConditions;

    rtqpcrQPCRBlock?.classList.toggle("hidden", !experimentFields.rtqpcrPartQPCR.checked);
    experimentFields.experimentTotalConditions.value = getRtQpcrSampleTotal();
  }

  experimentItemsList.innerHTML = "";

  if (experiment) {
    const isFree=experiment.templateId===FREE_PROTOCOL_ID,restored=isFree?(experiment.items||[]):getMergedExperimentLines(experiment.items);
    restored.forEach(line => addExperimentItemRow(isFree?normalizeExperimentConsumedLine(line):line));
  } else if (template) {
    buildExperimentItemsFromTemplate();
  } else {
    activateFreeProtocol({clear:true});
  }

  updateExperimentTotalConditions();
  updateExperimentModalStock();
  experimentDialog.showModal();
}

function syncExperimentTemplateNotesVisibility(hidden) {
  document.querySelector("#experimentTemplateNotesField")?.classList.toggle("hidden", hidden);
  if(hidden) experimentFields.experimentTemplateNotes.value="";
}

function experimentDraftHasUserData() {
  return Boolean(experimentFields.experimentName.value.trim()||experimentFields.experimentClientCode.value.trim()||experimentFields.experimentNotes.value.trim()||experimentItemsList.children.length);
}

function activateFreeProtocol({clear=false}={}) {
  syncRtQpcrConfigVisibility(null);
  syncExperimentTemplateNotesVisibility(true);
  if(clear){experimentFields.experimentName.value="";experimentItemsList.innerHTML="";}
  updateExperimentTotalConditions();updateExperimentModalStock();
}

function syncRtQpcrConfigVisibility(template) {
  const currentTemplate =
    template ||
    protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);

  const isRtQpcr = currentTemplate?.mode === "rtqpcr";
  const rtqpcrConfigBox = document.querySelector("#rtqpcrConfig");
  const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");

  rtqpcrConfigBox?.classList.toggle("hidden", !isRtQpcr);
  rtqpcrQPCRBlock?.classList.toggle(
    "hidden",
    !isRtQpcr || !experimentFields.rtqpcrPartQPCR?.checked
  );
}

function setDefaultExperimentName(template, force = false) {
  if (!template || experimentFields.experimentId.value) return;
  if (!force && experimentFields.experimentName.value.trim()) return;

  const today = new Intl.DateTimeFormat("fr-FR").format(new Date());
  experimentFields.experimentName.value = `${template.name} - ${today}`;
}

function buildExperimentItemsFromTemplate() {
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  if (!template) return;

  syncRtQpcrConfigVisibility(template);

  setDefaultExperimentName(template);

  experimentFields.experimentTemplateNotes.value = template.notes || "";

  experimentItemsList.innerHTML = "";

  if (template.mode === "rtqpcr") {
    buildRtQpcrItemsFromTemplate(template);
    updateExperimentModalStock();
    return;
  }

  const total = updateExperimentTotalConditions();
  const templateLines = template.items.map(templateItem => ({
      ...templateItem,
      quantity: Number((templateItem.perConditionQuantity * total).toFixed(3))
    }));

  getMergedExperimentLines(templateLines).forEach(line => addExperimentItemRow(line));

  updateExperimentModalStock();
}

function normalizeExperimentConsumedLine(line={}) {
  if(line.type==="inventory"||line.type==="custom")return{...line,inventoryItemId:line.inventoryItemId||line.itemId||""};
  return line.itemId?{...line,type:"inventory",inventoryItemId:line.itemId}:{...line,type:"custom"};
}

function buildRtQpcrItemsFromTemplate(template) {
  syncRtQpcrSampleFields();

  const sampleTotal = getRtQpcrSampleTotal();
  const qpcrReactionBaseTotal = getRtQpcrReactionBaseTotal();
  const qpcrReactionTotal = getRtQpcrReactionTotalWithDeadVolume();
  const lines = [];

  if (experimentFields.rtqpcrPartRT?.checked) {
    template.sections.rt.items.forEach(item => {
      if (item.quantityMode === "rtWaterRange") {
        lines.push({
          isManual: true,
          manualLinkOnly: true,
          itemId: "",
          name: item.name,
          quantity: 0,
          quantityMin: item.minPerSample * sampleTotal,
          quantityMax: item.maxPerSample * sampleTotal,
          quantityDisplay: formatRange(
            item.minPerSample * sampleTotal,
            item.maxPerSample * sampleTotal,
            item.unit
          ),
          unit: item.unit,
          notes: item.notes,
          quantityEditable: false
        });
        return;
      }

      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number((item.perSample * sampleTotal).toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  if (experimentFields.rtqpcrPartDilution?.checked) {
    template.sections.dilution.items.forEach(item => {
      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number((item.perSample * sampleTotal).toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  if (experimentFields.rtqpcrPartQPCR?.checked) {
    template.sections.qpcr.items.forEach(item => {
      let total = 0;

      if (item.quantityMode === "qpcrSample") {
        total = item.perReaction * qpcrReactionBaseTotal;
      } else {
        total = item.perReaction * qpcrReactionTotal;
      }

      lines.push({
        isManual: true,
        manualLinkOnly: true,
        itemId: "",
        name: item.name,
        quantity: Number(total.toFixed(3)),
        unit: item.unit,
        notes: item.notes,
        quantityEditable: false
      });
    });
  }

  getMergedExperimentLines(lines).forEach(line => addExperimentItemRow(line));
}

function recalculateExperimentTemplateQuantities() {
  const template = protocolTemplates.find(
    entry => entry.id === experimentFields.experimentTemplate.value
  );
  if (!template) { updateExperimentTotalConditions(); updateExperimentModalStock(); return; }

  if (template.mode === "rtqpcr") {
    const rtqpcrQPCRBlock = document.querySelector("#rtqpcrQPCRBlock");
    rtqpcrQPCRBlock?.classList.toggle("hidden", !experimentFields.rtqpcrPartQPCR?.checked);

    syncRtQpcrSampleFields();
    experimentFields.experimentTotalConditions.value = getRtQpcrSampleTotal();
    buildExperimentItemsFromTemplate();
    return;
  }

  const total = updateExperimentTotalConditions();

  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const perCondition = Number(row.dataset.perCondition || 0);
    if (perCondition > 0) {
      row.querySelector(".experiment-item-quantity").value = Number(
        (perCondition * total).toFixed(3)
      );
    }
  });

  updateExperimentModalStock();
}

function updateExperimentTotalConditions() {
  const total = Math.max(1, Number(experimentFields.experimentConditions.value || 1)) * Math.max(1, Number(experimentFields.experimentReplicates.value || 1));
  experimentFields.experimentTotalConditions.value = total;
  return total;
}

function syncRtQpcrSampleFields() {
  if (experimentFields.rtqpcrSampleConditions) {
    experimentFields.rtqpcrSampleConditions.value = experimentFields.experimentConditions.value || 1;
  }

  if (experimentFields.rtqpcrSampleReplicates) {
    experimentFields.rtqpcrSampleReplicates.value = experimentFields.experimentReplicates.value || 1;
  }
}

// fonctions pour le protocole qPCR
function isRtQpcrTemplate(templateId = experimentFields.experimentTemplate.value) {
  const template = protocolTemplates.find(entry => entry.id === templateId);
  return template?.mode === "rtqpcr";
}

function getRtQpcrSampleTotal() {
  const conditions = Math.max(1, Number(experimentFields.experimentConditions?.value || 1));
  const replicates = Math.max(1, Number(experimentFields.experimentReplicates?.value || 1));
  return conditions * replicates;
}

function getRtQpcrReactionBaseTotal() {
  const qpcrConditions = Math.max(1, Number(experimentFields.rtqpcrQpcrConditions?.value || experimentFields.experimentConditions?.value || 1));
  const primerCount = Math.max(1, Number(experimentFields.rtqpcrPrimerCount?.value || 1));
  const qpcrReplicates = Math.max(1, Number(experimentFields.rtqpcrQpcrReplicates?.value || 2));
  return qpcrConditions * primerCount * qpcrReplicates;
}

function getRtQpcrReactionTotalWithDeadVolume() {
  const base = getRtQpcrReactionBaseTotal();
  const deadVolumeConditions = Math.max(0, Number(experimentFields.rtqpcrDeadVolumeConditions?.value || 2));
  return base + deadVolumeConditions;
}

function formatRange(min, max, unit) {
  return `${Number(min.toFixed(3))} - ${Number(max.toFixed(3))} ${unit}`;
}

function getMergedExperimentLines(lines = []) {
  const merged = new Map();

  lines.forEach(line => {
    const unit = line.unit || "";
    const name = line.name || "";
    const itemKey = line.inventoryItemId || line.itemId || "";
    const key = `${normalizeSearch(name)}|${normalizeSearch(unit)}|${itemKey}`;
    const quantity = Number(line.quantity || 0);
    const quantityMin = line.quantityMin !== undefined
      ? Number(line.quantityMin || 0)
      : quantity;
    const quantityMax = line.quantityMax !== undefined
      ? Number(line.quantityMax || 0)
      : quantity;

    if (!key.trim()) {
      merged.set(`unique-${merged.size}`, { ...line });
      return;
    }

    if (!merged.has(key)) {
      const normalizedLine = {
        ...line,
        quantity: Number(quantityMax.toFixed(3)),
        quantityMin: Number(quantityMin.toFixed(3)),
        quantityMax: Number(quantityMax.toFixed(3))
      };

      normalizedLine.quantityDisplay = quantityMin !== quantityMax
        ? formatRange(quantityMin, quantityMax, unit)
        : line.quantityDisplay || "";

      merged.set(key, normalizedLine);
      return;
    }

    const existing = merged.get(key);
    const existingMin = Number(existing.quantityMin ?? existing.quantity ?? 0);
    const existingMax = Number(existing.quantityMax ?? existing.quantity ?? 0);
    const nextMin = Number((existingMin + quantityMin).toFixed(3));
    const nextMax = Number((existingMax + quantityMax).toFixed(3));
    const existingNotes = String(existing.notes || "");
    const nextNotes = String(line.notes || "");
    const notes = [existingNotes, nextNotes]
      .filter(Boolean)
      .filter((note, index, all) => all.indexOf(note) === index)
      .join(" + ");

    merged.set(key, {
      ...existing,
      quantity: nextMax,
      quantityMin: nextMin,
      quantityMax: nextMax,
      quantityDisplay: nextMin !== nextMax ? formatRange(nextMin, nextMax, unit) : "",
      notes,
      perConditionQuantity: Number((Number(existing.perConditionQuantity || 0) + Number(line.perConditionQuantity || 0)).toFixed(3))
    });
  });

  return Array.from(merged.values());
}


// items de experimentos no vinculados con items del inventarios por ahora
function addExperimentItemRow(line = {}, options = {}) {
  if(line.type==="inventory"||line.type==="custom"){addFreeExperimentItemRow(line);return;}
  const isManual =
    line.isManual === true ||
    line.manualLinkOnly === true ||
    !line.itemId;

  const explicitItem = line.itemId
    ? items.find(entry => entry.id === line.itemId)
    : null;

  const selectedItem = explicitItem || findInventoryItem(line);
  const quantityEditable = line.quantityEditable !== false;
  const quantityHint = line.quantityDisplay
    ? `<small class="experiment-quantity-hint">${escapeHtml(line.quantityDisplay)}</small>`
    : "";

  const protocolName = line.name || selectedItem?.name || "";
  const unitValue = line.unit || selectedItem?.unit || "";
  const showInventorySelect = options.showInventorySelect === true;

  const row = document.createElement("div");
  row.className = "experiment-item-row";
  row.dataset.rowMode = isManual ? "manual" : "template";
  row.dataset.perCondition = Number(line.perConditionQuantity ?? 0);
  row.dataset.protocolName = protocolName;
  row.dataset.quantityEditable = quantityEditable ? "true" : "false";
  row.dataset.manualLinkOnly = line.manualLinkOnly ? "true" : "false";
  row.dataset.itemId = line.itemId || selectedItem?.id || "";
  row.dataset.lineNotes = line.notes || "";
  row.dataset.quantityDisplay = line.quantityDisplay || "";
  row.dataset.quantityMin = line.quantityMin ?? "";
  row.dataset.quantityMax = line.quantityMax ?? "";

  if (showInventorySelect) {
    row.innerHTML = `
      <div class="experiment-item-linker">
        <div class="experiment-item-label">
          <strong>${escapeHtml(protocolName)}</strong>
        </div>

        <select class="experiment-item-select">
          <option value="">Choisir un item inventaire</option>
          ${items.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
        </select>
      </div>

      <div class="experiment-quantity-wrap">
        <input
          class="experiment-item-quantity"
          type="number"
          min="0"
          step="any"
          data-quantity-step="1"
          value="${escapeHtml(line.quantity ?? "")}"
          ${quantityEditable ? "" : "readonly"}
          required
        >
        ${quantityHint}
      </div>

      <input
        class="experiment-item-unit"
        value="${escapeHtml(unitValue)}"
        readonly
        required
      >

      <span class="experiment-stock-state"></span>

      <button class="ghost-btn compact-btn" type="button">Retirer</button>
    `;

    row.querySelector(".experiment-item-select").value = line.itemId || "";
  } else {
    row.innerHTML = `
      <div class="experiment-item-label">
        <strong>${escapeHtml(protocolName || "Produit")}</strong>
      </div>

      <input
        type="hidden"
        class="experiment-item-id"
        value="${escapeHtml(line.itemId || selectedItem?.id || "")}"
      >

      <div class="experiment-quantity-wrap">
        <input
          class="experiment-item-quantity"
          type="number"
          min="0"
          step="any"
          data-quantity-step="1"
          value="${escapeHtml(line.quantity ?? "")}"
          ${quantityEditable ? "" : "readonly"}
          required
        >
        ${quantityHint}
      </div>

      <input
        class="experiment-item-unit"
        value="${escapeHtml(unitValue)}"
        readonly
        required
      >

      <span class="experiment-stock-state"></span>

      <button class="ghost-btn compact-btn" type="button">Retirer</button>
    `;
  }

  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateExperimentModalStock();
  });

  experimentItemsList.append(row);
  updateExperimentModalStock();
}

function getExperimentItemUnits(item) {
  if(!item)return[];
  const equivalents=StockTracking.equivalentLevels(item,StockTracking.available(item));
  return equivalents.slice().reverse().map(level=>({key:level.key,singular:level.singular,plural:level.plural,value:level.value}));
}

function addFreeExperimentItemRow(line={}) {
  const type=line.type==="custom"?"custom":"inventory",row=document.createElement("div");row.className="experiment-item-row";row.dataset.lineType=type;
  row.setAttribute("draggable","true");
  if(type==="inventory"){
    const selectedId=line.inventoryItemId||line.itemId||"",selected=items.find(item=>item.id===selectedId),units=getExperimentItemUnits(selected),unit=line.unit||units[0]?.key||"";
    row.innerHTML=`<label class="experiment-item-field"><span>Item de l’inventaire</span><div class="order-combobox experiment-item-combobox"><input type="search" class="experiment-item-search" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" placeholder="Rechercher un item…"><button type="button" class="order-combobox-clear experiment-item-clear hidden" aria-label="Effacer l’item sélectionné">&times;</button><div class="order-combobox-options experiment-item-options hidden" role="listbox"></div><input type="hidden" class="experiment-item-select"></div></label><label class="experiment-item-field"><span>Quantité</span><input class="experiment-item-quantity" inputmode="decimal" placeholder="Quantité" value="${escapeHtml(line.quantity??"")}"></label><label class="experiment-item-field"><span>Unité</span><select class="experiment-item-unit" aria-label="Unité">${renderExperimentUnitOptions(units,unit)}</select></label><span class="experiment-stock-state stock-neutral" role="status">À compléter</span><button class="movement-entry-delete experiment-remove-line" type="button" aria-label="Retirer cet item de l’expérience">−</button><p class="experiment-line-error hidden" role="alert"></p>`;
    row.querySelector(".experiment-item-select").value=selectedId;
    if(selected)row.querySelector(".experiment-item-search").value=selected.name;
    bindExperimentComboboxEvents(row);
    row.addEventListener("input",updateExperimentModalStock);
  }else{
    row.innerHTML=`<label class="experiment-item-field"><span>Nom de l’item libre</span><input class="experiment-custom-name" placeholder="Nom de l’item" value="${escapeHtml(line.name||"")}"></label><label class="experiment-item-field"><span>Quantité</span><input class="experiment-item-quantity" inputmode="decimal" placeholder="Quantité" value="${escapeHtml(line.quantity??"")}"></label><label class="experiment-item-field"><span>Unité</span><input class="experiment-item-unit" placeholder="Unité" value="${escapeHtml(line.unit||"")}"></label><div class="experiment-theoretical-stock-field"><input type="number" class="experiment-theoretical-stock" min="0" step="any" inputmode="decimal" placeholder="Stock théorique" aria-label="Stock théorique disponible (non suivi dans l’inventaire)" value="${escapeHtml(line.theoreticalStock??"")}"><span class="experiment-stock-state stock-neutral" role="status">À renseigner</span></div><button class="movement-entry-delete experiment-remove-line" type="button" aria-label="Retirer cet item libre de l’expérience">−</button><p class="experiment-line-error hidden" role="alert"></p>`;
    row.addEventListener("input",updateExperimentModalStock);
  }
  row.querySelector(".experiment-remove-line").addEventListener("click",()=>{row.remove();updateExperimentModalStock()});
  bindExperimentItemDragEvents(row);
  experimentItemsList.append(row);updateExperimentModalStock();
}

function disableDragOnFormControls(root) {
  root.querySelectorAll("input, select, textarea, button").forEach(el => el.setAttribute("draggable", "false"));
}

function bindExperimentItemDragEvents(row) {
  disableDragOnFormControls(row);
  // draggable="false" sur les champs ne suffit pas toujours à empêcher le navigateur
  // de démarrer un drag de la ligne pendant une sélection de texte : on désactive donc
  // aussi le drag de la ligne elle-même dès qu'un geste démarre sur un champ interactif.
  row.addEventListener("mousedown", event => {
    row.draggable = !event.target.closest("input, select, textarea, button, .order-combobox");
  });
  row.addEventListener("mouseup", () => { row.draggable = true; });
  row.addEventListener("dragstart", () => {
    experimentDragSourceRow = row;
    row.classList.add("dragging");
  });
  row.addEventListener("dragend", () => {
    row.classList.remove("dragging");
    experimentDragSourceRow = null;
    row.draggable = true;
  });
}

function handleExperimentItemDragOver(event) {
  if (!experimentDragSourceRow) return;
  event.preventDefault();
  const afterRow = getExperimentDragAfterRow(experimentItemsList, event.clientY);
  if (afterRow == null) experimentItemsList.appendChild(experimentDragSourceRow);
  else if (afterRow !== experimentDragSourceRow) experimentItemsList.insertBefore(experimentDragSourceRow, afterRow);
}

function getExperimentDragAfterRow(container, y) {
  const rows = [...container.querySelectorAll(".experiment-item-row:not(.dragging)")];
  return rows.reduce((closest, candidate) => {
    const box = candidate.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: candidate };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function bindExperimentComboboxEvents(row) {
  const search = row.querySelector(".experiment-item-search");
  const clearBtn = row.querySelector(".experiment-item-clear");
  search.addEventListener("input", () => {
    row.querySelector(".experiment-item-select").value = "";
    clearBtn.classList.add("hidden");
    search.setCustomValidity("");
    renderExperimentItemComboboxOptions(row, { open: true });
    updateExperimentModalStock();
  });
  search.addEventListener("focus", () => renderExperimentItemComboboxOptions(row, { open: true }));
  search.addEventListener("keydown", event => handleExperimentComboboxKeydown(row, event));
  clearBtn.addEventListener("click", () => clearExperimentInventorySelection(row));
}

function renderExperimentItemComboboxOptions(row, options = {}) {
  const list = row.querySelector(".experiment-item-options");
  if (!list) return;
  const selectValue = row.querySelector(".experiment-item-select").value;
  const query = normalizeSearch(row.querySelector(".experiment-item-search")?.value || "");
  const sorted = items.slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }));
  const filtered = sorted.filter(item => {
    const haystack = normalizeSearch([item.name, item.category, ...getItemLocations(item), ...item.tags].join(" "));
    return !query || haystack.includes(query);
  });

  list.innerHTML = filtered.length
    ? filtered.map(item => `
        <button
          type="button"
          role="option"
          class="order-combobox-option"
          data-experiment-item-id="${escapeHtml(item.id)}"
          aria-selected="${selectValue === item.id ? "true" : "false"}"
        >
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml([item.category, formatLocations(item)].filter(Boolean).join(" · "))}</span>
        </button>
      `).join("")
    : `<p class="order-combobox-empty">Aucun item trouvé</p>`;
  disableDragOnFormControls(list);

  list.querySelectorAll("[data-experiment-item-id]").forEach(option => {
    option.addEventListener("click", () => selectExperimentInventoryItem(row, option.dataset.experimentItemId));
    option.addEventListener("keydown", event => {
      const optionButtons = [...list.querySelectorAll("[data-experiment-item-id]")];
      const index = optionButtons.indexOf(option);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next = event.key === "ArrowDown"
          ? Math.min(index + 1, optionButtons.length - 1)
          : Math.max(index - 1, 0);
        optionButtons[next]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeExperimentComboboxOptions(row);
        row.querySelector(".experiment-item-search").focus();
      }
    });
  });

  if (options.open) {
    list.classList.remove("hidden");
    row.querySelector(".experiment-item-search").setAttribute("aria-expanded", "true");
  }
}

function selectExperimentInventoryItem(row, id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  row.querySelector(".experiment-item-select").value = item.id;
  row.querySelector(".experiment-item-search").value = item.name;
  row.querySelector(".experiment-item-search").setCustomValidity("");
  row.querySelector(".experiment-item-clear")?.classList.remove("hidden");
  closeExperimentComboboxOptions(row);
  hydrateFreeExperimentInventoryRow(row, item.id);
  updateExperimentModalStock();
}

function clearExperimentInventorySelection(row) {
  row.querySelector(".experiment-item-select").value = "";
  row.querySelector(".experiment-item-search").value = "";
  row.querySelector(".experiment-item-clear")?.classList.add("hidden");
  renderExperimentItemComboboxOptions(row, { open: true });
  row.querySelector(".experiment-item-search").focus();
  updateExperimentModalStock();
}

function handleExperimentComboboxKeydown(row, event) {
  const list = row.querySelector(".experiment-item-options");
  const options = [...(list?.querySelectorAll("[data-experiment-item-id]") || [])];
  const activeIndex = options.indexOf(document.activeElement);
  if (event.key === "Escape") {
    closeExperimentComboboxOptions(row);
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (list?.classList.contains("hidden")) renderExperimentItemComboboxOptions(row, { open: true });
    const nextIndex = event.key === "ArrowDown"
      ? Math.min(activeIndex + 1, options.length - 1)
      : Math.max(activeIndex < 0 ? options.length - 1 : activeIndex - 1, 0);
    options[nextIndex]?.focus();
    return;
  }
  if (event.key === "Enter" && options.length === 1) {
    event.preventDefault();
    selectExperimentInventoryItem(row, options[0].dataset.experimentItemId);
  }
}

function closeExperimentComboboxOptions(row) {
  row.querySelector(".experiment-item-options")?.classList.add("hidden");
  row.querySelector(".experiment-item-search")?.setAttribute("aria-expanded", "false");
}

function handleExperimentComboboxOutsideClick(event) {
  document.querySelectorAll(".experiment-item-combobox").forEach(combobox => {
    if (combobox.contains(event.target)) return;
    const list = combobox.querySelector(".experiment-item-options");
    if (list && !list.classList.contains("hidden")) {
      list.classList.add("hidden");
      combobox.querySelector(".experiment-item-search")?.setAttribute("aria-expanded", "false");
    }
  });
}

function renderExperimentUnitOptions(units,selected="") {
  if(!units.length)return'<option value="">Sélectionnez d’abord un item</option>';
  return units.map(unit=>`<option value="${escapeHtml(unit.key)}"${unit.key===selected?" selected":""}>${escapeHtml(unit.plural||unit.singular)}</option>`).join("");
}

function hydrateFreeExperimentInventoryRow(row,itemId) {
  const item=items.find(entry=>entry.id===itemId),units=getExperimentItemUnits(item),select=row.querySelector(".experiment-item-unit");select.innerHTML=renderExperimentUnitOptions(units,units[0]?.key||"");
}

function parseExperimentQuantity(value) { return StockTracking.parseLocalizedNumber(value); }

function getExperimentInventoryAvailability(itemId,quantity,unitKey) {
  return getExperimentItemAvailability(items.find(entry=>entry.id===itemId),quantity,unitKey);
}

function getExperimentItemAvailability(item,quantity,unitKey) {
  if(!item||!unitKey||!Number.isFinite(quantity)||quantity<=0)return{kind:"neutral",label:"À compléter"};
  const equivalent=StockTracking.equivalentLevels(item,StockTracking.available(item)).find(level=>level.key===unitKey);if(!equivalent)return{kind:"warning",label:"Conversion impossible"};
  if(equivalent.value<=0)return{kind:"low",label:"Stock épuisé"};
  if(equivalent.value+1e-8>=quantity)return{kind:"ok",label:`Stock suffisant · ${StockTracking.format(equivalent.value)} ${StockTracking.plural(equivalent.value,equivalent.singular,equivalent.plural)} disponibles`};
  return{kind:"low",label:`Stock insuffisant · Il manque ${StockTracking.format(quantity-equivalent.value)} ${StockTracking.plural(quantity-equivalent.value,equivalent.singular,equivalent.plural)}`};
}

function hydrateExperimentItemRow(row, itemId) {
  if (!row) return;

  const item = items.find(entry => entry.id === itemId);
  row.dataset.itemId = item?.id || "";
  // l'unité du protocole reste la référence à comparer ; on ne l'écrase que si elle est vide
  const unitField = row.querySelector(".experiment-item-unit");
  if (!unitField.value.trim()) unitField.value = item?.unit || "";
  updateExperimentModalStock();
}

function updateExperimentModalStock() {
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    if(row.dataset.lineType==="custom"){
      const state=row.querySelector(".experiment-stock-state");
      const needed=parseExperimentQuantity(row.querySelector(".experiment-item-quantity")?.value);
      const theoretical=parseExperimentQuantity(row.querySelector(".experiment-theoretical-stock")?.value);
      if(!Number.isFinite(theoretical)||!Number.isFinite(needed)||needed<=0){
        state.className="experiment-stock-state stock-neutral";state.textContent="À renseigner";
      }else if(needed<theoretical){
        state.className="experiment-stock-state stock-ok";state.textContent="Stock suffisant";
      }else if(needed>theoretical){
        state.className="experiment-stock-state stock-missing";state.textContent="Stock insuffisant";
      }else{
        state.className="experiment-stock-state stock-warning";state.textContent="Stock juste";
      }
      return;
    }
    if(row.dataset.lineType==="inventory"){
      const availability=getExperimentInventoryAvailability(row.querySelector(".experiment-item-select").value,parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),row.querySelector(".experiment-item-unit").value),state=row.querySelector(".experiment-stock-state");state.className=`experiment-stock-state ${availability.kind==="ok"?"stock-ok":availability.kind==="low"?"stock-low":availability.kind==="warning"?"stock-warning":"stock-neutral"}`;state.textContent=availability.label;return;
    }
    const item = getExperimentRowItem(row);
    const needed = Number(row.querySelector(".experiment-item-quantity").value || 0);
    const unit = row.querySelector(".experiment-item-unit").value.trim();
    const state = row.querySelector(".experiment-stock-state");

    if (!item) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = "Manquant";
      return;
    }

    if (!unit) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = `${item.quantity} ${item.unit} - unité manquante`;
      return;
    }

    const availability = getExperimentLineAvailability(item, needed, unit);
    if (!availability.compatible) {
      state.className = "experiment-stock-state stock-missing";
      state.textContent = `${item.quantity} ${item.unit} - unité incompatible (attendu ${availability.referenceUnit.plural})`;
      return;
    }

    const lowStock = availability.kind !== "ok" || itemStatus(item) !== "ok";
    state.className = `experiment-stock-state ${lowStock ? "stock-low" : "stock-ok"}`;
    state.textContent = `${lowStock ? "Stock bas" : "Connecte"} · ${StockTracking.format(availability.availableInReferenceUnit)} ${availability.referenceUnit.plural}${availability.converted ? ` (converti depuis ${unit})` : ""}`;
  });
}

function getExperimentRows() {
  return [...experimentItemsList.querySelectorAll(".experiment-item-row")]
    .map(row => {
      if(row.dataset.lineType==="inventory")return{type:"inventory",inventoryItemId:row.querySelector(".experiment-item-select").value,quantity:parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),unit:row.querySelector(".experiment-item-unit").value};
      if(row.dataset.lineType==="custom")return{type:"custom",name:row.querySelector(".experiment-custom-name").value.trim(),quantity:parseExperimentQuantity(row.querySelector(".experiment-item-quantity").value),unit:row.querySelector(".experiment-item-unit").value.trim(),theoreticalStock:parseExperimentQuantity(row.querySelector(".experiment-theoretical-stock")?.value)};
      const item = getExperimentRowItem(row);
      const isManual = row.dataset.rowMode === "manual";

      return {
        isManual,
        itemId: item?.id || row.dataset.itemId || "",
        name: row.dataset.protocolName || item?.name || "",
        quantity: Number(row.querySelector(".experiment-item-quantity").value || 0),
        unit: row.querySelector(".experiment-item-unit").value.trim(),
        notes: row.dataset.lineNotes || "",
        perConditionQuantity: Number(row.dataset.perCondition || 0),
        quantityEditable: row.dataset.quantityEditable === "true",
        manualLinkOnly: row.dataset.manualLinkOnly === "true",
        quantityDisplay: row.dataset.quantityDisplay || "",
        quantityMin: row.dataset.quantityMin === "" ? undefined : Number(row.dataset.quantityMin),
        quantityMax: row.dataset.quantityMax === "" ? undefined : Number(row.dataset.quantityMax)
      };
    })
    .filter(line =>
      line.name ||
      line.itemId ||
      line.inventoryItemId ||
      line.quantity > 0 ||
      line.quantityDisplay
    );
}

function getExperimentRowItem(row) {
  if (!row) return null;

  const select = row.querySelector(".experiment-item-select");
  const hiddenId = row.querySelector(".experiment-item-id")?.value || row.dataset.itemId || "";
  const itemId = select?.value || hiddenId;

  return itemId
    ? items.find(entry => entry.id === itemId) || null
    : null;
}

function validateExperimentConsumedRows() {
  let valid=true;experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row=>{const error=row.querySelector(".experiment-line-error");if(!error)return;let message="";const quantity=parseExperimentQuantity(row.querySelector(".experiment-item-quantity")?.value);if(row.dataset.lineType==="inventory"){const id=row.querySelector(".experiment-item-select").value,item=items.find(entry=>entry.id===id),units=getExperimentItemUnits(item);if(!item)message="Sélectionnez un item de l’inventaire.";else if(!Number.isFinite(quantity)||quantity<=0)message="Saisissez une quantité strictement positive.";else if(!units.some(unit=>unit.key===row.querySelector(".experiment-item-unit").value))message="Sélectionnez une unité configurée pour cet item.";}else if(row.dataset.lineType==="custom"){if(!row.querySelector(".experiment-custom-name").value.trim())message="Saisissez le nom de l’item libre.";else if(!Number.isFinite(quantity)||quantity<=0)message="Saisissez une quantité strictement positive.";else if(!row.querySelector(".experiment-item-unit").value.trim())message="Saisissez l’unité de l’item libre.";}error.textContent=message;error.classList.toggle("hidden",!message);if(message)valid=false;});return valid;
}

async function saveExperiment() {
  if (!experimentForm.reportValidity()) return;
  if (!validateExperimentConsumedRows()) return;

  if (
    isRtQpcrTemplate() &&
    !experimentFields.rtqpcrPartRT.checked &&
    !experimentFields.rtqpcrPartDilution.checked &&
    !experimentFields.rtqpcrPartQPCR.checked
  ) {
    window.alert("Merci de sélectionner au moins une partie : RT, dilution cDNA ou qPCR.");
    return;
  }

  const template = protocolTemplates.find(
    entry => entry.id === experimentFields.experimentTemplate.value
  );

  const id = experimentFields.experimentId.value || `exp-${Date.now()}`;
  const index = experiments.findIndex(entry => entry.id === id);
  const previousExperiment = index >= 0 ? experiments[index] : null;
  const experiment = serializeExperimentDraft(id, template, previousExperiment);
  const isNew = index < 0;
  if (!isNew) experiment.createdBy = previousExperiment.createdBy || currentName;

  const errorBox = document.querySelector("#experimentSaveError");
  errorBox?.classList.add("hidden");
  const button = document.querySelector("#saveExperimentBtn");
  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    if (errorBox) { errorBox.textContent = "La sauvegarde GitHub en écriture est requise pour enregistrer une expérience."; errorBox.classList.remove("hidden"); }
    return;
  }

  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "Enregistrement…";
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`experiment-save-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.experiments = Array.isArray(state.experiments) ? state.experiments : [];
      const at = state.experiments.findIndex(entry => entry.id === id);
      if (at >= 0) state.experiments[at] = experiment; else state.experiments.unshift(experiment);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: isNew ? "Experience créée" : "Experience modifiée",
        detail: isNew
          ? `${currentName} a créé ${experiment.name} depuis ${experiment.templateName}.`
          : `${currentName} a modifié ${experiment.name}.`
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
    selectedExperimentId = id;
    experimentFields.experimentTemplate.disabled = false;
    experimentDialog.close();
    renderExperiments();
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

function serializeExperimentDraft(id,template=protocolTemplates.find(entry=>entry.id===experimentFields.experimentTemplate.value),previousExperiment=null) {
  const now = new Date().toISOString();
  const status = normalizeExperimentStatus(experimentFields.experimentStatus.value);
  const createdAt = previousExperiment?.createdAt || now;
  return {
    id,
    name: experimentFields.experimentName.value.trim(),
    clientCode: experimentFields.experimentClientCode.value.trim(),
    templateId: experimentFields.experimentTemplate.value,
    templateName: template?.name || "Nouveau protocole",

    conditions: Number(experimentFields.experimentConditions.value || 1),

    replicates: Number(experimentFields.experimentReplicates.value || 1),

    status,
    createdAt,
    statusChangedAt: previousExperiment && normalizeExperimentStatus(previousExperiment.status) === status
      ? (previousExperiment.statusChangedAt || (status === "draft" ? createdAt : null))
      : now,
    notes: normalizeMultilineText(experimentFields.experimentNotes.value),

    rtqpcrConfig: isRtQpcrTemplate()
      ? {
          parts: {
            rt: experimentFields.rtqpcrPartRT.checked,
            dilution: experimentFields.rtqpcrPartDilution.checked,
            qpcr: experimentFields.rtqpcrPartQPCR.checked
          },
          sampleConditions: Number(experimentFields.experimentConditions.value || 1),
          sampleReplicates: Number(experimentFields.experimentReplicates.value || 1),
          qpcrConditions: Number(experimentFields.rtqpcrQpcrConditions?.value || experimentFields.experimentConditions.value || 1),
          primerCount: Number(experimentFields.rtqpcrPrimerCount.value || 1),
          qpcrReplicates: Number(experimentFields.rtqpcrQpcrReplicates.value || 2),
          deadVolumeConditions: Number(experimentFields.rtqpcrDeadVolumeConditions.value || 2)
        }
      : null,

    createdBy: currentName,
    updatedAt: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date()),

    templateNotes: normalizeMultilineText(experimentFields.experimentTemplateNotes.value),
    items: experimentFields.experimentTemplate.value===FREE_PROTOCOL_ID?getExperimentRows():getMergedExperimentLines(getExperimentRows()),
    consumedItems: Array.isArray(previousExperiment?.consumedItems) ? previousExperiment.consumedItems : []
  };
}

function requestExperimentDeletion() {
  const id = experimentFields.experimentId.value;
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer l’expérience “${experiment.name}” ? Cette action est irréversible.`,
    onConfirm: () => deleteExperiment(id)
  });
}

async function deleteExperiment(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) throw new Error("Cette expérience n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer cette expérience.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`experiment-delete-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.experiments = (Array.isArray(state.experiments) ? state.experiments : []).filter(entry => entry.id !== id);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Experience supprimee",
        detail: `${currentName} a supprime ${experiment.name}.`
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
    if (selectedExperimentId === id) selectedExperimentId = null;
    experimentFields.experimentTemplate.disabled = false;
    experimentDialog.close();
    renderExperiments();
    renderHistory();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

// une expérience peut être consommée dès qu'au moins un item est connecté, dans une unité compatible,
// et pas déjà consommé pour cette expérience — un produit ne peut être consommé qu'une seule fois par expérience
function getExperimentConsumedItemIds(experiment) {
  return new Set((Array.isArray(experiment?.consumedItems) ? experiment.consumedItems : []).map(entry => entry.itemId));
}

function experimentHasConsumableItems(experiment) {
  const consumedIds = getExperimentConsumedItemIds(experiment);
  return getMergedExperimentLines(experiment.items).some(line => {
    if (line?.type === "custom") return false;
    const item = findInventoryItem(line);
    if (!item || consumedIds.has(item.id)) return false;
    return resolveExperimentLineUnitMatch(item, line.quantity, line.unit).compatible;
  });
}

// construit l'opération de stock native (simple ou containers) équivalente à la quantité déjà validée pour la ligne du protocole
function buildExperimentConsumeOperation(item, quantity, unit, comment) {
  const match = resolveExperimentLineUnitMatch(item, quantity, unit);
  if (!match.compatible) throw new Error(`Unité incompatible pour « ${item.name} ».`);
  const tracking = StockTracking.normalizeTracking(item);
  const quantityInTrackingUnit = StockTracking.fromBaseQuantity(match.neededInReferenceUnit, tracking);
  return {
    operationId: StockTracking.id("operation"),
    type: "consumed",
    entityType: tracking.mode === "containers" ? "containers_auto" : "item",
    quantity: quantityInTrackingUnit,
    comment
  };
}

function openConsumeExperimentDialog(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment || experiment.status === "completed") return;

  const consumedIds = getExperimentConsumedItemIds(experiment);
  const mergedLines = getMergedExperimentLines(experiment.items);
  const consumable = [];
  let skippedCount = 0;
  let alreadyConsumedCount = 0;

  mergedLines.forEach(line => {
    if (line.type === "custom") { skippedCount += 1; return; }
    const item = findInventoryItem(line);
    if (item && consumedIds.has(item.id)) { alreadyConsumedCount += 1; return; }
    const match = item ? resolveExperimentLineUnitMatch(item, line.quantity, line.unit) : null;
    if (!item || !match.compatible) { skippedCount += 1; return; }
    consumable.push({ item, line });
  });

  if (!consumable.length) {
    window.alert(alreadyConsumedCount
      ? "Tous les items compatibles de cette expérience ont déjà été consommés."
      : "Aucun item connecté et compatible à consommer pour cette expérience.");
    return;
  }

  document.querySelector("#consumeExperimentId").value = experiment.id;
  const errorBox = document.querySelector("#consumeExperimentError");
  errorBox.textContent = "";
  errorBox.classList.add("hidden");

  const skippedNote = document.querySelector("#consumeExperimentSkippedNote");
  const notes = [];
  if (alreadyConsumedCount) notes.push(`${alreadyConsumedCount} item${alreadyConsumedCount > 1 ? "s" : ""} déjà consommé${alreadyConsumedCount > 1 ? "s" : ""} pour cette expérience — non modifiable.`);
  if (skippedCount) notes.push(`${skippedCount} item${skippedCount > 1 ? "s" : ""} ignoré${skippedCount > 1 ? "s" : ""} (item libre, manquant ou unité incompatible).`);
  if (notes.length) {
    skippedNote.textContent = notes.join(" ");
    skippedNote.classList.remove("hidden");
  } else {
    skippedNote.classList.add("hidden");
  }

  document.querySelector("#consumeExperimentItems").innerHTML = consumable.map(({ item, line }) => {
    const displayName = line.name || item.name;
    return `
      <div class="consume-experiment-item" data-item-id="${escapeHtml(item.id)}" data-unit="${escapeHtml(line.unit || "")}" data-name="${escapeHtml(displayName)}">
        <div class="consume-experiment-item-info">
          <strong>${escapeHtml(displayName)}</strong>
          <span class="consume-experiment-item-state"></span>
        </div>
        <div class="consume-experiment-item-qty">
          <input type="number" min="0" step="any" class="consume-experiment-item-quantity" value="${Number(line.quantity || 0)}">
          <span class="consume-experiment-item-unit">${escapeHtml(line.unit || "")}</span>
        </div>
        <button class="ghost-btn compact-btn" type="button" data-remove-consume-item aria-label="Retirer ${escapeHtml(displayName)} de la consommation">Retirer</button>
      </div>
    `;
  }).join("");

  updateConsumeExperimentItemStates();
  consumeExperimentDialog.showModal();
}

function updateConsumeExperimentItemStates() {
  document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").forEach(row => {
    const item = items.find(entry => entry.id === row.dataset.itemId);
    const unit = row.dataset.unit;
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".consume-experiment-item-quantity").value);
    const state = row.querySelector(".consume-experiment-item-state");

    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      state.textContent = "Quantité invalide";
      state.className = "consume-experiment-item-state alert";
      return;
    }

    const availability = getExperimentLineAvailability(item, quantity, unit);
    if (!availability.compatible) {
      state.textContent = "Unité incompatible";
      state.className = "consume-experiment-item-state alert";
      return;
    }
    if (availability.kind !== "ok") {
      state.textContent = `Stock insuffisant · ${StockTracking.format(availability.availableInReferenceUnit)} ${availability.referenceUnit.plural} disponibles`;
      state.className = "consume-experiment-item-state alert";
      return;
    }

    state.textContent = "Stock suffisant";
    state.className = "consume-experiment-item-state ok";
  });
}

async function confirmConsumeExperiment() {
  const id = document.querySelector("#consumeExperimentId").value;
  const errorBox = document.querySelector("#consumeExperimentError");
  errorBox.textContent = "";
  errorBox.classList.add("hidden");

  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;

  const rows = [...document.querySelectorAll("#consumeExperimentItems .consume-experiment-item")];
  if (!rows.length) {
    errorBox.textContent = "Ajoutez au moins un item à consommer, ou fermez cette fenêtre.";
    errorBox.classList.remove("hidden");
    return;
  }

  // validation à froid de toutes les lignes avant de lancer la moindre opération réseau
  const plan = [];
  for (const row of rows) {
    const item = items.find(entry => entry.id === row.dataset.itemId);
    const unit = row.dataset.unit;
    const name = row.dataset.name;
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".consume-experiment-item-quantity").value);

    if (!item || !Number.isFinite(quantity) || quantity <= 0) {
      errorBox.textContent = `Quantité invalide pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }
    const availability = getExperimentLineAvailability(item, quantity, unit);
    if (!availability.compatible) {
      errorBox.textContent = `Unité incompatible pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }
    if (availability.kind !== "ok") {
      errorBox.textContent = `Stock insuffisant pour « ${name} ».`;
      errorBox.classList.remove("hidden");
      return;
    }

    plan.push({ itemId: item.id, unit, name, quantity });
  }

  const confirmBtn = document.querySelector("#confirmConsumeExperimentBtn");
  confirmBtn.disabled = true;

  try {
    for (const entry of plan) {
      const item = items.find(row => row.id === entry.itemId);
      if (!item) throw new Error(`« ${entry.name} » n’existe plus dans l’inventaire.`);

      const operation = buildExperimentConsumeOperation(item, entry.quantity, entry.unit, `Item consommé par expérience « ${experiment.name} »`);
      await executeAtomicStockOperation(item.id, operation);

      const storage = window.ExadexGithubStorage;
      const config = storage?.getConfig?.();
      if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
        throw new Error("La sauvegarde GitHub en écriture est requise pour finaliser cette consommation.");
      }
      await flushPendingSharedDataBeforeAtomicOperation();
      sharedDataIsSaving = true;
      renderAlerts();
      try {
        const result = await storage.mutateSharedData(`experiment-consume-${id}-${entry.itemId}-${Date.now()}`, latest => {
          const state = createSharedState(latest, { includeBootstrap: false });
          const target = (state.experiments || []).find(row => row.id === id);
          if (!target) throw new Error("Cette expérience n’existe plus.");
          target.consumedItems = Array.isArray(target.consumedItems) ? target.consumedItems : [];
          target.consumedItems.push({
            itemId: entry.itemId,
            name: entry.name,
            quantity: entry.quantity,
            unit: entry.unit,
            consumedAt: new Date().toISOString(),
            consumedBy: currentName
          });
          state.history = Array.isArray(state.history) ? state.history : [];
          state.history.unshift({
            date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
            user: currentName,
            action: "Item consommé",
            detail: `${currentName} a consommé ${entry.name} pour l’expérience ${target.name}.`
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
      } finally {
        sharedDataIsSaving = false;
        renderAlerts();
      }

      document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").forEach(row => {
        if (row.dataset.itemId === entry.itemId) row.remove();
      });
    }
  } catch (error) {
    errorBox.textContent = error.message || String(error);
    errorBox.classList.remove("hidden");
    confirmBtn.disabled = false;
    render();
    return;
  }

  confirmBtn.disabled = false;
  render();
  if (!document.querySelectorAll("#consumeExperimentItems .consume-experiment-item").length) {
    consumeExperimentDialog.close();
  }
}

function renderSaveProtocolTemplateItemRow(item) {
  return `
    <div class="save-protocol-template-item" data-item-id="${escapeHtml(item.itemId || "")}" data-name="${escapeHtml(item.name || "")}" data-unit="${escapeHtml(item.unit || "")}">
      <span class="save-protocol-template-item-name">${escapeHtml(item.name || "")}</span>
      <div class="save-protocol-template-item-qty">
        <input type="number" min="0" step="any" class="save-protocol-template-item-quantity" value="${Number(item.perConditionQuantity || 0)}">
        <span class="save-protocol-template-item-unit">${escapeHtml(item.unit || "")}</span>
      </div>
    </div>
  `;
}

// transforme une expérience "Nouveau protocole" en protocol template réutilisable : les quantités sont ramenées à 1 réplica
function openSaveProtocolTemplateDialog(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment || experiment.templateId !== FREE_PROTOCOL_ID) return;

  const lines = (experiment.items || []).filter(line => line?.type === "inventory" || line?.type === "custom");
  if (!lines.length) {
    window.alert("Ajoutez au moins un item à l'expérience avant d'enregistrer un protocole.");
    return;
  }

  const totalConditions = Math.max(1, Number(experiment.conditions || 1)) * Math.max(1, Number(experiment.replicates || 1));

  document.querySelector("#saveProtocolTemplateMode").value = "create";
  document.querySelector("#saveProtocolTemplateId").value = "";
  document.querySelector("#saveProtocolTemplateExperimentId").value = experiment.id;
  document.querySelector("#saveProtocolTemplateTitle").textContent = "Enregistrer le protocole";
  document.querySelector("#confirmSaveProtocolTemplateBtn").textContent = "Enregistrer le protocole";
  document.querySelector("#saveProtocolTemplateName").value = experiment.name || "";
  document.querySelector("#saveProtocolTemplateNotes").value = "";

  document.querySelector("#saveProtocolTemplateItems").innerHTML = lines.map(line => {
    const inventoryItem = line.type === "inventory" ? items.find(item => item.id === line.inventoryItemId) : null;
    const name = line.type === "inventory" ? (inventoryItem?.name || "Item introuvable") : line.name;
    const perReplica = Number((Number(line.quantity || 0) / totalConditions).toFixed(3));
    return renderSaveProtocolTemplateItemRow({
      itemId: line.type === "inventory" ? (line.inventoryItemId || "") : "",
      name,
      unit: line.unit || "",
      perConditionQuantity: perReplica
    });
  }).join("");

  saveProtocolTemplateDialog.showModal();
}

// ouvre le meme dialogue en mode edition pour un protocole personnalise deja enregistre
function openEditProtocolTemplateDialog(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) return;

  document.querySelector("#saveProtocolTemplateMode").value = "edit";
  document.querySelector("#saveProtocolTemplateId").value = template.id;
  document.querySelector("#saveProtocolTemplateExperimentId").value = "";
  document.querySelector("#saveProtocolTemplateTitle").textContent = "Modifier le protocole";
  document.querySelector("#confirmSaveProtocolTemplateBtn").textContent = "Enregistrer les modifications";
  document.querySelector("#saveProtocolTemplateName").value = template.name || "";
  document.querySelector("#saveProtocolTemplateNotes").value = template.notes || "";

  document.querySelector("#saveProtocolTemplateItems").innerHTML = (template.items || [])
    .map(renderSaveProtocolTemplateItemRow)
    .join("");

  saveProtocolTemplateDialog.showModal();
}

async function confirmSaveProtocolTemplate() {
  if (!saveProtocolTemplateForm.reportValidity()) return;

  const name = document.querySelector("#saveProtocolTemplateName").value.trim();
  const notes = normalizeMultilineText(document.querySelector("#saveProtocolTemplateNotes").value);
  const templateItems = [...document.querySelectorAll("#saveProtocolTemplateItems .save-protocol-template-item")].map(row => {
    const itemId = row.dataset.itemId || "";
    const quantity = StockTracking.parseLocalizedNumber(row.querySelector(".save-protocol-template-item-quantity").value);
    return {
      name: row.dataset.name,
      unit: row.dataset.unit,
      perConditionQuantity: Number.isFinite(quantity) ? quantity : 0,
      notes: "",
      quantityEditable: true,
      manualLinkOnly: !itemId,
      ...(itemId ? { itemId } : {})
    };
  });

  const errorBox = document.querySelector("#saveProtocolTemplateError");
  errorBox?.classList.add("hidden");
  const isEdit = document.querySelector("#saveProtocolTemplateMode").value === "edit";

  let templateId, historyAction, historyDetail;
  if (isEdit) {
    templateId = document.querySelector("#saveProtocolTemplateId").value;
    const template = customProtocolTemplates.find(entry => entry.id === templateId);
    if (!template) return;
    historyAction = "Protocole modifié";
    historyDetail = `${currentName} a modifié le protocole « ${name} ».`;
  } else {
    const experimentId = document.querySelector("#saveProtocolTemplateExperimentId").value;
    const experiment = experiments.find(entry => entry.id === experimentId);
    if (!experiment) return;
    templateId = `custom-tpl-${Date.now()}`;
    historyAction = "Protocole enregistré";
    historyDetail = `${currentName} a enregistré le protocole « ${name} » depuis ${experiment.name}.`;
  }

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    if (errorBox) { errorBox.textContent = "La sauvegarde GitHub en écriture est requise pour enregistrer ce protocole."; errorBox.classList.remove("hidden"); }
    return;
  }

  const button = document.querySelector("#confirmSaveProtocolTemplateBtn");
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = "Enregistrement…";
  try {
    await flushPendingSharedDataBeforeAtomicOperation();
    sharedDataIsSaving = true;
    renderAlerts();
    const result = await storage.mutateSharedData(`protocol-save-${templateId}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.customProtocolTemplates = Array.isArray(state.customProtocolTemplates) ? state.customProtocolTemplates : [];
      const at = state.customProtocolTemplates.findIndex(entry => entry.id === templateId);
      if (at >= 0) {
        state.customProtocolTemplates[at] = {
          ...state.customProtocolTemplates[at],
          name,
          notes,
          items: templateItems,
          updatedBy: currentName,
          updatedAt: new Date().toISOString()
        };
      } else {
        state.customProtocolTemplates.push({
          id: templateId,
          name,
          notes,
          source: "custom",
          createdBy: currentName,
          createdAt: new Date().toISOString(),
          items: templateItems
        });
      }
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: historyAction,
        detail: historyDetail
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
    saveProtocolTemplateDialog.close();
    if (isEdit) renderManageProtocolTemplates();
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

function openManageProtocolTemplatesDialog() {
  renderManageProtocolTemplates();
  manageProtocolTemplatesDialog.showModal();
}

function renderManageProtocolTemplates() {
  const list = document.querySelector("#manageProtocolTemplatesList");
  if (!list) return;
  if (!customProtocolTemplates.length) {
    list.innerHTML = `<p class="manage-protocol-templates-empty">Aucun protocole personnalisé enregistré pour le moment. Ouvrez une expérience "Nouveau protocole" et utilisez "Enregistrer le protocole".</p>`;
    return;
  }
  list.innerHTML = customProtocolTemplates.map(template => `
    <div class="manage-protocol-template-row">
      <div class="manage-protocol-template-info">
        <strong>${escapeHtml(template.name)}</strong>
        <span class="table-subtext">${template.items.length} item${template.items.length > 1 ? "s" : ""} · ajouté par ${escapeHtml(template.createdBy || "—")}</span>
      </div>
      <div class="manage-protocol-template-actions">
        <button class="ghost-btn compact-btn" type="button" onclick="openEditProtocolTemplateDialog('${escapeHtml(template.id)}')">Modifier</button>
        <button class="danger-btn compact-btn" type="button" onclick="requestProtocolTemplateDeletion('${escapeHtml(template.id)}')">Supprimer</button>
      </div>
    </div>
  `).join("");
}

function requestProtocolTemplateDeletion(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) return;

  openDeleteConfirmation({
    message: `Êtes-vous sûr de vouloir supprimer le protocole "${template.name}" ? Cette action est irréversible.`,
    onConfirm: () => deleteProtocolTemplate(templateId)
  });
}

async function deleteProtocolTemplate(templateId) {
  const template = customProtocolTemplates.find(entry => entry.id === templateId);
  if (!template) throw new Error("Ce protocole n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer ce protocole.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`protocol-delete-${templateId}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.customProtocolTemplates = (Array.isArray(state.customProtocolTemplates) ? state.customProtocolTemplates : []).filter(entry => entry.id !== templateId);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Protocole supprimé",
        detail: `${currentName} a supprimé le protocole "${template.name}".`
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
    renderManageProtocolTemplates();
    renderHistory();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}
