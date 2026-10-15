import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, ErrorBoundary } from "solid-js";
import { describe, expect, it } from "vitest";
import { CrashScreen } from "./CrashScreen";

describe("CrashScreen", () => {
  it("replaces a crashed tree and recovers with Try again", async () => {
    const [broken, setBroken] = createSignal(true);
    function Flaky() {
      if (broken()) throw new Error("render exploded");
      return <p>Recovered</p>;
    }
    render(() => (
      <ErrorBoundary fallback={(error, reset) => <CrashScreen error={error} reset={reset} />}>
        <Flaky />
      </ErrorBoundary>
    ));

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("alert")).toHaveTextContent("render exploded");

    setBroken(false);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
  });
});
