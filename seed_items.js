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
  }
]
