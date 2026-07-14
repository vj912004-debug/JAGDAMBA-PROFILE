import type { ItemMasterRecord } from '../store/AppContext';

type ItemSeedRow = {
  name: string;
  hsn: string;
  type: string;
  grade?: string;
};

const ITEM_SEED_ROWS: ItemSeedRow[] = [
  { name: 'MS Angle', hsn: '7216', type: 'Angle' },
  { name: 'MS Channel', hsn: '7216', type: 'Channel' },
  { name: 'ISMC Channel', hsn: '7216', type: 'Channel' },
  { name: 'UC Beam', hsn: '7216', type: 'Beam' },
  { name: 'UB Beam', hsn: '7216', type: 'Beam' },
  { name: 'H Beam', hsn: '7216', type: 'Beam' },
  { name: 'I Beam', hsn: '7216', type: 'Beam' },
  { name: 'Joist', hsn: '7216', type: 'Beam' },
  { name: 'Rail', hsn: '7302', type: 'Rail' },

  { name: 'MS Plate', hsn: '7208', type: 'Plate' },
  { name: 'HR Plate', hsn: '7208', type: 'Plate' },
  { name: 'Chequered Plate', hsn: '7208', type: 'Plate' },
  { name: 'Boiler Plate', hsn: '7208', type: 'Plate' },
  { name: 'SS Plate', hsn: '7219', type: 'Plate', grade: 'SS 304' },
  { name: 'MS Sheet', hsn: '7208', type: 'Sheet' },
  { name: 'HR Sheet', hsn: '7208', type: 'Sheet' },
  { name: 'CR Sheet', hsn: '7209', type: 'Sheet' },
  { name: 'GI Sheet', hsn: '7210', type: 'Sheet' },
  { name: 'GP Sheet', hsn: '7210', type: 'Sheet' },

  { name: 'MS Flat', hsn: '7211', type: 'Flat Bar' },
  { name: 'SS Flat', hsn: '7222', type: 'Flat Bar', grade: 'SS 304' },
  { name: 'Round Bar', hsn: '7214', type: 'Round Bar' },
  { name: 'Bright Bar', hsn: '7215', type: 'Round Bar' },
  { name: 'Square Bar', hsn: '7214', type: 'Round Bar' },
  { name: 'Hex Bar', hsn: '7215', type: 'Round Bar' },
  { name: 'TMT Bar', hsn: '7214', type: 'Round Bar' },
  { name: 'Wire Rod', hsn: '7213', type: 'Wire Rod' },

  { name: 'MS Pipe', hsn: '7306', type: 'Pipe' },
  { name: 'GI Pipe', hsn: '7306', type: 'Pipe' },
  { name: 'ERW Pipe', hsn: '7306', type: 'Pipe' },
  { name: 'Seamless Pipe', hsn: '7304', type: 'Pipe' },
  { name: 'Square Pipe', hsn: '7306', type: 'Pipe' },
  { name: 'Rectangular Pipe', hsn: '7306', type: 'Pipe' },

  { name: 'SS Pipe', hsn: '7306', type: 'Pipe', grade: 'SS 304' },
  { name: 'SS Round Bar', hsn: '7222', type: 'Round Bar', grade: 'SS 304' },
  { name: 'SS Angle', hsn: '7222', type: 'Angle', grade: 'SS 304' },
  { name: 'SS Channel', hsn: '7222', type: 'Channel', grade: 'SS 304' },

  { name: 'Copper', hsn: '7403', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Copper Plate', hsn: '7409', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Copper Rod', hsn: '7407', type: 'Non-Ferrous', grade: 'Other' },

  { name: 'Brass', hsn: '7403', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Brass Rod', hsn: '7407', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Brass Plate', hsn: '7409', type: 'Non-Ferrous', grade: 'Other' },

  { name: 'Aluminium', hsn: '7601', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Aluminium Plate', hsn: '7606', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Aluminium Sheet', hsn: '7606', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Aluminium Round', hsn: '7604', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Aluminium Flat', hsn: '7604', type: 'Non-Ferrous', grade: 'Other' },
  { name: 'Aluminium Pipe', hsn: '7608', type: 'Non-Ferrous', grade: 'Other' },
];

function defaultGrade(name: string, grade?: string): string {
  if (grade) return grade;
  if (name.startsWith('SS')) return 'SS 304';
  if (/^(Copper|Brass|Aluminium)/.test(name)) return 'Other';
  return 'IS 2062 E250';
}

export const ITEM_MASTER_TYPES = [
  'Plate',
  'Sheet',
  'Pipe',
  'Angle',
  'Channel',
  'Beam',
  'Rail',
  'Flat Bar',
  'Round Bar',
  'Wire Rod',
  'Non-Ferrous',
] as const;

export const seedItems: ItemMasterRecord[] = ITEM_SEED_ROWS.map((row, index) => ({
  id: `item-seed-${index + 1}`,
  code: `ITM-${String(index + 1).padStart(4, '0')}`,
  name: row.name.toUpperCase(),
  type: row.type,
  grade: defaultGrade(row.name, row.grade),
  unit: 'Kg',
  hsn: row.hsn,
}));

export function mergeItemCatalog(existing: ItemMasterRecord[]): ItemMasterRecord[] {
  const byName = new Map(existing.map(item => [item.name.toUpperCase(), item]));
  const merged = [...existing];

  for (const seed of seedItems) {
    if (byName.has(seed.name.toUpperCase())) continue;
    merged.push(seed);
    byName.set(seed.name.toUpperCase(), seed);
  }

  return merged;
}
