"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { getMe, getTreeholes, createTreehole } from "@/lib/api";

export default function TreeholePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myNotes, setMyNotes] = useState([]);
  const [publicNotes, setPublicNotes] = useState([]);
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("write");

  useEffect(() => {
    getMe().then((data) => { if (!data.user) { router.push("/login"); return; } setUser(data.user); loadData(); }).catch(() => router.push("/login"));
  }, []);

  const loadData = async () => {
    try { const d = await getTreeholes(); setMyNotes(d.myNotes || []); setPublicNotes(d.publicNotes || []); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setMessage("写点什么吧"); return; }
    setSubmitting(true);
    try {
      await createTreehole(content.trim(), isPublic);
      setContent(""); setMessage(isPublic ? "已发布到树洞广场" : "已存入你的树洞"); loadData();
    } catch { setMessage("出错了"); }
    setSubmitting(false); setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard" className=""><span>🏠</span><span className="nav-label">首页</span></a><a href="/checkin" className=""><span>✅</span><span className="nav-label">打卡</span></a><a href="/community" className=""><span>💬</span><span className="nav-label">社群</span></a><a href="/treehole" className=" active"><span>🤫</span><span className="nav-label">树洞</span></a><a href="/skills" className=""><span>🛠️</span><span className="nav-label">技能</span></a><a href="/capsule" className=""><span>📦</span><span className="nav-label">胶囊</span></a><a href="/buddy" className=""><span>👥</span><span className="nav-label">搭子</span></a><button onClick={()=>{localStorage.removeItem("token");window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}} onmouseenter={e=>e.target.style.color="rgba(255,255,255,.7)"} onmouseleave={e=>e.target.style.color="rgba(255,255,255,.35)"}>退出</button></div></div></header>
      <div className="db">
        <h1 className="db-title">🤫 匿名树洞</h1>
        <div className="tabs" style={{marginBottom:"24px"}}>
          {[["write","✍️ 写树洞"],["mine","📖 我的树洞"],["public","🌍 树洞广场"]].map(([k,v]) => (
            <button key={k} className={"tab"+(tab===k?" active":"")} onClick={()=>setTab(k)}>{v}</button>
          ))}
        </div>
        {message && <div className="card card--tight" style={{textAlign:"center",marginBottom:"16px",background:"var(--warm-glow-dim)"}}><p style={{fontSize:".9rem",color:"var(--warm-glow)"}}>{message}</p></div>}
        {tab === "write" && (
          <div className="card">
            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <p style={{fontSize:"1rem",fontWeight:500,color:"var(--night)",lineHeight:"1.8"}}>
                写下任何不敢说出口的话。<br /><span style={{fontSize:".85rem",color:"var(--text-light)",fontWeight:400}}>可以只留给自己看，也可以匿名分享到广场。</span>
              </p>
              <textarea className="input" style={{minHeight:"160px",resize:"vertical",fontFamily:"inherit",lineHeight:"1.9",fontSize:"1rem"}} placeholder="写下你想说的任何话…" value={content} onChange={e=>setContent(e.target.value)} required />
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
                <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:".88rem",color:"var(--text-light)",cursor:"pointer"}}>
                  <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} style={{accentColor:"var(--warm-glow)"}} /> 分享到广场（匿名）
                </label>
                <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>{submitting ? "存入中..." : (isPublic ? "🌍 发布到广场" : "🌿 存入树洞")}</button>
              </div>
            </form>
          </div>
        )}
        {tab === "mine" && (
          <div>{myNotes.length === 0 ? (
            <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"40px"}}><p style={{fontSize:"2rem",marginBottom:"12px"}}>🤫</p><p>你的树洞还是空的。</p></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {myNotes.map(n => (
                <div key={n.id} className="card card--tight">
                  <p style={{fontSize:".93rem",color:"var(--text-light)",lineHeight:"1.9",whiteSpace:"pre-wrap"}}>{n.content}</p>
                  <p style={{fontSize:".78rem",color:"var(--text-muted)",marginTop:"8px"}}>{n.created_at?.slice(0,16).replace("T"," ")}{n.is_public?" · 已分享到广场":" · 仅自己可见"}</p>
                </div>
              ))}
            </div>
          )}</div>
        )}
        {tab === "public" && (
          <div>{publicNotes.length === 0 ? (
            <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"40px"}}><p style={{fontSize:"2rem",marginBottom:"12px"}}>🌍</p><p>还没有人分享树洞。</p></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {publicNotes.map(n => (
                <div key={n.id} className="card card--tight" style={{borderLeft:"3px solid var(--warm-glow)"}}>
                  <p style={{fontSize:".93rem",color:"var(--text-light)",lineHeight:"1.9",whiteSpace:"pre-wrap"}}>{n.content}</p>
                  <p style={{fontSize:".78rem",color:"var(--text-muted)",marginTop:"8px"}}>匿名 · {n.created_at?.slice(0,10)}</p>
                </div>
              ))}
            </div>
          )}</div>
        )}
      </div>
    
        <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{Math.floor(Math.random()*15)+3}</strong> 人</span>
        </div>
    </div>
  );
}



