import { getDb } from "~/db.server";
import type { Route } from "./+types/api.delete.$id";

export async function action({ request, params }: Route.ActionArgs) {
  const authHeader = request.headers.get("x-gazette-token");
  const expectedToken = process.env.GAZETTE_SECRET_TOKEN;

  if (!expectedToken || authHeader !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  await db.execute({
    sql: "DELETE FROM entries WHERE id = ?",
    args: [params.id],
  });

  return Response.json({ ok: true });
}