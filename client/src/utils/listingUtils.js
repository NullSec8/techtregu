/** Map UI filter chips → API category enum */
export const FILTER_TO_API = {
  all: null,
  gpu: 'gpu',
  cpu: 'cpu',
  pc: 'desktop',
  ram: 'ram',
  ssd: 'storage',
};

export const CATEGORY_LABEL = {
  laptop: 'Laptop',
  desktop: 'PC',
  gpu: 'GPU',
  cpu: 'CPU',
  ram: 'RAM',
  storage: 'Storage',
  monitor: 'Monitor',
  peripheral: 'Peripheral',
  other: 'Other',
};

export const CONDITION_LABEL = {
  new: 'New',
  used: 'Used',
  refurbished: 'Refurbished',
};

const EMOJI = {
  laptop: '💻',
  desktop: '🖥️',
  gpu: '🎮',
  cpu: '⚡',
  ram: '💾',
  storage: '💿',
  monitor: '🖵',
  peripheral: '⌨️',
  other: '📦',
};

export function categoryEmoji(category) {
  return EMOJI[category] || '📦';
}

export function displayCategory(category) {
  return CATEGORY_LABEL[category] || category;
}

/**
 * Normalize API listing (Mongo _id, populated seller, specs object/map).
 */
export function normalizeListing(raw) {
  if (!raw) return null;
  const specs =
    raw.specs && typeof raw.specs === 'object'
      ? raw.specs instanceof Map
        ? Object.fromEntries(raw.specs)
        : { ...raw.specs }
      : {};

  const seller = raw.seller
    ? {
        ...raw.seller,
        name:
          [raw.seller.firstName, raw.seller.lastName].filter(Boolean).join(' ') ||
          raw.seller.username ||
          'Seller',
      }
    : null;

  return {
    ...raw,
    id: raw._id,
    specs,
    seller,
  };
}

export function specsEntries(specs) {
  if (!specs) return [];
  if (specs instanceof Map) return [...specs.entries()];
  return Object.entries(specs);
}
