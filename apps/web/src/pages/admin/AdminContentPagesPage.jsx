import { useCallback, useEffect, useState } from "react";
import { Edit3, FileText, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const starterContent = { uz: { eyebrow: "", title: "", excerpt: "", sections: [] }, ru: { eyebrow: "", title: "", excerpt: "", sections: [] }, en: { eyebrow: "", title: "", excerpt: "", sections: [] } };
const emptyForm = { slug: "", title: "", content: JSON.stringify(starterContent, null, 2), active: true, sortOrder: 0 };
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminContentPagesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
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

  const startCreate = () => { setEditing(null); setForm({ ...emptyForm }); setOpen(true); };
  const startEdit = (item) => { setEditing(item); setForm({ ...item, content: JSON.stringify(item.content, null, 2) }); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); setForm(emptyForm); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { slug: form.slug, title: form.title, content: JSON.parse(form.content), active: form.active, sortOrder: Number(form.sortOrder) };
      if (editing) await api.patch(`/admin/content-pages/${editing.id}`, payload); else await api.post("/admin/content-pages", payload);
      close(); await load(query); notify({ tone: "success", title: "Kontent saqlandi", message: `${payload.title} saytda yangilandi.` });
    } catch (requestError) { const message = requestError instanceof SyntaxError ? "Kontent JSON formatida xato bor." : requestError.message; setError(message); notify({ tone: "danger", title: "Saqlanmadi", message }); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!await confirm({ title: "Sahifa o‘chirilsinmi?", description: `“${item.title}” saytdan butunlay olib tashlanadi.`, note: "Bu amalni ortga qaytarib bo‘lmaydi.", confirmLabel: "O‘chirish" })) return;
    try { await api.delete(`/admin/content-pages/${item.id}`); setItems((current) => current.filter(({ id }) => id !== item.id)); notify({ tone: "success", title: "Sahifa o‘chirildi", message: item.title }); }
    catch (requestError) { setError(requestError.message); }
  };

  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CONTENT · 3 LANGUAGES</p><h1>Kontent sahifalari</h1><span>Kompaniya, hamkorlik, yangiliklar va huquqiy sahifalarni boshqaring.</span></div><button type="button" onClick={startCreate}><Plus size={15}/> Qo‘shish</button></div>
    <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(query); }}><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sahifa nomi yoki slug..."/><button type="submit">Qidirish</button></form><span>{items.length} ta sahifa</span></div>
    {error ? <div className="admin-error" role="alert"><strong>{error}</strong></div> : null}
    <section className="admin-resource-panel">{loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin"/> Yuklanmoqda...</div> : <div className="admin-resource-table"><table><thead><tr><th>Sahifa</th><th>Slug</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title"><span><FileText size={17}/></span><strong>{item.title}</strong></div></td><td>/{item.slug}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span></td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => startEdit(item)}><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}</section>
    {open ? <AdminModal title={editing ? "Sahifani tahrirlash" : "Yangi sahifa"} subtitle="MULTILINGUAL CONTENT" onClose={close}><form className="admin-resource-form" onSubmit={save}><div className="admin-form-grid">
      <FormField label="Admin nomi"><input required minLength="2" value={form.title} onChange={(event) => { const title = event.target.value; setForm((current) => ({ ...current, title, slug: editing || current.slug ? current.slug : slugify(title) })); }}/></FormField>
      <FormField label="Slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField>
      <FormField label="Kontent JSON (uz, ru, en)" wide hint="Har bir til ichida eyebrow, title, excerpt va sections bo‘ladi."><textarea required rows="20" value={form.content} onChange={(event) => set("content", event.target.value)} spellCheck="false"/></FormField>
      <FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField>
    </div><div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/></div><footer><button type="button" onClick={close}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button></footer></form></AdminModal> : null}
  </main>;
}
