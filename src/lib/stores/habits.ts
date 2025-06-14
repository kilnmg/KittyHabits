import { writable } from 'svelte/store';
import type { Habit } from '$lib/types/habit';
import { browser } from '$app/environment';

export interface Transaction {
    date: string;
    value: number;
}

// Initialize with empty habits array
const initialHabits: Habit[] = [];

// Create the store with persistence
function createHabitsStore() {
    // Get initial value from localStorage if available
    const storedHabits = browser ? localStorage.getItem('habits') : null;
    const initialValue = storedHabits ? JSON.parse(storedHabits) : initialHabits;
    
    const { subscribe, set, update } = writable<Habit[]>(initialValue);

    return {
        subscribe,
        set: (habits: Habit[]) => {
            if (browser) {
                localStorage.setItem('habits', JSON.stringify(habits));
            }
            set(habits);
        },
        update: (updater: (habits: Habit[]) => Habit[]) => {
            update(habits => {
                const updatedHabits = updater(habits);
                if (browser) {
                    localStorage.setItem('habits', JSON.stringify(updatedHabits));
                }
                return updatedHabits;
            });
        }
    };
}

export const habits = createHabitsStore();

// Helper function to generate a unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

// Function to add a new habit
export function addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'lastUpdatedAt'>) {
    const now = new Date().toISOString();
    habits.update(currentHabits => [
        ...currentHabits,
        {
            ...habit,
            id: generateId(),
            createdAt: now,
            lastUpdatedAt: now
        }
    ]);
}

// Function to add a transaction to a habit
export function addTransaction(habitId: string, value: number, note?: string) {
    habits.update((currentHabits) => {
        return currentHabits.map((habit) => {
            if (habit.id === habitId) {
                const newTransaction = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    value,
                    note
                };
                return {
                    ...habit,
                    value: habit.value + value,
                    history: [...habit.history, newTransaction],
                    lastUpdatedAt: new Date().toISOString()
                };
            }
            return habit;
        });
    });
}

// Function to update an existing habit
export function updateHabit(habitId: string, updates: Partial<Habit>) {
    habits.update((currentHabits) => {
        return currentHabits.map((habit) => {
            if (habit.id === habitId) {
                return {
                    ...habit,
                    ...updates,
                    lastUpdatedAt: new Date().toISOString()
                };
            }
            return habit;
        });
    });
} 