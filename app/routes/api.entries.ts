import { initDb, getDb } from "~/db.server";
import type { Route } from "./+types/api.entries";

export async function loader({ request }: Route.LoaderArgs) {
  await initDb();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM entries ORDER BY date DESC, created_at DESC"
  );
  return Response.json({ entries: result.rows });
}