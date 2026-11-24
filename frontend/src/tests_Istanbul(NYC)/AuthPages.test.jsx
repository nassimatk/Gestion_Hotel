
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import LoginPage from "../pages/client/LoginPage";
import RegisterPage from "../pages/client/RegisterPage";

const { mockLogin, mockRegister } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderPage(page, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {page}
      <LocationDisplay />
    </MemoryRouter>
  );
}

describe("LoginPage - Tests de connexion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire de connexion", () => {
    renderPage(<LoginPage />);

    expect(screen.getByText("Connexion")).toBeTruthy();
    expect(screen.getByPlaceholderText("alexandre.durand@hotelhub.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Se connecter/i })).toBeTruthy();
  });

  it("affiche une erreur si les champs sont vides", () => {
    renderPage(<LoginPage />);

    fireEvent.submit(screen.getByRole("button", { name: /Se connecter/i }).closest("form"));

    expect(screen.getByText(
      "Veuillez renseigner votre email et votre mot de passe."
    )).toBeTruthy();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("connecte un client et redirige vers l'accueil", async () => {
    mockLogin.mockResolvedValue({
      role: "client",
    });

    renderPage(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("alexandre.durand@hotelhub.com"), {
      target: { value: "client@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/");
    });

    expect(mockLogin).toHaveBeenCalledWith("client@test.com", "password123");
  });

  it("connecte un admin et redirige vers le dashboard", async () => {
    mockLogin.mockResolvedValue({
      role: "admin",
    });

    renderPage(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("alexandre.durand@hotelhub.com"), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••••••"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/admin");
    });
  });

  it("affiche une erreur renvoyée par le serveur", async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: { error: "Identifiants incorrects" },
      },
    });

    renderPage(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("alexandre.durand@hotelhub.com"), {
      target: { value: "wrong@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("••••••••••••"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(await screen.findByText("Identifiants incorrects")).toBeTruthy();
  });

  it("affiche ou masque le mot de passe", () => {
    renderPage(<LoginPage />);

    const password = screen.getByPlaceholderText("••••••••••••");

    expect(password.type).toBe("password");

    fireEvent.click(screen.getByLabelText("Afficher ou masquer le mot de passe"));

    expect(password.type).toBe("text");
  });
});

describe("RegisterPage - Tests d'inscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillRegistration() {
    fireEvent.change(screen.getByPlaceholderText("ex. Éléonore de Montmirail"), {
      target: { value: "Client Test" },
    });

    fireEvent.change(screen.getByPlaceholderText("eleonore@prestige.com"), {
      target: { value: "client@test.com" },
    });

    const passwords = screen.getAllByPlaceholderText("8 caractères minimum");

    fireEvent.change(passwords[0], {
      target: { value: "password123" },
    });

    fireEvent.change(screen.getByPlaceholderText("Répéter votre mot de passe"), {
      target: { value: "password123" },
    });
  }

  it("affiche le formulaire d'inscription", () => {
    renderPage(<RegisterPage />);

    expect(screen.getByText("Créez votre compte")).toBeTruthy();
    expect(screen.getByText("Nom complet *")).toBeTruthy();
  });

  it("refuse les champs obligatoires vides", () => {
    renderPage(<RegisterPage />);

    fireEvent.submit(screen.getByRole("button", { name: /Créer mon compte/i }).closest("form"));

    expect(screen.getByText(
      "Veuillez remplir tous les champs obligatoires."
    )).toBeTruthy();

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe trop court", () => {
    renderPage(<RegisterPage />);

    fillRegistration();

    fireEvent.change(screen.getAllByPlaceholderText("8 caractères minimum")[0], {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.submit(screen.getByRole("button", { name: /Créer mon compte/i }).closest("form"));

    expect(screen.getByText(
      "Le mot de passe doit comporter au moins 8 caractères."
    )).toBeTruthy();
  });

  it("refuse des mots de passe différents", () => {
    renderPage(<RegisterPage />);

    fillRegistration();

    fireEvent.change(screen.getByPlaceholderText("Répéter votre mot de passe"), {
      target: { value: "different123" },
    });

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.submit(screen.getByRole("button", { name: /Créer mon compte/i }).closest("form"));

    expect(screen.getByText(
      "Les mots de passe ne correspondent pas."
    )).toBeTruthy();
  });

  it("exige l'acceptation des conditions générales", () => {
    renderPage(<RegisterPage />);

    fillRegistration();

    fireEvent.submit(screen.getByRole("button", { name: /Créer mon compte/i }).closest("form"));

    expect(screen.getByText(
      "Veuillez accepter les Conditions Générales pour continuer."
    )).toBeTruthy();
  });

  it("inscrit un utilisateur et redirige vers l'accueil", async () => {
    mockRegister.mockResolvedValue({});

    renderPage(<RegisterPage />);

    fillRegistration();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/");
    });

    expect(mockRegister).toHaveBeenCalledWith(
      "Client Test",
      "client@test.com",
      "password123"
    );
  });

  it("affiche une erreur si l'inscription échoue", async () => {
    mockRegister.mockRejectedValue({
      response: {
        data: { error: "Email déjà utilisé" },
      },
    });

    renderPage(<RegisterPage />);

    fillRegistration();

    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Créer mon compte/i }));

    expect(await screen.findByText("Email déjà utilisé")).toBeTruthy();
  });

  it("affiche ou masque le mot de passe", () => {
    renderPage(<RegisterPage />);

    const password = screen.getByPlaceholderText("8 caractères minimum");

    expect(password.type).toBe("password");

    fireEvent.click(screen.getAllByLabelText(
      "Afficher ou masquer le mot de passe"
    )[0]);

    expect(password.type).toBe("text");
  });
});
