import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { formatCZK } from '@/lib/taxCalculations';

interface Props {
  flatTaxTotal: number;
  classicTotal: number;
  flatTaxAvailable: boolean;
  flatTaxMonthlyNet?: number;
  classicMonthlyNet?: number;
  annualIncome: number;
}

export default function ComparisonChart({
  flatTaxTotal,
  classicTotal,
  flatTaxAvailable,
  flatTaxMonthlyNet,
  classicMonthlyNet,
  annualIncome,
}: Props) {
  const costData = [
    ...(flatTaxAvailable ? [{ name: 'Paušální daň', value: flatTaxTotal }] : []),
    { name: 'Paušální výdaje', value: classicTotal },
  ];

  const cheaper = flatTaxAvailable && flatTaxTotal < classicTotal ? 0 : (flatTaxAvailable ? 1 : 0);

  const netData = [
    ...(flatTaxAvailable && flatTaxMonthlyNet != null
      ? [{ name: 'Paušální daň', value: flatTaxMonthlyNet }]
      : []),
    ...(classicMonthlyNet != null
      ? [{ name: 'Paušální výdaje', value: classicMonthlyNet }]
      : []),
  ];

  const netCheaper = flatTaxAvailable && flatTaxMonthlyNet != null && classicMonthlyNet != null
    ? (flatTaxMonthlyNet > classicMonthlyNet ? 0 : (flatTaxAvailable ? 1 : 0))
    : 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Celková roční zátěž</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={costData} barSize={60}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v: number) => formatCZK(v)}
                style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(215, 60%, 22%)' }}
              />
              {costData.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === cheaper ? 'hsl(160, 60%, 42%)' : 'hsl(215, 60%, 22%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {netData.length > 0 && (
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Čistý měsíční výdělek</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={netData} barSize={60}>
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: number) => formatCZK(v)}
                  style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(215, 60%, 22%)' }}
                />
                {netData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === netCheaper ? 'hsl(160, 60%, 42%)' : 'hsl(215, 60%, 22%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
