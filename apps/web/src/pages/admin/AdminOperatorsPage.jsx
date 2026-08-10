import { useCallback, useEffect, useState } from "react";
import { Bot, Edit3, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField, FormToggle } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";

const emptyForm = { email: "", password: "", displayName: "", avatarUrl: "", status: "OFFLINE", active: true, telegramUserId: "", telegramUsername: "", telegramEnabled: true };
const statusLabels = { ONLINE: "Online", AWAY: "Tanaffus", OFFLINE: "Offline" };

export function AdminOperatorsPage() {
  const [items, setItems] = useState([]);
  const [botStatus, setBotStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingBot, setSettingBot] = useState(false);
  const { confirm, notify } = useAdminUi();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [operators, telegram] = await Promise.all([api.get("/admin/operators"), api.get("/admin/telegram/status")]);
      setItems(operators.data.data);
      setBotStatus(telegram.data.data);
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
    setForm({ ...emptyForm, email: item.user.email, password: "", displayName: item.displayName, avatarUrl: item.avatarUrl || "", status: item.status, active: item.user.active, telegramUserId: item.telegram?.telegramUserId || "", telegramUsername: item.telegram?.username || "", telegramEnabled: item.telegram?.enabled ?? true });
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
      if (editing) await api.patch(`/admin/operators/${editing.id}`, form);
      else await api.post("/admin/operators", form);
      const operatorName = form.displayName;
      close();
      await load();
      notify({ tone: "success", title: wasEditing ? "Operator yangilandi" : "Operator qo‘shildi", message: `${operatorName} uchun kirish va Telegram ruxsatlari saqlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Operator saqlanmadi", message: requestError.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const approved = await confirm({
      title: "Operator butunlay o‘chirilsinmi?",
      description: `${item.displayName} profili, login hisobi va Telegram ulanishi bazadan butunlay o‘chadi.`,
      note: "Bu amalni ortga qaytarib bo‘lmaydi. Ochiq chatlar navbatga qaytariladi, yozishmalar matni saqlanadi.",
      confirmLabel: "Butunlay o‘chirish"
    });
    if (!approved) return;
    setDeletingId(item.id);
    setError("");
    try {
      await api.delete(`/admin/operators/${item.id}`);
      setItems((current) => current.filter((operator) => operator.id !== item.id));
      setBotStatus((current) => current ? {
        ...current,
        registeredOperators: Math.max(0, current.registeredOperators - (item.telegram ? 1 : 0)),
        verifiedOperators: Math.max(0, current.verifiedOperators - (item.telegram?.verifiedAt ? 1 : 0))
      } : current);
      notify({ tone: "success", title: "Operator butunlay o‘chirildi", message: `${item.displayName} hisobi va Telegram ulanishi bazadan olib tashlandi.` });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Operatorni o‘chirish bajarilmadi", message: requestError.message });
    } finally {
      setDeletingId(null);
    }
  };

  const setupBot = async () => {
    setSettingBot(true);
    setError("");
    try {
      await api.post("/admin/telegram/setup");
      await load();
      notify({ tone: "success", title: "Telegram webhook ulandi", message: "Bot yangi buyruq va xabarlarni qabul qilishga tayyor." });
    } catch (requestError) {
      setError(requestError.message);
      notify({ tone: "danger", title: "Webhook ulanmagan", message: requestError.message });
    } finally {
      setSettingBot(false);
    }
  };

  return (
    <main className="admin-content admin-resource-page">
      <div className="admin-page-head"><div><p>TEAM · ACCESS CONTROL</p><h1>Operatorlar</h1><span>Operator hisoblari va Telegram ruxsatlarini boshqaring.</span></div><button type="button" onClick={openCreate}><Plus size={15}/> Operator</button></div>
      {error ? <div className="admin-error" role="alert"><strong>{error}</strong><button type="button" onClick={load}>Qayta urinish</button></div> : null}
      <section className={`telegram-status-card ${botStatus?.configured ? "is-ready" : ""}`}><div className="telegram-status-icon"><Bot/></div><div><p>TELEGRAM OPERATOR BOT</p><h2>{botStatus?.configured ? "Server konfiguratsiyasi tayyor" : "Environment sozlanmagan"}</h2><span>{botStatus?.configured ? `${botStatus.verifiedOperators}/${botStatus.registeredOperators} operator botni /start orqali tasdiqlagan` : "Token, webhook secret va HTTPS webhook URL kiriting."}</span>{botStatus?.webhook?.lastErrorMessage ? <small>{botStatus.webhook.lastErrorMessage}</small> : null}</div><button type="button" disabled={!botStatus?.configured || settingBot} onClick={setupBot}>{settingBot ? <LoaderCircle className="admin-spin" size={15}/> : <RefreshCw size={15}/>} {settingBot ? "Ulanmoqda..." : "Webhookni ulash"}</button></section>
      <section className="admin-resource-panel">
        {loading ? <div className="admin-resource-loading"><LoaderCircle className="admin-spin" size={18}/> Yuklanmoqda...</div> : items.length === 0 ? <div className="admin-empty"><UserRound/><p>Operator topilmadi.</p></div> : <div className="admin-resource-table"><table><thead><tr><th>Operator</th><th>Holat</th><th>Telegram</th><th>Yuklama</th><th>Hisob</th><th>Amallar</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className={!item.user.active ? "is-muted" : ""}><td><div className="resource-title">{item.avatarUrl ? <img src={item.avatarUrl} alt=""/> : <span>{item.displayName.charAt(0)}</span>}<div><strong>{item.displayName}</strong><small>{item.user.email}</small></div></div></td><td><i className={`presence presence-${item.status.toLowerCase()}`}/>{statusLabels[item.status]}</td><td>{item.telegram ? <div className="telegram-link-state"><ShieldCheck size={15}/><span>{item.telegram.verifiedAt ? "Ulangan" : "/start kutilmoqda"}<small>{item.telegram.telegramUserId}</small></span></div> : "Kiritilmagan"}</td><td>{item._count.conversations} chat · {item._count.messages} javob</td><td><span className={`resource-badge ${item.user.active ? "is-active" : ""}`}>{item.user.active ? "Faol" : "Faolsiz"}</span></td><td><div className="resource-actions"><button type="button" onClick={() => openEdit(item)} aria-label={`${item.displayName} operatorini tahrirlash`} title={item.user.active ? "Tahrirlash" : "Tahrirlash yoki qayta faollashtirish"}><Edit3 size={15}/></button><button type="button" className="is-danger" onClick={() => remove(item)} disabled={deletingId === item.id} aria-label={`${item.displayName} operatorini butunlay o‘chirish`} title="Butunlay o‘chirish">{deletingId === item.id ? <LoaderCircle className="admin-spin" size={15}/> : <Trash2 size={15}/>}</button></div></td></tr>)}</tbody></table></div>}
      </section>
      {modalOpen ? <AdminModal title={editing ? "Operatorni tahrirlash" : "Yangi operator"} subtitle="TEAM ACCESS" onClose={close}><form className="admin-resource-form" onSubmit={save}><div className="admin-form-grid"><FormField label="Ism"><input required minLength="2" value={form.displayName} onChange={(event) => set("displayName", event.target.value)}/></FormField><FormField label="Email"><input type="email" required value={form.email} onChange={(event) => set("email", event.target.value)}/></FormField><FormField label={editing ? "Yangi parol (ixtiyoriy)" : "Vaqtinchalik parol"} hint="Kamida 12 belgi"><input type="password" required={!editing} minLength="12" value={form.password} onChange={(event) => set("password", event.target.value)}/></FormField><FormField label="Operator holati"><select value={form.status} onChange={(event) => set("status", event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField><FormField label="Avatar URL" wide><input type="url" value={form.avatarUrl} onChange={(event) => set("avatarUrl", event.target.value)}/></FormField><div className="admin-form-divider is-wide"><span>Telegram bot ruxsati</span></div><FormField label="Telegram User ID" hint="Operator @userinfobot orqali oladi"><input inputMode="numeric" pattern="[0-9]{5,20}" value={form.telegramUserId} onChange={(event) => set("telegramUserId", event.target.value.replace(/\D/g, ""))}/></FormField><FormField label="Telegram username"><input value={form.telegramUsername} onChange={(event) => set("telegramUsername", event.target.value.replace(/^@/, ""))} placeholder="username"/></FormField></div><div className="admin-form-options"><FormToggle label="Hisob faol" checked={form.active} onChange={(value) => set("active", value)}/><FormToggle label="Telegram ruxsati faol" checked={form.telegramEnabled} onChange={(value) => set("telegramEnabled", value)}/></div><footer><button type="button" onClick={close} disabled={saving}>Bekor qilish</button><button type="submit" disabled={saving}>{saving ? <><LoaderCircle className="admin-spin" size={15}/> Saqlanmoqda...</> : "Saqlash"}</button></footer></form></AdminModal> : null}
    </main>
  );
}
