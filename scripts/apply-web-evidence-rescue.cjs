#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const dataPath = path.join(root, "public", "restaurants.json");
const decisionPath = path.join(root, `${city}-pi-web-evidence-decisions.md`);
const overridePath = path.join(root, `${city}-web-evidence-poi-overrides.json`);
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
const decisions = parseAccepted(fs.readFileSync(decisionPath, "utf8"));
const overrides = new Map(JSON.parse(fs.readFileSync(overridePath, "utf8")).map((item) => [item.id, item]));
const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
const applied = [];
const skipped = [];

for (const decision of decisions) {
  const restaurant = restaurantById.get(decision.id);
  const override = overrides.get(decision.id);
  const poi = override?.match;
  if (!restaurant || !poi) {
    skipped.push({ id: decision.id, reason: "missing restaurant or override POI" });
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
  restaurant.aiPoiReason = `Pi/Kimi rescued rejected via web Chinese-name evidence: ${decision.reason}`;

  applied.push({ id: restaurant.id, name: restaurant.name, address: restaurant.address, previous });
}

if (shouldApply) {
  fs.writeFileSync(dataPath, `${JSON.stringify(restaurants, null, 2)}\n`, "utf8");
}

console.log(`${shouldApply ? "Applied" : "Dry run"} ${applied.length} web-evidence rescues.`);
console.log(JSON.stringify({ applied, skipped }, null, 2));
