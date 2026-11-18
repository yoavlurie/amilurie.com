/* ============================================
   Scene Partner — ElevenLabs proxy (shared code)
   Keeps the API key on the server. Used by:
     api/ai.js            (Vercel)
     functions/api/ai.js  (Cloudflare Pages)
   GET /api/ai?op=status
   GET /api/ai?op=voices
   GET /api/ai?op=tts&voice=ID&text=...
   GET /api/ai?op=sfx&text=...&d=2.5
   Responses are GETs with long cache headers so a
   line that's been generated once is free next time.
   ============================================ */

const API = "https://api.elevenlabs.io";
const MAX_TEXT = 700;
const MAX_SFX = 300;

const ALLOWED_ORIGINS = [
  /^https?:\/\/(www\.)?amilurie\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?amilurie-com\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]*amilurie[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
];

function json(body, status, cacheSecs) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheSecs ? `public, max-age=${cacheSecs}, s-maxage=${cacheSecs}` : "no-store"
    }
  });
}

/* Only answer pages on Ami's site, so other websites can't use up the credits */
function allowed(request) {
  const h = request.headers;
  if (h.get("sec-fetch-site") === "same-origin") return true;
  const origin = h.get("origin") || "";
  const referer = h.get("referer") || "";
  let from = origin;
  if (!from && referer) {
    try { from = new URL(referer).origin; } catch (e) { from = ""; }
  }
  return ALLOWED_ORIGINS.some((re) => re.test(from));
}

async function audioResponse(upstream) {
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return json({ error: "elevenlabs", status: upstream.status, detail: detail.slice(0, 300) }, upstream.status === 401 ? 502 : upstream.status);
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable"
    }
  });
}

export async function handle(request, key) {
  const url = new URL(request.url);
  const op = url.searchParams.get("op") || "status";

  if (op === "status") return json({ ai: !!key });
  if (!key) return json({ error: "no-key" }, 503);
  if (request.method !== "GET") return json({ error: "method" }, 405);
  if (!allowed(request)) return json({ error: "forbidden" }, 403);

  const headers = { "xi-api-key": key, "Content-Type": "application/json" };

  if (op === "voices") {
    const r = await fetch(`${API}/v1/voices`, { headers });
    if (!r.ok) return json({ error: "elevenlabs", status: r.status }, 502);
    const data = await r.json();
    const voices = (data.voices || []).map((v) => ({
      id: v.voice_id,
      name: v.name,
      labels: v.labels || {},
      desc: v.description || "",
      category: v.category || ""
    }));
    return json({ voices }, 200, 3600);
  }

  if (op === "tts") {
    const voice = url.searchParams.get("voice") || "";
    const text = (url.searchParams.get("text") || "").slice(0, MAX_TEXT);
    if (!/^[A-Za-z0-9]{8,40}$/.test(voice) || !text.trim()) return json({ error: "bad-request" }, 400);
    const r = await fetch(`${API}/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        text,
        model_id: "eleven_v3",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    return audioResponse(r);
  }

  if (op === "sfx") {
    const text = (url.searchParams.get("text") || "").slice(0, MAX_SFX);
    const d = parseFloat(url.searchParams.get("d") || "");
    if (!text.trim()) return json({ error: "bad-request" }, 400);
    const body = { text, prompt_influence: 0.5 };
    if (d >= 0.5 && d <= 6) body.duration_seconds = d;
    const r = await fetch(`${API}/v1/sound-generation?output_format=mp3_44100_64`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
    return audioResponse(r);
  }

  return json({ error: "unknown-op" }, 404);
}
