import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/admin/ProtectedRoute.jsx";
import "./styles/admin.css";
import "./styles/chat.css";
import { ADMIN_BASE, LEGACY_ADMIN_BASE } from "./config/admin.js";
import { BrandLogo } from "./components/common/BrandLogo.jsx";

const ProductPage = lazy(() =>
  import("./pages/ProductPage.jsx").then((module) => ({
    default: module.ProductPage,
  }))
);
const CatalogPage = lazy(() =>
  import("./pages/CatalogPage.jsx").then((module) => ({
    default: module.CatalogPage,
  }))
);
const InfoPage = lazy(() =>
  import("./pages/InfoPage.jsx").then((module) => ({
    default: module.InfoPage,
  }))
);
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout.jsx").then((module) => ({
    default: module.AdminLayout,
  }))
);
const AdminLoginPage = lazy(() =>
  import("./pages/admin/AdminLoginPage.jsx").then((module) => ({
    default: module.AdminLoginPage,
  }))
);
const AdminDashboardPage = lazy(() =>
  import("./pages/admin/AdminDashboardPage.jsx").then((module) => ({
    default: module.AdminDashboardPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import("./pages/admin/AdminProductsPage.jsx").then((module) => ({
    default: module.AdminProductsPage,
  }))
);
const AdminAdvertisementsPage = lazy(() =>
  import("./pages/admin/AdminAdvertisementsPage.jsx").then((module) => ({
    default: module.AdminAdvertisementsPage,
  }))
);
const AdminOperatorsPage = lazy(() =>
  import("./pages/admin/AdminOperatorsPage.jsx").then((module) => ({
    default: module.AdminOperatorsPage,
  }))
);
const AdminLeadsPage = lazy(() =>
  import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({
    default: module.AdminLeadsPage,
  }))
);
const AdminOrdersPage = lazy(() =>
  import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({
    default: module.AdminOrdersPage,
  }))
);
const AdminReviewsPage = lazy(() =>
  import("./pages/admin/AdminRecordsPage.jsx").then((module) => ({
    default: module.AdminReviewsPage,
  }))
);
const AdminContentPagesPage = lazy(() =>
  import("./pages/admin/AdminContentPagesPage.jsx").then((module) => ({
    default: module.AdminContentPagesPage,
  }))
);
const AdminConversationArchivePage = lazy(() =>
  import("./pages/admin/AdminConversationArchivePage.jsx").then((module) => ({
    default: module.AdminConversationArchivePage,
  }))
);
const OperatorAppPage = lazy(() =>
  import("./pages/OperatorAppPage.jsx").then((module) => ({
    default: module.OperatorAppPage,
  }))
);

function RouteFallback() {
  return (
    <div className="admin-auth-loading" role="status">
      <BrandLogo />
      <p>Sahifa yuklanmoqda...</p>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products/:slug" element={<ProductPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/company" element={<InfoPage slug="about" />} />
          <Route path="/simurg" element={<InfoPage slug="simurg" />} />
          <Route
            path="/medical-institutions"
            element={<InfoPage slug="medical-institutions" />}
          />
          <Route
            path="/manufacturers"
            element={<InfoPage slug="manufacturers" />}
          />
          <Route path="/news" element={<InfoPage slug="news" />} />
          <Route path="/career" element={<InfoPage slug="career" />} />
          <Route path="/contact" element={<InfoPage slug="contact" />} />
          <Route
            path="/warranty-return"
            element={<InfoPage slug="warranty-return" />}
          />
          <Route path="/terms" element={<InfoPage slug="terms" />} />
          <Route path="/privacy" element={<InfoPage slug="privacy" />} />
          <Route path="/operator" element={<OperatorAppPage />} />
          <Route path={`${ADMIN_BASE}/sign-in`} element={<AdminLoginPage />} />
          <Route
            path={ADMIN_BASE}
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route
              path="advertisements"
              element={<AdminAdvertisementsPage />}
            />
            <Route path="operators" element={<AdminOperatorsPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="content" element={<AdminContentPagesPage />} />
            <Route path="archive" element={<AdminConversationArchivePage />} />
          </Route>
          <Route
            path={`${LEGACY_ADMIN_BASE}/*`}
            element={<Navigate to={ADMIN_BASE} replace />}
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
