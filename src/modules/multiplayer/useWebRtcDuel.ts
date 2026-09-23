'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DuelRoomManager, WebRtcSignalData, OpponentPoseData } from './roomManager';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
  iceCandidatePoolSize: 4,
};

// Optimasi pengkodean video agar ringan, berlatensi ultra-rendah, dan hemat bandwidth
function tuneVideoSender(sender: RTCRtpSender) {
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    // Batasi bitrate ke ~450 kbps, 24 fps, dan skala ringan 1.5x
    params.encodings[0].maxBitrate = 450_000;
    params.encodings[0].maxFramerate = 24;
    params.encodings[0].scaleResolutionDownBy = 1.5;
    params.degradationPreference = 'maintain-framerate';
    sender.setParameters(params).catch(() => {});
  } catch {
    // browser mungkin tidak mendukung setParameters dinamis
  }
}

export function useWebRtcDuel(
  roomCode: string,
  localStream: MediaStream | null,
  roomManager: DuelRoomManager | null,
  isOpponentConnected: boolean,
  role: 'host' | 'guest',
  onRemotePose?: (pose: OpponentPoseData) => void
) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [rtcStatus, setRtcStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(localStream);
  localStreamRef.current = localStream;

  const roomManagerRef = useRef<DuelRoomManager | null>(roomManager);
  roomManagerRef.current = roomManager;

  const onRemotePoseRef = useRef(onRemotePose);
  onRemotePoseRef.current = onRemotePose;

  // Setup DataChannel listeners
  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc;
    dc.onopen = () => {
      // Data channel siap
    };
    dc.onclose = () => {
      if (dcRef.current === dc) dcRef.current = null;
    };
    dc.onerror = () => {
      if (dcRef.current === dc) dcRef.current = null;
    };
    dc.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'pose_sync' && payload.pose) {
          onRemotePoseRef.current?.(payload.pose);
        }
      } catch {
        // silent parse error
      }
    };
  }, []);

  // Bersihkan PeerConnection secara tuntas
  const cleanupPeerConnection = useCallback(() => {
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.ondatachannel = null;
      pcRef.current.onconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
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

      // 1. Siapkan DataChannel untuk sinkronisasi pose ultra-cepat
      if (role === 'host') {
        try {
          const dc = pc.createDataChannel('gymquest_pose_stream', {
            ordered: false,
            maxRetransmits: 0,
          });
          setupDataChannel(dc);
        } catch (e) {
          console.warn('Failed to create RTCDataChannel:', e);
        }
      } else {
        pc.ondatachannel = (event) => {
          setupDataChannel(event.channel);
        };
      }

      // 2. Pasang track lokal jika sudah tersedia, atau pasang transceiver video sendrecv
      const currentStream = localStreamRef.current;
      const videoTrack = currentStream ? currentStream.getVideoTracks()[0] : null;

      if (videoTrack && currentStream) {
        try {
          const sender = pc.addTrack(videoTrack, currentStream);
          tuneVideoSender(sender);
        } catch (e) {
          console.warn('addTrack failed, fallback to transceiver:', e);
          const t = pc.addTransceiver('video', { direction: 'sendrecv' });
          tuneVideoSender(t.sender);
        }
      } else {
        try {
          const transceivers = pc.getTransceivers();
          const hasVideo = transceivers.some((t) => t.receiver.track.kind === 'video');
          if (!hasVideo) {
            const t = pc.addTransceiver('video', { direction: 'sendrecv' });
            tuneVideoSender(t.sender);
          }
        } catch (e) {
          console.warn('WebRTC transceiver init warning:', e);
        }
      }

      // 3. Kirim ICE candidate ke lawan via roomManager secara cepat
      pc.onicecandidate = (event) => {
        if (event.candidate && roomManagerRef.current) {
          roomManagerRef.current.sendWebRtcSignal({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 4. Terima stream video lawan secara instan dan pasang ke state
      pc.ontrack = (event) => {
        let stream = event.streams && event.streams[0] ? event.streams[0] : null;

        if (!stream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          if (!remoteStreamRef.current.getTracks().includes(event.track)) {
            remoteStreamRef.current.addTrack(event.track);
          }
          stream = remoteStreamRef.current;
        } else {
          remoteStreamRef.current = stream;
        }

        setRemoteStream(stream);
        setRtcStatus('connected');

        event.track.onunmute = () => {
          if (remoteStreamRef.current) {
            setRemoteStream(remoteStreamRef.current);
          }
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
  }, [role, setupDataChannel]);

  // Pasang atau perbarui track video lokal secara instan ketika localStream tersedia
  useEffect(() => {
    const pc = pcRef.current;
    if (!pc || !localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const transceivers = pc.getTransceivers();
    const videoTransceiver = transceivers.find(
      (t) => t.receiver.track?.kind === 'video' || t.sender.track?.kind === 'video'
    );

    if (videoTransceiver) {
      videoTransceiver.direction = 'sendrecv';
      videoTransceiver.sender.replaceTrack(videoTrack).catch(() => {});
      tuneVideoSender(videoTransceiver.sender);
    } else {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender) {
        videoSender.replaceTrack(videoTrack).catch(() => {});
        tuneVideoSender(videoSender);
      } else {
        try {
          const sender = pc.addTrack(videoTrack, localStream);
          tuneVideoSender(sender);
        } catch (err) {
          console.warn('Failed to add track to RTCPeerConnection:', err);
        }
      }
    }
  }, [localStream]);

  // Fungsi pengiriman offer oleh Host
  const sendOffer = useCallback(async () => {
    try {
      let pc = pcRef.current;
      if (!pc) {
        pc = setupPeerConnection();
      }
      if (!pc) return;
      if (
        pc.signalingState !== 'stable' &&
        pc.signalingState !== 'have-local-offer'
      ) {
        return;
      }
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false,
      });
      if (pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);

      if (roomManagerRef.current) {
        roomManagerRef.current.sendWebRtcSignal({
          type: 'offer',
          sdp: pc.localDescription,
        });
      }
    } catch (e) {
      console.warn('Failed to create WebRTC offer:', e);
    }
  }, [setupPeerConnection]);

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

          // Buat dan kirim answer secepat mungkin
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
        } else if (signal.type === 'request_offer') {
          // Lawan (Guest) meminta penawaran ulang karena baru bergabung
          if (role === 'host') {
            sendOffer();
          }
        }
      } catch (err) {
        console.warn('Error handling WebRTC signal:', err);
      }
    },
    [setupPeerConnection, role, sendOffer]
  );

  // 1. Bersihkan PeerConnection lama setiap kali roomCode atau roomManager berganti
  useEffect(() => {
    cleanupPeerConnection();
  }, [roomCode, roomManager, cleanupPeerConnection]);

  // 2. Pasang listener sinyal ke roomManager aktif setiap kali instance roomManager berganti
  useEffect(() => {
    if (!roomManager) return;

    roomManager.setWebRtcSignalListener(handleIncomingSignal);

    return () => {
      roomManager.setWebRtcSignalListener(undefined);
    };
  }, [roomManager, handleIncomingSignal]);

  // 3. Guest meminta offer secara proaktif saat terhubung agar tidak terlewatkan jika host membuat offer lebih awal
  useEffect(() => {
    if (role === 'guest' && isOpponentConnected && roomManager) {
      const timer = setTimeout(() => {
        if (!remoteStreamRef.current && roomManagerRef.current) {
          roomManagerRef.current.sendWebRtcSignal({
            type: 'request_offer',
          });
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [role, isOpponentConnected, roomManager]);

  // 4. Inisiasi Offer oleh Host saat lawan terhubung (dengan jeda minimal 50ms dan recovery watchdog)
  useEffect(() => {
    if (!isOpponentConnected || !roomManager) {
      cleanupPeerConnection();
      return;
    }

    if (role === 'host') {
      const initialTimer = setTimeout(() => {
        sendOffer();
      }, 50);

      // Watchdog pemulihan: jika setelah 2.5 detik belum ada remoteStream atau belum connected, ulangi penawaran
      const watchdogInterval = setInterval(() => {
        if (!remoteStreamRef.current && pcRef.current && pcRef.current.connectionState !== 'connected') {
          if (pcRef.current.signalingState === 'stable') {
            sendOffer();
          }
        }
      }, 2500);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(watchdogInterval);
      };
    }
  }, [isOpponentConnected, role, roomManager, sendOffer, cleanupPeerConnection]);

  // Kirim data pose via DataChannel (fallback return false)
  const sendPoseData = useCallback((pose: OpponentPoseData) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      try {
        dcRef.current.send(JSON.stringify({ type: 'pose_sync', pose }));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  // Bersihkan saat unmount
  useEffect(() => {
    return () => {
      cleanupPeerConnection();
    };
  }, [cleanupPeerConnection]);

  return {
    remoteStream,
    rtcStatus,
    sendPoseData,
    cleanupPeerConnection,
  };
}
