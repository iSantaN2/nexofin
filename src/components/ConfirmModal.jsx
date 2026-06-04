import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function ConfirmModal({
  show,
  title = "Estas seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // "warning" | "success" | "info"
  onConfirm,
  onCancel,
}) {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef(null);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (onConfirm) onConfirm();
    }, 200);
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (onCancel) onCancel();
    }, 200);
  }, [onCancel]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    }
    setVisible(false);
    return undefined;
  }, [show]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && show) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel, show]);

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleCancel();
    }
  };

  const typeStyles = {
    warning: {
      Icon: AlertTriangle,
      color: "text-red-600",
      iconBg: "bg-red-50",
      button: "bg-red-600 hover:bg-red-700",
    },
    success: {
      Icon: CheckCircle2,
      color: "text-green-600",
      iconBg: "bg-green-50",
      button: "bg-green-600 hover:bg-green-700",
    },
    info: {
      Icon: Info,
      color: "text-[#0a2b6e]",
      iconBg: "bg-[#e9f2ff]",
      button: "bg-[#0a2b6e] hover:bg-[#081f52]",
    },
  };

  const { Icon, color, iconBg, button } = typeStyles[type] || typeStyles.warning;

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ y: 28, scale: 0.98, opacity: 0 }}
            animate={{
              y: visible ? 0 : 18,
              scale: visible ? 1 : 0.98,
              opacity: visible ? 1 : 0,
            }}
            exit={{ y: 28, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-t-[2rem] border border-[#dbe8ff] bg-white shadow-[0_28px_70px_rgba(10,43,110,0.24)] sm:rounded-[1.75rem]"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            <div className="flex flex-col items-center px-6 pb-5 pt-6 text-center sm:px-7">
              <span className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[1.35rem] ${iconBg} ${color}`}>
                <Icon size={30} />
              </span>
              <h3 className="mb-2 text-xl font-bold text-[#06142e]">{title}</h3>
              <p className="mb-6 max-w-sm text-sm leading-6 text-slate-600">{message}</p>

              <div className="flex w-full flex-col-reverse justify-center gap-2 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="min-h-12 w-full rounded-2xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 sm:w-1/2"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`min-h-12 w-full rounded-2xl px-4 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 sm:w-1/2 ${button}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
