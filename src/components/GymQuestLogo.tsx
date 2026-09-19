'use client';

import React from 'react';
import Image from 'next/image';

interface GymQuestLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'emblem' | 'full' | 'inline';
  showTagline?: boolean;
  glow?: boolean;
  className?: string;
}

export const GymQuestLogo: React.FC<GymQuestLogoProps> = ({
  size = 'md',
  variant = 'inline',
  showTagline = false,
  glow = true,
  className = '',
}) => {
  // Dimensions for emblem
  const dimensions = {
    xs: { emblemW: 24, emblemH: 16, text: 'text-base', subText: 'text-[7px]' },
    sm: { emblemW: 32, emblemH: 21, text: 'text-lg', subText: 'text-[8px]' },
    md: { emblemW: 42, emblemH: 27, text: 'text-xl', subText: 'text-[9px]' },
    lg: { emblemW: 64, emblemH: 41, text: 'text-3xl', subText: 'text-xs' },
    xl: { emblemW: 100, emblemH: 64, text: 'text-5xl', subText: 'text-sm' },
  }[size];

  const glowEffect = glow
    ? 'drop-shadow-[0_0_18px_rgba(0,229,255,0.65)] drop-shadow-[0_0_32px_rgba(255,0,128,0.4)] group-hover:drop-shadow-[0_0_35px_rgba(0,229,255,0.9)] group-hover:drop-shadow-[0_0_50px_rgba(255,0,128,0.7)] transition-all duration-300'
    : '';

  if (variant === 'emblem') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <Image
          src="/logo-emblem.png"
          alt="GymQuest Logo"
          width={dimensions.emblemW}
          height={dimensions.emblemH}
          className={`object-contain ${glowEffect}`}
          priority
        />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 group ${className}`}>
        <div className="relative">
          <Image
            src="/logo-emblem.png"
            alt="GymQuest Logo Emblem"
            width={dimensions.emblemW * 1.5}
            height={dimensions.emblemH * 1.5}
            className={`object-contain ${glowEffect} group-hover:scale-105 transition-transform`}
            priority
          />
        </div>
        <div>
          <span className={`font-display font-black tracking-wider bg-gradient-to-r from-white via-cyan to-magenta bg-clip-text text-transparent block ${dimensions.text}`}>
            GYMQUEST
          </span>
          <span className={`font-body font-medium text-cyan/80 tracking-wider block mt-0.5 ${dimensions.subText}`}>
            Your Fitness Adventure.
          </span>
        </div>
      </div>
    );
  }

  // Default: 'inline'
  return (
    <div className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/logo-emblem.png"
          alt="GymQuest Emblem"
          width={dimensions.emblemW}
          height={dimensions.emblemH}
          className={`object-contain ${glowEffect} group-hover:scale-110 transition-transform duration-300`}
          priority
        />
      </div>
      <div className="flex flex-col">
        <span className={`font-display font-black tracking-wider bg-gradient-to-r from-white via-cyan to-magenta bg-clip-text text-transparent leading-none ${dimensions.text}`}>
          GYMQUEST
        </span>
        {showTagline && (
          <span className={`font-body font-medium text-cyan/70 tracking-widest uppercase mt-0.5 ${dimensions.subText}`}>
            Your Fitness Adventure
          </span>
        )}
      </div>
    </div>
  );
};
