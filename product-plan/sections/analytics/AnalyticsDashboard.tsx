import data from '@/../product/sections/analytics/data.json';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import type { Timeframe, AnalyticsReport } from '@/../product/sections/analytics/types';
import { useState } from 'react';

export default function AnalyticsPreview() {
    const [timeframe, setTimeframe] = useState<Timeframe>('This Month');
    const reportData = data.report as AnalyticsReport;

    return (
        <AnalyticsDashboard
            data={reportData}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            onCategoryClick={(cat) => console.log('Drilldown into category:', cat)}
        />
    );
}
