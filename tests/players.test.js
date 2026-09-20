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

test("ogni carta ha nome, overall, prezzo e URL", () => {
  assert.ok(database.players.length > 0);
  database.players.forEach((player) => {
    assert.equal(typeof player.name, "string");
    assert.ok(player.name.length > 0);
    assert.ok(Number.isInteger(player.overall));
    assert.ok(Number.isInteger(player.price));
    assert.match(player.url, /^https:\/\/www\.futbin\.com\/27\/player\//);
  });
});

test("il catalogo locale contiene la carta usata nel flusso di prova", () => {
  const iago = database.players.find((player) => player.name === "Iago Aspas");
  assert.ok(iago);
  assert.equal(iago.overall, 81);
  assert.ok(iago.price > 0);
});

test("il manifest espone il catalogo JSON alle pagine EA", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
  const resources = manifest.web_accessible_resources.flatMap((entry) => entry.resources);
  assert.ok(resources.includes("data/players.json"));
});
