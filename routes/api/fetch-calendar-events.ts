import { Handlers } from "$fresh/server.ts";
import { processCalendarRequest } from "../../utils/calendarUtils.ts";

export const handler: Handlers = {
	async GET(req) {
		const url = new URL(req.url);

		try {
			const { events } = await processCalendarRequest(url);

			// Return the raw events array as JSON
			return new Response(
				JSON.stringify({ events }),
				{
					headers: { "Content-Type": "application/json" },
				},
			);
		} catch (error) {
			console.error("Error processing URL:", error);
			return new Response(
				error instanceof Error ? error.message : String(error),
				{ status: 400 },
			);
		}
	},
};
