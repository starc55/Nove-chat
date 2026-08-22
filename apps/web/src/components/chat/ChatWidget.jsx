import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  CheckCheck,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  Send,
  UserRound,
  WifiOff,
} from "lucide-react";
import { MdOutlineSupportAgent } from "react-icons/md";
import { io } from "socket.io-client";
import { api } from "../../services/api.js";
import {
  getVisitorId,
  getVisitorProfile,
  saveVisitorProfile,
} from "../../services/visitor.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { localeFor } from "../../i18n/landing.js";
import { BrandLogo } from "../common/BrandLogo.jsx";

function mergeMessages(current, incoming) {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const known = new Set(current.map((message) => message.id));
  return [
    ...current,
    ...list.filter((message) => message?.id && !known.has(message.id)),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function timeLabel(value, language) {
  return new Intl.DateTimeFormat(localeFor(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function Receipt({ status, t }) {
  if (status === "sending")
    return <span className="chat-sending-dot" aria-label={t.sending} />;
  return status === "READ" ? (
    <CheckCheck size={13} aria-label={t.read} />
  ) : (
    <Check size={13} aria-label={t.sent} />
  );
}

export function ChatWidget() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [identity, setIdentity] = useState(() => {
    const profile = getVisitorProfile();
    return { name: profile?.name || "", phone: profile?.phone || "" };
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [presence, setPresence] = useState({
    status: "OFFLINE",
    name: null,
    chatMode: "WAITING",
  });
  const [closed, setClosed] = useState(false);
  const socketRef = useRef(null);
  const openRef = useRef(open);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const customerId = useMemo(getVisitorId, []);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);
  useEffect(() => {
    document.body.classList.toggle("chat-open", open);
    return () => document.body.classList.remove("chat-open");
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, open, reduceMotion]);

  useEffect(() => {
    if (!session) return undefined;
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || window.location.origin,
      { transports: ["websocket", "polling"], withCredentials: true }
    );
    socketRef.current = socket;
    socket.on("connect", () =>
      socket.emit(
        "conversation:join",
        { visitorId: customerId, publicId: session.publicId },
        (result) => !result?.success && setError(t.connectionRejected)
      )
    );
    socket.on("message:new", (message) => {
      setMessages((current) => mergeMessages(current, message));
      if (message.senderType !== "CUSTOMER" && !openRef.current)
        setUnread((value) => value + 1);
    });
    socket.on("operator:presence", setPresence);
    socket.on("conversation:read", ({ reader }) => {
      if (reader === "OPERATOR")
        setMessages((current) =>
          current.map((message) =>
            message.senderType === "CUSTOMER"
              ? { ...message, status: "READ" }
              : message
          )
        );
    });
    socket.on("conversation:closed", () => setClosed(true));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, customerId, t.connectionRejected]);

  useEffect(() => {
    if (!open || !session) return;
    api
      .patch(`/chat/${session.publicId}/read`, { visitorId: customerId })
      .catch(() => {});
  }, [open, session, messages.length, customerId]);

  const connectChat = async (profile) => {
    if (session || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/chat/session", {
        visitorId: customerId,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        name: profile.name,
        phone: profile.phone,
      });
      setSession(data.data);
      setClosed(data.data.status === "CLOSED");
      setMessages(data.data.messages || []);
      setPresence({ ...data.data.operator, chatMode: data.data.chatMode });
      window.setTimeout(() => inputRef.current?.focus(), 100);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const openWidget = () => {
    setOpen(true);
    const profile = getVisitorProfile();
    if (profile) void connectChat(profile);
  };
  const submitIdentity = (event) => {
    event.preventDefault();
    const profile = saveVisitorProfile(identity);
    void connectChat(profile);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !session || sending || closed) return;
    const temporaryId = `temporary-${Date.now()}`;
    setDraft("");
    setSending(true);
    setError("");
    setMessages((current) => [
      ...current,
      {
        id: temporaryId,
        senderType: "CUSTOMER",
        content,
        type: "TEXT",
        status: "sending",
        createdAt: new Date().toISOString(),
      },
    ]);
    socketRef.current?.emit("typing:stop");
    try {
      const { data } = await api.post(`/chat/${session.publicId}/messages`, {
        visitorId: customerId,
        content,
      });
      setMessages((current) =>
        mergeMessages(
          current.filter((message) => message.id !== temporaryId),
          [data.data.message, data.data.autoReply].filter(Boolean)
        )
      );
    } catch (requestError) {
      setMessages((current) =>
        current.map((message) =>
          message.id === temporaryId
            ? { ...message, status: "FAILED" }
            : message
        )
      );
      setError(requestError.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chat-widget" data-lenis-prevent>
      <AnimatePresence>
        {open ? (
          <motion.section
            className="chat-panel"
            aria-label={t.liveChatLabel}
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
          >
            <header className="chat-head">
              <div className="chat-operator-avatar">
                <BrandLogo symbolOnly />
                <i className={`presence-${presence.status?.toLowerCase()}`} />
              </div>
              <div>
                <strong>{presence.name || t.chatCenter}</strong>
                <p>
                  {presence.chatMode === "WAITING"
                    ? t.chatWaiting
                    : presence.status === "ONLINE"
                    ? t.chatLive
                    : t.chatOffline}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
              >
                <ChevronDown size={20} />
              </button>
            </header>
            <div className="chat-context">
              <span
                className={
                  presence.chatMode === "LIVE" ? "is-live" : "is-waiting"
                }
              >
                {presence.chatMode === "LIVE" ? t.chatLiveSupport : t.chatQueue}
              </span>
              <small>#{session?.publicId || "XION"}</small>
            </div>
            <div
              className="chat-messages"
              aria-live="polite"
              data-lenis-prevent
            >
              {!session && !loading ? (
                <form className="chat-identity" onSubmit={submitIdentity}>
                  <span>
                    <UserRound size={21} />
                  </span>
                  <h2>{t.chatWelcome}</h2>
                  <p>{t.chatIdentity}</p>
                  <label>
                    <small>{t.name}</small>
                    <input
                      required
                      minLength="2"
                      maxLength="100"
                      autoComplete="name"
                      value={identity.name}
                      onChange={(event) =>
                        setIdentity((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <small>{t.phone}</small>
                    <input
                      required
                      type="tel"
                      pattern="[+0-9 ()-]{7,24}"
                      autoComplete="tel"
                      placeholder="+998 90 123 45 67"
                      value={identity.phone}
                      onChange={(event) =>
                        setIdentity((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button type="submit">{t.chatContinue}</button>
                </form>
              ) : null}
              {loading ? (
                <div className="chat-loading">
                  <LoaderCircle className="chat-spin" />
                  <p>{t.chatOpening}</p>
                </div>
              ) : null}
              {!loading && error && !session ? (
                <div className="chat-state">
                  <WifiOff size={20} />
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const profile = getVisitorProfile();
                      if (profile) void connectChat(profile);
                    }}
                  >
                    {t.reconnect}
                  </button>
                </div>
              ) : null}
              {!loading && session && messages.length === 0 ? (
                <div className="chat-state">
                  <MessageCircle size={20} />
                  <p>{t.chatWaiting}</p>
                </div>
              ) : null}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`chat-message ${
                    message.senderType === "CUSTOMER"
                      ? "is-customer"
                      : "is-operator"
                  } ${message.status === "FAILED" ? "is-failed" : ""}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p>{message.content}</p>
                  <footer>
                    <time>{timeLabel(message.createdAt, language)}</time>
                    {message.senderType === "CUSTOMER" ? (
                      <Receipt status={message.status} t={t} />
                    ) : null}
                  </footer>
                </motion.div>
              ))}
              <div ref={endRef} />
            </div>
            {error && session ? (
              <div className="chat-inline-error" role="alert">
                {error}
              </div>
            ) : null}
            <div className="chat-composer">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  socketRef.current?.emit(
                    event.target.value ? "typing:start" : "typing:stop"
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={closed ? t.chatClosed : t.chatPlaceholder}
                maxLength="2000"
                rows="1"
                disabled={!session || sending || closed}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!draft.trim() || !session || sending || closed}
                aria-label={t.sendMessage}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="chat-footnote">{t.chatHint}</div>
          </motion.section>
        ) : null}
      </AnimatePresence>
      <motion.button
        className={`chat-launcher ${open ? "is-open" : ""}`}
        type="button"
        onClick={open ? () => setOpen(false) : openWidget}
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
        aria-expanded={open}
      >
        <span>
          {open ? <ChevronDown size={22} /> : <MdOutlineSupportAgent size={29}/>}
        </span>
        {/* <b>{open ? t.close : t.chatLaunch}</b> */}
        {unread > 0 ? <i>{Math.min(unread, 9)}</i> : null}
      </motion.button>
    </div>
  );
}
