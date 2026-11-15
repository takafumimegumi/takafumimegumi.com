import { describe, expect, it, vi } from "vitest";
import { createBeacon } from "./createBeacon";

const MOCK_HOST = "example.com";

const MOCK_REQUEST = {
  kind: "left",
  path: "/projects/atras/",
  source: "resume",
  viewId: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b",
  seconds: 42,
  depth: 80,
};

const buildDependencies = () => ({ createBeaconPoint: vi.fn() });

const create = (
  dependencies: ReturnType<typeof buildDependencies>,
  changes: object = {},
) => createBeacon(dependencies, { ...MOCK_REQUEST, ...changes }, MOCK_HOST);

describe("createBeacon", () => {
  it("stores the beacon with the host that received it", () => {
    const dependencies = buildDependencies();

    const result = create(dependencies);

    expect(result).toEqual({ ok: true });
    expect(dependencies.createBeaconPoint).toHaveBeenCalledWith({
      host: "example.com",
      kind: "left",
      path: "/projects/atras/",
      source: "resume",
      viewId: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b",
      seconds: 42,
      depth: 80,
    });
  });

  it("stores an empty source for a beacon without one", () => {
    const dependencies = buildDependencies();

    create(dependencies, { source: undefined });

    expect(dependencies.createBeaconPoint).toHaveBeenCalledWith(
      expect.objectContaining({ source: "" }),
    );
  });

  it("stores the home page, whose path is a single slash", () => {
    const dependencies = buildDependencies();

    expect(create(dependencies, { path: "/" })).toEqual({ ok: true });
  });

  describe("the request", () => {
    it("refuses a path that does not start with a slash, and stores nothing", () => {
      const dependencies = buildDependencies();

      const result = create(dependencies, { path: "projects/atras/" });

      expect(result).toEqual({ ok: false, reason: "invalid" });
      expect(dependencies.createBeaconPoint).not.toHaveBeenCalled();
    });

    it("refuses a path with a query string in it", () => {
      const result = create(buildDependencies(), { path: "/?from=resume" });

      expect(result).toEqual({ ok: false, reason: "invalid" });
    });

    it("refuses a source with a capital letter in it", () => {
      const result = create(buildDependencies(), { source: "Resume" });

      expect(result).toEqual({ ok: false, reason: "invalid" });
    });

    it("refuses a source with a space in it", () => {
      const result = create(buildDependencies(), { source: "my resume" });

      expect(result).toEqual({ ok: false, reason: "invalid" });
    });

    it("refuses a body that is not an object", () => {
      const result = createBeacon(buildDependencies(), undefined, MOCK_HOST);

      expect(result).toEqual({ ok: false, reason: "invalid" });
    });
  });

  it("lets a failure to store the beacon throw", () => {
    const dependencies = buildDependencies();
    const failure = new Error(
      "cloudflare_analytics_engine:create_beacon_point:unknown",
    );
    dependencies.createBeaconPoint.mockImplementation(() => {
      throw failure;
    });

    expect(() => create(dependencies)).toThrow(failure);
  });
});
