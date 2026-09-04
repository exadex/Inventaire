// Fonctions utilitaires partagees : statuts de stock, formats, migrations de donnees.
// Ce fichier ne contient que des fonctions : le demarrage est dans bootstrap.js.

const STOCK_WARNING_MULTIPLIER = 1.5;
const ZERO_MINIMUM_HEALTHY_THRESHOLD = 0.5;
const STOCK_STATUS_EPSILON = 1e-9;

function parseStockMinimum(value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getStockStatus(item) {
  const available = window.StockTracking ? StockTracking.available(item) : Number(item?.quantity);
  const currentStock = Number.isFinite(available) ? available : 0;
  const minimum = parseStockMinimum(item?.minStock);
  if (minimum === null) return { status: "undefined", currentStock, minimum: null, healthyThreshold: null, differenceFromMinimum: null, ratio: null };
  const healthyThreshold = minimum === 0 ? ZERO_MINIMUM_HEALTHY_THRESHOLD : minimum * STOCK_WARNING_MULTIPLIER;
  const tolerance = STOCK_STATUS_EPSILON * Math.max(1, Math.abs(currentStock), Math.abs(minimum), Math.abs(healthyThreshold));
  const status = currentStock <= minimum ? "critical" : currentStock + tolerance >= healthyThreshold ? "ok" : "warning";
  return { status, currentStock, minimum, healthyThreshold, differenceFromMinimum: currentStock - minimum, ratio: healthyThreshold > 0 ? currentStock / healthyThreshold : null };
}

function itemStatus(item) {
  return getStockStatus(item).status;
}

function stockLevelPercent(item) {
  const result=getStockStatus(item);if(result.status==="undefined")return 0;return Math.max(0,Math.min(100,Math.round((result.currentStock/result.healthyThreshold)*100)));
}

function statusLabel(status) {
  return { ok: "Stock sain", warning: "Attention", critical: "Critique", undefined: "Seuil non défini" }[status] || "Seuil non défini";
}

function stockSummaryStatusLabel(stockStatus) {
  if (stockStatus.currentStock <= 0) return "Stock épuisé";
  return { ok:"Stock sain", warning:"Stock faible", critical:"Stock critique", undefined:"Seuil non défini" }[stockStatus.status] || "Seuil non défini";
}

function statusLabelExperiment(status) {
  return { draft: "Brouillon", running: "En cours", completed: "Terminé" }[normalizeExperimentStatus(status)] || status || "—";
}

function normalizeExperimentStatus(status) {
  const value = normalizeSearch(status || "").replace(/\s+/g, "_");
  return { draft:"draft", brouillon:"draft", running:"running", in_progress:"running", en_cours:"running", completed:"completed", complete:"completed", termine:"completed" }[value] || status;
}


function addHistory(action, detail) {
  history.unshift({
    date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    user: currentName,
    action,
    detail
  });
}

function createSafeItemId(prefix = "itm-web") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLocationCatalog(rawCatalog) {
  const raw = rawCatalog && typeof rawCatalog === "object" ? rawCatalog : {};
  const locations = new Map(INITIAL_INVENTORY_LOCATION_CATALOG.locations.map(row => [row.id, { ...row }]));
  (Array.isArray(raw.locations) ? raw.locations : []).forEach(row => {
    if (!row?.id || !FIXED_INVENTORY_ROOMS.some(room => room.id === row.roomId)) return;
    locations.set(row.id, { id: String(row.id), roomId: String(row.roomId), name: String(row.name || "").trim(), icon: row.icon || "📍", ...(Number.isFinite(Number(row.order)) ? { order: Number(row.order) } : {}) });
  });
  const sublocations = new Map();
  (Array.isArray(raw.sublocations) ? raw.sublocations : []).forEach(row => {
    if (!row?.id || !locations.has(row.locationId)) return;
    sublocations.set(row.id, { id: String(row.id), locationId: String(row.locationId), name: String(row.name || "").trim(), ...(Number.isFinite(Number(row.order)) ? { order: Number(row.order) } : {}) });
  });
  return { locations: [...locations.values()].filter(row => row.name), sublocations: [...sublocations.values()].filter(row => row.name) };
}

function stablePlacementId(itemId, value, index) {
  let hash = 2166136261;
  for (const char of `${itemId}|${value}|${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `placement-legacy-${(hash >>> 0).toString(36)}`;
}

function migrateItemPlacements(item, itemId) {
  if (Array.isArray(item?.placements) && item.placements.length) {
    const seen = new Set();
    return item.placements.map((row, index) => ({
      id: String(row?.id || stablePlacementId(itemId, `${row?.roomId}|${row?.locationId}|${row?.sublocationId}`, index)),
      roomId: row?.roomId || null,
      locationId: row?.locationId || null,
      sublocationId: row?.sublocationId || null,
      ...(row?.legacyValue ? { legacyValue: String(row.legacyValue) } : {})
    })).filter(row => {
      const key = `${row.roomId}|${row.locationId}|${row.sublocationId}|${row.legacyValue || ""}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  const values = Array.from(new Set([...(Array.isArray(item?.locations) ? item.locations : []), item?.location].map(value => String(value || "").trim()).filter(Boolean)));
  return values.map((value, index) => {
    const canonical = legacyLocationMap[value] || value;
    const mapped = LEGACY_PLACEMENT_MAP[canonical];
    if (!mapped) {
      console.warn(`[Migration localisations] Valeur inconnue conservée pour l'item ${itemId}:`, value);
      return { id: stablePlacementId(itemId, value, index), roomId: null, locationId: null, sublocationId: null, legacyValue: value };
    }
    return { id: stablePlacementId(itemId, canonical, index), roomId: mapped[0], locationId: mapped[1], sublocationId: null };
  });
}

function migrateItems(itemList) {
  const safeList = Array.isArray(itemList) ? itemList : [];
  const seenIds = new Set();

  return safeList.map((item) => {
    const { maxStock, ...itemWithoutMaxStock } = item || {};
    let id = typeof item?.id === "string" ? item.id.trim() : "";

    if (!id || seenIds.has(id)) {
      id = createSafeItemId();
    }

    seenIds.add(id);

    const placements = migrateItemPlacements(item, id);
    const previousNames = Array.isArray(item?.locations) ? item.locations : [item?.location].filter(Boolean);
    const compatibilityNames = placements.map((placement, placementIndex) => {
      const location = INITIAL_INVENTORY_LOCATION_CATALOG.locations.find(row => row.id === placement.locationId);
      const room = FIXED_INVENTORY_ROOMS.find(row => row.id === placement.roomId);
      return location?.name || room?.name || placement.legacyValue || previousNames[placementIndex] || "";
    }).filter(Boolean);
    return {
      ...itemWithoutMaxStock,
      id,
      category: inventoryCategories.includes(item?.category)
        ? item.category
        : legacyCategoryMap[item?.category] || inventoryCategories[0],
      placements,
      locations: compatibilityNames,
      location: compatibilityNames[0] || "",
      tags: Array.isArray(item?.tags) ? item.tags : [],
      references: normalizeReferences(item?.references)
    };
  });
}

// fonction pour conserver à la fois les items générés localement et ceux ajoutés par d'autres sur GitHub
function mergeItems(baseItems, storedItems) {
  const merged = new Map();

  baseItems.forEach(item => {
    merged.set(item.id, item);
  });

  storedItems.forEach(item => {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? { ...existing, ...item } : item);
  });

  return Array.from(merged.values());
}

function migrateExperiments(experimentList) {
  const safeList = Array.isArray(experimentList) ? experimentList : [];

  return safeList.map(experiment => ({
    ...experiment,
    status: ["draft", "running", "completed"].includes(experiment?.status)
      ? experiment.status
      : "draft",
    conditions: Math.max(1, Number(experiment?.conditions || 1)),
    replicates: Math.max(1, Number(experiment?.replicates || 1)),
    items: Array.isArray(experiment?.items) ? experiment.items : [],
    consumedItems: Array.isArray(experiment?.consumedItems) ? experiment.consumedItems : []
  }));
}

function normalizeClientCode(value) {
  const raw = String(value || "").trim();
  const compact = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s._\-\/\\]+/g, "");

  if (!compact) {
    return {
      raw,
      normalizedKey: "",
      canonicalCode: ""
    };
  }

  const match = compact.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return {
      raw,
      normalizedKey: compact,
      canonicalCode: compact
    };
  }

  const prefix = match[1];
  const numericValue = String(Number.parseInt(match[2], 10));
  const safeNumber = numericValue === "NaN" ? match[2].replace(/^0+/, "") || "0" : numericValue;

  return {
    raw,
    normalizedKey: `${prefix}${safeNumber}`,
    canonicalCode: `${prefix}${safeNumber.padStart(3, "0")}`
  };
}

function createClientRecordFromCode(code, existing = {}) {
  const normalized = normalizeClientCode(code || existing.canonicalCode || existing.rawCode);
  const normalizedKey = existing.normalizedKey || normalized.normalizedKey;
  const canonicalCode = existing.canonicalCode || normalized.canonicalCode || normalized.raw || "CLIENT";

  return {
    ...existing,
    id: existing.id || `client-${normalizedKey || createSafeItemId("unknown-client")}`,
    normalizedKey,
    canonicalCode,
    studyType: existing.studyType === "rd" ? "rd" : "client",
    rawCodes: Array.from(new Set([
      ...(Array.isArray(existing.rawCodes) ? existing.rawCodes : []),
      existing.rawCode,
      normalized.raw
    ].filter(Boolean))),
    createdAtRaw: existing.createdAtRaw || new Date().toISOString(),
    updatedAtRaw: existing.updatedAtRaw || new Date().toISOString()
  };
}

function migrateClients(clientList = [], sampleList = []) {
  const merged = new Map();

  (Array.isArray(clientList) ? clientList : []).forEach(client => {
    const record = createClientRecordFromCode(client?.canonicalCode || client?.rawCode || client?.normalizedKey, client || {});
    if (!record.normalizedKey) return;
    merged.set(record.normalizedKey, record);
  });

  (Array.isArray(sampleList) ? sampleList : []).forEach(sample => {
    const normalized = normalizeClientCode(
      sample?.rawClientCode ||
      sample?.canonicalClientCode ||
      sample?.clientCode
    );
    if (!normalized.normalizedKey) return;

    const existing = merged.get(normalized.normalizedKey);
    const next = createClientRecordFromCode(normalized.raw || normalized.canonicalCode, {
      ...(existing || {}),
      normalizedKey: normalized.normalizedKey,
      canonicalCode: existing?.canonicalCode || normalized.canonicalCode,
      studyType: existing?.studyType || (sample?.studyType === "rd" ? "rd" : "client"),
      rawCodes: [
        ...(existing?.rawCodes || []),
        sample?.rawClientCode,
        sample?.clientCode,
        sample?.canonicalClientCode
      ].filter(Boolean)
    });
    merged.set(normalized.normalizedKey, next);
  });

  return Array.from(merged.values()).sort((a, b) =>
    String(a.canonicalCode || "").localeCompare(String(b.canonicalCode || ""), "fr")
  );
}

function getClientByNormalizedKey(normalizedKey) {
  if (!normalizedKey) return null;
  return clients.find(client => client.normalizedKey === normalizedKey) || null;
}

function ensureClientForCode(code, studyType = "client") {
  const normalizedStudyType = studyType === "rd" ? "rd" : "client";
  const normalized = normalizeClientCode(code);
  if (!normalized.normalizedKey) {
    return {
      id: "",
      rawCode: normalized.raw,
      normalizedKey: "",
      canonicalCode: "",
      studyType: normalizedStudyType
    };
  }

  const existing = getClientByNormalizedKey(normalized.normalizedKey);
  if (existing) {
    if (normalized.raw && !existing.rawCodes?.includes(normalized.raw)) {
      existing.rawCodes = [...(existing.rawCodes || []), normalized.raw];
      existing.updatedAtRaw = new Date().toISOString();
    }
    if (existing.studyType !== normalizedStudyType) {
      existing.studyType = normalizedStudyType;
      existing.updatedAtRaw = new Date().toISOString();
    }

    return {
      id: existing.id,
      rawCode: normalized.raw,
      normalizedKey: existing.normalizedKey,
      canonicalCode: existing.canonicalCode,
      studyType: existing.studyType
    };
  }

  const created = createClientRecordFromCode(normalized.raw || normalized.canonicalCode, { studyType: normalizedStudyType });
  clients = [...clients, created].sort((a, b) =>
    String(a.canonicalCode || "").localeCompare(String(b.canonicalCode || ""), "fr")
  );

  return {
    id: created.id,
    rawCode: normalized.raw,
    normalizedKey: created.normalizedKey,
    canonicalCode: created.canonicalCode,
    studyType: created.studyType
  };
}

function getClientForSample(sample) {
  if (!sample) return null;
  return clients.find(client => client.id === sample.clientId) ||
    getClientByNormalizedKey(sample.normalizedClientKey) ||
    getClientByNormalizedKey(normalizeClientCode(sample.clientCode).normalizedKey) ||
    null;
}

function getSampleStudyType(sample) {
  const client = getClientForSample(sample);
  if (client?.studyType) return client.studyType;
  return sample?.studyType === "rd" ? "rd" : "client";
}

function getStudyTypeLabel(sample) {
  return getSampleStudyType(sample) === "rd" ? "R&D" : "Client";
}

function hydrateClientIdentityForSamples(sampleList, clientList) {
  const registry = Array.isArray(clientList) ? clientList : [];

  return (Array.isArray(sampleList) ? sampleList : []).map(sample => {
    const normalizedKey = sample.normalizedClientKey ||
      normalizeClientCode(sample.rawClientCode || sample.clientCode).normalizedKey;
    const client = registry.find(entry => entry.id === sample.clientId) ||
      registry.find(entry => entry.normalizedKey === normalizedKey);

    if (!client) return sample;

    return {
      ...sample,
      clientId: client.id,
      normalizedClientKey: client.normalizedKey,
      canonicalClientCode: client.canonicalCode,
      clientCode: client.canonicalCode
    };
  });
}

function getSampleCanonicalClientCode(sample) {
  const client = getClientForSample(sample);
  if (client?.canonicalCode) return client.canonicalCode;
  return sample?.canonicalClientCode ||
    normalizeClientCode(sample?.rawClientCode || sample?.clientCode).canonicalCode ||
    sample?.clientCode ||
    "Client inconnu";
}

function getSimilarClientSuggestion(rawCode) {
  const normalized = normalizeClientCode(rawCode);
  if (!normalized.normalizedKey) return "";
  if (getClientByNormalizedKey(normalized.normalizedKey)) return "";

  const normalizedPrefix = normalized.normalizedKey.match(/^([A-Z]+)/)?.[1] || "";
  if (!normalizedPrefix) return "";

  const similar = clients.find(client => {
    const clientPrefix = String(client.normalizedKey || "").match(/^([A-Z]+)/)?.[1] || "";
    if (clientPrefix !== normalizedPrefix) return false;
    return client.normalizedKey !== normalized.normalizedKey;
  });

  return similar?.canonicalCode || "";
}

function getSelectedSampleStudyType() {
  return document.querySelector('input[name="sampleStudyType"]:checked')?.value === "rd" ? "rd" : "client";
}

function syncSampleStudyTypeUI() {
  const studyType = getSelectedSampleStudyType();
  const label = studyType === "rd" ? "Code R&D" : "Code client";
  const labelEl = document.querySelector("#sampleClientCodeLabel");
  if (labelEl) labelEl.textContent = label;
  updateClientCodeHint();
}

function updateClientCodeHint() {
  const hint = document.querySelector("#sampleClientCodeHint");
  if (!hint) return;

  const normalized = normalizeClientCode(sampleFields.sampleClientCode.value);
  if (!normalized.normalizedKey) {
    hint.textContent = "";
    return;
  }

  const selectedStudyType = getSelectedSampleStudyType();
  const existing = getClientByNormalizedKey(normalized.normalizedKey);
  if (existing) {
    if (existing.studyType && existing.studyType !== selectedStudyType) {
      const existingLabel = existing.studyType === "rd" ? "R&D" : "client";
      hint.textContent = `Attention : ${existing.canonicalCode} est déjà utilisé comme étude ${existingLabel}.`;
      return;
    }
    hint.textContent = `Code reconnu : ${existing.canonicalCode}`;
    return;
  }

  const suggestion = getSimilarClientSuggestion(sampleFields.sampleClientCode.value);
  hint.textContent = suggestion
    ? `Nouveau code. Code proche existant : ${suggestion}`
    : `Nouveau code : ${normalized.canonicalCode}`;
}

function migrateClientSamples(sampleList) {
  const safeList = Array.isArray(sampleList) ? sampleList : [];
  const seenIds = new Set();

  return safeList.map(sample => {
    let id = typeof sample?.id === "string" ? sample.id.trim() : "";
    if (!id || seenIds.has(id)) {
      id = createSafeItemId("sample");
    }
    seenIds.add(id);

    const type = sample?.type === "created_sample" ? "created_sample" : "client_product";
    const mappedCategory = clientSampleCategoryAliases[sample?.category] || sample?.category;
    const category = clientSampleCategories.includes(mappedCategory)
      ? mappedCategory
      : (type === "created_sample" ? String(sample?.category || clientSampleCategories[0]) : "");
    const historicalUnit = String(sample?.measureUnit || sample?.unit || "").trim();
    const legacyArnQiazol = category === "ARN"
      ? (typeof sample?.arnQiazol === "boolean" ? sample.arnQiazol : historicalUnit === "µL" ? false : true)
      : null;
    const legacyArnBead = category === "ARN" ? Boolean(legacyArnQiazol && sample?.arnBead) : null;
    const measureUnit = type === "created_sample"
      ? (historicalUnit || getCreatedSampleUnit(category, legacyArnQiazol !== false))
      : (sample?.unit || "");
    const canonicalLocation = inventoryLocations.includes(sample?.location)
      ? sample.location
      : legacyLocationMap[sample?.location] || inventoryLocations[0];
    const existingPlacement = sample?.roomId
      ? {
          roomId: String(sample.roomId),
          locationId: sample.locationId ? String(sample.locationId) : null,
          sublocationId: sample.sublocationId ? String(sample.sublocationId) : null
        }
      : null;
    const mappedPlacement = LEGACY_PLACEMENT_MAP[canonicalLocation];
    const placement = existingPlacement || (mappedPlacement
      ? { roomId: mappedPlacement[0], locationId: mappedPlacement[1], sublocationId: null }
      : { roomId: null, locationId: null, sublocationId: null });
    // existingPlacement provient d'un enregistrement déjà migré : son "location" a été
    // résolu via placementDisplayName au moment de la sauvegarde, donc pas besoin de
    // relire le catalogue ici (createSharedState appelle cette fonction avant que la
    // variable globale sharedState ne soit initialisée).
    const location = existingPlacement
      ? (String(sample?.location || "").trim() || canonicalLocation)
      : canonicalLocation;
    const rawClientCode = String(
      sample?.rawClientCode ||
      sample?.clientCode ||
      sample?.canonicalClientCode ||
      ""
    ).trim();
    const normalizedClient = normalizeClientCode(
      sample?.canonicalClientCode ||
      rawClientCode
    );
    const canonicalClientCode = sample?.canonicalClientCode || normalizedClient.canonicalCode || rawClientCode;
    const hasReplicaFamily = type === "created_sample" &&
      (Number(sample?.replicaCount || 1) > 1 || Number(sample?.replicaNumber || 0) > 0);
    const legacyGroupId = hasReplicaFamily
      ? [
          "sample-group-legacy",
          normalizedClient.normalizedKey || "client",
          sample?.baseName || String(sample?.name || "").replace(/[\s_]+\d+$/, ""),
          sample?.creationDate || "date",
          sample?.category || "category",
          sample?.location || "location"
        ].map(toSafeKeyPart).join("-")
      : "";
    const generalData = type === "created_sample"
      ? {
          ...(sample?.generalData || {}),
          notes: normalizeMultilineText(sample?.generalData?.notes ?? (hasReplicaFamily ? sample?.notes : ""))
        }
      : {};
    const specificData = type === "created_sample"
      ? {
          ...(sample?.specificData || {}),
          notes: normalizeMultilineText(sample?.specificData?.notes ?? (hasReplicaFamily ? "" : sample?.notes))
        }
      : {};

    return {
      ...sample,
      id,
      type,
      studyType: sample?.studyType === "rd" ? "rd" : "client",
      name: String(sample?.name || sample?.baseName || "").trim(),
      baseName: String(sample?.baseName || sample?.name || "").trim(),
      clientCode: canonicalClientCode,
      rawClientCode,
      normalizedClientKey: sample?.normalizedClientKey || normalizedClient.normalizedKey,
      clientId: sample?.clientId || (normalizedClient.normalizedKey ? `client-${normalizedClient.normalizedKey}` : ""),
      canonicalClientCode,
      category,
      arnQiazol: legacyArnQiazol,
      arnBead: legacyArnBead,
      roomId: placement.roomId,
      locationId: placement.locationId,
      sublocationId: placement.sublocationId,
      location,
      arrivalDate: sample?.arrivalDate || "",
      creationDate: sample?.creationDate || "",
      quantity: sample?.quantity ?? sample?.measureValue ?? "",
      unit: type === "created_sample" ? measureUnit : String(sample?.unit || "").trim(),
      measureValue: sample?.measureValue ?? sample?.quantity ?? "",
      measureUnit,
      referenceNumber: String(sample?.referenceNumber || "").trim(),
      lotNumber: String(sample?.lotNumber || "").trim(),
      notes: normalizeMultilineText(sample?.notes),
      generalData,
      specificData,
      groupId: sample?.groupId || legacyGroupId,
      replicaId: sample?.replicaId || id,
      replicaNumber: sample?.replicaNumber || null,
      replicaCount: sample?.replicaCount || 1,
      createdAtRaw: sample?.createdAtRaw || "",
      createdAt: sample?.createdAt || ""
    };
  }).filter(sample => sample.name || sample.clientCode);
}

function getClientSampleTime(sample) {
  const rawDate = sample?.creationDate || sample?.arrivalDate || sample?.createdAtRaw || "";
  const parsed = new Date(rawDate).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatClientSampleDate(sample) {
  return sample?.type === "created_sample"
    ? sample.creationDate || ""
    : sample.arrivalDate || "";
}

function formatClientSampleQuantity(sample) {
  if (sample?.type === "created_sample") {
    const label = sample.measureUnit === "mL" ? "Volume" : "Poids";
    return `${label}: ${sample.measureValue} ${sample.measureUnit}`;
  }

  return `${sample.quantity} ${sample.unit}`.trim();
}

function formatSampleDisplayQuantity(sample) {
  if (!sample) return "";

  const value = sample.type === "created_sample"
    ? sample.measureValue ?? sample.quantity
    : sample.quantity;
  const unit = sample.type === "created_sample"
    ? sample.measureUnit || sample.unit
    : sample.unit;

  return formatFrenchQuantity(value, unit);
}

function formatFrenchQuantity(value, unit) {
  const rawUnit = String(unit || "").trim();
  if (value === undefined || value === null || value === "") return rawUnit;

  const number = Number(value);
  const formattedValue = Number.isFinite(number)
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(number)
    : String(value);

  return `${formattedValue} ${rawUnit}`.trim();
}

function formatDisplayDateFrench(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

function findInventoryItem(line) {
  if(line?.type==="custom")return null;
  const stableId=line?.inventoryItemId||line?.itemId;
  if (stableId) {
    return items.find(item => item.id === stableId) || null;
  }
  if(line?.type==="inventory")return null;
  return findInventoryItemByProtocolName(line?.name);
}

function findInventoryItemByProtocolName(name) {
  const rawName = String(name || "").trim();
  if (!rawName) return null;

  const exact = items.filter(item => String(item.name || "").trim() === rawName);
  if (exact.length === 1) return exact[0];

  const lowerName = rawName.toLowerCase();
  const lowerMatches = items.filter(item => String(item.name || "").trim().toLowerCase() === lowerName);
  if (lowerMatches.length === 1) return lowerMatches[0];

  const normalizedName = normalizeSearch(rawName);
  const normalizedMatches = items.filter(item => normalizeSearch(item.name) === normalizedName);
  if (normalizedMatches.length === 1) return normalizedMatches[0];

  const relaxedName = normalizeProtocolMatchText(rawName);
  const relaxedMatches = items.filter(item => normalizeProtocolMatchText(item.name) === relaxedName);
  if (relaxedMatches.length === 1) return relaxedMatches[0];

  return null;
}

function normalizeProtocolMatchText(value) {
  return normalizeSearch(value).replace(/[^a-z0-9]+/g, "");
}

// compare l'unité écrite dans le protocole à l'unité de référence réelle de l'item (dernier niveau de conditionnement),
// avec conversion métrique automatique si compatible (ex. uL vs mL) ; incompatible sinon (ex. mg vs tube)
function resolveExperimentLineUnitMatch(item, quantity, rawUnit) {
  const referenceUnit = StockTracking.referenceUnit(item);
  const protocolUnit = StockTracking.normalizeUnitLabel(rawUnit);
  const needed = Number(quantity || 0);
  if (protocolUnit.key === referenceUnit.key) {
    return { compatible: true, referenceUnit, protocolUnit, neededInReferenceUnit: needed, converted: false };
  }
  const factor = StockTracking.metricConversionFactor(protocolUnit.key, referenceUnit.key);
  if (factor === null) return { compatible: false, referenceUnit, protocolUnit };
  return { compatible: true, referenceUnit, protocolUnit, neededInReferenceUnit: needed * factor, converted: true };
}

function getExperimentLineAvailability(item, quantity, rawUnit) {
  if (!item) return { connected: false, compatible: false, kind: "missing" };
  const match = resolveExperimentLineUnitMatch(item, quantity, rawUnit);
  if (!match.compatible) return { connected: true, compatible: false, kind: "incompatible", referenceUnit: match.referenceUnit, protocolUnit: match.protocolUnit };
  const equivalent = StockTracking.equivalentLevels(item, StockTracking.available(item)).find(level => level.key === match.referenceUnit.key);
  const availableInReferenceUnit = equivalent ? equivalent.value : 0;
  const enough = availableInReferenceUnit + 1e-8 >= match.neededInReferenceUnit;
  return {
    connected: true,
    compatible: true,
    kind: enough ? "ok" : "low",
    referenceUnit: match.referenceUnit,
    availableInReferenceUnit,
    neededInReferenceUnit: match.neededInReferenceUnit,
    converted: match.converted
  };
}

function experimentStockSummary(experiment) {
  const missing = getMergedExperimentLines(experiment.items).filter(line => {
    if(line.type==="custom")return false;
    const item = findInventoryItem(line);
    const availability = getExperimentLineAvailability(item, line.quantity, line.unit);
    return availability.kind !== "ok";
  }).length;
  return { ok: missing === 0, missing };
}

function getItemAddedTime(item) {
  if (item?.createdAtRaw) {
    const parsed = new Date(item.createdAtRaw).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (item?.createdAt) {
    const parsed = new Date(item.createdAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const idMatch = String(item?.id || "").match(/^(?:web|itm)-(\d{10,})$/);
  if (idMatch) {
    return Number(idMatch[1]);
  }

  return 0;
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
    <label>Notes<textarea class="secondary-reference-notes" rows="2">${escapeHtml(reference.notes || "")}</textarea></label>
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
    .map((row) => ({
      reference: row.querySelector(".secondary-reference").value.trim(),
      notes: normalizeMultilineText(row.querySelector(".secondary-reference-notes").value)
    }))
    .filter((reference) => reference.reference || reference.notes);

  return {
    primary: {
      supplier: fields.primarySupplier.value.trim(),
      reference: fields.primaryReference.value.trim(),
      link: fields.primaryLink.value.trim(),
      notes: normalizeMultilineText(fields.primaryReferenceNotes.value),
      price: fields.primaryPrice.value.trim(),
      unitPrice: fields.primaryUnitPrice.value.trim(),
      leadTime: fields.primaryLeadTime.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  // Older records could store a free-form quantity alongside the reference.
  // A price, however, is already a first-class field and must never be copied
  // into the reference notes when those notes are empty.
  const legacyPrimaryNotes = references?.primary?.quantity || "";

  return {
    primary: {
      supplier: references?.primary?.supplier || "",
      reference: references?.primary?.reference || "",
      link: references?.primary?.link || "",
      notes: references?.primary?.notes || legacyPrimaryNotes || "",
      price: references?.primary?.price || "",
      unitPrice: references?.primary?.unitPrice || "",
      leadTime: references?.primary?.leadTime || ""
    },
    secondary: Array.isArray(references?.secondary)
      ? references.secondary.map((reference) => ({
          reference: reference.reference || "",
          notes: reference.notes || [reference.quantity, reference.price].filter(Boolean).join(" - ")
        }))
      : []
  };
}

function itemReferencesText(references) {
  const normalized = normalizeReferences(references);
  return [
    normalized.primary.supplier,
    normalized.primary.reference,
    normalized.primary.link,
    normalized.primary.notes,
    normalized.primary.price,
    normalized.primary.unitPrice,
    normalized.primary.leadTime,
    ...normalized.secondary.flatMap((reference) => [reference.reference, reference.notes])
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

// Navigation hiérarchique des emplacements (salle → localisation → sous-localisation).
