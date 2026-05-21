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
  Christian: "💊​"
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

const seedItems = [
  {
    "id": "itm-CSV-0001",
    "name": "Bouchon BD Luer - Lok™ avec protection mâle/femelle",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 394075B | Fournisseur: Dutscher | Prix: 13,1 | Prix unitaire: 0,166 | Lien: https://www.dutscher.com/article/394075B"
  },
  {
    "id": "itm-CSV-0002",
    "name": "Seringue BD 3P 20 ml Cone luer Lock",
    "category": "Procédé ExAdEx L2",
    "quantity": 2.5,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 5,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 120 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 100081 | Fournisseur: bastide | Prix: 38 | Prix unitaire: 0,316666667 | Lien: https://www.bastideleconfortmedical.com/seringues-3-pieces-20-ml-bd-plastipak-cone-luer-lock-100081.html"
  },
  {
    "id": "itm-CSV-0003",
    "name": "REDUCTEUR SU 1.2MM",
    "category": "Procédé ExAdEx L2",
    "quantity": 6,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 12,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Conditionnement: 20 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: FD0000000-LLF24 | Fournisseur: Aestetic group | Prix: 46 | Prix unitaire: 2,3 | Lien: https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/527-raccord-d-emulsion-de-graisse-fll-o-12mm-x20.html"
  },
  {
    "id": "itm-CSV-0004",
    "name": "REDUCTEUR SU 1.4MM",
    "category": "Procédé ExAdEx L2",
    "quantity": 5,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 10,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Conditionnement: 20 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: FD0000000-LLF14 | Fournisseur: Aestetic group | Prix: 46 | Prix unitaire: 2,3 | Lien: https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/526-raccord-d-emulsion-de-graisse-fll-o-14mm-x20.html"
  },
  {
    "id": "itm-CSV-0005",
    "name": "REDUCTEUR SU 2.4MM",
    "category": "Procédé ExAdEx L2",
    "quantity": 6,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 12,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Conditionnement: 20 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: FD0000000-LLF12 | Fournisseur: Aestetic group | Prix: 46 | Prix unitaire: 2,3 | Lien: https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/525-raccord-d-emulsion-de-graisse-fll-o-24mm-x20.html"
  },
  {
    "id": "itm-CSV-0006",
    "name": "biocoating flask ula",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 6,
    "location": "Culture L1",
    "tags": [
      "Coating ULA"
    ],
    "notes": "Conditionnement: 60ml | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: F202005 | Fournisseur: faCellitate | Prix: 60 | Prix unitaire: 1e/ml | Lien: faCellitate – BIOFLOAT™ FLEX coating solution [F202005] for 3D cell culture | Délais livraison: 10 jours"
  },
  {
    "id": "itm-CSV-0007",
    "name": "T25 Flask non traitée future ULA",
    "category": "Procédé ExAdEx L2",
    "quantity": 0.5,
    "unit": "flacons",
    "minStock": 1,
    "maxStock": 2,
    "location": "Bureau",
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "Conditionnement: 200 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: CNA6-1 | Fournisseur: Roth/greiner bio | Prix: 116 | Prix unitaire: 0,58"
  },
  {
    "id": "itm-CSV-0008",
    "name": "Plaque Corning 6 puits ULA",
    "category": "Procédé ExAdEx L2",
    "quantity": 5.5,
    "unit": "plaques",
    "minStock": 1,
    "maxStock": 11,
    "location": "Bureau",
    "tags": [
      "Plaque 6 ula"
    ],
    "notes": "Conditionnement: 24 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 3471 | Fournisseur: Dutscher | Prix: 339 | Lien: https://www.dutscher.com/article/003471"
  },
  {
    "id": "itm-CSV-0009",
    "name": "ACL -eBioscience™ 10X RBC Lysis Buffer (Multi-species) 50 ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 4,
    "location": "Frigo labo",
    "tags": [
      "ACL"
    ],
    "notes": "Conditionnement: 50mL | Notes référence: NA71 : Sérum et autre milieu pour culture cellulaire animale | Référence: 00-4300-54 | Fournisseur: ThermoFischer | Prix: 62 | Lien: https://www.thermofisher.com/order/catalog/product/00-4300-54?SID=srch-srp-00-4300-54"
  },
  {
    "id": "itm-CSV-0010",
    "name": "Pour milieu + PBS ? Chercher REF",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Laboratoire",
    "tags": [
      "Antibiotique"
    ],
    "notes": ""
  },
  {
    "id": "itm-CSV-0011",
    "name": "Amphotericin B solution",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "Chambre froide",
    "tags": [
      "Antifongique"
    ],
    "notes": "Conditionnement: 50mg | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: 0,28 | Fournisseur: Sigma | Prix: 287 | Prix unitaire: 5,75 | Lien: https://www.sigmaaldrich.com/FR/fr/substance/amphotericinbsolution924081397893"
  },
  {
    "id": "itm-CSV-0012",
    "name": "Gibco™ Gentamicine (50 mg/ml)",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 4,
    "location": "Culture",
    "tags": [
      "Antibiotique"
    ],
    "notes": "Conditionnement: 20ml | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: 11520506 | Fournisseur: thermofischer | Prix: 220 | Prix unitaire: 11 | Lien: https://www.fishersci.fr/shop/products/gentamicin-50-mg-ml-4/11520506"
  },
  {
    "id": "itm-CSV-0013",
    "name": "0,5",
    "category": "Procédé ExAdEx L2",
    "quantity": 0.5,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "Culture L2",
    "tags": [
      "Antibiotique"
    ],
    "notes": "Conditionnement: 10ml | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: 15710064 | Fournisseur: Life tech | Prix: 16,11 | Prix unitaire: 1,5"
  },
  {
    "id": "itm-CSV-0014",
    "name": "Amphotéricine B, MP Biomedicals",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Antifongique"
    ],
    "notes": "Conditionnement: 100mg | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: 17660917 | Fournisseur: fischer | Prix: 90,9 | Lien: https://www.fishersci.fr/shop/products/amphotericin-b-mp-biomedicals-5/17660917?change_lang=true"
  },
  {
    "id": "itm-CSV-0015",
    "name": "Invivogen FUNGIN 75 MG (10 MG/ML)",
    "category": "Procédé ExAdEx L2",
    "quantity": 1.5,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 3,
    "location": "-20°C blanc labo",
    "tags": [
      "Antifongique"
    ],
    "notes": "Conditionnement: 75mg | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: ant-fn-1 | Fournisseur: invivogen | Prix: 148 | Lien: https://www.fishersci.com/shop/products/fungin-75-mg-10-mg-ml/NC9326704"
  },
  {
    "id": "itm-CSV-0016",
    "name": "Caspofongin Diacetate",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "Culture L1",
    "tags": [
      "Antifongique"
    ],
    "notes": "Conditionnement: 5mg | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: SML0425-5MG | Fournisseur: Merck | Prix: 112 | Lien: https://www.sigmaaldrich.com/FR/fr/substance/caspofungindiacetate121342179463173"
  },
  {
    "id": "itm-CSV-0017",
    "name": "Primocin",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 8,
    "location": "-20°C blanc labo",
    "tags": [
      "Antibiotique"
    ],
    "notes": "Conditionnement: 250mg | Notes référence: NA76 Antibiotiques Pour Culture Cellulaire | Référence: ant-pm-05 | Fournisseur: invivogen | Prix: 119 | Lien: https://www.invivogen.com/primocin"
  },
  {
    "id": "itm-CSV-0018",
    "name": "Endothelial Cell Growth Medium 2",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 8,
    "location": "Culture",
    "tags": [
      "Milieu EGM"
    ],
    "notes": "Conditionnement: 500ml | Notes référence: NA71 : Sérum et autre milieu pour culture cellulaire animale | Référence: C-22011 | Fournisseur: Promocell | Prix: 153,85 | Lien: https://promocell.com/product/endothelial-cell-growth-medium-2/ | Délais livraison: 15 jours"
  },
  {
    "id": "itm-CSV-0019",
    "name": "SupplementMix / Endothelial Cell Growth Medium 2",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 8,
    "location": "Culture",
    "tags": [
      "Milieu EGM"
    ],
    "notes": "Conditionnement: 500ml | Notes référence: NA71 : Sérum et autre milieu pour culture cellulaire animale | Référence: C-39216 | Fournisseur: Promocell | Prix: 50,85 | Prix unitaire: 2 | Lien: https://promocell.com/product/endothelial-cell-growth-medium-2/ | Délais livraison: 15 jours"
  },
  {
    "id": "itm-CSV-0020",
    "name": "BD luer lock caps",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: BD 408531 | Fournisseur: termofischer | Prix: 130 | Prix unitaire: 2,6 | Lien: https://www.fishersci.com/shop/products/bd-luer-lok-caps/1482331"
  },
  {
    "id": "itm-CSV-0021",
    "name": "BD Luer-Lok™ cap with membrane latex-free",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 394074 | Prix: 34 | Prix unitaire: 0,34 | Lien: https://www.dutscher.com/article/394074"
  },
  {
    "id": "itm-CSV-0022",
    "name": "Bouchon ler lock st",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 200 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 394080 | Fournisseur: ThermoFischer | Prix: 50 | Prix unitaire: 0,25 | Lien: https://www.fishersci.fr/shop/products/x200-bouchons-luer-lock-st/16654462#?keyword=394080"
  },
  {
    "id": "itm-CSV-0023",
    "name": "Bouchon Luer Lock (MC1711)",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Prix: 77 | Prix unitaire: 0,77 | Lien: https://www.aestheticgroup.fr/en/caps/125-luer-lock-cap-mc1711.html?search_query=FD0001711-MC&results=1"
  },
  {
    "id": "itm-CSV-0024",
    "name": "bouchon seringue violet Enfit 20 ml *300",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "mL",
    "minStock": 2,
    "maxStock": 4,
    "location": "Bureau",
    "tags": [
      "Bouchon"
    ],
    "notes": "Conditionnement: 200 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: EF000 | Fournisseur: Bexen medical | Prix: 25 | Prix unitaire: 0,125 | Lien: https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit"
  },
  {
    "id": "itm-CSV-0025",
    "name": "sdv",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "celldisc"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 678101 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON | Lien: https://shop.gbo.com/fr/france/products/bioscience/mass-cell-culture/bs-celldisc/celldisc-tc-und-advanced-tc/678101.html?sword_list%5B0%5D=678101&no_cache=1&_ga=2.265742541.314801138.1677662655-627813974.1674230259"
  },
  {
    "id": "itm-CSV-0026",
    "name": "CELLDISC, 4 LAYER, 1000 CM², PS, CLEAR, TC, STANDARD SCREW CAP RED, STERILE",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "celldisc"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 678104 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON"
  },
  {
    "id": "itm-CSV-0027",
    "name": "Blouse jetable X30 IC 270B WS Labcoat LG (Sterile­only, Double bag)",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Blouse"
    ],
    "notes": "Conditionnement: 30 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Fournisseur: Fisher scientific | Prix: 198"
  },
  {
    "id": "itm-CSV-0028",
    "name": "Blouse jetable ENDO protectlab taille XL",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Culture",
    "tags": [
      "Blouse"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Prix unitaire: 0 | Lien: https://www.labotienda.com/fr/produits-laboratoire/blouse-jetable-taille-xl-blanche-1-pc/"
  },
  {
    "id": "itm-CSV-0029",
    "name": "CELL CULTURE FLASK, 250 ML, 75 CM², PS, CLEAR, CELLSTAR®, CELL-REPELLENT SURFACE, WHITE FILTER SCREW CAP",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Flask cell repelent"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 658985 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON | Lien: https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/flacons-surface-cell-repellent/658985.html?sword_list%5B0%5D=658985&no_cache=1&_ga=2.197454317.314801138.1677662655-627813974.1674230259"
  },
  {
    "id": "itm-CSV-0030",
    "name": "Flacon pour culture en suspension, 250ml, PS,bch vissant avec filtre blanc, transparent, CELLSTAR",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "flacons",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: réf 658195 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON | Lien: https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/flacons-cellstar/flacons-pour-culture-en-suspension/658195.html?sword_list%5B0%5D=658195&no_cache=1&_ga=2.268338764.314801138.1677662655-627813974.1674230259"
  },
  {
    "id": "itm-CSV-0031",
    "name": "Plaque multi puits culture suspension, 24 puits",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 662102 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON | Lien: https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/plaques-multi-puits-cellstar/657185.html?sword_list%5B0%5D=657185&no_cache=1&_ga=2.261006799.314801138.1677662655-627813974.1674230259"
  },
  {
    "id": "itm-CSV-0032",
    "name": "Plaque multi puits culture suspension, 6 puits",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 657185 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON"
  },
  {
    "id": "itm-CSV-0033",
    "name": "T 25 cm²FLACON DE CULTURE ULA COL u INCLINÉ BOUCHON VENTILÉ STÉRILE.",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "flacons",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "Conditionnement: 25 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 004616B | Fournisseur: Dutscher | Prix: 300 | Prix unitaire: 12 | Lien: https://www.dutscher.com/article/004616B"
  },
  {
    "id": "itm-CSV-0034",
    "name": "T25cm FLACON DE CULTURE ULA VENTILE STERILE x5x2",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "flacons",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "Conditionnement: 10 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 330193 | Prix: 120 | Prix unitaire: 12"
  },
  {
    "id": "itm-CSV-0035",
    "name": "T25cm FLACON DE CULTURE ULA RECTANGLE COL INCLINE BOUCHON VENTILE STERILE x5x5",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "flacons",
    "minStock": 0.5,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "Conditionnement: 25 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 4616+ | Fournisseur: Dutscher | Prix: 64,25 | Prix unitaire: 2,57 | Lien: https://www.carlroth.com/fr/fr/bouteilles-assiettes-plats-pour-culture-cellulaire/flacons-pour-culture-suspension-cellstar-bouchon-a-vis-avec-filtre/p/cna6.1"
  },
  {
    "id": "itm-CSV-0036",
    "name": "T 75cm²FLACON DE CULTURE ULA COL INCLINÉ u BOUCHON VENTILÉ STÉRILE. x6 x4",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "flacons",
    "minStock": 1,
    "maxStock": 2,
    "location": "Bureau",
    "tags": [
      "Flask ULA T75"
    ],
    "notes": "Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 174951 | Fournisseur: ThermoFischer | Prix unitaire: #DIV/0!"
  },
  {
    "id": "itm-CSV-0037",
    "name": "Plaque 24 puits, Repellent, avec LID, stérile",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Plaque 24 ula"
    ],
    "notes": "Conditionnement: ECHANTILLON | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 662970 | Fournisseur: Greiner bio | Prix: ECHANTILLON | Prix unitaire: ECHANTILLON | Lien: https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/microplaques-surface-cell-repellent/657970.html?sword_list%5B0%5D=657970&no_cache=1&_ga=2.29147902.314801138.1677662655-627813974.1674230259"
  },
  {
    "id": "itm-CSV-0038",
    "name": "3 voie seuls",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Robinet"
    ],
    "notes": "Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 92831"
  },
  {
    "id": "itm-CSV-0039",
    "name": "3 voies seuls, rotation 360° (boite de 100)",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Robinet"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 70334 ou 92831 | Fournisseur: distrimed | Prix: 50 | Prix unitaire: 0,5 | Lien: https://www.distrimed.com/product_info.php?products_id=8067"
  },
  {
    "id": "itm-CSV-0040",
    "name": "Robinet Blanc 3 voies BD Connecta - Boîte de 100",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Robinet"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: ROB600 | Fournisseur: robé médical | Prix: 42 | Prix unitaire: 0,42 | Lien: https://www.robe-materiel-medical.com/Robinet-3-voies-BD-Connecta-ROB600-materiel-medical.htm"
  },
  {
    "id": "itm-CSV-0041",
    "name": "Robinet 3 voies luer lock",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 4,
    "maxStock": 8,
    "location": "Réserve",
    "tags": [
      "Robinet luer"
    ],
    "notes": "Conditionnement: 300 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 1104,19 | Fournisseur: bexen medical | Prix: 55 | Prix unitaire: 0,183333333 | Lien: https://www.bexenmedical.com/fr/materiel-medical/robinet-luer-lock | Délais livraison: rapide"
  },
  {
    "id": "itm-CSV-0042",
    "name": "Seringue 1ml soft jet",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 3,
    "maxStock": 6,
    "location": "Laboratoire",
    "tags": [
      "Seringue"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 5010 | Fournisseur: Honke sass Wolf | Prix: 125 | Prix unitaire: 1,25 | Lien: https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249"
  },
  {
    "id": "itm-CSV-0043",
    "name": "Seringue non luer lock",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Seringue"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Fournisseur: Dutscher | Prix: 11 | Prix unitaire: 0,22 | Lien: https://www.dutscher.com/article/050833"
  },
  {
    "id": "itm-CSV-0044",
    "name": "Seringue 10ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "tags": [
      "Seringue 10 ml"
    ],
    "notes": "Conditionnement: 10 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 5100-000V0 | Fournisseur: Honke sass Wolf | Prix: 125 | Prix unitaire: 12,5 | Lien: https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249"
  },
  {
    "id": "itm-CSV-0045",
    "name": "Seringue 10ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "seringues",
    "minStock": 2,
    "maxStock": 6,
    "location": "Culture",
    "tags": [
      "Seringue"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 50008 | Fournisseur: Terumo | Prix: 30 | Prix unitaire: 0,3"
  },
  {
    "id": "itm-CSV-0046",
    "name": "Seringue 100ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "tags": [
      "Seringue 100ml"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: SS+01EH1 | Fournisseur: Terumo | Prix: 34,7 | Prix unitaire: 0,347 | Lien: https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB"
  },
  {
    "id": "itm-CSV-0047",
    "name": "Seringue BD 3P 20 ml Cone luer Lock",
    "category": "Procédé ExAdEx L2",
    "quantity": 2.5,
    "unit": "mL",
    "minStock": 3,
    "maxStock": 6,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 120 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 300629 | Fournisseur: Aestetic group | Prix: 70 | Prix unitaire: 0,583333333 | Lien: https://www.aestheticgroup.fr/fr/recherche?controller=search&orderby=position&orderway=desc&search_query=300629&submit_search="
  },
  {
    "id": "itm-CSV-0048",
    "name": "SERINGUE BD PLASTIPAK 3 PCS 20ml LUER LOCK STERILE GAMMA x192",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 3,
    "maxStock": 6,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 192 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 302830 | Fournisseur: Dutscher | Prix: 121 | Prix unitaire: 0,630208333 | Lien: https://www.dutscher.com/article/302830 | Délais livraison: 1 mois"
  },
  {
    "id": "itm-CSV-0049",
    "name": "Seringue Enfit 20 ml Luer lock",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "mL",
    "minStock": 8,
    "maxStock": 16,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 300 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: EF020 | Fournisseur: Bexen medical | Prix: 75 | Prix unitaire: 0,25 | Lien: https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit"
  },
  {
    "id": "itm-CSV-0050",
    "name": "Seringues 3 pièces luer lock 20 ml / bte de 50",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 120 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: SLL20 | Fournisseur: robé médical | Prix: 60,47 | Prix unitaire: 0,503916667 | Lien: https://www.robe-materiel-medical.com/Seringues-3-pieces-NIPRO-Luer-Lock-Boite-de-100-SLL20-materiel-medical.htm"
  },
  {
    "id": "itm-CSV-0051",
    "name": "Seringue luer lock 50 mL",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 25 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 15349067 | Fournisseur: ThermoFischer | Prix: 30 | Prix unitaire: 0 | Lien: https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB"
  },
  {
    "id": "itm-CSV-0052",
    "name": "Seringues 3 pièces Luer Lock Euromedis*50",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "Conditionnement: 10 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 12713MED / 90357MED | Fournisseur: materiel medical | Prix: 50 | Prix unitaire: 5 | Lien: https://www.materielmedical.fr/4727-seringues-3-pieces-luer-lock-euromedis.html"
  },
  {
    "id": "itm-CSV-0053",
    "name": "Filtre - tamis cellulaire Pluristrainer. Porosité 60",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 25 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 149195 | Fournisseur: Dutscher | Prix: 180 | Prix unitaire: 7,2 | Lien: https://www.dutscher.com/article/149195"
  },
  {
    "id": "itm-CSV-0054",
    "name": "filtre 0,22 13mm",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 257240 | Fournisseur: dutscher | Prix: 40 | Prix unitaire: 0,8"
  },
  {
    "id": "itm-CSV-0055",
    "name": "filtre 0,22 33mm",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 6,
    "location": "Culture L1",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 257160 | Fournisseur: dutscher | Prix: 40 | Prix unitaire: 0,8"
  },
  {
    "id": "itm-CSV-0056",
    "name": "filtre 0,45",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Fournisseur: starstedt | Prix: 180 | Lien: UGAP"
  },
  {
    "id": "itm-CSV-0057",
    "name": "Tamis 100",
    "category": "Procédé ExAdEx L2",
    "quantity": 0.5,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 352360 | Fournisseur: servilab | Prix: 100*"
  },
  {
    "id": "itm-CSV-0058",
    "name": "Tamis 70",
    "category": "Procédé ExAdEx L2",
    "quantity": 0.5,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Réserve",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 352350 | Fournisseur: servilab | Prix: 100*"
  },
  {
    "id": "itm-CSV-0059",
    "name": "Tamis 40",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Laboratoire",
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement: 50 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: 352340 | Fournisseur: servilab | Prix: 100*"
  },
  {
    "id": "itm-CSV-0060",
    "name": "Filtre, non stérile, 60 mm Ø, 0,45 µm",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "tags": [
      "Filtre"
    ],
    "notes": "Conditionnement: 1 | Notes référence: VA.03 | Référence: 391-2093 | Fournisseur: vwr | Prix: 20"
  },
  {
    "id": "itm-CSV-0061",
    "name": "REDUCTEUR SU 1.2MM",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Conditionnement: 24 | Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: CGTU DAT4L1.2MM | Fournisseur: Benewmedical | Prix unitaire: 0"
  },
  {
    "id": "itm-CSV-0062",
    "name": "REDUCTEUR SU 1.4MMref",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: CGTU DAT4L1.4MM | Fournisseur: Benewmedical"
  },
  {
    "id": "itm-CSV-0063",
    "name": "REDUCTEUR SU 2.4MM ref",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Bureau",
    "tags": [
      "Tulipe"
    ],
    "notes": "Notes référence: NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques | Référence: CGTU DAT4L2.4MM | Fournisseur: Benewmedical"
  },
  {
    "id": "itm-CSV-0064",
    "name": "pen/strep stock",
    "category": "Procédé ExAdEx L2",
    "quantity": 6,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 12,
    "location": "Laboratoire",
    "tags": [
      "Antibiotique"
    ],
    "notes": "Conditionnement: 100Ml | Référence: 15140122 | Fournisseur: thermofischer | Prix: 10 | Prix unitaire: 0,1 | Lien: https://www.thermofisher.com/order/catalog/product/15140122?SKULINK | Délais livraison: 1mois"
  },
  {
    "id": "itm-CSV-0065",
    "name": "Lame chirurgicale n° 23 pour bistouri",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 6,
    "location": "Culture L1",
    "tags": [
      "lame chirurgicale"
    ],
    "notes": "Conditionnement: 100 | Notes référence: NB.16 / 90189084 | Référence: 764315 | Fournisseur: Dutscher"
  },
  {
    "id": "itm-CSV-0066",
    "name": "Gants L2 - taille L",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Laboratoire",
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "Notes référence: HA.01"
  },
  {
    "id": "itm-CSV-0067",
    "name": "Gants L2 - taille M",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Laboratoire",
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "Notes référence: HA.01"
  },
  {
    "id": "itm-CSV-0068",
    "name": "Gants L2 - S",
    "category": "Procédé ExAdEx L2",
    "quantity": 6,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 12,
    "location": "Laboratoire",
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "Conditionnement: 150 | Notes référence: HA.01 | Référence: 065745B | Fournisseur: Dutscher | Prix: 16,47"
  },
  {
    "id": "itm-CSV-0069",
    "name": "Gants L2 - XS",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 8,
    "location": "Laboratoire",
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "Conditionnement: 150 | Notes référence: HA.01 | Référence: 065744B | Fournisseur: Dutscher | Prix: 16,47"
  },
  {
    "id": "itm-CSV-0070",
    "name": "Gants - taille XS",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 6,
    "location": "Laboratoire",
    "tags": [
      "Gants bleus"
    ],
    "notes": "Conditionnement: 100 | Notes référence: HA.01 | Référence: 65927 | Fournisseur: Dutscher | Prix: 4,3"
  },
  {
    "id": "itm-CSV-0071",
    "name": "Gants - taille S",
    "category": "Procédé ExAdEx L2",
    "quantity": 6,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 12,
    "location": "Laboratoire",
    "tags": [
      "Gants bleus"
    ],
    "notes": "Conditionnement: 100 | Notes référence: HA.01 | Référence: 65928 | Fournisseur: Dutscher | Prix: 5,8"
  },
  {
    "id": "itm-CSV-0072",
    "name": "Gants - taille M",
    "category": "Procédé ExAdEx L2",
    "quantity": 5,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 10,
    "location": "Laboratoire",
    "tags": [
      "Gants bleus"
    ],
    "notes": "Conditionnement: 100 | Notes référence: HA.01 | Fournisseur: Dutscher"
  },
  {
    "id": "itm-CSV-0073",
    "name": "Gants - taille L",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 8,
    "location": "Laboratoire",
    "tags": [
      "Gants bleus"
    ],
    "notes": "Conditionnement: 100 | Notes référence: HA.01 | Fournisseur: Dutscher"
  },
  {
    "id": "itm-CSV-0074",
    "name": "Gants orange S",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Laboratoire",
    "tags": [
      "Gants oranges"
    ],
    "notes": "Conditionnement: 50 | Notes référence: HA.01 | Référence: 65706 | Fournisseur: Dutscher | Prix: 24,3"
  },
  {
    "id": "itm-CSV-0075",
    "name": "DMSO",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 4,
    "location": "Culture L1",
    "tags": [
      "Congelation"
    ],
    "notes": "Conditionnement: 500mL | Référence: D4540 | Fournisseur: Merck Sigma | Prix: 120"
  }
]

const seedSamples = [
  ["PAT-AX41", "Abdominal", "2026-05-12", "Hypoxie 1% O2", "RNA-seq", "LN2 / Canister 2 / Box 17"],
  ["PAT-NQ08", "Facial", "2026-05-03", "Temoin ex vivo 24h", "Histologie", "Freezer -80C / Box H-03"],
  ["PAT-KL77", "Abdominal", "2026-04-28", "IL-6 10 ng/mL", "ELISA", "Freezer -80C / Box C-11"],
  ["PAT-VM19", "Facial", "2026-04-19", "Insuline 100 nM", "qPCR", "LN2 / Canister 1 / Box 08"],
  ["PAT-TB52", "Abdominal", "2026-04-15", "Differenciation J7", "Immunofluorescence", "Freezer -20C / Slides S-02"]
];

const defaultOrders = [
  {
    id: "ord-001",
    itemName: "Kit ELISA Adiponectine",
    quantity: "2 kits",
    priority: "critique",
    supplier: "R&D Systems",
    notes: "Necessaire pour serie secretion adipokines.",
    requestedBy: "ML",
    createdAt: "2026-05-18 17:35"
  },
  {
    id: "ord-002",
    itemName: "Collagenase type I",
    quantity: "6 flacons",
    priority: "tres urgent",
    supplier: "Worthington",
    notes: "Stock sous seuil minimum.",
    requestedBy: "CB",
    createdAt: "2026-05-19 09:12"
  },
  {
    id: "ord-003",
    itemName: "Cryotubes 2 mL steriles",
    quantity: "1 carton",
    priority: "pas urgent",
    supplier: "Corning",
    notes: "Reassort pour cryostock.",
    requestedBy: "IR",
    createdAt: "2026-05-15 10:04"
  }
];

const protocolTemplates = [
  {
    id: "tpl-rtqpcr",
    name: "RT-qPCR",
    protocol: "RT-qPCR",
    notes: "Preparation gene expression: extraction, reverse transcription et mix qPCR.",
    items: [
      { itemId: "itm-004", name: "Primer PPARG humain", perConditionQuantity: 1, unit: "tubes", notes: "Forward + reverse par condition" },
      { itemId: "itm-008", name: "Cryotubes 2 mL steriles", perConditionQuantity: 2, unit: "tubes", notes: "Aliquotage RNA/cDNA" }
    ]
  },
  {
    id: "tpl-elisa",
    name: "ELISA adipokines",
    protocol: "ELISA",
    notes: "Dosage proteique en plaques, compatible surnageants de culture.",
    items: [
      { itemId: "itm-007", name: "Kit ELISA Adiponectine", perConditionQuantity: 0.08, unit: "kit", notes: "Plaque et standards inclus" },
      { itemId: "itm-008", name: "Cryotubes 2 mL steriles", perConditionQuantity: 1, unit: "tubes", notes: "Stockage surnageants" }
    ]
  },
  {
    id: "tpl-lipolyse",
    name: "Lipolyse",
    protocol: "Lipolyse",
    notes: "Stimulation metabolique et collecte du milieu.",
    items: [
      { itemId: "itm-002", name: "DMEM/F12 + GlutaMAX", perConditionQuantity: 500, unit: "uL", notes: "Milieu par condition" },
      { itemId: "itm-005", name: "Insuline humaine recombinante", perConditionQuantity: 0.02, unit: "flacon", notes: "Stimulation" }
    ]
  },
  {
    id: "tpl-glucose",
    name: "Glucose uptake",
    protocol: "Glucose uptake",
    notes: "Mesure d'absorption du glucose sur adipocytes/explants.",
    items: [
      { itemId: "itm-002", name: "DMEM/F12 + GlutaMAX", perConditionQuantity: 500, unit: "uL", notes: "Milieu par condition" },
      { itemId: "itm-006", name: "Plaques 24 puits low attachment", perConditionQuantity: 0.05, unit: "plaques", notes: "Puits experimentaux" }
    ]
  },
  {
    id: "tpl-imagerie",
    name: "Imagerie",
    protocol: "Imagerie",
    notes: "Preparation echantillons et immunofluorescence.",
    items: [
      { itemId: "itm-003", name: "Anti-Perilipin A", perConditionQuantity: 3, unit: "uL", notes: "Anticorps primaire" },
      { itemId: "itm-006", name: "Plaques 24 puits low attachment", perConditionQuantity: 0.05, unit: "plaques", notes: "Culture/imagerie" }
    ]
  }
];

const defaultExperiments = [
  {
    id: "exp-001",
    name: "Adiponectine secretion pilot",
    templateId: "tpl-elisa",
    templateName: "ELISA adipokines",
    conditions: 4,
    replicates: 3,
    status: "draft",
    notes: "Premiere version a ajuster selon volume surnageants.",
    createdBy: "Caroline",
    updatedAt: "2026-05-19 16:20",
    items: protocolTemplates[1].items.map(templateItem => ({
      ...templateItem,
      quantity: Number((templateItem.perConditionQuantity * 12).toFixed(3))
    }))
  }
];

const defaultHistory = [
  { date: "Aujourd'hui 09:12", user: "Caroline", action: "Stock ajusté", detail: "Collagenase type I passée à 2 flacons." },
  { date: "Hier 17:35", user: "Marie", action: "Demande de commande", detail: "Kit ELISA Adiponectine ajouté à la liste À commander." },
  { date: "2026-05-16", user: "Ines", action: "Note modifiée", detail: "Anti-Perilipin A: dilution de travail confirmée." }
];

const storedItems = migrateItems(load("exadex_items", load("adipovault_items", [])));
const baseItems = migrateItems(seedItems);

let items = mergeItems(baseItems, storedItems);
let orders = load("exadex_orders", defaultOrders);
let experiments = migrateExperiments(load("exadex_experiments", defaultExperiments));
let history = load("exadex_history", load("adipovault_history", defaultHistory));
let statusFilter = "all";
let activeView = "inventory";
let currentName = "Caroline";
let alertsExpanded = false;
let selectedLocation = null;
let selectedExperimentId = null;
let selectedItemId = null;
let itemReturnContext = { view: "inventory", experimentId: null, location: null };

const auth = document.querySelector("#auth");
const app = document.querySelector("#app");
const loginForm = document.querySelector("#loginForm");
const nameInput = document.querySelector("#nameInput");
const currentUser = document.querySelector("#currentUser");
const currentUserName = document.querySelector("#currentUserName");
const sidebarUser = document.querySelector("#sidebarUser");
const sidebarUserName = document.querySelector("#sidebarUserName");
const searchInput = document.querySelector("#searchInput");
const controlBar = document.querySelector(".control-bar");
const categoryFilter = document.querySelector("#categoryFilter");
const experimentSearchInput = document.querySelector("#experimentSearchInput");
const experimentStatusFilter = document.querySelector("#experimentStatusFilter");
const dialog = document.querySelector("#itemDialog");
const form = document.querySelector("#itemForm");
const stockDialog = document.querySelector("#stockDialog");
const stockForm = document.querySelector("#stockForm");
const experimentDialog = document.querySelector("#experimentDialog");
const experimentForm = document.querySelector("#experimentForm");
const experimentItemsList = document.querySelector("#experimentItemsList");
const orderDialog = document.querySelector("#orderDialog");
const orderForm = document.querySelector("#orderForm");
const secondaryReferencesList = document.querySelector("#secondaryReferencesList");
const addSecondaryReferenceBtn = document.querySelector("#addSecondaryReferenceBtn");
const locationDropdown = document.querySelector("#locationDropdown");
const locationTrigger = document.querySelector("#locationTrigger");
const locationTriggerText = document.querySelector("#locationTriggerText");
const locationMenu = document.querySelector("#locationMenu");

const fields = [
  "itemId",
  "name",
  "category",
  "quantity",
  "unit",
  "minStock",
  "maxStock",
  "location",
  "tags",
  "notes",
  "primarySupplier",
  "primaryReference",
  "primaryLink",
  "primaryReferenceNotes",
  "primaryPrice",
  "primaryUnitPrice",
  "primaryLeadTime"
].reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const stockFields = ["stockItemId", "stockItemName", "stockCurrentQuantity", "stockTitle", "stockAction", "stockAmount", "stockUnit", "stockNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const experimentFields = ["experimentId", "experimentTemplate", "experimentName", "experimentConditions", "experimentReplicates", "experimentStatus", "experimentTotalConditions", "experimentNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

const orderFields = ["orderItemName", "orderQuantity", "orderPriority", "orderSupplier", "orderNotes"]
  .reduce((acc, id) => ({ ...acc, [id]: document.querySelector(`#${id}`) }), {});

renderCategoryOptions();
renderLocationOptions();
renderTemplateOptions();

// animacion de inicio
const loginLoader = document.querySelector("#loginLoader");
const authPanel = document.querySelector(".auth-panel");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentName = nameInput.value.trim();
  if (!currentName) return;

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  updateUserIdentity();

  authPanel?.classList.add("is-loading");
  loginLoader.classList.add("is-visible");

  setTimeout(() => {
    auth.classList.add("hidden");
    app.classList.remove("hidden");
    persist();
    render();

    loginLoader.classList.remove("is-visible");
    authPanel?.classList.remove("is-loading");
    submitBtn.disabled = false;
  }, 3000);
});

document.querySelector("#logoutBtn").addEventListener("click", () => {
  persist();
  app.classList.add("hidden");
  auth.classList.remove("hidden");
});

document.querySelector("#addItemBtn").addEventListener("click", () => openModal());
document.querySelector("#saveItemBtn").addEventListener("click", saveItem);
document.querySelector("#deleteItemBtn").addEventListener("click", deleteItem);
document.querySelector("#saveStockBtn").addEventListener("click", saveStockUpdate);
document.querySelector("#addExperimentBtn").addEventListener("click", () => openExperimentModal());
document.querySelector("#saveExperimentBtn").addEventListener("click", saveExperiment);
document.querySelector("#addExperimentItemBtn").addEventListener("click", () => addExperimentItemRow());
addSecondaryReferenceBtn.addEventListener("click", () => addSecondaryReferenceRow());
document.querySelector("#addOrderBtn").addEventListener("click", openOrderModal);
document.querySelector("#saveOrderBtn").addEventListener("click", saveOrder);
document.querySelector("#closeOrderDialogBtn").addEventListener("click", () => orderDialog.close());
document.querySelector("#cancelOrderBtn").addEventListener("click", () => orderDialog.close());
searchInput.addEventListener("input", renderInventory);
categoryFilter.addEventListener("change", renderInventory);
experimentSearchInput.addEventListener("input", renderExperiments);
experimentStatusFilter.addEventListener("change", renderExperiments);
experimentDialog.addEventListener("close", () => {
  experimentFields.experimentTemplate.disabled = false;
});
experimentFields.experimentTemplate.addEventListener("change", () => buildExperimentItemsFromTemplate());
experimentFields.experimentConditions.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentFields.experimentReplicates.addEventListener("input", recalculateExperimentTemplateQuantities);
experimentItemsList.addEventListener("input", updateExperimentModalStock);
experimentItemsList.addEventListener("change", (event) => {
  if (event.target.classList.contains("experiment-item-select")) {
    hydrateExperimentItemRow(event.target.closest(".experiment-item-row"), event.target.value);
  }
  updateExperimentModalStock();
});

document.querySelectorAll(".chip").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));
    button.classList.add("active");
    statusFilter = button.dataset.status;
    renderInventory();
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;

    selectedItemId = null;
    selectedExperimentId = null;
    selectedLocation = null;
    itemReturnContext = { view: activeView, experimentId: null };

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("active");
    });

    document.querySelector(`#${activeView}View`).classList.add("active");

    controlBar.classList.toggle("hidden", activeView !== "inventory");
    app.classList.toggle("history-mode", activeView === "history");

    if (activeView === "inventory") {
      renderInventory();
    } else if (activeView === "experiments") {
      renderExperiments();
    } else if (activeView === "locations") {
      renderLocations();
    } else if (activeView === "orders") {
      renderOrders();
    } else if (activeView === "history") {
      renderHistory();
    } else if (activeView === "samples") {
      renderSamples();
    }
  });
});

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem("exadex_items", JSON.stringify(items));
  localStorage.setItem("exadex_orders", JSON.stringify(orders));
  localStorage.setItem("exadex_experiments", JSON.stringify(experiments));
  localStorage.setItem("exadex_history", JSON.stringify(history));
}

function updateUserIdentity() {
  const userIcon = userIcons[currentName] || "👤";
  currentUser.textContent = userIcon;
  sidebarUser.textContent = userIcon;
  currentUserName.textContent = currentName;
  sidebarUserName.textContent = currentName;
}

function itemStatus(item) {
  if (Number(item.quantity) <= Number(item.minStock)) return "critical";
  if (Number(item.quantity) <= Number(item.minStock) * 1.5) return "warning";
  return "ok";
}

function statusLabel(status) {
  return { ok: "En stock", warning: "Attention", critical: "Critique" }[status];
}

function statusLabelExperiment(status) {
  return { draft: "Draft", running: "Running", completed: "Completed" }[status] || status;
}

function render() {
  renderCategories();
  renderMetrics();
  renderAlerts();
  renderInventory();
  renderSamples();
  renderHistory();
  renderLocations();
  renderOrders();
  renderExperiments();
}

function renderCategories() {
  const selected = categoryFilter.value || "all";
  categoryFilter.innerHTML = `<option value="all">Toutes categories</option>${inventoryCategories.map(category => `<option>${escapeHtml(category)}</option>`).join("")}`;
  categoryFilter.value = inventoryCategories.includes(selected) ? selected : "all";
}

function renderCategoryOptions() {
  fields.category.innerHTML = inventoryCategories
    .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderLocationOptions() {
  fields.location.innerHTML = inventoryLocations
    .map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`)
    .join("");
}

function renderTemplateOptions() {
  experimentFields.experimentTemplate.innerHTML = protocolTemplates
    .map(template => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`)
    .join("");
}

function renderMetrics() {
  const counts = items.reduce((acc, item) => {
    acc[itemStatus(item)] += 1;
    return acc;
  }, { ok: 0, warning: 0, critical: 0 });
  document.querySelector("#metrics").innerHTML = [
    ["Total references", items.length, ""],
    ["Stock OK", counts.ok, "ok"],
    ["Attention", counts.warning, "warning"],
    ["Rupture / critique", counts.critical, "critical"]
  ].map(([label, value, cls]) => `
    <article class="metric-card ${cls}">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function renderAlerts() {
  const critical = items.filter(item => itemStatus(item) === "critical");
  const alertsContainer = document.querySelector("#alerts");
  const visibleAlerts = alertsExpanded ? critical : critical.slice(0, 3);
  const hiddenCount = Math.max(critical.length - 3, 0);

  if (!critical.length) {
    alertsContainer.innerHTML = "";
    return;
  }

  alertsContainer.innerHTML = `
    <div class="alerts-header-row">
      <div class="alerts-header-text">
        <strong>Alertes critiques</strong>
        <span>${critical.length} au total</span>
      </div>
      ${critical.length > 3 ? `
        <button type="button" class="alerts-toggle-btn" id="alertsToggleBtn">
          ${alertsExpanded ? "− Masquer" : `+ ${hiddenCount} alertes`}
        </button>
      ` : ""}
    </div>

    <div class="alerts-list">
      ${visibleAlerts.map(item => `
        <div class="alert">
          ⚠ ${escapeHtml(item.name)} - Rupture / critique : ${item.quantity} ${escapeHtml(item.unit)} restants / min. ${item.minStock} ${escapeHtml(item.unit)}
        </div>
      `).join("")}
    </div>
  `;

  const toggleBtn = document.querySelector("#alertsToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      alertsExpanded = !alertsExpanded;
      renderAlerts();
    });
  }
}

function renderInventory() {
  const query = normalizeSearch(searchInput.value);
  const category = categoryFilter.value;

  const filtered = items.filter((item) => {
    const referenceText = itemReferencesText(item.references);
    const haystack = normalizeSearch([
      item.name,
      ...getItemLocations(item),
      item.category,
      ...item.tags,
      referenceText
    ].join(" "));

    return (
      (!query || haystack.includes(query)) &&
      (statusFilter === "all" || itemStatus(item) === statusFilter) &&
      (category === "all" || item.category === category)
    );
  });

  document.querySelector("#resultCount").textContent =
    `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`;

  const detail = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  document.querySelector("#inventoryDetail").innerHTML = detail
    ? renderInventoryDetail(detail)
    : "";

  document.querySelector("#inventoryGrid").classList.toggle("hidden", Boolean(detail));

  document.querySelector("#inventoryGrid").innerHTML = filtered.map((item) => {
    const status = itemStatus(item);
    const percent = Math.min(100, Math.round((Number(item.quantity) / Math.max(Number(item.maxStock), 1)) * 100));

    return `
      <article class="item-card item-preview-card" onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'inventory' })">
        <div class="item-head">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
        </div>

        <span class="category">${escapeHtml(item.category)}</span>

        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>

        <div class="stock-line">
          <span>${item.quantity} ${escapeHtml(item.unit)}</span>
          <span>Max ${item.maxStock} ${escapeHtml(item.unit)}</span>
        </div>

        ${item.tags?.length ? `
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        ` : ""}

        <small>${escapeHtml(formatLocations(item))}</small>

        <div class="card-actions">
          <span></span>
          <div class="card-button-stack">
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
              onclick="event.stopPropagation(); openStockModal('${escapeHtml(item.id)}')"
            >
              Stock update
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderInventoryDetail(item) {
  const status = itemStatus(item);
  const references = normalizeReferences(item.references);
  const percent = Math.min(
    100,
    Math.round((Number(item.quantity) / Math.max(Number(item.maxStock), 1)) * 100)
  );

  return `
    <section class="inventory-detail-panel">
      <div class="detail-topline">
        <button
          class="room-exit-btn"
          type="button"
          onclick="returnFromItemDetail()"
          aria-label="Retour"
          title="Retour"
        >
          ↩️
        </button>

        <div class="detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openModal('${escapeHtml(item.id)}')">
            Modifier
          </button>
          <button class="primary-btn compact-btn" type="button" onclick="openStockModal('${escapeHtml(item.id)}')">
            Stock update
          </button>
        </div>
      </div>

      <div class="experiment-detail-head">
        <div>
          <span class="badge ${status}">${escapeHtml(statusLabel(status))}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.category)} - ${escapeHtml(formatLocations(item))}</p>
        </div>

        <small>ID: ${escapeHtml(item.id)}</small>
      </div>

      <div class="stock-summary">
        <strong>${item.quantity} ${escapeHtml(item.unit)}</strong>
        <span>Minimum: ${item.minStock} ${escapeHtml(item.unit)}</span>
        <span>Maximum: ${item.maxStock} ${escapeHtml(item.unit)}</span>
        <div class="bar">
          <span class="${status}" style="width:${percent}%"></span>
        </div>
      </div>

      ${item.tags?.length ? `
        <div>
          <h4>Tags</h4>
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      ${item.protocol ? `
        <div>
          <h4>Protocole</h4>
          <p>${escapeHtml(item.protocol)}</p>
        </div>
      ` : ""}

      ${item.notes ? `
        <div>
          <h4>Notes</h4>
          <p>${escapeHtml(item.notes)}</p>
        </div>
      ` : ""}

      <div>
        <h4>Références</h4>

        ${
          references.primary.supplier ||
          references.primary.reference ||
          references.primary.link ||
          references.primary.notes ||
          references.primary.price ||
          references.primary.unitPrice ||
          references.primary.leadTime
            ? `
              <div class="reference-block">
                <strong>Référence principale</strong>

                <div class="item-detail-stack">
                  ${renderDetailRow("Fournisseur", references.primary.supplier)}
                  ${renderDetailRow("Référence", references.primary.reference)}

                  ${references.primary.link ? `
                    <div class="item-detail-row">
                      <span class="item-detail-label">Lien</span>
                      <div class="item-detail-value">
                        <a href="${escapeHtml(references.primary.link)}" target="_blank" rel="noopener noreferrer">
                          ${escapeHtml(references.primary.link)}
                        </a>
                      </div>
                    </div>
                  ` : ""}

                  ${renderDetailRow("Notes", references.primary.notes)}
                  ${renderDetailRow("Prix", references.primary.price)}
                  ${renderDetailRow("Prix unitaire", references.primary.unitPrice)}
                  ${renderDetailRow("Délais de livraison", references.primary.leadTime)}
                </div>
              </div>
            `
            : "<p>Aucune référence principale.</p>"
        }

        ${
          references.secondary.length
            ? `
              <div class="secondary-references">
                ${references.secondary.map((reference, index) => `
                  <div class="reference-block">
                    <strong>Référence secondaire ${index + 1}</strong>
                    <div class="item-detail-stack">
                      ${renderDetailRow("Référence", reference.reference)}
                      ${renderDetailRow("Notes", reference.notes)}
                    </div>
                  </div>
                `).join("")}
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function renderSamples() {
  document.querySelector("#sampleRows").innerHTML = seedSamples.map(sample => `
    <tr>${sample.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>
  `).join("");
}

function renderHistory() {
  document.querySelector("#historyList").innerHTML = history.filter(entry => !["Connexion", "Deconnexion"].includes(entry.action)).map(entry => {
    const action = entry.action === "Item supprime" ? "Item supprimé" : entry.action;
    const detail = entry.detail.replace(" a supprime ", " a supprimé ");
    return `
    <article class="history-entry">
      <div class="history-meta">
        <time>${escapeHtml(entry.date)}</time>
        <span class="history-user"><span>${userIcons[entry.user] || "👤"}</span>${escapeHtml(entry.user)}</span>
      </div>
      <div><strong>${escapeHtml(action)}</strong><br><span>${escapeHtml(detail)}</span></div>
    </article>
  `;
  }).join("");
}

function renderLocations() {
  const groups = items.reduce((acc, item) => {
    const places = getItemLocations(item);

    places.forEach(place => {
      if (!acc[place]) acc[place] = [];
      acc[place].push(item);
    });

    return acc;
  }, {});

  const locationGrid = document.querySelector("#locationGrid");

  if (selectedLocation) {
    const group = groups[selectedLocation] || [];
    locationGrid.innerHTML = `
      <div class="location-room">
        <div class="location-room-header">
          <button class="room-exit-btn" id="backToLocationsBtn" type="button" aria-label="Retour aux salles" title="Retour aux salles">↩️</button>
          <div>
            <span class="room-icon">${locationIcons[selectedLocation] || "📍"}</span>
            <h4>${escapeHtml(selectedLocation)}</h4>
            <p>${group.length} reference${group.length > 1 ? "s" : ""} dans cette salle</p>
          </div>
        </div>
        <div class="room-item-list">
          ${group.length ? group.map(item => `
            <article class="room-item">
            <div>
              <button
                class="text-btn location-item-link"
                type="button"
                onclick="openItemDetail('${escapeHtml(item.id)}', { view: 'locations', location: '${escapeHtml(selectedLocation)}' })"
              >
                ${escapeHtml(item.name)}
              </button>
              <span>
                ${escapeHtml(item.category)} · ${item.quantity} ${escapeHtml(item.unit)} ·
                Tags: ${item.tags.map(tag => escapeHtml(tag)).join(", ") || "aucun"}
              </span>
            </div>
              <button class="text-btn" type="button" data-item-id="${escapeHtml(item.id)}">Modifier</button>
            </article>
          `).join("") : `<div class="empty-room">Aucun item dans cette salle pour le moment.</div>`}
        </div>
      </div>
    `;
    document.querySelector("#backToLocationsBtn").addEventListener("click", () => {
      selectedLocation = null;
      renderLocations();
    });
    locationGrid.querySelectorAll("[data-item-id]").forEach(button => {
      button.addEventListener("click", () => openModal(button.dataset.itemId));
    });
    return;
  }

  locationGrid.innerHTML = inventoryLocations.map(place => {
    const group = groups[place] || [];
    return `
    <button class="location-card" type="button" data-location="${escapeHtml(place)}">
      <span class="location-icon">${locationIcons[place] || "📍"}</span>
      <strong>${escapeHtml(place)}</strong>
      <p>${group.length} reference${group.length > 1 ? "s" : ""}</p>
      <div class="mini-list">${group.slice(0, 3).map(item => `<span>${escapeHtml(item.name)}</span>`).join("") || "<span>Salle vide</span>"}</div>
      <span class="enter-room"><span class="enter-room-icon">🚪</span> Entrer</span>
    </button>
  `;
  }).join("");
  locationGrid.querySelectorAll("[data-location]").forEach(card => {
    card.addEventListener("click", () => {
      selectedLocation = card.dataset.location;
      renderLocations();
    });
  });
}

function renderOrders() {
  const sorted = [...orders].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  document.querySelector("#orderList").innerHTML = sorted.map(order => `
    <article class="order-card priority-${slugPriority(order.priority)}">
      <div class="item-head">
        <div>
          <strong>${escapeHtml(order.itemName)}</strong>
          <span class="category">${escapeHtml(order.quantity)}${order.supplier ? ` - ${escapeHtml(order.supplier)}` : ""}</span>
        </div>
        <span class="priority-badge">${escapeHtml(priorityLabel(order.priority))}</span>
      </div>
      <p>${escapeHtml(order.notes || "Aucune note")}</p>
      <div class="card-actions">
        <small>Ajoute par ${escapeHtml(order.requestedBy)} - ${escapeHtml(order.createdAt)}</small>
        <button class="text-btn" onclick="markOrderDone('${order.id}')">Effacer</button>
      </div>
    </article>
  `).join("");
}

function renderExperiments() {
  const query = normalizeSearch(experimentSearchInput.value);
  const status = experimentStatusFilter.value;
  const filtered = experiments.filter(experiment => {
    const haystack = normalizeSearch([experiment.name, experiment.templateName, experiment.createdBy, experiment.status].join(" "));
    return (!query || haystack.includes(query))
      && (status === "all" || experiment.status === status);
  });

  const detail = selectedExperimentId ? experiments.find(experiment => experiment.id === selectedExperimentId) : null;
  document.querySelector("#experimentDetail").innerHTML = detail ? renderExperimentDetail(detail) : "";
  document.querySelector("#experimentGrid").classList.toggle("hidden", Boolean(detail));
  document.querySelector("#experimentGrid").innerHTML = filtered.map(experiment => {
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

      <p>${escapeHtml(experiment.notes || "Aucune note")}</p>

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
  }).join("") || `<div class="empty-room">Aucune experience ne correspond a cette recherche.</div>`;
}

function renderExperimentDetail(experiment) {
  const totalConditions = experiment.conditions * experiment.replicates;
  const rows = experiment.items.map(line => {
    const inventoryItem = findInventoryItem(line);
    const available = Number(inventoryItem?.quantity ?? 0);
    const needed = Number(line.quantity || 0);
    const comparable = inventoryItem && inventoryItem.unit === line.unit;
    const enough = comparable && available >= needed;
    const stateLabel = !inventoryItem ? "Non connecte" : !comparable ? "Unite differente" : enough ? "Suffisant" : "Insuffisant";
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
                ${escapeHtml(line.name)}
              </button>`
            : `<strong>${escapeHtml(line.name)}</strong>`
        }
        <br>
        <span>${escapeHtml(line.notes || "")}</span>
      </td>
        <td>${formatQuantity(needed, line.unit)}</td>
        <td>${inventoryItem ? `${inventoryItem.quantity} ${escapeHtml(inventoryItem.unit)}` : "Non connecte"}</td>
        <td><span class="stock-pill ${enough ? "ok" : "alert"}">${stateLabel}</span></td>
      </tr>
    `;
  }).join("");
  const canConsume = experiment.status !== "completed" && experimentStockSummary(experiment).ok;

  return `
    <section class="experiment-detail-panel">
      <div class="detail-topline">
        <button
          class="room-exit-btn"
          type="button"
          onclick="selectExperiment(null)"
          aria-label="Retour"
          title="Retour"
        >
          ↩️
        </button>
        <div class="detail-actions">
          <button class="ghost-btn compact-btn" type="button" onclick="openExperimentModal('${experiment.id}')">Modifier</button>
          <button class="primary-btn compact-btn" type="button" onclick="consumeExperimentStock('${experiment.id}')" ${canConsume ? "" : "disabled"}>Consommer le stock</button>
        </div>
      </div>
      <div class="experiment-detail-head">
        <div>
          <span class="experiment-status ${escapeHtml(experiment.status)}">${escapeHtml(statusLabelExperiment(experiment.status))}</span>
          <h3>${escapeHtml(experiment.name)}</h3>
          <p>${escapeHtml(experiment.templateName)} - ${experiment.conditions} conditions x ${experiment.replicates} replicats = ${totalConditions} conditions totales</p>
        </div>
        <small>Mis a jour par ${escapeHtml(experiment.createdBy)} - ${escapeHtml(experiment.updatedAt)}</small>
      </div>
      <p>${escapeHtml(experiment.notes || "Aucune note")}</p>
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

// funcion para ocultar filas vacias o con datos no relevantes en el detalle del item
function renderDetailRow(label, value) {
  if (!value || !String(value).trim()) return "";
  return `
    <div class="item-detail-row">
      <span class="item-detail-label">${escapeHtml(label)}</span>
      <div class="item-detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function getSelectedLocations() {
  return Array.from(
    locationMenu.querySelectorAll('input[type="checkbox"]:checked')
  ).map(input => input.value);
}

function setSelectedLocations(values = []) {
  locationMenu.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.checked = values.includes(input.value);
  });
  syncLocationField();
}

function getItemLocations(item) {
  if (Array.isArray(item.locations)) return item.locations;
  if (item.location) return [item.location];
  return [];
}

function formatLocations(item) {
  const locations = getItemLocations(item);
  return locations.length ? locations.join(", ") : "Sans localisation";
}

function syncLocationField() {
  const selected = getSelectedLocations();
  fields.location.value = selected.join("|");
  locationTriggerText.textContent = selected.length
    ? selected.join(", ")
    : "Sélectionner une ou plusieurs localisations";
}

function renderLocationOptions() {
  locationMenu.innerHTML = inventoryLocations.map(location => `
    <label class="location-option">
      <input type="checkbox" value="${escapeHtml(location)}" />
      <span>${escapeHtml(location)}</span>
    </label>
  `).join("");

  locationMenu.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener("change", syncLocationField);
  });

  syncLocationField();
}

locationTrigger.addEventListener("click", () => {
  const isHidden = locationMenu.classList.contains("hidden");
  locationMenu.classList.toggle("hidden", !isHidden);
  locationTrigger.setAttribute("aria-expanded", String(isHidden));
});

document.addEventListener("click", event => {
  if (!locationDropdown.contains(event.target)) {
    locationMenu.classList.add("hidden");
    locationTrigger.setAttribute("aria-expanded", "false");
  }
});d

function selectItem(id) {
  selectedItemId = id;
  renderInventory();
}

function selectExperiment(id) {
  selectedExperimentId = id;
  renderExperiments();
}

function openItemFromExperiment(id) {
  selectedItemId = id;
  activeView = "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "inventory");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#inventoryView").classList.add("active");

  controlBar.classList.remove("hidden");
  app.classList.remove("history-mode");

  renderInventory();
}

function openItemDetail(id, context = {}) {
  itemReturnContext = {
    view: context.view || activeView || "inventory",
    experimentId: context.experimentId ?? selectedExperimentId ?? null,
    location: context.location ?? selectedLocation ?? null
  };

  selectedItemId = id;
  activeView = "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === "inventory");
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector("#inventoryView").classList.add("active");

  controlBar.classList.remove("hidden");
  app.classList.remove("history-mode");

  renderInventory();
}

function returnFromItemDetail() {
  selectedItemId = null;

  if (itemReturnContext.view === "experiments" && itemReturnContext.experimentId) {
    activeView = "experiments";
    selectedExperimentId = itemReturnContext.experimentId;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === "experiments");
    });

    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    document.querySelector("#experimentsView").classList.add("active");

    controlBar.classList.add("hidden");
    app.classList.remove("history-mode");

    renderExperiments();
    return;
  }

  activeView = itemReturnContext.view || "inventory";

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#${activeView}View`).classList.add("active");

  controlBar.classList.toggle("hidden", activeView !== "inventory");
  app.classList.toggle("history-mode", activeView === "history");

  render();
}

function openModal(id) {
  const item = items.find(entry => entry.id === id);
  const references = normalizeReferences(item?.references);
  document.querySelector("#modalTitle").textContent = item ? "Modifier item" : "Nouvel item";
  document.querySelector("#deleteItemBtn").style.display = item ? "inline-block" : "none";
  fields.itemId.value = item?.id || "";
  fields.name.value = item?.name || "";
  fields.category.value = item?.category || inventoryCategories[0];
  fields.quantity.value = item?.quantity ?? "";
  fields.unit.value = item?.unit || "";
  fields.minStock.value = item?.minStock ?? "";
  fields.maxStock.value = item?.maxStock ?? "";
  setSelectedLocations(item ? getItemLocations(item) : []);
  fields.tags.value = item?.tags?.join(", ") || "";
  fields.notes.value = item?.notes || "";
  fields.primarySupplier.value = references.primary.supplier || "";
  fields.primaryReference.value = references.primary.reference || "";
  fields.primaryLink.value = references.primary.link || "";
  fields.primaryReferenceNotes.value = references.primary.notes || "";
  fields.primaryPrice.value = references.primary.price || "";
  fields.primaryUnitPrice.value = references.primary.unitPrice || "";
  fields.primaryLeadTime.value = references.primary.leadTime || "";
  renderSecondaryReferences(references.secondary);
  dialog.showModal();
}

function saveItem() {
  if (!form.reportValidity()) return;

  const id = fields.itemId.value || `itm-${Date.now()}`;
  const selectedLocations = getSelectedLocations();

  const item = {
    id,
    name: fields.name.value.trim(),
    category: fields.category.value.trim(),
    quantity: Number(fields.quantity.value),
    unit: fields.unit.value.trim(),
    minStock: Number(fields.minStock.value),
    maxStock: Number(fields.maxStock.value),
    locations: selectedLocations,
    location: selectedLocations[0] || "",
    tags: fields.tags.value.split(",").map(tag => tag.trim()).filter(Boolean),
    notes: fields.notes.value.trim(),
    references: getItemReferences()
  };

  const index = items.findIndex(entry => entry.id === id);

  if (index >= 0) {
    items[index] = item;
    addHistory("Item modifié", `${currentName} a modifié ${item.name}.`);
  } else {
    items.unshift(item);
    addHistory("Item ajouté", `${currentName} a ajouté ${item.name} dans ${item.category}.`);
  }

  persist();
  dialog.close();
  render();
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
  stockDialog.showModal();
}

function saveStockUpdate() {
  if (!stockForm.reportValidity()) return;
  const id = stockFields.stockItemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;

  const amount = Number(stockFields.stockAmount.value);
  const direction = stockFields.stockAction.value;
  const nextQuantity = direction === "received"
    ? Number(item.quantity) + amount
    : Number(item.quantity) - amount;

  if (nextQuantity < 0) {
    stockFields.stockAmount.setCustomValidity("La quantite ne peut pas devenir negative.");
    stockForm.reportValidity();
    stockFields.stockAmount.setCustomValidity("");
    return;
  }

  const title = stockFields.stockTitle.value.trim();
  const previousQuantity = item.quantity;
  item.quantity = Number(nextQuantity.toFixed(3));

  const actionLabel = direction === "received" ? "reçu" : "pris";
  const note = stockFields.stockNotes.value.trim();
  addHistory(
    "Stock mis à jour",
    `${currentName} a ${actionLabel} ${amount} ${item.unit} pour ${item.name} (${title}). Stock: ${previousQuantity} -> ${item.quantity} ${item.unit}.${note ? ` Note: ${note}` : ""}`
  );

  persist();
  stockDialog.close();
  render();
}

function openExperimentModal(id) {
  const experiment = experiments.find(entry => entry.id === id);
  const template = protocolTemplates.find(entry => entry.id === (experiment?.templateId || protocolTemplates[0].id));
  experimentForm.reset();
  document.querySelector("#experimentModalTitle").textContent = experiment ? "Modifier experience" : "Nouvelle experience";
  experimentFields.experimentId.value = experiment?.id || "";
  experimentFields.experimentTemplate.value = experiment?.templateId || template.id;
  experimentFields.experimentName.value = experiment?.name || "";
  experimentFields.experimentConditions.value = experiment?.conditions || 1;
  experimentFields.experimentReplicates.value = experiment?.replicates || 1;
  experimentFields.experimentStatus.value = experiment?.status || "draft";
  experimentFields.experimentNotes.value = experiment?.notes || template.notes || "";
  experimentFields.experimentTemplate.disabled = Boolean(experiment);
  experimentItemsList.innerHTML = "";
  if (experiment) {
    experiment.items.forEach(line => addExperimentItemRow(line));
  } else {
    buildExperimentItemsFromTemplate();
  }
  updateExperimentTotalConditions();
  updateExperimentModalStock();
  experimentDialog.showModal();
}

function buildExperimentItemsFromTemplate() {
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  if (!template) return;
  if (!experimentFields.experimentId.value && !experimentFields.experimentName.value.trim()) {
    experimentFields.experimentName.value = `${template.name} - ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`;
  }
  if (!experimentFields.experimentNotes.value.trim()) {
    experimentFields.experimentNotes.value = template.notes || "";
  }
  experimentItemsList.innerHTML = "";
  const total = updateExperimentTotalConditions();
  template.items.forEach(templateItem => addExperimentItemRow({
    ...templateItem,
    quantity: Number((templateItem.perConditionQuantity * total).toFixed(3))
  }));
  updateExperimentModalStock();
}

function recalculateExperimentTemplateQuantities() {
  const total = updateExperimentTotalConditions();
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const perCondition = Number(row.dataset.perCondition || 0);
    if (perCondition > 0) {
      row.querySelector(".experiment-item-quantity").value = Number((perCondition * total).toFixed(3));
    }
  });
  updateExperimentModalStock();
}

function updateExperimentTotalConditions() {
  const total = Math.max(1, Number(experimentFields.experimentConditions.value || 1)) * Math.max(1, Number(experimentFields.experimentReplicates.value || 1));
  experimentFields.experimentTotalConditions.value = total;
  return total;
}

function addExperimentItemRow(line = {}) {
  const selectedItem = findInventoryItem(line) || items[0];
  const row = document.createElement("div");
  row.className = "experiment-item-row";
  row.dataset.perCondition = line.perConditionQuantity || "";
  row.innerHTML = `
    <select class="experiment-item-select" required>
      ${items.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
    </select>
    <input class="experiment-item-quantity" type="number" min="0" step="0.001" value="${escapeHtml(line.quantity ?? "")}" required />
    <input class="experiment-item-unit" value="${escapeHtml(line.unit || selectedItem?.unit || "")}" required />
    <span class="experiment-stock-state"></span>
    <button class="ghost-btn compact-btn" type="button">Retirer</button>
    <input class="experiment-item-notes" value="${escapeHtml(line.notes || "")}" placeholder="Notes ligne" />
  `;
  row.querySelector(".experiment-item-select").value = selectedItem?.id || "";
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateExperimentModalStock();
  });
  experimentItemsList.append(row);
  updateExperimentModalStock();
}

function hydrateExperimentItemRow(row, itemId) {
  const item = items.find(entry => entry.id === itemId);
  if (!row || !item) return;
  row.querySelector(".experiment-item-unit").value = item.unit;
  row.dataset.perCondition = "";
}

function updateExperimentModalStock() {
  experimentItemsList.querySelectorAll(".experiment-item-row").forEach(row => {
    const item = items.find(entry => entry.id === row.querySelector(".experiment-item-select").value);
    const needed = Number(row.querySelector(".experiment-item-quantity").value || 0);
    const unit = row.querySelector(".experiment-item-unit").value.trim();
    const state = row.querySelector(".experiment-stock-state");
    if (!item) {
      state.className = "experiment-stock-state stock-alert";
      state.textContent = "Non connecte";
      return;
    }
    if (unit && item.unit !== unit) {
      state.className = "experiment-stock-state stock-alert";
      state.textContent = `${item.quantity} ${item.unit} - unite differente`;
      return;
    }
    const ok = Number(item.quantity) >= needed;
    state.className = `experiment-stock-state ${ok ? "stock-ok" : "stock-alert"}`;
    state.textContent = `${item.quantity} ${item.unit}`;
  });
}

function saveExperiment() {
  if (!experimentForm.reportValidity()) return;
  const template = protocolTemplates.find(entry => entry.id === experimentFields.experimentTemplate.value);
  const id = experimentFields.experimentId.value || `exp-${Date.now()}`;
  const experiment = {
    id,
    name: experimentFields.experimentName.value.trim(),
    templateId: experimentFields.experimentTemplate.value,
    templateName: template?.name || "Template inconnu",
    conditions: Number(experimentFields.experimentConditions.value),
    replicates: Number(experimentFields.experimentReplicates.value),
    status: experimentFields.experimentStatus.value,
    notes: experimentFields.experimentNotes.value.trim(),
    createdBy: currentName,
    updatedAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    items: getExperimentRows()
  };
  const index = experiments.findIndex(entry => entry.id === id);
  if (index >= 0) {
    experiment.createdBy = experiments[index].createdBy || currentName;
    experiments[index] = experiment;
    addHistory("Experience modifiée", `${currentName} a modifié ${experiment.name}.`);
  } else {
    experiments.unshift(experiment);
    addHistory("Experience créée", `${currentName} a créé ${experiment.name} depuis ${experiment.templateName}.`);
  }
  persist();
  selectedExperimentId = id;
  experimentFields.experimentTemplate.disabled = false;
  experimentDialog.close();
  renderExperiments();
  renderHistory();
}

function getExperimentRows() {
  return [...experimentItemsList.querySelectorAll(".experiment-item-row")]
    .map(row => {
      const item = items.find(entry => entry.id === row.querySelector(".experiment-item-select").value);
      return {
        itemId: item?.id || "",
        name: item?.name || "",
        quantity: Number(row.querySelector(".experiment-item-quantity").value || 0),
        unit: row.querySelector(".experiment-item-unit").value.trim(),
        notes: row.querySelector(".experiment-item-notes").value.trim(),
        perConditionQuantity: Number(row.dataset.perCondition || 0)
      };
    })
    .filter(line => line.itemId && line.quantity >= 0);
}

function consumeExperimentStock(id) {
  const experiment = experiments.find(entry => entry.id === id);
  if (!experiment) return;
  if (experiment.status === "completed") return;
  const summary = experimentStockSummary(experiment);
  if (!summary.ok) {
    addHistory("Consommation bloquée", `${currentName} a tente de consommer ${experiment.name}, mais le stock est insuffisant.`);
    window.alert("Stock insuffisant ou unité différente: consommation bloquée.");
    renderHistory();
    return;
  }
  experiment.items.forEach(line => {
    const item = findInventoryItem(line);
    if (item) item.quantity = Number((Number(item.quantity) - Number(line.quantity || 0)).toFixed(3));
  });
  experiment.status = "completed";
  experiment.updatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date());
  addHistory("Experience consommée", `${currentName} a consommé le stock pour ${experiment.name}.`);
  persist();
  render();
}

function deleteItem() {
  const id = fields.itemId.value;
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  items = items.filter(entry => entry.id !== id);
  addHistory("Item supprimé", `${currentName} a supprimé ${item.name} de l'inventaire.`);
  persist();
  dialog.close();
  if (selectedItemId === id) {
    selectedItemId = null;
  }
  render();
}

function openOrderModal() {
  orderForm.reset();
  orderFields.orderPriority.value = "critique";
  orderDialog.showModal();
}

function saveOrder() {
  if (!orderForm.reportValidity()) return;
  const order = {
    id: `ord-${Date.now()}`,
    itemName: orderFields.orderItemName.value.trim(),
    quantity: orderFields.orderQuantity.value.trim(),
    priority: orderFields.orderPriority.value,
    supplier: orderFields.orderSupplier.value.trim(),
    notes: orderFields.orderNotes.value.trim(),
    requestedBy: currentName,
    createdAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date())
  };
  orders.unshift(order);
  addHistory("Demande de commande", `${currentName} a ajouté ${order.itemName} à la liste À commander (${priorityLabel(order.priority)}).`);
  persist();
  orderDialog.close();
  renderOrders();
  renderHistory();
}

function markOrderDone(id) {
  const order = orders.find(entry => entry.id === id);
  if (!order) return;
  orders = orders.filter(entry => entry.id !== id);
  addHistory("Commande effectuée", `${currentName} a marqué ${order.itemName} comme commande.`);
  persist();
  renderOrders();
  renderHistory();
}

function addHistory(action, detail) {
  history.unshift({
    date: new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    user: currentName,
    action,
    detail
  });
}

function migrateItems(itemList) {
  return itemList.map(item => ({
    ...item,
    category: inventoryCategories.includes(item.category)
      ? item.category
      : legacyCategoryMap[item.category] || inventoryCategories[0],
    location: inventoryLocations.includes(item.location)
      ? item.location
      : legacyLocationMap[item.location] || inventoryLocations[0],
    tags: Array.isArray(item.tags) ? item.tags : [],
    references: normalizeReferences(item.references)
  }));
}

// funcion para conservar both los items que yo genero en VS como los items que cualquiera anade a github
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
  return experimentList.map(experiment => ({
    ...experiment,
    status: ["draft", "running", "completed"].includes(experiment.status) ? experiment.status : "draft",
    conditions: Math.max(1, Number(experiment.conditions || 1)),
    replicates: Math.max(1, Number(experiment.replicates || 1)),
    items: Array.isArray(experiment.items) ? experiment.items : []
  }));
}

function findInventoryItem(line) {
  return items.find(item => item.id === line.itemId)
    || items.find(item => normalizeSearch(item.name) === normalizeSearch(line.name || ""));
}

function experimentStockSummary(experiment) {
  const missing = experiment.items.filter(line => {
    const item = findInventoryItem(line);
    return !item || item.unit !== line.unit || Number(item.quantity) < Number(line.quantity || 0);
  }).length;
  return { ok: missing === 0, missing };
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
    <label>Notes<input class="secondary-reference-notes" value="${escapeHtml(reference.notes || "")}" /></label>
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
      notes: row.querySelector(".secondary-reference-notes").value.trim()
    }))
    .filter((reference) => reference.reference || reference.notes);

  return {
    primary: {
      supplier: fields.primarySupplier.value.trim(),
      reference: fields.primaryReference.value.trim(),
      link: fields.primaryLink.value.trim(),
      notes: fields.primaryReferenceNotes.value.trim(),
      price: fields.primaryPrice.value.trim(),
      unitPrice: fields.primaryUnitPrice.value.trim(),
      leadTime: fields.primaryLeadTime.value.trim()
    },
    secondary
  };
}

function normalizeReferences(references) {
  const legacyPrimaryNotes = [
    references?.primary?.quantity,
    references?.primary?.price
  ].filter(Boolean).join(" - ");

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
