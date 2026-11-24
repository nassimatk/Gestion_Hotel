
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  getAvisChambre,
  createAvis,
  updateAvis,
  deleteAvis,
  postAvis,
  getAllAvis,
} from "../services/avisApi";

const mockResponse = (body, ok = true, status = 200) => ({
  ok,
  status,
  text: vi.fn().mockResolvedValue(
    typeof body === "string" ? body : JSON.stringify(body)
  ),
});

describe("avisApi", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("récupère les avis d'une chambre", async () => {
    fetch.mockResolvedValue(mockResponse([{ id: 1, note: 5 }]));

    const result = await getAvisChambre(10);

    expect(result).toEqual([{ id: 1, note: 5 }]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("chambre_id=10"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("refuse la récupération si l'identifiant de chambre est absent", async () => {
    await expect(getAvisChambre(null)).rejects.toThrow(
      "Identifiant de chambre manquant."
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("ajoute un avis avec le token JWT", async () => {
    localStorage.setItem("token", "test-token");
    fetch.mockResolvedValue(mockResponse({ message: "Avis ajouté" }));

    const avis = {
      chambre_id: 10,
      note: 5,
      commentaire: "Excellent séjour",
    };

    const result = await createAvis(avis);

    expect(result.message).toBe("Avis ajouté");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(avis),
      })
    );
  });

  it("ajoute un avis sans token JWT", async () => {
    fetch.mockResolvedValue(mockResponse({ id: 1 }));

    await createAvis({ chambre_id: 1, note: 4 });

    const options = fetch.mock.calls[0][1];

    expect(options.headers.Authorization).toBeUndefined();
  });

  it("modifie un avis", async () => {
    fetch.mockResolvedValue(mockResponse({ message: "Avis modifié" }));

    const data = { note: 4, commentaire: "Très bien" };

    const result = await updateAvis(5, data);

    expect(result.message).toBe("Avis modifié");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/5"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(data),
      })
    );
  });

  it("refuse la modification sans identifiant", async () => {
    await expect(updateAvis(null, {})).rejects.toThrow(
      "Identifiant de l'avis manquant."
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("supprime un avis", async () => {
    fetch.mockResolvedValue(mockResponse({ message: "Avis supprimé" }));

    const result = await deleteAvis(5);

    expect(result.message).toBe("Avis supprimé");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/5"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("refuse la suppression sans identifiant", async () => {
    await expect(deleteAvis(null)).rejects.toThrow(
      "Identifiant de l'avis manquant."
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it("gère une erreur HTTP avec le message du serveur", async () => {
    fetch.mockResolvedValue(
      mockResponse({ message: "Accès refusé" }, false, 403)
    );

    await expect(getAllAvis()).rejects.toThrow("Accès refusé");
  });

  it("gère une erreur HTTP sans message", async () => {
    fetch.mockResolvedValue(mockResponse({}, false, 500));

    await expect(getAllAvis()).rejects.toThrow("Erreur serveur (500)");
  });

  it("gère une réponse qui n'est pas du JSON", async () => {
    fetch.mockResolvedValue(
      mockResponse("Erreur interne", false, 500)
    );

    await expect(getAllAvis()).rejects.toThrow("Erreur interne");
  });

  it("retourne null si la réponse est vide", async () => {
    fetch.mockResolvedValue(mockResponse(""));

    const result = await getAllAvis();

    expect(result).toBeNull();
  });

  it("récupère tous les avis", async () => {
    fetch.mockResolvedValue(mockResponse([{ id: 1 }, { id: 2 }]));

    const result = await getAllAvis();

    expect(result).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("conserve la compatibilité avec postAvis", async () => {
    fetch.mockResolvedValue(mockResponse({ id: 3 }));

    const result = await postAvis({ note: 5 });

    expect(result).toEqual({ id: 3 });
  });
});
