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

  const api = { TAX_RATE, toCoins, calculateTrade, rateTrade };
  root.FcMarket = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
