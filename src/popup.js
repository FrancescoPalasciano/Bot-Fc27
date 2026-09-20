"use strict";

const defaults = { enabled: true, minimumProfit: 500, maximumBuy: 15000 };
const fields = ["enabled", "minimumProfit", "maximumBuy"];
const saved = document.querySelector("#saved");
let savedTimer;

chrome.storage.local.get(defaults).then((settings) => {
  fields.forEach((id) => {
    const input = document.querySelector(`#${id}`);
    input[input.type === "checkbox" ? "checked" : "value"] = settings[id];
  });
});

fields.forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("change", async (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : Math.max(0, Number(event.target.value) || 0);
    await chrome.storage.local.set({ [id]: value });
    saved.textContent = "Salvato";
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { saved.textContent = ""; }, 1300);
  });
});
