const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateTrade, rateTrade, toCoins } = require("../src/market.js");

test("normalizza i valori delle monete", () => {
  assert.equal(toCoins("12.500 coins"), 12500);
  assert.equal(toCoins(-10), 0);
  assert.equal(toCoins("n/a"), 0);
});

test("calcola tassa, utile e ROI", () => {
  const trade = calculateTrade({ buyPrice: 12000, sellPrice: 14500, quantity: 2 });
  assert.equal(trade.tax, 725);
  assert.equal(trade.netSale, 13775);
  assert.equal(trade.profitPerItem, 1775);
  assert.equal(trade.totalProfit, 3550);
  assert.equal(Number(trade.roi.toFixed(2)), 14.79);
});

test("classifica il margine rispetto alla soglia", () => {
  assert.equal(rateTrade(calculateTrade({ buyPrice: 1000, sellPrice: 2000 }), 500), "good");
  assert.equal(rateTrade(calculateTrade({ buyPrice: 1000, sellPrice: 1300 }), 500), "thin");
  assert.equal(rateTrade(calculateTrade({ buyPrice: 1000, sellPrice: 900 }), 500), "loss");
});
