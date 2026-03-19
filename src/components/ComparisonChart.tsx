import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCZK } from '@/lib/taxCalculations';

interface Props {
  flatTaxTotal: number;
  classicTotal: number;
  flatTaxAvailable: boolean;
}

export default function ComparisonChart({ flatTaxTotal, classicTotal, flatTaxAvailable }: Props) {
  const data = [
    ...(flatTaxAvailable ? [{ name: 'Paušální daň', value: flatTaxTotal }] : []),
    { name: 'Paušální výdaje', value: classicTotal },
  ];

  const cheaper = flatTaxAvailable && flatTaxTotal < classicTotal ? 0 : (flatTaxAvailable ? 1 : 0);

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Porovnání celkové roční zátěže</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={60}>
          <XAxis dataKey="name" tick={{ fontSize: 13 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => formatCZK(value)}
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(214, 20%, 90%)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === cheaper ? 'hsl(160, 60%, 42%)' : 'hsl(215, 60%, 22%)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
