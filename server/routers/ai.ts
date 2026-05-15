import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { aiChatSessions, aiChatMessages } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { createAiAdvisorResponse } from "../lib/aiAdvisor";

export const aiRouter = createRouter({
  chat: publicQuery.input(
    z.object({
      message: z.string(),
      sessionId: z.number().optional(),
    })
  ).mutation(async ({ input }) => {
    return createAiAdvisorResponse(input);
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
