import { getInventoryExpiryStatus, parseInventoryDate } from "./inventory";

describe("inventory expiry helpers", () => {
  const now = new Date(2026, 4, 13); // 2026-05-13 local

  it("parses YYYY-MM-DD", () => {
    const d = parseInventoryDate("2026-05-20");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(4);
    expect(d?.getDate()).toBe(20);
  });

  it("flags expired and soon items", () => {
    expect(getInventoryExpiryStatus("2026-05-10", now)).toBe("expired");
    expect(getInventoryExpiryStatus("2026-05-15", now)).toBe("soon");
    expect(getInventoryExpiryStatus("2026-06-01", now)).toBe("ok");
  });
});
