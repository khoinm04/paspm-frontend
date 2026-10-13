import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DemoProvider } from "../../src/state/DemoContext";
import { ImportPage } from "../../src/pages/store/ImportPage";
import { demoService } from "../../src/services/demo";
afterEach(cleanup);
function open() {
  return render(
    <MemoryRouter>
      <DemoProvider>
        <ImportPage />
      </DemoProvider>
    </MemoryRouter>,
  );
}
describe("POS import boundary", () => {
  it("keeps continuation unavailable until a batch is selected", () => {
    open();
    expect(
      screen.getByRole("button", { name: /Continue to Column Mapping/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Browse Files" })).toBeEnabled();
  });
  it("rejects unsupported files without adding an import or enabling continuation", () => {
    const before = demoService.getSnapshot().imports.length;
    open();
    fireEvent.change(screen.getByLabelText("Upload transaction CSV"), {
      target: { files: [new File(["fake workbook"], "receipts.xlsx")] },
    });
    expect(screen.getByText(/Unsupported file type/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to Column Mapping/ }),
    ).toBeDisabled();
    expect(demoService.getSnapshot().imports).toHaveLength(before);
  });
  it("keeps valid rows available while warning about excluded rows", async () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Load warning sample" }),
    );
    await screen.findByText("Some rows were excluded");
    expect(
      screen.getByRole("button", { name: /Continue to Column Mapping/ }),
    ).toBeEnabled();
    expect(demoService.getSnapshot().imports[0].rows).toHaveLength(6);
    expect(demoService.getSnapshot().imports[0].issues).toHaveLength(1);
  });
  it("blocks continuation for a rejected schema", async () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "Load rejected sample" }),
    );
    await screen.findByText("File rejected: action required");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Continue to Column Mapping/ }),
      ).toBeDisabled(),
    );
    expect(demoService.getSnapshot().imports[0].rows).toHaveLength(0);
  });
  it("rejects oversized CSV before reading or dispatching it", () => {
    open();
    const file = new File(["x"], "large.csv", { type: "text/csv" });
    Object.defineProperty(file, "size", { value: 50 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText("Upload transaction CSV"), {
      target: { files: [file] },
    });
    expect(
      screen.getByText(/File exceeds the 50 MB limit/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Continue to Column Mapping/ }),
    ).toBeDisabled();
  });
});
