#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const dataPath = path.join(root, "public", "restaurants.json");
const reportPath = path.join(root, `${city}-rejected-amap-alias-report.json`);
const decisionPath = path.join(root, `${city}-pi-rejected-rescue-decisions.md`);
const shouldApply = process.argv.includes("--apply");

function parseAccepted(markdown) {
  const acceptedSection = markdown.split("## 2. 继续拒绝")[0] || markdown;
  return [...acceptedSection.matchAll(/^- \*\*(\d+)\*\* — \*\*(.*?)\*\*：(.+)$/gm)].map((match) => ({
    id: Number(match[1]),
    name: match[2].trim(),
    reason: match[3].trim(),
  }));
}

const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const decisions = parseAccepted(fs.readFileSync(decisionPath, "utf8"));
const reportById = new Map(report.map((item) => [item.id, item]));
const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
const applied = [];
const skipped = [];

for (const decision of decisions) {
  const restaurant = restaurantById.get(decision.id);
  const item = reportById.get(decision.id);
  const poi = item?.best?.poi;
  if (!restaurant || !poi) {
    skipped.push({ id: decision.id, reason: "missing restaurant or POI" });
    continue;
  }
  if (restaurant.city !== city) {
    skipped.push({ id: decision.id, reason: `city is ${restaurant.city}` });
    continue;
  }

  const previous = {
    name: restaurant.name,
    address: restaurant.address,
    aiPoiDecision: restaurant.aiPoiDecision,
  };

  restaurant.name = poi.name || restaurant.name;
  restaurant.nameZh = poi.name || restaurant.nameZh;
  restaurant.address = poi.address || restaurant.address;
  restaurant.amapPoiId = poi.id || restaurant.amapPoiId;
  restaurant.amapLocation = poi.location || restaurant.amapLocation;
  restaurant.aiPoiDecision = "accepted";
  restaurant.aiPoiReason = `Pi/Kimi rescued rejected via alias search: ${decision.reason}`;

  applied.push({ id: restaurant.id, name: restaurant.name, address: restaurant.address, previous });
}

if (shouldApply) {
  fs.writeFileSync(dataPath, `${JSON.stringify(restaurants, null, 2)}\n`, "utf8");
}

console.log(`${shouldApply ? "Applied" : "Dry run"} ${applied.length} rejected rescues.`);
console.log(JSON.stringify({ applied, skipped }, null, 2));
