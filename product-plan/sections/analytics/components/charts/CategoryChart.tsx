import type { SpendingData } from '@/../product/sections/analytics/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryChartProps {
    data: SpendingData[];
    onCategoryClick?: (category: string) => void;
}

const COLORS: Record<string, string> = {
    slate: '#475569',
    stone: '#a8a29e',
    amber: '#d97706',
    red: '#dc2626',
};

const DARK_COLORS: Record<string, string> = {
    slate: '#64748b',
    stone: '#78716c',
    amber: '#f59e0b',
    red: '#ef4444',
};

export function CategoryChart({ data, onCategoryClick }: CategoryChartProps) {
    // Simple check for dark mode preference would ideally happen via context or class check
    // For now, we'll use a standard palette that works reasonably well in both or lean towards the slate theme

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="amount"
                        onClick={(data) => onCategoryClick?.(data.category)}
                        cursor="pointer"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.color] || '#a8a29e'}
                                strokeWidth={0}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '8px',
                            border: '1px solid #e7e5e4',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
