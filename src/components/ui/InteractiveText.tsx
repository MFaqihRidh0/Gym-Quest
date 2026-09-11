'use client';

import React from 'react';

interface InteractiveTextProps {
  text: string;
  isGradient?: boolean;
  baseDelay?: number;
  className?: string;
}

/**
 * InteractiveText
 * Renders text letter-by-letter with:
 * 1. Gentle continuous floating wave animation (animate-letter-wave)
 * 2. 3D embossed pop & shadow glow effect on cursor hover (interactive-char)
 * 3. Continuous gradient spanning smoothly across split letter spans if isGradient is true.
 */
export const InteractiveText: React.FC<InteractiveTextProps> = ({
  text,
  isGradient = false,
  baseDelay = 0,
  className = '',
}) => {
  const words = text.split(' ');
  const totalChars = text.length;

  let globalCharIdx = baseDelay;

  return (
    <span className={`inline ${className}`}>
      {words.map((word, wordIdx) => {
        const letters = word.split('').map((char, charIdx) => {
          const currentIdx = globalCharIdx++;
          const tilt = ((currentIdx % 5) - 2) * 2.5; // subtle alternating tilt (-5deg to +5deg)

          const letterStyle: React.CSSProperties = {
            animationDelay: `${(currentIdx % 10) * 0.2}s`,
            ['--char-tilt' as any]: tilt,
          };

          if (isGradient) {
            const bgPositionPercent =
              totalChars > 1 ? (currentIdx / (totalChars - 1)) * 100 : 0;
            letterStyle.backgroundImage =
              'linear-gradient(to right, var(--accent-cyan), #5eead4, var(--accent-magenta))';
            letterStyle.backgroundSize = `${totalChars * 100}% 100%`;
            letterStyle.backgroundPosition = `${bgPositionPercent}% 0%`;
            letterStyle.WebkitBackgroundClip = 'text';
            letterStyle.WebkitTextFillColor = 'transparent';
          }

          return (
            <span
              key={charIdx}
              style={letterStyle}
              className={`interactive-char inline-block animate-letter-wave select-none ${
                isGradient ? '' : 'interactive-char-solid'
              }`}
            >
              {char}
            </span>
          );
        });

        return (
          <span key={wordIdx} className="inline-block whitespace-nowrap">
            {letters}
            {wordIdx < words.length - 1 && (
              <span className="inline-block whitespace-pre">&nbsp;</span>
            )}
          </span>
        );
      })}
    </span>
  );
};
