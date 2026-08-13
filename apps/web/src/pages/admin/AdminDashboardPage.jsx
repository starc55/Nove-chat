import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Award, CircleDot, Clock3, Layers3, Megaphone, MessageCircle, Package, ShoppingBag, Star, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { ADMIN_BASE } from "../../config/admin.js";

const kpiMeta = [
  ["conversationsToday", "Bugungi suhbatlar", MessageCircle], ["openChats", "Ochiq chatlar", CircleDot],
  ["waitingChats", "Kutilayotgan chatlar", Clock3], ["offlineLeads", "Yangi offline lead", UsersRound],
  ["onlineOperators", "Online operatorlar", Activity], ["totalProducts", "Faol mahsulotlar", Package],
  ["activeAdvertisements", "Faol reklamalar", Megaphone], ["averageRating", "O‘rtacha baho", Star],
  ["newReviews", "Yangi sharhlar", Award], ["newOrders", "Yangi buyurtmalar", ShoppingBag]
];
const statusLabels = { OPEN: "Ochiq", WAITING: "Kutilmoqda", ASSIGNED: "Biriktirilgan", CLOSED: "Yopilgan", NEW: "Yangi", CONTACTED: "Bog‘lanilgan", QUALIFIED: "Malakali", APPROVED: "Tasdiqlangan", PENDING: "Kutilmoqda", REJECTED: "Rad etilgan", ONLINE: "Online", AWAY: "Tanaffus", OFFLINE: "Offline" };
const todayLabel = new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short" }).format(new Date()).toUpperCase();

function relativeDate(date) {
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function EmptyRow({ text }) { return <div className="admin-empty"><Layers3 size={20}/><p>{text}</p></div>; }

export function AdminDashboardPage() {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const load = () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    api.get("/admin/dashboard").then(({ data }) => setState({ data: data.data, loading: false, error: "" })).catch((error) => setState({ data: null, loading: false, error: error.message }));
  };
  useEffect(load, []);

  return (
    <motion.main className="admin-content" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-page-head"><div><p>{todayLabel} · LIVE OVERVIEW</p><h1>Xayrli kun, {user?.name?.split(" ")[0]}.</h1><span>NOVA platformasining bugungi holati.</span></div><button onClick={load} disabled={state.loading}>Yangilash</button></div>
      <section className="admin-content-map" aria-label="Landing boshqaruvi">
        <Link to={`${ADMIN_BASE}/products`}><Package/><span><small>LANDING</small><strong>Mahsulotlar</strong><i>Tarif va sotib olish kartalari</i></span></Link>
        <Link to={`${ADMIN_BASE}/advertisements`}><Megaphone/><span><small>SWIPERS</small><strong>Bannerlar</strong><i>Hero va aksiyalar slaydlari</i></span></Link>
        <Link to={`${ADMIN_BASE}/reviews`}><Star/><span><small>MODERATION</small><strong>Sharhlar</strong><i>Tasdiqlash, rad etish, o‘chirish</i></span></Link>
        <Link to={`${ADMIN_BASE}/orders`}><ShoppingBag/><span><small>SALES</small><strong>Buyurtmalar</strong><i>Landing orqali kelgan arizalar</i></span></Link>
      </section>
      {state.error && <div className="admin-error" role="alert"><div><strong>Dashboard yuklanmadi</strong><p>{state.error}</p></div><button onClick={load}>Qayta urinish</button></div>}
      {state.loading && <div className="admin-kpi-grid" aria-label="Dashboard yuklanmoqda">{Array.from({ length: 9 }).map((_, index) => <div className="admin-kpi-skeleton" key={index}/>)}</div>}
      {state.data && <>
        <section className="admin-kpi-grid" aria-label="Asosiy ko‘rsatkichlar">
          {kpiMeta.map(([key, label, Icon], index) => <motion.article className="admin-kpi" key={key} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .035 }}><div><span>{label}</span><Icon size={18}/></div><strong>{key === "averageRating" && state.data.kpis[key] ? `${state.data.kpis[key]} / 5` : state.data.kpis[key]}</strong><small>{index < 5 ? "Real vaqt holati" : "Bazadagi faol yozuvlar"}</small></motion.article>)}
        </section>
        <section className="admin-dashboard-grid">
          <article className="admin-panel admin-panel--wide"><header><div><p>LIVE QUEUE</p><h2>So‘nggi suhbatlar</h2></div><span>{state.data.recentConversations.length} ta</span></header>
            {state.data.recentConversations.length === 0 ? <EmptyRow text="Hozircha suhbatlar yo‘q."/> : <div className="admin-table-wrap"><table><thead><tr><th>Mijoz</th><th>Holat</th><th>Operator</th><th>Oxirgi xabar</th><th>Vaqt</th></tr></thead><tbody>{state.data.recentConversations.map((item) => <tr key={item.id}><td><strong>{item.customer}</strong><small>#{item.publicId}</small></td><td><i className={`status-dot status-${item.status.toLowerCase()}`}/>{statusLabels[item.status]}</td><td>{item.operator}</td><td className="message-cell">{item.lastMessage}</td><td>{relativeDate(item.lastMessageAt)}</td></tr>)}</tbody></table></div>}
          </article>
          <article className="admin-panel"><header><div><p>TEAM</p><h2>Operatorlar</h2></div><Activity size={18}/></header>
            {state.data.operatorPerformance.length === 0 ? <EmptyRow text="Operatorlar qo‘shilmagan."/> : <div className="operator-list">{state.data.operatorPerformance.map((item) => <div key={item.id}><span className="operator-avatar">{item.name.charAt(0)}</span><div><strong>{item.name}</strong><small>{item.conversations} suhbat · {item.rating || "—"} baho</small></div><i className={`presence presence-${item.status.toLowerCase()}`} title={statusLabels[item.status]}/></div>)}</div>}
          </article>
          <article className="admin-panel"><header><div><p>LEADS</p><h2>Yangi murojaatlar</h2></div><UsersRound size={18}/></header>
            {state.data.recentLeads.length === 0 ? <EmptyRow text="Yangi leadlar yo‘q."/> : <div className="compact-list">{state.data.recentLeads.map((item) => <div key={item.id}><div><strong>{item.name}</strong><small>{item.phone}</small></div><span>{statusLabels[item.status]}</span></div>)}</div>}
          </article>
          <article className="admin-panel"><header><div><p>REVIEWS</p><h2>So‘nggi sharhlar</h2></div><Star size={18}/></header>
            {state.data.recentReviews.length === 0 ? <EmptyRow text="Yangi sharhlar yo‘q."/> : <div className="compact-list review-list">{state.data.recentReviews.map((item) => <div key={item.id}><div><strong>{item.customerName} · {item.rating}/5</strong><small>{item.comment}</small></div><span>{statusLabels[item.status]}</span></div>)}</div>}
          </article>
        </section>
      </>}
    </motion.main>
  );
}
