import { handle } from "@hono/node-server/vercel";
import app from "../dist/boot.js";

export default handle(app);
