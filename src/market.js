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
    const match = source.match(/Buy Now:\s*([\d.,]+)/i);
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

  const api = { TAX_RATE, toCoins, calculateTrade, rateTrade, parseListingText, chooseBestListing };
  root.FcMarket = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
