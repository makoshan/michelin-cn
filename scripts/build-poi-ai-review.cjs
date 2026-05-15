#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const city = process.env.REVIEW_CITY || "杭州";
const dataPath = path.join(root, "public", "restaurants.json");
const csvPath = path.resolve(root, "..", "michelin_china_all_2026.csv");
const amapReportPath = path.join(root, "amap-calibration-report.json");
const baiduReportPath = path.join(root, "baidu-calibration-report.json");
const braveEvidencePath = path.join(root, `${city}-brave-poi-evidence.json`);
const outPath = path.join(root, `${city}-poi-ai-review.md`);

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function decisionHint(amap, baidu) {
  const a = amap?.match;
  const b = baidu?.match;
  if (a?.score >= 90) return "高德高置信，可接受；仍需排除酒店/商场邻近误配。";
  if (a?.score === 75 && Number(a.distance) <= 25) return "坐标很近但名称证据不足，适合 AI/人工复核。";
  if (b?.score >= 90) return "百度高分但需重点排除酒吧、咖啡、地铁、快餐等误配。";
  return "证据不足，建议拒绝或补充官网/大众点评等来源。";
}

const restaurants = readJson(dataPath, []);
const sourceRows = parse(fs.readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
});
const amapById = new Map(readJson(amapReportPath, []).map((item) => [item.id, item]));
const baiduById = new Map(readJson(baiduReportPath, []).map((item) => [item.id, item]));
const braveById = new Map(readJson(braveEvidencePath, []).map((item) => [item.id, item]));

const list = restaurants.filter((restaurant) => restaurant.city === city);
let markdown = `# ${city}餐厅 POI / 翻译 / AI 审核表\n\n`;
markdown += [
  "目标：用 Michelin 原始英文名和地址、DeepL 备用中文名、高德/百度 POI 候选、坐标距离共同判断。",
  "规则：名称语义或拼音明显对应，地址门牌/酒店/商圈相符，距离合理，才可接受。",
  "拒绝：咖啡、酒吧、快餐、地铁、商场、普通邻近餐饮等明显非目标 POI。",
  "",
].join("\n");

for (const restaurant of list) {
  const source = sourceRows[restaurant.id - 1] || {};
  const amap = amapById.get(restaurant.id);
  const baidu = baiduById.get(restaurant.id);
  const brave = braveById.get(restaurant.id);

  markdown += `## ${restaurant.id} ${source.Name || restaurant.nameEn || restaurant.name}\n`;
  markdown += `- 当前名: ${restaurant.name}\n`;
  if (restaurant.nameZh && restaurant.nameZh !== restaurant.name) {
    markdown += `- 翻译/备用中文名: ${restaurant.nameZh}\n`;
  }
  markdown += `- Michelin 英文地址: ${source.Address || ""}\n`;
  markdown += `- 当前地址: ${restaurant.address}\n`;
  markdown += `- WGS84: ${restaurant.longitude},${restaurant.latitude}\n`;
  if (restaurant.amapPoiId) markdown += `- 已写入高德: ${restaurant.amapPoiId} ${restaurant.amapLocation}\n`;
  if (restaurant.baiduUid) markdown += `- 已写入百度: ${restaurant.baiduUid} ${restaurant.baiduLocation}\n`;
  if (amap?.reverseAddress) markdown += `- 高德逆地理: ${amap.reverseAddress}\n`;
  if (amap?.match) {
    markdown += `- 高德候选: ${amap.match.name} | ${amap.match.address} | 距离 ${amap.match.distance}m | 分数 ${amap.match.score} | ${amap.match.type}\n`;
  } else if (amap?.error) {
    markdown += `- 高德错误: ${amap.error}\n`;
  } else {
    markdown += "- 高德候选: 无\n";
  }
  if (baidu?.match) {
    markdown += `- 百度候选: ${baidu.match.name} | ${baidu.match.address} | 分数 ${baidu.match.score} | ${baidu.match.tag || ""}\n`;
  } else if (baidu?.error) {
    markdown += `- 百度错误: ${baidu.error}\n`;
  } else {
    markdown += "- 百度候选: 无\n";
  }
  if (brave) {
    markdown += `- Brave 证据分: ${brave.evidence.score} | ${brave.evidence.reasons.join("；") || "无明确网页证据"}\n`;
    for (const result of brave.results.slice(0, 3)) {
      markdown += `  - ${result.title} (${result.source}) ${result.url}\n`;
    }
  }
  markdown += `- 初步建议: ${decisionHint(amap, baidu)}\n`;
  markdown += "- AI判定: 待审\n\n";
}

fs.writeFileSync(outPath, markdown, "utf8");
console.log(`Saved ${outPath}`);
