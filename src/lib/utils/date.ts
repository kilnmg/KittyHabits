export function formatRelativeDate(date: string): string {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - eventDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
        return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }
    if (diffDays === 0) {
        return 'Today';
    }
    if (diffDays === 1) {
        return 'Yesterday';
    }
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function calculateStreak(history: { date: string }[]): number {
    if (history.length === 0) return 0;
    
    // Get today's date in local timezone, set to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get yesterday's date in local timezone, set to start of day
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Convert all dates to local timezone and set to start of day for comparison
    const dates = history.map(h => {
        const date = new Date(h.date);
        date.setHours(0, 0, 0, 0);
        return date;
    });
    
    // Sort dates in descending order (most recent first)
    dates.sort((a, b) => b.getTime() - a.getTime());
    
    // If the most recent activity is before yesterday, streak is broken
    if (dates[0].getTime() < yesterday.getTime()) {
        return 0;
    }
    
    // Start with the most recent date
    let streak = 1;
    let currentDate = dates[0];
    
    // Look for consecutive days backwards from the most recent date
    for (let i = 1; i < dates.length; i++) {
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
        
        // If the next date is exactly one day before, continue the streak
        if (dates[i].getTime() === expectedDate.getTime()) {
            streak++;
            currentDate = dates[i];
        } else if (dates[i].getTime() < expectedDate.getTime()) {
            // If we find a date that's more than one day before, stop counting
            break;
        }
        // If the date is the same as current date (multiple entries in one day), skip it
    }
    
    return streak;
} 