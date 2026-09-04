import { useCallback, useEffect, useState } from "react";
import { Edit3, LoaderCircle, Package, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../../services/api.js";
import { xionAssetUrl } from "../../utils/landing-assets.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { AdminLanguageTabs } from "../../components/admin/AdminLanguageTabs.jsx";
import { AdminImageUpload } from "../../components/admin/AdminImageUpload.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const emptyLocale = () => ({ title: "", shortDescription: "", longDescription: "", category: "", material: "", form: "", productType: "", tags: "" });
const emptyForm = () => ({ locale: { uz: emptyLocale(), ru: emptyLocale(), en: emptyLocale() }, slug: "", price: "", oldPrice: "", stock: "", image: "", gallery: [], sourceUrl: "", documents: "", specifications: "", brand: "", showTags: true, variants: [], active: true, featured: false, sortOrder: 0 });
const emptyVariant = () => ({ labels: { uz: "", ru: "", en: "" }, size: "", type: "", sku: "", price: "", stock: 0, active: true, sortOrder: 0 });
const money = new Intl.NumberFormat("uz-UZ");
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const stringValue = (value) => value || "";

function formFromProduct(item) {
  const translated = item.translations || {};
  return {
    ...emptyForm(), slug: item.slug, price: item.price ?? "", oldPrice: item.oldPrice ?? "", stock: item.stock ?? "", image: item.image || "",
    gallery: (item.images || []).map(({ url }) => url), sourceUrl: item.sourceUrl || "",
    documents: item.documents ? JSON.stringify(item.documents, null, 2) : "", specifications: item.specifications ? JSON.stringify(item.specifications, null, 2) : "",
    brand: item.brand || "", showTags: item.showTags !== false, active: item.active, featured: item.featured, sortOrder: item.sortOrder,
    locale: {
      uz: { title: item.title, shortDescription: item.shortDescription, longDescription: stringValue(item.longDescription), category: stringValue(item.category), material: stringValue(item.material), form: stringValue(item.form), productType: stringValue(item.productType), tags: (item.tags || []).join(", ") },
      ru: { ...emptyLocale(), ...(translated.ru || {}), tags: Array.isArray(translated.ru?.tags) ? translated.ru.tags.join(", ") : translated.ru?.tags || "" },
      en: { ...emptyLocale(), ...(translated.en || {}), tags: Array.isArray(translated.en?.tags) ? translated.en.tags.join(", ") : translated.en?.tags || "" }
    },
    variants: (item.variants || []).map((variant) => ({ labels: { uz: variant.label, ru: variant.translations?.ru?.label || "", en: variant.translations?.en?.label || "" }, size: stringValue(variant.size), type: stringValue(variant.type), sku: stringValue(variant.sku), price: variant.price ?? "", stock: variant.stock, active: variant.active, sortOrder: variant.sortOrder }))
  };
}

export function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [language, setLanguage] = useState("uz");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async (search = "") => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/admin/products", { params: { q: search, limit: 100 } }); setItems(data.data.items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setLanguage("uz"); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(formFromProduct(item)); setLanguage("uz"); setModalOpen(true); };
  const close = () => { setModalOpen(false); setEditing(null); setForm(emptyForm()); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setLocale = (key, value) => setForm((current) => ({ ...current, locale: { ...current.locale, [language]: { ...current.locale[language], [key]: value } } }));
  const setVariant = (index, key, value) => setForm((current) => ({ ...current, variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, [key]: value } : variant) }));
  const setVariantLabel = (index, value) => setForm((current) => ({ ...current, variants: current.variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, labels: { ...variant.labels, [language]: value } } : variant) }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const wasEditing = Boolean(editing);
    try {
      const parseJson = (value) => value.trim() ? JSON.parse(value) : null;
      const uz = form.locale.uz;
      const payload = {
        title: uz.title, slug: form.slug, shortDescription: uz.shortDescription, longDescription: uz.longDescription || null,
        category: uz.category || null, material: uz.material || null, form: uz.form || null, productType: uz.productType || null,
        translations: { ru: { ...form.locale.ru, tags: form.locale.ru.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }, en: { ...form.locale.en, tags: form.locale.en.tags.split(",").map((tag) => tag.trim()).filter(Boolean) } }, brand: form.brand || null,
        tags: [...new Set(uz.tags.split(",").map((tag) => tag.trim()).filter(Boolean))], showTags: form.showTags,
        price: form.price === "" ? null : Number(form.price), oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        stock: form.stock === "" ? null : Number(form.stock),
        image: form.image || null, gallery: form.gallery, sourceUrl: form.sourceUrl || null,
        documents: parseJson(form.documents), specifications: parseJson(form.specifications),
        variants: form.variants.map((variant, index) => ({ label: variant.labels.uz || variant.size || variant.type, size: variant.size || null, type: variant.type || null, sku: variant.sku || null, translations: { ru: { label: variant.labels.ru }, en: { label: variant.labels.en } }, price: variant.price === "" ? null : Number(variant.price), stock: Number(variant.stock), active: variant.active, sortOrder: Number(variant.sortOrder ?? index) })),
        active: form.active, featured: form.featured, sortOrder: Number(form.sortOrder)
      };
      if (editing) await api.patch(`/admin/products/${editing.id}`, payload); else await api.post("/admin/products", payload);
      close(); await load(query); notify({ tone: "success", title: wasEditing ? "Mahsulot yangilandi" : "Mahsulot qo‘shildi", message: `${payload.title} katalogda saqlandi.` });
    } catch (requestError) {
      const message = requestError instanceof SyntaxError ? "Hujjat yoki qo‘shimcha xususiyat JSON formatida xato bor." : requestError.message;
      setError(message); notify({ tone: "danger", title: "Mahsulot saqlanmadi", message });
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!await confirm({ title: "Mahsulot o‘chirilsinmi?", description: `“${item.title}” katalog va sayt ko‘rinishidan butunlay olib tashlanadi.`, note: "Buyurtmalardagi tarixiy nom va narx saqlanib qoladi.", confirmLabel: "Mahsulotni o‘chirish" })) return;
    setDeletingId(item.id); setError("");
    try { await api.delete(`/admin/products/${item.id}`); setItems((current) => current.filter((product) => product.id !== item.id)); notify({ tone: "success", title: "Mahsulot o‘chirildi", message: `${item.title} katalogdan olib tashlandi.` }); }
    catch (requestError) { setError(requestError.message); notify({ tone: "danger", title: "O‘chirish bajarilmadi", message: requestError.message }); }
    finally { setDeletingId(null); }
  };

  const locale = form.locale[language];
  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CATALOG · NEON DATABASE</p><h1>Mahsulotlar</h1><span>Tarjimalar, rasmlar, narxlar, variantlar va zaxirani bir joydan boshqaring.</span></div><button type="button" onClick={openCreate}><Plus size={15}/> Qo‘shish</button></div>
    <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(query); }}><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomi, slug yoki kategoriya..."/><button type="submit" disabled={loading}>Qidirish</button></form><span>{items.length} ta yozuv</span></div>
    {error ? <div className="admin-error" role="alert"><strong>{error}</strong><button type="button" onClick={() => load(query)}>Qayta urinish</button></div> : null}
    <section className="admin-resource-panel">{loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><Package/><p>Mahsulot topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Zaxira</th><th>Holat</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title">{item.image ? <img src={xionAssetUrl(item.image)} alt=""/> : <span><Package size={17}/></span>}<div><strong>{item.title}</strong><small>/{item.slug}</small></div></div></td><td>{item.category || "—"}</td><td>{item.price ? `${money.format(Number(item.price))} so‘m` : "Kelishiladi"}</td><td>{item.variants?.length ? `${item.variants.reduce((sum, variant) => sum + variant.stock, 0)} dona` : item.stock == null ? "So‘rov asosida" : `${item.stock} dona`}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span>{item.featured ? <span className="resource-badge">TOP</span> : null}</td><td><div className="resource-actions"><button type="button" onClick={() => openEdit(item)} aria-label={`${item.title} mahsulotini tahrirlash`}><Edit3 size={15}/></button><button type="button" onClick={() => remove(item)} className="is-danger" aria-label={`${item.title} mahsulotini o‘chirish`} disabled={deletingId === item.id}>{deletingId === item.id ? <LoaderCircle className="admin-spin" size={15}/> : <Trash2 size={15}/>}</button></div></td></tr>)}</tbody></table></div>}</section>
    {modalOpen ? <AdminModal title={editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} subtitle="PRODUCT COMMERCE EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}>
      <AdminLanguageTabs value={language} onChange={setLanguage}/>
      <div className="admin-form-grid admin-localized-panel" key={language}>
        <FormField label={`Nomi · ${language.toUpperCase()}`}><input required={language === "uz"} minLength={language === "uz" ? 2 : undefined} value={locale.title} onChange={(event) => { const title = event.target.value; setLocale("title", title); if (language === "uz" && !editing && !form.slug) set("slug", slugify(title)); }}/></FormField>
        <FormField label={`Kategoriya · ${language.toUpperCase()}`}><input value={locale.category} onChange={(event) => setLocale("category", event.target.value)}/></FormField>
        <FormField label={`Qisqa tavsif · ${language.toUpperCase()}`} wide><textarea required={language === "uz"} minLength={language === "uz" ? 10 : undefined} rows="3" value={locale.shortDescription} onChange={(event) => setLocale("shortDescription", event.target.value)}/></FormField>
        <FormField label={`To‘liq tavsif · ${language.toUpperCase()}`} wide><textarea rows="5" value={locale.longDescription} onChange={(event) => setLocale("longDescription", event.target.value)}/></FormField>
        <FormField label={`Material · ${language.toUpperCase()}`}><input value={locale.material} onChange={(event) => setLocale("material", event.target.value)}/></FormField>
        <FormField label={`Forma · ${language.toUpperCase()}`}><input value={locale.form} onChange={(event) => setLocale("form", event.target.value)}/></FormField>
        <FormField label={`Mahsulot tipi · ${language.toUpperCase()}`} wide><input value={locale.productType} onChange={(event) => setLocale("productType", event.target.value)}/></FormField>
        <FormField label={`Taglar · ${language.toUpperCase()}`} hint="Vergul bilan ajrating" wide><input value={locale.tags} onChange={(event) => setLocale("tags", event.target.value)} placeholder="Yangi, Tavsiya, Chegirma"/></FormField>
      </div>
      <div className="admin-form-section"><h3>Asosiy ma’lumotlar</h3><div className="admin-form-grid">
        <FormField label="Slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField><FormField label="Brend"><input value={form.brand} onChange={(event) => set("brand", event.target.value)}/></FormField>
        <FormField label="Narx (so‘m)"><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)}/></FormField><FormField label="Eski narx"><input type="number" min="0" step="0.01" value={form.oldPrice} onChange={(event) => set("oldPrice", event.target.value)}/></FormField>
        <FormField label="Umumiy zaxira" hint="Variantlar bo‘lmasa ishlatiladi"><input type="number" min="0" value={form.stock} onChange={(event) => set("stock", event.target.value)} placeholder="Bo‘sh — so‘rov asosida"/></FormField>
        <FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField><FormField label="Rasmiy manba URL"><input type="url" value={form.sourceUrl} onChange={(event) => set("sourceUrl", event.target.value)}/></FormField>
      </div></div>
      <div className="admin-form-section"><h3>Mahsulot rasmlari</h3><div className="admin-form-grid"><FormField label="Asosiy rasm" wide><AdminImageUpload value={form.image} onChange={(value) => set("image", value)} label="Asosiy rasmni tanlash"/><input className="admin-url-fallback" type="url" value={form.image} onChange={(event) => set("image", event.target.value)} placeholder="Yoki rasm URL manzilini kiriting"/></FormField><FormField label="Galereya" wide><AdminImageUpload multiple value={form.gallery} onChange={(value) => set("gallery", value)} label="Galereyaga rasmlar qo‘shish"/></FormField></div></div>
      <div className="admin-form-section"><div className="admin-form-section-head"><div><h3>Razmer va tip variantlari</h3><p>Variant mavjud bo‘lsa, xaridor buyurtmadan oldin uni tanlaydi.</p></div><button type="button" onClick={() => set("variants", [...form.variants, { ...emptyVariant(), sortOrder: form.variants.length }])}><Plus size={15}/> Variant</button></div>
        <div className="admin-variant-list">{form.variants.length ? form.variants.map((variant, index) => <article className="admin-variant-row" key={index}><header><strong>Variant {index + 1}</strong><button type="button" onClick={() => set("variants", form.variants.filter((_, itemIndex) => itemIndex !== index))} aria-label="Variantni olib tashlash"><X size={16}/></button></header><div className="admin-form-grid"><FormField label={`Ko‘rinadigan nom · ${language.toUpperCase()}`} wide><input required={language === "uz"} value={variant.labels[language]} onChange={(event) => setVariantLabel(index, event.target.value)} placeholder="Masalan: 65 mm · Halqasimon"/></FormField><FormField label="Razmer"><input value={variant.size} onChange={(event) => setVariant(index, "size", event.target.value)} placeholder="65 mm"/></FormField><FormField label="Tip"><input value={variant.type} onChange={(event) => setVariant(index, "type", event.target.value)} placeholder="Tip 1"/></FormField><FormField label="SKU"><input value={variant.sku} onChange={(event) => setVariant(index, "sku", event.target.value)}/></FormField><FormField label="Variant narxi"><input type="number" min="0" step="0.01" value={variant.price} onChange={(event) => setVariant(index, "price", event.target.value)}/></FormField><FormField label="Zaxira"><input required type="number" min="0" value={variant.stock} onChange={(event) => setVariant(index, "stock", event.target.value)}/></FormField><FormField label="Tartib"><input type="number" value={variant.sortOrder} onChange={(event) => setVariant(index, "sortOrder", event.target.value)}/></FormField></div><FormToggle label="Variant faol" checked={variant.active} onChange={(value) => setVariant(index, "active", value)}/></article>) : <p className="admin-variant-empty">Hozircha variant yo‘q. Razmer yoki tip bo‘yicha sotilsa variant qo‘shing.</p>}</div>
      </div>
      <div className="admin-form-section"><h3>Qo‘shimcha ma’lumotlar</h3><div className="admin-form-grid"><FormField label="Hujjatlar JSON" hint='[{"label":"Yo‘riqnoma","url":"https://...pdf"}]' wide><textarea rows="5" value={form.documents} onChange={(event) => set("documents", event.target.value)} spellCheck="false"/></FormField><FormField label="Qo‘shimcha xususiyatlar JSON" hint='{"ishlabChiqaruvchi":"Simurg"}' wide><textarea rows="5" value={form.specifications} onChange={(event) => set("specifications", event.target.value)} spellCheck="false"/></FormField></div></div>
      <div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/><FormToggle label="Top mahsulot" checked={form.featured} onChange={(value) => set("featured", value)}/><FormToggle label="Taglarni ko‘rsatish" checked={form.showTags} onChange={(value) => set("showTags", value)}/></div>
      <footer><button type="button" onClick={close} disabled={saving}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="admin-spin" size={15}/> Saqlanmoqda...</> : "Saqlash"}</button></footer>
    </form></AdminModal> : null}
  </main>;
}
