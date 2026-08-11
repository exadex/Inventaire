(function () {
  "use strict";

  const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const ROOM_LABELS = {
    "room-bureau": "Bureau",
    "room-laboratoire": "Laboratoire",
    "room-reserve": "Réserve",
    "room-culture-l1": "Culture L1",
    "room-culture-l2": "Culture L2",
    "room-chambre-froide": "Chambre froide",
    "room-piece-80": "Pièce -80°C"
  };

  const asArray = value => Array.isArray(value) ? value : [];
  const hasValue = value => value !== null && value !== undefined && String(value).trim() !== "";
  const safeNumber = value => Number.isFinite(Number(value)) ? Number(value) : "";
  const yesNo = value => value === true ? "Oui" : value === false ? "Non" : "";
  const compare = (left, right) => String(left || "").localeCompare(String(right || ""), "fr", { numeric: true, sensitivity: "base" });

  function xml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  function fileSafe(value) {
    return String(value || "Sauvegarde").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function parisStamp(dateValue, fallback = "") {
    const date = dateValue ? new Date(dateValue) : null;
    if (date && !Number.isNaN(date.getTime())) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
      return `${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}`;
    }
    const match = String(fallback).match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})/);
    return match ? match[1] : new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  }

  function formatDateTime(dateValue, fallback = "") {
    const date = dateValue ? new Date(dateValue) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : String(fallback || "");
  }

  function backupDescriptor(backup, entry = {}) {
    const folder = entry.folder || (String(entry.path || "").match(/backups\/([^/]+)\//) || [])[1] || "full";
    const inventoryOnly = backup?.type === "inventory" || folder === "inventory";
    const labels = {
      inventory: ["Copie hebdomadaire de l'inventaire", "Copie_hebdomadaire_inventaire"],
      full: ["Copie complète mensuelle", "Copie_complete_mensuelle"],
      manual: ["Copie complète manuelle", "Copie_complete_manuelle"],
      "restore-points": ["Point de restauration", "Point_de_restauration"]
    };
    const [label, slug] = labels[folder] || (inventoryOnly ? labels.inventory : labels.full);
    const stamp = parisStamp(backup?.createdAt, entry.name || entry.path || backup?.period);
    return { folder, inventoryOnly, label, slug, stamp, baseName: `${slug}_${stamp}` };
  }

  function backupState(backup, inventoryOnly = false) {
    if (inventoryOnly) return { inventoryItems: asArray(backup?.inventoryItems) };
    if (backup?.snapshot && typeof backup.snapshot === "object") return backup.snapshot;
    if (backup && typeof backup === "object" && Array.isArray(backup.inventoryItems)) return backup;
    throw new Error("Cette sauvegarde ne contient pas de données exportables.");
  }

  function download(bytes, filename, type) {
    const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function catalogMaps(state) {
    const catalog = state?.locationCatalog || {};
    return {
      locations: new Map(asArray(catalog.locations).map(row => [row.id, row])),
      sublocations: new Map(asArray(catalog.sublocations).map(row => [row.id, row]))
    };
  }

  function itemPlacements(item, state) {
    const maps = catalogMaps(state);
    const saved = asArray(item?.placements);
    if (saved.length) return saved.map(placement => {
      const location = maps.locations.get(placement.locationId);
      const sublocation = maps.sublocations.get(placement.sublocationId);
      return {
        roomId: placement.roomId || location?.roomId || "",
        room: ROOM_LABELS[placement.roomId || location?.roomId] || "",
        locationId: placement.locationId || "",
        location: location?.name || "",
        sublocationId: placement.sublocationId || "",
        sublocation: sublocation?.name || ""
      };
    });
    const legacy = asArray(item?.locations).length ? item.locations : [item?.location].filter(Boolean);
    return legacy.map(name => {
      const location = [...maps.locations.values()].find(row => row.name === name);
      const roomId = location?.roomId || Object.keys(ROOM_LABELS).find(id => ROOM_LABELS[id] === name) || "";
      return { roomId, room: ROOM_LABELS[roomId] || "", locationId: location?.id || "", location: location?.name || (!roomId ? name : ""), sublocationId: "", sublocation: "" };
    });
  }

  function stockSnapshot(item) {
    const raw = item?.stockTracking || {};
    const detailed = raw.mode === "containers";
    const opened = detailed ? asArray(raw.openContainers).filter(row => row.status === "open" && Number(row.remaining) > 0).length : 0;
    const closed = detailed ? (asArray(raw.closedContainers).length || asArray(raw.closedByLocation).reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)) : 0;
    let remaining = safeNumber(item?.quantity);
    try {
      if (window.StockTracking?.available) remaining = window.StockTracking.available(item);
    } catch {
      remaining = safeNumber(item?.quantity);
    }
    const minimum = hasValue(item?.minStock) ? Number(item.minStock) : null;
    const current = Number(remaining) || 0;
    let status = "Seuil non défini";
    if (minimum !== null && Number.isFinite(minimum)) status = current <= minimum ? "Critique" : current >= (minimum === 0 ? 0.5 : minimum * 1.5) ? "Stock sain" : "Attention";
    return { opened, closed, remaining, status };
  }

  function usageLabel(value) {
    return ({ routine: "Routine", backup: "Back-up", normal: "Normal" })[String(value || "").toLowerCase()] || String(value || "Normal");
  }

  function buildItemsSheet(state, descriptor) {
    const items = asArray(state.inventoryItems).slice().sort((a, b) => compare(a.category, b.category) || compare(a.name, b.name));
    const maxPlacements = Math.max(1, ...items.map(item => itemPlacements(item, state).length));
    const maxSecondary = Math.max(0, ...items.map(item => asArray(item?.references?.secondary).length));
    const headers = ["Catégorie", "Nom", "Quantité", "Unité", "Unités ouvertes", "Unités fermées", "Stock restant", "Seuil minimum", "État du stock", "Salle 1", "Localisation 1", "Sous-localisation 1", "Tags", "Profil d'utilisation", "Notes", "Date de création", "Fournisseur", "Référence 1", "Lien", "Notes référence 1", "Prix", "Prix unitaire", "Délai de livraison"];
    for (let index = 2; index <= maxPlacements; index += 1) headers.push(`Salle ${index}`, `Localisation ${index}`, `Sous-localisation ${index}`);
    for (let index = 2; index <= maxSecondary + 1; index += 1) headers.push(`Référence ${index}`, `Notes référence ${index}`);
    const rows = [];
    let previousCategory = null;
    items.forEach(item => {
      if (previousCategory !== null && item.category !== previousCategory) rows.push([]);
      previousCategory = item.category;
      const placements = itemPlacements(item, state);
      const first = placements[0] || {};
      const stock = stockSnapshot(item);
      const primary = item?.references?.primary || {};
      const row = [item.category || "", item.name || "", safeNumber(item.quantity), item.unit || "", stock.opened, stock.closed, stock.remaining, hasValue(item.minStock) ? safeNumber(item.minStock) : "", stock.status, first.room || "", first.location || "", first.sublocation || "", asArray(item.tags).join(" · "), usageLabel(item.usageProfile), item.notes || "", item.createdAt || item.createdAtRaw || "", primary.supplier || "", primary.reference || "", primary.link || "", primary.notes || "", primary.price || "", primary.unitPrice || "", primary.leadTime || ""];
      for (let index = 1; index < maxPlacements; index += 1) {
        const placement = placements[index] || {};
        row.push(placement.room || "", placement.location || "", placement.sublocation || "");
      }
      const secondary = asArray(item?.references?.secondary);
      for (let index = 0; index < maxSecondary; index += 1) row.push(secondary[index]?.reference || "", secondary[index]?.notes || "");
      rows.push(row);
    });
    const widths = [24, 34, 12, 13, 16, 16, 15, 15, 18, 18, 22, 22, 24, 18, 38, 20, 22, 22, 34, 34, 13, 15, 19];
    for (let index = 2; index <= maxPlacements; index += 1) widths.push(18, 22, 22);
    for (let index = 0; index < maxSecondary; index += 1) widths.push(24, 34);
    return { name: "Items", title: descriptor.label, subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)} · ${items.length} items`, headers, rows, widths, headerStyle: 2 };
  }

  function clientTypeLabel(type) {
    return type === "client_product" ? "Produit reçu du client" : type === "created_sample" ? "Échantillon créé" : String(type || "");
  }

  function buildClientSheet(state, descriptor) {
    const samples = asArray(state.clientSamples).filter(row => !(row.groupId && row.replicaCount && !row.replicaNumber && !row.replicaId)).sort((a, b) => compare(a.canonicalClientCode || a.clientCode, b.canonicalClientCode || b.clientCode) || ((a.type === "client_product" ? 0 : 1) - (b.type === "client_product" ? 0 : 1)) || compare(a.baseName || a.name, b.baseName || b.name) || (Number(a.replicaNumber) || 0) - (Number(b.replicaNumber) || 0));
    const rows = [];
    let previousClient = null;
    samples.forEach(sample => {
      const client = sample.canonicalClientCode || sample.clientCode || sample.rawClientCode || "";
      if (previousClient !== null && client !== previousClient) rows.push([]);
      previousClient = client;
      const quantity = hasValue(sample.measureValue) ? sample.measureValue : sample.quantity;
      const unit = sample.measureUnit || sample.unit || "";
      rows.push([client, clientTypeLabel(sample.type), sample.name || sample.baseName || "", hasValue(sample.replicaNumber) ? safeNumber(sample.replicaNumber) : "", sample.type === "client_product" ? (sample.arrivalDate || sample.createdAt || "") : (sample.creationDate || sample.createdAt || ""), sample.category || "", safeNumber(quantity), unit, sample.referenceNumber || "", sample.lotNumber || "", sample.location || "", sample.notes || sample.specificData?.notes || ""]);
    });
    return { name: "Études clients", title: "Études clients", subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)} · ${samples.length} produits et échantillons`, headers: ["Code client", "Type", "Nom", "N° de réplique", "Date d'arrivée / création", "Catégorie", "Quantité", "Unité", "Référence", "Lot", "Localisation", "Notes"], rows, widths: [16, 26, 38, 15, 23, 22, 12, 12, 20, 18, 26, 42], headerStyle: 3 };
  }

  function inferredPlacements(item, state) {
    return itemPlacements(item, state).map(row => ({ roomId: row.roomId, locationId: row.locationId, sublocationId: row.sublocationId }));
  }

  function buildLocationSheet(state, descriptor) {
    const catalog = state.locationCatalog || {};
    const locations = asArray(catalog.locations);
    const sublocations = asArray(catalog.sublocations);
    const itemPaths = asArray(state.inventoryItems).flatMap(item => inferredPlacements(item, state));
    const samples = asArray(state.clientSamples);
    const rows = [];
    Object.entries(ROOM_LABELS).forEach(([roomId, roomName]) => {
      const roomLocations = locations.filter(row => row.roomId === roomId).sort((a, b) => compare(a.name, b.name));
      const directItems = itemPaths.filter(path => path.roomId === roomId && !path.locationId).length;
      const directSamples = samples.filter(sample => sample.location === roomName).length;
      rows.push([roomName, "", "", directItems, directSamples]);
      roomLocations.forEach(location => {
        const directLocationItems = itemPaths.filter(path => path.roomId === roomId && path.locationId === location.id && !path.sublocationId).length;
        const locationSamples = samples.filter(sample => sample.location === location.name).length;
        rows.push([roomName, location.name || "", "", directLocationItems, locationSamples]);
        sublocations.filter(row => row.locationId === location.id).sort((a, b) => compare(a.name, b.name)).forEach(sublocation => {
          rows.push([roomName, location.name || "", sublocation.name || "", itemPaths.filter(path => path.sublocationId === sublocation.id).length, samples.filter(sample => sample.location === sublocation.name).length]);
        });
      });
    });
    return { name: "Localisations", title: "Localisations", subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)}`, headers: ["Salle", "Localisation", "Sous-localisation", "Nombre d'items inventaire", "Nombre d'échantillons clients"], rows, widths: [24, 30, 30, 25, 30], headerStyle: 4 };
  }

  function buildExperimentsSheet(descriptor) {
    return { name: "Expériences", title: "Expériences", subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)}`, headers: ["Statut"], rows: [["En cours de préparation"]], widths: [42], headerStyle: 5 };
  }

  function orderStatus(value) {
    return ({ requested: "Demandé", ordered: "Commandé", received: "Reçu" })[value] || String(value || "");
  }

  function buildOrdersSheet(state, descriptor) {
    const orders = asArray(state.orders).slice().sort((a, b) => compare(b.requestedAtRaw || b.requestedAt, a.requestedAtRaw || a.requestedAt));
    const rows = orders.map(order => [order.itemName || "", orderStatus(order.status), order.itemMode === "existing" ? "Item existant" : order.itemMode === "new" ? "Nouvel item" : order.itemMode || "", safeNumber(order.requestedQuantity), safeNumber(order.receivedQuantity), order.priority || "", order.notes || "", order.requestedBy || "", order.requestedAt || order.requestedAtRaw || "", order.orderedBy || "", order.orderedAt || order.orderedAtRaw || "", order.receivedBy || "", order.receivedAt || order.receivedAtRaw || "", yesNo(order.addedToInventory), hasValue(order.addedToInventoryQuantity) ? safeNumber(order.addedToInventoryQuantity) : "", order.addedToInventoryAt || order.addedToInventoryAtRaw || ""]);
    return { name: "Commandes", title: "Historique des commandes", subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)} · ${orders.length} demandes`, headers: ["Item / Nom", "Statut", "Type de demande", "Quantité demandée", "Quantité reçue", "Priorité", "Notes", "Demandé par", "Date demandée", "Commandé par", "Date commandée", "Reçu par", "Date d'arrivée", "Ajouté à l'inventaire", "Quantité ajoutée", "Date d'ajout à l'inventaire"], rows, widths: [38, 14, 19, 19, 17, 14, 48, 17, 20, 17, 20, 17, 20, 23, 18, 25], headerStyle: 6 };
  }

  function buildContactsSheet(state, descriptor) {
    const contacts = asArray(state.supplierContacts).slice().sort((a, b) => compare(a.company, b.company));
    const rows = contacts.map(contact => [contact.company || "", contact.salesRepresentative || "", contact.afterSalesService || "", contact.customerService || "", contact.salesAndQuotes || "", contact.phone || "", asArray(contact.coordinates).map(row => `${row.label || row.type || "Coordonnée"} : ${row.value || ""}`).join("\n"), asArray(contact.aliases).join(" · "), contact.notes || ""]);
    return { name: "Contacts", title: "Contacts fournisseurs", subtitle: `État enregistré le ${formatDateTime(descriptor.createdAt, descriptor.stamp)} · ${contacts.length} contacts`, headers: ["Entreprise", "Commercial", "Service après-vente", "Service client", "Ventes et devis", "Téléphone", "Coordonnées supplémentaires", "Alias", "Notes"], rows, widths: [27, 28, 28, 30, 30, 19, 44, 28, 42], headerStyle: 7 };
  }

  function buildSummarySheet(state, backup, descriptor) {
    const summary = backup?.summary || {};
    const count = (key, fallback) => Number.isFinite(Number(summary[key])) ? Number(summary[key]) : fallback;
    const rows = [
      ["Type de copie", descriptor.label],
      ["Date et heure", formatDateTime(backup?.createdAt, descriptor.stamp)],
      ["Créée par", backup?.createdBy || "Utilisateur inventaire"],
      ["Items", count("inventoryItems", asArray(state.inventoryItems).length)],
      ["Études clients", count("clientSamples", asArray(state.clientSamples).length)],
      ["Localisations", count("locations", asArray(state.locationCatalog?.locations).length)],
      ["Expériences", count("experiments", asArray(state.experiments).length)],
      ["Commandes", count("orders", asArray(state.orders).length)],
      ["Contacts", count("contacts", asArray(state.supplierContacts).length)]
    ];
    return { name: "Résumé", title: "Résumé de la sauvegarde", subtitle: descriptor.label, headers: ["Information", "Valeur"], rows, widths: [28, 48], headerStyle: 8 };
  }

  function buildSheets(backup, entry = {}) {
    const baseDescriptor = backupDescriptor(backup, entry);
    const descriptor = { ...baseDescriptor, createdAt: backup?.createdAt };
    const state = backupState(backup, descriptor.inventoryOnly);
    if (descriptor.inventoryOnly) return { descriptor, sheets: [buildItemsSheet(state, descriptor)] };
    return { descriptor, sheets: [buildSummarySheet(state, backup, descriptor), buildItemsSheet(state, descriptor), buildClientSheet(state, descriptor), buildLocationSheet(state, descriptor), buildExperimentsSheet(descriptor), buildOrdersSheet(state, descriptor), buildContactsSheet(state, descriptor)] };
  }

  function columnName(index) {
    let result = "";
    for (let value = index + 1; value; value = Math.floor((value - 1) / 26)) result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
    return result;
  }

  function cellXml(value, ref, style) {
    if (value === null || value === undefined || value === "") return `<c r="${ref}" s="${style}" t="inlineStr"><is><t></t></is></c>`;
    if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  }

  function worksheetXml(sheet) {
    const columnCount = Math.max(1, sheet.headers.length);
    const lastColumn = columnName(columnCount - 1);
    const rows = [];
    rows.push(`<row r="1" ht="25" customHeight="1">${cellXml(sheet.title, "A1", 1)}</row>`);
    rows.push(`<row r="2" ht="20" customHeight="1">${cellXml(sheet.subtitle, "A2", 10)}</row>`);
    rows.push(`<row r="3"></row>`);
    rows.push(`<row r="4" ht="31" customHeight="1">${sheet.headers.map((header, index) => cellXml(header, `${columnName(index)}4`, sheet.headerStyle)).join("")}</row>`);
    sheet.rows.forEach((row, rowIndex) => {
      const number = rowIndex + 5;
      rows.push(`<row r="${number}"${row.length ? " ht=\"28\" customHeight=\"1\"" : " ht=\"10\" customHeight=\"1\""}>${row.map((value, index) => cellXml(value, `${columnName(index)}${number}`, 9)).join("")}</row>`);
    });
    const lastRow = Math.max(4, sheet.rows.length + 4);
    const cols = sheet.widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${Math.max(8, width)}" customWidth="1"/>`).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A4:${lastColumn}${lastRow}"/><mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/></mergeCells><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  }

  function stylesXml() {
    const fills = ["<fill><patternFill patternType=\"none\"/></fill>", "<fill><patternFill patternType=\"gray125\"/></fill>", ...["1B4537", "2F7659", "267A78", "356FA3", "6B7280", "A44444", "B5652A", "73548C"].map(color => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`)];
    const headerXf = fillId => `<xf numFmtId="0" fontId="1" fillId="${fillId}" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><i/><color rgb="FF64756E"/><sz val="10"/><name val="Calibri"/></font></fonts><fills count="${fills.length}">${fills.join("")}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFFFFFFF"/></left><right style="thin"><color rgb="FFFFFFFF"/></right><top style="thin"><color rgb="FFFFFFFF"/></top><bottom style="thin"><color rgb="FFFFFFFF"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="11"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${headerXf(2)}${headerXf(3)}${headerXf(4)}${headerXf(5)}${headerXf(6)}${headerXf(7)}${headerXf(8)}${headerXf(9)}<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }

  function workbookFiles(sheets) {
    const sheetEntries = sheets.map((sheet, index) => `<sheet name="${xml(String(sheet.name).slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
    const rels = sheets.map((sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
    const overrides = sheets.map((sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
    const files = {
      "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${overrides}</Types>`,
      "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
      "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>ExAdEx Inventaire</dc:creator><cp:lastModifiedBy>ExAdEx Inventaire</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`,
      "docProps/app.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>ExAdEx Inventaire</Application><TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map(sheet => `<vt:lpstr>${xml(sheet.name)}</vt:lpstr>`).join("")}</vt:vector></TitlesOfParts></Properties>`,
      "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews><sheets>${sheetEntries}</sheets><calcPr calcId="191029"/></workbook>`,
      "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      "xl/styles.xml": stylesXml()
    };
    sheets.forEach((sheet, index) => { files[`xl/worksheets/sheet${index + 1}.xml`] = worksheetXml(sheet); });
    return files;
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let value = n;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
      table[n] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    bytes.forEach(byte => { crc = CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8); });
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function concatBytes(chunks) {
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    chunks.forEach(chunk => { result.set(chunk, offset); offset += chunk.length; });
    return result;
  }

  function zipFiles(files) {
    const encoder = new TextEncoder();
    const local = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    Object.entries(files).forEach(([name, content]) => {
      const nameBytes = encoder.encode(name);
      const data = encoder.encode(content);
      const crc = crc32(data);
      const localHeader = new Uint8Array(30);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034B50, true); localView.setUint16(4, 20, true); localView.setUint16(6, 0x0800, true); localView.setUint16(8, 0, true); localView.setUint16(10, dosTime, true); localView.setUint16(12, dosDate, true); localView.setUint32(14, crc, true); localView.setUint32(18, data.length, true); localView.setUint32(22, data.length, true); localView.setUint16(26, nameBytes.length, true);
      const localRecord = concatBytes([localHeader, nameBytes, data]);
      local.push(localRecord);
      const centralHeader = new Uint8Array(46);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014B50, true); centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true); centralView.setUint16(8, 0x0800, true); centralView.setUint16(10, 0, true); centralView.setUint16(12, dosTime, true); centralView.setUint16(14, dosDate, true); centralView.setUint32(16, crc, true); centralView.setUint32(20, data.length, true); centralView.setUint32(24, data.length, true); centralView.setUint16(28, nameBytes.length, true); centralView.setUint32(42, offset, true);
      central.push(concatBytes([centralHeader, nameBytes]));
      offset += localRecord.length;
    });
    const centralBytes = concatBytes(central);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054B50, true); endView.setUint16(8, central.length, true); endView.setUint16(10, central.length, true); endView.setUint32(12, centralBytes.length, true); endView.setUint32(16, offset, true);
    return concatBytes([...local, centralBytes, end]);
  }

  async function exportExcel(backup, entry = {}) {
    const { descriptor, sheets } = buildSheets(backup, entry);
    const bytes = zipFiles(workbookFiles(sheets));
    download(bytes, `${fileSafe(descriptor.baseName)}.xlsx`, MIME_XLSX);
    return { filename: `${fileSafe(descriptor.baseName)}.xlsx`, sheets: sheets.map(sheet => sheet.name) };
  }

  async function exportJson(backup, entry = {}) {
    const descriptor = backupDescriptor(backup, entry);
    let state;
    if (descriptor.inventoryOnly) {
      const latest = await window.ExadexGithubStorage?.loadSharedData?.({ fresh: true, cache: false });
      if (!latest?.data) throw new Error("Le fichier shared_data.json actuel est nécessaire pour compléter cette copie hebdomadaire.");
      state = { ...latest.data, inventoryItems: asArray(backup?.inventoryItems) };
    } else {
      state = backupState(backup, false);
    }
    const content = `${JSON.stringify(state, null, 2)}\n`;
    const filename = `shared_data_${fileSafe(descriptor.baseName)}.json`;
    download(new Blob([content], { type: "application/json;charset=utf-8" }), filename, "application/json");
    return { filename, state };
  }

  window.ExadexBackupExport = { exportExcel, exportJson, buildSheets, backupDescriptor, zipFiles, workbookFiles };
})();
