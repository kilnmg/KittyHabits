export interface Habit {
	id: string;
	name: string;
	value: number;
	currency: string;
	color: string;
	history: Transaction[];
	streak: number;
	lastEventDate: string;
	target: number;
	unit: string;
	frequency: string;
	createdAt: string;
	lastUpdatedAt: string;
	step: number;
}

export interface Transaction {
	id: string;
	date: string;
	value: number;
	note?: string;
} 