import { useCallback, useEffect, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Eye, LoaderCircle, MessageSquareText, Search } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal } from "../../components/admin/AdminModal.jsx";

const dateFormat = new Intl.DateTimeFormat("uz-UZ", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function ArchiveConversation({ conversation, loadingOlder, onLoadOlder }) {
  return <div className="admin-archive-detail">
    <section className="admin-archive-contact">
      <div><small>MIJOZ</small><strong>{conversation.customer.name}</strong><span>{conversation.customer.phone || "Telefon yo‘q"}</span></div>
      <div><small>OPERATOR</small><strong>{conversation.operator?.name || "Operator o‘chirilgan"}</strong><span>{conversation.closedAt ? dateFormat.format(new Date(conversation.closedAt)) : "Yopilish vaqti yo‘q"}</span></div>
    </section>
    {conversation.nextCursor ? <button className="admin-load-older" type="button" onClick={onLoadOlder} disabled={loadingOlder}>{loadingOlder ? <LoaderCircle className="admin-spin" size={15}/> : <Archive size={15}/>} Eski xabarlarni yuklash</button> : <p className="admin-archive-start">Suhbat boshi</p>}
    <div className="admin-archive-messages">
      {conversation.messages.map((message) => <article className={`admin-archive-message is-${message.senderType.toLowerCase()}`} key={message.id}>
        <small>{message.senderType === "CUSTOMER" ? conversation.customer.name : message.senderType === "OPERATOR" ? conversation.operator?.name || "Operator" : "XION"}</small>
        <p>{message.content}</p>
        <time>{dateFormat.format(new Date(message.createdAt))}</time>
      </article>)}
    </div>
  </div>;
}

export function AdminConversationArchivePage() {
  const [state, setState] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 }, loading: true, error: "" });
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);

  const load = useCallback(async (page = 1, query = "") => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const { data } = await api.get("/admin/conversation-archive", { params: { page, limit: 25, q: query } });
      setState({ items: data.data.items, pagination: data.data.pagination, loading: false, error: "" });
    } catch (error) {
      setState((current) => ({ ...current, items: [], loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openConversation = async (item) => {
    setDetailLoading(true);
    setDetailError("");
    setActive({ publicId: item.publicId, customer: { name: item.customerName }, messages: [], nextCursor: null });
    try {
      const { data } = await api.get(`/admin/conversation-archive/${item.publicId}`, { params: { limit: 50 } });
      setActive(data.data);
    } catch (error) { setDetailError(error.message); }
    finally { setDetailLoading(false); }
  };

  const loadOlder = async () => {
    if (!active?.nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    setDetailError("");
    try {
      const { data } = await api.get(`/admin/conversation-archive/${active.publicId}`, { params: { limit: 50, cursor: active.nextCursor } });
      setActive((current) => ({ ...current, messages: [...data.data.messages, ...current.messages], nextCursor: data.data.nextCursor }));
    } catch (error) { setDetailError(error.message); }
    finally { setLoadingOlder(false); }
  };

  const pagination = state.pagination;
  return <main className="admin-content admin-resource-page">
    <div className="admin-page-head"><div><p>CHAT · DOIMIY ARXIV</p><h1>Yozishmalar arxivi</h1><span>Yopilgan suhbatlar muddatsiz saqlanadi va sahifalab yuklanadi.</span></div><button type="button" onClick={() => load(pagination.page, search)} disabled={state.loading}>Yangilash</button></div>
    <div className="admin-archive-note"><Archive size={18}/><div><strong>Serverga yengil arxiv</strong><span>Har sahifada 25 ta suhbat, chat ochilganda esa faqat so‘nggi 50 ta xabar yuklanadi.</span></div></div>
    <div className="admin-resource-toolbar"><form onSubmit={(event) => { event.preventDefault(); void load(1, search); }}><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mijoz, telefon yoki chat raqami..."/><button type="submit">Qidirish</button></form><span>{pagination.total} ta arxiv</span></div>
    {state.error ? <div className="admin-error"><div><strong>Arxiv yuklanmadi</strong><p>{state.error}</p></div><button type="button" onClick={() => load(pagination.page, search)}>Qayta urinish</button></div> : null}
    <section className="admin-resource-panel">
      {state.loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda</div> : state.items.length === 0 ? <div className="admin-empty"><Archive size={22}/><p>Yopilgan suhbatlar topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Mijoz</th><th>Operator</th><th>Oxirgi xabar</th><th>Xabarlar</th><th>Yopilgan vaqt</th><th/></tr></thead><tbody>{state.items.map((item) => <tr key={item.id}><td><div className="resource-title"><span>{item.customerName.charAt(0)}</span><div><strong>{item.customerName}</strong><small>{item.customerPhone || `#${item.publicId}`}</small></div></div></td><td>{item.operator}</td><td className="record-detail-cell">{item.lastMessage}</td><td><span className="resource-badge"><MessageSquareText size={12}/>{item.messageCount}</span></td><td>{dateFormat.format(new Date(item.closedAt || item.lastMessageAt))}</td><td><div className="resource-actions"><button type="button" onClick={() => void openConversation(item)} aria-label={`${item.customerName} yozishmalarini ochish`}><Eye size={15}/></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {pagination.pages > 1 ? <nav className="admin-pagination" aria-label="Arxiv sahifalari"><button type="button" onClick={() => load(pagination.page - 1, search)} disabled={state.loading || pagination.page <= 1}><ChevronLeft size={16}/></button><span>{pagination.page} / {pagination.pages}</span><button type="button" onClick={() => load(pagination.page + 1, search)} disabled={state.loading || pagination.page >= pagination.pages}><ChevronRight size={16}/></button></nav> : null}
    {active ? <AdminModal title={`#${active.publicId} · ${active.customer.name}`} subtitle="YOPILGAN SUHBAT" onClose={() => { setActive(null); setDetailError(""); }}>
      {detailLoading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yozishmalar yuklanmoqda</div> : active.messages.length === 0 && detailError ? <div className="admin-error admin-archive-error"><div><strong>Chat yuklanmadi</strong><p>{detailError}</p></div></div> : <>{detailError ? <div className="admin-error admin-archive-error"><div><strong>Eski xabarlar yuklanmadi</strong><p>{detailError}</p></div></div> : null}<ArchiveConversation conversation={active} loadingOlder={loadingOlder} onLoadOlder={loadOlder}/></>} 
    </AdminModal> : null}
  </main>;
}
