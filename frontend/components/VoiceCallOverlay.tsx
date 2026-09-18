"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, Mic, MicOff, Clock, Lock } from "lucide-react";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [voiceLimit, setVoiceLimit] = useState(300);
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const callLogIdRef = useRef<string | undefined>(initialCallLogId);

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Fetch current limits dynamically
    const fetchLimits = async () => {
      try {
        const res = await fetch(`/api/services/buddy-chat/${requestId}`, { credentials: "include" });
        const data = await res.json();
        if (data.success && data.voiceCallLimitSeconds !== undefined) {
          setVoiceLimit(data.voiceCallLimitSeconds);
          setTimerSeconds(Math.max(0, data.voiceCallLimitSeconds - (data.voiceCallSeconds || 0)));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLimits();

    const s = io("http://localhost:5001", { withCredentials: true });
    setSocket(s);

    s.on("connect", () => {
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
        setStatus("ringing"); // Receiver side
        if (autoAccept) {
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
      }
      if (data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.voiceCallLimitSeconds);
      }
    });

    s.on("timer-tick", (data) => {
      if (data?.remainingSeconds !== undefined) {
        setTimerSeconds(data.remainingSeconds);
      }
      if (data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.voiceCallLimitSeconds);
      }
    });

    s.on("call-accepted", async (data) => {
      if (data?.remainingSeconds !== undefined) {
        setTimerSeconds(data.remainingSeconds);
      }
      if (data?.voiceCallLimitSeconds !== undefined) {
        setVoiceLimit(data.voiceCallLimitSeconds);
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
        setShowSubscription(true);
      } else {
        alert("Call declined");
        onClose();
      }
    });

    s.on("call-ended", (data) => {
      setStatus("ended");
      if (data?.reason === "time-expired") {
        setShowSubscription(true);
      } else if (!showSubscription) {
        onClose();
      }
    });

    s.on("webrtc-offer", async (offer) => {
      if (!isInitiator) {
        await handleOffer(s, offer);
      }
    });

    s.on("webrtc-answer", async (answer) => {
      if (isInitiator && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    s.on("ice-candidate", async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      s.disconnect();
      cleanup();
    };
  }, []);

  // Web Audio API Ringtone Generator (for Receiver)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let intervalId: NodeJS.Timeout;

    if (status === "ringing" && !isInitiator) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playRing = () => {
        if (!audioCtx) return;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc2.frequency.setValueAtTime(480, audioCtx.currentTime); // dissonance

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 1.2);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start(audioCtx.currentTime);
        osc2.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 1.3);
        osc2.stop(audioCtx.currentTime + 1.3);
      };

      playRing(); // play immediately
      intervalId = setInterval(playRing, 3000); // repeat every 3s
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx) audioCtx.close().catch(console.error);
    };
  }, [status, isInitiator]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "connected" && timerSeconds > 0 && !showSubscription) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, timerSeconds, showSubscription]);

  const handleTimeUp = () => {
    cleanup();
    if (socket) socket.emit("end-call", { requestId });
    setStatus("ended");
    setShowSubscription(true);
  };

  const startWebRTC = async (s: Socket, isInitiator: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(e => console.error("Audio play error", e));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          s.emit("ice-candidate", { requestId, candidate: event.candidate });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit("webrtc-offer", { requestId, offer });
      }
      setStatus("connected");
    } catch (err) {
      console.error("WebRTC Error:", err);
      alert("Microphone permission denied or error occurred.");
      endCall();
    }
  };

  const handleOffer = async (s: Socket, offer: any) => {
    await startWebRTC(s, false);
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      s.emit("webrtc-answer", { requestId, answer });
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const endCall = () => {
    if (socket) socket.emit("end-call", { requestId, callLogId: callLogIdRef.current });
    cleanup();
    onClose();
  };

  const acceptCall = () => {
    if (socket) socket.emit("accept-call", { requestId, callLogId: callLogIdRef.current });
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePayment = async (durationSeconds: number) => {
    setPaymentStatus("processing");
    setTimeout(async () => {
      try {
        await fetch(`/api/services/buddy-subscribe/${requestId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 'voice', durationSeconds }),
          credentials: "include"
        });
        setVoiceLimit(durationSeconds);
      } catch(e) {}
      
      setPaymentStatus("success");
      setTimeout(() => {
        setShowSubscription(false);
        setPaymentStatus("idle");
        onClose(); // Call ended anyway, they can call again now that limits are reset
      }, 2000);
    }, 1500);
  };

  if (showSubscription) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative transition-all duration-300">
          {paymentStatus === "success" ? (
            <div className="text-center py-10 space-y-4 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
              <p className="text-slate-400">Your limits have been reset. You can now call again!</p>
            </div>
          ) : paymentStatus === "processing" ? (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              <h2 className="text-xl font-bold text-white animate-pulse">Processing Payment securely...</h2>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3 mb-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Call Time Expired</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {role === "USER" 
                    ? "Your 5 minutes of free voice call has ended. Subscribe to a plan to continue." 
                    : "The user's 5 minutes of free voice call has ended. They must subscribe to continue."}
                </p>
              </div>

              {role === "USER" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: "Quick Check-in", duration: "2 Hours", price: "₹199", popular: false, seconds: 2 * 3600 },
                      { name: "Full Day Support", duration: "24 Hours", price: "₹399", popular: true, seconds: 24 * 3600 },
                      { name: "Weekly Guidance", duration: "1 Week", price: "₹999", popular: false, seconds: 7 * 24 * 3600 },
                      { name: "Healing Journey", duration: "1 Month", price: "₹2,499", popular: false, seconds: 30 * 24 * 3600 },
                    ].map((plan, i) => (
                      <button
                        key={i}
                        onClick={() => handlePayment(plan.seconds)}
                        className={`relative p-5 rounded-2xl border text-left transition hover:scale-[1.02] active:scale-95 flex flex-col justify-between ${
                          plan.popular
                            ? "bg-gradient-to-br from-[#e06d53]/10 to-amber-500/10 border-[#e06d53]/50 hover:border-[#e06d53]"
                            : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#e06d53] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-white">{plan.duration}</h3>
                          <p className="text-[11px] text-slate-400 mb-4">{plan.name}</p>
                        </div>
                        <div className="flex items-center justify-between w-full mt-2">
                          <div className="text-xl font-bold text-emerald-400">{plan.price}</div>
                          <div className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition">
                            Pay Now
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex justify-center text-slate-400 text-xs items-center gap-2">
                    <Lock className="w-4 h-4" /> 100% Secure & Confidential Payment
                  </div>
                </>
              ) : (
                <div className="flex justify-center">
                  <button onClick={onClose} className="px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/20">Close</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <audio ref={remoteAudioRef} autoPlay />
      
      <div className="bg-[#131d2e] border border-white/10 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#e06d53] to-amber-500 flex items-center justify-center font-bold text-white text-3xl mb-4 relative animate-pulse">
          {isInitiator
            ? (targetName ? targetName[0].toUpperCase() : (role === "USER" ? "B" : "U"))
            : (callerName ? callerName[0].toUpperCase() : (role === "USER" ? "B" : "U"))}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-1">
          {isInitiator
            ? (targetName || (role === "USER" ? "Breakup Buddy" : "User"))
            : (callerName || (role === "USER" ? "Breakup Buddy" : "User"))}
        </h3>
        
        <p className="text-sm text-slate-400 mb-8">
          {status === "ringing" && isInitiator && "Calling..."}
          {status === "ringing" && !isInitiator && "Incoming Voice Call..."}
          {status === "connected" && voiceLimit > 300 && <span className="text-emerald-400 font-bold">Premium Active</span>}
          {status === "connected" && voiceLimit <= 300 && <span className="text-emerald-400 font-mono">{formatTime(timerSeconds)} remaining</span>}
          {status === "ended" && "Call Ended"}
        </p>

        <div className="flex items-center gap-6">
          {status === "ringing" && !isInitiator ? (
            <>
              <button 
                onClick={endCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button 
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105 animate-bounce"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={toggleMute}
                disabled={status !== "connected"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition ${isMuted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/20"} disabled:opacity-50`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition hover:scale-105"
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
