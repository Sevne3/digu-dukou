import { getDb, saveDb, makeId } from "@/lib/db";
const CITIES = [
  { name: "北京", lat: 39.9042, lng: 116.4074 },
  { name: "上海", lat: 31.2304, lng: 121.4737 },
  { name: "广州", lat: 23.1291, lng: 113.2644 },
  { name: "深圳", lat: 22.5431, lng: 114.0579 },
  { name: "杭州", lat: 30.2741, lng: 120.1551 },
  { name: "成都", lat: 30.5728, lng: 104.0668 },
  { name: "武汉", lat: 30.5928, lng: 114.3055 },
  { name: "南京", lat: 32.0603, lng: 118.7969 },
  { name: "西安", lat: 34.3416, lng: 108.9398 },
  { name: "长沙", lat: 28.2282, lng: 112.9388 },
  { name: "郑州", lat: 34.7466, lng: 113.6254 },
  { name: "苏州", lat: 31.2990, lng: 120.5853 },
  { name: "昆明", lat: 25.0389, lng: 102.7183 },
  { name: "厦门", lat: 24.4798, lng: 118.0894 },
  { name: "重庆", lat: 29.4316, lng: 106.9123 },
];
const randomCity = () => {
  const c = CITIES[Math.floor(Math.random() * CITIES.length)];
  return { lat: c.lat + (Math.random() - 0.5) * 0.5, lng: c.lng + (Math.random() - 0.5) * 0.5, city: c.name };
};

import { createToken } from "@/lib/auth";
const bcrypt = require("bcryptjs");

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 6) {
      return Response.json({ error: "请填写邮箱和密码（至少6位）" }, { status: 400 });
    }
    const db = getDb();
    if (db.users.find(u => u.email === email)) {
      return Response.json({ error: "该邮箱已被注册" }, { status: 400 });
    }
    const id = makeId("u");
    const hash = await bcrypt.hash(password, 10);
    db.users.push({ id, email, password: hash, username: "", situation: "", created_at: new Date().toISOString() });
    saveDb(db);
    const token = await createToken(id);
    return Response.json({ token, user: { id, email } });
  } catch (err) {
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}