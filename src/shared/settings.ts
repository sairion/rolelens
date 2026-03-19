export type CompanyStatus = "+" | "-" | "x";
export type DefaultUnspecifiedStatus = "+" | "-";

export type ExtensionSettings = {
  companies: Record<string, CompanyStatus>;
  defaultUnspecifiedStatus: DefaultUnspecifiedStatus;
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  companies: {},
  defaultUnspecifiedStatus: "+"
};

export function isDefaultUnspecifiedStatus(
  value: unknown
): value is DefaultUnspecifiedStatus {
  return value === "+" || value === "-";
}

export function sanitizeSettings(value: unknown): ExtensionSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_SETTINGS;
  }

  const candidate = value as Partial<ExtensionSettings>;
  const companies =
    candidate.companies && typeof candidate.companies === "object"
      ? Object.fromEntries(
          Object.entries(candidate.companies).filter((entry): entry is [
            string,
            CompanyStatus
          ] => entry[1] === "+" || entry[1] === "-" || entry[1] === "x")
        )
      : {};

  return {
    companies,
    defaultUnspecifiedStatus: isDefaultUnspecifiedStatus(
      candidate.defaultUnspecifiedStatus
    )
      ? candidate.defaultUnspecifiedStatus
      : DEFAULT_SETTINGS.defaultUnspecifiedStatus
  };
}
