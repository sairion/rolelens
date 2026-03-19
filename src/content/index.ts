import { isHiddenStatus, resolveEffectiveStatus } from "./cardState";
import { extractCompanyName } from "./companyName";
import { attachOverlay } from "./overlay";
import {
  createChromeStorageArea,
  createSettingsStore,
  type SettingsStore
} from "../shared/storage";
import type { CompanyStatus, ExtensionSettings } from "../shared/settings";

const JOB_CARD_SELECTOR = '[data-cy="job-card"]';

type WantedBlacklistApp = {
  initialize(): Promise<void>;
  refresh(): Promise<void>;
};

function applyCardState(card: HTMLElement, status: CompanyStatus) {
  card.dataset.wbStatus = status;

  if (isHiddenStatus(status)) {
    card.hidden = true;
    card.style.display = "none";
    return;
  }

  card.hidden = false;
  card.style.display = "";
}

export function createWantedBlacklistApp(
  doc: Document,
  store: SettingsStore
): WantedBlacklistApp {
  let settings: ExtensionSettings | null = null;
  let observer: MutationObserver | null = null;
  let refreshQueued = false;

  async function loadSettings() {
    settings = await store.load();
    return settings;
  }

  function getCards() {
    return Array.from(doc.querySelectorAll<HTMLElement>(JOB_CARD_SELECTOR));
  }

  async function processCard(card: HTMLElement) {
    const companyName = extractCompanyName(card);
    if (!companyName) {
      return;
    }

    const currentSettings = settings ?? (await loadSettings());
    const status = resolveEffectiveStatus(currentSettings, companyName);

    if (!card.style.position) {
      card.style.position = "relative";
    }

    attachOverlay({
      card,
      companyName,
      status,
      onStatusChange: async (nextCompanyName, nextStatus) => {
        applyCardState(card, nextStatus);
        settings = await store.setCompanyStatus(nextCompanyName, nextStatus);
        await refresh();
      }
    });

    applyCardState(card, status);
  }

  async function refresh() {
    settings = await loadSettings();
    await Promise.all(getCards().map(processCard));
  }

  function scheduleRefresh() {
    if (refreshQueued) {
      return;
    }

    refreshQueued = true;
    queueMicrotask(async () => {
      refreshQueued = false;
      await refresh();
    });
  }

  return {
    async initialize() {
      await refresh();

      if (!observer && doc.body) {
        observer = new MutationObserver(() => {
          scheduleRefresh();
        });
        observer.observe(doc.body, {
          childList: true,
          subtree: true
        });
      }
    },
    refresh
  };
}

if (typeof document !== "undefined" && typeof chrome !== "undefined") {
  void createWantedBlacklistApp(
    document,
    createSettingsStore(createChromeStorageArea())
  ).initialize();
}
