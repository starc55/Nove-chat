import { Children, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export function XionSelect({ value, onChange, children, disabled, className = "", name, id, ...props }) {
  const generatedId = useId();
  const listId = `${id || generatedId}-options`;
  const options = Children.toArray(children).flat().filter(Boolean).map((child) => child.props);
  const index = options.findIndex((option) => String(option.value) === String(value));
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(Math.max(0, index));
  const [position, setPosition] = useState({});
  const trigger = useRef(null);
  const menu = useRef(null);
  const choose = (option) => {
    if (option.disabled) return;
    onChange?.({ target: { value: option.value, name } });
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return undefined;
    const rect = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 180) - 8)), width: Math.min(Math.max(rect.width, 180), window.innerWidth - 16), maxHeight: Math.min(300, Math.max(below, rect.top) - 16), ...(below > 210 || below > rect.top ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }) });
    const outside = (event) => { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); };
    const close = () => setOpen(false);
    const onScroll = (event) => { if (!menu.current?.contains(event.target)) close(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", close); };
  }, [open]);
  useEffect(() => { if (open) menu.current?.querySelector(`[data-index="${focused}"]`)?.scrollIntoView({ block: "nearest" }); }, [focused, open]);
  const keyDown = (event) => {
    if (event.key === "Escape" || event.key === "Tab") { setOpen(false); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault(); setOpen(true);
      setFocused((current) => event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, current + (event.key === "ArrowDown" ? 1 : -1))));
    } else if ((event.key === "Enter" || event.key === " ") && open) { event.preventDefault(); if (options[focused]) choose(options[focused]); }
  };
  const admin = Boolean(trigger.current?.closest(".admin-shell, .admin-modal"));
  return <span className={`xion-select ${className}`}>
    <button {...props} id={id} ref={trigger} type="button" disabled={disabled} role="combobox" aria-expanded={open} aria-controls={listId} aria-haspopup="listbox" aria-activedescendant={open ? `${listId}-${focused}` : undefined} aria-label={props["aria-label"] || options[index]?.children || "Tanlash"} onKeyDown={keyDown} onClick={() => { setFocused(Math.max(0, index)); setOpen((current) => !current); }}><span>{options[index]?.children || "—"}</span><ChevronDown size={15}/></button>
    {name ? <input type="hidden" name={name} value={value}/> : null}
    {open ? createPortal(<div ref={menu} id={listId} role="listbox" className={`xion-select-menu ${admin ? "is-admin" : ""}`} style={position}>{options.map((option, optionIndex) => <div key={option.value} id={`${listId}-${optionIndex}`} data-index={optionIndex} role="option" aria-selected={String(value) === String(option.value)} aria-disabled={option.disabled || undefined} className={`${focused === optionIndex ? "is-focused" : ""} ${String(value) === String(option.value) ? "is-selected" : ""}`} onPointerMove={() => setFocused(optionIndex)} onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.stopPropagation(); choose(option); }}><span>{option.children}</span>{String(value) === String(option.value) ? <Check size={15}/> : null}</div>)}</div>, document.body) : null}
  </span>;
}
