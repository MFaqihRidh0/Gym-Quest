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
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

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

      // 1. Siapkan transceiver video agar SDP selalu memiliki section media video
      try {
        const transceivers = pc.getTransceivers();
        const hasVideo = transceivers.some((t) => t.receiver.track.kind === 'video');
        if (!hasVideo) {
          pc.addTransceiver('video', { direction: 'sendrecv' });
        }
      } catch (e) {
        console.warn('WebRTC transceiver init warning:', e);
      }

      // 2. Tambahkan track kamera lokal jika sudah ada
      const currentStream = localStreamRef.current;
      if (currentStream) {
        const videoTrack = currentStream.getVideoTracks()[0];
        if (videoTrack) {
          const senders = pc.getSenders();
          const videoSender = senders.find(
            (s) => s.track?.kind === 'video' || (!s.track && (s as any).kind === 'video')
          );
          if (videoSender) {
            videoSender.replaceTrack(videoTrack).catch(() => {});
          } else {
            pc.addTrack(videoTrack, currentStream);
          }
        }
      }

      // 3. Kirim ICE candidate ke lawan via roomManager
      pc.onicecandidate = (event) => {
        if (event.candidate && roomManagerRef.current) {
          roomManagerRef.current.sendWebRtcSignal({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 4. Terima stream video lawan secara reaktif
      pc.ontrack = (event) => {
        const stream =
          event.streams && event.streams[0]
            ? event.streams[0]
            : new MediaStream([event.track]);
        setRemoteStream(stream);
        setRtcStatus('connected');

        // Jika track lawan sempat mute saat pertama negosiasi dan aktif kembali
        event.track.onunmute = () => {
          setRemoteStream(new MediaStream([event.track]));
          setRtcStatus('connected');
        };
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
  }, [roomManagerRef]);

  // Pasang atau ganti track video lokal ketika localStream tersedia/berubah
  useEffect(() => {
    const pc = pcRef.current;
    if (!pc || !localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const senders = pc.getSenders();
    const videoSender =
      senders.find(
        (s) => s.track?.kind === 'video' || (!s.track && (s as any).kind === 'video')
      ) || senders[0];

    if (videoSender) {
      videoSender.replaceTrack(videoTrack).catch((err) => {
        console.warn('Failed to replace video track in RTCPeerConnection:', err);
      });
    } else {
      try {
        pc.addTrack(videoTrack, localStream);
      } catch (err) {
        console.warn('Failed to add track to RTCPeerConnection:', err);
      }
    }
  }, [localStream]);

  // Handler sinyal WebRTC masuk dari lawan
  const handleIncomingSignal = useCallback(
    async (signal: WebRtcSignalData) => {
      try {
        if (signal.type === 'offer') {
          let pc = pcRef.current;
          if (!pc) {
            pc = setupPeerConnection();
          }
          if (!pc) return;

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          // Tambahkan kandidat yang tertunda
          while (pendingCandidatesRef.current.length > 0) {
            const c = pendingCandidatesRef.current.shift();
            if (c) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {
                console.warn('Error adding pending ice candidate:', e);
              }
            }
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
              if (c) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn('Error adding pending ice candidate:', e);
                }
              }
            }
          }
        } else if (signal.type === 'ice-candidate') {
          const pc = pcRef.current;
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn('Error adding ice candidate:', e);
            }
          } else {
            pendingCandidatesRef.current.push(signal.candidate);
          }
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    },
    [setupPeerConnection, roomManagerRef]
  );

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

      const timer = setTimeout(async () => {
        try {
          if (!pcRef.current) return;
          if (
            pcRef.current.signalingState !== 'stable' &&
            pcRef.current.signalingState !== 'have-local-offer'
          ) {
            return;
          }
          const offer = await pcRef.current.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false,
          });
          if (pcRef.current.signalingState !== 'stable') return;
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
