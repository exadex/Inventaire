(function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function number(value) {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function round(value) {
    return Number(Number(value).toFixed(6));
  }

  function operationAlreadyApplied(order, operationId) {
    return Array.isArray(order?.inventoryReceiptOperations)
      && order.inventoryReceiptOperations.some(entry => entry?.operationId === operationId);
  }

  function receiptLocation(item, tracking) {
    if (tracking.mode !== "containers") return "";
    const known = Array.from(new Set([
      ...(tracking.closedByLocation || []).map(row => row.location),
      ...(Array.isArray(item.locations) ? item.locations : []),
      item.location
    ].filter(Boolean)));
    if (known.length === 1) return known[0];
    if (!known.length) throw new Error("Aucun emplacement de réception n’est défini pour cet article.");
    throw new Error("Plusieurs emplacements sont possibles : la réception est ambiguë.");
  }

  function sameUnit(stockTracking, left, right) {
    if (!left || !right) return true;
    const a = stockTracking.normalizeUnitLabel(left);
    const b = stockTracking.normalizeUnitLabel(right);
    return a.kind === b.kind && a.singular === b.singular && a.plural === b.plural;
  }

  function applyReceipt(rawState, request, dependencies) {
    const state = clone(rawState || {});
    const stockTracking = dependencies?.stockTracking;
    if (!stockTracking?.apply) throw new Error("Le mécanisme central de stock est indisponible.");
    if (!request?.operationId) throw new Error("L’identifiant de réception est manquant.");

    state.orders = Array.isArray(state.orders) ? state.orders : [];
    state.inventoryItems = Array.isArray(state.inventoryItems) ? state.inventoryItems : [];
    state.history = Array.isArray(state.history) ? state.history : [];
    state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements : [];

    const order = state.orders.find(entry => entry?.id === request.orderId);
    if (!order) throw new Error("Cette commande n’existe plus.");
    if (operationAlreadyApplied(order, request.operationId)) {
      return { state, duplicate: true, order, item: null, event: null };
    }
    if (!order.inventoryItemId) throw new Error("Cette commande n’est reliée à aucun article de l’inventaire.");

    const index = state.inventoryItems.findIndex(entry => entry?.id === order.inventoryItemId);
    if (index < 0) throw new Error("L’article d’origine lié à cette commande n’existe plus.");
    const item = state.inventoryItems[index];
    const orderUnit = order.inventoryUnit || request.unit;
    if (!sameUnit(stockTracking, orderUnit, item.unit) || !sameUnit(stockTracking, request.unit, item.unit)) {
      throw new Error(`Unité incompatible : la commande utilise « ${orderUnit || request.unit} » et le stock « ${item.unit} ».`);
    }

    const quantity = number(request.quantity);
    if (!(quantity > 0)) throw new Error("La quantité réellement reçue doit être strictement positive.");
    const requested = number(order.requestedQuantity ?? order.quantity);
    const alreadyAdded = number(order.addedToInventoryQuantity || 0) || 0;
    if (Number.isFinite(requested) && requested > 0 && quantity > round(requested - alreadyAdded)) {
      throw new Error("La quantité reçue dépasse la quantité restant à réceptionner.");
    }

    const normalized = stockTracking.normalizeTracking(item);
    const before = stockTracking.available(item);
    const applied = stockTracking.apply(item, {
      operationId: request.operationId,
      type: "received",
      quantity,
      toLocation: receiptLocation(item, normalized),
      comment: `Réception de commande ${order.reference || order.id}`
    }, request.user);
    const after = stockTracking.available(applied.item);
    const actualAdded = round(after - before);
    if (!(actualAdded > 0)) throw new Error("La réception n’a produit aucune augmentation de stock.");

    const timestamp = applied.event.timestamp;
    const event = {
      ...applied.event,
      type: "order_received",
      orderId: order.id,
      orderReference: order.reference || order.id,
      before,
      after,
      quantity: actualAdded,
      comment: `Réception de commande — Stock ${before} → ${after} (+${actualAdded}) — Commande ${order.reference || order.id}`
    };
    state.inventoryItems[index] = applied.item;

    const cumulative = round(alreadyAdded + actualAdded);
    order.receivedQuantity = cumulative;
    order.addedToInventoryQuantity = cumulative;
    order.addedToInventory = Number.isFinite(requested) && requested > 0
      ? cumulative >= requested
      : true;
    order.addedToInventoryAtRaw = timestamp;
    order.addedToInventoryAt = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short", timeStyle: "short"
    }).format(new Date(timestamp));
    order.inventoryReceiptOperations = Array.isArray(order.inventoryReceiptOperations)
      ? order.inventoryReceiptOperations
      : [];
    order.inventoryReceiptOperations.push({
      operationId: request.operationId,
      quantity: actualAdded,
      before,
      after,
      at: timestamp,
      user: request.user?.name || "Utilisateur",
      orderId: order.id
    });

    state.stockMovements.push(event);
    state.history.unshift({
      date: order.addedToInventoryAt,
      action: "Réception de commande",
      detail: `Réception de commande : stock ${before} → ${after} (+${actualAdded}) · Commande ${order.reference || order.id}`,
      user: request.user?.name || "Utilisateur",
      itemId: item.id,
      orderId: order.id,
      operationId: request.operationId,
      before,
      quantity: actualAdded,
      after
    });
    state.updatedAt = timestamp;
    return { state, duplicate: false, order, item: applied.item, event };
  }

  window.ExadexOrderInventory = {
    applyReceipt,
    operationAlreadyApplied
  };
})();
