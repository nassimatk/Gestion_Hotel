import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/client/HomePage";

// Modules Administration
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminChambresPage from "./pages/admin/chambres/AdminChambresPage";
import AdminAvisPage from "./pages/admin/avis/AdminAvisPage";
import AdminTarifsPage from "./pages/admin/tarifs/AdminTarifsPage";
import AdminDisponibilitesPage from "./pages/admin/disponibilites/AdminDisponibilitesPage";

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

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

  // Affichage du site client public
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
