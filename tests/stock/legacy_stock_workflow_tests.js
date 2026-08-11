(function () {
  "use strict";

  const clone = value => JSON.parse(JSON.stringify(value));
  const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const waitFor = async (predicate, message, timeout = 5000) => {
    const startedAt = Date.now();
    while (!predicate()) {
      if (Date.now() - startedAt > timeout) throw new Error(message);
      await wait(25);
    }
  };
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const input = (element, value) => {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const reloadStateKey = "exadex-legacy-stock-workflow-state";
  const reloadLinesKey = "exadex-legacy-stock-workflow-lines";
  const reloadPhaseKey = "exadex-legacy-stock-workflow-phase";
  const showResult = lines => {
    const output = document.createElement("pre");
    output.id = "legacyStockWorkflowResult";
    output.textContent = `${lines.join("\n")}\n6/6 tests navigateur passed`;
    document.body.appendChild(output);
    document.title = "PASS legacy stock workflow";
    document.body.dataset.legacyStockWorkflow = "pass";
  };

  const fixture = {
    version: 2,
    locationCatalog: { locations: [], sublocations: [] },
    inventoryItems: [{
      id: "fixture-legacy-bottle",
      name: "Ancienne fiche test",
      category: "Culture Cell",
      quantity: 0,
      unit: "bouteilles",
      minStock: 1,
      usageProfile: "normal",
      placements: [{ id: "fixture-placement", roomId: "room-reserve", locationId: null, sublocationId: null }],
      locations: ["Réserve"],
      location: "Réserve",
      tags: ["ancien"],
      notes: "Note initiale",
      references: { primary: { supplier: "Fournisseur initial", reference: "REF-OLD", notes: "Note référence initiale" }, secondary: [] },
      source: "web"
    }, {
      id: "fixture-simple-count",
      name: "Ancienne fiche simple",
      category: "Culture Cell",
      quantity: 0,
      unit: "bouteilles",
      minStock: 0,
      placements: [{ id: "fixture-simple-placement", roomId: "room-reserve", locationId: null, sublocationId: null }],
      locations: ["Réserve"], location: "Réserve", tags: [], notes: "", source: "web"
    }],
    experiments: [], orders: [], clientSamples: [], clients: [], supplierContacts: [],
    history: [{ id: "fixture-history-base", date: "01/01/2026 08:00", action: "Création", detail: "Fixture initiale", user: "Test" }],
    stockMovements: [], stockOperations: [], agentOperations: [], updatedAt: "2026-01-01T08:00:00.000Z"
  };

  async function run() {
    const lines = [];
    let remote = clone(fixture), sha = "fixture-sha-1", revision = 1;
    const storage = {
      getConfig: () => ({ owner: "fixture", repo: "fixture", path: "shared_data.json", token: "fixture-token", branch: "main" }),
      async loadSharedData() { return { data: clone(remote), sha, mode: "github-write" }; },
      async saveSharedData(data, expectedSha) {
        if (expectedSha !== sha) {
          const error = new Error("Conflit GitHub simulé");
          error.code = "GITHUB_CONFLICT";
          error.status = 409;
          throw error;
        }
        remote = clone(data);
        sha = `fixture-sha-${++revision}`;
        return sha;
      },
      async mutateSharedData(operationId, mutator) {
        const existing = (remote.stockOperations || []).find(row => row.operationId === operationId);
        if (existing) return { data: clone(remote), sha, duplicate: true };
        remote = clone(await mutator(clone(remote)));
        sha = `fixture-sha-${++revision}`;
        return { data: clone(remote), sha, duplicate: false };
      }
    };

    window.ExadexGithubStorage = storage;
    window.ExadexRecoveryStorage = { save: async () => null, markSynced: async () => null, load: async () => null };
    applySharedState(clone(fixture));
    initializeSharedSaveCoordinator(clone(fixture), sha);

    openModal("fixture-legacy-bottle");
    input(document.querySelector("#name"), "Fiche test modifiée");
    input(document.querySelector("#minStock"), "7");
    input(document.querySelector("#tags"), "ancien, vérifié");
    input(document.querySelector("#notes"), "Toutes les modifications doivent rester présentes.");
    input(document.querySelector("#primarySupplier"), "Fournisseur modifié");
    input(document.querySelector("#primaryReference"), "REF-NEW");

    const detailedPackaging = document.querySelector("#detailedPackagingEnabled");
    detailedPackaging.checked = true;
    detailedPackaging.dispatchEvent(new Event("change", { bubbles: true }));
    const firstUnit = document.querySelector("#packagingLevels [data-packaging-unit]");
    input(firstUnit, "bouteille");
    document.querySelector("#addPackagingLevelBtn").click();
    const rows = document.querySelectorAll("#packagingLevels .packaging-level-row");
    assert(rows.length === 2, "le deuxième niveau de conditionnement n'a pas été ajouté");
    input(rows[1].querySelector("[data-packaging-unit]"), "mL");
    input(rows[1].querySelector("[data-packaging-contains]"), "500");
    const trackingUnit = document.querySelector("#trackingUnitKey");
    const mlOption = [...trackingUnit.options].find(option => option.textContent === "mL");
    assert(mlOption, "l'unité mL n'est pas proposée");
    trackingUnit.value = mlOption.value;
    trackingUnit.dispatchEvent(new Event("change", { bubbles: true }));

    document.querySelector("#saveItemBtn").click();
    const locallyEdited = window.items.find(item => item.id === "fixture-legacy-bottle");
    assert(locallyEdited?.name === "Fiche test modifiée", "la fiche locale n'a pas été enregistrée");
    assert(StockTracking.normalizeTracking(locallyEdited).mode === "containers", "le suivi du conditionnement n'est pas actif localement");
    lines.push("PASS activation et sauvegarde immédiate du suivi bouteille / mL");

    const remoteItemBeforeConflict = remote.inventoryItems.find(item => item.id === "fixture-legacy-bottle");
    remoteItemBeforeConflict.references.primary.notes = "Ajout distinct depuis une autre session";
    remote.history.unshift({ date: "11/08/2026 12:00", action: "Modification distante", detail: "Champ distinct", user: "Autre session" });
    sha = `fixture-sha-${++revision}`;

    openStockManager("fixture-legacy-bottle", { action: "stock_recounted" });
    const stockDialog = document.querySelector("#stockManagerDialog");
    const action = stockDialog.querySelector("#stockManagerAction");
    assert(action.value === "stock_recounted", "le comptage n'est pas accessible immédiatement");
    assert(action.selectedOptions[0].textContent.includes("Comptage / Ajustement"), "le comptage n'est pas clairement identifié");
    stockDialog.querySelector("#smFrom").value = "Réserve";
    input(stockDialog.querySelector("#smQuantity"), "2");
    stockDialog.querySelector("#stockManagerComment").value = "";
    stockDialog.querySelector("#stockManagerForm").requestSubmit();
    await waitFor(() => (remote.stockOperations || []).length === 1, "le comptage n'a pas été sauvegardé");

    const saved = remote.inventoryItems.find(item => item.id === "fixture-legacy-bottle");
    const tracking = StockTracking.normalizeTracking(saved);
    assert(saved.name === "Fiche test modifiée", "le nom modifié a été remplacé par l'ancienne version");
    assert(saved.minStock === 7 && saved.notes.includes("modifications"), "des champs récents de la fiche ont disparu");
    assert(saved.tags.includes("vérifié") && saved.references.primary.reference === "REF-NEW", "les tags ou la référence modifiés ont disparu");
    assert(saved.references.primary.notes === "Ajout distinct depuis une autre session", "le champ distinct de l'autre session a été écrasé");
    assert(tracking.mode === "containers" && tracking.packagingLevels[0].singular === "bouteille" && tracking.trackingUnit === "mL", "la configuration bouteille / mL a disparu");
    assert(StockTracking.totalClosed(tracking) === 2 && tracking.openContainers.length === 0 && saved.quantity === 2, "le stock physique n'est pas égal à deux bouteilles fermées");
    lines.push("PASS comptage immédiat de 0 vers 2 sans perte de champs ni conflit inter-session");

    const recountHistory = remote.history.filter(entry => entry.type === "recounted" && entry.itemId === saved.id);
    assert(recountHistory.length === 1, "le comptage a créé plusieurs entrées d'historique");
    assert(recountHistory[0].previousQuantity === 0 && recountHistory[0].countedQuantity === 2 && recountHistory[0].difference === 2, "l'historique ne contient pas les valeurs 0, 2 et +2");
    assert(recountHistory[0].note === "", "une note a été ajoutée ou exigée");
    assert(remote.stockMovements.filter(entry => entry.itemId === saved.id).length === 1, "le comptage a créé un nombre incorrect de mouvements");
    assert(remote.stockMovements.every(entry => entry.type === "recounted"), "une réception ou une utilisation fictive a été créée");
    lines.push("PASS historique unique avec avant, après, écart, utilisateur, date et note facultative");

    const serialized = JSON.stringify(remote);
    applySharedState(JSON.parse(serialized));
    const reloaded = window.items.find(item => item.id === "fixture-legacy-bottle");
    assert(reloaded.name === saved.name && reloaded.notes === saved.notes, "les modifications ne survivent pas au rechargement");
    assert(StockTracking.available(reloaded) === 2 && StockTracking.normalizeTracking(reloaded).mode === "containers", "le stock ou le suivi ne survit pas au rechargement");
    openModal("fixture-legacy-bottle");
    assert(document.querySelector("#detailedPackagingEnabled").checked, "l'interface ne reconnaît plus le suivi après rechargement");
    assert(document.querySelector("#name").value === "Fiche test modifiée", "la fiche affichée après rechargement est obsolète");
    document.querySelector("#itemDialog").close();
    lines.push("PASS réhydratation de la fixture sérialisée sans perte de stock ni de configuration");

    openStockModal("fixture-simple-count");
    const simpleDialog = document.querySelector("#stockDialog");
    simpleDialog.querySelector("#stockAction").value = "recounted";
    simpleDialog.querySelector("#stockAction").dispatchEvent(new Event("change", { bubbles: true }));
    input(simpleDialog.querySelector("#stockAmount"), "2");
    simpleDialog.querySelector("#stockTitle").value = "";
    simpleDialog.querySelector("#stockNotes").value = "";
    document.querySelector("#saveStockBtn").click();
    await waitFor(() => (remote.stockOperations || []).length === 2, "le comptage simple n'a pas été sauvegardé");
    const simpleSaved = remote.inventoryItems.find(item => item.id === "fixture-simple-count");
    const simpleHistory = remote.history.filter(entry => entry.type === "recounted" && entry.itemId === simpleSaved.id);
    assert(simpleSaved.quantity === 2, "le comptage simple n'est pas absolu");
    assert(simpleHistory.length === 1 && simpleHistory[0].previousQuantity === 0 && simpleHistory[0].countedQuantity === 2, "l'historique du comptage simple est incorrect");
    assert(remote.stockMovements.filter(entry => entry.itemId === simpleSaved.id).every(entry => entry.type === "recounted"), "le comptage simple a créé une réception fictive");
    lines.push("PASS comptage absolu d'une ancienne fiche simple, sans note ni réception fictive");

    sessionStorage.setItem(reloadStateKey, JSON.stringify(remote));
    sessionStorage.setItem(reloadLinesKey, JSON.stringify(lines));
    sessionStorage.setItem(reloadPhaseKey, "verify");
    location.reload();
  }

  async function verifyAfterFullReload() {
    const persisted = JSON.parse(sessionStorage.getItem(reloadStateKey) || "null");
    const lines = JSON.parse(sessionStorage.getItem(reloadLinesKey) || "[]");
    assert(persisted?.inventoryItems, "la fixture de rechargement est absente");
    window.ExadexRecoveryStorage = { save: async () => null, markSynced: async () => null, load: async () => null };
    window.ExadexGithubStorage = {
      getConfig: () => ({ owner: "fixture", repo: "fixture", path: "shared_data.json", token: "fixture-token" }),
      loadSharedData: async () => ({ data: clone(persisted), sha: "fixture-reload" })
    };
    applySharedState(clone(persisted));
    initializeSharedSaveCoordinator(clone(persisted), "fixture-reload");
    const item = window.items.find(row => row.id === "fixture-legacy-bottle"), tracking = StockTracking.normalizeTracking(item);
    assert(item?.name === "Fiche test modifiée" && item.notes.includes("modifications"), "les champs de la fiche ont disparu après actualisation réelle");
    assert(StockTracking.available(item) === 2 && tracking.mode === "containers" && tracking.trackingUnit === "mL", "le stock ou le suivi a disparu après actualisation réelle");
    openModal(item.id);
    assert(document.querySelector("#detailedPackagingEnabled").checked && document.querySelector("#name").value === "Fiche test modifiée", "l'interface rechargée affiche une ancienne version");
    document.querySelector("#itemDialog").close();
    lines.push("PASS actualisation complète de la page avec relecture du stock et du suivi");
    sessionStorage.removeItem(reloadStateKey);
    sessionStorage.removeItem(reloadLinesKey);
    sessionStorage.removeItem(reloadPhaseKey);
    showResult(lines);
  }

  const reloadedPhase = sessionStorage.getItem(reloadPhaseKey) === "verify";
  window.addEventListener("load", () => window.setTimeout(() => (reloadedPhase ? verifyAfterFullReload() : run()).catch(error => {
    const output = document.createElement("pre");
    output.id = "legacyStockWorkflowResult";
    output.textContent = `FAIL ${error.message}\n${error.stack || ""}`;
    document.body.appendChild(output);
    document.title = "FAIL legacy stock workflow";
    document.body.dataset.legacyStockWorkflow = "fail";
  }), 500));
})();
