import type { SectionMasterRecord, SectionWeightMode } from '../store/AppContext';

const STEEL_DENSITY = 7.85; // g/cm³

/** Pipe: (OD − thickness) × thickness × 0.02466 × length (m). OD & thickness in mm. */
export function calcPipeWeightKg(odMm: number, thicknessMm: number, lengthMm: number): number {
  if (odMm <= 0 || thicknessMm <= 0 || lengthMm <= 0) return 0;
  const lengthM = lengthMm / 1000;
  return (odMm - thicknessMm) * thicknessMm * 0.02466 * lengthM;
}

/** Plate / sheet: thickness × width × length × 7.85 / 1,000,000. Dimensions in mm. */
export function calcPlateWeightKg(thicknessMm: number, widthMm: number, lengthMm: number): number {
  if (thicknessMm <= 0 || widthMm <= 0 || lengthMm <= 0) return 0;
  return (thicknessMm * widthMm * lengthMm * STEEL_DENSITY) / 1_000_000;
}

export function calcPerMeterWeightKg(kgPerMeter: number, lengthM: number): number {
  if (kgPerMeter <= 0 || lengthM <= 0) return 0;
  return kgPerMeter * lengthM;
}

export interface SectionWeightInput {
  lengthM?: number;
  lengthMm?: number;
  odMm?: number;
  thicknessMm?: number;
  widthMm?: number;
}

export function calculateSectionWeight(
  section: Pick<SectionMasterRecord, 'weightMode' | 'kgPerMeter'>,
  input: SectionWeightInput,
): number {
  const lengthM = input.lengthM ?? (input.lengthMm != null ? input.lengthMm / 1000 : 0);

  if (section.weightMode === 'pipe') {
    const lenMm = input.lengthMm ?? lengthM * 1000;
    return calcPipeWeightKg(input.odMm ?? 0, input.thicknessMm ?? 0, lenMm);
  }
  if (section.weightMode === 'plate') {
    const lenMm = input.lengthMm ?? lengthM * 1000;
    return calcPlateWeightKg(input.thicknessMm ?? 0, input.widthMm ?? 0, lenMm);
  }

  const kgpm = parseFloat(section.kgPerMeter);
  return calcPerMeterWeightKg(kgpm, lengthM);
}

export function weightModeLabel(mode: SectionWeightMode): string {
  if (mode === 'pipe') return 'Pipe Formula (OD × Thk × Length)';
  if (mode === 'plate') return 'Plate Formula (Thk × W × L)';
  return 'Standard Kg/Mtr';
}
