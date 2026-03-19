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
  card.innerHTML = `
    <a class="job-link" href="https://wanted.co.kr/jobs/1">
      <div class="JobCard_JobCard__thumb__iOtFn">
        <button class="bookmarkBtn" aria-label="bookmark button"></button>
      </div>
      <div class="CompanyNameWithLocationPeriod__name">${companyName}</div>
    </a>
  `;

  return card;
}

async function flushUi() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createWantedBlacklistApp overlay behavior", () => {
  it("adds a hover-only button group in the thumbnail top-left and highlights the effective state", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {
          "Wanted Lab": "-"
        },
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    const overlay = card.querySelector<HTMLElement>('[data-wb-overlay="true"]');
    expect(overlay).not.toBeNull();
    expect(overlay!.style.opacity).toBe("0");
    expect(overlay!.style.pointerEvents).toBe("none");
    expect(overlay!.style.left).toBe("12px");
    expect(overlay!.style.right).toBe("");
    expect(overlay!.style.zIndex).not.toBe("");
    expect(overlay!.parentElement?.className).toContain("JobCard_JobCard__thumb");

    card.dispatchEvent(new Event("mouseenter", { bubbles: true }));
    expect(overlay!.style.opacity).toBe("1");
    expect(overlay!.style.pointerEvents).toBe("auto");

    const selected = overlay!.querySelector<HTMLButtonElement>(
      'button[data-status="-"]'
    );
    expect(selected?.dataset.selected).toBe("true");
    expect(selected?.style.background).not.toBe("");
    expect(selected?.querySelector("svg")).not.toBeNull();
  });

  it("hides the card immediately when x is clicked", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);
    let resolveSave: (() => void) | null = null;

    const app = createWantedBlacklistApp(
      document,
      {
        async load() {
          return {
          companies: {},
          defaultUnspecifiedStatus: "+"
        };
        },
        async setCompanyStatus() {
          await new Promise<void>((resolve) => {
            resolveSave = resolve;
          });

          return {
            companies: {
              "Wanted Lab": "x"
            },
            defaultUnspecifiedStatus: "+"
          };
        },
        async deleteCompany() {
          return {
            companies: {},
            defaultUnspecifiedStatus: "+"
          };
        },
        async setDefaultUnspecifiedStatus() {
          return {
            companies: {},
            defaultUnspecifiedStatus: "+"
          };
        }
      }
    );

    await app.initialize();

    const button = card.querySelector<HTMLButtonElement>('button[data-status="x"]');
    button!.click();

    expect(card.hidden).toBe(true);
    expect(card.style.display).toBe("none");

    resolveSave?.();
    await flushUi();
  });

  it("keeps the underlying card click target usable outside the overlay buttons", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {},
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    const overlay = card.querySelector<HTMLElement>('[data-wb-overlay="true"]');
    const button = overlay!.querySelector<HTMLButtonElement>('button[data-status="+"]');

    card.dispatchEvent(new Event("mouseenter", { bubbles: true }));
    expect(overlay!.style.pointerEvents).toBe("auto");
    expect(button!.style.pointerEvents).toBe("auto");
    expect(Number(overlay!.style.zIndex)).toBeGreaterThan(0);
  });

  it("re-applies the same card without duplicating overlay controls", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {},
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();
    await app.refresh();

    expect(card.querySelectorAll('[data-wb-overlay="true"]')).toHaveLength(1);
  });

  it("propagates a saved status change across duplicate company cards", async () => {
    document.body.innerHTML = "";
    const firstCard = createCard("Wanted Lab");
    const secondCard = createCard("Wanted Lab");
    document.body.append(firstCard, secondCard);

    const app = createWantedBlacklistApp(
      document,
      createStore({
        companies: {},
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    firstCard
      .querySelector<HTMLButtonElement>('button[data-status="x"]')!
      .click();
    await flushUi();

    expect(firstCard.hidden).toBe(true);
    expect(secondCard.hidden).toBe(true);
  });
});
