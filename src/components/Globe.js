"use client";
import { useEffect, useRef } from "react";

export default function Globe({ users = [], size = 280 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = size * dpr, h = size * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, radius = size * 0.38;
    let angle = 0, animId;

    // Starfield background
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * size,
      y: Math.random() * size,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.5 + 0.3,
      speed: Math.random() * 0.005 + 0.002,
    }));

    // User dots
    const dots = users.map((u, i) => {
      const lat = ((i * 97) % 180 - 90) * Math.PI / 180;
      const lng = ((i * 53) % 360) * Math.PI / 180;
      return { lat, lng, user: u, pulse: Math.random() * Math.PI * 2 };
    });

    // Simulate continent shapes (blobs)
    const continents = [
      { cx: -0.1, cy: 0.1, rx: 0.25, ry: 0.35 },  // Europe/Africa
      { cx: -0.3, cy: -0.15, rx: 0.2, ry: 0.18 },  // Americas
      { cx: 0.35, cy: -0.1, rx: 0.28, ry: 0.22 },  // Asia
      { cx: 0.15, cy: 0.35, rx: 0.12, ry: 0.1 },   // Australia
    ];

    const animate = () => {
      angle += 0.003;
      const now = Date.now() / 1000;
      ctx.clearRect(0, 0, size, size);

      // Stars
      stars.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(now * s.speed * 3 + s.x);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250,246,240,${s.a * twinkle})`;
        ctx.fill();
      });

      // Planet glow (outer aura)
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.4);
      glowGrad.addColorStop(0, "rgba(240,194,127,.06)");
      glowGrad.addColorStop(0.5, "rgba(240,194,127,.02)");
      glowGrad.addColorStop(1, "rgba(240,194,127,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Globe body - ocean gradient
      const oceanGrad = ctx.createRadialGradient(cx - radius*0.2, cy - radius*0.3, radius*0.1, cx, cy, radius);
      oceanGrad.addColorStop(0, "#2d3a5e");
      oceanGrad.addColorStop(0.4, "#253257");
      oceanGrad.addColorStop(0.7, "#1e2a4a");
      oceanGrad.addColorStop(1, "#16213e");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Subtle inner glow
      const innerGlow = ctx.createRadialGradient(cx - radius*0.25, cy - radius*0.3, 2, cx, cy, radius);
      innerGlow.addColorStop(0, "rgba(200,220,255,.08)");
      innerGlow.addColorStop(1, "rgba(200,220,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = innerGlow;
      ctx.fill();

      // Grid lines (longitude)
      ctx.strokeStyle = "rgba(240,194,127,.06)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 12; i++) {
        const lon = (i / 12) * Math.PI * 2 + angle;
        ctx.beginPath();
        for (let j = 0; j <= 30; j++) {
          const lat = (j / 30 - 0.5) * Math.PI;
          const x = cx + radius * Math.cos(lat) * Math.sin(lon);
          const y = cy + radius * Math.sin(lat);
          const z = radius * Math.cos(lat) * Math.cos(lon);
          if (z > 0) {
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Grid lines (latitude)
      for (let i = 1; i < 6; i++) {
        const lat = (i / 6 - 0.5) * Math.PI;
        const r = radius * Math.cos(lat);
        const y = cy + radius * Math.sin(lat);
        ctx.beginPath();
        for (let j = 0; j <= 40; j++) {
          const lon = (j / 40) * Math.PI * 2 + angle;
          const x = cx + r * Math.sin(lon);
          const z = r * Math.cos(lon);
          if (z > 0) {
            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Simulated continents (subtle)
      continents.forEach(cont => {
        const cLon = cont.cx;
        const cLat = cont.cy;
        ctx.beginPath();
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2;
          const rLat = cLat + Math.cos(a) * cont.ry * 0.15;
          const rLon = cLon + Math.sin(a) * cont.rx * 0.15;
          const x = cx + radius * Math.cos(rLat) * Math.sin(rLon + angle);
          const y = cy + radius * Math.sin(rLat);
          const z = radius * Math.cos(rLat) * Math.cos(rLon + angle);
          if (z > 0) {
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
        }
        ctx.fillStyle = "rgba(106,176,76,.04)";
        ctx.fill();
      });

      // Draw user dots
      dots.forEach((dot, i) => {
        const x = cx + radius * Math.cos(dot.lat) * Math.sin(dot.lng + angle);
        const y = cy + radius * Math.sin(dot.lat);
        const z = radius * Math.cos(dot.lat) * Math.cos(dot.lng + angle);

        if (z > 0) {
          const scale = 0.4 + (z / radius) * 0.6;
          const alpha = 0.3 + (z / radius) * 0.7;
          const pulse = 0.7 + 0.3 * Math.sin(now * 2 + dot.pulse);
          
          // Glow ring
          ctx.beginPath();
          ctx.arc(x, y, 5 * scale * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,194,127,${alpha * 0.08})`;
          ctx.fill();
          
          // Main dot
          ctx.beginPath();
          ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240,194,127,${alpha * pulse})`;
          ctx.fill();
          
          // Bright center
          ctx.beginPath();
          ctx.arc(x, y, 1 * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(250,246,240,${alpha * 0.6 * pulse})`;
          ctx.fill();
        }
      });

      // Light reflection on globe
      const reflGrad = ctx.createRadialGradient(cx - radius*0.3, cy - radius*0.35, 5, cx - radius*0.3, cy - radius*0.35, radius*0.4);
      reflGrad.addColorStop(0, "rgba(255,255,255,.03)");
      reflGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = reflGrad;
      ctx.fill();

      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [users, size]);

  return (
    <div style={{ 
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative", width: size, height: size, margin: "0 auto"
    }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div style={{
        position:"absolute", bottom:"8px",
        fontSize:".7rem", color:"rgba(250,246,240,.35)",
        background:"rgba(0,0,0,.5)", padding:"3px 10px",
        borderRadius:"40px", backdropFilter:"blur(4px)",
        letterSpacing:"1px", whiteSpace:"nowrap"
      }}>
        ✦ {users.length || Math.floor(Math.random() * 30) + 8} 位渡口居民
      </div>
    </div>
  );
}
