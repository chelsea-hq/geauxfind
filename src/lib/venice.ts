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
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VENICE_API_KEY");
  }

  const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown Venice error");
    throw new Error(`Venice API error: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = payload.choices?.[0]?.message?.content?.trim() ?? "";
  return stripThinkTags(raw);
}

/** Strip <think>...</think> reasoning blocks that qwen3 models emit */
export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();
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
