#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.PI_DECISION_CITY || "杭州";
const dataPath = path.join(root, "public", "restaurants.json");
const decisionPath = process.env.PI_DECISION_PATH
  ? path.resolve(root, process.env.PI_DECISION_PATH)
  : path.join(root, `${city}-pi-poi-decisions.md`);
const amapReportPath = path.join(root, "amap-calibration-report.json");
const baiduReportPath = path.join(root, "baidu-calibration-report.json");
const overridePath = path.join(root, `${city}-poi-overrides.json`);
const shouldApply = process.argv.includes("--apply");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function parseAccepted(markdown) {
  const acceptedSection = markdown.split("## 2. 拒绝")[0] || markdown;
  const rows = [];
  const pattern = /^- \*\*(\d+)\*\* — \*\*(.*?)\*\*：(.+)$/gm;
  let match;
  while ((match = pattern.exec(acceptedSection))) {
    rows.push({
      id: Number(match[1]),
      acceptedName: match[2].trim(),
      reason: match[3].trim(),
    });
  }
  return rows;
}

function parseSectionIds(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start === -1) return new Set();
  const next = markdown.indexOf("\n## ", start + heading.length);
  const section = markdown.slice(start, next === -1 ? undefined : next);
  return new Set([...section.matchAll(/^- \*\*(\d+)\*\*/gm)].map((match) => Number(match[1])));
}

function parseSectionDecisions(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start === -1) return [];
  const next = markdown.indexOf("\n## ", start + heading.length);
  const section = markdown.slice(start, next === -1 ? undefined : next);
  const rows = [];
  const pattern = /^- \*\*(\d+)\*\*：(.+)$/gm;
  let match;
  while ((match = pattern.exec(section))) {
    rows.push({ id: Number(match[1]), reason: match[2].trim() });
  }
  return rows;
}

function chooseProvider(decision, amapItem, baiduItem) {
  const accepted = normalize(decision.acceptedName);
  const override = overrideById.get(decision.id);
  const overrideName = normalize(override?.match?.name);
  if (
    override?.provider &&
    override?.match &&
    accepted &&
    overrideName &&
    (overrideName === accepted || overrideName.includes(accepted) || accepted.includes(overrideName))
  ) {
    return { provider: override.provider, match: override.match };
  }

  const amapName = normalize(amapItem?.match?.name);
  const baiduName = normalize(baiduItem?.match?.name);

  if (amapItem?.match && amapName === accepted) {
    return { provider: "amap", match: amapItem.match };
  }
  if (baiduItem?.match && baiduName === accepted) {
    return { provider: "baidu", match: baiduItem.match };
  }

  if (amapItem?.match && accepted && amapName && (amapName.includes(accepted) || accepted.includes(amapName))) {
    return { provider: "amap", match: amapItem.match };
  }
  if (baiduItem?.match && accepted && baiduName && (baiduName.includes(accepted) || accepted.includes(baiduName))) {
    return { provider: "baidu", match: baiduItem.match };
  }

  return null;
}

const restaurants = readJson(dataPath);
const markdown = fs.readFileSync(decisionPath, "utf8");
const amapById = new Map(readJson(amapReportPath).map((item) => [item.id, item]));
const baiduById = new Map(readJson(baiduReportPath).map((item) => [item.id, item]));
const overrideById = fs.existsSync(overridePath) ? new Map(readJson(overridePath).map((item) => [item.id, item])) : new Map();
const reviewIds = parseSectionIds(markdown, "## 3. 需要人工复核");
const rejectIds = parseSectionIds(markdown, "## 2. 拒绝");
const accepted = parseAccepted(markdown);
const rejected = parseSectionDecisions(markdown, "## 2. 拒绝");
const needsReview = parseSectionDecisions(markdown, "## 3. 需要人工复核");
const restaurantsById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));

const applied = [];
const skipped = [];
const marked = [];

for (const decision of accepted) {
  const restaurant = restaurantsById.get(decision.id);
  if (!restaurant) {
    skipped.push({ id: decision.id, reason: "data missing" });
    continue;
  }
  if (restaurant.city !== city) {
    skipped.push({ id: decision.id, reason: `city is ${restaurant.city}` });
    continue;
  }
  if (reviewIds.has(decision.id) || rejectIds.has(decision.id)) {
    skipped.push({ id: decision.id, reason: "conflicting review/reject section" });
    continue;
  }

  const chosen = chooseProvider(decision, amapById.get(decision.id), baiduById.get(decision.id));
  if (!chosen) {
    skipped.push({ id: decision.id, name: decision.acceptedName, reason: "accepted name did not match Amap/Baidu candidate" });
    continue;
  }

  const previous = {
    name: restaurant.name,
    address: restaurant.address,
    amapPoiId: restaurant.amapPoiId,
    baiduUid: restaurant.baiduUid,
  };

  restaurant.name = chosen.match.name || restaurant.name;
  restaurant.nameZh = chosen.match.name || restaurant.nameZh;
  restaurant.address = chosen.match.address || restaurant.address;
  restaurant.aiPoiDecision = "accepted";
  restaurant.aiPoiReason = `Pi/Kimi accepted via ${chosen.provider}: ${decision.reason}`;

  if (chosen.provider === "amap") {
    restaurant.amapPoiId = chosen.match.id;
    restaurant.amapLocation = chosen.match.location;
  } else {
    restaurant.baiduUid = chosen.match.uid;
    if (chosen.match.location) {
      restaurant.baiduLocation = `${chosen.match.location.lng},${chosen.match.location.lat}`;
    }
  }

  applied.push({
    id: restaurant.id,
    provider: chosen.provider,
    name: restaurant.name,
    address: restaurant.address,
    previous,
  });
}

for (const decision of rejected) {
  const restaurant = restaurantsById.get(decision.id);
  if (!restaurant || restaurant.city !== city || restaurant.aiPoiDecision === "accepted") continue;
  restaurant.aiPoiDecision = "rejected";
  restaurant.aiPoiReason = `Pi/Kimi rejected: ${decision.reason}`;
  marked.push({ id: restaurant.id, decision: "rejected", name: restaurant.name });
}

for (const decision of needsReview) {
  const restaurant = restaurantsById.get(decision.id);
  if (!restaurant || restaurant.city !== city || restaurant.aiPoiDecision === "accepted") continue;
  restaurant.aiPoiDecision = "needs_review";
  restaurant.aiPoiReason = `Pi/Kimi needs review: ${decision.reason}`;
  marked.push({ id: restaurant.id, decision: "needs_review", name: restaurant.name });
}

if (shouldApply) {
  fs.writeFileSync(dataPath, `${JSON.stringify(restaurants, null, 2)}\n`, "utf8");
}

console.log(`${shouldApply ? "Applied" : "Dry run"} ${applied.length} Pi/Kimi accepted POI decisions for ${city}.`);
console.log(JSON.stringify({ applied, marked, skipped }, null, 2));
