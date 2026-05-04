import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIResult {
  category: string;
  headline: string;
  verdict: string;
}

const CATEGORIES = [
  "Dad Logic", "Saw It On Facebook", "Heard It On The Radio", "Sports Expert (He's Not)",
  "Golf Nonsense", "Pop Culture Fossil", "Technology Confusion",
  "Financial Genius (He's Not)", "History According To Mike", "Food Crime", "Classic Mike"
];

export async function categorizeEntry(text: string): Promise<AIResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are the snarky editor of "To Dementia and Beyond," a satirical newspaper documenting Mike Smithson, a confidently wrong middle-aged man who is basically a real life cartoon dad — think Homer Simpson, Peter Griffin, Al Bundy, Patrick Star. Given the entry below, respond ONLY with valid JSON — no markdown, no extra text.

Entry: "${text}"

Categories available: ${CATEGORIES.join(", ")}

Respond with exactly:
{"category":"<one category from the list>","headline":"<TABLOID HEADLINE IN CAPS, under 12 words, punchy and funny, reference Mike by name>","verdict":"<One brutal, specific, funny sentence under 25 words roasting Mike. Reference the actual content. Cartoon dad energy.>"}`,
      },
    ],
  });

  const raw = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim()
    .replace(/```json|```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(raw);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "Classic Mike",
      headline: parsed.headline || "MIKE DID IT AGAIN",
      verdict: parsed.verdict || "Classic Mike.",
    };
  } catch {
    return {
      category: "Classic Mike",
      headline: "MIKE SMITHSON STRIKES AGAIN",
      verdict: "The AI tried to process this but needed a moment to recover, much like everyone around Mike.",
    };
  }
}