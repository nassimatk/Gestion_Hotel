import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/client/HomePage";
import ReservationPage from "./pages/client/ReservationPage";
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import ForgotPasswordPage from "./pages/client/ForgotPasswordPage";
import ResetPasswordPage from "./pages/client/ResetPasswordPage";

// Modules Administration
import MesReservationsPage from "./pages/client/MesReservationsPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminChambresPage from "./pages/admin/chambres/AdminChambresPage";
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

  // Affichage du Dashboard Admin avec sa propre Sidebar (sans Navbar client ni Footer)
  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="chambres" element={<AdminChambresPage />} />
          <Route path="avis" element={<AdminAvisPage />} />
          <Route path="tarifs" element={<AdminTarifsPage />} />
          <Route path="disponibilites" element={<AdminDisponibilitesPage />} />
        </Route>
      </Routes>
    );
  }

  // Pages d'authentification (sans Navbar ni Footer)
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

  // Affichage du site client public
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* pages/client/* : ajouter ici les routes client */}
          <Route path="/mes-reservations" element={<MesReservationsPage />} />
          <Route path="/reservation" element={<ReservationPage />} />

          {/* pages/admin/* : ajouter ici les routes admin */}
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
