import { aiChatMessages, aiChatSessions, restaurants } from "@db/schema";
import staticRestaurants from "../../public/restaurants.json";
import { callKimi } from "./kimi";
import { getDb } from "../queries/connection";

type RestaurantContextItem = {
  name?: string | null;
  city?: string | null;
  award?: string | null;
  cuisine?: string | null;
  priceRange?: number | null;
  description?: string | null;
};

function buildRestaurantContext(items: RestaurantContextItem[]) {
  return items.map((r) =>
    `${r.name} (${r.city}) - ${r.award} - ${r.cuisine} - ${r.priceRange}¥¥ - ${r.description || ""}`
  ).join("\n");
}

function staticRecommendations(message: string) {
  const normalized = message.toLowerCase();
  const detectedCity = ["杭州", "上海", "广州", "北京", "成都", "深圳", "香港", "澳门", "台北"].find((city) => message.includes(city));
  const cuisineHints = [
    { keyword: "粤", cuisine: "粤菜" },
    { keyword: "川", cuisine: "川菜" },
    { keyword: "素", cuisine: "素食" },
    { keyword: "面", cuisine: "面食" },
  ];
  const detectedCuisine = cuisineHints.find((hint) => normalized.includes(hint.keyword))?.cuisine;
  const awardHints = [
    { keyword: "三星", award: "3-star" },
    { keyword: "二星", award: "2-star" },
    { keyword: "一星", award: "1-star" },
    { keyword: "必比登", award: "bib-gourmand" },
  ];
  const detectedAward = awardHints.find((hint) => normalized.includes(hint.keyword))?.award;

  let candidates = staticRestaurants as RestaurantContextItem[];
  if (detectedCity) candidates = candidates.filter((restaurant) => restaurant.city === detectedCity);

  const narrowed = candidates.filter((restaurant) => {
    const cuisineMatch = detectedCuisine ? restaurant.cuisine?.includes(detectedCuisine) : true;
    const awardMatch = detectedAward ? restaurant.award === detectedAward : true;
    return cuisineMatch && awardMatch;
  });

  const items = (narrowed.length ? narrowed : candidates).slice(0, 4);
  const fallbackItems = items.length ? items : (staticRestaurants as RestaurantContextItem[]).slice(0, 4);
  const lines = fallbackItems.map((restaurant, index) =>
    `${index + 1}. **${restaurant.name}（${restaurant.city}）** - ${restaurant.award || "米其林推荐"}，${restaurant.cuisine || "特色菜"}，${restaurant.description || "适合加入候选清单。"}`
  );

  return `可以先看这几家：\n\n${lines.join("\n")}\n\n当前未配置线上 AI 密钥时，我会基于已发布的餐厅数据给出静态推荐；配置 KIMI_API_KEY 后可启用更完整的对话式建议。`;
}

export async function createAiAdvisorResponse(input: { message: string; sessionId?: number }) {
  let db: ReturnType<typeof getDb> | null = null;
  if (process.env.AI_CHAT_PERSISTENCE === "1") {
    try {
      db = getDb();
    } catch {
      db = null;
    }
  }
  let sessionId = input.sessionId;

  if (db && !sessionId) {
    try {
      const [session] = await db.insert(aiChatSessions).values({
        sessionName: "新对话",
      }).$returningId();
      sessionId = session.id;
    } catch {
      db = null;
    }
  }

  if (!sessionId) sessionId = Date.now();

  if (db) {
    try {
      await db.insert(aiChatMessages).values({
        sessionId,
        role: "user",
        content: input.message,
      });
    } catch {
      db = null;
    }
  }

  let allRestaurants: RestaurantContextItem[] = (staticRestaurants as RestaurantContextItem[]).slice(0, 50);
  if (db) {
    try {
      allRestaurants = await db.select().from(restaurants).limit(50);
    } catch {
      db = null;
    }
  }
  const restaurantContext = buildRestaurantContext(allRestaurants);
  const prompt = `你是米其林中国指南的美食顾问。你熟悉中国各地的米其林星级餐厅和必比登推介餐厅。请根据以下餐厅数据回答用户的问题。

可用餐厅：
${restaurantContext}

用户问题：${input.message}

请用中文回答，推荐时要说明推荐理由，包括菜系特色、招牌菜品、价格区间等。如果用户没有指定城市，可以推荐多个城市的选项。`;

  let responseText = "";
  try {
    responseText = await callKimi(prompt);
  } catch {
    responseText = staticRecommendations(input.message);
  }

  if (db) {
    try {
      await db.insert(aiChatMessages).values({
        sessionId,
        role: "assistant",
        content: responseText,
      });
    } catch {
      // Chat should remain usable even when persistence is unavailable.
    }
  }

  return { response: responseText, sessionId };
}
