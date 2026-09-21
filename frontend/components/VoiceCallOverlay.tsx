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

  const [remainingChatMinutes, setRemainingChatMinutes] = useState(15);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [packagesViewMode, setPackagesViewMode] = useState<"summary" | "plans">("summary");

  useEffect(() => {
    // Fetch current limits and available packages dynamically
    const fetchLimits = async () => {
      try {
        const res = await fetch(`/api/services/buddy-chat/${requestId}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          if (data.voiceCallLimitSeconds !== undefined) {
            setVoiceLimit(data.voiceCallLimitSeconds);
            setTimerSeconds(Math.max(0, data.voiceCallLimitSeconds - (data.voiceCallSeconds || 0)));
          }
          const chatLeft = Math.max(0, (data.chatLimitSeconds || 900) - (data.timeUsedSeconds || 0));
          setRemainingChatMinutes(Math.ceil(chatLeft / 60));
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
      if (!peerConnectionRef.current) {
        await startWebRTC(s, false);
      }
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current?.createAnswer();
      await peerConnectionRef.current?.setLocalDescription(answer);
      s.emit("webrtc-answer", { requestId, answer });
    });

    s.on("webrtc-answer", async (answer) => {
      await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    s.on("webrtc-ice", async (candidate) => {
      try {
        if (candidate && peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (e) {
        console.error("Error adding ice candidate:", e);
      }
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      s.disconnect();
    };
  }, [requestId, isInitiator, autoAccept, buddyId, targetUserId, callerName, role]);

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

  const startWebRTC = async (s: Socket, isOffer: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
        setStatus("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          s.emit("webrtc-ice", { requestId, candidate: event.candidate });
        }
      };

      if (isOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit("webrtc-offer", { requestId, offer });
      }
    } catch (err) {
      console.error("WebRTC Error:", err);
      alert("Microphone access is required for voice calls.");
      onClose();
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

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const acceptCall = () => {
    setStatus("connected");
    socket?.emit("accept-call", { requestId, callLogId: callLogIdRef.current });
  };

  const endCall = () => {
    socket?.emit("end-call", { requestId, callLogId: callLogIdRef.current });
    setStatus("ended");
    onClose();
  };

  const handlePayment = async (pkg: any) => {
    setPaymentStatus("processing");
    try {
      const res = await fetch(`/api/services/buddy-subscribe/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, durationHours: pkg.durationHours }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setPaymentStatus("success");
        setTimeout(() => {
          setShowSubscription(false);
          setPaymentStatus("idle");
          onClose();
        }, 1500);
      } else {
        alert(data.message || "Failed to process payment");
        setPaymentStatus("idle");
      }
    } catch (e) {
      alert("Error activating subscription");
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
                <h2 className="text-2xl font-black text-white tracking-tight">5-Minute Free Call Ended</h2>
                
                {role === "USER" ? (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                      You have hit your <strong>5 minutes of free voice call</strong> with <strong>{buddyDisplayName}</strong>.
                    </p>
                    
                    {remainingChatMinutes > 0 ? (
                      <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs text-indigo-300 max-w-md mx-auto">
                        💬 You still have <strong>{remainingChatMinutes} minutes of free chat</strong> available with {buddyDisplayName} to use!
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 max-w-md mx-auto">
                        ⚠️ You have also used all free chat time with {buddyDisplayName}.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    The user's 5 minutes of free voice call has ended with you.
                  </p>
                )}
              </div>

              {role === "USER" && (
                <>
                  {packagesViewMode === "summary" ? (
                    <div className="space-y-3 max-w-md mx-auto">
                      {remainingChatMinutes > 0 && (
                        <button
                          onClick={onClose}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
                        >
                          <span>💬 Use Free Chat ({remainingChatMinutes}m remaining)</span>
                        </button>
                      )}

                      <button
                        onClick={() => setPackagesViewMode("plans")}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <span>⭐ View Packages / Buy Unlimited Pass</span>
                      </button>

                      <div className="text-center pt-2">
                        <button onClick={onClose} className="text-xs text-slate-400 hover:text-white transition underline">
                          Close Call
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <button
                          onClick={() => setPackagesViewMode("summary")}
                          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
                        >
                          ← Back
                        </button>
                        <span className="text-xs text-emerald-400 font-bold">Unlimited Calls & Chats</span>
                      </div>

                      {availablePackages.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs bg-white/5 rounded-2xl">
                          No packages currently available.
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
                                className="mt-3 w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow"
                              >
                                Buy & Continue
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-center text-slate-400 text-[11px] items-center gap-1.5 pt-2">
                        <Lock className="w-3.5 h-3.5" /> 100% Secure & Confidential
                      </div>
                    </div>
                  )}
                </>
              )}

              {role === "BUDDY" && (
                <div className="flex justify-center">
                  <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-semibold">
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
