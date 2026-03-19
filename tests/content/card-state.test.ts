import { describe, expect, it } from "vitest";

import { extractCompanyName } from "../../src/content/companyName";
import { isHiddenStatus, resolveEffectiveStatus } from "../../src/content/cardState";

describe("extractCompanyName", () => {
  it("extracts the company name from the expected selector", () => {
    const card = document.createElement("article");
    card.dataset.cy = "job-card";
    card.innerHTML = '<div class="CompanyNameWithLocationPeriod__name">Wanted Lab</div>';

    expect(extractCompanyName(card)).toBe("Wanted Lab");
  });

  it("safely skips cards without the company-name element", () => {
    const card = document.createElement("article");
    card.dataset.cy = "job-card";

    expect(extractCompanyName(card)).toBeNull();
  });
});

describe("resolveEffectiveStatus", () => {
  it("uses an explicit company status when present", () => {
    expect(
      resolveEffectiveStatus(
        {
          companies: {
            "Wanted Lab": "x"
          },
          defaultUnspecifiedStatus: "+"
        },
        "Wanted Lab"
      )
    ).toBe("x");
  });

  it("falls back to the default unspecified status", () => {
    expect(
      resolveEffectiveStatus(
        {
          companies: {},
          defaultUnspecifiedStatus: "-"
        },
        "OpenAI"
      )
    ).toBe("-");
  });

  it("does not match similar company names", () => {
    expect(
      resolveEffectiveStatus(
        {
          companies: {
            Acme: "x"
          },
          defaultUnspecifiedStatus: "+"
        },
        "Acme Labs"
      )
    ).toBe("+");
  });
});

describe("isHiddenStatus", () => {
  it('maps "x" to hidden state', () => {
    expect(isHiddenStatus("x")).toBe(true);
    expect(isHiddenStatus("+")).toBe(false);
  });
});
