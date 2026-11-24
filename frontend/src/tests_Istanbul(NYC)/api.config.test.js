import { describe, it, expect } from "vitest";
import { API } from "../config/api";

describe("Configuration API des microservices", () => {
  it("configure correctement le service Auth", () => {
    expect(API.auth).toBe("http://localhost:8005/api");
  });

  it("configure correctement le service Chambres", () => {
    expect(API.chambres).toBe("http://localhost:8001/api");
  });

  it("configure correctement le service Avis", () => {
    expect(API.avis).toBe("http://localhost:8002/api");
  });

  it("configure correctement le service Disponibilités", () => {
    expect(API.disponibilites).toBe("http://localhost:8003/api");
  });

  it("configure correctement le service Tarifs", () => {
    expect(API.tarifs).toBe("http://localhost:8004/api");
  });

  it("contient exactement les cinq microservices", () => {
    expect(Object.keys(API)).toHaveLength(5);

    expect(Object.keys(API).sort()).toEqual([
      "auth",
      "avis",
      "chambres",
      "disponibilites",
      "tarifs",
    ]);
  });
});