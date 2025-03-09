import { Handlers } from "$fresh/server.ts";
import { generateScheduleSVG } from "../../components/WeeklySchedule.tsx";
import { processCalendarRequest } from "../../utils/calendarUtils.ts";

export const handler: Handlers = {
	async GET(req) {
		const url = new URL(req.url);

		try {
			const { events, startDate, endDate } = await processCalendarRequest(
				url,
			);

			const svg = generateScheduleSVG(events, startDate, endDate);

			return new Response(await svg, {
				headers: { "Content-Type": "image/svg+xml" },
			});
		} catch (error) {
			console.error("Error processing URL:", error);
			return new Response(
				error instanceof Error ? error.message : String(error),
				{ status: 400 },
			);
		}
	},
};
