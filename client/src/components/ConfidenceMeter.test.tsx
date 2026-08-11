import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ConfidenceMeter from "./ConfidenceMeter";
import { signalFixture } from "../test/fixtures";

describe("ConfidenceMeter", () => {
  it("renders score and grade", () => {
    render(<ConfidenceMeter confidence={signalFixture.confidence} />);
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
  });

  it("maps grades to colors", () => {
    const { container } = render(<ConfidenceMeter confidence={signalFixture.confidence} size={80} />);
    const arc = container.querySelector("circle[stroke-dasharray]");
    expect(arc).toHaveAttribute("stroke", "#16a34a");
  });

  it("returns null when confidence is missing", () => {
    const { container } = render(<ConfidenceMeter confidence={undefined as never} />);
    expect(container.firstChild).toBeNull();
  });
});
