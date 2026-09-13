import React from 'react';

export type AvatarId =
  | 'knight'
  | 'lifter'
  | 'striker'
  | 'runner'
  | 'yogi'
  | 'titan'
  | 'valkyrie'
  | 'guardian';

interface CyberAvatarProps {
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Map emoji lama atau avatar ID ke avatar handcrafted SVG
function resolveAvatarKey(input?: string): AvatarId {
  if (!input) return 'knight';

  const normalized = input.trim().toLowerCase();
  if (['knight', 'satria', 'warrior'].includes(normalized)) return 'knight';
  if (['lifter', 'gymbro', 'heavy', 'beast'].includes(normalized)) return 'lifter';
  if (['striker', 'boxer', 'fighter'].includes(normalized)) return 'striker';
  if (['runner', 'speed', 'sprint', 'cardio'].includes(normalized)) return 'runner';
  if (['yogi', 'monk', 'zen', 'calisthenics'].includes(normalized)) return 'yogi';
  if (['titan', 'power', 'tank'].includes(normalized)) return 'titan';
  if (['valkyrie', 'femme', 'queen'].includes(normalized)) return 'valkyrie';
  if (['guardian', 'shield', 'core'].includes(normalized)) return 'guardian';

  // Fallback emoji bawaan lama
  switch (input) {
    case '⚡':
    case '🏃':
    case '🌀':
      return 'runner';
    case '🛡️':
      return 'guardian';
    case '🔥':
    case '🐲':
    case '⚙️':
      return 'titan';
    case '🗡️':
    case '🦅':
      return 'valkyrie';
    case '💪':
    case '🦁':
      return 'lifter';
    case '🐍':
    case '🥊':
      return 'striker';
    case '🧘':
      return 'yogi';
    case '⚔️':
    default:
      return 'knight';
  }
}

export const CyberAvatar: React.FC<CyberAvatarProps> = ({
  avatar,
  size = 'md',
  className = '',
}) => {
  const avatarKey = resolveAvatarKey(avatar);

  const sizeClasses = {
    xs: 'w-5 h-5 min-w-[20px] rounded-md',
    sm: 'w-7 h-7 min-w-[28px] rounded-lg',
    md: 'w-9 h-9 min-w-[36px] rounded-xl',
    lg: 'w-12 h-12 min-w-[48px] rounded-2xl',
    xl: 'w-14 h-14 min-w-[56px] rounded-2xl',
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none shadow-sm ${sizeClasses} ${className}`}
      title={`Avatar: ${avatarKey}`}
    >
      {/* ================= 1. THE IRON KNIGHT ================= */}
      {avatarKey === 'knight' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-knight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#083344" />
            </linearGradient>
            <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#00e5ff" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-knight)" />
          {/* Cyber Helm Silhouette */}
          <path
            d="M24 7 L36 14 V26 C36 33 24 41 24 41 C24 41 12 33 12 26 V14 Z"
            fill="#1e293b"
            stroke="url(#neon-cyan)"
            strokeWidth="1.8"
          />
          {/* Visor */}
          <path
            d="M17 21 H31 V24 C31 27 28 29 24 29 C20 29 17 27 17 24 Z"
            fill="#00e5ff"
            opacity="0.9"
          />
          {/* Crest/Aksen Ksatria */}
          <path d="M24 10 V18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="24" cy="34" r="1.5" fill="#00e5ff" />
        </svg>
      )}

      {/* ================= 2. THE POWER LIFTER ================= */}
      {avatarKey === 'lifter' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-lifter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1b18" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-lifter)" />
          {/* Hex Barbell Plate Background */}
          <polygon
            points="24,9 35,15 35,27 24,33 13,27 13,15"
            fill="#292524"
            stroke="url(#gold-grad)"
            strokeWidth="1.5"
          />
          {/* Biceps / Athlete silhouette */}
          <path
            d="M19 25 C17 22 17 18 20 17 C22 16 23 18 24 20 C25 18 26 16 28 17 C31 18 31 22 29 25 L24 29 Z"
            fill="url(#gold-grad)"
          />
          {/* Barbell Bar & Weights */}
          <rect x="10" y="35" width="28" height="3" rx="1.5" fill="#e2e8f0" />
          <rect x="8" y="32" width="4" height="9" rx="1" fill="url(#gold-grad)" />
          <rect x="36" y="32" width="4" height="9" rx="1" fill="url(#gold-grad)" />
        </svg>
      )}

      {/* ================= 3. THE SPEED RUNNER ================= */}
      {avatarKey === 'runner' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-runner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#062e24" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-runner)" />
          {/* Speed trail wings */}
          <path d="M8 20 L22 12 L18 22 Z" fill="#047857" opacity="0.6" />
          <path d="M10 26 L26 18 L22 28 Z" fill="#059669" opacity="0.8" />
          {/* Aerodynamic Runner Head & Visor */}
          <circle cx="28" cy="18" r="6" fill="#1e293b" stroke="url(#emerald-grad)" strokeWidth="1.5" />
          <path d="M26 17 L35 19 L32 21 Z" fill="url(#emerald-grad)" />
          {/* Dynamic Motion Ribbons */}
          <path
            d="M12 36 C18 34 26 31 38 23"
            stroke="url(#emerald-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M15 40 C22 38 28 35 36 29"
            stroke="#a7f3d0"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="2 3"
          />
        </svg>
      )}

      {/* ================= 4. THE STRIKER / BOXER ================= */}
      {avatarKey === 'striker' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-striker" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2b0d12" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id="crimson-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-striker)" />
          {/* Combat Fist / Glove Shield */}
          <path
            d="M24 10 C20 10 16 13 16 18 C16 23 18 28 24 38 C30 28 32 23 32 18 C32 13 28 10 24 10 Z"
            fill="#1e293b"
            stroke="url(#crimson-grad)"
            strokeWidth="1.8"
          />
          {/* Boxing Fist Impact */}
          <circle cx="24" cy="20" r="5" fill="url(#crimson-grad)" />
          <path d="M21 27 H27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 31 H26" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" />
          {/* Impact Sparks */}
          <line x1="12" y1="14" x2="15" y2="17" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="14" x2="33" y2="17" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {/* ================= 5. THE CALISTHENICS / YOGI ================= */}
      {avatarKey === 'yogi' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-yogi" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e1035" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <linearGradient id="violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-yogi)" />
          {/* Inner Balance Sacred Rings */}
          <circle cx="24" cy="24" r="15" stroke="#7e22ce" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="24" cy="24" r="9" stroke="url(#violet-grad)" strokeWidth="1.5" opacity="0.7" />
          {/* Yogi Balance Silhouette */}
          <circle cx="24" cy="15" r="3.5" fill="#f3e8ff" />
          <path
            d="M24 20 V29 M16 26 L24 24 L32 26 M18 36 L24 31 L30 36"
            stroke="url(#violet-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Core Lotus Jewel */}
          <circle cx="24" cy="24" r="2" fill="#38bdf8" />
        </svg>
      )}

      {/* ================= 6. THE TITAN TANK ================= */}
      {avatarKey === 'titan' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-titan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#271302" />
              <stop offset="100%" stopColor="#431407" />
            </linearGradient>
            <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-titan)" />
          {/* Heavy Armor Silhouette */}
          <path
            d="M12 18 L24 10 L36 18 L38 32 L24 40 L10 32 Z"
            fill="#1c1917"
            stroke="url(#orange-grad)"
            strokeWidth="1.8"
          />
          {/* Titan Core Chest Plate */}
          <polygon points="24,18 30,23 28,31 24,34 20,31 18,23" fill="url(#orange-grad)" />
          <circle cx="24" cy="25" r="2.5" fill="#ffffff" />
          {/* Horn / Shoulder Spikes */}
          <path d="M12 18 L6 14 L9 22 Z" fill="#ea580c" />
          <path d="M36 18 L42 14 L39 22 Z" fill="#ea580c" />
        </svg>
      )}

      {/* ================= 7. THE VALKYRIE ================= */}
      {avatarKey === 'valkyrie' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-valk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#260e22" />
              <stop offset="100%" stopColor="#500724" />
            </linearGradient>
            <linearGradient id="fuchsia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-valk)" />
          {/* Valkyrie Wings */}
          <path
            d="M10 22 C14 16 19 14 24 14 C29 14 34 16 38 22 C33 27 28 29 24 30 C20 29 15 27 10 22 Z"
            fill="#1e1b4b"
            stroke="url(#fuchsia-grad)"
            strokeWidth="1.5"
          />
          {/* Wing Feathers */}
          <path d="M8 20 L16 26" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M40 20 L32 26" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" />
          {/* Center Crown / Diadem */}
          <polygon points="24,11 27,18 24,16 21,18" fill="#ffffff" />
          <circle cx="24" cy="23" r="3" fill="url(#fuchsia-grad)" />
          <circle cx="24" cy="34" r="1.5" fill="#f472b6" />
        </svg>
      )}

      {/* ================= 8. THE SHIELD GUARDIAN ================= */}
      {avatarKey === 'guardian' && (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="bg-guard" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0c1d38" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="sky-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill="url(#bg-guard)" />
          {/* Aegis Crest Shield */}
          <path
            d="M24 8 L36 13 C36 26 29 36 24 40 C19 36 12 26 12 13 Z"
            fill="#0f172a"
            stroke="url(#sky-grad)"
            strokeWidth="1.8"
          />
          {/* Triple Defensive Chevrons */}
          <path d="M20 18 L24 22 L28 18" stroke="url(#sky-grad)" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 23 L24 27 L28 23" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 28 L24 32 L28 28" stroke="#dbeafe" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
