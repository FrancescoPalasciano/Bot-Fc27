(function exposeMarketMath(root) {
  "use strict";

  const TAX_RATE = 0.05;

  function toCoins(value) {
    const parsed = typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^0-9]/g, ""));
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  function calculateTrade({ buyPrice, sellPrice, quantity = 1, taxRate = TAX_RATE }) {
    const buy = toCoins(buyPrice);
    const sell = toCoins(sellPrice);
    const units = Math.max(1, Math.floor(toCoins(quantity)) || 1);
    const tax = Math.floor(sell * taxRate);
    const netSale = sell - tax;
    const profitPerItem = netSale - buy;

    return {
      buyPrice: buy,
      sellPrice: sell,
      quantity: units,
      tax,
      netSale,
      profitPerItem,
      totalProfit: profitPerItem * units,
      roi: buy > 0 ? (profitPerItem / buy) * 100 : 0
    };
  }

  function rateTrade(result, minimumProfit = 500) {
    if (!result.buyPrice || !result.sellPrice) return "incomplete";
    if (result.profitPerItem < 0) return "loss";
    if (result.profitPerItem < minimumProfit) return "thin";
    return "good";
  }

  function parseListingText(text) {
    const source = String(text || "");
    const player = source.split(/\r?\n/).map((part) => part.trim()).find((part) =>
      /[a-zà-ÿ]/i.test(part)
      && !/^(start price|bid|buy now|time|pac|sho|pas|dri|def|phy)$/i.test(part)
      && !/^[A-Z]{1,3}$/.test(part)
    ) || "Giocatore";
    const match = source.match(/(?:Buy Now|Compra ora):\s*([\d.,]+)/i);
    return {
      player,
      buyNow: match ? toCoins(match[1]) : 0
    };
  }

  function chooseBestListing(listings, maximumBuy = 0) {
    const valid = listings.filter((listing) => listing.buyNow > 0).sort((a, b) => a.buyNow - b.buyNow);
    if (!valid.length) return null;
    const withinBudget = maximumBuy > 0 ? valid.find((listing) => listing.buyNow <= maximumBuy) : valid[0];
    return { ...valid[0], withinBudget: Boolean(withinBudget), ...(withinBudget || {}) };
  }

  function roundCoins(value, step = 50) {
    return Math.max(0, Math.floor(toCoins(value) / step) * step);
  }

  function suggestPricing(marketPrice, minimumProfit = 500, mode = "recommended") {
    const sellPrice = roundCoins(marketPrice);
    if (!sellPrice) return { sellPrice: 0, maximumBuy: 0, mode };
    const netSale = sellPrice - Math.floor(sellPrice * TAX_RATE);
    const extraMargin = {
      safe: Math.max(toCoins(minimumProfit), Math.round(sellPrice * 0.08)),
      recommended: Math.max(toCoins(minimumProfit), Math.round(sellPrice * 0.05)),
      lazy: toCoins(minimumProfit)
    }[mode] ?? toCoins(minimumProfit);
    return { sellPrice, maximumBuy: roundCoins(netSale - extraMargin), mode };
  }

  function scoreOpportunity(result, minimumProfit = 500) {
    if (!result?.buyPrice || !result?.sellPrice || result.profitPerItem <= 0) return 0;
    const profitTarget = Math.max(1, toCoins(minimumProfit));
    const profitScore = Math.min(55, (result.profitPerItem / profitTarget) * 35);
    const roiScore = Math.min(35, Math.max(0, result.roi) * 1.5);
    const liquidityScore = result.sellPrice <= 150000 ? 10 : 5;
    return Math.max(0, Math.min(100, Math.round(profitScore + roiScore + liquidityScore)));
  }

  function summarizeActivity(searchTimestamps, now = Date.now()) {
    const timestamps = Array.isArray(searchTimestamps) ? searchTimestamps.filter(Number.isFinite) : [];
    const lastHour = timestamps.filter((timestamp) => now - timestamp < 60 * 60 * 1000).length;
    const lastDay = timestamps.filter((timestamp) => now - timestamp < 24 * 60 * 60 * 1000).length;
    return { lastHour, lastDay };
  }

  function summarizePrices(values) {
    const prices = (Array.isArray(values) ? values : [])
      .map(toCoins)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    if (!prices.length) return null;
    const middle = Math.floor(prices.length / 2);
    const median = prices.length % 2
      ? prices[middle]
      : Math.round((prices[middle - 1] + prices[middle]) / 2);
    const floorSample = prices.slice(0, Math.min(3, prices.length));
    const floorMiddle = Math.floor(floorSample.length / 2);
    const reference = floorSample.length % 2
      ? floorSample[floorMiddle]
      : Math.round((floorSample[floorMiddle - 1] + floorSample[floorMiddle]) / 2);
    return { count: prices.length, minimum: prices[0], reference, median, maximum: prices.at(-1) };
  }

  function latestObservedPrice(snapshots, playerName, now = Date.now(), maxAge = 6 * 60 * 60 * 1000) {
    const normalizedPlayer = normalizeSearchText(playerName);
    if (!normalizedPlayer || !Array.isArray(snapshots)) return null;
    const snapshot = snapshots.find((entry) =>
      normalizeSearchText(entry?.player) === normalizedPlayer
      && Number.isFinite(entry?.timestamp)
      && now - entry.timestamp >= 0
      && now - entry.timestamp <= maxAge
      && toCoins(entry.reference || entry.minimum) > 0
    );
    if (!snapshot) return null;
    return {
      price: toCoins(snapshot.reference || snapshot.minimum),
      updatedAt: snapshot.timestamp,
      sampleSize: toCoins(snapshot.count)
    };
  }

  function comparePriceSnapshots(current, previous) {
    const currentMedian = toCoins(current?.median);
    const previousMedian = toCoins(previous?.median);
    if (!currentMedian || !previousMedian) return { direction: "flat", change: 0, percent: 0 };
    const change = currentMedian - previousMedian;
    const percent = (change / previousMedian) * 100;
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
      change,
      percent
    };
  }

  function assessMarketSnapshot(snapshot) {
    const count = toCoins(snapshot?.count);
    const minimum = toCoins(snapshot?.minimum);
    const maximum = toCoins(snapshot?.maximum);
    const reference = toCoins(snapshot?.reference || snapshot?.median);
    if (!count || !minimum || !maximum || !reference) return { level: "weak", count, spreadPercent: 0 };
    const spreadPercent = reference > 0 && maximum >= minimum
      ? ((maximum - minimum) / reference) * 100
      : 0;
    const level = count >= 5 && spreadPercent <= 15
      ? "strong"
      : count >= 3 && spreadPercent <= 35
        ? "medium"
        : "weak";
    return { level, count, spreadPercent };
  }

  function buildLocalReport(source, now = Date.now()) {
    const safeArray = (value) => Array.isArray(value) ? value : [];
    const activity = source?.activity && typeof source.activity === "object" ? source.activity : {};
    return {
      schemaVersion: 1,
      generatedAt: new Date(now).toISOString(),
      activity: {
        searches: safeArray(activity.searches),
        matches: toCoins(activity.matches)
      },
      savedFilters: safeArray(source?.savedFilters),
      watchlist: safeArray(source?.watchlist),
      marketHistory: safeArray(source?.marketHistory)
    };
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  const api = { TAX_RATE, toCoins, calculateTrade, rateTrade, parseListingText, chooseBestListing, suggestPricing, scoreOpportunity, summarizeActivity, summarizePrices, latestObservedPrice, comparePriceSnapshots, assessMarketSnapshot, buildLocalReport, normalizeSearchText };
  root.FcMarket = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
