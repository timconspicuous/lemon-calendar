import { IS_BROWSER } from "$fresh/runtime.ts";

// Save URL to localStorage history
export function saveUrlToHistory(
	url: string,
	currentHistory: string[] = [],
): string[] {
	if (IS_BROWSER && url && url.trim() !== "") {
		// Create new history array with the new URL at the front
		// and remove any duplicates
		const updatedHistory = [
			url,
			...currentHistory.filter((item) => item !== url),
		].slice(0, 10); // Limit to 10 items

		localStorage.setItem(
			"calendarUrlHistory",
			JSON.stringify(updatedHistory),
		);
		return updatedHistory;
	}
	return currentHistory;
}

// Calculate default week (current week)
export function getDefaultWeek() {
	if (!IS_BROWSER) return undefined;

	const today = new Date();
	const currentWeekStart = new Date(today);
	const day = today.getDay();
	const diff = day === 0 ? 6 : day - 1; // Adjust for Monday as week start
	currentWeekStart.setDate(today.getDate() - diff);

	const currentWeekEnd = new Date(currentWeekStart);
	currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

	return { startDate: currentWeekStart, endDate: currentWeekEnd };
}

// Validate URL format
export function isValidUrl(urlString: string): boolean {
	try {
		new URL(urlString); // This will throw if URL is invalid
		return true;
	} catch (_error) {
		return false;
	}
}
