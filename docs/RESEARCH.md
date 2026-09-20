# Ricerca iniziale

Ricerca effettuata il 20 settembre 2026.

## Progetti osservati

- **AutoPilot-SBC**: estensione browser con controlli inseriti direttamente nella Web App e flussi configurabili.
- **sbc-repeater**: estensione Manifest V3 minimale con pannello flottante e script di contenuto.
- **fc26-copilot**: integrazione più invasiva che intercetta API interne; non adottata in questo progetto.
- **FIFA-Autobidder / FIFA-Autobuyer**: progetti Selenium e automazione click; non adottati perché contrari alle regole EA.

## Decisioni

Il progetto usa Manifest V3, un content script in ambiente isolato e `chrome.storage.local`. La prima versione è volutamente un assistente: calcola tassa, profitto e ROI, salva una watchlist e non esegue transazioni.

Il database pubblico FUTBIN FC27 osservato il 20 settembre 2026 contiene 757 pagine. L’accesso HTTP automatizzato restituisce `403`, mentre le pagine pubbliche funzionano normalmente nel browser. Per non aggirare protezioni né eseguire centinaia di richieste, `data/players.json` dichiara esplicitamente la propria copertura incrementale. L’autocomplete continua a funzionare anche con un indice parziale e accetta sempre testo libero.

FUTBIN presenta i prezzi come dati live nella propria lista mercato, ma non pubblica un’API documentata utilizzabile dall’estensione. I valori precedentemente estratti dalle pagine giocatori mescolavano carte e colonne di piattaforme differenti. Dalla versione 0.7.0 il file JSON conserva soltanto identità e metadati: il prezzo runtime deriva dalle offerte visibili della Web App EA, usa la mediana delle tre più economiche per ridurre gli outlier e scade dopo 6 ore.

## Vincoli

EA vieta espressamente bot, auto-buyer e automazioni del mercato trasferimenti. Per questo la roadmap esclude click automatici, aggiramento di CAPTCHA, intercettazione di sessioni, cookie o credenziali.

## Fonti

- https://help.ea.com/en/articles/ea-sports-fc/fc-rules/
- https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts
- https://developer.chrome.com/docs/extensions/reference/api/storage
- https://github.com/icysymmetra/AutoPilot-SBC
- https://github.com/Jijoaj/sbc-repeater
- https://github.com/Eng-Abdelrahman-Mostafa/fc26-copilot
