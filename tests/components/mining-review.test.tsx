import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DemoProvider } from "../../src/state/DemoContext";
import {
  MiningResultsPage,
  MiningSetupPage,
} from "../../src/pages/mining/MiningPages";
import { demoService } from "../../src/services/demo";
import { selectMiningRecommendations } from "../../src/services/demo";
afterEach(cleanup);
beforeEach(async () => {
  sessionStorage.setItem("paspm-role", "system");
  await demoService.dispatch({ type: "reset" }, "system");
});
describe("mining review regression", () => {
  it("category filters retain cross-department pairings containing that category", () => {
    const state = demoService.getSnapshot();
    const pairing = selectMiningRecommendations(state, state.config)[0];
    const product = state.products.find((p) => p.id === pairing.productIds[0])!;
    render(
      <MemoryRouter>
        <DemoProvider>
          <MiningResultsPage />
        </DemoProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: product.category }));
    expect(screen.getByText(pairing.title)).toBeInTheDocument();
    expect(
      screen.queryByText("No product pairings found"),
    ).not.toBeInTheDocument();
  });
  it("results retain current approval state instead of seeded status", () => {
    render(
      <MemoryRouter>
        <DemoProvider>
          <MiningResultsPage />
        </DemoProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("approved")).toBeInTheDocument();
  });
  it("no-data guidance directs system admins to switch role instead of a denied import route", () => {
    render(
      <MemoryRouter>
        <DemoProvider>
          <MiningSetupPage />
        </DemoProvider>
      </MemoryRouter>,
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Preview the no-data state" }),
    );
    expect(
      screen.getByText(/Switch to Store Administrator to import POS data/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Import POS Data" }),
    ).not.toBeInTheDocument();
  });
});
