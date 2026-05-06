import type { DisplayUnit } from '../types';

export const ML_PER_OZ = 29.5735;

export function mlToDisplay(ml: number, unit: DisplayUnit): number {
  return unit === 'ml' ? ml : ml / ML_PER_OZ;
}

export function displayToMl(value: number, unit: DisplayUnit): number {
  return unit === 'ml' ? value : value * ML_PER_OZ;
}

export function formatVolume(ml: number, unit: DisplayUnit): string {
  const v = mlToDisplay(ml, unit);
  return unit === 'ml' ? `${Math.round(v)} ml` : `${v.toFixed(2)} oz`;
}
