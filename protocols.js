const protocolTemplates = [
  {
    id: "tpl-rna-extraction",
    name: "Extraction d'ARN",
    notes: "Extraction d'ARN. Les quantités sont calculées automatiquement selon le nombre total de conditions. Le tissu est donné à 50 mg par condition comme repère et peut être ajusté. L'éthanol 75% est indicatif.",
    items: [
      {
        name: "Tissue *",
        unit: "mg",
        perConditionQuantity: 50,
        notes: "Repère uniquement. 50 mg par condition par défaut; ajuster selon le poids réel du tissu.",
        quantityEditable: true,
        manualLinkOnly: true
      },
      {
        name: "Qiazol",
        unit: "uL",
        perConditionQuantity: 600,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Billes",
        unit: "bille",
        perConditionQuantity: 1,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Eppendorf 2mL",
        unit: "tube",
        perConditionQuantity: 2,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Chloroforme",
        unit: "uL",
        perConditionQuantity: 350,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Eppendorf 1,5mL",
        unit: "tube",
        perConditionQuantity: 3,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Isopropanol",
        unit: "uL",
        perConditionQuantity: 150,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Glycogène",
        unit: "uL",
        perConditionQuantity: 1,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Ethanol 75% *",
        unit: "uL",
        perConditionQuantity: 200,
        notes: "Quantité indicative. 200 uL par condition comme repère; en utiliser davantage si nécessaire.",
        quantityEditable: true,
        manualLinkOnly: true
      },
      {
        name: "H2O",
        unit: "uL",
        perConditionQuantity: 116,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "RAD buffer",
        unit: "uL",
        perConditionQuantity: 300,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Colonne Zymo-Spin IC",
        unit: "colonne",
        perConditionQuantity: 1,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Tube flowthough Zyme-Spin IC",
        unit: "tube",
        perConditionQuantity: 1,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Prep Buffer",
        unit: "uL",
        perConditionQuantity: 400,
        notes: "",
        manualLinkOnly: true
      },
      {
        name: "Wash buffer",
        unit: "mL",
        perConditionQuantity: 1.1,
        notes: "",
        manualLinkOnly: true
      }
    ]
  },

  {
    id: "tpl-rtqpcr-3step",
    name: "RT-qPCR",
    protocol: "RT-qPCR",
    mode: "rtqpcr",
    notes: "RT, dilution cDNA et qPCR avec sections configurables.",
    sections: {
      rt: {
        enabledByDefault: true,
        label: "RT",
        items: [
          {
            kind: "manual",
            name: "Eppendorf 0,2mL",
            quantityMode: "fixedPerSample",
            perSample: 1,
            unit: "tube",
            notes: "RT"
          },
          {
            kind: "manual",
            name: "H2O",
            quantityMode: "rtWaterRange",
            minPerSample: 0,
            maxPerSample: 14.9,
            unit: "uL",
            notes: "RT - qsq 15 uL"
          },
          {
            kind: "manual",
            name: "Enzyme kit",
            quantityMode: "fixedPerSample",
            perSample: 4,
            unit: "uL",
            notes: "RT"
          },
          {
            kind: "manual",
            name: "gDNA",
            quantityMode: "fixedPerSample",
            perSample: 1,
            unit: "uL",
            notes: "RT"
          }
        ]
      },
      dilution: {
        enabledByDefault: true,
        label: "Dilution cDNA",
        items: [
          {
            kind: "manual",
            name: "Eppendorf 1,5mL",
            quantityMode: "fixedPerSample",
            perSample: 2,
            unit: "tube",
            notes: "Dilution cDNA"
          },
          {
            kind: "manual",
            name: "H2O",
            quantityMode: "fixedPerSample",
            perSample: 18,
            unit: "uL",
            notes: "Dilution cDNA"
          }
        ]
      },
      qpcr: {
        enabledByDefault: true,
        label: "qPCR",
        defaults: {
          primerCount: 1,
          qpcrReplicates: 2,
          deadVolumeConditions: 2
        },
        items: [
          {
            kind: "manual",
            name: "SybrGreen",
            quantityMode: "qpcrMastermix",
            perReaction: 2.5,
            unit: "uL",
            notes: "qPCR"
          },
          {
            kind: "manual",
            name: "Primer F/R",
            quantityMode: "qpcrMastermix",
            perReaction: 0.2,
            unit: "uL",
            notes: "qPCR"
          },
          {
            kind: "manual",
            name: "H2O",
            quantityMode: "qpcrMastermix",
            perReaction: 1.3,
            unit: "uL",
            notes: "qPCR"
          },
          {
            kind: "manual",
            name: "cDNA 1/10",
            quantityMode: "qpcrSample",
            perReaction: 1,
            unit: "uL",
            notes: "qPCR"
          }
        ]
      }
    }
  }
];
