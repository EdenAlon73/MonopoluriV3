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
