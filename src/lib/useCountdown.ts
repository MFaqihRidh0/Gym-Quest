'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Countdown yang mulai ulang penuh setiap kali `active` menyala — cocok
 * untuk sesi latihan/game yang dimulai dari nol tiap kali kamera dinyalakan.
 */
export function useCountdown(
  durationSeconds: number,
  active: boolean,
  onExpire?: () => void,
  /** Ubah nilai ini untuk memulai ulang timer tanpa perlu mematikan `active`. */
  resetKey: number | string = 0,
) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // Reset nilai yang ditampilkan begitu sesi baru dimulai (bukan di dalam
  // effect, dan bukan lewat ref) — pola resmi React untuk "menyesuaikan
  // state saat prop berubah": https://react.dev/learn/you-might-not-need-an-effect
  const sessionKey = `${active}:${resetKey}`;
  const [trackedKey, setTrackedKey] = useState(sessionKey);
  if (trackedKey !== sessionKey) {
    setTrackedKey(sessionKey);
    setRemaining(durationSeconds);
  }

  useEffect(() => {
    if (!active) return;

    const start = performance.now();
    let raf = 0;

    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        onExpireRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationSeconds, resetKey]);

  return remaining;
}

export function formatCountdown(seconds: number): string {
  const total = Math.ceil(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
