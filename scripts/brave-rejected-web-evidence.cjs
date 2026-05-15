#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const city = process.env.BRAVE_CITY || "杭州";
const key = process.env.BRAVE_API_KEY;
const limit = Number(process.env.BRAVE_LIMIT || Infinity);
const delayMs = Number(process.env.BRAVE_DELAY_MS || 700);
const dataPath = path.join(root, "public", "restaurants.json");
const csvPath = path.resolve(root, "..", "michelin_china_all_2026.csv");
const aliasPath = path.join(root, `${city}-pi-rejected-aliases.json`);
const cachePath = path.join(root, ".brave-rejected-web-cache.json");
const outPath = path.join(root, `${city}-rejected-web-evidence.json`);

if (!key) {
  console.error("Missing BRAVE_API_KEY.");
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

async function braveSearch(query) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "8");
  url.searchParams.set("country", "CN");
  url.searchParams.set("search_lang", "zh-hans");
  const response = await fetch(url, {
    headers: {
      "X-Subscription-Token": key,
      Accept: "application/json",
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || `${response.status} ${response.statusText}`);
  return (payload.web?.results || []).map((result) => ({
    title: result.title,
    url: result.url,
    description: result.description,
    snippets: result.extra_snippets || [],
    source: result.profile?.long_name || result.meta_url?.hostname || "",
  }));
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildQueries(source, restaurant, aliases) {
  const queries = [
    `"${source.Name}" "${city}" 中文名`,
    `"${source.Name}" "${city}" 米其林`,
    `"${source.Name}" "${source.Address}"`,
  ];

  for (const alias of aliases.slice(0, 5)) {
    queries.push(`"${source.Name}" "${alias.name}" ${city}`);
    queries.push(`"${alias.name}" "${source.Address.split(",")[0]}"`);
  }

  const michelinSlug = source.Url ? domainFromUrl(source.Url) : "";
  if (michelinSlug) queries.push(`site:${michelinSlug} "${source.Name}" "${city}"`);

  const websiteDomain = source.WebsiteUrl ? domainFromUrl(source.WebsiteUrl) : domainFromUrl(restaurant.website);
  if (websiteDomain) {
    queries.push(`site:${websiteDomain} "${source.Name}"`);
    queries.push(`site:${websiteDomain} "${city}" 餐厅`);
  }

  return [...new Set(queries.filter(Boolean))].slice(0, 10);
}

async function main() {
  const restaurants = readJson(dataPath, []);
  const sourceRows = parse(fs.readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true });
  const aliases = new Map(readJson(aliasPath, []).map((item) => [item.id, item.aliases || []]));
  const cache = readJson(cachePath, {});
  const output = [];
  const rejected = restaurants.filter((restaurant) => restaurant.city === city && restaurant.aiPoiDecision === "rejected");
  let processed = 0;

  for (const restaurant of rejected) {
    if (processed >= limit) break;
    const source = sourceRows[restaurant.id - 1] || {};
    const itemAliases = aliases.get(restaurant.id) || [];
    const queries = buildQueries(source, restaurant, itemAliases);
    const evidence = [];

    for (const query of queries) {
      const cacheKey = `${restaurant.id}:${query}`;
      let results = cache[cacheKey];
      if (!results) {
        results = await braveSearch(query);
        cache[cacheKey] = results;
        writeJson(cachePath, cache);
        await sleep(delayMs);
      }
      evidence.push({ query, results });
    }

    output.push({
      id: restaurant.id,
      sourceName: source.Name || restaurant.nameEn || restaurant.name,
      sourceAddress: source.Address || restaurant.address,
      michelinUrl: source.Url || null,
      websiteUrl: source.WebsiteUrl || restaurant.website || null,
      currentName: restaurant.name,
      currentAddress: restaurant.address,
      aliases: itemAliases,
      evidence,
    });
    processed += 1;
    console.log(`${processed} ${restaurant.id} ${source.Name || restaurant.name} evidence queries ${evidence.length}`);
  }

  writeJson(outPath, output);
  console.log(`Saved ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
