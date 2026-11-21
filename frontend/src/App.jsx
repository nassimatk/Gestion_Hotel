
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Composants communs
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireAdmin from "./components/RequireAdmin";

// Pages client
import HomePage from "./pages/client/HomePage";
import ChambresPage from "./pages/client/ChambresPage";
import DetailChambrePage from "./pages/client/DetailChambrePage";
import ReservationPage from "./pages/client/ReservationPage";
import MesReservationsPage from "./pages/client/MesReservationsPage";
import ClientAvisPage from "./pages/client/ClientAvisPage";

// Pages d'authentification
import LoginPage from "./pages/client/LoginPage";
import RegisterPage from "./pages/client/RegisterPage";
import ForgotPasswordPage from "./pages/client/ForgotPasswordPage";
import ResetPasswordPage from "./pages/client/ResetPasswordPage";

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

            {/* Gestion des chambres */}
            <Route path="chambres" element={<AdminChambresPage />} />
            <Route path="chambres/ajouter" element={<AdminChamberPageAdd />} />
            <Route
              path="chambres/modifier/:id"
              element={<AdminChamberPageEdit />}
            />

            {/* Gestion des avis */}
            <Route path="avis" element={<AdminAvisPage />} />

            {/* Gestion des tarifs */}
            <Route path="tarifs" element={<AdminTarifsPage />} />

            {/* Disponibilités et réservations */}
            <Route
              path="disponibilites"
              element={<AdminDisponibilitesPage />}
            />
            <Route
              path="reservations"
              element={<AdminDisponibilitesPage />}
            />

            {/* Gestion des clients */}
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

          {/* Chambres */}
          <Route path="/chambres" element={<ChambresPage />} />
          <Route path="/chambres/:id" element={<DetailChambrePage />} />
          <Route path="/chambres/:id/avis" element={<ClientAvisPage />} />

          {/* Réservations */}
          <Route path="/reservation" element={<ReservationPage />} />
          <Route
            path="/reservation/:chambreId"
            element={<ReservationPage />}
          />
          <Route
            path="/mes-reservations"
            element={<MesReservationsPage />}
          />
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
