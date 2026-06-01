// hacer esto en la consola cada vez que actualizas los seedItems
// localStorage.removeItem("exadex_items");
// localStorage.removeItem("adipovault_items");
// location.reload();


const seedItems = 
[
  {
    "id": "itm-CSV-0001",
    "name": "Bouchon BD Luer - Lok™ avec protection mâle/femelle",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "394075B",
        "link": "https://www.dutscher.com/article/394075B",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "13,1",
        "unitPrice": "0,166",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau",
      "Culture L2"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "120",
    "references": {
      "primary": {
        "supplier": "bastide",
        "reference": "100081",
        "link": "https://www.bastideleconfortmedical.com/seringues-3-pieces-20-ml-bd-plastipak-cone-luer-lock-100081.html",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "38",
        "unitPrice": "0,316666667",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "20",
    "references": {
      "primary": {
        "supplier": "Aestetic group",
        "reference": "FD0000000-LLF24",
        "link": "https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/527-raccord-d-emulsion-de-graisse-fll-o-12mm-x20.html",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "46",
        "unitPrice": "2,3",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "20",
    "references": {
      "primary": {
        "supplier": "Aestetic group",
        "reference": "FD0000000-LLF14",
        "link": "https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/526-raccord-d-emulsion-de-graisse-fll-o-14mm-x20.html",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "46",
        "unitPrice": "2,3",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "20",
    "references": {
      "primary": {
        "supplier": "Aestetic group",
        "reference": "FD0000000-LLF12",
        "link": "https://www.aestheticgroup.fr/fr/raccords-d-emulsion-de-graisse/525-raccord-d-emulsion-de-graisse-fll-o-24mm-x20.html",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "46",
        "unitPrice": "2,3",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Coating ULA"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "faCellitate",
        "reference": "F202005",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques · faCellitate – BIOFLOAT™ FLEX coating solution [F202005] for 3D cell culture",
        "price": "60",
        "unitPrice": "1e/ml",
        "leadTime": "10 jours"
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "200",
    "references": {
      "primary": {
        "supplier": "Roth/greiner bio",
        "reference": "CNA6-1",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "116",
        "unitPrice": "0,58",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Plaque 6 ula"
    ],
    "notes": "24",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "3471",
        "link": "https://www.dutscher.com/article/003471",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "339",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0009",
    "name": "ACL -eBioscience™ 10X RBC Lysis Buffer (Multi-species) 50 ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 4,
    "location": "Culture L2",
    "locations": [
      "Culture L2",
      "Frigo culture L1"
    ],
    "tags": [
      "ACL"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "00-4300-54",
        "link": "https://www.thermofisher.com/order/catalog/product/00-4300-54?SID=srch-srp-00-4300-54",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "62",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Antibiotique"
    ],
    "notes": "",
    "references": {
      "primary": {},
      "secondary": []
    }
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
    "locations": [
      "Chambre froide"
    ],
    "tags": [
      "Antifongique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "0,28",
        "link": "https://www.sigmaaldrich.com/FR/fr/substance/amphotericinbsolution924081397893",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "287",
        "unitPrice": "5,75",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0012",
    "name": "Gibco™ Gentamicine (50 mg/ml)",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 4,
    "location": "Culture L1",
    "locations": [
      "Culture L1",
      "Culture L2"
    ],
    "tags": [
      "Antibiotique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "11520506",
        "link": "https://www.fishersci.fr/shop/products/gentamicin-50-mg-ml-4/11520506",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "220",
        "unitPrice": "11",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L2"
    ],
    "tags": [
      "Antibiotique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Life tech",
        "reference": "15710064",
        "link": "",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "16,11",
        "unitPrice": "1,5",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Antifongique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "fischer",
        "reference": "17660917",
        "link": "https://www.fishersci.fr/shop/products/amphotericin-b-mp-biomedicals-5/17660917?change_lang=true",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "90,9",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0015",
    "name": "Invivogen FUNGIN 75 MG (10 MG/ML)",
    "category": "Procédé ExAdEx L2",
    "quantity": 1.5,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 3,
    "location": "-20°C blanc labo",
    "locations": [
      "-20°C blanc labo"
    ],
    "tags": [
      "Antifongique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "invivogen",
        "reference": "ant-fn-1",
        "link": "https://www.fishersci.com/shop/products/fungin-75-mg-10-mg-ml/NC9326704",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "148",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Antifongique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Merck",
        "reference": "SML0425-5MG",
        "link": "https://www.sigmaaldrich.com/FR/fr/substance/caspofungindiacetate121342179463173",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "112",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "-20°C blanc labo"
    ],
    "tags": [
      "Antibiotique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "invivogen",
        "reference": "ant-pm-05",
        "link": "https://www.invivogen.com/primocin",
        "notes": "NA76 Antibiotiques Pour Culture Cellulaire",
        "price": "119",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0018",
    "name": "Endothelial Cell Growth Medium 2",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 8,
    "location": "Frigo culture L1",
    "locations": [
      "Frigo culture L1"
    ],
    "tags": [
      "Milieu EGM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Promocell",
        "reference": "C-22011",
        "link": "https://promocell.com/product/endothelial-cell-growth-medium-2/",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "153,85",
        "unitPrice": "",
        "leadTime": "15 jours"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0019",
    "name": "SupplementMix / Endothelial Cell Growth Medium 2",
    "category": "Procédé ExAdEx L2",
    "quantity": 4,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 8,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "Milieu EGM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Promocell",
        "reference": "C-39216",
        "link": "https://promocell.com/product/endothelial-cell-growth-medium-2/",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "50,85",
        "unitPrice": "2",
        "leadTime": "15 jours"
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "termofischer",
        "reference": "BD 408531",
        "link": "https://www.fishersci.com/shop/products/bd-luer-lok-caps/1482331",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "130",
        "unitPrice": "2,6",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "394074",
        "link": "https://www.dutscher.com/article/394074",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "34",
        "unitPrice": "0,34",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "200",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "394080",
        "link": "https://www.fishersci.fr/shop/products/x200-bouchons-luer-lock-st/16654462#?keyword=394080",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "50",
        "unitPrice": "0,25",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "https://www.aestheticgroup.fr/en/caps/125-luer-lock-cap-mc1711.html?search_query=FD0001711-MC&results=1",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "77",
        "unitPrice": "0,77",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Bouchon"
    ],
    "notes": "200",
    "references": {
      "primary": {
        "supplier": "Bexen medical",
        "reference": "EF000",
        "link": "https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "25",
        "unitPrice": "0,125",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "celldisc"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "678101",
        "link": "https://shop.gbo.com/fr/france/products/bioscience/mass-cell-culture/bs-celldisc/celldisc-tc-und-advanced-tc/678101.html?sword_list%5B0%5D=678101&no_cache=1&_ga=2.265742541.314801138.1677662655-627813974.1674230259",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "celldisc"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "678104",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Blouse"
    ],
    "notes": "30",
    "references": {
      "primary": {
        "supplier": "Fisher scientific",
        "reference": "",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "198",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0028",
    "name": "Blouse jetable ENDO protectlab taille XL",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Culture L1",
    "locations": [
      "Culture L1",
      "Culture L2"
    ],
    "tags": [
      "Blouse"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "https://www.labotienda.com/fr/produits-laboratoire/blouse-jetable-taille-xl-blanche-1-pc/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "0",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Flask cell repelent"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "658985",
        "link": "https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/flacons-surface-cell-repellent/658985.html?sword_list%5B0%5D=658985&no_cache=1&_ga=2.197454317.314801138.1677662655-627813974.1674230259",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "réf 658195",
        "link": "https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/flacons-cellstar/flacons-pour-culture-en-suspension/658195.html?sword_list%5B0%5D=658195&no_cache=1&_ga=2.268338764.314801138.1677662655-627813974.1674230259",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "662102",
        "link": "https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/plaques-multi-puits-cellstar/657185.html?sword_list%5B0%5D=657185&no_cache=1&_ga=2.261006799.314801138.1677662655-627813974.1674230259",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Flask culture suspension"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "657185",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "25",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "004616B",
        "link": "https://www.dutscher.com/article/004616B",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "300",
        "unitPrice": "12",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "10",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "330193",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "120",
        "unitPrice": "12",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Flask ULA T25"
    ],
    "notes": "25",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "4616+",
        "link": "https://www.carlroth.com/fr/fr/bouteilles-assiettes-plats-pour-culture-cellulaire/flacons-pour-culture-suspension-cellstar-bouchon-a-vis-avec-filtre/p/cna6.1",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "64,25",
        "unitPrice": "2,57",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau",
      "Réserve"
    ],
    "tags": [
      "Flask ULA T75"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "174951",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "#DIV/0!",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Plaque 24 ula"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "662970",
        "link": "https://shop.gbo.com/fr/france/products/bioscience/culture-cellulaire/support-de-culture-cellstar-cell-repellent-surface/microplaques-surface-cell-repellent/657970.html?sword_list%5B0%5D=657970&no_cache=1&_ga=2.29147902.314801138.1677662655-627813974.1674230259",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Robinet"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "92831",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Robinet"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "distrimed",
        "reference": "70334 ou 92831",
        "link": "https://www.distrimed.com/product_info.php?products_id=8067",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "50",
        "unitPrice": "0,5",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Robinet"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "robé médical",
        "reference": "ROB600",
        "link": "https://www.robe-materiel-medical.com/Robinet-3-voies-BD-Connecta-ROB600-materiel-medical.htm",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "42",
        "unitPrice": "0,42",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Robinet luer"
    ],
    "notes": "300",
    "references": {
      "primary": {
        "supplier": "bexen medical",
        "reference": "1104,19",
        "link": "https://www.bexenmedical.com/fr/materiel-medical/robinet-luer-lock",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "55",
        "unitPrice": "0,183333333",
        "leadTime": "rapide"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0042",
    "name": "Seringue 1ml soft jet",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 3,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Seringue"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Honke sass Wolf",
        "reference": "5010",
        "link": "https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "125",
        "unitPrice": "1,25",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Seringue"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "",
        "link": "https://www.dutscher.com/article/050833",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "11",
        "unitPrice": "0,22",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0044",
    "name": "Seringue 10ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Seringue 10 ml"
    ],
    "notes": "10",
    "references": {
      "primary": {
        "supplier": "Honke sass Wolf",
        "reference": "5100-000V0",
        "link": "https://www.henkesasswolf.de/en/search/?tx_indexedsearch_pi2%5Baction%5D=search&tx_indexedsearch_pi2%5Bcontroller%5D=Search&cHash=492a628381d5a9e4d38274fe2b890249",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "125",
        "unitPrice": "12,5",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0045",
    "name": "Seringue 10ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 3,
    "unit": "seringues",
    "minStock": 2,
    "maxStock": 6,
    "location": "Culture L1",
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Seringue"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Terumo",
        "reference": "50008",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "30",
        "unitPrice": "0,3",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0046",
    "name": "Seringue 100ml",
    "category": "Procédé ExAdEx L2",
    "quantity": 0,
    "unit": "seringues",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Seringue 100ml"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Terumo",
        "reference": "SS+01EH1",
        "link": "https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "34,7",
        "unitPrice": "0,347",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau",
      "Culture L2"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "120",
    "references": {
      "primary": {
        "supplier": "Aestetic group",
        "reference": "300629",
        "link": "https://www.aestheticgroup.fr/fr/recherche?controller=search&orderby=position&orderway=desc&search_query=300629&submit_search=",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "70",
        "unitPrice": "0,583333333",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "192",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "302830",
        "link": "https://www.dutscher.com/article/302830",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "121",
        "unitPrice": "0,630208333",
        "leadTime": "1 mois"
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau",
      "Réserve"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "300",
    "references": {
      "primary": {
        "supplier": "Bexen medical",
        "reference": "EF020",
        "link": "https://www.bexenmedical.com/fr/materiel-medical/seringues-enfit",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "75",
        "unitPrice": "0,25",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "120",
    "references": {
      "primary": {
        "supplier": "robé médical",
        "reference": "SLL20",
        "link": "https://www.robe-materiel-medical.com/Seringues-3-pieces-NIPRO-Luer-Lock-Boite-de-100-SLL20-materiel-medical.htm",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "60,47",
        "unitPrice": "0,503916667",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0051",
    "name": "Seringue luer lock 50 mL",
    "category": "Procédé ExAdEx L2",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "25",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "15349067",
        "link": "https://www.distrimed.com/product_info.php?products_id=3126&refe=180309&gclid=Cj0KCQiA0oagBhDHARIsAI-Bbgc1dfQA-yz3_fsxVV92O4lvfijEv45bqY1BFGWgF2VmyCMGofKRasAaApaOEALw_wcB",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "30",
        "unitPrice": "0",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Seringue luer lock"
    ],
    "notes": "10",
    "references": {
      "primary": {
        "supplier": "materiel medical",
        "reference": "12713MED / 90357MED",
        "link": "https://www.materielmedical.fr/4727-seringues-3-pieces-luer-lock-euromedis.html",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "50",
        "unitPrice": "5",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "25",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "149195",
        "link": "https://www.dutscher.com/article/149195",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "180",
        "unitPrice": "7,2",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "dutscher",
        "reference": "257240",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "40",
        "unitPrice": "0,8",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "dutscher",
        "reference": "257160",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "40",
        "unitPrice": "0,8",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques · UGAP",
        "price": "180",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "servilab",
        "reference": "352360",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "100*",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "servilab",
        "reference": "352350",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "100*",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0059",
    "name": "Tamis 40",
    "category": "Procédé ExAdEx L2",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "servilab",
        "reference": "352340",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "100*",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Filtre"
    ],
    "notes": "1",
    "references": {
      "primary": {
        "supplier": "vwr",
        "reference": "391-2093",
        "link": "",
        "notes": "VA.03",
        "price": "20",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "24",
    "references": {
      "primary": {
        "supplier": "Benewmedical",
        "reference": "CGTU DAT4L1.2MM",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "0",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Benewmedical",
        "reference": "CGTU DAT4L1.4MM",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Tulipe"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Benewmedical",
        "reference": "CGTU DAT4L2.4MM",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Antibiotique"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "15140122",
        "link": "https://www.thermofisher.com/order/catalog/product/15140122?SKULINK",
        "notes": "",
        "price": "10",
        "unitPrice": "0,1",
        "leadTime": "1mois"
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "lame chirurgicale"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "764315",
        "link": "",
        "notes": "NB.16 / 90189084",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "",
        "notes": "HA.01",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "",
        "notes": "HA.01",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "150",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "065745B",
        "link": "",
        "notes": "HA.01",
        "price": "16,47",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants L2 verts"
    ],
    "notes": "150",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "065744B",
        "link": "",
        "notes": "HA.01",
        "price": "16,47",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants bleus"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "65927",
        "link": "",
        "notes": "HA.01",
        "price": "4,3",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants bleus"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "65928",
        "link": "",
        "notes": "HA.01",
        "price": "5,8",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants bleus"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "",
        "link": "",
        "notes": "HA.01",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants bleus"
    ],
    "notes": "100",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "",
        "link": "",
        "notes": "HA.01",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Gants oranges"
    ],
    "notes": "50",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "65706",
        "link": "",
        "notes": "HA.01",
        "price": "24,3",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
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
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Congelation"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Merck Sigma",
        "reference": "D4540",
        "link": "",
        "notes": "",
        "price": "120",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0001",
    "name": "Agarose low gelling temperature Bioreagent Sigma 10G",
    "category": "Culture Cell",
    "quantity": 1510,
    "unit": "g",
    "minStock": 1,
    "maxStock": 3020,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Agarose"
    ],
    "notes": "Conditionnement : 100g",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "A9045",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/a9045",
        "notes": "",
        "price": "118",
        "unitPrice": "0,23",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0002",
    "name": "Agarose Bioreagent for molecular biology",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Agarose"
    ],
    "notes": "Conditionnement : 100g",
    "references": {
      "primary": {
        "supplier": "Merck",
        "reference": "A9539",
        "link": "",
        "notes": "",
        "price": "110,6",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0003",
    "name": "Agarase from pseudomonas atlantica Sigma",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Agarase"
    ],
    "notes": "Conditionnement : 100g",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "A6306",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/a6306",
        "notes": "",
        "price": "141",
        "unitPrice": "0,28/ml",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0004",
    "name": "boite ø 60",
    "category": "Culture Cell",
    "quantity": 0.5,
    "unit": "unités",
    "minStock": 0.5,
    "maxStock": 1,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Boite culture 2D"
    ],
    "notes": "Conditionnement : 500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "833901",
        "link": "https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3901/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "75",
        "unitPrice": "0,15",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0005",
    "name": "Boîte C.C 100 mm, standard",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Boite culture 2D"
    ],
    "notes": "Conditionnement : 300",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "83.3902",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3903/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "68,22",
        "unitPrice": "0,2274",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0006",
    "name": "boite ø 150",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0.5,
    "maxStock": 1,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Boite culture 2D"
    ],
    "notes": "Conditionnement : 100",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "833902",
        "link": "https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3902/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "60",
        "unitPrice": "0,6",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0007",
    "name": "boite ø 35",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Boite culture 2D"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "833900",
        "link": "https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3900/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "73",
        "unitPrice": "1,5",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0008",
    "name": "BSA free fatty acid 25g",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "g",
    "minStock": 0,
    "maxStock": 6,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "BSA"
    ],
    "notes": "Conditionnement : 25g",
    "references": {
      "primary": {
        "supplier": "merck",
        "reference": "A6003-25G",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/a6003",
        "notes": "",
        "price": "450",
        "unitPrice": "18e/g",
        "leadTime": "15 jours"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0009",
    "name": "Collagenase A from Clostridium histolycum (500mg)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Frigo culture L1",
    "locations": [
      "Frigo culture L1"
    ],
    "tags": [
      "Collagénase"
    ],
    "notes": "Conditionnement : 500mg",
    "references": {
      "primary": {
        "supplier": "Sigma Merck",
        "reference": "10103586001",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/roche/collaro",
        "notes": "",
        "price": "305,76",
        "unitPrice": "0,64",
        "leadTime": "15 jours"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0010",
    "name": "Accumax solution",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Accumax"
    ],
    "notes": "Conditionnement : 100 ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "A7089-100ML",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/a7089",
        "notes": "",
        "price": "200",
        "unitPrice": "2",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0011",
    "name": "Trypsine 0,5 + EDTA 1X",
    "category": "Culture Cell",
    "quantity": 5,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 10,
    "location": "-20°C blanc labo",
    "locations": [
      "-20°C blanc labo"
    ],
    "tags": [
      "Trypsine"
    ],
    "notes": "Conditionnement : 100ml",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "25300-054",
        "link": "https://www.thermofisher.com/order/catalog/product/25300054?SID=srch-hj-25300-054",
        "notes": "",
        "price": "59,3",
        "unitPrice": "0,59",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0012",
    "name": "Collagénase A",
    "category": "Culture Cell",
    "quantity": 1.5,
    "unit": "g",
    "minStock": 0,
    "maxStock": 3,
    "location": "Frigo culture L1",
    "locations": [
      "Frigo culture L1"
    ],
    "tags": [
      "Collagénase"
    ],
    "notes": "Conditionnement : 10g",
    "references": {
      "primary": {
        "supplier": "Merck",
        "reference": "A6003-10G",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/a6003",
        "notes": "",
        "price": "200",
        "unitPrice": "20€/g",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0013",
    "name": "Rosiglitazone BRL",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mg",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "BRL"
    ],
    "notes": "Conditionnement : 50mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "R2408-50MG",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/i7018",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "280",
        "unitPrice": "23",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0014",
    "name": "(T3) 3,3′,5-Triiodo-L-thyronine sodium Salt",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "T3"
    ],
    "notes": "Conditionnement : 100ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "T6397",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/i7018",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "67",
        "unitPrice": "0,67",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0015",
    "name": "Rosiglithazone BRL 49653",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "BRL"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "49653",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0016",
    "name": "Dexamethasone (PM : 392.46)",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mg",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "DEX"
    ],
    "notes": "Conditionnement : 100mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "D4902",
        "link": "https://www.sigmaaldrich.com/FR/fr/substance/dexamethasone3924650022?gclid=CjwKCAjw2K6lBhBXEiwA5RjtCdSCdJwZu2sP4yeAnOsKIbfaI-7aJ4e-wlrgmkCRX6qXiMlsfM0iXRoCKjgQAvD_BwE&gclsrc=aw.ds",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "75",
        "unitPrice": "0,75",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0017",
    "name": "n-acetyl-L-cysteine",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "g",
    "minStock": 0,
    "maxStock": 1,
    "location": "Frigo culture L1",
    "locations": [
      "Frigo culture L1"
    ],
    "tags": [
      "NAC"
    ],
    "notes": "Conditionnement : 5G",
    "references": {
      "primary": {
        "supplier": "sigma",
        "reference": "A7250",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0018",
    "name": "Insuline, humain recombinant, zinc solution, 4mg/ml",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "-20°C 1 salle -80",
    "locations": [
      "-20°C 1 salle -80"
    ],
    "tags": [
      "Insuline"
    ],
    "notes": "Conditionnement : 5 ml",
    "references": {
      "primary": {
        "supplier": "gibco",
        "reference": "12585014",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "95",
        "unitPrice": "19€/ml",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0019",
    "name": "18-beta Glycyrrhetinic Acid (Enoxolone)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Vascular network"
    ],
    "notes": "Conditionnement : 10g",
    "references": {
      "primary": {
        "supplier": "Merck",
        "reference": "G10105-10G",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/aldrich/g10105?srsltid=AfmBOoroOGL3FoP0JhXxnyyHi-JixsymSZPcTFBXkrrtczLwAoVEwUEe",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "110",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0020",
    "name": "Human TGFb1 recombinant protein peprotech",
    "category": "Culture Cell",
    "quantity": 1.5,
    "unit": "g",
    "minStock": 1,
    "maxStock": 3,
    "location": "-20°C gris labo",
    "locations": [
      "-20°C gris labo"
    ],
    "tags": [
      "TGFb"
    ],
    "notes": "Conditionnement : 2ug",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "100-21-2ug",
        "link": "https://www.thermofisher.com/antibody/product/Human-TGF-beta-1-Recombinant-Protein/100-21-1MG",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "75",
        "unitPrice": "16",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0021",
    "name": "Triacsin C, acyl-CoA synthetase inhibitor",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "Triacsin C"
    ],
    "notes": "Conditionnement : 100µg",
    "references": {
      "primary": {
        "supplier": "abcam",
        "reference": "ab141888",
        "link": "https://www.abcam.com/products/biochemicals/triacsin-c-acyl-coa-synthetase-inhibitor-ab141888.html?productWallTab=ShowAll",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "200",
        "unitPrice": "2€/µg",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0022",
    "name": "Sodium L ascorbate",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "Culture L1",
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Acide Ascorbique"
    ],
    "notes": "Conditionnement : 100g",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "A4034-100G",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0023",
    "name": "SB 10mM",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C gris labo",
    "locations": [
      "-20°C gris labo"
    ],
    "tags": [
      "TNF"
    ],
    "notes": "Conditionnement : 10mG",
    "references": {
      "primary": {
        "supplier": "hello bio",
        "reference": "HB3555-10mg",
        "link": "https://hellobio.com/sb-431542.html",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "200",
        "unitPrice": "20",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0024",
    "name": "5 μM 429 platelet-derived growth factor-AB (PDGF-AB, R&D Systems 10ug)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "PDGF-AB"
    ],
    "notes": "Conditionnement : 10ug",
    "references": {
      "primary": {
        "supplier": "RD system",
        "reference": "222-AB-010",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "245",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0025",
    "name": "5 μM lysophosphatidic acid (1mg // 3854/1) R&D systems",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "lysophosphatidic acid"
    ],
    "notes": "Conditionnement : 1mg",
    "references": {
      "primary": {
        "supplier": "RD system",
        "reference": "3854/1",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "89",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0026",
    "name": "Semaglutide",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "Semaglutide"
    ],
    "notes": "Conditionnement : 1mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "TA9H97BAEA07",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "136",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0027",
    "name": "Liraglutide",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "Liraglutide"
    ],
    "notes": "Conditionnement : 5mg",
    "references": {
      "primary": {
        "supplier": "Merck",
        "reference": "SML3925-5mg",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "165",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0028",
    "name": "Tirzepatide",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Tirzepatide"
    ],
    "notes": "Conditionnement : 5mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "AABH9A95AC09",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "198",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0029",
    "name": "Human TNFa recombinant protein peprotech",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 0,
    "maxStock": 2,
    "location": "-20°C gris labo",
    "locations": [
      "-20°C gris labo"
    ],
    "tags": [
      "TNFa"
    ],
    "notes": "Conditionnement : 10ug",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "300-01A-10UG",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "75",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0030",
    "name": "Celecoxib",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 2,
    "location": "Culture L1",
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Celecoxib"
    ],
    "notes": "Conditionnement : 10mg",
    "references": {
      "primary": {
        "supplier": "Tocris",
        "reference": "3786/10",
        "link": "https://www.tocris.com/products/celecoxib_3786",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "",
        "unitPrice": "191",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0031",
    "name": "Nintedanib",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "mg",
    "minStock": 0,
    "maxStock": 4,
    "location": "-20°C culture L1",
    "locations": [
      "-20°C culture L1"
    ],
    "tags": [
      "Nintedanib"
    ],
    "notes": "Conditionnement : 10mg",
    "references": {
      "primary": {
        "supplier": "Tocris",
        "reference": "7049/10",
        "link": "https://www.tocris.com/products/nintedanib_7049",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "",
        "unitPrice": "91",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0032",
    "name": "DMEM sans glucose (pour glucose uptake)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu DMEM"
    ],
    "notes": "Conditionnement : 500mL",
    "references": {
      "primary": {
        "supplier": "Thermofisher",
        "reference": "11966025",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale · DMEM, sans glucose",
        "price": "18",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0033",
    "name": "DMEM sans glu",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu DMEM"
    ],
    "notes": "Conditionnement : 500 ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "D6046",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "32",
        "unitPrice": "0,06",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0034",
    "name": "DMEM glutamax 1g/L",
    "category": "Culture Cell",
    "quantity": 5,
    "unit": "mL",
    "minStock": 3,
    "maxStock": 10,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu DMEM"
    ],
    "notes": "Conditionnement : 500 ml",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "21885-025",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "16,5",
        "unitPrice": "0,006",
        "leadTime": "Rapide"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0035",
    "name": "DMEM glutamax 4,5g/l",
    "category": "Culture Cell",
    "quantity": 24,
    "unit": "mL",
    "minStock": 3,
    "maxStock": 48,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu DMEM"
    ],
    "notes": "Conditionnement : 500ml",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "31960-021",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "75,5",
        "unitPrice": "0,75",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0036",
    "name": "DMEM/F12 (1:1) W GLUT-I 500ML",
    "category": "Culture Cell",
    "quantity": 7,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 14,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo",
      "Chambre froide"
    ],
    "tags": [
      "Milieu DMEM"
    ],
    "notes": "DMEM/F12 (1:1) W GLUT-I 500ML",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "31331028",
        "link": "https://www.thermofisher.com/order/catalog/product/31331093?SID=srch-hj-31331093",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "62",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0037",
    "name": "SupplementMix: Contains all media supplements premixed in one vial",
    "category": "Culture Cell",
    "quantity": 11,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 22,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Milieu EGM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Promocell",
        "reference": "c-39216",
        "link": "https://promocell.com/product/endothelial-cell-growth-medium-2/",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "56,50 €",
        "unitPrice": "2,8",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0038",
    "name": "SupplementPack: Contains all media supplements as individual vials",
    "category": "Culture Cell",
    "quantity": 6,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 12,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo",
      "Laboratoire"
    ],
    "tags": [
      "Milieu EGM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "c-39211",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "234,00 €",
        "unitPrice": "23,4",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0039",
    "name": "Basal medium 2 (500ml)",
    "category": "Culture Cell",
    "quantity": 11,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 22,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 500ml",
    "references": {
      "primary": {
        "supplier": "Promocell",
        "reference": "c-22211",
        "link": "https://promocell.com/product/endothelial-cell-growth-medium-2/",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "140,00 €",
        "unitPrice": "0,28",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0040",
    "name": "PBS",
    "category": "Culture Cell",
    "quantity": 5,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 10,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu PBS"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "14190-094",
        "link": "https://www.thermofisher.com/order/catalog/product/14190094",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale",
        "price": "23,4",
        "unitPrice": "1,15",
        "leadTime": "rapide"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0041",
    "name": "PBS poche cytiva Sangamo (a aliquoter en stérile dans bouteilles 250mL attention P/S)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "L",
    "minStock": 0,
    "maxStock": 2,
    "location": "Chambre froide",
    "locations": [
      "Chambre froide"
    ],
    "tags": [
      "Milieu PBS"
    ],
    "notes": "Conditionnement : 5L",
    "references": {
      "primary": {},
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0042",
    "name": "Supplément GlutaMAX™",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Glutamax"
    ],
    "notes": "Conditionnement : 100ml",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "35050061",
        "link": "https://www.thermofisher.com/order/catalog/product/35050061",
        "notes": "",
        "price": "62",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0043",
    "name": "Growth Medium (Ready-to-use): Includes Basal Medium and SupplementMix",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 4,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo",
      "Laboratoire"
    ],
    "tags": [
      "Milieu EGM"
    ],
    "notes": "Conditionnement : 500mL",
    "references": {
      "primary": {
        "supplier": "Promocell",
        "reference": "c-22011",
        "link": "https://promocell.com/product/endothelial-cell-growth-medium-2/",
        "notes": "",
        "price": "146",
        "unitPrice": "14,6",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0044",
    "name": "3-Isobutyl-1-methylxanthine (IBMX)",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "mg",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 250mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "I7018-250MG",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/d4902",
        "notes": "",
        "price": "250",
        "unitPrice": "1",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0045",
    "name": "RPMI 1640 Medium, GlutaMAX™ Supplement, HEPES (pour lipolyse)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 500mL",
    "references": {
      "primary": {
        "supplier": "Thermofisher",
        "reference": "72400021",
        "link": "",
        "notes": "NA71 : Sérum et autre milieu pour culture cellulaire animale · RPMI 1640 Medium, GlutaMAX™ Supplement, HEPES",
        "price": "25",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0046",
    "name": "Pipette stérile Pasteur 3 ml (a commander de preference)",
    "category": "Culture Cell",
    "quantity": 2.5,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 5,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pastette"
    ],
    "notes": "Conditionnement : 1000",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "390513",
        "link": "https://www.dutscher.com/article/390513",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "52",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0047",
    "name": "Pipette 3,5 ml non stérile",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pastette"
    ],
    "notes": "Conditionnement : 200",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "86.1171",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques · Produit - Sarstedt",
        "price": "18,5",
        "unitPrice": "0,0925",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0048",
    "name": "Pipette Pasteur 3 ml ( ref de secours)",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pastette"
    ],
    "notes": "Conditionnement : 840",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "86.1171.001",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-de-transfert/produit/86.1171.001/",
        "notes": "",
        "price": "73",
        "unitPrice": "0,086904762",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0049",
    "name": "Pipette 1 ml",
    "category": "Culture Cell",
    "quantity": 0.25,
    "unit": "mL",
    "minStock": 0.5,
    "maxStock": 1,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pipette"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "86.1251.001",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1251.001/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "231",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0050",
    "name": "Pipette 5 ml",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "mL",
    "minStock": 0.5,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pipette"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "86.1253.001",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1253.001/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "310",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0051",
    "name": "Pipette 10 ml",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pipette"
    ],
    "notes": "Conditionnement : 500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "86.1254.001",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pipettes-serologiques/produit/86.1254.001/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "179",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0052",
    "name": "Plaque 6 puits, standard, fond plat",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "plaques",
    "minStock": 1,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 6"
    ],
    "notes": "Conditionnement : 500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "83.3920",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3920/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "44,45",
        "unitPrice": "0,0889",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0053",
    "name": "Plaque 12 Puits",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 6,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Plaque 12"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "833921",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "43",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0054",
    "name": "Plaque 24W fond plat",
    "category": "Culture Cell",
    "quantity": 3.5,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 7,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 24"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "Sarstedt",
        "reference": "83.3922",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0055",
    "name": "Plaque 48 puits fond plats standart",
    "category": "Culture Cell",
    "quantity": 3.5,
    "unit": "plaques",
    "minStock": 1,
    "maxStock": 7,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 48"
    ],
    "notes": "Conditionnement : 1000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "83.3923",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3923/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "55,2",
        "unitPrice": "0,0552",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0056",
    "name": "Plaque 96 puits Standard, fond plat",
    "category": "Culture Cell",
    "quantity": 3.5,
    "unit": "plaques",
    "minStock": 1,
    "maxStock": 7,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 96"
    ],
    "notes": "Conditionnement : 100",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "83.3924",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/culture-cellulaire-tissulaire/culture/produit/83.3924/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "100",
        "unitPrice": "1",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0057",
    "name": "Plaque 6 puits ULA",
    "category": "Culture Cell",
    "quantity": 5.5,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 11,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Plaque 6 puit ula"
    ],
    "notes": "Conditionnement : 24",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "3471",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "248",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0058",
    "name": "plaque 6 puit ULA",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 4,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Plaque 6 puit ula"
    ],
    "notes": "Conditionnement : 7",
    "references": {
      "primary": {
        "supplier": "thermofischer",
        "reference": "174932",
        "link": "https://www.thermofisher.com/order/catalog/product/174932?SKULINK",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "123",
        "unitPrice": "17,57142857",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0059",
    "name": "Plaque Corning 24 puits ULA",
    "category": "Culture Cell",
    "quantity": 1.5,
    "unit": "plaques",
    "minStock": 1,
    "maxStock": 3,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Plaque 24 ula"
    ],
    "notes": "Conditionnement : 24",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "3473",
        "link": "https://www.dutscher.com/article/003473",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "700",
        "unitPrice": "29,16666667",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0060",
    "name": "Plaque corning 96 puits ULA",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "plaques",
    "minStock": 2,
    "maxStock": 4,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Plaque 96 ula"
    ],
    "notes": "Conditionnement : 24",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "7007",
        "link": "https://www.dutscher.com/article/007007",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "700",
        "unitPrice": "29,16666667",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0061",
    "name": "Microtube 0,5ml",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "tubes",
    "minStock": 0.5,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Eppendorf"
    ],
    "notes": "Conditionnement : 5000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "72,699",
        "link": "",
        "notes": "NB11",
        "price": "61",
        "unitPrice": "0,0122",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0062",
    "name": "Microtube 1,5 ml",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "mL",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Eppendorf"
    ],
    "notes": "Conditionnement : 5000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "72,690,001",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/microtubes-a-vis-tubes-a-reaction/tubes-a-reaction/produit/72.706/",
        "notes": "NB11",
        "price": "50",
        "unitPrice": "0,01",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0063",
    "name": "Microtube 2ml",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "tubes",
    "minStock": 0.5,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Eppendorf"
    ],
    "notes": "Conditionnement : 5000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "72 691",
        "link": "",
        "notes": "NB12",
        "price": "70",
        "unitPrice": "0,014",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0064",
    "name": "Microtube 1,7mL low adhesion",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "tubes",
    "minStock": 0,
    "maxStock": 2,
    "location": "Culture L1",
    "locations": [
      "Culture L1"
    ],
    "tags": [],
    "notes": "Conditionnement : 1000",
    "references": {
      "primary": {
        "supplier": "dutscher",
        "reference": "011720",
        "link": "",
        "notes": "NB11",
        "price": "43",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0065",
    "name": "contenant 120ml (bouteilles bouchon jaune)",
    "category": "Culture Cell",
    "quantity": 1.5,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 3,
    "location": "Culture L1",
    "locations": [
      "Culture L1"
    ],
    "tags": [
      "Tube prelevement"
    ],
    "notes": "Conditionnement : 250",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "759922420",
        "link": "",
        "notes": "",
        "price": "74,8",
        "unitPrice": "0,2992",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0066",
    "name": "Cryotubes 1,8 ml",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "CryotubeTube"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "72379006",
        "link": "",
        "notes": "",
        "price": "14",
        "unitPrice": "0,28",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0067",
    "name": "Falcon facs 5ml",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tube FACS"
    ],
    "notes": "Conditionnement : 500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "62526028",
        "link": "",
        "notes": "",
        "price": "72",
        "unitPrice": "0",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0068",
    "name": "falcon fac 15 ml",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Tube FACS"
    ],
    "notes": "Conditionnement : 500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "352059",
        "link": "",
        "notes": "ugap",
        "price": "215",
        "unitPrice": "0,43",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0069",
    "name": "Falcon 15",
    "category": "Culture Cell",
    "quantity": 3.5,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 7,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Falcon 15"
    ],
    "notes": "500 (50/sac)",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "62554502",
        "link": "https://www.sarstedt.com/en/products/laboratory/reagent-centrifuge-tubes/tubes/product/62.554.502/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "53",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0070",
    "name": "Falcon 50",
    "category": "Culture Cell",
    "quantity": 5.5,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 11,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Falcon 50"
    ],
    "notes": "300 (25/sac)",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "62547254",
        "link": "https://www.sarstedt.com/en/products/laboratory/reagent-centrifuge-tubes/tubes/product/62.547.254/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "32",
        "unitPrice": "0",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0071",
    "name": "cones 1000µL non filtrés",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "10x500",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "703050",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3050/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "46",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0072",
    "name": "cones 1000µL non filtrés",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "500*5000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "2869314",
        "link": "https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-2/11973466?tab=document#tab12",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "45",
        "unitPrice": "",
        "leadTime": "rapide"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0073",
    "name": "cones 200µL non filtrés",
    "category": "Culture Cell",
    "quantity": 5,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 10,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "Conditionnement : 1000",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "703030",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3030/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "45",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0074",
    "name": "cones 10µl non filtrés",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "480/b 1920/carton",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "703010200",
        "link": "https://www.sarstedt.com/fr/produits/laboratoire/manipulation-des-liquides/pointes-de-pipette/produit/70.3010.200/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "45",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0075",
    "name": "cones filtrés 1000µL",
    "category": "Culture Cell",
    "quantity": 1.5,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 3,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "Conditionnement : 1920",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "2869323",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "113",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0076",
    "name": "cones filtrés 200µL",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "Conditionnement : 1920",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "703031355",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "80",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0077",
    "name": "cones filtrés 200µL",
    "category": "Culture Cell",
    "quantity": 3.5,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 7,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "960/b",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "14220",
        "link": "https://www.dutscher.com/article/014220",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "155",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0078",
    "name": "cones filtrés 20uL",
    "category": "Culture Cell",
    "quantity": 3,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 6,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes (référence ok)"
    ],
    "notes": "Conditionnement : 1920",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "70.3020.255",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0079",
    "name": "cones filtrés 20uL",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "Conditionnement : 1920",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "3020255",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "82",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0080",
    "name": "cones filtrés 20µL",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes"
    ],
    "notes": "Conditionnement : 5000",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "11963466",
        "link": "https://www.fishersci.fr/shop/products/sureone-aerosol-barrier-pipette-tips-1/11963466",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "555",
        "unitPrice": "0,111",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0081",
    "name": "cones filtrés 10µL",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Pointes (référence ok)"
    ],
    "notes": "Conditionnement : 1920",
    "references": {
      "primary": {
        "supplier": "sarstedt",
        "reference": "70.3010.205",
        "link": "https://www.sarstedt.com/en/products/laboratory/liquid-handling/pipette-tips/product/70.3010.205/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "68,16",
        "unitPrice": "0,0355",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0082",
    "name": "cliptip 300 ext low retention",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Bureau",
    "locations": [
      "Bureau"
    ],
    "tags": [
      "Cone multicanaux"
    ],
    "notes": "Conditionnement : 960",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "94410610",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "55",
        "unitPrice": "0,057291667",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0083",
    "name": "Biocidal ZF",
    "category": "Culture Cell",
    "quantity": 6,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 12,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Décontamination"
    ],
    "notes": "Conditionnement : 6",
    "references": {
      "primary": {
        "supplier": "Biovalley",
        "reference": "ZF006",
        "link": "https://www.biovalley.fr/desinfectant-mycoplasmes-pour-surfaces-2002/mycoplasma-off-surface-disinfection-347000036.html",
        "notes": "",
        "price": "480",
        "unitPrice": "79,33333333",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0084",
    "name": "Phagospray",
    "category": "Culture Cell",
    "quantity": 0.5,
    "unit": "L",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Décontamination"
    ],
    "notes": "Conditionnement : 5L",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "972500",
        "link": "",
        "notes": "",
        "price": "32,85",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0085",
    "name": "Mycoplasma Off 1L",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Décontamination"
    ],
    "notes": "Conditionnement : 1",
    "references": {
      "primary": {
        "supplier": "Biovalley",
        "reference": "15-1000",
        "link": "https://www.biovalley.fr/desinfectant-mycoplasmes-pour-surfaces-2002/mycoplasma-off-surface-disinfection-347000036.html",
        "notes": "",
        "price": "325",
        "unitPrice": "65",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0086",
    "name": "T12",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Flask"
    ],
    "notes": "Conditionnement : 840",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "",
        "link": "",
        "notes": "ugap",
        "price": "51,24",
        "unitPrice": "0,061",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0087",
    "name": "T25",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 2,
    "maxStock": 4,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Flask"
    ],
    "notes": "Conditionnement : 25",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "83.3910.002",
        "link": "https://www.sarstedt.com/en/products/laboratory/cell-tissue-culture/cultivation/product/83.3910.002/",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "186",
        "unitPrice": "7,44",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0088",
    "name": "T25",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Flask"
    ],
    "notes": "Conditionnement : 300",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "2582557",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "170",
        "unitPrice": "0,566666667",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0089",
    "name": "T75",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Flask"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "3814",
        "link": "https://www.dutscher.com/article/003814",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "490",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0090",
    "name": "Sac Kraft pour Dasri (conditionnement par 25)",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 4,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [],
    "notes": "Conditionnement : 25",
    "references": {
      "primary": {
        "supplier": "Labo+",
        "reference": "PAP822GP002",
        "link": "",
        "notes": "",
        "price": "34,26",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0091",
    "name": "Masque médical OP-AIR à élastiques Type II bleu",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Masque"
    ],
    "notes": "Conditionnement : 960",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "475407",
        "link": "",
        "notes": "HA.02",
        "price": "113,1",
        "unitPrice": "0,1178125",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0092",
    "name": "Masque De Protection Respiratoire Jetable 3 plis",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Masque"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "Labo Plus",
        "reference": "911817",
        "link": "",
        "notes": "HA.02",
        "price": "1,02",
        "unitPrice": "0,0204",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0093",
    "name": "Collagen from bovine achilles tendon 10g",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "g",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Collagen matrix"
    ],
    "notes": "Conditionnement : 10g",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "C9879-10G",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/roche/collaro",
        "notes": "",
        "price": "370",
        "unitPrice": "37",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0094",
    "name": "gelatine solution",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "",
        "notes": ".",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0095",
    "name": "3dGRO Organoid Freeze medium",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 500 ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "SCM301",
        "link": "",
        "notes": "",
        "price": "150",
        "unitPrice": "0,3",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0096",
    "name": "Azide 0,1M solution",
    "category": "Culture Cell",
    "quantity": 0.5,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 1,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 1ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "08591-1ML",
        "link": "",
        "notes": "",
        "price": "60",
        "unitPrice": "60",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0097",
    "name": "F10HAM",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 1,
    "maxStock": 2,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 500 ml",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "N6908",
        "link": "",
        "notes": "",
        "price": "121",
        "unitPrice": "0,24",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0098",
    "name": "Formoterol fumarate dihydrate",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mg",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 100mg",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "F9552-10 mg",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/f9552",
        "notes": "",
        "price": "67,7",
        "unitPrice": "0,67",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0099",
    "name": "herpes",
    "category": "Culture Cell",
    "quantity": 5,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 10,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "BEPP7-737E",
        "link": "",
        "notes": "",
        "price": "130",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0100",
    "name": "L-glutamine",
    "category": "Culture Cell",
    "quantity": 7,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 14,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "lonza",
        "reference": "BE17-605E",
        "link": "",
        "notes": "",
        "price": "240",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0101",
    "name": "NA pyruvate",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "mL",
    "minStock": 0,
    "maxStock": 4,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "Conditionnement : 50 ml",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "",
        "notes": "",
        "price": "50,25",
        "unitPrice": "1",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0102",
    "name": "Sodium Acetate Solution",
    "category": "Culture Cell",
    "quantity": 2,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 4,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Milieu"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Sigma",
        "reference": "71196-100 ml",
        "link": "https://www.sigmaaldrich.com/FR/fr/product/sigma/71196",
        "notes": "",
        "price": "253",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0103",
    "name": "MEM 100X",
    "category": "Culture Cell",
    "quantity": 4,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 8,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu MEM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "M7145",
        "link": "",
        "notes": "",
        "price": "293",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0104",
    "name": "MEM nea 100X",
    "category": "Culture Cell",
    "quantity": 6,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 12,
    "location": "Frigo labo",
    "locations": [
      "Frigo labo"
    ],
    "tags": [
      "Milieu MEM"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "11140-035",
        "link": "",
        "notes": "",
        "price": "293",
        "unitPrice": "29,3",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0105",
    "name": "insert culture plaque 24 puits 0,4µm",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "plaque 24 insert"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "353095",
        "link": "",
        "notes": "",
        "price": "215",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0106",
    "name": "Plaque companion 24 puits 6,3µm",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "plaque 24 insert"
    ],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "Dutscher",
        "reference": "353595",
        "link": "",
        "notes": "",
        "price": "110",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0107",
    "name": "Plaque 6 puits, Repellent, avec LID, stérile",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "plaques",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Plaque 6"
    ],
    "notes": "ECHANTILLON",
    "references": {
      "primary": {
        "supplier": "Greiner bio",
        "reference": "657970",
        "link": "",
        "notes": "",
        "price": "ECHANTILLON",
        "unitPrice": "ECHANTILLON",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0108",
    "name": "Plaque 96 puits applied OPTIQUE",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "plaques",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 96"
    ],
    "notes": "Conditionnement : 20",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "10407314",
        "link": "https://www.fishersci.fr/shop/products/applied-biosystems-microamp-optical-96-well-reaction-plate-barcode-4/p-4918085",
        "notes": "",
        "price": "200",
        "unitPrice": "10",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0109",
    "name": "support de Plaque 96 puits applied Veriflex",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "plaques",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "Plaque 96"
    ],
    "notes": "Conditionnement : 10",
    "references": {
      "primary": {
        "supplier": "ThermoFischer",
        "reference": "10361235",
        "link": "https://www.fishersci.fr/shop/products/p/10361235",
        "notes": "",
        "price": "120",
        "unitPrice": "12",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0110",
    "name": "repet tip 1,25 mL",
    "category": "Culture Cell",
    "quantity": 1,
    "unit": "mL",
    "minStock": 0.5,
    "maxStock": 2,
    "location": "Réserve",
    "locations": [
      "Réserve"
    ],
    "tags": [
      "repet tip"
    ],
    "notes": "Conditionnement : 100",
    "references": {
      "primary": {
        "supplier": "gilson",
        "reference": "F164530",
        "link": "",
        "notes": "",
        "price": "46",
        "unitPrice": "0,46",
        "leadTime": ""
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0111",
    "name": "filtre 0,22",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 1,
    "maxStock": 2,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [
      "Tamis/ Filtre"
    ],
    "notes": "Conditionnement : 50",
    "references": {
      "primary": {
        "supplier": "starstedt",
        "reference": "SF13CA22S",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques · UGAP",
        "price": "103",
        "unitPrice": "2,06",
        "leadTime": "1 tous les 3 mois"
      },
      "secondary": []
    }
  },
  {
    "id": "itm-CSV-0112",
    "name": "petrie dish 100x100x20 carrée",
    "category": "Culture Cell",
    "quantity": 0,
    "unit": "unités",
    "minStock": 0,
    "maxStock": 1,
    "location": "Laboratoire",
    "locations": [
      "Laboratoire"
    ],
    "tags": [],
    "notes": "",
    "references": {
      "primary": {
        "supplier": "",
        "reference": "",
        "link": "",
        "notes": "NB13 Culture Cellulaire Eucaryote : Consommables En Plastique Specifiques",
        "price": "",
        "unitPrice": "",
        "leadTime": ""
      },
      "secondary": []
    }
  }
]
