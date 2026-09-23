import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

// 1. PETIR NEON / KI ENERGY (Menggantikan ⚡)
export const IconBolt: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
  </svg>
);

// 2. API KI DINAMIS (Menggantikan 🔥)
export const IconFlame: React.FC<IconProps> = ({ size = 20, className = 'text-magenta', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M12 2C11.5 5 9 6.5 9 9C9 9.5 9.1 10 9.3 10.5C8 9.5 7.5 8 7.5 8C5.5 10.5 5 13.5 5 15C5 18.9 8.1 22 12 22C15.9 22 19 18.9 19 15C19 10 15 6 12 2ZM12 20C9.8 20 8 18.2 8 16C8 14.5 9 13.5 10 12.5C10.8 13.5 11.5 14.8 11.5 16C11.5 16.3 11.7 16.5 12 16.5C12.3 16.5 12.5 16.3 12.5 16C12.5 14.5 13.5 13 14.5 12C15.5 13.2 16 14.8 16 16C16 18.2 14.2 20 12 20Z" />
  </svg>
);

// 3. CYBER MECHA BOT (Menggantikan 🤖)
export const IconCyberBot: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <rect x="3" y="11" width="18" height="10" rx="3" fill="currentColor" fillOpacity="0.15" />
    <path d="M12 2V6" />
    <circle cx="12" cy="2" r="1.5" fill="currentColor" />
    <path d="M7 16H8M16 16H17" strokeWidth="2.5" />
    <path d="M10 18H14" />
    <path d="M1 14H3M21 14H23" />
    <path d="M6 11V8C6 6.9 6.9 6 8 6H16C17.1 6 18 6.9 18 8V11" />
  </svg>
);

// 4. COMBAT & CLASH (Menggantikan ⚔️ / 🥊)
export const IconCombat: React.FC<IconProps> = ({ size = 20, className = 'text-magenta', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M14.5 17.5L3 6V3H6L17.5 14.5" />
    <path d="M13 19L19 13M16 16L20 20M19 21L21 19" />
    <path d="M9.5 17.5L21 6V3H18L6.5 14.5" />
    <path d="M11 19L5 13M8 16L4 20M5 21L3 19" />
  </svg>
);

// 5. TROPHY KEJUARAAN (Menggantikan 🏆)
export const IconTrophy: React.FC<IconProps> = ({ size = 20, className = 'text-amber-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_10px_currentColor]' : ''} ${className}`}
  >
    <path d="M19 4H18V2H6V4H5C3.34 4 2 5.34 2 7C2 9.55 3.9 11.66 6.36 11.95C7.03 13.59 8.38 14.88 10.09 15.35L9 19H7V21H17V19H15L13.91 15.35C15.62 14.88 16.97 13.59 17.64 11.95C20.1 11.66 22 9.55 22 7C22 5.34 20.66 4 19 4ZM4 7C4 6.45 4.45 6 5 6H6V10C4.9 10 4 9.1 4 8.01V7ZM20 8C20 9.1 19.1 10 18 10V6H19C19.55 6 20 6.45 20 7V8Z" />
  </svg>
);

// 6. MAHKOTA APEX (Menggantikan 👑)
export const IconCrown: React.FC<IconProps> = ({ size = 20, className = 'text-amber-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_10px_currentColor]' : ''} ${className}`}
  >
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.55 18.55 20 18 20H6C5.45 20 5 19.55 5 19V18H19V19Z" />
  </svg>
);

// 7. TARGET RADAR CYBER (Menggantikan 🎯)
export const IconTarget: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
  </svg>
);

// 8. PERISAI BIOMEKANIK (Menggantikan 🛡️)
export const IconShield: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M12 22S4 18 4 11V5L12 2L20 5V11C20 18 12 22 12 22Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M9 12L11 14L15 9" strokeWidth="2.2" />
  </svg>
);

// 9. BARBEL FUTURISTIK (Menggantikan 🏋️ / 🦾)
export const IconDumbbell: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M6 5H4C3.45 5 3 5.45 3 6V18C3 18.55 3.45 19 4 19H6C6.55 19 7 18.55 7 18V14H17V18C17 18.55 17.45 19 18 19H20C20.55 19 21 18.55 21 18V6C21 5.45 20.55 5 20 5H18C17.45 5 17 5.45 17 6V10H7V6C7 5.45 6.55 5 6 5ZM2 8H1V16H2V8ZM23 8H22V16H23V8Z" />
  </svg>
);

// 9b. BARBEL OLYMPIC & LOGO RESMI GYMQUEST
export const IconBarbell: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    {/* Central Bar Shaft */}
    <rect x="2" y="10.5" width="20" height="3" rx="1" />
    {/* Primary Heavy Bumper Plates */}
    <rect x="5" y="4" width="2.5" height="16" rx="1" />
    <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    {/* Secondary Step Plates */}
    <rect x="7.5" y="6" width="2" height="12" rx="0.75" />
    <rect x="14.5" y="6" width="2" height="12" rx="0.75" />
    {/* Outer Collar Fasteners */}
    <rect x="3.5" y="8.5" width="1.5" height="7" rx="0.5" />
    <rect x="19" y="8.5" width="1.5" height="7" rx="0.5" />
  </svg>
);

// 10. LEDAKAN SUPERNOVA / KAMEHAMEHA BURST (Menggantikan 💥)
export const IconBurst: React.FC<IconProps> = ({ size = 20, className = 'text-amber-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_12px_currentColor]' : ''} ${className}`}
  >
    <path d="M11 1L8.5 7L2 6.5L6 11L2.5 17L8.5 16L11 22L14 16.5L20.5 18.5L18 12.5L22.5 8L16 8L14 1L11 1Z" />
  </svg>
);

// 11. GRAFIK PERFORMA (Menggantikan 📊 / 📈)
export const IconChart: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="3" y1="20" x2="21" y2="20" />
  </svg>
);

// 12. KAMERA / VISION SCANNER (Menggantikan 📷 / 📹)
export const IconCamera: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M23 19C23 19.5 22.5 20 22 20H2C1.5 20 1 19.5 1 19V8C1 7.5 1.5 7 2 7H6L8 4H16L18 7H22C22.5 7 23 7.5 23 8V19Z" fill="currentColor" fillOpacity="0.12" />
    <circle cx="12" cy="13" r="4" strokeWidth="2" />
  </svg>
);

// 13. PENGGUNA & KOMUNITAS (Menggantikan 👥)
export const IconUsers: React.FC<IconProps> = ({ size = 20, className = 'text-magenta', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M17 21V19C17 17.9 16.1 17 15 17H9C7.9 17 7 17.9 7 19V21" />
    <circle cx="12" cy="7" r="4" />
    <path d="M23 21V19C22.99 18.1 22.4 17.3 21.6 17" />
    <path d="M16 3.13C17.2 3.63 18 4.7 18 6C18 7.3 17.2 8.37 16 8.87" />
  </svg>
);

// 14. PRIVASI / GEMBOK CYBER (Menggantikan 🔒)
export const IconLock: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" fill="currentColor" fillOpacity="0.15" />
    <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" />
  </svg>
);

// 15. INDIKATOR PULSA LEVEL CYBER (Menggantikan 🟢, 🟡, 🔴)
interface DifficultyBadgeProps {
  level: 'easy' | 'medium' | 'hard';
  active?: boolean;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ level, active = false }) => {
  const config = {
    easy: {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)',
      glow: 'rgba(16, 185, 129, 0.6)',
      label: 'Easy',
      reps: '10 Push-Up',
    },
    medium: {
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)',
      glow: 'rgba(245, 158, 11, 0.6)',
      label: 'Medium',
      reps: '15 Push-Up',
    },
    hard: {
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.4)',
      glow: 'rgba(244, 63, 94, 0.6)',
      label: 'Hard',
      reps: '20 Push-Up',
    },
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all ${
        active
          ? 'shadow-[0_0_12px_var(--glow)] text-white'
          : 'opacity-80 hover:opacity-100'
      }`}
      style={
        {
          backgroundColor: active ? config.color : config.bg,
          color: active ? '#040714' : config.color,
          border: `1px solid ${config.border}`,
          '--glow': config.glow,
        } as React.CSSProperties
      }
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
          style={{ backgroundColor: active ? '#ffffff' : config.color }}
        />
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ backgroundColor: active ? '#040714' : config.color }}
        />
      </span>
      <span>{config.label}</span>
      <span className="text-[10px] opacity-85">({config.reps})</span>
    </span>
  );
};

// 16. EMBLEM KASTA LIGA CYBER (Menggantikan 🛡️, 🥉, 🥈, 🥇, 👑)
interface LeagueBadgeProps {
  tier: 'iron' | 'bronze' | 'silver' | 'gold' | 'titan' | string;
  size?: number;
}

export const IconLeagueBadge: React.FC<LeagueBadgeProps> = ({ tier, size = 28 }) => {
  switch (tier) {
    case 'iron':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]">
          <path d="M12 2L4 5V11C4 16.5 7.4 20.8 12 22C16.6 20.8 20 16.5 20 11V5L12 2Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.8" />
          <path d="M12 6V18" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" fill="#94a3b8" />
        </svg>
      );
    case 'bronze':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]">
          <circle cx="12" cy="13" r="8" fill="#78350f" stroke="#d97706" strokeWidth="2" />
          <path d="M12 8L7 2H10L12 5L14 2H17L12 8Z" fill="#d97706" />
          <text x="12" y="16.5" textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="bold" fontFamily="monospace">III</text>
        </svg>
      );
    case 'silver':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">
          <circle cx="12" cy="13" r="8" fill="#0f293a" stroke="#00e5ff" strokeWidth="2" />
          <path d="M12 8L7 2H10L12 5L14 2H17L12 8Z" fill="#00e5ff" />
          <text x="12" y="16.5" textAnchor="middle" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="monospace">II</text>
        </svg>
      );
    case 'gold':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block drop-shadow-[0_0_12px_rgba(255,214,0,0.7)]">
          <circle cx="12" cy="13" r="8" fill="#451a03" stroke="#ffd600" strokeWidth="2" />
          <path d="M12 8L7 2H10L12 5L14 2H17L12 8Z" fill="#ffd600" />
          <text x="12" y="16.5" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="bold" fontFamily="monospace">I</text>
        </svg>
      );
    case 'titan':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block drop-shadow-[0_0_15px_rgba(232,121,249,0.8)]">
          <path d="M5 16L3 6L8.5 10L12 4L15.5 10L21 6L19 16H5Z" fill="#4a044e" stroke="#e879f9" strokeWidth="1.8" />
          <rect x="5" y="17" width="14" height="3" rx="1" fill="#e879f9" />
          <polygon points="12,8 14,12 12,14 10,12" fill="#38bdf8" />
        </svg>
      );
  }
};

// 17. TIMER / STOPWATCH CYBER (Menggantikan ⏱️)
export const IconTimer: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9V13L15 15" />
    <path d="M10 2H14" />
    <path d="M12 2V5" />
  </svg>
);

// 18. MOBILITAS & PEREGANGAN / YOGA CYBER (Menggantikan 🧘)
export const IconStretching: React.FC<IconProps> = ({ size = 20, className = 'text-emerald-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="12" cy="4" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 7V13" />
    <path d="M6 10L12 8L18 10" />
    <path d="M8 20L12 13L16 20" />
    <path d="M5 15L8 20" />
    <path d="M19 15L16 20" />
  </svg>
);

// 19. GEAR / PENGATURAN CYBER (Menggantikan ⚙️)
export const IconGear: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// 20. BOHLAM TIPS FORM (Menggantikan 💡)
export const IconLightbulb: React.FC<IconProps> = ({ size = 20, className = 'text-amber-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM9 21C9 21.55 9.45 22 10 22H14C14.55 22 15 21.55 15 21V20H9V21ZM12 4C14.76 4 17 6.24 17 9C17 10.74 16.08 12.26 14.71 13.12L14 13.57V16H10V13.57L9.29 13.12C7.92 12.26 7 10.74 7 9C7 6.24 9.24 4 12 4Z" />
  </svg>
);

// 21. DNA / BIO-SCAN TELEMETRY (Menggantikan 🧬)
export const IconDna: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M2 15C5 15 7 12 10 12C13 12 15 15 18 15C20 15 21 14 22 13" />
    <path d="M2 9C5 9 7 12 10 12C13 12 15 9 18 9C20 9 21 10 22 11" />
    <line x1="5" y1="10" x2="5" y2="14" />
    <line x1="10" y1="10" x2="10" y2="14" />
    <line x1="15" y1="10" x2="15" y2="14" />
    <line x1="19" y1="10" x2="19" y2="14" />
  </svg>
);

// 22. PERINGATAN / WARNING ALERT (Menggantikan ⚠️ / ⚠)
export const IconWarning: React.FC<IconProps> = ({ size = 20, className = 'text-amber-400', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V10H13V14Z" />
  </svg>
);

// 23. PLAY BUTTON (Menggantikan ▶)
export const IconPlay: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// 24. PAUSE BUTTON (Menggantikan ❚❚)
export const IconPause: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

// 25. SKIP BUTTON (Menggantikan ⏭)
export const IconSkip: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 26. CENTANG CYBER (Menggantikan ✓)
export const IconCheckmark: React.FC<IconProps> = ({ size = 16, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// 27. KUNCI CYBER AKSI / ROOM PASSKEY (Menggantikan 🔑)
export const IconKey: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M21 2L10.7 12.3" />
    <path d="M15.5 7.5L19 11" />
    <path d="M18 5L20 7" />
  </svg>
);

// 28. SALIN DOKUMEN CYBER (Menggantikan 📋)
export const IconCopy: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// 29. TAUTAN HIPERLINK CYBER (Menggantikan 🔗)
export const IconLink: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// 30. STYLUS / EDIT NAMA CYBER (Menggantikan ✏️)
export const IconEdit: React.FC<IconProps> = ({ size = 16, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${className}`}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

// 31. RADAR SCANNER & HOLOGRAPHIC LOADER (Menggantikan 🌀 dan 📡)
export const IconRadar: React.FC<IconProps> = ({ size = 20, className = 'text-cyan', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2.5" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <line x1="12" y1="12" x2="19" y2="5" strokeWidth="2" />
  </svg>
);

// 32. KAMERA VIDEO BROADCAST (Menggantikan 📹)
export const IconVideoCamera: React.FC<IconProps> = ({ size = 20, className = 'text-magenta', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block transition-transform duration-200 ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <rect x="2" y="6" width="13" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
    <polygon points="22 7 15 12 22 17 22 7" fill="currentColor" />
    <circle cx="8" cy="12" r="2.5" fill="currentColor" />
  </svg>
);

// 33. CONTROLLER GAMEPAD CYBER (Menggantikan 🎮)
export const IconGamepad: React.FC<IconProps> = ({ size = 18, className = 'text-current', glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${glow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}
  >
    <path d="M6 12h4m-2-2v4" />
    <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="18.5" cy="13.5" r="1" fill="currentColor" />
    <rect x="2" y="6" width="20" height="12" rx="6" />
  </svg>
);

