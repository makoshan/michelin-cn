#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const evidencePath = path.join(root, `${city}-baidu-browser-evidence.json`);
const outputPath = path.join(root, `${city}-pi-baidu-browser-decisions.md`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")).map((item) => ({
  id: item.id,
  sourceName: item.name,
  sourceAddress: item.address,
  baiduQuery: item.query,
  baiduLines: item.lines.filter((line) =>
    /(中文名|中文名称|米其林|地址|餐厅|店|馆|轩|宴|院|楼|书院|烧饼|面馆|湛碧楼|隐外|王氏|金仲帮|溪畔|雷克拉|越稽|一痕月|万丽轩|福泉|福宴|水墨|觀|观言|鎏金)/.test(line),
  ).slice(0, 35),
}));

const prompt = [
  "下面是通过真实浏览器打开百度搜索得到的剩余 rejected 餐厅证据。",
  "任务：判断哪些可以根据百度搜索页面里的中文名线索救回。",
  "重要：百度 AI 摘要和搜索结果可能错，必须结合英文名、地址、业态、米其林语境判断。",
  "只有当中文名明确、且看起来能用高德按同名同址找到 POI 时，才建议救回。",
  "如果只是泛化回答、地址缺失、同名异址、或中文名明显幻觉，继续拒绝。",
  "输出 Markdown，只分两段：",
  "## 1. 百度浏览器证据可救回",
  "- **id** — **建议高德搜索/写入中文名**：理由。",
  "## 2. 继续拒绝",
  "- **id**：理由。",
  "",
  JSON.stringify(evidence, null, 2),
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
