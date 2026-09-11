'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
}

interface NebulaParticle {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
}

const STAR_COLORS = [
  '#ffffff',
  '#e8eeff',
  '#c8d8ff',
  '#a0b8ff',
  '#ffeedd',
  '#ffd0a0',
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let nebulae: NebulaParticle[] = [];

    function init() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;

      // --- Stars ---
      const starCount = Math.floor((W * H) / 1200);
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        size: randomBetween(0.3, 2.2),
        brightness: randomBetween(0.4, 1.0),
        twinkleSpeed: randomBetween(0.5, 2.5),
        twinkleOffset: Math.random() * Math.PI * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      }));

      // Bright accent stars
      for (let i = 0; i < 14; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: randomBetween(2.6, 4.8),
          brightness: 1,
          twinkleSpeed: randomBetween(0.3, 1.2),
          twinkleOffset: Math.random() * Math.PI * 2,
          color: '#c8d8ff',
        });
      }

      // --- Nebula / Milky Way ---
      nebulae = [];

      // Milky Way diagonal band
      const bandCount = 130;
      for (let i = 0; i < bandCount; i++) {
        const t = i / bandCount;
        const cx = W * 0.28 + t * W * 0.78;
        const cy = H * 0.85 - t * H * 0.72;
        const perpAngle = Math.PI / 3.5 + Math.PI / 2;
        const spread = randomBetween(-170, 170);
        const nx = cx + Math.cos(perpAngle) * spread;
        const ny = cy + Math.sin(perpAngle) * spread;
        const coreProx = 1 - Math.abs(spread) / 170;

        let color: string;
        const r = Math.random();
        if (coreProx > 0.65) {
          color = r < 0.5
            ? `rgba(80,130,255,${randomBetween(0.07, 0.20)})`
            : `rgba(130,100,255,${randomBetween(0.06, 0.16)})`;
        } else if (coreProx > 0.35) {
          color = r < 0.4
            ? `rgba(60,90,220,${randomBetween(0.04, 0.13)})`
            : `rgba(100,60,200,${randomBetween(0.04, 0.11)})`;
        } else {
          color = r < 0.5
            ? `rgba(200,110,40,${randomBetween(0.03, 0.10)})`
            : `rgba(180,80,30,${randomBetween(0.03, 0.08)})`;
        }

        nebulae.push({
          x: nx, y: ny,
          radius: randomBetween(45, 150),
          color,
          speedX: randomBetween(-0.008, 0.008),
          speedY: randomBetween(-0.004, 0.004),
        });
      }

      // Ambient nebula blobs
      const ambientColors = [
        `rgba(0,80,200,0.05)`,
        `rgba(80,0,160,0.04)`,
        `rgba(0,160,200,0.04)`,
        `rgba(40,0,120,0.05)`,
      ];
      for (let i = 0; i < 20; i++) {
        nebulae.push({
          x: Math.random() * W,
          y: Math.random() * H,
          radius: randomBetween(90, 240),
          color: ambientColors[i % ambientColors.length],
          speedX: randomBetween(-0.005, 0.005),
          speedY: randomBetween(-0.005, 0.005),
        });
      }
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const t = timestamp * 0.001;

      ctx.clearRect(0, 0, W, H);

      // Deep space background
      const bgGrd = ctx.createRadialGradient(W * 0.4, H * 0.35, 0, W * 0.5, H * 0.5, Math.max(W, H));
      bgGrd.addColorStop(0, '#0a1033');
      bgGrd.addColorStop(0.35, '#070b22');
      bgGrd.addColorStop(0.7, '#050818');
      bgGrd.addColorStop(1, '#030510');
      ctx.fillStyle = bgGrd;
      ctx.fillRect(0, 0, W, H);

      // Nebulae
      ctx.save();
      for (const n of nebulae) {
        n.x += n.speedX;
        n.y += n.speedY;
        if (n.x < -n.radius) n.x = W + n.radius;
        if (n.x > W + n.radius) n.x = -n.radius;
        if (n.y < -n.radius) n.y = H + n.radius;
        if (n.y > H + n.radius) n.y = -n.radius;

        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        grd.addColorStop(0, n.color);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Stars
      ctx.save();
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.brightness * (0.5 + 0.5 * twinkle);
        const radius = s.size * (0.85 + 0.15 * twinkle);

        // Outer glow for large stars
        if (s.size > 1.8) {
          const glowGrd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius * 5);
          glowGrd.addColorStop(0, `rgba(180,210,255,${alpha * 0.22})`);
          glowGrd.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrd;
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Star core
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Diffraction spikes for very bright stars
        if (s.size > 2.8) {
          ctx.globalAlpha = alpha * 0.45;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.6;
          const len = radius * 7;
          ctx.beginPath();
          ctx.moveTo(s.x - len, s.y);
          ctx.lineTo(s.x + len, s.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - len);
          ctx.lineTo(s.x, s.y + len);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    }

    init();
    window.addEventListener('resize', init);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
