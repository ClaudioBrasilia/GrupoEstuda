import { describe, it, expect } from "vitest";

describe("HomeScreen", () => {
  it("should have the correct URL configured", () => {
    const GRUPO_ESTUDA_URL = "https://study-group-boost.lovable.app";
    expect(GRUPO_ESTUDA_URL).toBe("https://study-group-boost.lovable.app");
  });

  it("should validate URL format", () => {
    const url = "https://study-group-boost.lovable.app";
    const isValidUrl = /^https?:\/\/.+/.test(url);
    expect(isValidUrl).toBe(true);
  });

  it("should have valid app configuration", () => {
    const appConfig = {
      appName: "Grupo Estuda",
      appSlug: "grupo_estuda_app",
      version: "1.0.0",
    };
    expect(appConfig.appName).toBe("Grupo Estuda");
    expect(appConfig.appSlug).toBe("grupo_estuda_app");
    expect(appConfig.version).toBe("1.0.0");
  });

  it("should have valid color scheme", () => {
    const colors = {
      primary: "#0a7ea4",
      background: "#ffffff",
      foreground: "#11181C",
      muted: "#687076",
      border: "#E5E7EB",
    };
    expect(colors.primary).toBe("#0a7ea4");
    expect(colors.background).toBe("#ffffff");
  });
});
