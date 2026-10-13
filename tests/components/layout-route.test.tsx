import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { DemoProvider } from "../../src/state/DemoContext";
import { LayoutEditorPage } from "../../src/pages/merchandising/PlanningPages";
import { demoService } from "../../src/services/demo";
afterEach(cleanup);
beforeEach(async () => {
  sessionStorage.setItem("paspm-role", "merchandiser");
  await demoService.dispatch({ type: "reset" }, "system");
});
function Navigation() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/layouts/new")}>
      Create another display
    </button>
  );
}
describe("layout route identity", () => {
  it("starts a fresh editor when navigating from an existing display to create", () => {
    render(
      <MemoryRouter initialEntries={["/layouts/l1"]}>
        <DemoProvider>
          <Navigation />
          <Routes>
            <Route path="/layouts/new" element={<LayoutEditorPage />} />
            <Route path="/layouts/:id" element={<LayoutEditorPage />} />
          </Routes>
        </DemoProvider>
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Layout name")).toHaveValue(
      "Weekend discovery",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Create another display" }),
    );
    expect(screen.getByLabelText("Layout name")).toHaveValue(
      "New discovery display",
    );
  });
  it("does not silently create a replacement for a missing layout ID", () => {
    render(
      <MemoryRouter initialEntries={["/layouts/missing"]}>
        <DemoProvider>
          <Routes>
            <Route path="/layouts/:id" element={<LayoutEditorPage />} />
          </Routes>
        </DemoProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Layout not found")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save & approve layout" }),
    ).not.toBeInTheDocument();
  });
});
