#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.SERPER_CITY || "杭州";
const key = process.env.SERPER_API_KEY;
const dataPath = path.join(root, "public", "restaurants.json");
const outPath = path.join(root, `${city}-serper-rejected-evidence.json`);
const cachePath = path.join(root, ".serper-rejected-cache.json");
const delayMs = Number(process.env.SERPER_DELAY_MS || 350);

if (!key) {
  console.error("Missing SERPER_API_KEY.");
  process.exit(1);
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function serperSearch(query) {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "cn",
      hl: "zh-cn",
      num: 10,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || `${response.status} ${response.statusText}`);
  return {
    organic: payload.organic || [],
    knowledgeGraph: payload.knowledgeGraph || null,
    places: payload.places || [],
    answerBox: payload.answerBox || null,
  };
}

function queriesFor(restaurant) {
  const firstAddress = String(restaurant.address || "").split(/[，,]/)[0];
  return [
    `"${restaurant.nameEn || restaurant.name}" 杭州 中文名 米其林`,
    `"${restaurant.nameEn || restaurant.name}" "${firstAddress}"`,
    `"${restaurant.nameEn || restaurant.name}" 杭州 餐厅 地址`,
    `"${restaurant.phone || ""}" "${restaurant.nameEn || restaurant.name}"`,
    `"${restaurant.nameEn || restaurant.name}" site:guide.michelin.com`,
  ].filter((query) => !query.includes('""'));
}

async function main() {
  const restaurants = readJson(dataPath, []);
  const cache = readJson(cachePath, {});
  const rejected = restaurants.filter((restaurant) => restaurant.city === city && restaurant.aiPoiDecision === "rejected");
  const output = [];

  for (const restaurant of rejected) {
    const evidence = [];
    for (const query of queriesFor(restaurant)) {
      const cacheKey = `${restaurant.id}:${query}`;
      let result = cache[cacheKey];
      if (!result) {
        result = await serperSearch(query);
        cache[cacheKey] = result;
        writeJson(cachePath, cache);
        await sleep(delayMs);
      }
      evidence.push({ query, result });
    }
    output.push({
      id: restaurant.id,
      name: restaurant.name,
      nameEn: restaurant.nameEn,
      address: restaurant.address,
      phone: restaurant.phone,
      reason: restaurant.aiPoiReason,
      evidence,
    });
    console.log(`${output.length}/${rejected.length} ${restaurant.id} ${restaurant.name}`);
  }

  writeJson(outPath, output);
  console.log(`Saved ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
