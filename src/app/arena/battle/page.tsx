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
import { getOrCreatePlayerUsername } from '@/modules/gamification/gladiatorNames';
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

import { useWebRtcDuel } from '@/modules/multiplayer/useWebRtcDuel';
import { CyberAvatar } from '@/components/CyberAvatar';

function RemoteVideoPlayer({
  stream,
  className,
  fallbackLabel = 'Menghubungkan video lawan...',
}: {
  stream: MediaStream | null;
  className?: string;
  fallbackLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className={`flex flex-col items-center justify-center bg-black/80 border border-white/10 p-4 text-center ${className || ''}`}>
        <div className="w-12 h-12 rounded-full bg-magenta/15 border border-magenta/40 flex items-center justify-center text-xl text-magenta animate-pulse mb-2 shadow-[0_0_15px_rgba(255,0,122,0.3)]">
          📹
        </div>
        <p className="text-xs font-mono text-muted">{fallbackLabel}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`object-cover ${className || ''}`}
    />
  );
}

function PushUpBattleContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') as OpponentMode | null;
  const urlDifficulty = searchParams.get('difficulty') as BotDifficulty | null;
  const urlAction = searchParams.get('action') as 'create' | 'join' | null;
  const urlRoomCode = searchParams.get('room');

  // Stage: 'selection' (Pilih Lawan) | 'waiting_room' (Lobby Tunggu Online 1v1) | 'battle' (Masuk Permainan Game)
  const [battleStage, setBattleStage] = useState<'selection' | 'waiting_room' | 'battle'>(
    urlRoomCode || urlMode === 'online_pvp' ? 'waiting_room' : urlMode ? 'battle' : 'selection'
  );

  // Selection view states (untuk halaman pemilihan lawan)
  const [selectedLobbyTarget, setSelectedLobbyTarget] = useState<'bot' | 'online' | 'local'>('bot');
  const [selectedLobbyDifficulty, setSelectedLobbyDifficulty] = useState<BotDifficulty>(
    urlDifficulty || 'medium'
  );
  const [onlineLobbyTab, setOnlineLobbyTab] = useState<'generate' | 'enter'>(
    urlAction === 'join' ? 'enter' : 'generate'
  );
  const [lobbyGeneratedCode, setLobbyGeneratedCode] = useState<string>(() => generateRoomCode());
  const [lobbyInputCode, setLobbyInputCode] = useState(urlRoomCode ? normalizeRoomCode(urlRoomCode) : '');
  const [lobbyCopiedCode, setLobbyCopiedCode] = useState(false);
  const [lobbyCopiedLink, setLobbyCopiedLink] = useState(false);

  // Battle Mode State
  const [opponentMode, setOpponentMode] = useState<OpponentMode>(
    urlMode || (urlRoomCode ? 'online_pvp' : 'ai_bot')
  );
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(
    urlDifficulty || 'medium'
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [cameraLarge, setCameraLarge] = useState(false);
  const profile = getUserProfile();

  // Unique persistent gladiator username per device/browser
  const [localPlayerName, setLocalPlayerName] = useState<string>('Gladiator');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempNameInput, setTempNameInput] = useState('');

  useEffect(() => {
    const initialName = getOrCreatePlayerUsername();
    setLocalPlayerName(initialName);
    setTempNameInput(initialName);
  }, []);

  const handleSavePlayerName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setIsEditingName(false);
      return;
    }
    setLocalPlayerName(trimmed);
    setIsEditingName(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gymquest_gladiator_tag', trimmed);
      try {
        const raw = localStorage.getItem('gymquest_user_profile');
        const p = raw ? JSON.parse(raw) : {};
        p.username = trimmed;
        localStorage.setItem('gymquest_user_profile', JSON.stringify(p));
      } catch (e) {
        // ignore
      }
    }
    if (roomManagerRef.current) {
      roomManagerRef.current.updateUsername(trimmed);
    }
  };

  // Canvas ref for battle stage
  const battleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live webcam for local player
  const { videoRef, liveLandmarksRef, status, error, stream: localStream, start, stop } = usePoseDetection();
  const p1OverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Online Duel Room State
  const roomManagerRef = useRef<DuelRoomManager | null>(null);
  const [roomCode, setRoomCode] = useState<string>(urlRoomCode ? normalizeRoomCode(urlRoomCode) : '');
  const [roomRole, setRoomRole] = useState<PlayerRole>(urlAction === 'create' ? 'host' : 'guest');
  const [roomStatus, setRoomStatus] = useState<'idle' | 'connecting' | 'waiting' | 'connected' | 'error'>('idle');
  const [roomOpponent, setRoomOpponent] = useState<RoomPlayer | null>(null);
  const [activeRoomTab, setActiveRoomTab] = useState<'create' | 'join'>(urlAction === 'create' ? 'create' : 'join');
  const [roomInputCode, setRoomInputCode] = useState(urlRoomCode ? normalizeRoomCode(urlRoomCode) : '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [duelCountdown, setDuelCountdown] = useState<number | null>(null);
  const [opponentLeftAlert, setOpponentLeftAlert] = useState(false);

  // WebRTC P2P Video Connection for Live Opponent Camera
  const { remoteStream, rtcStatus } = useWebRtcDuel(
    localStream,
    roomManagerRef,
    Boolean(roomOpponent),
    roomRole
  );

  // Dynamic Bot Name based on difficulty
  const botName =
    botDifficulty === 'easy'
      ? `${t.arena.botNovice} (Novice)`
      : botDifficulty === 'hard'
        ? `${t.arena.botMaster} (Master)`
        : `${t.arena.botKnight} (Knight)`;

  // Player Names & Roles
  const localPlayerRole: BattlePlayerRole =
    opponentMode === 'online_pvp' && roomRole === 'guest' ? 'p2' : 'p1';

  const p1DisplayName =
    opponentMode === 'online_pvp'
      ? roomRole === 'host'
        ? localPlayerName || (language === 'en' ? 'You (P1)' : 'Kamu (P1)')
        : roomOpponent?.username || 'Host (P1)'
      : localPlayerName || (language === 'en' ? 'You (P1)' : 'Kamu (P1)');

  const p2DisplayName =
    opponentMode === 'ai_bot'
      ? botName
      : opponentMode === 'local_pvp'
        ? language === 'en' ? 'Player 2 (P2)' : 'Pemain 2 (P2)'
        : roomRole === 'guest'
          ? localPlayerName || (language === 'en' ? 'You (P2)' : 'Kamu (P2)')
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
      if (opponentMode === 'online_pvp') {
        roomManagerRef.current?.sendAction(actionType, player);
      }
    },
    battleStage === 'battle' && (opponentMode !== 'online_pvp' || isDuelActive)
  );

  // Start webcam when entering waiting room or active battle stage
  useEffect(() => {
    if (battleStage === 'waiting_room' || battleStage === 'battle') {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [battleStage, start, stop]);

  // Clean up online room on unmount
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
          setBattleStage('battle');
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

  const handleCreateRoom = (customCode?: string) => {
    if (roomManagerRef.current) {
      roomManagerRef.current.disconnect();
    }
    const newCode = customCode ? normalizeRoomCode(customCode) : generateRoomCode();
    setRoomCode(newCode);
    setRoomRole('host');
    setRoomStatus('waiting');
    setRoomOpponent(null);
    setOpponentLeftAlert(false);

    const manager = new DuelRoomManager(
      newCode,
      'host',
      localPlayerName || 'Host Knight'
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
      localPlayerName || 'Challenger'
    );
    setupRoomListeners(manager);
    manager.connect();
    roomManagerRef.current = manager;
  };

  // Auto-connect room if URL parameter room is provided
  useEffect(() => {
    if (urlRoomCode) {
      setOpponentMode('online_pvp');
      setBattleStage('waiting_room');
      if (urlAction === 'create') {
        handleCreateRoom(urlRoomCode);
      } else {
        handleJoinRoom(urlRoomCode);
      }
    }
  }, [urlRoomCode, urlAction]);

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
    setBattleStage('battle');
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

  const copyLobbyText = (text: string, type: 'code' | 'link') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setLobbyCopiedCode(true);
        setTimeout(() => setLobbyCopiedCode(false), 2000);
      } else {
        setLobbyCopiedLink(true);
        setTimeout(() => setLobbyCopiedLink(false), 2000);
      }
    }
  };

  // Actions from Selection Page
  const launchBotBattleFromSelection = () => {
    setOpponentMode('ai_bot');
    setBotDifficulty(selectedLobbyDifficulty);
    setBattleStage('battle');
    restartGame();
  };

  const launchCreateRoomFromSelection = () => {
    setOpponentMode('online_pvp');
    setBattleStage('waiting_room');
    handleCreateRoom(lobbyGeneratedCode);
  };

  const launchJoinRoomFromSelection = () => {
    const clean = normalizeRoomCode(lobbyInputCode);
    if (!clean) return;
    setOpponentMode('online_pvp');
    setBattleStage('waiting_room');
    handleJoinRoom(clean);
  };

  const launchLocalPvPFromSelection = () => {
    setOpponentMode('local_pvp');
    setBattleStage('battle');
    restartGame();
  };

  const returnToSelection = () => {
    handleLeaveRoom();
    stop();
    setBattleStage('selection');
  };

  // Keyboard shortcut listener for active battle controls
  useEffect(() => {
    if (battleStage !== 'battle') return;

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
  }, [battleStage, triggerAttack, triggerKiCharge]);

  // Draw Player Skeleton overlay
  useEffect(() => {
    if (battleStage !== 'battle') return;

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
  }, [battleStage, videoRef, liveLandmarksRef, p1FormCorrect]);

  const duelShareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/arena/battle?mode=online_pvp&action=join&room=${roomCode}`
      : `https://gymquest.vercel.app/arena/battle?mode=online_pvp&action=join&room=${roomCode}`;

  const lobbyShareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/arena/battle?mode=online_pvp&action=join&room=${lobbyGeneratedCode}`
      : `https://gymquest.vercel.app/arena/battle?mode=online_pvp&action=join&room=${lobbyGeneratedCode}`;

  // =========================================================================
  // TAMPILAN 1: HALAMAN BARU SELEKSI LAWAN DUEL (SEBELUM MASUK GIM)
  // =========================================================================
  if (battleStage === 'selection') {
    return (
      <main className="min-h-screen flex flex-col bg-transparent text-primary pb-16">
        {/* Header Bersih */}
        <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
          <Link
            href="/arena"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-cyan/10 hover:border-cyan/40 hover:text-cyan text-muted transition-all duration-200 text-xs font-mono tracking-wide"
          >
            <span>←</span>
            <span>{t.arena.battleLeaveArena}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <UserNavButton />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-8 space-y-8 animate-fade-in">
          {/* Judul & Deskripsi Halaman */}
          <div className="text-center space-y-2">
            <p className="font-mono text-xs tracking-widest text-cyan uppercase font-bold">
              ARENA DUEL 1v1
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-wide">
              {t.arena.duelLobbyTitle}
            </h1>
            <p className="font-body text-xs sm:text-sm text-muted max-w-xl mx-auto leading-relaxed">
              {t.arena.duelLobbySubtitle}
            </p>
          </div>

          {/* 2 PILIHAN UTAMA: LAWAN BOT VS LAWAN PLAYER LAIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 1: LAWAN CYBER BOT */}
            <button
              type="button"
              onClick={() => setSelectedLobbyTarget('bot')}
              className={`p-6 rounded-2xl text-left transition-all border-2 flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer ${
                selectedLobbyTarget === 'bot'
                  ? 'border-cyan bg-cyan/15 shadow-[0_0_30px_rgba(0,229,255,0.3)] scale-[1.01]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-cyan/15 border border-cyan/40 flex items-center justify-center text-cyan shadow-[0_0_20px_rgba(0,229,255,0.25)]">
                  <IconCyberBot size={32} className="text-cyan" glow />
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan text-void uppercase tracking-wider">
                  {t.arena.battleVsBot}
                </span>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-bold text-white">
                  {language === 'en' ? 'vs Cyber AI Bot' : 'Lawan Robot AI'}
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'en'
                    ? 'Clash against a calibrated virtual bot with selectable target reps.'
                    : 'Tantang robot virtual dengan target repetisi terukur untuk mengasah kecepatan push-up.'}
                </p>
              </div>

              <div className="flex items-center text-xs font-mono font-bold text-cyan">
                <span>{selectedLobbyTarget === 'bot' ? '● ' + (language === 'en' ? 'Selected' : 'Dipilih') : (language === 'en' ? 'Select Mode' : 'Pilih Mode Ini')}</span>
              </div>
            </button>

            {/* CARD 2: LAWAN PLAYER LAIN */}
            <button
              type="button"
              onClick={() => setSelectedLobbyTarget('online')}
              className={`p-6 rounded-2xl text-left transition-all border-2 flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer ${
                selectedLobbyTarget === 'online'
                  ? 'border-magenta bg-magenta/15 shadow-[0_0_30px_rgba(255,0,122,0.3)] scale-[1.01]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta shadow-[0_0_20px_rgba(255,0,122,0.25)]">
                  <IconUsers size={32} className="text-magenta" glow />
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-magenta text-white uppercase tracking-wider">
                  {t.arena.battleOnlinePvP}
                </span>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-bold text-white">
                  {language === 'en' ? 'vs Another Player' : 'Lawan Player Lain'}
                </h2>
                <p className="text-xs text-muted leading-relaxed">
                  {language === 'en'
                    ? '1v1 real-time clash against a friend on any device via room codes.'
                    : 'Duel 1v1 secara langsung dengan teman atau gladiator lain menggunakan kode room.'}
                </p>
              </div>

              <div className="flex items-center text-xs font-mono font-bold text-magenta">
                <span>{selectedLobbyTarget === 'online' ? '● ' + (language === 'en' ? 'Selected' : 'Dipilih') : (language === 'en' ? 'Select Mode' : 'Pilih Mode Ini')}</span>
              </div>
            </button>
          </div>

          {/* KONTEN DETAIL KONFIGURASI SESUAI MODE YANG DIPILIH */}

          {/* 1. DETAIL PILIHAN LAWAN BOT */}
          {selectedLobbyTarget === 'bot' && (
            <div className="glass-panel clip-corner border border-cyan/40 p-6 bg-cyan/5 rounded-2xl space-y-5 animate-fade-in shadow-[0_0_30px_rgba(0,229,255,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan font-bold">
                  {t.arena.battleBotLevel}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedLobbyDifficulty('easy')}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedLobbyDifficulty === 'easy'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'border-white/10 bg-white/5 text-muted hover:text-white'
                  }`}
                >
                  <div className="font-display text-sm font-bold">Novice</div>
                  <div className="text-[11px] text-muted mt-0.5">10 Push-Up</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLobbyDifficulty('medium')}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedLobbyDifficulty === 'medium'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-white/10 bg-white/5 text-muted hover:text-white'
                  }`}
                >
                  <div className="font-display text-sm font-bold">Knight</div>
                  <div className="text-[11px] text-muted mt-0.5">15 Push-Up</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLobbyDifficulty('hard')}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedLobbyDifficulty === 'hard'
                      ? 'border-red-500 bg-red-500/20 text-red-300 font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'border-white/10 bg-white/5 text-muted hover:text-white'
                  }`}
                >
                  <div className="font-display text-sm font-bold">Master</div>
                  <div className="text-[11px] text-muted mt-0.5">20 Push-Up</div>
                </button>
              </div>

              <button
                type="button"
                onClick={launchBotBattleFromSelection}
                className="w-full py-4 rounded-xl bg-cyan text-void font-bold text-sm font-display hover:bg-cyan/90 transition-all shadow-[var(--glow-cyan)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡</span>
                <span>{language === 'en' ? 'Start Battle vs Cyber Bot ▸' : 'Mulai Duel Lawan Robot ▸'}</span>
              </button>
            </div>
          )}

          {/* 2. DETAIL PILIHAN LAWAN PLAYER LAIN */}
          {selectedLobbyTarget === 'online' && (
            <div className="glass-panel clip-corner border border-magenta/40 p-6 bg-magenta/5 rounded-2xl space-y-6 animate-fade-in shadow-[0_0_30px_rgba(255,0,122,0.15)]">
              {/* Gladiator Identity Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted">{language === 'en' ? 'Gladiator Tag:' : 'Nama Gladiator:'}</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempNameInput}
                        maxLength={20}
                        onChange={(e) => setTempNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSavePlayerName(tempNameInput)}
                        className="px-2 py-0.5 rounded bg-black/90 border border-cyan text-xs font-mono text-cyan focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePlayerName(tempNameInput)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan text-void font-bold cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-cyan">{localPlayerName}</span>
                  )}
                </div>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempNameInput(localPlayerName);
                      setIsEditingName(true);
                    }}
                    className="text-[11px] text-muted hover:text-cyan underline cursor-pointer"
                  >
                    {language === 'en' ? 'Edit' : 'Ganti'}
                  </button>
                )}
              </div>

              {/* Tab: Generate Kode (Host) vs Masukkan Kode (Guest) */}
              <div className="grid grid-cols-2 gap-2 bg-black/50 p-1.5 rounded-xl border border-magenta/20 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setOnlineLobbyTab('generate')}
                  className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    onlineLobbyTab === 'generate'
                      ? 'bg-magenta text-white shadow-[var(--glow-magenta)]'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>{t.arena.createRoomTab}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineLobbyTab('enter')}
                  className={`py-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    onlineLobbyTab === 'enter'
                      ? 'bg-magenta text-white shadow-[var(--glow-magenta)]'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  <span>🔑</span>
                  <span>{t.arena.joinRoomTab}</span>
                </button>
              </div>

              {/* SUB-TAB 1: GENERATE KODE (HOST) */}
              {onlineLobbyTab === 'generate' && (
                <div className="space-y-4 text-center">
                  <div className="p-5 rounded-xl bg-black/60 border border-magenta/30 space-y-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-cyan font-bold">
                      {t.arena.roomCodeLabel}
                    </span>
                    <div className="font-display text-4xl sm:text-5xl font-black tracking-widest text-white drop-shadow-[0_0_25px_rgba(255,0,122,0.7)]">
                      {lobbyGeneratedCode}
                    </div>
                    <p className="text-xs font-mono text-muted">
                      {language === 'en'
                        ? 'Share this code or link with your friend to connect.'
                        : 'Bagikan kode atau link ini kepada lawan agar langsung terhubung.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => copyLobbyText(lobbyGeneratedCode, 'code')}
                        className="px-3.5 py-1.5 rounded-lg bg-magenta/15 border border-magenta/40 text-magenta text-xs font-mono font-bold hover:bg-magenta/25 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>📋</span>
                        <span>{lobbyCopiedCode ? t.arena.codeCopied : t.arena.copyRoomCode}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyLobbyText(lobbyShareLink, 'link')}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono font-bold hover:bg-cyan/25 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔗</span>
                        <span>{lobbyCopiedLink ? t.arena.linkCopied : t.arena.copyRoomLink}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={launchCreateRoomFromSelection}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan to-magenta text-void font-bold text-sm font-display hover:shadow-[var(--glow-cyan)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🚀</span>
                    <span>{language === 'en' ? 'Create Room & Enter Arena ▸' : 'Buat Room & Masuk Arena ▸'}</span>
                  </button>
                </div>
              )}

              {/* SUB-TAB 2: MASUKKAN KODE (GUEST) */}
              {onlineLobbyTab === 'enter' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-muted block">
                      {t.arena.roomCodeLabel}
                    </label>
                    <input
                      type="text"
                      value={lobbyInputCode}
                      onChange={(e) => setLobbyInputCode(e.target.value.toUpperCase())}
                      placeholder={t.arena.roomCodePlaceholder}
                      maxLength={10}
                      className="w-full bg-black/60 border-2 border-magenta/40 rounded-xl px-4 py-3.5 font-display text-2xl text-white tracking-widest uppercase focus:outline-none focus:border-magenta text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={launchJoinRoomFromSelection}
                    disabled={!lobbyInputCode.trim()}
                    className="w-full py-4 rounded-xl bg-magenta text-white font-bold text-sm font-display hover:bg-magenta/80 transition-all shadow-[var(--glow-magenta)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>⚔️</span>
                    <span>{t.arena.joinRoomBtn} ▸</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OPSI 3: DUEL 1 LAYAR (LOKAL) */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={launchLocalPvPFromSelection}
              className="text-xs font-mono text-muted hover:text-white underline transition-colors cursor-pointer"
            >
              {language === 'en'
                ? '🎮 Or play 2-Player on 1 Screen (Local PVP with keyboard)'
                : '🎮 Atau main 2 Pemain dalam 1 Layar (PVP Lokal menggunakan keyboard)'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // TAMPILAN 2: RUANG TUNGGU (WAITING ROOM LOBBY) ONLINE PVP
  // =========================================================================
  if (battleStage === 'waiting_room') {
    return (
      <main className="min-h-screen flex flex-col bg-transparent text-primary pb-16 animate-fade-in">
        {/* Header Ruang Tunggu */}
        <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex items-center justify-between px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
          <button
            type="button"
            onClick={returnToSelection}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 hover:bg-magenta/10 hover:border-magenta/40 hover:text-magenta text-muted transition-all duration-200 text-xs font-mono tracking-wide cursor-pointer"
          >
            <span>←</span>
            <span>{t.arena.leaveRoom}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 border border-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.15)]">
              <span className="text-[10px] font-mono text-cyan uppercase font-bold tracking-wider">ROOM:</span>
              <span className="font-display font-black text-white text-base tracking-widest">{roomCode || 'GQ-....'}</span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  roomStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <UserNavButton />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-8 space-y-6 animate-fade-in">
          {/* Judul & Status Lobby */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/15 border border-magenta/40 text-magenta text-xs font-mono font-bold tracking-widest uppercase mb-1">
              <span>⚔️</span>
              <span>{t.arena.waitingRoomTitle}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-wide">
              {roomStatus === 'connected'
                ? (language === 'en' ? 'Gladiators Connected & Ready!' : 'Kedua Gladiator Telah Terhubung!')
                : (language === 'en' ? 'Waiting for Challenger to Join...' : 'Menunggu Lawan Masuk ke Room...')}
            </h1>
            <p className="font-body text-xs sm:text-sm text-muted max-w-xl mx-auto leading-relaxed">
              {t.arena.waitingRoomSubtitle}
            </p>
          </div>

          {/* Quick Share Code & Link Banner */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan/15 border border-cyan/40 flex items-center justify-center text-cyan text-2xl shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                🔑
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan uppercase tracking-widest font-bold">
                  {t.arena.roomCodeLabel}
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black text-white tracking-widest">
                  {roomCode}
                </div>
                <p className="text-[11px] font-mono text-muted">
                  {roomRole === 'host' ? t.arena.connectedAsHost : t.arena.connectedAsGuest}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => copyToClipboard(roomCode, 'code')}
                className="px-4 py-2 rounded-xl bg-cyan/15 border border-cyan/40 hover:bg-cyan/25 text-cyan text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.15)]"
              >
                <span>📋</span>
                <span>{copiedCode ? t.arena.codeCopied : t.arena.copyRoomCode}</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(duelShareLink, 'link')}
                className="px-4 py-2 rounded-xl bg-magenta/15 border border-magenta/40 hover:bg-magenta/25 text-magenta text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(255,0,122,0.15)]"
              >
                <span>🔗</span>
                <span>{copiedLink ? t.arena.linkCopied : t.arena.copyRoomLink}</span>
              </button>
            </div>
          </div>

          {/* 2-PODIUM GLADIATOR ARENA PREVIEW (HOST VS CHALLENGER) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PODIUM 1: TUAN RUMAH (HOST - CYAN) */}
            <div className="glass-panel clip-corner border-2 border-cyan/50 p-4 bg-cyan/5 space-y-3 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.15)]">
              <div className="flex items-center justify-between border-b border-cyan/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  {roomRole === 'host' ? (
                    isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempNameInput}
                          maxLength={20}
                          onChange={(e) => setTempNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePlayerName(tempNameInput)}
                          className="px-2 py-0.5 rounded bg-black/80 border border-cyan text-xs font-mono text-cyan focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePlayerName(tempNameInput)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan text-void font-bold cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-cyan">
                          {localPlayerName} (Kamu)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempNameInput(localPlayerName);
                            setIsEditingName(true);
                          }}
                          className="text-white/50 hover:text-cyan text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-cyan/10 transition-all"
                          title="Ganti Nama"
                        >
                          ✏️
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="font-display font-bold text-base text-cyan">
                      {roomOpponent?.username || 'Host (Tuan Rumah)'}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan text-void uppercase tracking-wider">
                  HOST (P1)
                </span>
              </div>

              {/* Kamera Host: jika user adalah host -> videoRef lokal, jika guest -> remoteStream */}
              <div className="relative aspect-video w-full rounded-xl bg-black/80 overflow-hidden border border-cyan/30 flex items-center justify-center">
                {roomRole === 'host' ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                    />
                    {status === 'loading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 p-4 text-center space-y-2 z-20">
                        <span className="text-2xl animate-spin">🌀</span>
                        <p className="font-mono text-xs text-cyan font-bold">{t.arena.battleCameraSensorConnecting}</p>
                      </div>
                    )}
                    {status === 'running' && (
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-void/80 border border-cyan/40 text-[10px] font-mono text-cyan flex items-center gap-1.5 z-10">
                        <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                        <span>KAMU (HOST) • KAMERA AKTIF</span>
                      </div>
                    )}
                  </>
                ) : (
                  <RemoteVideoPlayer
                    stream={remoteStream}
                    className="w-full h-full"
                    fallbackLabel="Menghubungkan kamera Host..."
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-muted pt-1">
                <span>Status:</span>
                <span className="text-cyan font-bold flex items-center gap-1">
                  <span>●</span> {language === 'en' ? 'Ready on Stage' : 'Siap di Panggung'}
                </span>
              </div>
            </div>

            {/* PODIUM 2: PENANTANG (CHALLENGER - MAGENTA) */}
            <div className="glass-panel clip-corner border-2 border-magenta/50 p-4 bg-magenta/5 space-y-3 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(255,0,122,0.15)]">
              <div className="flex items-center justify-between border-b border-magenta/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚔️</span>
                  {roomRole === 'guest' ? (
                    isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempNameInput}
                          maxLength={20}
                          onChange={(e) => setTempNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePlayerName(tempNameInput)}
                          className="px-2 py-0.5 rounded bg-black/80 border border-magenta text-xs font-mono text-magenta focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePlayerName(tempNameInput)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-magenta text-white font-bold cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-base text-magenta">
                          {localPlayerName} (Kamu)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempNameInput(localPlayerName);
                            setIsEditingName(true);
                          }}
                          className="text-white/50 hover:text-magenta text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-magenta/10 transition-all"
                          title="Ganti Nama"
                        >
                          ✏️
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="font-display font-bold text-base text-magenta">
                      {roomOpponent
                        ? roomOpponent.username
                        : (language === 'en' ? 'Waiting for Challenger...' : 'Menunggu Penantang...')}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-magenta text-white uppercase tracking-wider">
                  CHALLENGER (P2)
                </span>
              </div>

              {/* Kamera Penantang: jika belum ada lawan -> animasi radar scanning! */}
              <div className="relative aspect-video w-full rounded-xl bg-black/80 overflow-hidden border border-magenta/30 flex items-center justify-center">
                {!roomOpponent ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black/70">
                    <div className="absolute w-44 h-44 rounded-full border border-magenta/20 animate-ping" />
                    <div className="absolute w-32 h-32 rounded-full border border-magenta/30" />
                    <div className="absolute w-20 h-20 rounded-full border border-magenta/40" />
                    <div className="relative z-10 flex flex-col items-center text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-magenta/20 border border-magenta/50 flex items-center justify-center text-2xl animate-pulse mb-2 shadow-[0_0_20px_rgba(255,0,122,0.4)]">
                        📡
                      </div>
                      <p className="font-display font-bold text-sm text-white">{t.arena.waitingOpponent}</p>
                      <p className="text-[11px] font-mono text-muted mt-1 max-w-xs">
                        {t.arena.waitingOpponentDesc}
                      </p>
                    </div>
                  </div>
                ) : roomRole === 'guest' ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover -scale-x-100"
                    />
                    {status === 'loading' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 p-4 text-center space-y-2 z-20">
                        <span className="text-2xl animate-spin">🌀</span>
                        <p className="font-mono text-xs text-magenta font-bold">{t.arena.battleCameraSensorConnecting}</p>
                      </div>
                    )}
                    {status === 'running' && (
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-void/80 border border-magenta/40 text-[10px] font-mono text-magenta flex items-center gap-1.5 z-10">
                        <span className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
                        <span>KAMU (PENANTANG) • KAMERA AKTIF</span>
                      </div>
                    )}
                  </>
                ) : (
                  <RemoteVideoPlayer
                    stream={remoteStream}
                    className="w-full h-full"
                    fallbackLabel="Menghubungkan kamera Penantang..."
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-muted pt-1">
                <span>Status:</span>
                {roomOpponent ? (
                  <span className="text-magenta font-bold flex items-center gap-1">
                    <span>●</span> {language === 'en' ? 'Challenger Connected' : 'Penantang Terhubung'}
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span className="animate-ping">●</span> {language === 'en' ? 'Waiting for opponent...' : 'Menunggu lawan masuk...'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BAR: MULAI DUEL / STATUS TUNGGU */}
          <div className="pt-2">
            {roomRole === 'host' ? (
              roomOpponent ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleStartDuelAsHost}
                    className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-cyan via-emerald-400 to-magenta text-void font-display font-black text-lg sm:text-xl tracking-wider hover:opacity-95 transition-all shadow-[0_0_35px_rgba(0,229,255,0.4)] animate-pulse flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>{language === 'en' ? 'START BATTLE (3-2-1 COUNTDOWN)' : 'MULAI PERTANDINGAN (HITUNG MUNDUR 3-2-1)'}</span>
                    <span>⚔️</span>
                  </button>
                  <p className="text-center text-xs font-mono text-muted">
                    {language === 'en'
                      ? 'Clicking start will launch a 3-second countdown on both screens simultaneously.'
                      : 'Menekan tombol mulai akan memicu hitungan mundur 3 detik secara bersamaan di kedua layar.'}
                  </p>
                </div>
              ) : (
                <div className="w-full py-4 sm:py-5 rounded-2xl bg-white/5 border border-white/10 text-center font-mono text-sm text-muted flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{t.arena.waitingForOpponent}</span>
                </div>
              )
            ) : (
              <div className="w-full p-4 sm:p-5 rounded-2xl bg-magenta/10 border border-magenta/40 text-center font-display text-sm sm:text-base font-bold text-white flex flex-col sm:flex-row items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,0,122,0.15)]">
                <span className="text-2xl animate-spin">🌀</span>
                <span>
                  {roomOpponent
                    ? t.arena.waitingForHost
                    : (language === 'en' ? 'Connecting to Host room...' : 'Menghubungkan ke room Host...')}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // TAMPILAN 3: ARENA PERTANDINGAN (SAAT GAME DIMULAI)
  // =========================================================================
  return (
    <main className="min-h-screen flex flex-col bg-transparent text-primary pb-12 animate-fade-in">
      {/* HEADER ARENA */}
      <header className="glass-panel sticky top-3 z-20 mx-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 px-5 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={returnToSelection}
            className="font-display text-sm tracking-wide text-white hover:text-cyan transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>GYMQUEST</span>
            <span className="text-muted">· {t.arena.pageTitle}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Kembali ke Halaman Pilihan Mode */}
          <button
            type="button"
            onClick={returnToSelection}
            className="px-3 py-1 rounded-lg bg-white/5 border border-white/15 text-xs font-mono text-white hover:border-cyan hover:bg-cyan/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{t.arena.changeOpponentMode}</span>
          </button>

          <LanguageSwitcher compact />
          <UserNavButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6 flex-1 flex flex-col justify-center">
        {/* NOTIFIKASI LAWAN TERPUTUS */}
        {opponentLeftAlert && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/15 p-4 text-center space-y-2 animate-fade-in">
            <span className="text-2xl">⚠️</span>
            <div className="font-display text-sm font-bold text-red-400">
              {t.arena.opponentLeftNotice}
            </div>
            <button
              type="button"
              onClick={returnToSelection}
              className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-mono text-xs border border-red-500/40 hover:bg-red-500/30 cursor-pointer"
            >
              Kembali ke Pemilihan Mode
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
                  type="button"
                  onClick={() => copyToClipboard(duelShareLink, 'link')}
                  className="text-magenta hover:text-white underline text-[10px] cursor-pointer"
                >
                  {copiedLink ? t.arena.linkCopied : t.arena.copyRoomLink}
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan/30 bg-cyan/10 text-cyan text-xs font-mono font-bold shadow-[0_0_10px_rgba(0,229,255,0.15)]">
              <IconTarget size={14} className="text-cyan" />
              <span>{language === 'en' ? 'Survival Duel:' : 'Duel Ketahanan:'}</span>
              <span className="text-white">60s</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playCountdownTick();
                if (opponentMode === 'online_pvp') {
                  handleRematchOnline();
                } else {
                  restartGame();
                }
              }}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-cyan text-xs font-mono text-white transition-colors cursor-pointer"
            >
              {t.arena.battleRestartRound}
            </button>

            <button
              type="button"
              onClick={returnToSelection}
              className="px-3 py-1.5 rounded border border-white/20 bg-white/5 hover:border-magenta text-xs font-mono text-muted hover:text-white transition-colors cursor-pointer"
            >
              {t.arena.battleLeaveArena}
            </button>
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
                    type="button"
                    onClick={() => setCameraLarge((v) => !v)}
                    className="px-2 py-0.5 rounded border border-cyan/30 text-[10px] font-mono text-cyan hover:bg-cyan/10 transition-colors cursor-pointer"
                  >
                    {cameraLarge ? t.arena.shrinkCamera : t.arena.enlargeCamera}
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-cyan">HP: {p1Hp}/100</span>
              </div>
            </div>

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

                {status === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 p-4 text-center space-y-2 z-20">
                    <span className="text-3xl animate-spin">🌀</span>
                    <p className="font-mono text-xs text-cyan font-bold">{t.arena.battleCameraSensorConnecting}</p>
                    <p className="text-[10px] text-muted max-w-xs">
                      {t.arena.battleCameraSensorDesc}
                    </p>
                  </div>
                )}

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
                      type="button"
                      onClick={() => start()}
                      className="px-4 py-2 rounded-lg bg-cyan text-void font-bold text-xs hover:bg-cyan/80 transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-105 cursor-pointer"
                    >
                      {t.arena.battleConnectCameraNow}
                    </button>
                  </div>
                )}

                {status === 'running' && (
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2.5 py-1 rounded bg-void/80 border border-cyan/40 text-[10px] font-mono z-10">
                    <span className="text-cyan font-bold">{t.arena.battleMotionTracker}</span>
                    <span className={currentPhase === 'down' ? 'text-cyan font-bold' : 'text-muted'}>
                      {currentPhase === 'down' ? `⚡ ${t.arena.battleChargingKi} (${depthPercent}%)` : `⬆ ${t.arena.battleTopPosition}`}
                    </span>
                  </div>
                )}
              </div>
            ) : opponentMode === 'online_pvp' ? (
              <div className="relative aspect-video w-full rounded-xl bg-black/80 overflow-hidden border border-cyan/40">
                <RemoteVideoPlayer
                  stream={remoteStream}
                  className="w-full h-full"
                  fallbackLabel="Menghubungkan kamera Host (P1)..."
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/75 border border-cyan/30 text-[10px] font-mono text-cyan flex items-center gap-1.5 z-10">
                  <span className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-cyan animate-pulse' : 'bg-amber-400'}`} />
                  <span>LIVE FEED: {p1DisplayName}</span>
                </div>
                <div className="absolute bottom-2 inset-x-2 bg-void/80 border border-cyan/30 rounded px-2.5 py-1 flex items-center justify-between text-[11px] font-mono z-10">
                  <span className="text-cyan font-bold">{p1DisplayName}</span>
                  <span className="text-white font-bold">{p1Reps} Reps</span>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/60 border border-cyan/30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span className="text-4xl">⚡</span>
                <p className="font-display text-sm font-bold text-white">{p1DisplayName}</p>
                <p className="text-xs font-mono text-cyan">Player 1 (P1)</p>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-cyan transition-all duration-300"
                    style={{ width: `${Math.min((p1Reps / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-cyan font-bold">{p1Reps} Reps</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => triggerKiCharge('p1')}
                title="Charge Ki Push-Up [Tombol S]"
                className="flex-1 px-3 py-2 rounded bg-cyan/10 border border-cyan/40 hover:bg-cyan/20 text-cyan text-xs font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <IconFlame size={14} className="text-cyan" />
                <span>{t.arena.battleKiCharge}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerAttack('p1')}
                title="Tembakkan Kamehameha! [Tombol Spasi / A]"
                className="flex-2 px-3 py-2 rounded bg-cyan/20 border border-cyan/50 hover:bg-cyan/30 text-cyan text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,229,255,0.25)] cursor-pointer"
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
                    type="button"
                    onClick={() => setCameraLarge((v) => !v)}
                    className="px-2 py-0.5 rounded border border-magenta/30 text-[10px] font-mono text-magenta hover:bg-magenta/10 transition-colors cursor-pointer"
                  >
                    {cameraLarge ? t.arena.shrinkCamera : t.arena.enlargeCamera}
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-magenta">HP: {p2Hp}/100</span>
              </div>
            </div>

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
                        ? 'Master Gladiator: Ritme push-up agresif!'
                        : 'Standar gladiator: Ritme push-up terukur'}
                  </p>
                </div>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-magenta transition-all duration-300"
                    style={{ width: `${Math.min((p2Reps / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-magenta font-bold">{p2Reps} Reps</span>
              </div>
            ) : opponentMode === 'online_pvp' ? (
              <div className="relative aspect-video w-full rounded-xl bg-black/80 overflow-hidden border border-magenta/40">
                <RemoteVideoPlayer
                  stream={remoteStream}
                  className="w-full h-full"
                  fallbackLabel="Menghubungkan kamera Penantang (P2)..."
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/75 border border-magenta/30 text-[10px] font-mono text-magenta flex items-center gap-1.5 z-10">
                  <span className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-magenta animate-pulse' : 'bg-amber-400'}`} />
                  <span>LIVE FEED: {p2DisplayName}</span>
                </div>
                <div className="absolute bottom-2 inset-x-2 bg-void/80 border border-magenta/30 rounded px-2.5 py-1 flex items-center justify-between text-[11px] font-mono z-10">
                  <span className="text-magenta font-bold">{p2DisplayName}</span>
                  <span className="text-white font-bold">{p2Reps} Reps</span>
                </div>
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-black/60 border border-magenta/30 flex flex-col items-center justify-center p-4 text-center space-y-2">
                <span className="text-4xl">⚔️</span>
                <p className="font-display text-sm font-bold text-white">{p2DisplayName}</p>
                <p className="text-xs font-mono text-magenta">{t.arena.battleLocalChallenger}</p>
                <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-magenta transition-all duration-300"
                    style={{ width: `${Math.min((p2Reps / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-magenta font-bold">{p2Reps} Reps</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => triggerKiCharge('p2')}
                title="Charge Ki P2 [Tombol K]"
                className="flex-1 px-3 py-2 rounded bg-magenta/10 border border-magenta/40 hover:bg-magenta/20 text-magenta text-xs font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <IconFlame size={14} className="text-magenta" />
                <span>{t.arena.battleKiChargeP2}</span>
              </button>
              <button
                type="button"
                onClick={() => triggerAttack('p2')}
                title="Tembakkan Final Flash! [Tombol Enter / L]"
                className="flex-2 px-3 py-2 rounded bg-magenta/20 border border-magenta/50 hover:bg-magenta/30 text-magenta text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,0,122,0.25)] cursor-pointer"
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
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full flex items-center justify-center gap-2 clip-corner bg-emerald-500 py-3 font-mono text-xs font-bold text-void hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <span>{t.arena.battleShareRecord}</span>
                <IconBurst size={14} className="text-void" />
              </button>

              <button
                type="button"
                onClick={handleRematchOnline}
                className="w-full clip-corner bg-gradient-to-r from-cyan to-magenta py-3 font-mono text-xs font-bold text-void hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconCombat size={15} className="text-void" />
                <span>{t.arena.battleRematch}</span>
              </button>

              <button
                type="button"
                onClick={returnToSelection}
                className="w-full clip-corner border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold text-muted hover:text-white transition-colors cursor-pointer"
              >
                {t.arena.changeOpponentMode}
              </button>
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
