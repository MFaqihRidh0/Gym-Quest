import React from 'react';
import type { ExerciseItem } from '@/modules/program-engine/types';

interface ExerciseVisualProps {
  visualKey: ExerciseItem['visualKey'];
  className?: string;
  isAnimated?: boolean;
}

export function ExerciseVisual({ visualKey, className = 'w-full h-48', isAnimated = true }: ExerciseVisualProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-void/80 border border-white/10 ${className}`}
    >
      {/* Background glow & grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00e5ff_1px,transparent_1px)] [background-size:16px_16px]" />

      <svg
        viewBox="0 0 200 140"
        className={`relative z-10 w-full h-full max-h-44 p-3 transition-transform ${
          isAnimated ? 'animate-pulse' : ''
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderExerciseSvg(visualKey)}
      </svg>

      {/* Futuristic corner markers */}
      <div className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 border-cyan/60" />
      <div className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-cyan/60" />
      <div className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-magenta/60" />
      <div className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 border-magenta/60" />
    </div>
  );
}

function renderExerciseSvg(key: ExerciseItem['visualKey']) {
  switch (key) {
    case 'push_up':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="20" y1="110" x2="180" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
          {/* Head */}
          <circle cx="50" cy="72" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Torso & Legs */}
          <line x1="56" y1="76" x2="140" y2="92" stroke="#ff3d9a" strokeWidth="4" />
          <line x1="140" y1="92" x2="165" y2="108" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Arms pushing */}
          <polyline points="65,78 72,96 76,110" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Motion arrow */}
          <path d="M 68 55 L 68 64 M 64 60 L 68 64 L 72 60" stroke="#ffd700" strokeWidth="2" />
        </g>
      );

    case 'squat':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="20" y1="120" x2="180" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="100" cy="38" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Torso */}
          <line x1="100" y1="47" x2="96" y2="76" stroke="#ff3d9a" strokeWidth="4" />
          {/* Thigh (bent) & Shins */}
          <line x1="96" y1="76" x2="122" y2="82" stroke="#ff3d9a" strokeWidth="3.5" />
          <line x1="122" y1="82" x2="118" y2="118" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Foot */}
          <line x1="114" y1="118" x2="132" y2="118" stroke="#00e5ff" strokeWidth="3" />
          {/* Arms forward */}
          <polyline points="98,54 118,58 135,58" stroke="#00e5ff" strokeWidth="3" />
          {/* Motion arrow */}
          <path d="M 82 50 L 82 66 M 78 61 L 82 66 L 86 61" stroke="#ffd700" strokeWidth="2" />
        </g>
      );

    case 'sit_up':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Mat */}
          <line x1="20" y1="110" x2="180" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="65" cy="56" r="8.5" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Torso curled up */}
          <line x1="70" y1="64" x2="98" y2="104" stroke="#ff3d9a" strokeWidth="4" />
          {/* Bent knees */}
          <polyline points="98,104 125,78 145,108" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Feet */}
          <line x1="140" y1="108" x2="155" y2="108" stroke="#00e5ff" strokeWidth="3" />
          {/* Arms across chest */}
          <polyline points="76,70 88,78 78,84" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Arc arrow */}
          <path d="M 52 82 Q 52 50 80 44" stroke="#ffd700" strokeWidth="2" strokeDasharray="3 2" />
        </g>
      );

    case 'plank':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="15" y1="110" x2="185" y2="110" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="48" cy="74" r="8.5" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Straight Torso & Legs */}
          <line x1="56" y1="78" x2="160" y2="94" stroke="#ff3d9a" strokeWidth="4" />
          {/* Feet on floor */}
          <circle cx="162" cy="104" r="4" fill="#00e5ff" />
          {/* Forearms on floor (90 deg) */}
          <polyline points="62,80 66,108 82,108" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Straight line alignment guide */}
          <line x1="45" y1="72" x2="165" y2="98" stroke="rgba(0,229,255,0.4)" strokeWidth="1" strokeDasharray="2 2" />
        </g>
      );

    case 'arm_raise':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="30" y1="122" x2="170" y2="122" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="100" cy="42" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Body */}
          <line x1="100" y1="51" x2="100" y2="88" stroke="#ff3d9a" strokeWidth="4" />
          {/* Legs */}
          <line x1="100" y1="88" x2="88" y2="120" stroke="#ff3d9a" strokeWidth="3.5" />
          <line x1="100" y1="88" x2="112" y2="120" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Arms raised high overhead */}
          <polyline points="72,24 88,48 100,56" stroke="#00e5ff" strokeWidth="3.5" />
          <polyline points="128,24 112,48 100,56" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Barbell / hands glow */}
          <line x1="62" y1="20" x2="138" y2="20" stroke="#ffd700" strokeWidth="3" />
          <circle cx="62" cy="20" r="5" fill="#ffd700" />
          <circle cx="138" cy="20" r="5" fill="#ffd700" />
        </g>
      );

    case 'jumping_jacks':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="25" y1="122" x2="175" y2="122" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="100" cy="36" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Body */}
          <line x1="100" y1="45" x2="100" y2="82" stroke="#ff3d9a" strokeWidth="4" />
          {/* Spread Legs */}
          <line x1="100" y1="82" x2="72" y2="118" stroke="#ff3d9a" strokeWidth="3.5" />
          <line x1="100" y1="82" x2="128" y2="118" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Arms in V shape */}
          <polyline points="65,28 85,50 100,52" stroke="#00e5ff" strokeWidth="3" />
          <polyline points="135,28 115,50 100,52" stroke="#00e5ff" strokeWidth="3" />
          {/* Motion arcs */}
          <path d="M 60 70 Q 56 42 70 24" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M 140 70 Q 144 42 130 24" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
      );

    case 'high_knees':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="25" y1="122" x2="175" y2="122" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="95" cy="38" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Body leaning forward */}
          <line x1="95" y1="47" x2="98" y2="80" stroke="#ff3d9a" strokeWidth="4" />
          {/* High Knee (lifted) */}
          <polyline points="98,80 118,78 114,104" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Supporting Leg */}
          <line x1="98" y1="80" x2="88" y2="120" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Runner arms */}
          <polyline points="80,56 70,68 84,78" stroke="#00e5ff" strokeWidth="3" />
          <polyline points="105,56 122,66 112,80" stroke="#00e5ff" strokeWidth="3" />
          {/* Up arrow */}
          <path d="M 125 90 L 125 76 M 121 80 L 125 76 L 129 80" stroke="#ffd700" strokeWidth="2" />
        </g>
      );

    case 'mountain_climbers':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="20" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="50" cy="62" r="8.5" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Torso */}
          <line x1="56" y1="68" x2="110" y2="76" stroke="#ff3d9a" strokeWidth="4" />
          {/* Back Leg Extended */}
          <line x1="110" y1="76" x2="158" y2="112" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Front Knee Tucked under chest */}
          <polyline points="110,76 88,88 95,112" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Arms holding plank */}
          <line x1="62" y1="70" x2="68" y2="114" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Action sprint lines */}
          <line x1="165" y1="95" x2="175" y2="95" stroke="#ffd700" strokeWidth="2" />
          <line x1="160" y1="102" x2="172" y2="102" stroke="#ffd700" strokeWidth="2" />
        </g>
      );

    case 'lunges':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Floor */}
          <line x1="20" y1="120" x2="180" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head */}
          <circle cx="95" cy="40" r="9" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Torso upright */}
          <line x1="95" y1="49" x2="95" y2="78" stroke="#ff3d9a" strokeWidth="4" />
          {/* Front Leg (90 deg) */}
          <polyline points="95,78 126,82 124,118" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Back Leg (knee close to floor) */}
          <polyline points="95,78 68,90 66,116" stroke="#ff3d9a" strokeWidth="3.5" />
          {/* Hands on hips */}
          <polyline points="95,58 84,68 94,74" stroke="#00e5ff" strokeWidth="2.5" />
          <polyline points="95,58 106,68 96,74" stroke="#00e5ff" strokeWidth="2.5" />
        </g>
      );

    case 'cobra_stretch':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Mat */}
          <line x1="20" y1="115" x2="180" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head looking up */}
          <circle cx="68" cy="48" r="8.5" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Upward curved spine & legs flat */}
          <path d="M 72 56 Q 84 85 116 108 L 165 112" stroke="#ff3d9a" strokeWidth="4" fill="none" />
          {/* Arms pushing floor */}
          <polyline points="78,74 72,114" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Gentle breath pulse glow */}
          <circle cx="85" cy="72" r="14" fill="none" stroke="rgba(0,229,255,0.25)" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
      );

    case 'child_pose':
      return (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Mat */}
          <line x1="20" y1="112" x2="180" y2="112" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Head resting on mat */}
          <circle cx="68" cy="98" r="8" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" strokeWidth="2.5" />
          {/* Folded body & hips over heels */}
          <path d="M 74 98 Q 98 75 125 88 L 138 110 L 115 110" stroke="#ff3d9a" strokeWidth="4" fill="none" />
          {/* Arms reaching forward */}
          <line x1="72" y1="94" x2="42" y2="110" stroke="#00e5ff" strokeWidth="3.5" />
          {/* Zen rest sparkles */}
          <circle cx="48" cy="80" r="1.5" fill="#ffd700" />
          <circle cx="60" cy="72" r="2" fill="#00e5ff" />
          <circle cx="75" cy="65" r="1.5" fill="#ff3d9a" />
        </g>
      );

    default:
      return null;
  }
}
