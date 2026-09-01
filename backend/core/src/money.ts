/**
 * Money is never a float. All amounts are stored as integers in minor units
 * (kobo) with a sibling currency field. PRD §6.1 / §6.3.
 */
export type Minor = number & { readonly __brand: "MinorUnits" };

export const toMinor = (naira: number): Minor => Math.round(naira * 100) as Minor;

export const toMajor = (minor: Minor): number => minor / 100;

export const fmt = (m: Minor, currency: "NGN" = "NGN"): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(m / 100);

export const addMinor = (a: Minor, b: Minor): Minor => ((a as number) + (b as number)) as Minor;

export const bpsOf = (amount: Minor, bps: number): Minor =>
  Math.round(((amount as number) * bps) / 10_000) as Minor;
