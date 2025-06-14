export interface Transaction {
    date: string;
    value: number;
}

export interface Habit {
    id: string;
    name: string;
    color: string;
    value: number;
    currency: string;
    history: Transaction[];
    lastUpdatedAt: string;
    createdAt: string;
    step: number;
} 