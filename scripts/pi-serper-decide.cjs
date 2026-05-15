#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const evidencePath = path.join(root, `${city}-serper-rejected-evidence.json`);
const outputPath = path.join(root, `${city}-pi-serper-decisions.md`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8")).map((item) => ({
  id: item.id,
  name: item.name,
  nameEn: item.nameEn,
  address: item.address,
  phone: item.phone,
  previousRejectReason: item.reason,
  searchResults: item.evidence.flatMap((entry) => {
    const results = [];
    if (entry.result.answerBox) results.push({ query: entry.query, type: "answerBox", ...entry.result.answerBox });
    if (entry.result.knowledgeGraph) results.push({ query: entry.query, type: "knowledgeGraph", ...entry.result.knowledgeGraph });
    for (const place of entry.result.places || []) results.push({ query: entry.query, type: "place", ...place });
    for (const organic of entry.result.organic || []) results.push({ query: entry.query, type: "organic", title: organic.title, link: organic.link, snippet: organic.snippet });
    return results;
  }).slice(0, 45),
}));

const prompt = [
  "下面是杭州剩余 rejected 餐厅的 Serper/Google 搜索证据。",
  "任务：判断哪些可以用搜索证据救回。救回条件必须很严格：",
  "- 搜索结果明确给出中文名，或英文名/电话/地址与中文 POI 强共现。",
  "- 必须能进一步用高德按中文名和地址找到导航 POI。",
  "- 对 AI 摘要、泛化搜索结果、同名异址保持怀疑。",
  "输出 Markdown，只分两段：",
  "## 1. Serper 证据可救回",
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
