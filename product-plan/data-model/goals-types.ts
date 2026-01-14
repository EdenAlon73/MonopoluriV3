// =============================================================================
// Data Types
// =============================================================================

export interface Goal {
    id: string;
    title: string;
    targetAmount: number;
    savedAmount: number;
    /** ISO date string YYYY-MM-DD */
    deadline?: string;
    owner: 'Eden' | 'Sivan' | 'Shared';
    status: 'Active' | 'Completed';
    icon: string;
    color: 'slate' | 'amber' | 'stone' | 'red';
}

// =============================================================================
// Component Props
// =============================================================================

export interface GoalsListProps {
    /** The list of goals to display */
    goals: Goal[];
    /** Called when user adds funds to a goal */
    onAddFunds?: (id: string, amount: number) => void;
    /** Called when user creates a new goal */
    onCreate?: () => void;
    /** Called when user edits a goal */
    onEdit?: (id: string) => void;
    /** Called when user deletes a goal */
    onDelete?: (id: string) => void;
}
