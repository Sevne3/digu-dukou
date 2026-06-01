"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getMe, getSkills, createSkill, updateSkill } from "@/lib/api";

export default function SkillsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [offer, setOffer] = useState("");
  const [need, setNeed] = useState("");
  const [desc, setDesc] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push("/login"); return; } setUser(d.user); loadSkills(); }).catch(() => router.push("/login"));
  }, []);

  const loadSkills = async () => { try { const d = await getSkills(); setSkills(d.skills || []); } catch {} setLoading(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offer.trim() || !desc.trim()) { setMessage("请填写完整信息"); return; }
    setSubmitting(true);
    try {
      await createSkill({ offer: offer.trim(), need: need.trim(), description: desc.trim(), contact: contact.trim() });
      setOffer(""); setNeed(""); setDesc(""); setContact(""); setShowForm(false); setMessage("🎉 发布成功！"); loadSkills();
    } catch { setMessage("发布失败"); }
    setSubmitting(false); setTimeout(() => setMessage(""), 3000);
  };

  const markDone = async (id) => { try { await updateSkill(id, "closed"); loadSkills(); } catch {} };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard" className=""><span>🏠</span><span className="nav-label">首页</span></a><a href="/checkin" className=""><span>✅</span><span className="nav-label">打卡</span></a><a href="/community" className=""><span>💬</span><span className="nav-label">社群</span></a><a href="/treehole" className=""><span>🤫</span><span className="nav-label">树洞</span></a><a href="/skills" className=" active"><span>🛠️</span><span className="nav-label">技能</span></a><a href="/capsule" className=""><span>📦</span><span className="nav-label">胶囊</span></a><a href="/buddy" className=""><span>👥</span><span className="nav-label">搭子</span></a><button onClick={()=>{localStorage.removeItem("token");window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color="rgba(255,255,255,.7)"} onmouseleave={e=>e.target.style.color="rgba(255,255,255,.35)"}>退出</button></div></div></header>
      <div className="db">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"24px"}}>
          <h1 className="db-title" style={{marginBottom:0}}>🛠️ 技能集市</h1>
          <button onClick={()=>setShowForm(!showForm)} className="btn btn--primary btn--sm">{showForm ? "收起" : "📢 发布技能"}</button>
        </div>
        <p style={{color:"var(--text-light)",fontSize:".9rem",marginBottom:"24px",lineHeight:"1.8"}}>
          用你擅长的，换你需要的。<br />每个人都有自己独特的价值，在这里，技能就是最好的货币。
        </p>
        {message && <div className="card card--tight" style={{textAlign:"center",marginBottom:"16px",background:"var(--warm-glow-dim)"}}><p style={{fontSize:".9rem",color:"var(--warm-glow)"}}>{message}</p></div>}
        {showForm && (
          <div className="card" style={{marginBottom:"24px"}}>
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div className="grid-2">
                <input className="input" placeholder="我能提供（如：PPT设计）" value={offer} onChange={e=>setOffer(e.target.value)} required />
                <input className="input" placeholder="我需要（如：英语陪练，选填）" value={need} onChange={e=>setNeed(e.target.value)} />
              </div>
              <textarea className="input" style={{minHeight:"80px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.9"}} placeholder="详细描述你的技能和交换方式…" value={desc} onChange={e=>setDesc(e.target.value)} required />
              <input className="input" placeholder="联系方式（微信/邮箱）" value={contact} onChange={e=>setContact(e.target.value)} />
              <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>{submitting ? "发布中..." : "🌿 发布技能交换"}</button>
            </form>
          </div>
        )}
        {skills.length === 0 ? (
          <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"48px 24px"}}>
            <p style={{fontSize:"2rem",marginBottom:"12px"}}>🛠️</p><p>还没有人发布技能。成为第一个吧。</p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            {skills.map(s => (
              <div key={s.id} className="pc">
                <div className="pc-m">
                  <span className="pc-a">{s.username || "渡口居民"}</span>
                  <span>{s.created_at?.slice(0,10)}</span>
                  <span className={"badge "+(s.status==="closed"?"badge--ghost":"badge--ghost")}
                    style={s.status==="closed"?{background:"#e8e8e8",color:"#aaa"}:{background:"var(--warm-glow-dim)",color:"var(--warm-glow)"}}>
                    {s.status==="closed" ? "✅ 已交换" : "🔄 可交换"}
                  </span>
                </div>
                <div className="grid-2" style={{marginBottom:"10px",gap:"8px"}}>
                  <div style={{padding:"10px 14px",background:"var(--cream)",borderRadius:"var(--radius-xs)"}}>
                    <p style={{fontSize:".75rem",color:"var(--text-muted)",marginBottom:"2px"}}>我能提供</p>
                    <p style={{fontWeight:600,fontSize:".93rem",color:"var(--night)"}}>{s.offer}</p>
                  </div>
                  {s.need && <div style={{padding:"10px 14px",background:"var(--cream)",borderRadius:"var(--radius-xs)"}}>
                    <p style={{fontSize:".75rem",color:"var(--text-muted)",marginBottom:"2px"}}>我需要</p>
                    <p style={{fontWeight:600,fontSize:".93rem",color:"var(--night)"}}>{s.need}</p>
                  </div>}
                </div>
                <div className="pc-c" style={{marginBottom:"10px"}}>{s.description}</div>
                {s.contact && <div style={{marginTop:"8px",paddingTop:"8px",borderTop:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:".82rem",color:"var(--text-light)"}}>📞 {s.contact}</span>
                  {s.status !== "closed" && s.user_id === user?.id && (
                    <button onClick={()=>markDone(s.id)} className="btn btn--sm btn--ghost" style={{fontSize:".78rem",padding:"4px 12px"}}>标记已交换</button>
                  )}
                </div>}
              </div>
            ))}
          </div>
        )}
      </div>
    
        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{Math.floor(Math.random()*15)+3}</strong> 人</span>
        </div>
    </div>
  );
}



