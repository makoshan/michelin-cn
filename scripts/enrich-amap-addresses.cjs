#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "restaurants.json");
const reportPath = path.join(root, "amap-address-enrichment-report.json");
const key = process.env.AMAP_API_KEY;
const city = process.env.AMAP_CITY || "杭州";
const decisions = new Set((process.env.AMAP_DECISIONS || "accepted").split(",").map((value) => value.trim()).filter(Boolean));
const limit = Number(process.env.AMAP_LIMIT || Infinity);
const delayMs = Number(process.env.AMAP_DELAY_MS || 180);
const shouldApply = process.argv.includes("--apply");

if (!key) {
  console.error("Missing AMAP_API_KEY.");
  process.exit(1);
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function distanceMeters(left, right) {
  if (!left || !right) return Infinity;
  const [lng1, lat1] = left.split(",").map(Number);
  const [lng2, lat2] = right.split(",").map(Number);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return Infinity;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  throw new Error(`${pathname} failed: ${payload?.info || "request failed"} (${payload?.infocode || "unknown"})`);
}

function candidateScore(restaurant, poi) {
  const targetName = normalize(restaurant.name);
  const targetNameZh = normalize(restaurant.nameZh);
  const poiName = normalize(poi.name);
  const targetAddress = normalize(restaurant.address);
  const poiAddress = normalize(poi.address);
  let score = 0;

  if (restaurant.amapPoiId && poi.id === restaurant.amapPoiId) score += 100;
  if (targetName && poiName && targetName === poiName) score += 90;
  else if (targetName && poiName && (targetName.includes(poiName) || poiName.includes(targetName))) score += 65;
  if (targetNameZh && poiName && (targetNameZh === poiName || targetNameZh.includes(poiName) || poiName.includes(targetNameZh))) score += 50;
  if (targetAddress && poiAddress && (targetAddress.includes(poiAddress) || poiAddress.includes(targetAddress))) score += 20;
  if (String(poi.type || "").includes("餐饮")) score += 10;

  const distance = distanceMeters(restaurant.amapLocation, poi.location);
  if (Number.isFinite(distance)) {
    if (distance <= 50) score += 30;
    else if (distance <= 150) score += 18;
    else if (distance <= 500) score += 8;
  }

  return { score, distance };
}

async function searchByName(restaurant) {
  const payload = await amapGet("/v3/place/text", {
    keywords: restaurant.name,
    city,
    citylimit: true,
    types: "050000",
    offset: 20,
    page: 1,
    extensions: "all",
  });
  return payload.pois || [];
}

async function main() {
  const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const report = [];
  let processed = 0;

  for (const restaurant of restaurants) {
    if (restaurant.city !== city) continue;
    if (!decisions.has(String(restaurant.aiPoiDecision || ""))) continue;
    if (processed >= limit) break;
    processed += 1;

    try {
      const pois = await searchByName(restaurant);
      const ranked = pois
        .map((poi) => ({ poi, ...candidateScore(restaurant, poi) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0] || null;
      const canApply = best && best.score >= 90;
      const item = {
        id: restaurant.id,
        name: restaurant.name,
        previousAddress: restaurant.address,
        previousAmapPoiId: restaurant.amapPoiId,
        match: best
          ? {
              score: best.score,
              distance: Number.isFinite(best.distance) ? Math.round(best.distance) : null,
              id: best.poi.id,
              name: best.poi.name,
              address: best.poi.address,
              location: best.poi.location,
              type: best.poi.type,
            }
          : null,
        applied: Boolean(shouldApply && canApply),
      };
      report.push(item);

      if (shouldApply && canApply) {
        restaurant.name = best.poi.name || restaurant.name;
        restaurant.nameZh = best.poi.name || restaurant.nameZh;
        restaurant.address = best.poi.address || restaurant.address;
        restaurant.amapPoiId = best.poi.id || restaurant.amapPoiId;
        restaurant.amapLocation = best.poi.location || restaurant.amapLocation;
        restaurant.aiPoiReason = `${restaurant.aiPoiReason || "Pi/Kimi accepted."} Amap address enriched: ${best.poi.name} | ${best.poi.address}`;
      }

      console.log(`${processed} ${restaurant.id} ${restaurant.name} -> ${best?.poi?.name || "NO_MATCH"} (${best?.score || 0})${canApply ? " APPLY" : ""}`);
      await sleep(delayMs);
    } catch (error) {
      report.push({ id: restaurant.id, name: restaurant.name, error: error.message });
      console.error(`${restaurant.id} ${restaurant.name} failed: ${error.message}`);
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (shouldApply) {
    fs.writeFileSync(dataPath, `${JSON.stringify(restaurants, null, 2)}\n`, "utf8");
  }
  console.log(`${shouldApply ? "Applied" : "Dry run"} ${report.filter((item) => item.applied || item.match?.score >= 90).length}/${report.length} ${city} Amap address enrichments.`);
  console.log(`Saved ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
