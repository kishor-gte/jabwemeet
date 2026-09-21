"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  ShieldCheck,
  Sparkles,
  Clock,
  PhoneCall,
  MessageCircle,
  UserCheck,
  Check,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  ArrowRight
} from "lucide-react";

export default function PackagesView({ user }: { user: any }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [buddyRequests, setBuddyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuddyReqId, setSelectedBuddyReqId] = useState<string>("");
  const [checkoutPkg, setCheckoutPkg] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    type: "warning" | "success" | "error";
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, buddyRes] = await Promise.all([
        fetch("/api/services/packages/breakup-buddy", { credentials: "include" }),
        fetch("/api/services/my-buddy-requests", { credentials: "include" })
      ]);
      const pkgData = await pkgRes.json();
      const buddyData = await buddyRes.json();

      if (pkgData.success) {
        setPackages(pkgData.packages || []);
      }
      if (buddyData.success && buddyData.data) {
        setBuddyRequests(buddyData.data);
        if (buddyData.data.length > 0) {
          setSelectedBuddyReqId((prev) => prev || buddyData.data[0].id);
        }
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

  const selectedBuddy = buddyRequests.find((r) => r.id === selectedBuddyReqId) || buddyRequests[0];
  const selectedBuddyName = selectedBuddy?.buddy?.displayName || selectedBuddy?.buddy?.name || "Buddy";

  const handleInitiateBuy = (pkg: any) => {
    if (!selectedBuddy) {
      setActiveModal({
        type: "warning",
        title: "No Buddy Selected 👤",
        message: "Please select a Breakup Buddy first from the top section to proceed.",
      });
      return;
    }

    // Guard: Prevent taking another package if this buddy already has an active pass
    if (selectedBuddy.chatLimitSeconds > 900) {
      const currentHours = Math.max(1, Math.round(selectedBuddy.chatLimitSeconds / 3600));
      setActiveModal({
        type: "warning",
        title: "Active Pass Already in Progress! ⏳",
        message: `You already have an active ${currentHours} Hour Unlimited Pass with ${selectedBuddyName}.`,
        subMessage: "You cannot purchase another package for this buddy until the current pass duration has completed.",
      });
      return;
    }

    setCheckoutPkg(pkg);
  };

  const handleRazorpayPayment = async () => {
    if (!checkoutPkg || !selectedBuddy) return;
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

      // 1. Create order on backend
      const res = await fetch("/api/services/packages/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: checkoutPkg.id,
          requestId: selectedBuddy.id,
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
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "JabWeMeet - Breakup Buddy",
        description: `${checkoutPkg.name} with ${selectedBuddyName}`,
        image: "https://jabwemeet.com/logo.png",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch("/api/services/packages/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                requestId: selectedBuddy.id,
                packageId: checkoutPkg.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCheckoutPkg(null);
              fetchData();
              setActiveModal({
                type: "success",
                title: "Payment Successful! 🎉🥳",
                message: `Your ${checkoutPkg.durationHours || 1} Hour Unlimited Pass with ${selectedBuddyName} is now ACTIVE!`,
                subMessage: "You can now make unlimited voice calls and send unlimited messages with your buddy.",
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
          color: "#4f46e5",
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (response: any) => {
        setActiveModal({
          type: "error",
          title: "Payment Failed ❌",
          message: response.error?.description || "Payment transaction was declined.",
        });
        setIsProcessingPayment(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Payment error:", err);
      setActiveModal({
        type: "error",
        title: "Payment Error ⚠️",
        message: "An unexpected error occurred while starting payment.",
      });
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Loading packages & buddy quotas...</div>;
  }

  const isSelectedBuddyUnlimited = selectedBuddy && selectedBuddy.chatLimitSeconds > 900;
  const selectedBuddyHours = selectedBuddy ? Math.max(1, Math.round(selectedBuddy.chatLimitSeconds / 3600)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-400" />
          My Buddy Subscriptions & Quotas
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Click on any Breakup Buddy below to inspect their status or purchase an hourly unlimited pass.
        </p>
      </div>

      {/* ACTIVE BUDDY SESSIONS & QUOTAS LIST (CLICKABLE) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            1. Select a Connected Buddy ({buddyRequests.length})
          </h3>
          <span className="text-xs text-indigo-300 font-medium">Click a buddy card to select</span>
        </div>

        {buddyRequests.length === 0 ? (
          <div className="p-6 text-center border border-white/10 border-dashed rounded-2xl text-slate-400 text-xs bg-white/5">
            You have not connected with any Breakup Buddies yet. Request a buddy from the Breakup Buddy page to unlock 5m free call and 15m free chat!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buddyRequests.map((req) => {
              const bName = req.buddy?.displayName || req.buddy?.name || "Buddy";
              const isUnlimited = req.chatLimitSeconds > 900;
              const durationHours = Math.max(1, Math.round((req.chatLimitSeconds || 3600) / 3600));
              const freeCallLeft = Math.max(0, Math.ceil(((req.voiceCallLimitSeconds || 300) - (req.voiceCallSeconds || 0)) / 60));
              const freeChatLeft = Math.max(0, Math.ceil(((req.chatLimitSeconds || 900) - (req.timeUsedSeconds || 0)) / 60));
              const isSelected = selectedBuddy?.id === req.id;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedBuddyReqId(req.id)}
                  className={`p-5 rounded-2xl transition-all duration-200 shadow-xl space-y-3 cursor-pointer relative ${
                    isSelected
                      ? "bg-gradient-to-br from-[#121e38] to-[#1c2e56] border-2 border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                      : "bg-gradient-to-br from-[#0d1526] to-[#121c32] border border-white/10 hover:border-white/30 hover:scale-[1.01]"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow">
                        {bName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{bName}</h4>
                        <span className="text-[10px] text-slate-400">Breakup Buddy</span>
                      </div>
                    </div>
                    {isUnlimited ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {durationHours} {durationHours === 1 ? "Hour" : "Hours"} Pass
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        Free Quota
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                        <PhoneCall className="w-3 h-3 text-rose-400" />
                        <span>Calls</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white">
                        {isUnlimited ? (
                          <span className="text-emerald-400 font-bold">
                            Unlimited ({durationHours} {durationHours === 1 ? "hr" : "hrs"})
                          </span>
                        ) : (
                          `${freeCallLeft}m free left`
                        )}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mb-1">
                        <MessageCircle className="w-3 h-3 text-sky-400" />
                        <span>Chats</span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white">
                        {isUnlimited ? (
                          <span className="text-emerald-400 font-bold">
                            Unlimited ({durationHours} {durationHours === 1 ? "hr" : "hrs"})
                          </span>
                        ) : (
                          `${freeChatLeft}m free left`
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AVAILABLE PACKAGES FOR SELECTED BUDDY */}
      {selectedBuddy && (
        <div className="pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>2. Available Passes for</span>
                <span className="text-indigo-400 font-extrabold underline underline-offset-4">
                  {selectedBuddyName}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSelectedBuddyUnlimited 
                  ? `An active ${selectedBuddyHours}h pass is currently running. You cannot take another package until it expires.`
                  : `Choose a pass below to pay with Razorpay and unlock unlimited calls & chats with ${selectedBuddyName}.`}
              </p>
            </div>

            {isSelectedBuddyUnlimited ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold self-start">
                <ShieldCheck className="w-4 h-4" />
                Active Pass ({selectedBuddyHours}h)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium self-start">
                Free Quota Active
              </span>
            )}
          </div>

          {packages.length === 0 ? (
            <div className="p-8 text-center border border-white/10 border-dashed rounded-2xl text-slate-500 text-sm">
              No packages configured by admin yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {packages.map((pkg) => {
                const pkgHours = pkg.durationHours || 1;
                const isThisPassActive =
                  isSelectedBuddyUnlimited &&
                  Math.round(selectedBuddy.chatLimitSeconds / 3600) === pkgHours;

                return (
                  <div
                    key={pkg.id}
                    className={`bg-[#0a101d] border rounded-3xl p-6 transition flex flex-col justify-between relative ${
                      isThisPassActive
                        ? "border-emerald-500 shadow-emerald-950/50 shadow-2xl bg-gradient-to-b from-[#0a1826] to-[#0a101d]"
                        : "border-white/10 hover:border-indigo-500/50"
                    }`}
                  >
                    {isThisPassActive && (
                      <span className="absolute -top-3 right-6 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow-md tracking-wider">
                        ACTIVE PLAN
                      </span>
                    )}

                    <div>
                      <h4 className="text-base font-bold text-white">{pkg.name}</h4>
                      <div className="text-2xl font-black text-emerald-400 mt-2">
                        ₹{pkg.price}
                        <span className="text-xs text-slate-400 font-normal"> / {pkgHours} {pkgHours === 1 ? "hour" : "hours"}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-3">{pkg.description}</p>
                      
                      <ul className="mt-4 space-y-2 text-xs text-slate-300 font-medium pb-6 border-b border-white/10">
                        <li className="flex justify-between">
                          <span className="text-slate-500">Duration:</span>
                          <span className="text-indigo-400 font-bold">{pkgHours} {pkgHours === 1 ? "Hour" : "Hours"}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-slate-500">Call Quota:</span>
                          <span className="text-emerald-400 font-semibold">Unlimited</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-slate-500">Chat Quota:</span>
                          <span className="text-emerald-400 font-semibold">Unlimited</span>
                        </li>
                      </ul>
                    </div>

                    {isThisPassActive ? (
                      <button
                        disabled
                        className="mt-6 w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-default"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Active Plan with {selectedBuddyName}</span>
                      </button>
                    ) : isSelectedBuddyUnlimited ? (
                      <button
                        onClick={() => handleInitiateBuy(pkg)}
                        className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 border border-white/5 text-xs font-medium transition hover:bg-slate-700/50"
                      >
                        Pass Already Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInitiateBuy(pkg)}
                        className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold transition shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Get Pass for {selectedBuddyName}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RAZORPAY CHECKOUT CONFIRMATION MODAL */}
      {checkoutPkg && selectedBuddy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Subscription</h3>
                  <span className="text-[11px] text-slate-400">Razorpay Secure Checkout</span>
                </div>
              </div>
              <button
                onClick={() => setCheckoutPkg(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Selected Breakup Buddy:</span>
                <strong className="text-white text-sm">{selectedBuddyName}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Package Plan:</span>
                <span className="font-bold text-indigo-300">{checkoutPkg.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Duration:</span>
                <span className="font-bold text-white">
                  {checkoutPkg.durationHours || 1} {checkoutPkg.durationHours === 1 ? "Hour" : "Hours"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Calls & Chats:</span>
                <span className="text-emerald-400 font-bold">100% Unlimited</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-bold text-white">Total Amount:</span>
                <span className="text-xl font-black text-emerald-400">₹{checkoutPkg.price}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutPkg(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isProcessingPayment}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Pay ₹{checkoutPkg.price}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Encrypted & Secured by Razorpay</span>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC INTERACTIVE FEEDBACK POPUP (SUCCESS, WARNING, ERROR) */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#131d2e] border border-white/15 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center">
              {activeModal.type === "success" && (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
              )}
              {activeModal.type === "warning" && (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20 animate-pulse">
                  <AlertCircle className="w-9 h-9" />
                </div>
              )}
              {activeModal.type === "error" && (
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
                  <XCircle className="w-9 h-9" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{activeModal.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                {activeModal.message}
              </p>
              {activeModal.subMessage && (
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto pt-1">
                  {activeModal.subMessage}
                </p>
              )}
            </div>

            <div className="pt-3">
              <button
                onClick={() => setActiveModal(null)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
                  activeModal.type === "success"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : activeModal.type === "warning"
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-amber-500/20"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {activeModal.type === "success" ? "Awesome, Got it! 🚀" : "Okay, Understood"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
