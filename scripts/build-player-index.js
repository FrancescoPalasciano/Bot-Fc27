"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const databasePath = path.join(root, "data", "players.json");
const serieAPath = path.join(root, "data", "serie-a.tsv");
const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));

const serieAPlayers = fs.readFileSync(serieAPath, "utf8").trim().split(/\r?\n/).map((line) => {
  const [name, overall, position] = line.split("\t");
  return {
    name,
    fullName: name,
    overall: Number(overall),
    position,
    price: 0,
    priceText: "n/d",
    url: "https://www.futbin.com/27/players?league=31",
    league: "Serie A",
    cardTier: Number(overall) >= 75 ? "gold" : "silver",
    sourceScope: "serie-a-base"
  };
});

const retainedPlayers = database.players.filter((player) => player.sourceScope !== "serie-a-base");
database.updatedAt = "2026-09-20T00:00:00+02:00";
database.pricesUpdatedAt = null;
database.priceStrategy = {
  bundledPrices: false,
  runtimeSource: "ea-web-app-visible-results",
  maximumAgeHours: 6,
  referenceMethod: "median-of-three-lowest-visible-buy-now-prices"
};
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
database.notes = "FUTBIN è usato soltanto per identità e metadati delle carte. I prezzi inclusi sono disattivati perché non verificabili; l'estensione salva prezzi recenti osservati nei risultati visibili della Web App EA.";
database.players = [...retainedPlayers, ...serieAPlayers].map((player) => ({
  ...player,
  price: 0,
  priceText: "n/d"
}));

fs.writeFileSync(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Indice scritto: ${database.players.length} carte, incluse ${serieAPlayers.length} Serie A.`);
