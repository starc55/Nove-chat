import { useCallback, useEffect, useState } from "react";
import { Edit3, LoaderCircle, Package, Plus, Search, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/products", { params: { q: search, limit: 100 } });
      setItems(data.data.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...emptyForm, ...item, price: item.price ?? "", oldPrice: item.oldPrice ?? "", longDescription: item.longDescription || "", image: item.image || "", category: item.category || "" });
    setModalOpen(true);
  };

  const close = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const wasEditing = Boolean(editing);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder), price: form.price === "" ? null : Number(form.price), oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice) };
      if (editing) await api.patch(`/admin/products/${editing.id}`, payload);
      else await api.post("/admin/products", payload);
      close();
      await load(query);
      notify({ tone: "success", title: wasEditing ? "Mahsulot yangilandi" : "Mahsulot qo‘shildi", message: `${payload.title} katalogda saqlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Mahsulot saqlanmadi", message: requestError.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const approved = await confirm({
      title: "Mahsulot o‘chirilsinmi?",
      description: `“${item.title}” katalog va sayt ko‘rinishidan butunlay olib tashlanadi.`,
      note: "Bu amalni ortga qaytarib bo‘lmaydi.",
      confirmLabel: "Mahsulotni o‘chirish"
    });
    if (!approved) return;
    setDeletingId(item.id);
    setError("");
    try {
      await api.delete(`/admin/products/${item.id}`);
      setItems((current) => current.filter((product) => product.id !== item.id));
      notify({ tone: "success", title: "Mahsulot o‘chirildi", message: `${item.title} katalogdan olib tashlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "O‘chirish bajarilmadi", message: requestError.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-content admin-resource-page">
      <div className="admin-page-head"><div><p>CATALOG · NEON DATABASE</p><h1>Mahsulotlar</h1><span>Landing va xizmat sahifalaridagi mahsulotlarni boshqaring.</span></div><button type="button" onClick={openCreate}><Plus size={15}/> Qo‘shish</button></div>
      <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(query); }}><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomi, slug yoki kategoriya..."/><button type="submit" disabled={loading}>Qidirish</button></form><span>{items.length} ta yozuv</span></div>
      {error ? <div className="admin-error" role="alert"><strong>{error}</strong><button type="button" onClick={() => load(query)}>Qayta urinish</button></div> : null}
      <section className="admin-resource-panel">
        {loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><Package/><p>Mahsulot topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Narx</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title">{item.image ? <img src={item.image} alt=""/> : <span><Package size={17}/></span>}<div><strong>{item.title}</strong><small>/{item.slug}</small></div></div></td><td>{item.category || "—"}</td><td>{item.price ? `${money.format(Number(item.price))} so‘m` : "Kelishiladi"}</td><td><span className={`resource-badge ${item.active ? "is-active" : ""}`}>{item.active ? "Faol" : "Yashirin"}</span>{item.featured ? <span className="resource-badge">TOP</span> : null}</td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => openEdit(item)} aria-label={`${item.title} mahsulotini tahrirlash`} title="Tahrirlash"><Edit3 size={15}/></button><button type="button" onClick={() => remove(item)} className="is-danger" aria-label={`${item.title} mahsulotini o‘chirish`} title="O‘chirish" disabled={deletingId === item.id}>{deletingId === item.id ? <LoaderCircle className="admin-spin" size={15}/> : <Trash2 size={15}/>}</button></div></td></tr>)}</tbody></table></div>}
      </section>
      {modalOpen ? <AdminModal title={editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"} subtitle="PRODUCT EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}>
        <div className="admin-form-grid"><FormField label="Nomi"><input required minLength="2" value={form.title} onChange={(event) => { const title = event.target.value; setForm((current) => ({ ...current, title, slug: editing || current.slug ? current.slug : slugify(title) })); }}/></FormField><FormField label="Slug" hint="lotin-harflari-bilan"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))}/></FormField><FormField label="Qisqa tavsif" wide><textarea required minLength="10" rows="3" value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)}/></FormField><FormField label="To‘liq tavsif" wide><textarea rows="5" value={form.longDescription} onChange={(event) => set("longDescription", event.target.value)}/></FormField><FormField label="Narx (so‘m)"><input type="number" min="0" max="9999999999999.99" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)}/></FormField><FormField label="Eski narx"><input type="number" min="0" max="9999999999999.99" step="0.01" value={form.oldPrice} onChange={(event) => set("oldPrice", event.target.value)}/></FormField><FormField label="Kategoriya"><input value={form.category} onChange={(event) => set("category", event.target.value)}/></FormField><FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField><FormField label="Rasm URL" wide><input type="url" value={form.image} onChange={(event) => set("image", event.target.value)} placeholder="https://cdn.example.com/product.webp"/></FormField></div>
        <div className="admin-form-options"><FormToggle label="Saytda faol" checked={form.active} onChange={(value) => set("active", value)}/><FormToggle label="Top mahsulot" checked={form.featured} onChange={(value) => set("featured", value)}/></div>
        <footer><button type="button" onClick={close} disabled={saving}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="admin-spin" size={15}/> Saqlanmoqda...</> : "Saqlash"}</button></footer>
      </form></AdminModal> : null}
    </main>
  );
}
