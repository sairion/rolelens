import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../../src/shared/settings";

describe("DEFAULT_SETTINGS", () => {
  it('uses "+" as the initial default unspecified status', () => {
    expect(DEFAULT_SETTINGS.defaultUnspecifiedStatus).toBe("+");
  });
});
