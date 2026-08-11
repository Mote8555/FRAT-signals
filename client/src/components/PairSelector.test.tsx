import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PairSelector from "./PairSelector";

const pairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BCH/USDT"];

describe("PairSelector", () => {
  it("renders the selected pair in the input", () => {
    render(<PairSelector pairs={pairs} selected="BTC/USDT" onSelect={() => {}} />);
    expect(screen.getByPlaceholderText("Search pair...")).toHaveValue("BTC/USDT");
  });

  it("filters pairs by query and selects on click", async () => {
    const onSelect = vi.fn();
    render(<PairSelector pairs={pairs} selected="BTC/USDT" onSelect={onSelect} />);
    const input = screen.getByPlaceholderText("Search pair...");
    await userEvent.click(input);
    await userEvent.type(input, "eth");
    expect(screen.queryByText("BTC/USDT")).not.toBeInTheDocument();
    expect(screen.getByText("ETH/USDT")).toBeInTheDocument();
    await userEvent.click(screen.getByText("ETH/USDT"));
    expect(onSelect).toHaveBeenCalledWith("ETH/USDT");
  });

  it("selects the first filtered result on Enter and clears the query", async () => {
    const onSelect = vi.fn();
    render(<PairSelector pairs={pairs} selected="BTC/USDT" onSelect={onSelect} />);
    const input = screen.getByPlaceholderText("Search pair...");
    await userEvent.click(input);
    await userEvent.type(input, "usdt{Enter}");
    expect(onSelect).toHaveBeenCalledWith("BTC/USDT");
    expect(input).toHaveValue("BTC/USDT");
  });

  it("closes the dropdown on Escape", async () => {
    render(<PairSelector pairs={pairs} selected="BTC/USDT" onSelect={() => {}} />);
    const input = screen.getByPlaceholderText("Search pair...");
    await userEvent.click(input);
    await userEvent.type(input, "{Escape}");
    expect(screen.queryByText("ETH/USDT")).not.toBeInTheDocument();
  });

  it("does not render a dropdown when there are no matches", async () => {
    render(<PairSelector pairs={pairs} selected="BTC/USDT" onSelect={() => {}} />);
    const input = screen.getByPlaceholderText("Search pair...");
    await userEvent.click(input);
    await userEvent.type(input, "zzz");
    expect(screen.queryByText("BTC/USDT")).not.toBeInTheDocument();
  });
});
