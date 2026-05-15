#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const city = process.env.BRAVE_CITY || "杭州";
const key = process.env.BRAVE_API_KEY;
const limit = Number(process.env.BRAVE_LIMIT || Infinity);
const delayMs = Number(process.env.BRAVE_DELAY_MS || 600);
const dataPath = path.join(root, "public", "restaurants.json");
const csvPath = path.resolve(root, "..", "michelin_china_all_2026.csv");
const amapReportPath = path.join(root, "amap-calibration-report.json");
const cachePath = path.join(root, ".brave-poi-cache.json");
const outPath = path.join(root, `${city}-brave-poi-evidence.json`);

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

function normalise(text) {
  return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function isBlockedCandidate(match) {
  const text = `${match?.name || ""} ${match?.type || ""}`;
  return ["咖啡", "酒吧", "茶", "汉堡", "披萨", "肯德基", "必胜客", "地铁", "Tiffany", "蒂芙尼"].some((word) => text.includes(word));
}

function needsEvidence(item) {
  const match = item.match;
  if (!match) return false;
  if (match.score >= 90) return false;
  if (match.score !== 75) return false;
  if (Number(match.distance || 9999) > 25) return false;
  if (isBlockedCandidate(match)) return false;
  return true;
}

async function braveSearch(query) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "5");
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

function scoreEvidence(source, candidate, results) {
  const sourceName = normalise(source.Name);
  const sourceAddress = normalise(source.Address);
  const candidateName = normalise(candidate.name);
  const candidateAddress = normalise(candidate.address);
  let score = 0;
  const reasons = [];

  for (const result of results) {
    const haystack = normalise([result.title, result.description, ...(result.snippets || [])].join(" "));
    if (haystack.includes(sourceName)) {
      score += 20;
      reasons.push("网页包含 Michelin 英文名");
    }
    if (candidateName && haystack.includes(candidateName)) {
      score += 20;
      reasons.push("网页包含 POI 中文名");
    }
    if (sourceAddress && haystack.includes(sourceAddress)) {
      score += 20;
      reasons.push("网页包含 Michelin 英文地址");
    }
    if (candidateAddress && haystack.includes(candidateAddress)) {
      score += 20;
      reasons.push("网页包含 POI 中文地址");
    }
    if ((result.source || "").includes("michelin")) {
      score += 10;
      reasons.push("出现 Michelin 官方结果");
    }
  }

  return { score, reasons: [...new Set(reasons)] };
}

async function main() {
  const restaurants = readJson(dataPath, []);
  const sourceRows = parse(fs.readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true });
  const amapReport = readJson(amapReportPath, []);
  const cache = readJson(cachePath, {});
  const output = [];
  let processed = 0;

  for (const item of amapReport) {
    if (processed >= limit) break;
    const restaurant = restaurants.find((entry) => entry.id === item.id);
    if (!restaurant || restaurant.city !== city) continue;
    if (!needsEvidence(item)) continue;

    const source = sourceRows[item.id - 1] || {};
    const match = item.match;
    const query = `"${source.Name}" "${match.name}" ${city} 餐厅`;
    const cacheKey = `${city}:${item.id}:${query}`;
    let results = cache[cacheKey];
    if (!results) {
      results = await braveSearch(query);
      cache[cacheKey] = results;
      writeJson(cachePath, cache);
      await sleep(delayMs);
    }

    const evidence = scoreEvidence(source, match, results);
    output.push({
      id: item.id,
      sourceName: source.Name,
      sourceAddress: source.Address,
      candidate: match,
      query,
      evidence,
      results,
    });
    processed += 1;
    console.log(`${processed} ${item.id} ${source.Name} -> ${match.name} evidence ${evidence.score}`);
  }

  writeJson(outPath, output);
  console.log(`Saved ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
