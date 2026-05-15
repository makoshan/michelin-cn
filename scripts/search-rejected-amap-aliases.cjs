#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.AMAP_CITY || "杭州";
const key = process.env.AMAP_API_KEY;
const dataPath = path.join(root, "public", "restaurants.json");
const aliasPath = path.join(root, `${city}-pi-rejected-aliases.json`);
const outPath = path.join(root, `${city}-rejected-amap-alias-report.json`);
const delayMs = Number(process.env.AMAP_DELAY_MS || 180);

if (!key) {
  console.error("Missing AMAP_API_KEY.");
  process.exit(1);
}

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function amapText(keywords) {
  const url = new URL("https://restapi.amap.com/v3/place/text");
  url.searchParams.set("key", key);
  url.searchParams.set("output", "json");
  url.searchParams.set("city", city);
  url.searchParams.set("citylimit", "true");
  url.searchParams.set("types", "050000");
  url.searchParams.set("extensions", "all");
  url.searchParams.set("offset", "20");
  url.searchParams.set("keywords", keywords);
  const payload = await fetch(url).then((response) => response.json());
  if (payload.status !== "1") throw new Error(`${payload.info || "request failed"} (${payload.infocode || "unknown"})`);
  return payload.pois || [];
}

function score(alias, restaurant, poi) {
  const aliasName = normalize(alias.name);
  const poiName = normalize(poi.name);
  const restaurantAddress = normalize(restaurant.address);
  const poiAddress = normalize(poi.address);
  let value = 0;
  if (alias.confidence === "high") value += 20;
  if (alias.confidence === "medium") value += 10;
  if (aliasName && poiName && aliasName === poiName) value += 90;
  else if (aliasName && poiName && (aliasName.includes(poiName) || poiName.includes(aliasName))) value += 60;
  if (restaurantAddress && poiAddress && (restaurantAddress.includes(poiAddress) || poiAddress.includes(restaurantAddress))) value += 20;
  const numbers = String(restaurant.address || "").match(/\d+/g) || [];
  if (numbers.some((number) => String(poi.address || "").includes(number))) value += 30;
  if (String(poi.type || "").includes("餐饮")) value += 10;
  return value;
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const aliases = JSON.parse(fs.readFileSync(aliasPath, "utf8"));
  const byId = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  const report = [];

  for (const item of aliases) {
    const restaurant = byId.get(item.id);
    if (!restaurant) continue;
    const matches = [];
    for (const alias of item.aliases || []) {
      try {
        const pois = await amapText(alias.name);
        matches.push(
          ...pois.slice(0, 8).map((poi) => ({
            alias,
            score: score(alias, restaurant, poi),
            poi: {
              id: poi.id,
              name: poi.name,
              address: poi.address,
              location: poi.location,
              type: poi.type,
            },
          })),
        );
        await sleep(delayMs);
      } catch (error) {
        matches.push({ alias, error: error.message });
      }
    }
    matches.sort((left, right) => (right.score || 0) - (left.score || 0));
    const best = matches[0] || null;
    report.push({
      id: restaurant.id,
      sourceName: restaurant.nameEn || restaurant.name,
      currentName: restaurant.name,
      currentAddress: restaurant.address,
      best,
      recommendation: best?.score >= 110 ? "rescue_candidate" : "keep_rejected",
      matches: matches.slice(0, 10),
    });
    console.log(`${restaurant.id} ${restaurant.name} -> ${best?.poi?.name || "NO_MATCH"} (${best?.score || 0}) ${best?.score >= 110 ? "RESCUE?" : "keep"}`);
  }

  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Saved ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
