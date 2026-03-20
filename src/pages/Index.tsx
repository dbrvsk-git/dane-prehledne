import { useState } from 'react';
import TaxInputPanel from '@/components/TaxInputPanel';
import { FlatTaxCard, ClassicTaxCard } from '@/components/ResultCard';
import ComparisonChart from '@/components/ComparisonChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  calculateFlatTax,
  calculateClassicTax,
  formatCZK,
  type ExpenseType,
  type ActivityType,
} from '@/lib/taxCalculations';

export default function Index() {
  const [annualIncome, setAnnualIncome] = useState(800000);
  const [expenseType, setExpenseType] = useState<ExpenseType>(60);
  const [taxpayerDiscount, setTaxpayerDiscount] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>('main');
  const [isStarting, setIsStarting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const inputs = { annualIncome, expenseType, taxpayerDiscount, activityType, isStarting };
  const flatTax = calculateFlatTax(inputs);
  const classicTax = calculateClassicTax(inputs);

  const flatCheaper = flatTax.available && flatTax.annualTotal < classicTax.annualTotal;
  const classicCheaper = !flatTax.available || classicTax.annualTotal < flatTax.annualTotal;
  const difference = flatTax.available
    ? Math.abs(flatTax.annualTotal - classicTax.annualTotal)
    : 0;
  const cheaperMethod = flatCheaper ? 'Paušální daň' : 'Paušální výdaje';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">Kalkulačka daní pro OSVČ 2027</h1>
          <p className="mt-2 text-primary-foreground/80 text-sm md:text-base">
            Porovnejte paušální daň a klasické zdanění s paušálními výdaji
          </p>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Inputs */}
        <TaxInputPanel
          annualIncome={annualIncome} setAnnualIncome={setAnnualIncome}
          expenseType={expenseType} setExpenseType={setExpenseType}
          taxpayerDiscount={taxpayerDiscount} setTaxpayerDiscount={setTaxpayerDiscount}
          activityType={activityType} setActivityType={setActivityType}
          isStarting={isStarting} setIsStarting={setIsStarting}
        />

        {/* Results - desktop: 2 columns, mobile: tabs */}
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          <FlatTaxCard result={flatTax} isCheaper={flatCheaper} annualIncome={annualIncome} />
          <ClassicTaxCard
            result={classicTax}
            annualIncome={annualIncome}
            isCheaper={classicCheaper}
            showDetail={showDetail}
            onToggleDetail={() => setShowDetail(!showDetail)}
          />
        </div>

        <div className="md:hidden">
          <Tabs defaultValue="flat">
            <TabsList className="w-full">
              <TabsTrigger value="flat" className="flex-1">Paušální daň</TabsTrigger>
              <TabsTrigger value="classic" className="flex-1">Paušální výdaje</TabsTrigger>
            </TabsList>
            <TabsContent value="flat">
              <FlatTaxCard result={flatTax} isCheaper={flatCheaper} annualIncome={annualIncome} />
            </TabsContent>
            <TabsContent value="classic">
              <ClassicTaxCard
                result={classicTax}
                annualIncome={annualIncome}
                isCheaper={classicCheaper}
                showDetail={showDetail}
                onToggleDetail={() => setShowDetail(!showDetail)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Chart */}
        <ComparisonChart
          flatTaxTotal={flatTax.annualTotal}
          classicTotal={classicTax.annualTotal}
          flatTaxAvailable={flatTax.available}
        />

        {/* Summary */}
        {flatTax.available && difference > 0 && (
          <div className="card-elevated p-6 border-l-4 border-l-success">
            <p className="text-base font-medium text-foreground">
              💡 Při příjmu {formatCZK(annualIncome)} je výhodnější{' '}
              <span className="font-bold text-accent">{cheaperMethod}</span>{' '}
              o <span className="font-bold">{formatCZK(difference)}</span> ročně.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center py-4 border-t border-border">
          ⚠️ Kalkulačka slouží pouze pro orientační výpočet. Pro přesné daňové poradenství kontaktujte daňového poradce. Hodnoty vycházejí z parametrů roku 2026.
        </p>
      </main>
    </div>
  );
}
