import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { restaurantRouter } from "./routers/restaurant";
import { favoriteRouter } from "./routers/favorite";
import { aiRouter } from "./routers/ai";
import { localAuthRouter } from "./routers/localAuth";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  restaurant: restaurantRouter,
  favorite: favoriteRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
