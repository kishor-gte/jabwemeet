"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, Loader2 } from "lucide-react";

export type DialogType = "info" | "success" | "warning" | "danger" | "confirm";

export interface DialogOptions {
  title?: string;
  message: string | ReactNode;
  type?: DialogType;
  sticker?: string;
  badgeText?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  sticker?: string;
  duration?: number;
}

interface AdminDialogContextType {
  showModal: (options: DialogOptions) => Promise<boolean>;
  alert: (optsOrMsg: string | DialogOptions) => Promise<boolean>;
  confirm: (optsOrMsg: string | DialogOptions) => Promise<boolean>;
  toast: (
    message: string,
    type?: "success" | "error" | "warning" | "info",
    sticker?: string,
    duration?: number
  ) => void;
}

const AdminDialogContext = createContext<AdminDialogContextType | null>(null);

export function useAdminDialog() {
  const context = useContext(AdminDialogContext);
  if (!context) {
    throw new Error("useAdminDialog must be used within an AdminDialogProvider");
  }
  return context;
}

export function AdminDialogProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { message: "" },
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const showModal = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const alert = useCallback(
    (optsOrMsg: string | DialogOptions): Promise<boolean> => {
      const options: DialogOptions =
        typeof optsOrMsg === "string"
          ? {
              title: "Notice ✨",
              message: optsOrMsg,
              type: "info",
              sticker: "✨",
              confirmText: "Got It! ✨",
            }
          : {
              title:
                optsOrMsg.title ||
                (optsOrMsg.type === "success"
                  ? "Success! 🎉"
                  : optsOrMsg.type === "danger"
                  ? "Action Failed 😿"
                  : "Notice ✨"),
              type: optsOrMsg.type || "info",
              sticker:
                optsOrMsg.sticker ||
                (optsOrMsg.type === "success"
                  ? "🎉"
                  : optsOrMsg.type === "danger"
                  ? "🚨"
                  : optsOrMsg.type === "warning"
                  ? "⚠️"
                  : "✨"),
              confirmText: optsOrMsg.confirmText || "Got It! ✨",
              ...optsOrMsg,
            };
      return showModal(options);
    },
    [showModal]
  );

  const confirm = useCallback(
    (optsOrMsg: string | DialogOptions): Promise<boolean> => {
      const options: DialogOptions =
        typeof optsOrMsg === "string"
          ? {
              title: "Please Confirm 🤔",
              message: optsOrMsg,
              type: "confirm",
              sticker: "🤔",
              confirmText: "Yes, Proceed ✨",
              cancelText: "Cancel",
            }
          : {
              title: optsOrMsg.title || "Please Confirm 🤔",
              type: optsOrMsg.type || "confirm",
              sticker:
                optsOrMsg.sticker ||
                (optsOrMsg.isDestructive || optsOrMsg.type === "danger"
                  ? "🗑️"
                  : optsOrMsg.type === "warning"
                  ? "⚠️"
                  : "🤔"),
              confirmText: optsOrMsg.confirmText || (optsOrMsg.isDestructive ? "Yes, Delete 🗑️" : "Yes, Proceed ✨"),
              cancelText: optsOrMsg.cancelText || "Cancel",
              ...optsOrMsg,
            };
      return showModal(options);
    },
    [showModal]
  );

  const toast = useCallback(
    (
      message: string,
      type: "success" | "error" | "warning" | "info" = "success",
      sticker?: string,
      duration = 4000
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      const defaultSticker =
        type === "success" ? "🎉" : type === "error" ? "🚨" : type === "warning" ? "⚠️" : "✨";
      setToasts((prev) => [...prev, { id, message, type, sticker: sticker || defaultSticker, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const handleClose = (result: boolean) => {
    if (modalState.resolve) {
      modalState.resolve(result);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
    setLoadingAction(false);
  };

  const handleConfirm = async () => {
    if (modalState.options.onConfirm) {
      try {
        setLoadingAction(true);
        await modalState.options.onConfirm();
      } catch (err) {
        console.error("Error in onConfirm dialog:", err);
      } finally {
        setLoadingAction(false);
      }
    }
    handleClose(true);
  };

  const handleCancel = () => {
    if (modalState.options.onCancel) {
      modalState.options.onCancel();
    }
    handleClose(false);
  };

  const { options, isOpen } = modalState;
  const isConfirm =
    options.type === "confirm" ||
    (Boolean(options.cancelText) && options.cancelText !== "");

  const sticker =
    options.sticker ||
    (options.type === "success"
      ? "🎉"
      : options.type === "danger"
      ? "🚨"
      : options.type === "warning"
      ? "⚠️"
      : options.type === "confirm"
      ? (options.isDestructive ? "🗑️" : "🤔")
      : "✨");

  return (
    <AdminDialogContext.Provider value={{ showModal, alert, confirm, toast }}>
      {children}

      {/* Cute & Professional Dynamic Popup Modal - Centered */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="relative w-full max-w-md bg-[#131d2e]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-center space-y-5 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Ambient background glow */}
            <div
              className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                options.type === "success"
                  ? "bg-emerald-500/20"
                  : options.type === "danger"
                  ? "bg-rose-500/25"
                  : options.type === "warning"
                  ? "bg-amber-500/25"
                  : options.type === "confirm"
                  ? "bg-[#e06d53]/25"
                  : "bg-sky-500/20"
              }`}
            />

            {/* Top Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            {/* Dynamic Animated Sticker */}
            <div className="relative pt-2">
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl shadow-2xl border border-white/10 select-none transform hover:scale-105 transition ${
                  options.type === "success"
                    ? "bg-emerald-500/15 ring-4 ring-emerald-500/20"
                    : options.type === "danger"
                    ? "bg-rose-500/15 ring-4 ring-rose-500/20"
                    : options.type === "warning"
                    ? "bg-amber-500/15 ring-4 ring-amber-500/20"
                    : options.type === "confirm"
                    ? "bg-[#e06d53]/15 ring-4 ring-[#e06d53]/20"
                    : "bg-sky-500/15 ring-4 ring-sky-500/20"
                }`}
              >
                <span className="animate-bounce inline-block">{sticker}</span>
              </div>
            </div>

            {/* Status Pill Badge */}
            <div>
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                  options.type === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : options.type === "danger"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : options.type === "warning"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : options.type === "confirm"
                    ? "bg-[#e06d53]/20 text-[#fca5a5] border border-[#e06d53]/30"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                }`}
              >
                {options.badgeText ||
                  (options.type === "success"
                    ? "✨ Success"
                    : options.type === "danger"
                    ? "🚨 Action Failed"
                    : options.type === "warning"
                    ? "⚠️ Notice"
                    : options.type === "confirm"
                    ? "🤔 Confirmation Required"
                    : "ℹ️ Notification")}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {options.title || "Admin Control Center"}
              </h3>
              <div className="text-sm text-slate-300 leading-relaxed font-normal px-2">
                {typeof options.message === "string" ? (
                  <p className="whitespace-pre-line">{options.message}</p>
                ) : (
                  options.message
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {isConfirm ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleCancel}
                    className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {options.cancelText || "Cancel"}
                  </button>
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleConfirm}
                    className={`w-full py-3 px-4 rounded-2xl text-white font-extrabold text-sm shadow-lg transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                      options.isDestructive || options.type === "danger"
                        ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/30"
                        : "bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#f07d63] hover:to-[#d96950] shadow-[#e06d53]/30"
                    }`}
                  >
                    {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{options.confirmText || "Confirm"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {options.cancelText && (
                    <button
                      type="button"
                      disabled={loadingAction}
                      onClick={handleCancel}
                      className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {options.cancelText}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loadingAction}
                    onClick={handleConfirm}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e06d53] to-[#c95940] hover:from-[#f07d63] hover:to-[#d96950] text-white font-extrabold text-sm shadow-lg shadow-[#e06d53]/30 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{options.confirmText || "Got It! ✨"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cute Floating Toast Notifications - Centered */}
      {toasts.length > 0 && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[210] flex flex-col items-center gap-2.5 w-full max-w-md px-4 pointer-events-auto">
          {toasts.map((t) => {
            const isSuccess = t.type === "success";
            const isError = t.type === "error";
            const isWarning = t.type === "warning";

            return (
              <div
                key={t.id}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-[#0e1626]/98 backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-left animate-in slide-in-from-top-4 zoom-in-95 duration-200 ${
                  isSuccess
                    ? "border-emerald-500/40 text-emerald-200 ring-2 ring-emerald-500/10"
                    : isError
                    ? "border-rose-500/40 text-rose-200 ring-2 ring-rose-500/10"
                    : isWarning
                    ? "border-amber-500/40 text-amber-200 ring-2 ring-amber-500/10"
                    : "border-sky-500/40 text-sky-200 ring-2 ring-sky-500/10"
            }`}
              >
                <span className="text-2xl shrink-0 select-none animate-bounce">{t.sticker || (isSuccess ? "🎉" : isError ? "🚨" : isWarning ? "⚠️" : "✨")}</span>
                <div className="flex-1 text-xs sm:text-sm font-semibold text-white leading-snug">
                  {t.message}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AdminDialogContext.Provider>
  );
}
