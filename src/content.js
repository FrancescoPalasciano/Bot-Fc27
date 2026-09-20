(function mountMarketCompanion() {
  "use strict";

  if (window.top !== window || document.querySelector("[data-fc27-root]")) return;

  const storage = chrome.storage.local;
  const defaults = { enabled: true, minimumProfit: 500, maximumBuy: 15000, watchlist: [], savedFilters: [], marketHistory: [], activity: { searches: [], matches: 0 } };
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

      <section class="fc27-dashboard" aria-label="Riepilogo locale">
        <div><span>ULTIMA ORA</span><strong data-searches-hour>0</strong><small>ricerche</small></div>
        <div><span>24 ORE</span><strong data-searches-day>0</strong><small>ricerche</small></div>
        <div><span>TROVATI</span><strong data-matches>0</strong><small>occasioni</small></div>
      </section>

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
        <div class="fc27-quick-actions">
          <button type="button" data-auto-price>Usa prezzo locale</button>
          <button type="button" data-filter-save>Salva filtro</button>
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
          <div class="fc27-score-badges"><span class="fc27-opportunity" data-score>0/100</span><span class="fc27-status" data-status>—</span></div>
        </div>
        <div class="fc27-metrics">
          <div><span>Netto vendita</span><strong data-net>0</strong></div>
          <div><span>ROI</span><strong data-roi>0%</strong></div>
          <div><span>Totale</span><strong data-total>0</strong></div>
        </div>
        <button class="fc27-secondary" type="button" data-save>+ Salva in watchlist</button>
      </section>

      <section class="fc27-market-observed" aria-label="Mercato osservato">
        <div class="fc27-section-title">
          <h2>Mercato osservato</h2>
          <span data-market-count>0 rilevazioni</span>
        </div>
        <div class="fc27-market-empty" data-market-empty>
          <p>Nessun prezzo osservato.</p>
          <small>Le rilevazioni compaiono dopo una ricerca con risultati visibili.</small>
        </div>
        <div class="fc27-market-summary" data-market-summary hidden>
          <div class="fc27-market-heading">
            <strong data-market-player>—</strong>
            <span data-market-time>—</span>
          </div>
          <dl class="fc27-market-metrics">
            <div><dt>Minimo</dt><dd data-market-min>0</dd></div>
            <div><dt>Mediana</dt><dd data-market-median>0</dd></div>
            <div><dt>Massimo</dt><dd data-market-max>0</dd></div>
          </dl>
          <div class="fc27-market-trend" data-market-trend>
            <span data-market-direction>Prima rilevazione</span>
            <strong data-market-change>—</strong>
          </div>
          <button class="fc27-market-clear" type="button" data-market-clear>Elimina storico prezzi</button>
        </div>
      </section>

      <section class="fc27-filters">
        <div class="fc27-section-title">
          <div><p class="fc27-eyebrow">FILTRI RAPIDI</p><h2>Salvati</h2></div>
          <span data-filter-count>0 filtri</span>
        </div>
        <div class="fc27-filter-list" data-filter-list><small>Nessun filtro salvato.</small></div>
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
    resultBox.querySelector("[data-score]").textContent = `${FcMarket.scoreOpportunity(trade, settings.minimumProfit)}/100`;
  }

  function activityData() {
    const activity = settings.activity && typeof settings.activity === "object" ? settings.activity : {};
    return { searches: Array.isArray(activity.searches) ? activity.searches : [], matches: Number(activity.matches) || 0 };
  }

  function renderDashboard() {
    const activity = activityData();
    const summary = FcMarket.summarizeActivity(activity.searches);
    shell.querySelector("[data-searches-hour]").textContent = summary.lastHour;
    shell.querySelector("[data-searches-day]").textContent = summary.lastDay;
    shell.querySelector("[data-matches]").textContent = activity.matches;
  }

  function marketHistory() {
    return Array.isArray(settings.marketHistory) ? settings.marketHistory : [];
  }

  function renderMarketInsights(playerName = form.elements.player.value.trim()) {
    const allSnapshots = marketHistory();
    const normalizedPlayer = FcMarket.normalizeSearchText(playerName);
    const snapshots = normalizedPlayer
      ? allSnapshots.filter((entry) => FcMarket.normalizeSearchText(entry.player) === normalizedPlayer)
      : allSnapshots;
    const latest = snapshots[0];
    const previous = snapshots[1];
    const empty = shell.querySelector("[data-market-empty]");
    const summary = shell.querySelector("[data-market-summary]");
    shell.querySelector("[data-market-count]").textContent = `${snapshots.length} ${snapshots.length === 1 ? "rilevazione" : "rilevazioni"}`;
    empty.hidden = Boolean(latest);
    summary.hidden = !latest;
    if (!latest) return;

    const trend = FcMarket.comparePriceSnapshots(latest, previous);
    const trendLabels = { up: "Mediana in aumento", down: "Mediana in calo", flat: previous ? "Mediana stabile" : "Prima rilevazione" };
    summary.dataset.trend = trend.direction;
    shell.querySelector("[data-market-player]").textContent = latest.player;
    shell.querySelector("[data-market-time]").textContent = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(latest.timestamp);
    shell.querySelector("[data-market-min]").textContent = formatCoins(latest.minimum);
    shell.querySelector("[data-market-median]").textContent = formatCoins(latest.median);
    shell.querySelector("[data-market-max]").textContent = formatCoins(latest.maximum);
    shell.querySelector("[data-market-direction]").textContent = trendLabels[trend.direction];
    shell.querySelector("[data-market-change]").textContent = previous
      ? `${trend.change > 0 ? "+" : ""}${formatCoins(trend.change)} · ${trend.percent > 0 ? "+" : ""}${trend.percent.toFixed(1)}%`
      : `${latest.count} ${latest.count === 1 ? "offerta" : "offerte"}`;
  }

  async function recordMarketSnapshot(player, listings) {
    const priceSummary = FcMarket.summarizePrices(listings.map((listing) => listing.buyNow));
    if (!priceSummary) return;
    const snapshot = { id: crypto.randomUUID(), player, timestamp: Date.now(), ...priceSummary };
    settings.marketHistory = [snapshot, ...marketHistory()].slice(0, 120);
    await storage.set({ marketHistory: settings.marketHistory });
    renderMarketInsights(player);
  }

  async function recordActivity(kind) {
    const activity = activityData();
    if (kind === "search") activity.searches = [...activity.searches.filter((timestamp) => Date.now() - timestamp < 24 * 60 * 60 * 1000), Date.now()];
    if (kind === "match") activity.matches += 1;
    settings.activity = activity;
    await storage.set({ activity });
    renderDashboard();
  }

  function renderSavedFilters() {
    const list = shell.querySelector("[data-filter-list]");
    const filters = Array.isArray(settings.savedFilters) ? settings.savedFilters : [];
    shell.querySelector("[data-filter-count]").textContent = `${filters.length} ${filters.length === 1 ? "filtro" : "filtri"}`;
    list.replaceChildren();
    if (!filters.length) {
      const empty = document.createElement("small");
      empty.textContent = "Nessun filtro salvato.";
      list.appendChild(empty);
      return;
    }
    filters.forEach((filter) => {
      const row = document.createElement("div");
      row.className = "fc27-filter-chip";
      row.innerHTML = `<button type="button" data-load><strong></strong><span></span></button><button type="button" data-remove aria-label="Rimuovi filtro">×</button>`;
      row.querySelector("strong").textContent = filter.player;
      row.querySelector("span").textContent = `≤ ${formatCoins(filter.buyPrice)} · vendita ${formatCoins(filter.sellPrice)}`;
      row.querySelector("[data-load]").addEventListener("click", () => {
        form.elements.player.value = filter.player;
        form.elements.buyPrice.value = formatCoins(filter.buyPrice);
        form.elements.sellPrice.value = formatCoins(filter.sellPrice);
        updatePlayerMeta(playerIndex.find((player) => player.name === filter.player));
      });
      row.querySelector("[data-remove]").addEventListener("click", async () => {
        settings.savedFilters = filters.filter((entry) => entry.id !== filter.id);
        await storage.set({ savedFilters: settings.savedFilters });
        renderSavedFilters();
      });
      list.appendChild(row);
    });
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

  function visibleText(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim().toLocaleLowerCase() || "";
  }

  function isElementVisible(node) {
    if (!node || node.closest("[data-fc27-root]")) return false;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function marketSearchButton() {
    return [...document.querySelectorAll("button")].find((button) =>
      /^(search|cerca)$/i.test(button.textContent.trim())
      && isElementVisible(button)
      && !button.disabled
      && button.getAttribute("aria-disabled") !== "true"
    );
  }

  function clickAction(node) {
    const target = node?.closest("button, [role='button'], .tile, .ut-tile, .rowContent") || node;
    if (!target) return false;
    target.scrollIntoView({ block: "center" });
    target.click();
    return true;
  }

  function pressAction(node) {
    const target = node?.closest("button, [role='button']") || node;
    if (!target) return false;
    target.scrollIntoView({ block: "center" });
    target.focus({ preventScroll: true });
    ["pointerdown", "mousedown", "pointerup", "mouseup"].forEach((type) => {
      const EventType = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      target.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
    });
    target.click();
    return true;
  }

  function activatePlayerSuggestion(node) {
    const target = node?.closest("button") || node;
    if (!target) return false;
    target.scrollIntoView({ block: "nearest" });
    target.focus({ preventScroll: true });
    ["pointerdown", "mousedown", "pointerup", "mouseup"].forEach((type) => {
      const EventType = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
      target.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
    });
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
    return [...document.querySelectorAll("h1, h2, h3")].find((node) =>
      isElementVisible(node) && wanted.some((text) => visibleText(node).includes(text))
    );
  }

  function marketResultsState() {
    const heading = findHeading("Search Results", "Risultati di ricerca", "Transfer Market Results", "Risultati mercato");
    const visibleRow = [...document.querySelectorAll(".paginated-item-list .listFUTItem")].find(isElementVisible);
    const visibleList = [...document.querySelectorAll(".paginated-item-list")].find(isElementVisible);
    const emptyResult = [...document.querySelectorAll("h1, h2, h3, p, span")].find((node) =>
      isElementVisible(node) && /^(no results found|no items found|nessun risultato|nessun oggetto trovato)$/i.test(node.textContent.trim())
    );
    return heading || visibleRow || visibleList || emptyResult || null;
  }

  async function returnToSearchForm(runId) {
    const resultMarker = await waitFor(() => marketResultsState(), 7000, 80, runId, "La pagina dei risultati non è più riconoscibile");
    const resultView = resultMarker.closest(".ut-navigation-container-view") || document;
    const backButton = [...resultView.querySelectorAll("button.ut-navigation-button-control, header button")].find(isElementVisible)
      || [...document.querySelectorAll("button.ut-navigation-button-control")].find(isElementVisible);
    if (!backButton) throw new Error("Pulsante per ripetere la ricerca non trovato");
    pressAction(backButton);
    await waitFor(() => playerSearchInput(), 7000, 80, runId, "Non riesco a tornare ai filtri di ricerca");
  }

  function playerSearchInput() {
    return [...document.querySelectorAll('input[placeholder="Type Player Name"], input[placeholder="Digita nome giocatore"], input[type="text"], input:not([type])')]
      .find((input) => isElementVisible(input) && /player|giocatore/i.test(input.placeholder || ""));
  }

  function visibleMarketListings(runId) {
    return waitFor(() => {
      const rows = [...document.querySelectorAll(".paginated-item-list .listFUTItem")];
      if (rows.length) return rows.map((element) => ({ element, ...FcMarket.parseListingText(element.innerText) }));
      const emptyResult = [...document.querySelectorAll("h1, h2, h3, p, span")]
        .some((node) => isElementVisible(node) && /^(no results found|no items found|nessun risultato|nessun oggetto trovato)$/i.test(node.textContent.trim()));
      return emptyResult ? [] : null;
    }, 6000, 100, runId, "I risultati non sono stati caricati dalla Web App");
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
        const query = FcMarket.normalizeSearchText(playerName);
        return candidates.find((button) => FcMarket.normalizeSearchText(button.querySelector(".btn-text")?.textContent || button.textContent).includes(query)) || candidates[0];
      }, 7000, 80, runId, `La Web App non propone ${playerName}: seleziona una carta valida dall’autocompletamento`);
      const selectedPlayerName = suggestion.querySelector(".btn-text")?.textContent?.trim() || playerName;
      let playerConfirmed = false;
      for (let selectionAttempt = 0; selectionAttempt < 3 && !playerConfirmed; selectionAttempt += 1) {
        const currentSuggestion = [...document.querySelectorAll(".playerResultsList button")]
          .find((button) => FcMarket.normalizeSearchText(button.querySelector(".btn-text")?.textContent || button.textContent) === FcMarket.normalizeSearchText(selectedPlayerName));
        activatePlayerSuggestion(currentSuggestion || suggestion);
        try {
          await waitFor(() => {
            const confirmedName = FcMarket.normalizeSearchText(playerInput.value) === FcMarket.normalizeSearchText(selectedPlayerName);
            const openChoices = document.querySelectorAll(".playerResultsList button").length;
            return confirmedName && openChoices === 0 ? playerInput : null;
          }, 1400, 80, runId, "");
          playerConfirmed = true;
        } catch (error) {
          if (runId !== scoutRun) throw error;
        }
      }
      const matchingTypedName = FcMarket.normalizeSearchText(playerInput.value) === FcMarket.normalizeSearchText(selectedPlayerName);
      if (!playerConfirmed && !matchingTypedName) throw new Error(`La Web App non ha selezionato la carta ${selectedPlayerName}`);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const priceInputs = await waitFor(() => {
        const inputs = [...document.querySelectorAll("input.ut-number-input-control")].filter(isElementVisible);
        return inputs.length >= 6 ? inputs : null;
      }, 7000, 80, runId, "Campo Prezzo Compra ora massimo non trovato");
      setNativeValue(priceInputs.at(-1), maximumBuy);

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        updateScoutStatus(`Tentativo ${attempt}/${MAX_ATTEMPTS}: cerco offerte…`);
        const searchButton = await waitFor(() => marketSearchButton(), 7000, 80, runId, "Il pulsante Cerca è assente o disabilitato: controlla i filtri della Web App");
        pressAction(searchButton);
        await recordActivity("search");
        await waitFor(() => marketResultsState(), 12000, 100, runId, "Il clic su Cerca non è stato accettato dalla Web App: verifica giocatore e prezzo massimo");

        const listings = await visibleMarketListings(runId);
        await recordMarketSnapshot(playerName, listings);
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
          await recordActivity("match");
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
    renderMarketInsights(form.elements.player.value.trim());
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

  shell.querySelector("[data-auto-price]").addEventListener("click", () => {
    const name = form.elements.player.value.trim().toLocaleLowerCase();
    const player = playerIndex.find((entry) => entry.name.toLocaleLowerCase() === name);
    if (!player?.price) {
      updateScoutStatus("Seleziona una carta con prezzo locale disponibile.", "warning");
      return;
    }
    const pricing = FcMarket.suggestPricing(player.price, settings.minimumProfit, "recommended");
    form.elements.buyPrice.value = formatCoins(pricing.maximumBuy);
    form.elements.sellPrice.value = formatCoins(pricing.sellPrice);
    updateScoutStatus(`Prezzi suggeriti da FUTBIN locale: compra fino a ${formatCoins(pricing.maximumBuy)}, vendita ${formatCoins(pricing.sellPrice)}. Verifica sempre sul mercato.`, "success");
  });

  shell.querySelector("[data-filter-save]").addEventListener("click", async () => {
    const player = form.elements.player.value.trim();
    const buyPrice = FcMarket.toCoins(form.elements.buyPrice.value);
    const sellPrice = FcMarket.toCoins(form.elements.sellPrice.value);
    if (!player || !buyPrice || !sellPrice) {
      updateScoutStatus("Completa giocatore, acquisto e vendita prima di salvare il filtro.", "warning");
      return;
    }
    const savedFilter = { id: crypto.randomUUID(), player, buyPrice, sellPrice };
    const previous = Array.isArray(settings.savedFilters) ? settings.savedFilters : [];
    settings.savedFilters = [savedFilter, ...previous.filter((entry) => entry.player.toLocaleLowerCase() !== player.toLocaleLowerCase())].slice(0, 12);
    await storage.set({ savedFilters: settings.savedFilters });
    renderSavedFilters();
    updateScoutStatus(`Filtro ${player} salvato sul dispositivo.`, "success");
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

  shell.querySelector("[data-market-clear]").addEventListener("click", async () => {
    settings.marketHistory = [];
    await storage.set({ marketHistory: [] });
    renderMarketInsights();
    updateScoutStatus("Storico prezzi eliminato dal dispositivo.", "success");
  });

  storage.get(defaults).then((saved) => {
    settings = saved;
    shell.hidden = !settings.enabled;
    renderWatchlist();
    renderSavedFilters();
    renderDashboard();
    renderMarketInsights();
  });

  loadPlayerIndex();

  chrome.storage.onChanged.addListener((changes) => {
    Object.entries(changes).forEach(([key, change]) => { settings[key] = change.newValue; });
    shell.hidden = !settings.enabled;
    renderWatchlist();
    renderSavedFilters();
    renderDashboard();
    renderMarketInsights();
  });
})();
