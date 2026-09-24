"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Headphones,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Heart,
  Sparkles,
  Phone,
  Clock,
  PhoneCall,
  Loader2,
  HeartHandshake
} from "lucide-react";
import VoiceCallOverlay from "@/components/VoiceCallOverlay";
import { io } from "socket.io-client";

export default function BreakupBuddyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Calling State
  const [activeCallReqId, setActiveCallReqId] = useState<string | null>(null);
  const [activeCallBuddyId, setActiveCallBuddyId] = useState<string | null>(null);
  const [userIncomingCall, setUserIncomingCall] = useState<{ requestId: string; callerName: string } | null>(null);

  // Connect State
  const [isConnecting, setIsConnecting] = useState(false);

  // Packages State
  const [packages, setPackages] = useState<any[]>([
    {
      id: "pkg-30m",
      name: "30-Minute Support Session",
      price: 299,
      duration: "30 Minutes",
      features: ["1-on-1 Voice Call or Chat", "Compassionate Listening", "Non-judgmental Space", "Instant Connection"]
    },
    {
      id: "pkg-60m",
      name: "60-Minute Deep Healing Pack",
      price: 499,
      duration: "60 Minutes",
      isPopular: true,
      features: ["Full 1-Hour Voice & Chat Support", "Vent & Heal Freely", "Personalized Recovery Tips", "Valid for 7 Days"]
    },
    {
      id: "pkg-week",
      name: "Weekly Unlimited Care Pass",
      price: 1999,
      duration: "7 Days",
      features: ["Unlimited Voice Calls & Daily Chat", "Priority Buddy Matching", "Crisis Emotional Support", "24/7 Availability"]
    }
  ]);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch("/api/services/my-buddy-requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          setMyRequests(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = () => {
    fetch("/api/services/packages/breakup-buddy")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
        }
      })
      .catch((e) => console.error("Error fetching dynamic packages:", e));
  };

  useEffect(() => {
    fetchPackages();
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.user) {
          setCurrentUser(data.user);
          fetchMyRequests();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Real-time socket listener for incoming voice calls
  useEffect(() => {
    if (!currentUser) return;
    const s = io("http://localhost:5001", { withCredentials: true });
    s.on("connect", () => {
      s.emit("join-user-room", currentUser.id);
    });
    s.on("incoming-call", (data) => {
      setUserIncomingCall(data);
    });
    return () => {
      s.disconnect();
    };
  }, [currentUser]);

  const activeConnection = myRequests[0];
  const isAccepted = activeConnection && activeConnection.status === "Accepted";
  const isPending = activeConnection && activeConnection.status === "Pending";

  // Polling for live acceptance when request is pending
  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      fetchMyRequests();
    }, 3500);
    return () => clearInterval(interval);
  }, [isPending]);

  // Direct Connect Handler (Broadcasts to all Breakup Buddies with 30 mins free chat & call)
  const handleConnectWithBuddy = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (isPending) {
      showToast("⏳ Please wait, a Breakup Buddy is already reviewing your request.");
      return;
    }

    if (isAccepted) {
      showToast("✓ You are already connected with a Breakup Buddy!");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/services/buddy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionFormat: "Both (Chat & Call)",
          notes: "Need emotional support and safe listening",
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchMyRequests();
        showToast("📢 Request sent! Please wait, a Breakup Buddy will accept your request shortly.");
      } else {
        alert(data.message || "Could not submit request.");
      }
    } catch (e) {
      alert("Failed to submit connection request. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Razorpay payment loader
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

  const handleBuyPackage = async (pkg: any) => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setIsProcessingPayment(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Failed to load Razorpay payment gateway.");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const targetReqId = activeConnection ? activeConnection.id : "new";

      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: pkg.price,
          currency: "INR",
          type: "BREAKUP_BUDDY_PACKAGE",
          metadata: {
            packageId: pkg.id,
            packageName: pkg.name,
            requestId: targetReqId,
          }
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.message || "Could not initiate payment.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: orderData.keyId || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "JabWeMeet",
        description: pkg.name,
        order_id: orderData.order.id,
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.phone || "",
        },
        theme: {
          color: "#e06d53",
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                type: "BREAKUP_BUDDY_PACKAGE",
                metadata: {
                  packageId: pkg.id,
                  packageName: pkg.name,
                  requestId: targetReqId,
                }
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              fetchMyRequests();
              showToast(`🎉 ${pkg.name} activated successfully!`);
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
            alert("Error verifying payment.");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment initiation error.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111e] text-slate-100 font-sans selection:bg-[#e06d53] selection:text-white">
      {/* Voice Call Overlay */}
      {(activeCallReqId || userIncomingCall) && (
        <VoiceCallOverlay
          requestId={activeCallReqId || userIncomingCall?.requestId || ""}
          buddyId={activeCallBuddyId || ""}
          role="USER"
          isInitiator={!userIncomingCall}
          autoAccept={!!userIncomingCall}
          callerName={currentUser?.name || "Member"}
          targetName="Breakup Buddy"
          onClose={() => {
            setActiveCallReqId(null);
            setActiveCallBuddyId(null);
            setUserIncomingCall(null);
          }}
        />
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e293b] border border-[#e06d53] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#e06d53]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#0b111e]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e06d53] to-[#b8432a] flex items-center justify-center font-extrabold text-white text-lg shadow-lg">
                J
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                Jab<span className="text-[#e06d53]">We</span>Meet
              </span>
            </Link>

            <Link
              href={currentUser ? "/dashboard" : "/"}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConnectWithBuddy}
              disabled={isConnecting || isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-[#e06d53] hover:bg-[#c95940] disabled:opacity-60 text-white shadow-lg shadow-[#e06d53]/30 transition"
            >
              <Heart className="w-4 h-4 fill-white" />
              {isPending ? "Waiting for Buddy..." : "Connect with Breakup Buddy"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="pt-14 pb-12 px-6 text-center relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(224,109,83,0.18)_0%,transparent_65%)] border-b border-white/10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 text-xs font-semibold text-[#fca5a5]">
            🎁 100% Confidential • First 30 Mins Free Call & Chat
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-serif leading-tight">
            Healing Starts with a <span className="text-[#e06d53]">Safe Conversation</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Going through heartbreak, emotional overwhelm, or relationship distress? Connect with a compassionate Breakup Buddy who listens without judgment. Your privacy is 100% protected.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleConnectWithBuddy}
              disabled={isConnecting || isPending}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#e06d53] to-[#b8432a] hover:from-[#c95940] hover:to-[#9f341d] disabled:opacity-70 text-white font-bold text-sm rounded-full shadow-xl shadow-[#e06d53]/30 transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Request...
                </>
              ) : isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" /> Waiting for Buddy to Accept...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 fill-white" /> Connect with Breakup Buddy
                </>
              )}
            </button>

            <a
              href="#packages"
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs rounded-full transition text-center"
            >
              View Support Packages ↓
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* PENDING WAITING STATE */}
        {isPending && (
          <div className="bg-gradient-to-br from-[#1c1917] to-[#131d2e] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">We are assigning you with a Breakup Buddy</h3>
            <p className="text-xs sm:text-sm text-amber-200 max-w-lg mx-auto leading-relaxed">
              Please wait, your request has been sent to our Breakup Buddy team. Once a Breakup Buddy accepts your request, you can freely chat or make a voice call during your 30 minutes free session.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 animate-pulse">
              ⏳ Assigning your Breakup Buddy... Please wait.
            </div>
          </div>
        )}

        {/* ACCEPTED ACTIVE SESSION CARD */}
        {isAccepted && (
          <div className="bg-gradient-to-br from-[#131d2e] to-[#0f172a] border border-[#e06d53]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#e06d53]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  ✓ Connected with Breakup Buddy
                </span>

                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Active Session with Breakup Buddy
                </h3>

                <p className="text-xs text-slate-300 mt-1">
                  Your 30 minutes free session is active. You can freely call or chat with your buddy below.
                </p>
              </div>

              {/* Free Minutes / Package Badges */}
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Free Chat</div>
                  <div className="text-sm font-bold text-[#fca5a5]">
                    {activeConnection.hasActivePackage ? "Unlimited" : `${activeConnection.chatMinutesLeft || 30}m Left`}
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-white/5 border border-white/10 rounded-2xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Free Call</div>
                  <div className="text-sm font-bold text-[#fca5a5]">
                    {activeConnection.hasActivePackage ? "Unlimited" : `${activeConnection.callMinutesLeft || 30}m Left`}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Chat and Call */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                href="/messages"
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-[#e06d53] hover:bg-[#c95940] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#e06d53]/30 transition"
              >
                <MessageCircle className="w-4 h-4" /> Open Chat with Breakup Buddy
              </Link>

              <button
                onClick={() => {
                  setActiveCallReqId(activeConnection.id);
                  setActiveCallBuddyId(activeConnection.buddyId);
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
              >
                <PhoneCall className="w-4 h-4" /> Start Voice Call with Breakup Buddy
              </button>
            </div>
          </div>
        )}

        {/* 3 CORE PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#131d2e] border border-white/10 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e06d53]/10 text-[#e06d53] flex items-center justify-center text-xl">
              🎁
            </div>
            <h3 className="text-base font-bold text-white">First 30 Mins Free</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every connection starts with 30 minutes of free call and chat support so you can talk freely without hesitation.
            </p>
          </div>

          <div className="p-6 bg-[#131d2e] border border-white/10 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e06d53]/10 text-[#e06d53] flex items-center justify-center text-xl">
              🛡️
            </div>
            <h3 className="text-base font-bold text-white">100% Confidential</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All conversations and identities are completely private and confidential. No real names are ever exposed.
            </p>
          </div>

          <div className="p-6 bg-[#131d2e] border border-white/10 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e06d53]/10 text-[#e06d53] flex items-center justify-center text-xl">
              ⚡
            </div>
            <h3 className="text-base font-bold text-white">Instant Team Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your connection request is dispatched immediately to our Breakup Buddy network for the fastest response.
            </p>
          </div>
        </div>

        {/* PACKAGES SECTION */}
        <section id="packages" className="space-y-6 pt-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#e06d53] uppercase tracking-wider">Session Plans</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">Breakup Buddy Packages</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
              Completed your 30-min free session? Choose a package to keep speaking with your Breakup Buddy anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-8 rounded-3xl bg-[#131d2e] border transition duration-300 flex flex-col justify-between space-y-6 ${
                  pkg.isPopular
                    ? "border-[#e06d53] shadow-xl shadow-[#e06d53]/20 relative"
                    : "border-white/10 hover:border-white/20 shadow-lg"
                }`}
              >
                {pkg.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#e06d53] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    <Clock className="w-4 h-4 text-[#e06d53]" />
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">₹{pkg.price}</span>
                    <span className="text-xs text-slate-400">/ {pkg.duration}</span>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-slate-300">
                    {pkg.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleBuyPackage(pkg)}
                  disabled={isProcessingPayment}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-md ${
                    pkg.isPopular
                      ? "bg-[#e06d53] hover:bg-[#c95940] text-white shadow-[#e06d53]/30"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                  }`}
                >
                  {isProcessingPayment ? "Processing..." : `Buy Package (₹${pkg.price})`}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
