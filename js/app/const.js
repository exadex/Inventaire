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

// Hiérarchie stable des emplacements. Les libellés sont des données d'affichage :
// toutes les associations persistées utilisent les identifiants.
const FIXED_INVENTORY_ROOMS = [
  { id: "room-bureau", name: "Bureau", icon: "💻" },
  { id: "room-laboratoire", name: "Laboratoire", icon: "🔬" },
  { id: "room-reserve", name: "Réserve", icon: "📦" },
  { id: "room-culture-l1", name: "Culture L1", icon: "🧫" },
  { id: "room-culture-l2", name: "Culture L2", icon: "🧪" },
  { id: "room-chambre-froide", name: "Chambre froide", icon: "❄️" },
  { id: "room-piece-80", name: "Pièce -80°C", icon: "🧊" }
];

const INITIAL_INVENTORY_LOCATION_CATALOG = {
  locations: [
    ["location-frigo-labo", "room-laboratoire", "Frigo labo", "🌨️"],
    ["location-20-blanc-labo", "room-laboratoire", "-20°C blanc labo", "☃️"],
    ["location-20-gris-labo", "room-laboratoire", "-20°C gris labo", "☃️"],
    ["location-20-floricia-labo", "room-laboratoire", "-20°C Floricia labo", "🌸"],
    ["location-frigo-culture-l1", "room-culture-l1", "Frigo culture L1", "🌨️"],
    ["location-20-culture-l1", "room-culture-l1", "-20°C culture L1", "☃️"],
    ["location-20-1-salle-80", "room-piece-80", "-20°C 1 salle -80", "1️⃣"],
    ["location-20-2-salle-80", "room-piece-80", "-20°C 2 salle -80", "2️⃣"],
    ["location-20-3-salle-80", "room-piece-80", "-20°C 3 salle -80", "3️⃣"],
    ["location-80", "room-piece-80", "-80°C", "🧊"]
  ].map(([id, roomId, name, icon]) => ({ id, roomId, name, icon })),
  sublocations: []
};

const LEGACY_PLACEMENT_MAP = {
  "Bureau": ["room-bureau", null],
  "Réserve": ["room-reserve", null],
  "Laboratoire": ["room-laboratoire", null],
  "Chambre froide": ["room-chambre-froide", null],
  "Culture L1": ["room-culture-l1", null],
  "Culture L2": ["room-culture-l2", null],
  "Frigo labo": ["room-laboratoire", "location-frigo-labo"],
  "-20°C blanc labo": ["room-laboratoire", "location-20-blanc-labo"],
  "-20°C gris labo": ["room-laboratoire", "location-20-gris-labo"],
  "-20°C Floricia labo": ["room-laboratoire", "location-20-floricia-labo"],
  "Frigo culture L1": ["room-culture-l1", "location-frigo-culture-l1"],
  "-20°C culture L1": ["room-culture-l1", "location-20-culture-l1"],
  "-80°C": ["room-piece-80", "location-80"],
  "-20°C 1 salle -80": ["room-piece-80", "location-20-1-salle-80"],
  "-20°C 2 salle -80": ["room-piece-80", "location-20-2-salle-80"],
  "-20°C 3 salle -80": ["room-piece-80", "location-20-3-salle-80"]
};

const locationIcons = {
  "Laboratoire": "🔬",
  "Réserve": "📦​",
  "Bureau": "💻",
  "Culture L1": "🧫",
  "Frigo culture L1": "🌨️​​",
  "-20°C culture L1": "☃️​",
  "Culture L2": "🧪​",
  "Chambre froide": "❄️",
  "-80°C": "🧊",
  "-20°C blanc labo": "☃️​",
  "-20°C gris labo": "☃️​",
  "-20°C Floricia labo": "🌸",
  "Frigo labo": "🌨️​​",
  "-20°C 1 salle -80": "1️⃣",
  "-20°C 2 salle -80": "2️⃣",
  "-20°C 3 salle -80": "3️⃣"
};

const userIcons = {
  Vincent: "🧬",
  Luigi: "⚗️",
  Elina: "🔬",
  Floricia: "🧫",
  Caroline: "🧪",
  Christian: "💊​",
  Enora: "⭐️"
};

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
  "Cones pipettes"
];

const legacyCategoryMap = {
  Enzymes: "Procédé ExAdEx L2",
  Milieux: "Culture Cell",
  Anticorps: "Biomol",
  Primers: "Biomol",
  Composes: "Culture Cell",
  Consommables: "Code Famille",
  Kits: "Biomol"
};

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
