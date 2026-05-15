import { getDb } from "../server/queries/connection";
import { restaurants } from "./schema";

const data = [
  { name: "ULTRAVIOLET by Paul Pairet", nameEn: "ULTRAVIOLET by Paul Pairet", city: "上海", district: "黄浦区", address: "中山东一路18号", latitude: "31.23040000", longitude: "121.49060000", award: "3-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+86 21 6323 9898", description: "一晚只接待10位客人，沉浸式用餐体验", rating: "4.9", reviewCount: 127 },
  { name: "DA VITTORIO SHANGHAI", nameEn: "DA VITTORIO SHANGHAI", city: "上海", district: "黄浦区", address: "BFC外滩金融中心北区N3栋3楼", latitude: "31.23040000", longitude: "121.49370000", award: "2-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+86 21 6333 9199", description: "意大利家族餐厅，海鲜和意面闻名", rating: "4.8", reviewCount: 342 },
  { name: "Taian Table", nameEn: "Taian Table", city: "上海", district: "徐汇区", address: "泰安路113号", latitude: "31.21580000", longitude: "121.44250000", award: "2-star" as const, cuisine: "西餐", priceRange: 4, phone: "+86 21 6283 9260", description: "德国主厨Stefan Stiller的现代欧洲料理", rating: "4.8", reviewCount: 289 },
  { name: "8 1/2 Otto e Mezzo BOMBANA", nameEn: "8 1/2 Otto e Mezzo BOMBANA", city: "上海", district: "静安区", address: "圆明园路169号协进大楼6楼", latitude: "31.24060000", longitude: "121.48560000", award: "2-star" as const, cuisine: "意大利菜", priceRange: 4, phone: "+86 21 6087 2890", description: "名厨Umberto Bombana的意大利餐厅", rating: "4.7", reviewCount: 256 },
  { name: "福和慧", nameEn: "Fu He Hui", city: "上海", district: "长宁区", address: "愚园路1037号", latitude: "31.22440000", longitude: "121.42860000", award: "1-star" as const, cuisine: "素食", priceRange: 4, phone: "+86 21 5239 7878", description: "精致素食料理，每季更换菜单", rating: "4.7", reviewCount: 198 },
  { name: "明阁", nameEn: "Ming Court", city: "上海", district: "虹桥", address: "虹桥天地康得思酒店", latitude: "31.19240000", longitude: "121.32060000", award: "1-star" as const, cuisine: "粤菜", priceRange: 3, phone: "+86 21 5263 9618", description: "香港米其林星级团队的粤菜餐厅", rating: "4.6", reviewCount: 176 },
  { name: "Jean Georges", nameEn: "Jean Georges", city: "上海", district: "黄浦区", address: "中山东一路3号外滩三号4楼", latitude: "31.23560000", longitude: "121.48580000", award: "1-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+86 21 6321 7733", description: "Jean-Georges Vongerichten的旗舰餐厅", rating: "4.6", reviewCount: 312 },
  { name: "Maison Lameloise", nameEn: "Maison Lameloise", city: "上海", district: "浦东新区", address: "银城中路501号上海中心大厦68楼", latitude: "31.23580000", longitude: "121.50650000", award: "1-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+86 21 6881 3811", description: "勃艮第百年三星餐厅上海分店", rating: "4.5", reviewCount: 234 },
  { name: "大壶春", nameEn: "Da Hu Chun", city: "上海", district: "黄浦区", address: "云南南路71号", latitude: "31.23450000", longitude: "121.47890000", award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 1, description: "老字号生煎包，创立于1932年", rating: "4.4", reviewCount: 892 },
  { name: "老正兴菜馆", nameEn: "Lao Zheng Xing", city: "上海", district: "黄浦区", address: "福州路556号", latitude: "31.23500000", longitude: "121.47340000", award: "bib-gourmand" as const, cuisine: "上海菜", priceRange: 2, description: "创立于1862年的本帮菜老字号", rating: "4.3", reviewCount: 756 },
  { name: "新荣记（新源南路）", nameEn: "Xin Rong Ji", city: "北京", district: "朝阳区", address: "新源南路8号启皓北京东塔1层", latitude: "39.94060000", longitude: "116.45780000", award: "3-star" as const, cuisine: "台州菜", priceRange: 4, phone: "+86 10 6502 7699", description: "中国首家米其林三星中餐", rating: "4.9", reviewCount: 423 },
  { name: "京兆尹", nameEn: "King's Joy", city: "北京", district: "东城区", address: "雍和宫大街五道营胡同2号", latitude: "39.94890000", longitude: "116.41060000", award: "3-star" as const, cuisine: "素食", priceRange: 4, phone: "+86 10 8404 9191", description: "米其林三星素食餐厅", rating: "4.8", reviewCount: 356 },
  { name: "潮上潮（朝阳）", nameEn: "Chao Shang Chao", city: "北京", district: "朝阳区", address: "东三环中路7号", latitude: "39.90720000", longitude: "116.45670000", award: "2-star" as const, cuisine: "潮州菜", priceRange: 4, phone: "+86 10 8587 9999", description: "高端潮州菜", rating: "4.7", reviewCount: 234 },
  { name: "江", nameEn: "Jiang by Chef Fei", city: "广州", district: "天河区", address: "天河路389号文华东方酒店3楼", latitude: "23.13890000", longitude: "113.32560000", award: "2-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 3808 8888", description: "辉师傅主理的米其林二星粤菜", rating: "4.8", reviewCount: 312 },
  { name: "御宝轩", nameEn: "Imperial Treasure", city: "广州", district: "天河区", address: "天环广场", latitude: "23.13450000", longitude: "113.32340000", award: "2-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+86 20 3856 5888", description: "新加坡粤菜名店", rating: "4.7", reviewCount: 267 },
  { name: "玉芝兰", nameEn: "Yu Zhi Lan", city: "成都", district: "锦江区", address: "长发街24号", latitude: "30.66000000", longitude: "104.07800000", award: "2-star" as const, cuisine: "川菜", priceRange: 4, phone: "+86 28 8612 8888", description: "兰桂均主理的川菜二星餐厅", rating: "4.8", reviewCount: 234 },
  { name: "Ensue", nameEn: "Ensue", city: "深圳", district: "福田区", address: "益田路4088号香格里拉大酒店40楼", latitude: "22.53800000", longitude: "114.05500000", award: "2-star" as const, cuisine: "创意菜", priceRange: 4, phone: "+86 755 2151 3838", description: "名厨Christopher Kostow主理", rating: "4.7", reviewCount: 234 },
  { name: "龙景轩", nameEn: "Lung King Heen", city: "香港", district: "中环", address: "中环金融街8号四季酒店4楼", latitude: "22.28600000", longitude: "114.15900000", award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+852 3196 8888", description: "全球首家米其林三星中餐厅", rating: "4.9", reviewCount: 567 },
  { name: "Robuchon au Dome", nameEn: "Robuchon au Dome", city: "澳门", district: "澳门半岛", address: "新葡京酒店43楼", latitude: "22.18900000", longitude: "113.54400000", award: "3-star" as const, cuisine: "法国菜", priceRange: 4, phone: "+853 8803 7878", description: "Joel Robuchon澳门旗舰餐厅", rating: "4.8", reviewCount: 345 },
  { name: "颐宫中餐", nameEn: "Le Palais", city: "台北", district: "大同区", address: "承德路一段3号君品酒店17楼", latitude: "25.04900000", longitude: "121.51700000", award: "3-star" as const, cuisine: "粤菜", priceRange: 4, phone: "+886 2 2181 9950", description: "台湾首家米其林三星中餐厅", rating: "4.8", reviewCount: 456 },
];

async function seed() {
  const db = getDb();
  console.log("Checking existing data...");
  const existing = await db.select().from(restaurants).limit(1);
  if (existing.length > 0) {
    console.log("Data already exists, skipping seed.");
    return;
  }
  console.log("Inserting restaurants...");
  await db.insert(restaurants).values(data);
  console.log(`Seeded ${data.length} restaurants`);
}

seed().catch(e => { console.error(e); process.exit(1); });
