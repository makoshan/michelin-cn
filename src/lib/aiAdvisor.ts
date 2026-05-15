export async function askAIAdvisor(message: string, sessionId?: number) {
  const params = new URLSearchParams({ message });
  if (sessionId) params.set("sessionId", String(sessionId));

  const response = await fetch(`/api/ai/chat?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`AI advisor request failed: ${response.status}`);
  }
  return response.json() as Promise<{ response: string; sessionId: number }>;
}
