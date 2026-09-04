import { useCallback, useEffect, useState } from "react";
import { Edit3, FileText, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { AdminLanguageTabs } from "../../components/admin/AdminLanguageTabs.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const emptyLocale = () => ({ eyebrow: "", title: "", excerpt: "", sections: [] });
const emptySection = () => ({ title: "", text: "", itemsText: "", date: "" });
const emptyForm = () => ({ slug: "", title: "", locale: { uz: emptyLocale(), ru: emptyLocale(), en: emptyLocale() }, shared: {}, active: true, sortOrder: 0 });
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function pageForm(item) {
  const content = item.content || {};
  const locale = Object.fromEntries(["uz", "ru", "en"].map((language) => {
    const value = content[language] || {};
    return [language, { eyebrow: value.eyebrow || "", title: value.title || "", excerpt: value.excerpt || "", sections: (value.sections || []).map((section) => ({ ...section, itemsText: (section.items || []).join("\n"), date: section.date || "" })) }];
  }));
  const shared = Object.fromEntries(Object.entries(content).filter(([key]) => !["uz", "ru", "en"].includes(key)));
  return { slug: item.slug, title: item.title, locale, shared, active: item.active, sortOrder: item.sortOrder };
}

export function AdminContentPagesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [language, setLanguage] = useState("uz");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async (q = "") => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/admin/content-pages", { params: { q, limit: 100 } }); setItems(data.data.items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const startCreate = () => { setEditing(null); setForm(emptyForm()); setLanguage("uz"); setOpen(true); };
  const startEdit = (item) => { setEditing(item); setForm(pageForm(item)); setLanguage("uz"); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm(emptyForm()); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setLocale = (key, value) => setForm((current) => ({ ...current, locale: { ...current.locale, [language]: { ...current.locale[language], [key]: value } } }));
  const setSection = (index, key, value) => setForm((current) => ({ ...current, locale: { ...current.locale, [language]: { ...current.locale[language], sections: current.locale[language].sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, [key]: value } : section) } } }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const content = { ...form.shared };
      for (const code of ["uz", "ru", "en"]) {
        const value = form.locale[code];
        content[code] = { eyebrow: value.eyebrow, title: value.title, excerpt: value.excerpt, sections: value.sections.map(({ itemsText, ...section }) => ({ ...section, date: section.date || undefined, items: itemsText.split("\n").map((item) => item.trim()).filter(Boolean) })) };
      }
      const payload = { slug: form.slug, title: form.title, content, active: form.active, sortOrder: Number(form.sortOrder) };
      if (editing) await api.patch(`/admin/content-pages/${editing.id}`, payload); else await api.post("/admin/content-pages", payload);
      close(); await load(query); notify({ tone: "success", title: "Kontent saqlandi", message: `${payload.title} uch tilda yangilandi.` });
    } catch (requestError) {
      setError(requestError.message); notify({ tone: "danger", title: "Saqlanmadi", message: requestError.message });
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!await confirm({ title: "Sahifa o‘chirilsinmi?", description: `“${item.title}” saytdan butunlay olib tashlanadi.`, note: "Bu amalni ortga qaytarib bo‘lmaydi.", confirmLabel: "O‘chirish" })) return;
    try { await api.delete(`/admin/content-pages/${item.id}`); setItems((current) => current.filter(({ id }) => id !== item.id)); notify({ tone: "success", title: "Sahifa o‘chirildi", message: item.title }); }
    catch (requestError) { setError(requestError.message); }
  };

  const locale = form.locale[language];
  const addSection = () => setLocale("sections", [...locale.sections, emptySection()]);
  const removeSection = (index) => setLocale("sections", locale.sections.filter((_, sectionIndex) => sectionIndex !== index));
  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CONTENT · 3 LANGUAGES</p><h1>Kontent sahifalari</h1><span>Har bir tilning sarlavha, kirish matni va bo‘limlarini alohida boshqaring.</span></div><button type="button" onClick={startCreate}><Plus size={15}/> Qo‘shish</button></div>
    <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(query); }}><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sahifa nomi yoki slug..."/><button type="submit">Qidirish</button></form><span>{items.length} ta sahifa</span></div>
    {error ? <div className="admin-error" role="alert"><strong>{error}</strong></div> : null}
    <section className="admin-resource-panel">{loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin"/> Yuklanmoqda...</div> : <div className="admin-resource-table"><table><thead><tr><th>Sahifa</th><th>Slug</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title"><span><FileText size={17}/></span><strong>{item.title}</strong></div></td><td>/{item.slug}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span></td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => startEdit(item)} aria-label="Tahrirlash"><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)} aria-label="O‘chirish"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}</section>
    {open ? <AdminModal title={editing ? "Sahifani tahrirlash" : "Yangi sahifa"} subtitle="MULTILINGUAL CONTENT EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}>
      <div className="admin-form-grid"><FormField label="Admin nomi"><input required minLength="2" value={form.title} onChange={(event) => { const title = event.target.value; set("title", title); if (!editing && !form.slug) set("slug", slugify(title)); }}/></FormField><FormField label="Slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField></div>
      <AdminLanguageTabs value={language} onChange={setLanguage}/>
      <div className="admin-form-grid admin-localized-panel" key={language}>
        <FormField label={`Kichik sarlavha · ${language.toUpperCase()}`} wide><input value={locale.eyebrow} onChange={(event) => setLocale("eyebrow", event.target.value)}/></FormField>
        <FormField label={`Asosiy sarlavha · ${language.toUpperCase()}`} wide><input required={language === "uz"} value={locale.title} onChange={(event) => setLocale("title", event.target.value)}/></FormField>
        <FormField label={`Kirish matni · ${language.toUpperCase()}`} wide><textarea rows="4" value={locale.excerpt} onChange={(event) => setLocale("excerpt", event.target.value)}/></FormField>
        <div className="admin-form-field is-wide"><div className="admin-form-section-head"><div><span>Sahifa bo‘limlari · {language.toUpperCase()}</span><p>Har bir bo‘lim matni va punktlarini alohida kiriting.</p></div><button type="button" onClick={addSection}><Plus size={15}/> Bo‘lim</button></div><div className="admin-variant-list">{locale.sections.map((section, index) => <article className="admin-variant-row" key={index}><header><strong>Bo‘lim {index + 1}</strong><button type="button" onClick={() => removeSection(index)} aria-label="Bo‘limni olib tashlash"><X size={16}/></button></header><div className="admin-form-grid"><FormField label="Sarlavha" wide><input value={section.title || ""} onChange={(event) => setSection(index, "title", event.target.value)}/></FormField><FormField label="Matn" wide><textarea rows="5" value={section.text || ""} onChange={(event) => setSection(index, "text", event.target.value)}/></FormField><FormField label="Punktlar" hint="Har bir punktni yangi qatordan kiriting" wide><textarea rows="5" value={section.itemsText || ""} onChange={(event) => setSection(index, "itemsText", event.target.value)}/></FormField><FormField label="Sana"><input type="date" value={section.date || ""} onChange={(event) => setSection(index, "date", event.target.value)}/></FormField></div></article>)}{!locale.sections.length ? <p className="admin-variant-empty">Bu til uchun hozircha bo‘lim yo‘q.</p> : null}</div></div>
        <FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField>
      </div>
      <div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/></div><footer><button type="button" onClick={close}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button></footer>
    </form></AdminModal> : null}
  </main>;
}
