'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PushUpBattleGame } from './pushUpBattleGame';
import { RepCounter } from '../rep-counter/repCounter';
import type { PoseLandmarks } from '../cv-engine/types';

import { VerticalControlTracker } from './verticalControl';

export type OpponentMode = 'ai_bot' | 'local_pvp' | 'online_pvp';
export type BotDifficulty = 'easy' | 'medium' | 'hard';
export type BattlePlayerRole = 'p1' | 'p2';

export function usePushUpBattle(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  liveLandmarksRef: React.RefObject<PoseLandmarks | null>,
  p1Name = 'Kamu (P1)',
  p2Name = 'Cyber Challenger',
  opponentMode: OpponentMode = 'ai_bot',
  botDifficulty: BotDifficulty = 'medium',
  playerRole: BattlePlayerRole = 'p1',
  onLocalAction?: (type: 'attack' | 'charge', player: 'p1' | 'p2') => void,
  isGameActive = true,
) {
  const gameRef = useRef<PushUpBattleGame | null>(null);
  const repCounterP1Ref = useRef<RepCounter | null>(null);
  const verticalTrackerRef = useRef(new VerticalControlTracker('push_up'));
  const verticalPhaseRef = useRef<'up' | 'down'>('up');

  const [p1Reps, setP1Reps] = useState(0);
  const [p2Reps, setP2Reps] = useState(0);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw' | null>(null);
  const [p1FormCorrect, setP1FormCorrect] = useState(true);
  const [depthPercent, setDepthPercent] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'up' | 'down'>('up');

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetReps = botDifficulty === 'easy' ? 10 : botDifficulty === 'medium' ? 15 : 20;
    const game = new PushUpBattleGame(canvas, p1Name, p2Name, targetReps);
    gameRef.current = game;
    repCounterP1Ref.current = new RepCounter('push_up');
    verticalTrackerRef.current = new VerticalControlTracker('push_up');
    verticalPhaseRef.current = 'up';

    game.onGameOver = (win, r1, r2) => {
      setIsGameOver(true);
      setWinner(win);
      setP1Reps(r1);
      setP2Reps(r2);
    };

    if (isGameActive) {
      game.start();
    }

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
    let aiChargeTimeout: NodeJS.Timeout | null = null;

    if (opponentMode === 'ai_bot') {
      const repIntervalMs = botDifficulty === 'easy' ? 6000 : botDifficulty === 'medium' ? 4000 : 3000;

      const scheduleNextAiRep = () => {
        if (game.isGameOver) return;

        const chargeDelay = repIntervalMs * 0.5;
        aiChargeTimeout = setTimeout(() => {
          if (!game.isGameOver && gameRef.current) {
            gameRef.current.triggerKiCharge('p2');
          }
        }, chargeDelay);

        aiInterval = setTimeout(() => {
          if (!game.isGameOver && gameRef.current) {
            gameRef.current.triggerRepAttack('p2');
          }
          scheduleNextAiRep();
        }, repIntervalMs);
      };

      scheduleNextAiRep();
    }

    return () => {
      game.stop();
      clearInterval(uiInterval);
      if (aiInterval) clearTimeout(aiInterval);
      if (aiChargeTimeout) clearTimeout(aiChargeTimeout);
    };
  }, [canvasRef, p1Name, p2Name, opponentMode, botDifficulty, isGameActive]);

  // Pantau perubahan status aktif duel
  useEffect(() => {
    if (isGameActive && gameRef.current && !gameRef.current.isGameOver) {
      gameRef.current.start();
    }
  }, [isGameActive]);

  // CV Landmark Loop: Menggunakan pelacakan vertikal atas-bawah
  useEffect(() => {
    let animId: number;
    const localPlayer: 'p1' | 'p2' = opponentMode === 'online_pvp' && playerRole === 'p2' ? 'p2' : 'p1';

    const checkCv = () => {
      const landmarks = liveLandmarksRef.current;
      if (landmarks && gameRef.current && !isGameOver) {
        // 1. Pelacakan Gerakan Vertikal
        const vertical = verticalTrackerRef.current.read(landmarks);

        if (vertical !== null) {
          const depth = Math.round((1 - vertical) * 100);
          setDepthPercent(Math.max(0, Math.min(100, depth)));

          // Masuk posisi BAWAH push-up -> CHARGE KI!
          if (verticalPhaseRef.current === 'up' && vertical < 0.40) {
            verticalPhaseRef.current = 'down';
            setCurrentPhase('down');
            gameRef.current.triggerKiCharge(localPlayer);
            onLocalAction?.('charge', localPlayer);
          }
          // Masih di bawah, terus tambahkan Ki
          else if (verticalPhaseRef.current === 'down' && vertical < 0.48) {
            if (Math.random() < 0.3) {
              gameRef.current.triggerKiCharge(localPlayer);
              onLocalAction?.('charge', localPlayer);
            }
          }
          // Dorong kembali ke ATAS -> REPETISI SELESAI -> TEMBAK KAMEHAMEHA!
          else if (verticalPhaseRef.current === 'down' && vertical > 0.68) {
            verticalPhaseRef.current = 'up';
            setCurrentPhase('up');
            gameRef.current.triggerRepAttack(localPlayer);
            onLocalAction?.('attack', localPlayer);
          }
        }

        // 2. Evaluasi biomekanik sudut siku
        if (repCounterP1Ref.current) {
          const state = repCounterP1Ref.current.update(landmarks, performance.now());
          setP1FormCorrect(state.formOk);

          const currentReps =
            localPlayer === 'p2' ? gameRef.current.player2.reps : gameRef.current.player1.reps;

          if (state.reps > currentReps) {
            gameRef.current.triggerRepAttack(localPlayer);
            onLocalAction?.('attack', localPlayer);
          }
        }
      }

      animId = requestAnimationFrame(checkCv);
    };

    animId = requestAnimationFrame(checkCv);
    return () => cancelAnimationFrame(animId);
  }, [liveLandmarksRef, isGameOver, opponentMode, playerRole, onLocalAction]);

  // Manual trigger for attack (Kamehameha blast)
  const triggerAttack = useCallback((player: 'p1' | 'p2') => {
    if (gameRef.current && !isGameOver) {
      gameRef.current.triggerRepAttack(player);
      if (opponentMode === 'online_pvp') {
        onLocalAction?.('attack', player);
      }
    }
  }, [isGameOver, opponentMode, onLocalAction]);

  // Manual trigger for charging Ki
  const triggerKiCharge = useCallback((player: 'p1' | 'p2') => {
    if (gameRef.current && !isGameOver) {
      gameRef.current.triggerKiCharge(player);
      if (opponentMode === 'online_pvp') {
        onLocalAction?.('charge', player);
      }
    }
  }, [isGameOver, opponentMode, onLocalAction]);

  // Handle remote attack/charge received from network opponent
  const receiveRemoteAction = useCallback((type: 'attack' | 'charge', player: 'p1' | 'p2') => {
    if (gameRef.current && !isGameOver) {
      if (type === 'charge') {
        gameRef.current.triggerKiCharge(player);
      } else if (type === 'attack') {
        gameRef.current.triggerRepAttack(player);
      }
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
      setDepthPercent(0);
      setCurrentPhase('up');
      verticalPhaseRef.current = 'up';
      if (repCounterP1Ref.current) {
        repCounterP1Ref.current.reset();
      }
      verticalTrackerRef.current.setMode('push_up');
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
    depthPercent,
    currentPhase,
    targetReps: botDifficulty === 'easy' ? 10 : botDifficulty === 'medium' ? 15 : 20,
    triggerAttack,
    triggerKiCharge,
    receiveRemoteAction,
    restartGame,
  };
}
