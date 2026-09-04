// Section Inventaire : liste, fiche detail, formulaire et suivi de stock.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

function renderInventory() {
  renderUsageProfileFilterOptions();
  const query = normalizeSearch(searchInput.value);
  const category = categoryFilter.value;
  const sort = inventorySortSelect?.value || "recent";

  const filtered = items
    .filter(item => {
      const referenceText = itemReferencesText(item.references);
      const haystack = normalizeSearch([
        item.name,
        ...getItemLocations(item),
        item.category,
        ...item.tags,
        referenceText
      ].join(" "));

      return (!query || haystack.includes(query)) &&
        (statusFilter === "all" || itemStatus(item) === statusFilter) &&
        usageProfileMatchesFilter(item, inventoryUsageFilterValue) &&
        (category === "all" || item.category === category);
    })
    .sort((a, b) => compareInventoryItemsWithUsage(a, b, sort, inventoryUsageFilterValue));

  document.querySelector("#resultCount").textContent =
    `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;

  const detail = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  app.classList.toggle("inventory-detail-mode", activeView === "inventory" && Boolean(detail));

  document.querySelector("#inventoryDetail").innerHTML = detail
    ? renderInventoryDetail(detail)
    : "";
  syncStockJournalAccessibility(document.querySelector("#inventoryDetail"));

  controlBar.classList.toggle("hidden", activeView !== "inventory" || Boolean(detail));
  document.querySelector("#inventoryGrid").classList.toggle("hidden", Boolean(detail));

  document.querySelector("#inventoryGrid").innerHTML = filtered.map((item) => {
    const status = itemStatus(item);
    const percent = stockLevelPercent(item);
    const advancedSummary = StockTracking.summary(item);
    const availableQuantity = StockTracking.available(item);

    return `
      <article class="item-card item-preview-card" onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'inventory' })">
        <div class="item-head">
          <div class="inventory-card-title">
            ${renderRoutineStar(item)}
            <strong>${escapeHtml(item.name)}</strong>
          </div>
          <div class="inventory-card-badges">
            <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
            ${renderUsageProfileTag(item)}
          </div>
        </div>

        <span class="category">${escapeHtml(item.category)}</span>

        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>

        <div class="stock-line">
          <span>${formatInventoryCardQuantity(availableQuantity, item.unit)}</span>
          <span>Min ${formatInventoryCardQuantity(item.minStock, item.unit)}</span>
        </div>

        ${advancedSummary ? `<small class="advanced-stock-summary">${escapeHtml(advancedSummary)}</small>` : ""}

        ${item.tags?.length ? `
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        ` : ""}

        <small class="inventory-card-location">${escapeHtml(formatLocations(item))}</small>

        <div class="card-actions inventory-card-actions">
          <div class="card-button-stack inventory-card-button-group">
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
              onclick="event.stopPropagation(); ${usesAdvancedStockManager(item) ? `openStockManager('${escapeHtml(item.id)}')` : `openStockModal('${escapeHtml(item.id)}')`}"
            >
              Mettre à jour le stock
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function normalizeUsageProfile(value) {
  return ["normal", "routine", "backup"].includes(value) ? value : "normal";
}

function getItemUsageProfile(item) {
  return normalizeUsageProfile(item?.usageProfile);
}

function isActiveInventoryItem(item) {
  const profile = getItemUsageProfile(item);
  return profile === "normal" || profile === "routine";
}

function isBackupInventoryItem(item) {
  return getItemUsageProfile(item) === "backup";
}

function getUsageProfileCounts(itemList = items) {
  const counts = {
    active: 0,
    normal: 0,
    routine: 0,
    backup: 0
  };

  (Array.isArray(itemList) ? itemList : []).forEach(item => {
    const profile = getItemUsageProfile(item);
    counts[profile] += 1;
  });
  counts.active = (Array.isArray(itemList) ? itemList : []).filter(isActiveInventoryItem).length;
  return counts;
}

function renderUsageProfileFilterOptions() {
  if (!inventoryUsageFilter) return;
  const counts = getUsageProfileCounts(items);
  const selectedValue = ["active", "routine", "backup"].includes(inventoryUsageFilterValue)
    ? inventoryUsageFilterValue
    : "active";
  inventoryUsageFilter.innerHTML = `
    <option value="active">Tous (${counts.active})</option>
    <option value="routine">Routine (${counts.routine})</option>
    <option value="backup">Back-up (${counts.backup})</option>
  `;
  inventoryUsageFilter.value = selectedValue;
  const accessibleLabels = {
    active: `Afficher : Tous, ${counts.active} items actifs`,
    routine: `Afficher : Routine, ${counts.routine} items`,
    backup: `Afficher : Back-up, ${counts.backup} items`
  };
  inventoryUsageFilter.setAttribute("aria-label", accessibleLabels[selectedValue]);
}

function usageProfileMatchesFilter(item, filterValue) {
  if (filterValue === "routine") return getItemUsageProfile(item) === "routine";
  if (filterValue === "backup") return isBackupInventoryItem(item);
  return isActiveInventoryItem(item);
}

function compareInventoryItemsWithUsage(a, b, sort, filterValue) {
  if (filterValue === "active") {
    const rank = { routine: 0, normal: 1, backup: 2 };
    const profileDifference =
      rank[getItemUsageProfile(a)] -
      rank[getItemUsageProfile(b)];
    if (profileDifference) return profileDifference;
  }
  return compareInventoryItems(a, b, sort);
}

function renderRoutineStar(item) {
  const profile = getItemUsageProfile(item);
  return profile === "routine"
    ? `<span class="routine-star" title="Item de routine prioritaire" aria-label="Item de routine prioritaire"><span aria-hidden="true">★</span></span>`
    : "";
}

function renderUsageProfileTag(item) {
  const profile = getItemUsageProfile(item);
  if (profile === "routine") return `<span class="usage-profile-tag routine">Routine</span>`;
  if (profile === "backup") return `<span class="usage-profile-tag backup">Back-up</span>`;
  return "";
}

function compareInventoryItems(a, b, sort = "recent") {
  if (sort === "oldest") {
    return getItemAddedTime(a) - getItemAddedTime(b);
  }

  if (sort === "az") {
    return String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" });
  }

  if (sort === "za") {
    return String(b.name || "").localeCompare(String(a.name || ""), "fr", { sensitivity: "base" });
  }

  return getItemAddedTime(b) - getItemAddedTime(a);
}

function formatInventoryCardQuantity(quantity, unit) {
  const displayUnit = formatInventoryDisplayUnit(quantity, unit);
  return `${escapeHtml(quantity)} ${escapeHtml(displayUnit)}`.trim();
}

function formatInventoryDisplayUnit(quantity, unit) {
  const rawUnit = String(unit || "").trim();
  if (!rawUnit) return "";

  const normalizedUnit = normalizeSearch(rawUnit);
  const singular = Number(quantity) === 1;
  const unitForms = {
    unite: ["unité", "unités"],
    unites: ["unité", "unités"],
    unit: ["unité", "unités"],
    units: ["unité", "unités"],
    piece: ["pièce", "pièces"],
    pieces: ["pièce", "pièces"],
    plaque: ["plaque", "plaques"],
    plaques: ["plaque", "plaques"],
    tube: ["tube", "tubes"],
    tubes: ["tube", "tubes"],
    boite: ["boîte", "boîtes"],
    boites: ["boîte", "boîtes"],
    flacon: ["flacon", "flacons"],
    flacons: ["flacon", "flacons"],
    seringue: ["seringue", "seringues"],
    seringues: ["seringue", "seringues"],
    syringe: ["seringue", "seringues"],
    syringes: ["seringue", "seringues"],
    sachet: ["sachet", "sachets"],
    sachets: ["sachet", "sachets"],
    kit: ["kit", "kits"],
    kits: ["kit", "kits"],
    test: ["test", "tests"],
    tests: ["test", "tests"]
  };

  const forms = unitForms[normalizedUnit];
  if (!forms) return rawUnit;
  return singular ? forms[0] : forms[1];
}

function renderInventoryDetail(item) {
  const status = itemStatus(item);
  const references = normalizeReferences(item.references);
  const locations = formatItemLocationPaths(item);

  return `
    <section class="inventory-detail-panel">
      <div class="inventory-detail-return-row">
        <button
          class="ghost-btn inventory-back-btn"
          type="button"
          onclick="returnFromItemDetail()"
          aria-label="Retour à l'inventaire"
        >
          <span aria-hidden="true">←</span>
          Retour
        </button>
      </div>

      <div class="inventory-detail-header">
        <div class="inventory-detail-title">
          <div class="inventory-detail-badges">
            <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
            ${renderUsageProfileTag(item)}
          </div>
          <div class="inventory-detail-name-row">
            ${renderRoutineStar(item)}
            <h3>${escapeHtml(item.name)}</h3>
          </div>
          <div class="inventory-detail-meta">
            <span>ID : ${escapeHtml(item.id)}</span>
            <span>${escapeHtml(locations)}</span>
            <span>${escapeHtml(item.category)}</span>
          </div>
        </div>

        <div class="detail-actions inventory-detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openModal('${escapeHtml(item.id)}')">
            Modifier la fiche
          </button>
          <button class="primary-btn compact-btn" type="button" onclick="${usesAdvancedStockManager(item) ? `openStockManager('${escapeHtml(item.id)}')` : `openStockModal('${escapeHtml(item.id)}')`}">
            Mettre à jour le stock
          </button>
        </div>
      </div>

      ${renderStockVisualCard(item)}

      ${renderAdvancedStockDetail(item)}

      <div class="inventory-detail-secondary-grid">
        ${renderInventoryReferencesPanel(references, item)}
        ${renderInventoryInfoPanel(item)}
      </div>
    </section>
  `;
}

function renderInventoryInfoPanel(item) {
  const sections = [
    item.tags?.length ? `
      <div class="inventory-info-group">
        <h4>Tags</h4>
        <div class="tags">
          ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    ` : "",
    item.protocol ? `
      <div class="inventory-info-group">
        <h4>Protocole</h4>
        <p>${escapeHtml(item.protocol)}</p>
      </div>
    ` : "",
    item.notes ? `
      <div class="inventory-info-group">
        <h4>Notes</h4>
        <p class="multiline-text">${escapeHtml(item.notes)}</p>
      </div>
    ` : ""
  ].filter(Boolean);

  if (!sections.length) return "";

  return `
    <section class="inventory-info-panel">
      <div class="inventory-panel-heading">
        <span class="inventory-panel-icon">i</span>
        <h3>Informations</h3>
      </div>
      ${sections.join("")}
    </section>
  `;
}

function renderInventoryReferencesPanel(references, item = null) {
  const primaryRows = [
    renderSupplierReferenceRow(references.primary.supplier, item),
    renderReferenceRow("Référence", references.primary.reference, { copyable: true }),
    renderReferenceLinkRow("Lien", references.primary.link),
    renderReferenceRow("Notes", references.primary.notes),
    renderReferenceRow("Prix", formatPriceEuro(references.primary.price)),
    renderReferenceRow("Prix unitaire", formatPriceEuro(references.primary.unitPrice)),
    renderReferenceRow("Délais de livraison", references.primary.leadTime)
  ].filter(Boolean);

  const secondaryBlocks = references.secondary
    .map((reference, index) => {
      const rows = [
        renderReferenceRow("Référence", reference.reference, { copyable: true }),
        renderReferenceRow("Notes", reference.notes)
      ].filter(Boolean);

      if (!rows.length) return "";

      return `
        <div class="reference-block secondary-reference-block">
          <strong>Référence secondaire ${index + 1}</strong>
          <div class="item-detail-stack">${rows.join("")}</div>
        </div>
      `;
    })
    .filter(Boolean);

  if (!primaryRows.length && !secondaryBlocks.length) {
    return `
      <section class="inventory-info-panel">
        <div class="inventory-panel-heading">
          <span class="inventory-panel-icon">↗</span>
          <h3>Références</h3>
        </div>
        <p>Aucune référence principale.</p>
      </section>
    `;
  }

  return `
    <section class="inventory-info-panel inventory-reference-panel">
      <div class="inventory-panel-heading">
        <span class="inventory-panel-icon">↗</span>
        <h3>Référence principale</h3>
      </div>
      ${
        primaryRows.length
          ? `<div class="item-detail-stack">${primaryRows.join("")}</div>`
          : `<p>Aucune référence principale.</p>`
      }
      ${secondaryBlocks.length ? `<div class="secondary-references">${secondaryBlocks.join("")}</div>` : ""}
    </section>
  `;
}

function renderSupplierReferenceRow(value, item = null) {
  if (!value || !String(value).trim()) return "";
  const contact = findSupplierContactForItem(item || { references: { primary: { supplier: value } } });
  if (!contact) return renderReferenceRow("Fournisseur", value);
  return `<div class="item-detail-row reference-detail-row"><span class="item-detail-label">Fournisseur</span><div class="item-detail-value reference-detail-value"><button class="supplier-contact-link" type="button" onclick="openSupplierContact('${escapeHtml(contact.id)}')">${escapeHtml(contact.company)} <span aria-hidden="true">↗</span></button></div></div>`;
}

function renderReferenceRow(label, value, options = {}) {
  if (!value || !String(value).trim()) return "";
  const isMultiline = /note|comment|description/i.test(String(label));

  return `
    <div class="item-detail-row reference-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value reference-detail-value${isMultiline ? " multiline-text" : ""}">
        <span>${escapeHtml(value)}</span>
        ${options.copyable ? `
          <button
            class="copy-reference-btn"
            type="button"
            data-copy-value="${escapeHtml(value)}"
            onclick="copyReferenceToClipboard(this)"
            aria-label="Copier la référence"
          >
            Copier
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

function renderReferenceLinkRow(label, value) {
  if (!value || !String(value).trim()) return "";

  return `
    <div class="item-detail-row reference-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value reference-detail-value">
        <a class="external-reference-link" href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(value)}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  `;
}

function copyReferenceToClipboard(button) {
  const value = button?.dataset?.copyValue || "";
  if (!value) return;

  const showCopied = () => {
    const previousText = button.textContent;
    button.textContent = "Copié";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = previousText;
      button.classList.remove("copied");
    }, 1400);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(showCopied).catch(() => {
      window.prompt("Copier la référence", value);
    });
    return;
  }

  window.prompt("Copier la référence", value);
  showCopied();
}

// Stock visual priority: explicit product/type override > category mapping > unit mapping > generic fallback.
const stockVisualProductRules = [
  {
    type: "syringe",
    match: ({ text }) => /\b(seringue|syringe|luer|aiguille|needle)\b/.test(text)
  },
  {
    type: "tubeRack",
    match: ({ text }) => /\b(tube|tubes|vial|vials|cryotube|eppendorf|falcon)\b/.test(text)
  },
  {
    type: "plate",
    match: ({ text }) => /\b(plaque|plate|well|puits|boite de petri|boîte de petri|petri)\b/.test(text)
  }
];

const stockVisualCategoryRules = [
  {
    type: "powder",
    match: ({ categoryText, text }) =>
      /\b(poudre|powder|solide|solid|granule|beads?|agarose)\b/.test(`${categoryText} ${text}`)
  },
  {
    type: "liquid",
    match: ({ categoryText, text }) =>
      /\b(liquide|liquid|reactif|reagent|tampon|buffer|milieu|media|solution|serum)\b/.test(`${categoryText} ${text}`)
  },
  {
    type: "unit",
    match: ({ categoryText, text }) =>
      /\b(consommable|consumable|plastique|plastic|materiel|matériel|embout|tip|gant|box|boite|boîte)\b/.test(`${categoryText} ${text}`)
  }
];

const stockVisualUnitMap = {
  ml: "liquid",
  l: "liquid",
  ul: "liquid",
  "µl": "liquid",
  g: "powder",
  mg: "powder",
  kg: "powder",
  unite: "unit",
  unites: "unit",
  unit: "unit",
  units: "unit",
  piece: "unit",
  pieces: "unit",
  "pièce": "unit",
  "pièces": "unit",
  plaque: "plate",
  plaques: "plate",
  tube: "tubeRack",
  tubes: "tubeRack",
  boite: "unit",
  boites: "unit",
  "boîte": "unit",
  "boîtes": "unit",
  flacon: "liquid",
  flacons: "liquid",
  sachet: "unit",
  sachets: "unit"
};

function getStockVisualType(item) {
  const unit = normalizeStockUnit(item?.unit);
  const categoryText = normalizeSearch(item?.category || "");
  const text = normalizeSearch([
    item?.name,
    item?.category,
    item?.unit,
    ...(Array.isArray(item?.tags) ? item.tags : [])
  ].join(" "));

  const context = { item, unit, categoryText, text };
  return stockVisualProductRules.find(rule => rule.match(context))?.type ||
    stockVisualCategoryRules.find(rule => rule.match(context))?.type ||
    stockVisualUnitMap[unit] ||
    "generic";
}

function normalizeStockUnit(unit) {
  return String(unit || "")
    .trim()
    .toLowerCase()
    .replace("μ", "µ")
    .replace(/^u(l)$/i, "ul")
    .replace(/\s+/g, "");
}

function renderStockVisualCard(item) {
  const stockStatus = getStockStatus(item);
  const { status, currentStock: quantity, minimum, healthyThreshold } = stockStatus;
  const visualType = getStockVisualType(item);
  const hasMinimum = minimum !== null;
  const visualPercent = hasMinimum
    ? Math.min(100, Math.max(0, (quantity / Math.max(quantity, healthyThreshold, 1)) * 100))
    : (quantity > 0 ? 70 : 0);
  const normalizedUnit = StockTracking.normalizeUnitLabel(item.unit);
  const unitSingular = normalizedUnit.singular;
  const currentUnit = StockTracking.plural(quantity, normalizedUnit.singular, normalizedUnit.plural);
  const minimumUnit = StockTracking.plural(minimum ?? 0, normalizedUnit.singular, normalizedUnit.plural);
  const quantityValue = escapeHtml(formatCleanNumber(quantity));
  const minimumValue = escapeHtml(formatCleanNumber(minimum));
  const health = stockHealthText(status, hasMinimum);
  const interpretation = stockInterpretationText(stockStatus, unitSingular, currentUnit);

  return `
    <div class="stock-visual-card ${hasMinimum ? status : "no-minimum"} stock-visual-${visualType}" style="--stock-fill:${visualPercent}%">
      <div class="stock-visual-figure" aria-hidden="true">
        ${renderStockVisualArt(visualType, visualPercent)}
      </div>

      <div class="stock-visual-facts">
        ${renderStockMetricRow("Stock actuel", `${quantityValue} ${escapeHtml(currentUnit)}`, "cube")}
        ${renderStockMetricRow("Minimum", hasMinimum ? `${minimumValue} ${escapeHtml(minimumUnit)}` : "Non défini", "sliders")}
        <p class="stock-interpretation ${interpretation.state}">${escapeHtml(interpretation.text)}</p>
      </div>

      <div class="stock-health-panel">
        <div class="stock-health-head">
          <span class="stock-health-icon">${hasMinimum && status === "ok" ? "✓" : hasMinimum ? "!" : "i"}</span>
          <div>
            <strong>${escapeHtml(health.title)}</strong>
            <span>${escapeHtml(health.description)}</span>
          </div>
        </div>

        ${hasMinimum ? renderStockThresholdScale(stockStatus, currentUnit) : ""}
      </div>
    </div>
  `;
}

function renderStockMetricRow(label, value, icon) {
  return `
    <div class="stock-metric-row">
      <span class="stock-metric-icon stock-metric-${icon}"></span>
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function stockHealthText(status, hasMinimum = true) {
  if (!hasMinimum) {
    return {
      title: "Seuil minimum non défini",
      description: "Définissez un minimum pour activer le suivi des alertes."
    };
  }

  if (status === "critical") {
    return {
      title: "Critique",
      description: "Le stock est au niveau minimum ou en dessous."
    };
  }

  if (status === "warning") {
    return {
      title: "Attention",
      description: "Le stock est proche du seuil minimum."
    };
  }

  return {
    title: "Stock sain",
    description: "Le stock est au-dessus du minimum."
  };
}

function stockInterpretationText(stockStatus, unitSingular, currentUnit) {
  const { currentStock, minimum, differenceFromMinimum } = stockStatus;
  if (minimum === null) {
    return {
      state: "neutral",
      text: `${formatCleanNumber(currentStock)} ${currentUnit} disponible${currentStock > 1 ? "s" : ""}`
    };
  }
  const difference = differenceFromMinimum;
  const absDifference = Math.abs(difference);
  const diffUnit = unitSingular;

  if (difference > 0) {
    return {
      state: "ok",
      text: `${formatCleanNumber(absDifference)} ${diffUnit} au-dessus du minimum`
    };
  }

  if (difference < 0) {
    return {
      state: "critical",
      text: `${formatCleanNumber(absDifference)} ${diffUnit} en dessous du minimum`
    };
  }

  return {
    state: "warning",
    text: "Stock au niveau minimum"
  };
}

function renderStockThresholdScale(stockStatus, unit) {
  const { currentStock: quantity, minimum, healthyThreshold, status } = stockStatus;
  const maxValue = Math.max(quantity, healthyThreshold * 1.25, 1);
  const currentPercent = Math.max(0, Math.min(100, (quantity / maxValue) * 100));
  const minimumPercent = Math.max(0, Math.min(100, (minimum / maxValue) * 100));
  const healthyPercent = Math.max(0, Math.min(100, (healthyThreshold / maxValue) * 100));

  return `
    <div
      class="stock-threshold-scale ${status}"
      style="--stock-current:${currentPercent}%; --stock-minimum:${minimumPercent}%; --stock-healthy:${healthyPercent}%"
      aria-label="Stock actuel ${escapeHtml(formatCleanNumber(quantity))}, minimum ${escapeHtml(formatCleanNumber(minimum))}"
    >
      <div class="stock-threshold-track">
        <span class="stock-threshold-fill"></span>
        <span class="stock-threshold-minimum"></span>
        <span class="stock-threshold-current">${escapeHtml(formatCleanNumber(quantity))}</span>
      </div>
      <div class="stock-health-scale">
        <span>0</span>
        <span>${escapeHtml(formatCleanNumber(maxValue))} ${escapeHtml(unit)}</span>
      </div>
      <div class="stock-minimum-label">Minimum : ${escapeHtml(formatCleanNumber(minimum))}</div>
      <div class="stock-minimum-label">Stock sain à partir de : ${escapeHtml(formatCleanNumber(healthyThreshold))} ${escapeHtml(unit)}</div>
    </div>
  `;
}

function formatCleanNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return String(value || "");
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(number);
}

function renderStockVisualArt(type, percent) {
  if (type === "syringe") return renderSyringeStockVisual(percent);
  if (type === "powder") return renderPowderStockVisual(percent);
  if (type === "unit") return renderUnitStockVisual(percent);
  if (type === "plate") return renderPlateStockVisual(percent);
  if (type === "tubeRack") return renderTubeRackStockVisual(percent);
  if (type === "liquid") return renderLiquidStockVisual(percent);
  return renderGenericStockVisual(percent);
}

function renderLiquidStockVisual(percent) {
  const fillHeight = Number((96 * percent / 100).toFixed(2));
  const fillY = Number((126 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 150" role="img" aria-label="Contenant liquide">
      <rect x="68" y="12" width="44" height="24" rx="8" class="stock-svg-cap" />
      <path d="M62 38h56l10 22v66c0 10-8 18-18 18H70c-10 0-18-8-18-18V60l10-22Z" class="stock-svg-shell" />
      <clipPath id="liquidClip"><path d="M62 42h56l7 18v64c0 8-7 15-15 15H70c-8 0-15-7-15-15V60l7-18Z" /></clipPath>
      <g clip-path="url(#liquidClip)">
        <rect x="54" y="${fillY}" width="72" height="${fillHeight}" class="stock-svg-fill" />
        <path d="M54 ${fillY + 8}c18-8 34 7 52-1 8-3 14-4 20-1v12H54Z" class="stock-svg-shine" />
      </g>
      <path d="M70 56h40" class="stock-svg-line" />
      <path d="M70 76h40" class="stock-svg-line" />
      <path d="M70 96h40" class="stock-svg-line" />
    </svg>
  `;
}

function renderSyringeStockVisual(percent) {
  const fillHeight = Number((64 * percent / 100).toFixed(2));
  const fillY = Number((108 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg stock-svg-syringe" viewBox="0 0 170 180" role="img" aria-label="Seringue">
      <path d="M78 18h14v18H78z" class="stock-svg-cap" />
      <path d="M74 36h22v12H74z" class="stock-svg-shell" />
      <path d="M64 48h42v82c0 10-8 18-18 18h-6c-10 0-18-8-18-18V48Z" class="stock-svg-shell" />
      <clipPath id="syringeVerticalClip"><path d="M70 53h30v75c0 7-6 13-13 13h-4c-7 0-13-6-13-13V53Z" /></clipPath>
      <g clip-path="url(#syringeVerticalClip)">
        <rect x="70" y="${fillY}" width="30" height="${fillHeight}" class="stock-svg-fill" />
        <path d="M70 ${fillY + 7}c8-5 14 4 22 0 4-2 6-2 8-1v10H70Z" class="stock-svg-shine" />
      </g>
      <path d="M73 62h24M73 74h14M73 86h24M73 98h14M73 110h24M73 122h14" class="stock-svg-line" />
      <path d="M85 148v18" class="stock-svg-line strong" />
      <path d="M58 166h54" class="stock-svg-line strong" />
      <path d="M52 130h66" class="stock-svg-line strong" />
      <ellipse cx="85" cy="170" rx="30" ry="5" class="stock-svg-shadow" />
    </svg>
  `;
}

function renderPowderStockVisual(percent) {
  const fillHeight = Number((78 * percent / 100).toFixed(2));
  const fillY = Number((122 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 150" role="img" aria-label="Pot de poudre">
      <rect x="52" y="22" width="76" height="18" rx="8" class="stock-svg-cap" />
      <path d="M58 42h64l8 18v62c0 10-8 18-18 18H68c-10 0-18-8-18-18V60l8-18Z" class="stock-svg-shell" />
      <clipPath id="powderClip"><path d="M58 46h64l5 15v59c0 8-7 15-15 15H68c-8 0-15-7-15-15V61l5-15Z" /></clipPath>
      <g clip-path="url(#powderClip)">
        <rect x="52" y="${fillY}" width="76" height="${fillHeight}" class="stock-svg-fill" />
        <circle cx="70" cy="118" r="3" class="stock-svg-dot" />
        <circle cx="88" cy="106" r="2.5" class="stock-svg-dot" />
        <circle cx="104" cy="124" r="3" class="stock-svg-dot" />
        <circle cx="116" cy="112" r="2" class="stock-svg-dot" />
      </g>
    </svg>
  `;
}

function renderUnitStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 10));
  const cells = Array.from({ length: 10 }, (_, index) => {
    const x = 44 + (index % 5) * 20;
    const y = 48 + Math.floor(index / 5) * 24;
    return `<rect x="${x}" y="${y}" width="14" height="14" rx="4" class="${index < activeCount ? "stock-svg-fill" : "stock-svg-empty"}" />`;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Boîte de consommables">
      <path d="M34 38h112v60c0 8-6 14-14 14H48c-8 0-14-6-14-14V38Z" class="stock-svg-shell" />
      <path d="M42 24h96l8 14H34l8-14Z" class="stock-svg-cap" />
      ${cells}
    </svg>
  `;
}

function renderPlateStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 12.5));
  const wells = Array.from({ length: 8 }, (_, index) => {
    const x = 54 + (index % 4) * 22;
    const y = 50 + Math.floor(index / 4) * 22;
    return `<circle cx="${x}" cy="${y}" r="6" class="${index < activeCount ? "stock-svg-fill" : "stock-svg-empty"}" />`;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Plaque laboratoire">
      <rect x="38" y="34" width="104" height="70" rx="14" class="stock-svg-shell" />
      <path d="M48 24h84" class="stock-svg-line strong" />
      <path d="M52 108h76" class="stock-svg-line" />
      ${wells}
    </svg>
  `;
}

function renderTubeRackStockVisual(percent) {
  const activeCount = Math.max(0, Math.ceil(percent / 20));
  const tubes = Array.from({ length: 5 }, (_, index) => {
    const x = 44 + index * 22;
    const cls = index < activeCount ? "stock-svg-fill" : "stock-svg-empty";
    return `
      <g>
        <path d="M${x} 34h14v50c0 8-7 14-7 14s-7-6-7-14V34Z" class="stock-svg-shell" />
        <rect x="${x + 2}" y="${72 - (30 * (index < activeCount ? 1 : 0))}" width="10" height="${index < activeCount ? 30 : 0}" class="${cls}" />
      </g>
    `;
  }).join("");

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Rack de tubes">
      ${tubes}
      <path d="M34 84h112v24H34z" class="stock-svg-cap" />
      <path d="M40 108h100" class="stock-svg-line strong" />
    </svg>
  `;
}

function renderGenericStockVisual(percent) {
  const fillHeight = Number((62 * percent / 100).toFixed(2));
  const fillY = Number((104 - fillHeight).toFixed(2));

  return `
    <svg class="stock-svg" viewBox="0 0 180 130" role="img" aria-label="Contenant générique">
      <path d="M38 42h104v58c0 10-8 18-18 18H56c-10 0-18-8-18-18V42Z" class="stock-svg-shell" />
      <path d="M48 24h84l10 18H38l10-18Z" class="stock-svg-cap" />
      <clipPath id="genericClip"><path d="M44 48h92v50c0 8-6 14-14 14H58c-8 0-14-6-14-14V48Z" /></clipPath>
      <g clip-path="url(#genericClip)">
        <rect x="44" y="${fillY}" width="92" height="${fillHeight}" class="stock-svg-fill" />
      </g>
    </svg>
  `;
}

// Fonction pour formater les prix avec le symbole euro, en évitant de le dupliquer s'il est déjà présent
function formatPriceEuro(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutEuro = raw.replace("€", "").trim();
  const normalized = withoutEuro
    .replace(/\s/g, "")
    .replace(",", ".");

  const numericOnly = /^\d+(?:\.\d+)?$/.test(normalized);
  if (!numericOnly) return raw;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(normalized));
}


function preparePlacementsForTarget(existingPlacements, targetPlacement) {
  const placements = (Array.isArray(existingPlacements) ? existingPlacements : []).map(row => ({ ...row }));
  if (!targetPlacement) return placements;
  const exact = placements.some(row => row.roomId === targetPlacement.roomId && row.locationId === targetPlacement.locationId && row.sublocationId === targetPlacement.sublocationId);
  if (exact) return placements;
  const directIndex = placements.findIndex(row => row.roomId === targetPlacement.roomId && !row.locationId && !row.sublocationId);
  if (directIndex >= 0) placements[directIndex] = { ...placements[directIndex], roomId: targetPlacement.roomId, locationId: targetPlacement.locationId, sublocationId: targetPlacement.sublocationId };
  else placements.push({ ...targetPlacement, id: targetPlacement.id || newStableId("placement") });
  return placements;
}

function openModal(id, options = {}) {
  const item = items.find(entry => entry.id === id);
  const prefill = options.prefill || {};
  const references = normalizeReferences(item?.references);
  document.querySelector("#modalTitle").textContent = item ? "Modifier item" : "Nouvel item";
  document.querySelector("#deleteItemBtn").style.display = item ? "inline-block" : "none";
  fields.itemId.value = item?.id || "";
  fields.name.value = item?.name || prefill.name || "";
  fields.category.value = item?.category || prefill.category || inventoryCategories[0];
  fields.quantity.value = item?.quantity ?? prefill.quantity ?? "";
  fields.unit.value = item?.unit || prefill.unit || "";
  fields.minStock.value = item?.minStock ?? prefill.minStock ?? "";
  setUsageProfile(item?.usageProfile || "normal");
  const prefillPlacements = prefill.placements || (prefill.roomId ? [{ id: newStableId("placement"), roomId: prefill.roomId, locationId: prefill.locationId || null, sublocationId: prefill.sublocationId || null }] : []);
  let modalPlacements = item?.placements ? item.placements.map(row=>({...row})) : prefillPlacements;
  modalPlacements = preparePlacementsForTarget(modalPlacements, options.targetPlacement || options.appendPlacement);
  renderPlacementEditor(modalPlacements);
  fields.tags.value = item?.tags?.join(", ") || prefill.tags?.join(", ") || "";
  fields.notes.value = item?.notes || prefill.notes || "";
  fields.primarySupplier.value = references.primary.supplier || "";
  fields.primarySupplierContactId.value = resolveExactSupplierContact(fields.primarySupplier.value,item?.supplierContactId)?.id || "";
  hydrateSupplierContactOptions();
  fields.primaryReference.value = references.primary.reference || "";
  fields.primaryLink.value = references.primary.link || "";
  fields.primaryReferenceNotes.value = references.primary.notes || "";
  fields.primaryPrice.value = references.primary.price || "";
  fields.primaryUnitPrice.value = references.primary.unitPrice || "";
  fields.primaryLeadTime.value = references.primary.leadTime || "";
  renderSecondaryReferences(references.secondary);
  hydrateTrackingForm(item);
  dialog.showModal();
}

function saveItem() {
  syncTrackingConfigVisibility();
  if (!validateTrackingUnitSelection()) return;
  const placements = readPlacementEditor();
  if (!validatePlacements(placements, { onSubmit: true })) return;
  if (!form.reportValidity()) return;
  syncPrimarySupplierContact();
  const existingId = fields.itemId.value.trim();

  const existingItem = existingId
    ? items.find(entry => entry.id === existingId)
    : null;
  const actionManagedStock = Boolean(existingItem);

  const item = {
    id: existingId || `web-${Date.now()}`,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: actionManagedStock ? Number(existingItem.quantity) : StockTracking.parseLocalizedNumber(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: parseStockMinimum(fields.minStock.value),
    usageProfile: normalizeUsageProfile(fields.usageProfile.value),
    placements,
    locations: Array.from(new Set(placements.map(placementDisplayName).filter(Boolean))),
    location: placementDisplayName(placements[0]) || "",
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: normalizeMultilineText(fields.notes.value),
    references: getItemReferences(),
    supplierContactId: fields.primarySupplierContactId.value || undefined,
    createdAtRaw: existingItem?.createdAtRaw || new Date().toISOString(),
    createdAt: existingItem?.createdAt || new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date())
  };
  let trackingConfig;
  try {
    trackingConfig = readTrackingForm(existingItem || item);
  } catch (error) {
    if (error.code === "MIGRATION_PENDING") return;
    trackingFields.packagingPreview.textContent = error.message || String(error);
    trackingFields.packagingPreview.classList.add("confirmation-modal-error");
    (/aliquote|préparation/i.test(error.message || "") ? trackingFields.aliquotTrackingEnabled : trackingFields.detailedPackagingEnabled).focus();
    return;
  }
  trackingFields.packagingPreview.classList.remove("confirmation-modal-error");
  item.stockTracking = trackingConfig.stockTracking;
  item.aliquotTracking = trackingConfig.aliquotTracking;
  if (trackingConfig.migrationEvent) item.quantity = StockTracking.available(item);

  const isSeedItem = seedBaseItems.some(entry => entry.id === item.id);
  const itemIndex = items.findIndex(entry => entry.id === item.id);

  if (itemIndex >= 0) {
    items[itemIndex] = {
      ...items[itemIndex],
      ...item,
      source: isSeedItem ? "seed" : (items[itemIndex].source || "web")
    };
    addHistory("Item modifié", `${currentName} a modifié ${item.name}.`);
  } else {
    items.unshift({ ...item, source: "web" });
    addHistory("Item ajouté", `${currentName} a ajouté ${item.name} dans ${item.category}.`);
  }

  if (trackingConfig.migrationEvent) stockMovements.push(trackingConfig.migrationEvent);

  if (pendingOrderInventoryLink && !existingId) {
    linkCreatedItemToOrder(pendingOrderInventoryLink.orderId, item);
    pendingOrderInventoryLink = null;
  }

  persist();
  dialog.close();
  render();
}

function renderPackagingLevelRow(level = {}, index = 0) {
  const unit = index === 0 ? (fields.unit.value.trim() || level.singular || "") : (level.singular || "");
  return `<section class="packaging-level-row" data-level-index="${index}">
    <div class="packaging-level-heading"><strong>${index === 0 ? "Contenant principal fermé" : "Contenu"}</strong><span aria-hidden="true">—</span><small>${index === 0 ? "Il s’agit du contenant que vous recevez et stockez fermé." : "Définissez ce que contient le niveau précédent."}</small></div>
    <div class="packaging-level-fields">
      <label>Unité<input data-packaging-unit ${index === 0 ? `readonly title="Synchronisée avec l’unité de l’item ci-dessus."` : ""} required placeholder="${index === 0 ? "carton" : index === 1 ? "sachet" : "tube"}" value="${escapeHtml(unit)}"></label>
      ${index ? `<label data-contains-label>Quantité contenue<input data-packaging-contains type="number" min="1" step="1" required value="${Number(level.contains || 1)}"></label>` : `<span class="packaging-empty-field" aria-hidden="true"></span>`}
      <button class="icon-btn" type="button" data-remove-packaging aria-label="Supprimer ce niveau" ${index === 0 ? "disabled" : ""}>×</button>
    </div>
  </section>`;
}

function syncPackagingLevelZeroUnit() {
  const input = trackingFields.packagingLevels?.querySelector('.packaging-level-row[data-level-index="0"] [data-packaging-unit]');
  if (!input) return;
  input.value = fields.unit.value.trim();
  updatePackagingPreview();
}

function syncPackagingUnitMismatchWarning(item, tracking) {
  const warning = document.querySelector("#packagingUnitMismatchWarning");
  if (!warning) return;
  const itemUnit = fields.unit.value.trim();
  const outer = tracking.packagingLevels[0];
  const outerKey = outer.key || StockTracking.normalizeUnitLabel(outer.singular || outer.plural || "").key;
  const expectedKey = StockTracking.normalizeUnitLabel(itemUnit || "unité").key;
  const mismatch = Boolean(item) && itemUnit && outerKey !== expectedKey;
  warning.classList.toggle("hidden", !mismatch);
  warning.textContent = mismatch
    ? `Incohérence détectée sur cet item : le « Contenant principal fermé » était enregistré en « ${outer.singular} » alors que l’unité de l’item est « ${itemUnit} ». Il a été aligné automatiquement sur « ${itemUnit} » ci-dessus — vérifiez que c’est correct puis cliquez sur Enregistrer pour corriger définitivement cet item.`
    : "";
}

function hydrateTrackingForm(item) {
  const tracking = StockTracking.normalizeTracking(item || {});
  const aliquots = StockTracking.normalizeAliquots(item || {});
  trackingFields.stockTrackingMode.value = tracking.mode;
  trackingFields.detailedPackagingEnabled.checked = tracking.mode === "containers";
  trackingFields.aliquotTrackingEnabled.checked = aliquots.enabled;
  fields.quantity.readOnly = Boolean(item);
  fields.quantity.title = fields.quantity.readOnly ? "Utilisez « Mettre à jour le stock » pour modifier cette quantité de manière tracée." : "";
  trackingFields.packagingLevels.innerHTML = tracking.packagingLevels.map(renderPackagingLevelRow).join("");
  syncTrackingConfigVisibility(); updateTrackingUnitOptions(tracking.trackingUnitKey); updatePackagingPreview();
  syncPackagingUnitMismatchWarning(item, tracking);
}

function syncTrackingOptionCheckboxes(changedOption = "") {
  const existingItem = items.find(entry => entry.id === fields.itemId.value.trim());
  const previousTracking = StockTracking.normalizeTracking(existingItem || {}), previousAliquots = StockTracking.normalizeAliquots(existingItem || {});
  let message = "";
  if (changedOption === "packaging" && !trackingFields.detailedPackagingEnabled.checked && previousTracking.mode === "containers" && (StockTracking.totalClosed(previousTracking) > 0 || previousTracking.openContainers.some(row => row.status === "open"))) {
    trackingFields.detailedPackagingEnabled.checked = true;
    message = "Le suivi détaillé ne peut pas être désactivé tant que les contenants actifs n’ont pas été consolidés proprement.";
  }
  const hasAliquotHistory = existingItem && stockMovements.some(event => event.itemId === existingItem.id && String(event.type || "").includes("aliquot"));
  if (changedOption === "aliquots" && !trackingFields.aliquotTrackingEnabled.checked && (previousAliquots.preparations.length > 0 || hasAliquotHistory)) {
    trackingFields.aliquotTrackingEnabled.checked = true;
    message = "Cette option ne peut pas être désactivée tant que des préparations, des aliquotes actives ou un historique associé existent.";
  }
  trackingFields.stockTrackingMode.value = trackingFields.detailedPackagingEnabled.checked ? "containers" : "simple";
  trackingFields.aliquotTrackingExplanation.classList.toggle("hidden", !trackingFields.aliquotTrackingEnabled.checked);
  trackingFields.aliquotTrackingExplanation.textContent = trackingFields.detailedPackagingEnabled.checked ? "Vous pourrez sélectionner le contenant utilisé pour chaque préparation." : "Les préparations utiliseront directement le stock global de l’item.";
  trackingFields.trackingOptionError.textContent = message;
  trackingFields.trackingOptionError.classList.toggle("hidden", !message);
  if (existingItem) { fields.quantity.readOnly = true; fields.quantity.title = "Utilisez « Mettre à jour le stock » pour modifier cette quantité de manière tracée."; }
  syncTrackingConfigVisibility();
}

function syncTrackingConfigVisibility() {
  trackingFields.stockTrackingMode.value = trackingFields.detailedPackagingEnabled?.checked ? "containers" : "simple";
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  trackingFields.packagingConfig?.classList.toggle("hidden", !advancedMode);
  trackingFields.packagingConfig?.querySelectorAll("input, select").forEach(control => {
    control.disabled = !advancedMode;
  });
  const hasInteriorLevel = Boolean(trackingFields.packagingLevels?.querySelectorAll(".packaging-level-row").length > 1);
  trackingFields.trackingUnitField?.classList.toggle("hidden", !advancedMode || !hasInteriorLevel);
  if (trackingFields.aliquotTrackingExplanation) {
    trackingFields.aliquotTrackingExplanation.classList.toggle("hidden", !trackingFields.aliquotTrackingEnabled?.checked);
    trackingFields.aliquotTrackingExplanation.textContent = advancedMode ? "Vous pourrez sélectionner le contenant utilisé pour chaque préparation." : "Les préparations utiliseront directement le stock global de l’item.";
  }
  syncTrackingUnitValidationState();
}

function getTrackingUnitValidationState() {
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  const rows = Array.from(trackingFields.packagingLevels?.querySelectorAll(".packaging-level-row") || []);
  const validInteriorLevels = rows.length >= 2 && rows.slice(1).every(row => {
    const unit = row.querySelector("[data-packaging-unit]")?.value.trim();
    const contains = Number(row.querySelector("[data-packaging-contains]")?.value);
    return Boolean(unit) && Number.isFinite(contains) && contains > 0;
  });
  return { advancedMode, validInteriorLevels, applicable: advancedMode && validInteriorLevels };
}

function syncTrackingUnitValidationState() {
  const select = trackingFields.trackingUnitKey;
  if (!select) return;
  const { applicable } = getTrackingUnitValidationState();
  select.disabled = !applicable;
  select.required = applicable;
  if (applicable) select.setAttribute("name", "trackingUnitKey");
  else select.removeAttribute("name");
  if (!applicable || select.value) {
    select.setCustomValidity("");
    document.querySelector("#trackingUnitError")?.classList.add("hidden");
  }
}

function validateTrackingUnitSelection() {
  const select = trackingFields.trackingUnitKey;
  const { applicable } = getTrackingUnitValidationState();
  if (!select || !applicable || select.value) return true;
  const message = "Sélectionnez l’unité utilisée pour compter le contenu des contenants ouverts.";
  select.setCustomValidity(message);
  const details = trackingFields.packagingConfig?.closest("details");
  if (details) details.open = true;
  trackingFields.trackingUnitField?.classList.remove("hidden");
  const error = document.querySelector("#trackingUnitError");
  if (error) { error.textContent = message; error.classList.remove("hidden"); }
  select.scrollIntoView({ behavior: "smooth", block: "center" });
  select.reportValidity();
  select.focus({ preventScroll: true });
  return false;
}

function getPackagingLevelsFromForm() {
  return Array.from(trackingFields.packagingLevels.querySelectorAll(".packaging-level-row")).map((row, index) => ({ id: `level-${index + 1}`, ...StockTracking.normalizeUnitLabel(row.querySelector("[data-packaging-unit]").value), contains: index ? Number(row.querySelector("[data-packaging-contains]").value) : 1 }));
}

function updatePackagingPreview() {
  const rows = Array.from(trackingFields.packagingLevels.querySelectorAll(".packaging-level-row"));
  const levels = getPackagingLevelsFromForm();
  rows.forEach((row, index) => { const level = levels[index], previous = levels[index - 1]; row.querySelector(".packaging-level-heading strong").textContent = index === 0 ? "Contenant principal fermé" : `Contenu du ${previous?.singular || "contenant"}`; const label = row.querySelector("[data-contains-label]"); if (label) label.childNodes[0].textContent = `Combien de ${level.plural} contient un ${previous?.singular || "contenant"} ?`; });
  updateTrackingUnitOptions(trackingFields.trackingUnitKey?.value);
  const complete = levels.length >= 2 && rows.every((row, index) => row.querySelector("[data-packaging-unit]").value.trim() && (!index || Number(row.querySelector("[data-packaging-contains]").value) > 0));
  if (!complete || !trackingFields.trackingUnitKey.value) { trackingFields.packagingPreview.textContent = "Complétez les informations ci-dessus pour voir un exemple."; return; }
  const preview = StockTracking.packagingPreview(levels, trackingFields.trackingUnitKey.value);
  trackingFields.packagingPreview.innerHTML = `<strong>${escapeHtml(preview.equation)}</strong><span>${escapeHtml(preview.sentence)}</span>`;
}

function updateTrackingUnitOptions(selectedKey = "") {
  const levels = getPackagingLevelsFromForm(), inner = levels.slice(1);
  const advancedMode = trackingFields.stockTrackingMode?.value === "containers";
  trackingFields.trackingUnitField.classList.toggle("hidden", !advancedMode || !inner.length);
  const current = selectedKey || trackingFields.trackingUnitKey.value;
  trackingFields.trackingUnitKey.innerHTML = `<option value="">Sélectionner une unité</option>${inner.map(level => `<option value="${escapeHtml(level.key)}">${escapeHtml(level.plural)}</option>`).join("")}`;
  if (inner.some(level => level.key === current)) trackingFields.trackingUnitKey.value = current;
  syncTrackingUnitValidationState();
}

function readTrackingForm(existingItem) {
  const previous = StockTracking.normalizeTracking(existingItem || {}), mode = trackingFields.stockTrackingMode.value;
  const previousAliquots = StockTracking.normalizeAliquots(existingItem || {}), activeContainers = previous.openContainers.some(row => row.status === "open") || StockTracking.totalClosed(previous) > 0;
  if (previous.mode === "containers" && mode === "simple" && activeContainers) throw new Error("Le suivi avancé ne peut pas être désactivé tant que des contenants sont actifs.");
  if (!trackingFields.aliquotTrackingEnabled.checked && (previousAliquots.preparations.length > 0 || stockMovements.some(event => event.itemId === existingItem?.id && String(event.type || "").includes("aliquot")))) throw new Error("Cette option ne peut pas être désactivée tant que des préparations ou un historique d’aliquotes existent.");
  const activeEntities = activeContainers || previousAliquots.preparations.some(row => row.status === "active");
  const levels = getPackagingLevelsFromForm();
  if (mode === "containers" && levels.length < 2) throw new Error("Ajoutez au moins un niveau de contenu pour suivre un contenant ouvert.");
  if (!levels.length || levels.some(level => !level.singular || !level.plural || level.contains <= 0)) throw new Error("La configuration du conditionnement est incomplète.");
  const selectedTrackingUnit = levels.find(level => level.key === trackingFields.trackingUnitKey.value);
  if (mode === "containers" && !selectedTrackingUnit) throw new Error("Sélectionnez l’unité de comptage des contenants ouverts.");
  const structuralChanged = JSON.stringify(previous.packagingLevels.map(({ singular, plural, contains }) => ({ singular, plural, contains }))) !== JSON.stringify(levels.map(({ singular, plural, contains }) => ({ singular, plural, contains })));
  if (previous.mode === "containers" && structuralChanged && activeEntities) throw new Error("Le conditionnement ne peut pas être modifié tant que des sous-entités sont actives.");
  const now = new Date().toISOString();
  let closedByLocation = previous.closedByLocation, closedContainers = previous.closedContainers, openContainers = previous.openContainers;
  if (previous.mode === "simple" && mode === "containers" && !closedByLocation.length && !openContainers.length) {
    const quantity = existingItem?.quantity || StockTracking.parseLocalizedNumber(fields.quantity.value) || 0;
    if (!Number.isInteger(quantity)) {
      const migration = pendingStockMigration?.confirmed && pendingStockMigration.itemId === existingItem.id ? pendingStockMigration : null;
      if (!migration) {
        openStockMigrationAssistant(existingItem, levels);
        const pendingError = new Error("Migration en attente");
        pendingError.code = "MIGRATION_PENDING";
        throw pendingError;
      }
      closedByLocation = migration.closedByLocation;
      closedContainers = null;
      openContainers = migration.openContainers;
      const migrationEvent = createStockMigrationEvent(existingItem, migration);
      pendingStockMigration = null;
      return { stockTracking: { version: 1, mode, traceabilityMode: "detailed", packagingLevels: levels, trackingUnitKey: selectedTrackingUnit.key, trackingUnit: selectedTrackingUnit.plural, quantityStep: 1, precision: selectedTrackingUnit.kind === "continuous" ? 6 : 0, closedByLocation, closedContainers, openContainers }, aliquotTracking: { ...StockTracking.normalizeAliquots(existingItem || {}), enabled: trackingFields.aliquotTrackingEnabled.checked }, migrationEvent };
    }
    const locations = getSelectedLocations();
    if (locations.length !== 1 && quantity > 0) throw new Error("Pour la migration initiale, sélectionnez une seule localisation. Vous pourrez ensuite déplacer les contenants de façon tracée.");
    closedByLocation = quantity ? [{ location: locations[0], quantity, updatedAt: now, updatedBy: currentName }] : [];
    closedContainers = null;
  }
  return { stockTracking: { version: 1, mode, traceabilityMode: "detailed", packagingLevels: levels, trackingUnitKey: selectedTrackingUnit?.key || previous.trackingUnitKey, trackingUnit: selectedTrackingUnit?.plural || previous.trackingUnit, quantityStep: 1, precision: selectedTrackingUnit?.kind === "continuous" ? 6 : 0, closedByLocation, closedContainers, openContainers }, aliquotTracking: { ...StockTracking.normalizeAliquots(existingItem || {}), enabled: trackingFields.aliquotTrackingEnabled.checked } };
}

function openStockMigrationAssistant(item, levels) {
  const oldQuantity = Number(item.quantity || 0);
  const trackingUnitKey = trackingFields.trackingUnitKey.value;
  const draftTracking = StockTracking.normalizeTracking({ stockTracking: { mode: "containers", packagingLevels: levels, trackingUnitKey } });
  pendingStockMigration = { itemId: item.id, oldQuantity, levels, trackingUnitKey, draftTracking, trackingUnit: StockTracking.trackingLevel(draftTracking), trackingCapacity: StockTracking.trackingCapacity(draftTracking), baseFactor: StockTracking.trackingFactor(draftTracking), baseCapacity: StockTracking.capacity(draftTracking), confirmed: false };
  stockMigrationForm.reset();
  const outer = levels[0], feminine = isLikelyFeminineUnit(outer.singular), closedAdjective = feminine ? "fermées" : "fermés", openAdjective = feminine ? "ouvertes" : "ouverts";
  document.querySelector("#stockMigrationItemName").textContent = item.name;
  document.querySelector("#migrationClosedTitle").textContent = `${capitalizeFrenchLabel(outer.plural)} ${closedAdjective}`;
  document.querySelector("#migrationClosedCountLabel").textContent = `Nombre de ${outer.plural} ${closedAdjective}`;
  document.querySelector("#migrationOpenTitle").textContent = `${capitalizeFrenchLabel(outer.plural)} ${openAdjective}`;
  document.querySelector("#migrationOpenCountLabel").textContent = `Nombre de ${outer.plural} ${openAdjective}`;
  document.querySelector("#stockMigrationOldValue").textContent = `${StockTracking.format(oldQuantity)} ${levels[0].plural}`;
  document.querySelector("#migrationClosedCount").value = Math.floor(oldQuantity);
  document.querySelector("#migrationOpenCount").value = oldQuantity > Math.floor(oldQuantity) ? 1 : 0;
  document.querySelector("#migrationReason").value = "Correction après comptage";
  document.querySelector("#migrationOtherReason").value = "";
  syncMigrationReasonFields();
  const locationOptions = inventoryLocations.map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("");
  document.querySelector("#migrationClosedLocation").innerHTML = locationOptions;
  document.querySelector("#migrationClosedLocation").value = getSelectedLocations()[0] || item.location || inventoryLocations[0];
  renderMigrationOpenRows();
  updateStockMigrationComparison();
  stockMigrationDialog.showModal();
}

function renderMigrationOpenRows() {
  if (!pendingStockMigration) return;
  const list = document.querySelector("#migrationOpenContainers");
  const previous = Array.from(list.querySelectorAll(".migration-open-row")).map(row => ({ remaining: row.querySelector("[data-migration-remaining]")?.value || "", location: row.querySelector("[data-migration-location]")?.value || "" }));
  const count = Math.min(50, Math.max(0, Math.trunc(Number(document.querySelector("#migrationOpenCount").value) || 0)));
  const capacity = pendingStockMigration.trackingCapacity, unit = pendingStockMigration.trackingUnit, outer = pendingStockMigration.levels[0];
  const theoretical = count === 1 ? (pendingStockMigration.oldQuantity - Math.floor(pendingStockMigration.oldQuantity)) * capacity : NaN;
  const defaultRemaining = Number.isFinite(theoretical) && (unit.kind === "continuous" || Number.isInteger(theoretical)) ? StockTracking.format(theoretical, 6).replace(/\s/g, "").replace(",", ".") : "";
  list.innerHTML = Array.from({ length: count }, (_, index) => `<div class="migration-open-row"><strong>${escapeHtml(capitalizeFrenchLabel(outer.singular))} nº${index + 1}</strong><div class="migration-open-fields"><label>Contenu restant — ${escapeHtml(unit.plural)}<input data-migration-remaining type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" data-quantity-step="1" required value="${escapeHtml(previous[index]?.remaining || (index === 0 ? defaultRemaining : ""))}"><small data-migration-remaining-help></small></label><label>Localisation<select data-migration-location required>${inventoryLocations.map(location => `<option value="${escapeHtml(location)}" ${location === (previous[index]?.location || getSelectedLocations()[0]) ? "selected" : ""}>${escapeHtml(location)}</option>`).join("")}</select></label></div></div>`).join("");
  updateStockMigrationComparison();
}

function capitalizeFrenchLabel(value) {
  const label = String(value || "");
  return label ? `${label.charAt(0).toLocaleUpperCase("fr-FR")}${label.slice(1)}` : label;
}

function isLikelyFeminineUnit(value) {
  return /(ille|[îi]te|ote|que|ité|oule|otte|ette|ance|ence|tion|souris)$/i.test(String(value || ""));
}

function getStockMigrationDraft() {
  if (!pendingStockMigration) return null;
  const capacity = pendingStockMigration.trackingCapacity;
  const closedCount = Math.trunc(Number(document.querySelector("#migrationClosedCount").value) || 0);
  const closedLocation = document.querySelector("#migrationClosedLocation").value;
  const opened = Array.from(document.querySelectorAll("#migrationOpenContainers .migration-open-row")).map((row, index) => ({ index, remaining: StockTracking.parseLocalizedNumber(row.querySelector("[data-migration-remaining]").value), location: row.querySelector("[data-migration-location]").value }));
  const comparison = StockTracking.migrationComparison(pendingStockMigration.oldQuantity, closedCount, opened.map(row => row.remaining), pendingStockMigration.draftTracking);
  return { capacity, closedCount, closedLocation, opened, newEquivalent: comparison.newEquivalent, difference: comparison.difference, differenceTrackingUnits: comparison.differenceTrackingUnits };
}

function updateStockMigrationComparison() {
  if (!pendingStockMigration) return;
  const draft = getStockMigrationDraft();
  const presentation = StockTracking.migrationPresentation(pendingStockMigration.oldQuantity, draft.closedCount, draft.opened.map(row => row.remaining), pendingStockMigration.draftTracking);
  document.querySelectorAll("[data-migration-remaining-help]").forEach((help, index) => { help.textContent = presentation.helpTexts[index] || ""; });
  document.querySelector("#migrationComparisonOld").textContent = presentation.oldText;
  document.querySelector("#migrationPhysicalSummary").textContent = presentation.physicalSummary;
  document.querySelector("#migrationComparisonNew").textContent = presentation.equivalentText;
  document.querySelector("#migrationComparisonDifference").textContent = presentation.correctionText;
  document.querySelector("#migrationComparisonSecondary").textContent = presentation.secondaryText;
  const hasDifference = presentation.complete && Math.abs(presentation.difference) > 1e-8;
  document.querySelector("#migrationReasonField").classList.toggle("hidden", !hasDifference);
  syncMigrationReasonFields();
}

function syncMigrationReasonFields() {
  const reason = document.querySelector("#migrationReason")?.value || "";
  const visible = !document.querySelector("#migrationReasonField")?.classList.contains("hidden") && reason === "Autre";
  document.querySelector("#migrationOtherReasonField")?.classList.toggle("hidden", !visible);
  if (document.querySelector("#migrationOtherReason")) document.querySelector("#migrationOtherReason").required = visible;
}

function confirmStockMigration(event) {
  event.preventDefault();
  const errorBox = document.querySelector("#stockMigrationError"); errorBox.classList.add("hidden");
  if (!stockMigrationForm.reportValidity() || !pendingStockMigration) return;
  try {
    const draft = getStockMigrationDraft(), unit = pendingStockMigration.trackingUnit;
    if (!Number.isInteger(draft.closedCount) || draft.closedCount < 0) throw new Error("Le nombre de contenants fermés doit être un entier positif.");
    draft.opened.forEach(row => { StockTracking.validateUnitQuantity(row.remaining, unit); if (row.remaining > draft.capacity) throw new Error(`Le contenu du contenant ouvert nº${row.index + 1} doit être compris entre 0 et ${draft.capacity} ${unit.plural}.`); });
    const selectedReason = document.querySelector("#migrationReason").value;
    const otherReason = normalizeMultilineText(document.querySelector("#migrationOtherReason").value);
    const reason = Math.abs(draft.difference) <= 1e-8 ? "" : selectedReason === "Autre" ? otherReason : selectedReason;
    if (Math.abs(draft.difference) > 1e-8 && !reason) throw new Error("Précisez la raison de la correction.");
    const now = new Date().toISOString(), actor = { userId: currentName.toLowerCase().replace(/\W+/g, "-"), userName: currentName, userEmoji: userIcons[currentName] || "", userInitials: userIcons[currentName] ? "" : getHistoryUserInitials(currentName) };
    pendingStockMigration = { ...pendingStockMigration, confirmed: true, newEquivalent: draft.newEquivalent, difference: draft.difference, differenceTrackingUnits: draft.differenceTrackingUnits, reason, closedByLocation: draft.closedCount ? [{ location: draft.closedLocation, quantity: draft.closedCount, updatedAt: now, updatedBy: actor.userId }] : [], openContainers: draft.opened.map((row, index) => ({ id: StockTracking.id("container"), label: `${pendingStockMigration.levels[0].singular} ouvert nº${index + 1}`, location: row.location, remaining: StockTracking.round ? StockTracking.round(row.remaining * pendingStockMigration.baseFactor) : Number((row.remaining * pendingStockMigration.baseFactor).toFixed(6)), capacity: pendingStockMigration.baseCapacity, status: "open", openedAt: now, openedBy: actor, updatedAt: now, updatedBy: actor.userId, version: 1 })) };
    stockMigrationDialog.close(); saveItem();
  } catch (error) { errorBox.textContent = error.message || String(error); errorBox.classList.remove("hidden"); }
}

function createStockMigrationEvent(item, migration) {
  const now = new Date().toISOString(), emoji = userIcons[currentName] || "";
  return { id: StockTracking.id("movement"), operationId: StockTracking.id("migration"), itemId: item.id, timestamp: now, userId: currentName.toLowerCase().replace(/\W+/g, "-"), userName: currentName, userEmoji: emoji, userInitials: emoji ? "" : getHistoryUserInitials(currentName), type: Math.abs(migration.difference) > 1e-8 ? "corrected" : "configuration_changed", entityType: "item", entityId: item.id, before: { mode: "simple", quantity: migration.oldQuantity }, after: { mode: "containers", equivalentQuantity: migration.newEquivalent, closedByLocation: migration.closedByLocation, openContainers: migration.openContainers.map(row => ({ id: row.id, location: row.location, remaining: row.remaining })) }, quantity: Math.abs(migration.difference) > 1e-8 ? migration.differenceTrackingUnits : 0, unit: Math.abs(migration.difference) > 1e-8 ? migration.trackingUnit.plural : migration.levels[0].plural, fromLocation: "", toLocation: "", comment: "Migration validée du suivi simple vers le suivi par contenants.", correctionReason: migration.reason || "" };
}

function closeStockMigration() { pendingStockMigration = null; stockMigrationDialog?.close(); }

function toggleUsageProfile(profile) {
  const normalized = normalizeUsageProfile(profile);
  const current = normalizeUsageProfile(fields.usageProfile.value);
  setUsageProfile(current === normalized ? "normal" : normalized);
}

function setUsageProfile(profile) {
  const normalized = normalizeUsageProfile(profile);
  fields.usageProfile.value = normalized;
  [
    ["#usageProfileRoutine", "routine"],
    ["#usageProfileBackup", "backup"]
  ].forEach(([selector, value]) => {
    const button = document.querySelector(selector);
    const isActive = normalized === value;
    button?.setAttribute("aria-pressed", String(isActive));
    button?.classList.toggle("is-selected", isActive);
  });
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
  stockFields.stockUnit.readOnly = true;
  document.querySelector("#stockUpdateError")?.classList.add("hidden");
  syncSimpleStockActionFields();
  stockDialog.showModal();
}

function syncSimpleStockActionFields() {
  const action=stockFields.stockAction?.value,label=document.querySelector("#stockAmountLabel");
  if(label)label.textContent=action==="recounted"?"Stock physique compté":action==="received"?"Quantité reçue":"Quantité utilisée";
  if(stockFields.stockTitle)stockFields.stockTitle.placeholder=action==="recounted"?"Ex. inventaire mensuel, comptage physique...":action==="received"?"Ex. réception fournisseur...":"Ex. expérience pilote...";
}

function renderAdvancedStockDetail(item) {
  const tracking = StockTracking.normalizeTracking(item), aliquots = StockTracking.normalizeAliquots(item);
  const movements = stockMovements.filter(row => row?.itemId === item.id).slice().sort((a,b) => stockMovementTime(b) - stockMovementTime(a)).slice(0,10);
  const showDistribution = tracking.mode === "containers", showPreparations = aliquots.enabled, showJournal = movements.length > 0;
  if (!showDistribution && !showPreparations && !showJournal) return "";
  const outerUnit = tracking.packagingLevels[0], closedCount = tracking.closedByLocation.reduce((sum, row) => sum + row.quantity, 0);
  const closed = tracking.closedByLocation.map(row => `<article class="stock-distribution-card stock-distribution-card--closed"><div class="stock-distribution-card-head"><div><strong class="stock-distribution-primary">${row.quantity} ${escapeHtml(StockTracking.plural(row.quantity, outerUnit.singular, outerUnit.plural))} fermé${row.quantity > 1 ? "s" : ""}</strong><span class="stock-distribution-location"><span aria-hidden="true">⌖</span>${escapeHtml(row.location || "—")}</span></div><span class="stock-distribution-badge stock-distribution-badge--closed">Fermé</span></div></article>`).join("");
  const openUnit = StockTracking.trackingLevel(tracking);
  const openContainers = tracking.openContainers.filter(row => row.status === "open");
  const opened = openContainers.map(row => { const remaining = StockTracking.fromBaseQuantity(row.remaining, tracking), capacity = StockTracking.fromBaseQuantity(row.capacity, tracking), title = formatOpenContainerDisplayTitle(row.label, outerUnit.singular), identity = getOpenedContainerIdentity(row.openedBy), openedDate = formatDateTimeFrench(row.openedAt).replace(" · ", " à "); return `<article class="stock-distribution-card stock-distribution-card--open" id="stock-${escapeHtml(row.id)}"><div class="stock-distribution-open-head"><div class="stock-distribution-title-group"><strong>${escapeHtml(title)}</strong><span class="stock-distribution-badge stock-distribution-badge--open">Ouvert</span></div><span class="stock-distribution-location"><span aria-hidden="true">⌖</span>${escapeHtml(row.location || "—")}</span></div><div class="stock-distribution-quantity-row"><strong>${StockTracking.format(remaining)} ${escapeHtml(StockTracking.plural(remaining, openUnit.singular, openUnit.plural))} restants</strong><span>${StockTracking.format(remaining)} sur ${StockTracking.format(capacity)}</span></div><progress max="${capacity}" value="${remaining}"></progress><div class="stock-distribution-meta"><span>Ouvert par</span><span class="history-user-avatar ${identity.type}" aria-hidden="true">${escapeHtml(identity.value)}</span><strong>${escapeHtml(identity.name)}</strong><span aria-hidden="true">·</span><time>${escapeHtml(openedDate)}</time></div></article>`; }).join("");
  const preparations = activePreparationViews(item).map(view => renderPreparationStockCard(item, view.preparation, view.label)).join("");
  const distributionModule = showDistribution ? `<details open><summary>Répartition du stock</summary><div class="advanced-stock-block stock-distribution"><section class="stock-distribution-section"><div class="stock-distribution-section-title"><strong>Stock fermé</strong><span>${closedCount} ${escapeHtml(StockTracking.plural(closedCount, outerUnit.singular, outerUnit.plural))}</span></div><div class="stock-distribution-list">${closed || "<p class=\"stock-distribution-empty\">Aucun contenant fermé.</p>"}</div></section><section class="stock-distribution-section"><div class="stock-distribution-section-title"><strong>Stock ouvert</strong><span>${openContainers.length} ${escapeHtml(StockTracking.plural(openContainers.length, outerUnit.singular, outerUnit.plural))}</span></div><div class="stock-distribution-list">${opened || "<p class=\"stock-distribution-empty\">Aucun contenant ouvert.</p>"}</div></section></div></details>` : "";
  const preparationsModule = showPreparations ? `<details open><summary>Préparations et aliquotes</summary><div class="advanced-stock-block">${preparations || `<div class="stock-distribution-empty"><p>Aucune préparation active.</p><button class="ghost-btn compact-btn" type="button" onclick="openStockManager('${escapeHtml(item.id)}',{action:'aliquots_prepared'})">Préparer des aliquotes</button></div>`}</div></details>` : "";
  const journalOpen = stockJournalOpenByItem.get(item.id) === true;
  const journalModule = showJournal ? `<details class="stock-movement-journal" data-stock-journal-item="${escapeHtml(item.id)}"${journalOpen ? " open" : ""} ontoggle="handleStockJournalToggle(event)"><summary aria-expanded="${journalOpen}"><span class="stock-journal-indicator" aria-hidden="true">${journalOpen ? "▼" : "▶"}</span><span>Journal des mouvements</span></summary><div class="advanced-stock-block movement-list">${movements.map(renderStockMovementSafely).join("")}</div></details>` : "";
  const stockStatus = getStockStatus(item);
  const equivalentLevels = StockTracking.equivalentLevels(item, stockStatus.currentStock);
  const equivalentText = equivalentLevels.map(level => `<span class="advanced-stock-equivalent-value">${StockTracking.format(level.value)}&nbsp;${escapeHtml(StockTracking.plural(level.value, level.singular, level.plural))}</span>`).join('<span class="advanced-stock-kpi-separator" aria-hidden="true">·</span>');
  const overview = showDistribution ? `<div class="advanced-stock-kpis"><strong class="advanced-stock-physical-summary">${escapeHtml(StockTracking.summary(item))}</strong><span class="advanced-stock-equivalent-summary"><span>Équivalence :</span>${equivalentText ? `<span class="advanced-stock-equivalent-list">${equivalentText}</span><span class="advanced-stock-kpi-separator" aria-hidden="true">·</span>` : ""}<span>${escapeHtml(stockSummaryStatusLabel(stockStatus))}</span></span></div>` : "";
  return `<section class="advanced-stock-overview">${overview}${distributionModule}${preparationsModule}${journalModule}</section>`;
}

function handleStockJournalToggle(event) {
  const journal = event.currentTarget;
  if (!journal?.matches?.("details.stock-movement-journal")) return;
  stockJournalOpenByItem.set(journal.dataset.stockJournalItem, journal.open);
  const summary = journal.querySelector(":scope > summary");
  summary?.setAttribute("aria-expanded", String(journal.open));
  const indicator = summary?.querySelector(".stock-journal-indicator");
  if (indicator) indicator.textContent = journal.open ? "▼" : "▶";
}

function syncStockJournalAccessibility(root = document) {
  root?.querySelectorAll?.("details.stock-movement-journal").forEach(journal => {
    const summary = journal.querySelector(":scope > summary");
    summary?.setAttribute("aria-expanded", String(journal.open));
  });
}

function formatOpenContainerDisplayTitle(label, fallbackUnit) {
  const raw = String(label || "").trim().replace(/\s+ouvert(?:e)?(?=\s+n[º°o])/i, "");
  const safe = raw || `${fallbackUnit || "Contenant"} nº—`;
  return `${safe.charAt(0).toLocaleUpperCase("fr-FR")}${safe.slice(1)}`;
}

function getOpenedContainerIdentity(openedBy) {
  const name = String(openedBy?.userName || openedBy?.name || "—");
  if (openedBy?.userEmoji || openedBy?.emoji) return { name, type: "emoji", value: openedBy.userEmoji || openedBy.emoji };
  if (openedBy?.userInitials || openedBy?.initials) return { name, type: "", value: openedBy.userInitials || openedBy.initials };
  const avatar = getHistoryUserAvatar(name);
  return { name, type: avatar.type, value: avatar.value };
}

function activePreparationViews(item){const preparations=StockTracking.normalizeAliquots(item||{}).preparations,labels=StockTracking.activePreparationLabels(item||{});return labels.map(view=>({preparation:preparations.find(row=>row.id===view.id),index:view.index,label:view.label}));}
function activePreparationLabel(item,id){return activePreparationViews(item).find(view=>view.preparation.id===id)?.label||"Préparation inactive";}
function renderPreparationStockCard(item,prep,displayLabel=activePreparationLabel(item,prep.id)){const unopened=StockTracking.remainingAliquots(prep),opened=(prep.openAliquots||[]).filter(row=>row.status==="open"&&row.remainingVolume>0),available=unopened+opened.length,identity=getOpenedContainerIdentity(prep.preparedBy),preparedDate=formatDateTimeFrench(prep.preparedAt).replace(" · "," à "),locations=(prep.locations||[]).map(row=>row.location).filter(Boolean);return `<article class="tracked-entity-card preparation-stock-card preparation-stock-card--summary" data-preparation-id="${escapeHtml(prep.id)}"><header><strong>${escapeHtml(displayLabel)}</strong></header><dl class="preparation-key-metrics"><div><dt>Disponibles</dt><dd>${available} aliquote${available>1?"s":""}</dd></div><div><dt>Volume / aliquote</dt><dd>${prep.volume?`${StockTracking.format(prep.volume)} ${escapeHtml(prep.volumeUnit||"")}`:"Non défini"}</dd></div><div><dt>Concentration</dt><dd>${prep.concentration?`${StockTracking.format(prep.concentration)} ${escapeHtml(prep.concentrationUnit||"")}`:"Non définie"}</dd></div><div><dt>Localisation</dt><dd>${escapeHtml(locations.join(" · ")||"—")}</dd></div></dl><p class="preparation-note"><strong>Notes :</strong> ${escapeHtml(prep.note||"—")}</p><div class="preparation-secondary"><span>Préparée par ${escapeHtml(identity.value)} ${escapeHtml(identity.name)} · ${escapeHtml(preparedDate)}</span></div></article>`;}

function getStockMovementDate(entry) {
  return entry?.timestamp ?? entry?.createdAt ?? entry?.date ?? null;
}

function stockMovementTime(entry) {
  const value = getStockMovementDate(entry);
  const date = value instanceof Date ? value : typeof value === "number" ? new Date(value) : parseHistoryDate(value);
  const time = date?.getTime();
  return Number.isFinite(time) ? time : 0;
}

function renderStockMovementSafely(entry) {
  try {
    return renderStockMovement(entry && typeof entry === "object" ? entry : {});
  } catch (error) {
    console.warn("Mouvement de stock malformé ignoré dans le rendu.", error);
    return `<article class="movement-entry"><span class="history-user-avatar">?</span><div><strong>Mouvement de stock</strong><small>Date inconnue</small><p>Détails indisponibles.</p></div></article>`;
  }
}

const STOCK_MOVEMENT_TYPE_LABELS = { received:"Réception", order_received:"Réception de commande", container_opened:"Ouverture", consumed:"Utilisation", recounted:"Mise à jour du stock", moved:"Déplacement", container_finished:"Contenant terminé", aliquots_prepared:"Préparation", aliquots_consumed:"Aliquotes utilisées", aliquots_moved:"Aliquotes déplacées", aliquot_opened:"Aliquote ouverte", open_aliquot_consumed:"Aliquote ouverte utilisée", open_aliquot_moved:"Aliquote ouverte déplacée", open_aliquot_discarded:"Reliquat jeté", preparation_recounted:"Mise à jour du stock", corrected:"Mise à jour du stock", configuration_changed:"Configuration", automatic_repair:"Régularisation automatique" };
function stockMovementTypeLabel(type) { return STOCK_MOVEMENT_TYPE_LABELS[type] || type || "Mouvement de stock"; }

function renderStockMovement(entry = {}) {
  const formattedDate = formatDateTimeFrench(getStockMovementDate(entry));
  const [date, time] = formattedDate.includes(" · ") ? formattedDate.split(" · ") : [formattedDate, ""];
  const reason = String(entry.comment || "").trim();
  const deleteBtn = entry.id ? `<button class="movement-entry-delete" type="button" title="Supprimer cette entrée" aria-label="Supprimer cette entrée du journal" onclick="requestStockMovementDeletion('${escapeHtml(entry.id)}', this)">−</button>` : "";
  return `<article class="movement-entry"><span class="history-user-avatar ${entry.userEmoji ? "emoji" : ""}" aria-hidden="true">${escapeHtml(entry.userEmoji || entry.userInitials || "?")}</span><div class="movement-entry-content"><div class="movement-heading"><strong>${escapeHtml(stockMovementTypeLabel(entry.type))}</strong><span class="movement-meta">${escapeHtml(entry.userName || "Utilisateur")}</span><time class="movement-meta">${escapeHtml(date)}</time>${time ? `<time class="movement-meta">${escapeHtml(time)}</time>` : ""}</div><div class="movement-detail"><span class="movement-change multiline-text">${formatStockMovementDescription({...entry, comment:""})}</span>${reason ? `<span class="movement-reason multiline-text"><strong>Motif :</strong> ${escapeHtml(reason)}</span>` : `<span class="movement-reason movement-reason--missing">Motif non renseigné</span>`}</div></div>${deleteBtn}</article>`;
}

function requestStockMovementDeletion(movementId, trigger) {
  const movement = stockMovements.find(row => row?.id === movementId);
  if (!movement) return;
  openDeleteConfirmation({
    title: "Supprimer cette entrée du journal ?",
    message: `« ${stockMovementTypeLabel(movement.type)} » du ${formatDateTimeFrench(getStockMovementDate(movement))} sera définitivement retirée du journal des mouvements. Le stock actuel de l’item ne sera pas modifié.`,
    confirmText: "Supprimer",
    trigger,
    onConfirm: async () => { await deleteStockMovement(movementId); render(); }
  });
}

async function deleteStockMovement(movementId) {
  const storage=window.ExadexGithubStorage, config=storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer un mouvement de stock.");
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving=true; renderAlerts();
  try {
    const result=await storage.mutateSharedData(StockTracking.id("operation"), latest => {
      const state=createSharedState(latest,{includeBootstrap:false});
      state.stockMovements=(Array.isArray(state.stockMovements)?state.stockMovements:[]).filter(row=>row?.id!==movementId);
      return state;
    });
    sharedDataSha=result.sha; sharedDataMode="github-write"; sharedDataHasUnsavedChanges=false; sharedDataRemoteReady=true; sharedDataLastError=""; applySharedState(result.data); initializeSharedSaveCoordinator(result.data,result.sha);
  } finally { sharedDataIsSaving=false; renderAlerts(); }
}

function formatStockMovementDescription(entry) {
  if(entry.type==="automatic_repair"){const status={open:"Ouvert",closed:"Fermé",finished:"Terminé"};return `${escapeHtml(formatStockMovementContainerLabel(entry.containerLabel||entry.containerId||"Contenant"))} : statut ${status[entry.containerStatusBefore]||escapeHtml(entry.containerStatusBefore)} → Terminé · Quantité déjà enregistrée : 0 ${escapeHtml(entry.unit||"")}`;}
  if(entry.type==="received"&&entry.entityType==="container"){const status=entry.containerStatusAfter==="open"?"ouvert":"fermé",capacity=entry.afterCapacity??entry.after?.capacity;return `Ajout du contenant ${status} ${escapeHtml(entry.containerLabel||entry.containerId)} : ${StockTracking.format(entry.afterQuantity??entry.quantity)} ${escapeHtml(entry.unitAfter||entry.unit||"")} disponibles${capacity!==null&&capacity!==undefined?` sur une capacité de ${StockTracking.format(capacity)} ${escapeHtml(entry.unitAfter||entry.unit||"")}`:""}${entry.toLocation?` dans ${escapeHtml(entry.toLocation)}`:""}.`;}
  if(entry.type==="recounted"&&entry.entityType==="item"){const before=entry.beforeQuantity??entry.before??0,after=entry.afterQuantity??entry.after??0,difference=entry.difference??after-before;return `Stock précédent : ${StockTracking.format(before)} ${escapeHtml(entry.unit||"")} · Stock compté : ${StockTracking.format(after)} ${escapeHtml(entry.unit||"")} · Écart : ${difference>0?"+":""}${StockTracking.format(difference)} ${escapeHtml(entry.unit||"")}.${entry.comment?` Note : ${escapeHtml(entry.comment)}`:""}`;}
  if (Array.isArray(entry.containerTransitions) && entry.containerTransitions.length) {
    return entry.containerTransitions.map(transition => {
      const label=escapeHtml(transition.containerLabel || transition.containerId || "Contenant");
      if (transition.automaticOpen) return `${label} ouvert automatiquement avec ${StockTracking.format(transition.after)} ${escapeHtml(transition.unit || "")} disponibles${transition.location?` à ${escapeHtml(transition.location)}`:""}.`;
      if (transition.automaticFinish) return `${label} terminé automatiquement après utilisation : ${StockTracking.format(transition.before)} → 0 ${escapeHtml(transition.unit || "")} (${StockTracking.format(transition.difference)}).`;
      return `${label} : ${StockTracking.format(transition.before)} → ${StockTracking.format(transition.after)} ${escapeHtml(transition.unit || "")} (${transition.difference>0?"+":""}${StockTracking.format(transition.difference)}).`;
    }).join(" ");
  }
  if (entry.type === "consumed" && entry.entityType === "container") {
    const before=entry.beforeQuantity ?? entry.before?.remaining ?? entry.before,after=entry.afterQuantity ?? entry.after?.remaining ?? entry.after;
    const status=entry.containerStatusBefore&&entry.containerStatusAfter&&entry.containerStatusBefore!==entry.containerStatusAfter?` · Statut : ${entry.containerStatusBefore==="open"?"Ouvert":"Fermé"} → Terminé`:"";
    return `${escapeHtml(formatStockMovementContainerLabel(entry.containerLabel || entry.containerId || "Contenant"))} : ${StockTracking.format(before)} ${escapeHtml(entry.unit || "")} → ${StockTracking.format(after)} ${escapeHtml(entry.unit || "")} (${formatStockMovementDifference(entry.difference ?? after-before)})${status}`;
  }
  if (entry.type === "recounted" && ["container","closed"].includes(entry.entityType)) {
    const rawBefore=entry.beforeQuantity ?? (entry.entityType==="closed"?entry.before?.quantity:entry.before?.remaining),rawAfter=entry.afterQuantity ?? (entry.entityType==="closed"?entry.after?.quantity:entry.after?.remaining);
    const beforeUnit=entry.unitBefore||entry.unit,afterUnit=entry.unitAfter||entry.unit,changes=[];
    if(beforeUnit!==afterUnit)changes.push(`unité ${escapeHtml(beforeUnit||"—")} → ${escapeHtml(afterUnit||"—")}`);
    if(rawBefore!==rawAfter||beforeUnit!==afterUnit)changes.push(`${StockTracking.format(rawBefore)} ${escapeHtml(beforeUnit||"")} → ${StockTracking.format(rawAfter)} ${escapeHtml(afterUnit||"")}${beforeUnit===afterUnit?` (${formatStockMovementDifference(entry.difference??rawAfter-rawBefore)})`:""}`);
    const capacityBefore=entry.beforeCapacity??entry.before?.capacity,capacityAfter=entry.afterCapacity??entry.after?.capacity;
    if(capacityBefore!==null&&capacityAfter!==null&&capacityBefore!==undefined&&capacityAfter!==undefined&&(capacityBefore!==capacityAfter||beforeUnit!==afterUnit))changes.push(`capacité ${StockTracking.format(capacityBefore)} ${escapeHtml(beforeUnit||"")} → ${StockTracking.format(capacityAfter)} ${escapeHtml(afterUnit||"")}`);
    if(entry.fromLocation&&entry.toLocation&&entry.fromLocation!==entry.toLocation)changes.push(`localisation ${escapeHtml(entry.fromLocation)} → ${escapeHtml(entry.toLocation)}`);
    if(entry.containerStatusBefore&&entry.containerStatusAfter&&entry.containerStatusBefore!==entry.containerStatusAfter){const labels={closed:"Fermé",open:"Ouvert",finished:"Terminé"};changes.push(`Statut : ${labels[entry.containerStatusBefore]||escapeHtml(entry.containerStatusBefore)} → ${labels[entry.containerStatusAfter]||escapeHtml(entry.containerStatusAfter)}`);}
    const rawLabel = entry.entityType === "closed" ? (entry.containerLabel || "Stock simple") : (entry.containerLabel || entry.containerId || "Contenant");
    return `${escapeHtml(formatStockMovementContainerLabel(rawLabel))} : ${changes.join(" · ")||"informations corrigées"}`;
  }
  if (entry.type === "container_opened") {
    const label=escapeHtml(entry.containerLabel || entry.after?.label || entry.containerId || "Contenant"),from=entry.fromLocation||entry.before?.location,to=entry.toLocation||entry.after?.location;
    return from&&to&&from!==to?`${label} ouvert${entry.automatic?" automatiquement":""} : ${escapeHtml(from)} → ${escapeHtml(to)}.`:`${label} ouvert${entry.automatic?" automatiquement":""}${entry.after?.remaining!==undefined?` avec ${StockTracking.format(entry.after.remaining)} ${escapeHtml(entry.unit||"")} disponibles`:""}.`;
  }
  if (entry.type === "aliquots_consumed") { const before=StockTracking.remainingAliquots(entry.before || {locations:[]}),after=StockTracking.remainingAliquots(entry.after || {locations:[]}); return `${StockTracking.format(entry.quantity)} aliquote${entry.quantity>1?"s":""} utilisée${entry.quantity>1?"s":""}. ${before} → ${after} aliquotes.${entry.comment?` ${escapeHtml(entry.comment)}`:""}`; }
  if (entry.type === "open_aliquot_consumed") return `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit)} utilisés. ${StockTracking.format(entry.before?.remainingVolume)} → ${StockTracking.format(entry.after?.remainingVolume)} ${escapeHtml(entry.unit)}.${entry.comment?` ${escapeHtml(entry.comment)}`:""}`;
  if (entry.type === "aliquot_opened") return `${escapeHtml(entry.after?.label || "Aliquote")} ouverte à ${escapeHtml(entry.after?.location || entry.toLocation || "—")} · ${StockTracking.format(entry.after?.remainingVolume)} ${escapeHtml(entry.after?.volumeUnit || "")}.`;
  if (entry.type === "open_aliquot_moved") return `${escapeHtml(entry.before?.label || "Aliquote")} déplacée de ${escapeHtml(entry.fromLocation || "—")} vers ${escapeHtml(entry.toLocation || "—")}.`;
  if (entry.type === "open_aliquot_discarded") return `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit)} jetés. Motif : ${escapeHtml(entry.correctionReason || "—")}.`;
  return `${entry.quantity ? `${StockTracking.format(entry.quantity)} ${escapeHtml(entry.unit || "")}. ` : ""}${entry.fromLocation ? `${escapeHtml(entry.fromLocation)} → ` : ""}${escapeHtml(entry.toLocation || "")}${entry.comment ? ` · ${escapeHtml(entry.comment)}` : ""}`;
}

function formatStockMovementDifference(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return escapeHtml(value ?? "—");
  return `${number < 0 ? "−" : number > 0 ? "+" : ""}${StockTracking.format(Math.abs(number))}`;
}

function formatStockMovementContainerLabel(value) {
  const label = String(value || "Contenant").trim().replace(/n[º°o]\s*(\d+)/i, "n° $1");
  return `${label.charAt(0).toLocaleUpperCase("fr-FR")}${label.slice(1)}`;
}

function ensureStockManagerDialog() {
  let modal = document.querySelector("#stockManagerDialog"); if (modal) return modal;
  document.body.insertAdjacentHTML("beforeend", `<dialog id="stockManagerDialog" class="modal stock-manager-modal"><form id="stockManagerForm"><div class="modal-header"><div><h3>Mise à jour du stock</h3><small id="stockManagerItemName"></small></div><button class="icon-btn" type="button" data-close-stock-manager>×</button></div><input id="stockManagerItemId" type="hidden"><label>Action<select id="stockManagerAction"></select></label><p id="stockManagerAvailabilityNote" class="tracking-option-explanation hidden"></p><div id="stockManagerFields" class="form-grid"></div><label class="full-label">Motif de la modification *<textarea id="stockManagerComment" rows="2" required placeholder="Précisez la raison de la modification (réception d’un colis, étude client XXX, inventaire, correction d’une erreur, etc.) afin d’assurer la traçabilité."></textarea></label><p id="stockManagerError" class="confirmation-modal-error hidden" role="alert"></p><div class="modal-actions"><button class="ghost-btn" type="button" data-close-stock-manager>Annuler</button><button id="executeStockManagerBtn" class="primary-btn" type="submit">Enregistrer</button></div></form></dialog>`);
  modal = document.querySelector("#stockManagerDialog");
  const reasonLabel=modal.querySelector("#stockManagerComment")?.closest("label");if(reasonLabel?.firstChild){reasonLabel.firstChild.remove();reasonLabel.querySelector("textarea").insertAdjacentHTML("beforebegin",'<span>Motif de la modification <b class="required-star">*</b></span>');}
  modal.querySelectorAll("[data-close-stock-manager]").forEach(btn => btn.addEventListener("click", () => modal.close()));
  modal.querySelector("#stockManagerAction").addEventListener("change", renderStockManagerFields);
  modal.querySelector("form").addEventListener("submit", submitStockManager);
  return modal;
}

function usesAdvancedStockManager(item) {
  const tracking = StockTracking.normalizeTracking(item || {});
  return tracking.mode === "containers" || tracking.traceabilityMode === "detailed" || StockTracking.normalizeAliquots(item || {}).enabled;
}

function getStockManagerActionState(item) {
  const tracking=StockTracking.normalizeTracking(item),aliquots=StockTracking.normalizeAliquots(item),actions=[];
  if(tracking.mode==="containers")actions.push(["recounted","Mise à jour du stock"]);else actions.push(["stock_recounted","Mise à jour du stock"]);
  const activePreparations=aliquots.preparations.filter(row=>row.status==="active"),hasUnopened=activePreparations.some(row=>StockTracking.remainingAliquots(row)>0),hasOpenable=activePreparations.some(row=>StockTracking.remainingAliquots(row)>0&&row.volume>0&&row.volumeUnit),hasOpen=activePreparations.some(row=>row.openAliquots.some(open=>open.status==="open"&&open.remainingVolume>0));
  if(aliquots.enabled)actions.push(["aliquots_prepared","Préparer des aliquotes",false]);
  if(activePreparations.length)actions.push(["preparation_recounted","Mise à jour des aliquotes disponibles",false]);
  return {tracking,aliquots,actions,activePreparations,hasUnopened,hasOpenable,hasOpen};
}

function openStockManager(itemId, options = {}) {
  const item = items.find(row => row.id === itemId); if (!item) return;
  const modal=ensureStockManagerDialog(),{tracking,aliquots,actions,hasUnopened,hasOpen}=getStockManagerActionState(item);
  modal.querySelector("#stockManagerItemId").value = itemId; modal.querySelector("#stockManagerItemName").textContent = item.name; modal.querySelector("#stockManagerAction").innerHTML = actions.map(([value,label,disabled]) => `<option value="${value}" ${disabled ? "disabled" : ""}>${label}</option>`).join(""); if (options.action && actions.some(([value,,disabled]) => value === options.action && !disabled)) modal.querySelector("#stockManagerAction").value = options.action; modal.dataset.entityId = options.entityId || ""; modal.querySelector("#stockManagerComment").value = ""; modal.querySelector("#stockManagerError").classList.add("hidden"); const note=modal.querySelector("#stockManagerAvailabilityNote"); note.textContent=!hasUnopened&&!hasOpen&&aliquots.enabled?"Aucune aliquote disponible. Préparez d’abord des aliquotes.":tracking.traceabilityMode === "detailed"?"Chaque utilisation doit être enregistrée individuellement.":""; note.classList.toggle("hidden",!note.textContent); renderStockManagerFields(); modal.showModal();
}

function stockSelect(id, label, values, extra="") { return `<label><span>${label}</span><select id="${id}" required>${values.map(([value,text]) => `<option value="${escapeHtml(value)}">${escapeHtml(text)}</option>`).join("")}</select>${extra}</label>`; }
function stockNumber(id,label,max="") { return `<label><span>${label}</span><input id="${id}" type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" data-quantity-step="1" ${max !== "" ? `max="${max}"` : ""} required></label>`; }

function hierarchyPathForIds(roomId,locationId,sublocationId){const room=hierarchyRoom(roomId),location=hierarchyLocation(locationId),sub=hierarchySublocation(sublocationId);return[room?.name,location?.name,sub?.name].filter(Boolean).join(" → ");}
function hierarchySelectorsHtml(prefix,values={}){
  const catalog=hierarchyCatalog(),rooms=FIXED_INVENTORY_ROOMS,locations=values.roomId?catalog.locations.filter(row=>row.roomId===values.roomId):[],subs=values.locationId?catalog.sublocations.filter(row=>row.locationId===values.locationId):[],explicitEmptySub=/aliquot-preparation|preparation-correction/.test(prefix);
  return `<div class="stock-hierarchy-selectors" data-hierarchy-prefix="${prefix}"><label><span>Salle</span><select data-hierarchy-room required><option value="">Sélectionner…</option>${rooms.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.roomId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label><label data-hierarchy-location-field ${locations.length?"":"class=\"hidden\""}><span>Loc.</span><select data-hierarchy-location ${locations.length?"required":"disabled"}><option value="">Sélectionner…</option>${locations.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.locationId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label><label data-hierarchy-sublocation-field ${subs.length||explicitEmptySub?"":"class=\"hidden\""}><span>Sous-loc.</span><select data-hierarchy-sublocation ${subs.length?"required":"disabled"}><option value="">Aucune sous-localisation</option>${subs.map(row=>`<option value="${escapeHtml(row.id)}" ${row.id===values.sublocationId?"selected":""}>${escapeHtml(row.name)}</option>`).join("")}</select></label></div>`;
}
function bindHierarchySelectors(root){root.querySelectorAll("[data-hierarchy-prefix]").forEach(group=>{
  if(group.dataset.hierarchyBound==="true")return;group.dataset.hierarchyBound="true";
  const room=group.querySelector("[data-hierarchy-room]"),location=group.querySelector("[data-hierarchy-location]"),sub=group.querySelector("[data-hierarchy-sublocation]"),locationField=group.querySelector("[data-hierarchy-location-field]"),subField=group.querySelector("[data-hierarchy-sublocation-field]"),hidden=group.parentElement.querySelector("[data-recount-location]");
  const explicitEmptySub=/aliquot-preparation|preparation-correction/.test(group.dataset.hierarchyPrefix),update=()=>{if(hidden)hidden.value=hierarchyPathForIds(room.value,location.value,sub.value);},syncSubs=()=>{const rows=hierarchyCatalog().sublocations.filter(row=>row.locationId===location.value);sub.innerHTML=`<option value="">Aucune sous-localisation</option>${rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`).join("")}`;subField.classList.toggle("hidden",!rows.length&&!explicitEmptySub);sub.disabled=!rows.length;sub.required=Boolean(rows.length);if(!rows.length)sub.value="";update();},syncLocations=()=>{const rows=hierarchyCatalog().locations.filter(row=>row.roomId===room.value);location.innerHTML=`<option value="">Sélectionner…</option>${rows.map(row=>`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`).join("")}`;locationField.classList.toggle("hidden",!rows.length);location.disabled=!rows.length;location.required=Boolean(rows.length);if(!rows.length)location.value="";syncSubs();};
  room.addEventListener("change",syncLocations);location.addEventListener("change",syncSubs);sub.addEventListener("change",update);
});}

function containerValueForUnit(value, tracking, unitKey) {
  const index=tracking.packagingLevels.findIndex(level=>level.key===unitKey),factor=index<0?StockTracking.trackingFactor(tracking):tracking.packagingLevels.slice(index+1).reduce((value,level)=>value*level.contains,1);
  return Number((Number(value||0)/factor).toFixed(6));
}

function renderContainerRecountRow(container, tracking, locations, options = {}) {
  const isNew=Boolean(options.isNew),unitKey=container.unitKey||tracking.trackingUnitKey,quantity=containerValueForUnit(container.remaining,tracking,unitKey),units=tracking.packagingLevels.map(level=>[level.key,level.plural]),places=Array.from(new Set(["",...locations,container.location].filter(value=>value!==undefined)));
  return `<section class="container-recount-row" data-container-id="${escapeHtml(container.id)}" data-version="${Number(container.version||0)}" data-original-status="${isNew?"":escapeHtml(container.status)}" data-original-unit="${isNew?"":escapeHtml(unitKey)}" data-current-unit="${escapeHtml(unitKey)}" data-capacity-base="${Number(container.capacity||0)}" data-original-location="${isNew?"":escapeHtml(container.location||"")}" data-original-quantity="${isNew?"":quantity}" data-new-container="${isNew?"true":"false"}">
    <header><strong data-container-display-title>${escapeHtml(container.label||container.id)}</strong>${isNew?`<span class="stock-distribution-badge">Nouveau</span>`:""}<button class="container-recount-remove" type="button" data-remove-container>${isNew?"Supprimer":"Retirer"}</button><span class="stock-distribution-badge stock-distribution-badge--${container.status==="closed"?"closed":"open"}">${container.status==="closed"?"Fermé":"Ouvert"}</span></header>
    <label><span>Statut</span><select data-recount-status><option value="closed" ${container.status==="closed"?"selected":""}>Fermé</option><option value="open" ${container.status==="open"?"selected":""}>Ouvert</option>${isNew?"":`<option value="finished">Terminé</option>`}</select></label>
    <label><span data-recount-quantity-label>${container.status==="open"?"Quantité restante":"Quantité actuelle"}</span><input data-recount-quantity type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" value="${quantity}" required></label>
    <label><span>Unité</span><select data-recount-unit>${units.map(([value,label])=>`<option value="${escapeHtml(value)}" ${value===unitKey?"selected":""}>${escapeHtml(label)}</option>`).join("")}</select></label>
    ${hierarchySelectorsHtml(`container-${container.id}`,container)}<input type="hidden" data-recount-location value="${escapeHtml(container.location||"")}">
  </section>`;
}

function renderContainerRecountFields(item) {
  const tracking=StockTracking.normalizeTracking(item),active=[...tracking.openContainers.filter(row=>row.status==="open"),...tracking.closedContainers];
  const fallbackPlacement=(item.placements||[])[0]||{};active.forEach(container=>{if(!container.roomId)Object.assign(container,{roomId:fallbackPlacement.roomId||"",locationId:fallbackPlacement.locationId||"",sublocationId:fallbackPlacement.sublocationId||""});});
  const locations=Array.from(new Set([...inventoryLocations,...active.map(row=>row.location)].filter(Boolean))),outer=tracking.packagingLevels[0];
  return `<div class="container-recount-list">${active.length?active.map(container=>renderContainerRecountRow(container,tracking,locations)).join(""):`<div class="stock-source-empty"><strong>Aucun contenant actif à compter.</strong></div>`}<div class="container-recount-new-rows"></div><button class="ghost-btn compact-btn container-recount-add" type="button" data-add-primary-container>+ Ajouter un ${escapeHtml(outer.singular)}</button></div>`;
}

function bindContainerRecountControls(root, item, tracking = StockTracking.normalizeTracking(item)) {
  const list=root.querySelector(".container-recount-new-rows"),button=root.querySelector("[data-add-primary-container]");
  bindHierarchySelectors(root);
  const reorderRows=(changedRow=null)=>{const host=root.querySelector(".container-recount-list"),anchor=host.querySelector(".container-recount-new-rows"),rows=[...host.querySelectorAll(":scope > .container-recount-row, .container-recount-new-rows > .container-recount-row")].filter(row=>!row.classList.contains("hidden"));if(changedRow){const status=changedRow.querySelector("[data-recount-status]").value,last=rows.filter(row=>row!==changedRow&&row.querySelector("[data-recount-status]").value===status).at(-1);if(last)last.after(changedRow);}const ordered=[...host.querySelectorAll(":scope > .container-recount-row, .container-recount-new-rows > .container-recount-row")].sort((a,b)=>{const rank=row=>row.querySelector("[data-recount-status]").value==="open"?0:1;return rank(a)-rank(b);});ordered.forEach(row=>host.insertBefore(row,anchor));};
  const refreshTitles=()=>{const counters={closed:0,open:0},unit=tracking.packagingLevels[0].singular,feminine=isLikelyFeminineUnit(unit);root.querySelectorAll(".container-recount-row").forEach(row=>{const status=row.querySelector("[data-recount-status]")?.value;if(status==="finished"){row.classList.add("hidden");return;}row.classList.remove("hidden");counters[status]=(counters[status]||0)+1;const adjective=status==="closed"?(feminine?"fermée":"fermé"):(feminine?"ouverte":"ouvert"),title=`${unit.charAt(0).toLocaleUpperCase("fr-FR")}${unit.slice(1)} ${adjective} ${counters[status]}`;row.querySelector("[data-container-display-title]").textContent=title;row.querySelector("[data-container-display-title]").title=title;});};
  const closedLocations=Array.from(new Set(tracking.closedContainers.map(row=>row.location).filter(Boolean)));
  const configuredLocation=item.stockTracking?.closedContainerLocation||item.stockTracking?.defaultClosedLocation||"";
  const defaultLocation=closedLocations.length===1?closedLocations[0]:configuredLocation||(closedLocations.length===0?item.location||"":"");
  button?.addEventListener("click",()=>{
    const index=list.querySelectorAll("[data-new-container='true']").length+1,outer=tracking.packagingLevels[0];
    const draft={id:`draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,label:`Nouveau ${outer.singular} ${index}`,location:defaultLocation,remaining:StockTracking.capacity(tracking),capacity:StockTracking.capacity(tracking),unitKey:tracking.trackingUnitKey,status:"closed",version:0};
    list.insertAdjacentHTML("beforeend",renderContainerRecountRow(draft,tracking,inventoryLocations,{isNew:true}));bindHierarchySelectors(list);refreshTitles();
  });
  root.querySelector(".container-recount-list")?.addEventListener("click",event=>{const remove=event.target.closest("[data-remove-container]");if(!remove)return;const row=remove.closest(".container-recount-row");if(row.dataset.newContainer==="true")row.remove();else{row.querySelector("[data-recount-status]").value="finished";row.querySelector("[data-recount-quantity]").value="0";}refreshTitles();});
  root.querySelector(".container-recount-list")?.addEventListener("change",event=>{
    const row=event.target.closest(".container-recount-row");if(!row)return;
    if(event.target.matches("[data-recount-unit]")){
      const previousKey=row.dataset.currentUnit,newKey=event.target.value,previousIndex=tracking.packagingLevels.findIndex(level=>level.key===previousKey),newIndex=tracking.packagingLevels.findIndex(level=>level.key===newKey);
      if(previousIndex>=0&&newIndex>=0){const previousFactor=tracking.packagingLevels.slice(previousIndex+1).reduce((value,level)=>value*level.contains,1),newFactor=tracking.packagingLevels.slice(newIndex+1).reduce((value,level)=>value*level.contains,1),input=row.querySelector("[data-recount-quantity]"),parsed=StockTracking.parseLocalizedNumber(input.value);if(Number.isFinite(parsed))input.value=Number((parsed*previousFactor/newFactor).toFixed(6));row.dataset.currentUnit=newKey;}
      return;
    }
    if(!event.target.matches("[data-recount-status]"))return;
    const badge=[...row.querySelectorAll(".stock-distribution-badge")].at(-1),quantityLabel=row.querySelector("[data-recount-quantity-label]");if(!badge)return;
    badge.classList.remove("stock-distribution-badge--closed","stock-distribution-badge--open");
    if(event.target.value==="closed"){badge.textContent="Fermé";badge.classList.add("stock-distribution-badge--closed");quantityLabel.textContent="Quantité actuelle";}
    else if(event.target.value==="open"){badge.textContent="Ouvert";badge.classList.add("stock-distribution-badge--open");quantityLabel.textContent="Quantité restante";}
    else{badge.textContent="Terminé";quantityLabel.textContent="Quantité restante";row.querySelector("[data-recount-quantity]").value="0";}reorderRows(row);refreshTitles();
  });
  reorderRows();refreshTitles();
}

function getAliquotPreparationSources(item) {
  const tracking = StockTracking.normalizeTracking(item);
  if (tracking.mode === "simple") {
    const quantity = StockTracking.simpleRawAvailable(item);
    return { mode: "simple", quantity, unit: StockTracking.normalizeUnitLabel(item.unit), location: getItemLocations(item)[0] || item.location || "—", groups: quantity > 0 ? [{ type: "simple", label: "Stock disponible", sources: [{ id: "global", quantity, location: getItemLocations(item)[0] || item.location || "—" }] }] : [] };
  }
  const openUnit = StockTracking.trackingLevel(tracking), outer = tracking.packagingLevels[0];
  const open = tracking.openContainers.filter(row => row.status === "open" && row.remaining > 0).map(row => { const quantity = StockTracking.fromBaseQuantity(row.remaining, tracking); return { id: row.id, quantity, location: row.location || "—",roomId:row.roomId||"",locationId:row.locationId||"",sublocationId:row.sublocationId||"", label: `${formatOpenContainerDisplayTitle(row.label, outer.singular)} · Ouvert · ${StockTracking.format(quantity)} ${StockTracking.plural(quantity, openUnit.singular, openUnit.plural)} · ${row.location || "—"}` }; });
  const closed = tracking.closedContainers.filter(row=>row.status==="closed"&&row.remaining>0).map(row=>{const quantity=StockTracking.fromBaseQuantity(row.remaining,tracking);return{id:row.id,quantity,location:row.location,roomId:row.roomId||"",locationId:row.locationId||"",sublocationId:row.sublocationId||"",label:`${row.label||row.id} · Fermé · ${StockTracking.format(quantity)} ${StockTracking.plural(quantity,openUnit.singular,openUnit.plural)} · ${row.location||"—"}`};});
  return { mode: "containers", unit: openUnit, groups: [...(open.length ? [{ type: "container", label: "Contenant ouvert", sources: open }] : []), ...(closed.length ? [{ type: "closed", label: "Contenant fermé", sources: closed }] : [])] };
}

function renderAliquotPreparationFields(item, locations) {
  const sourceState = getAliquotPreparationSources(item), unit = sourceState.unit;
  if (!sourceState.groups.length) return `<div class="stock-source-empty"><strong>Aucun stock disponible pour préparer des aliquotes.</strong><button class="ghost-btn compact-btn" type="button" data-empty-stock-action>${sourceState.mode === "containers" ? "Réceptionner du stock" : "Réceptionner du stock"}</button></div>`;
  const sources=sourceState.groups.flatMap(group=>group.sources.map(source=>({...source,type:group.type}))),sourceOptions=sources.map(source=>`<option value="${escapeHtml(`${source.type}|${source.id}`)}">${escapeHtml(source.label||`${source.location} · ${StockTracking.format(source.quantity)} ${unit.plural}`)}</option>`).join("");
  const sourceControls=`<label><span>Stock source <b class="required-star">*</b></span><select id="smStockSource" required>${sourceOptions}</select></label><input id="smSourceType" type="hidden"><input id="smSourceId" type="hidden">`;
  const initialMax = sourceState.mode === "simple" ? sourceState.quantity : "";
  return `<div class="aliquot-preparation-grid">${sourceControls}<label><span>Nombre d’aliquotes <b class="required-star">*</b></span><input id="smCreated" type="number" min="1" step="1" required></label><label><span>Volume d’une aliquote <b class="required-star">*</b></span><input id="smVolume" type="number" min="0" step="any" required></label><label><span>Unité de volume <b class="required-star">*</b></span><input id="smVolumeUnit" value="µL" required></label><label><span>Concentration d’une aliquote <b class="required-star">*</b></span><input id="smConcentration" type="number" min="0" step="any" required></label><label><span>Unité de concentration <b class="required-star">*</b></span><input id="smConcentrationUnit" value="mM" required></label><label class="full-label"><span id="smSourceQuantityLabel">Quantité source utilisée — ${escapeHtml(unit.plural)} <b class="required-star">*</b></span><input id="smSourceQuantity" type="text" inputmode="decimal" pattern="\\d+([.,]\\d+)?" ${initialMax!==""?`max="${initialMax}"`:""} required><small id="smSourceQuantityNotice"></small></label><div class="aliquot-preparation-location">${hierarchySelectorsHtml("aliquot-preparation",{})}<input id="smTo" type="hidden" data-recount-location></div><label><span>Nombre d’aliquotes dans cette localisation <b class="required-star">*</b></span><input id="smLocationQuantity" type="number" min="1" step="1" required></label></div>`;
}

function setAdditionalAliquotLocationVisible(modal, visible, values = {}) {
  const row = modal.querySelector("#additionalAliquotLocationRow"), addButton = modal.querySelector("#addAliquotLocationBtn"), location = modal.querySelector("#smTo2"), quantity = modal.querySelector("#smLocationQuantity2");
  if (!row || !location || !quantity) return;
  row.classList.toggle("hidden", !visible);
  addButton?.classList.toggle("hidden", visible);
  location.disabled = !visible;
  quantity.disabled = !visible;
  location.required = visible;
  quantity.required = visible;
  quantity.min = visible ? "1" : "0";
  if (visible) {
    location.value = values.location || "";
    quantity.value = values.quantity ?? "";
  } else {
    location.value = "";
    quantity.value = "";
    location.setCustomValidity("");
    quantity.setCustomValidity("");
  }
}

function validateAliquotDistribution(modal) {
  const errorBox = modal.querySelector("#stockManagerError"), total = StockTracking.parseLocalizedNumber(modal.querySelector("#smCreated")?.value), firstLocation = modal.querySelector("#smTo"), firstQuantity = modal.querySelector("#smLocationQuantity"), secondLocation = modal.querySelector("#smTo2"), secondQuantity = modal.querySelector("#smLocationQuantity2"), secondVisible = Boolean(secondLocation && !secondLocation.disabled);
  [firstLocation, firstQuantity, secondLocation, secondQuantity].forEach(control => control?.setCustomValidity(""));
  if (!Number.isFinite(total) || total <= 0 || !firstLocation?.value || !Number.isFinite(StockTracking.parseLocalizedNumber(firstQuantity?.value))) return true;
  if (secondVisible && secondLocation.value === firstLocation.value) {
    const message = "Sélectionnez deux localisations différentes.";
    secondLocation.setCustomValidity(message); errorBox.textContent = message; errorBox.classList.remove("hidden"); secondLocation.focus(); return false;
  }
  const first = StockTracking.parseLocalizedNumber(firstQuantity.value), second = secondVisible ? StockTracking.parseLocalizedNumber(secondQuantity.value) : 0;
  if (secondVisible && (!secondLocation.value || !Number.isFinite(second) || second <= 0)) return true;
  const difference = total - first - second;
  if (Math.abs(difference) > 1e-8) {
    const message = difference > 0 ? `Répartissez les ${StockTracking.format(total)} aliquotes entre les localisations sélectionnées. Il reste ${StockTracking.format(difference)} aliquote${difference > 1 ? "s" : ""} à attribuer.` : `La répartition dépasse de ${StockTracking.format(Math.abs(difference))} aliquote${Math.abs(difference) > 1 ? "s" : ""} le nombre préparé.`;
    firstQuantity.setCustomValidity(message); errorBox.textContent = message; errorBox.classList.remove("hidden"); firstQuantity.focus(); return false;
  }
  errorBox.classList.add("hidden");
  return true;
}

function buildAliquotPreparationOperation(modal, sourceItem) {
  const value = id => modal.querySelector(`#${id}`)?.value || "", numeric = id => StockTracking.parseLocalizedNumber(value(id)), sourceType = value("smSourceType"), sourceId = value("smSourceId"), sourceTracking = StockTracking.normalizeTracking(sourceItem || {}), normalizedSourceQuantity = numeric("smSourceQuantity");
  const hierarchy=modal.querySelector("[data-hierarchy-prefix='aliquot-preparation']"),roomId=hierarchy?.querySelector("[data-hierarchy-room]").value||"",locationId=hierarchy?.querySelector("[data-hierarchy-location]").value||"",sublocationId=hierarchy?.querySelector("[data-hierarchy-sublocation]").value||"";
  return { sourceType, sourceId, fromLocation: value("smFrom"), sourceQuantity: normalizedSourceQuantity, representedSourceQuantity: normalizedSourceQuantity, createdCount: numeric("smCreated"), volume: numeric("smVolume"), volumeUnit: value("smVolumeUnit"), concentration: numeric("smConcentration"), concentrationUnit: value("smConcentrationUnit"), sourceUnit: sourceTracking.mode === "simple" ? (sourceItem?.unit || "") : StockTracking.trackingLevel(sourceTracking).plural, preparedAt: new Date().toISOString(), locations: [{ location: value("smTo"),roomId,locationId,sublocationId, quantity: numeric("smLocationQuantity") }].filter(row => row.location && row.quantity) };
}

function syncAliquotSourceEntity(modal, item) {
  const selector=modal.querySelector("#smStockSource"),sourceState=getAliquotPreparationSources(item);if(!selector)return;
  const syncLimit = () => {
    const [type,id]=selector.value.split("|"),group=sourceState.groups.find(entry=>entry.type===type),selected=group?.sources.find(source=>source.id===id),quantity=modal.querySelector("#smSourceQuantity");modal.querySelector("#smSourceType").value=type;modal.querySelector("#smSourceId").value=id;
    const destination=modal.querySelector("[data-hierarchy-prefix='aliquot-preparation']");if(selected&&destination&&(selected.roomId||selected.locationId)){destination.outerHTML=hierarchySelectorsHtml("aliquot-preparation",selected);bindHierarchySelectors(modal);const hidden=modal.querySelector("#smTo");if(hidden)hidden.value=hierarchyPathForIds(selected.roomId,selected.locationId,selected.sublocationId);}
    if (!quantity) return;
    const capacity=selected?.quantity,label=modal.querySelector("#smSourceQuantityLabel");if(label)label.innerHTML=`Quantité source utilisée — ${escapeHtml(sourceState.unit.plural)} <b class="required-star">*</b>`;
    quantity.max = Number.isFinite(capacity) ? capacity : "";
    if (!quantity.dataset.manual) quantity.value = "";
    quantity.readOnly = false;
  };
  selector.addEventListener("change",syncLimit);
  syncLimit();
}

function formatPreparationOption(prep) {
  const parsedDate = prep.preparedAt ? new Date(`${prep.preparedAt}T12:00:00`) : null, date = parsedDate && Number.isFinite(parsedDate.getTime()) ? new Intl.DateTimeFormat("fr-FR").format(parsedDate) : "Date inconnue";
  const available = StockTracking.remainingAliquots(prep);
  return `Préparation du ${date} · ${available} disponible${available > 1 ? "s" : ""}${prep.volume ? ` · ${StockTracking.format(prep.volume)} ${prep.volumeUnit}` : ""}${prep.concentration ? ` · ${StockTracking.format(prep.concentration)} ${prep.concentrationUnit}` : ""}`;
}

function getActiveOpenAliquots(aliquots) { return aliquots.preparations.flatMap(prep => prep.openAliquots.filter(open => open.status === "open" && open.remainingVolume > 0).map(open => ({ prep, open }))); }

function renderAliquotUseFields(item) {
  const aliquots = StockTracking.normalizeAliquots(item), unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0), partial = unopened.filter(prep => prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots), modes = [];
  if (unopened.length) modes.push(["whole", "Aliquotes entières"]);
  if (partial.length) modes.push(["open_new", "Utiliser partiellement une nouvelle aliquote"]);
  if (opened.length) modes.push(["open_existing", "Utiliser une aliquote déjà ouverte"]);
  if (!modes.length) return `<div class="stock-source-empty"><strong>Aucune aliquote disponible. Préparez d’abord des aliquotes.</strong></div>`;
  const legacyNote = unopened.length && !partial.length ? `<p class="tracking-option-explanation">Le volume individuel de cette préparation n’est pas défini. Seule la consommation d’aliquotes entières est disponible.</p>` : "";
  return `${stockSelect("smAliquotUseMode", "Mode d’utilisation", modes)}${legacyNote}<div id="smAliquotUseFields" class="form-grid nested-stock-fields"></div>`;
}

function renderPreparationCorrectionFields(item){const views=activePreparationViews(item),options=views.map(view=>[view.preparation.id,`${view.label} · ${StockTracking.remainingAliquots(view.preparation)+(view.preparation.openAliquots||[]).filter(row=>row.status==="open").length} disponibles`]);return `<div class="preparation-correction-picker">${stockSelect("smEntity","Préparation ou lot",options)}</div><div id="smPreparationCorrection"></div>`;}
function syncPreparationCorrectionFields(modal,item){const view=activePreparationViews(item).find(row=>row.preparation.id===modal.querySelector("#smEntity")?.value),prep=view?.preparation,host=modal.querySelector("#smPreparationCorrection");if(!prep||!host)return;const open=(prep.openAliquots||[]).filter(row=>row.status==="open").length,total=StockTracking.remainingAliquots(prep)+open,location=(prep.locations||[])[0]||{};host.innerHTML=`<section class="preparation-correction-card" data-preparation-id="${escapeHtml(prep.id)}"><header><strong>${escapeHtml(view.label)}</strong></header><div class="preparation-correction-grid"><label><span>Nombre d’aliquotes disponibles <b class="required-star">*</b></span><input id="smAvailableCount" type="number" min="0" step="1" required value="${total}"></label><label><span>Volume d’une aliquote <b class="required-star">*</b></span><input id="smVolume" type="number" min="0" step="any" required value="${prep.volume||0}"></label><label><span>Unité de volume <b class="required-star">*</b></span><input id="smVolumeUnit" value="${escapeHtml(prep.volumeUnit||"")}" required></label><label><span>Concentration <b class="required-star">*</b></span><input id="smConcentration" type="number" min="0" step="any" required value="${prep.concentration||0}"></label><label><span>Unité de concentration <b class="required-star">*</b></span><input id="smConcentrationUnit" value="${escapeHtml(prep.concentrationUnit||"")}" required></label>${hierarchySelectorsHtml("preparation-correction",location)}<input id="smPrepLocation" type="hidden" data-recount-location value="${escapeHtml(location.location||"")}"></div></section>`;bindHierarchySelectors(host);}

function syncAliquotUseFields(modal, item) {
  const host = modal.querySelector("#smAliquotUseFields"), mode = modal.querySelector("#smAliquotUseMode")?.value, aliquots = StockTracking.normalizeAliquots(item); if (!host || !mode) return;
  const unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0), partial = unopened.filter(prep => prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots);
  if (mode === "whole") host.innerHTML = stockSelect("smEntity", "Préparation concernée", unopened.map(prep => [prep.id, formatPreparationOption(prep)])) + `<div id="smAliquotLocationField"></div>` + stockNumber("smQuantity", "Nombre d’aliquotes utilisées");
  else if (mode === "open_new") host.innerHTML = stockSelect("smEntity", "Préparation", partial.map(prep => [prep.id, formatPreparationOption(prep)])) + `<div id="smAliquotLocationField"></div>` + stockNumber("smQuantity", `Volume utilisé`);
  else host.innerHTML = stockSelect("smEntity", "Aliquote ouverte", opened.map(({ prep, open }) => [open.id, `${open.label} · ${StockTracking.format(open.remainingVolume)} ${open.volumeUnit} restants · ${open.location || "—"} · ${prep.label}`])) + stockNumber("smQuantity", "Volume utilisé");
  const preferred = modal.dataset.entityId; if (preferred && Array.from(host.querySelector("#smEntity")?.options || []).some(option => option.value === preferred)) host.querySelector("#smEntity").value = preferred;
  const syncLocation = () => { const prep = aliquots.preparations.find(row => row.id === host.querySelector("#smEntity")?.value), locationHost = host.querySelector("#smAliquotLocationField"); if (!locationHost || !prep) return; locationHost.innerHTML = stockSelect("smFrom", "Localisation source", prep.locations.filter(row => row.quantity > 0).map(row => [row.location, `${row.location} · ${row.quantity} disponible${row.quantity > 1 ? "s" : ""}`])); const quantity = host.querySelector("#smQuantity"); if (quantity && mode === "open_new") { quantity.max = prep.volume; quantity.closest("label")?.querySelector("span")?.replaceChildren(`Volume utilisé — ${prep.volumeUnit}`); } };
  const syncOpenLimit = () => { if(mode!=="open_existing")return;const pair=opened.find(({open})=>open.id===host.querySelector("#smEntity")?.value),quantity=host.querySelector("#smQuantity");if(pair&&quantity){quantity.max=pair.open.remainingVolume;quantity.closest("label")?.querySelector("span")?.replaceChildren(`Volume utilisé — ${pair.open.volumeUnit}`);} };
  host.querySelector("#smEntity")?.addEventListener("change", mode === "open_existing" ? syncOpenLimit : syncLocation); syncLocation(); syncOpenLimit();
}

function renderOpenAliquotActionFields(item, action) {
  const aliquots = StockTracking.normalizeAliquots(item), unopened = aliquots.preparations.filter(prep => prep.status === "active" && StockTracking.remainingAliquots(prep) > 0 && prep.volume > 0 && prep.volumeUnit), opened = getActiveOpenAliquots(aliquots);
  if (action === "aliquot_opened") return unopened.length ? `${stockSelect("smEntity", "Préparation", unopened.map(prep => [prep.id, formatPreparationOption(prep)]))}<div id="smAliquotLocationField"></div><label>Localisation de l’aliquote ouverte<select id="smTo" required></select></label>` : `<div class="stock-source-empty"><strong>Le volume individuel de cette préparation n’est pas défini ou aucune aliquote n’est disponible.</strong></div>`;
  const options = opened.map(({ prep, open }) => [open.id, `${open.label} · ${StockTracking.format(open.remainingVolume)} ${open.volumeUnit} restants · ${open.location || "—"} · ${prep.label}`]);
  if (action === "open_aliquot_moved") return stockSelect("smEntity", "Aliquote ouverte", options) + stockSelect("smTo", "Nouvelle localisation", inventoryLocations.map(place => [place, place]));
  return stockSelect("smEntity", "Aliquote ouverte", options) + `<label>Raison<select id="smDiscardReason" required><option>Reliquat non conservable</option><option>Contamination</option><option>Fin d’expérience</option><option>Erreur de préparation</option><option>Autre</option></select></label><label id="smDiscardOtherField" class="hidden">Précisez la raison<textarea id="smDiscardOther" rows="2" disabled></textarea></label>`;
}

function syncAliquotOpeningLocations(modal, item) {
  const aliquots = StockTracking.normalizeAliquots(item), prep = aliquots.preparations.find(row => row.id === modal.querySelector("#smEntity")?.value), host = modal.querySelector("#smAliquotLocationField"); if (!prep || !host) return;
  host.innerHTML = stockSelect("smFrom", "Localisation source", prep.locations.filter(row => row.quantity > 0).map(row => [row.location, `${row.location} · ${row.quantity} disponible${row.quantity > 1 ? "s" : ""}`]));
  const destination = modal.querySelector("#smTo"); if (destination) { const syncDestination=()=>{const source=host.querySelector("#smFrom")?.value||"",places=Array.from(new Set([source,...inventoryLocations].filter(Boolean)));destination.innerHTML=places.map(place => `<option value="${escapeHtml(place)}">${escapeHtml(place)}</option>`).join("");destination.value=source;};host.querySelector("#smFrom")?.addEventListener("change",syncDestination);syncDestination(); }
}
function renderStockManagerFields() {
  const modal = document.querySelector("#stockManagerDialog"), item = items.find(row => row.id === modal.querySelector("#stockManagerItemId").value); if (!item) return;
  const action = modal.querySelector("#stockManagerAction").value, tracking = StockTracking.normalizeTracking(item), openUnit = StockTracking.trackingLevel(tracking), aliquots = StockTracking.normalizeAliquots(item), locations = inventoryLocations.map(place => [place,place]), containers = tracking.openContainers.filter(row => row.status === "open").map(row => { const remaining=StockTracking.fromBaseQuantity(row.remaining,tracking); return [row.id,`${row.label} · ${row.location} · ${StockTracking.format(remaining)} ${StockTracking.plural(remaining,openUnit.singular,openUnit.plural)}`]; }), preps = aliquots.preparations.filter(row => row.status === "active").map(row => [row.id,`${row.label} · ${StockTracking.remainingAliquots(row)} restantes`]); let html="";
  if (action === "received") html = tracking.mode === "simple" ? stockNumber("smQuantity",`Quantité reçue — ${item.unit}`) : stockSelect("smTo","Localisation",locations)+stockNumber("smQuantity","Nombre de contenants fermés");
  else if (action === "container_opened") html = stockSelect("smFrom","Localisation du contenant fermé",tracking.closedByLocation.filter(row=>row.quantity).map(row=>[row.location,`${row.location} (${row.quantity})`]));
  else if (action === "consumed" && tracking.mode === "simple") html = stockNumber("smQuantity",`Quantité utilisée — ${item.unit}`,StockTracking.simpleRawAvailable(item));
  else if (action === "consumed") html = (containers.length ? stockSelect("smEntity","Contenant à utiliser en premier",containers) : `<input id="smEntity" type="hidden" value="">`)+stockNumber("smQuantity",`Quantité utilisée — ${openUnit.plural}`);
  else if (action === "stock_recounted" && tracking.mode === "simple") html=`<div class="stock-source-summary"><span>Stock enregistré</span><strong>${StockTracking.format(item.quantity)} ${escapeHtml(item.unit)}</strong><small>La quantité saisie remplacera le stock enregistré.</small></div>${stockNumber("smQuantity",`Stock physique compté — ${item.unit}`)}`;
  else if (action === "stock_recounted") { const recountLocations=Array.from(new Set([item.location,...getItemLocations(item),...tracking.closedByLocation.map(row=>row.location),...inventoryLocations].filter(Boolean))),outer=tracking.packagingLevels[0],feminine=isLikelyFeminineUnit(outer.singular),closed=feminine?"fermées":"fermés",registered=feminine?"enregistrées":"enregistrés",counted=feminine?"comptées":"comptés";html=`<div class="stock-source-summary"><span>Comptage absolu</span><strong>${StockTracking.totalClosed(tracking)} ${escapeHtml(outer.plural)} ${closed} ${registered}</strong><small>Le nombre saisi remplacera uniquement les contenants ${closed} de la localisation choisie. Les contenants ouverts resteront inchangés.</small></div>${stockSelect("smFrom","Localisation",recountLocations.map(place=>{const current=tracking.closedByLocation.find(row=>row.location===place)?.quantity||0;return[place,`${place} — ${current} ${outer.plural} ${closed}`]}))}${stockNumber("smQuantity",`Nombre de ${outer.plural} ${closed} ${counted}`)}`; }
  else if (action === "recounted") html=renderContainerRecountFields(item);
  else if (action === "moved") html = stockSelect("smEntityType","Type",[["closed","Contenant fermé"],["container","Contenant ouvert"]])+stockSelect("smFrom","Origine",locations)+stockSelect("smTo","Destination",locations)+stockNumber("smQuantity","Quantité (1 pour un contenant ouvert)");
  else if (action === "aliquots_prepared") html = renderAliquotPreparationFields(item, locations);
  else if (action === "aliquots_consumed") html = renderAliquotUseFields(item);
  else if (["aliquot_opened","open_aliquot_moved","open_aliquot_discarded"].includes(action)) html = renderOpenAliquotActionFields(item, action);
  else if (action==="preparation_recounted") html=renderPreparationCorrectionFields(item);
  else if (["aliquots_moved","preparation_finished"].includes(action)) html = stockSelect("smEntity","Préparation",preps)+stockSelect("smFrom","Localisation",locations)+(action==="aliquots_moved"?stockSelect("smTo","Destination",locations):"")+(action!=="preparation_finished"?stockNumber("smQuantity","Nombre d’aliquotes"):"");
  modal.querySelector("#stockManagerFields").innerHTML = html;
  const executeButton = modal.querySelector("#executeStockManagerBtn"), noSource = action === "aliquots_prepared" && !getAliquotPreparationSources(item).groups.length;
  executeButton.disabled = noSource;
  if (action === "aliquots_prepared" && !noSource) {
    syncAliquotSourceEntity(modal, item);
    bindHierarchySelectors(modal);
    modal.querySelector("#smSourceType")?.addEventListener("change", () => syncAliquotSourceEntity(modal, item));
    setAdditionalAliquotLocationVisible(modal, false);
    modal.querySelector("#addAliquotLocationBtn")?.addEventListener("click", () => setAdditionalAliquotLocationVisible(modal, true));
    modal.querySelector("#removeAliquotLocationBtn")?.addEventListener("click", () => setAdditionalAliquotLocationVisible(modal, false));
    const sourceQuantity=modal.querySelector("#smSourceQuantity"),created=modal.querySelector("#smCreated"),volume=modal.querySelector("#smVolume"),notice=modal.querySelector("#smSourceQuantityNotice");
    const recalculate=()=>{const count=StockTracking.parseLocalizedNumber(created?.value),perAliquot=StockTracking.parseLocalizedNumber(volume?.value);if(Number.isFinite(count)&&Number.isFinite(perAliquot)){sourceQuantity.value=Number((count*perAliquot).toFixed(6));sourceQuantity.dataset.manual="false";notice.textContent="Quantité source actualisée à partir du nombre et du volume final.";}};
    sourceQuantity?.addEventListener("input",()=>{sourceQuantity.dataset.manual="true";notice.textContent="Valeur corrigée manuellement ; elle sera conservée à la validation.";});created?.addEventListener("input",recalculate);volume?.addEventListener("input",recalculate);
  }
  if (action === "aliquots_consumed") { const preferred=modal.dataset.entityId, opened=getActiveOpenAliquots(aliquots); if (preferred && opened.some(({open})=>open.id===preferred)) modal.querySelector("#smAliquotUseMode").value="open_existing"; syncAliquotUseFields(modal,item); modal.querySelector("#smAliquotUseMode")?.addEventListener("change",()=>syncAliquotUseFields(modal,item)); }
  if (action === "aliquot_opened") { syncAliquotOpeningLocations(modal,item); modal.querySelector("#smEntity")?.addEventListener("change",()=>syncAliquotOpeningLocations(modal,item)); }
  if (action === "open_aliquot_discarded") modal.querySelector("#smDiscardReason")?.addEventListener("change", event => { const other=modal.querySelector("#smDiscardOtherField"), input=modal.querySelector("#smDiscardOther"), visible=event.target.value==="Autre"; other.classList.toggle("hidden",!visible); input.disabled=!visible; input.required=visible; if(!visible)input.value=""; });
  if(action==="recounted"&&tracking.mode==="containers")bindContainerRecountControls(modal,item,tracking);
  if(action==="preparation_recounted"){syncPreparationCorrectionFields(modal,item);modal.querySelector("#smEntity")?.addEventListener("change",()=>syncPreparationCorrectionFields(modal,item));}
  modal.querySelector("[data-empty-stock-action]")?.addEventListener("click", () => { modal.close(); if (StockTracking.normalizeTracking(item).mode === "simple") openStockModal(item.id); else { openStockManager(item.id); const nextModal = document.querySelector("#stockManagerDialog"); nextModal.querySelector("#stockManagerAction").value = "received"; renderStockManagerFields(); } });
}

function validateAliquotManagerFields(modal,action){const error=modal.querySelector("#stockManagerError"),set=(control,message,valid)=>{control?.setCustomValidity(valid?"":message);return valid;};let valid=true;if(action==="aliquots_prepared"){const positive=[ ["#smCreated","Le nombre d’aliquotes doit être strictement positif."],["#smVolume","Le volume d’une aliquote doit être strictement positif."],["#smSourceQuantity","La quantité source utilisée doit être strictement positive."],["#smLocationQuantity","Le nombre d’aliquotes attribué doit être strictement positif."]];positive.forEach(([selector,message])=>{const control=modal.querySelector(selector),ok=StockTracking.parseLocalizedNumber(control?.value)>0;valid=set(control,message,ok)&&valid;});["#smVolumeUnit","#smConcentrationUnit"].forEach(selector=>{const control=modal.querySelector(selector),ok=Boolean(control?.value.trim());valid=set(control,"Ce champ est obligatoire.",ok)&&valid;});const concentration=modal.querySelector("#smConcentration"),concentrationOk=StockTracking.parseLocalizedNumber(concentration?.value)>0;valid=set(concentration,"La concentration doit être strictement positive.",concentrationOk)&&valid;const source=modal.querySelector("#smSourceQuantity"),max=Number(source?.max);if(valid&&Number.isFinite(max)&&StockTracking.parseLocalizedNumber(source.value)>max){valid=set(source,"La quantité source dépasse la quantité disponible.",false);}}
if(action==="preparation_recounted"){["#smAvailableCount","#smVolume","#smVolumeUnit","#smConcentration","#smConcentrationUnit"].forEach(selector=>{const control=modal.querySelector(selector),numeric=control?.type==="number",ok=numeric?Number.isFinite(StockTracking.parseLocalizedNumber(control.value))&&StockTracking.parseLocalizedNumber(control.value)>=0:Boolean(control?.value.trim());valid=set(control,"Ce champ est obligatoire et doit être valide.",ok)&&valid;});}if(!valid){const invalid=modal.querySelector(":invalid");error.textContent=invalid?.validationMessage||"Veuillez compléter tous les champs obligatoires.";error.classList.remove("hidden");invalid?.focus();}return valid;}

async function submitStockManager(event) {
  event.preventDefault(); const modal = event.currentTarget.closest("dialog"), button = modal.querySelector("#executeStockManagerBtn"), errorBox = modal.querySelector("#stockManagerError");
  if (button.disabled) return;
  const reason=modal.querySelector("#stockManagerComment");reason.setCustomValidity(reason.value.trim()?"":"Veuillez préciser le motif de la modification afin d’assurer la traçabilité.");
  if(!validateAliquotManagerFields(modal,modal.querySelector("#stockManagerAction")?.value))return;
  if (modal.querySelector("#stockManagerAction")?.value === "aliquots_prepared" && !validateAliquotDistribution(modal)) return;
  if (!event.currentTarget.reportValidity()) { errorBox.textContent=reason.validationMessage;errorBox.classList.remove("hidden");return; }
  const value = id => modal.querySelector(`#${id}`)?.value || "", numeric = id => StockTracking.parseLocalizedNumber(value(id)), action = value("stockManagerAction"), operationId = StockTracking.id("operation"), comment = normalizeMultilineText(value("stockManagerComment")), operation = { operationId, type: action, entityId:value("smEntity"), entityType: action.startsWith("aliquot") || action.startsWith("preparation") ? "preparation" : "container", quantity:numeric("smQuantity"), fromLocation:value("smFrom"), toLocation:value("smTo"), comment, correctionReason:["container_finished","preparation_finished"].includes(action)?comment:"" };
  const sourceItem = items.find(row => row.id === value("stockManagerItemId")), sourceTracking = StockTracking.normalizeTracking(sourceItem || {});
  if(action==="stock_recounted"){operation.type="recounted";operation.entityType=sourceTracking.mode==="containers"?"closed":"item";}
  if (action === "recounted" && sourceTracking.mode === "containers") {
    const changes=Array.from(modal.querySelectorAll(".container-recount-row")).map(row=>{
      const status=row.querySelector("[data-recount-status]").value,unitKey=row.querySelector("[data-recount-unit]").value,location=row.querySelector("[data-recount-location]").value,quantity=StockTracking.parseLocalizedNumber(row.querySelector("[data-recount-quantity]").value),levelIndex=sourceTracking.packagingLevels.findIndex(level=>level.key===unitKey),factor=sourceTracking.packagingLevels.slice(levelIndex+1).reduce((value,level)=>value*level.contains,1),capacity=Number(row.dataset.capacityBase)/factor;
      const changed=status!==row.dataset.originalStatus||unitKey!==row.dataset.originalUnit||location!==row.dataset.originalLocation||Math.abs(quantity-Number(row.dataset.originalQuantity))>1e-8;
      return changed?{containerId:row.dataset.containerId,expectedVersion:Number(row.dataset.version),status,unitKey,location,quantity,capacity,beforeStatus:row.dataset.originalStatus,isNew:row.dataset.newContainer==="true"}:null;
    }).filter(Boolean);
    changes.forEach(change=>{const row=modal.querySelector(`.container-recount-row[data-container-id="${CSS.escape(change.containerId)}"]`),group=row?.querySelector("[data-hierarchy-prefix]");if(group){change.roomId=group.querySelector("[data-hierarchy-room]").value;change.locationId=group.querySelector("[data-hierarchy-location]").value;change.sublocationId=group.querySelector("[data-hierarchy-sublocation]").value;}});
    if(!changes.length){errorBox.textContent="Aucun contenant n’a été modifié.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>!Number.isFinite(change.quantity)||change.quantity<0||!Number.isFinite(change.capacity)||change.capacity<=0)){errorBox.textContent="Chaque quantité doit être positive ou nulle et chaque capacité doit être strictement positive.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>change.quantity>change.capacity)){errorBox.textContent="La quantité actuelle ou restante ne peut pas dépasser la capacité totale.";errorBox.classList.remove("hidden");return;}
    if(changes.some(change=>change.isNew&&change.status==="open"&&change.quantity===0)){errorBox.textContent="Un nouveau contenant ouvert doit avoir une quantité restante positive.";errorBox.classList.remove("hidden");return;}
    for(const change of changes){if(change.beforeStatus==="open"&&change.status==="open"&&change.quantity===0){if(!window.confirm(`${change.containerId} ne contient plus de stock. Le marquer comme terminé ?`))return;change.status="finished";}}
    const confirmations=[];
    changes.forEach(change=>{
      if(!change.isNew&&change.beforeStatus!==change.status)confirmations.push(`${change.containerId} : confirmer la transition ${change.beforeStatus==="closed"?"Fermé":"Ouvert"} → ${change.status==="closed"?"Fermé":change.status==="open"?"Ouvert":"Terminé"}.`);
    });
    if(confirmations.length&&!window.confirm(`${confirmations.join("\n")}\n\nEnregistrer ces modifications ?`))return;
    operation.type="containers_recounted";operation.entityType="containers";operation.changes=changes;
  }
  if (action === "consumed" && sourceTracking.mode === "containers") {
    const quantity=numeric("smQuantity"), openUnit=StockTracking.trackingLevel(sourceTracking), required=StockTracking.toBaseQuantity(quantity,sourceTracking), opened=sourceTracking.openContainers.filter(row=>row.status==="open"&&row.remaining>0), openAvailable=opened.reduce((sum,row)=>sum+row.remaining,0), closedCount=StockTracking.totalClosed(sourceTracking), totalAvailable=openAvailable+closedCount*StockTracking.capacity(sourceTracking);
    if (!(quantity>0) || required>totalAvailable) { errorBox.textContent="Aucun stock ouvert ou fermé suffisant ne permet d’enregistrer cette utilisation."; errorBox.classList.remove("hidden"); return; }
    const needsOpen=required>openAvailable, finishes=required>=openAvailable&&opened.length>0 || opened.some(row=>row.id===operation.entityId&&required>=row.remaining);
    const messages=[];
    if(needsOpen)messages.push(`Aucun contenant ouvert suffisant n’est disponible. Un contenant fermé sera ouvert automatiquement avant d’enregistrer cette utilisation.`);
    if(finishes)messages.push(`Cette utilisation consommera tout le stock restant d’au moins un contenant, qui sera automatiquement marqué comme terminé.`);
    if(messages.length&&!window.confirm(`${messages.join("\n\n")}\n\nContinuer ?`))return;
    operation.entityType="containers_auto";
  }
  if (action === "moved") { operation.entityType=value("smEntityType"); if (operation.entityType === "container") { const item=items.find(row=>row.id===value("stockManagerItemId")); const candidate=StockTracking.normalizeTracking(item).openContainers.find(row=>row.location===operation.fromLocation&&row.status==="open"); if(!candidate) { errorBox.textContent="Aucun contenant ouvert dans cette localisation."; errorBox.classList.remove("hidden"); return; } operation.entityId=candidate.id; operation.quantity=1; } }
  if (action === "aliquots_prepared") Object.assign(operation, buildAliquotPreparationOperation(modal, items.find(row => row.id === value("stockManagerItemId"))));
  const sourceAliquots = StockTracking.normalizeAliquots(sourceItem || {});
  if(action==="preparation_recounted"){const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")),group=modal.querySelector("[data-hierarchy-prefix='preparation-correction']");Object.assign(operation,{type:"preparation_corrected",entityId:prep?.id,entityType:"preparation",expectedVersion:prep?.version,availableCount:numeric("smAvailableCount"),volume:numeric("smVolume"),volumeUnit:value("smVolumeUnit"),concentration:numeric("smConcentration"),concentrationUnit:value("smConcentrationUnit"),roomId:group?.querySelector("[data-hierarchy-room]").value||"",locationId:group?.querySelector("[data-hierarchy-location]").value||"",sublocationId:group?.querySelector("[data-hierarchy-sublocation]").value||"",location:value("smPrepLocation")});}
  if (action === "aliquots_consumed") {
    const mode=value("smAliquotUseMode");
    if (mode === "whole") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); Object.assign(operation,{type:"aliquots_consumed",entityId:value("smEntity"),entityType:"preparation",expectedVersion:prep?.version}); }
    else if (mode === "open_new") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); Object.assign(operation,{type:"open_aliquot_consumed",entityId:value("smEntity"),entityType:"preparation",openNew:true,expectedVersion:prep?.version}); }
    else { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===value("smEntity")); Object.assign(operation,{type:"open_aliquot_consumed",entityId:value("smEntity"),entityType:"open_aliquot",expectedVersion:pair?.open.version}); }
  }
  if (action === "aliquot_opened") { const prep=sourceAliquots.preparations.find(row=>row.id===value("smEntity")); operation.expectedVersion=prep?.version; operation.entityType="preparation"; }
  if (["open_aliquot_moved","open_aliquot_discarded"].includes(action)) { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===value("smEntity")); operation.expectedVersion=pair?.open.version; operation.entityType="open_aliquot"; if(action==="open_aliquot_discarded"){const reason=value("smDiscardReason"),other=normalizeMultilineText(value("smDiscardOther"));operation.correctionReason=reason==="Autre"?other:reason;} }
  button.disabled=true; errorBox.classList.add("hidden");
  const execute = async () => { try { await executeAtomicStockOperation(value("stockManagerItemId"), operation); modal.close(); render(); } catch (error) { errorBox.textContent=error.message || String(error); errorBox.classList.remove("hidden"); } finally { button.disabled=false; } };
  if (action === "open_aliquot_discarded") { const pair=getActiveOpenAliquots(sourceAliquots).find(({open})=>open.id===operation.entityId); button.disabled=false; openDeleteConfirmation({title:"Jeter le reliquat",message:`${StockTracking.format(pair?.open.remainingVolume || 0)} ${pair?.open.volumeUnit || ""} seront définitivement retirés du stock disponible.`,confirmText:"Jeter le reliquat",trigger:button,onConfirm:execute}); return; }
  await execute();
}

async function executeAtomicStockOperation(itemId, operation) {
  const storage=window.ExadexGithubStorage, config=storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) throw new Error("La sauvegarde GitHub en écriture est requise pour une opération de stock avancée.");
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving=true; renderAlerts();
  try {
    const result=await storage.mutateSharedData(operation.operationId, latest => {
      const state=createSharedState(latest,{includeBootstrap:false}), index=state.inventoryItems.findIndex(row=>row.id===itemId); if(index<0) throw new Error("Cet item n’existe plus.");
      const sourceItem=state.inventoryItems[index],previousQuantity=StockTracking.available(sourceItem),applied=StockTracking.apply(sourceItem,{...operation},{name:currentName,emoji:userIcons[currentName]||""}),events=applied.events||[applied.event],isRecount=["recounted","containers_recounted"].includes(operation.type),currentQuantity=StockTracking.available(applied.item),historyUnit=StockTracking.normalizeTracking(applied.item).mode==="containers"?StockTracking.normalizeTracking(applied.item).packagingLevels[0].plural:applied.item.unit,difference=Number((currentQuantity-previousQuantity).toFixed(6)),note=normalizeMultilineText(operation.comment||"");
      state.inventoryItems[index]={...sourceItem,quantity:applied.item.quantity,stockTracking:applied.item.stockTracking,aliquotTracking:applied.item.aliquotTracking,locations:applied.item.locations,location:applied.item.location};
      state.stockMovements=Array.isArray(state.stockMovements)?state.stockMovements:[];
      state.stockMovements.push(...events);
      state.stockOperations=Array.isArray(state.stockOperations)?state.stockOperations:[];
      state.stockOperations.push({operationId:operation.operationId,itemId,at:applied.event.timestamp,type:operation.type});
      state.history=Array.isArray(state.history)?state.history:[];
      state.history.unshift(isRecount?{id:`history-${operation.operationId}`,operationId:operation.operationId,date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date(applied.event.timestamp)),action:"Comptage / Ajustement",detail:`${applied.event.userName} · ${applied.item.name} · Stock précédent : ${StockTracking.format(previousQuantity)} ${historyUnit} · Stock compté : ${StockTracking.format(currentQuantity)} ${historyUnit} · Écart : ${difference>0?"+":""}${StockTracking.format(difference)} ${historyUnit}${note?` · Note : ${note}`:""}`,user:applied.event.userName,itemId,type:"recounted",previousQuantity,countedQuantity:currentQuantity,difference,unit:historyUnit,note}:{id:`history-${operation.operationId}`,operationId:operation.operationId,date:new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"short"}).format(new Date(applied.event.timestamp)),action:"Stock mis à jour",detail:`${applied.event.userName} · ${applied.event.type} · ${applied.item.name}${note?` · ${note}`:""}`,user:applied.event.userName,itemId});
      state.updatedAt=applied.event.timestamp;
      return state;
    });
    sharedDataSha=result.sha; sharedDataMode="github-write"; sharedDataHasUnsavedChanges=false; sharedDataRemoteReady=true; sharedDataLastError=""; applySharedState(result.data); initializeSharedSaveCoordinator(result.data,result.sha);
  } finally { sharedDataIsSaving=false; renderAlerts(); }
}

function isSeedItemId(id) {
  return seedBaseItems.some(item => item.id === id);
}

function requestItemDeletion() {
  const id = fields.itemId.value;
  requestItemDeletionById(id);
}

function requestItemDeletionById(id, options = {}) {
  const item = items.find(entry => entry.id === id);
  if (!item) throw new Error("Cet item n’existe plus.");
  openDeleteConfirmation({
    title: `Supprimer définitivement l’item “${item.name}” ?`,
    message: `Cette suppression utilise le workflow de l’inventaire et peut concerner son stock, ses contenants, ses aliquotes, ses commandes ou autres dépendances associées. Cette action est irréversible.`,
    confirmText: "Supprimer l’item",
    trigger: options.trigger,
    onConfirm: () => {
      deleteItem(id);
      if (typeof options.onDeleted === "function") options.onDeleted(item);
    }
  });
}

async function deleteItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) throw new Error("Cet item n’existe plus.");

  const storage = window.ExadexGithubStorage;
  const config = storage?.getConfig?.();
  if (!storage?.mutateSharedData || !config?.owner || !config?.repo || !config?.token) {
    throw new Error("La sauvegarde GitHub en écriture est requise pour supprimer un item.");
  }
  await flushPendingSharedDataBeforeAtomicOperation();
  sharedDataIsSaving = true;
  renderAlerts();
  try {
    const result = await storage.mutateSharedData(`item-delete-${id}-${Date.now()}`, latest => {
      const state = createSharedState(latest, { includeBootstrap: false });
      state.inventoryItems = (Array.isArray(state.inventoryItems) ? state.inventoryItems : []).filter(entry => entry.id !== id);
      state.history = Array.isArray(state.history) ? state.history : [];
      state.history.unshift({
        date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
        user: currentName,
        action: "Item supprimé",
        detail: `${currentName} a supprimé ${item.name} de l'inventaire.`
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
    dialog.close();
    if (selectedItemId === id) selectedItemId = null;
    render();
  } finally {
    sharedDataIsSaving = false;
    renderAlerts();
  }
}

function patchStoredItem(id, patch) {
  const current = items.find(entry => entry.id === id);
  if (!current) return null;

  const nextPatch = typeof patch === "function" ? patch(current) : patch;
  if (!nextPatch || typeof nextPatch !== "object") return current;

  if (isSeedItemId(id)) {
    const index = items.findIndex(entry => entry.id === id);
    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...nextPatch,
        source: "seed"
      };
    }
  } else {
    const index = items.findIndex(entry => entry.id === id);

    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...nextPatch,
        source: "web"
      };
    } else {
      items.unshift({
        ...current,
        ...nextPatch,
        source: "web"
      });
    }
  }

  return items.find(entry => entry.id === id) || null;
}

// fonction pour créer un nouvel item dans l'inventaire partagé, sans passer par le formulaire
function createStoredItem(itemData) {
  const now = new Date();

  const newItem = {
    id: `itm-${Date.now()}`,
    name: itemData.name?.trim() || "",
    category: itemData.category?.trim() || inventoryCategories[0],
    quantity: Number(itemData.quantity ?? 0),
    unit: itemData.unit?.trim() || "",
    minStock: Number(itemData.minStock ?? 0),
    locations: Array.isArray(itemData.locations)
      ? itemData.locations
      : itemData.location
        ? [itemData.location]
        : [],
    location: Array.isArray(itemData.locations)
      ? (itemData.locations[0] || "")
      : (itemData.location || ""),
    tags: Array.isArray(itemData.tags) ? itemData.tags : [],
    notes: normalizeMultilineText(itemData.notes),
    references: normalizeReferences(itemData.references),
    createdAtRaw: now.toISOString(),
    createdAt: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(now),
    source: "web"
  };

  items.unshift(newItem);
  return items.find(entry => entry.id === newItem.id) || newItem;
}

async function saveStockUpdate() {
  if (!stockForm.reportValidity()) return;

  const id = stockFields.stockItemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const amount = StockTracking.parseLocalizedNumber(stockFields.stockAmount.value);
  const direction = stockFields.stockAction.value;
  if(!Number.isFinite(amount)||amount<0||(direction!=="recounted"&&amount<=0)){
    stockFields.stockAmount.setCustomValidity(direction==="recounted"?"Le stock compté doit être positif ou nul.":"La quantité doit être strictement positive.");
    stockForm.reportValidity();
    stockFields.stockAmount.setCustomValidity("");
    return;
  }
  const title = stockFields.stockTitle.value.trim();
  const note = normalizeMultilineText(stockFields.stockNotes.value);
  const operation={operationId:StockTracking.id("operation"),type:direction==="used"?"consumed":direction,entityType:"item",quantity:amount,comment:[title,note].filter(Boolean).join(" · ")};
  const button=document.querySelector("#saveStockBtn"),errorBox=document.querySelector("#stockUpdateError");
  button.disabled=true;errorBox?.classList.add("hidden");
  try{await executeAtomicStockOperation(id,operation);stockDialog.close();render();}
  catch(error){if(errorBox){errorBox.textContent=error.message||String(error);errorBox.classList.remove("hidden");}}
  finally{button.disabled=false;}
}
