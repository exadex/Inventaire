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
const csvText = `Catégorie	 Tags 	 Nom 	 Notes 	 Quantité 	 Localisation 	Notes référence	Référence	 Fournisseur 	Prix 	Prix Unitaire	Seuil minimum	Lien	Délais livraison
Culture Cell	Agarose	Agarose low gelling temperature Bioreagent Sigma 10G	100g	15mL (falcon) + 10g neuf	placard floricia		A9045	Sigma	118	0,23	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/a9045	
Culture Cell	Agarose	Agarose Bioreagent for molecular biology	100g	1,00	Placard produits chimiques		A9539	Merck	110,6				
Culture Cell	Agarase	Agarase from pseudomonas atlantica Sigma	100g	1,00	placard produit chimique		A6306	Sigma	141	0,28/ml	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/a6306	
Culture Cell	Boite culture 2D	boite ø 60	500	0,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	833901	starstedt	75	0,15	0,5	https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3901/	
Culture Cell	Boite culture 2D	Boîte C.C 100 mm, standard	300	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3902	starstedt	68,22	0,2274	0,5	https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3903/	
Culture Cell	Boite culture 2D	boite ø 150	100	0,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	833902	starstedt	60	0,6	0,5	https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3902/	
Culture Cell	Boite culture 2D	boite ø 35	50	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	833900	starstedt	73	1,5	0,5	https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3900/	
Culture Cell	BSA	BSA free fatty acid  25g	25g	3,00	port frigo labo en bas		A6003-25G	merck	450	18e/g		https://www.sigmaaldrich.com/FR/fr/product/sigma/a6003	15 jours
Culture Cell	Collagénase	Collagenase A from Clostridium histolycum (500mg) 	500mg	1,00	frigo salle culture		10103586001	Sigma Merck	305,76	0,64	0,5	https://www.sigmaaldrich.com/FR/fr/product/roche/collaro	15 jours
Culture Cell	Accumax 	Accumax solution	100 ml	1,00	L2 Congel 		A7089-100ML	Sigma	200	2	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/a7089	
Culture Cell	Trypsine	Trypsine 0,5 + EDTA 1X	100ml	5,00	congel grand labo		25300-054	thermofischer	59,3	0,59	1	https://www.thermofisher.com/order/catalog/product/25300054?SID=srch-hj-25300-054	
Culture Cell	Collagénase	Collagénase A	10g	1,50	frigo labo culture		A6003-10G	Merck	200	20€/g		https://www.sigmaaldrich.com/FR/fr/product/sigma/a6003	
Culture Cell	BRL	Rosiglitazone BRL	50mg	NC		NA71 : Sérum et autre milieu pour culture cellulaire animale	R2408-50MG	Sigma	280	23	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/i7018	
Culture Cell	T3	(T3) 3,3′,5-Triiodo-L-thyronine sodium Salt	100ml	NC		NA71 : Sérum et autre milieu pour culture cellulaire animale	T6397	Sigma	67	0,67	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/i7018	
Culture Cell	BRL	Rosiglithazone BRL 49653 		NC	congèle salle de culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	49653						
Culture Cell	DEX	Dexamethasone (PM : 392.46)	100mg	NC		NA71 : Sérum et autre milieu pour culture cellulaire animale	D4902	Sigma	75	0,75	1	https://www.sigmaaldrich.com/FR/fr/substance/dexamethasone3924650022?gclid=CjwKCAjw2K6lBhBXEiwA5RjtCdSCdJwZu2sP4yeAnOsKIbfaI-7aJ4e-wlrgmkCRX6qXiMlsfM0iXRoCKjgQAvD_BwE&gclsrc=aw.ds	
Culture Cell	NAC	n-acetyl-L-cysteine	5G	NC	frigo salle de culture L1	NA71 : Sérum et autre milieu pour culture cellulaire animale	A7250	sigma 					
Culture Cell	Insuline	Insuline, humain recombinant, zinc solution, 4mg/ml	5 ml 	NC	-20 pièce -80	NA71 : Sérum et autre milieu pour culture cellulaire animale	12585014	gibco	95	19€/ml			
Culture Cell	Vascular network	18-beta Glycyrrhetinic Acid (Enoxolone)	10g	1,00	Placard Floricia	NA71 : Sérum et autre milieu pour culture cellulaire animale	G10105-10G 	Merck	110			https://www.sigmaaldrich.com/FR/fr/product/aldrich/g10105?srsltid=AfmBOoroOGL3FoP0JhXxnyyHi-JixsymSZPcTFBXkrrtczLwAoVEwUEe	
Culture Cell	TGFb	Human TGFb1 recombinant protein peprotech	2ug	1,50	Congel gris labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	100-21-2ug	thermofischer	75	16	1	https://www.thermofisher.com/antibody/product/Human-TGF-beta-1-Recombinant-Protein/100-21-1MG	
Culture Cell	Triacsin C	Triacsin C, acyl-CoA synthetase inhibitor	100µg	1,00	salle de culture congel tiroir 1	NA71 : Sérum et autre milieu pour culture cellulaire animale	ab141888	abcam	200	2€/µg		https://www.abcam.com/products/biochemicals/triacsin-c-acyl-coa-synthetase-inhibitor-ab141888.html?productWallTab=ShowAll	
Culture Cell	Acide Ascorbique	Sodium L ascorbate	100g	1,00	placard culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	A4034-100G						
Culture Cell	TNF	SB 10mM	10mG	1,00	-20 gris	NA71 : Sérum et autre milieu pour culture cellulaire animale	HB3555-10mg	hello bio 	200	20		https://hellobio.com/sb-431542.html	
Culture Cell	PDGF-AB	5 μM 429 platelet-derived growth factor-AB (PDGF-AB, R&D Systems 10ug)	10ug	1,00	-20°C culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	222-AB-010	RD system	245				
Culture Cell	lysophosphatidic acid	5 μM lysophosphatidic acid (1mg // 3854/1) R&D systems	1mg	1,00	-20°C culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	3854/1	RD system	89				
Culture Cell	Semaglutide	Semaglutide	1mg	1,00	-20°C culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	TA9H97BAEA07	Sigma	136				
Culture Cell	Liraglutide	Liraglutide	5mg	1,00	-20°C culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	SML3925-5mg	Merck	165				
Culture Cell	Tirzepatide	Tirzepatide 	5mg	1,00	+4°C frigo labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	AABH9A95AC09	Sigma	198				
Culture Cell	TNFa	Human TNFa recombinant protein peprotech	10ug	1,00	Congel gris labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	300-01A-10UG	thermofischer	75				
Culture Cell	Celecoxib	Celecoxib	10mg	1,00	RT placard culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	3786/10	Tocris		191		https://www.tocris.com/products/celecoxib_3786	
Culture Cell	Nintedanib	Nintedanib	10mg	2,00	-20°C culture	NA71 : Sérum et autre milieu pour culture cellulaire animale	7049/10	Tocris		91		https://www.tocris.com/products/nintedanib_7049	
Culture Cell	Milieu DMEM	DMEM sans glucose (pour glucose uptake)	500mL	1,00	Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	11966025	Thermofisher	18			DMEM, sans glucose	
Culture Cell	Milieu DMEM	DMEM sans glu	500 ml		Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	D6046	Sigma	32	0,06	1		
Culture Cell	Milieu DMEM	DMEM glutamax 1g/L	500 ml	5,00	Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	21885-025	ThermoFischer 	16,5	0,006	3		Rapide
Culture Cell	Milieu DMEM	DMEM glutamax 4,5g/l	500ml	24,00	Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	31960-021		75,5	0,75	3		
Culture Cell	Milieu DMEM	DMEM/F12 (1:1) W GLUT-I 500ML	DMEM/F12 (1:1) W GLUT-I 500ML	7,00	Frigo grand labo/chambre froide	NA71 : Sérum et autre milieu pour culture cellulaire animale	31331028	thermofischer	62			https://www.thermofisher.com/order/catalog/product/31331093?SID=srch-hj-31331093	
Culture Cell	Milieu EGM	SupplementMix: Contains all media supplements premixed in one vial		11,00		NA71 : Sérum et autre milieu pour culture cellulaire animale	c-39216	Promocell	 56,50 € 	2,8	2	https://promocell.com/product/endothelial-cell-growth-medium-2/	
Culture Cell	Milieu EGM	SupplementPack: Contains all media supplements as individual vials		6,00	Frigo grand labo/-20 grand labo (supp séparés)	NA71 : Sérum et autre milieu pour culture cellulaire animale	c-39211		 234,00 € 	23,4	1		
Culture Cell	Milieu	Basal medium 2 (500ml) 	500ml	11,00	Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	c-22211	Promocell	 140,00 € 	0,28	1	https://promocell.com/product/endothelial-cell-growth-medium-2/	
Culture Cell	Milieu PBS	PBS		5,00	Frigo Labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	14190-094	thermofischer	23,4	1,15	2	https://www.thermofisher.com/order/catalog/product/14190094	rapide
Culture Cell	Milieu PBS	PBS poche cytiva Sangamo (a aliquoter en stérile dans bouteilles 250mL  attention P/S)	5L	1,00	Chambre froide placard 								
Culture Cell	Glutamax	Supplément GlutaMAX™	100ml	s	x		35050061	thermofischer	62			https://www.thermofisher.com/order/catalog/product/35050061	
Culture Cell	Milieu EGM	Growth Medium (Ready-to-use): Includes Basal Medium and SupplementMix	500mL	2,00	Frigo grand labo/-20 grand labo (supp)		c-22011	Promocell	146	14,6	1	https://promocell.com/product/endothelial-cell-growth-medium-2/	
Culture Cell	Milieu	3-Isobutyl-1-methylxanthine (IBMX)	250mg	NC			I7018-250MG	Sigma	250	1	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/d4902	
Culture Cell	Milieu	RPMI 1640 Medium, GlutaMAX™ Supplement, HEPES (pour lipolyse)	500mL	1,00	Frigo grand labo	NA71 : Sérum et autre milieu pour culture cellulaire animale	72400021	Thermofisher	25			RPMI 1640 Medium, GlutaMAX™ Supplement, HEPES	
Culture Cell	Pastette	Pipette stérile Pasteur 3 ml (a commander de preference)	1000	2,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	390513	Dutscher	52		1	https://www.dutscher.com/article/390513	
Culture Cell	Pastette	Pipette 3,5 ml non stérile	200	3,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	86.1171	starstedt	18,5	0,0925	1	Produit - Sarstedt	
Culture Cell	Pastette	Pipette  Pasteur 3 ml ( ref de secours)	840	1,00	Réserve		86.1171.001	starstedt	73	0,086904762	1	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-de-transfert/produit/86.1171.001/	
Culture Cell													
Culture Cell	Pipette	Pipette  1 ml		0,25	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	86.1251.001	starstedt	231		0,5	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1251.001/	
Culture Cell	Pipette	Pipette 5 ml		3,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	86.1253.001	starstedt	310		0,5	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1253.001/	
Culture Cell	Pipette	Pipette 10 ml	500	3,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	86.1254.001	starstedt	179		1	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1254.001/	
Culture Cell	Plaque 6 	Plaque 6 puits, standard, fond plat	500	3,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3920	starstedt	44,45	0,0889	1	https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3920/	
Culture Cell	Plaque 12	Plaque 12 Puits	50	3,00		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	833921	starstedt	43				
Culture Cell	Plaque 24	Plaque 24W fond plat	50	3,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3922	Sarstedt					
Culture Cell	Plaque 48	Plaque 48 puits fond plats standart	1000	3,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3923	starstedt	55,2	0,0552	1	https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3923/	
Culture Cell	Plaque 96 	Plaque 96 puits  Standard, fond plat	100	3,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3924	starstedt	100	1	1	https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3924/	
Culture Cell	Plaque 6 puit ula	Plaque 6 puits ULA	24	5,50	Bureau	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	3471	Dutscher	248				
Culture Cell	Plaque 6 puit ula	plaque 6 puit ULA	7	2,00	Bureau	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	174932	thermofischer	123	17,57142857		https://www.thermofisher.com/order/catalog/product/174932?SKULINK	
Culture Cell	 Plaque 24 ula 	 Plaque Corning 24 puits  ULA 	 24 	1,50	Bureau	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	3473	Dutscher	700	29,16666667	1	https://www.dutscher.com/article/003473	
Culture Cell	 Plaque 96 ula 	 Plaque corning 96 puits ULA 	 24 	2,00	Bureau	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	7007	Dutscher	700	29,16666667	2	https://www.dutscher.com/article/007007	
Culture Cell	Eppendorf	Microtube 0,5ml	5000	3,00	Réserve	NB11	72,699	starstedt	61	0,0122	0,5		
Culture Cell	Eppendorf	Microtube 1,5 ml	5000	2,00	Réserve	NB11	72,690,001	starstedt	50	0,01	2	https://www.sarstedt.com/fr/produits/laboratoire/microtubes-a-vis-tubes-a-reaction/tubes-a-reaction/produit/72.706/	
Culture Cell	Eppendorf	Microtube 2ml	5000	2,00	Réserve	NB12	72 691	starstedt	70	0,014	0,5		
Culture Cell		Microtube 1,7mL low adhesion	1000	1,00	L1	NB11	011720	dutscher	43				
Culture Cell	Tube prelevement	contenant 120ml (bouteilles bouchon jaune)	250	1,5 cartons	L1		759922420	starstedt	74,8	0,2992	1		
Culture Cell	CryotubeTube	Cryotubes 1,8 ml	50	3 boites	Réserve		72379006	starstedt	14	0,28	1		
Culture Cell	Tube FACS	Falcon facs 5ml	500	0,00	Réserve		62526028	starstedt	72	0	1		
Culture Cell	Tube FACS	falcon fac 15 ml	500	1,00	Réserve		352059	starstedt	215	0,43	1	ugap	
Culture Cell	Falcon 15	Falcon 15	500 (50/sac)	3,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	62554502	starstedt	53		1	https://www.sarstedt.com/en/products/laboratory/reagent-centrifuge-tubes/tubes/product/62.554.502/	
Culture Cell	Falcon 50	Falcon 50 	300 (25/sac)	5,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	62547254	starstedt	32	0	1	https://www.sarstedt.com/en/products/laboratory/reagent-centrifuge-tubes/tubes/product/62.547.254/	
Culture Cell	Pointes	cones 1000µL non filtrés	10x500		Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	703050	starstedt	46		2	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3050/	
Culture Cell	Pointes	cones  1000µL non filtrés	500*5000	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	2869314	starstedt	45			https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-2/11973466?tab=document#tab12	rapide
Culture Cell	Pointes	cones 200µL non filtrés	1000	5,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	703030	starstedt	45		2	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3030/	
Culture Cell	Pointes	cones 10µl non filtrés	480/b 1920/carton	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	703010200	starstedt	45		2	https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3010.200/	
Culture Cell	Pointes	cones filtrés 1000µL	1920	1,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	2869323	starstedt	113				
Culture Cell	Pointes	cones filtrés 200µL	1920		Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	703031355	starstedt	80				
Culture Cell	Pointes	cones filtrés 200µL	960/b	3,50	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	14220	Dutscher	155		2	https://www.dutscher.com/article/014220	
Culture Cell	Pointes (référence ok)	cones filtrés 20uL	1920	3,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	70.3020.255	starstedt					
Culture Cell	Pointes	cones filtrés 20uL	1920		Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	3020255	starstedt	82				
Culture Cell	Pointes	cones filtrés 20µL	5000	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	11963466	ThermoFischer 	555	0,111	2	https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-1/11963466	
Culture Cell	Pointes (référence ok)	cones filtrés 10µL	1920	1,00	Reserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	70.3010.205	sarstedt	68,16	0,0355		https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3010.205/	
Culture Cell	Cone multicanaux	cliptip 300 ext low retention 	960	1,00	bureau	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	94410610	ThermoFischer 	55	0,057291667	1		
Culture Cell	Décontamination	Biocidal ZF	6	6,00	Labo		ZF006	Biovalley 	480	79,33333333	1	https://www.biovalley.fr/desinfectant-mycoplasmes-pour-surfaces-2002/mycoplasma-off-surface-disinfection-347000036.html	
Culture Cell	Décontamination	Phagospray	5L	0,50	Labo		972500	Dutscher	32,85				
Culture Cell	Décontamination	Mycoplasma Off 1L	1	1,00	Labo		15-1000	Biovalley 	325	65	1	https://www.biovalley.fr/desinfectant-mycoplasmes-pour-surfaces-2002/mycoplasma-off-surface-disinfection-347000036.html	
Culture Cell	Flask	T12 	840	S	Réserve			starstedt	51,24	0,061	1	ugap	
Culture Cell	Flask	T25 	25	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	83.3910.002		186	7,44	2	https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3910.002/	
Culture Cell	Flask	T25 	300	1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	2582557	starstedt	170	0,566666667			
Culture Cell	Flask	T75 		1,00	Réserve	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	3814	starstedt	490		0,5	https://www.dutscher.com/article/003814	
Culture Cell		Sac Kraft pour Dasri (conditionnement par 25)	25	2	Labo		PAP822GP002	Labo+	34,26				
Culture Cell	Masque	Masque médical OP-AIR à élastiques Type II bleu	960			HA.02	475407	Dutscher	113,1	0,1178125			
Culture Cell	Masque	Masque De Protection Respiratoire Jetable 3 plis	50			HA.02	911817	Labo Plus	1,02	0,0204			
Culture Cell	Collagen matrix	Collagen from bovine achilles tendon 10g	10g	1,00			C9879-10G	Sigma	370	37	1	https://www.sigmaaldrich.com/FR/fr/product/roche/collaro	
Culture Cell	Milieu	gelatine solution		1,00	Frigo grand labo							.	
Culture Cell	Milieu	3dGRO Organoid Freeze medium	500 ml	1,00	Frigo labo		SCM301	Sigma	150	0,3	1		
Culture Cell	Milieu	Azide 0,1M solution	1ml	0,50	Frigo labo		08591-1ML	Sigma	60	60			
Culture Cell	Milieu	F10HAM	500 ml	1,00	Frigo grand labo		N6908	Sigma	121	0,24	1		
Culture Cell	Milieu	Formoterol fumarate dihydrate	100mg	1,00			F9552-10 mg 	Sigma	67,7	0,67	1	https://www.sigmaaldrich.com/FR/fr/product/sigma/f9552	
Culture Cell	Milieu	herpes		5,00	Frigo grand labo		BEPP7-737E		130		1		
Culture Cell	Milieu	L-glutamine		7,00	Frigo grand labo		BE17-605E	lonza	240		1		
Culture Cell	Milieu	NA pyruvate	50 ml	2,00	Frigo grand labo				50,25	1			
Culture Cell	Milieu	Sodium Acetate Solution 		2,00			71196-100 ml	Sigma	253		1	https://www.sigmaaldrich.com/FR/fr/product/sigma/71196	
Culture Cell	Milieu MEM	MEM 100X		4,00	Frigo grand labo		M7145		293		1		
Culture Cell	Milieu MEM	MEM nea 100X		6,00	Frigo grand labo		11140-035		293	29,3	1		
Culture Cell	plaque 24 insert	insert culture plaque 24 puits 0,4µm		NC			353095	Dutscher	215				
Culture Cell	plaque 24 insert	Plaque companion 24 puits 6,3µm		NC			353595	Dutscher	110				
Culture Cell	Plaque 6 	Plaque 6 puits, Repellent, avec LID, stérile	 ECHANTILLON	échantillon			657970	Greiner bio 	 ECHANTILLON	 ECHANTILLON			
Culture Cell	Plaque 96 	Plaque 96 puits applied OPTIQUE	20	1,00	Réserve		10407314	ThermoFischer 	200	10	0,5	https://www.fishersci.fr/shop/products/applied-biosystems-microamp-optical-96-well-reaction-plate-barcode-4/p-4918085	
Culture Cell	Plaque 96 	 support de Plaque 96 puits applied Veriflex	10	1,00	Réserve		10361235	ThermoFischer 	120	12	0,5	https://www.fishersci.fr/shop/products/p/10361235	
Culture Cell	repet tip	repet tip 1,25 mL	100	1,00	Réserve		F164530	gilson 	46	0,46	0,5		
Culture Cell	 Tamis/ Filtre 	 filtre 0,22 	 50 	 Réserve 	 1 	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	SF13CA22S	 starstedt 	103	2,06	1	UGAP	1 tous les 3 mois
		 petrie dish 100x100x20 carrée 				NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques							
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