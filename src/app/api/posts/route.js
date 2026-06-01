import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { title, content, category, isAnonymous, images } = await req.json();
  // Sanitize user input
  const sanitize = s => typeof s === "string" ? s.replace(/[<>]/g, "").substring(0, 5000) : s;
  const safeContent = sanitize(content);
  const safeTitle = sanitize(title);
  if (!content?.trim()) return Response.json({ error: "内容不能为空" }, { status: 400 });

  const db = getDb();
  db.posts.push({
    id: makeId("p"),
    user_id: payload.userId,
    title: safeTitle || "",
    content: safeContent,
    category: category || "心情",
    is_anonymous: isAnonymous ? 1 : 0,
    created_at: new Date().toISOString()
  });
  saveDb(db);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const db = getDb();
  const posts = db.posts.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
  const enriched = posts.map(p => {
    const user = db.users.find(u => u.id === p.user_id);
    return { ...p, username: user?.username || "" };
  });
  return Response.json({ posts: enriched });
}