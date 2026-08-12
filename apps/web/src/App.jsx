import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/admin/ProtectedRoute.jsx";
import "./styles/admin.css";
import "./styles/chat.css";
import { ADMIN_BASE } from "./config/admin.js";

const ProductPage = lazy(() => import("./pages/ProductPage.jsx").then((module) => ({ default: module.ProductPage })));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.jsx").then((module) => ({ default: module.AdminLayout })));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage.jsx").then((module) => ({ default: module.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage.jsx").then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage.jsx").then((module) => ({ default: module.AdminProductsPage })));
const AdminAdvertisementsPage = lazy(() => import("./pages/admin/AdminAdvertisementsPage.jsx").then((module) => ({ default: module.AdminAdvertisementsPage })));
const AdminOperatorsPage = lazy(() => import("./pages/admin/AdminOperatorsPage.jsx").then((module) => ({ default: module.AdminOperatorsPage })));
const AdminLeadsPage = lazy(() => import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({ default: module.AdminLeadsPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({ default: module.AdminOrdersPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({ default: module.AdminReviewsPage })));
const OperatorAppPage = lazy(() => import("./pages/OperatorAppPage.jsx").then((module) => ({ default: module.OperatorAppPage })));

function RouteFallback() {
  return <div className="admin-auth-loading" role="status"><span>NOVA.</span><p>Sahifa yuklanmoqda...</p></div>;
}

export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback/>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/operator" element={<OperatorAppPage />} />
          <Route path={`${ADMIN_BASE}/sign-in`} element={<AdminLoginPage />} />
          <Route path={ADMIN_BASE} element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="advertisements" element={<AdminAdvertisementsPage />} />
            <Route path="operators" element={<AdminOperatorsPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
