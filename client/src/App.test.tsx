import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import App from "./App";
import { fractalDataFixture } from "./test/fixtures";

const { fetchPairsMock, fetchFractalMock } = vi.hoisted(() => ({
  fetchPairsMock: vi.fn().mockResolvedValue(["BTC/USDT", "ETH/USDT"]),
  fetchFractalMock: vi.fn().mockResolvedValue({}),
}));

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return {
    ...actual,
    fetchPairs: fetchPairsMock,
    fetchFractal: fetchFractalMock,
  };
});

describe("App", () => {
  beforeEach(() => {
    toast.dismiss();
    fetchPairsMock.mockReset().mockResolvedValue(["BTC/USDT", "ETH/USDT"]);
    fetchFractalMock.mockReset().mockResolvedValue(fractalDataFixture);
  });

  it("loads pairs and renders the fractal dashboard", async () => {
    render(<App />);
    await waitFor(() => expect(fetchPairsMock).toHaveBeenCalled());
    await waitFor(() => expect(fetchFractalMock).toHaveBeenCalledWith("BTC/USDT"));
    expect(await screen.findByText("BTC/USDT")).toBeInTheDocument();
  });

  it("selecting a different pair triggers a new fetch", async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText("Search pair...");
    await userEvent.click(input);
    await userEvent.type(input, "eth{Enter}");
    await waitFor(() => expect(fetchFractalMock).toHaveBeenCalledWith("ETH/USDT"));
  });

  it("renders a toast when signals update", async () => {
    render(<App />);
    expect(await screen.findByText("Signals updated")).toBeInTheDocument();
  });
});
