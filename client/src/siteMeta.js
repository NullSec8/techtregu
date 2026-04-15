export const SITE_NAME = 'TechTregu';

/** Default home title (matches index.html when no segment). */
export const DEFAULT_PAGE_TITLE = `${SITE_NAME} — Buy & sell tech`;

export function pageTitle(segment) {
  if (segment == null || segment === '') return DEFAULT_PAGE_TITLE;
  return `${segment} · ${SITE_NAME}`;
}
