import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, LoaderCircle, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { api } from "../../services/api.js";
import { getVisitorId, getVisitorProfile, saveVisitorProfile } from "../../services/visitor.js";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function PurchaseModal({ product, onClose }) {
  const { language, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState(() => {
    const profile = getVisitorProfile();
    return { name: profile?.name || "", phone: profile?.phone || "", comment: "" };
  });
  const [state, setState] = useState({ sending: false, success: false, error: "" });
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const variants = product?.variants || [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || null;
  const maximumQuantity = Math.min(99, selectedVariant?.stock ?? product?.stock ?? 99);
  const variantTitle = language === "ru" ? "Выберите размер / тип" : "Razmer / tipni tanlang";
  const stockLabel = language === "ru" ? "В наличии" : "Mavjud";
  const quantityLabel = language === "ru" ? "Количество" : "Miqdor";

  useEffect(() => {
    if (!product) return undefined;
    setSelectedVariantId(product.initialVariantId || "");
    setQuantity(1);
    setState({ sending: false, success: false, error: "" });
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [onClose, product]);

  const updateQuantity = (value) => {
    if (value === "") return setQuantity("");
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric)) return undefined;
    return setQuantity(Math.max(1, Math.min(maximumQuantity, numeric)));
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedQuantity = Math.max(1, Math.min(maximumQuantity, Number(quantity) || 1));
    setQuantity(normalizedQuantity);
    setState({ sending: true, success: false, error: "" });
    try {
      await api.post("/public/orders", {
        ...form,
        productId: product.id,
        productVariantId: selectedVariantId || null,
        quantity: normalizedQuantity,
        visitorId: getVisitorId(),
        sourcePath: window.location.pathname,
      });
      saveVisitorProfile(form);
      setState({ sending: false, success: true, error: "" });
    } catch (error) {
      setState({ sending: false, success: false, error: error.message });
    }
  };

  return <AnimatePresence>{product ? (
    <motion.div className="public-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="purchase-title" initial={reduceMotion ? false : { opacity: 0, y: 26, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <button type="button" className="public-modal-close" onClick={onClose} aria-label={t.close}><X/></button>
        <div className="purchase-summary"><span><ShoppingBag size={20}/></span><p>{t.orderEyebrow}</p><h2 id="purchase-title">{product.title}</h2><small>{product.shortDescription}</small>{selectedVariant ? <strong>{selectedVariant.label}</strong> : null}</div>
        <div className="purchase-form-wrap">{state.success ? (
          <div className="purchase-success"><CheckCircle2/><h3>{t.orderSuccess}</h3><button type="button" onClick={onClose}>OK</button></div>
        ) : <><h3>{t.orderTitle}</h3><p>{t.orderText}</p><form onSubmit={submit}>
          {variants.length ? <fieldset className="purchase-variants"><legend>{variantTitle}</legend><div>{variants.map((variant) => <label className={selectedVariantId === variant.id ? "is-selected" : ""} key={variant.id}><input required type="radio" name="product-variant" value={variant.id} checked={selectedVariantId === variant.id} onChange={() => { setSelectedVariantId(variant.id); setQuantity(1); }} disabled={variant.stock < 1}/><span>{variant.label}<small>{variant.stock} {stockLabel.toLowerCase()}</small></span></label>)}</div></fieldset> : null}
          <div className="purchase-quantity"><span>{quantityLabel}</span><div>
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, (Number(value) || 1) - 1))} disabled={Number(quantity) <= 1}><Minus size={15}/></button>
            <input type="number" inputMode="numeric" min="1" max={maximumQuantity} step="1" value={quantity} onChange={(event) => updateQuantity(event.target.value)} onBlur={() => updateQuantity(quantity || 1)} aria-label={quantityLabel}/>
            <button type="button" onClick={() => setQuantity((value) => Math.min(maximumQuantity, (Number(value) || 0) + 1))} disabled={Number(quantity) >= maximumQuantity}><Plus size={15}/></button>
          </div></div>
          <label><span>{t.name}</span><input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}/></label>
          <label><span>{t.phone}</span><input required type="tel" pattern="[+0-9 ()-]{7,24}" placeholder="+998 90 123 45 67" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}/></label>
          <label><span>{t.orderComment}</span><textarea rows="4" maxLength="1000" value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}/></label>
          {state.error ? <p className="form-error">{state.error}</p> : null}
          <button className="form-submit" disabled={state.sending || product.purchasable === false || !Number(quantity) || maximumQuantity < Number(quantity) || (variants.length > 0 && !selectedVariantId)}>{state.sending ? <LoaderCircle className="spin" size={18}/> : null}{t.sendOrder}</button>
        </form></>}</div>
      </motion.section>
    </motion.div>
  ) : null}</AnimatePresence>;
}
