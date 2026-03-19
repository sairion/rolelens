export const COMPANY_NAME_SELECTOR = '[class^="CompanyNameWithLocationPeriod"]';

export function extractCompanyName(card: ParentNode) {
  const element = card.querySelector<HTMLElement>(COMPANY_NAME_SELECTOR);
  const companyName = element?.textContent?.trim();

  return companyName ? companyName : null;
}
