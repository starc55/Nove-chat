import { X } from "lucide-react";

export function AdminModal({ title, subtitle, children, onClose }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <header>
          <div><p>{subtitle}</p><h2 id="admin-modal-title">{title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Oynani yopish"><X size={20}/></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function FormField({ label, hint, wide = false, children }) {
  return <label className={wide ? "admin-form-field is-wide" : "admin-form-field"}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function FormToggle({ label, checked, onChange }) {
  return <label className="admin-form-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i/><span>{label}</span></label>;
}
