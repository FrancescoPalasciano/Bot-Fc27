const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const database = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "players.json"), "utf8"));

test("il database giocatori dichiara provenienza e copertura", () => {
  assert.match(database.sourceUrl, /^https:\/\/www\.futbin\.com\/27\/players/);
  assert.equal(typeof database.complete, "boolean");
  assert.ok(Array.isArray(database.pagesCovered));
});

test("ogni carta ha nome, overall, prezzo disattivato e URL", () => {
  assert.ok(database.players.length > 0);
  database.players.forEach((player) => {
    assert.equal(typeof player.name, "string");
    assert.ok(player.name.length > 0);
    assert.ok(Number.isInteger(player.overall));
    assert.ok(Number.isInteger(player.price));
    assert.equal(player.price, 0);
    assert.match(player.url, /^https:\/\/www\.futbin\.com\/27\/(player\/|players\?league=31)/);
  });
});

test("il catalogo locale contiene la carta usata nel flusso di prova", () => {
  const iago = database.players.find((player) => player.name === "Iago Aspas");
  assert.ok(iago);
  assert.equal(iago.overall, 81);
  assert.equal(iago.price, 0);
});

test("il catalogo dichiara la strategia dei prezzi runtime", () => {
  assert.equal(database.priceStrategy.bundledPrices, false);
  assert.equal(database.priceStrategy.runtimeSource, "ea-web-app-visible-results");
  assert.equal(database.priceStrategy.maximumAgeHours, 6);
});

test("il catalogo contiene tutte le carte base Serie A raccolte", () => {
  const serieA = database.players.filter((player) => player.sourceScope === "serie-a-base");
  assert.equal(serieA.length, 544);
  assert.equal(database.collections.serieA.uniquePlayers, 544);
  assert.ok(serieA.some((player) => player.name === "Lautaro Martínez" && player.overall === 87));
  assert.ok(serieA.some((player) => player.name === "Nicolò Barella" && player.overall === 87));
  assert.ok(serieA.every((player) => player.league === "Serie A"));
});

test("il manifest espone il catalogo JSON alle pagine EA", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
  const declaration = manifest.web_accessible_resources.find((entry) => entry.resources.includes("data/players.json"));
  assert.ok(declaration);
  assert.deepEqual(declaration.matches, ["https://www.ea.com/*"]);
});
