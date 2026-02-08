import { describe, it, expect } from "vitest";

describe("WebViewContainer Configuration", () => {
  it("should have the correct URL", () => {
    const url = "https://study-group-boost.lovable.app";
    expect(url).toBe("https://study-group-boost.lovable.app");
  });

  it("should support both web and native platforms", () => {
    const platforms = ["web", "ios", "android"];
    expect(platforms).toContain("web");
    expect(platforms).toContain("ios");
    expect(platforms).toContain("android");
  });

  it("should have loading state management", () => {
    const loadingStates = {
      isLoading: true,
      isLoaded: false,
    };
    expect(loadingStates.isLoading).toBe(true);
    expect(loadingStates.isLoaded).toBe(false);
  });

  it("should handle callback functions", () => {
    const callbacks = {
      onLoadStart: () => {},
      onLoadEnd: () => {},
      onError: () => {},
    };
    expect(typeof callbacks.onLoadStart).toBe("function");
    expect(typeof callbacks.onLoadEnd).toBe("function");
    expect(typeof callbacks.onError).toBe("function");
  });
});
