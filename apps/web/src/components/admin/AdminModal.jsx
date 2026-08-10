import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export function AdminModal({ title, subtitle, children, onClose }) {
  const reduceMotion = useReducedMotion();
  const modalRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("admin-modal-open");
    const focusTimer = setTimeout(() => modalRef.current?.querySelector(".admin-resource-form input, .admin-resource-form textarea, .admin-resource-form select, button")?.focus(), 0);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("admin-modal-open");
    };
  }, []);

  return (
    <motion.div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.section ref={modalRef} className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
        <header>
          <div><p>{subtitle}</p><h2 id="admin-modal-title">{title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Oynani yopish"><X size={20}/></button>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}

export function FormField({ label, hint, wide = false, children }) {
  return <label className={wide ? "admin-form-field is-wide" : "admin-form-field"}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function FormToggle({ label, checked, onChange }) {
  return <label className="admin-form-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i/><span>{label}</span></label>;
}
