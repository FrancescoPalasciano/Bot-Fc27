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

      <form class="fc27-form" data-trade-form>
        <label class="fc27-field fc27-field-wide">
          <span>Giocatore</span>
          <input name="player" maxlength="60" placeholder="Es. Iago Aspas" autocomplete="off" aria-autocomplete="list" aria-controls="fc27-player-suggestions" aria-expanded="false" required>
          <small class="fc27-player-meta" data-player-meta>Caricamento indice giocatori…</small>
          <div class="fc27-player-suggestions" id="fc27-player-suggestions" data-player-suggestions role="listbox" hidden></div>
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
        <button class="fc27-primary" type="submit" data-scout-start>Analizza e monitora <span>→</span></button>
        <button class="fc27-secondary fc27-scout-stop" type="button" data-scout-stop hidden>Ferma monitor</button>
      </form>

      <div class="fc27-scout-status" data-scout-status role="status" aria-live="polite">
        <i></i><span>Pronto. Una ricerca ogni 15 secondi, massimo 20 tentativi.</span>
      </div>
      <p class="fc27-risk">Si ferma prima di Compra ora. L’automazione può comunque violare le regole EA.</p>

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
  const scoutStatus = shell.querySelector("[data-scout-status]");
  const resultBox = shell.querySelector("[data-result]");
  let currentTrade = null;
  let settings = { ...defaults };
  let scoutRun = 0;
  let playerIndex = [];
  let playerIndexState = "loading";
  const SEARCH_INTERVAL_MS = 15000;
  const MAX_ATTEMPTS = 20;

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

  function waitFor(getValue, timeout = 5000, interval = 80, runId = scoutRun, errorMessage = "Elemento della Web App non trovato") {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (runId !== scoutRun) return reject(new Error("Ricerca fermata"));
        const value = getValue();
        if (value) return resolve(value);
        if (Date.now() - started >= timeout) return reject(new Error(errorMessage));
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
    const wanted = text.toLocaleLowerCase();
    return [...document.querySelectorAll("button")].find((button) => button.textContent.trim().toLocaleLowerCase() === wanted);
  }

  function visibleText(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim().toLocaleLowerCase() || "";
  }

  function clickAction(node) {
    const target = node?.closest("button, [role='button'], .tile, .ut-tile, .rowContent") || node;
    if (!target) return false;
    target.scrollIntoView({ block: "center" });
    target.click();
    return true;
  }

  function transferNavigationButton() {
    return document.querySelector("button.ut-tab-bar-item.icon-transfer, button[class*='icon-transfer']")
      || [...document.querySelectorAll("button")].find((button) => /^(transfers|trasferimenti)$/i.test(button.textContent.trim()));
  }

  function marketSearchEntry() {
    const labels = [...document.querySelectorAll("h1, h2, h3, button, [role='button']")];
    return labels.find((node) => {
      const text = visibleText(node);
      return text === "search the transfer market" || text === "cerca nel mercato trasferimenti";
    });
  }

  async function waitBetweenSearches(runId, attempt) {
    const seconds = SEARCH_INTERVAL_MS / 1000;
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      if (runId !== scoutRun) throw new Error("Ricerca fermata");
      updateScoutStatus(`Tentativo ${attempt}/${MAX_ATTEMPTS}: nessuna offerta entro budget. Nuova ricerca tra ${remaining}s.`, "warning");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  function findHeading(...texts) {
    const wanted = texts.map((text) => text.toLocaleLowerCase());
    return [...document.querySelectorAll("h1, h2")].find((node) => wanted.includes(visibleText(node)));
  }

  async function returnToSearchForm(runId) {
    const heading = await waitFor(() => findHeading("Search Results", "Risultati di ricerca"), 7000, 80, runId, "La pagina dei risultati non è più riconoscibile");
    const header = heading.closest("header, .ut-navigation-container-view--header") || heading.parentElement;
    const backButton = header?.querySelector("button") || document.querySelector("button.ut-navigation-button-control");
    if (!backButton) throw new Error("Pulsante per ripetere la ricerca non trovato");
    clickAction(backButton);
    await waitFor(() => playerSearchInput(), 7000, 80, runId, "Non riesco a tornare ai filtri di ricerca");
  }

  function playerSearchInput() {
    return document.querySelector('input[placeholder="Type Player Name"], input[placeholder="Digita nome giocatore"]')
      || [...document.querySelectorAll("input[type='text'], input:not([type])")].find((input) => /player|giocatore/i.test(input.placeholder || ""));
  }

  function updatePlayerMeta(player) {
    const meta = shell.querySelector("[data-player-meta]");
    if (player) {
      meta.textContent = `OVR ${player.overall} · ${player.position} · FUTBIN ${player.price ? formatCoins(player.price) : "prezzo n/d"}`;
    } else if (playerIndexState === "ready") {
      meta.textContent = `${playerIndex.length} carte FUTBIN nel file locale`;
    } else if (playerIndexState === "error") {
      meta.textContent = "Indice giocatori non disponibile; ricarica l’estensione.";
    }
  }

  function renderPlayerSuggestions() {
    const input = form.elements.player;
    const list = shell.querySelector("[data-player-suggestions]");
    const query = input.value.trim().toLocaleLowerCase();
    const matches = query.length < 2 ? [] : playerIndex
      .filter((player) => `${player.name} ${player.fullName || ""}`.toLocaleLowerCase().includes(query))
      .slice(0, 8);

    list.replaceChildren();
    matches.forEach((player) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "option");
      button.innerHTML = `<strong></strong><span></span>`;
      button.querySelector("strong").textContent = player.name;
      button.querySelector("span").textContent = `OVR ${player.overall} · ${player.position} · ${player.price ? formatCoins(player.price) : "n/d"}`;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        input.value = player.name;
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        updatePlayerMeta(player);
        input.focus();
      });
      list.appendChild(button);
    });
    list.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(matches.length > 0));
  }

  async function loadPlayerIndex() {
    const meta = shell.querySelector("[data-player-meta]");
    try {
      const response = await fetch(chrome.runtime.getURL("data/players.json"));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      playerIndex = Array.isArray(data.players) ? data.players : [];
      if (!playerIndex.length) throw new Error("Il catalogo non contiene giocatori");
      playerIndexState = "ready";
      updatePlayerMeta();
    } catch (error) {
      playerIndexState = "error";
      console.warn("FC27 Market Companion: impossibile caricare data/players.json", error);
      updatePlayerMeta();
    }
  }

  async function runScout({ playerName, maximumBuy, expectedSale }) {
    const runId = ++scoutRun;
    shell.querySelector("[data-scout-start]").disabled = true;
    shell.querySelector("[data-scout-stop]").hidden = false;
    document.querySelectorAll(".fc27-scout-match").forEach((node) => node.classList.remove("fc27-scout-match"));

    try {
      if (!playerSearchInput()) {
        updateScoutStatus("Apro Trasferimenti…");
        const transferButton = await waitFor(() => transferNavigationButton(), 7000, 80, runId, "Menu Trasferimenti non trovato: apri la Web App completa e riprova");
        clickAction(transferButton);

        updateScoutStatus("Apro la ricerca mercato…");
        const searchMarket = await waitFor(() => marketSearchEntry() || playerSearchInput(), 10000, 100, runId, "Scheda ‘Cerca nel mercato’ non trovata dopo l’apertura di Trasferimenti");
        if (searchMarket.tagName !== "INPUT") clickAction(searchMarket);
      }

      updateScoutStatus(`Cerco ${playerName}…`);
      const playerInput = await waitFor(() => playerSearchInput(), 10000, 100, runId, "Campo nome giocatore non trovato nella ricerca mercato");
      setNativeValue(playerInput, playerName);
      playerInput.focus();

      const suggestion = await waitFor(() => {
        const candidates = [...document.querySelectorAll(".playerResultsList button")];
        return candidates.find((button) => button.textContent.toLocaleLowerCase().includes(playerName.toLocaleLowerCase())) || candidates[0];
      }, 7000, 80, runId, `La Web App non propone ${playerName}: seleziona una carta valida dall’autocompletamento`);
      clickAction(suggestion);

      const priceInputs = await waitFor(() => {
        const inputs = [...document.querySelectorAll("input.ut-number-input-control")];
        return inputs.length >= 6 ? inputs : null;
      }, 7000, 80, runId, "Campo Prezzo Compra ora massimo non trovato");
      setNativeValue(priceInputs.at(-1), maximumBuy);

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        updateScoutStatus(`Tentativo ${attempt}/${MAX_ATTEMPTS}: cerco offerte…`);
        const searchButton = await waitFor(() => buttonByText("Search") || buttonByText("Cerca"), 5000, 80, runId, "Pulsante Cerca non trovato");
        clickAction(searchButton);
        await waitFor(() => findHeading("Search Results", "Risultati di ricerca"), 10000, 100, runId, "La ricerca non ha aperto la pagina dei risultati");

        const rows = [...document.querySelectorAll(".paginated-item-list .listFUTItem")];
        const listings = rows.map((element) => ({ element, ...FcMarket.parseListingText(element.innerText) }));
        const best = FcMarket.chooseBestListing(listings, maximumBuy);

        if (best?.withinBudget) {
          best.element.classList.add("fc27-scout-match");
          (best.element.querySelector(".rowContent") || best.element).click();
          best.element.scrollIntoView({ behavior: "smooth", block: "center" });

          currentTrade = {
            id: crypto.randomUUID(),
            player: playerName,
            ...FcMarket.calculateTrade({ buyPrice: best.buyNow, sellPrice: expectedSale, quantity: 1 })
          };
          renderResult(currentTrade);
          updateScoutStatus(`${playerName} trovato a ${formatCoins(best.buyNow)} crediti. Verifica e acquista manualmente.`, "success");
          setTimeout(() => setOpen(false), 900);
          return;
        }

        if (attempt === MAX_ATTEMPTS) break;
        await waitBetweenSearches(runId, attempt);
        await returnToSearchForm(runId);
      }

      updateScoutStatus(`Nessuna offerta entro ${formatCoins(maximumBuy)} crediti dopo ${MAX_ATTEMPTS} tentativi.`, "warning");
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
    const playerName = currentTrade.player;
    const maximumBuy = currentTrade.buyPrice;
    const expectedSale = currentTrade.sellPrice;
    if (!playerName || !maximumBuy) {
      updateScoutStatus("Inserisci giocatore e prezzo massimo.", "error");
      return;
    }
    runScout({ playerName, maximumBuy, expectedSale });
  });

  form.elements.player.addEventListener("input", () => {
    const value = form.elements.player.value.trim().toLocaleLowerCase();
    const player = playerIndex.find((entry) => entry.name.toLocaleLowerCase() === value);
    updatePlayerMeta(player);
    renderPlayerSuggestions();
  });

  form.elements.player.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      shell.querySelector("[data-player-suggestions]").hidden = true;
      form.elements.player.setAttribute("aria-expanded", "false");
    }
  });

  form.elements.player.addEventListener("blur", () => {
    setTimeout(() => {
      shell.querySelector("[data-player-suggestions]").hidden = true;
      form.elements.player.setAttribute("aria-expanded", "false");
    }, 120);
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

  loadPlayerIndex();

  chrome.storage.onChanged.addListener((changes) => {
    Object.entries(changes).forEach(([key, change]) => { settings[key] = change.newValue; });
    shell.hidden = !settings.enabled;
    renderWatchlist();
  });
})();
