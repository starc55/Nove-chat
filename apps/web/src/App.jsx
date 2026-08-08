import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage.jsx";
import { ProductPage } from "./pages/ProductPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ProtectedRoute } from "./components/admin/ProtectedRoute.jsx";
import { AdminLayout } from "./components/admin/AdminLayout.jsx";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage.jsx";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.jsx";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage.jsx";
import { AdminAdvertisementsPage } from "./pages/admin/AdminAdvertisementsPage.jsx";
import { AdminOperatorsPage } from "./pages/admin/AdminOperatorsPage.jsx";
import "./styles/admin.css";
import "./styles/chat.css";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="advertisements" element={<AdminAdvertisementsPage />} />
          <Route path="operators" element={<AdminOperatorsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
