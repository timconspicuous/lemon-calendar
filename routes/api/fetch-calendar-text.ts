import { Handlers } from "$fresh/server.ts";
import { processCalendarRequest } from "../../utils/calendarUtils.ts";

export const handler: Handlers = {
	async GET(req) {
		const url = new URL(req.url);

		try {
			const { events } = await processCalendarRequest(url);

			let formattedText = "";
			for (const event of events) {
				const startDate = new Date(event.start);
				const unixTimestamp = Math.floor(startDate.getTime() / 1000);
				formattedText +=
					`\n- <t:${unixTimestamp}:F> | **${event.summary}**`;
				if (event.description) {
					formattedText += ` | ${event.description}`;
				}
			}

			return new Response(JSON.stringify({ result: formattedText.trim() }), {
				headers: { "Content-Type": "application/json" },
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
