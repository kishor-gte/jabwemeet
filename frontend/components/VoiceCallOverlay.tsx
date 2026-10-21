"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, Mic, MicOff, Clock, Lock, Volume2, AlertTriangle } from "lucide-react";
import { getSocketUrl } from "@/lib/socketUrl";

interface VoiceCallOverlayProps {
  requestId: string;
  buddyId?: string; // Target buddy if role === 'USER' initiating call
  targetUserId?: string; // Target user if role === 'BUDDY' initiating call
  role: "USER" | "BUDDY";
  isInitiator?: boolean; // True if this overlay initiated the call
  autoAccept?: boolean; // True if receiver should auto-accept upon mount (e.g. from call waiting transition)
  callerName?: string; // Name of caller to send over socket
  targetName?: string; // Name of person being called to display on caller screen
  initialCallLogId?: string;
  onClose: () => void;
}

// Global STUN & TURN Relay Servers (Guarantees WebRTC connectivity across mobile carriers / Symmetric NAT)
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelay",
    credential: "openrelay",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelay",
    credential: "openrelay",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelay",
    credential: "openrelay",
  },
  {
    urls: "turns:openrelay.metered.ca:443?transport=tcp",
    username: "openrelay",
    credential: "openrelay",
  },
];

export default function VoiceCallOverlay({
  requestId,
  buddyId,
  targetUserId,
  role,
  isInitiator = false,
  autoAccept = false,
  callerName,
  targetName,
  initialCallLogId,
  onClose,
}: VoiceCallOverlayProps) {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const [timerSeconds, setTimerSeconds] = useState(1800); // 30 mins shared free pool
  const [voiceLimit, setVoiceLimit] = useState(1800);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const callLogIdRef = useRef<string | undefined>(initialCallLogId);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const seenCandidatesRef = useRef<Set<string>>(new Set());
  const iceServersRef = useRef<RTCIceServer[]>(DEFAULT_ICE_SERVERS);

  const [remainingChatMinutes, setRemainingChatMinutes] = useState(0);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [packagesViewMode, setPackagesViewMode] = useState<"summary" | "plans">("plans");

  // Helper to retrieve or create the persistent off-screen audio element
  const getAudioElement = (): HTMLAudioElement | null => {
    if (remoteAudioRef.current) return remoteAudioRef.current;
    if (typeof document !== "undefined") {
      let el = document.getElementById("jabwemeet-remote-audio") as HTMLAudioElement;
      if (!el) {
        el = document.createElement("audio");
        el.id = "jabwemeet-remote-audio";
        el.autoplay = true;
        (el as any).playsInline = true;
        el.style.position = "fixed";
        el.style.top = "-9999px";
        el.style.left = "-9999px";
        el.style.width = "1px";
        el.style.height = "1px";
        el.style.opacity = "0.001";
        el.style.pointerEvents = "none";
        document.body.appendChild(el);
      }
      return el;
    }
    return null;
  };

  // Play remote stream through HTMLAudioElement with full volume and unmuted state
  const playRemoteAudio = (stream: MediaStream) => {
    if (!stream) return;
    remoteStreamRef.current = stream;

    // Enable all remote audio tracks
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });

    const audioEl = getAudioElement();
    if (audioEl) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.muted = false;
      audioEl.volume = 1.0;
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[WebRTC] Audio playback started successfully!");
            setAudioBlocked(false);
          })
          .catch((err) => {
            console.warn("[WebRTC] HTMLAudioElement autoplay deferred by browser:", err);
            setAudioBlocked(true);
          });
      }
    }
  };

  // Pre-unlock audio element immediately on any user gesture
  const unlockAudioOnUserGesture = () => {
    const audioEl = getAudioElement();
    if (audioEl) {
      if (remoteStreamRef.current && audioEl.srcObject !== remoteStreamRef.current) {
        audioEl.srcObject = remoteStreamRef.current;
      }
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl
        .play()
        .then(() => setAudioBlocked(false))
        .catch(() => {});
    }
  };

  // Acquire local microphone with echo cancellation and noise suppression
  const ensureLocalStream = async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) {
      const liveTracks = localStreamRef.current.getAudioTracks().filter((t) => t.readyState === "live");
      if (liveTracks.length > 0) {
        liveTracks.forEach((t) => {
          t.enabled = !isMutedRef.current;
        });
        setMicPermissionDenied(false);
        return localStreamRef.current;
      }
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      setMicPermissionDenied(false);
    } catch (err1) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setMicPermissionDenied(false);
      } catch (err2) {
        console.warn("[WebRTC] Microphone access denied or unavailable:", err2);
        setMicPermissionDenied(true);
      }
    }

    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = !isMutedRef.current;
      });
      localStreamRef.current = stream;
    }
    return stream;
  };

  // Flush queued ICE candidates safely once remote description is set
  const flushPendingCandidates = async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || !pc.remoteDescription.type) return;
    while (pendingCandidatesRef.current.length > 0) {
      const candidateInit = pendingCandidatesRef.current.shift();
      if (candidateInit && candidateInit.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          console.log("[WebRTC] Flushed pending ICE candidate successfully");
        } catch (err) {
          console.warn("[WebRTC] Error adding queued ICE candidate:", err);
        }
      }
    }
  };

  // Handle incoming ICE candidate with clean object extraction and deduplication
  const handleIncomingIce = async (payload: any) => {
    if (!payload) return;

    let candidateInit: RTCIceCandidateInit | null = null;
    if (payload.candidate && typeof payload.candidate === "object") {
      candidateInit = payload.candidate;
    } else if (payload.candidate && typeof payload.candidate === "string") {
      candidateInit = {
        candidate: payload.candidate,
        sdpMid: payload.sdpMid ?? "0",
        sdpMLineIndex: payload.sdpMLineIndex ?? 0,
        usernameFragment: payload.usernameFragment,
      };
    } else if (payload.sdpMid !== undefined || payload.sdpMLineIndex !== undefined) {
      candidateInit = payload;
    }

    if (!candidateInit || !candidateInit.candidate) return;

    const candKey = candidateInit.candidate.trim();
    if (seenCandidatesRef.current.has(candKey)) return;
    seenCandidatesRef.current.add(candKey);

    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        console.log("[WebRTC] Added ICE candidate successfully");
      } catch (e) {
        console.warn("[WebRTC] Error adding ICE candidate:", e);
      }
    } else {
      pendingCandidatesRef.current.push(candidateInit);
    }
  };

  const startWebRTC = async (s: Socket, isOffer: boolean): Promise<RTCPeerConnection | null> => {
    try {
      unlockAudioOnUserGesture();

      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "closed") {
        const existingPc = peerConnectionRef.current;
        const stream = await ensureLocalStream();
        if (stream && stream.getAudioTracks().length > 0) {
          const track = stream.getAudioTracks()[0];
          const sender = existingPc.getSenders().find((snd) => snd.track?.kind === "audio");
          if (sender && track) {
            await sender.replaceTrack(track);
          } else if (track) {
            existingPc.addTrack(track, stream);
          }
        }
        if (isOffer) {
          const offer = await existingPc.createOffer({
            offerToReceiveAudio: true,
          });
          await existingPc.setLocalDescription(offer);
          s.emit("webrtc-offer", { requestId, offer });
        }
        return existingPc;
      }

      const stream = await ensureLocalStream();
      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current || DEFAULT_ICE_SERVERS,
        iceCandidatePoolSize: 10,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });
      peerConnectionRef.current = pc;

      // Add local audio track
      if (stream && stream.getAudioTracks().length > 0) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMutedRef.current;
          pc.addTrack(track, stream);
        });
      } else {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      }

      // Explicitly enforce bidirectional audio transceiver direction
      pc.getTransceivers().forEach((t) => {
        if (t.sender?.track?.kind === "audio" || t.receiver?.track?.kind === "audio") {
          t.direction = "sendrecv";
        }
      });

      // Handle incoming remote audio track
      pc.ontrack = (event) => {
        console.log("[WebRTC] ontrack fired:", event.track.kind, event.track.id);
        const track = event.track;
        track.enabled = true;

        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([track]);
        remoteStreamRef.current = remoteStream;

        playRemoteAudio(remoteStream);

        track.onunmute = () => {
          console.log("[WebRTC] track onunmute fired");
          if (remoteStreamRef.current) {
            playRemoteAudio(remoteStreamRef.current);
          }
        };

        setStatus("connected");
      };

      // Send local ICE candidates to remote peer via Socket.io
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          s.emit("webrtc-ice", {
            requestId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment,
            },
          });
        }
      };

      // Monitor connection state
      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] ICE Connection State:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setStatus("connected");
          if (remoteStreamRef.current) {
            playRemoteAudio(remoteStreamRef.current);
          }
        } else if (pc.iceConnectionState === "failed") {
          console.warn("[WebRTC] ICE connection failed, restarting ICE...");
          try {
            pc.restartIce();
          } catch (e) {}
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection State:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setStatus("connected");
          if (remoteStreamRef.current) {
            playRemoteAudio(remoteStreamRef.current);
          }
        }
      };

      if (isOffer) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
        });
        await pc.setLocalDescription(offer);
        s.emit("webrtc-offer", { requestId, offer });
      }

      return pc;
    } catch (err) {
      console.error("[WebRTC] Error starting peer connection:", err);
      alert("Unable to establish voice connection.");
      onClose();
      return null;
    }
  };

  useEffect(() => {
    // Global active call singleton protection
    if (typeof window !== "undefined") {
      (window as any).__jabwemeet_active_call_id = requestId;
    }

    // Pre-warm local microphone and unlock audio
    unlockAudioOnUserGesture();
    if (isInitiator) {
      ensureLocalStream();
    }

    // Global interaction listener to unlock audio playback if autoplay was deferred
    const handleUserInteraction = () => {
      unlockAudioOnUserGesture();
    };
    window.addEventListener("pointerdown", handleUserInteraction);

    // Fetch dynamic TURN/STUN ICE servers from backend
    const fetchIceServers = async () => {
      try {
        const res = await fetch("/api/services/ice-servers", { credentials: "include" });
        const data = await res.json();
        if (data.success && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          iceServersRef.current = data.iceServers;
        }
      } catch (err) {
        console.warn("[WebRTC] Using built-in TURN/STUN servers:", err);
      }
    };
    fetchIceServers();

    // Fetch current shared 30-min quota and packages
    const fetchLimits = async () => {
      try {
        const res = await fetch(`/api/services/buddy-chat/${requestId}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          const limit = data.totalLimitSeconds ?? data.voiceCallLimitSeconds ?? 1800;
          const used = data.totalUsedSeconds ?? ((data.timeUsedSeconds || 0) + (data.voiceCallSeconds || 0));
          const rem = data.remainingSeconds ?? Math.max(0, limit - used);
          setVoiceLimit(limit);
          setTimerSeconds(rem);
          setHasActivePackage(!!data.hasActivePackage);
          setRemainingChatMinutes(Math.floor(rem / 60));
        }

        const pkgRes = await fetch(`/api/services/packages/breakup-buddy`, { credentials: "include" });
        const pkgData = await pkgRes.json();
        if (pkgData.success && pkgData.packages) {
          setAvailablePackages(pkgData.packages);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLimits();

    const s = io(getSocketUrl(), { withCredentials: true });
    setSocket(s);

    s.on("connect", async () => {
      s.emit("join-request-room", requestId);

      if (isInitiator) {
        setStatus("ringing");
        s.emit("initiate-call", {
          requestId,
          buddyId,
          targetUserId,
          callerName,
          callerRole: role,
        });
      } else {
        setStatus("ringing");
        if (autoAccept) {
          await startWebRTC(s, false);
          setStatus("connected");
          s.emit("accept-call", { requestId, callLogId: callLogIdRef.current });
        }
      }
    });

    s.on("call-initiated", (data) => {
      if (data?.callLogId) {
        callLogIdRef.current = data.callLogId;
      }
      if (data?.remainingSeconds !== undefined) {
        setTimerSeconds(data.remainingSeconds);
        setRemainingChatMinutes(Math.floor(data.remainingSeconds / 60));
      }
      if (data?.totalLimitSeconds !== undefined || data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.totalLimitSeconds ?? data.voiceCallLimitSeconds);
      }
      if (data?.hasActivePackage !== undefined) {
        setHasActivePackage(!!data.hasActivePackage);
      }
    });

    s.on("timer-tick", (data) => {
      if (data?.remainingSeconds !== undefined) {
        setTimerSeconds(data.remainingSeconds);
        setRemainingChatMinutes(Math.floor(data.remainingSeconds / 60));
      }
      if (data?.totalLimitSeconds !== undefined || data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.totalLimitSeconds ?? data.voiceCallLimitSeconds);
      }
      if (data?.hasActivePackage !== undefined) {
        setHasActivePackage(!!data.hasActivePackage);
      }
    });

    s.on("call-accepted", async (data) => {
      if (data?.remainingSeconds !== undefined) {
        setTimerSeconds(data.remainingSeconds);
        setRemainingChatMinutes(Math.floor(data.remainingSeconds / 60));
      }
      if (data?.totalLimitSeconds !== undefined || data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.totalLimitSeconds ?? data.voiceCallLimitSeconds);
      }
      if (data?.hasActivePackage !== undefined) {
        setHasActivePackage(!!data.hasActivePackage);
      }
      if (isInitiator) {
        await startWebRTC(s, true);
      }
    });

    s.on("call-rejected", (data) => {
      setStatus("ended");
      if (data?.reason === "busy") {
        alert("The line is currently busy. Please try again later.");
        onClose();
      } else if (data?.reason === "limit-reached") {
        setTimerSeconds(0);
        setRemainingChatMinutes(0);
        setShowSubscription(true);
      } else {
        alert("Call declined");
        onClose();
      }
    });

    s.on("call-ended", (data) => {
      setStatus("ended");
      if (data?.reason === "time-expired") {
        setTimerSeconds(0);
        setRemainingChatMinutes(0);
        setShowSubscription(true);
      } else if (!showSubscription) {
        onClose();
      }
    });

    // Handle incoming WebRTC Offer (Receiver)
    s.on("webrtc-offer", async (payload) => {
      try {
        const offer = payload?.offer || payload;
        if (!offer || !offer.sdp) return;
        unlockAudioOnUserGesture();

        let pc = peerConnectionRef.current;
        if (!pc || pc.signalingState === "closed") {
          pc = await startWebRTC(s, false);
        }
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Ensure Receiver's local microphone track is attached to the peer connection
        const stream = await ensureLocalStream();
        if (stream && stream.getAudioTracks().length > 0) {
          const audioTrack = stream.getAudioTracks()[0];
          audioTrack.enabled = !isMutedRef.current;

          const senders = pc.getSenders();
          const audioSender = senders.find((snd) => snd.track?.kind === "audio");
          if (audioSender) {
            await audioSender.replaceTrack(audioTrack);
          } else {
            pc.addTrack(audioTrack, stream);
          }
        }

        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("webrtc-answer", { requestId, answer });
        setStatus("connected");
        if (remoteStreamRef.current) {
          playRemoteAudio(remoteStreamRef.current);
        }
      } catch (err) {
        console.error("[WebRTC] Error handling webrtc-offer:", err);
      }
    });

    // Handle incoming WebRTC Answer (Initiator)
    s.on("webrtc-answer", async (payload) => {
      try {
        const answer = payload?.answer || payload;
        if (!answer || !answer.sdp) return;
        unlockAudioOnUserGesture();

        const pc = peerConnectionRef.current;
        if (!pc || pc.signalingState === "closed") return;

        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(pc);
          setStatus("connected");
          if (remoteStreamRef.current) {
            playRemoteAudio(remoteStreamRef.current);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Error handling webrtc-answer:", err);
      }
    });

    s.on("webrtc-ice", handleIncomingIce);
    s.on("ice-candidate", handleIncomingIce);

    return () => {
      window.removeEventListener("pointerdown", handleUserInteraction);
      if (typeof window !== "undefined") {
        if ((window as any).__jabwemeet_active_call_id === requestId) {
          (window as any).__jabwemeet_active_call_id = null;
        }
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      s.disconnect();
    };
  }, [requestId]);

  // Ringtone Generator (for Callee)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let intervalId: NodeJS.Timeout;

    if (status === "ringing" && !isInitiator) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
        }

        const playRing = () => {
          if (!audioCtx || audioCtx.state === "closed") return;
          if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
          }

          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + 1.2);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.3);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc1.start(audioCtx.currentTime);
          osc2.start(audioCtx.currentTime);
          osc1.stop(audioCtx.currentTime + 1.3);
          osc2.stop(audioCtx.currentTime + 1.3);
        };

        playRing();
        intervalId = setInterval(playRing, 3000);
      } catch (e) {
        console.warn("Ringtone audio note:", e);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [status, isInitiator]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "connected" && !showSubscription) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, showSubscription]);

  const handleTimeUp = () => {
    cleanup();
    if (socket) socket.emit("end-call", { requestId, callLogId: callLogIdRef.current });
    setStatus("ended");
    setRemainingChatMinutes(0);
    setShowSubscription(true);
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  const acceptCall = async () => {
    unlockAudioOnUserGesture();
    if (socket) {
      await startWebRTC(socket, false);
      setStatus("connected");
      socket.emit("accept-call", { requestId, callLogId: callLogIdRef.current });
    }
  };

  const endCall = () => {
    cleanup();
    socket?.emit("end-call", { requestId, callLogId: callLogIdRef.current });
    setStatus("ended");
    onClose();
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (pkg: any) => {
    setPaymentStatus("processing");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay payment gateway.");
        setPaymentStatus("idle");
        return;
      }

      const orderRes = await fetch("/api/services/packages/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: pkg.id,
          requestId: requestId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "Failed to create payment order.");
        setPaymentStatus("idle");
        return;
      }

      const options = {
        key: orderData.keyId || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JabWeMeet",
        description: pkg.name,
        order_id: orderData.orderId,
        theme: {
          color: "#e06d53",
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/services/packages/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                requestId: requestId,
                packageId: pkg.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentStatus("success");
              setTimeout(() => {
                setShowSubscription(false);
                setPaymentStatus("idle");
                onClose();
              }, 1500);
            } else {
              alert(verifyData.message || "Payment verification failed.");
              setPaymentStatus("idle");
            }
          } catch (e) {
            alert("Error verifying payment.");
            setPaymentStatus("idle");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e) {
      alert("Error initiating payment");
      setPaymentStatus("idle");
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const buddyDisplayName = targetName || callerName || (role === "USER" ? "your Breakup Buddy" : "the User");

  if (showSubscription) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative transition-all">
          {paymentStatus === "success" ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Subscription Activated!</h2>
              <p className="text-slate-400 text-sm">Unlimited calls and chats are now active with {buddyDisplayName}.</p>
            </div>
          ) : paymentStatus === "processing" ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-bold text-white animate-pulse">Activating Subscription...</h2>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3 mb-6">
                <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">30-Minute Free Session Ended</h2>
                
                {role === "USER" ? (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                      You have completed your <strong>30 minutes of free Call &amp; Chat</strong> with <strong>{buddyDisplayName}</strong>.
                    </p>
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 max-w-md mx-auto">
                      ⚠️ To continue calling or chatting with {buddyDisplayName}, please subscribe to a package below.
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    The user&apos;s 30 minutes of free call &amp; chat quota has ended. They must purchase a subscription to continue.
                  </p>
                )}
              </div>

              {role === "USER" && (
                <>
                  {packagesViewMode === "summary" ? (
                    <div className="space-y-3 max-w-md mx-auto">
                      <button
                        onClick={() => setPackagesViewMode("plans")}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>⭐ Buy Subscription Now</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onClose) onClose();
                          router.push("/dashboard?tab=packages");
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>View All Packages</span>
                      </button>

                      <div className="text-center pt-2">
                        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white transition underline cursor-pointer">
                          Close Call
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs text-slate-300 font-semibold">Select a Subscription Plan</span>
                        <span className="text-xs text-emerald-400 font-bold">Unlimited Calls &amp; Chats</span>
                      </div>

                      {availablePackages.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-2xl space-y-3">
                          <p>No packages currently loaded.</p>
                          <button
                            onClick={() => {
                              if (onClose) onClose();
                              router.push("/dashboard?tab=packages");
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Open Packages Page
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                          {availablePackages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-4 rounded-2xl bg-[#182337] border border-white/10 hover:border-emerald-500/50 transition flex flex-col justify-between text-left"
                            >
                              <div>
                                <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                                <div className="text-xs text-indigo-300 font-semibold mt-0.5">
                                  {pkg.durationHours || 1} {pkg.durationHours === 1 ? "Hour" : "Hours"} Pass
                                </div>
                                <div className="text-lg font-black text-emerald-400 mt-2">
                                  ₹{pkg.price}
                                </div>
                                {pkg.description && (
                                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pkg.description}</p>
                                )}
                              </div>

                              <button
                                onClick={() => handlePayment(pkg)}
                                className="mt-3 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow cursor-pointer"
                              >
                                Buy &amp; Continue
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex text-slate-400 text-[11px] items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> 100% Secure &amp; Confidential
                        </div>
                        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white transition underline cursor-pointer">
                          Close Call
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {role === "BUDDY" && (
                <div className="flex justify-center">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-semibold cursor-pointer">
                    Close Call
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const usedSeconds = Math.max(0, voiceLimit - timerSeconds);

  return (
    <div
      onClick={unlockAudioOnUserGesture}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      {/* Off-screen Native Audio element with active stream output */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls={false}
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: "1px",
          height: "1px",
          opacity: 0.001,
          pointerEvents: "none",
        }}
      />

      <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-3xl mb-4 relative animate-pulse shadow-lg">
          {isInitiator
            ? (targetName ? targetName[0].toUpperCase() : (role === "USER" ? "B" : "U"))
            : (callerName ? callerName[0].toUpperCase() : (role === "USER" ? "B" : "U"))}
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {isInitiator
            ? (targetName || (role === "USER" ? "Breakup Buddy" : "User"))
            : (callerName || (role === "USER" ? "Breakup Buddy" : "User"))}
        </h3>

        <div className="text-sm text-slate-400 mb-6 space-y-2 w-full">
          {status === "connecting" && <p>Connecting...</p>}
          {status === "ringing" && isInitiator && <p>Calling...</p>}
          {status === "ringing" && !isInitiator && <p>Incoming Voice Call...</p>}
          {status === "ended" && <p>Call Ended</p>}

          {status === "connected" && (
            <div className="mt-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-lg font-extrabold">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{formatTime(timerSeconds)} remaining</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Used: <span className="text-amber-300 font-semibold">{formatTime(usedSeconds)}</span> / {formatTime(voiceLimit)}
                {hasActivePackage ? " (Subscribed)" : " (30m Free Quota)"}
              </div>
            </div>
          )}

          {status === "ringing" && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 inline-flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Time Left: <strong className="text-emerald-400">{formatTime(timerSeconds)}</strong> (Used {formatTime(usedSeconds)} / {formatTime(voiceLimit)})
              </span>
            </div>
          )}
        </div>

        {/* Microphone Permission Warning */}
        {micPermissionDenied && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-300 text-xs text-left">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>Microphone is blocked by your browser. Please allow microphone permissions so the other person can hear you.</span>
          </div>
        )}

        {/* Audio Autoplay Unblock Notification (if browser deferred audio) */}
        {audioBlocked && status === "connected" && (
          <button
            onClick={() => {
              unlockAudioOnUserGesture();
              if (remoteStreamRef.current) playRemoteAudio(remoteStreamRef.current);
            }}
            className="mb-6 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg animate-bounce flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Click to Enable Voice Audio</span>
          </button>
        )}

        <div className="flex items-center gap-6">
          {status === "ringing" && !isInitiator ? (
            <>
              <button
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105 cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105 animate-bounce cursor-pointer"
                title="Accept Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMute}
                disabled={status !== "connected"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${isMuted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"} disabled:opacity-50`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
