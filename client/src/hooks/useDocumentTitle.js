import { useEffect } from 'react';
import { DEFAULT_PAGE_TITLE } from '../siteMeta';

/**
 * Sets document.title. Pass full string or use pageTitle() from siteMeta for segments.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title || DEFAULT_PAGE_TITLE;
  }, [title]);
}
