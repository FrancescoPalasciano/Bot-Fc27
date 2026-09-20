(function mountMarketCompanion() {
  "use strict";

  if (window.top !== window || document.querySelector("[data-fc27-root]")) return;

  const storage = chrome.storage.local;
  const defaults = { enabled: true, minimumProfit: 500, maximumBuy: 15000, watchlist: [] };
  const formatCoins = (value) => new Intl.NumberFormat("it-IT").format(value || 0);

  const shell = document.createElement("div");
  shell.dataset.fc27Root = "";
  shell.innerHTML = `
    <button class="fc27-launcher" type="button" aria-label="Apri FC27 Market Companion" aria-expanded="false">
      <span class="fc27-launcher-mark">27</span>
      <span class="fc27-launcher-label">MARKET</span>
    </button>
    <aside class="fc27-panel" aria-label="FC27 Market Companion" aria-hidden="true">
      <header class="fc27-header">
        <div>
          <p class="fc27-kicker">FC27 / MARKET DESK</p>
          <h1>Trade con più criterio.</h1>
        </div>
        <button class="fc27-icon-button" data-close type="button" aria-label="Chiudi">×</button>
      </header>

      <div class="fc27-notice" role="note">
        <span class="fc27-notice-dot"></span>
        Solo analisi. Acquisti e vendite restano manuali.
      </div>

      <form class="fc27-form" data-trade-form>
        <label class="fc27-field fc27-field-wide">
          <span>Giocatore</span>
          <input name="player" maxlength="60" placeholder="Es. Centrocampista 86" autocomplete="off">
        </label>
        <label class="fc27-field">
          <span>Prezzo acquisto</span>
          <input name="buyPrice" inputmode="numeric" placeholder="12.000" required>
        </label>
        <label class="fc27-field">
          <span>Vendita prevista</span>
          <input name="sellPrice" inputmode="numeric" placeholder="14.500" required>
        </label>
        <label class="fc27-field">
          <span>Quantità</span>
          <input name="quantity" inputmode="numeric" value="1" min="1">
        </label>
        <div class="fc27-field fc27-readonly">
          <span>Imposta EA</span>
          <strong>5%</strong>
        </div>
        <button class="fc27-primary" type="submit">Analizza operazione <span>→</span></button>
      </form>

      <section class="fc27-result" data-result hidden aria-live="polite">
        <div class="fc27-score-row">
          <div>
            <p class="fc27-eyebrow">UTILE NETTO</p>
            <strong class="fc27-profit" data-profit>0</strong>
          </div>
          <span class="fc27-status" data-status>—</span>
        </div>
        <div class="fc27-metrics">
          <div><span>Netto vendita</span><strong data-net>0</strong></div>
          <div><span>ROI</span><strong data-roi>0%</strong></div>
          <div><span>Totale</span><strong data-total>0</strong></div>
        </div>
        <button class="fc27-secondary" type="button" data-save>+ Salva in watchlist</button>
      </section>

      <section class="fc27-watch">
        <div class="fc27-section-title">
          <div>
            <p class="fc27-eyebrow">OSSERVATORIO</p>
            <h2>Watchlist</h2>
          </div>
          <span data-count>0 target</span>
        </div>
        <div class="fc27-empty" data-empty>
          <span>◎</span>
          <p>Nessun target salvato.</p>
          <small>Analizza un’operazione per iniziare.</small>
        </div>
        <ul class="fc27-list" data-list></ul>
      </section>

      <footer class="fc27-footer">
        <span><i></i> Dati solo su questo dispositivo</span>
        <button type="button" data-clear>Azzerare</button>
      </footer>
    </aside>
  `;

  document.documentElement.appendChild(shell);

  const launcher = shell.querySelector(".fc27-launcher");
  const panel = shell.querySelector(".fc27-panel");
  const form = shell.querySelector("[data-trade-form]");
  const resultBox = shell.querySelector("[data-result]");
  let currentTrade = null;
  let settings = { ...defaults };

  function setOpen(open) {
    shell.classList.toggle("fc27-is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) form.elements.player.focus();
  }

  function renderWatchlist() {
    const list = shell.querySelector("[data-list]");
    const empty = shell.querySelector("[data-empty]");
    const items = settings.watchlist || [];
    shell.querySelector("[data-count]").textContent = `${items.length} ${items.length === 1 ? "target" : "target"}`;
    empty.hidden = items.length > 0;
    list.innerHTML = "";

    items.forEach((item) => {
      const row = document.createElement("li");
      row.className = "fc27-watch-row";
      row.innerHTML = `
        <div class="fc27-avatar">${(item.player || "?").slice(0, 1).toUpperCase()}</div>
        <div class="fc27-watch-copy">
          <strong></strong>
          <span></span>
        </div>
        <strong class="fc27-watch-profit"></strong>
        <button type="button" aria-label="Rimuovi dalla watchlist">×</button>
      `;
      row.querySelector(".fc27-watch-copy strong").textContent = item.player || "Giocatore senza nome";
      row.querySelector(".fc27-watch-copy span").textContent = `${formatCoins(item.buyPrice)} → ${formatCoins(item.sellPrice)}`;
      row.querySelector(".fc27-watch-profit").textContent = `+${formatCoins(item.profitPerItem)}`;
      row.querySelector("button").addEventListener("click", async () => {
        settings.watchlist = items.filter((entry) => entry.id !== item.id);
        await storage.set({ watchlist: settings.watchlist });
        renderWatchlist();
      });
      list.appendChild(row);
    });
  }

  function renderResult(trade) {
    const rating = FcMarket.rateTrade(trade, settings.minimumProfit);
    const status = {
      good: ["Interessante", "good"],
      thin: ["Margine basso", "thin"],
      loss: ["In perdita", "loss"],
      incomplete: ["Dati incompleti", "thin"]
    }[rating];

    resultBox.hidden = false;
    resultBox.dataset.rating = status[1];
    resultBox.querySelector("[data-profit]").textContent = `${trade.profitPerItem >= 0 ? "+" : ""}${formatCoins(trade.profitPerItem)}`;
    resultBox.querySelector("[data-net]").textContent = formatCoins(trade.netSale);
    resultBox.querySelector("[data-roi]").textContent = `${trade.roi.toFixed(1)}%`;
    resultBox.querySelector("[data-total]").textContent = `${trade.totalProfit >= 0 ? "+" : ""}${formatCoins(trade.totalProfit)}`;
    resultBox.querySelector("[data-status]").textContent = status[0];
  }

  launcher.addEventListener("click", () => setOpen(!shell.classList.contains("fc27-is-open")));
  shell.querySelector("[data-close]").addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    currentTrade = {
      id: crypto.randomUUID(),
      player: String(data.get("player") || "").trim(),
      ...FcMarket.calculateTrade({
        buyPrice: data.get("buyPrice"),
        sellPrice: data.get("sellPrice"),
        quantity: data.get("quantity")
      })
    };
    renderResult(currentTrade);
  });

  shell.querySelector("[data-save]").addEventListener("click", async () => {
    if (!currentTrade) return;
    settings.watchlist = [currentTrade, ...(settings.watchlist || [])].slice(0, 20);
    await storage.set({ watchlist: settings.watchlist });
    renderWatchlist();
  });

  shell.querySelector("[data-clear]").addEventListener("click", async () => {
    settings.watchlist = [];
    await storage.set({ watchlist: [] });
    renderWatchlist();
  });

  storage.get(defaults).then((saved) => {
    settings = saved;
    shell.hidden = !settings.enabled;
    renderWatchlist();
  });

  chrome.storage.onChanged.addListener((changes) => {
    Object.entries(changes).forEach(([key, change]) => { settings[key] = change.newValue; });
    shell.hidden = !settings.enabled;
    renderWatchlist();
  });
})();
