import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';
import { formatCZK } from '@/lib/taxCalculations';
import type { FlatTaxResult, ClassicTaxResult } from '@/lib/taxCalculations';

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="inline h-4 w-4 text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">{text}</TooltipContent>
    </Tooltip>
  );
}

interface FlatTaxCardProps {
  result: FlatTaxResult;
  isCheaper: boolean;
  annualIncome: number;
}

export function FlatTaxCard({ result, isCheaper, annualIncome }: FlatTaxCardProps) {
  const monthlyNet = result.available ? Math.round((annualIncome - result.annualTotal) / 12) : 0;
  return (
    <div className={`card-elevated p-6 space-y-4 ${!result.available ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Paušální daň</h3>
        {isCheaper && result.available && (
          <span className="badge-success">✓ Výhodnější</span>
        )}
      </div>

      {!result.available ? (
        <div className="flex gap-3 p-4 rounded-lg bg-muted">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{result.unavailableReason}</p>
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            {result.tierName} ({formatCZK(result.monthlyPayment)}/měsíc)
            <InfoTip text="Paušální daň zahrnuje daň z příjmů, sociální a zdravotní pojištění v jedné platbě. Není nutné podávat daňové přiznání." />
          </div>

          <div className="space-y-3">
            <Row label="Měsíční platba" value={formatCZK(result.monthlyPayment)} />
            <div className="border-t border-border pt-3 space-y-2">
              <Row label="CELKEM ročně" value={formatCZK(result.annualTotal)} bold />
              <Row label="Čistý příjem po odvodech" value={formatCZK(annualIncome - result.annualTotal)} />
              <Row label="Čistý měsíční výdělek" value={formatCZK(monthlyNet)} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            ℹ️ V paušálním režimu nelze uplatnit slevy ani odpočty. Není nutné podávat daňové přiznání.
          </p>
        </>
      )}
    </div>
  );
}

interface ClassicTaxCardProps {
  result: ClassicTaxResult;
  annualIncome: number;
  isCheaper: boolean;
  showDetail: boolean;
  onToggleDetail: () => void;
}

export function ClassicTaxCard({ result, annualIncome, isCheaper, showDetail, onToggleDetail }: ClassicTaxCardProps) {
  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Paušální výdaje</h3>
        {isCheaper && (
          <span className="badge-success">✓ Výhodnější</span>
        )}
      </div>

      <div className="space-y-3">
        <Row
          label="Daň z příjmů"
          value={formatCZK(result.incomeTaxAfterDiscount) + '/rok'}
          tip="Daň z příjmů po uplatnění slev. Sazba 15 %, nad 1 762 812 Kč sazbou 23 %."
        />
        <Row
          label="Sociální pojištění"
          value={`${formatCZK(result.socialInsurance)}/rok (${formatCZK(result.socialMonthly)}/měs.)`}
          tip="Pojistné na sociální zabezpečení. Sazba 29,2 % z vyměřovacího základu."
          note={result.socialNote}
        />
        <Row
          label="Zdravotní pojištění"
          value={`${formatCZK(result.healthInsurance)}/rok (${formatCZK(result.healthMonthly)}/měs.)`}
          tip="Pojistné na zdravotní pojištění. Sazba 13,5 % z vyměřovacího základu."
        />

        <div className="border-t border-border pt-3 space-y-2">
          <Row label="CELKEM ročně" value={formatCZK(result.annualTotal)} bold />
          <Row label="Čistý příjem po odvodech" value={formatCZK(result.netIncome)} />
          <Row label="Efektivní sazba odvodu" value={result.effectiveRate.toFixed(1) + ' %'} />
        </div>
      </div>

      <button
        onClick={onToggleDetail}
        className="text-sm text-accent hover:underline cursor-pointer font-medium"
      >
        {showDetail ? '▲ Skrýt podrobný výpočet' : '▼ Zobrazit podrobný výpočet'}
      </button>

      {showDetail && (
        <div className="p-4 rounded-lg bg-muted space-y-2 text-sm">
          <DetailRow label="Příjmy" value={formatCZK(annualIncome)} />
          <DetailRow label="Paušální výdaje" value={`− ${formatCZK(result.expenses)} (strop: ${formatCZK(result.expenseCap)})`} />
          <DetailRow label="Základ daně" value={formatCZK(result.taxBase)} />
          <DetailRow label="Daň (15 % / 23 %)" value={formatCZK(result.incomeTax)} />
          {result.taxpayerDiscount > 0 && (
            <DetailRow label="Sleva na poplatníka" value={`− ${formatCZK(result.taxpayerDiscount)}`} />
          )}
          <DetailRow label="Daň po slevách" value={formatCZK(result.incomeTaxAfterDiscount)} bold />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, tip, note }: {
  label: string; value: string; bold?: boolean; tip?: string; note?: string;
}) {
  return (
    <div>
      <div className={`flex justify-between items-center ${bold ? 'text-lg font-bold' : 'text-sm'}`}>
        <span className="flex items-center text-muted-foreground">
          {label}
          {tip && <InfoTip text={tip} />}
        </span>
        <span className={bold ? 'text-foreground' : ''}>{value}</span>
      </div>
      {note && <p className="text-xs text-accent mt-1 italic">ℹ️ {note}</p>}
    </div>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold border-t border-border pt-2 mt-2' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
