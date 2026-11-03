
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminChamberPageAdd from "./pages/admin/chambres/AdminChamberPageAdd";
import AdminAvisPage from "./pages/admin/avis/AdminAvisPage";
import AdminChambresPage from "./pages/admin/chambres/AdminChambresPage";

export default function App() {
  return (
    <Routes>
      {/* Accueil */}
      <Route
        path="/"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      {/* Administration */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={<Navigate to="dashboard" replace />}
        />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        {/* Gestion des chambres */}
        <Route
          path="chambres"
          element={<AdminChambresPage />}
        />

        <Route
          path="chambres/ajouter"
          element={<AdminChamberPageAdd />}
        />

        {/* Avis */}
        <Route
          path="avis"
          element={<AdminAvisPage />}
        />
      </Route>

      {/* Routes inconnues */}
      <Route
        path="*"
        element={<Navigate to="/admin/dashboard" replace />}
      />
    </Routes>
  );
}
