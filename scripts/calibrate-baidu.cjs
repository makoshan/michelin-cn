#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "restaurants.json");
const csvPath = path.resolve(root, "..", "michelin_china_all_2026.csv");
const reportPath = path.join(root, "baidu-calibration-report.json");
const ak = process.env.BAIDU_AK;
const limit = Number(process.env.BAIDU_LIMIT || Infinity);
const delayMs = Number(process.env.BAIDU_DELAY_MS || 250);
const minApplyScore = Number(process.env.BAIDU_MIN_APPLY_SCORE || 130);
const skipAmap = process.env.BAIDU_SKIP_AMAP === "1";
const shouldApply = process.argv.includes("--apply");

const ids = new Set((process.env.BAIDU_IDS || "").split(",").map((v) => v.trim()).filter(Boolean).map(Number).filter(Number.isFinite));
const cities = new Set((process.env.BAIDU_CITIES || "").split(",").map((v) => v.trim()).filter(Boolean));

if (!ak) {
  console.error("Missing BAIDU_AK.");
  process.exit(1);
}

function readSourceRows() {
  return parse(fs.readFileSync(csvPath, "utf8"), { columns: true, skip_empty_lines: true });
}

function normalise(text) {
  return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function numbers(text) {
  return new Set(String(text || "").match(/\d+/g) || []);
}

function hasSharedNumber(a, b) {
  const left = numbers(a);
  if (!left.size) return false;
  return [...numbers(b)].some((value) => left.has(value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gcj02ToBd09(lat, lng) {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin((lat * Math.PI * 3000.0) / 180.0);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos((lng * Math.PI * 3000.0) / 180.0);
  return [z * Math.sin(theta) + 0.006, z * Math.cos(theta) + 0.0065];
}

const PI = Math.PI;
const AXIS = 6378245.0;
const OFFSET = 0.00669342162296594323;

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

function wgs84ToGcj02(lat, lng) {
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - OFFSET * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  return [lat + dLat, lng + dLng];
}

function getBd09(restaurant) {
  if (restaurant.amapLocation) {
    const [lng, lat] = restaurant.amapLocation.split(",").map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return gcj02ToBd09(lat, lng);
  }
  const lat = Number(restaurant.latitude);
  const lng = Number(restaurant.longitude);
  const [gcjLat, gcjLng] = wgs84ToGcj02(lat, lng);
  return gcj02ToBd09(gcjLat, gcjLng);
}

async function baiduGet(pathname, params) {
  const url = new URL(`https://api.map.baidu.com${pathname}`);
  url.searchParams.set("ak", ak);
  url.searchParams.set("output", "json");
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  });
  const response = await fetch(url);
  const payload = await response.json();
  if (payload.status !== 0) throw new Error(`${pathname} failed: ${payload.message || payload.msg || payload.status}`);
  return payload;
}

function scoreResult(restaurant, source, result) {
  const tag = String(result.detail_info?.tag || "");
  const name = String(result.name || "");
  const blocked = ["地铁", "咖啡", "酒吧", "茶座", "汉堡", "披萨", "KTV", "园艺", "交通设施"];
  if (blocked.some((word) => tag.includes(word) || name.includes(word))) return 0;
  const sourceName = normalise(source.Name || restaurant.nameEn || restaurant.name);
  const sourceNameZh = normalise(restaurant.nameZh || restaurant.name);
  const resultName = normalise(result.name);
  const sourceAddress = normalise(source.Address || restaurant.address);
  const resultAddress = normalise(result.address);
  let score = 0;
  if (resultName && sourceName && (resultName.includes(sourceName) || sourceName.includes(resultName))) score += 60;
  if (resultName && sourceNameZh && (resultName.includes(sourceNameZh) || sourceNameZh.includes(resultName))) score += 60;
  if (resultAddress && sourceAddress && (resultAddress.includes(sourceAddress) || sourceAddress.includes(resultAddress))) score += 20;
  if (hasSharedNumber(source.Address || restaurant.address, result.address)) score += 40;
  if (String(result.detail_info?.tag || "").includes("美食")) score += 10;
  return score;
}

async function search(restaurant, source, bdLat, bdLng) {
  const queries = [
    restaurant.nameZh,
    restaurant.name,
    restaurant.nameEn,
    source.Name,
  ].filter(Boolean);
  const results = [];
  for (const query of [...new Set(queries)]) {
    const payload = await baiduGet("/place/v2/search", {
      query,
      region: restaurant.city,
      city_limit: true,
      scope: 2,
    });
    results.push(...(payload.results || []));
    await sleep(delayMs);
  }
  const nearby = await baiduGet("/place/v2/search", {
    query: "餐厅",
    location: `${bdLat},${bdLng}`,
    radius: 300,
    scope: 2,
  });
  results.push(...(nearby.results || []));
  const seen = new Set();
  return results.filter((result) => {
    const key = result.uid || `${result.name}-${result.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const sourceRows = readSourceRows();
  const report = [];
  let processed = 0;

  for (const restaurant of restaurants) {
    if (ids.size && !ids.has(restaurant.id)) continue;
    if (cities.size && !cities.has(restaurant.city)) continue;
    if (skipAmap && restaurant.amapPoiId) continue;
    if (processed >= limit) break;

    const source = sourceRows[restaurant.id - 1] || {};
    const [bdLat, bdLng] = getBd09(restaurant);
    processed += 1;

    try {
      const results = await search(restaurant, source, bdLat, bdLng);
      const ranked = results
        .map((result) => ({ result, score: scoreResult(restaurant, source, result) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0] || null;

      const item = {
        id: restaurant.id,
        city: restaurant.city,
        sourceName: source.Name || restaurant.nameEn || restaurant.name,
        sourceAddress: source.Address || restaurant.address,
        baidu: { lng: bdLng, lat: bdLat },
        match: best ? {
          score: best.score,
          uid: best.result.uid,
          name: best.result.name,
          address: best.result.address,
          location: best.result.location,
          tag: best.result.detail_info?.tag,
        } : null,
      };
      report.push(item);

      if (shouldApply && best && best.score >= minApplyScore) {
        restaurant.baiduUid = best.result.uid;
        restaurant.baiduLocation = `${best.result.location.lng},${best.result.location.lat}`;
        restaurant.name = best.result.name || restaurant.name;
        restaurant.nameZh = best.result.name || restaurant.nameZh;
        restaurant.address = best.result.address || restaurant.address;
      }

      console.log(`${processed} ${restaurant.id} ${item.sourceName} -> ${item.match?.name || "NO_MATCH"} (${item.match?.score || 0})`);
      await sleep(delayMs);
    } catch (error) {
      report.push({ id: restaurant.id, error: error.message });
      console.error(`${restaurant.id} failed: ${error.message}`);
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (shouldApply) fs.writeFileSync(dataPath, `${JSON.stringify(restaurants, null, 2)}\n`, "utf8");
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
