'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePoseDetection } from '@/modules/cv-engine/usePoseDetection';
import { drawBioScan } from '@/modules/cv-engine/drawBioScan';
import {
  usePushUpBattle,
  type OpponentMode,
  type BotDifficulty,
  type BattlePlayerRole,
} from '@/modules/game-engine/usePushUpBattle';
import {
  DuelRoomManager,
  generateRoomCode,
  normalizeRoomCode,
  type PlayerRole,
  type RoomPlayer,
} from '@/modules/multiplayer/roomManager';
import { ShareAchievementModal } from '@/components/ShareAchievementModal';
import { UserNavButton } from '@/components/UserNavButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/modules/i18n';
import { getUserProfile } from '@/modules/program-engine/storage';
import { soundEngine } from '@/modules/game-engine/audio';
import {
  IconBolt,
  IconFlame,
  IconCyberBot,
  IconCombat,
  IconTrophy,
  IconTarget,
  IconBurst,
  IconUsers,
  DifficultyBadge,
} from '@/components/ui/CyberIcons';

function PushUpBattleContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const urlRoomCode = searchParams.get('room');

  const [opponentMode, setOpponentMode] = useState<OpponentMode>(
    urlRoomCode ? 'online_pvp' : 'ai_bot'
  );
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [showShareModal, setShowShareModal] = useState(false);
  const [cameraLarge, setCameraLarge] = useState(false);
  const profile = getUserProfile();

  // Canvas ref for battle stage
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live webcam for local player
  const { videoRef, liveLandmarksRef, status, error, start, stop } = usePoseDetection();
  const p1OverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Online Duel Room State
  const roomManagerRef = useRef<DuelRoomManager | null>(null);
  const [roomCode, setRoomCode] = useState<string>(urlRoomCode ? normalizeRoomCode(urlRoomCode) : '');
  const [roomRole, setRoomRole] = useState<PlayerRole>(urlRoomCode ? 'guest' : 'host');
  const [roomStatus, setRoomStatus] = useState<'idle' | 'connecting' | 'waiting' | 'connected' | 'error'>('idle');
  const [roomOpponent, setRoomOpponent] = useState<RoomPlayer | null>(null);
  const [activeRoomTab, setActiveRoomTab] = useState<'create' | 'join'>(urlRoomCode ? 'join' : 'create');
  const [roomInputCode, setRoomInputCode] = useState(urlRoomCode ? normalizeRoomCode(urlRoomCode) : '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [duelCountdown, setDuelCountdown] = useState<number | null>(null);
  const [opponentLeftAlert, setOpponentLeftAlert] = useState(false);

  // Dynamic Bot Name based on difficulty & target reps
  const botName =
    botDifficulty === 'easy'
      ? `${t.arena.botNovice} (10 Push-Up)`
      : botDifficulty === 'hard'
        ? `${t.arena.botMaster} (20 Push-Up)`
        : `${t.arena.botKnight} (15 Push-Up)`;

  // Player Names & Roles
  const localPlayerRole: BattlePlayerRole =
    opponentMode === 'online_pvp' && roomRole === 'guest' ? 'p2' : 'p1';

  const p1DisplayName =
    opponentMode === 'online_pvp'
      ? roomRole === 'host'
        ? profile.username || (language === 'en' ? 'You (P1)' : 'Kamu (P1)')
        : roomOpponent?.username || 'Host (P1)'
      : profile.username || (language === 'en' ? 'You (P1)' : 'Kamu (P1)');

  const p2DisplayName =
    opponentMode === 'ai_bot'
      ? botName
      : opponentMode === 'local_pvp'
        ? language === 'en' ? 'Player 2 (P2)' : 'Pemain 2 (P2)'
        : roomRole === 'guest'
          ? profile.username || (language === 'en' ? 'You (P2)' : 'Kamu (P2)')
          : roomOpponent?.username || (language === 'en' ? 'Challenger (P2)' : 'Penantang (P2)');

  // Hook for battle logic
  const {
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
    targetReps,
    triggerAttack,
    triggerKiCharge,
    receiveRemoteAction,
    restartGame,
  } = usePushUpBattle(
    battleCanvasRef,
    liveLandmarksRef,
    p1DisplayName,
    p2DisplayName,
    opponentMode,
    botDifficulty,
    localPlayerRole,
    (actionType, player) => {
      // Broadcast local action to room channel
      if (opponentMode === 'online_pvp') {
        roomManagerRef.current?.sendAction(actionType, player);
      }
    }
  );

  // Start webcam on mount
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  // Clean up online room on unmount or mode change
  useEffect(() => {
    return () => {
      if (roomManagerRef.current) {
        roomManagerRef.current.disconnect();
        roomManagerRef.current = null;
      }
    };
  }, []);

  // Handle Room Connection logic
  const setupRoomListeners = (manager: DuelRoomManager) => {
    manager.setListener({
      onOpponentJoined: (opp) => {
        setRoomOpponent(opp);
        setRoomStatus('connected');
        setOpponentLeftAlert(false);
        soundEngine.playLevelUp();
      },
      onOpponentLeft: () => {
        setRoomOpponent(null);
        setRoomStatus('waiting');
        setOpponentLeftAlert(true);
        setIsDuelActive(false);
      },
      onRemoteAction: (act) => {
        receiveRemoteAction(act.type, act.player);
      },
      onGameControl: (ctrl) => {
        if (ctrl.event === 'start_countdown') {
          startCountdownSequence();
        } else if (ctrl.event === 'restart_game') {
          restartGame();
          setIsDuelActive(true);
        }
      },
      onStatusChange: (status) => {
        if (status === 'connected') {
          setRoomStatus(manager.opponent ? 'connected' : 'waiting');
        } else if (status === 'error') {
          setRoomStatus('error');
        }
      },
    });
  };

  const handleCreateRoom = () => {
    if (roomManagerRef.current) {
      roomManagerRef.current.disconnect();
    }
    const newCode = generateRoomCode();
    setRoomCode(newCode);
    setRoomRole('host');
    setRoomStatus('waiting');
    setRoomOpponent(null);
    setOpponentLeftAlert(false);

    const manager = new DuelRoomManager(
      newCode,
      'host',
      profile.username || 'Host Knight'
    );
    setupRoomListeners(manager);
    manager.connect();
    roomManagerRef.current = manager;
  };

  const handleJoinRoom = (targetCode?: string) => {
    const raw = targetCode || roomInputCode;
    if (!raw.trim()) return;
    const cleanCode = normalizeRoomCode(raw);
    if (!cleanCode) return;

    if (roomManagerRef.current) {
      roomManagerRef.current.disconnect();
    }
    setRoomCode(cleanCode);
    setRoomRole('guest');
    setRoomStatus('connecting');
    setRoomOpponent(null);
    setOpponentLeftAlert(false);

    const manager = new DuelRoomManager(
      cleanCode,
      'guest',
      profile.username || 'Challenger'
    );
    setupRoomListeners(manager);
    manager.connect();
    roomManagerRef.current = manager;
  };

  const handleLeaveRoom = () => {
    if (roomManagerRef.current) {
      roomManagerRef.current.disconnect();
      roomManagerRef.current = null;
    }
    setRoomCode('');
    setRoomOpponent(null);
    setRoomStatus('idle');
    setIsDuelActive(false);
    setDuelCountdown(null);
    setOpponentLeftAlert(false);
  };

  const startCountdownSequence = () => {
    setDuelCountdown(3);
    soundEngine.playCountdownTick();

    const interval = setInterval(() => {
      setDuelCountdown((c) => {
        if (c === null) {
          clearInterval(interval);
          return null;
        }
        if (c > 1) {
          soundEngine.playCountdownTick();
          return c - 1;
        } else if (c === 1) {
          soundEngine.playLevelUp();
          setIsDuelActive(true);
          restartGame();
          clearInterval(interval);
          setTimeout(() => setDuelCountdown(null), 600);
          return null;
        }
        return null;
      });
    }, 1000);
  };

  const handleStartDuelAsHost = () => {
    if (!roomOpponent || !roomManagerRef.current) return;
    roomManagerRef.current.sendGameControl('start_countdown');
    startCountdownSequence();
  };

  const handleRematchOnline = () => {
    if (opponentMode === 'online_pvp' && roomManagerRef.current) {
      roomManagerRef.current.sendGameControl('restart_game');
    }
    restartGame();
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  // Keyboard shortcut listener for active battle controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'KeyA') {
        e.preventDefault();
        triggerAttack('p1');
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        triggerKiCharge('p1');
      } else if (e.code === 'Enter' || e.code === 'KeyL') {
        e.preventDefault();
        triggerAttack('p2');
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        triggerKiCharge('p2');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerAttack, triggerKiCharge]);

  // Draw Player Skeleton overlay
  useEffect(() => {
    let animId: number;

    const renderOverlay = () => {
      const video = videoRef.current;
      const canvas = p1OverlayCanvasRef.current;

      if (video && canvas && video.videoWidth > 0) {
        const w = video.clientWidth;
        const h = video.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, w, h);
          const landmarks = liveLandmarksRef.current;
          if (landmarks) {
            drawBioScan(ctx, landmarks, {
              width: w,
              height: h,
              sourceWidth: video.videoWidth,
              sourceHeight: video.videoHeight,
              mirrored: true,
              formOk: p1FormCorrect,
            });
          }
        }
      }

      animId = requestAnimationFrame(renderOverlay);
    };

    animId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animId);
  }, [videoRef, liveLandmarksRef, p1FormCorrect]);

  const duelShareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/arena/battle?room=${roomCode}`
      : `https://gymquest.vercel.app/arena/battle?room=${roomCode}`;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-12">
      {/* HEADER */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <Link
            href="/arena"
            className="font-display text-sm tracking-wide text-white hover:text-magenta transition-colors"
          >
            GYMQUEST <span className="text-muted">· {t.arena.pageTitle}</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Selector */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => {
                if (opponentMode === 'online_pvp') handleLeaveRoom();
                setOpponentMode('ai_bot');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                opponentMode === 'ai_bot' ? 'bg-cyan text-void font-bold' : 'text-muted hover:text-white'
              }`}
            >
              <IconCyberBot size={14} className={opponentMode === 'ai_bot' ? 'text-void' : 'text-cyan'} />
              <span>{t.arena.battleVsBot}</span>
            </button>
            <button
              onClick={() => {
                if (opponentMode === 'online_pvp') handleLeaveRoom();
                setOpponentMode('local_pvp');
                restartGame();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                opponentMode === 'local_pvp' ? 'bg-magenta text-white font-bold' : 'text-muted hover:text-white'
              }`}
            >
              <IconUsers size={14} className={opponentMode === 'local_pvp' ? 'text-white' : 'text-magenta'} />
              <span>{t.arena.battleTwoPlayers}</span>
            </button>
            <button
              onClick={() => {
                setOpponentMode('online_pvp');
                if (!roomCode) handleCreateRoom();
              }}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 relative ${
                opponentMode === 'online_pvp'
                  ? 'bg-gradient-to-r from-cyan to-magenta text-void font-bold shadow-[var(--glow-cyan)]'
                  : 'text-muted hover:text-white'
              }`}
            >
              <span className="text-xs">🌐</span>
              <span>{t.arena.battleOnlinePvP}</span>
            </button>
          </div>

          {/* AI Bot Level Selector */}
          {opponentMode === 'ai_bot' && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 text-xs font-mono gap-1">
              <span className="text-[10px] text-muted px-2 hidden sm:inline">{t.arena.battleBotLevel}</span>
              <button
                onClick={() => {
                  setBotDifficulty('easy');
                  restartGame();
                }}
                title={`${t.arena.botNovice}: 10 Push-Up`}
              >
                <DifficultyBadge level="easy" active={botDifficulty === 'easy'} />
              </button>
              <button
                onClick={() => {
                  setBotDifficulty('medium');
                  restartGame();
                }}
                title={`${t.arena.botKnight}: 15 Push-Up`}
              >
                <DifficultyBadge level="medium" active={botDifficulty === 'medium'} />
              </button>
              <button
                onClick={() => {
                  setBotDifficulty('hard');
                  restartGame();
                }}
                title={`${t.arena.botMaster}: 20 Push-Up`}
              >
                <DifficultyBadge level="hard" active={botDifficulty === 'hard'} />
              </button>
            </div>
          )}

          <LanguageSwitcher compact />
          <UserNavButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6 flex-1 flex flex-col justify-center">
        {/* ONLINE ROOM LOBBY CONSOLE (Tampil saat mode online dan duel belum aktif) */}
        {opponentMode === 'online_pvp' && !isDuelActive && (
          <div className="glass-panel clip-corner border-2 border-cyan/50 p-6 sm:p-8 bg-[#091330]/95 space-y-6 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] animate-fade-in max-w-2xl mx-auto w-full">
            {/* Header Lobby */}
            <div className="flex items-center justify-between border-b border-cyan/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚔️</span>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span>{t.arena.battleOnlinePvP}</span>
                  </h2>
                  <p className="text-xs text-muted font-mono">
                    {language === 'en'
                      ? 'Real-time 1v1 webcam push-up clash via live room code'
                      : 'Duel push-up 1v1 real-time via kode room'}
                  </p>
                </div>
              </div>

              {roomCode && (
                <button
                  onClick={handleLeaveRoom}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  {t.arena.leaveRoom}
                </button>
              )}
            </div>

            {/* Tab Selector: Buat Room vs Gabung Room */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => {
                  setActiveRoomTab('create');
                  if (!roomCode || roomRole !== 'host') handleCreateRoom();
                }}
                className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  activeRoomTab === 'create'
                    ? 'bg-cyan text-void shadow-[var(--glow-cyan)]'
                    : 'text-muted hover:text-white'
                }`}
              >
                <span>⚡</span>
                <span>{t.arena.createRoomTab}</span>
              </button>
              <button
                onClick={() => {
                  setActiveRoomTab('join');
                }}
                className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  activeRoomTab === 'join'
                    ? 'bg-magenta text-white shadow-[var(--glow-magenta)]'
                    : 'text-muted hover:text-white'
                }`}
              >
                <span>⚔️</span>
                <span>{t.arena.joinRoomTab}</span>
              </button>
            </div>

            {/* TAB 1: BUAT ROOM (HOST) */}
            {activeRoomTab === 'create' && (
              <div className="space-y-5">
                <div className="text-center space-y-2 p-6 rounded-2xl bg-black/50 border border-cyan/30">
                  <span className="text-xs font-mono uppercase tracking-widest text-cyan">
                    {t.arena.roomCodeLabel}
                  </span>
                  <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-widest text-white drop-shadow-[0_0_25px_rgba(0,229,255,0.6)]">
                    {roomCode || 'GQ-....'}
                  </div>
                  <p className="text-xs font-mono text-muted">
                    {t.arena.connectedAsHost}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
                    <button
                      onClick={() => copyToClipboard(roomCode, 'code')}
                      className="px-4 py-2 rounded-lg bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono font-bold hover:bg-cyan/25 transition-all flex items-center gap-1.5"
                    >
                      <span>📋</span>
                      <span>{copiedCode ? t.arena.codeCopied : t.arena.copyRoomCode}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(duelShareLink, 'link')}
                      className="px-4 py-2 rounded-lg bg-magenta/15 border border-magenta/40 text-magenta text-xs font-mono font-bold hover:bg-magenta/25 transition-all flex items-center gap-1.5"
                    >
                      <span>🔗</span>
                      <span>{copiedLink ? t.arena.linkCopied : t.arena.copyRoomLink}</span>
                    </button>
                  </div>
                </div>

                {/* Status Lawan */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="w-4 h-4 rounded-full bg-cyan block animate-ping absolute inset-0 opacity-75" />
                      <span className="w-4 h-4 rounded-full bg-cyan block relative" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-white">
                        {roomOpponent
                          ? `${t.arena.opponentConnected}: ${roomOpponent.username}`
                          : t.arena.waitingOpponent}
                      </div>
                      <p className="text-xs text-muted leading-tight">
                        {roomOpponent
                          ? language === 'en'
                            ? 'Opponent is in the lobby and ready to clash!'
                            : 'Lawan sudah berada di lobby dan siap adu push-up!'
                          : t.arena.waitingOpponentDesc}
                      </p>
                    </div>
                  </div>

                  {roomOpponent ? (
                    <button
                      onClick={handleStartDuelAsHost}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-magenta text-void font-bold text-sm font-display hover:shadow-[var(--glow-cyan)] transition-all animate-pulse"
                    >
                      {t.arena.startDuelNow}
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-muted bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      Radar Aktif 📡
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GABUNG ROOM (CHALLENGER) */}
            {activeRoomTab === 'join' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="text-xs font-mono text-muted block">
                    {t.arena.roomCodeLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={roomInputCode}
                      onChange={(e) => setRoomInputCode(e.target.value.toUpperCase())}
                      placeholder={t.arena.roomCodePlaceholder}
                      maxLength={10}
                      className="flex-1 bg-black/60 border-2 border-magenta/40 rounded-xl px-4 py-3 font-display text-xl sm:text-2xl text-white tracking-widest uppercase focus:outline-none focus:border-magenta"
                    />
                    <button
                      onClick={() => handleJoinRoom()}
                      className="px-6 py-3.5 rounded-xl bg-magenta text-white font-bold text-sm font-display hover:bg-magenta/80 transition-all shadow-[var(--glow-magenta)]"
                    >
                      {t.arena.joinRoomBtn}
                    </button>
                  </div>
                </div>

                {roomCode && (
                  <div className="rounded-xl border border-magenta/30 bg-magenta/10 p-4 space-y-2 text-center">
                    <div className="text-xs font-mono text-magenta font-bold">
                      {roomStatus === 'connected'
                        ? `✅ ${t.arena.opponentConnected}: Room ${roomCode}`
                        : `🔄 ${t.arena.roomConnecting}`}
                    </div>
                    <p className="text-xs text-muted">
                      {roomRole === 'guest' ? t.arena.connectedAsGuest : t.arena.connectedAsHost}
                    </p>
                    <p className="text-[11px] font-mono text-cyan">
                      {language === 'en'
                        ? 'Waiting for Host to press "Start Duel Now"…'
                        : 'Menunggu Host menekan tombol mulai duel…'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NOTIFIKASI LAWAN TERPUTUS */}
        {opponentLeftAlert && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/15 p-4 text-center space-y-2 animate-fade-in">
            <span className="text-2xl">⚠️</span>
            <div className="font-display text-sm font-bold text-red-400">
              {t.arena.opponentLeftNotice}
            </div>
            <button
              onClick={() => {
                setOpponentLeftAlert(false);
                setIsDuelActive(false);
                if (roomRole === 'host') handleCreateRoom();
              }}
              className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-mono text-xs border border-red-500/40 hover:bg-red-500/30"
            >
              Kembali ke Lobby Room
            </button>
          </div>
        )}

        {/* TOP STATUS BAR: MATCH INFO */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan">
              <IconBolt size={26} className="text-cyan animate-pulse" glow />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>{t.arena.battleTitle}</span>
                <IconBurst size={22} className="text-amber-400" glow />
              </h1>
              <p className="text-xs text-muted font-mono">
                {t.arena.battleInstructions}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {opponentMode === 'online_pvp' && roomCode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-magenta/40 bg-magenta/10 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Room: {roomCode}</span>
                <button
                  onClick={() => copyToClipboard(duelShareLink, 'link')}
                  className="text-magenta hover:text-white underline text-[10px]"
                >
                  {copiedLink ? t.arena.linkCopied : t.arena.copyRoomLink}
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan/30 bg-cyan/10 text-cyan text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,229,255,0.15)]">
              <IconTarget size={14} className="text-cyan" />
              <span>{t.arena.battleTargetKo}</span>
              <span className="text-white">{targetReps} Push-Up</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playCountdownTick();
                if (opponentMode === 'online_pvp') {
                  handleRematchOnline();
                } else {
                  restartGame();
                }
              }}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-cyan text-xs font-mono text-white transition-colors"
            >
              {t.arena.battleRestartRound}
            </button>

            <Link
              href="/arena"
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-magenta text-xs font-mono text-muted hover:text-white transition-colors"
            >
              {t.arena.battleLeaveArena}
            </Link>
          </div>
        </div>

        {/* 2D CANVAS BATTLE VIEW (CENTER STAGE) */}
        <div className="relative w-full rounded-2xl border-2 border-cyan/40 bg-void/90 overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.2)]">
          <canvas
            ref={battleCanvasRef}
            width={800}
            height={380}
            className="w-full h-auto max-h-[380px] block"
          />

          {/* COUNTDOWN 3-2-1 OVERLAY */}
          {duelCountdown !== null && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <span className="text-sm font-mono text-cyan uppercase tracking-widest mb-2">
                {language === 'en' ? 'DUEL STARTING IN' : 'DUEL DIMULAI DALAM'}
              </span>
              <div className="font-display text-8xl font-black text-white drop-shadow-[0_0_35px_rgba(0,229,255,0.9)] animate-ping">
                {duelCountdown}
              </div>
            </div>
          )}
        </div>

        {/* SPLIT-SCREEN CONTROLLERS (PLAYER 1 VS PLAYER 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SISI KIRI: PLAYER 1 (CYAN WARRIOR) */}
          <div className="glass-panel clip-corner border-2 border-cyan/50 p-4 bg-cyan/5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="font-display font-bold text-base text-cyan">
                  {p1DisplayName}
                </span>
                {localPlayerRole === 'p1' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan text-void font-bold">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {localPlayerRole === 'p1' && (
                  <button
                    onClick={() => setCameraLarge((v) => !v)}
                    className="px-2 py-0.5 rounded border border-cyan/30 text-[10px] font-mono text-cyan hover:bg-cyan/10 transition-colors"
                  >
                    {cameraLarge ? t.arena.shrinkCamera : t.arena.enlargeCamera}
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-cyan">HP: {p1Hp}/100</span>
              </div>
            </div>

            {/* LIVE WEBCAM CONTAINER ATAU REMOTE METER CONTAINER */}
            {localPlayerRole === 'p1' ? (
              <div
                className={`relative w-full rounded-xl bg-black/80 overflow-hidden border border-cyan/30 flex items-center justify-center transition-all duration-300 ${
                  cameraLarge ? 'aspect-4/3' : 'aspect-video'
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                />
                <canvas
                  ref={p1OverlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* LOADING CAMERA OVERLAY */}
                {status === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 p-4 text-center space-y-2 z-20">
                    <span className="text-3xl animate-spin">🌀</span>
                    <p className="font-mono text-xs text-cyan font-bold">{t.arena.battleCameraSensorConnecting}</p>
                    <p className="text-[10px] text-muted max-w-xs">
                      {t.arena.battleCameraSensorDesc}
                    </p>
                  </div>
                )}

                {/* CAMERA ERROR / IDLE OVERLAY */}
                {(status === 'error' || status === 'idle') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/95 p-4 text-center space-y-2.5 z-20">
                    <div className="w-11 h-11 rounded-full bg-cyan/15 border border-cyan/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,229,255,0.25)]">
                      📷
                    </div>
                    <p className="font-display text-sm font-bold text-white">
                      {status === 'error' ? t.arena.battleCameraNotActive : t.arena.battleCameraActivate}
                    </p>
                    <p className="text-[11px] text-muted max-w-xs leading-relaxed">
                      {error?.message || t.arena.battleCameraSensorDesc}
                    </p>
                    <button
                      onClick={() => start()}
                      className="px-4 py-2 rounded-lg bg-cyan text-void font-bold text-xs hover:bg-cyan/80 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105"
                    >
                      {t.arena.battleConnectCameraNow}
                    </button>
                  </div>
                )}

                {/* DEPTH HUD */}
                {status === 'running' && (
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 rounded bg-void/80 border border-cyan/40 text-[10px] font-mono z-10">
                    <span className="text-cyan font-bold">{t.arena.battleMotionTracker}</span>
                    <span className={currentPhase === 'down' ? 'text-cyan font-bold' : 'text-muted'}>
                      {currentPhase === 'down' ? `⚡ ${t.arena.battleChargingKi} (${depthPercent}%)` : `⬆ ${t.arena.battleTopPosition}`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/60 border border-cyan/30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span className="text-4xl">⚡</span>
                <p className="font-display text-sm font-bold text-white">{p1DisplayName}</p>
                <p className="text-xs font-mono text-cyan">Online Host (P1)</p>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-cyan transition-all duration-300"
                    style={{ width: `${(p1Reps / targetReps) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tombol aksi manual P1 */}
            <div className="flex gap-2">
              <button
                onClick={() => triggerKiCharge('p1')}
                title="Charge Ki Push-Up [Tombol S]"
                className="flex-1 px-3 py-2 rounded bg-cyan/10 border border-cyan/40 hover:bg-cyan/20 text-cyan text-xs font-mono transition-colors flex items-center justify-center gap-1"
              >
                <IconFlame size={14} className="text-cyan" />
                <span>{t.arena.battleKiCharge}</span>
              </button>
              <button
                onClick={() => triggerAttack('p1')}
                title="Tembakkan Kamehameha! [Tombol Spasi / A]"
                className="flex-2 px-3 py-2 rounded bg-cyan/20 border border-cyan/50 hover:bg-cyan/30 text-cyan text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              >
                <IconBurst size={15} className="text-cyan" glow />
                <span>{t.arena.battleKamehameha}</span>
              </button>
            </div>
          </div>

          {/* SISI KANAN: PLAYER 2 (MAGENTA WARRIOR) */}
          <div className="glass-panel clip-corner border-2 border-magenta/50 p-4 bg-magenta/5 space-y-3 relative overflow-hidden shadow-[0_0_20px_rgba(255,0,122,0.15)]">
            <div className="flex items-center justify-between border-b border-magenta/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="font-display font-bold text-base text-magenta">
                  {p2DisplayName}
                </span>
                {localPlayerRole === 'p2' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-magenta text-white font-bold">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {localPlayerRole === 'p2' && (
                  <button
                    onClick={() => setCameraLarge((v) => !v)}
                    className="px-2 py-0.5 rounded border border-magenta/30 text-[10px] font-mono text-magenta hover:bg-magenta/10 transition-colors"
                  >
                    {cameraLarge ? t.arena.shrinkCamera : t.arena.enlargeCamera}
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-magenta">HP: {p2Hp}/100</span>
              </div>
            </div>

            {/* LIVE WEBCAM JIKA USER ADALAH P2, ATAU BOT/CHALLENGER PANEL JIKA P1 */}
            {localPlayerRole === 'p2' ? (
              <div
                className={`relative w-full rounded-xl bg-black/80 overflow-hidden border border-magenta/30 flex items-center justify-center transition-all duration-300 ${
                  cameraLarge ? 'aspect-4/3' : 'aspect-video'
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                />
                <canvas
                  ref={p1OverlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {status === 'running' && (
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 rounded bg-void/80 border border-magenta/40 text-[10px] font-mono z-10">
                    <span className="text-magenta font-bold">{t.arena.battleMotionTracker}</span>
                    <span className={currentPhase === 'down' ? 'text-magenta font-bold' : 'text-muted'}>
                      {currentPhase === 'down' ? `🔥 ${t.arena.battleChargingKi} (${depthPercent}%)` : `⬆ ${t.arena.battleTopPosition}`}
                    </span>
                  </div>
                )}
              </div>
            ) : opponentMode === 'ai_bot' ? (
              <div className="aspect-video w-full rounded-xl bg-black/60 border border-magenta/30 flex flex-col items-center justify-center p-4 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-magenta/15 border border-magenta/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,122,0.3)]">
                  <IconCyberBot size={32} className="text-magenta" glow />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-white">{botName}</h3>
                  <p className="text-[11px] font-mono text-magenta">
                    {botDifficulty === 'easy'
                      ? 'Kecepatan santai: 10 Push-Up per menit'
                      : botDifficulty === 'hard'
                        ? 'Master Gladiator: 20 Push-Up agresif!'
                        : 'Standar gladiator: 15 Push-Up terukur'}
                  </p>
                </div>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-magenta transition-all duration-300"
                    style={{ width: `${(p2Reps / targetReps) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/60 border border-magenta/30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span className="text-4xl">⚔️</span>
                <p className="font-display text-sm font-bold text-white">{p2DisplayName}</p>
                <p className="text-xs font-mono text-magenta">
                  {opponentMode === 'online_pvp' ? 'Online Challenger (P2)' : t.arena.battleLocalChallenger}
                </p>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-magenta transition-all duration-300"
                    style={{ width: `${(p2Reps / targetReps) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tombol aksi manual P2 */}
            <div className="flex gap-2">
              <button
                onClick={() => triggerKiCharge('p2')}
                title="Charge Ki P2 [Tombol K]"
                className="flex-1 px-3 py-2 rounded bg-magenta/10 border border-magenta/40 hover:bg-magenta/20 text-magenta text-xs font-mono transition-colors flex items-center justify-center gap-1"
              >
                <IconFlame size={14} className="text-magenta" />
                <span>{t.arena.battleKiChargeP2}</span>
              </button>
              <button
                onClick={() => triggerAttack('p2')}
                title="Tembakkan Final Flash! [Tombol Enter / L]"
                className="flex-2 px-3 py-2 rounded bg-magenta/20 border border-magenta/50 hover:bg-magenta/30 text-magenta text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,0,122,0.25)]"
              >
                <IconBurst size={15} className="text-magenta" glow />
                <span>{t.arena.battleFinalFlash}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GAME OVER CELEBRATION MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel clip-corner w-full max-w-md border-cyan p-6 sm:p-8 text-center bg-void/98 space-y-6 shadow-[0_0_60px_rgba(0,229,255,0.3)]">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center border border-cyan/40 bg-cyan/15">
              {winner === 'p1' ? (
                <IconTrophy size={36} className="text-cyan" glow />
              ) : winner === 'p2' ? (
                <IconFlame size={36} className="text-magenta" glow />
              ) : (
                <IconBolt size={36} className="text-amber-400" glow />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan font-bold">
                {t.arena.battleDuelComplete}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {winner === 'p1' && t.arena.battleWinnerP1}
                {winner === 'p2' && t.arena.battleWinnerP2}
                {winner === 'draw' && t.arena.battleWinnerDraw}
              </h2>
              <p className="text-xs text-muted">
                {p1DisplayName}: <strong>{p1Reps} Reps</strong> vs {p2DisplayName}:{' '}
                <strong>{p2Reps} Reps</strong>.
              </p>
            </div>

            {/* STATS COMPARISON */}
            <div className="grid grid-cols-2 gap-3 py-2 border-y border-white/10 text-xs font-mono">
              <div className="p-2 bg-cyan/10 rounded-lg border border-cyan/30">
                <div className="text-[10px] text-muted">{p1DisplayName}</div>
                <div className="font-bold text-cyan text-lg mt-0.5">{p1Reps} Reps</div>
                <div className="text-[10px] text-muted mt-0.5">{t.arena.battleRemainingHp} {p1Hp}</div>
              </div>
              <div className="p-2 bg-magenta/10 rounded-lg border border-magenta/30">
                <div className="text-[10px] text-muted">{p2DisplayName}</div>
                <div className="font-bold text-magenta text-lg mt-0.5">{p2Reps} Reps</div>
                <div className="text-[10px] text-muted mt-0.5">{t.arena.battleRemainingHp} {p2Hp}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full flex items-center justify-center gap-2 clip-corner bg-emerald-500 py-3 font-mono text-xs font-bold text-void hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <span>{t.arena.battleShareRecord}</span>
                <IconBurst size={14} className="text-void" />
              </button>

              <button
                onClick={handleRematchOnline}
                className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <IconCombat size={15} className="text-void" />
                <span>{t.arena.battleRematch}</span>
              </button>

              <Link
                href="/arena"
                className="w-full clip-corner border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold text-muted hover:text-white transition-colors"
              >
                {t.arena.battleBackToArena}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SHARE ACHIEVEMENT MODAL */}
      <ShareAchievementModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{
          title: 'Push-Up Battle 1v1 Arena',
          reps: localPlayerRole === 'p2' ? p2Reps : p1Reps,
          durationMinutes: Math.max(1, Math.round((60 - timeLeft) / 60)),
          calories: Math.round((localPlayerRole === 'p2' ? p2Reps : p1Reps) * 0.8 + 15),
          streakDays: profile.streakDays || 1,
          leagueName: 'Arena Gladiator',
          username: profile.username || 'Knight-01',
        }}
      />
    </main>
  );
}

export default function PushUpBattlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-sm text-muted bg-transparent">
          Memuat arena duel online…
        </div>
      }
    >
      <PushUpBattleContent />
    </Suspense>
  );
}
