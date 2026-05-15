#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const reviewPath = path.join(root, `${city}-poi-ai-review.md`);
const outputPath = path.join(root, `${city}-pi-poi-final-decisions.md`);
const dataPath = path.join(root, "public", "restaurants.json");

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const unresolvedIds = restaurants
  .filter((restaurant) => restaurant.city === city && restaurant.aiPoiDecision !== "accepted" && restaurant.aiPoiDecision !== "rejected")
  .map((restaurant) => restaurant.id);

const prompt = [
  `以下是 ${city} 餐厅 POI 审核表。`,
  "你要作为最终裁决模型，不再输出“需要人工复核”。",
  "目标：把给定 id 全部二选一裁决为接受或拒绝。",
  `只裁决这些 id：${unresolvedIds.join(", ")}`,
  "允许使用模型已有知识推理中文店名、拼音、英文名、酒店内餐厅、同址关系、常见旧名/新名，但不要编造不存在的 POI。",
  "接受条件：名称/拼音/英文/语义能合理对应，并且地址、酒店、门牌、商圈或坐标强支撑。",
  "拒绝条件：候选明显是咖啡、酒吧、快餐、地铁、商场、酒店泛 POI、无关餐厅；或名称无法合理对应。",
  "输出 Markdown，只能分两段：",
  "## 1. 接受并建议写入",
  "- **id** — **目标 POI 名**：provider=amap|baidu；理由。",
  "## 2. 拒绝",
  "- **id**：理由。",
  "不要输出第三段，不要输出人工复核，不要遗漏任何给定 id。",
  "",
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

fs.writeFileSync(outputPath, `${result.stdout.trim()}\n`, "utf8");
console.log(`Saved ${outputPath}`);
