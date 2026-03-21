import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Minus, Plus } from 'lucide-react';
import type { ExpenseType, ActivityType, DiscountInputs, DisabilityType } from '@/lib/taxCalculations';

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
  discounts: DiscountInputs;
  setDiscounts: (v: DiscountInputs) => void;
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

function Stepper({ value, onChange, min = 0, max = 10 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center font-semibold text-sm">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TaxInputPanel(props: Props) {
  const {
    annualIncome, setAnnualIncome,
    expenseType, setExpenseType,
    taxpayerDiscount, setTaxpayerDiscount,
    activityType, setActivityType,
    isStarting, setIsStarting,
    discounts, setDiscounts,
  } = props;

  const updateDiscount = <K extends keyof DiscountInputs>(key: K, value: DiscountInputs[K]) => {
    setDiscounts({ ...discounts, [key]: value });
  };

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

      {/* ===== ADDITIONAL DISCOUNTS SECTION ===== */}
      <div className="border-t border-border pt-6 space-y-5">
        <h3 className="text-base font-semibold text-foreground">
          🏷️ Další možné slevy a daňová zvýhodnění
        </h3>
        <p className="text-xs text-muted-foreground -mt-3">
          Tyto slevy se uplatňují pouze v režimu Paušálních výdajů. V Paušální dani je nelze uplatnit.
        </p>

        {/* 1. Spouse discount */}
        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-2">
            <Checkbox
              id="spouse"
              checked={discounts.spouseDiscount}
              onCheckedChange={(v) => {
                const checked = v === true;
                setDiscounts({ ...discounts, spouseDiscount: checked, spouseZTP: checked ? discounts.spouseZTP : false });
              }}
              className="mt-0.5"
            />
            <Label htmlFor="spouse" className="flex items-center text-sm cursor-pointer leading-snug">
              Manžel/manželka nebo partner/ka žije se mnou ve společné domácnosti s dítětem do 3 let a má příjem do 68 000 Kč/rok
              <InfoTip text="Slevu lze uplatnit, pokud druhý z partnerů pobírá příjmy do 68 000 Kč ročně a pečuje o dítě mladší 3 let ve společné domácnosti." />
            </Label>
          </div>
          {discounts.spouseDiscount && (
            <div className="ml-6 space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="spouseZTP"
                  checked={discounts.spouseZTP}
                  onCheckedChange={(v) => updateDiscount('spouseZTP', !!v)}
                />
                <Label htmlFor="spouseZTP" className="text-sm cursor-pointer">
                  Manžel/manželka má průkaz ZTP/P
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Sleva: {discounts.spouseZTP ? '49 680' : '24 840'} Kč/rok
              </p>
            </div>
          )}
        </div>

        {/* 2. Disability discount */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50">
          <Label className="flex items-center text-sm font-medium">
            Sleva pro zdravotně znevýhodněné
            <InfoTip text="Průkaz ZTP/P vydává úřad práce a nesouvisí přímo s invalidním důchodem – obě slevy lze uplatnit současně." />
          </Label>
          <Select
            value={discounts.disabilityType}
            onValueChange={(v) => updateDiscount('disabilityType', v as DisabilityType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nemám invalidní důchod</SelectItem>
              <SelectItem value="partial">Invalidita I. nebo II. stupně (2 520 Kč)</SelectItem>
              <SelectItem value="full">Invalidita III. stupně (5 040 Kč)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="ztp"
              checked={discounts.ztpHolder}
              onCheckedChange={(v) => updateDiscount('ztpHolder', !!v)}
            />
            <Label htmlFor="ztp" className="text-sm cursor-pointer">
              Jsem držitel průkazu ZTP/P (16 140 Kč/rok)
            </Label>
          </div>
        </div>

        {/* 3. Children discount */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50">
          <Label className="flex items-center text-sm font-medium">
            Daňové zvýhodnění na děti
            <InfoTip text="Daňové zvýhodnění na děti je jednou z mála slev, která může přejít do tzv. daňového bonusu – tj. stát vám rozdíl doplatí." />
          </Label>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Počet vyživovaných dětí</span>
            <Stepper
              value={discounts.childrenCount}
              onChange={(v) => {
                updateDiscount('childrenCount', v);
                if (v === 0) updateDiscount('childrenZTPCount', 0);
                if (discounts.childrenZTPCount > v) updateDiscount('childrenZTPCount', v);
              }}
              max={10}
            />
          </div>

          {discounts.childrenCount > 0 && (
            <div className="space-y-3 ml-2">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>1. dítě: 15 204 Kč/rok</p>
                <p>2. dítě: 22 320 Kč/rok</p>
                <p>3. a další: 27 840 Kč/rok</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Z toho dětí se ZTP/P</span>
                  <InfoTip text="Zvýhodnění na dítě se ZTP/P se zdvojnásobuje." />
                </div>
                <Stepper
                  value={discounts.childrenZTPCount}
                  onChange={(v) => updateDiscount('childrenZTPCount', v)}
                  max={discounts.childrenCount}
                />
              </div>

              <p className="text-xs text-accent italic">
                💡 Pokud je daňové zvýhodnění na děti vyšší než vypočtená daň, vzniká daňový bonus – ten vám finanční úřad vyplatí. Zobrazíme ho ve výsledcích jako kladnou částku.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
