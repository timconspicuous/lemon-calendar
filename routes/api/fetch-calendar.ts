import { Handlers } from "$fresh/server.ts";
import {
	fetchCalendar,
	filterEvents,
} from "https://raw.githubusercontent.com/timconspicuous/lemonbot/refs/heads/Deno/utils/calendarUtils.ts";

export const handler: Handlers = {
	async GET(req) {
		const url = new URL(req.url);
		const targetUrl = url.searchParams.get("url");

		if (!targetUrl) {
			return new Response("URL is required", { status: 400 });
		}

		try {
			const events = await fetchCalendar(targetUrl);
			const filteredEvents = filterEvents(events);

			let formattedText = "";
			for (const event of filteredEvents) {
				const startDate = new Date(event.start);
				const unixTimestamp = Math.floor(startDate.getTime() / 1000);
				formattedText +=
					`\n- <t:${unixTimestamp}:F> | **${event.summary}**`;
				if (event.description) {
					formattedText += ` | ${event.description}`;
				}
			}

			return new Response(JSON.stringify({ result: formattedText }), {
				headers: { "Content-Type": "application/json" },
			});
		} catch (error) {
			console.error("Error processing URL:", error);
			return new Response("Error processing data", { status: 500 });
		}
	},
};
