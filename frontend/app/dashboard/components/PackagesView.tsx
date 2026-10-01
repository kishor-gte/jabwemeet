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
          color: "#7E2248",
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
        <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-[#7E2248]" />
          Breakup Buddy Packages & Session Quotas
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          First 30 minutes of Chat and Voice Call are 100% free with your Breakup Buddy. Choose a support pass below to extend your sessions anytime.
        </p>
      </div>

      {/* ACTIVE STATUS & QUOTAS SUMMARY CARD */}
      <div className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#7E2248] flex items-center justify-center font-bold text-lg border border-rose-200 shadow-xs">
              <Heart className="w-5 h-5 fill-[#7E2248]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-slate-900">Current Session Status</h3>
              <span className="text-xs text-slate-500">
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
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Active Package
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                🎁 Free 30-Min Quota
              </span>
            )}
          </div>
        </div>

        {/* Minutes Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Voice Calls</span>
            </div>
            <div className="text-lg font-serif font-bold text-slate-900">
              {isPassActive ? (
                <span className="text-emerald-700 font-extrabold">Unlimited</span>
              ) : (
                `${freeCallMinsLeft}m Free Left`
              )}
            </div>
          </div>

          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-1">
              <MessageCircle className="w-4 h-4 text-[#7E2248]" />
              <span>Live Chats</span>
            </div>
            <div className="text-lg font-serif font-bold text-slate-900">
              {isPassActive ? (
                <span className="text-emerald-700 font-extrabold">Unlimited</span>
              ) : (
                `${freeChatMinsLeft}m Free Left`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PACKAGES SELECTION GRID */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7E2248]" />
          Available Support Packages
        </h3>

        {packages.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-rose-100 text-center space-y-2 shadow-xs">
            <p className="text-sm font-serif font-semibold text-slate-900">No active Breakup Buddy packages found.</p>
            <p className="text-xs text-slate-500">Packages configured by Admin will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 sm:p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-5 relative ${
                  pkg.isPopular
                    ? "bg-gradient-to-b from-rose-50/40 via-white to-white border-2 border-[#7E2248] shadow-lg hover:shadow-xl"
                    : "bg-white border border-rose-100 hover:border-rose-200 shadow-sm hover:shadow-md"
                }`}
              >
                {pkg.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-[#7E2248] text-white text-[10px] font-extrabold uppercase rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-serif font-bold text-slate-900">{pkg.name}</h4>
                    <Clock className="w-4 h-4 text-[#7E2248]" />
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-serif font-black text-slate-900">₹{pkg.price}</span>
                    <span className="text-[11px] text-slate-500">
                      / {pkg.duration || (pkg.durationHours > 0 || pkg.durationMinutes > 0
                          ? `${pkg.durationHours ? `${pkg.durationHours} ${pkg.durationHours === 1 ? 'Hour' : 'Hours'}` : ''} ${pkg.durationMinutes ? `${pkg.durationMinutes} ${pkg.durationMinutes === 1 ? 'Min' : 'Mins'}` : ''}`.trim()
                          : (pkg.durationDays ? `${pkg.durationDays} Days` : 'pass'))}
                    </span>
                  </div>

                  {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-rose-100 text-xs text-slate-600">
                      {pkg.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <button
                  onClick={() => handleInitiateBuy(pkg)}
                  className={`w-full py-3 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                    pkg.isPopular
                      ? "bg-[#7E2248] hover:bg-[#681938] text-white shadow-[#7E2248]/20 transform hover:-translate-y-0.5"
                      : "bg-rose-50 hover:bg-rose-100 text-[#7E2248] border border-rose-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setCheckoutPkg(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-rose-50 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-[#7E2248] mb-2">
                💳 Secure Checkout
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">Confirm Package Purchase</h3>
              <p className="text-xs text-slate-600 mt-1">
                You are purchasing the <strong className="text-slate-900">{checkoutPkg.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Package:</span>
                <span className="font-bold text-slate-900">{checkoutPkg.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Access:</span>
                <span className="font-bold text-emerald-700">Unlimited Voice & Chat</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-rose-200">
                <span>Total Amount:</span>
                <span className="text-base font-serif font-extrabold text-[#7E2248]">₹{checkoutPkg.price}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-[#7E2248] hover:bg-[#681938] disabled:opacity-50 text-white font-bold rounded-full shadow-md shadow-[#7E2248]/20 transition text-sm flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                {isProcessingPayment ? "Processing..." : `Pay ₹${checkoutPkg.price} via Razorpay`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT / MODAL NOTIFICATION */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-rose-100 rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl bg-rose-50 border border-rose-200 text-[#7E2248]">
              {activeModal.type === "success" ? "✓" : activeModal.type === "warning" ? "⚠️" : "✕"}
            </div>
            <h4 className="text-base font-serif font-bold text-slate-900">{activeModal.title}</h4>
            <p className="text-xs text-slate-600">{activeModal.message}</p>
            {activeModal.subMessage && (
              <p className="text-[11px] text-slate-500">{activeModal.subMessage}</p>
            )}
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-[#7E2248] hover:bg-[#681938] text-white font-semibold rounded-full text-xs transition shadow-sm"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
