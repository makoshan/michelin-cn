#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "restaurants.json");
const csvPath = path.resolve(root, "..", "michelin_china_all_2026.csv");
const reportPath = path.join(root, "amap-calibration-report.json");
const key = process.env.AMAP_API_KEY;
const limit = Number(process.env.AMAP_LIMIT || Infinity);
const delayMs = Number(process.env.AMAP_DELAY_MS || 350);
const minApplyScore = Number(process.env.AMAP_MIN_APPLY_SCORE || 90);
const ids = new Set(
  (process.env.AMAP_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value.trim()))
    .filter(Number.isFinite),
);
const cities = new Set(
  (process.env.AMAP_CITIES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const mainlandOnly = process.env.AMAP_MAINLAND_ONLY === "1";
const shouldApply = process.argv.includes("--apply");

if (!key) {
  console.error("Missing AMAP_API_KEY. Create a 高德 Web服务 Key, then run: AMAP_API_KEY=xxx npm run calibrate:amap");
  process.exit(1);
}

const MAINLAND_CITIES = new Set([
  "北京",
  "上海",
  "广州",
  "成都",
  "杭州",
  "深圳",
  "南京",
  "苏州",
  "福州",
  "厦门",
  "温州",
  "台州",
  "扬州",
  "常州",
  "泉州",
  "宁德",
]);

function readSourceRows() {
  const csv = fs.readFileSync(csvPath, "utf8");
  return parse(csv, { columns: true, skip_empty_lines: true });
}

function normalise(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function numbers(text) {
  return new Set(String(text || "").match(/\d+/g) || []);
}

function hasSharedNumber(a, b) {
  const left = numbers(a);
  if (!left.size) return false;
  return [...numbers(b)].some((value) => left.has(value));
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scorePoi(restaurant, source, poi) {
  const sourceName = normalise(source.Name || restaurant.nameEn || restaurant.name);
  const sourceNameZh = normalise(restaurant.nameZh || restaurant.name);
  const poiName = normalise(poi.name);
  const sourceAddress = normalise(source.Address || restaurant.address);
  const poiAddress = normalise(poi.address);
  const distance = Number(poi.distance || 99999);

  let score = 0;
  if (poiName && sourceName && (poiName.includes(sourceName) || sourceName.includes(poiName))) score += 60;
  if (poiName && sourceNameZh && (poiName.includes(sourceNameZh) || sourceNameZh.includes(poiName))) score += 60;
  if (poiAddress && sourceAddress && (poiAddress.includes(sourceAddress) || sourceAddress.includes(poiAddress))) score += 20;
  if (hasSharedNumber(source.Address || restaurant.address, poi.address)) score += 40;
  if (distance <= 50) score += 25;
  else if (distance <= 150) score += 15;
  else if (distance <= 300) score += 8;
  if (String(poi.type || "").includes("餐饮")) score += 10;
  return score;
}

async function amapGet(pathname, params) {
  const url = new URL(`https://restapi.amap.com${pathname}`);
  url.searchParams.set("key", key);
  url.searchParams.set("output", "json");
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  });

  let payload;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url);
    payload = await response.json();
    if (payload.status === "1") return payload;
    if (payload.infocode === "10021") {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (payload.status !== "1") {
    throw new Error(`${pathname} failed: ${payload.info || "request failed"} (${payload.infocode || "unknown"})`);
  }
  return payload;
}

function convertGpsToAmap(lng, lat) {
  const [gcjLat, gcjLng] = wgs84ToGcj02(lat, lng);
  return { gcjLng, gcjLat };
}

function uniquePois(pois) {
  const seen = new Set();
  return pois.filter((poi) => {
    const key = poi.id || `${poi.name}-${poi.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchAround(restaurant, source, gcjLng, gcjLat) {
  const keywords = [source.Name, restaurant.nameEn, restaurant.nameZh, restaurant.name].filter(Boolean).join(" ");
  const payload = await amapGet("/v3/place/around", {
    location: `${gcjLng},${gcjLat}`,
    keywords,
    types: "050000",
    radius: 800,
    offset: 10,
    page: 1,
    extensions: "all",
    sortrule: "distance",
    city: restaurant.city,
  });
  const nearbyPayload = await amapGet("/v3/place/around", {
    location: `${gcjLng},${gcjLat}`,
    types: "050000",
    radius: 300,
    offset: 20,
    page: 1,
    extensions: "all",
    sortrule: "distance",
    city: restaurant.city,
  });
  return uniquePois([...(payload.pois || []), ...(nearbyPayload.pois || [])]);
}

async function reverseGeocode(gcjLng, gcjLat) {
  const payload = await amapGet("/v3/geocode/regeo", {
    location: `${gcjLng},${gcjLat}`,
    radius: 500,
    extensions: "all",
  });
  return payload.regeocode || null;
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const sourceRows = readSourceRows();
  const report = [];
  let processed = 0;

  for (const restaurant of restaurants) {
    if (ids.size && !ids.has(restaurant.id)) continue;
    if (cities.size && !cities.has(restaurant.city)) continue;
    if (mainlandOnly && !MAINLAND_CITIES.has(restaurant.city)) continue;
    if (processed >= limit) break;
    const source = sourceRows[restaurant.id - 1] || {};
    const lat = Number(restaurant.latitude);
    const lng = Number(restaurant.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    processed += 1;
    try {
      const { gcjLng, gcjLat } = await convertGpsToAmap(lng, lat);
      const pois = await searchAround(restaurant, source, gcjLng, gcjLat);
      await sleep(delayMs);
      const regeo = await reverseGeocode(gcjLng, gcjLat);
      const ranked = pois
        .map((poi) => ({ poi, score: scorePoi(restaurant, source, poi) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0] || null;

      const item = {
        id: restaurant.id,
        city: restaurant.city,
        sourceName: source.Name || restaurant.nameEn || restaurant.name,
        sourceAddress: source.Address || restaurant.address,
        gps: { lng, lat },
        amap: { lng: gcjLng, lat: gcjLat },
        reverseAddress: regeo?.formatted_address || null,
        match: best ? {
          score: best.score,
          id: best.poi.id,
          name: best.poi.name,
          address: best.poi.address,
          location: best.poi.location,
          distance: best.poi.distance,
          type: best.poi.type,
        } : null,
      };
      report.push(item);

      if (shouldApply && best && best.score >= minApplyScore) {
        restaurant.amapPoiId = best.poi.id;
        restaurant.name = best.poi.name || restaurant.name;
        restaurant.nameZh = best.poi.name || restaurant.nameZh;
        restaurant.address = best.poi.address || regeo?.formatted_address || restaurant.address;
        restaurant.amapLocation = best.poi.location;
      }

      console.log(`${processed}/${Math.min(restaurants.length, limit)} ${restaurant.id} ${item.sourceName} -> ${item.match?.name || "NO_MATCH"} (${item.match?.score || 0})`);
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
