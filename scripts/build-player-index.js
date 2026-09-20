"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const databasePath = path.join(root, "data", "players.json");
const serieAPath = path.join(root, "data", "serie-a.tsv");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));

function priceText(price) {
  if (!price) return "0";
  if (price >= 1000000) return `${Number((price / 1000000).toFixed(2))}M`;
  if (price >= 1000) return `${Number((price / 1000).toFixed(2))}K`;
  return String(price);
}

const serieAPlayers = fs.readFileSync(serieAPath, "utf8").trim().split(/\r?\n/).map((line) => {
  const [name, overall, position, price] = line.split("\t");
  const numericPrice = Number(price) || 0;
  return {
    name,
    fullName: name,
    overall: Number(overall),
    position,
    price: numericPrice,
    priceText: priceText(numericPrice),
    url: "https://www.futbin.com/27/players?league=31",
    league: "Serie A",
    cardTier: Number(overall) >= 75 ? "gold" : "silver",
    sourceScope: "serie-a-base"
  };
});

const retainedPlayers = database.players.filter((player) => player.sourceScope !== "serie-a-base");
database.updatedAt = "2026-09-20T00:00:00+02:00";
database.collections = {
  ...(database.collections || {}),
  serieA: {
    leagueId: 31,
    versions: ["gold", "silver", "bronze"],
    uniquePlayers: serieAPlayers.length,
    pagesObserved: { gold: 9, silver: 12, bronze: 1 },
    sourceUrl: "https://www.futbin.com/27/players?league=31",
    completeAtCollectionTime: true
  }
};
database.notes = "Indice incrementale: prima pagina generale e carte base Serie A filtrate su FUTBIN. price=0 significa prezzo non disponibile al momento della lettura.";
database.players = [...retainedPlayers, ...serieAPlayers];

fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Indice scritto: ${database.players.length} carte, incluse ${serieAPlayers.length} Serie A.`);
