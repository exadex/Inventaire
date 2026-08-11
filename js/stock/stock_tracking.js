(function () {
  "use strict";

  const VERSION = 1;
  const TYPES = new Set(["received", "container_opened", "consumed", "recounted", "containers_recounted", "moved", "container_finished", "aliquots_prepared", "aliquots_consumed", "aliquots_moved", "aliquot_opened", "open_aliquot_consumed", "open_aliquot_moved", "open_aliquot_discarded", "preparation_recounted", "preparation_finished", "corrected", "configuration_changed"]);
  const id = prefix => `${prefix}-${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(2)).join("-")}`;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const round = (value, precision = 6) => Number(number(value).toFixed(precision));
  const clone = value => JSON.parse(JSON.stringify(value));

  const UNIT_DEFINITIONS = [
    ["carton", "carton", "cartons", "discrete", ["carton", "cartons"]],
    ["sachet", "sachet", "sachets", "discrete", ["sachet", "sachets"]],
    ["tube", "tube", "tubes", "discrete", ["tube", "tubes"]],
    ["flacon", "flacon", "flacons", "discrete", ["flacon", "flacons"]],
    ["bouteille", "bouteille", "bouteilles", "discrete", ["bouteille", "bouteilles"]],
    ["boite", "boîte", "boîtes", "discrete", ["boite", "boites", "boîte", "boîtes"]],
    ["plaque", "plaque", "plaques", "discrete", ["plaque", "plaques"]],
    ["unite", "unité", "unités", "discrete", ["unite", "unites", "unité", "unités"]],
    ["test", "test", "tests", "discrete", ["test", "tests"]],
    ["kit", "kit", "kits", "discrete", ["kit", "kits"]],
    ["ampoule", "ampoule", "ampoules", "discrete", ["ampoule", "ampoules"]],
    ["rouleau", "rouleau", "rouleaux", "discrete", ["rouleau", "rouleaux"]],
    ["bocal", "bocal", "bocaux", "discrete", ["bocal", "bocaux"]],
    ["aliquote", "aliquote", "aliquotes", "discrete", ["aliquote", "aliquotes"]],
    ["milieu", "milieu", "milieux", "discrete", ["milieu", "milieux"]],
    ["souris", "souris", "souris", "discrete", ["souris"]],
    ["L", "L", "L", "continuous", ["l"]], ["mL", "mL", "mL", "continuous", ["ml"]],
    ["µL", "µL", "µL", "continuous", ["µl", "ul", "μl"]], ["g", "g", "g", "continuous", ["g"]],
    ["mg", "mg", "mg", "continuous", ["mg"]], ["µg", "µg", "µg", "continuous", ["µg", "ug", "μg"]],
    ["ng", "ng", "ng", "continuous", ["ng"]], ["mol", "mol", "mol", "continuous", ["mol"]],
    ["mmol", "mmol", "mmol", "continuous", ["mmol"]], ["µmol", "µmol", "µmol", "continuous", ["µmol", "umol", "μmol"]],
    ["M", "M", "M", "continuous", ["molar", "m"]], ["mM", "mM", "mM", "continuous", ["mm"]],
    ["µM", "µM", "µM", "continuous", ["µm", "um", "μm"]], ["nM", "nM", "nM", "continuous", ["nm"]]
  ];
  const cleanUnit = value => String(value || "").trim().replace(/\s+/g, " ");
  const unitLookupKey = value => cleanUnit(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const UNIT_LOOKUP = new Map(UNIT_DEFINITIONS.flatMap(([key, singular, plural, kind, aliases]) => aliases.map(alias => [unitLookupKey(alias), { key, singular, plural, kind }])));

  function normalizeUnitLabel(input) {
    const raw = cleanUnit(input);
    const known = UNIT_LOOKUP.get(unitLookupKey(raw));
    if (known) return { ...known };
    const lower = raw.toLocaleLowerCase("fr-FR");
    const singular = lower.length > 1 && lower.endsWith("s") ? lower.slice(0, -1) : lower;
    const safeSingular = singular || "unité";
    return { key: `custom-${unitLookupKey(safeSingular).replace(/[^a-z0-9]+/g, "-") || "unite"}`, singular: safeSingular, plural: lower.endsWith("s") ? lower : `${safeSingular}s`, kind: "discrete" };
  }

  function parseLocalizedNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!normalized || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function normalizeLevel(level = {}, index = 0) {
    const unit = normalizeUnitLabel(level.singular || level.plural || level.key || "unité");
    return {
      id: level.id || `level-${index + 1}`,
      key: level.key || unit.key,
      singular: level.singular ? String(level.singular).trim() : unit.singular,
      plural: level.plural ? String(level.plural).trim() : unit.plural,
      kind: level.kind || unit.kind,
      contains: index === 0 ? 1 : Math.max(0, number(level.contains) || 1)
    };
  }

  function normalizeTracking(item = {}) {
    const raw = item.stockTracking || {};
    const levels = (Array.isArray(raw.packagingLevels) && raw.packagingLevels.length ? raw.packagingLevels : [{ singular: item.unit || "unité", plural: item.unit || "unités" }]).slice(0, 3).map(normalizeLevel);
    const compatibilityUnit = levels.at(-1);
    const requestedKey = raw.trackingUnitKey || raw.openContentUnitKey;
    const trackingLevel = levels.find(level => level.key === requestedKey) || compatibilityUnit;
    const normalized = {
      version: VERSION,
      mode: raw.mode === "containers" ? "containers" : "simple",
      traceabilityMode: raw.traceabilityMode === "detailed" ? "detailed" : "periodic",
      packagingLevels: levels,
      trackingUnitKey: trackingLevel.key,
      trackingUnit: trackingLevel.plural,
      quantityStep: Math.max(Number.EPSILON, number(raw.quantityStep) || 1),
      precision: Math.min(6, Math.max(0, Math.trunc(number(raw.precision)))),
      closedByLocation: (Array.isArray(raw.closedByLocation) ? raw.closedByLocation : []).map(row => ({ location: String(row.location || ""), quantity: Math.max(0, Math.trunc(number(row.quantity))), updatedAt: row.updatedAt || "", updatedBy: row.updatedBy || "" })).filter(row => row.location && row.quantity),
      closedContainers: [],
      openContainers: (Array.isArray(raw.openContainers) ? raw.openContainers : []).map(container => {
        const containerCapacity=Math.max(0,number(container.capacity)||capacity({packagingLevels:levels}));
        return { ...container, id: container.id || id("container"), remaining:Math.min(containerCapacity,Math.max(0,number(container.remaining))),capacity:containerCapacity,unitKey:container.unitKey||trackingLevel.key,status: container.status === "finished" ? "finished" : "open", version: Math.max(1, Math.trunc(number(container.version) || 1)) };
      })
    };
    const cap = capacity(normalized), outer = normalized.packagingLevels[0], stablePart = value => String(value || "stock").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "stock";
    normalized.closedContainers = Array.isArray(raw.closedContainers)
      ? raw.closedContainers.map((container,index)=>{
        const containerCapacity=Math.max(0,number(container.capacity)||cap);
        return { ...container, id:container.id||`closed-${stablePart(item.id)}-${index+1}`, label:container.label||`${outer.singular} fermé nº${index+1}`, location:String(container.location||item.location||""), remaining:Math.min(containerCapacity,Math.max(0,number(container.remaining??containerCapacity))),capacity:containerCapacity,unitKey:container.unitKey||normalized.trackingUnitKey,status:"closed",version:Math.max(1,Math.trunc(number(container.version)||1)) };
      })
      : normalized.closedByLocation.flatMap(row=>Array.from({length:row.quantity},(_,index)=>({id:`closed-${stablePart(item.id)}-${stablePart(row.location)}-${index+1}`,label:`${outer.singular} fermé nº${index+1}`,location:row.location,remaining:cap,capacity:cap,unitKey:normalized.trackingUnitKey,status:"closed",createdAt:row.updatedAt||"",updatedAt:row.updatedAt||"",updatedBy:row.updatedBy||"",version:1})));
    return normalized;
  }

  function normalizeAliquots(item = {}) {
    const raw = item.aliquotTracking || {};
    return { version: VERSION, enabled: Boolean(raw.enabled), preparations: (Array.isArray(raw.preparations) ? raw.preparations : []).map(prep => ({ ...prep, id: prep.id || id("preparation"), createdCount: Math.max(0, Math.trunc(number(prep.createdCount))), representedSourceQuantity: Math.max(0, number(prep.representedSourceQuantity)), locations: (Array.isArray(prep.locations) ? prep.locations : []).map(row => ({ location: String(row.location || ""), quantity: Math.max(0, Math.trunc(number(row.quantity))) })).filter(row => row.location && row.quantity), openAliquots: (Array.isArray(prep.openAliquots) ? prep.openAliquots : []).map((open, index) => ({ ...open, id: open.id || id("open-aliquot"), preparationId: open.preparationId || prep.id || "", label: open.label || `Aliquote nº${index + 1}`, location: String(open.location || open.locationId || ""), locationId: String(open.locationId || open.location || ""), initialVolume: Math.max(0, number(open.initialVolume)), remainingVolume: Math.max(0, number(open.remainingVolume)), volumeUnit: open.volumeUnit || prep.volumeUnit || "", concentration: number(open.concentration ?? prep.concentration), concentrationUnit: open.concentrationUnit || prep.concentrationUnit || "", sourceEquivalentInitial: Math.max(0, number(open.sourceEquivalentInitial)), sourceEquivalentRemaining: Math.max(0, number(open.sourceEquivalentRemaining)), openedAt: open.openedAt || "", openedBy: open.openedBy || {}, updatedAt: open.updatedAt || open.openedAt || "", updatedBy: open.updatedBy || "", version: Math.max(1, Math.trunc(number(open.version) || 1)), status: open.status === "finished" ? "finished" : "open" })).filter(open => open.initialVolume > 0), status: prep.status === "finished" ? "finished" : "active", version: Math.max(1, Math.trunc(number(prep.version) || 1)) })) };
  }

  function capacity(tracking) {
    return tracking.packagingLevels.slice(1).reduce((total, level) => total * level.contains, 1);
  }
  function trackingLevel(tracking) { return tracking.packagingLevels.find(level => level.key === tracking.trackingUnitKey) || tracking.packagingLevels.at(-1); }
  function trackingFactor(tracking) {
    const index = tracking.packagingLevels.findIndex(level => level.key === trackingLevel(tracking).key);
    return tracking.packagingLevels.slice(index + 1).reduce((total, level) => total * level.contains, 1);
  }
  function trackingCapacity(tracking) { return round(capacity(tracking) / trackingFactor(tracking)); }
  function fromBaseQuantity(value, tracking) { return round(number(value) / trackingFactor(tracking)); }
  function toBaseQuantity(value, tracking) { return round(number(value) * trackingFactor(tracking)); }
  function validateUnitQuantity(value, unit) {
    const parsed = parseLocalizedNumber(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Saisissez une quantité positive valide.");
    if ((unit?.kind || "discrete") === "discrete" && !Number.isInteger(parsed)) throw new Error(`${unit?.plural || "Cette unité"} se compte uniquement en nombres entiers.`);
    return round(parsed);
  }
  function packagingPreview(levelsInput, trackingUnitKey) {
    const levels = (levelsInput || []).map(normalizeLevel), selected = levels.find(level => level.key === trackingUnitKey);
    if (levels.length < 2 || !selected || levels.some((level, index) => !level.singular || !level.plural || (index && !level.contains))) return null;
    let total = 1;
    const equation = levels.map((level, index) => { if (index) total *= level.contains; return `${index ? total : 1} ${index ? level.plural : level.singular}`; }).join(" = ");
    const selectedIndex = levels.findIndex(level => level.key === selected.key);
    const selectedCapacity = levels.slice(1, selectedIndex + 1).reduce((value, level) => value * level.contains, 1);
    const exampleRemaining = selected.kind === "continuous" ? selectedCapacity / 2 : Math.floor(selectedCapacity / 2);
    return { equation, sentence: `Les ${levels[0].plural} ouverts seront comptés en ${selected.plural}${selected.kind === "discrete" ? " entiers" : ""}.`, example: `Un ${levels[0].singular} ouvert avec ${format(exampleRemaining)} ${plural(exampleRemaining, selected.singular, selected.plural)} restants représente ${format(exampleRemaining / selectedCapacity)} ${levels[0].singular}.`, selectedCapacity };
  }
  function migrationComparison(oldQuantity, closedCount, openedQuantities, tracking) {
    const quantities = (openedQuantities || []).map(value => parseLocalizedNumber(value));
    const complete = quantities.every(Number.isFinite);
    const openCapacity = trackingCapacity(tracking);
    const newEquivalent = complete ? number(closedCount) + quantities.reduce((sum, value) => sum + value / openCapacity, 0) : NaN;
    const difference = complete ? newEquivalent - number(oldQuantity) : NaN;
    return { complete, newEquivalent, difference, differenceTrackingUnits: complete ? difference * openCapacity : NaN, openCapacity };
  }
  function migrationPresentation(oldQuantity, closedCount, openedQuantities, tracking) {
    const comparison = migrationComparison(oldQuantity, closedCount, openedQuantities, tracking);
    const outer = tracking.packagingLevels[0], unit = trackingLevel(tracking), quantities = (openedQuantities || []).map(parseLocalizedNumber);
    const closedText = `${closedCount} ${plural(closedCount, outer.singular, outer.plural)} fermé${number(closedCount) > 1 ? "s" : ""}`;
    const openedText = quantities.length === 1 && Number.isFinite(quantities[0]) ? `1 ouvert avec ${format(quantities[0], 2)} ${plural(quantities[0], unit.singular, unit.plural)} sur ${format(comparison.openCapacity, 2)}` : quantities.length ? `${quantities.length} ouverts — ${quantities.map(value => Number.isFinite(value) ? `${format(value, 2)} ${plural(value, unit.singular, unit.plural)}` : "à compléter").join(" ; ")}` : "aucun contenant ouvert";
    const noDifference = comparison.complete && Math.abs(comparison.difference) <= 1e-8;
    return { ...comparison, physicalSummary: `${closedText} + ${openedText}`, equivalentText: comparison.complete ? `${format(comparison.newEquivalent, 2)} ${plural(comparison.newEquivalent, outer.singular, outer.plural)}` : "À compléter", oldText: `${format(oldQuantity, 2)} ${plural(oldQuantity, outer.singular, outer.plural)}`, correctionText: noDifference ? "Aucune différence" : comparison.complete ? `${comparison.differenceTrackingUnits > 0 ? "+" : ""}${format(comparison.differenceTrackingUnits, 2)} ${plural(Math.abs(comparison.differenceTrackingUnits), unit.singular, unit.plural)}` : "À compléter", secondaryText: comparison.complete && !noDifference ? `soit ${comparison.difference > 0 ? "+" : ""}${format(comparison.difference, 2)} ${outer.singular}` : "", helpTexts: quantities.map(value => Number.isFinite(value) ? `${format(value, 2)} ${plural(value, unit.singular, unit.plural)} sur ${format(comparison.openCapacity, 2)}` : "") };
  }
  function totalClosed(tracking) { return Array.isArray(tracking.closedContainers) ? tracking.closedContainers.length : tracking.closedByLocation.reduce((sum, row) => sum + row.quantity, 0); }
  function remainingAliquots(prep) { return prep.locations.reduce((sum, row) => sum + row.quantity, 0); }
  function aliquotEquivalent(prep) { const unopened = prep.createdCount ? prep.representedSourceQuantity * remainingAliquots(prep) / prep.createdCount : 0, opened = (prep.openAliquots || []).filter(row => row.status === "open").reduce((sum, row) => sum + number(row.sourceEquivalentRemaining), 0); return round(unopened + opened); }
  function activeAliquotEquivalent(item) { return normalizeAliquots(item).preparations.filter(row => row.status === "active").reduce((sum, prep) => sum + aliquotEquivalent(prep), 0); }
  function simpleRawAvailable(item) { return round(Math.max(0, number(item.quantity) - activeAliquotEquivalent(item))); }
  function available(item) {
    const tracking = normalizeTracking(item);
    if (tracking.mode !== "containers") return number(item.quantity);
    const cap = capacity(tracking);
    const closed = Array.isArray(tracking.closedContainers) ? tracking.closedContainers.reduce((sum,row)=>sum+row.remaining/cap,0) : totalClosed(tracking);
    const opened = tracking.openContainers.filter(row => row.status === "open").reduce((sum, row) => sum + row.remaining / cap, 0);
    const aliquots = normalizeAliquots(item).preparations.filter(row => row.status === "active").reduce((sum, prep) => sum + aliquotEquivalent(prep) / cap, 0);
    return round(closed + opened + aliquots);
  }
  function format(value, precision = 3) { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: precision }).format(number(value)); }
  function plural(value, singular, pluralForm) { return number(value) === 1 ? singular : (pluralForm || `${singular}s`); }
  function summary(item, location = "") {
    const tracking = normalizeTracking(item); if (tracking.mode !== "containers") return "";
    const aliquots = normalizeAliquots(item);
    const closed = tracking.closedByLocation.filter(row => !location || row.location === location).reduce((sum, row) => sum + row.quantity, 0);
    const opened = tracking.openContainers.filter(row => row.status === "open" && (!location || row.location === location));
    const aliquotCount = aliquots.preparations.filter(row => row.status === "active").reduce((sum, prep) => sum + prep.locations.filter(row => !location || row.location === location).reduce((n, row) => n + row.quantity, 0), 0);
    const parts = [];
    if (closed) parts.push(`${closed} fermé${closed > 1 ? "s" : ""}`);
    if (opened.length) parts.push(`${opened.length} ouvert${opened.length > 1 ? "s" : ""}`);
    if (opened.length) { const unit = trackingLevel(tracking), remaining = fromBaseQuantity(opened.reduce((sum, row) => sum + row.remaining, 0), tracking); parts.push(`${format(remaining)} ${plural(remaining, unit.singular, unit.plural)} restants`); }
    if (aliquotCount) parts.push(`${aliquotCount} aliquote${aliquotCount > 1 ? "s" : ""}`);
    return parts.join(" · ") || "Aucun stock";
  }
  function validateStep(value, tracking, integer = false) {
    const n = number(value);
    if (n < 0 || (integer && !Number.isInteger(n))) throw new Error(integer ? "La quantité doit être un nombre entier positif." : "La quantité ne peut pas être négative.");
    const ratio = n / tracking.quantityStep;
    if (!integer && Math.abs(ratio - Math.round(ratio)) > 1e-8) throw new Error(`La quantité doit respecter un pas de ${format(tracking.quantityStep, tracking.precision)}.`);
    return round(n, tracking.precision);
  }
  function rowAt(rows, location) { let row = rows.find(entry => entry.location === location); if (!row) { row = { location, quantity: 0 }; rows.push(row); } return row; }
  function actor(user = {}) { const name = String(user.name || "Utilisateur inconnu"); return { userId: user.id || name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\W+/g, "-"), userName: name, userEmoji: user.emoji || "", userInitials: user.emoji ? "" : name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() }; }
  function eventFor(item, operation, user) { const now = new Date().toISOString(); return { id: id("movement"), operationId: operation.operationId, itemId: item.id, timestamp: now, ...actor(user), type: TYPES.has(operation.type) ? operation.type : "corrected", entityType: operation.entityType || "item", entityId: operation.entityId || "", containerId: operation.containerId || operation.entityId || "", containerLabel: operation.containerLabel || "", containerStatusBefore: operation.containerStatusBefore || "", containerStatusAfter: operation.containerStatusAfter || "", beforeQuantity: operation.beforeQuantity ?? null, afterQuantity: operation.afterQuantity ?? null, beforeCapacity:operation.beforeCapacity??null,afterCapacity:operation.afterCapacity??null,unitBefore:operation.unitBefore||"",unitAfter:operation.unitAfter||"",automatic: Boolean(operation.automatic), automaticOpen: Boolean(operation.automaticOpen), automaticFinish: Boolean(operation.automaticFinish), containerTransitions: clone(operation.containerTransitions || []), preparationId: operation.preparationId || "", before: operation.before ?? null, after: operation.after ?? null, quantity: number(operation.quantity), difference: operation.difference ?? null, unit: operation.unit || "", sourceEquivalentConsumed: number(operation.sourceEquivalentConsumed), sourceUnit: operation.sourceUnit || "", fromLocation: operation.fromLocation || "", toLocation: operation.toLocation || "", comment: operation.comment || "", correctionReason: operation.correctionReason || "" }; }

  function syncClosedSummary(tracking) {
    const rows = new Map();
    (tracking.closedContainers || []).forEach(container => {
      if (!container.location) return;
      rows.set(container.location, (rows.get(container.location) || 0) + 1);
    });
    tracking.closedByLocation = [...rows].map(([location,quantity])=>({location,quantity}));
  }

  function applyContainerRecount(itemInput, operation, user = {}) {
    const item=clone(itemInput),tracking=normalizeTracking(item),aliquots=normalizeAliquots(item),now=new Date().toISOString(),by=actor(user).userId,events=[];
    if(tracking.mode!=="containers")throw new Error("Le comptage individuel exige le suivi détaillé du conditionnement.");
    const changes=Array.isArray(operation.changes)?operation.changes:[];if(!changes.length)throw new Error("Aucun contenant n’a été modifié.");
    const seen=new Set();
    changes.forEach(change=>{
      if(!change?.containerId||seen.has(change.containerId))throw new Error("Identifiant de contenant invalide ou dupliqué.");seen.add(change.containerId);
      if(change.isNew){
        const outer=tracking.packagingLevels[0],location=String(change.location||"").trim(),status=change.status||"closed";if(!location)throw new Error("La localisation du nouveau contenant est obligatoire.");if(!["closed","open"].includes(status))throw new Error("Un nouveau contenant doit être fermé ou ouvert.");
        const selectedLevel=tracking.packagingLevels.find(level=>level.key===change.unitKey);if(!selectedLevel)throw new Error("Unité incompatible avec le conditionnement de cet article.");
        const levelIndex=tracking.packagingLevels.findIndex(level=>level.key===selectedLevel.key),factor=tracking.packagingLevels.slice(levelIndex+1).reduce((value,level)=>value*level.contains,1),displayQuantity=validateUnitQuantity(change.quantity,selectedLevel),displayCapacity=validateUnitQuantity(change.capacity??capacity(tracking)/factor,selectedLevel),remaining=round(displayQuantity*factor),containerCapacity=round(displayCapacity*factor);
        if(containerCapacity<=0)throw new Error("La capacité totale du nouveau contenant doit être positive.");if(remaining>containerCapacity)throw new Error("La quantité actuelle du nouveau contenant ne peut pas dépasser sa capacité totale.");
        const containerId=id("closed-container"),container={id:containerId,label:`${outer.singular} ${status==="closed"?"fermé":"ouvert"} nº${tracking.closedContainers.length+tracking.openContainers.length+1}`,location,remaining,capacity:containerCapacity,unitKey:selectedLevel.key,status,createdAt:now,createdBy:actor(user),updatedAt:now,updatedBy:by,version:1};
        if(status==="closed")tracking.closedContainers.push(container);else{container.openedAt=now;container.openedBy=actor(user);tracking.openContainers.push(container);}
        events.push(eventFor(item,{...operation,operationId:`${operation.operationId}-${containerId}`,type:"received",entityType:"container",entityId:containerId,containerId,containerLabel:container.label,containerStatusBefore:"",containerStatusAfter:status,beforeQuantity:0,afterQuantity:displayQuantity,beforeCapacity:0,afterCapacity:displayCapacity,unitAfter:selectedLevel.plural,difference:displayQuantity,quantity:displayQuantity,unit:selectedLevel.plural,toLocation:location,before:null,after:container,comment:`Ajout du contenant ${container.label} dans ${location}.`},user));return;
      }
      let sourceType="closed",index=tracking.closedContainers.findIndex(row=>row.id===change.containerId),container=index>=0?tracking.closedContainers[index]:null;
      if(!container){sourceType="open";index=tracking.openContainers.findIndex(row=>row.id===change.containerId);container=index>=0?tracking.openContainers[index]:null;}
      if(!container)throw new Error(`Le contenant ${change.containerId} n’existe plus.`);
      if(change.expectedVersion&&container.version!==change.expectedVersion)throw new Error(`CONFLICT: le contenant ${container.label||container.id} a été modifié. Rechargez les données.`);
      const before=clone(container),status=change.status||container.status,location=String(change.location||container.location||"").trim();if(!location)throw new Error(`La localisation de ${container.label||container.id} est obligatoire.`);
      if(!["closed","open","finished"].includes(status))throw new Error("Statut de contenant invalide.");
      const selectedLevel=tracking.packagingLevels.find(level=>level.key===change.unitKey);if(!selectedLevel)throw new Error("Unité incompatible avec le conditionnement de cet article.");
      const levelIndex=tracking.packagingLevels.findIndex(level=>level.key===selectedLevel.key),factor=tracking.packagingLevels.slice(levelIndex+1).reduce((value,level)=>value*level.contains,1),displayQuantity=validateUnitQuantity(change.quantity,selectedLevel),displayCapacity=validateUnitQuantity(change.capacity??container.capacity/factor,selectedLevel),remaining=round(displayQuantity*factor),containerCapacity=round(displayCapacity*factor);
      if(containerCapacity<=0)throw new Error(`La capacité totale de ${container.label||container.id} doit être positive.`);if(remaining>containerCapacity)throw new Error(`La quantité de ${container.label||container.id} dépasse sa capacité.`);
      const next={...container,location,remaining,capacity:containerCapacity,unitKey:selectedLevel.key,status,updatedAt:now,updatedBy:by,version:container.version+1};
      if(status==="finished"){next.finishedAt=next.finishedAt||now;if(remaining!==0)throw new Error(`Un contenant terminé doit avoir une quantité restante égale à zéro.`);}
      if(status==="open"&&!next.openedAt){next.openedAt=now;next.openedBy=actor(user);}
      if(sourceType==="closed")tracking.closedContainers.splice(index,1);else tracking.openContainers.splice(index,1);
      if(status==="closed")tracking.closedContainers.push(next);else tracking.openContainers.push(next);
      const beforeLevel=tracking.packagingLevels.find(level=>level.key===(before.unitKey||tracking.trackingUnitKey))||trackingLevel(tracking),beforeIndex=tracking.packagingLevels.findIndex(level=>level.key===beforeLevel.key),beforeFactor=tracking.packagingLevels.slice(beforeIndex+1).reduce((value,level)=>value*level.contains,1),beforeDisplay=round(before.remaining/beforeFactor),beforeCapacity=round(before.capacity/beforeFactor),afterDisplay=displayQuantity,eventOperation={...operation,operationId:`${operation.operationId}-${container.id}`,type:"recounted",entityType:"container",entityId:container.id,containerId:container.id,containerLabel:container.label||container.id,containerStatusBefore:before.status,containerStatusAfter:status,beforeQuantity:beforeDisplay,afterQuantity:afterDisplay,beforeCapacity,afterCapacity:displayCapacity,unitBefore:beforeLevel.plural,unitAfter:selectedLevel.plural,difference:round((next.remaining-before.remaining)/factor),quantity:afterDisplay,unit:selectedLevel.plural,fromLocation:before.location||"",toLocation:location,before,after:next,comment:operation.comment||""};
      events.push(eventFor(item,eventOperation,user));
    });
    syncClosedSummary(tracking);item.stockTracking=tracking;item.aliquotTracking=aliquots;item.quantity=available(item);item.locations=Array.from(new Set([...(item.locations||[]),...tracking.closedContainers.map(row=>row.location),...tracking.openContainers.filter(row=>row.status==="open").map(row=>row.location)].filter(Boolean)));item.location=item.locations[0]||item.location||"";
    return {item,event:events[events.length-1],events};
  }

  function apply(itemInput, operation, user = {}) {
    if(operation?.type==="containers_recounted")return applyContainerRecount(itemInput,operation,user);
    const item = clone(itemInput), tracking = normalizeTracking(item), aliquots = normalizeAliquots(item), now = new Date().toISOString(), by = actor(user).userId;
    const simpleAliquotEquivalentBefore = tracking.mode === "simple" ? activeAliquotEquivalent(item) : 0;
    let simpleSourceUsed = 0;
    const findContainer = () => { const entity = tracking.openContainers.find(row => row.id === operation.entityId && row.status === "open"); if (!entity) throw new Error("Ce contenant n’est plus disponible."); if (operation.expectedVersion && entity.version !== operation.expectedVersion) throw new Error("CONFLICT: ce contenant a été modifié. Rechargez les données."); return entity; };
    const findPrep = () => { const entity = aliquots.preparations.find(row => row.id === operation.entityId && row.status === "active"); if (!entity) throw new Error("Cette préparation n’est plus disponible."); if (operation.expectedVersion && entity.version !== operation.expectedVersion) throw new Error("CONFLICT: cette préparation a été modifiée. Rechargez les données."); return entity; };
    const findOpenAliquot = () => { for (const prep of aliquots.preparations) { const open = (prep.openAliquots || []).find(row => row.id === operation.entityId && row.status === "open"); if (open) { if (operation.expectedVersion && open.version !== operation.expectedVersion) throw new Error("CONFLICT: cette aliquote ouverte a été modifiée. Rechargez les données."); return { prep, open }; } } throw new Error("Cette aliquote ouverte n’est plus disponible."); };
    const createOpenAliquot = (prep, fromLocation, toLocation = fromLocation) => { const volume = number(prep.volume); if (!(volume > 0) || !prep.volumeUnit) throw new Error("Le volume individuel de cette préparation n’est pas défini."); const source = prep.locations.find(row => row.location === fromLocation); if (!source || source.quantity < 1) throw new Error("Aucune aliquote non ouverte n’est disponible dans cette localisation."); source.quantity -= 1; prep.locations = prep.locations.filter(row => row.quantity); const sequence = (prep.openAliquots || []).length + 1, equivalent = prep.createdCount ? round(prep.representedSourceQuantity / prep.createdCount) : 0, open = { id: id("open-aliquot"), preparationId: prep.id, label: `Aliquote nº${sequence}`, location: toLocation || fromLocation, locationId: toLocation || fromLocation, initialVolume: volume, remainingVolume: volume, volumeUnit: prep.volumeUnit, concentration: number(prep.concentration), concentrationUnit: prep.concentrationUnit || "", sourceEquivalentInitial: equivalent, sourceEquivalentRemaining: equivalent, openedAt: now, openedBy: actor(user), updatedAt: now, updatedBy: by, version: 1, status: "open" }; prep.openAliquots = prep.openAliquots || []; prep.openAliquots.push(open); prep.version += 1; return open; };
    let before = null, after = null, additionalEvents = [];
    if (operation.type === "received") { if (tracking.mode === "simple") { const unit=normalizeUnitLabel(item.unit),qty=validateUnitQuantity(operation.quantity,unit);if(qty<=0)throw new Error("La quantité reçue doit être positive.");before=number(item.quantity);item.quantity=round(before+qty);after=item.quantity;operation.unit=unit.plural;operation.difference=qty; } else { const qty = validateStep(operation.quantity, tracking, true), row = rowAt(tracking.closedByLocation, operation.toLocation); before = row.quantity;for(let index=0;index<qty;index+=1)tracking.closedContainers.push({id:id("closed-container"),label:`${tracking.packagingLevels[0].singular} fermé nº${tracking.closedContainers.length+1}`,location:operation.toLocation,remaining:capacity(tracking),capacity:capacity(tracking),unitKey:tracking.trackingUnitKey,status:"closed",createdAt:now,updatedAt:now,updatedBy:by,version:1});row.quantity += qty; after = row.quantity;operation.difference=qty; } }
    else if (operation.type === "consumed" && operation.entityType === "containers_auto") {
      const displayQty=validateUnitQuantity(operation.quantity,trackingLevel(tracking)),required=toBaseQuantity(displayQty,tracking),transitions=[];let remaining=required;
      const open=tracking.openContainers.filter(row=>row.status==="open"&&row.remaining>0).sort((a,b)=>a.id===operation.entityId?-1:b.id===operation.entityId?1:0);
      const consumeFrom=container=>{const used=Math.min(remaining,container.remaining),old=container.remaining;container.remaining=round(old-used);remaining=round(remaining-used);const finished=container.remaining<=0;if(finished){container.remaining=0;container.status="finished";container.finishedAt=now;}container.updatedAt=now;container.updatedBy=by;container.version+=1;transitions.push({containerId:container.id,containerLabel:container.label,statusBefore:"open",statusAfter:container.status,before:fromBaseQuantity(old,tracking),after:fromBaseQuantity(container.remaining,tracking),difference:-fromBaseQuantity(used,tracking),unit:trackingLevel(tracking).plural,location:container.location,automaticFinish:finished});};
      open.forEach(container=>{if(remaining>0)consumeFrom(container);});
      while(remaining>0){const closed=tracking.closedContainers.shift();if(!closed)throw new Error("Aucun contenant fermé ou ouvert ne permet d’enregistrer cette utilisation.");const container={...closed,status:"open",openedAt:now,openedBy:actor(user),updatedAt:now,updatedBy:by,version:closed.version+1};tracking.openContainers.push(container);transitions.push({containerId:container.id,containerLabel:container.label,statusBefore:"closed",statusAfter:"open",before:fromBaseQuantity(container.capacity,tracking),after:fromBaseQuantity(container.remaining,tracking),difference:0,unit:trackingLevel(tracking).plural,location:container.location,automaticOpen:true});consumeFrom(container);}
      before=transitions.map(row=>({containerId:row.containerId,quantity:row.before,status:row.statusBefore}));after=transitions.map(row=>({containerId:row.containerId,quantity:row.after,status:row.statusAfter}));operation.containerTransitions=transitions;operation.containerId=transitions[0]?.containerId||"";operation.containerLabel=transitions[0]?.containerLabel||"";operation.automatic=transitions.some(row=>row.automaticOpen||row.automaticFinish);operation.automaticOpen=transitions.some(row=>row.automaticOpen);operation.automaticFinish=transitions.some(row=>row.automaticFinish);operation.unit=trackingLevel(tracking).plural;operation.difference=-displayQty;
    }
    else if (operation.type === "moved" && operation.entityType === "closed") { const qty=validateStep(operation.quantity,tracking,true),candidates=tracking.closedContainers.filter(row=>row.location===operation.fromLocation);if(candidates.length<qty)throw new Error("Quantité fermée insuffisante dans cette localisation.");before={from:candidates.length,to:tracking.closedContainers.filter(row=>row.location===operation.toLocation).length};candidates.slice(0,qty).forEach(container=>{container.location=operation.toLocation;container.updatedAt=now;container.updatedBy=by;container.version+=1;});after={from:before.from-qty,to:before.to+qty}; }
    else if (operation.type === "container_opened") { const sourceIndex=tracking.closedContainers.findIndex(row=>row.location===operation.fromLocation);if(sourceIndex<0)throw new Error("Aucun contenant fermé n’est disponible dans cette localisation.");const closed=tracking.closedContainers.splice(sourceIndex,1)[0],container={...closed,location:operation.toLocation||operation.fromLocation,status:"open",openedAt:now,openedBy:actor(user),updatedAt:now,updatedBy:by,version:closed.version+1};tracking.openContainers.push(container);operation.entityId=container.id;operation.entityType="container";operation.containerId=container.id;operation.containerLabel=container.label;before=clone(closed);after=clone(container); }
    else if (tracking.mode === "simple" && operation.type === "consumed") { const unit=normalizeUnitLabel(item.unit),qty=validateUnitQuantity(operation.quantity,unit),raw=simpleRawAvailable(item);if(qty<=0)throw new Error("La quantité utilisée doit être positive.");if(qty>raw)throw new Error("La quantité utilisée dépasse le stock disponible.");before=number(item.quantity);item.quantity=round(before-qty);after=item.quantity;operation.unit=unit.plural;operation.entityType="item";operation.beforeQuantity=before;operation.afterQuantity=after;operation.difference=round(after-before); }
    else if (tracking.mode === "simple" && operation.type === "recounted") { const unit=normalizeUnitLabel(item.unit),target=validateUnitQuantity(operation.quantity,unit);before=number(item.quantity);item.quantity=round(target);after=item.quantity;operation.unit=unit.plural;operation.entityType="item";operation.beforeQuantity=before;operation.afterQuantity=after;operation.difference=round(after-before); }
    else if (operation.type === "recounted" && operation.entityType === "closed") { const qty=validateStep(operation.quantity,tracking,true),current=tracking.closedContainers.filter(row=>row.location===operation.fromLocation);before={location:operation.fromLocation,quantity:current.length,status:"closed"};if(qty<current.length){const remove=new Set(current.slice(qty).map(row=>row.id));tracking.closedContainers=tracking.closedContainers.filter(row=>!remove.has(row.id));}else for(let index=current.length;index<qty;index+=1)tracking.closedContainers.push({id:id("closed-container"),label:`${tracking.packagingLevels[0].singular} fermé nº${tracking.closedContainers.length+1}`,location:operation.fromLocation,remaining:capacity(tracking),capacity:capacity(tracking),unitKey:tracking.trackingUnitKey,status:"closed",updatedAt:now,updatedBy:by,version:1});after={location:operation.fromLocation,quantity:qty,status:"closed"};operation.containerLabel=`Stock fermé · ${operation.fromLocation}`;operation.containerStatusBefore="closed";operation.containerStatusAfter="closed";operation.beforeQuantity=before.quantity;operation.afterQuantity=after.quantity;operation.unit=tracking.packagingLevels[0].plural;operation.difference=qty-before.quantity; }
    else if (["consumed", "recounted", "container_finished", "moved"].includes(operation.type) && operation.entityType === "container") { const container = findContainer(); before = clone(container);operation.containerId=container.id;operation.containerLabel=container.label;operation.containerStatusBefore=container.status; if (operation.type === "consumed") { const displayQty = validateUnitQuantity(operation.quantity, trackingLevel(tracking)), qty = toBaseQuantity(displayQty, tracking); if (qty > container.remaining) throw new Error("La quantité demandée dépasse le contenu disponible."); operation.beforeQuantity=fromBaseQuantity(container.remaining,tracking);container.remaining = round(container.remaining - qty);operation.afterQuantity=fromBaseQuantity(container.remaining,tracking); operation.unit = trackingLevel(tracking).plural;operation.difference=-displayQty;if(container.remaining===0){container.status="finished";container.finishedAt=now;operation.automatic=true;operation.automaticFinish=true;} } else if (operation.type === "recounted") { const displayQty = validateUnitQuantity(operation.quantity, trackingLevel(tracking)), qty = toBaseQuantity(displayQty, tracking); if (qty > container.capacity) throw new Error("Le comptage dépasse la capacité du contenant.");operation.beforeQuantity=fromBaseQuantity(container.remaining,tracking); container.remaining = qty;operation.afterQuantity=displayQty; operation.unit = trackingLevel(tracking).plural;operation.difference=fromBaseQuantity(qty-before.remaining,tracking); } else if (operation.type === "moved") container.location = operation.toLocation; else { if (container.remaining > 0 && !operation.correctionReason) throw new Error("Une justification est obligatoire pour terminer un contenant non vide."); container.status = "finished"; container.finishedAt = now; } container.updatedAt = now; container.updatedBy = by; container.version += 1; after = clone(container);operation.containerStatusAfter=container.status; }
    else if (operation.type === "aliquots_prepared") { const count = validateStep(operation.createdCount, tracking, true); if (!count) throw new Error("Le nombre d’aliquotes doit être positif."); const locations = (operation.locations || []).map(row => ({ location: row.location, quantity: Math.trunc(number(row.quantity)) })); if (locations.reduce((sum, row) => sum + row.quantity, 0) !== count) throw new Error("La répartition doit être égale au nombre d’aliquotes créées."); const sourceQuantityInput = parseLocalizedNumber(operation.sourceQuantity), represented = parseLocalizedNumber(operation.representedSourceQuantity); if (!Number.isFinite(sourceQuantityInput) || !Number.isFinite(represented) || represented < 0 || represented > sourceQuantityInput) throw new Error("L’équivalence représentée doit être positive et ne peut pas dépasser la quantité source utilisée."); if (operation.sourceType === "container") { operation.entityId = operation.sourceId; operation.entityType = "container"; const source = findContainer(), displayQty = validateUnitQuantity(sourceQuantityInput, trackingLevel(tracking)), qty = toBaseQuantity(displayQty, tracking); if (qty > source.remaining) throw new Error("Stock source insuffisant."); source.remaining = round(source.remaining - qty); source.version += 1; source.updatedAt = now; source.updatedBy = by; } else if (operation.sourceType === "closed") { const sourceIndex=tracking.closedContainers.findIndex(row=>row.location===operation.fromLocation);if(sourceQuantityInput!==trackingCapacity(tracking)||sourceIndex<0)throw new Error("Une préparation depuis le stock fermé doit utiliser une unité entière.");tracking.closedContainers.splice(sourceIndex,1); } else { const sourceUnit = normalizeUnitLabel(item.unit || tracking.trackingUnit), sourceQuantity = validateUnitQuantity(sourceQuantityInput, sourceUnit); if (sourceQuantity <= 0) throw new Error("La quantité source utilisée doit être positive."); if (sourceQuantity > simpleRawAvailable(item)) throw new Error("La quantité source utilisée dépasse le stock disponible."); simpleSourceUsed = sourceQuantity; }
      const prep = { id: id("preparation"), label: `Préparation nº${aliquots.preparations.length + 1}`, createdCount: count, representedSourceQuantity: represented, sourceUnit: operation.sourceUnit || tracking.trackingUnit, volume: number(operation.volume), volumeUnit: operation.volumeUnit || "", concentration: number(operation.concentration), concentrationUnit: operation.concentrationUnit || "", locations, openAliquots: [], preparedAt: operation.preparedAt || now.slice(0, 10), preparedBy: actor(user), note: operation.comment || "", status: "active", updatedAt: now, updatedBy: by, version: 1 }; aliquots.preparations.push(prep); operation.entityId = prep.id; operation.entityType = "preparation"; operation.quantity = count; operation.unit = "aliquotes"; after = clone(prep); }
    else if (operation.type === "aliquot_opened") { const prep = findPrep(), prepBefore = clone(prep), open = createOpenAliquot(prep, operation.fromLocation, operation.toLocation); before = prepBefore; after = clone(open); operation.preparationId = prep.id; operation.entityId = open.id; operation.entityType = "open_aliquot"; operation.quantity = 1; operation.unit = "aliquote"; }
    else if (operation.type === "open_aliquot_consumed") { let prep, open; if (operation.openNew) { prep = findPrep(); const prepBefore = clone(prep); open = createOpenAliquot(prep, operation.fromLocation, operation.fromLocation); const openedOperation = { ...operation, type: "aliquot_opened", entityId: open.id, entityType: "open_aliquot", preparationId: prep.id, quantity: 1, unit: "aliquote", before: prepBefore, after: clone(open) }; additionalEvents.push(eventFor(item, openedOperation, user)); } else ({ prep, open } = findOpenAliquot()); const used = parseLocalizedNumber(operation.quantity), previousVolume = open.remainingVolume; if (!Number.isFinite(used) || used <= 0 || used > previousVolume) throw new Error("Le volume utilisé doit être positif et inférieur ou égal au volume restant."); before = clone(open); open.remainingVolume = round(previousVolume - used); open.sourceEquivalentRemaining = round(open.sourceEquivalentInitial * open.remainingVolume / open.initialVolume); operation.sourceEquivalentConsumed = round(before.sourceEquivalentRemaining - open.sourceEquivalentRemaining); operation.sourceUnit = prep.sourceUnit; if (open.remainingVolume <= 0) { open.remainingVolume = 0; open.sourceEquivalentRemaining = 0; open.status = "finished"; open.finishedAt = now; } open.version += 1; open.updatedAt = now; open.updatedBy = by; prep.version += 1; prep.updatedAt = now; prep.updatedBy = by; operation.entityId = open.id; operation.entityType = "open_aliquot"; operation.preparationId = prep.id; operation.unit = open.volumeUnit; after = clone(open); }
    else if (operation.type === "open_aliquot_moved") { const { prep, open } = findOpenAliquot(); if (!operation.toLocation || operation.toLocation === open.location) throw new Error("Sélectionnez une nouvelle localisation."); before = clone(open); operation.fromLocation = open.location; open.location = operation.toLocation; open.locationId = operation.toLocation; open.version += 1; open.updatedAt = now; open.updatedBy = by; prep.version += 1; operation.preparationId = prep.id; operation.entityType = "open_aliquot"; after = clone(open); }
    else if (operation.type === "open_aliquot_discarded") { const { prep, open } = findOpenAliquot(); if (open.remainingVolume > 0 && !operation.correctionReason) throw new Error("Une raison est obligatoire pour jeter le reliquat."); before = clone(open); operation.quantity = open.remainingVolume; operation.unit = open.volumeUnit; operation.sourceEquivalentConsumed = open.sourceEquivalentRemaining; operation.sourceUnit = prep.sourceUnit; open.remainingVolume = 0; open.sourceEquivalentRemaining = 0; open.status = "finished"; open.finishedAt = now; open.version += 1; open.updatedAt = now; open.updatedBy = by; prep.version += 1; operation.preparationId = prep.id; operation.entityType = "open_aliquot"; after = clone(open); }
    else if (["aliquots_consumed", "aliquots_moved", "preparation_recounted", "preparation_finished"].includes(operation.type)) { const prep = findPrep(); before = clone(prep); if (operation.type === "aliquots_consumed") { const rawQty = parseLocalizedNumber(operation.quantity), qty = Math.trunc(rawQty), row = prep.locations.find(entry => entry.location === operation.fromLocation); if (!Number.isInteger(rawQty) || qty <= 0 || !row || row.quantity < qty) throw new Error("Nombre d’aliquotes insuffisant dans cette localisation."); operation.sourceEquivalentConsumed = prep.createdCount ? round(prep.representedSourceQuantity * qty / prep.createdCount) : 0; operation.sourceUnit = prep.sourceUnit; row.quantity -= qty; } else if (operation.type === "aliquots_moved") { const rawQty = parseLocalizedNumber(operation.quantity), qty = Math.trunc(rawQty), from = prep.locations.find(entry => entry.location === operation.fromLocation), to = rowAt(prep.locations, operation.toLocation); if (!Number.isInteger(rawQty) || qty <= 0 || !from || from.quantity < qty) throw new Error("Nombre d’aliquotes insuffisant dans cette localisation."); from.quantity -= qty; to.quantity += qty; } else if (operation.type === "preparation_recounted") { const target = Math.trunc(number(operation.quantity)), row = rowAt(prep.locations, operation.fromLocation); if (target < 0) throw new Error("Le comptage ne peut pas être négatif."); row.quantity = target; } else { if (prep.openAliquots.some(row => row.status === "open")) throw new Error("Terminez ou jetez d’abord les aliquotes ouvertes de cette préparation."); if (remainingAliquots(prep) > 0 && !operation.correctionReason) throw new Error("Une justification est obligatoire pour terminer une préparation non vide."); prep.status = "finished"; prep.finishedAt = now; } prep.locations = prep.locations.filter(row => row.quantity); prep.version += 1; prep.updatedAt = now; prep.updatedBy = by; operation.preparationId = prep.id; after = clone(prep); }
    else throw new Error("Opération de stock non prise en charge.");
    syncClosedSummary(tracking);
    if (tracking.mode === "simple" && (operation.type === "aliquots_prepared" || ["aliquots_consumed", "open_aliquot_consumed", "open_aliquot_discarded", "preparation_recounted", "preparation_finished"].includes(operation.type))) {
      const simpleAliquotEquivalentAfter = aliquots.preparations.filter(row => row.status === "active").reduce((sum, prep) => sum + aliquotEquivalent(prep), 0);
      item.quantity = round(number(item.quantity) - simpleSourceUsed + simpleAliquotEquivalentAfter - simpleAliquotEquivalentBefore);
    }
    const simpleLocations = tracking.mode === "simple" ? [...(Array.isArray(item.locations) ? item.locations : []), item.location] : [];
    item.stockTracking = tracking; item.aliquotTracking = aliquots; item.quantity = available(item); item.locations = Array.from(new Set([...simpleLocations, ...tracking.closedByLocation.map(row => row.location), ...tracking.openContainers.filter(row => row.status === "open").map(row => row.location), ...aliquots.preparations.flatMap(prep => prep.locations.map(row => row.location))].filter(Boolean))); item.location = item.locations[0] || item.location || "";
    operation.before = before; operation.after = after; const event = eventFor(item, operation, user); return { item, event, events: [...additionalEvents, event] };
  }

  window.StockTracking = { VERSION, id, normalizeUnitLabel, parseLocalizedNumber, packagingPreview, migrationComparison, migrationPresentation, normalizeTracking, normalizeAliquots, capacity, trackingLevel, trackingFactor, trackingCapacity, fromBaseQuantity, toBaseQuantity, validateUnitQuantity, totalClosed, remainingAliquots, aliquotEquivalent, activeAliquotEquivalent, simpleRawAvailable, available, format, plural, summary, validateStep, apply };
})();
