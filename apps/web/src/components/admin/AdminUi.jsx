import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Trash2, X, XCircle } from "lucide-react";

const AdminUiContext = createContext(null);
let toastSequence = 0;

const toastIcons = {
  success: CheckCircle2,
  danger: XCircle,
  info: Info
};

function Toast({ toast, onDismiss }) {
  const Icon = toastIcons[toast.tone] || Info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4200);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <motion.article
      className={`admin-toast is-${toast.tone || "info"}`}
      role={toast.tone === "danger" ? "alert" : "status"}
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
    >
      <span className="admin-toast-icon"><Icon size={18}/></span>
      <div><strong>{toast.title}</strong>{toast.message ? <p>{toast.message}</p> : null}</div>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Bildirishnomani yopish"><X size={16}/></button>
    </motion.article>
  );
}

function ConfirmDialog({ dialog, onAnswer }) {
  const reduceMotion = useReducedMotion();
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onAnswer(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("admin-modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("admin-modal-open");
    };
  }, [onAnswer]);

  return (
    <motion.div
      className="admin-modal-backdrop admin-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onAnswer(false)}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.section
        className={`admin-confirm is-${dialog.tone || "danger"}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-description"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="admin-confirm-icon">{dialog.tone === "danger" ? <Trash2 size={21}/> : <AlertTriangle size={21}/>}</div>
        <div className="admin-confirm-copy">
          <p>{dialog.eyebrow || "AMALNI TASDIQLASH"}</p>
          <h2 id="admin-confirm-title">{dialog.title}</h2>
          <span id="admin-confirm-description">{dialog.description}</span>
          {dialog.note ? <small>{dialog.note}</small> : null}
        </div>
        <footer>
          <button type="button" ref={cancelRef} onClick={() => onAnswer(false)}>{dialog.cancelLabel || "Bekor qilish"}</button>
          <button type="button" className="is-confirm" onClick={() => onAnswer(true)}>{dialog.confirmLabel || "Tasdiqlash"}</button>
        </footer>
      </motion.section>
    </motion.div>
  );
}

export function AdminUiProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    if (resolverRef.current) resolverRef.current(false);
    resolverRef.current = resolve;
    setDialog(options);
  }), []);

  const answer = useCallback((accepted) => {
    resolverRef.current?.(accepted);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((options) => {
    const id = ++toastSequence;
    setToasts((current) => [...current.slice(-3), { tone: "info", ...options, id }]);
    return id;
  }, []);

  useEffect(() => () => resolverRef.current?.(false), []);

  return (
    <AdminUiContext.Provider value={{ confirm, notify }}>
      {children}
      <AnimatePresence>{dialog ? <ConfirmDialog dialog={dialog} onAnswer={answer}/> : null}</AnimatePresence>
      <div className="admin-toast-viewport" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>{toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={dismiss}/>)}</AnimatePresence>
      </div>
    </AdminUiContext.Provider>
  );
}

export function useAdminUi() {
  const context = useContext(AdminUiContext);
  if (!context) throw new Error("useAdminUi AdminUiProvider ichida ishlatilishi kerak.");
  return context;
}
