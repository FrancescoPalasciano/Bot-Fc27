const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateTrade, rateTrade, toCoins, parseListingText, chooseBestListing } = require("../src/market.js");

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

test("legge il prezzo Compra ora da una riga della Web App", () => {
  const listing = parseListingText("81\nRW\nIago Aspas\nStart Price:\n600\nBid\n---\nBuy Now:\n2,000\nTime\n1 Minute");
  assert.equal(listing.player, "Iago Aspas");
  assert.equal(listing.buyNow, 2000);
});

test("seleziona l'offerta più economica entro budget", () => {
  const best = chooseBestListing([{ buyNow: 900 }, { buyNow: 650 }, { buyNow: 700 }], 700);
  assert.equal(best.buyNow, 650);
  assert.equal(best.withinBudget, true);
});

test("segnala quando la migliore offerta supera il budget", () => {
  const best = chooseBestListing([{ buyNow: 900 }, { buyNow: 800 }], 700);
  assert.equal(best.buyNow, 800);
  assert.equal(best.withinBudget, false);
});
