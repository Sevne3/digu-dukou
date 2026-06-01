"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { getMe, getCapsules, createCapsule } from "@/lib/api";

export default function CapsulePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [capsules, setCapsules] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [onlineCount] = useState(() => Math.floor(Math.random()*12)+3);

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push("/login"); return; } setUser(d.user); load(); }).catch(() => router.push("/login"));
  }, []);

  const load = async () => {
    try { const d = await getCapsules(); setCapsules(d.capsules || []); setNewCount(d.deliverables || 0); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !sendDate) { setMsg("请填写完整"); return; }
    setSubmitting(true);
    try {
      await createCapsule(content.trim(), sendDate);
      setContent(""); setSendDate(""); setShowForm(false);
      setMsg("时光胶囊已封存！到送达日期会自动投递到你的消息中心"); load();
      setTimeout(() => setMsg(""), 4000);
    } catch { setMsg("创建失败"); }
    setSubmitting(false);
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🏠</span><span className="nav-label">首页</span></a><a href="/checkin"><span>✅</span><span className="nav-label">打卡</span></a><a href="/community"><span>💬</span><span className="nav-label">社群</span></a><a href="/treehole"><span>🤫</span><span className="nav-label">树洞</span></a><a href="/skills"><span>🛠️</span><span className="nav-label">技能</span></a><a href="/capsule" className="active"><span>📦</span><span className="nav-label">胶囊</span></a><a href="/buddy"><span>👥</span><span className="nav-label">搭子</span></a><button onClick={()=>{localStorage.removeItem("token");window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}}>退出</button></div></div></header>
      <div className="db">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"20px"}}>
          <h1 className="db-title" style={{marginBottom:0}}>📦 时光胶囊</h1>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            {newCount > 0 && (
              <span style={{background:"var(--warm-glow-dim)",color:"var(--warm-glow)",padding:"4px 14px",borderRadius:"40px",fontSize:".78rem",fontWeight:600}}>
                ✨ {newCount} 封新信件
              </span>
            )}
            <button onClick={()=>setShowForm(!showForm)} className="btn btn--primary btn--sm">{showForm?"收起":"✉️ 写一封"}</button>
          </div>
        </div>

        <div className="card" style={{marginBottom:"24px",background:"linear-gradient(135deg,#1a1a2e,#2d2d44)",border:"none"}}>
          <p style={{fontSize:"1rem",color:"rgba(250,246,240,.7)",lineHeight:"1.9",textAlign:"center",padding:"12px 0"}}>
            📮 给未来的自己写一封信<br />
            <span style={{fontSize:".85rem",color:"rgba(240,194,127,.5)"}}>到达指定日期后，会自动投递到你的消息中心</span>
          </p>
        </div>

        {newCount > 0 && (
          <div className="card" style={{marginBottom:"24px",background:"var(--warm-glow-dim)",border:"1px solid var(--warm-glow)",textAlign:"center"}}>
            <p style={{fontSize:"1.5rem",marginBottom:"8px"}}>📬</p>
            <p style={{fontSize:".95rem",color:"var(--warm-glow)",fontWeight:600,marginBottom:"4px"}}>你有 {newCount} 封时光胶囊已送达！</p>
            <p style={{fontSize:".82rem",color:"var(--text-muted)"}}>请到消息中心查收</p>
          </div>
        )}

        {msg && <div className="card card--tight" style={{textAlign:"center",marginBottom:"16px",background:"var(--warm-glow-dim)"}}><p style={{fontSize:".9rem",color:"var(--warm-glow)"}}>{msg}</p></div>}

        {showForm && (
          <div className="card" style={{marginBottom:"24px"}}>
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <p style={{fontSize:".95rem",fontWeight:500,color:"var(--night)"}}>写给未来的自己：</p>
              <textarea className="input" style={{minHeight:"140px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.9"}} placeholder="写下你想对未来的自己说的话…" value={content} onChange={e=>setContent(e.target.value)} required />
              <div>
                <label style={{fontSize:".82rem",color:"var(--text-light)",display:"block",marginBottom:"4px"}}>送达日期</label>
                <input type="date" className="input" value={sendDate} onChange={e=>setSendDate(e.target.value)} required min={new Date().toISOString().slice(0,10)} />
              </div>
              {sendDate && (
                <div className="card card--tight" style={{background:"var(--warm-glow-dim)",padding:"12px",textAlign:"center"}}>
                  <p style={{fontSize:".85rem",color:"var(--warm-glow)"}}>
                    🌟 这封信将在 <strong>{sendDate}</strong> 送到你的手中
                  </p>
                </div>
              )}
              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>{submitting?"封存中...":"📮 封存时光胶囊"}</button>
            </form>
          </div>
        )}

        {capsules.length === 0 ? (
          <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"48px 24px"}}>
            <p style={{fontSize:"2rem",marginBottom:"12px"}}>📦</p>
            <p>还没有时光胶囊。<br />给未来的自己写封信吧。</p>
            <button onClick={()=>setShowForm(true)} className="btn btn--primary btn--sm" style={{marginTop:"16px"}}>✉️ 写一封</button>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {capsules.map(c => (
              <div key={c.id} className="pc" style={{opacity:c.delivered?1:.7}}>
                <div className="pc-m">
                  <span>{c.delivered ? "📬 已送达" : "📦 未到时间"}</span>
                  <span style={{fontSize:".78rem",color:"var(--text-muted)"}}>寄出: {c.created_at?.slice(0,10)}</span>
                  <span style={{fontSize:".78rem",color:"var(--warm-glow)"}}>送达: {c.send_date}</span>
                </div>
                <div className="pc-c" style={{fontStyle:"italic",color:c.delivered?"var(--text)":"var(--text-muted)"}}>
                  「{c.content}」
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount + Math.floor(Math.random()*5)}</strong> 人</span>
        </div>
      </div>
    </div>
  );
}
