import {
  DEFAULT_SETTINGS,
  type CompanyStatus,
  type DefaultUnspecifiedStatus,
  type ExtensionSettings,
  isDefaultUnspecifiedStatus,
  sanitizeSettings
} from "./settings";

const SETTINGS_KEY = "settings";

type SettingsStorage = {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

async function persistSettings(
  storage: SettingsStorage,
  settings: ExtensionSettings
) {
  await storage.set({ [SETTINGS_KEY]: settings });
  return settings;
}

export function createSettingsStore(storage: SettingsStorage) {
  async function load() {
    try {
      const result = await storage.get(SETTINGS_KEY);
      return sanitizeSettings(result[SETTINGS_KEY]);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async function setCompanyStatus(companyName: string, status: CompanyStatus) {
    const current = await load();

    return persistSettings(storage, {
      ...current,
      companies: {
        ...current.companies,
        [companyName]: status
      }
    });
  }

  async function deleteCompany(companyName: string) {
    const current = await load();
    const companies = { ...current.companies };

    delete companies[companyName];

    return persistSettings(storage, {
      ...current,
      companies
    });
  }

  async function setDefaultUnspecifiedStatus(status: DefaultUnspecifiedStatus) {
    if (!isDefaultUnspecifiedStatus(status)) {
      throw new Error('Default unspecified status must be "+" or "-"');
    }

    const current = await load();

    return persistSettings(storage, {
      ...current,
      defaultUnspecifiedStatus: status
    });
  }

  return {
    load,
    setCompanyStatus,
    deleteCompany,
    setDefaultUnspecifiedStatus
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;

export function createChromeStorageArea(
  storageArea: chrome.storage.StorageArea = chrome.storage.local
): SettingsStorage {
  return {
    async get(key) {
      return storageArea.get(key);
    },
    async set(items) {
      await storageArea.set(items);
    }
  };
}
