import ical from "npm:ical";
import add from "https://deno.land/x/date_fns@v2.22.1/add/index.ts";
import isAfter from "https://deno.land/x/date_fns@v2.22.1/isAfter/index.ts";
import isBefore from "https://deno.land/x/date_fns@v2.22.1/isBefore/index.ts";
import parseISO from "https://deno.land/x/date_fns@v2.22.1/parseISO/index.js";
import startOfDay from "https://deno.land/x/date_fns@v2.22.1/startOfDay/index.ts";
import endOfDay from "https://deno.land/x/date_fns@v2.22.1/endOfDay/index.ts";

export interface Event {
	start: Date;
	end: Date;
	summary?: string;
	location?: string;
	description?: string;
	timezone?: string;
}

export interface TwitchEvent {
	id: string;
	start_time: string;
	end_time: string;
	title: string;
	canceled_until: string | null;
	category: {
		id: string;
		name: string;
	} | null;
	is_recurring: boolean;
}

export async function fetchCalendar(
	icalUrl: string | undefined,
): Promise<Event[]> {
	if (!icalUrl) {
		throw new Error("Must provide an iCalendar URL.");
	}

	// Convert webcal:// to https:// for fetching
	const fetchUrl = icalUrl.replace(/^webcal:\/\//i, "https://");

	const response = await fetch(fetchUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch calendar data: ${response.statusText}`,
		);
	}

	const icsData = await response.text();

	// Extract calendar-level timezone if present
	let calendarTimezone: string | null = null;
	const tzMatch = icsData.match(/X-WR-TIMEZONE:(.*?)(?:\r?\n)/);
	if (tzMatch && tzMatch[1]) {
		calendarTimezone = tzMatch[1].trim();
	}

	const events = ical.parseICS(icsData);

	const parsedEvents = parseICalEvents(events).sort((a, b) =>
		a.start.getTime() - b.start.getTime()
	);

	// Apply calendar-level timezone to events that don't have their own timezone
	if (calendarTimezone) {
		parsedEvents.forEach((event) => {
			if (!event.timezone) event.timezone = calendarTimezone;
		});
	}

	return parsedEvents;
}

// deno-lint-ignore no-explicit-any
function parseICalEvents(icalEvents: Record<string, any>): Event[] {
	return Object.values(icalEvents)
		.filter((event) => event.type === "VEVENT")
		.map((event) => {
			// Extract timezone information if available
			const timezone = event.start?.tz ? event.start.tz.replace(/^\//, '') : null;

			return {
				start: event.start,
				end: event.end,
				location: event.location || "",
				summary: event.summary || "",
				description: event.description || "",
				timezone: timezone,
			};
		});
}

export function filterEvents(
	events: Event[],
	weekStart: Date,
	weekEnd: Date,
): Event[] {
	// Ensure weekStart and weekEnd are in UTC for comparison
	const utcWeekStart = new Date(weekStart.toISOString());
	const utcWeekEnd = new Date(weekEnd.toISOString());

	const weeklyEvents = events.filter((event) =>
		isAfter(event.start, utcWeekStart) && isBefore(event.start, utcWeekEnd)
	);

	return weeklyEvents;
}

export function filterTwitchEvents<T extends Event | TwitchEvent>(
	events: T[],
	currentDate: Date = new Date(),
): T[] {
	const now = currentDate;
	const oneWeekFromNow = add(now, { weeks: 1 });

	return events.filter((event) => {
		// Get the start time based on the event type
		const eventStartTime = "start_time" in event
			? parseISO(event.start_time, [])
			: event.start;

		return isAfter(eventStartTime, now) &&
			isBefore(eventStartTime, oneWeekFromNow);
	});
}

export async function processCalendarRequest(
	url: URL,
): Promise<{ events: Event[]; startDate: Date; endDate: Date }> {
	const targetUrl = url.searchParams.get("url");

	const startDateParam = url.searchParams.get("startDate");
	const endDateParam = url.searchParams.get("endDate");

	// Check for required parameters
	if (!targetUrl) {
		throw new Error("URL is required");
	}

	if (!startDateParam) {
		throw new Error("Start date is required");
	}

	if (!endDateParam) {
		throw new Error("End date is required");
	}

	// Parse date parameters
	const startDate = startOfDay(new Date(startDateParam));
	const endDate = endOfDay(new Date(endDateParam));

	// Validate date parsing
	if (isNaN(startDate.getTime())) {
		throw new Error("Invalid start date format");
	}

	if (isNaN(endDate.getTime())) {
		throw new Error("Invalid end date format");
	}

	const events = await fetchCalendar(targetUrl);
	const filteredEvents = filterEvents(events, startDate, endDate);

	return { events: filteredEvents, startDate, endDate };
}
