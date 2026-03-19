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

async function flushUi() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createWantedBlacklistApp", () => {
  it("processes cards on the initial scan", async () => {
    document.body.innerHTML = "";
    const hiddenCard = createCard("Wanted Lab");
    const visibleCard = createCard("OpenAI");
    document.body.append(hiddenCard, visibleCard);

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

    expect(hiddenCard.hidden).toBe(true);
    expect(visibleCard.hidden).toBe(false);
    expect(visibleCard.querySelector('[data-wb-overlay="true"]')).not.toBeNull();
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

    const lateCard = createCard("Wanted Lab");
    document.body.append(lateCard);
    await flushUi();

    expect(lateCard.hidden).toBe(true);
    expect(lateCard.querySelector('[data-wb-overlay="true"]')).not.toBeNull();
  });

  it("updates overlay actions when the same card node is reused for a different company", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);
    const store = createStore({
      companies: {},
      defaultUnspecifiedStatus: "+"
    });

    const app = createWantedBlacklistApp(document, store);
    await app.initialize();

    card.querySelector(".CompanyNameWithLocationPeriod__name")!.textContent = "OpenAI";
    await app.refresh();

    card.querySelector<HTMLButtonElement>('button[data-status="x"]')!.click();
    await flushUi();

    expect(store.snapshot().companies["OpenAI"]).toBe("x");
    expect(store.snapshot().companies["Wanted Lab"]).toBeUndefined();
  });
});
