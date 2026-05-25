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
  "Cones pipettes",
  "Indispensable"
];

const legacyCategoryMap = {
  Enzymes: "Procédé ExAdEx L2",
  Milieux: "Culture Cell",
  Anticorps: "Biomol",
  Primers: "Biomol",
  Composes: "Culture Cell",
  Consommables: "Indispensable",
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