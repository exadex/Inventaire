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
  if (isPureTechnicalNote(notes)) return "";
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

// Parsea el CSV completo y devuelve seedItems listos.
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

  const rows = lines.slice(1).map((line, lineIndex) => {
    const values = parseDelimitedLine(line, delimiter);
    const row = {};

    headers.forEach((header, i) => {
      row[header] = cleanCsvValue(values[i] || "");
    });

    if (values.length !== headers.length) {
      console.warn(`Fila ${lineIndex + 2}: columnas esperadas=${headers.length}, columnas leídas=${values.length}`, {
        line,
        values
      });
    }

    return row;
  });

  return rows
    .filter(row => !shouldSkipCsvRow(row))
    .map((row, index) => buildItemFromCsvRow(row, index));
}

// Pega aquí tu bloque CSV o texto copiado desde Excel.
const csvText = `
 Catégories 	 Tags 	 Nom 	 Notes 	 Quantité 	 Localisation 	Effacer	Notes référence	Référence	 Fournisseur 	Prix 	Prix Unitaire	Seuil minimum	Lien	Effacer2	Effacer3	Délais livraison
Procédé ExAdEx L2	 Bouchon 	 Bouchon BD Luer - Lok™ avec protection mâle/femelle 	100	1	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	394075B	 Dutscher 	13,1	0,166	0	https://www.dutscher.com/article/394075B			
Procédé ExAdEx L2	 Seringue luer lock 	 Seringue BD 3P 20 ml Cone luer Lock  	120	2,5	 Bureau ,  Culture L2 	L2	NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	100081	 bastide 	38	0,316666667	NC	https://www.bastideleconfortmedical.com/seringues-3-pieces-20-ml-bd-plastipak-cone-luer-lock-100081.html	.		
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 1.2MM 	20	6	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	FD0000000-LLF24	 Aestetic group 	46	2,3	 2 boites	https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/527-raccord-d-emulsion-de-graisse-fll-o-12mm-x20.html	13/10/2022	1Boite pour 20 prélèvements	
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 1.4MM 	20	5	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	FD0000000-LLF14	 Aestetic group 	46	2,3	2 boites	https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/526-raccord-d-emulsion-de-graisse-fll-o-14mm-x20.html	13/10/2022	1Boite pour 20 prélèvements	
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 2.4MM 	20	6	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	FD0000000-LLF12	 Aestetic group 	46	2,3	2 boites	https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/525-raccord-d-emulsion-de-graisse-fll-o-24mm-x20.html	13/10/2022	1Boite pour 20 prélèvements	
Procédé ExAdEx L2	 Coating ULA 	 biocoating flask ula 	 60ml 	3	 Culture L1 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	F202005	 faCellitate 	60	1e/ml	1	faCellitate – BIOFLOAT™ FLEX coating solution [F202005] for 3D cell culture	27/03/2023		10 jours
Procédé ExAdEx L2	 Flask ULA T25 	  T25 Flask non traitée future ULA 	200	0,5	 bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	CNA6-1	 Roth/greiner bio 	116	0,58	1		28/02/2023		
Procédé ExAdEx L2	 Plaque 6 ula 	 Plaque Corning 6 puits ULA  	24	5,5	 bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	3471	 Dutscher 	339		1	https://www.dutscher.com/article/003471			
Procédé ExAdEx L2	ACL	ACL -eBioscience™ 10X RBC Lysis Buffer (Multi-species) 50 ml	50mL	2	Culture L2 ,  frigo Culture L1		NA71 : Sérum et autre milieu pour culture cellulaire animale	00-4300-54	ThermoFischer 	62		1	https://www.thermofisher.com/order/catalog/product/00-4300-54?SID=srch-srp-00-4300-54	recu		
Procédé ExAdEx L2	Antibiotique	 Pour milieu + PBS ? Chercher REF  		2												
Procédé ExAdEx L2	Antifongique	Amphotericin B solution	50mg	1	 Chambre froide 		NA76 Antibiotiques Pour Culture Cellulaire	0,28	Sigma	287	5,75		https://www.sigmaaldrich.com/FR/fr/substance/amphotericinbsolution924081397893	.		
Procédé ExAdEx L2	Antibiotique	Gibco™ Gentamicine (50 mg/ml)	20ml	2	 Culture L1 , Culture L2 		NA76 Antibiotiques Pour Culture Cellulaire	11520506	thermofischer 	220	11		https://www.fishersci.fr/shop/products/gentamicin-50-mg-ml-4/11520506	reçu 05/23		
Procédé ExAdEx L2	Antibiotique	0,5	10ml	0,5	Culture L2		NA76 Antibiotiques Pour Culture Cellulaire	15710064	Life tech	16,11	1,5					
Procédé ExAdEx L2	Antifongique	Amphotéricine B, MP Biomedicals	100mg				NA76 Antibiotiques Pour Culture Cellulaire	17660917	fischer	90,9			https://www.fishersci.fr/shop/products/amphotericin-b-mp-biomedicals-5/17660917?change_lang=true			
Procédé ExAdEx L2	Antifongique	Invivogen FUNGIN 75 MG (10 MG/ML)	75mg	1,5	 -20°C blanc labo 		NA76 Antibiotiques Pour Culture Cellulaire	ant-fn-1	invivogen	148			https://www.fishersci.com/shop/products/fungin-75-mg-10-mg-ml/NC9326704			
Procédé ExAdEx L2	Antifongique	Caspofongin Diacetate	5mg	1	Culture L1		NA76 Antibiotiques Pour Culture Cellulaire	SML0425-5MG	Merck	112			https://www.sigmaaldrich.com/FR/fr/substance/caspofungindiacetate121342179463173			
Procédé ExAdEx L2	Antibiotique	Primocin	250mg	4	-20°C blanc labo		NA76 Antibiotiques Pour Culture Cellulaire	ant-pm-05	invivogen	119			https://www.invivogen.com/primocin			
Procédé ExAdEx L2	Milieu EGM	Endothelial Cell Growth Medium 2	500ml	4	figo labo culture	Milieu + suppléments	NA71 : Sérum et autre milieu pour culture cellulaire animale	C-22011	Promocell	153,85		1	https://promocell.com/product/endothelial-cell-growth-medium-2/	22/03/2023		15 jours
Procédé ExAdEx L2	Milieu EGM	SupplementMix / Endothelial   Cell Growth Medium 2	500ml	4	Congèl labo culture		NA71 : Sérum et autre milieu pour culture cellulaire animale	  C-39216	Promocell	50,85	2	1	https://promocell.com/product/endothelial-cell-growth-medium-2/	22/03/2023		15 jours
Procédé ExAdEx L2	 Bouchon 	 BD luer lock caps 	50	2	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	BD 408531	 termofischer 	130	2,6	nc	https://www.fishersci.com/shop/products/bd-luer-lok-caps/1482331	.		
Procédé ExAdEx L2	 Bouchon 	 BD Luer-Lok™ cap with membrane latex-free 	100	 s 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	394074		34	0,34	NC	https://www.dutscher.com/article/394074	.		
Procédé ExAdEx L2	 Bouchon 	 Bouchon ler lock  st 	200	 s 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	394080	 ThermoFischer  	50	0,25	NC	https://www.fishersci.fr/shop/products/x200-bouchons-luer-lock-st/16654462#?keyword=394080	.	1 bouchon par prélèvement=1 commande 100 prélèvement	
Procédé ExAdEx L2	 Bouchon 	 Bouchon Luer Lock (MC1711) 	100	 s 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques			77	0,77	NC	https://www.aestheticgroup.fr/en/caps/125-luer-lock-cap-mc1711.html?search_query=FD0001711-MC&results=1	.		
Procédé ExAdEx L2	 Bouchon 	 bouchon seringue violet Enfit 20 ml *300 	200	 s 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	EF000	 Bexen medical 	25	0,125	2  boites	https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit	19/10/2022		
Procédé ExAdEx L2	 celldisc 	 sdv 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	678101	 Greiner bio  	ECHANTILLON	ECHANTILLON	NC	https://shop.gbo.com/fr/france/products/bioscience/mass-cell-culture/bs-celldisc/celldisc-tc-und-advanced-tc/678101.html?sword_list%5B0%5D=678101&no_cache=1&_ga=2.265742541.314801138.1677662655-627813974.1674230259	.		
Procédé ExAdEx L2	 celldisc 	 CELLDISC, 4 LAYER, 1000 CM², PS, CLEAR, TC, STANDARD SCREW CAP RED, STERILE 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	678104	 Greiner bio  	ECHANTILLON	ECHANTILLON	NC		.		
Procédé ExAdEx L2	 Blouse  	 Blouse jetable X30 IC 270B WS Labcoat LG (Sterile­only, Double bag) 	30				NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques		 Fisher scientific 	198						
Procédé ExAdEx L2	 Blouse  	 Blouse jetable ENDO protectlab taille XL  	50	 x 	 Culture L1, Culture L2 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques				0	échantillon	https://www.labotienda.com/fr/produits-laboratoire/blouse-jetable-taille-xl-blanche-1-pc/	.		
Procédé ExAdEx L2	 Flask cell repelent 	 CELL CULTURE FLASK, 250 ML, 75 CM², PS, CLEAR, CELLSTAR®, CELL-REPELLENT SURFACE, WHITE FILTER SCREW CAP 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	658985	 Greiner bio  	ECHANTILLON	ECHANTILLON	échantillon	https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/flacons-surface-cell-repellent/658985.html?sword_list%5B0%5D=658985&no_cache=1&_ga=2.197454317.314801138.1677662655-627813974.1674230259	.		
Procédé ExAdEx L2	 Flask culture suspension 	 Flacon pour culture en suspension, 250ml, PS,bch vissant avec filtre blanc, transparent, CELLSTAR 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	réf 658195	 Greiner bio  	ECHANTILLON	ECHANTILLON	échantillon	https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/flacons-cellstar/flacons-pour-culture-en-suspension/658195.html?sword_list%5B0%5D=658195&no_cache=1&_ga=2.268338764.314801138.1677662655-627813974.1674230259	.		
Procédé ExAdEx L2	 Flask culture suspension 	 Plaque multi puits culture suspension, 24 puits 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	662102	 Greiner bio  	ECHANTILLON	ECHANTILLON	échantillon	https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/plaques-multi-puits-cellstar/657185.html?sword_list%5B0%5D=657185&no_cache=1&_ga=2.261006799.314801138.1677662655-627813974.1674230259	.		
Procédé ExAdEx L2	 Flask culture suspension 	 Plaque multi puits culture suspension, 6 puits 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	657185	 Greiner bio  	ECHANTILLON	ECHANTILLON	échantillon		.		
Procédé ExAdEx L2							NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques									
Procédé ExAdEx L2	 Flask ULA T25 	 T 25 cm²FLACON DE CULTURE  ULA  COL u INCLINÉ BOUCHON VENTILÉ STÉRILE. 	25		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	004616B	 Dutscher 	300	12	NC	https://www.dutscher.com/article/004616B	.		
Procédé ExAdEx L2	 Flask ULA T25 	 T25cm FLACON DE CULTURE  ULA VENTILE STERILE x5x2 	10				NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	330193		120	12	Ref -		10/10/2022		
Procédé ExAdEx L2	 Flask ULA T25  	 T25cm FLACON DE CULTURE  ULA RECTANGLE  COL INCLINE BOUCHON VENTILE STERILE x5x5 	25		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	4616+	 Dutscher 	64,25	2,57	0,5	https://www.carlroth.com/fr/fr/bouteilles-assiettes-plats-pour-culture-cellulaire/flacons-pour-culture-suspension-cellstar-bouchon-a-vis-avec-filtre/p/cna6.1	16/12/2022		
Procédé ExAdEx L2	 Flask ULA T75 	 T 75cm²FLACON DE CULTURE  ULA  COL INCLINÉ  u BOUCHON VENTILÉ STÉRILE. x6 x4 		1	 Bureau, réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	174951	 ThermoFischer  		#DIV/0!	1		.		
Procédé ExAdEx L2	 Plaque 24 ula 	 Plaque 24 puits, Repellent, avec LID, stérile 	 ECHANTILLON 	 ECHANTILLON 			NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	662970	 Greiner bio  	ECHANTILLON	ECHANTILLON	échantillon	https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/microplaques-surface-cell-repellent/657970.html?sword_list%5B0%5D=657970&no_cache=1&_ga=2.29147902.314801138.1677662655-627813974.1674230259	.		
Procédé ExAdEx L2							NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques									
Procédé ExAdEx L2	 Robinet 	 3 voie seuls 			 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	92831				NC		.		
Procédé ExAdEx L2	 Robinet 	 3 voies seuls, rotation 360° (boite de 100) 	100		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	70334 ou 92831	 distrimed 	50	0,5	NC	https://www.distrimed.com/product_info.php?products_id=8067	.		
Procédé ExAdEx L2	 Robinet 	 Robinet Blanc 3 voies BD Connecta - Boîte de 100 	100		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	ROB600	 robé médical 	42	0,42	NC	https://www.robe-materiel-medical.com/Robinet-3-voies-BD-Connecta-ROB600-materiel-medical.htm	.		
Procédé ExAdEx L2	 Robinet luer  	 Robinet 3 voies luer lock  	300		 Réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	1104,19	 bexen medical 	55	0,183333333	4	https://www.bexenmedical.com/fr/materiel-medical/robinet-luer-lock	19/10/2022		rapide
Procédé ExAdEx L2	 Seringue 	 Seringue 1ml soft jet  	100		 réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	5010	 Honke sass Wolf 	125	1,25	3	https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249	.		
Procédé ExAdEx L2	 Seringue 	 Seringue non luer lock  	50		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	  	 Dutscher 	11	0,22	NC	https://www.dutscher.com/article/050833	.		
Procédé ExAdEx L2	 Seringue 10 ml 	 Seringue 10ml 	10		 réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	5100-000V0	 Honke sass Wolf 	125	12,5	1	https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249	.		
Procédé ExAdEx L2	 Seringue 	 Seringue 10ml 	100	3	 Culture 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	50008	 Terumo 	30	0,3	2		07/07/2022		
Procédé ExAdEx L2	 Seringue 100ml 	 Seringue 100ml  	100	 - 	 réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	SS+01EH1	 Terumo 	34,7	0,347	1	https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB	.		
Procédé ExAdEx L2	 Seringue luer lock 	 Seringue BD 3P 20 ml Cone luer Lock  	120	2,5	 Bureau ,  Culture L2 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	300629	 Aestetic group 	70	0,583333333	3	https://www.aestheticgroup.fr/fr/recherche?controller=search&orderby=position&orderway=desc&search_query=300629&submit_search=	.		
Procédé ExAdEx L2	 Seringue luer lock 	 SERINGUE BD PLASTIPAK 3 PCS 20ml LUER LOCK STERILE GAMMA x192 	192		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	302830	 Dutscher 	121	0,630208333	3	https://www.dutscher.com/article/302830	15/11/2022		1 mois
Procédé ExAdEx L2	 Seringue luer lock 	 Seringue Enfit 20 ml Luer lock  	300		 Bureau, réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	EF020	 Bexen medical 	75	0,25	8	https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit	19/10/2022		
Procédé ExAdEx L2	 Seringue luer lock 	 Seringues 3 pièces luer lock 20 ml / bte de 50 	120		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	SLL20	 robé médical 	60,47	0,503916667	NC	https://www.robe-materiel-medical.com/Seringues-3-pieces-NIPRO-Luer-Lock-Boite-de-100-SLL20-materiel-medical.htm	.		
Procédé ExAdEx L2	 Seringue luer lock 	 Seringue luer lock  50 mL 	25	1	 Reserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	15349067	 ThermoFischer  	30	0	1	https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB	.		
Procédé ExAdEx L2	 Seringue luer lock 	 Seringues 3 pièces Luer Lock Euromedis*50 	10		 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	12713MED / 90357MED	 materiel medical  	50	5	NC	https://www.materielmedical.fr/4727-seringues-3-pieces-luer-lock-euromedis.html	.		
Procédé ExAdEx L2	 Tamis/ Filtre 	 Filtre - tamis cellulaire Pluristrainer. Porosité 60 	25	 - 	 Réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	149195	 Dutscher 	180	7,2	2	https://www.dutscher.com/article/149195	.		
Procédé ExAdEx L2	 Tamis/ Filtre 	 filtre 0,22 13mm 	50				NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	257240	 dutscher 	40	0,8	ref- 		31/07/2022		
Procédé ExAdEx L2	 Tamis/ Filtre 	 filtre 0,22 33mm 	50	3	 Culture L1 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	257160	 dutscher 	40	0,8	ref- 		31/07/2022		
Procédé ExAdEx L2	 Tamis/ Filtre 	 filtre 0,45 	50	1	 Réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques		 starstedt 	180		2	UGAP			
Procédé ExAdEx L2	 Tamis/ Filtre 	 Tamis 100 	50	0,5	 Réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	352360	 servilab 	100*		1				
Procédé ExAdEx L2	 Tamis/ Filtre 	 Tamis 70 	50	0,5	 Réserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	352350	 servilab 	100*						
Procédé ExAdEx L2	 Tamis/ Filtre 	 Tamis 40 	50	2	 Reserve 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	352340	 servilab 	100*						
Procédé ExAdEx L2	 Filtre 	Filtre, non stérile, 60 mm Ø, 0,45 µm	1	 - 			VA.03	391-2093	 vwr 	20						
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 1.2MM 	24	 nc 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	CGTU DAT4L1.2MM	 Benewmedical 		0	NC		.		
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 1.4MMref 		 nc 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	CGTU DAT4L1.4MM	 Benewmedical 			NC		.		
Procédé ExAdEx L2	 Tulipe 	 REDUCTEUR SU 2.4MM ref 		 nc 	 Bureau 		NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques	CGTU DAT4L2.4MM	 Benewmedical 			NC		.		
Procédé ExAdEx L2																
Procédé ExAdEx L2	Antibiotique	pen/strep stock	100Ml	6	5			15140122	thermofischer	10	0,1		https://www.thermofisher.com/order/catalog/product/15140122?SKULINK	28/02/2023		1mois
Procédé ExAdEx L2																
Procédé ExAdEx L2	 lame chirurgicale  	Lame chirurgicale n° 23 pour bistouri	100	3	 Culture L1 		NB.16 / 90189084	764315	 Dutscher 							
Procédé ExAdEx L2																
Procédé ExAdEx L2	 Gants L2 verts 	 Gants L2 - taille L 		1			HA.01									
Procédé ExAdEx L2	 Gants L2 verts 	 Gants L2 - taille M 		1			HA.01									
Procédé ExAdEx L2	 Gants L2 verts 	 Gants L2 - S 	150	6			HA.01	065745B	 Dutscher 	16,47						
Procédé ExAdEx L2	 Gants L2 verts 	 Gants L2 - XS 	150	4			HA.01	065744B	 Dutscher 	16,47						
Procédé ExAdEx L2	 Gants bleus 	 Gants - taille XS 	100	3			HA.01	65927	 Dutscher 	4,3						
Procédé ExAdEx L2	 Gants bleus 	 Gants - taille S 	100	6			HA.01	65928	Dutscher	5,8						
Procédé ExAdEx L2	 Gants bleus 	 Gants - taille M 	100	5			HA.01		Dutscher							
Procédé ExAdEx L2	 Gants bleus 	 Gants - taille L 	100	4			HA.01		Dutscher							
Procédé ExAdEx L2	 Gants oranges 	 Gants orange S 	50	2			HA.01	65706	Dutscher	24,3						
Procédé ExAdEx L2	 Congelation 	 DMSO 	 500mL 	2	Culture L1			D4540	Merck Sigma	120						

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