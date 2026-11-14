import type { APIRoute } from "astro";

// Temporary. The only route that runs in the Worker, used to verify a deploy.
export const prerender = false;

export const GET: APIRoute = () => Response.json({ ok: true });
