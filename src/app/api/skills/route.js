import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { offer, need, description, contact } = await req.json();
  if (!offer?.trim() || !description?.trim()) return Response.json({ error: "请填写完整信息" }, { status: 400 });

  const db = getDb();
  if (!db.skills) db.skills = [];
  db.skills.push({
    id: makeId("sk"),
    user_id: payload.userId,
    offer: offer.trim(),
    need: need?.trim() || "",
    description: description.trim(),
    contact: contact?.trim() || "",
    status: "open",
    created_at: new Date().toISOString()
  });
  saveDb(db);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ skills: [] });

  const db = getDb();
  const list = (db.skills || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const enriched = list.map(s => {
    const user = db.users.find(u => u.id === s.user_id);
    return { ...s, username: user?.username || "" };
  });

  return Response.json({ skills: enriched });
}

export async function PUT(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return Response.json({ error: "请先登录" }, { status: 401 });

  const { skillId, status } = await req.json();
  const db = getDb();
  const skill = (db.skills || []).find(s => s.id === skillId);
  if (!skill) return Response.json({ error: "未找到" }, { status: 404 });
  if (skill.user_id !== payload.userId) return Response.json({ error: "无权限" }, { status: 403 });

  skill.status = status || "closed";
  saveDb(db);
  return Response.json({ ok: true });
}