import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireAdmin from "./components/RequireAdmin";

import HomePage from "./pages/client/HomePage";
import TarifsPage from "./pages/client/TarifsPage";
import ChambresPage from "./pages/client/ChambresPage";
import ReservationPage from "./pages/client/ReservationPage";
import MesReservationsPage from "./pages/client/MesReservationsPage";
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import ForgotPasswordPage from "./pages/client/ForgotPasswordPage";
import ResetPasswordPage from "./pages/client/ResetPasswordPage";

// Modules Administration
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminChambresPage from "./pages/admin/chambres/AdminChambresPage";
import AdminChamberPageAdd from "./pages/admin/chambres/AdminChamberPageAdd";
import AdminChamberPageEdit from "./pages/admin/chambres/AdminChamberPageEdit";
import AdminAvisPage from "./pages/admin/avis/AdminAvisPage";
import AdminTarifsPage from "./pages/admin/tarifs/AdminTarifsPage";
import AdminDisponibilitesPage from "./pages/admin/disponibilites/AdminDisponibilitesPage";

function AppContent() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // ─── Zone Administration ───────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <RequireAdmin>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="chambres" element={<AdminChambresPage />} />
            <Route path="chambres/ajouter" element={<AdminChamberPageAdd />} />
            <Route path="chambres/modifier/:id" element={<AdminChamberPageEdit />} />
            <Route path="avis" element={<AdminAvisPage />} />
            <Route path="tarifs" element={<AdminTarifsPage />} />
            <Route path="disponibilites" element={<AdminDisponibilitesPage />} />
          </Route>
        </Routes>
      </RequireAdmin>
    );
  }

  // ─── Pages d'authentification ──────────────────────────────────────────────
  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  // ─── Site client public ────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tarifs" element={<TarifsPage />} />
          <Route path="/chambres" element={<ChambresPage />} />
          <Route path="/mes-reservations" element={<MesReservationsPage />} />
          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/reservation/:chambreId" element={<ReservationPage />} />
          {/* pages/client/* à enrichir ici au fil du développement */}
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}