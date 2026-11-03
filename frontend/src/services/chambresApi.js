import { client } from "./http";
const http = client("chambres");
export const getChambres = () => http.get("/chambres");
export const getChambre = (id) => http.get(`/chambres/${id}`);
