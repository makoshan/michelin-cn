#!/usr/bin/env node
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const reviewPath = path.join(root, `${city}-poi-ai-review.md`);
const outputPath = path.join(root, `${city}-pi-poi-decisions.md`);

if (!process.env.KIMI_API_KEY) {
  console.error("Missing KIMI_API_KEY.");
  process.exit(1);
}

if (!fs.existsSync(reviewPath)) {
  console.error(`Missing review file: ${reviewPath}`);
  process.exit(1);
}

const prompt = [
  `以下是 ${city} 餐厅 POI 审核表。`,
  "你要为餐厅 POI 校准做保守决策。",
  "只根据文件里的证据判断，不要编造外部事实。",
  "接受条件：名称或拼音/英文明显对应；地址、酒店、门牌或商圈相符；距离合理；不是咖啡/酒吧/快餐/地铁/商场误配。",
  "输出 Markdown，分为三段：",
  "1. 接受并建议写入：列出 id、目标 POI 名、理由。",
  "2. 拒绝：列出 id、理由。",
  "3. 需要人工复核：列出 id、还缺什么证据。",
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

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

fs.writeFileSync(outputPath, result.stdout.trim() + "\n", "utf8");
console.log(`Saved ${outputPath}`);
