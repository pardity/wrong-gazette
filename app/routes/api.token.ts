import type { Route } from "./+types/api.token";

const KNOCK_PROOF = "DONUT42";

export async function action({ request }: Route.ActionArgs) {
  const body = await request.json();
  if (body.knock !== KNOCK_PROOF) {
    return Response.json({ error: "Wrong pattern" }, { status: 401 });
  }
  return Response.json({ token: process.env.GAZETTE_SECRET_TOKEN });
}