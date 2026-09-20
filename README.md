# FC27 Market Companion

Estensione Chrome locale per valutare operazioni sul mercato di EA SPORTS FC Ultimate Team senza automatizzare acquisti o vendite.

## Funzioni disponibili

- pannello laterale integrato nella Web App;
- monitor assistito: apre Trasferimenti, seleziona il giocatore e ripete la ricerca ogni 2 secondi, fino a 20 tentativi;
- rilevazione iniziale senza prezzo obbligatorio: legge le offerte visibili e compila acquisto e vendita consigliati senza selezionare una carta;
- autocomplete locale basato su `data/players.json`, con nome, overall e prezzo EA osservato di recente quando disponibile;
- 544 giocatori base Serie A (Oro e Argento) raccolti dal filtro pubblico FUTBIN della lega;
- calcolo della tassa EA del 5%, utile netto, utile totale e ROI;
- prezzo massimo suggerito dal prezzo locale, con tassa e utile minimo inclusi;
- punteggio opportunità 0–100, filtri rapidi salvati e dashboard delle ricerche locali;
- contatori ultima ora/24 ore e numero di occasioni trovate;
- storico locale dei prezzi mostrati nei risultati, con minimo, mediana, massimo e confronto con la rilevazione precedente;
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

La versione `0.6.1` riconosce il pulsante **Cerca** soltanto quando è visibile e abilitato, invia la sequenza completa di interazione e rileva la pagina risultati anche quando il titolo usato dalla Web App cambia.

Se il pannello mostra `0 carte FUTBIN`, verifica che la versione dell’estensione sia almeno `0.3.1`, premi **Ricarica** nella pagina delle estensioni e quindi aggiorna la scheda EA. Il catalogo JSON viene caricato soltanto all’avvio del content script.

## Monitor mercato

1. Apri **27 MARKET** e inserisci il nome del giocatore come appare nella Web App.
2. Imposta il prezzo massimo *Compra ora* e la rivendita prevista.
3. Premi **Analizza e monitora**.
4. Il monitor apre il mercato e ripete la ricerca ogni 2 secondi, per un massimo di 20 tentativi.
5. Quando trova una carta entro il budget, la seleziona e la evidenzia.
6. Controlla carta e prezzo, quindi decidi manualmente se acquistare.

Il monitor non preme **Compra ora** e non conferma transazioni. Puoi fermarlo in qualsiasi momento.

Per rilevare il prezzo di un giocatore nuovo, lascia vuoti **Prezzo acquisto** e **Vendita prevista**, quindi premi **Analizza e monitora**. La prima pagina con offerte viene usata soltanto per calcolare il riferimento locale; l’estensione compila i due prezzi consigliati e si ferma senza selezionare alcuna carta. Premi nuovamente il pulsante per avviare il monitor con quei valori.

Le funzioni ispirate ai prodotti di trading automatico sono state implementate in forma assistita: pricing, punteggio, filtri, limiti e statistiche. Auto-acquisto, auto-vendita, auto-bid, aggiramento di CAPTCHA e simulazione “umana” non sono inclusi.

### Mercato osservato

Quando una pagina di risultati contiene offerte, l’estensione salva un riepilogo locale dei prezzi visibili. Nel pannello **Mercato osservato** trovi minimo, mediana, massimo e variazione rispetto alla rilevazione precedente dello stesso giocatore. Lo storico conserva al massimo 120 rilevazioni in `chrome.storage.local` e può essere eliminato dal pannello.

### Database giocatori

`data/players.json` contiene identità e metadati provenienti dalle pagine pubbliche FUTBIN, con origine, data e copertura dichiarate. Include il catalogo base Serie A disponibile nel filtro lega 31 al momento della raccolta; il catalogo generale resta incrementale e non viene dichiarato completo.

I prezzi statici FUTBIN sono disattivati (`price: 0`) perché la pagina non offre un’API pubblica documentata e l’accesso HTTP automatizzato viene bloccato. Durante l’uso, l’estensione salva invece le offerte *Compra ora* realmente visibili nella Web App EA. Il prezzo locale di riferimento è la mediana delle tre offerte più economiche visibili, scade dopo 6 ore ed è memorizzato soltanto in `chrome.storage.local`.

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
