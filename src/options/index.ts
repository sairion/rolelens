import {
  createChromeStorageArea,
  createSettingsStore,
  type SettingsStore
} from "../shared/storage";
import type { CompanyStatus, DefaultUnspecifiedStatus } from "../shared/settings";

type OptionsApp = {
  initialize(): Promise<void>;
};

function compareCompanies([left]: [string, CompanyStatus], [right]: [string, CompanyStatus]) {
  return left.localeCompare(right);
}

export function createOptionsApp(
  doc: Document,
  store: SettingsStore
): OptionsApp {
  const form = doc.querySelector<HTMLFormElement>("#company-form");
  const companyInput = doc.querySelector<HTMLInputElement>("#company-name");
  const statusSelect = doc.querySelector<HTMLSelectElement>("#company-status");
  const companyList = doc.querySelector<HTMLUListElement>("#company-list");
  const defaultStatusFieldset = doc.querySelector<HTMLElement>("#default-status");

  if (!form || !companyInput || !statusSelect || !companyList || !defaultStatusFieldset) {
    throw new Error("Options page is missing required elements");
  }

  async function render() {
    const settings = await store.load();

    companyList.innerHTML = "";
    Object.entries(settings.companies).sort(compareCompanies).forEach(([companyName, status]) => {
      const item = doc.createElement("li");
      item.dataset.companyName = companyName;

      const label = doc.createElement("strong");
      label.textContent = companyName;

      const select = doc.createElement("select");
      ["+", "-", "x"].forEach((value) => {
        const option = doc.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = value === status;
        select.append(option);
      });
      select.addEventListener("change", async () => {
        await store.setCompanyStatus(companyName, select.value as CompanyStatus);
        await render();
      });

      const button = doc.createElement("button");
      button.type = "button";
      button.className = "delete-button";
      button.dataset.action = "delete";
      button.textContent = "Delete";
      button.addEventListener("click", async () => {
        await store.deleteCompany(companyName);
        await render();
      });

      item.append(label, select, button);
      companyList.append(item);
    });

    const radios = Array.from(
      defaultStatusFieldset.querySelectorAll<HTMLInputElement>('input[name="default-status"]')
    );
    radios.forEach((radio) => {
      radio.checked = radio.value === settings.defaultUnspecifiedStatus;
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const companyName = companyInput.value.trim();
    if (!companyName) {
      return;
    }

    await store.setCompanyStatus(companyName, statusSelect.value as CompanyStatus);
    companyInput.value = "";
    statusSelect.value = "+";
    await render();
  });

  defaultStatusFieldset.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    await store.setDefaultUnspecifiedStatus(
      target.value as DefaultUnspecifiedStatus
    );
    await render();
  });

  return {
    async initialize() {
      await render();
    }
  };
}

if (typeof document !== "undefined" && typeof chrome !== "undefined" && document.querySelector("#company-form")) {
  void createOptionsApp(
    document,
    createSettingsStore(createChromeStorageArea())
  ).initialize();
}
