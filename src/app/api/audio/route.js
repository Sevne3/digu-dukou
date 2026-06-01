// Proxy for NetEase Cloud Music audio
const https = require("https");
const http = require("http");

export async function GET(req) {
  const url = new URL(req.url);
  const songId = url.searchParams.get("id") || "1950777012";
  
  // NetEase outer URL redirects to actual audio
  const neteaseUrl = "http://music.163.com/song/media/outer/url?id=" + songId + ".mp3";
  
  try {
    const audioUrl = await new Promise((resolve, reject) => {
      https.get("https://music.163.com/song/media/outer/url?id=" + songId + ".mp3", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://music.163.com"
        }
      }, res => {
        // Follow redirect to get actual CDN URL
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          // Use the outer URL directly
          resolve("https://music.163.com/song/media/outer/url?id=" + songId + ".mp3");
        }
      }).on("error", reject);
    });

    // Fetch the actual audio and return as response
    const audioResponse = await fetch(audioUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://music.163.com"
      }
    });

    return new Response(audioResponse.body, {
      headers: {
        "Content-Type": audioResponse.headers.get("content-type") || "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (e) {
    // Fallback: return a redirect to the outer URL
    return new Response("Audio unavailable", { status: 503 });
  }
}

export const dynamic = "force-dynamic";
