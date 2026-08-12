import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, LoaderCircle, ShoppingBag, X } from "lucide-react";
import { api } from "../../services/api.js";
import { getVisitorId, getVisitorProfile, saveVisitorProfile } from "../../services/visitor.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function PurchaseModal({ product, onClose }) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState(() => {
    const profile = getVisitorProfile();
    return { name: profile?.name || "", phone: profile?.phone || "", comment: "" };
  });
  const [state, setState] = useState({ sending: false, success: false, error: "" });

  useEffect(() => {
    if (!product) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.classList.remove("modal-open"); };
  }, [onClose, product]);

  const submit = async (event) => {
    event.preventDefault();
    setState({ sending: true, success: false, error: "" });
    try {
      await api.post("/public/orders", { ...form, productId: product.id, visitorId: getVisitorId(), sourcePath: window.location.pathname });
      saveVisitorProfile(form);
      setState({ sending: false, success: true, error: "" });
    } catch (error) { setState({ sending: false, success: false, error: error.message }); }
  };

  return <AnimatePresence>{product ? <motion.div className="public-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title" initial={reduceMotion ? false : { opacity: 0, y: 26, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><button type="button" className="public-modal-close" onClick={onClose} aria-label="Yopish"><X/></button><div className="purchase-summary"><span><ShoppingBag size={20}/></span><p>{t.orderEyebrow}</p><h2 id="purchase-title">{product.title}</h2><small>{product.shortDescription}</small></div><div className="purchase-form-wrap">{state.success ? <div className="purchase-success"><CheckCircle2/><h3>{t.orderSuccess}</h3><button type="button" onClick={onClose}>OK</button></div> : <><h3>{t.orderTitle}</h3><p>{t.orderText}</p><form onSubmit={submit}><label><span>{t.name}</span><input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}/></label><label><span>{t.phone}</span><input required type="tel" pattern="[+0-9 ()-]{7,24}" placeholder="+998 90 123 45 67" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}/></label><label><span>{t.orderComment}</span><textarea rows="4" maxLength="1000" value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}/></label>{state.error ? <p className="form-error">{state.error}</p> : null}<button className="form-submit" disabled={state.sending}>{state.sending ? <LoaderCircle className="spin" size={18}/> : null}{t.sendOrder}</button></form></>}</div></motion.section></motion.div> : null}</AnimatePresence>;
}
