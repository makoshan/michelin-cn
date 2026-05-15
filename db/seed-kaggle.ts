import { getDb } from "../server/queries/connection";
import { restaurants } from "./schema";
import * as fs from "fs";

async function seed() {
  const db = getDb();
  console.log("Loading China data from Kaggle...");
  
  const raw = fs.readFileSync("/tmp/china_seed.json", "utf-8");
  const records = JSON.parse(raw);
  console.log(`Loaded ${records.length} records`);

  // Truncate existing data
  console.log("Clearing existing restaurant data...");
  await db.delete(restaurants);
  
  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await db.insert(restaurants).values(batch);
    console.log(`  Inserted ${Math.min(i + batchSize, records.length)}/${records.length}`);
  }
  
  console.log("Seed complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
