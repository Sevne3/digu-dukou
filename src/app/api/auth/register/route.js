import { getDb, saveDb, makeId } from "@/lib/db";
import { createToken } from "@/lib/auth";
const bcrypt = require("bcryptjs");

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

const RESEND_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:4567";

function makeVerificationToken() {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}

function buildWelcomeEmail(link) {
  return [
    '<div style="max-width:480px;margin:40px auto;padding:32px;background:#faf6f0;border-radius:20px;font-family:sans-serif">',
    '<h1 style="font-size:1.4rem;color:#1a1a2e;margin-bottom:24px">🌿 欢迎来到低谷渡口</h1>',
    '<p style="color:#5d4e37;line-height:1.8;font-size:0.95rem">你收到这封邮件，是因为有人在低谷渡口注册了账号。</p>',
    '<p style="color:#5d4e37;line-height:1.8;font-size:0.95rem">点击下方按钮验证你的邮箱：</p>',
    '<div style="text-align:center;margin:32px 0">',
    '<a href="' + link + '" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f0c27f,#dba76a);color:#1a1a2e;text-decoration:none;border-radius:40px;font-weight:600;font-size:0.95rem">验证邮箱</a>',
    "</div>",
    '<p style="color:#8a7a6e;font-size:0.82rem;line-height:1.6">如果这不是你操作的，请忽略这封邮件。<br/>链接有效期 24 小时。</p>',
    '<p style="color:#b8aaa0;font-size:0.78rem;margin-top:24px;text-align:center">低谷渡口 — 你不是一个人</p>',
    "</div>"
  ].join("
");
}

async function sendVerificationEmail(email, token) {
  if (!RESEND_KEY) return;
  const link = BASE_URL + "/verify-email?token=" + token + "&email=" + encodeURIComponent(email);
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "低谷渡口 <onboarding@resend.dev>",
        to: email,
        subject: "🌿 验证你的邮箱 — 低谷渡口",
        html: buildWelcomeEmail(link)
      })
    });
  } catch(e) {
    console.error("Send email failed:", e.message);
  }
}

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
    const verificationToken = makeVerificationToken();
    db.users.push({
      id, email, password: hash, username: "", situation: "",
      emailVerified: false, verificationToken,
      created_at: new Date().toISOString()
    });
    saveDb(db);

    sendVerificationEmail(email, verificationToken);

    const token = await createToken(id);
    return Response.json({
      token, user: { id, email, emailVerified: false },
      message: "注册成功！请查看你的邮箱完成验证。"
    });
  } catch (err) {
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}
