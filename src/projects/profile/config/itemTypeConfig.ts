/**
 * itemTypeConfig.ts
 *
 * Maps every item type key used in the ERP to its print display name,
 * spec-box section heading, and the ordered list of spec fields that
 * should appear in the dynamic "Spec Box" on printed documents.
 *
 * Rules:
 *  - `key`   – stable identifier matched against order item names (case-insensitive substring)
 *  - `displayName` – how the item is labelled in the print header
 *  - `boxLabel`    – heading of the spec-box section on the print
 *  - `fields`      – ordered list of spec fields; only fields present in the
 *                    `details` object are printed; missing values render as "—"
 */

export interface ItemTypeField {
  /** Identifier used to look up the value in the form details object */
  key: string;
  /** Human-readable label shown in the spec box */
  label: string;
  /** Optional unit suffix shown after the value */
  unit?: string;
}

export interface ItemTypeConfig {
  /** Unique key for this type — also used for matching */
  key: string;
  /** Display name shown in the print document title / item name cell */
  displayName: string;
  /** Heading of the spec box section */
  boxLabel: string;
  /** Ordered list of fields shown in the spec box */
  fields: ItemTypeField[];
  /**
   * Strings used to detect this type from a raw item name (case-insensitive).
   * First match wins; order matters — put more specific patterns first.
   */
  matchPatterns: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config data
// ─────────────────────────────────────────────────────────────────────────────

export const ITEM_TYPE_CONFIGS: ItemTypeConfig[] = [
  // ── Angle ────────────────────────────────────────────────────────────────
  {
    key: 'MS_ANGLE',
    displayName: 'MS Angle',
    boxLabel: 'MATERIAL SPECIFICATION — MS ANGLE',
    matchPatterns: ['ms angle', 'ss angle', 'angle'],
    fields: [
      { key: 'size',      label: 'Size (A × B × T)',  unit: 'mm' },
      { key: 'thickness', label: 'Thickness',          unit: 'mm' },
      { key: 'length',    label: 'Length',             unit: 'mm' },
      { key: 'grade',     label: 'Grade / Standard'              },
      { key: 'weight',    label: 'Weight',             unit: 'kg' },
    ],
  },

  // ── Plate / Sheet ────────────────────────────────────────────────────────
  {
    key: 'MS_PLATE',
    displayName: 'MS Plate',
    boxLabel: 'MATERIAL SPECIFICATION — MS PLATE',
    matchPatterns: ['ms plate', 'hr plate', 'boiler plate', 'chequered plate', 'ss plate', 'plate'],
    fields: [
      { key: 'thickness', label: 'Thickness',  unit: 'mm' },
      { key: 'width',     label: 'Width',      unit: 'mm' },
      { key: 'length',    label: 'Length',     unit: 'mm' },
      { key: 'grade',     label: 'Grade / Standard'       },
      { key: 'weight',    label: 'Weight',     unit: 'kg' },
    ],
  },

  // ── Sheet ────────────────────────────────────────────────────────────────
  {
    key: 'MS_SHEET',
    displayName: 'MS Sheet',
    boxLabel: 'MATERIAL SPECIFICATION — MS SHEET',
    matchPatterns: ['ms sheet', 'hr sheet', 'cr sheet', 'gi sheet', 'gp sheet', 'sheet'],
    fields: [
      { key: 'thickness', label: 'Thickness',  unit: 'mm' },
      { key: 'width',     label: 'Width',      unit: 'mm' },
      { key: 'length',    label: 'Length',     unit: 'mm' },
      { key: 'grade',     label: 'Grade / Standard'       },
      { key: 'weight',    label: 'Weight',     unit: 'kg' },
    ],
  },

  // ── Channel ──────────────────────────────────────────────────────────────
  {
    key: 'MS_CHANNEL',
    displayName: 'MS Channel',
    boxLabel: 'MATERIAL SPECIFICATION — MS CHANNEL',
    matchPatterns: ['ms channel', 'ismc channel', 'ss channel', 'channel'],
    fields: [
      { key: 'size',   label: 'Size (H × B)',       unit: 'mm' },
      { key: 'length', label: 'Length',              unit: 'mm' },
      { key: 'grade',  label: 'Grade / Standard'              },
      { key: 'weight', label: 'Weight',              unit: 'kg' },
    ],
  },

  // ── Beam (ISMB / UC / UB / H Beam / I Beam / Joist) ─────────────────────
  {
    key: 'BEAM',
    displayName: 'MS Beam',
    boxLabel: 'MATERIAL SPECIFICATION — MS BEAM',
    matchPatterns: ['ismb', 'uc beam', 'ub beam', 'h beam', 'i beam', 'joist', 'beam'],
    fields: [
      { key: 'size',   label: 'Size',         unit: 'mm' },
      { key: 'length', label: 'Length',        unit: 'mm' },
      { key: 'grade',  label: 'Grade / Standard'         },
      { key: 'weight', label: 'Weight',        unit: 'kg' },
    ],
  },

  // ── Flat Bar ─────────────────────────────────────────────────────────────
  {
    key: 'MS_FLAT',
    displayName: 'MS Flat',
    boxLabel: 'MATERIAL SPECIFICATION — MS FLAT BAR',
    matchPatterns: ['ms flat', 'ss flat', 'flat bar', 'flat'],
    fields: [
      { key: 'size',      label: 'Size (W × T)', unit: 'mm' },
      { key: 'thickness', label: 'Thickness',    unit: 'mm' },
      { key: 'length',    label: 'Length',       unit: 'mm' },
      { key: 'grade',     label: 'Grade / Standard'        },
      { key: 'weight',    label: 'Weight',       unit: 'kg' },
    ],
  },

  // ── Round Bar ────────────────────────────────────────────────────────────
  {
    key: 'ROUND_BAR',
    displayName: 'Round Bar',
    boxLabel: 'MATERIAL SPECIFICATION — ROUND BAR',
    matchPatterns: ['round bar', 'bright bar', 'tmt bar', 'square bar', 'hex bar', 'wire rod', 'ss round'],
    fields: [
      { key: 'diameter', label: 'Diameter',  unit: 'mm' },
      { key: 'length',   label: 'Length',    unit: 'mm' },
      { key: 'grade',    label: 'Grade / Standard'      },
      { key: 'weight',   label: 'Weight',    unit: 'kg' },
    ],
  },

  // ── Pipe ─────────────────────────────────────────────────────────────────
  {
    key: 'MS_PIPE',
    displayName: 'MS Pipe',
    boxLabel: 'MATERIAL SPECIFICATION — MS PIPE',
    matchPatterns: ['ms pipe', 'gi pipe', 'erw pipe', 'seamless pipe', 'square pipe', 'rectangular pipe', 'ss pipe', 'pipe'],
    fields: [
      { key: 'outerDiameter', label: 'OD (Outer Dia)',  unit: 'mm' },
      { key: 'thickness',     label: 'Wall Thickness',  unit: 'mm' },
      { key: 'length',        label: 'Length',          unit: 'mm' },
      { key: 'grade',         label: 'Grade / Standard'            },
      { key: 'weight',        label: 'Weight',          unit: 'kg' },
    ],
  },

  // ── Rail ─────────────────────────────────────────────────────────────────
  {
    key: 'RAIL',
    displayName: 'Rail',
    boxLabel: 'MATERIAL SPECIFICATION — RAIL',
    matchPatterns: ['rail'],
    fields: [
      { key: 'size',   label: 'Section',      unit: 'kg/m' },
      { key: 'length', label: 'Length',        unit: 'mm'  },
      { key: 'grade',  label: 'Grade / Standard'           },
      { key: 'weight', label: 'Weight',        unit: 'kg'  },
    ],
  },

  // ── Non-Ferrous (Copper / Brass / Aluminium) ──────────────────────────────
  {
    key: 'NON_FERROUS',
    displayName: 'Non-Ferrous Material',
    boxLabel: 'MATERIAL SPECIFICATION',
    matchPatterns: ['copper', 'brass', 'aluminium', 'aluminum'],
    fields: [
      { key: 'size',      label: 'Size / Profile'           },
      { key: 'thickness', label: 'Thickness',    unit: 'mm' },
      { key: 'length',    label: 'Length',       unit: 'mm' },
      { key: 'grade',     label: 'Grade / Alloy'            },
      { key: 'weight',    label: 'Weight',       unit: 'kg' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find an ItemTypeConfig by its exact key (e.g. "MS_PLATE").
 */
export function getItemTypeConfigByKey(key: string): ItemTypeConfig | undefined {
  return ITEM_TYPE_CONFIGS.find(c => c.key === key);
}

/**
 * Infer the best-matching ItemTypeConfig from a raw item name string
 * (e.g. "MS ANGLE 75×75×6", "HR PLATE", "ISMC CHANNEL 100×50").
 * Returns undefined when no pattern matches.
 */
export function inferItemTypeFromName(rawName: string): ItemTypeConfig | undefined {
  if (!rawName) return undefined;
  const lower = rawName.trim().toLowerCase();
  for (const config of ITEM_TYPE_CONFIGS) {
    for (const pattern of config.matchPatterns) {
      if (lower.includes(pattern)) return config;
    }
  }
  return undefined;
}

/**
 * Build a spec-details object from a POItem / OrderLineItem.
 * The keys match the `field.key` strings in each ItemTypeConfig.
 */
export interface SpecDetails {
  size?: string;
  thickness?: string | number;
  width?: string | number;
  length?: string | number;
  grade?: string;
  weight?: string | number;
  diameter?: string | number;
  outerDiameter?: string | number;
  [key: string]: string | number | undefined;
}
