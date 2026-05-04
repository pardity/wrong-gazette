import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIResult {
  category: string;
  headline: string;
  verdict: string;
  character: string;
}

const CATEGORIES = [
  "Dad Logic", "Saw It On Facebook", "Heard It On The Radio", "Sports Expert (He's Not)",
  "Golf Nonsense", "Pop Culture Fossil", "Technology Confusion",
  "Financial Genius (He's Not)", "History According To Mike", "Food Crime", "Classic Mike"
];

const CHARACTERS = [
  { id: "homer", emoji: "🍩", name: "Homer Simpson", desc: "food, laziness, general stupidity" },
  { id: "patrick", emoji: "🧽", name: "Patrick Star", desc: "confidently wrong about absolutely everything" },
  { id: "peter", emoji: "🍺", name: "Peter Griffin", desc: "sports takes, pop culture, random tangents" },
  { id: "al", emoji: "👞", name: "Al Bundy", desc: "knows-it-all energy, complaints, past glory" },
  { id: "archie", emoji: "🪑", name: "Archie Bunker", desc: "wrong opinions delivered with total authority" },
  { id: "bob", emoji: "🍔", name: "Bob Belcher", desc: "food adjacent, harmless but misguided" },
  { id: "tim", emoji: "🔧", name: "Tim Taylor", desc: "overconfident tech and DIY takes" },
  { id: "michael", emoji: "📋", name: "Michael Scott", desc: "confidently incorrect, thinks he is helping" },
];

export async function categorizeEntry(text: string): Promise<AIResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are the snarky editor of "To Dementia and Beyond," a satirical newspaper documenting Mike Smithson, a confidently wrong middle-aged man who is basically a real life cartoon dad. Given the entry below, respond ONLY with valid JSON — no markdown, no extra text.

Entry: "${text}"

Categories: ${CATEGORIES.join(", ")}

Characters to pick from (pick the one whose personality best matches this specific blunder):
${CHARACTERS.map(c => `- ${c.id}: ${c.name} (${c.desc})`).join("\n")}

Respond with exactly:
{"category":"<one from categories list>","headline":"<TABLOID HEADLINE IN CAPS, under 12 words, reference Mike by name>","verdict":"<One brutal funny sentence under 25 words roasting Mike. Reference the actual content.>","character":"<one character id from the list>"}`,
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
    const validChar = CHARACTERS.find(c => c.id === parsed.character);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "Classic Mike",
      headline: parsed.headline || "MIKE DID IT AGAIN",
      verdict: parsed.verdict || "Classic Mike.",
      character: validChar ? validChar.id : "patrick",
    };
  } catch {
    return {
      category: "Classic Mike",
      headline: "MIKE SMITHSON STRIKES AGAIN",
      verdict: "The AI tried to process this but needed a moment to recover, much like everyone around Mike.",
      character: "patrick",
    };
  }
}