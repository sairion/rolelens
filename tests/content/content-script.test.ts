import { describe, expect, it } from "vitest";

import { createWantedBlacklistApp } from "../../src/content/index";
import type { CompanyStatus, ExtensionSettings } from "../../src/shared/settings";

function createStore(initialSettings: ExtensionSettings) {
  let settings = structuredClone(initialSettings);

  return {
    async load() {
      return structuredClone(settings);
    },
    async setCompanyStatus(companyName: string, status: CompanyStatus) {
      settings = {
        ...settings,
        companies: {
          ...settings.companies,
          [companyName]: status
        }
      };

      return structuredClone(settings);
    },
    async deleteCompany(companyName: string) {
      const companies = { ...settings.companies };
      delete companies[companyName];
      settings = {
        ...settings,
        companies
      };

      return structuredClone(settings);
    },
    async setDefaultUnspecifiedStatus(status: "+" | "-") {
      settings = {
        ...settings,
        defaultUnspecifiedStatus: status
      };

      return structuredClone(settings);
    },
    snapshot() {
      return structuredClone(settings);
    }
  };
}

function createCard(companyName: string) {
  const card = document.createElement("article");
  card.setAttribute("data-cy", "job-card");
  card.innerHTML = `<div class="CompanyNameWithLocationPeriod__name">${companyName}</div>`;
  return card;
}

function createWrappedCard(companyName: string) {
  const wrapper = document.createElement("li");
  const card = createCard(companyName);
  wrapper.append(card);
  return { wrapper, card };
}

async function flushUi() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createWantedBlacklistApp", () => {
  it("processes cards on the initial scan", async () => {
    document.body.innerHTML = "";
    const hidden = createWrappedCard("Wanted Lab");
    const visible = createWrappedCard("OpenAI");
    document.body.append(hidden.wrapper, visible.wrapper);

    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {
          "Wanted Lab": "x"
        },
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    expect(document.body.contains(hidden.wrapper)).toBe(false);
    expect(document.body.contains(visible.wrapper)).toBe(true);
    expect(visible.card.hidden).toBe(false);
    expect(visible.card.querySelector('[data-wb-overlay="true"]')).not.toBeNull();
  });

  it("processes newly inserted cards through MutationObserver", async () => {
    document.body.innerHTML = "";
    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {
          "Wanted Lab": "x"
        },
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    const late = createWrappedCard("Wanted Lab");
    document.body.append(late.wrapper);
    await flushUi();

    expect(document.body.contains(late.wrapper)).toBe(false);
  });

  it("updates overlay actions when the same card node is reused for a different company", async () => {
    document.body.innerHTML = "";
    const wrapped = createWrappedCard("Wanted Lab");
    document.body.append(wrapped.wrapper);
    const store = createStore({
      companies: {},
      defaultUnspecifiedStatus: "+"
    });

    const app = createWantedBlacklistApp(document, store);
    await app.initialize();

    wrapped.card.querySelector(".CompanyNameWithLocationPeriod__name")!.textContent =
      "OpenAI";
    await app.refresh();

    wrapped.card.querySelector<HTMLButtonElement>('button[data-status="x"]')!.click();
    await flushUi();

    expect(store.snapshot().companies["OpenAI"]).toBe("x");
    expect(store.snapshot().companies["Wanted Lab"]).toBeUndefined();
  });
});
