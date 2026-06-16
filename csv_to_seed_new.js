// Separa una línea de CSV/TSV respetando comillas.
function parseDelimitedLine(line, delimiter = ";") {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

// Detecta si el texto pegado viene con tabs, ; o ,.
function detectDelimiter(text) {
  const firstLine = text
    .split("\n")
    .map(line => line.trimEnd())
    .find(line => line.trim() !== "") || "";

  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes(";")) return ";";
  if (firstLine.includes(",")) return ",";
  return "\t";
}

// Limpia comillas sobrantes, retornos y espacios.
function cleanCsvValue(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\r/g, "")
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

// Normaliza espacios dobles y deja el texto limpio.
function normalizeSpaces(value) {
  return cleanCsvValue(value).replace(/\s+/g, " ").trim();
}

// Convierte valores tipo "13,5", "NC", "100*" a número utilizable.
function csvToNumber(value) {
  const raw = normalizeSpaces(value)
    .replace(/\u00a0/g, " ")
    .replace(",", ".")
    .replace(/[^\d.\-]/g, "");

  if (!raw || raw === "." || raw === "-" || raw.toLowerCase() === "nc") return null;

  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function normalizeHeaderName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Categorías oficiales de la app.
const inventoryCategories = [
  "Procédé ExAdEx L2",
  "Culture Cell",
  "Biomol",
  "Microscopie",
  "Qualité",
  "FACS",
  "Muse",
  "Bureautique",
  "Code Famille",
  "Cones pipettes",
  "Indispensable"
];

// Localizaciones oficiales de la app.
// Todo lo que venga sucio del Excel intentará caer en una de estas.
const inventoryLocations = [
  "Bureau",
  "Réserve",
  "Laboratoire",
  "Chambre froide",
  "Culture L1",
  "Culture L2",
  "-80°C",
  "Frigo culture L1",
  "-20°C culture L1",
  "-20°C 1 salle -80",
  "-20°C 2 salle -80",
  "-20°C 3 salle -80",
  "Frigo labo",
  "-20°C blanc labo",
  "-20°C gris labo",
  "-20°C Floricia labo"
];

// Traducción de categorías antiguas o legacy a categorías oficiales.
const legacyCategoryMap = {
  Enzymes: "Procédé ExAdEx L2",
  Milieux: "Culture Cell",
  Anticorps: "Biomol",
  Primers: "Biomol",
  Composes: "Culture Cell",
  Consommables: "Indispensable",
  Kits: "Biomol"
};

// Traducción exacta de ubicaciones antiguas muy concretas.
// Solo se usa para casos legacy conocidos.
const legacyLocationMap = {
  "Freezer -20C / Rack B2": "-20°C blanc labo",
  "Chambre froide / Etagere 3": "Chambre froide",
  "Freezer -80C / Boite AC-04": "-80°C",
  "Freezer -20C / Boite PR-12": "-20°C gris labo",
  "Freezer -20C / Rack C1": "-20°C Floricia labo",
  "Salle culture / Armoire A": "Culture L1",
  "Chambre froide / Kit shelf": "Chambre froide",
  "Stock central / Bac C": "Laboratoire"
};

const csvFieldAliases = {
  category: ["categories", "catégories", "category", "categorie", "catégorie"],
  tags: ["tags", "tag"],
  name: ["nom", "name", "produit", "item"],
  notes: ["notes", "note"],
  quantity: ["quantite", "quantité", "quantity", "qte", "qté"],
  location: ["localisation", "emplacement", "location", "lieu"],
  referenceNotes: ["notes reference", "notes référence", "reference notes", "reference_notes"],
  reference: ["reference", "référence", "ref"],
  supplier: ["fournisseur", "supplier"],
  price: ["prix", "price"],
  unitPrice: ["prix unitaire", "unit price", "unit_price"],
  minStock: ["seuil minimum", "stock minimum", "min stock", "min_stock"],
  link: ["lien", "link", "url"],
  leadTime: ["delais livraison", "délais livraison", "lead time", "lead_time"]
};

function getRowValue(row, key) {
  const aliases = csvFieldAliases[key] || [key];

  for (const alias of aliases) {
    const normalized = normalizeHeaderName(alias);
    if (row[normalized] != null && String(row[normalized]).trim() !== "") {
      return row[normalized];
    }
  }

  return "";
}

function getHeaderIndex(headers, key) {
  const aliases = csvFieldAliases[key] || [key];

  for (const alias of aliases) {
    const normalized = normalizeHeaderName(alias);
    const index = headers.indexOf(normalized);
    if (index !== -1) return index;
  }

  return -1;
}

function parseCsvTextToSeedItems(csvText) {
  const lines = csvText
    .split("\n")
    .map(line => line.trimEnd())
    .filter(line => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("El CSV parece vacío o solo tiene cabecera.");
  }

  const delimiter = detectDelimiter(csvText);
  const rawHeaders = parseDelimitedLine(lines[0], delimiter).map(cleanCsvValue);
  const headers = rawHeaders.map(normalizeHeaderName);

  const importantKeys = [
    "category",
    "tags",
    "name",
    "notes",
    "quantity",
    "location",
    "referenceNotes",
    "reference",
    "supplier",
    "price",
    "unitPrice",
    "minStock",
    "link",
    "leadTime"
  ];

  if (getHeaderIndex(headers, "name") === -1) {
    throw new Error('Falta la columna obligatoria "Nom" / "Name".');
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    const row = {};

    importantKeys.forEach((key) => {
      const index = getHeaderIndex(headers, key);
      if (index === -1) return;

      const matchedHeader = headers[index];
      row[matchedHeader] = cleanCsvValue(values[index] || "");
    });

    return row;
  });

  return rows
    .filter(row => !shouldSkipCsvRow(row))
    .map((row, index) => buildItemFromCsvRow(row, index));
}

// Devuelve true si parece una URL real usable en href.
function isLikelyUrl(value) {
  const raw = normalizeSpaces(value);
  return /^https?:\/\//i.test(raw);
}

// Detecta si un texto es solo una nota técnica corta como 60ml, 500 uL, 25 mg.
function isPureTechnicalNote(value) {
  const raw = normalizeSpaces(value).toLowerCase();
  if (!raw) return false;

  return /^(?:~?\s*)?\d+(?:[.,]\d+)?\s*(ml|mL|ul|µl|uL|mg|g|kg|l|L)$/.test(raw);
}

// Intenta extraer una unidad técnica desde notas o cantidad.
function extractTechnicalUnit(value) {
  const raw = normalizeSpaces(value).toLowerCase();
  if (!raw) return "";

  if (/(^|\s)\d+(?:[.,]\d+)?\s*(ml)(\s|$)/i.test(raw)) return "mL";
  if (/(^|\s)\d+(?:[.,]\d+)?\s*(µl|ul)(\s|$)/i.test(raw)) return "uL";
  if (/(^|\s)\d+(?:[.,]\d+)?\s*(mg)(\s|$)/i.test(raw)) return "mg";
  if (/(^|\s)\d+(?:[.,]\d+)?\s*(kg)(\s|$)/i.test(raw)) return "kg";
  if (/(^|\s)\d+(?:[.,]\d+)?\s*(g)(\s|$)/i.test(raw)) return "g";
  if (/(^|\s)\d+(?:[.,]\d+)?\s*(l)(\s|$)/i.test(raw)) return "L";

  return "";
}

// Intenta deducir la unidad a partir del nombre, notas o cantidad.
function inferUnitFromRow(row) {
  const note = normalizeSpaces(getRowValue(row, "notes"));
  const qtyText = normalizeSpaces(getRowValue(row, "quantity"));
  const name = normalizeSpaces(getRowValue(row, "name")).toLowerCase();

  const unitFromNote = extractTechnicalUnit(note);
  if (unitFromNote) return unitFromNote;

  const unitFromQty = extractTechnicalUnit(qtyText);
  if (unitFromQty) return unitFromQty;

  if (/ml/i.test(note) || /ml/i.test(qtyText) || /\bml\b/i.test(name)) return "mL";
  if (/µl|ul/i.test(note) || /µl|ul/i.test(qtyText) || /\bul\b/i.test(name)) return "uL";
  if (/mg/i.test(note) || /mg/i.test(qtyText) || /\bmg\b/i.test(name)) return "mg";
  if (/\bkg\b/i.test(note) || /\bkg\b/i.test(qtyText) || /\bkg\b/i.test(name)) return "kg";
  if (/g\b/i.test(note) || /g\b/i.test(qtyText)) return "g";
  if (/flask|flacon/i.test(name)) return "flacons";
  if (/plaque|plate/i.test(name)) return "plaques";
  if (/seringue/i.test(name)) return "seringues";
  if (/tube|cryotube/i.test(name)) return "tubes";
  if (/gants|blouse|bouchon|robinet|filtre|tamis|lame/i.test(name)) return "unités";

  return "unités";
}

// Recupera notas del CSV, pero evita usar una nota puramente técnica como nota visible.
function buildNotesFromCsv(row) {
  const notes = normalizeSpaces(getRowValue(row, "notes"));
  if (!notes) return "";

  const isConditionnementValue = /^\d+(?:[.,]\d+)?\s*[a-zA-Zµμ]+?$/.test(notes) ||
    /^\d+(?:[.,]\d+)?$/.test(notes);

  if (isConditionnementValue) {
    return `Conditionnement : ${notes}`;
  }

  return notes;
}

// Normaliza la categoría del CSV a una categoría oficial.
function normalizeCsvCategory(value) {
  const raw = normalizeSpaces(value);

  if (!raw) return "Indispensable";
  if (inventoryCategories.includes(raw)) return raw;
  if (legacyCategoryMap[raw]) return legacyCategoryMap[raw];

  const lower = raw.toLowerCase();

  if (lower.includes("procédé exadex")) return "Procédé ExAdEx L2";
  if (lower.includes("culture")) return "Culture Cell";
  if (lower.includes("biomol")) return "Biomol";
  if (lower.includes("pipette")) return "Cones pipettes";
  if (lower.includes("bureau")) return "Bureautique";

  return "Indispensable";
}

// Quita acentos para comparar textos sucios más fácilmente.
function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Normaliza texto de ubicación para comparar mejor.
function normalizeLocationToken(value) {
  return stripAccents(normalizeSpaces(value))
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Busca coincidencia exacta con una ubicación oficial.
function findOfficialLocation(value) {
  const token = normalizeLocationToken(value);
  return inventoryLocations.find(location => normalizeLocationToken(location) === token) || "";
}

// Busca coincidencia exacta dentro del mapa legacy.
function findLegacyLocation(value) {
  const token = normalizeLocationToken(value);

  const match = Object.entries(legacyLocationMap).find(
    ([legacy]) => normalizeLocationToken(legacy) === token
  );

  return match ? match[1] : "";
}

// Ignora basura típica del Excel que no es una ubicación real.
function shouldIgnoreLocationToken(value) {
  const token = normalizeLocationToken(value);

  if (!token) return true;

  if ([
    "emplacement",
    "x",
    "-",
    ".",
    "?",
    "0",
    "5",
    "#ref!",
    "pas vu",
    "nc"
  ].includes(token)) {
    return true;
  }

  if (/^\d+$/.test(token)) return true;
  if (/^\d+\s*(cartons?|boites?|boites)$/i.test(token)) return true;

  return false;
}

// Divide una celda tipo "Bureau + L2 / réserve" en partes.
function splitRawLocations(value) {
  const raw = normalizeSpaces(value);

  if (!raw) return [];

  const prepared = raw
    .replace(/\s*\+\s*/g, ",")
    .replace(/\s*\/\s*/g, ",")
    .replace(/\s*&\s*/g, ",")
    .replace(/\bet\b/gi, ",")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  return prepared
    .split(",")
    .map(part => part.trim())
    .filter(part => part && !shouldIgnoreLocationToken(part));
}

// Convierte una ubicación sucia en una ubicación oficial.
function mapSingleLocation(rawValue) {
  const raw = normalizeSpaces(rawValue);
  const value = normalizeLocationToken(rawValue);

  if (!value || shouldIgnoreLocationToken(value)) return null;

  const official = findOfficialLocation(raw);
  if (official) return official;

  const legacy = findLegacyLocation(raw);
  if (legacy) return legacy;

  const hasCulture = value.includes("culture") || value === "l1" || value === "l2";
  const hasL1 = value.includes("l1") || value.includes("salle culture") || value.includes("salle de culture");
  const hasL2 = value.includes("l2");
  const hasFrigo = value.includes("frigo") || value.includes("figo") || value.includes("4°c") || value.includes("+4°c");
  const hasFreezer = (
    value.includes("congel") ||
    value.includes("congele") ||
    value.includes("-20") ||
    value.includes("-25") ||
    value.includes("tiroir elisa -20")
  );
  const hasFloricia = value.includes("floricia");

  if (value === "bureau") return "Bureau";
  if (value === "reserve" || value === "reserve ?" || value === "stock reserve") return "Réserve";

  if (
    value.includes("bureau") &&
    !hasFrigo &&
    !hasFreezer &&
    !value.includes("-80")
  ) {
    return "Bureau";
  }

  if (value.includes("reserve")) return "Réserve";

  if (
    value.includes("chambre froide") ||
    value.includes("chambre froid")
  ) {
    return "Chambre froide";
  }

  if (
    value === "-80" ||
    value === "-80°c" ||
    value.includes("congel -80") ||
    value.includes("congel 80") ||
    value.includes("congel -80°c") ||
    value.includes("freezer -80")
  ) {
    return "-80°C";
  }

  if (
    value.includes("congel gris labo") ||
    value.includes("-20 gris") ||
    value.includes("gris labo")
  ) {
    return "-20°C gris labo";
  }

  if (hasFloricia) {
    if (hasFreezer) return "-20°C Floricia labo";
    return "Laboratoire";
  }

  if (
    value.includes("-20 piece -80") ||
    value.includes("-20 salle -80") ||
    value.includes("piece -80")
  ) {
    return "-20°C 1 salle -80";
  }

  if (hasCulture && hasFrigo) {
    return "Frigo culture L1";
  }

  if (hasCulture && hasFreezer) {
    return "-20°C culture L1";
  }

  if (hasCulture) {
    if (hasL2) return "Culture L2";
    return "Culture L1";
  }

  if (
    value.includes("frigo grand labo") ||
    value.includes("grand labo frigo") ||
    value.includes("frigo labo") ||
    value.includes("port frigo labo") ||
    value.includes("porte frigo labo") ||
    value.includes("labo frigo")
  ) {
    return "Frigo labo";
  }

  if (
    value.includes("congel grand labo") ||
    value.includes("congel labo") ||
    value.includes("labo congel") ||
    value.includes("congel petit labo") ||
    value.includes("-20 labo") ||
    value.includes("grand labo/-20 grand labo") ||
    value.includes("-25°c") ||
    value.includes("-25c")
  ) {
    return "-20°C blanc labo";
  }

  if (
    value.includes("placard") ||
    value.includes("armoire") ||
    value.includes("paillasse") ||
    value.includes("bench") ||
    value.includes("microscopie") ||
    value.includes("poudre") ||
    value.includes("etagere") ||
    value.includes("labo") ||
    value.includes("tiroir")
  ) {
    return "Laboratoire";
  }

  return "Laboratoire";
}

// Devuelve una lista limpia de una o varias ubicaciones.
function normalizeCsvLocations(value) {
  const raw = normalizeSpaces(value);

  if (!raw) return ["Laboratoire"];

  const official = findOfficialLocation(raw);
  if (official) return [official];

  const legacy = findLegacyLocation(raw);
  if (legacy) return [legacy];

  const rawParts = splitRawLocations(raw);
  if (!rawParts.length) return ["Laboratoire"];

  const mapped = rawParts
    .map(mapSingleLocation)
    .filter(Boolean);

  const unique = [...new Set(mapped)];

  return unique.length ? unique : ["Laboratoire"];
}

// Devuelve solo la primera ubicación, útil para compatibilidad.
function normalizeCsvLocation(value) {
  return normalizeCsvLocations(value)[0];
}

// Convierte la columna tags en array.
function buildTagsFromCsv(value) {
  const raw = normalizeSpaces(value);
  if (!raw) return [];

  return raw
    .split(",")
    .map(part => normalizeSpaces(part))
    .filter(Boolean);
}

// Construye la referencia principal del item de forma compatible con la app.
// Si "link" no es URL real, lo pasamos a notes para no romper el <a href>.
function buildPrimaryReferenceFromCsv(row) {
  const supplier = normalizeSpaces(getRowValue(row, "supplier"));
  const reference = normalizeSpaces(getRowValue(row, "reference"));
  const rawLink = normalizeSpaces(getRowValue(row, "link"));
  const referenceNotes = normalizeSpaces(getRowValue(row, "referenceNotes"));
  const price = normalizeSpaces(getRowValue(row, "price"));
  const unitPrice = normalizeSpaces(getRowValue(row, "unitPrice"));
  const leadTime = normalizeSpaces(getRowValue(row, "leadTime"));

  const link = isLikelyUrl(rawLink) ? rawLink : "";
  const mergedNotes = [referenceNotes, !link && rawLink ? rawLink : ""]
    .filter(Boolean)
    .join(" · ");

  return {
    supplier,
    reference,
    link,
    notes: mergedNotes,
    price,
    unitPrice,
    leadTime
  };
}

// Crea el bloque references en formato app.
function buildReferencesFromCsv(row) {
  const primary = buildPrimaryReferenceFromCsv(row);
  const hasPrimary = Object.values(primary).some(Boolean);

  return hasPrimary
    ? { primary, secondary: [] }
    : { primary: {}, secondary: [] };
}

// Salta filas vacías o inútiles del CSV.
function shouldSkipCsvRow(row) {
  const category = normalizeSpaces(getRowValue(row, "category"));
  const name = normalizeSpaces(getRowValue(row, "name"));
  const reference = normalizeSpaces(getRowValue(row, "reference"));
  const supplier = normalizeSpaces(getRowValue(row, "supplier"));
  const quantity = normalizeSpaces(getRowValue(row, "quantity"));

  if (!category && !name && !reference && !supplier && !quantity) return true;
  if (!name) return true;

  return false;
}

// Construye un item final a partir de una fila del CSV.
function buildItemFromCsvRow(row, index) {
  const quantityParsed = csvToNumber(getRowValue(row, "quantity"));
  const minStockParsed = csvToNumber(getRowValue(row, "minStock"));
  const name = normalizeSpaces(getRowValue(row, "name"));
  const quantity = quantityParsed ?? 0;
  const minStock = minStockParsed ?? 0;
  const maxStock = quantity > 0
    ? Math.max(quantity * 2, minStock * 2, 1)
    : Math.max(minStock * 2, 1);

  const locations = normalizeCsvLocations(getRowValue(row, "location"));

  return {
    id: `itm-CSV-${String(index + 1).padStart(4, "0")}`,
    name,
    category: normalizeCsvCategory(getRowValue(row, "category")),
    quantity,
    unit: inferUnitFromRow(row),
    minStock,
    maxStock,
    location: locations[0],
    locations,
    tags: buildTagsFromCsv(getRowValue(row, "tags")),
    notes: buildNotesFromCsv(row),
    references: buildReferencesFromCsv(row)
  };
}

// Muestra todas las ubicaciones en formato texto.
function formatLocations(item) {
  const values = Array.isArray(item.locations) && item.locations.length
    ? item.locations
    : [item.location].filter(Boolean);

  return values.join(", ");
}

// Migra items antiguos para que todos tengan "locations".
function migrateItems(list) {
  return (list || []).map((item, index) => {
    const locations = Array.isArray(item.locations) && item.locations.length
      ? [...new Set(item.locations.filter(Boolean))]
      : [item.location || "Laboratoire"];

    return {
      id: item.id || `itm-${index + 1}`,
      ...item,
      location: locations[0],
      locations
    };
  });
}


// Pega aquí tu bloque CSV o texto copiado desde Excel.
const csvText = `Categorie;Famille;Nom;Conditionnement;stock;Emplacement;Instruction commandes ;code famille;Description;Référence de stock;Prix ;Prix Unitaire;Seuil de réapprovisionnement;Lien;Date de la dernière commande/ qt;Fréquence normal d'utilisation ;livraison
Biomol;Extration ARN;Qiazol;200ml;1;Grand labo placard ;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Qiagen;79306;303;1,515;0,5;https://www.qiagen.com/fr-us/products/discovery-and-translational-research/lab-essentials/buffers-reagents/qiazol-lysis-reagent;44995;600µl/lyse;15 jours
Biomol;Extration ARN;Stainless steel beads 5mm;200;1,5;Grand labo placard ;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Qiagen;69989;151;0,755;1;https://www.qiagen.com/fr-us/products/instruments-and-automation/accessories/beads/?catno=69989;44879;;1 mois 
Biomol;KIT ARN;Zymoclean Gel RNA Recovery Kit w/ Zymo-Spin IC Columns (Capped) 50 preps;50;4,5;labo placard;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Ozyme ;ZR1011;187;3,74;0,5;https://yris.ozyme.fr/fr/company/ozyme/product/zymoclean-gel-rna-recovery-kit-w-zymo-spin-ic-columns-capped-50-preps-zr1011;;1/mois;
Biomol;Kit ARN;Direct Zol RNA MicroPrep;50;2,5;Labo placard;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Ozyme ;ZR2060;271;;;;;;
Biomol;Kit ARN;Wash Buffer;12mL;0;RT;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Ozyme ;ZR-1003-3-12;46;;;https://yris.ozyme.fr/fr/company/ozyme/product/rna-wash-buffer-12-ml-zr1003-3-12-1;;;
Biomol;Extraction miR;miRNeasy Kits ;;0,5;spin column chambre froide et le reste labo floricia;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Qiagen;217084;534;534;;https://www.qiagen.com/us/products/discovery-and-translational-research/dna-rna-purification/rna-purification/mirna/mirneasy-kits;;;
Biomol;Extraction ADN;Kit extraction ADN;10 prep;1;Grand labo placard ;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Ozyme ;ZD4001T;42;;;;;;
Biomol;Extration ARN;isopropanol;;1;;;;;;;;;;.;;
Biomol;Extraction ARN;Glycogène;;3;Congel gris labo;;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;ThermoFischer ;R0551;77;;;;;;
Biomol;RT;M-MLV RT (5);50 000 u : 250 reactions;0,75;;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);promega;M1705;250;;devis en cours;https://france.promega.com/products/pcr/rt-pcr/m-mlv-reverse-transcriptase/?catNum=M1705;44887;1 tous les 6 mois;
Biomol;RT;OneScript RT Mix for qPCR w/gDNAOut (OwiScript);100 reactions;2 (+ 2 arrivés décongelés);labo congel, tiroir rt;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);Ozyme ;OZYA012-100;204;2,01;;https://yris.ozyme.fr/fr/company/ozyme/product/onescript-rt-mix-for-qpcr-w-gdnaout-ozya012?search-context-name=OZYA012;;;
Biomol;RT;SuperScript™ II Reverse Transcriptase;50 reactions;2 + 1 (mars 2025);labo congel, tiroir rt;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);ThermoFischer ; 18064014;376;7,52;;https://www.thermofisher.com/order/catalog/product/18064014;;;
Biomol;RT;High capacity cDNA reverse transcription kit;1000;1;labo congel ;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);;4368813;1147;;;;;;
Biomol;ladder;Smart ladder ;;NC;Congel labo;;;;MW-1700-10;;;0,5;https://www.eurogentec.com/en/catalog/smartladder-200-to-10000-bp~62cddba9-b196-47b3-bec0-c700aed35e2e;.;;
Biomol;Buffer;Tampon TAE UltraPure™, 10X;4L;1;Labo sana;;;ThermoFischer ; 15558026;53;;;;;;
Biomol;Colorant gel;GelRed® Nucleic Acid Gel Stain, 10, 000X in DMSO;0,5mL;1,5;labo etagère produit chimique;;NA.31;Ozyme ;BTM41002;165;;;https://yris.ozyme.fr/fr/company/ozyme/product/gelred-r-nucleic-acid-gel-stain-10-000x-in-dmso-btm41002-1;;;
Biomol;PCR;Tube PCR colone de 8 bouchon plat;8x96;3;Labo Tiroir + 2 réserve;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;32031/2054;46;;1;https://www.dutscher.com/product/0B-35-03;.;;
Biomol;PCR;Sybersafe;500 *l;1;Congel labo;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;ThermoFischer ;s11494;260;#DIV/0!;1;;.;;
Biomol;PCR;dNTP;;1;Congel petit labo;;;;;;;;;;;
Biomol;PCR;Film PCR ;100;0;Placard;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;eppendorf;30127790;Echantillon;Echantillon;1;;.;;
Biomol;PCR;Plaque optique 96 puits lecture rapide;10;1;labo placard ;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;ThermoFischer ;4346907;65;6,5;0,5;https://www.fishersci.fr/shop/products/applied-biosystems-microamp-fast-optical-96-well-reaction-plate-0-1ml-1/10670986?searchHijack=true&searchTerm=4346907&searchType=RAPID&matchedCatNo=4346907;.;;
Biomol;PCR;8 pCPT 2 o me CAMP Am;100u;?;;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;biotechn;4853;225;2,25;;;44855;;
Biomol;qPCR;TB Green qPCR Premix Ex Taq II (Tli RNaseH Plus) (5 x 5 ml) ;24;NC;Congel labo;;;Ozyme ;TAKRR820W;162;6,75;1;https://www.takarabio.com/products/real-time-pcr/real-time-pcr-kits/dye-based-qpcr-mixes/tb-green-premix-ex-taq-ii-(tli-rnase-h-plus)?catalog=RR820A;.;;
Biomol;qPCR;Film plaque qPCR;100;3;Placard labo;;;starstedt;951994;60;0,6;0,5;https://www.sarstedt.com/fr/produits/laboratoire/pcr-biologie-moleculaire/films-pcr/produit/95.1994/;44966;;
Biomol;qPCR;GoTaq® G2 DNA polymerase;500u;1,5 (+1 à tester);;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);promega;M7845;152,872;0,305744;;https://france.promega.com/products/pcr/taq-polymerase/gotaq-g2-dna-polymerase/?catNum=M7845;44887;;
Biomol;qPCR;Plaque 96 qPcr;100;3;Labo solène + réserve;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);starstedt;721981;60;0,6;1;https://www.sarstedt.com/fr/produits/laboratoire/pcr-biologie-moleculaire/plaques-pcr/produit/72.1981/;44966;2/3 mois;
Biomol;qPCR;(sybr green) OneGreen fast qPCR premix (OwiGreen);5x5ml;7;congel -80°C;;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);Ozyme ;OZYA008-1000;683;27,32;2;https://yris.ozyme.fr/fr/company/ozyme/product/onegreen-fast-qpcr-premix-ozya008;.;;
Biomol;qPCR;MicroAmp™ Fast 96-Well Tray;10;;;;;ThermoFischer ;4358305;141;;;;;;
Biomol;qPCR;Barrettes de 8 bouchons optiques MicroAmp™ (bouchons);300;;;;;ThermoFischer ;4323032;208;;;;;;
Biomol;qPCR;Multiply uStripPro 0,2mL barrettes 8 tubes (avec bouchons);480;1;Labo;;;Sarstedt;72.991.022;290;;;;;;
Biomol;qPCR;Barrette de 8 tubes rapide MicroAmp™, 0,1 ml;125;;;;;ThermoFischer ;4358293;159;;;;;;
Biomol;Chimie;ETOH;;1;;;;;;;;0,25;;.;;
Biomol;Chimie;Triton x-100;250ml;1;Labo;;;merck;T8787;50;0,2/ml;;;.;;
Biomol;Chimie;Tween;500ml;1;Labo;;;;;;;;;.;;
Biomol;KIT;Edu;;2;labo frigo;;;ThermoFischer ;C10339;780;;;https://www.fishersci.fr/shop/products/molecular-probes-click-it-edu-alexa-fluor-594-imaging-kit/10410845;.;;
Biomol;Kit biolum;Glucose uptake;5mL;1;-80;;NA32 Reactifs Et Kits Pour Le Marquage Et La Detection Des Proteines;;J1341;458;;;https://france.promega.com/products/energy-metabolism/metabolite-detection-assays/glucose-uptake_glo-assay/?catNum=J1341;;;
Biomol;Kit biolum;Glycerol Detection assay (lipolyse);5mL;1;-80;;NA32 Reactifs Et Kits Pour Le Marquage Et La Detection Des Proteines;Promega;J3150;587;;;https://france.promega.com/products/energy-metabolism/lipid-metabolism-assay/glycerol-glo-assay/?catNum=J3150;.;;
Biomol;KIT ELISA (1);duo set ELISA Ancillary Reagent Kit 2;plaque de 96 puits;2;labo frigo;à commander tout le temps si on utilise le KIT Elisa 2 ou 3 pour avoir les plaques + reactifs;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;R&D systems;DY008B;200;40e/plaque;0,5;https://www.rndsystems.com/search?keywords=Duoset+Ancillary+Reagent+Kit+2;44876;;
Biomol;KIT ELISA (2);Human Adiponectine/Acrp30 DuoSet ELISA (5 plates);10µl/reaction (5 plates);1;labo frigo;commander avec kit elisa 1;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;R&D systems;DY1065-05;378;4e/µL/réaction;1;https://www.rndsystems.com/search?keywords=Human+Adiponectine%2FAcrp30+DuoSet+ELISA+;44876;;
Biomol;KIT ELISA (3);Human IL-6 DuoSet ELISA 5 plates;5 plaques 96W;1,5;labo frigo;commander avec kit elisa 1;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;R&D systems;DY206-05;283;60€/plaque;0,5;https://www.rndsystems.com/search?keywords=Human+IL-6+DuoSet+ELISA;44876;;
Biomol;KIT ELISA;Human RSPO2 ELISA ;1plaque;1?;;commander seul;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;;HUFI06699;630;;;;44936;;
Biomol;KIT ELISA;human VEGF Duoset ELISA;réflexion;ref envisagé;;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;R&D systems;DY293B-05;300;;;https://www.rndsystems.com/products/human-vegf-duoset-elisa_dy293b#assay-procedure;.;;
Biomol;KIT ELISA;Human FGF-21;1 plaque 96 puits;1;grand labo frigo;commander seul;;;;;;;;;;
Biomol;KIT ELISA;Human interleukin 6 (IL6);plaque + reactifs;;;;;Ozyme ;HUDL01522;713;;;https://yris.ozyme.fr/fr/company/ozyme/product/human-interleukin-6-il6-elisa-hudl01522?search-context-name=HUDL01522;;;
Biomol;KIT ELISA;Human Pro-Collagen I alpha 1 DuoSet ELISA;;2;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;R&D systems;DY6220-05;378;;;;;;
Biomol;KIT ELISA;Human Adiponectin (ADP);plaque + reactifs;;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;;HUDL00090;713;;;https://yris.ozyme.fr/fr/company/ozyme/product/human-adiponectin-adp-elisa-hudl00090?search-context-name=HUDL00090;;;
Biomol;KIT ELISA;Human IL-1beta/IL-1F2 Duoset Elisa, 5 plates;5 plates;1;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;biotechne;DY201-05;325;;;;;;
Biomol;;Human TIMP1;5 plates;1;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;biotechne;DY970-05;325;;;;;;
Biomol;KIT ELISA;Barrettes ;;4 cartons (320);tiroir ELISA labo + stock bureau;Attention barrettes doubles ;;ThermoFischer ;469914;180;;;;;;
Biomol;KIT ELISA;DuoSet ELISA Ancillary Reagent Kit 2;;1;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Bio-techne;DY008B;213,3;;;;;;
Biomol;KIT ELISA;Human GDF-15 DuoSet ELISA, 15 Plate ;;1;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Bio-techne;DY957;820,8;;;;;;
Biomol;KIT ;ENZ CHECK GELATINASE/COL 1 kit;250 - 200 assays;1;Tiroir ELISA -20;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;ThermoFischer ;E12055;614;;;https://www.thermofisher.com/order/catalog/product/E12055?SID=srch-srp-E12055;;;
Biomol;Primer;FGF21 qPCR Primer Pairs, Human;24;1;labo frigo;;;Interchim ;Ref : HP100794;61;2,541666667;1;https://www.interchim.com/rapid_search2.php;.;;
Biomol;Primer;ICAM-1 qPCR Primer Pairs, Human;10 pièces;1;labo frigo;;;Interchim ; Ref : HP100384;100;;1;https://www.interchim.com/rapid_search2.php;.;;
Biomol;Primer;HUMAN DPP4 QPCR PRIMER PAIRS;20 plaques;1;labo frigo;;;Interchim ; Ref : HP100649;196;9,8;1;https://www.interchim.com/rapid_search.php;.;;
Biomol;Transport;acetate foil transport type PCR;50;NC;;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;82,1586;106;2,12;1;https://www.dutscher.com/article/760215;.;;
Biomol;Transport;Film adhésif AeraSeal™ stérile;960;NC;Labo Placard;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;760215;106;0,110416667;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/a6306;.;;
Biomol;ladder;Smart ladder SF;réflexion;NC;;;;;MW-1800-04 ;réflexion;;0,5;https://www.eurogentec.com/en/catalog/smartladder-sf-100-to-1000-bp~c21045de-6dbd-4b04-83ce-e2525c7fb69d;.;;
Biomol;Milieu;eagle medium sans glu ;500mL;2;Frigo grand labo;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;ThermoFischer ;11966025;22;;1;;.;;
Biomol;Milieu;gelatine solution;;?;Frigo grand labo;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;;;;;;;.;;
Biomol;Milieu;Insuline, humain recombinant, zinc solution, 4mg/ml;5 ml ;?;;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;gibco;12585014;95;19€/ml;;;;Produit de différentiation;
Biomol;?;Liberase TL res Grade ;10mg;NC;;;;sigma;5401020001;50;5€/ml;;;44663;;
Biomol;?;RNA ext reag tri reagent;100ml;NC;;;;sigma;TR118-200;200;2€/ml;;;44642;;
Biomol;?;RQ1 Rnase-free DNAse;1000u;NC;;;;promega;M6101;70;0,07;;;44712;;
Biomol;?;CCT 031374 hydrobromide;10mg;NC;;;;biotechn;4675;170;17€/mg;;;44862;;
Biomol;?;Glycogen 20mg/ml;2x0,25ml;NC;;;;sigma;08-0111;90;180€/µl;;;44732;;
Biomol;?;ICG 001;10mg;NC;;;;biotechn;4505;250;25€/mg;;;44862;;
Biomol;?;JW67;10mg;NC;;;;biotechn;4651;190;19€/mg;;;44862;;
Microscopie;Fluromount;Fluoromount-G, with DAPI;20ml;2;labo placard microscopie;;NA47 Reactifs D'immunohistologie Et D'histochimie;ThermoFischer ;00-4959-52;95;4,75;1;https://www.thermofisher.com/order/catalog/product/00-4959-52?SID=srch-srp-00-4959-52;.;;
Microscopie;Coloration;Oro ;250ml;2;labo placard microscopie;;NA47 Reactifs D'immunohistologie Et D'histochimie;sigma;1024190250;127;0,5;;;en cours ;;
Microscopie;Coloration;Picro Sirius red Stain Kit;;1;labo placard microscopie;;NA47 Reactifs D'immunohistologie Et D'histochimie;Abcam;ab150681;246,82;1;0,5;https://www.abcam.com/picro-sirius-red-stain-kit-connective-tissue-stain-ab150681.html;.;;
Microscopie;Coloration;Solution Acide acétique ( dans le kit de psr);;2;labo placard microscopie;;;;ab150681;246,82;1;1;;.;;
Microscopie;Anticorps I;Apo -Transferrine humain;100 aliquots 1mg/ml;NC;;;;Sigma;T1147-100MG;166;16;;https://www.thermofisher.com/order/catalog/product/21331046;.;Produit de différentiation;
Microscopie;Anticorps I;CL 316,243 hydrate de chez Sigma Aldrich;5mg;2;;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Sigma;C5976-5mg;295;59;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/c5976;.;;
Microscopie;Anticorps I;Glut 4;20µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);ozyme ;ABC-A7637-20;92;4,6;;; ;;
Microscopie;Anticorps I;Prox 1 ;20µl;2; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);themofischer;11067-2-AP;demande échantillon;demande échantillon;;;EN cours;;
Microscopie;Anticorps I;IFN2A humain de chez Sigma Aldrich;;1;;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Sigma;SRP4594-100ug;255;;;https://www.sigmaaldrich.com/FR/fr/product/sigma/srp4594;.;;
Microscopie;Anticorps I;PDGF Receptor α (D1E1E) XP® Rabbit mAb #3174;;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Ozyme ;3174T;99;;;;.;;
Microscopie;Anticorps I;anti fibronectin Mouse ;200µg/ml;0;Pas vu ;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);santa cruz;sc8422;350;1,75;;;.;;
Microscopie;Anticorps I;anti human Lyve 1;100µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);abcam;ab219556;600;6;;;45000;;15 jours 
Microscopie;Anticorps I;anti-cd31 HUMAN ;100µL;1;4°C;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;YEP;425$;4,25;;https://www.abcam.com/cd31-antibody-ab28364.html;.;;
Microscopie;Anticorps I;Anti-CD34 antibody [QBEND-10];50µL;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab8536;489;9,78;;https://www.abcam.com/cd34-antibody-qbend-10-ab8536.html;.;;
Microscopie;Anticorps I;anti-CD68 antibody ;100µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab213363;495;4,9;;https://www.abcam.com/cd68-antibody-epr20545-ab213363.html;.;;
Microscopie;Anticorps I;Anti-Collagen IV antibody;100µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab6586;489;4,9;;https://www.abcam.com/collagen-iv-antibody-ab6586.html;.;;
Microscopie;Anticorps I;Anti-Elastin antibody;250µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab21610;489;1,95;;https://www.abcam.com/elastin-antibody-ab21610.html;.;;
Microscopie;Anticorps I;anti-ICAM1 antibody  MEM-111;100µg;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab2213;500;5;;https://www.abcam.com/icam1-antibody-mem-111-ab2213.html;.;;
Microscopie;Anticorps I;Anti-Laminin antibody;125µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab11575;489;3,9;;https://www.abcam.com/laminin-antibody-ab11575.html;.;;
Microscopie;Anticorps I;Collagen VI Monoclonal Antibody (COL-6) 100 ul ;100µL;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Merck ;MAB1944;516;;;Anti-Collagen Type VI Antibody, clone 3C4 | MAB1944 (merckmillipore.com);.;;
Microscopie;Anticorps I;Collagen I Monoclonal Antibody (COL-1) 100 ul ;100µL;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Abcam;ab260043;510;5,1;;https://www.abcam.com/collagen-i-antibody-epr22894-89-ab260043.html;.;;
Microscopie;Anticorps I;Human DPP4/CD26 antibody  polyclonal goat ;100µg;2; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Biotechne;AF1180;490;4,9;1;;.;;
Microscopie;Anticorps I;Tyrosine Hydroxylase antibody RABBIT polyclonal;25µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Euromedex;GTX113016;150;;;;;;1 mois
Microscopie;Anticorps I;CGRP antibody [4901] MOUSE Monoclonal;100µl;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Euromedex;GTX82726;605;;;;;;2 mois
Microscopie;Anticorps I;Perilipin 1 antibody GOAT Polyclonal;100µg;1; -20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Euromedex;GTX89109 ;485;;;;;;3 mois
Microscopie;Anticorps I;Hyaluronan Binding Protein HABP Biotin conjugated;50ug;1;-20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Amsbio;AMS.HKD-BC41;635;;;;;;
Microscopie;Anticorps I;Anti-Collagen III antibody [EPR17673] ;;1;chambre froide;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Abcam;AB184993;390;;;;;;
Microscopie;Anticorps I;ICAM-2/CD102;100µg;1;-20 labo;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);ThermoFischer ;PA547320;457;;;;46009;;
Microscopie;Anticorps II;Anti-rabbit IGG 488 50ul ;50µl;1; -20 labo;;NA46 : Anticorps secondaire;Sigma;SAB4600044;90;1,8;;https://www.sigmaaldrich.com/FR/fr/product/sigma/sab4600044;.;;
Microscopie;Anticorps II;Donkey Anti-Goat IgG H&L (Alexa Fluor® 488);500µg;1;4°C;;NA46 : Anticorps secondaire;Abcam;ab150129;159;0,318;;https://www.abcam.com/donkey-goat-igg-hl-alexa-fluor-488-ab150129.html;.;;
Microscopie;Anticorps II ;DAPI;10mg;1;;;NA46 : Anticorps secondaire;ThermoFischer ;D1306;200;20;1;https://www.thermofisher.com/order/catalog/product/D1306?SID=srch-srp-D1306;.;;
Microscopie;Anticorps II ;Mouse Alexa fluor 568;25µl;2;4°C;;NA46 : Anticorps secondaire;;;;;;;;;
Microscopie;Anticorps II ;AF 647 Rabbit ;25µl;1;4°C;;NA46 : Anticorps secondaire;;;;;;;;;
Microscopie;Anticorps II ;Steptavidin AF633;1mg;1;-20 labo;;NA46 : Anticorps secondaire;ThermoFischer ;S21375 ;378;;;;;;
Microscopie;Anticorps II ;Donkey anti-mouse 488;;1;4°C;;NA46 : Anticorps secondaire;;A-21202 ;375;375;;;;;
Microscopie;Agarase;Agarase from pseudomonas atlantica Sigma;1000 unités;;4°C;;;A6306;Sigma;141;0,28/ml;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/a6306;.;;
Microscopie;Agarase;;;; -20 labo;;;;;;;;;;;
Microscopie;Anticorps TNF;Mouse TNFa antibody 100 microg;;1;;;NA46 : Anticorps secondaire;Bio-Techn;MAB4101;275;;;https://www.bio-techne.com/p/antibodies/mouse-tnf-alpha-antibody-mp6-xt22_mab4101;.;;
Microscopie;Anticorps TNF;Recombinant Human TNFa;;1;;;NA46 : Anticorps secondaire;Bio-Techn;10291-TA-050;207;;;https://www.bio-techne.com/p/proteins-enzymes/recombinant-human-tnf-alpha-hek293-expressed-protein-cf_10291-ta;.;;
Microscopie;consommable;capillaire /tube hematocrite  1,5 mm dia/ 75 mm long;100;4;labo placard microscopie;;;polylabo;;20;0,2;1;;.;;
Microscopie;Fastwell;Grace Bio-Labs FastWells 9 mm diam. x 1.0 mm depth ;10 plaques;2;labo placard microscopie;;;Sigma;GBL664112-50EA;61;6,1;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/gbl664112;.;;
Microscopie;Fastwell;Grace Bio-Labs FastWells reagent barriers;;2;labo placard microscopie;;;Sigma;GBL664113-50EA;3,1;;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/gbl664113;.;;
Microscopie;Fastwell;Grace Bio-Labs wells, 12 (Round, 4.5mm diameter, 0.5mm depth) ;;2;labo placard microscopie;;;Sigma;GBL664506;6;;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/gbl664506;.;;
Microscopie;Fastwell;Grace Bio-Labswells, 24 (Round, 2mm diameter, 0.5mm depth) ;1000;2;labo placard microscopie;;;Sigma;GBL664508;30;0,03;1;https://www.sigmaaldrich.com/FR/fr/product/sigma/gbl664508;.;;
Microscopie;Fil;Galls microfibre filtre 2,5 cm;;8;labo placard microscopie;;;Whatman;1822025;122,2;;1;;.;;
Microscopie;Fixateur;oct componoun tissue;;5;Labo Bench;;;;;138;2;1;;.;;
Microscopie;Fixateur;PAF- PIERCE 16% FORM.METHANOL 10X 10ml ;;2,5;labo placard microscopie;;;ThermoFischer ;28908;92;2;1;https://www.thermofisher.com/order/catalog/product/28908;;;
Microscopie;Fluromount;Invitrogen™ eBioscience™ Fluoromount-G™, with DAPI;;NC;labo placard microscopie;;;Invitrogen;155996276;50,85;2;;;.;;
Microscopie;Lames;Star-Frost slides 76 x 26 mm standard version Blue;sachet 2x1000 ;20;labo placard microscopie;;;Dutscher;100204B;15;;3;https://www.dutscher.com/article/100204B;.;;
Microscopie;Anticorps;Rat igG1 isotype control ;;1;;;NA41 : Anticorps primaire non couple (hors anticorps de contrôle et anti-taq);Bio-Techn;MAB005;194;;;https://www.bio-techne.com/p/isotype-controls/rat-igg1-isotype-control_mab005;.;;
Microscopie;Clearing;Sucrose;500g;1;Labo placard poudre;;NA32;Merck;S0389-500G;90;;;;;;
Microscopie;Clearing;Urea;500g;1;Labo placard poudre;;NA32;Merck;U5378-500G;83;;;;;;
Microscopie;Clearing;Ether benzyl DBE;25g;2;Armoire ventilée;;NA32;Merck;108014-25G;58,6;;;;;;
Microscopie;Clearing;ethyl cinamate;100g;2,5;Armoire ventilée;;NA32;Merck;112372-100G;22,4;;;;;;
Microscopie;Clearing;DCM;250mL;1;Armoire ventilée;;NA32;Merck;5895810250;96,6;;;;;;
Qualité;KIT Qualité;XTT Cell Proliferation Kit II;2500;3;labo congel -25°C, Labo congel tiroir bas;2 bouteille stock;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;merck;11465015001;;0,2;0,5;https://www.sigmaaldrich.com/FR/fr/product/roche/11465015001#product-documentation;44995;;Tres variable attention
Qualité;KIT Qualité bis;XTT assay kit prêt à l'emplois;96;0; -20°c en bas;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;abcam;ab232856;;1,666666667;;https://www.abcam.com/products/assay-kits/xtt-assay-kit-ab232856.html;45006;;
Qualité;Bactério;bacterio diam 90 mm avec ou sans  ergot sterile;480;0,5;reserve;;NB14 Bacteriologie : Consommables En Plastique Specifiques;starstedt;2582714;;0,05;1;;ugap;;
Qualité;Milieu;Milieu déshydraté gélose nutritive;500g;1;Paillasse grand labo RT;;NA74 : Milieu de bactériologie et additif;Dutscher;777328;;225,25;;;;;
Qualité;Milieu;Gélose nutritive;500g;1,5;Paillasse grand labo RT;;NA74 : Milieu de bactériologie et additif;bioworld;30620055 ;;155;;https://www.bio-world.com/microbiological-media/nutrient-agar-p-30620055;44609;;
Qualité;Milieu;Glucosée de sabouraud, Gélose;500g;1;Paillasse grand labo RT;;NA74 : Milieu de bactériologie et additif;Dutscher;413802,1210-ITW;;82,3;;;;;
Qualité;Milieu;Sabouraud Dextrose Agar;500g;1,5;Paillasse grand labo RT;;NA74 : Milieu de bactériologie et additif;bioworld;30622001 ;;107;;https://www.bio-world.com/index.php?main_page=product_info&products_id=30622001;44609;;
Qualité;Milieu;Bouillon Luria mofication miller 0,5g NaCl (LB);500g;;Paillasse grand labo RT;;NA74 : Milieu de bactériologie et additif;;777493;;65;;;;;
Qualité;Kit qualité;Mycostrip;10 tests;6 reactions;labo congel -20°C;;NA.84;Invivogen;rep-mys-10;;11,5;;https://www.invivogen.com/mycostrip?gclid=Cj0KCQjwwYSwBhDcARIsAOyL0fidnFpoEfcfjw4vCPaobOQd6PuZwqOwrI7SbfyvBTcK2PofbGya_AUaAva0EALw_wcB;;;
Qualité;Kit qualité;Mycostrip;50 tests;1;labo congel -20°C;;NA.84;Invivogen;rep-mys-50;;350;;https://www.invivogen.com/mycostrip?gclid=Cj0KCQjwwYSwBhDcARIsAOyL0fidnFpoEfcfjw4vCPaobOQd6PuZwqOwrI7SbfyvBTcK2PofbGya_AUaAva0EALw_wcB;;;
Qualité;Kit qualité;kit mycoplasme Venor®GeM OneStep;50;1;labo congel -25°C;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;;11.8050;;7;0,5;https://minerva-biolabs.com/en/mycoplasma-detection-kits/venorgem-onestep-2#/173-package_size-25_reactions;44837;;
Qualité;KIT viabilité;LDH-Glo Cytotoxicity Assay;100 tests;1;congel -80°C;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Promega;J2380/1;;250;0,5;https://france.promega.com/products/cell-health-assays/cell-viability-and-cytotoxicity-assays/ldh-glo-cytotoxicity-assay/?catNum=J2380;;;
Qualité;KIT viabilité;kit de Viablilite/cytotoxicite Molecular Probe Live/Dead;;1;;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;ThermoFischer ;L3224;;;x;https://www.thermofisher.com/order/catalog/product/fr/fr/L3224;;;
Qualité;KIT viabilité;Live/Dead Fixable Staining Kit 488/515;;1;;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Promocell;PK-CA707-32004;;;x;;;;
Qualité;;;;;;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;;;;;;;;;
Qualité;KIT prolifération;"cell proliferation kit III (EdU-594; FM)";;NC;;;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;Promocell;PK-CA724-594FM;;;x;;;;
FACS;Anticorps;CD90 APC ;100 ul;NC;Frigo Bench;;?;BD pharmagen;559869;350;;;https://www.bdbiosciences.com/en-us/products/reagents/flow-cytometry-reagents/research-reagents/single-color-antibodies-ruo/apc-mouse-anti-human-cd90.559869;;;
FACS;Anticorps;CD105 Fluo ;150 ul;NC;Frigo Bench;;;;FAB10971F;;;;;;;
FACS;Anticorps;CD140a PE;200ul;NC;Frigo Bench;;;BD pharmagen;556002;;;;https://www.bdbiosciences.com/en-au/products/reagents/flow-cytometry-reagents/research-reagents/single-color-antibodies-ruo/pe-mouse-anti-human-cd140a.556002;;;
FACS;Anticorps;CD142 PE ;150 ul;1;Frigo Bench;;;Invitrogen/thermofischer;12-1429-42;270;;;https://www.thermofisher.com/antibody/product/CD142-Antibody-clone-HTF-1-Monoclonal/12-1429-42;45005;;1 mois
FACS;Anticorps;CD26 FITC ;100 tests;NC;Frigo Bench;;;BiolEgend;302704;215;;;https://www.biolegend.com/en-us/products/fitc-anti-human-cd26-antibody-610;44890;;
FACS;Anticorps;CD26FITC;50 tests;NC;Frigo Bench;;;BD biosciences;340426;300;;;https://www.bdbiosciences.com/en-fr/products/reagents/flow-cytometry-reagents/clinical-discovery-research/single-color-antibodies-ruo-gmp/fitc-mouse-anti-human-cd26.340426;;;
FACS;Anticorps;CD26FITC;;NC;Frigo Bench;;;Interchim ;EZH110;;;;https://www.interchim.com/rapid_search.php;;;
FACS;Anticorps;CD31 PE ;200 ul;NC;Frigo Bench;;;BD pharmagen;555446;;;;;;;
FACS;Anticorps;CD34 APC ;;NC;Frigo Bench;;;BD pharmagen;44937;;;;;;;
FACS;Anticorps;CD34 PE ;200ul;NC;Frigo Bench;;;BD pharmagen;555822;;;;https://www.bdbiosciences.com/en-au/products/reagents/flow-cytometry-reagents/research-reagents/single-color-antibodies-ruo/pe-mouse-anti-human-cd34.555822;;;
FACS;Anticorps;CD45 PE ;200 ul;NC;Frigo Bench;;;BD pharmagen;555483;;;;https://www.bdbiosciences.com/en-au/products/reagents/flow-cytometry-reagents/research-reagents/single-color-antibodies-ruo/pe-mouse-anti-human-cd45.555483;;;
FACS;Anticorps;CD54 APC ;100 ul;1;Frigo Bench;;;molecular probes/thermofischer ;A15714;230;;;;45005;;1 mois
FACS;Anticorps;CD73 PE;200 ul;NC;Frigo Bench;;;MACS (Miltenyi);130-095-182;;;;;;;
FACS;Anticorps;CD90 PE ;500 ul;NC;Frigo Bench;;;BD pharmagen;555596;;;;https://www.bdbiosciences.com/en-au/products/reagents/flow-cytometry-reagents/research-reagents/single-color-antibodies-ruo/pe-mouse-anti-human-cd90.555596;;;
FACS;Anticorps;Fcblock 1 ;0,25mg;2;Frigo Bench;;;BD science;564220;200;;1;;45002;;1 mois
FACS;Anticorps;FITC anti-huma CD26;100tests;NC;Frigo Bench;;;Ozyme ;BLE302704;170;;;;;;
FACS;Anticorps;IgG1 APC ;;NC;Frigo Bench;;;;FAB10971F;;;;;;;
FACS;Anticorps;IgG1 k PE;25 tst;NC;Frigo Bench;;;biotechne;FAB10971p;190;;;;;;
FACS;Anticorps;IgG2A APC ;;NC;Frigo Bench;;;;FAB10971F;;;;;;;
FACS;Anticorps;IgG2bK PE;;NC;Frigo Bench;;;;FAB10971F;;;;;;;
FACS;Anticorps;MSCA1 APC ;200 ul;NC;Frigo Bench;;;MACS;130-093-589;;;;;;;
FACS;Anticorps;CD90-FITC;2mL;1;Frigo Labo;;;Beckman;IM1839U;;;;;;;
FACS;Anticorps;CD146 RPE;2mL;1;Frigo Labo;;;Beckman;A07483 ;;;;;;;
FACS;Anticorps;CD45-PC5;100tests;1;Frigo Labo;;;Beckman;A07785;;;;;;;
FACS;Anticorps;IgG1 mouse FITC;100 tests;1;Frigo Labo;;;Beckman;A07795;;;;;;;
FACS;Anticorps;CD34-BV650;50ug;1;Frigo Labo;;;BD biosciences;743533;;;;;;;
FACS;Anticorps;IgG1-BV650;;1;Frigo Labo;;;BD biosciences;563231;;;;;;;
FACS;Sondes;NucBlue Live cell stain;6*2,5mL;1;Frigo Labo;;;Thermofisher;R37605;;;;;;;
FACS;Sondes;Draq5;200uL;1;Frigo labo;;;Thermofisher;65-0880-96;;;;;;;
Muse;;Guava instrument cleaning Fluid ( ICF) ;;NC;Frigo Bench;;;Merck;4200-0140;37,5;;;;;;
Bureautique;;pile LR42;;;;;;amazon;;;;;;;;
Bureautique;;Pile multicanaux;;;;;;amazon;;;;;;;;
Bureautique;;pile plate;;;;;;amazon;;;;;;;;
Bureautique;;pochette carton;;;;;;amazon;;;;;;;;
Bureautique;;Minuteur 3 canaux ;;;;;;dominique Dutscher SAS;45302;17;;;;;;
Bureautique;;Blouse jetable ENDO protectlab taille XL ;;;;;;dominique Dutscher SAS;942685;3,1;;;;;;
Bureautique;;Pince à bouts plats, arrondis, acier inoxydable;;;;;;Millipore;XX6200006P;53;;;;;;
Bureautique;;Cryoboîte blanche en carton ClearLine® - capacité : 100 cryotubes - recouverte d'un film étanche;;;;;;Dutscher ;010184CL;6;;;;;;
Bureautique;;Portoir pour tubes coniques 15 ml SPL - 104,1 x 127,9 , 48,1 mm;;;;;;Dutscher ;330130;14,8;;;;;;
Bureautique;;Portoir pour tubes coniques 50 ml SPL - 132,7 x 249,7 x 48,1 mm;;;;;;Dutscher ;330133;23,3;;;;;;
Bureautique;;Portoir multifonctions tubes de culture;;;;;;Dutscher ;199018;7,9;;;;;;
Bureautique;;Marqueur noir ultra fin;;;;;;Dutscher ;140604;4,6;;;;;;
Bureautique;;Portoir Unirack PCR double face coloris bleu;;;;;;Dutscher ;39250;8,8;;;;;;
Bureautique;;Boîte en ABS pour lame de microscopie - capacité 12 lames;;;;;;Dutscher ;390855;2,2;;;;;;
Bureautique;;Economical box for 25 microscope slides (Blue);;;;;;Dutscher ;37516;9,7;;;;;;
Bureautique;;Economical box for 100 microscope slides (White);;;;;;Dutscher ;37521;12,7;;;;;;
Bureautique;;blouse l2;;;;;;fischer scientific;;;;;https://www.fishersci.fr/shop/products/tyvek-isoclean-ic-270b-ws-lab-coat-sterile-double-bagged-6/17879323?searchHijack=true&searchTerm=tyvek-isoclean-ic-270b-ws-lab-coat-sterile-double-bagged-6&searchType=Rapid&matchedCatNo=17879313;;;
Cones pipettes;;Pipette tip, 10 µl, transparent, PCR Performance Tested, 1,000 piece(s)/bag;10000;;;;10µL - bulk;;70.3010;140;0,014;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3010/;;;
Cones pipettes;;Filter tip, 10 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;10µL filtré;;70.3010.255;81,6;0,0425;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3010.255/;;;
Cones pipettes;;Pipette tip, 10 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;10µL - boite;;70.3010.205;68,16;0,0355;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3010.205/;;;
Cones pipettes;;Filter tip, 20 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;20µL filtré;;70.3020.255;81,6;0,0425;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3020.255/;;;
Cones pipettes;;Pipette tip, 200 µl, transparent, PCR Performance Tested, 1,000 piece(s)/bag;10000;;;;200µL - bulk;;70.3030;49;0,0049;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3030/;;;
Cones pipettes;;Filter tip, 200 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;200µL filtré;;70.3031.255;85,44;0,0445;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3031.255/;;;
Cones pipettes;;Pipette tip, 200 µl, transparent, PCR Performance Tested, 96 piece(s)/box;1920;;;;200µL - boite;;10.3030.200;66,24;0,0345;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3030.200/;;;
Cones pipettes;;Pipette tip, 1,000 µl, transparent, PCR Performance Tested, 500 piece(s)/bag;5000;;;;1000µL - bulk;;70.3050;37,5;0,0075;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3050/;;;
Cones pipettes;;Filter tip, 1,000 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;1000µL filtré;;70.3050.255;113,28;0,059;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3050.255/;;;
Cones pipettes;;Pipette tip, 1,000 µl, transparent, Biosphere® plus, 96 piece(s)/box;1920;;;;1000µL - boite;;70.3050.205;80,64;0,042;;https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3050.205/;;;
Indispensable;Bouchon;Bouchon BD Luer - Lok™ avec protection mâle/femelle;100;1,5;Bureau;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;394075B;13,1;0,166;0;https://www.dutscher.com/article/394075B;00/01/1900;;
Indispensable;Seringue luer lock;Seringue BD 3P 20 ml Cone luer Lock ;120;2;Bureau + L2;;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;bastide;100081;38;0,316666667;NC;https://www.bastideleconfortmedical.com/seringues-3-pieces-20-ml-bd-plastipak-cone-luer-lock-100081.html;;;
Indispensable;Tulipe;REDUCTEUR SU 1.2MM;20;5;Bureau;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Aestetic group;FD0000000-LLF24;46;2,3; 2 boites;https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/527-raccord-d-emulsion-de-graisse-fll-o-12mm-x20.html;13/10/2022;1Boite pour 20 prélèvements;
Indispensable;Tulipe;REDUCTEUR SU 1.4MM;20;5;Bureau;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Aestetic group;FD0000000-LLF14;46;2,3;2 boites;https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/526-raccord-d-emulsion-de-graisse-fll-o-14mm-x20.html;13/10/2022;1Boite pour 20 prélèvements;
Indispensable;Tulipe;REDUCTEUR SU 2.4MM;20;5;Bureau;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Aestetic group;FD0000000-LLF12;46;2,3;2 boites;https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/525-raccord-d-emulsion-de-graisse-fll-o-24mm-x20.html;13/10/2022;1Boite pour 20 prélèvements;
Indispensable;Plaque 6 ula;Plaque Corning 6 puits ULA ;24;5,5;bureau;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;3471;339;0;1;https://www.dutscher.com/article/003471;00/01/1900;;
Indispensable;ACL;ACL -eBioscience™ 10X RBC Lysis Buffer (Multi-species) 50 ml;50mL;2;L2 + L1 frigo;0;NA71 : Sérum et autre milieu pour culture cellulaire animale;ThermoFischer ;00-4300-54;62;0;1;https://www.thermofisher.com/order/catalog/product/00-4300-54?SID=srch-srp-00-4300-54;recu;;
Indispensable;Antifongique;Amphotericin B solution;50mg;1;Chambre froide;0;NA76 Antibiotiques Pour Culture Cellulaire;Sigma;0,28;287;5,75;0;https://www.sigmaaldrich.com/FR/fr/substance/amphotericinbsolution924081397893;.;;
Indispensable;Antibiotique;Gibco™ Gentamicine (50 mg/ml);20ml;2;salle de culture L1 & L2;0;NA76 Antibiotiques Pour Culture Cellulaire;thermofischer ;11520506;220;11;0;https://www.fishersci.fr/shop/products/gentamicin-50-mg-ml-4/11520506;reçu 05/23;;
Indispensable;Antifongique;Invivogen FUNGIN 75 MG (10 MG/ML);75mg;1,5;Congel grand labo;0;NA76 Antibiotiques Pour Culture Cellulaire;invivogen;ant-fn-1;148;0;0;https://www.fishersci.com/shop/products/fungin-75-mg-10-mg-ml/NC9326704;00/01/1900;;
Indispensable;Milieu EGM;Endothelial Cell Growth Medium 2;500ml;4;figo labo culture;Milieu + suppléments;NA71 : Sérum et autre milieu pour culture cellulaire animale;Promocell;C-22011;153,85;0;1;https://promocell.com/product/endothelial-cell-growth-medium-2/;22/03/2023;;15 jours
Indispensable;Milieu EGM;SupplementMix / Endothelial   Cell Growth Medium 2;500ml;4;Congèl labo culture;0;NA71 : Sérum et autre milieu pour culture cellulaire animale;Promocell;  C-39216;50,85;2;1;https://promocell.com/product/endothelial-cell-growth-medium-2/;22/03/2023;;15 jours
Indispensable;Antibiotique;pen/strep stock;100Ml;6;5;0;0;thermofischer;15140122;10;0,1;0;https://www.thermofisher.com/order/catalog/product/15140122?SKULINK;28/02/2023;;1mois
Indispensable;BSA;BSA free fatty acid  25g;25g;3;port frigo labo en bas;0;0;merck;A6003-25G;450;18e/g;0;https://www.sigmaaldrich.com/FR/fr/product/sigma/a6003;.15/03/23;2g/falcon= 12 Fla;15 jours
Indispensable;Collagénase;Collagenase A from Clostridium histolycum (500mg) ;500mg;1;frigo salle culture;0;0;Sigma Merck;10103586001;305,76;0,64;0,5;https://www.sigmaaldrich.com/FR/fr/product/roche/collaro;21/03/2023;30 aliquot de 10;15 jours
Indispensable;Milieu PBS;PBS;0;5;Frigo Labo;0;NA71 : Sérum et autre milieu pour culture cellulaire animale;thermofischer;14190-094;23,4;1,15;2;https://www.thermofisher.com/order/catalog/product/14190094;20/03/2023;1 bouteille/mois;rapide
Indispensable;Pastette;Pipette stérile Pasteur 3 ml (a commander de preference);1000;2,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;390513;52;0;1;https://www.dutscher.com/article/390513;00/01/1900;;
Indispensable;Extration ARN;Qiazol;200ml;1;Grand labo placard ;0;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;qiagen;79306;303;1,515;0,5;https://www.qiagen.com/fr-us/products/discovery-and-translational-research/lab-essentials/buffers-reagents/qiazol-lysis-reagent;;600µl/lyse;15 jours
Indispensable;Extration ARN;Stainless steel beads 5mm;200;1,5;Grand labo placard ;0;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;qiagen;69989;151;0,755;1;https://www.qiagen.com/fr-us/products/instruments-and-automation/accessories/beads/?catno=69989;10/03/2023;;1 mois 
Indispensable;KIT ARN;Zymoclean Gel RNA Recovery Kit w/ Zymo-Spin IC Columns (Capped) 50 preps;50;4,5;labo placard;0;NA52 : Réactif et kit pour isolement et purification Acide Nucléique;Ozyme ;ZR1011;187;3,74;0,5;https://yris.ozyme.fr/fr/company/ozyme/product/zymoclean-gel-rna-recovery-kit-w-zymo-spin-ic-columns-capped-50-preps-zr1011;14/11/2022;1/mois;
Indispensable;RT;M-MLV RT (5);50 000 u : 250 reactions;0,75;0;0;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);promega;M1705;250;0;devis en cours;https://france.promega.com/products/pcr/rt-pcr/m-mlv-reverse-transcriptase/?catNum=M1705;00/01/1900;1 tous les 6 mois;
Indispensable;RT;OneScript RT Mix for qPCR w/gDNAOut (OwiScript);100 reactions;2 (+ 2 arrivés décongelés);labo congel, tiroir rt;0;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);Ozyme ;OZYA012-100;204;2,01;0;https://yris.ozyme.fr/fr/company/ozyme/product/onescript-rt-mix-for-qpcr-w-gdnaout-ozya012?search-context-name=OZYA012;22/11/2022;;
Indispensable;RT;SuperScript™ II Reverse Transcriptase;50 reactions;2 + 1 (mars 2025);labo congel, tiroir rt;0;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);ThermoFischer ; 18064014;376;7,52;0;https://www.thermofisher.com/order/catalog/product/18064014;00/01/1900;;
Indispensable;qPCR;(sybr green) OneGreen fast qPCR premix (OwiGreen);5x5ml;7;congel -80°C;0;NA55 Enzymes Et Kits De Synthese Des Acides Nucleiques (pcr);Ozyme ;OZYA008-1000;683;27,32;2;https://yris.ozyme.fr/fr/company/ozyme/product/onegreen-fast-qpcr-premix-ozya008;00/01/1900;;
Indispensable;KIT Qualité;XTT Cell Proliferation Kit II;2500;3;labo congel -25°C;2 bouteille stock;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;merck;11465015001;0,2;0,5;Labo congel tiroir bas;https://www.sigmaaldrich.com/FR/fr/product/roche/11465015001#product-documentation;;;Tres variable attention
Indispensable;Bactério;bacterio diam 90 mm avec ou sans  ergot sterile;480;0,5;reserve (?);0;NB14 Bacteriologie : Consommables En Plastique Specifiques;starstedt;2582714;0,05;1;Réserve;;;;
Indispensable;Milieu;Gélose nutritive;500g;1,5;Paillasse grand labo RT;0;NA74 : Milieu de bactériologie et additif;bioworld;30620055 ;155;0;0;https://www.bio-world.com/microbiological-media/nutrient-agar-p-30620055;10/03/2023;;
Indispensable;Milieu;Sabouraud Dextrose Agar;500g;1,5;Paillasse grand labo RT;0;NA74 : Milieu de bactériologie et additif;bioworld;30622001 ;107;0;0;https://www.bio-world.com/index.php?main_page=product_info&products_id=30622001;ugap;;
Indispensable;Kit qualité;kit mycoplasme Venor®GeM OneStep;50;1;labo congel -25°C;0;NA84 Biologie Cellulaire: Kits De Dosage, D'essai Fonctionnel - Kits Biochimiques;biovalley;11.8050;7;0,5;Labo congel tiroir bas;https://minerva-biolabs.com/en/mycoplasma-detection-kits/venorgem-onestep-2#/173-package_size-25_reactions;17/02/2022;;
Indispensable;Eppendorf;Microtube 0,5ml;5000;3;Réserve;0;NB11;starstedt;72,699;61;0,0122;0,5;;17/02/2022;;
Indispensable;Eppendorf;Microtube 1,5 ml;5000;2;Réserve;0;NB11;starstedt;72,690,001;50;0,01;2;https://www.sarstedt.com/fr/produits/laboratoire/microtubes-a-vis-tubes-a-reaction/tubes-a-reaction/produit/72.706/;03/10/2022;;
Indispensable;Eppendorf;Microtube 2ml;5000;2;Réserve;0;NB12;starstedt;72691;70;0,014;0,5;;;;
Indispensable;Pointes;cones filtrés 1000µL;1920;1,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;2869323;113;0;0;;44966;;
Indispensable;Pointes;cones filtrés 200µL;960/b;3,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;Dutscher;14220;155;0;2;https://www.dutscher.com/article/014220;44966;;
Indispensable;Pointes;cones filtrés 20µL;5000;1;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;ThermoFischer ;11963466;555;0,111;2;https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-1/11963466;44966;;
Indispensable;Pointes;cones  1000µL non filtrés;500*5000;0,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;2869314;45;0;0;https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-2/11973466?tab=document#tab12;;;rapide
Indispensable;Pointes;cones 200µL non filtrés;1000;5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;703030;45;0;2;https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3030/;44966;;
Indispensable;Pointes;cones 10µl non filtrés;480/b 1920/carton;0,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;703010200;45;0;2;https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3010.200/;;;
Indispensable;Falcon 15;Falcon 15;500 (50/sac);3,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;62554502;53;0;1;https://www.sarstedt.com/en/products/laboratory/reagent-centrifuge-tubes/tubes/product/62.554.502/;;1 carton consommé par mois;
Indispensable;Falcon 50;Falcon 50 ;300 (25/sac);5,5;Réserve;0;NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques;starstedt;62547254;32;0;1;                                  ;44966;1 carton consommé par mois;

`;

// Genera los seedItems y los copia al portapapeles.
const seedItems = parseCsvTextToSeedItems(csvText);
console.log(JSON.stringify(seedItems, null, 2));

if (typeof copy === "function") {
  copy(JSON.stringify(seedItems, null, 2));
} else {
  console.log("copy() no está disponible aquí; copia el JSON desde la consola.");
}

console.log("Delimiter detectado:", JSON.stringify(detectDelimiter(csvText)));
console.log(
  "Cabeceras:",
  parseDelimitedLine(
    csvText.split("\n").find(line => line.trim() !== "") || "",
    detectDelimiter(csvText)
  )
);
console.log("Primer item:", seedItems[0]);