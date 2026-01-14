import type { TrendData } from '@/../product/sections/analytics/types';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface TrendChartProps {
    data: TrendData[];
}

export function TrendChart({ data }: TrendChartProps) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-stone-800" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e7e5e4',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#475569"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        name="Income"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#dc2626"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        name="Expenses"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
