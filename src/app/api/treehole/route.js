import { NextResponse } from "next/server";
import { getDb, saveDb, makeId } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  
  const db = getDb();
  const allHoles = (db.treeholes || []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const enriched = allHoles.map(h => ({
    ...h,
    replyCount: (db.treeholeReplies || []).filter(r => r.holeId === h.id).length
  }));

  // If logged in, return both my notes and public notes
  if (payload) {
    return NextResponse.json({
      myNotes: enriched.filter(h => h.user_id === payload.userId),
      publicNotes: enriched.filter(h => h.isPublic !== false && h.user_id !== payload.userId)
    });
  }

  // If not logged in, just return all public
  return NextResponse.json({
    myNotes: [],
    publicNotes: enriched.filter(h => h.isPublic !== false)
  });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");
  const payload = await verifyToken(auth?.replace("Bearer ", ""));
  if (!payload) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await req.json();
  
  // If it is a reply
  if (body.holeId) {
    const db = getDb();
    if (!db.treeholeReplies) db.treeholeReplies = [];
    db.treeholeReplies.push({
      id: makeId("thr"),
      holeId: body.holeId,
      content: body.content?.trim(),
      created_at: new Date().toISOString()
    });
    saveDb(db);
    return NextResponse.json({ ok: true });
  }

  // Otherwise create new treehole post
  const { content, isPublic } = body;
  if (!content?.trim()) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });

  const db = getDb();
  if (!db.treeholes) db.treeholes = [];
  db.treeholes.push({
    id: makeId("th"),
    user_id: payload.userId,
    content: content.trim(),
    isPublic: isPublic !== false,
    created_at: new Date().toISOString()
  });
  saveDb(db);
  return NextResponse.json({ ok: true });
}
