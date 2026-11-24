
import { describe, it, expect, vi, beforeEach } from "vitest";

const { post, get, deleteRequest } = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock("../services/http", () => ({
  client: () => ({
    post,
    get,
    delete: deleteRequest,
  }),
}));

import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  validateResetToken,
  changePasswordDirect,
  getUserById,
  getAllUsers,
  deleteUser,
} from "../services/authApi";

describe("authApi - Tests des services API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("inscrit un utilisateur", async () => {
    post.mockResolvedValue({ data: { success: true } });

    await register({ name: "Test" });

    expect(post).toHaveBeenCalledWith("/register", { name: "Test" });
  });

  it("connecte un utilisateur et sauvegarde le token", async () => {
    post.mockResolvedValue({
      data: { token: "jwt-test" },
    });

    await login({ email: "test@test.com", password: "12345678" });

    expect(localStorage.getItem("token")).toBe("jwt-test");
    expect(post).toHaveBeenCalledWith("/login", {
      email: "test@test.com",
      password: "12345678",
    });
  });

  it("supprime le token lors de la déconnexion", () => {
    localStorage.setItem("token", "jwt-test");

    logout();

    expect(localStorage.getItem("token")).toBeNull();
  });

  it("récupère le profil utilisateur", async () => {
    get.mockResolvedValue({ data: { name: "Test" } });

    await me();

    expect(get).toHaveBeenCalledWith("/me");
  });

  it("envoie une demande de réinitialisation", async () => {
    await forgotPassword("test@test.com");

    expect(post).toHaveBeenCalledWith("/forgot-password", {
      email: "test@test.com",
    });
  });

  it("réinitialise le mot de passe", async () => {
    const data = { token: "abc", password: "newpassword" };

    await resetPassword(data);

    expect(post).toHaveBeenCalledWith("/reset-password", data);
  });

  it("valide le token de réinitialisation", async () => {
    await validateResetToken("abc123");

    expect(get).toHaveBeenCalledWith("/reset-password/validate/abc123");
  });

  it("change directement le mot de passe", async () => {
    const data = { password: "newpassword" };

    await changePasswordDirect(data);

    expect(post).toHaveBeenCalledWith("/change-password-direct", data);
  });

  it("récupère un utilisateur par ID", async () => {
    await getUserById(5);

    expect(get).toHaveBeenCalledWith("/users/5");
  });

  it("récupère tous les utilisateurs", async () => {
    await getAllUsers();

    expect(get).toHaveBeenCalledWith("/users");
  });

  it("supprime un utilisateur sans force", async () => {
    await deleteUser(5);

    expect(deleteRequest).toHaveBeenCalledWith("/users/5");
  });

  it("supprime un utilisateur avec force", async () => {
    await deleteUser(5, true);

    expect(deleteRequest).toHaveBeenCalledWith("/users/5?force=true");
  });
});
