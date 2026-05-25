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
