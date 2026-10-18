import { client } from "./http";
const http = client("avis");
export const getAvis = (chambreId) => http.get("/avis", { params: { chambre_id: chambreId } });
export const createAvis = (data) => http.post("/avis", data);
