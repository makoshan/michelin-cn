#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const webEvidencePath = path.join(root, `${city}-rejected-web-evidence.json`);
const aliasReportPath = path.join(root, `${city}-rejected-amap-alias-report.json`);
const outputPath = path.join(root, `${city}-pi-web-evidence-decisions.md`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

function compactWebEvidence(items) {
  return items.map((item) => ({
    id: item.id,
    sourceName: item.sourceName,
    sourceAddress: item.sourceAddress,
    michelinUrl: item.michelinUrl,
    websiteUrl: item.websiteUrl,
    aliases: item.aliases,
    results: item.evidence.flatMap((evidence) =>
      (evidence.results || []).slice(0, 4).map((result) => ({
        query: evidence.query,
        title: result.title,
        url: result.url,
        source: result.source,
        description: result.description,
        snippets: (result.snippets || []).slice(0, 2),
      })),
    ).slice(0, 20),
  }));
}

const webEvidence = compactWebEvidence(JSON.parse(fs.readFileSync(webEvidencePath, "utf8")));
const aliasReport = JSON.parse(fs.readFileSync(aliasReportPath, "utf8")).map((item) => ({
  id: item.id,
  sourceName: item.sourceName,
  currentAddress: item.currentAddress,
  best: item.best,
  recommendation: item.recommendation,
}));

const prompt = [
  "下面是杭州剩余 rejected 餐厅的网页证据和高德别名召回报告。",
  "任务：根据网页/网站标题摘要里出现的中文名、英文名、地址共现，判断哪些 rejected 可以救回。",
  "规则：",
  "- 如果米其林中文页面或权威网页明确给出中文名，并且高德可找到同名/近似同址 POI，可救回。",
  "- 如果只有英文名但没有可落高德 POI，继续拒绝。",
  "- 如果中文名和高德 POI 名称一致但地址/商圈明显不符，继续拒绝。",
  "- 输出 Markdown，只分两段。",
  "## 1. 根据网站中文名救回",
  "- **id** — **应写入的高德/中文 POI 名**：理由。",
  "## 2. 继续拒绝",
  "- **id**：理由。",
  "",
  "网页证据：",
  JSON.stringify(webEvidence, null, 2),
  "",
  "高德别名召回：",
  JSON.stringify(aliasReport, null, 2),
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
