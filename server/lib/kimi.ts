import { env } from "./env";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function callKimi(prompt: string) {
  if (!env.kimiApiKey) {
    throw new Error("KIMI_API_KEY is not configured");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "你是米其林中国指南的中文美食顾问。回答要简洁、准确、有可执行建议。",
    },
    { role: "user", content: prompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const response = await fetch(`${env.kimiApiBaseUrl}/chat/completions`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${env.kimiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.kimiModel,
      messages,
      temperature: 1,
      stream: false,
    }),
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Kimi request failed: ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Kimi response is empty");
  return content;
}
