import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ADMIN_BASE } from "../../config/admin.js";
import { BrandLogo } from "../../components/common/BrandLogo.jsx";
import { Seo } from "../../components/common/Seo.jsx";

const REMEMBERED_EMAIL_KEY = "xion_admin_email";

export function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const rememberedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: rememberedEmail, password: "", remember: true } });

  useEffect(() => { if (user) navigate(location.state?.from || ADMIN_BASE, { replace: true }); }, [user, navigate, location.state]);

  const onSubmit = async (values) => {
    setServerError("");
    try {
      if (values.remember) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, values.email);
      else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      await login(values);
      navigate(location.state?.from || ADMIN_BASE, { replace: true });
    } catch (error) { setServerError(error.message); }
  };

  return <main className="admin-login-page">
    <Seo title="XION Control — kirish" description="XION yopiq boshqaruv paneli" canonicalPath="/admin/sign-in" noindex localized={false}/>
    <Link className="admin-login-back" to="/"><ArrowLeft size={17}/> Saytga qaytish</Link>
    <motion.section className="admin-login-panel" initial={reduceMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}>
      <div className="admin-login-mark"><BrandLogo symbolOnly/><small>Private<br/>Workspace</small></div>
      <div className="admin-login-copy"><p className="eyebrow"><span/>XION Control</p><h1>Boshqaruv<br/><em>markaziga</em> kirish.</h1><p>Mahsulotlar, suhbatlar va biznes ko‘rsatkichlarini xavfsiz boshqaring.</p></div>
      <form className="admin-login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="login-secure"><LockKeyhole size={15}/> Himoyalangan admin sessiyasi</div>
        <label>Email manzil<input type="email" autoComplete="username" aria-invalid={!!errors.email} {...register("email", { required: "Email manzilni kiriting.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Email formati noto‘g‘ri." } })}/>{errors.email && <small>{errors.email.message}</small>}</label>
        <label>Parol<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" aria-invalid={!!errors.password} {...register("password", { required: "Parolni kiriting.", minLength: { value: 8, message: "Parol kamida 8 belgi bo‘lishi kerak." } })}/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{errors.password && <small>{errors.password.message}</small>}</label>
        <label className="admin-remember"><input type="checkbox" {...register("remember")}/><i><Check size={13}/></i><span>Eslab qolish va keyingi safar darhol kirish</span></label>
        {serverError && <div className="login-error" role="alert">{serverError}</div>}
        <button className="admin-login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Tekshirilmoqda…" : <>Kirish <ArrowRight size={18}/></>}</button>
        <p>Parol brauzer xotirasiga yozilmaydi.</p>
      </form>
    </motion.section>
  </main>;
}
