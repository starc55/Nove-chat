import { useCallback, useEffect, useState } from "react";
import { Edit3, LoaderCircle, Megaphone, Plus, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const emptyForm = { title: "", description: "", image: "", ctaLabel: "", ctaUrl: "", placement: "HERO", startAt: "", endAt: "", enabled: true, sortOrder: 0 };
const placementLabels = { HERO: "Asosiy swiper (Hero)", AFTER_HERO: "Aksiyalar swiper'i", PRODUCTS_TOP: "Mahsulotlar ustida", PRODUCTS_BOTTOM: "Mahsulotlar ostida", FLOATING: "Suzuvchi", FOOTER: "Footer" };
const toLocal = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

export function AdminAdvertisementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/advertisements", { params: { limit: 100 } });
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
    setForm({ ...emptyForm, ...item, description: item.description || "", image: item.image || "", ctaLabel: item.ctaLabel || "", ctaUrl: item.ctaUrl || "", startAt: toLocal(item.startAt), endAt: toLocal(item.endAt) });
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
      const payload = { ...form, sortOrder: Number(form.sortOrder), startAt: form.startAt ? new Date(form.startAt).toISOString() : null, endAt: form.endAt ? new Date(form.endAt).toISOString() : null };
      if (editing) await api.patch(`/admin/advertisements/${editing.id}`, payload);
      else await api.post("/admin/advertisements", payload);
      close();
      await load();
      notify({ tone: "success", title: wasEditing ? "Reklama yangilandi" : "Reklama qo‘shildi", message: `${payload.title} kampaniyasi saqlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Reklama saqlanmadi", message: requestError.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const approved = await confirm({
      title: "Reklama o‘chirilsinmi?",
      description: `“${item.title}” kampaniyasi saytdan va reklama ro‘yxatidan olib tashlanadi.`,
      note: "Bu amalni ortga qaytarib bo‘lmaydi.",
      confirmLabel: "Reklamani o‘chirish"
    });
    if (!approved) return;
    setDeletingId(item.id);
    setError("");
    try {
      await api.delete(`/admin/advertisements/${item.id}`);
      setItems((current) => current.filter((advertisement) => advertisement.id !== item.id));
      notify({ tone: "success", title: "Reklama o‘chirildi", message: `${item.title} ro‘yxatdan olib tashlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "O‘chirish bajarilmadi", message: requestError.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-content admin-resource-page">
      <div className="admin-page-head"><div><p>LANDING CONTENT · SWIPERS</p><h1>Landing bannerlari</h1><span>Hero va aksiyalar swiper'iga rasm, matn, havola hamda ko‘rinish muddatini boshqaring.</span></div><button type="button" onClick={openCreate}><Plus size={15}/> Banner qo‘shish</button></div>
      {error ? <div className="admin-error" role="alert"><strong>{error}</strong><button type="button" onClick={load}>Qayta urinish</button></div> : null}
      <section className="admin-resource-panel">
        {loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><Megaphone/><p>Banner topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Banner</th><th>Joylashuv</th><th>Muddat</th><th>Holat</th><th>Tartib</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="resource-title">{item.image ? <img src={item.image} alt=""/> : <span><Megaphone size={17}/></span>}<div><strong>{item.title}</strong><small>{item.ctaLabel || "CTA yo‘q"}</small></div></div></td><td>{placementLabels[item.placement] || item.placement}</td><td><small>{item.startAt ? new Date(item.startAt).toLocaleDateString("uz-UZ") : "Darhol"} — {item.endAt ? new Date(item.endAt).toLocaleDateString("uz-UZ") : "Cheklanmagan"}</small></td><td><span className={`resource-badge ${item.enabled ? "is-active" : ""}`}>{item.enabled ? "Faol" : "O‘chiq"}</span></td><td>{item.sortOrder}</td><td><div className="resource-actions"><button type="button" onClick={() => openEdit(item)} aria-label={`${item.title} reklamasini tahrirlash`} title="Tahrirlash"><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)} aria-label={`${item.title} reklamasini o‘chirish`} title="O‘chirish" disabled={deletingId === item.id}>{deletingId === item.id ? <LoaderCircle className="admin-spin" size={15}/> : <Trash2 size={15}/>}</button></div></td></tr>)}</tbody></table></div>}
      </section>
      {modalOpen ? <AdminModal title={editing ? "Reklamani tahrirlash" : "Yangi reklama"} subtitle="CAMPAIGN EDITOR" onClose={close}><form className="admin-resource-form" onSubmit={save}><div className="admin-form-grid"><FormField label="Sarlavha" wide><input required minLength="2" value={form.title} onChange={(event) => set("title", event.target.value)}/></FormField><FormField label="Tavsif" wide><textarea rows="4" value={form.description} onChange={(event) => set("description", event.target.value)}/></FormField><FormField label="CTA matni"><input value={form.ctaLabel} onChange={(event) => set("ctaLabel", event.target.value)} placeholder="Batafsil"/></FormField><FormField label="CTA manzili"><input value={form.ctaUrl} onChange={(event) => set("ctaUrl", event.target.value)} placeholder="#contact yoki https://..."/></FormField><FormField label="Joylashuv"><select value={form.placement} onChange={(event) => set("placement", event.target.value)}>{Object.entries(placementLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></FormField><FormField label="Tartib"><input type="number" value={form.sortOrder} onChange={(event) => set("sortOrder", event.target.value)}/></FormField><FormField label="Boshlanish"><input type="datetime-local" value={form.startAt} onChange={(event) => set("startAt", event.target.value)}/></FormField><FormField label="Tugash"><input type="datetime-local" value={form.endAt} onChange={(event) => set("endAt", event.target.value)}/></FormField><FormField label="Rasm URL" wide><input type="url" value={form.image} onChange={(event) => set("image", event.target.value)} placeholder="https://cdn.example.com/banner.webp"/></FormField></div><div className="admin-form-options"><FormToggle label="Reklama faol" checked={form.enabled} onChange={(value) => set("enabled", value)}/></div><footer><button type="button" onClick={close} disabled={saving}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="admin-spin" size={15}/> Saqlanmoqda...</> : "Saqlash"}</button></footer></form></AdminModal> : null}
    </main>
  );
}
