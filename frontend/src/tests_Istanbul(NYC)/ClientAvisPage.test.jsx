
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ClientAvisPage from "../pages/client/ClientAvisPage";

import {
  getAvisChambre,
  createAvis,
  updateAvis,
  deleteAvis,
} from "../services/avisApi";

vi.mock("../services/avisApi", () => ({
  getAvisChambre: vi.fn(),
  createAvis: vi.fn(),
  updateAvis: vi.fn(),
  deleteAvis: vi.fn(),
}));

const avisExemple = [
  {
    id: 1,
    user_id: 7,
    note: 5,
    commentaire: "Excellent séjour",
    created_at: "2026-11-20T10:00:00",
    user: {
      name: "Ahmed Test",
      email: "ahmed@test.com",
    },
  },
  {
    id: 2,
    user_id: 8,
    note: 3,
    commentaire: "Séjour correct",
    created_at: "2026-11-21T10:00:00",
    user: {
      name: "Sara Test",
      email: "sara@test.com",
    },
  },
];

const creerToken = (payload) => {
  const base64 = btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `header.${base64}.signature`;
};

const afficherPage = () =>
  render(
    <MemoryRouter initialEntries={["/chambres/10/avis"]}>
      <Routes>
        <Route
          path="/chambres/:id/avis"
          element={<ClientAvisPage />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("ClientAvisPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    localStorage.clear();
    localStorage.setItem("token", creerToken({ sub: 7 }));

    getAvisChambre.mockResolvedValue(avisExemple);

    window.confirm = vi.fn().mockReturnValue(true);

    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("affiche le chargement des avis", () => {
    getAvisChambre.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/chambres/10/avis"]}>
        <Routes>
          <Route
            path="/chambres/:id/avis"
            element={<ClientAvisPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Chargement des avis...")).toBeInTheDocument();
  });

  it("charge les avis de la chambre", async () => {
    afficherPage();

    expect(
      await screen.findByText("Excellent séjour")
    ).toBeInTheDocument();

    expect(getAvisChambre).toHaveBeenCalledWith("10");
  });

  it("affiche le nom et l'email des clients", async () => {
    afficherPage();

    expect(await screen.findByText("Ahmed Test")).toBeInTheDocument();
    expect(screen.getByText("ahmed@test.com")).toBeInTheDocument();
    expect(screen.getByText("Sara Test")).toBeInTheDocument();
  });

  it("calcule la moyenne des notes", async () => {
    afficherPage();

    expect(await screen.findByText("4.00")).toBeInTheDocument();
  });

  it("affiche les avis vides si aucune donnée", async () => {
    getAvisChambre.mockResolvedValue([]);

    afficherPage();

    expect(
      await screen.findByText("Aucun avis disponible")
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Soyez le premier à partager/)
    ).toBeInTheDocument();
  });

  it("affiche une erreur si le chargement échoue", async () => {
    getAvisChambre.mockRejectedValue(new Error("Erreur serveur"));

    afficherPage();

    expect(
      await screen.findByText("Impossible de charger les avis.")
    ).toBeInTheDocument();
  });

  it("filtre les avis par note", async () => {
    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(screen.getByRole("button", { name: "5 ★" }));

    expect(screen.getByText("Excellent séjour")).toBeInTheDocument();
    expect(screen.queryByText("Séjour correct")).not.toBeInTheDocument();
    expect(screen.getByText("1 avis affichés")).toBeInTheDocument();
  });

  it("ouvre le formulaire de publication", async () => {
    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Partager votre expérience/,
      })
    );

    expect(
      screen.getByText("Partager votre expérience", {
        selector: "h2",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Votre commentaire")
    ).toBeInTheDocument();
  });

  it("demande une connexion avant de publier", async () => {
    localStorage.removeItem("token");

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Partager votre expérience/,
      })
    );

    fireEvent.change(
      screen.getByLabelText("Votre commentaire"),
      { target: { value: "Très bon séjour" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Publier mon avis" })
    );

    expect(
      await screen.findByText(
        "Veuillez vous connecter pour publier un avis."
      )
    ).toBeInTheDocument();

    expect(createAvis).not.toHaveBeenCalled();
  });

 
  
it("refuse un commentaire vide", async () => {
  afficherPage();

  await screen.findByText("Excellent séjour");

  fireEvent.click(
    screen.getByRole("button", {
      name: /Partager votre expérience/,
    })
  );

  const textarea = screen.getByLabelText("Votre commentaire");

  fireEvent.change(textarea, {
    target: { value: "   " },
  });

  // Déclencher directement le submit React
  fireEvent.submit(textarea.closest("form"));

  expect(
    await screen.findByText("Veuillez saisir un commentaire.")
  ).toBeInTheDocument();

  expect(createAvis).not.toHaveBeenCalled();
});


  it("publie un nouvel avis", async () => {
    getAvisChambre
      .mockResolvedValueOnce(avisExemple)
      .mockResolvedValueOnce([
        ...avisExemple,
        {
          id: 3,
          user_id: 7,
          note: 5,
          commentaire: "Très bon séjour",
        },
      ]);

    createAvis.mockResolvedValue({ message: "OK" });

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Partager votre expérience/,
      })
    );

    fireEvent.change(
      screen.getByLabelText("Votre commentaire"),
      { target: { value: "  Très bon séjour  " } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Publier mon avis" })
    );

    await waitFor(() => {
      expect(createAvis).toHaveBeenCalledWith({
        chambre_id: 10,
        note: 5,
        commentaire: "Très bon séjour",
      });
    });

    expect(
      await screen.findByText("Très bon séjour")
    ).toBeInTheDocument();
  });

  it("gère une erreur lors de la publication", async () => {
    createAvis.mockRejectedValue(new Error("Publication impossible"));

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Partager votre expérience/,
      })
    );

    fireEvent.change(
      screen.getByLabelText("Votre commentaire"),
      { target: { value: "Mon commentaire" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Publier mon avis" })
    );

    expect(
      await screen.findByText("Publication impossible")
    ).toBeInTheDocument();
  });

  it("ouvre le formulaire de modification de son avis", async () => {
    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", { name: "Modifier mon avis" })
    );

    expect(
      screen.getByText("Modifier mon avis", { selector: "h2" })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Votre commentaire")
    ).toHaveValue("Excellent séjour");
  });

  it("modifie un avis existant", async () => {
    updateAvis.mockResolvedValue({ message: "OK" });

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", { name: "Modifier mon avis" })
    );

    fireEvent.change(
      screen.getByLabelText("Votre commentaire"),
      { target: { value: "Séjour modifié" } }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer les modifications",
      })
    );

    await waitFor(() => {
      expect(updateAvis).toHaveBeenCalledWith(1, {
        chambre_id: 10,
        note: 5,
        commentaire: "Séjour modifié",
      });
    });
  });

  it("annule la modification", async () => {
    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(
      screen.getByRole("button", { name: "Modifier mon avis" })
    );

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(
      screen.queryByText("Modifier mon avis", { selector: "h2" })
    ).not.toBeInTheDocument();
  });

  it("demande confirmation avant suppression", async () => {
    window.confirm.mockReturnValue(false);

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteAvis).not.toHaveBeenCalled();
  });

  it("supprime un avis après confirmation", async () => {
    deleteAvis.mockResolvedValue({ message: "OK" });

    getAvisChambre
      .mockResolvedValueOnce(avisExemple)
      .mockResolvedValueOnce([avisExemple[1]]);

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(deleteAvis).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.queryByText("Excellent séjour")).not.toBeInTheDocument();
    });
  });

  it("gère une erreur lors de la suppression", async () => {
    deleteAvis.mockRejectedValue(new Error("Suppression impossible"));

    afficherPage();

    await screen.findByText("Excellent séjour");

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(
      await screen.findByText("Suppression impossible")
    ).toBeInTheDocument();
  });
});
