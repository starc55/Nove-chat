import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Search, Trash2 } from "lucide-react";
import { api } from "../../services/api.js";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const configs = {
  leads: {
    eyebrow: "CRM · MUROJAATLAR", title: "Mijoz murojaatlari", description: "Chat va buyurtma formalaridan yig‘ilgan kontaktlar.",
    empty: "Murojaatlar topilmadi.", search: "Ism, telefon yoki xabar...",
    statuses: { NEW: "Yangi", CONTACTED: "Bog‘lanildi", QUALIFIED: "Malakali", CLOSED: "Yopildi" }
  },
  orders: {
    eyebrow: "SALES · BUYURTMALAR", title: "Mahsulot buyurtmalari", description: "Landing mahsulotlaridan yuborilgan barcha arizalar.",
    empty: "Buyurtmalar topilmadi.", search: "Mijoz, telefon yoki mahsulot...",
    statuses: { NEW: "Yangi", PROCESSING: "Jarayonda", CONFIRMED: "Tasdiqlandi", COMPLETED: "Bajarildi", CANCELLED: "Bekor qilindi" }
  },
  reviews: {
    eyebrow: "CONTENT · SHARHLAR", title: "Mijoz sharhlari", description: "Sharhlarni tekshiring, tasdiqlang yoki rad eting.",
    empty: "Sharhlar topilmadi.", search: "Mijoz, telefon yoki sharh...",
    statuses: { PENDING: "Tekshiruvda", APPROVED: "Tasdiqlangan", REJECTED: "Rad etilgan" }
  }
};

const dateFormat = new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function RecordTitle({ kind, item }) {
  if (kind === "orders") return <><strong>{item.name}</strong><small>{item.product?.title}</small></>;
  if (kind === "reviews") return <><strong>{item.customerName} · {item.rating}/5</strong><small>{item.customerPhone || "Telefon yo‘q"}</small></>;
  return <><strong>{item.name}</strong><small>{item.phone}</small></>;
}

function RecordDetails({ kind, item }) {
  if (kind === "orders") return item.comment || "Izoh qoldirilmagan";
  if (kind === "reviews") return item.comment;
  return item.message || (item.conversation?.publicId ? `Chat #${item.conversation.publicId}` : item.source);
}

function AdminRecordsPage({ kind }) {
  const config = configs[kind];
  const { confirm, notify } = useAdminUi();
  const [state, setState] = useState({ items: [], loading: true, error: "" });
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async (query = "") => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const { data } = await api.get(`/admin/${kind}`, { params: { q: query, limit: 100 } });
      setState({ items: data.data.items, loading: false, error: "" });
    } catch (error) { setState({ items: [], loading: false, error: error.message }); }
  }, [kind]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (item, status) => {
    setBusyId(item.id);
    try {
      const { data } = await api.patch(`/admin/${kind}/${item.id}`, { status });
      setState((current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, ...data.data } : entry) }));
      notify({ tone: "success", title: "Holat yangilandi", message: `${config.title} yozuvi saqlandi.` });
    } catch (error) { notify({ tone: "danger", title: "Saqlanmadi", message: error.message }); }
    finally { setBusyId(""); }
  };

  const remove = async (item) => {
    const approved = await confirm({
      title: "Yozuv butunlay o‘chirilsinmi?",
      description: "Bu amalni ortga qaytarib bo‘lmaydi.",
      note: kind === "reviews" ? item.comment : item.name,
      confirmLabel: "O‘chirish"
    });
    if (!approved) return;
    setBusyId(item.id);
    try {
      await api.delete(`/admin/${kind}/${item.id}`);
      setState((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }));
      notify({ tone: "success", title: "Yozuv o‘chirildi" });
    } catch (error) { notify({ tone: "danger", title: "O‘chirilmadi", message: error.message }); }
    finally { setBusyId(""); }
  };

  return (
    <main className="admin-content admin-resource-page">
      <div className="admin-page-head"><div><p>{config.eyebrow}</p><h1>{config.title}</h1><span>{config.description}</span></div><button type="button" onClick={() => load(search)} disabled={state.loading}>Yangilash</button></div>
      <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(search); }}><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={config.search}/><button type="submit">Qidirish</button></form><span>{state.items.length} ta yozuv</span></div>
      {state.error ? <div className="admin-error"><div><strong>Ma’lumot yuklanmadi</strong><p>{state.error}</p></div><button onClick={() => load(search)}>Qayta urinish</button></div> : null}
      <section className="admin-resource-panel">
        {state.loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda</div> : state.items.length === 0 ? <div className="admin-empty"><p>{config.empty}</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Mijoz / manba</th><th>Telefon</th><th>Izoh</th><th>Vaqt</th><th>Holat</th><th/></tr></thead><tbody>{state.items.map((item) => <tr key={item.id} className={busyId === item.id ? "is-muted" : ""}><td><div className="resource-title"><span>{(item.name || item.customerName).charAt(0)}</span><div><RecordTitle kind={kind} item={item}/></div></div></td><td>{item.phone || item.customerPhone || "—"}</td><td className="record-detail-cell"><RecordDetails kind={kind} item={item}/></td><td>{dateFormat.format(new Date(item.createdAt))}</td><td><select className="admin-status-select" value={item.status} onChange={(event) => void updateStatus(item, event.target.value)} disabled={busyId === item.id}>{Object.entries(config.statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><div className="resource-actions"><button type="button" className="is-danger" onClick={() => void remove(item)} disabled={busyId === item.id} aria-label="Yozuvni o‘chirish"><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}

export function AdminLeadsPage() { return <AdminRecordsPage kind="leads"/>; }
export function AdminOrdersPage() { return <AdminRecordsPage kind="orders"/>; }
export function AdminReviewsPage() { return <AdminRecordsPage kind="reviews"/>; }
