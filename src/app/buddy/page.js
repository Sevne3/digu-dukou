"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import Globe from "@/components/Globe";
import { getMe, getMessages, sendMessage } from "@/lib/api"
import { playNotificationSound } from "@/lib/audioManager";

export default function BuddyPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState([]);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("globe");
  const [onlineCount] = useState(() => Math.floor(Math.random() * 15) + 5);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [buddyPosts, setBuddyPosts] = useState([]);
  const [buddyPostInput, setBuddyPostInput] = useState("");

  useEffect(() => {
    getMe().then(d => { if (!d.user) { router.push("/login"); return; } setUser(d.user); load(); }).catch(() => router.push("/login"));
  }, []);

  const load = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/pair", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      setPairs(d.pairs || []);
      setPendingReqs(d.pendingRequests || []);
      setAllUsers(d.allUsers || []);
    } catch {}
    setLoading(false);
  };

  const sendPair = async (targetId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/pair", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ targetUserId: targetId, action: "send" }) });
      setMsg("配对请求已发送！"); load();
      setTimeout(() => setMsg(""), 3000);
    } catch { setMsg("发送失败"); setTimeout(() => setMsg(""), 2000); }
  };

  const respondPair = async (fromId, action) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/pair", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ targetUserId: fromId, action }) });
      setMsg(action === "accept" ? "配对成功！" : "已拒绝");
      load();
      setTimeout(() => setMsg(""), 3000);
    } catch {}
  };

  const loadChat = async (partnerId) => {
    try { const d = await getMessages(partnerId); setChatMessages(d.messages || []); } catch {}
  };

  const openChat = async (partner) => {
    setChatPartner(partner);
    await loadChat(partner.id);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatPartner) return;
    setSending(true);
    try {
      await sendMessage(chatPartner.id, chatInput.trim());
      setChatInput("");
      await loadChat(chatPartner.id);
    } catch { alert("发送失败"); }
    setSending(false);
  };

  const loadBuddyPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/posts", { headers: { "Authorization": "Bearer " + token } });
      const d = await res.json();
      setBuddyPosts((d.posts || []).filter(p => p.category === "日常" || p.category === "心情" || !p.category).slice(0, 5));
    } catch {}
  };

  useEffect(() => { if (user) loadBuddyPosts(); }, [user]);

  // Real-time message polling
  useEffect(() => {
    if (!chatPartner) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(chatPartner.id);
        const prevMsgs = chatMessagesRef.current || [];
        if (msgs.messages && msgs.messages.length > prevMsgs.length) {
          const newMsgs = msgs.messages.slice(prevMsgs.length);
          const hasIncoming = newMsgs.some(m => m.fromUserId !== user?.id);
          if (hasIncoming) playNotificationSound();
        }
        setChatMessages(msgs.messages || []);
        chatMessagesRef.current = msgs.messages || [];
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [chatPartner]);

  const handleBuddyPost = async () => {
    if (!buddyPostInput.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ content: buddyPostInput.trim(), category: "日常" }) });
      setBuddyPostInput("");
      loadBuddyPosts();
    } catch {}
  };

    const unpair = async (targetId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/pair", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ targetUserId: targetId, action: "unpair" }) });
      setMsg("已解除配对"); load();
      setTimeout(() => setMsg(""), 3000);
    } catch {}
  };

  if (loading) return <div className="dashboard"><div className="spinner" /></div>;

  const matchedPairs = pairs.filter(p => p.status === "matched");
  const sentPending = pairs.filter(p => p.status === "pending");

  return (
    <div className="dashboard">
      <header className="dh"><div className="dh-in"><a href="/dashboard" className="dh-brand"><Logo size={20} showText={false} /></a><div className="d-nav"><a href="/dashboard"><span>🏠</span><span className="nav-label">首页</span></a><a href="/checkin"><span>✅</span><span className="nav-label">打卡</span></a><a href="/community"><span>💬</span><span className="nav-label">社群</span></a><a href="/treehole"><span>🤫</span><span className="nav-label">树洞</span></a><a href="/skills"><span>🛠️</span><span className="nav-label">技能</span></a><a href="/capsule"><span>📦</span><span className="nav-label">胶囊</span></a><a href="/buddy" className="active"><span>👥</span><span className="nav-label">搭子</span></a><button onClick={()=>{localStorage.removeItem("token");window.location.href="/"}} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:".75rem",cursor:"pointer",padding:"6px 10px",borderRadius:"8px",transition:"all .2s",fontFamily:"inherit",whiteSpace:"nowrap"}}>退出</button></div></div></header>
      <div className="db">
        <h1 className="db-title" style={{marginBottom:"20px"}}>👥 同在渡口 · 找搭子</h1>

        {msg && <div className="card card--tight" style={{textAlign:"center",marginBottom:"16px",background:"var(--warm-glow-dim)"}}><p style={{fontSize:".9rem",color:"var(--warm-glow)"}}>{msg}</p></div>}

        {/* Tabs */}
        <div className="tabs" style={{marginBottom:"20px"}}>
          <button className={"tab" + (tab==="globe"?" active":"")} onClick={()=>setTab("globe")}>🌍 同在渡口</button>
          <button className={"tab" + (tab==="match"?" active":"")} onClick={()=>setTab("match")}>🤝 我的搭子 {matchedPairs.length > 0 ? `(${matchedPairs.length})` : ""}</button>
          <button className={"tab" + (tab==="find"?" active":"")} onClick={()=>setTab("find")}>🔍 发现</button>
        </div>

        {/* Globe Tab */}
        {tab === "globe" && (
          <div className="card" style={{textAlign:"center",padding:"20px",background:"linear-gradient(135deg,#1a1a2e,#2d2d44)",border:"none",marginBottom:"20px"}}>
            <Globe users={allUsers.slice(0, 60)} size={Math.min(300, typeof window !== "undefined" ? window.innerWidth - 80 : 300)} />
            <p style={{fontSize:".82rem",color:"rgba(250,246,240,.4)",marginTop:"12px"}}>🌏 渡口居民 · 实时分布</p>
          </div>
        )}

        {/* My Pairs Tab */}
        {tab === "match" && (
          <>
            {/* Pending requests from others */}
            {pendingReqs.length > 0 && (
              <div className="card" style={{marginBottom:"20px",borderLeft:"3px solid var(--warm-glow)"}}>
                <h3 style={{fontSize:".95rem",fontWeight:600,marginBottom:"12px"}}>💌 配对请求 ({pendingReqs.length})</h3>
                {pendingReqs.map(r => (
                  <div key={r.id} className="card card--tight" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
                    <span style={{fontSize:".9rem",color:"var(--night)"}}>👤 {r.fromUser?.username || "渡口居民"}</span>
                    <div style={{display:"flex",gap:"6px"}}>
                      <button onClick={()=>respondPair(r.fromId,"accept")} className="btn btn--primary btn--sm" style={{fontSize:".75rem",padding:"5px 14px"}}>接受 ✓</button>
                      <button onClick={()=>respondPair(r.fromId,"reject")} className="btn btn--ghost btn--sm" style={{fontSize:".75rem",padding:"5px 14px"}}>拒绝 ✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchedPairs.length === 0 ? (
              <div className="card" style={{textAlign:"center",color:"var(--text-muted)",padding:"48px 24px"}}>
                <p style={{fontSize:"2rem",marginBottom:"12px"}}>🤝</p>
                <p>还没有搭子。<br />去「发现」页面找找看吧。</p>
                <button onClick={()=>setTab("find")} className="btn btn--primary btn--sm" style={{marginTop:"16px"}}>🔍 发现搭子</button>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                {matchedPairs.map(p => (
                  <div key={p.id} className="pc">
                    <div className="pc-m">
                      <span style={{fontWeight:600,color:"var(--warm-glow)"}}>🤝 配对成功</span>
                      <span style={{fontSize:".78rem",color:"var(--text-muted)"}}>于 {p.matched_at?.slice(0,10)}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
                      <div>
                        <span style={{fontSize:"1.1rem",fontWeight:600,color:"var(--night)"}}>👤 {p.otherUser?.username || "渡口居民"}</span>
                        {p.distance !== null && (
                          <div style={{marginTop:"4px",display:"flex",alignItems:"center",gap:"6px"}}>
                            <span style={{fontSize:".78rem",color:"var(--text-light)"}}>📍 你们相隔</span>
                            <span style={{fontSize:".9rem",fontWeight:700,color:"var(--warm-glow)"}}>
                              {p.distance < 1 ? "不到 1 公里" : p.distance < 100 ? `${p.distance} 公里` : p.distance < 1000 ? `${(p.distance/10).toFixed(0)*10}+ 公里` : `${(p.distance/100).toFixed(0)*100}+ 公里`}
                            </span>
                          </div>
                        )}
                      </div>
                      <button onClick={()=>unpair(p.otherUser.id)} className="btn btn--warm btn--sm" style={{fontSize:".75rem",padding:"4px 12px"}} onClick={()=>openChat(p.otherUser)}>💬 私信</button><button onClick={()=>unpair(p.otherUser.id)} className="btn btn--ghost btn--sm" style={{fontSize:".75rem",padding:"4px 12px",color:"var(--text-muted)"}}>解除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Find Tab */}
        {tab === "find" && (
          <>
            <p style={{color:"var(--text-light)",fontSize:".9rem",marginBottom:"16px"}}>发现其他低谷渡口的居民，发送配对请求成为搭子吧！</p>
            
            {/* Sent pending requests */}
            {sentPending.length > 0 && (
              <div className="card card--tight" style={{marginBottom:"16px",background:"var(--warm-glow-dim)"}}>
                <p style={{fontSize:".85rem",color:"var(--warm-glow)"}}>
                  ⏳ 已发送 {sentPending.length} 个配对请求，等待对方回应
                </p>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {allUsers.slice(0, 30).map(u => {
                const isMatched = matchedPairs.some(p => p.otherUser?.id === u.id);
                const isPending = sentPending.some(p => p.toId === u.id || p.fromId === u.id);
                return (
                  <div key={u.id} className="card card--tight" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:".9rem",color:"var(--night)"}}>👤 {u.username || "渡口居民"}</span>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      {isMatched ? (
                        <span style={{fontSize:".78rem",color:"var(--warm-glow)"}}>✅ 已配对</span>
                      ) : isPending ? (
                        <span style={{fontSize:".78rem",color:"var(--text-muted)"}}>⏳ 待回应</span>
                      ) : (
                        <button onClick={()=>sendPair(u.id)} className="btn btn--warm btn--sm" style={{fontSize:".75rem",padding:"4px 12px"}}>
                          🤝 配对
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Floating online */}
        <div style={{
        position:"fixed",bottom:"24px",right:"24px",zIndex:999,display:"flex",alignItems:"center",gap:"8px",background:"rgba(26,26,46,.85)",backdropFilter:"blur(12px)",padding:"10px 18px",borderRadius:"40px",border:"1px solid rgba(240,194,127,.12)",boxShadow:"0 4px 20px rgba(0,0,0,.2)",cursor:"pointer",transition:"all .3s ease"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,.3)"}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.2)"}}>
          <span className="online-dot" style={{width:"10px",height:"10px"}} />
          <span style={{fontSize:".82rem",color:"rgba(250,246,240,.6)"}}>在线 <strong style={{color:"var(--warm-glow)",fontWeight:700}}>{onlineCount + Math.floor(Math.random()*5)}</strong> 人</span>
        </div>
        {/* === Chat Modal === */}
        {chatPartner && (
          <div className="modal-overlay" onClick={()=>setChatPartner(null)}>
            <div className="modal-content" style={{padding:"24px",maxWidth:"500px"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <h3 style={{fontSize:"1.1rem",fontWeight:600,color:"var(--night)"}}>💬 与 {chatPartner.username||"渡口居民"} 聊天</h3>
                <button onClick={()=>setChatPartner(null)} style={{background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer",color:"var(--text-muted)"}}>×</button>
              </div>
              <div style={{maxHeight:"300px",overflowY:"auto",marginBottom:"16px",padding:"12px",background:"var(--cream)",borderRadius:"var(--radius-sm)",minHeight:"160px"}}>
                {chatMessages.length === 0 ? (
                  <p style={{textAlign:"center",color:"var(--text-muted)",padding:"40px 0",fontSize:".85rem"}}>还没有消息，打个招呼吧 🌿</p>
                ) : (
                  chatMessages.map(m => {
                    const isMe = m.fromUserId === user?.id;
                    return (
                      <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:"10px"}}>
                        <div style={{maxWidth:"75%",padding:"10px 16px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?"var(--warm-glow)":"var(--white)",color:isMe?"var(--night)":"var(--text)",fontSize:".88rem",lineHeight:"1.6",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                          <p>{m.content}</p>
                          <p style={{fontSize:".65rem",opacity:.5,marginTop:"4px",textAlign:isMe?"right":"left"}}>{m.created_at?.slice(11,16)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <input className="input" style={{flex:1}} placeholder="输入消息..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSendMessage()}}} />
                <button onClick={handleSendMessage} disabled={sending||!chatInput.trim()} className="btn btn--primary btn--sm" style={{flexShrink:0}}>{sending?"发送中...":"发送"}</button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
