'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PushUpBattleGame } from './pushUpBattleGame';
import { RepCounter } from '../rep-counter/repCounter';
import type { PoseLandmarks } from '../cv-engine/types';

export type OpponentMode = 'ai_bot' | 'local_pvp';

export function usePushUpBattle(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>,
  p1Name = 'Kamu (P1)',
  p2Name = 'Cyber Challenger',
  opponentMode: OpponentMode = 'ai_bot',
) {
  const gameRef = useRef<PushUpBattleGame | null>(null);
  const repCounterP1Ref = useRef<RepCounter | null>(null);

  const [p1Reps, setP1Reps] = useState(0);
  const [p2Reps, setP2Reps] = useState(0);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw' | null>(null);
  const [p1FormCorrect, setP1FormCorrect] = useState(true);

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new PushUpBattleGame(canvas, p1Name, p2Name);
    gameRef.current = game;
    repCounterP1Ref.current = new RepCounter('push_up');

    game.onGameOver = (win, r1, r2) => {
      setIsGameOver(true);
      setWinner(win);
      setP1Reps(r1);
      setP2Reps(r2);
    };

    game.start();

    // Loop interval to update React UI state from game engine
    const uiInterval = setInterval(() => {
      if (gameRef.current) {
        setP1Hp(Math.round(gameRef.current.player1.hp));
        setP2Hp(Math.round(gameRef.current.player2.hp));
        setP1Reps(gameRef.current.player1.reps);
        setP2Reps(gameRef.current.player2.reps);
        setTimeLeft(Math.ceil(gameRef.current.timeRemaining));
      }
    }, 100);

    // AI Bot simulation loop if opponentMode === 'ai_bot'
    let aiInterval: NodeJS.Timeout | null = null;
    if (opponentMode === 'ai_bot') {
      const scheduleNextAiRep = () => {
        if (game.isGameOver) return;
        // Jeda push-up AI antara 2.2 - 3.8 detik
        const delay = Math.random() * 1600 + 2200;
        aiInterval = setTimeout(() => {
          if (!game.isGameOver && gameRef.current) {
            gameRef.current.triggerRepAttack('p2');
          }
          scheduleNextAiRep();
        }, delay);
      };
      scheduleNextAiRep();
    }

    return () => {
      game.stop();
      clearInterval(uiInterval);
      if (aiInterval) clearTimeout(aiInterval);
    };
  }, [canvasRef, p1Name, p2Name, opponentMode]);

  // CV Landmark Loop to check Player 1 push-up reps & Ki Charge
  useEffect(() => {
    let animId: number;

    const checkCv = () => {
      if (liveLandmarksRef.current && repCounterP1Ref.current && gameRef.current && !isGameOver) {
        const state = repCounterP1Ref.current.update(liveLandmarksRef.current, performance.now());
        setP1FormCorrect(state.formOk);

        // Saat posisi push-up bawah (kontraksi dada), charge Ki Kamehameha!
        if (state.phase === 'down') {
          gameRef.current.triggerKiCharge('p1');
        }

        // Saat repetisi baru selesai (kembali ke atas), tembakkan Kamehameha!
        if (state.reps > gameRef.current.player1.reps) {
          gameRef.current.triggerRepAttack('p1');
        }
      }
      animId = requestAnimationFrame(checkCv);
    };

    animId = requestAnimationFrame(checkCv);
    return () => cancelAnimationFrame(animId);
  }, [liveLandmarksRef, isGameOver]);

  // Manual trigger for attack (Kamehameha blast)
  const triggerAttack = useCallback((player: 'p1' | 'p2') => {
    if (gameRef.current && !isGameOver) {
      gameRef.current.triggerRepAttack(player);
    }
  }, [isGameOver]);

  // Manual trigger for charging Ki
  const triggerKiCharge = useCallback((player: 'p1' | 'p2') => {
    if (gameRef.current && !isGameOver) {
      gameRef.current.triggerKiCharge(player);
    }
  }, [isGameOver]);

  const restartGame = useCallback(() => {
    if (gameRef.current) {
      setIsGameOver(false);
      setWinner(null);
      setP1Reps(0);
      setP2Reps(0);
      setP1Hp(100);
      setP2Hp(100);
      setTimeLeft(60);
      if (repCounterP1Ref.current) {
        repCounterP1Ref.current.reset();
      }
      gameRef.current.start();
    }
  }, []);

  return {
    p1Reps,
    p2Reps,
    p1Hp,
    p2Hp,
    timeLeft,
    isGameOver,
    winner,
    p1FormCorrect,
    triggerAttack,
    triggerKiCharge,
    restartGame,
  };
}
