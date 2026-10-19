import { useCallback, useEffect, useState } from "react";
import { Edit3, FolderTree, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { XionSelect } from "../../components/common/XionSelect.jsx";
import { AdminLanguageTabs } from "../../components/admin/AdminLanguageTabs.jsx";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";
import { api } from "../../services/api.js";

const emptyForm = () => ({ kind: "CATEGORY", locale: { uz: { name: "" }, ru: { name: "" } }, slug: "", value: "", active: true, sortOrder: 0 });
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const kindLabel = (kind) => kind === "CATEGORY" ? "Kategoriya" : "Mahsulot tipi";

function fromItem(item) {
  return {
    kind: item.kind,
    locale: { uz: { name: item.name }, ru: { name: item.translations?.ru?.name || "" } },
    slug: item.slug,
    value: item.value,
    active: item.active,
    sortOrder: item.sortOrder,
  };
}

export function AdminCatalogTaxonomiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [language, setLanguage] = useState("uz");
  const [saving, setSaving] = useState(false);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/admin/catalog-taxonomies"); setItems(data.data.items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const startCreate = () => { setEditing(null); setForm(emptyForm()); setLanguage("uz"); setOpen(true); };
  const startEdit = (item) => { setEditing(item); setForm(fromItem(item)); setLanguage("uz"); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm(emptyForm()); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setName = (value) => setForm((current) => {
    const next = { ...current, locale: { ...current.locale, [language]: { name: value } } };
    if (language === "uz" && !editing) {
      if (!current.value || current.value === current.locale.uz.name) next.value = value;
      if (!current.slug || current.slug === slugify(current.locale.uz.name)) next.slug = slugify(value);
    }
    return next;
  });

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = {
        kind: form.kind,
        name: form.locale.uz.name,
        slug: form.slug,
        value: form.value,
        translations: form.locale.ru.name ? { ru: { name: form.locale.ru.name } } : {},
        active: form.active,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) await api.patch(`/admin/catalog-taxonomies/${editing.id}`, payload);
      else await api.post("/admin/catalog-taxonomies", payload);
      close(); await load();
      notify({ tone: "success", title: "Katalog bo‘limi saqlandi", message: payload.name });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Saqlanmadi", message: requestError.message });
    } finally { setSaving(false); }
  };

  const remove = async (item) => {
    const approved = await confirm({ title: "Katalog bo‘limi o‘chirilsinmi?", description: `“${item.name}” katalog navigatsiyasi va filtridan olib tashlanadi.`, note: "Mahsulotlarning o‘zi o‘chirilmaydi.", confirmLabel: "O‘chirish" });
    if (!approved) return;
    try {
      await api.delete(`/admin/catalog-taxonomies/${item.id}`);
      setItems((current) => current.filter(({ id }) => id !== item.id));
      notify({ tone: "success", title: "Bo‘lim o‘chirildi", message: item.name });
    } catch (requestError) { setError(requestError.message); }
  };

  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CATALOG · NAVIGATION · FILTERS</p><h1>Katalog bo‘limlari</h1><span>“Katalog” asosiy tugmasi doim saqlanadi. Qolgan kategoriya va mahsulot tiplarini shu yerdan boshqaring.</span></div><button type="button" onClick={startCreate}><Plus size={15}/> Qo‘shish</button></div>
    {error ? <div className="admin-error" role="alert"><strong>{error}</strong></div> : null}
    <section className="admin-resource-panel">{loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin"/> Yuklanmoqda...</div> : <div className="admin-resource-table"><table><thead><tr><th>Nomi</th><th>Turi</th><th>Mahsulot qiymati</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title"><span><FolderTree size={17}/></span><strong>{item.name}</strong></div><small>{item.translations?.ru?.name || "RU nomi kiritilmagan"}</small></td><td>{kindLabel(item.kind)}</td><td>{item.value}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span></td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => startEdit(item)} aria-label="Tahrirlash"><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)} aria-label="O‘chirish"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table>{!items.length ? <div className="admin-variant-empty">Hozircha boshqariladigan katalog bo‘limi yo‘q.</div> : null}</div>}</section>
    {open ? <AdminModal title={editing ? "Katalog bo‘limini tahrirlash" : "Yangi katalog bo‘limi"} subtitle="CATALOG TAXONOMY" onClose={close}><form className="admin-resource-form" onSubmit={save}>
      <div className="admin-form-grid"><FormField label="Bo‘lim turi" hint={editing ? "Mavjud bo‘lim turini almashtirish o‘rniga yangi bo‘lim yarating." : "Kategoriya tepada, mahsulot tipi filtrda ko‘rinadi."}><XionSelect value={form.kind} disabled={Boolean(editing)} onChange={(event) => set("kind", event.target.value)}><option value="CATEGORY">Kategoriya — tepada ko‘rinadi</option><option value="PRODUCT_TYPE">Mahsulot tipi — filtrda ko‘rinadi</option></XionSelect></FormField><FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField></div>
      <AdminLanguageTabs value={language} onChange={setLanguage}/>
      <div className="admin-form-grid admin-localized-panel"><FormField label={`Ko‘rinadigan nom · ${language.toUpperCase()}`} wide><input required={language === "uz"} minLength={language === "uz" ? 2 : undefined} value={form.locale[language].name} onChange={(event) => setName(event.target.value)}/></FormField></div>
      <div className="admin-form-grid"><FormField label="Slug" hint="Texnik URL kaliti"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField><FormField label="Mahsulotdagi qiymat" hint="Mahsulot category yoki type qiymati bilan aynan bir xil bo‘lsin"><input required value={form.value} onChange={(event) => set("value", event.target.value)}/></FormField></div>
      <div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/></div>
      <footer><button type="button" onClick={close}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button></footer>
    </form></AdminModal> : null}
  </main>;
}
