import { client } from "./http";
const http = client("disponibilites");
export const getDisponibilites = (params) => http.get("/disponibilites", { params });
