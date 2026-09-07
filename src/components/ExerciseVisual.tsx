'use client';

import React, { useEffect, useRef } from 'react';
import type { ExerciseItem } from '@/modules/program-engine/types';
import { ExerciseVisual3D } from './ExerciseVisual3D';

interface ExerciseVisualProps {
  visualKey: ExerciseItem['visualKey'];
  className?: string;
  isAnimated?: boolean;
  use3D?: boolean;
  showControls?: boolean;
}

const CYAN = '#00e5ff';
const MAGENTA = '#ff3d9a';
const YELLOW = '#ffd700';
const WHITE = '#ffffff';

export function ExerciseVisual({
  visualKey,
  className = 'w-full h-48',
  isAnimated = true,
  use3D = true,
  showControls = true,
}: ExerciseVisualProps) {
  if (use3D) {
    return (
      <ExerciseVisual3D
        visualKey={visualKey}
        className={className}
        isAnimated={isAnimated}
        showControls={showControls}
      />
    );
  }

  return <ExerciseVisual2D visualKey={visualKey} className={className} isAnimated={isAnimated} />;
}

function ExerciseVisual2D({
  visualKey,
  className,
  isAnimated,
}: {
  visualKey: ExerciseItem['visualKey'];
  className: string;
  isAnimated: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let startTime = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(rect.width, 240);
      const h = Math.max(rect.height, 160);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(rect.width, 240);
      const h = Math.max(rect.height, 160);
      const time = isAnimated ? (now - startTime) / 1000 : 0.8;

      ctx.clearRect(0, 0, w, h);

      // 1. Grid & floor
      drawBackgroundGrid(ctx, w, h);

      // 2. Render realistic animated mannequin
      ctx.save();
      // Center and scale
      const scale = Math.min(w / 320, h / 220);
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);

      drawMannequinExercise(ctx, visualKey, time);

      ctx.restore();

      if (isAnimated) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [visualKey, isAnimated]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-void/90 border border-white/10 shadow-inner ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Cyberpunk HUD corners */}
      <div className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan/70" />
      <div className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan/70" />
      <div className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-magenta/70" />
      <div className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-magenta/70" />

      {/* Live motion tag */}
      {isAnimated && (
        <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-cyan/90">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
          <span>ANIMASI GERAKAN</span>
        </div>
      )}
    </div>
  );
}

// Background tech grid
function drawBackgroundGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

// Helper: draw muscle limb segment (capsule)
function drawLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  color: string,
  glowColor?: string,
) {
  ctx.save();
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// Helper: draw joint node with glowing ring
function drawJoint(ctx: CanvasRenderingContext2D, x: number, y: number, radius = 4, color = CYAN) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#060714';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Helper: draw head with sleek cyber visor
function drawHead(ctx: CanvasRenderingContext2D, x: number, y: number, facingRight = true) {
  ctx.save();
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 10;

  // Skull
  ctx.fillStyle = '#121634';
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cyber Visor
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  if (facingRight) {
    ctx.roundRect(x + 2, y - 4, 10, 6, 2);
  } else {
    ctx.roundRect(x - 12, y - 4, 10, 6, 2);
  }
  ctx.fill();

  ctx.restore();
}

// Helper: ground shadow
function drawGroundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radiusX: number, alpha = 0.3) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFloorLine(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(-130, y);
  ctx.lineTo(130, y);
  ctx.stroke();
  ctx.restore();
}

// MAIN EXERCISE ANIMATION ENGINE
function drawMannequinExercise(ctx: CanvasRenderingContext2D, key: ExerciseItem['visualKey'], t: number) {
  switch (key) {
    case 'jumping_jacks': {
      const speed = 4.2;
      const cycle = Math.sin(t * speed);
      const open = (cycle + 1) / 2; // 0 = closed, 1 = open
      const hop = Math.abs(Math.sin(t * speed)) * 16;
      const baseY = 75 - hop;

      drawGroundShadow(ctx, 0, 75, 45 - hop * 0.8, 0.4 - hop * 0.015);
      drawFloorLine(ctx, 75);

      // Feet spread
      const footSpread = open * 42;
      const leftFootX = -12 - footSpread;
      const rightFootX = 12 + footSpread;
      const footY = baseY;

      // Hips
      const hipX = 0;
      const hipY = baseY - 50;

      // Shoulders
      const shoulderY = hipY - 42;

      // Legs
      drawLimb(ctx, hipX, hipY, leftFootX * 0.5, hipY + 28, 8, MAGENTA);
      drawLimb(ctx, leftFootX * 0.5, hipY + 28, leftFootX, footY, 7, MAGENTA);
      drawLimb(ctx, hipX, hipY, rightFootX * 0.5, hipY + 28, 8, MAGENTA);
      drawLimb(ctx, rightFootX * 0.5, hipY + 28, rightFootX, footY, 7, MAGENTA);

      // Torso
      drawLimb(ctx, hipX, hipY, 0, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head
      drawHead(ctx, 0, shoulderY - 18, true);

      // Arms swing
      const armAngle = -0.3 + open * 2.8; // Down at sides to high V overhead
      const armLen = 32;

      // Left Arm
      const leftElbowX = -Math.cos(armAngle) * armLen * 0.6;
      const leftElbowY = shoulderY - Math.sin(armAngle) * armLen * 0.6;
      const leftHandX = -Math.cos(armAngle) * armLen;
      const leftHandY = shoulderY - Math.sin(armAngle) * armLen;
      drawLimb(ctx, 0, shoulderY, leftElbowX, leftElbowY, 6, CYAN);
      drawLimb(ctx, leftElbowX, leftElbowY, leftHandX, leftHandY, 5, CYAN);

      // Right Arm
      const rightElbowX = Math.cos(armAngle) * armLen * 0.6;
      const rightElbowY = shoulderY - Math.sin(armAngle) * armLen * 0.6;
      const rightHandX = Math.cos(armAngle) * armLen;
      const rightHandY = shoulderY - Math.sin(armAngle) * armLen;
      drawLimb(ctx, 0, shoulderY, rightElbowX, rightElbowY, 6, CYAN);
      drawLimb(ctx, rightElbowX, rightElbowY, rightHandX, rightHandY, 5, CYAN);

      // Joints
      drawJoint(ctx, leftHandX, leftHandY, 4, YELLOW);
      drawJoint(ctx, rightHandX, rightHandY, 4, YELLOW);
      drawJoint(ctx, leftFootX, footY, 4, CYAN);
      drawJoint(ctx, rightFootX, footY, 4, CYAN);
      break;
    }

    case 'push_up': {
      const speed = 2.4;
      const depth = (Math.sin(t * speed) + 1) / 2; // 0 = down, 1 = up
      const floorY = 60;
      drawFloorLine(ctx, floorY);

      // Toes pivot on floor
      const toeX = 90;
      const toeY = floorY;

      // Hand fixed on floor
      const handX = -45;
      const handY = floorY;

      // Body angle pivots down and up
      // Down: shoulder closer to handY (floor)
      const shoulderY = floorY - 20 - depth * 42;
      const shoulderX = -45;

      const hipX = 25;
      const hipY = shoulderY + 12;

      // Legs (straight plank line)
      drawLimb(ctx, toeX, toeY, (toeX + hipX) / 2, (toeY + hipY) / 2, 8, MAGENTA);
      drawLimb(ctx, (toeX + hipX) / 2, (toeY + hipY) / 2, hipX, hipY, 8, MAGENTA);

      // Torso (rigid)
      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head
      drawHead(ctx, shoulderX - 16, shoulderY - 6, false);

      // Arm bending (90 deg at bottom)
      const elbowX = -65 + (1 - depth) * 12;
      const elbowY = (shoulderY + handY) / 2 - 4 + (1 - depth) * 6;
      drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 7, CYAN);
      drawLimb(ctx, elbowX, elbowY, handX, handY, 7, CYAN);

      // Joints
      drawJoint(ctx, handX, handY, 5, YELLOW);
      drawJoint(ctx, elbowX, elbowY, 4, CYAN);
      drawJoint(ctx, shoulderX, shoulderY, 5, CYAN);
      drawJoint(ctx, hipX, hipY, 5, MAGENTA);
      drawJoint(ctx, toeX, toeY, 4, CYAN);
      break;
    }

    case 'squat': {
      const speed = 2.2;
      const depth = (Math.sin(t * speed) + 1) / 2; // 0 = stand, 1 = deep squat
      const floorY = 65;
      drawGroundShadow(ctx, 0, floorY, 40, 0.35);
      drawFloorLine(ctx, floorY);

      const footX = 10;
      const footY = floorY;

      // Knee hinges forward slightly
      const kneeX = footX - 12 - depth * 14;
      const kneeY = floorY - 45 + depth * 15;

      // Hips push backward and down
      const hipX = footX + 18 + depth * 32;
      const hipY = floorY - 78 + depth * 46;

      // Torso tilts slightly forward for balance
      const shoulderX = hipX - 18 - depth * 22;
      const shoulderY = hipY - 46;

      // Legs
      drawLimb(ctx, footX, footY, kneeX, kneeY, 8, MAGENTA);
      drawLimb(ctx, kneeX, kneeY, hipX, hipY, 9, MAGENTA, depth > 0.7 ? 'rgba(255,61,154,0.6)' : undefined);

      // Torso
      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head
      drawHead(ctx, shoulderX - 8, shoulderY - 16, false);

      // Arms reach forward as squat deepens for counter-balance
      const handX = shoulderX - 35 - depth * 10;
      const handY = shoulderY + 8 - depth * 14;
      const elbowX = (shoulderX + handX) / 2;
      const elbowY = (shoulderY + handY) / 2 + 6;
      drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 6, CYAN);
      drawLimb(ctx, elbowX, elbowY, handX, handY, 5, CYAN);

      // Joints
      drawJoint(ctx, footX, footY, 4, CYAN);
      drawJoint(ctx, kneeX, kneeY, 5, MAGENTA);
      drawJoint(ctx, hipX, hipY, 5, MAGENTA);
      drawJoint(ctx, shoulderX, shoulderY, 5, CYAN);
      drawJoint(ctx, handX, handY, 4, YELLOW);
      break;
    }

    case 'sit_up': {
      const speed = 2.0;
      const curl = (Math.sin(t * speed) + 1) / 2; // 0 = flat, 1 = curled up
      const floorY = 55;
      drawFloorLine(ctx, floorY);

      const footX = 75;
      const footY = floorY;

      // Bent knees fixed
      const kneeX = 40;
      const kneeY = floorY - 34;

      const hipX = 15;
      const hipY = floorY - 8;

      // Legs
      drawLimb(ctx, footX, footY, kneeX, kneeY, 8, MAGENTA);
      drawLimb(ctx, kneeX, kneeY, hipX, hipY, 8, MAGENTA);

      // Torso rotates from floor to ~65 deg
      const torsoAngle = 0.05 + curl * 1.1; // rad from horizontal
      const torsoLen = 46;
      const shoulderX = hipX - Math.cos(torsoAngle) * torsoLen;
      const shoulderY = hipY - Math.sin(torsoAngle) * torsoLen;

      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, curl > 0.7 ? 'rgba(0,229,255,0.7)' : undefined);

      // Head
      drawHead(ctx, shoulderX - 14, shoulderY - 8, true);

      // Arms crossed at chest
      const handX = (hipX + shoulderX) / 2 + 10;
      const handY = (hipY + shoulderY) / 2 - 8;
      drawLimb(ctx, shoulderX, shoulderY, handX, handY, 6, YELLOW);

      // Joints
      drawJoint(ctx, footX, footY, 4, CYAN);
      drawJoint(ctx, kneeX, kneeY, 5, MAGENTA);
      drawJoint(ctx, hipX, hipY, 5, MAGENTA);
      drawJoint(ctx, shoulderX, shoulderY, 5, CYAN);
      break;
    }

    case 'plank': {
      const floorY = 55;
      drawFloorLine(ctx, floorY);

      // Subtle breathing wave
      const breath = Math.sin(t * 2.5) * 2;

      const toeX = 85;
      const toeY = floorY;

      const elbowX = -50;
      const elbowY = floorY;

      const handX = -32;
      const handY = floorY;

      const shoulderX = -50;
      const shoulderY = floorY - 38 + breath * 0.5;

      const hipX = 22;
      const hipY = floorY - 34 + breath;

      // Straight plank line
      drawLimb(ctx, toeX, toeY, hipX, hipY, 8, MAGENTA);
      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, 'rgba(0,229,255,0.6)');

      // Forearms on floor
      drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 7, CYAN);
      drawLimb(ctx, elbowX, elbowY, handX, handY, 6, CYAN);

      // Head
      drawHead(ctx, shoulderX - 16, shoulderY - 4, false);

      // Core alignment laser beam
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(-65, shoulderY);
      ctx.lineTo(95, toeY);
      ctx.stroke();
      ctx.restore();

      // Joints
      drawJoint(ctx, toeX, toeY, 4, CYAN);
      drawJoint(ctx, hipX, hipY, 5, MAGENTA);
      drawJoint(ctx, shoulderX, shoulderY, 5, CYAN);
      drawJoint(ctx, elbowX, elbowY, 5, YELLOW);
      break;
    }

    case 'arm_raise': {
      const speed = 2.4;
      const lift = (Math.sin(t * speed) + 1) / 2; // 0 = at chest/hips, 1 = overhead
      const floorY = 65;
      drawGroundShadow(ctx, 0, floorY, 32, 0.3);
      drawFloorLine(ctx, floorY);

      const hipY = floorY - 55;
      const shoulderY = hipY - 42;

      // Standing legs
      drawLimb(ctx, 0, hipY, -14, floorY, 8, MAGENTA);
      drawLimb(ctx, 0, hipY, 14, floorY, 8, MAGENTA);

      // Torso
      drawLimb(ctx, 0, hipY, 0, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head
      drawHead(ctx, 0, shoulderY - 16, true);

      // Barbell position
      const barY = shoulderY + 8 - lift * 54; // Chest level up to high overhead
      const barX1 = -42;
      const barX2 = 42;

      // Arms pushing bar
      drawLimb(ctx, -10, shoulderY, -26, barY, 6, CYAN);
      drawLimb(ctx, 10, shoulderY, 26, barY, 6, CYAN);

      // Barbell
      ctx.save();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(barX1, barY);
      ctx.lineTo(barX2, barY);
      ctx.stroke();

      // Weight plates
      const plateColor = lift > 0.8 ? YELLOW : MAGENTA;
      ctx.fillStyle = plateColor;
      ctx.shadowColor = plateColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(barX1 - 5, barY - 14, 8, 28);
      ctx.fillRect(barX2 - 3, barY - 14, 8, 28);
      ctx.restore();
      break;
    }

    case 'high_knees': {
      const speed = 7.0;
      const legCycle = Math.sin(t * speed);
      const floorY = 65;
      const bounce = Math.abs(legCycle) * 8;
      const baseY = floorY - bounce;

      drawGroundShadow(ctx, 0, floorY, 35 - bounce, 0.35);
      drawFloorLine(ctx, floorY);

      const hipX = 0;
      const hipY = baseY - 55;
      const shoulderY = hipY - 42;

      // Running legs (alternating)
      const leftKneeUp = legCycle > 0;
      const kneeLift = Math.abs(legCycle);

      // Leg 1
      const knee1X = leftKneeUp ? -18 : 12;
      const knee1Y = leftKneeUp ? hipY + 12 - kneeLift * 22 : baseY - 20;
      const foot1X = leftKneeUp ? -14 : 10;
      const foot1Y = leftKneeUp ? knee1Y + 22 : floorY;

      // Leg 2
      const knee2X = !leftKneeUp ? -18 : 12;
      const knee2Y = !leftKneeUp ? hipY + 12 - kneeLift * 22 : baseY - 20;
      const foot2X = !leftKneeUp ? -14 : 10;
      const foot2Y = !leftKneeUp ? knee2Y + 22 : floorY;

      drawLimb(ctx, hipX, hipY, knee1X, knee1Y, 8, MAGENTA);
      drawLimb(ctx, knee1X, knee1Y, foot1X, foot1Y, 7, MAGENTA);

      drawLimb(ctx, hipX, hipY, knee2X, knee2Y, 8, MAGENTA);
      drawLimb(ctx, knee2X, knee2Y, foot2X, foot2Y, 7, MAGENTA);

      // Torso (leaning slightly forward)
      drawLimb(ctx, hipX, hipY, -6, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head
      drawHead(ctx, -8, shoulderY - 16, false);

      // Pumping arms
      const armSwing = legCycle * 24;
      drawLimb(ctx, -6, shoulderY, -24 + armSwing, shoulderY + 18, 6, CYAN);
      drawLimb(ctx, -6, shoulderY, 18 - armSwing, shoulderY + 18, 6, CYAN);
      break;
    }

    case 'mountain_climbers': {
      const speed = 6.5;
      const cycle = Math.sin(t * speed);
      const floorY = 55;
      drawFloorLine(ctx, floorY);

      const handX = -45;
      const handY = floorY;
      const shoulderX = -45;
      const shoulderY = floorY - 38;
      const hipX = 22;
      const hipY = floorY - 34;

      // Hands & torso in plank
      drawLimb(ctx, shoulderX, shoulderY, handX, handY, 7, CYAN);
      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');
      drawHead(ctx, shoulderX - 16, shoulderY - 4, false);

      // Alternating driving knees
      const kneeProgress = (cycle + 1) / 2;
      // Leg 1 (driving forward)
      const knee1X = hipX - 10 - kneeProgress * 28;
      const knee1Y = hipY + 10;
      const foot1X = knee1X + 16;
      const foot1Y = floorY - 10;
      drawLimb(ctx, hipX, hipY, knee1X, knee1Y, 8, MAGENTA);
      drawLimb(ctx, knee1X, knee1Y, foot1X, foot1Y, 7, MAGENTA);

      // Leg 2 (extended back)
      const foot2X = 85 - (1 - kneeProgress) * 20;
      const foot2Y = floorY;
      drawLimb(ctx, hipX, hipY, foot2X - 20, floorY - 14, 8, MAGENTA);
      drawLimb(ctx, foot2X - 20, floorY - 14, foot2X, foot2Y, 7, MAGENTA);

      drawJoint(ctx, handX, handY, 5, YELLOW);
      break;
    }

    case 'lunges': {
      const speed = 2.2;
      const step = (Math.sin(t * speed) + 1) / 2; // 0 = stand, 1 = deep lunge
      const floorY = 65;
      drawGroundShadow(ctx, 0, floorY, 45, 0.3);
      drawFloorLine(ctx, floorY);

      const hipX = 0;
      const hipY = floorY - 72 + step * 28;
      const shoulderY = hipY - 44;

      // Front leg
      const frontFootX = -32 - step * 12;
      const frontFootY = floorY;
      const frontKneeX = frontFootX + 2 + step * 8;
      const frontKneeY = floorY - 45 + step * 16;
      drawLimb(ctx, hipX, hipY, frontKneeX, frontKneeY, 8, MAGENTA);
      drawLimb(ctx, frontKneeX, frontKneeY, frontFootX, frontFootY, 7, MAGENTA);

      // Back leg (knee approaches floor)
      const backFootX = 35 + step * 14;
      const backFootY = floorY;
      const backKneeX = 8 + step * 8;
      const backKneeY = floorY - 45 + step * 38;
      drawLimb(ctx, hipX, hipY, backKneeX, backKneeY, 8, MAGENTA);
      drawLimb(ctx, backKneeX, backKneeY, backFootX, backFootY, 7, MAGENTA);

      // Torso upright
      drawLimb(ctx, hipX, hipY, 0, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');
      drawHead(ctx, 0, shoulderY - 16, false);

      // Hands on hips
      drawLimb(ctx, 0, shoulderY, -14, hipY - 6, 5, CYAN);
      drawLimb(ctx, 0, shoulderY, 14, hipY - 6, 5, CYAN);
      break;
    }

    case 'cobra_stretch': {
      const breathe = Math.sin(t * 2.0);
      const arch = (breathe + 1) / 2; // undulating gentle arch
      const floorY = 55;
      drawFloorLine(ctx, floorY);

      const handX = -35;
      const handY = floorY;

      // Feet & hips flat
      const hipX = 30;
      const hipY = floorY - 10;
      const footX = 90;
      const footY = floorY - 6;

      drawLimb(ctx, footX, footY, hipX, hipY, 8, MAGENTA);

      // Arched spine
      const shoulderX = -30;
      const shoulderY = floorY - 34 - arch * 18;

      ctx.save();
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.quadraticCurveTo(0, floorY - 14, shoulderX, shoulderY);
      ctx.stroke();
      ctx.restore();

      // Arms pushing
      drawLimb(ctx, shoulderX, shoulderY, handX, handY, 7, CYAN);

      // Head looking up
      drawHead(ctx, shoulderX - 4, shoulderY - 16, false);
      break;
    }

    case 'child_pose': {
      const breath = Math.sin(t * 1.8) * 2;
      const floorY = 55;
      drawFloorLine(ctx, floorY);

      // Folded hips over heels
      const heelX = 50;
      const heelY = floorY - 12;
      const hipX = 35;
      const hipY = floorY - 24 + breath;

      drawLimb(ctx, heelX, floorY, hipX, hipY, 9, MAGENTA);

      // Torso resting along thighs
      const shoulderX = -15;
      const shoulderY = floorY - 16 + breath * 0.5;
      drawLimb(ctx, hipX, hipY, shoulderX, shoulderY, 12, CYAN, 'rgba(0,229,255,0.4)');

      // Head resting on floor
      drawHead(ctx, shoulderX - 14, floorY - 10, false);

      // Arms extended long forward
      const handX = -65;
      const handY = floorY - 4;
      drawLimb(ctx, shoulderX, shoulderY, handX, handY, 6, CYAN);
      break;
    }
  }
}
