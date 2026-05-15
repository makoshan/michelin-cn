#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const dataPath = path.join(root, "public", "restaurants.json");
const reviewPath = path.join(root, `${city}-poi-ai-review.md`);
const outputPath = path.join(root, `${city}-pi-rejected-aliases.json`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const rejected = restaurants
  .filter((restaurant) => restaurant.city === city && restaurant.aiPoiDecision === "rejected")
  .map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    nameEn: restaurant.nameEn,
    address: restaurant.address,
    reason: restaurant.aiPoiReason,
  }));

const prompt = [
  `下面是 ${city} 被第一轮 POI 校准拒绝的米其林餐厅。`,
  "任务：只用模型知识和给定审核表，为每个 id 生成 1-5 个适合在高德搜索的中文店名/别名/酒店内餐厅名候选。",
  "要求：",
  "- 不要把明显无关的高德候选当成别名。",
  "- 如果你不知道中文名，也要给最可能的音译/直译，但 confidence 设低。",
  "- 输出必须是 JSON 数组，不要 Markdown，不要解释。",
  "- 每项格式：{\"id\": number, \"aliases\": [{\"name\": string, \"confidence\": \"high\"|\"medium\"|\"low\", \"reason\": string}]}",
  "",
  "被拒绝餐厅：",
  JSON.stringify(rejected, null, 2),
  "",
  "审核表全文：",
  fs.readFileSync(reviewPath, "utf8"),
].join("\n");

const result = spawnSync(
  "npx",
  [
    "-y",
    "@earendil-works/pi-coding-agent@0.74.0",
    "--provider",
    "kimi",
    "--no-tools",
    "--no-session",
    "--no-context-files",
    "--no-extensions",
    "--no-skills",
    "--no-prompt-templates",
    "--no-themes",
    "-p",
    prompt,
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      PI_SKIP_VERSION_CHECK: "1",
      PI_TELEMETRY: "0",
    },
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  },
);

if (result.error) throw result.error;

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

const raw = result.stdout.trim();
const json = raw.match(/\[[\s\S]*\]/)?.[0] || raw;
JSON.parse(json);
fs.writeFileSync(outputPath, `${json}\n`, "utf8");
console.log(`Saved ${outputPath}`);
