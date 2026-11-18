/* Vercel Edge Function: /api/ai — see api/_lib/elevenlabs.js
   Needs the ELEVENLABS_API_KEY environment variable in Vercel. */
import { handle } from "./_lib/elevenlabs.js";

export const config = { runtime: "edge" };

export default function handler(request) {
  return handle(request, process.env.ELEVENLABS_API_KEY);
}
