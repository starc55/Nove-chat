import { useEffect, useState } from "react";
import { Edit3, Package, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";

const emptyForm = { title: "", slug: "", shortDescription: "", longDescription: "", price: "", oldPrice: "", image: "", category: "", active: true, featured: false, sortOrder: 0 };
const money = new Intl.NumberFormat("uz-UZ");
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async (q = query) => {
    setLoading(true); setError("");
    try { const { data } = await api.get("/admin/products", { params: { q, limit: 100 } }); setItems(data.data.items); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(""); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm, ...item, price: item.price ?? "", oldPrice: item.oldPrice ?? "", longDescription: item.longDescription || "", image: item.image || "", category: item.category || "" });
  };
  const close = () => { setEditing(null); setForm(emptyForm); document.body.classList.remove("admin-modal-open"); };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder), price: form.price === "" ? null : Number(form.price), oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice) };
      if (editing) await api.patch(`/admin/products/${editing.id}`, payload); else await api.post("/admin/products", payload);
      close(); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`“${item.title}” mahsulotini o‘chirasizmi?`)) return;
    try { await api.delete(`/admin/products/${item.id}`); await load(); } catch (requestError) { setError(requestError.message); }
  };
  const modalOpen = editing || form !== emptyForm;

  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CATALOG · NEON DATABASE</p><h1>Mahsulotlar</h1><span>Landing va xizmat sahifalaridagi mahsulotlarni boshqaring.</span></div><button onClick={openCreate}><Plus size={15}/> Qo‘shish</button></div>
    <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); load(); }}><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomi, slug yoki kategoriya..."/><button>Qidirish</button></form><span>{items.length} ta yozuv</span></div>
    {error && <div className="admin-error" role="alert"><strong>{error}</strong><button onClick={() => load()}>Qayta urinish</button></div>}
    <section className="admin-resource-panel">
      {loading ? <div className="admin-resource-loading">Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><Package/><p>Mahsulot topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holat</th><th>Tartib</th><th/></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title">{item.image ? <img src={item.image} alt=""/> : <span><Package size={17}/></span>}<div><strong>{item.title}</strong><small>/{item.slug}</small></div></div></td><td>{item.category || "—"}</td><td>{item.price ? `${money.format(Number(item.price))} so‘m` : "Kelishiladi"}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span>{item.featured && <span className="resource-badge">TOP</span>}</td><td>{item.sortOrder}</td><td><div className="resource-actions"><button onClick={() => openEdit(item)} aria-label="Tahrirlash"><Edit3 size={15}/></button><button onClick={() => remove(item)} className="is-danger" aria-label="O‘chirish"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {modalOpen && <AdminModal title={editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} subtitle="PRODUCT EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}>
      <div className="admin-form-grid"><FormField label="Nomi"><input required minLength="2" value={form.title} onChange={(event) => { const title = event.target.value; setForm((current) => ({ ...current, title, slug: editing || current.slug ? current.slug : slugify(title) })); }}/></FormField><FormField label="Slug" hint="lotin-harflari-bilan"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField><FormField label="Qisqa tavsif" wide><textarea required minLength="10" rows="3" value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)}/></FormField><FormField label="To‘liq tavsif" wide><textarea rows="5" value={form.longDescription} onChange={(event) => set("longDescription", event.target.value)}/></FormField><FormField label="Narx (so‘m)"><input type="number" min="0" value={form.price} onChange={(event) => set("price", event.target.value)}/></FormField><FormField label="Eski narx"><input type="number" min="0" value={form.oldPrice} onChange={(event) => set("oldPrice", event.target.value)}/></FormField><FormField label="Kategoriya"><input value={form.category} onChange={(event) => set("category", event.target.value)}/></FormField><FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField><FormField label="Rasm URL" wide><input type="url" value={form.image} onChange={(event) => set("image", event.target.value)} placeholder="https://cdn.example.com/product.webp"/></FormField></div>
      <div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/><FormToggle label="Top mahsulot" checked={form.featured} onChange={(value) => set("featured", value)}/></div>
      <footer><button type="button" onClick={close}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button></footer>
    </form></AdminModal>}
  </main>;
}
