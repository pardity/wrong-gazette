import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/entries", "routes/api.entries.ts"),
  route("api/add", "routes/api.add.ts"),
  route("api/delete/:id", "routes/api.delete.ts"),
  route("api/token", "routes/api.token.ts"),
] satisfies RouteConfig;
