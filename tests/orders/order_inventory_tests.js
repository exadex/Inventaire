global.window = global;
require("../../js/stock/stock_tracking.js");
require("../../js/orders/order_inventory.js");

const assert = require("node:assert/strict");

function item(traceabilityMode = "detailed") {
  return {
    id: "item-1",
    name: "Article",
    quantity: 5,
    unit: "unités",
    stockTracking: { mode: "simple", traceabilityMode },
    aliquotTracking: { enabled: false, preparations: [] }
  };
}

function state(traceabilityMode = "detailed") {
  return {
    inventoryItems: [item(traceabilityMode)],
    orders: [{
      id: "CMD-2026-015",
      status: "received",
      inventoryItemId: "item-1",
      inventoryUnit: "unités",
      requestedQuantity: 5,
      receivedQuantity: 5
    }],
    history: [],
    stockMovements: []
  };
}

function receive(source, operationId, quantity) {
  return ExadexOrderInventory.applyReceipt(source, {
    orderId: "CMD-2026-015",
    operationId,
    quantity,
    unit: "unités",
    user: { name: "Caroline" }
  }, { stockTracking: StockTracking });
}

let result = receive(state(), "receipt-1", 3);
assert.equal(result.state.inventoryItems[0].quantity, 8);
assert.equal(result.state.orders[0].addedToInventoryQuantity, 3);
assert.equal(result.state.stockMovements.length, 1);
assert.match(result.state.history[0].detail, /stock 5 → 8 \(\+3\)/);

let partial = receive(state(), "partial-1", 2);
partial = receive(partial.state, "partial-2", 3);
assert.equal(partial.state.inventoryItems[0].quantity, 10);
assert.equal(partial.state.orders[0].addedToInventoryQuantity, 5);
assert.equal(partial.state.orders[0].inventoryReceiptOperations.length, 2);
assert.equal(partial.state.stockMovements.length, 2);

const duplicate = receive(partial.state, "partial-2", 3);
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.state.inventoryItems[0].quantity, 10);
assert.equal(duplicate.state.stockMovements.length, 2);

const concurrent = state();
concurrent.inventoryItems[0].quantity = 7;
result = receive(concurrent, "concurrent-1", 3);
assert.equal(result.state.inventoryItems[0].quantity, 10);

result = receive(state("periodic"), "no-trace-1", 3);
assert.equal(result.state.inventoryItems[0].quantity, 8);
assert.equal(result.state.stockMovements.length, 0);
assert.equal(result.state.history.length, 1);

assert.throws(
  () => receive({ ...state(), inventoryItems: [] }, "missing-1", 1),
  /n’existe plus/
);

const incompatible = state();
incompatible.orders[0].inventoryUnit = "kg";
assert.throws(() => receive(incompatible, "unit-1", 1), /Unité incompatible/);

console.log("✓ 8 scénarios de réception de commande validés");
