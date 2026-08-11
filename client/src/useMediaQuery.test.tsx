import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useMediaQuery from "./useMediaQuery";

function mockMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: "",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.spyOn(window, "matchMedia").mockReturnValue(mql as unknown as MediaQueryList);
  return mql;
}

describe("useMediaQuery", () => {
  it("returns the initial match state", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);
  });

  it("returns true when the query matches", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(true);
  });

  it("updates when the match state changes", () => {
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(result.current).toBe(false);

    const handler = mql.addEventListener.mock.calls.find(([event]) => event === "change")?.[1] as
      | ((e: MediaQueryListEvent) => void)
      | undefined;
    expect(handler).toBeDefined();
    act(() => {
      handler!({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);
  });

  it("removes the change listener on unmount", () => {
    const mql = mockMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("(max-width: 640px)"));
    expect(mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
