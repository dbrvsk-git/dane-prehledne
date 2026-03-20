import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { ExpenseType, ActivityType } from '@/lib/taxCalculations';

interface Props {
  annualIncome: number;
  setAnnualIncome: (v: number) => void;
  expenseType: ExpenseType;
  setExpenseType: (v: ExpenseType) => void;
  taxpayerDiscount: boolean;
  setTaxpayerDiscount: (v: boolean) => void;
  activityType: ActivityType;
  setActivityType: (v: ActivityType) => void;
  isStarting: boolean;
  setIsStarting: (v: boolean) => void;
}

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

function formatInputValue(value: number): string {
  return value.toLocaleString('cs-CZ');
}

export default function TaxInputPanel(props: Props) {
  const {
    annualIncome, setAnnualIncome,
    expenseType, setExpenseType,
    taxpayerDiscount, setTaxpayerDiscount,
    activityType, setActivityType,
    isStarting, setIsStarting,
  } = props;

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      setAnnualIncome(Math.min(Math.max(num, 0), 5000000));
    } else if (raw === '') {
      setAnnualIncome(0);
    }
  };

  return (
    <div className="card-elevated p-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        📊 Vstupní údaje
      </h2>

      {/* Annual income */}
      <div className="space-y-3">
        <Label className="flex items-center text-sm font-medium">
          Roční příjmy
          <InfoTip text="Celkové hrubé příjmy z podnikání za rok (před odečtením výdajů)." />
        </Label>
        <input
          type="text"
          inputMode="numeric"
          className="input-field text-right font-semibold text-lg"
          value={formatInputValue(annualIncome)}
          onChange={handleIncomeChange}
          onFocus={(e) => {
            e.target.select();
          }}
          onBlur={() => {}}
        />
        <Slider
          value={[annualIncome]}
          onValueChange={([v]) => setAnnualIncome(v)}
          min={100000}
          max={2000000}
          step={10000}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>100 000 Kč</span>
          <span>2 000 000 Kč</span>
        </div>
      </div>

      {/* Expense type */}
      <div className="space-y-2">
        <Label className="flex items-center text-sm font-medium">
          Typ výdajového paušálu
          <InfoTip text="Procentuální sazba paušálních výdajů závisí na typu vaší podnikatelské činnosti." />
        </Label>
        <Select value={String(expenseType)} onValueChange={(v) => setExpenseType(Number(v) as ExpenseType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="80">80 % (řemesla, zemědělství)</SelectItem>
            <SelectItem value="60">60 % (ostatní živnosti)</SelectItem>
            <SelectItem value="40">40 % (svobodná povolání)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity type */}
      <div className="space-y-2">
        <Label className="flex items-center text-sm font-medium">
          Typ OSVČ
          <InfoTip text="Hlavní činnost = podnikání je vaším hlavním zdrojem příjmů. Vedlejší činnost = podnikáte vedle zaměstnání, studia apod." />
        </Label>
        <div className="flex rounded-lg border border-input overflow-hidden">
          <button
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activityType === 'main'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setActivityType('main')}
          >
            Hlavní činnost
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activityType === 'secondary'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setActivityType('secondary')}
          >
            Vedlejší činnost
          </button>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="taxpayer"
            checked={taxpayerDiscount}
            onCheckedChange={(v) => setTaxpayerDiscount(!!v)}
          />
          <Label htmlFor="taxpayer" className="flex items-center text-sm cursor-pointer">
            Sleva na poplatníka (30 840 Kč)
            <InfoTip text="Základní sleva na dani, na kterou má nárok každý poplatník. Uplatňuje se pouze u klasického zdanění, ne u paušální daně." />
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="starting"
            checked={isStarting}
            onCheckedChange={(v) => setIsStarting(!!v)}
          />
          <Label htmlFor="starting" className="flex items-center text-sm cursor-pointer">
            Jsem začínající OSVČ (první rok podnikání)
            <InfoTip text="Začínající OSVČ mají snížené zálohy na sociální pojištění v prvním roce." />
          </Label>
        </div>
      </div>
    </div>
  );
}
