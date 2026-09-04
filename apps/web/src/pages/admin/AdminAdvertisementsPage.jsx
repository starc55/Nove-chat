import { useCallback, useEffect, useState } from "react";
import { Edit3, LoaderCircle, Megaphone, Plus, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { xionAssetUrl } from "../../utils/landing-assets.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { AdminLanguageTabs } from "../../components/admin/AdminLanguageTabs.jsx";
import { AdminImageUpload } from "../../components/admin/AdminImageUpload.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const emptyLocale = () => ({ title: "", description: "", ctaLabel: "" });
const emptyForm = () => ({ locale: { uz: emptyLocale(), ru: emptyLocale(), en: emptyLocale() }, image: "", ctaUrl: "", placement: "HERO", startAt: "", endAt: "", enabled: true, sortOrder: 0 });
const placementLabels = { HERO: "Asosiy swiper (Hero)", AFTER_HERO: "Aksiyalar swiper’i", PRODUCTS_TOP: "Mahsulotlar ustida", PRODUCTS_BOTTOM: "Mahsulotlar ostida", FLOATING: "Suzuvchi", FOOTER: "Footer" };
const toLocal = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

export function AdminAdvertisementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [language, setLanguage] = useState("uz");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/admin/advertisements", { params: { limit: 100 } }); setItems(data.data.items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setLanguage("uz"); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item); setLanguage("uz");
    setForm({ ...emptyForm(), image: item.image || "", ctaUrl: item.ctaUrl || "", placement: item.placement, startAt: toLocal(item.startAt), endAt: toLocal(item.endAt), enabled: item.enabled, sortOrder: item.sortOrder, locale: { uz: { title: item.title, description: item.description || "", ctaLabel: item.ctaLabel || "" }, ru: { ...emptyLocale(), ...(item.translations?.ru || {}) }, en: { ...emptyLocale(), ...(item.translations?.en || {}) } } });
    setModalOpen(true);
  };
  const close = () => { setModalOpen(false); setEditing(null); setForm(emptyForm()); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setLocale = (key, value) => setForm((current) => ({ ...current, locale: { ...current.locale, [language]: { ...current.locale[language], [key]: value } } }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    const wasEditing = Boolean(editing);
    try {
      const uz = form.locale.uz;
      const payload = { title: uz.title, description: uz.description || null, ctaLabel: uz.ctaLabel || null, translations: { ru: form.locale.ru, en: form.locale.en }, image: form.image || null, ctaUrl: form.ctaUrl || null, placement: form.placement, startAt: form.startAt ? new Date(form.startAt).toISOString() : null, endAt: form.endAt ? new Date(form.endAt).toISOString() : null, enabled: form.enabled, sortOrder: Number(form.sortOrder) };
      if (editing) await api.patch(`/admin/advertisements/${editing.id}`, payload); else await api.post("/admin/advertisements", payload);
      close(); await load(); notify({ tone: "success", title: wasEditing ? "Reklama yangilandi" : "Reklama qo‘shildi", message: `${payload.title} kampaniyasi saqlandi.` });
    } catch (requestError) { setError(requestError.message); notify({ tone: "danger", title: "Reklama saqlanmadi", message: requestError.message }); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!await confirm({ title: "Reklama o‘chirilsinmi?", description: `“${item.title}” kampaniyasi saytdan va reklama ro‘yxatidan olib tashlanadi.`, note: "Bu amalni ortga qaytarib bo‘lmaydi.", confirmLabel: "Reklamani o‘chirish" })) return;
    setDeletingId(item.id); setError("");
    try { await api.delete(`/admin/advertisements/${item.id}`); setItems((current) => current.filter((advertisement) => advertisement.id !== item.id)); notify({ tone: "success", title: "Reklama o‘chirildi", message: `${item.title} ro‘yxatdan olib tashlandi.` }); }
    catch (requestError) { setError(requestError.message); }
    finally { setDeletingId(null); }
  };

  const locale = form.locale[language];
  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>LANDING CONTENT · 3 LANGUAGES</p><h1>Landing bannerlari</h1><span>Hero va aksiyalar bannerlarini uch tilda, rasm va ko‘rinish muddati bilan boshqaring.</span></div><button type="button" onClick={openCreate}><Plus size={15}/> Banner qo‘shish</button></div>
    {error ? <div className="admin-error" role="alert"><strong>{error}</strong><button type="button" onClick={load}>Qayta urinish</button></div> : null}
    <section className="admin-resource-panel">{loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><Megaphone/><p>Banner topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Banner</th><th>Joylashuv</th><th>Muddat</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title">{item.image ? <img src={xionAssetUrl(item.image)} alt=""/> : <span><Megaphone size={17}/></span>}<div><strong>{item.title}</strong><small>{item.ctaLabel || "CTA yo‘q"}</small></div></div></td><td>{placementLabels[item.placement] || item.placement}</td><td><small>{item.startAt ? new Date(item.startAt).toLocaleDateString("uz-UZ") : "Darhol"} — {item.endAt ? new Date(item.endAt).toLocaleDateString("uz-UZ") : "Cheklanmagan"}</small></td><td><span className={`resource-badge ${item.enabled ? "is-active" : ""}`}>{item.enabled ? "Faol" : "O‘chiq"}</span></td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => openEdit(item)} aria-label="Reklamani tahrirlash"><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)} aria-label="Reklamani o‘chirish" disabled={deletingId === item.id}>{deletingId === item.id ? <LoaderCircle className="admin-spin" size={15}/> : <Trash2 size={15}/>}</button></div></td></tr>)}</tbody></table></div>}</section>
    {modalOpen ? <AdminModal title={editing ? "Reklamani tahrirlash" : "Yangi reklama"} subtitle="MULTILINGUAL CAMPAIGN EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}>
      <AdminLanguageTabs value={language} onChange={setLanguage}/>
      <div className="admin-form-grid admin-localized-panel" key={language}><FormField label={`Sarlavha · ${language.toUpperCase()}`} wide><input required={language === "uz"} minLength={language === "uz" ? 2 : undefined} value={locale.title} onChange={(event) => setLocale("title", event.target.value)}/></FormField><FormField label={`Tavsif · ${language.toUpperCase()}`} wide><textarea rows="4" value={locale.description} onChange={(event) => setLocale("description", event.target.value)}/></FormField><FormField label={`CTA matni · ${language.toUpperCase()}`} wide><input value={locale.ctaLabel} onChange={(event) => setLocale("ctaLabel", event.target.value)} placeholder="Batafsil"/></FormField></div>
      <div className="admin-form-section"><h3>Banner sozlamalari</h3><div className="admin-form-grid"><FormField label="CTA manzili"><input value={form.ctaUrl} onChange={(event) => set("ctaUrl", event.target.value)} placeholder="#contact yoki https://..."/></FormField><FormField label="Joylashuv"><select value={form.placement} onChange={(event) => set("placement", event.target.value)}>{Object.entries(placementLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></FormField><FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField><FormField label="Boshlanish"><input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)}/></FormField><FormField label="Tugash"><input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)}/></FormField><FormField label="Banner rasmi" wide><AdminImageUpload value={form.image} onChange={(value) => set("image", value)} label="Banner rasmini tanlash"/><input className="admin-url-fallback" type="url" value={form.image} onChange={(event) => set("image", event.target.value)} placeholder="Yoki rasm URL manzilini kiriting"/></FormField></div></div>
      <div className="admin-form-options"><FormToggle label="Reklama faol" checked={form.enabled} onChange={(value) => set("enabled", value)}/></div><footer><button type="button" onClick={close} disabled={saving}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="admin-spin" size={15}/> Saqlanmoqda...</> : "Saqlash"}</button></footer>
    </form></AdminModal> : null}
  </main>;
}
