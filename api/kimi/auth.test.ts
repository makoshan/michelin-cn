import { describe, expect, test, vi } from "vitest";

vi.mock("../queries/users", () => ({
  findUserByUnionId: vi.fn(),
  upsertUser: vi.fn(),
}));

describe("kimi auth module", () => {
  test("loads when optional OAuth URLs are not configured in development", async () => {
    await expect(import("./auth")).resolves.toHaveProperty("createOAuthCallbackHandler");
  });
});
