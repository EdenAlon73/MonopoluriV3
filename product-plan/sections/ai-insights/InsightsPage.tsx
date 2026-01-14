import data from '@/../product/sections/ai-insights/data.json';
import { InsightsPage } from './components/InsightsPage';
import type { AIInsightsData } from '@/../product/sections/ai-insights/types';

export default function AIInsightsPreview() {
    // Cast data to match the type since JSON import might be inferred loosely
    const insightsData = data as unknown as AIInsightsData;

    return (
        <InsightsPage data={insightsData} />
    );
}
