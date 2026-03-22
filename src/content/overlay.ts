import { EyeOff, Minus, Plus } from "lucide";

import type { CompanyStatus } from "../shared/settings";

export const OVERLAY_ATTRIBUTE = "data-role-lens-overlay";

type OverlayOptions = {
  card: HTMLElement;
  status: CompanyStatus;
  onStatusChange: (status: CompanyStatus) => Promise<void>;
};

const STATUS_OPTIONS: CompanyStatus[] = ["+", "-", "x"];

const ICONS: Record<CompanyStatus, string[][]> = {
  "+": Plus,
  "-": Minus,
  x: EyeOff
};

function createIcon(doc: Document, status: CompanyStatus) {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  ICONS[status].forEach(([tagName, attrs]) => {
    const child = doc.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(attrs).forEach(([key, value]) => {
      child.setAttribute(key, value);
    });
    svg.append(child);
  });

  return svg;
}

function getStatusLabel(status: CompanyStatus) {
  switch (status) {
    case "+":
      return "High interest";
    case "-":
      return "Low interest";
    case "x":
      return "Hide company";
  }
}

function getOverlayAnchor(card: HTMLElement) {
  const bookmarkButton = card.querySelector<HTMLElement>(".bookmarkBtn");
  return bookmarkButton?.parentElement instanceof HTMLElement
    ? bookmarkButton.parentElement
    : card;
}

function setOverlayVisibility(overlay: HTMLElement, visible: boolean) {
  overlay.style.opacity = visible ? "1" : "0";
  overlay.style.pointerEvents = visible ? "auto" : "none";
  overlay.style.transform = visible ? "translateY(0)" : "translateY(-4px)";
}

function updateSelectedStatus(overlay: HTMLElement, status: CompanyStatus) {
  const buttons = overlay.querySelectorAll<HTMLButtonElement>("button[data-status]");
  buttons.forEach((button) => {
    const selected = button.dataset.status === status;
    button.dataset.selected = String(selected);
    button.style.background = selected ? "#111827" : "transparent";
    button.style.color = selected ? "#f8fafc" : "#334155";
    button.style.boxShadow = selected
      ? "0 1px 2px rgba(15, 23, 42, 0.18)"
      : "none";
  });
}

export function attachOverlay({
  card,
  status,
  onStatusChange
}: OverlayOptions) {
  let overlay = card.querySelector<HTMLElement>(`[${OVERLAY_ATTRIBUTE}="true"]`);

  if (!overlay) {
    const anchor = getOverlayAnchor(card);
    overlay = card.ownerDocument.createElement("div");
    overlay.setAttribute(OVERLAY_ATTRIBUTE, "true");
    overlay.style.position = "absolute";
    overlay.style.top = "12px";
    overlay.style.left = "12px";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.gap = "4px";
    overlay.style.padding = "4px";
    overlay.style.border = "1px solid rgba(148, 163, 184, 0.3)";
    overlay.style.borderRadius = "999px";
    overlay.style.background = "rgba(255, 255, 255, 0.94)";
    overlay.style.backdropFilter = "blur(12px)";
    overlay.style.boxShadow =
      "0 10px 30px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08)";
    overlay.style.pointerEvents = "none";
    overlay.style.opacity = "0";
    overlay.style.transform = "translateY(-4px)";
    overlay.style.transition =
      "opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease";
    overlay.style.zIndex = "30";

    STATUS_OPTIONS.forEach((nextStatus) => {
      const button = card.ownerDocument.createElement("button");
      button.type = "button";
      button.dataset.status = nextStatus;
      button.setAttribute("aria-label", getStatusLabel(nextStatus));
      button.style.pointerEvents = "auto";
      button.style.display = "inline-flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.width = "28px";
      button.style.height = "28px";
      button.style.border = "0";
      button.style.borderRadius = "999px";
      button.style.background = "transparent";
      button.style.color = "#334155";
      button.style.cursor = "pointer";
      button.style.transition =
        "background 120ms ease, color 120ms ease, box-shadow 120ms ease";
      button.append(createIcon(card.ownerDocument, nextStatus));
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        updateSelectedStatus(overlay!, nextStatus);
        await onStatusChange(nextStatus);
      });
      overlay.append(button);
    });

    const show = () => setOverlayVisibility(overlay!, true);
    const hide = () => setOverlayVisibility(overlay!, false);

    card.addEventListener("mouseenter", show);
    card.addEventListener("mouseleave", hide);
    card.addEventListener("focusin", show);
    card.addEventListener("focusout", hide);
    if (!anchor.style.position) {
      anchor.style.position = "relative";
    }
    anchor.append(overlay);
  }

  updateSelectedStatus(overlay, status);
  return overlay;
}
