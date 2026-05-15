import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { restaurants } from "@db/schema";
import { eq, and, like, or, sql, inArray, desc, asc } from "drizzle-orm";

export const restaurantRouter = createRouter({
  list: publicQuery.input(
    z.object({
      city: z.string().optional(),
      award: z.array(z.string()).optional(),
      cuisine: z.array(z.string()).optional(),
      priceRange: z.array(z.number()).optional(),
      search: z.string().optional(),
      sort: z.enum(["name", "rating", "priceAsc", "priceDesc"]).optional().default("name"),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    })
  ).query(async ({ input }) => {
    const db = getDb();
    const { city, award, cuisine, priceRange, search, sort, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (city) conditions.push(eq(restaurants.city, city));
    if (award && award.length > 0) conditions.push(inArray(restaurants.award, award as any));
    if (cuisine && cuisine.length > 0) conditions.push(inArray(restaurants.cuisine, cuisine as any));
    if (priceRange && priceRange.length > 0) conditions.push(inArray(restaurants.priceRange, priceRange));
    if (search) {
      conditions.push(
        or(
          like(restaurants.name, `%${search}%`),
          like(restaurants.nameEn, `%${search}%`),
          like(restaurants.address, `%${search}%`),
          like(restaurants.cuisine, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sort) {
      case "rating": orderBy = [desc(restaurants.rating)]; break;
      case "priceAsc": orderBy = [asc(restaurants.priceRange)]; break;
      case "priceDesc": orderBy = [desc(restaurants.priceRange)]; break;
      default: orderBy = [asc(restaurants.name)];
    }

    const [result, countResult] = await Promise.all([
      db.select().from(restaurants).where(whereClause).orderBy(...orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(restaurants).where(whereClause),
    ]);

    return {
      restaurants: result,
      total: countResult[0]?.count ?? 0,
      page,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / limit),
    };
  }),

  getById: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = getDb();
    const result = await db.select().from(restaurants).where(eq(restaurants.id, input.id)).limit(1);
    return result[0] ?? null;
  }),

  getByCity: publicQuery.input(z.object({ city: z.string() })).query(async ({ input }) => {
    const db = getDb();
    return db.select().from(restaurants).where(eq(restaurants.city, input.city)).orderBy(asc(restaurants.award), asc(restaurants.name));
  }),

  getCities: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.select({
      city: restaurants.city,
      count: sql<number>`count(*)`,
    }).from(restaurants).groupBy(restaurants.city).orderBy(desc(sql`count(*)`));
    return result;
  }),

  getCuisines: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.select({
      cuisine: restaurants.cuisine,
      count: sql<number>`count(*)`,
    }).from(restaurants).groupBy(restaurants.cuisine).orderBy(desc(sql`count(*)`));
    return result.map(r => r.cuisine);
  }),

  search: publicQuery.input(z.object({ q: z.string(), city: z.string().optional() })).query(async ({ input }) => {
    const db = getDb();
    const conditions = [
      or(
        like(restaurants.name, `%${input.q}%`),
        like(restaurants.nameEn, `%${input.q}%`),
        like(restaurants.address, `%${input.q}%`),
        like(restaurants.cuisine, `%${input.q}%`)
      ),
    ];
    if (input.city) conditions.push(eq(restaurants.city, input.city));
    return db.select().from(restaurants).where(and(...conditions)).limit(20);
  }),
});
