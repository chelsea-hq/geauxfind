type VeniceMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callVeniceChat({
  messages,
  maxTokens,
  temperature = 0.5,
  model = "qwen3-4b",
}: {
  messages: VeniceMessage[];
  maxTokens: number;
  temperature?: number;
  model?: "qwen3-4b" | "qwen-2.5-coder-32b";
}) {
  // Prefer OpenRouter (cheaper, sustainable for real traffic)
  // Fall back to Venice if OpenRouter key not set
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const veniceKey = process.env.VENICE_API_KEY;

  if (!openRouterKey && !veniceKey) {
    throw new Error("Missing OPENROUTER_API_KEY or VENICE_API_KEY");
  }

  const useOpenRouter = !!openRouterKey;
  const apiUrl = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.venice.ai/api/v1/chat/completions";
  const apiKey = useOpenRouter ? openRouterKey : veniceKey;

  // Map Venice models to cheap OpenRouter equivalents
  const openRouterModel = model === "qwen-2.5-coder-32b"
    ? "qwen/qwen-2.5-coder-32b-instruct"
    : "meta-llama/llama-4-scout";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(useOpenRouter ? { "HTTP-Referer": "https://geauxfind.com", "X-Title": "GeauxFind" } : {}),
    },
    body: JSON.stringify({
      model: useOpenRouter ? openRouterModel : model,
      stream: false,
      temperature,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown API error");
    throw new Error(`${useOpenRouter ? "OpenRouter" : "Venice"} API error: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content?.trim() ?? "";
  return stripThinkTags(raw);
}

/** Strip <think>...</think> reasoning blocks that qwen3 models emit */
export function stripThinkTags(text: string): string {
  // Strip closed think blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();
  // Strip unclosed think blocks (everything from <think> to end)
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, "").trim();
  return cleaned;
}

export function extractJson<T>(input: string): T {
  const trimmed = input.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const firstObj = candidate.indexOf("{");
    const lastObj = candidate.lastIndexOf("}");
    if (firstObj >= 0 && lastObj > firstObj) {
      return JSON.parse(candidate.slice(firstObj, lastObj + 1)) as T;
    }

    const firstArr = candidate.indexOf("[");
    const lastArr = candidate.lastIndexOf("]");
    if (firstArr >= 0 && lastArr > firstArr) {
      return JSON.parse(candidate.slice(firstArr, lastArr + 1)) as T;
    }

    throw new Error("Failed to parse AI JSON response");
  }
}
