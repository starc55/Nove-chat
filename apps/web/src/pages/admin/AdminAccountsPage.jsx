import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  LoaderCircle,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { api } from "../../services/api.js";
import { AdminModal, FormField } from "../../components/admin/AdminModal.jsx";
import { useAdminUi } from "../../components/admin/AdminUi.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { AdminPasswordInput } from "../../components/admin/AdminPasswordInput.jsx";

const blankAdmin = { name: "", email: "", password: "" };

export function AdminAccountsPage() {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState(blankAdmin);
  const [password, setPassword] = useState({
    currentPassword: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useAdminUi();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/admins");
      setItems(data.data);
    } catch (error) {
      notify({
        tone: "danger",
        title: "Adminlar yuklanmadi",
        message:
          error.response?.status === 404
            ? "Backendning yangi versiyasi hali serverga chiqarilmagan. API deployini yangilang."
            : error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    void load();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/admin/admins", form);
      setItems((current) => [...current, data.data]);
      setOpen(false);
      setForm(blankAdmin);
      notify({
        tone: "success",
        title: "Admin qo‘shildi",
        message: `${data.data.email} tizimga kira oladi.`,
      });
    } catch (error) {
      notify({
        tone: "danger",
        title: "Admin qo‘shilmadi",
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch("/admin/admins/me/password", {
        ...password,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setPasswordOpen(false);
      setPassword({ currentPassword: "", password: "" });
      notify({
        tone: "success",
        title: "Hisob yangilandi",
        message: "Yangi login va parol bilan qayta kiring.",
      });
      await logout().catch(() => {});
    } catch (error) {
      notify({
        tone: "danger",
        title: "Hisob yangilanmadi",
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="admin-content admin-resource-page">
      <div className="admin-page-head">
        <div>
          <p>ACCESS CONTROL</p>
          <h1>Adminlar va xavfsizlik</h1>
          <span>
            Hisoblaringizni boshqaring. “Eslab qolish” tanlansa, keyingi
            kirishda sessiyangiz tiklanadi.
          </span>
        </div>
        <div className="admin-head-actions">
          <button type="button" onClick={() => setPasswordOpen(true)}>
            <KeyRound size={15} /> Login va parol
          </button>
          <button type="button" onClick={() => setOpen(true)}>
            <Plus size={15} /> Admin qo‘shish
          </button>
        </div>
      </div>
      <section className="admin-resource-panel">
        {loading ? (
          <div className="admin-resource-loading">
            <LoaderCircle className="admin-spin" size={18} /> Yuklanmoqda...
          </div>
        ) : (
          <div className="admin-resource-table">
            <table>
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>Holat</th>
                  <th>Qo‘shilgan sana</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="resource-title">
                        <span>
                          <ShieldCheck size={17} />
                        </span>
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <span
                        className={`resource-badge ${item.active ? "is-active" : ""}`}
                      >
                        {item.active ? "Faol" : "Faolsiz"}
                      </span>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat("uz-UZ", {
                        dateStyle: "medium",
                      }).format(new Date(item.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {open ? (
        <AdminModal
          title="Yangi admin"
          subtitle="FULL ADMIN ACCESS"
          onClose={() => setOpen(false)}
        >
          <form className="admin-resource-form" onSubmit={create}>
            <div className="admin-form-grid">
              <FormField label="Ism">
                <input
                  required
                  minLength="2"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Vaqtinchalik parol" hint="Kamida 12 belgi" wide>
                <AdminPasswordInput
                  required
                  autoComplete="new-password"
                  minLength="12"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              </FormField>
            </div>
            <footer>
              <button type="button" onClick={() => setOpen(false)}>
                Bekor qilish
              </button>
              <button type="submit" disabled={saving}>
                {saving ? (
                  <LoaderCircle className="admin-spin" size={15} />
                ) : (
                  <UsersRound size={15} />
                )}{" "}
                Saqlash
              </button>
            </footer>
          </form>
        </AdminModal>
      ) : null}
      {passwordOpen ? (
        <AdminModal
          title="Login va parolni o‘zgartirish"
          subtitle="ACCOUNT SECURITY"
          onClose={() => setPasswordOpen(false)}
        >
          <form className="admin-resource-form" onSubmit={changePassword}>
            <div className="admin-form-grid">
              <FormField label="Login (email)" wide>
                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </FormField>
              <FormField label="Joriy parol" wide>
                <AdminPasswordInput
                  required
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={(event) =>
                    setPassword({
                      ...password,
                      currentPassword: event.target.value,
                    })
                  }
                />
              </FormField>
              <FormField
                label="Yangi parol"
                hint="Kamida 12 belgi. Saqlagandan keyin qayta kiring."
                wide
              >
                <AdminPasswordInput
                  required
                  autoComplete="new-password"
                  minLength="12"
                  value={password.password}
                  onChange={(event) =>
                    setPassword({ ...password, password: event.target.value })
                  }
                />
              </FormField>
            </div>
            <footer>
              <button type="button" onClick={() => setPasswordOpen(false)}>
                Bekor qilish
              </button>
              <button type="submit" disabled={saving}>
                Hisobni yangilash
              </button>
            </footer>
          </form>
        </AdminModal>
      ) : null}
    </main>
  );
}
