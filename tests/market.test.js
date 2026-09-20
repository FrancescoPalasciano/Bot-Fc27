const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateTrade, rateTrade, toCoins, parseListingText, chooseBestListing, suggestPricing, scoreOpportunity, summarizeActivity, summarizePrices, latestObservedPrice, comparePriceSnapshots, assessMarketSnapshot, buildLocalReport, normalizeSearchText } = require("../src/market.js");

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
  assert.equal(parseListingText("Iago Aspas\nCompra ora:\n1.900").buyNow, 1900);
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

test("suggerisce prezzi che includono tassa e profitto minimo", () => {
  const pricing = suggestPricing(10000, 500, "recommended");
  assert.deepEqual(pricing, { sellPrice: 10000, maximumBuy: 9000, mode: "recommended" });
  const trade = calculateTrade({ buyPrice: pricing.maximumBuy, sellPrice: pricing.sellPrice });
  assert.equal(trade.profitPerItem, 500);
});

test("attribuisce un punteggio più alto alle occasioni migliori", () => {
  const thin = calculateTrade({ buyPrice: 9000, sellPrice: 10000 });
  const strong = calculateTrade({ buyPrice: 7000, sellPrice: 10000 });
  assert.ok(scoreOpportunity(strong, 500) > scoreOpportunity(thin, 500));
  assert.equal(scoreOpportunity(calculateTrade({ buyPrice: 11000, sellPrice: 10000 }), 500), 0);
});

test("riassume le ricerche locali dell'ultima ora e giornata", () => {
  const now = Date.UTC(2026, 8, 20, 12);
  const summary = summarizeActivity([now - 1000, now - 2 * 60 * 60 * 1000, now - 25 * 60 * 60 * 1000], now);
  assert.deepEqual(summary, { lastHour: 1, lastDay: 2 });
});

test("confronta i nomi dei giocatori ignorando accenti e spazi", () => {
  assert.equal(normalizeSearchText("  Kylian  Mbappé "), "kylian mbappe");
  assert.ok(normalizeSearchText("Kylian Mbappé").includes(normalizeSearchText("Mbappe")));
});

test("riassume i prezzi osservati usando la mediana", () => {
  assert.deepEqual(summarizePrices([1500, "1.000", 2000, 1200]), {
    count: 4,
    minimum: 1000,
    reference: 1200,
    median: 1350,
    maximum: 2000
  });
  assert.equal(summarizePrices([0, "n/a"]), null);
});

test("usa soltanto un prezzo EA recente dello stesso giocatore", () => {
  const now = Date.UTC(2026, 8, 20, 12);
  const snapshots = [
    { player: "Iago Aspas", timestamp: now - 1000, minimum: 800, reference: 850, count: 6 },
    { player: "Iago Aspas", timestamp: now - 8 * 60 * 60 * 1000, minimum: 700, reference: 750, count: 5 }
  ];
  assert.deepEqual(latestObservedPrice(snapshots, "iago  aspas", now), {
    price: 850,
    updatedAt: now - 1000,
    sampleSize: 6
  });
  assert.equal(latestObservedPrice(snapshots, "Lautaro Martínez", now), null);
  assert.equal(latestObservedPrice(snapshots.slice(1), "Iago Aspas", now), null);
});

test("confronta due rilevazioni del mercato", () => {
  assert.deepEqual(comparePriceSnapshots({ median: 9000 }, { median: 10000 }), {
    direction: "down",
    change: -1000,
    percent: -10
  });
  assert.equal(comparePriceSnapshots({ median: 10000 }, null).direction, "flat");
});

test("valuta qualità e dispersione del campione prezzi", () => {
  const strong = assessMarketSnapshot({ count: 6, minimum: 9500, reference: 10000, maximum: 10500 });
  assert.equal(strong.level, "strong");
  assert.equal(strong.spreadPercent, 10);
  assert.equal(assessMarketSnapshot({ count: 2, minimum: 5000, reference: 7000, maximum: 10000 }).level, "weak");
});

test("genera un report locale senza includere impostazioni estranee", () => {
  const now = Date.UTC(2026, 8, 20, 12);
  const report = buildLocalReport({
    activity: { searches: [now], matches: 2 },
    savedFilters: [{ player: "Iago Aspas" }],
    watchlist: [],
    marketHistory: [{ player: "Iago Aspas", reference: 850 }],
    enabled: true
  }, now);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.generatedAt, "2026-09-20T12:00:00.000Z");
  assert.equal(report.activity.matches, 2);
  assert.equal("enabled" in report, false);
});
