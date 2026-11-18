/* Cloudflare Pages Function: /api/ai — see api/_lib/elevenlabs.js
   Needs the ELEVENLABS_API_KEY environment variable in Cloudflare Pages. */
import { handle } from "../../api/_lib/elevenlabs.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const op = url.searchParams.get("op");
  const cacheable = op === "tts" || op === "sfx" || op === "voices";
  const cache = typeof caches !== "undefined" ? caches.default : null;

  /* Lines that were generated before are served from Cloudflare's cache */
  if (cacheable && cache) {
    const hit = await cache.match(request.url);
    if (hit) return hit;
  }
  const res = await handle(request, env.ELEVENLABS_API_KEY);
  if (cacheable && cache && res.ok) {
    context.waitUntil(cache.put(request.url, res.clone()));
  }
  return res;
}
