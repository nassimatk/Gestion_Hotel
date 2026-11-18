import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/client/HomePage";
import TarifsPage from "./pages/client/TarifsPage";
import AdminTarifs from "./pages/admin/AdminTarifs";

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          {/* Page d'accueil (commune à toute l'équipe) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/tarifs" element={<TarifsPage />} />
          <Route path="/admin/tarifs" element={<AdminTarifs />} />

          {/* pages/client/* : ajouter ici les routes client */}
          {/* pages/admin/* : ajouter ici les routes admin */}
        </Routes>
      </main>

      <Footer />
    </>
  );
}
