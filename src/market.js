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
    return { count: prices.length, minimum: prices[0], median, maximum: prices.at(-1) };
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

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  const api = { TAX_RATE, toCoins, calculateTrade, rateTrade, parseListingText, chooseBestListing, suggestPricing, scoreOpportunity, summarizeActivity, summarizePrices, comparePriceSnapshots, normalizeSearchText };
  root.FcMarket = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
