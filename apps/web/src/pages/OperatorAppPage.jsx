import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, CheckCheck, ChevronRight, CircleDot, Clock3, LoaderCircle, LockKeyhole, MessageCircle, Power, RefreshCw, Send, Sparkles, UsersRound, X } from "lucide-react";
import { io } from "socket.io-client";
import { operatorApi, telegramInitData } from "../services/operator-api.js";
import "../styles/operator-app.css";

const statusLabels = { ONLINE: "Online", AWAY: "Tanaffus", OFFLINE: "Offline" };

function mergeMessages(current, incoming) {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...list.filter((item) => item?.id && !ids.has(item.id))]
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
}

function timeLabel(value) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(date)
    : new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "short" }).format(date);
}

function Receipt({ status }) {
  return status === "READ" ? <CheckCheck size={13}/> : <Check size={13}/>;
}

function EmptyQueue({ tab }) {
  return <div className="ops-empty"><span><Sparkles size={21}/></span><h3>{tab === "waiting" ? "Navbat toza" : "Faol chat yo‘q"}</h3><p>{tab === "waiting" ? "Yangi mijoz yozishi bilan shu yerda real vaqtda ko‘rinadi." : "Navbatdan suhbat qabul qilganingizda shu bo‘limga o‘tadi."}</p></div>;
}

function ConversationCard({ item, mine, busy, onAction }) {
  return (
    <motion.button className="ops-chat-card" type="button" onClick={() => onAction(item)} whileTap={{ scale: 0.985 }} disabled={busy}>
      <span className="ops-customer-avatar">{item.customerName.charAt(0).toUpperCase()}</span>
      <span className="ops-card-copy"><span><strong>{item.customerName}</strong><time>{timeLabel(item.lastMessageAt)}</time></span><b>#{item.publicId}</b><p>{item.lastMessage}</p></span>
      <span className={`ops-card-action ${mine ? "is-open" : ""}`}>{busy ? <LoaderCircle className="ops-spin" size={17}/> : mine ? <ChevronRight size={18}/> : "Qabul"}</span>
    </motion.button>
  );
}

export function OperatorAppPage() {
  const [workspace, setWorkspace] = useState(null);
  const [tab, setTab] = useState("waiting");
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [notice, setNotice] = useState(null);
  const socketRef = useRef(null);
  const conversationRef = useRef(null);
  const endRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const telegram = window.Telegram?.WebApp;
  const initData = telegramInitData();
  const hasConversation = Boolean(conversation);

  const showNotice = useCallback((message, tone = "info") => {
    setNotice({ message, tone, id: Date.now() });
  }, []);

  const loadWorkspace = useCallback(async ({ quiet = false } = {}) => {
    if (!initData) {
      setError("Operator panelini Telegram bot ichidagi tugma orqali oching.");
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      const { data } = await operatorApi.get("/operator-app/bootstrap");
      setWorkspace(data.data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [initData]);

  useEffect(() => {
    if (!telegram) return;
    telegram.ready();
    telegram.expand();
    telegram.setHeaderColor?.("#090b0e");
    telegram.setBackgroundColor?.("#090b0e");
    telegram.setBottomBarColor?.("#090b0e");
    telegram.disableVerticalSwipes?.();
  }, [telegram]);

  useEffect(() => {
    if (!telegram) return undefined;
    const refresh = () => void loadWorkspace({ quiet: true });
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    telegram.onEvent?.("activated", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      telegram.offEvent?.("activated", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadWorkspace, telegram]);

  useEffect(() => {
    if (!telegram) return undefined;
    const goBack = () => setConversation(null);
    if (hasConversation) {
      telegram.BackButton?.show();
      telegram.BackButton?.onClick(goBack);
    } else {
      telegram.BackButton?.hide();
    }
    return () => telegram.BackButton?.offClick(goBack);
  }, [hasConversation, telegram]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }, [conversation?.messages, reduceMotion]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 3600);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!initData) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { transports: ["websocket", "polling"], withCredentials: true });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("operator:join", { initData }, (result) => {
      if (!result?.success) setError(result?.error || "Real vaqt kanaliga ulanish rad etildi.");
    }));
    socket.on("queue:updated", () => void loadWorkspace({ quiet: true }));
    socket.on("queue:claimed", ({ publicId, operator }) => {
      void loadWorkspace({ quiet: true });
      if (conversationRef.current?.publicId === publicId && conversationRef.current.operator?.id !== operator.id) {
        setConversation(null);
        showNotice(`${operator.name} bu chatni qabul qildi.`, "info");
      }
    });
    socket.on("message:new", (message) => setConversation((current) => current ? { ...current, messages: mergeMessages(current.messages, message), lastMessageAt: message.createdAt } : current));
    socket.on("conversation:closed", ({ publicId }) => {
      setConversation((current) => current?.publicId === publicId ? null : current);
      void loadWorkspace({ quiet: true });
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [initData, loadWorkspace, showNotice]);

  useEffect(() => {
    if (!conversation?.publicId || !socketRef.current) return;
    socketRef.current.emit("operator:conversation:join", { publicId: conversation.publicId }, (result) => {
      if (!result?.success) showNotice(result?.error || "Chatning real vaqt kanaliga ulanib bo‘lmadi.", "danger");
    });
  }, [conversation?.publicId, showNotice]);

  const list = tab === "waiting" ? workspace?.waiting || [] : workspace?.mine || [];

  const openConversation = async (item) => {
    setBusyId(item.publicId);
    try {
      const { data } = await operatorApi.get(`/operator-app/conversations/${item.publicId}`);
      setConversation(data.data);
    } catch (requestError) {
      showNotice(requestError.message, "danger");
      void loadWorkspace({ quiet: true });
    } finally { setBusyId(null); }
  };

  const claimConversation = async (item) => {
    setBusyId(item.publicId);
    try {
      const { data } = await operatorApi.post(`/operator-app/conversations/${item.publicId}/claim`);
      setConversation(data.data);
      setTab("mine");
      telegram?.HapticFeedback?.notificationOccurred("success");
      showNotice("Suhbat sizga biriktirildi.", "success");
      await loadWorkspace({ quiet: true });
    } catch (requestError) {
      telegram?.HapticFeedback?.notificationOccurred("error");
      showNotice(requestError.message, "danger");
      await loadWorkspace({ quiet: true });
    } finally { setBusyId(null); }
  };

  const sendReply = async () => {
    const content = draft.trim();
    if (!content || !conversation || sending) return;
    setSending(true);
    setDraft("");
    try {
      const { data } = await operatorApi.post(`/operator-app/conversations/${conversation.publicId}/messages`, { content });
      setConversation((current) => current ? { ...current, messages: mergeMessages(current.messages, data.data.message) } : current);
      telegram?.HapticFeedback?.impactOccurred("light");
      void loadWorkspace({ quiet: true });
    } catch (requestError) {
      setDraft(content);
      showNotice(requestError.message, "danger");
    } finally { setSending(false); }
  };

  const closeConversation = async () => {
    if (!conversation) return;
    setSending(true);
    try {
      await operatorApi.post(`/operator-app/conversations/${conversation.publicId}/close`);
      telegram?.HapticFeedback?.notificationOccurred("success");
      setConfirmClose(false);
      setConversation(null);
      showNotice("Suhbat yopildi.", "success");
      await loadWorkspace({ quiet: true });
    } catch (requestError) {
      showNotice(requestError.message, "danger");
    } finally { setSending(false); }
  };

  const changePresence = async (status) => {
    try {
      const { data } = await operatorApi.patch("/operator-app/presence", { status });
      setWorkspace((current) => current ? { ...current, operator: { ...current.operator, status: data.data.status } } : current);
      telegram?.HapticFeedback?.selectionChanged();
    } catch (requestError) { showNotice(requestError.message, "danger"); }
  };

  if (loading) return <main className="ops-app ops-center"><div className="ops-loader"><span>NOVA<i>.</i></span><LoaderCircle className="ops-spin"/><p>Operator workspace tayyorlanmoqda</p></div></main>;
  if (error && !workspace) return <main className="ops-app ops-center"><div className="ops-gate"><span><LockKeyhole/></span><p>SECURE OPERATOR ACCESS</p><h1>Panel Telegram ichida ochiladi.</h1><small>{error}</small><button type="button" onClick={() => loadWorkspace()}><RefreshCw size={16}/> Qayta tekshirish</button></div></main>;

  return (
    <main className="ops-app">
      <div className="ops-ambient"/>
      <header className="ops-header"><div className="ops-brand"><span>NOVA<i>.</i></span><small>OPERATOR SYSTEM</small></div><button type="button" className="ops-refresh" onClick={() => loadWorkspace({ quiet: true })} aria-label="Navbatni yangilash"><RefreshCw size={17}/></button></header>
      <section className="ops-profile"><div className="ops-profile-main"><span className="ops-profile-avatar">{workspace.operator.name.charAt(0)}</span><div><p>ASSALOMU ALAYKUM</p><h1>{workspace.operator.name}</h1><small>@{workspace.operator.telegramUsername || "operator"}</small></div></div><div className="ops-presence" aria-label="Operator holati">{Object.entries(statusLabels).map(([status, label]) => <button type="button" key={status} className={workspace.operator.status === status ? "is-active" : ""} onClick={() => changePresence(status)}><i className={`is-${status.toLowerCase()}`}/>{label}</button>)}</div></section>
      <section className="ops-metrics"><article><span><Clock3 size={17}/></span><div><strong>{workspace.stats.waiting}</strong><small>Navbatda</small></div></article><article><span><MessageCircle size={17}/></span><div><strong>{workspace.stats.mine}</strong><small>Mening chatlarim</small></div></article><article><span><CircleDot size={17}/></span><div><strong>{workspace.operator.status === "ONLINE" ? "Live" : statusLabels[workspace.operator.status]}</strong><small>Joriy holat</small></div></article></section>
      <nav className="ops-tabs"><button type="button" className={tab === "waiting" ? "is-active" : ""} onClick={() => setTab("waiting")}><UsersRound size={16}/> Umumiy navbat <b>{workspace.stats.waiting}</b></button><button type="button" className={tab === "mine" ? "is-active" : ""} onClick={() => setTab("mine")}><MessageCircle size={16}/> Mening chatlarim <b>{workspace.stats.mine}</b></button></nav>
      <section className="ops-list-head"><div><p>{tab === "waiting" ? "LIVE QUEUE" : "ASSIGNED TO YOU"}</p><h2>{tab === "waiting" ? "Yangi murojaatlar" : "Faol suhbatlar"}</h2></div><span><i/> REAL TIME</span></section>
      <section className="ops-chat-list">{list.length ? list.map((item) => <ConversationCard key={item.publicId} item={item} mine={tab === "mine"} busy={busyId === item.publicId} onAction={tab === "mine" ? openConversation : claimConversation}/>) : <EmptyQueue tab={tab}/>}</section>

      <AnimatePresence>{conversation ? <motion.section className="ops-conversation" initial={reduceMotion ? false : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
        <header><button type="button" onClick={() => setConversation(null)} aria-label="Navbatga qaytish"><ArrowLeft/></button><div><strong>{conversation.customer.name}</strong><span>#{conversation.publicId} · LIVE</span></div><button type="button" className="is-close" onClick={() => setConfirmClose(true)} aria-label="Suhbatni yopish"><Power size={18}/></button></header>
        <div className="ops-customer-strip"><span>{conversation.customer.name.charAt(0)}</span><div><small>MIJOZ</small><strong>{conversation.customer.name}</strong></div><p>{conversation.customer.phone || conversation.customer.telegram || "Sayt tashrifchisi"}</p></div>
        <div className="ops-messages">{conversation.messages.map((message) => <div key={message.id} className={`ops-message is-${message.senderType.toLowerCase()}`}><p>{message.content}</p><footer><time>{timeLabel(message.createdAt)}</time>{message.senderType === "OPERATOR" ? <Receipt status={message.status}/> : null}</footer></div>)}<div ref={endRef}/></div>
        <div className="ops-composer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendReply(); } }} placeholder="Mijozga javob yozing..." rows="1" maxLength="2000" disabled={sending}/><button type="button" onClick={sendReply} disabled={!draft.trim() || sending} aria-label="Javobni yuborish">{sending ? <LoaderCircle className="ops-spin" size={18}/> : <Send size={18}/>}</button></div>
      </motion.section> : null}</AnimatePresence>

      <AnimatePresence>{confirmClose ? <motion.div className="ops-dialog-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="ops-dialog" role="alertdialog" aria-modal="true" initial={{ y: 18, scale: .97 }} animate={{ y: 0, scale: 1 }}><button type="button" className="ops-dialog-x" onClick={() => setConfirmClose(false)}><X size={18}/></button><span><Power size={21}/></span><p>SUHBATNI YOPISH</p><h2>Muloqot yakunlandimi?</h2><small>Mijoz boshqa xabar yubora olmaydi. Yozishmalar tarixi saqlanadi.</small><footer><button type="button" onClick={() => setConfirmClose(false)}>Davom ettirish</button><button type="button" onClick={closeConversation} disabled={sending}>Yopish</button></footer></motion.section></motion.div> : null}</AnimatePresence>
      <AnimatePresence>{notice ? <motion.div key={notice.id} className={`ops-notice is-${notice.tone}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span>{notice.tone === "success" ? <CheckCheck size={17}/> : <CircleDot size={17}/>}</span>{notice.message}</motion.div> : null}</AnimatePresence>
    </main>
  );
}
