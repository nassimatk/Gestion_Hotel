import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireAdmin from "./components/RequireAdmin";

// Pages client
import HomePage from "./pages/client/HomePage";
import ChambresPage from "./pages/client/ChambresPage";
import ReservationPage from "./pages/client/ReservationPage";
import MesReservationsPage from "./pages/client/MesReservationsPage";
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import ForgotPasswordPage from "./pages/client/ForgotPasswordPage";
import ResetPasswordPage from "./pages/client/ResetPasswordPage";
import DetailChambrePage from "./pages/client/DetailChambrePage";
import ClientAvisPage from "./pages/client/ClientAvisPage";

// Pages administration
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminChambresPage from "./pages/admin/chambres/AdminChambresPage";
import AdminChamberPageAdd from "./pages/admin/chambres/AdminChamberPageAdd";
import AdminChamberPageEdit from "./pages/admin/chambres/AdminChamberPageEdit";
import AdminAvisPage from "./pages/admin/avis/AdminAvisPage";
import AdminTarifsPage from "./pages/admin/tarifs/AdminTarifsPage";
import AdminDisponibilitesPage from "./pages/admin/disponibilites/AdminDisponibilitesPage";
import AdminClientsPage from "./pages/admin/client/AdminClientsPage";

function AppContent() {
  const { pathname } = useLocation();

  const isAdmin = pathname.startsWith("/admin");

  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].includes(pathname);

  // Administration
  if (isAdmin) {
    return (
      <RequireAdmin>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            <Route path="chambres" element={<AdminChambresPage />} />
            <Route path="chambres/ajouter" element={<AdminChamberPageAdd />} />
            <Route
              path="chambres/modifier/:id"
              element={<AdminChamberPageEdit />}
            />

            <Route path="avis" element={<AdminAvisPage />} />
            <Route path="tarifs" element={<AdminTarifsPage />} />
            <Route
              path="disponibilites"
              element={<AdminDisponibilitesPage />}
            />
            <Route path="reservations" element={<AdminDisponibilitesPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
          </Route>
        </Routes>
      </RequireAdmin>
    );
  }

  // Authentification
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

  // Site client
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chambres" element={<ChambresPage />} />
          <Route path="/chambres/:id" element={<DetailChambrePage />} />
          <Route path="/chambres/:id/avis" element={<ClientAvisPage />} />

          <Route path="/reservation" element={<ReservationPage />} />
          <Route path="/reservation/:chambreId" element={<ReservationPage />} />

          <Route path="/mes-reservations" element={<MesReservationsPage />} />
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