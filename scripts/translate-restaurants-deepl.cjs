#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const apiKey = process.env.DEEPL_API_KEY;
const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "restaurants.json");
const cachePath = path.join(root, ".deepl-translation-cache.json");
const targetLang = process.env.DEEPL_TARGET_LANG || "ZH-HANS";
const endpoint = "https://api-free.deepl.com/v2/translate";

const priceLabels = {
  1: "平价",
  2: "中等价位",
  3: "高价位",
  4: "奢华价位",
};

const addressReplacements = [
  [/\bTaiwan\b/g, "台湾"],
  [/\bTaipei\b/g, "台北"],
  [/\bNew Taipei\b/g, "新北"],
  [/\bTaichung\b/g, "台中"],
  [/\bTainan\b/g, "台南"],
  [/\bKaohsiung\b/g, "高雄"],
  [/\bMacau\b/g, "澳门"],
  [/\bHong Kong\b/g, "香港"],
  [/\bDistrict\b/g, "区"],
  [/\bDistrist\b/g, "区"],
  [/\bDist\.\b/g, "区"],
  [/\bRoad\b/g, "路"],
  [/\bRd\.\b/g, "路"],
  [/\bStreet\b/g, "街"],
  [/\bSt\.\b/g, "街"],
  [/\bAvenue\b/g, "大道"],
  [/\bAve\.\b/g, "大道"],
  [/\bSection\b/g, "段"],
  [/\bSec\.\b/g, "段"],
  [/\bAlley\b/g, "巷"],
  [/\bLane\b/g, "弄"],
  [/\s+,/g, ","],
  [/,\s+/g, "，"],
];

if (!apiKey) {
  console.error("Missing DEEPL_API_KEY.");
  process.exit(1);
}

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hasLatin(text) {
  return /[A-Za-z]/.test(text || "");
}

function mostlyChinese(text) {
  const chars = Array.from(text || "").filter((char) => /[\p{L}\p{N}]/u.test(char));
  if (!chars.length) return false;
  const chinese = chars.filter((char) => /[\u3400-\u9fff]/.test(char)).length;
  return chinese / chars.length > 0.55;
}

function needsTranslation(text, field) {
  if (!text || typeof text !== "string") return false;
  if (field === "address") return hasLatin(text);
  return hasLatin(text) && !mostlyChinese(text);
}

function cacheKey(text) {
  return `${targetLang}:${text}`;
}

function normalizeAddress(text) {
  if (!text) return text;
  return addressReplacements.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}

async function translateBatch(texts) {
  const body = new URLSearchParams();
  for (const text of texts) body.append("text", text);
  body.append("target_lang", targetLang);
  body.append("preserve_formatting", "1");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`DeepL request failed: ${response.status} ${response.statusText} ${message}`);
  }

  const payload = await response.json();
  return payload.translations.map((item) => item.text);
}

async function main() {
  const restaurants = loadJson(dataPath, []);
  const cache = loadJson(cachePath, {});
  const wanted = new Set();

  for (const restaurant of restaurants) {
    for (const field of ["city", "address", "description"]) {
      const value = restaurant[field];
      if (needsTranslation(value, field) && !cache[cacheKey(value)]) {
        wanted.add(value);
      }
    }
  }

  const pending = Array.from(wanted);
  console.log(`Need ${pending.length} DeepL translations.`);

  const batchSize = 40;
  for (let index = 0; index < pending.length; index += batchSize) {
    const batch = pending.slice(index, index + batchSize);
    const translated = await translateBatch(batch);
    translated.forEach((text, batchIndex) => {
      cache[cacheKey(batch[batchIndex])] = text;
    });
    saveJson(cachePath, cache);
    console.log(`Translated ${Math.min(index + batch.length, pending.length)} / ${pending.length}`);
  }

  const translatedRestaurants = restaurants.map((restaurant) => {
    const next = { ...restaurant };
    if (next.nameEn && next.name !== next.nameEn) {
      next.nameZh = next.name;
      next.name = next.nameEn;
    }
    for (const field of ["city", "address", "description"]) {
      const value = next[field];
      if (needsTranslation(value, field)) {
        next[field] = cache[cacheKey(value)] || value;
      }
    }
    next.address = normalizeAddress(next.address);
    next.priceLabel = priceLabels[next.priceRange] || "";
    return next;
  });

  saveJson(dataPath, translatedRestaurants);
  console.log(`Updated ${dataPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
