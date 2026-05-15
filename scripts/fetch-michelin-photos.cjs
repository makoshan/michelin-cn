#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("csv-parse/sync");

const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..");
const defaultCsvPath = path.join(repoRoot, "michelin_china_all_2026.csv");
const defaultRestaurantsPath = path.join(appRoot, "public", "restaurants.json");
const defaultOutputDir = path.join(appRoot, "public", "michelin-photos");

const cityMap = {
  "Beijing, Chinese Mainland": "北京",
  "Shanghai, Chinese Mainland": "上海",
  "Guangzhou, Chinese Mainland": "广州",
  "Chengdu, Chinese Mainland": "成都",
  "Hangzhou, Chinese Mainland": "杭州",
  "Shenzhen, Chinese Mainland": "深圳",
  "Hong Kong, Hong Kong SAR China": "香港",
  Macau: "澳门",
  "Taipei, Taiwan": "台北",
  "Taichung, Taiwan": "台中",
  "Tainan, Taiwan": "台南",
  "Kaohsiung, Taiwan": "高雄",
  "New Taipei, Taiwan": "新北",
};

function parseArgs(argv) {
  const args = {
    city: "杭州",
    csv: defaultCsvPath,
    restaurants: defaultRestaurantsPath,
    outputDir: defaultOutputDir,
    headless: false,
    force: false,
    dryRun: false,
    limit: 0,
    maxImages: 6,
    delayMs: 1500,
    timeoutMs: 45000,
  };

  for (const arg of argv) {
    if (arg === "--headless") args.headless = true;
    else if (arg === "--headed") args.headless = false;
    else if (arg === "--force") args.force = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--city=")) args.city = arg.slice("--city=".length);
    else if (arg.startsWith("--csv=")) args.csv = path.resolve(arg.slice("--csv=".length));
    else if (arg.startsWith("--restaurants=")) args.restaurants = path.resolve(arg.slice("--restaurants=".length));
    else if (arg.startsWith("--output-dir=")) args.outputDir = path.resolve(arg.slice("--output-dir=".length));
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length)) || 0;
    else if (arg.startsWith("--max-images=")) args.maxImages = Number(arg.slice("--max-images=".length)) || args.maxImages;
    else if (arg.startsWith("--delay-ms=")) args.delayMs = Number(arg.slice("--delay-ms=".length)) || args.delayMs;
    else if (arg.startsWith("--timeout-ms=")) args.timeoutMs = Number(arg.slice("--timeout-ms=".length)) || args.timeoutMs;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Fetch Michelin restaurant photos and wire them into public/restaurants.json.

Usage:
  npm run photos:hangzhou
  node scripts/fetch-michelin-photos.cjs --city=杭州 --limit=5

Options:
  --city=杭州                 App city name to fetch. Default: 杭州
  --headless                  Run browser headless. Headed is the default because Michelin may challenge bots.
  --force                     Re-download existing local images.
  --dry-run                   Extract rows and planned files without opening the browser.
  --limit=5                   Only process the first N matching restaurants.
  --max-images=6              Maximum images to save for each restaurant.
  --delay-ms=1500             Delay between restaurant pages.
  --csv=../file.csv           Source Michelin CSV with Url column.
  --restaurants=public/file   App restaurants JSON to update.
  --output-dir=public/photos  Directory for downloaded images.
`);
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/&/g, "and")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, "-").replace(/^-|-$/g, "") || "restaurant";
}

function toAppCity(location) {
  return cityMap[location] || String(location || "").split(",")[0] || "";
}

function readMichelinRows(csvPath, city) {
  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true, bom: true });
  return rows.filter((row) => toAppCity(row.Location) === city && row.Url);
}

function readRestaurants(restaurantsPath) {
  return JSON.parse(fs.readFileSync(restaurantsPath, "utf8"));
}

function matchRestaurants(michelinRows, restaurants) {
  const byKey = new Map();
  for (const restaurant of restaurants) {
    const key = `${restaurant.city}:${normalizeName(restaurant.nameEn || restaurant.name)}`;
    if (!byKey.has(key)) byKey.set(key, restaurant);
  }

  return michelinRows.map((row) => {
    const key = `${toAppCity(row.Location)}:${normalizeName(row.Name)}`;
    return { row, restaurant: byKey.get(key) || null };
  });
}

function bestSrcFromSrcset(srcset) {
  if (!srcset) return null;
  const candidates = srcset
    .split(",")
    .map((part) => {
      const [url, descriptor = "1x"] = part.trim().split(/\s+/);
      const numeric = Number(descriptor.replace(/[^\d.]/g, "")) || 1;
      return { url, numeric };
    })
    .filter((item) => item.url);

  candidates.sort((a, b) => b.numeric - a.numeric);
  return candidates[0]?.url || null;
}

function normalizeImageUrl(url) {
  if (!url) return null;
  const parsed = new URL(url);
  parsed.searchParams.set("w", "900");
  parsed.searchParams.set("h", "900");
  parsed.searchParams.set("org_if_sml", "1");
  return parsed.toString();
}

async function getImageUrls(page, maxImages) {
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("main img")).some((img) => {
        const src = [img.currentSrc, img.getAttribute("src"), img.getAttribute("srcset"), img.getAttribute("data-srcset")]
          .filter(Boolean)
          .join(" ");
        return src.includes("__gmpics");
      }),
    { timeout: 20000 }
  );
  await page.waitForTimeout(1200);

  const images = await page.$$eval("main img", (nodes) =>
    nodes.map((img) => ({
      alt: img.getAttribute("alt") || "",
      src: img.currentSrc || img.getAttribute("src") || "",
      srcset: img.getAttribute("srcset") || img.getAttribute("data-srcset") || "",
      dataSrc: img.getAttribute("data-src") || "",
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    }))
  );

  const urls = [];
  const seen = new Set();

  for (const image of images) {
    const src = image.src || image.dataSrc || image.srcset;
    if (!src.includes("__gmpics") || image.alt.toLowerCase().includes("low quality preview") || src.includes("w=42")) {
      continue;
    }

    const url = normalizeImageUrl(bestSrcFromSrcset(image.srcset) || image.src || image.dataSrc);
    if (!url) continue;

    const key = new URL(url).pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
    if (urls.length >= maxImages) break;
  }

  return urls;
}

async function downloadImage(url, filePath) {
  const response = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Image request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type: ${contentType || "(empty)"}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, bytes);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const michelinRows = readMichelinRows(args.csv, args.city);
  const restaurants = readRestaurants(args.restaurants);
  const matched = matchRestaurants(michelinRows, restaurants).filter((item) => item.restaurant);
  const missing = matchRestaurants(michelinRows, restaurants).filter((item) => !item.restaurant);
  const targets = args.limit > 0 ? matched.slice(0, args.limit) : matched;

  console.log(`City: ${args.city}`);
  console.log(`Michelin rows: ${michelinRows.length}`);
  console.log(`Matched app restaurants: ${matched.length}`);
  if (missing.length) {
    console.log(`Unmatched rows: ${missing.map((item) => item.row.Name).join(", ")}`);
  }

  if (args.dryRun) {
    for (const { row, restaurant } of targets) {
      const slug = `${restaurant.id}-${slugify(row.Name)}.jpg`;
      console.log(`${restaurant.id}\t${row.Name}\t${path.join(args.outputDir, slug)}`);
    }
    return;
  }

  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch {
    throw new Error("Playwright is not installed. Run `npm install` in app/ first.");
  }

  fs.mkdirSync(args.outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(args.timeoutMs);

  const manifest = [];
  const restaurantById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));

  try {
    for (const [index, { row, restaurant }] of targets.entries()) {
      const baseSlug = `${restaurant.id}-${slugify(row.Name)}`;

      console.log(`[${index + 1}/${targets.length}] open ${row.Name}`);
      await page.goto(row.Url, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });

      const cookieButton = page.getByRole("button", { name: /Agree and close/i });
      if (await cookieButton.isVisible().catch(() => false)) {
        await cookieButton.click().catch(() => {});
      }

      const imageUrls = await getImageUrls(page, args.maxImages);
      if (!imageUrls.length) {
        console.log(`  no image found`);
        manifest.push({ id: restaurant.id, name: row.Name, pageUrl: row.Url, status: "missing" });
      } else {
        const localUrls = [];
        const sourceImageUrls = [];

        for (const [imageIndex, imageUrl] of imageUrls.entries()) {
          const suffix = imageIndex === 0 ? "" : `-${imageIndex + 1}`;
          const fileName = `${baseSlug}${suffix}.jpg`;
          const filePath = path.join(args.outputDir, fileName);
          const publicUrl = `/michelin-photos/${fileName}`;

          if (!args.force && fs.existsSync(filePath)) {
            console.log(`  exists ${publicUrl}`);
          } else {
            await downloadImage(imageUrl, filePath);
            console.log(`  saved ${publicUrl}`);
          }

          localUrls.push(publicUrl);
          sourceImageUrls.push(imageUrl);
        }

        const appRestaurant = restaurantById.get(restaurant.id);
        appRestaurant.imageUrl = localUrls[0];
        appRestaurant.imageUrls = localUrls;
        manifest.push({
          id: restaurant.id,
          name: row.Name,
          pageUrl: row.Url,
          sourceImageUrls,
          imageUrl: localUrls[0],
          imageUrls: localUrls,
          status: localUrls.length > 1 ? "downloaded-gallery" : "downloaded",
        });
      }

      if (args.delayMs > 0 && index < targets.length - 1) {
        await page.waitForTimeout(args.delayMs);
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(args.restaurants, JSON.stringify(restaurants, null, 0), "utf8");
  fs.writeFileSync(path.join(args.outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  const saved = manifest.filter((item) => item.imageUrl).length;
  console.log(`Done. ${saved}/${targets.length} restaurants now have local Michelin photos.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
