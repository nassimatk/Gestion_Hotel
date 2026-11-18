import { client } from "./http";
const http = client("auth");

export const register = (data) => http.post("/register", data);
export const login = async (data) => {
  const res = await http.post("/login", data);
  localStorage.setItem("token", res.data.token);
  return res;
};
export const logout = () => localStorage.removeItem("token");
export const me = () => http.get("/me");

export const forgotPassword = (email) => http.post("/forgot-password", { email });
export const resetPassword = (data) => http.post("/reset-password", data);
export const validateResetToken = (token) => http.get(`/reset-password/validate/${token}`);
export const changePasswordDirect = (data) => http.post("/change-password-direct", data);
