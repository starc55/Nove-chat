import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Bot, ChevronLeft, ClipboardList, LayoutDashboard, LogOut, Megaphone, Menu, Package, ShoppingBag, Star, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { AdminUiProvider, useAdminUi } from "./AdminUi.jsx";
import { ADMIN_BASE } from "../../config/admin.js";

function AdminLayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { confirm } = useAdminUi();
  const reduceMotion = useReducedMotion();

  const handleLogout = async () => {
    const approved = await confirm({
      tone: "warning",
      eyebrow: "SESSIYA",
      title: "Admin paneldan chiqilsinmi?",
      description: "Joriy sessiya yakunlanadi. Davom etish uchun qayta kirishingiz kerak bo‘ladi.",
      confirmLabel: "Chiqish"
    });
    if (approved) await logout();
  };

  return (
    <div className="admin-shell">
      <AnimatePresence>
        {sidebarOpen && <motion.button className="admin-overlay" aria-label="Menyuni yopish" onClick={() => setSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
      <motion.aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`} initial={reduceMotion ? false : { x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}>
        <div className="admin-brand"><a href="/" aria-label="NOVA bosh sahifa">NOVA<i>.</i></a><button onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish"><X size={19}/></button></div>
        <nav className="admin-nav" aria-label="Admin navigatsiya">
          <span>Boshqaruv</span>
          <NavLink to={ADMIN_BASE} end onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18}/><b>Dashboard</b></NavLink>
          <NavLink to={`${ADMIN_BASE}/products`} onClick={() => setSidebarOpen(false)}><Package size={18}/><b>Mahsulotlar</b></NavLink>
          <NavLink to={`${ADMIN_BASE}/advertisements`} onClick={() => setSidebarOpen(false)}><Megaphone size={18}/><b>Landing bannerlari</b></NavLink>
          <NavLink to={`${ADMIN_BASE}/reviews`} onClick={() => setSidebarOpen(false)}><Star size={18}/><b>Sharhlar</b></NavLink>
          <span>Operatsiyalar</span>
          <NavLink to={`${ADMIN_BASE}/leads`} onClick={() => setSidebarOpen(false)}><ClipboardList size={18}/><b>Murojaatlar</b></NavLink>
          <NavLink to={`${ADMIN_BASE}/orders`} onClick={() => setSidebarOpen(false)}><ShoppingBag size={18}/><b>Buyurtmalar</b></NavLink>
          <NavLink to={`${ADMIN_BASE}/operators`} onClick={() => setSidebarOpen(false)}><Bot size={18}/><b>Operatorlar</b></NavLink>
        </nav>
        <div className="admin-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer">Saytni ochish <ArrowUpRight size={16}/></a>
          <div className="admin-profile"><span>{user?.name?.charAt(0)}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div>
          <button type="button" className="admin-logout" onClick={handleLogout}><LogOut size={17}/> Chiqish</button>
        </div>
      </motion.aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu" onClick={() => setSidebarOpen(true)} aria-label="Menyuni ochish"><Menu/></button>
          <div className="admin-context"><span>NOVA</span><i/>Administratsiya</div>
          <div className="admin-top-actions"><a href="/" aria-label="Saytga qaytish"><ChevronLeft size={16}/> Sayt</a></div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}

export function AdminLayout() {
  return <AdminUiProvider><AdminLayoutContent/></AdminUiProvider>;
}
