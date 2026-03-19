import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../../src/shared/settings";
import { createSettingsStore } from "../../src/shared/storage";

type StoredValue = {
  settings?: unknown;
};

function createMemoryStorage(initialValue: StoredValue = {}) {
  let value = initialValue;

  return {
    async get(_key: string) {
      return value;
    },
    async set(next: StoredValue) {
      value = { ...value, ...next };
    }
  };
}

describe("createSettingsStore", () => {
  it("loads defaults when storage is empty", async () => {
    const store = createSettingsStore(createMemoryStorage());

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it("falls back to defaults when storage read throws", async () => {
    const store = createSettingsStore({
      async get() {
        throw new Error("boom");
      },
      async set() {
        throw new Error("not used");
      }
    });

    await expect(store.load()).resolves.toEqual(DEFAULT_SETTINGS);
  });

  it("saves an exact company status", async () => {
    const store = createSettingsStore(createMemoryStorage());

    await store.setCompanyStatus("Wanted Lab", "x");

    await expect(store.load()).resolves.toEqual({
      companies: {
        "Wanted Lab": "x"
      },
      defaultUnspecifiedStatus: "+"
    });
  });

  it("deletes a saved company entry", async () => {
    const store = createSettingsStore(
      createMemoryStorage({
        settings: {
          companies: {
            "Wanted Lab": "-",
            OpenAI: "+"
          },
          defaultUnspecifiedStatus: "+"
        }
      })
    );

    await store.deleteCompany("Wanted Lab");

    await expect(store.load()).resolves.toEqual({
      companies: {
        OpenAI: "+"
      },
      defaultUnspecifiedStatus: "+"
    });
  });

  it("updates the default unspecified status", async () => {
    const store = createSettingsStore(createMemoryStorage());

    await store.setDefaultUnspecifiedStatus("-");

    await expect(store.load()).resolves.toEqual({
      companies: {},
      defaultUnspecifiedStatus: "-"
    });
  });

  it('rejects "x" as the default unspecified status', async () => {
    const store = createSettingsStore(createMemoryStorage());

    await expect(
      store.setDefaultUnspecifiedStatus("x" as never)
    ).rejects.toThrow('Default unspecified status must be "+" or "-"');
  });
});
