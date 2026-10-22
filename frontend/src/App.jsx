import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/client/HomePage";
import ReservationPage from "./pages/client/ReservationPage";

export default function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          {/* Page d'accueil (commune à toute l'équipe) */}
          <Route path="/" element={<HomePage />} />

          {/* pages/client/* : ajouter ici les routes client */}
          <Route path="/reservation" element={<ReservationPage />} />

          {/* pages/admin/* : ajouter ici les routes admin */}
        </Routes>
      </main>

      <Footer />
    </>
  );
}