import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const db = getDb();
  const capsules = (db.timeCapsules || []).filter(c => c.user_id === payload.userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  
  // Check for delivered capsules (date reached or past)
  const now = new Date().toISOString().slice(0, 10);
  const deliverables = capsules.filter(c => c.send_date <= now && !c.delivered);
  deliverables.forEach(c => { c.delivered = true; c.delivered_at = new Date().toISOString(); });
  if (deliverables.length > 0) saveDb(db);

  return NextResponse.json({ capsules, deliverables: deliverables.length });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { content, sendDate } = await req.json();
  if (!content?.trim() || !sendDate) return NextResponse.json({ error: "参数不完整" }, { status: 400 });

  const db = getDb();
  if (!db.timeCapsules) db.timeCapsules = [];

  const user = db.users.find(u => u.id === payload.userId);
  db.timeCapsules.push({
    id: makeId("cap"),
    user_id: payload.userId,
    user_email: user?.email || "",
    content: content.trim(),
    send_date: sendDate,
    created_at: new Date().toISOString(),
    delivered: false
  });

  saveDb(db);
  return NextResponse.json({ ok: true });
}
