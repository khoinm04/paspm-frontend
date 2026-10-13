import { describe, it, expect } from "vitest";
import { createDemoService } from "../../src/services/demo";
const storage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
  };
};
describe("demo workflows", () => {
  it("rejects unauthorized mutations without changing state", async () => {
    const s = createDemoService();
    const before = s.getSnapshot();
    await expect(
      s.dispatch({ type: "activateCampaign", id: "c1" }, "customer"),
    ).rejects.toThrow(/permission/i);
    expect(s.getSnapshot()).toBe(before);
  });
  it("activates an approved campaign and adds its products with stock validation", async () => {
    const s = createDemoService();
    await s.dispatch({ type: "activateCampaign", id: "c1" }, "store");
    await s.dispatch({ type: "addCart", productIds: ["p1", "p2"] }, "customer");
    expect(s.getSnapshot().cart).toEqual({ p1: 1, p2: 1 });
    await expect(
      s.dispatch(
        { type: "setCartQuantity", productId: "p1", quantity: 10000 },
        "customer",
      ),
    ).rejects.toThrow(/stock/i);
  });
  it("rejects malformed imports and accepts known SKUs in cents", async () => {
    const s = createDemoService();
    await s.dispatch(
      { type: "importCsv", name: "bad.csv", text: "wrong\n1" },
      "store",
    );
    expect(s.getSnapshot().imports[0].status).toBe("rejected");
    await s.dispatch(
      {
        type: "importCsv",
        name: "good.csv",
        text: "receipt_id,sku,quantity,price,timestamp\nr10,COF-001,2,4.50,2026-10-01",
      },
      "store",
    );
    expect(s.getSnapshot().imports[0].rows[0].price).toBe(450);
  });
  it("completes deterministic mining and forbids concurrent jobs", async () => {
    const s = createDemoService();
    await s.dispatch({ type: "startMining" }, "system");
    const id = s.getSnapshot().jobs[0].id;
    await expect(s.dispatch({ type: "startMining" }, "system")).rejects.toThrow(
      /running/i,
    );
    await s.dispatch({ type: "completeMining", id }, "system");
    expect(s.getSnapshot().jobs[0].status).toBe("completed");
    expect(s.getSnapshot().jobs[0].count).toBeGreaterThan(0);
  });
  it("persists, resets, and recovers corrupted storage", async () => {
    const db = storage();
    const s = createDemoService(db);
    await s.dispatch({ type: "addCart", productIds: ["p1"] }, "customer");
    expect(createDemoService(db).getSnapshot().cart.p1).toBe(1);
    await s.dispatch({ type: "reset" }, "store");
    expect(createDemoService(db).getSnapshot().cart).toEqual({});
    db.setItem("paspm-demo-v1", '{"version":1}');
    expect(createDemoService(db).getSnapshot().products).toHaveLength(12);
  });
  it("requires approved recommendations for approved layouts", async () => {
    const s = createDemoService();
    await expect(
      s.dispatch(
        {
          type: "saveLayout",
          layout: {
            id: "l2",
            name: "New",
            slots: ["r2", null, null, null],
            status: "approved",
          },
        },
        "merchandiser",
      ),
    ).rejects.toThrow(/approved/i);
  });
});
describe("consistency boundaries", () => {
  it("keeps bundle addition atomic when the last product has insufficient stock", async () => {
    const s = createDemoService();
    const product = { ...s.getSnapshot().products[1], stock: 0 };
    await s.dispatch({ type: "saveProduct", product }, "store");
    await expect(
      s.dispatch({ type: "addCart", productIds: ["p1", "p2"] }, "customer"),
    ).rejects.toThrow(/stock/i);
    expect(s.getSnapshot().cart).toEqual({});
  });
  it("protects the last administrator", async () => {
    const s = createDemoService();
    await expect(
      s.dispatch({ type: "deleteUser", id: "u1" }, "system"),
    ).rejects.toThrow(/administrator/i);
    expect(s.getSnapshot().users).toHaveLength(3);
  });
  it("keeps active campaign layouts immutable until paused", async () => {
    const s = createDemoService();
    await s.dispatch({ type: "activateCampaign", id: "c1" }, "store");
    await expect(
      s.dispatch(
        {
          type: "saveLayout",
          layout: { ...s.getSnapshot().layouts[0], name: "Changed" },
        },
        "merchandiser",
      ),
    ).rejects.toThrow(/pause/i);
    await s.dispatch({ type: "pauseCampaign", id: "c1" }, "store");
    await s.dispatch(
      {
        type: "saveLayout",
        layout: { ...s.getSnapshot().layouts[0], name: "Changed" },
      },
      "merchandiser",
    );
    expect(s.getSnapshot().layouts[0].name).toBe("Changed");
  });
  it("accepts valid CSV rows with a warning and ignores unknown SKUs", async () => {
    const s = createDemoService();
    await s.dispatch(
      {
        type: "importCsv",
        name: "mixed.csv",
        text: 'receipt_id,sku,quantity,price,timestamp\n"Receipt, one",COF-001,1,4.5,2026-10-01\nr2,UNKNOWN,1,5,2026-10-01',
      },
      "store",
    );
    const batch = s.getSnapshot().imports[0];
    expect(batch.status).toBe("warning");
    expect(batch.rows).toHaveLength(1);
    expect(batch.rows[0].receiptId).toBe("Receipt, one");
    expect(batch.issues).toHaveLength(1);
  });
  it("notifies subscribers exactly on successful mutations", async () => {
    const s = createDemoService();
    let count = 0;
    const stop = s.subscribe(() => {
      count++;
    });
    await s.dispatch({ type: "addCart", productIds: ["p1"] }, "customer");
    await expect(
      s.dispatch({ type: "activateCampaign", id: "c1" }, "customer"),
    ).rejects.toThrow();
    expect(count).toBe(1);
    stop();
    await s.dispatch(
      { type: "setCartQuantity", productId: "p1", quantity: 0 },
      "customer",
    );
    expect(count).toBe(1);
  });
});
describe("approved role mapping", () => {
  it("allows system mining, merchandiser utility, and store integrations only within each role", async () => {
    const s = createDemoService();
    await expect(s.dispatch({ type: "startMining" }, "store")).rejects.toThrow(
      /permission/i,
    );
    await s.dispatch({ type: "startMining" }, "system");
    await expect(
      s.dispatch({ type: "syncConnection", id: "conn1" }, "merchandiser"),
    ).rejects.toThrow(/permission/i);
    await s.dispatch({ type: "syncConnection", id: "conn1" }, "store");
    await s.dispatch(
      {
        type: "saveUtility",
        utility: { profit: 70, quantity: 30, priority: "Profit" },
      },
      "merchandiser",
    );
    await expect(
      s.dispatch(
        {
          type: "saveUtility",
          utility: { profit: 80, quantity: 30, priority: "Profit" },
        },
        "merchandiser",
      ),
    ).rejects.toThrow(/100/);
  });
  it("rejects completion of a job from before reset", async () => {
    const s = createDemoService();
    await s.dispatch({ type: "startMining" }, "system");
    const id = s.getSnapshot().jobs[0].id;
    await s.dispatch({ type: "reset" }, "system");
    await expect(
      s.dispatch({ type: "completeMining", id }, "system"),
    ).rejects.toThrow(/exists/i);
    expect(s.getSnapshot().jobs).toHaveLength(0);
  });
});
describe("archive and threshold invariants", () => {
  it("archives products and users instead of deleting their history", async () => {
    const s = createDemoService();
    const product = {
      ...s.getSnapshot().products[0],
      id: "new-p",
      sku: "NEW-001",
    };
    await s.dispatch({ type: "saveProduct", product }, "store");
    await s.dispatch({ type: "deleteProduct", id: "new-p" }, "store");
    expect(
      s.getSnapshot().products.find((p) => p.id === "new-p")?.archived,
    ).toBe(true);
    await s.dispatch({ type: "deleteUser", id: "u2" }, "system");
    expect(s.getSnapshot().users.find((u) => u.id === "u2")?.active).toBe(
      false,
    );
  });
  it("requires positive profit target and filters mining counts by profit target", async () => {
    const s = createDemoService();
    await expect(
      s.dispatch(
        {
          type: "saveConfig",
          config: { ...s.getSnapshot().config, profitTarget: 0 },
        },
        "system",
      ),
    ).rejects.toThrow();
    await s.dispatch(
      {
        type: "saveConfig",
        config: { ...s.getSnapshot().config, profitTarget: 1200 },
      },
      "system",
    );
    await s.dispatch({ type: "startMining" }, "system");
    await s.dispatch(
      { type: "completeMining", id: s.getSnapshot().jobs[0].id },
      "system",
    );
    expect(s.getSnapshot().jobs[0].count).toBe(5);
  });
});
