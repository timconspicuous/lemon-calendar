import ical from "npm:ical";
import {
	add,
	isAfter,
	isBefore,
	parseISO,
} from "https://deno.land/x/date_fns@v2.22.1/index.js";

export interface Event {
	start: Date;
	end: Date;
	summary?: string;
	location?: string;
	description?: string;
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
	const response = await fetch(icalUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch calendar data: ${response.statusText}`,
		);
	}

	const icsData = await response.text();
	const events = ical.parseICS(icsData);

	const parsedEvents = parseICalEvents(events).sort((a, b) =>
		a.start.getTime() - b.start.getTime()
	);

	return parsedEvents;
}

// deno-lint-ignore no-explicit-any
function parseICalEvents(icalEvents: Record<string, any>): Event[] {
	return Object.values(icalEvents)
		.filter((event) => event.type === "VEVENT")
		.map((event) => ({
			start: event.start,
			end: event.end,
			location: event.location || "",
			summary: event.summary || "",
			description: event.description || "",
		}));
}

export function filterEvents(
	events: Event[],
	weekStart: Date,
	weekEnd: Date,
): Event[] {
	const weeklyEvents = events.filter((event) =>
		isAfter(event.start, weekStart) && isBefore(event.start, weekEnd)
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
