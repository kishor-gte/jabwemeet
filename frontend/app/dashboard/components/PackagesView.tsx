"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  ShieldCheck,
  Sparkles,
  Clock,
  PhoneCall,
  MessageCircle,
  Check,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  ArrowRight,
  Heart
} from "lucide-react";

export default function PackagesView({ user }: { user: any }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [buddyRequests, setBuddyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPkg, setCheckoutPkg] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    type: "warning" | "success" | "error";
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buddyRes, pkgRes] = await Promise.all([
        fetch("/api/services/my-buddy-requests", { credentials: "include" }),
        fetch("/api/services/packages/breakup-buddy")
      ]);

      const buddyData = await buddyRes.json();
      const pkgData = await pkgRes.json();

      if (buddyData?.success && Array.isArray(buddyData.data)) {
        setBuddyRequests(buddyData.data);
      }

      if (pkgData?.success && Array.isArray(pkgData.packages)) {
        setPackages(pkgData.packages);
      }
    } catch (e) {
      console.error("Fetch Error: ", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time 1-second ticker for live package countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const activeRequest = buddyRequests[0];
  const isPassActive = !!(
    activeRequest &&
    activeRequest.packageExpiresAt &&
    new Date(activeRequest.packageExpiresAt).getTime() > currentTime
  );

  const freeCallMinsLeft = activeRequest ? Math.max(0, Math.ceil(((activeRequest.voiceCallLimitSeconds || 1800) - (activeRequest.voiceCallSeconds || 0)) / 60)) : 30;
  const freeChatMinsLeft = activeRequest ? Math.max(0, Math.ceil(((activeRequest.chatLimitSeconds || 1800) - (activeRequest.timeUsedSeconds || 0)) / 60)) : 30;

  const handleInitiateBuy = (pkg: any) => {
    if (isPassActive) {
      setActiveModal({
        type: "warning",
        title: "Active Package in Progress! ⏳",
        message: "You already have an active Breakup Buddy package running.",
        subMessage: "You can purchase another package once your current pass duration completes.",
      });
      return;
    }
    setCheckoutPkg(pkg);
  };

  const handleRazorpayPayment = async () => {
    if (!checkoutPkg) return;
    setIsProcessingPayment(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setActiveModal({
          type: "error",
          title: "Payment Gateway Error ❌",
          message: "Razorpay SDK failed to load. Please check your internet connection.",
        });
        setIsProcessingPayment(false);
        return;
      }

      const targetReqId = activeRequest ? activeRequest.id : "new";

      // 1. Create order on backend
      const res = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: checkoutPkg.price,
          currency: "INR",
          type: "BREAKUP_BUDDY_PACKAGE",
          metadata: {
            packageId: checkoutPkg.id,
            packageName: checkoutPkg.name,
            requestId: targetReqId,
          }
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        setActiveModal({
          type: "error",
          title: "Order Creation Failed ⚠️",
          message: orderData.message || "Failed to initialize payment.",
        });
        setIsProcessingPayment(false);
        return;
      }

      // 2. Configure Razorpay Options
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RIlD5bEKRjyn3h",
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "JabWeMeet - Breakup Buddy",
        description: checkoutPkg.name,
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            // 3. Verify payment signature on backend
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
                  packageId: checkoutPkg.id,
                  packageName: checkoutPkg.name,
                  requestId: targetReqId,
                }
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCheckoutPkg(null);
              fetchData();
              setActiveModal({
                type: "success",
                title: "Payment Successful! 🎉🥳",
                message: `Your ${checkoutPkg.name} is now ACTIVE!`,
                subMessage: "You can now make voice calls and send unlimited messages with your Breakup Buddy.",
              });
            } else {
              setActiveModal({
                type: "error",
                title: "Payment Verification Failed ❌",
                message: verifyData.message || "Could not verify Razorpay signature.",
              });
            }
          } catch (e) {
            setActiveModal({
              type: "error",
              title: "Payment Verification Error ⚠️",
              message: "Network error occurred while verifying your payment.",
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#e06d53",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setActiveModal({
        type: "error",
        title: "Payment Error ❌",
        message: "An error occurred while processing payment.",
      });
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-[#e06d53]" />
          Breakup Buddy Packages & Session Quotas
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          First 30 minutes of Chat and Voice Call are 100% free with your Breakup Buddy. Choose a support pass below to extend your sessions anytime.
        </p>
      </div>

      {/* ACTIVE STATUS & QUOTAS SUMMARY CARD */}
      <div className="bg-gradient-to-br from-[#121e38] to-[#1c2e56] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e06d53]/20 text-[#e06d53] flex items-center justify-center font-bold text-lg">
              <Heart className="w-5 h-5 fill-[#e06d53]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Current Session Status</h3>
              <span className="text-xs text-slate-300">
                {isPassActive
                  ? "Active Package Running"
                  : activeRequest
                  ? "30-Min Free Trial Connection"
                  : "Ready to Connect (30 Mins Free Available)"}
              </span>
            </div>
          </div>

          <div>
            {isPassActive ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Package
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                🎁 Free 30-Min Quota
              </span>
            )}
          </div>
        </div>

        {/* Minutes Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>Voice Calls</span>
            </div>
            <div className="text-lg font-bold text-white">
              {isPassActive ? (
                <span className="text-emerald-400 font-extrabold">Unlimited</span>
              ) : (
                `${freeCallMinsLeft}m Free Left`
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <MessageCircle className="w-4 h-4 text-sky-400" />
              <span>Live Chats</span>
            </div>
            <div className="text-lg font-bold text-white">
              {isPassActive ? (
                <span className="text-emerald-400 font-extrabold">Unlimited</span>
              ) : (
                `${freeChatMinsLeft}m Free Left`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PACKAGES SELECTION GRID (GENERIC PACKAGES ONLY) */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#e06d53]" />
          Available Support Packages
        </h3>

        {packages.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0d1526] border border-white/10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No active Breakup Buddy packages found.</p>
            <p className="text-xs text-slate-500">Packages configured by Admin will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-7 rounded-3xl bg-[#0d1526] border transition-all duration-200 flex flex-col justify-between space-y-5 ${
                  pkg.isPopular
                    ? "border-[#e06d53] ring-2 ring-[#e06d53]/30 shadow-2xl relative"
                    : "border-white/10 hover:border-white/20 shadow-lg"
                }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#e06d53] text-white text-[10px] font-extrabold uppercase rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-white">{pkg.name}</h4>
                    <Clock className="w-4 h-4 text-[#e06d53]" />
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">₹{pkg.price}</span>
                    <span className="text-[11px] text-slate-400">
                      / {pkg.duration || (pkg.durationHours > 0 || pkg.durationMinutes > 0
                          ? `${pkg.durationHours ? `${pkg.durationHours} ${pkg.durationHours === 1 ? 'Hour' : 'Hours'}` : ''} ${pkg.durationMinutes ? `${pkg.durationMinutes} ${pkg.durationMinutes === 1 ? 'Min' : 'Mins'}` : ''}`.trim()
                          : (pkg.durationDays ? `${pkg.durationDays} Days` : 'pass'))}
                    </span>
                  </div>

                  {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                      {pkg.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => handleInitiateBuy(pkg)}
                  className={`w-full py-3 rounded-2xl text-xs font-bold transition shadow-md cursor-pointer ${
                    pkg.isPopular
                      ? "bg-[#e06d53] hover:bg-[#c95940] text-white shadow-[#e06d53]/30"
                      : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  }`}
                >
                  Buy Package (₹{pkg.price})
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHECKOUT CONFIRMATION MODAL */}
      {checkoutPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setCheckoutPkg(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e06d53]/10 border border-[#e06d53]/30 text-[11px] font-semibold text-[#fca5a5] mb-2">
                💳 Secure Checkout
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Package Purchase</h3>
              <p className="text-xs text-slate-400 mt-1">
                You are purchasing the <strong className="text-white">{checkoutPkg.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Package:</span>
                <span className="font-bold text-white">{checkoutPkg.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Access:</span>
                <span className="font-bold text-emerald-400">Unlimited Voice & Chat</span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                <span>Total Amount:</span>
                <span className="text-base font-extrabold text-[#e06d53]">₹{checkoutPkg.price}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-[#e06d53] hover:bg-[#c95940] disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-[#e06d53]/30 transition text-sm flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? "Processing..." : `Pay ₹${checkoutPkg.price} via Razorpay`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT / MODAL NOTIFICATION */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl bg-white/5 border border-white/10">
              {activeModal.type === "success" ? "✓" : activeModal.type === "warning" ? "⚠️" : "✕"}
            </div>
            <h4 className="text-base font-bold text-white">{activeModal.title}</h4>
            <p className="text-xs text-slate-300">{activeModal.message}</p>
            {activeModal.subMessage && (
              <p className="text-[11px] text-slate-400">{activeModal.subMessage}</p>
            )}
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
