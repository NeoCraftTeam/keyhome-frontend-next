'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight Canvas2D particle network — replaces Three.js (~600KB saved).
 *
 * Renders the same visual effect (floating particles with connecting lines)
 * using native Canvas2D API. Zero dependencies.
 */
export default function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Configuration
    const PARTICLE_COUNT = 80;
    const MAX_DIST = 120;
    const BRAND_COLOR = { r: 246, g: 71, b: 95 }; // #F6475F

    // Mouse tracking for parallax
    const mouse = { x: 0, y: 0 };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.5 + 1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Slight parallax offset from mouse
      const ox = mouse.x * 0.02;
      const oy = mouse.y * 0.02;

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = (a.x + ox) - (b.x + ox);
          const dy = (a.y + oy) - (b.y + oy);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.15;
            ctx.strokeStyle = `rgba(${BRAND_COLOR.r},${BRAND_COLOR.g},${BRAND_COLOR.b},${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x + ox, a.y + oy);
            ctx.lineTo(b.x + ox, b.y + oy);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.fillStyle = `rgba(${BRAND_COLOR.r},${BRAND_COLOR.g},${BRAND_COLOR.b},0.7)`;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX - w / 2;
      mouse.y = e.clientY - h / 2;
    };

    // Init
    resize();
    initParticles();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
