# FC27 Market Companion

Estensione Chrome locale per valutare operazioni sul mercato di EA SPORTS FC Ultimate Team senza automatizzare acquisti o vendite.

## Funzioni disponibili

- pannello laterale integrato nella Web App;
- calcolo della tassa EA del 5%, utile netto, utile totale e ROI;
- soglia di profitto configurabile;
- watchlist salvata soltanto in `chrome.storage.local`;
- nessun server, account, cookie o credenziale richiesti.

## Installazione locale

1. Apri `chrome://extensions`.
2. Attiva **Modalità sviluppatore**.
3. Seleziona **Carica estensione non pacchettizzata**.
4. Scegli questa cartella.
5. Apri o ricarica la Web App di FC Ultimate Team.

## Sviluppo

Non è necessario installare dipendenze.

```bash
npm test
npm run check
```

## Limiti intenzionali

EA vieta bot, auto-buyer e automazioni del mercato. Questa estensione è un supporto decisionale: ogni transazione resta manuale. Non intercetta le API interne della Web App, non aggira CAPTCHA o limiti e non legge dati di autenticazione.

Consulta [docs/RESEARCH.md](docs/RESEARCH.md) per la ricerca iniziale e le scelte architetturali.

## Licenza

MIT
