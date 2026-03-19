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

function getRemovalTarget(card: HTMLElement) {
  if (card.parentElement && card.parentElement !== card.ownerDocument.body) {
    return card.parentElement;
  }

  return card;
}

function syncCardOpacity(card: HTMLElement, emphasized: boolean) {
  card.style.opacity =
    card.dataset.wbStatus === "-" && !emphasized ? "0.5" : "1";
}

function attachCardStateListeners(card: HTMLElement) {
  if (card.dataset.wbStateListeners === "true") {
    return;
  }

  const emphasize = () => syncCardOpacity(card, true);
  const relax = () => syncCardOpacity(card, false);

  card.addEventListener("mouseenter", emphasize);
  card.addEventListener("mouseleave", relax);
  card.addEventListener("focusin", emphasize);
  card.addEventListener("focusout", relax);
  card.dataset.wbStateListeners = "true";
}

function applyCardState(card: HTMLElement, status: CompanyStatus) {
  card.dataset.wbStatus = status;

  if (isHiddenStatus(status)) {
    getRemovalTarget(card).remove();
    return;
  }

  card.hidden = false;
  card.style.display = "";
  syncCardOpacity(card, false);
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

    attachCardStateListeners(card);

    attachOverlay({
      card,
      status,
      onStatusChange: async (nextStatus) => {
        const currentCompanyName = extractCompanyName(card);
        if (!currentCompanyName) {
          return;
        }

        applyCardState(card, nextStatus);
        settings = await store.setCompanyStatus(currentCompanyName, nextStatus);
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
