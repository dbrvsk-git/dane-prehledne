// Tax calculation logic for Czech OSVČ 2027

export type ExpenseType = 80 | 60 | 40;
export type ActivityType = 'main' | 'secondary';

export interface TaxInputs {
  annualIncome: number;
  expenseType: ExpenseType;
  taxpayerDiscount: boolean;
  activityType: ActivityType;
  isStarting: boolean;
}

export interface FlatTaxResult {
  available: boolean;
  unavailableReason?: string;
  tier: number;
  monthlyPayment: number;
  annualTotal: number;
  tierName: string;
}

export interface ClassicTaxResult {
  expenses: number;
  expenseCap: number;
  taxBase: number;
  incomeTax: number;
  taxpayerDiscount: number;
  incomeTaxAfterDiscount: number;
  socialInsurance: number;
  socialMonthly: number;
  socialNote?: string;
  healthInsurance: number;
  healthMonthly: number;
  annualTotal: number;
  netIncome: number;
  effectiveRate: number;
}

// Flat tax tiers (monthly)
const FLAT_TAX_TIERS = [
  { tier: 1, monthly: 9984, label: '1. pásmo' },
  { tier: 2, monthly: 16745, label: '2. pásmo' },
  { tier: 3, monthly: 27139, label: '3. pásmo' },
];

// Expense caps
const EXPENSE_CAPS: Record<ExpenseType, number> = {
  80: 1600000,
  60: 1200000,
  40: 800000,
};

// Constants
const TAXPAYER_DISCOUNT = 30840;
const SOCIAL_RATE = 0.292;
const HEALTH_RATE = 0.135;
const SOCIAL_MIN_ANNUAL_MAIN = 235044; // 12 × 19587
const HEALTH_MIN_ANNUAL_MAIN = 293802; // 12 × 24483.50
const STARTING_SOCIAL_MONTHLY = 3575;
const STARTING_HEALTH_MONTHLY = 3306;
const PROGRESSIVE_THRESHOLD = 1762812;

export function calculateFlatTax(inputs: TaxInputs): FlatTaxResult {
  const { annualIncome, expenseType } = inputs;

  if (annualIncome > 2000000) {
    return {
      available: false,
      unavailableReason: 'Paušální daň je dostupná pouze pro příjmy do 2 000 000 Kč.',
      tier: 0,
      monthlyPayment: 0,
      annualTotal: 0,
      tierName: '',
    };
  }

  // Determine tier
  let tier = 3;

  // Tier 1 conditions
  if (annualIncome <= 1000000) {
    tier = 1;
  } else if (annualIncome <= 1500000 && (expenseType === 60 || expenseType === 80)) {
    tier = 1;
  } else if (annualIncome <= 2000000 && expenseType === 80) {
    tier = 1;
  } else if (annualIncome <= 1500000) {
    tier = 2;
  }

  const tierData = FLAT_TAX_TIERS[tier - 1];

  return {
    available: true,
    tier: tierData.tier,
    monthlyPayment: tierData.monthly,
    annualTotal: tierData.monthly * 12,
    tierName: tierData.label,
  };
}

export function calculateClassicTax(inputs: TaxInputs): ClassicTaxResult {
  const { annualIncome, expenseType, taxpayerDiscount, activityType, isStarting } = inputs;

  // Expenses
  const rawExpenses = annualIncome * (expenseType / 100);
  const expenseCap = EXPENSE_CAPS[expenseType];
  const expenses = Math.min(rawExpenses, expenseCap);

  // Tax base
  const taxBase = Math.max(0, annualIncome - expenses);

  // Income tax (progressive: 15% up to threshold, 23% above)
  let incomeTax: number;
  if (taxBase <= PROGRESSIVE_THRESHOLD) {
    incomeTax = Math.round(taxBase * 0.15);
  } else {
    incomeTax = Math.round(PROGRESSIVE_THRESHOLD * 0.15 + (taxBase - PROGRESSIVE_THRESHOLD) * 0.23);
  }

  // Taxpayer discount
  const discount = taxpayerDiscount ? TAXPAYER_DISCOUNT : 0;
  const incomeTaxAfterDiscount = Math.max(0, incomeTax - discount);

  // Social insurance
  const socialBase = taxBase * 0.55;
  let socialInsurance: number;
  let socialMonthly: number;
  let socialNote: string | undefined;

  if (isStarting) {
    socialMonthly = STARTING_SOCIAL_MONTHLY;
    socialInsurance = socialMonthly * 12;
    socialNote = 'Snížená záloha pro začínající OSVČ – skutečná výše se doplatí/vrátí po podání přehledu';
  } else {
    const socialMinAnnual = activityType === 'main' ? SOCIAL_MIN_ANNUAL_MAIN : 0;
    const effectiveSocialBase = Math.max(socialBase, socialMinAnnual);
    socialInsurance = Math.round(effectiveSocialBase * SOCIAL_RATE);
    socialMonthly = Math.round(socialInsurance / 12);
  }

  // Health insurance
  const healthBase = taxBase * 0.50;
  const healthMinAnnual = activityType === 'main' ? HEALTH_MIN_ANNUAL_MAIN : 0;
  const effectiveHealthBase = Math.max(healthBase, healthMinAnnual);
  const healthInsurance = Math.round(effectiveHealthBase * HEALTH_RATE);
  const healthMonthly = isStarting && activityType === 'main'
    ? STARTING_HEALTH_MONTHLY
    : Math.round(healthInsurance / 12);
  const finalHealthInsurance = isStarting && activityType === 'main'
    ? STARTING_HEALTH_MONTHLY * 12
    : healthInsurance;

  // Totals
  const annualTotal = incomeTaxAfterDiscount + socialInsurance + finalHealthInsurance;
  const netIncome = annualIncome - annualTotal;
  const monthlyNetIncome = Math.round(netIncome / 12);
  const effectiveRate = annualIncome > 0 ? (annualTotal / annualIncome) * 100 : 0;

  return {
    expenses,
    expenseCap,
    taxBase,
    incomeTax,
    taxpayerDiscount: discount,
    incomeTaxAfterDiscount,
    socialInsurance,
    socialMonthly,
    socialNote,
    healthInsurance: finalHealthInsurance,
    healthMonthly: isStarting && activityType === 'main' ? STARTING_HEALTH_MONTHLY : Math.round(finalHealthInsurance / 12),
    annualTotal,
    netIncome,
    effectiveRate,
  };
}

export function formatCZK(value: number): string {
  return value.toLocaleString('cs-CZ') + ' Kč';
}
