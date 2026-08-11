import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ComponentBreakdown from "./ComponentBreakdown";
import { signalFixture } from "../test/fixtures";

describe("ComponentBreakdown", () => {
  it("renders nothing without components", () => {
    const { container } = render(<ComponentBreakdown components={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders legend entries with score and weight", () => {
    render(<ComponentBreakdown components={signalFixture.confidence.components} />);
    expect(screen.getByText("Score Breakdown")).toBeInTheDocument();
    expect(screen.getByText("regime: 90 (w:0.4)")).toBeInTheDocument();
    expect(screen.getByText("trend: 80 (w:0.3)")).toBeInTheDocument();
    expect(screen.getByText("momentum: 85 (w:0.2)")).toBeInTheDocument();
    expect(screen.getByText("btcFilter: 92 (w:0.1)")).toBeInTheDocument();
  });

  it("applies flex weight to bar segments", () => {
    const { container } = render(<ComponentBreakdown components={signalFixture.confidence.components} />);
    const segments = container.querySelectorAll(".flex.h-6 > div");
    expect(segments).toHaveLength(4);
    expect((segments[0] as HTMLElement).style.flex).toMatch(/^0\.4/);
    expect((segments[1] as HTMLElement).style.flex).toMatch(/^0\.3/);
    expect((segments[2] as HTMLElement).style.flex).toMatch(/^0\.2/);
    expect((segments[3] as HTMLElement).style.flex).toMatch(/^0\.1/);
  });
});
