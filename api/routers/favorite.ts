import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { favorites, restaurants } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const favoriteRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user?.id;
    if (!userId) return [];
    return db.select({
      id: favorites.id,
      restaurantId: favorites.restaurantId,
      createdAt: favorites.createdAt,
      restaurant: {
        id: restaurants.id,
        name: restaurants.name,
        nameEn: restaurants.nameEn,
        city: restaurants.city,
        district: restaurants.district,
        address: restaurants.address,
        award: restaurants.award,
        cuisine: restaurants.cuisine,
        priceRange: restaurants.priceRange,
        imageUrl: restaurants.imageUrl,
        rating: restaurants.rating,
        reviewCount: restaurants.reviewCount,
      },
    }).from(favorites)
      .leftJoin(restaurants, eq(favorites.restaurantId, restaurants.id))
      .where(eq(favorites.userId, userId))
      .orderBy(favorites.createdAt);
  }),

  toggle: authedQuery.input(z.object({ restaurantId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const userId = ctx.user?.id as number;
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, input.restaurantId)))
      .limit(1);
    
    if (existing.length > 0) {
      await db.delete(favorites).where(eq(favorites.id, existing[0].id));
      return { isFavorited: false };
    } else {
      await db.insert(favorites).values({ userId, restaurantId: input.restaurantId });
      return { isFavorited: true };
    }
  }),

  check: authedQuery.input(z.object({ restaurantId: z.number() })).query(async ({ ctx, input }) => {
    const db = getDb();
    const userId = ctx.user?.id as number;
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, input.restaurantId)))
      .limit(1);
    return { isFavorited: existing.length > 0 };
  }),
});
