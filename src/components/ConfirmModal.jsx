import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ConfirmModal({
  show,
  title = "Estas seguro?",
  message = "Esta accion no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning", // "warning" | "success" | "info"
  onConfirm,
  onCancel,
}) {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef(null);

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
  }, [show]);

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleCancel();
    }
  };

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(() => {
      if (onConfirm) onConfirm();
    }, 200);
  };

  const handleCancel = () => {
    setVisible(false);
    setTimeout(() => {
      if (onCancel) onCancel();
    }, 200);
  };

  const typeStyles = {
    warning: {
      icon: "⚠️",
      color: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    success: {
      icon: "✅",
      color: "text-green-600",
      button: "bg-green-600 hover:bg-green-700",
    },
    info: {
      icon: "ℹ️",
      color: "text-[#0a2b6e]",
      button: "bg-[#0a2b6e] hover:bg-[#081f52]",
    },
  };

  const { icon, color, button } = typeStyles[type] || typeStyles.warning;

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          onClick={handleOutsideClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: visible ? 1 : 0.95, opacity: visible ? 1 : 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          >
            <div className="flex flex-col items-center text-center">
              <span className={`text-5xl mb-3 ${color}`}>{icon}</span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="flex justify-center gap-3 w-full">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition w-1/2"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-white rounded-lg transition w-1/2 ${button}`}
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
