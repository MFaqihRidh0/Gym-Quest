'use client';

import { getSupabaseClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type PlayerRole = 'host' | 'guest';

export interface RoomPlayer {
  userId: string;
  username: string;
  role: PlayerRole;
  joinedAt: number;
}

export interface PlayerActionEvent {
  type: 'attack' | 'charge';
  player: 'p1' | 'p2';
  timestamp: number;
}

export interface GameControlEvent {
  event: 'start_countdown' | 'restart_game';
  timestamp: number;
}

export interface WebRtcSignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: any;
  candidate?: any;
}

export interface OpponentPoseData {
  depthPercent: number;
  currentPhase: 'up' | 'down';
  formOk: boolean;
  landmarks?: { x: number; y: number; z?: number; visibility?: number }[] | null;
  timestamp: number;
}

export interface RoomStateListener {
  onOpponentJoined?: (opponent: RoomPlayer) => void;
  onOpponentLeft?: () => void;
  onRemoteAction?: (action: PlayerActionEvent) => void;
  onOpponentPose?: (pose: OpponentPoseData) => void;
  onGameControl?: (ctrl: GameControlEvent) => void;
  onWebRtcSignal?: (signal: WebRtcSignalData) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'error' | 'disconnected') => void;
}

/**
 * Generate a friendly 6-char duel room code (e.g. GQ-8821)
 */
export function generateRoomCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `GQ-${digits}`;
}

/**
 * Format and normalize room code string
 */
export function normalizeRoomCode(input: string): string {
  let cleaned = input.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
  if (cleaned.length === 4 && /^[0-9]{4}$/.test(cleaned)) {
    cleaned = `GQ-${cleaned}`;
  }
  return cleaned;
}

export class DuelRoomManager {
  public roomCode: string;
  public role: PlayerRole;
  public localUser: RoomPlayer;
  public opponent: RoomPlayer | null = null;
  private listeners: RoomStateListener = {};

  private supabaseChannel: RealtimeChannel | null = null;
  private localBroadcast: BroadcastChannel | null = null;
  private isCleanedUp = false;
  private processedMsgIds = new Set<string>();

  constructor(roomCode: string, role: PlayerRole, username = 'Gladiator', userId?: string) {
    this.roomCode = normalizeRoomCode(roomCode);
    this.role = role;
    this.localUser = {
      userId: userId || `user_${Math.random().toString(36).substring(2, 9)}`,
      username,
      role,
      joinedAt: Date.now(),
    };
  }

  public setListener(listeners: RoomStateListener) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public setWebRtcSignalListener(fn: ((signal: WebRtcSignalData) => void) | undefined) {
    this.listeners.onWebRtcSignal = fn;
  }

  public updateUsername(newUsername: string) {
    this.localUser.username = newUsername;
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.track({
          userId: this.localUser.userId,
          username: newUsername,
          role: this.role,
          joinedAt: this.localUser.joinedAt,
        });
      } catch (e) {
        console.warn('Failed to update presence username in Supabase:', e);
      }
    }
    this.broadcastMessage('presence_announce', {
      user: this.localUser,
    });
  }

  public connect() {
    this.listeners.onStatusChange?.('connecting');
    this.isCleanedUp = false;

    // 1. Inisialisasi fallback BroadcastChannel untuk pengujian antar tab browser lokal
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcast = new BroadcastChannel(`gymquest_room_${this.roomCode}`);
        this.localBroadcast.onmessage = (event) => {
          this.handleIncomingRawMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }

    // 2. Inisialisasi Supabase Realtime Channel
    const supabase = getSupabaseClient();
    if (supabase) {
      const channelName = `arena_duel_${this.roomCode}`;
      this.supabaseChannel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: this.localUser.userId },
        },
      });

      // Dengarkan presence (bergabung & keluar)
      this.supabaseChannel
        .on('presence', { event: 'sync' }, () => {
          this.handlePresenceSync();
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          for (const p of newPresences) {
            const player = p as unknown as RoomPlayer;
            if (player.userId !== this.localUser.userId && player.role !== this.role) {
              this.opponent = player;
              this.listeners.onOpponentJoined?.(player);
            }
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          for (const p of leftPresences) {
            const player = p as unknown as RoomPlayer;
            if (player.userId !== this.localUser.userId) {
              this.opponent = null;
              this.listeners.onOpponentLeft?.();
            }
          }
        })
        // Dengarkan broadcast pesan aksi pertarungan
        .on('broadcast', { event: 'battle_event' }, ({ payload }) => {
          this.handleIncomingRawMessage(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.listeners.onStatusChange?.('connected');
            // Track local presence
            this.supabaseChannel?.track({
              userId: this.localUser.userId,
              username: this.localUser.username,
              role: this.role,
              joinedAt: this.localUser.joinedAt,
            });
          } else if (status === 'CHANNEL_ERROR') {
            this.listeners.onStatusChange?.('error');
          }
        });
    } else {
      // Jika Supabase tidak terkonfigurasi, status tetap connected lewat local BroadcastChannel
      this.listeners.onStatusChange?.('connected');
    }

    // Umumkan kehadiran ke local BroadcastChannel
    this.broadcastMessage('presence_announce', {
      user: this.localUser,
    });
  }

  private handlePresenceSync() {
    if (!this.supabaseChannel) return;
    const state = this.supabaseChannel.presenceState();
    let foundOpponent: RoomPlayer | null = null;

    for (const key of Object.keys(state)) {
      const presences = state[key];
      for (const p of presences) {
        const player = p as unknown as RoomPlayer;
        if (player.userId !== this.localUser.userId && player.role !== this.role) {
          foundOpponent = player;
          break;
        }
      }
      if (foundOpponent) break;
    }

    if (foundOpponent) {
      this.opponent = foundOpponent;
      this.listeners.onOpponentJoined?.(foundOpponent);
    }
  }

  private handleIncomingRawMessage(payload: any) {
    if (!payload || typeof payload !== 'object') return;
    const { msgId, eventType, data, senderUserId } = payload;

    // Abaikan pesan dari diri sendiri
    if (senderUserId === this.localUser.userId) return;

    // Cegah pemrosesan ganda
    if (msgId && this.processedMsgIds.has(msgId)) return;
    if (msgId) {
      this.processedMsgIds.add(msgId);
      if (this.processedMsgIds.size > 200) {
        const first = this.processedMsgIds.values().next().value;
        if (first) this.processedMsgIds.delete(first);
      }
    }

    if (eventType === 'presence_announce') {
      const user = data?.user as RoomPlayer;
      if (user && user.userId !== this.localUser.userId && user.role !== this.role) {
        this.opponent = user;
        this.listeners.onOpponentJoined?.(user);
        // Balas agar penantang baru tahu host sudah ada
        this.broadcastMessage('presence_ack', { user: this.localUser });
      }
    } else if (eventType === 'presence_ack') {
      const user = data?.user as RoomPlayer;
      if (user && user.userId !== this.localUser.userId && user.role !== this.role) {
        this.opponent = user;
        this.listeners.onOpponentJoined?.(user);
      }
    } else if (eventType === 'player_action') {
      const action = data as PlayerActionEvent;
      this.listeners.onRemoteAction?.(action);
    } else if (eventType === 'pose_sync') {
      const pose = data as OpponentPoseData;
      this.listeners.onOpponentPose?.(pose);
    } else if (eventType === 'game_control') {
      const ctrl = data as GameControlEvent;
      this.listeners.onGameControl?.(ctrl);
    } else if (eventType === 'webrtc_signal') {
      const signal = data as WebRtcSignalData;
      this.listeners.onWebRtcSignal?.(signal);
    } else if (eventType === 'presence_leave') {
      this.opponent = null;
      this.listeners.onOpponentLeft?.();
    }
  }

  private broadcastMessage(eventType: string, data: any) {
    if (this.isCleanedUp) return;
    const msgId = `${this.localUser.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      msgId,
      eventType,
      data,
      senderUserId: this.localUser.userId,
    };

    // Kirim via Supabase Broadcast
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'battle_event',
        payload,
      });
    }

    // Kirim via Local BroadcastChannel
    if (this.localBroadcast) {
      try {
        this.localBroadcast.postMessage(payload);
      } catch (e) {
        // silent catch
      }
    }
  }

  /**
   * Kirim aksi push-up (Ki charge atau Rep Attack) dari pemain lokal
   */
  public sendAction(type: 'attack' | 'charge', player: 'p1' | 'p2') {
    this.broadcastMessage('player_action', {
      type,
      player,
      timestamp: Date.now(),
    });
  }

  /**
   * Kirim sinkronisasi pose real-time (depth %, phase, form status, landmarks)
   */
  public sendPoseSync(pose: OpponentPoseData) {
    this.broadcastMessage('pose_sync', pose);
  }

  /**
   * Kirim event kontrol game (Mulai Duel atau Restart Ronde)
   */
  public sendGameControl(event: 'start_countdown' | 'restart_game') {
    this.broadcastMessage('game_control', {
      event,
      timestamp: Date.now(),
    });
  }

  /**
   * Kirim sinyal WebRTC P2P (Offer, Answer, ICE candidate)
   */
  public sendWebRtcSignal(signal: WebRtcSignalData) {
    this.broadcastMessage('webrtc_signal', signal);
  }

  public disconnect() {
    this.isCleanedUp = true;
    this.broadcastMessage('presence_leave', { userId: this.localUser.userId });

    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
      this.supabaseChannel = null;
    }

    if (this.localBroadcast) {
      this.localBroadcast.close();
      this.localBroadcast = null;
    }

    this.opponent = null;
    this.listeners.onStatusChange?.('disconnected');
  }
}
