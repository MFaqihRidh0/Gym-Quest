'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DuelRoomManager, WebRtcSignalData } from './roomManager';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export function useWebRtcDuel(
  localStream: MediaStream | null,
  roomManagerRef: React.RefObject<DuelRoomManager | null>,
  isOpponentConnected: boolean,
  role: 'host' | 'guest'
) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcStatus, setRtcStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Bersihkan PeerConnection
  const cleanupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setRtcStatus('idle');
    pendingCandidatesRef.current = [];
  }, []);

  // Inisialisasi koneksi WebRTC Peer
  const setupPeerConnection = useCallback(() => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return null;
    if (pcRef.current) return pcRef.current;

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      setRtcStatus('connecting');

      // 1. Tambahkan track kamera lokal jika ada
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // 2. Kirim ICE candidate ke lawan via roomManager
      pc.onicecandidate = (event) => {
        if (event.candidate && roomManagerRef.current) {
          roomManagerRef.current.sendWebRtcSignal({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 3. Terima stream video lawan
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setRtcStatus('connected');
        }
      };

      pc.onconnectionstatechange = () => {
        if (!pcRef.current) return;
        const state = pcRef.current.connectionState;
        if (state === 'connected') {
          setRtcStatus('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          setRtcStatus('failed');
        }
      };

      return pc;
    } catch (e) {
      console.warn('Failed to initialize RTCPeerConnection:', e);
      setRtcStatus('failed');
      return null;
    }
  }, [localStream, roomManagerRef]);

  // Handler sinyal WebRTC masuk dari lawan
  const handleIncomingSignal = useCallback(async (signal: WebRtcSignalData) => {
    try {
      if (signal.type === 'offer') {
        // Lawan mengirim offer (biasanya Host)
        let pc = pcRef.current;
        if (!pc) {
          pc = setupPeerConnection();
        }
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        // Tambahkan kandidat yang tertunda
        while (pendingCandidatesRef.current.length > 0) {
          const c = pendingCandidatesRef.current.shift();
          if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
        }

        // Buat dan kirim answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (roomManagerRef.current) {
          roomManagerRef.current.sendWebRtcSignal({
            type: 'answer',
            sdp: pc.localDescription,
          });
        }
      } else if (signal.type === 'answer') {
        const pc = pcRef.current;
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          while (pendingCandidatesRef.current.length > 0) {
            const c = pendingCandidatesRef.current.shift();
            if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
          }
        }
      } else if (signal.type === 'ice-candidate') {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }
    } catch (err) {
      console.warn('Error handling WebRTC signal:', err);
    }
  }, [setupPeerConnection, roomManagerRef]);

  // Pasang listener sinyal ke roomManager
  useEffect(() => {
    const manager = roomManagerRef.current;
    if (!manager) return;

    manager.setWebRtcSignalListener(handleIncomingSignal);

    return () => {
      manager.setWebRtcSignalListener(undefined);
    };
  }, [roomManagerRef, handleIncomingSignal]);

  // Inisiasi Offer oleh Host saat lawan terhubung
  useEffect(() => {
    if (!isOpponentConnected) {
      cleanupPeerConnection();
      return;
    }

    if (role === 'host') {
      const pc = setupPeerConnection();
      if (!pc) return;

      // Tunggu sejenak agar stream lokal terpasang stabil sebelum membuat offer
      const timer = setTimeout(async () => {
        try {
          if (!pcRef.current) return;
          const offer = await pcRef.current.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false,
          });
          await pcRef.current.setLocalDescription(offer);

          if (roomManagerRef.current) {
            roomManagerRef.current.sendWebRtcSignal({
              type: 'offer',
              sdp: pcRef.current.localDescription,
            });
          }
        } catch (e) {
          console.warn('Failed to create WebRTC offer:', e);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpponentConnected, role, setupPeerConnection, cleanupPeerConnection, roomManagerRef]);

  // Bersihkan saat unmount
  useEffect(() => {
    return () => {
      cleanupPeerConnection();
    };
  }, [cleanupPeerConnection]);

  return {
    remoteStream,
    rtcStatus,
    cleanupPeerConnection,
  };
}
