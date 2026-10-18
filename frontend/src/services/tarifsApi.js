import { client } from "./http";
const http = client("tarifs");
export const getTarifs = (params) => http.get("/tarifs", { params });
