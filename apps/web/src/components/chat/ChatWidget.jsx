import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCheck, ChevronDown, MessageCircle, Send, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { api } from "../../services/api.js";

const VISITOR_KEY = "nova_visitor_id";

function visitorId() {
  const current = localStorage.getItem(VISITOR_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, created);
  return created;
}

function mergeMessages(current, incoming) {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const known = new Set(current.map((message) => message.id));
  return [...current, ...list.filter((message) => message?.id && !known.has(message.id))]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function timeLabel(value) {
  return new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function Receipt({ status }) {
  if (status === "sending") return <span className="chat-sending-dot" aria-label="Yuborilmoqda"/>;
  if (status === "READ") return <CheckCheck size={13} aria-label="O‘qildi"/>;
  return <Check size={13} aria-label="Yuborildi"/>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [presence, setPresence] = useState({ status: "OFFLINE", name: "NOVA yordam markazi", chatMode: "WAITING" });
  const [closed, setClosed] = useState(false);
  const socketRef = useRef(null);
  const openRef = useRef(open);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const customerId = useMemo(visitorId, []);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { if (open) setUnread(0); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }, [messages, open, reduceMotion]);

  useEffect(() => {
    if (!session) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { transports: ["websocket", "polling"], withCredentials: true });
    socketRef.current = socket;
    const joinConversation = () => {
      socket.emit("conversation:join", { visitorId: customerId, publicId: session.publicId }, (result) => {
        if (!result?.success) setError("Jonli chatga ulanish rad etildi.");
      });
    };
    socket.on("connect", joinConversation);
    socket.on("message:new", (message) => {
      setMessages((current) => mergeMessages(current, message));
      if (message.senderType !== "CUSTOMER" && !openRef.current) setUnread((value) => value + 1);
    });
    socket.on("operator:presence", (value) => setPresence(value));
    socket.on("conversation:read", ({ reader }) => {
      if (reader === "OPERATOR") setMessages((current) => current.map((message) => message.senderType === "CUSTOMER" ? { ...message, status: "READ" } : message));
    });
    socket.on("conversation:closed", () => setClosed(true));
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [session, customerId]);

  useEffect(() => {
    if (!open || !session) return;
    api.patch(`/chat/${session.publicId}/read`, { visitorId: customerId }).catch(() => {});
  }, [open, session, messages.length, customerId]);

  const openWidget = async () => {
    setOpen(true);
    if (session || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/chat/session", { visitorId: customerId, sourcePath: `${window.location.pathname}${window.location.search}` });
      setSession(data.data);
      setClosed(data.data.status === "CLOSED");
      setMessages(data.data.messages || []);
      setPresence({ ...data.data.operator, chatMode: data.data.chatMode });
      window.setTimeout(() => inputRef.current?.focus(), 100);
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoading(false); }
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !session || sending || closed) return;
    const temporaryId = `temporary-${Date.now()}`;
    const optimistic = { id: temporaryId, senderType: "CUSTOMER", content, type: "TEXT", status: "sending", createdAt: new Date().toISOString() };
    setDraft("");
    setSending(true);
    setError("");
    setMessages((current) => [...current, optimistic]);
    socketRef.current?.emit("typing:stop");
    try {
      const { data } = await api.post(`/chat/${session.publicId}/messages`, { visitorId: customerId, content });
      setMessages((current) => mergeMessages(current.filter((message) => message.id !== temporaryId), [data.data.message, data.data.autoReply].filter(Boolean)));
    } catch (requestError) {
      setMessages((current) => current.map((message) => message.id === temporaryId ? { ...message, status: "FAILED" } : message));
      setError(requestError.message);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); }
  };

  return (
    <div className="chat-widget">
      <AnimatePresence>
        {open && (
          <motion.section className="chat-panel" aria-label="NOVA bilan jonli chat" initial={reduceMotion ? false : { opacity: 0, y: 22, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .98 }} transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}>
            <header className="chat-head">
              <div className="chat-operator-avatar"><span>N</span><i className={`presence-${presence.status?.toLowerCase()}`}/></div>
              <div><strong>{presence.name || "NOVA operator"}</strong><p>{presence.chatMode === "WAITING" ? "Operator javobi kutilmoqda" : presence.status === "ONLINE" ? "Operator online" : presence.status === "AWAY" ? "Operator tanaffusda" : "Operator hozir offline"}</p></div>
              <button onClick={() => setOpen(false)} aria-label="Chatni yopish"><ChevronDown size={20}/></button>
            </header>
            <div className="chat-context"><span className={presence.chatMode === "LIVE" ? "is-live" : presence.chatMode === "WAITING" ? "is-waiting" : ""}>{presence.chatMode === "LIVE" ? "LIVE SUPPORT" : presence.chatMode === "WAITING" ? "NAVBATDA" : "OFFLINE MODE"}</span><small>#{session?.publicId || "YUKLANMOQDA"}</small></div>
            <div className="chat-messages" aria-live="polite">
              {loading && <div className="chat-loading"><i/><i/><i/><p>Suhbat ochilmoqda</p></div>}
              {!loading && error && !session && <div className="chat-state"><WifiOff size={20}/><p>{error}</p><button onClick={openWidget}>Qayta ulanish</button></div>}
              {!loading && session && messages.length === 0 && <div className="chat-state"><MessageCircle size={20}/><p>Savolingizni yozing. Operator sizga shu yerda javob beradi.</p></div>}
              {messages.map((message) => <motion.div key={message.id} className={`chat-message ${message.senderType === "CUSTOMER" ? "is-customer" : "is-operator"} ${message.status === "FAILED" ? "is-failed" : ""}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p>{message.content}</p><footer><time>{timeLabel(message.createdAt)}</time>{message.senderType === "CUSTOMER" && <Receipt status={message.status}/>}</footer>
              </motion.div>)}
              <div ref={endRef}/>
            </div>
            {error && session && <div className="chat-inline-error" role="alert">{error}</div>}
            <div className="chat-composer">
              <textarea ref={inputRef} value={draft} onChange={(event) => { setDraft(event.target.value); socketRef.current?.emit(event.target.value ? "typing:start" : "typing:stop"); }} onKeyDown={onKeyDown} placeholder={closed ? "Suhbat operator tomonidan yopildi" : "Xabaringizni yozing…"} maxLength={2000} rows={1} disabled={!session || sending || closed} aria-label="Chat xabari"/>
              <button onClick={sendMessage} disabled={!draft.trim() || !session || sending || closed} aria-label="Xabarni yuborish"><Send size={18}/></button>
            </div>
            <div className="chat-footnote">ENTER — yuborish · SHIFT + ENTER — yangi qator</div>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button className={`chat-launcher ${open ? "is-open" : ""}`} onClick={open ? () => setOpen(false) : openWidget} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: .96 }} aria-label={open ? "Chatni yopish" : "NOVA bilan chatni ochish"} aria-expanded={open}>
        <span>{open ? <ChevronDown size={22}/> : <MessageCircle size={21}/>}</span><b>{open ? "Yopish" : "Savolingiz bormi?"}</b>
        {unread > 0 && <motion.i initial={{ scale: 0 }} animate={{ scale: 1 }} aria-label={`${unread} ta o‘qilmagan xabar`}>{Math.min(unread, 9)}</motion.i>}
      </motion.button>
    </div>
  );
}
