#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const reportPath = path.join(root, `${city}-rejected-amap-alias-report.json`);
const outputPath = path.join(root, `${city}-pi-rejected-rescue-decisions.md`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

const candidates = JSON.parse(fs.readFileSync(reportPath, "utf8"))
  .filter((item) => item.recommendation === "rescue_candidate")
  .map((item) => ({
    id: item.id,
    sourceName: item.sourceName,
    currentAddress: item.currentAddress,
    alias: item.best.alias,
    amapPoi: item.best.poi,
    score: item.best.score,
  }));

const prompt = [
  "下面是第一轮被拒绝、第二轮用 Kimi/Pi 别名在高德召回的候选。",
  "任务：做最终二选一，判断是否应该从 rejected 改为 accepted 并写入高德 POI。",
  "你可以使用模型知识判断英文/拼音/中文店名关系，但必须严厉排除同名异址、酒店不符、商场不符、距离/地址明显不一致的候选。",
  "输出 Markdown，只分两段：",
  "## 1. 救回并写入",
  "- **id** — **高德 POI 名**：理由。",
  "## 2. 继续拒绝",
  "- **id**：理由。",
  "不要遗漏任何 id。",
  "",
  JSON.stringify(candidates, null, 2),
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
