import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "michelin-guide-secret-key";

export const localAuthRouter = createRouter({
  register: publicQuery.input(
    z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(6).max(100),
      email: z.string().email().optional(),
      name: z.string().optional(),
    })
  ).mutation(async ({ input }) => {
    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
    if (existing.length > 0) {
      throw new Error("用户名已存在");
    }
    const hashedPassword = await bcrypt.hash(input.password, 10);
    const [user] = await db.insert(users).values({
      username: input.username,
      password: hashedPassword,
      email: input.email,
      name: input.name || input.username,
    }).$returningId();

    const token = jwt.sign({ userId: user.id, username: input.username }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user: { id: user.id, username: input.username, name: input.name || input.username } };
  }),

  login: publicQuery.input(
    z.object({
      username: z.string(),
      password: z.string(),
    })
  ).mutation(async ({ input }) => {
    const db = getDb();
    const existing = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
    if (existing.length === 0) {
      throw new Error("用户名或密码错误");
    }
    const user = existing[0];
    if (!user.password) {
      throw new Error("请使用OAuth登录");
    }
    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      throw new Error("用户名或密码错误");
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    return { token, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req?.headers?.get?.("x-local-auth-token");
    if (!authHeader) return null;
    try {
      const decoded = jwt.verify(authHeader, JWT_SECRET) as { userId: number };
      const db = getDb();
      const result = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      if (result.length === 0) return null;
      const user = result[0];
      return { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    } catch {
      return null;
    }
  }),
});
