import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  kimiApiKey: process.env.KIMI_API_KEY ?? "",
  kimiApiBaseUrl: process.env.KIMI_API_BASE_URL ?? "https://api.moonshot.cn/v1",
  kimiModel: process.env.KIMI_MODEL ?? "kimi-k2.6",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
