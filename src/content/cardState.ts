import type { CompanyStatus, ExtensionSettings } from "../shared/settings";

export function resolveEffectiveStatus(
  settings: ExtensionSettings,
  companyName: string
): CompanyStatus {
  return settings.companies[companyName] ?? settings.defaultUnspecifiedStatus;
}

export function isHiddenStatus(status: CompanyStatus) {
  return status === "x";
}
