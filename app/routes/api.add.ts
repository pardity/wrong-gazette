import { initDb, getDb } from "~/db.server";
import { categorizeEntry } from "~/ai.server";
import type { Route } from "./+types/api.add";

export async function action({ request }: Route.ActionArgs) {
  const authHeader = request.headers.get("x-gazette-token");
  const expectedToken = process.env.GAZETTE_SECRET_TOKEN;

  if (!expectedToken || authHeader !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { text, date } = body;

  if (!text || !date) {
    return Response.json({ error: "Missing text or date" }, { status: 400 });
  }

  await initDb();
  const db = getDb();

  const ai = await categorizeEntry(text);

  await db.execute({
    sql: "INSERT INTO entries (text, date, category, headline, verdict, character) VALUES (?, ?, ?, ?, ?, ?)",
    args: [text, date, ai.category, ai.headline, ai.verdict, ai.character],
  });

  const inserted = await db.execute(
    "SELECT * FROM entries ORDER BY id DESC LIMIT 1"
  );

  return Response.json({ entry: inserted.rows[0] });
}