// Indonesian payroll tax/contribution calculations — PPh21 (income tax) and
// BPJS (social security). These rates and brackets are believed correct as of
// this writing but change periodically by government regulation.
//
// IMPORTANT: this module has NOT been reviewed by a tax accountant. Before
// relying on it for real employee payments, have an accountant verify:
//   - the PTKP amounts and progressive brackets below (UU HPP, PMK 101/2016)
//   - whether the simplified annual/12 method used here should instead be the
//     TER (Tarif Efektif Rata-rata) monthly lookup table method mandated by
//     PMK 168/2023 for withholding purposes — this module uses the older
//     manual annual-bracket approach as a simpler approximation, not the
//     official TER tables.
//   - the BPJS Ketenagakerjaan JKK rate, which is legally risk-class-based
//     (0.24%-1.74%) — this module defaults to the lowest risk class.
//   - the BPJS salary caps below, which the government adjusts periodically.

export type TaxStatus = "TK/0" | "TK/1" | "TK/2" | "TK/3" | "K/0" | "K/1" | "K/2" | "K/3";

const PTKP_ANNUAL: Record<TaxStatus, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "K/0": 58_500_000,
  "TK/2": 63_000_000,
  "K/1": 63_000_000,
  "TK/3": 67_500_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

const BIAYA_JABATAN_RATE = 0.05;
const BIAYA_JABATAN_MONTHLY_CAP = 500_000;

const PPH21_BRACKETS = [
  { upTo: 60_000_000, rate: 0.05 },
  { upTo: 250_000_000, rate: 0.15 },
  { upTo: 500_000_000, rate: 0.25 },
  { upTo: 5_000_000_000, rate: 0.30 },
  { upTo: Infinity, rate: 0.35 },
];

/** Monthly PPh21 withholding, derived from an annualized-income progressive calc. */
export function calculatePPh21Monthly(grossMonthlyTaxableIncome: number, taxStatus: TaxStatus): number {
  if (grossMonthlyTaxableIncome <= 0) return 0;
  const grossAnnual = grossMonthlyTaxableIncome * 12;
  const biayaJabatanAnnual = Math.min(grossAnnual * BIAYA_JABATAN_RATE, BIAYA_JABATAN_MONTHLY_CAP * 12);
  const ptkp = PTKP_ANNUAL[taxStatus] ?? PTKP_ANNUAL["TK/0"];
  const pkp = Math.max(0, Math.round((grossAnnual - biayaJabatanAnnual - ptkp) / 1000) * 1000);

  let remaining = pkp;
  let lowerBound = 0;
  let taxAnnual = 0;
  for (const bracket of PPH21_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = bracket.upTo - lowerBound;
    const taxableInBracket = Math.min(remaining, bracketSize);
    taxAnnual += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    lowerBound = bracket.upTo;
  }
  return Math.round(taxAnnual / 12);
}

const BPJS_KESEHATAN_EMPLOYEE_RATE = 0.01;
const BPJS_KESEHATAN_EMPLOYER_RATE = 0.04;
const BPJS_KESEHATAN_SALARY_CAP = 12_000_000;

const BPJS_JHT_EMPLOYEE_RATE = 0.02;
const BPJS_JHT_EMPLOYER_RATE = 0.037;
const BPJS_JP_EMPLOYEE_RATE = 0.01;
const BPJS_JP_EMPLOYER_RATE = 0.02;
const BPJS_JP_SALARY_CAP = 10_042_300;
const BPJS_JKK_EMPLOYER_RATE = 0.0024;
const BPJS_JKM_EMPLOYER_RATE = 0.003;

export function calculateBpjsKesehatan(baseSalary: number, enrolled: boolean) {
  if (!enrolled) return { employee: 0, employer: 0 };
  const base = Math.min(baseSalary, BPJS_KESEHATAN_SALARY_CAP);
  return {
    employee: Math.round(base * BPJS_KESEHATAN_EMPLOYEE_RATE),
    employer: Math.round(base * BPJS_KESEHATAN_EMPLOYER_RATE),
  };
}

export function calculateBpjsKetenagakerjaan(baseSalary: number, enrolled: boolean) {
  if (!enrolled) return { employee: 0, employer: 0 };
  const jpBase = Math.min(baseSalary, BPJS_JP_SALARY_CAP);
  const employee = Math.round(baseSalary * BPJS_JHT_EMPLOYEE_RATE) + Math.round(jpBase * BPJS_JP_EMPLOYEE_RATE);
  const employer = Math.round(baseSalary * BPJS_JHT_EMPLOYER_RATE)
    + Math.round(jpBase * BPJS_JP_EMPLOYER_RATE)
    + Math.round(baseSalary * BPJS_JKK_EMPLOYER_RATE)
    + Math.round(baseSalary * BPJS_JKM_EMPLOYER_RATE);
  return { employee, employer };
}
