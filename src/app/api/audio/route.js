// Proxy for NetEase Cloud Music audio
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const songId = url.searchParams.get("id") || "1950777012";

  try {
    // Use fetch to follow redirects automatically
    const neteaseUrl = "https://music.163.com/song/media/outer/url?id=" + songId + ".mp3";
    const response = await fetch(neteaseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://music.163.com",
        "Accept": "*/*"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return new Response("Audio source unavailable", { status: 502 });
    }

    // Return the audio stream with proper headers
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    console.error("Audio proxy error:", e.message);
    return new Response("Audio unavailable: " + e.message, { status: 503 });
  }
}
