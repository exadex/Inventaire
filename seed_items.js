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
