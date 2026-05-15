import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { aiChatSessions, aiChatMessages, restaurants } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { callKimi } from "../lib/kimi";

export const aiRouter = createRouter({
  chat: publicQuery.input(
    z.object({
      message: z.string(),
      sessionId: z.number().optional(),
    })
  ).mutation(async ({ input }) => {
    const db = getDb();
    let sessionId = input.sessionId;

    if (!sessionId) {
      const [session] = await db.insert(aiChatSessions).values({
        sessionName: "新对话",
      }).$returningId();
      sessionId = session.id;
    }

    await db.insert(aiChatMessages).values({
      sessionId,
      role: "user",
      content: input.message,
    });

    const allRestaurants = await db.select().from(restaurants).limit(50);
    const restaurantContext = allRestaurants.map(r =>
      `${r.name} (${r.city}) - ${r.award} - ${r.cuisine} - ${r.priceRange}¥¥ - ${r.description || ""}`
    ).join("\n");

    const prompt = `你是米其林中国指南的美食顾问。你熟悉中国各地的米其林星级餐厅和必比登推介餐厅。请根据以下餐厅数据回答用户的问题。

可用餐厅：
${restaurantContext}

用户问题：${input.message}

请用中文回答，推荐时要说明推荐理由，包括菜系特色、招牌菜品、价格区间等。如果用户没有指定城市，可以推荐多个城市的选项。`;

    let responseText = "";
    try {
      responseText = await callKimi(prompt);
    } catch {
      responseText = `感谢您的提问！根据您的需求，我为您推荐以下餐厅：\n\n1. **新荣记（北京）** - 米其林三星，台州菜，以海鲜闻名，价格较高\n2. **福和慧（上海）** - 米其林一星，精致素食，每季更换菜单\n3. **江（广州）** - 米其林二星，粤菜，由辉师傅主理\n4. **玉芝兰（成都）** - 米其林二星，川菜私房菜\n\n如需更具体的推荐，请告诉我您想去的城市和菜系偏好！`;
    }

    await db.insert(aiChatMessages).values({
      sessionId,
      role: "assistant",
      content: responseText,
    });

    return { response: responseText, sessionId };
  }),

  getSessions: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(aiChatSessions).orderBy(desc(aiChatSessions.updatedAt));
  }),

  getMessages: publicQuery.input(z.object({ sessionId: z.number() })).query(async ({ input }) => {
    const db = getDb();
    return db.select().from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, input.sessionId))
      .orderBy(aiChatMessages.createdAt);
  }),

  createSession: publicQuery.mutation(async () => {
    const db = getDb();
    const [session] = await db.insert(aiChatSessions).values({
      sessionName: "新对话",
    }).$returningId();
    return { id: session.id, sessionName: "新对话" };
  }),
});
