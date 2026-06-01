const fs = require("fs");
const path = require("path");
const DB_PATH = process.env.VERCEL ? path.join("/tmp", "database.json") : path.join(process.cwd(), "data", "database.json");

function getDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], checkIns: [], posts: [], comments: [], treeholes: [], reactions: [], skills: [], timeCapsules: [] }), "utf8");
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

module.exports = { getDb, saveDb, makeId };