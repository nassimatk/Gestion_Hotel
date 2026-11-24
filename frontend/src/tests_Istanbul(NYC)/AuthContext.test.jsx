
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

const { apiLogin, apiRegister, apiLogout, apiMe } = vi.hoisted(() => ({
  apiLogin: vi.fn(),
  apiRegister: vi.fn(),
  apiLogout: vi.fn(),
  apiMe: vi.fn(),
}));

vi.mock("../services/authApi", () => ({
  login: apiLogin,
  register: apiRegister,
  logout: apiLogout,
  me: apiMe,
}));

function Consumer() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="authenticated">
        {String(auth.isAuthenticated)}
      </span>
      <span data-testid="admin">{String(auth.isAdmin)}</span>
      <span data-testid="user">{auth.user?.name || "Aucun utilisateur"}</span>

      <button onClick={() => auth.login("test@test.com", "password123")}>
        Login
      </button>

      <button onClick={() => auth.register("Test", "test@test.com", "password123")}>
        Register
      </button>

      <button onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

describe("AuthContext - Tests d'authentification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("initialise une session sans token", async () => {
    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(apiMe).not.toHaveBeenCalled();
  });

  it("récupère le profil si un token existe", async () => {
    localStorage.setItem("token", "fake-token");
    apiMe.mockResolvedValue({
      data: { name: "Admin", role: "admin" },
    });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Admin");
    });

    expect(screen.getByTestId("admin").textContent).toBe("true");
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("supprime un token invalide", async () => {
    localStorage.setItem("token", "invalid-token");
    apiMe.mockRejectedValue(new Error("Unauthorized"));

    renderAuth();

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBeNull();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
  });

  it("connecte un utilisateur client", async () => {
    apiLogin.mockResolvedValue({});
    apiMe.mockResolvedValue({
      data: { name: "Client", role: "client" },
    });

    renderAuth();
    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Client");
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("admin").textContent).toBe("false");
    expect(apiLogin).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password123",
    });
  });

  it("reconnaît un administrateur", async () => {
    apiLogin.mockResolvedValue({});
    apiMe.mockResolvedValue({
      data: { name: "Admin", role: { name: "admin" } },
    });

    renderAuth();
    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("admin").textContent).toBe("true");
    });
  });

  it("inscrit un utilisateur puis le connecte", async () => {
    apiRegister.mockResolvedValue({});
    apiLogin.mockResolvedValue({});
    apiMe.mockResolvedValue({
      data: { name: "Nouveau client", role: "client" },
    });

    renderAuth();
    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Nouveau client");
    });

    expect(apiRegister).toHaveBeenCalled();
    expect(apiLogin).toHaveBeenCalled();
  });

  it("déconnecte l'utilisateur", async () => {
    apiLogin.mockResolvedValue({});
    apiMe.mockResolvedValue({
      data: { name: "Client", role: "client" },
    });

    renderAuth();

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").textContent).toBe("true");
    });

    fireEvent.click(screen.getByText("Logout"));

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(apiLogout).toHaveBeenCalled();
  });

  it("refuse useAuth en dehors du provider", () => {
    function InvalidConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider"
    );
  });
});
