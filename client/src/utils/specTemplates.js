/** Category-specific spec fields for listing forms (stored in listing.specs JSON). */
export function getSpecFieldDefs(category) {
  const defs = {
    gpu: [
      { key: 'Model', label: 'GPU model', placeholder: 'e.g. RTX 4070 Ti' },
      { key: 'VRAM', label: 'VRAM', placeholder: 'e.g. 12 GB GDDR6X' },
      { key: 'TDP', label: 'TDP (optional)', placeholder: 'e.g. 285 W' },
      { key: 'Boost Clock', label: 'Boost clock (optional)', placeholder: 'e.g. 2610 MHz' },
    ],
    cpu: [
      { key: 'Model', label: 'CPU model', placeholder: 'e.g. Ryzen 9 7900X' },
      { key: 'Cores/Threads', label: 'Cores / threads', placeholder: 'e.g. 12 / 24' },
      { key: 'Socket', label: 'Socket (optional)', placeholder: 'e.g. AM5' },
      { key: 'TDP', label: 'TDP (optional)', placeholder: 'e.g. 170 W' },
    ],
    laptop: [
      { key: 'Screen', label: 'Screen', placeholder: 'e.g. 15.6" 144 Hz' },
      { key: 'CPU', label: 'CPU', placeholder: 'e.g. i7-13620H' },
      { key: 'RAM', label: 'RAM', placeholder: 'e.g. 16 GB DDR5' },
      { key: 'Storage', label: 'Storage', placeholder: 'e.g. 512 GB NVMe' },
    ],
    desktop: [
      { key: 'CPU', label: 'CPU', placeholder: 'e.g. Ryzen 7 7800X3D' },
      { key: 'GPU', label: 'GPU', placeholder: 'e.g. RTX 4070' },
      { key: 'RAM', label: 'RAM', placeholder: 'e.g. 32 GB DDR5' },
      { key: 'Storage', label: 'Storage', placeholder: 'e.g. 1 TB NVMe' },
    ],
    ram: [
      { key: 'Capacity', label: 'Capacity', placeholder: 'e.g. 32 GB (2×16)' },
      { key: 'Speed', label: 'Speed', placeholder: 'e.g. DDR5-6000' },
      { key: 'Kit', label: 'Kit / timing (optional)', placeholder: 'e.g. CL32' },
    ],
    storage: [
      { key: 'Type', label: 'Type', placeholder: 'e.g. NVMe SSD' },
      { key: 'Capacity', label: 'Capacity', placeholder: 'e.g. 1 TB' },
      { key: 'Interface', label: 'Interface (optional)', placeholder: 'e.g. PCIe 4.0' },
    ],
    monitor: [
      { key: 'Size', label: 'Size / resolution', placeholder: 'e.g. 27" 1440p' },
      { key: 'Refresh', label: 'Refresh rate', placeholder: 'e.g. 165 Hz' },
      { key: 'Panel', label: 'Panel (optional)', placeholder: 'e.g. IPS' },
    ],
    peripheral: [
      { key: 'Type', label: 'Type', placeholder: 'e.g. Mechanical keyboard' },
      { key: 'Connection', label: 'Connection', placeholder: 'e.g. USB-C / wireless' },
    ],
    other: [
      { key: 'Brand', label: 'Brand / model', placeholder: 'e.g. Manufacturer + model' },
      { key: 'Warranty', label: 'Warranty (optional)', placeholder: 'e.g. 12 months remaining' },
    ],
  };
  return defs[category] || defs.other;
}

/** Merge user-entered spec values into a clean object for the API. */
export function buildSpecsPayload(category, specState) {
  const defs = getSpecFieldDefs(category);
  const out = {};
  for (const { key } of defs) {
    const v = specState[key];
    if (v != null && String(v).trim() !== '') {
      out[key] = String(v).trim();
    }
  }
  return out;
}

/** Initialise spec state object when category changes (preserve overlapping keys). */
export function initSpecStateForCategory(category, previous = {}) {
  const defs = getSpecFieldDefs(category);
  const next = {};
  for (const { key } of defs) {
    next[key] = previous[key] != null ? previous[key] : '';
  }
  return next;
}
