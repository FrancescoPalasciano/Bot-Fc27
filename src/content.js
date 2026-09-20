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
        Lo Scout si ferma sempre prima dell’acquisto.
      </div>

      <section class="fc27-scout">
        <div class="fc27-section-title fc27-section-title--compact">
          <div>
            <p class="fc27-eyebrow">RICERCA ASSISTITA</p>
            <h2>Scout mercato</h2>
          </div>
          <span>1 ricerca</span>
        </div>
        <form class="fc27-scout-form" data-scout-form>
          <label class="fc27-field fc27-field-wide">
            <span>Nome esatto del giocatore</span>
            <input name="scoutPlayer" maxlength="60" placeholder="Es. Iago Aspas" autocomplete="off" required>
          </label>
          <label class="fc27-field">
            <span>Compra ora massimo</span>
            <input name="scoutMax" inputmode="numeric" placeholder="700" required>
          </label>
          <label class="fc27-field">
            <span>Rivendita prevista</span>
            <input name="scoutSell" inputmode="numeric" placeholder="1.000">
          </label>
          <button class="fc27-primary" type="submit" data-scout-start>Trova e apri l’offerta <span>↗</span></button>
          <button class="fc27-secondary fc27-scout-stop" type="button" data-scout-stop hidden>Ferma ricerca</button>
        </form>
        <div class="fc27-scout-status" data-scout-status role="status" aria-live="polite">
          <i></i><span>Pronto. Nessuna azione verrà confermata.</span>
        </div>
        <p class="fc27-risk">L’automazione può violare le regole EA anche senza acquisto automatico.</p>
      </section>

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
  const scoutForm = shell.querySelector("[data-scout-form]");
  const scoutStatus = shell.querySelector("[data-scout-status]");
  const resultBox = shell.querySelector("[data-result]");
  let currentTrade = null;
  let settings = { ...defaults };
  let scoutRun = 0;

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

  function updateScoutStatus(message, state = "working") {
    scoutStatus.dataset.state = state;
    scoutStatus.querySelector("span").textContent = message;
  }

  function waitFor(getValue, timeout = 5000, interval = 80, runId = scoutRun) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (runId !== scoutRun) return reject(new Error("Ricerca fermata"));
        const value = getValue();
        if (value) return resolve(value);
        if (Date.now() - started >= timeout) return reject(new Error("Elemento della Web App non trovato"));
        setTimeout(check, interval);
      };
      check();
    });
  }

  function setNativeValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, String(value));
    else input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function buttonByText(text) {
    return [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === text);
  }

  async function runScout({ playerName, maximumBuy, expectedSale }) {
    const runId = ++scoutRun;
    shell.querySelector("[data-scout-start]").disabled = true;
    shell.querySelector("[data-scout-stop]").hidden = false;
    document.querySelectorAll(".fc27-scout-match").forEach((node) => node.classList.remove("fc27-scout-match"));

    try {
      updateScoutStatus("Apro Trasferimenti…");
      const transferButton = await waitFor(() => document.querySelector("button.ut-tab-bar-item.icon-transfer"), 4000, 80, runId);
      transferButton.click();

      updateScoutStatus("Apro la ricerca mercato…");
      const searchMarket = await waitFor(() => [...document.querySelectorAll("h1")].find((node) => node.textContent.trim() === "Search the Transfer Market"), 5000, 80, runId);
      searchMarket.click();

      updateScoutStatus(`Cerco ${playerName}…`);
      const playerInput = await waitFor(() => document.querySelector('input[placeholder="Type Player Name"]'), 5000, 80, runId);
      setNativeValue(playerInput, playerName);
      playerInput.focus();

      const suggestion = await waitFor(() => {
        const candidates = [...document.querySelectorAll(".playerResultsList button")];
        return candidates.find((button) => button.textContent.toLocaleLowerCase().includes(playerName.toLocaleLowerCase())) || candidates[0];
      }, 5000, 80, runId);
      suggestion.click();

      const priceInputs = await waitFor(() => {
        const inputs = [...document.querySelectorAll("input.ut-number-input-control")];
        return inputs.length >= 6 ? inputs : null;
      }, 4000, 80, runId);
      setNativeValue(priceInputs.at(-1), maximumBuy);

      updateScoutStatus("Confronto le offerte visibili…");
      const searchButton = await waitFor(() => buttonByText("Search"), 3000, 80, runId);
      searchButton.click();

      const rows = await waitFor(() => {
        const items = [...document.querySelectorAll(".paginated-item-list .listFUTItem")];
        return items.length ? items : null;
      }, 7000, 100, runId);

      const listings = rows.map((element) => ({ element, ...FcMarket.parseListingText(element.innerText) }));
      const best = FcMarket.chooseBestListing(listings, maximumBuy);
      if (!best) throw new Error("Nessuna offerta con prezzo Compra ora leggibile");

      best.element.classList.add("fc27-scout-match");
      (best.element.querySelector(".rowContent") || best.element).click();
      best.element.scrollIntoView({ behavior: "smooth", block: "center" });

      if (expectedSale > 0) {
        currentTrade = {
          id: crypto.randomUUID(),
          player: playerName,
          ...FcMarket.calculateTrade({ buyPrice: best.buyNow, sellPrice: expectedSale, quantity: 1 })
        };
        renderResult(currentTrade);
      }

      const budgetCopy = best.withinBudget ? "entro il budget" : "oltre il budget";
      updateScoutStatus(`${playerName}: ${formatCoins(best.buyNow)} crediti, ${budgetCopy}. Acquista tu manualmente.`, best.withinBudget ? "success" : "warning");
      setTimeout(() => setOpen(false), 900);
    } catch (error) {
      if (runId === scoutRun) updateScoutStatus(error.message || "Ricerca non riuscita", "error");
    } finally {
      if (runId === scoutRun) {
        shell.querySelector("[data-scout-start]").disabled = false;
        shell.querySelector("[data-scout-stop]").hidden = true;
      }
    }
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

  scoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(scoutForm);
    const playerName = String(data.get("scoutPlayer") || "").trim();
    const maximumBuy = FcMarket.toCoins(data.get("scoutMax"));
    const expectedSale = FcMarket.toCoins(data.get("scoutSell"));
    if (!playerName || !maximumBuy) {
      updateScoutStatus("Inserisci giocatore e prezzo massimo.", "error");
      return;
    }
    runScout({ playerName, maximumBuy, expectedSale });
  });

  shell.querySelector("[data-scout-stop]").addEventListener("click", () => {
    scoutRun += 1;
    shell.querySelector("[data-scout-start]").disabled = false;
    shell.querySelector("[data-scout-stop]").hidden = true;
    updateScoutStatus("Ricerca fermata. Nessuna azione eseguita.", "warning");
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
