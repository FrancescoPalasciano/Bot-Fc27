# FC27 Market Companion

Estensione Chrome locale per valutare operazioni sul mercato di EA SPORTS FC Ultimate Team senza automatizzare acquisti o vendite.

## Funzioni disponibili

- pannello laterale integrato nella Web App;
- monitor assistito: apre Trasferimenti, seleziona il giocatore e ripete la ricerca ogni 15 secondi, fino a 20 tentativi;
- autocomplete locale basato su `data/players.json`, con nome, overall e ultimo prezzo FUTBIN disponibile;
- calcolo della tassa EA del 5%, utile netto, utile totale e ROI;
- prezzo massimo suggerito dal prezzo locale, con tassa e utile minimo inclusi;
- punteggio opportunità 0–100, filtri rapidi salvati e dashboard delle ricerche locali;
- contatori ultima ora/24 ore e numero di occasioni trovate;
- soglia di profitto configurabile;
- watchlist salvata soltanto in `chrome.storage.local`;
- nessun server, account, cookie o credenziale richiesti.

## Installazione locale

1. Apri `chrome://extensions` in Chrome oppure `opera://extensions` in Opera.
2. Attiva **Modalità sviluppatore**.
3. Seleziona **Carica estensione non pacchettizzata**.
4. Scegli questa cartella.
5. Apri o ricarica la Web App di FC Ultimate Team.

Dopo ogni aggiornamento del codice, torna nella pagina delle estensioni, premi **Ricarica** sulla scheda di FC27 Market Companion e poi ricarica la Web App.

Se il pannello mostra `0 carte FUTBIN`, verifica che la versione dell’estensione sia almeno `0.3.1`, premi **Ricarica** nella pagina delle estensioni e quindi aggiorna la scheda EA. Il catalogo JSON viene caricato soltanto all’avvio del content script.

## Monitor mercato

1. Apri **27 MARKET** e inserisci il nome del giocatore come appare nella Web App.
2. Imposta il prezzo massimo *Compra ora* e la rivendita prevista.
3. Premi **Analizza e monitora**.
4. Il monitor apre il mercato e ripete la ricerca ogni 15 secondi, per un massimo di 20 tentativi.
5. Quando trova una carta entro il budget, la seleziona e la evidenzia.
6. Controlla carta e prezzo, quindi decidi manualmente se acquistare.

Il monitor non preme **Compra ora** e non conferma transazioni. Puoi fermarlo in qualsiasi momento.

Le funzioni ispirate ai prodotti di trading automatico sono state implementate in forma assistita: pricing, punteggio, filtri, limiti e statistiche. Auto-acquisto, auto-vendita, auto-bid, aggiramento di CAPTCHA e simulazione “umana” non sono inclusi.

### Database giocatori

`data/players.json` contiene record provenienti dalle pagine pubbliche FUTBIN, con origine, data e copertura dichiarate. FUTBIN espone centinaia di pagine e blocca richieste automatizzate non-browser: il file iniziale è quindi un indice incrementale, non viene dichiarato completo e non aggira le protezioni del sito. I prezzi possono diventare rapidamente obsoleti e `0` significa “non disponibile”.

## Sviluppo

Non è necessario installare dipendenze.

```bash
npm test
npm run check
```

## Limiti intenzionali

EA vieta bot, auto-buyer e automazioni del mercato. Il monitor automatizza navigazione e ricerche, ma si ferma prima del pulsante di acquisto: ogni transazione resta manuale. L’uso può comunque comportare sanzioni secondo le regole EA. L’estensione non intercetta le API interne della Web App, non aggira CAPTCHA o limiti e non legge dati di autenticazione.

Consulta [docs/RESEARCH.md](docs/RESEARCH.md) per la ricerca iniziale e le scelte architetturali.

## Licenza

MIT
