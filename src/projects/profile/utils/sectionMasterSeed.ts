import type { SectionMasterRecord } from '../store/AppContext';

type PerMeterGroup = { category: string; rows: { size: string; kg: string }[] };

const PER_METER_GROUPS: PerMeterGroup[] = [
  {
    category: 'MS Angle',
    rows: [
      { size: '20×20×3', kg: '0.89' },
      { size: '25×25×3', kg: '1.12' },
      { size: '30×30×3', kg: '1.36' },
      { size: '35×35×5', kg: '2.60' },
      { size: '40×40×5', kg: '3.00' },
      { size: '50×50×5', kg: '3.80' },
      { size: '65×65×6', kg: '5.90' },
      { size: '75×75×6', kg: '6.80' },
      { size: '90×90×8', kg: '10.80' },
      { size: '100×100×8', kg: '12.20' },
    ],
  },
  {
    category: 'ISMC Channel',
    rows: [
      { size: '75×40', kg: '7.14' },
      { size: '100×50', kg: '9.56' },
      { size: '125×65', kg: '13.10' },
      { size: '150×75', kg: '16.80' },
      { size: '175×75', kg: '19.60' },
      { size: '200×75', kg: '22.30' },
      { size: '250×82', kg: '30.60' },
      { size: '300×90', kg: '36.30' },
      { size: '400×100', kg: '50.10' },
    ],
  },
  {
    category: 'ISMB Beam',
    rows: [
      { size: '100', kg: '11.50' },
      { size: '125', kg: '13.00' },
      { size: '150', kg: '14.90' },
      { size: '200', kg: '24.20' },
      { size: '250', kg: '37.30' },
      { size: '300', kg: '44.20' },
      { size: '350', kg: '52.40' },
      { size: '400', kg: '61.60' },
      { size: '450', kg: '72.40' },
      { size: '500', kg: '86.90' },
      { size: '600', kg: '122.60' },
    ],
  },
  {
    category: 'UC Beam',
    rows: [
      { size: '152×152×23', kg: '23' },
      { size: '203×203×46', kg: '46' },
      { size: '254×254×73', kg: '73' },
      { size: '305×305×97', kg: '97' },
      { size: '305×305×118', kg: '118' },
      { size: '356×368×129', kg: '129' },
    ],
  },
  {
    category: 'UB Beam',
    rows: [
      { size: '203×102×23', kg: '23' },
      { size: '254×146×31', kg: '31' },
      { size: '305×165×40', kg: '40' },
      { size: '356×171×51', kg: '51' },
      { size: '406×178×60', kg: '60' },
      { size: '457×191×67', kg: '67' },
      { size: '533×210×82', kg: '82' },
      { size: '610×229×101', kg: '101' },
    ],
  },
  {
    category: 'Round Bar',
    rows: [
      { size: '10 mm', kg: '0.617' },
      { size: '12 mm', kg: '0.888' },
      { size: '16 mm', kg: '1.580' },
      { size: '20 mm', kg: '2.470' },
      { size: '25 mm', kg: '3.850' },
      { size: '32 mm', kg: '6.310' },
      { size: '40 mm', kg: '9.870' },
      { size: '50 mm', kg: '15.420' },
      { size: '63 mm', kg: '24.470' },
      { size: '75 mm', kg: '34.680' },
      { size: '100 mm', kg: '61.650' },
    ],
  },
  {
    category: 'Square Bar',
    rows: [
      { size: '20×20', kg: '3.14' },
      { size: '25×25', kg: '4.91' },
      { size: '30×30', kg: '7.07' },
      { size: '40×40', kg: '12.56' },
      { size: '50×50', kg: '19.63' },
      { size: '65×65', kg: '33.17' },
      { size: '75×75', kg: '44.16' },
      { size: '100×100', kg: '78.50' },
    ],
  },
  {
    category: 'Flat Bar',
    rows: [
      { size: '25×3', kg: '0.59' },
      { size: '40×5', kg: '1.57' },
      { size: '50×6', kg: '2.36' },
      { size: '65×6', kg: '3.06' },
      { size: '75×8', kg: '4.71' },
      { size: '100×10', kg: '7.85' },
      { size: '125×12', kg: '11.78' },
      { size: '150×12', kg: '14.13' },
    ],
  },
  {
    category: 'TMT Bar',
    rows: [
      { size: '8 mm', kg: '0.395' },
      { size: '10 mm', kg: '0.617' },
      { size: '12 mm', kg: '0.888' },
      { size: '16 mm', kg: '1.580' },
      { size: '20 mm', kg: '2.470' },
      { size: '25 mm', kg: '3.850' },
      { size: '32 mm', kg: '6.310' },
    ],
  },
];

function sectionKey(category: string, size: string): string {
  return `${category.trim().toUpperCase()}|${size.trim().toUpperCase()}`;
}

function buildSeedRows(): SectionMasterRecord[] {
  const rows: SectionMasterRecord[] = [];
  let index = 0;

  for (const group of PER_METER_GROUPS) {
    for (const row of group.rows) {
      index += 1;
      rows.push({
        id: `section-seed-${index}`,
        code: `SEC-${String(index).padStart(3, '0')}`,
        category: group.category,
        size: row.size,
        kgPerMeter: row.kg,
        weightMode: 'per_meter',
        status: 'Active',
      });
    }
  }

  const formulaRows: Omit<SectionMasterRecord, 'id' | 'code'>[] = [
    {
      category: 'Pipe',
      size: 'OD × Thickness × Length',
      kgPerMeter: '',
      weightMode: 'pipe',
      status: 'Active',
    },
    {
      category: 'Plate / Sheet',
      size: 'Thickness × Width × Length',
      kgPerMeter: '',
      weightMode: 'plate',
      status: 'Active',
    },
  ];

  for (const row of formulaRows) {
    index += 1;
    rows.push({
      ...row,
      id: `section-seed-${index}`,
      code: `SEC-${String(index).padStart(3, '0')}`,
    });
  }

  return rows;
}

export const SECTION_CATEGORIES = [
  'MS Angle',
  'ISMC Channel',
  'ISMB Beam',
  'UC Beam',
  'UB Beam',
  'Round Bar',
  'Square Bar',
  'Flat Bar',
  'Pipe',
  'Plate / Sheet',
  'TMT Bar',
] as const;

export const seedSections: SectionMasterRecord[] = buildSeedRows();

export function mergeSectionCatalog(existing: SectionMasterRecord[]): SectionMasterRecord[] {
  const byKey = new Map(existing.map(row => [sectionKey(row.category, row.size), row]));
  const merged = [...existing];

  for (const seed of seedSections) {
    const key = sectionKey(seed.category, seed.size);
    if (byKey.has(key)) continue;
    merged.push(seed);
    byKey.set(key, seed);
  }

  return merged;
}
