import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { API } from "./config/api";

function Status() {
  const [state, setState] = useState({});
  useEffect(() => {
    Object.entries(API).forEach(([name, url]) =>
      fetch(`${url}/health`)
        .then((r) => r.json())
        .then(() => setState((s) => ({ ...s, [name]: "ok" })))
        .catch(() => setState((s) => ({ ...s, [name]: "indisponible" })))
    );
  }, []);
  return (
    <div>
      <h1>HotelHub</h1>
      <h2>Etat des services</h2>
      <ul>
        {Object.keys(API).map((n) => (
          <li key={n}>{n} : {state[n] ?? "..."}</li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <>
      <nav><Link to="/">Accueil</Link></nav>
      <Routes>
        <Route path="/" element={<Status />} />
        {/* pages/client/* et pages/admin/* a ajouter ici */}
      </Routes>
    </>
  );
}
