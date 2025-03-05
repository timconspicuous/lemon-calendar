import { Handlers } from "$fresh/server.ts";
import { generateScheduleSVG } from "../../components/WeeklySchedule.tsx";
import { Event } from "../../components/WeeklySchedule.tsx";

export const handler: Handlers = {
	async GET(_req) {
		// Dummy events data
		const events: Event[] = [
			{
				start: new Date("2023-10-02T10:00:00"),
				end: new Date("2023-10-02T11:00:00"),
				summary: "Meeting",
			},
			{
				start: new Date("2023-10-04T12:00:00"),
				end: new Date("2023-10-04T13:00:00"),
				summary: "Lunch",
			},
			{
				start: new Date("2023-10-06T17:00:00"),
				end: new Date("2023-10-06T18:00:00"),
				summary: "Gym",
			},
		];

		const svg = await generateScheduleSVG(events);

		return new Response(svg, {
			headers: {
				"Content-Type": "image/svg+xml",
			},
		});
	},
};
