import { describe, expect, it } from "vitest";

import { createOptionsApp } from "../../src/options/index";
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
    }
  };
}

function mountOptionsDom() {
  document.body.innerHTML = `
    <main class="page">
      <section class="panel">
        <form id="company-form">
          <input id="company-name" />
          <select id="company-status">
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="x">x</option>
          </select>
          <button type="submit">Add</button>
        </form>
        <fieldset id="default-status">
          <label><input type="radio" name="default-status" value="+" />+</label>
          <label><input type="radio" name="default-status" value="-" />-</label>
        </fieldset>
        <ul id="company-list"></ul>
      </section>
    </main>
  `;
}

async function flushUi() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createOptionsApp", () => {
  it("renders saved companies and statuses", async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {
        "Wanted Lab": "x",
        OpenAI: "-"
      },
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    const items = Array.from(document.querySelectorAll("#company-list li"));
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain("OpenAI");
    expect(items[1]?.textContent).toContain("Wanted Lab");
  });

  it("adds a new exact company name", async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {},
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    const input = document.querySelector<HTMLInputElement>("#company-name");
    const select = document.querySelector<HTMLSelectElement>("#company-status");
    const form = document.querySelector<HTMLFormElement>("#company-form");

    input!.value = "Wanted Lab";
    select!.value = "x";
    form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushUi();

    const items = Array.from(document.querySelectorAll("#company-list li"));
    expect(items).toHaveLength(1);
    expect(items[0]?.textContent).toContain("Wanted Lab");
    expect((items[0]?.querySelector("select") as HTMLSelectElement).value).toBe("x");
  });

  it("changes an existing status", async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {
        "Wanted Lab": "+"
      },
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    const select = document.querySelector<HTMLSelectElement>(
      '#company-list li[data-company-name="Wanted Lab"] select'
    );

    select!.value = "-";
    select!.dispatchEvent(new Event("change", { bubbles: true }));
    await flushUi();

    expect(select!.value).toBe("-");
  });

  it("removes an entry", async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {
        "Wanted Lab": "x"
      },
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    const button = document.querySelector<HTMLButtonElement>(
      '#company-list li[data-company-name="Wanted Lab"] button[data-action="delete"]'
    );

    button!.click();
    await flushUi();

    expect(document.querySelectorAll("#company-list li")).toHaveLength(0);
  });

  it("switches the default unspecified status", async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {},
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    const radio = document.querySelector<HTMLInputElement>(
      '#default-status input[value="-"]'
    );

    radio!.checked = true;
    radio!.dispatchEvent(new Event("change", { bubbles: true }));
    await flushUi();

    expect(radio!.checked).toBe(true);
  });

  it('does not allow "x" as the default unspecified status', async () => {
    mountOptionsDom();
    const store = createStore({
      companies: {},
      defaultUnspecifiedStatus: "+"
    });

    const app = createOptionsApp(document, store);
    await app.initialize();

    expect(
      document.querySelector('#default-status input[value="x"]')
    ).toBeNull();
  });
});
