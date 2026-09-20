# FC27 Market Companion

Estensione Chrome locale per valutare operazioni sul mercato di EA SPORTS FC Ultimate Team senza automatizzare acquisti o vendite.

## Funzioni disponibili

- pannello laterale integrato nella Web App;
- Scout a ricerca singola: apre Trasferimenti, seleziona il giocatore, confronta i risultati visibili ed evidenzia l’offerta più economica;
- calcolo della tassa EA del 5%, utile netto, utile totale e ROI;
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

## Scout mercato

1. Apri **27 MARKET** e inserisci il nome del giocatore come appare nella Web App.
2. Imposta il prezzo massimo *Compra ora* e, facoltativamente, la rivendita prevista.
3. Premi **Trova e apri l’offerta**.
4. Lo Scout apre il mercato, esegue una sola ricerca ed evidenzia l’offerta più economica visibile.
5. Controlla carta e prezzo, quindi decidi manualmente se acquistare.

Lo Scout non ripete ricerche in ciclo, non preme **Compra ora** e non conferma transazioni.

## Sviluppo

Non è necessario installare dipendenze.

```bash
npm test
npm run check
```

## Limiti intenzionali

EA vieta bot, auto-buyer e automazioni del mercato. Lo Scout automatizza una singola navigazione e ricerca, ma si ferma prima del pulsante di acquisto: ogni transazione resta manuale. L’uso può comunque comportare sanzioni secondo le regole EA. L’estensione non intercetta le API interne della Web App, non aggira CAPTCHA o limiti e non legge dati di autenticazione.

Consulta [docs/RESEARCH.md](docs/RESEARCH.md) per la ricerca iniziale e le scelte architetturali.

## Licenza

MIT
