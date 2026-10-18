import axios from "axios";
import { API } from "../config/api";

// Client axios par service : client("chambres").get("/chambres")
// Ajoute automatiquement le token JWT (stocke apres login) a chaque requete.
export const client = (service) => {
  const instance = axios.create({ baseURL: API[service] });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};
