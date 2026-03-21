// Tax calculation logic for Czech OSVČ 2027

export type ExpenseType = 80 | 60 | 40;
export type ActivityType = 'main' | 'secondary';
export type DisabilityType = 'none' | 'partial' | 'full';

export interface DiscountInputs {
  spouseDiscount: boolean;
  spouseZTP: boolean;
  disabilityType: DisabilityType;
  ztpHolder: boolean;
  childrenCount: number;
  childrenZTPCount: number;
}

export interface TaxInputs {
  annualIncome: number;
  expenseType: ExpenseType;
  taxpayerDiscount: boolean;
  activityType: ActivityType;
  isStarting: boolean;
  discounts: DiscountInputs;
}

export interface DiscountBreakdown {
  taxpayerDiscount: number;
  spouseDiscount: number;
  disabilityDiscount: number;
  ztpDiscount: number;
  childrenDiscount: number;
  totalDiscounts: number;
  taxBeforeDiscounts: number;
  taxAfterDiscounts: number; // can be negative = bonus
  taxBonus: number; // positive if bonus applies
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
  discountBreakdown: DiscountBreakdown;
  incomeTaxAfterDiscount: number;
  socialInsurance: number;
  socialMonthly: number;
  socialNote?: string;
  healthInsurance: number;
  healthMonthly: number;
  annualTotal: number;
  netIncome: number;
  monthlyNetIncome: number;
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
const SPOUSE_DISCOUNT = 24840;
const SPOUSE_ZTP_DISCOUNT = 49680;
const DISABILITY_PARTIAL = 2520;
const DISABILITY_FULL = 5040;
const ZTP_DISCOUNT = 16140;
const CHILDREN_AMOUNTS = [15204, 22320, 27840]; // 1st, 2nd, 3rd+

const SOCIAL_RATE = 0.292;
const HEALTH_RATE = 0.135;
const SOCIAL_MIN_ANNUAL_MAIN = 235044;
const HEALTH_MIN_ANNUAL_MAIN = 293802;
const STARTING_SOCIAL_MONTHLY = 3575;
const STARTING_HEALTH_MONTHLY = 3306;
const PROGRESSIVE_THRESHOLD = 1762812;

function calculateChildrenDiscount(count: number, ztpCount: number): number {
  if (count <= 0) return 0;
  let total = 0;
  const normalCount = Math.max(0, count - ztpCount);
  const ztpEffective = Math.min(ztpCount, count);

  // Calculate for each child position
  for (let i = 0; i < count; i++) {
    const amount = i === 0 ? CHILDREN_AMOUNTS[0] : i === 1 ? CHILDREN_AMOUNTS[1] : CHILDREN_AMOUNTS[2];
    const isZTP = i >= normalCount && i < normalCount + ztpEffective;
    total += isZTP ? amount * 2 : amount;
  }
  return total;
}

export function hasAnyDiscount(discounts: DiscountInputs): boolean {
  return discounts.spouseDiscount || discounts.disabilityType !== 'none' || discounts.ztpHolder || discounts.childrenCount > 0;
}

export function calculateFlatTax(inputs: TaxInputs): FlatTaxResult {
  const { annualIncome, expenseType } = inputs;

  if (annualIncome > 2000000) {
    return {
      available: false,
      unavailableReason: 'Paušální daň je dostupná pouze pro příjmy do 2 000 000 Kč.',
      tier: 0, monthlyPayment: 0, annualTotal: 0, tierName: '',
    };
  }

  let tier = 3;
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
  const { annualIncome, expenseType, taxpayerDiscount, activityType, isStarting, discounts } = inputs;

  const rawExpenses = annualIncome * (expenseType / 100);
  const expenseCap = EXPENSE_CAPS[expenseType];
  const expenses = Math.min(rawExpenses, expenseCap);
  const taxBase = Math.max(0, annualIncome - expenses);

  // Income tax (progressive)
  let incomeTax: number;
  if (taxBase <= PROGRESSIVE_THRESHOLD) {
    incomeTax = Math.round(taxBase * 0.15);
  } else {
    incomeTax = Math.round(PROGRESSIVE_THRESHOLD * 0.15 + (taxBase - PROGRESSIVE_THRESHOLD) * 0.23);
  }

  // Calculate all discounts
  const tpDiscount = taxpayerDiscount ? TAXPAYER_DISCOUNT : 0;
  const spouseDisc = discounts.spouseDiscount
    ? (discounts.spouseZTP ? SPOUSE_ZTP_DISCOUNT : SPOUSE_DISCOUNT)
    : 0;
  const disabilityDisc = discounts.disabilityType === 'partial' ? DISABILITY_PARTIAL
    : discounts.disabilityType === 'full' ? DISABILITY_FULL : 0;
  const ztpDisc = discounts.ztpHolder ? ZTP_DISCOUNT : 0;
  const childrenDisc = calculateChildrenDiscount(discounts.childrenCount, discounts.childrenZTPCount);

  // Apply non-children discounts (cannot go below 0)
  const nonChildrenDiscounts = tpDiscount + spouseDisc + disabilityDisc + ztpDisc;
  const taxAfterNonChildren = Math.max(0, incomeTax - nonChildrenDiscounts);

  // Children discount can create a bonus (negative tax = bonus paid out)
  const taxAfterAll = taxAfterNonChildren - childrenDisc;
  const taxBonus = taxAfterAll < 0 ? Math.abs(taxAfterAll) : 0;
  const finalIncomeTax = Math.max(0, taxAfterAll);

  const discountBreakdown: DiscountBreakdown = {
    taxpayerDiscount: tpDiscount,
    spouseDiscount: spouseDisc,
    disabilityDiscount: disabilityDisc,
    ztpDiscount: ztpDisc,
    childrenDiscount: childrenDisc,
    totalDiscounts: nonChildrenDiscounts + childrenDisc,
    taxBeforeDiscounts: incomeTax,
    taxAfterDiscounts: taxAfterAll,
    taxBonus,
  };

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

  // Totals (tax bonus reduces total, can make it negative conceptually but we track separately)
  const annualTotal = finalIncomeTax + socialInsurance + finalHealthInsurance - taxBonus;
  const netIncome = annualIncome - annualTotal;
  const monthlyNetIncome = Math.round(netIncome / 12);
  const effectiveRate = annualIncome > 0 ? (annualTotal / annualIncome) * 100 : 0;

  return {
    expenses,
    expenseCap,
    taxBase,
    incomeTax,
    discountBreakdown,
    incomeTaxAfterDiscount: finalIncomeTax,
    socialInsurance,
    socialMonthly,
    socialNote,
    healthInsurance: finalHealthInsurance,
    healthMonthly: isStarting && activityType === 'main' ? STARTING_HEALTH_MONTHLY : Math.round(finalHealthInsurance / 12),
    annualTotal,
    netIncome,
    monthlyNetIncome,
    effectiveRate,
  };
}

export function formatCZK(value: number): string {
  return value.toLocaleString('cs-CZ') + '\u00A0Kč';
}
