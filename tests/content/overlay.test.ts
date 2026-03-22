import { describe, expect, it } from "vitest";

import { createRoleLensApp } from "../../src/content/index";
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
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createRoleLensApp overlay behavior", () => {
  it("dims low-interest cards to 50 percent opacity and restores them on hover", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createRoleLensApp(
      document,
      createStore({
        companies: {
          "Wanted Lab": "-"
        },
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    expect(card.style.opacity).toBe("0.5");

    card.dispatchEvent(new Event("mouseenter", { bubbles: true }));
    expect(card.style.opacity).toBe("1");

    card.dispatchEvent(new Event("mouseleave", { bubbles: true }));
    expect(card.style.opacity).toBe("0.5");
  });

  it("adds a hover-only button group in the thumbnail top-left and highlights the effective state", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createRoleLensApp(
      document,
      createStore({
        companies: {
          "Wanted Lab": "-"
        },
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    const overlay = card.querySelector<HTMLElement>(
      '[data-role-lens-overlay="true"]'
    );
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
    const wrapper = document.createElement("li");
    const card = createCard("Wanted Lab");
    wrapper.append(card);
    document.body.append(wrapper);
    let resolveSave: (() => void) | null = null;

    const app = createRoleLensApp(
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

    expect(document.body.contains(wrapper)).toBe(false);

    resolveSave?.();
    await flushUi();
  });

  it("keeps the underlying card click target usable outside the overlay buttons", async () => {
    document.body.innerHTML = "";
    const card = createCard("Wanted Lab");
    document.body.append(card);

    const app = createRoleLensApp(
      document,
      createStore({
        companies: {},
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();

    const overlay = card.querySelector<HTMLElement>(
      '[data-role-lens-overlay="true"]'
    );
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

    const app = createRoleLensApp(
      document,
      createStore({
        companies: {},
        defaultUnspecifiedStatus: "+"
      })
    );

    await app.initialize();
    await app.refresh();

    expect(card.querySelectorAll('[data-role-lens-overlay="true"]')).toHaveLength(
      1
    );
  });

  it("propagates a saved status change across duplicate company cards", async () => {
    document.body.innerHTML = "";
    const firstWrapper = document.createElement("li");
    const secondWrapper = document.createElement("li");
    const firstCard = createCard("Wanted Lab");
    const secondCard = createCard("Wanted Lab");
    firstWrapper.append(firstCard);
    secondWrapper.append(secondCard);
    document.body.append(firstWrapper, secondWrapper);

    const app = createRoleLensApp(
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

    expect(document.body.contains(firstWrapper)).toBe(false);
    expect(document.body.contains(secondWrapper)).toBe(false);
  });
});
