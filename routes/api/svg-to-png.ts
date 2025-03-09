// routes/api/svg-to-png.ts
import { Handlers } from "$fresh/server.ts";
import { Resvg } from "npm:@resvg/resvg-js";

export const handler: Handlers = {
	async POST(req) {
		try {
			const svgString = await req.text();

			// Configure resvg
			const resvg = new Resvg(svgString, {
				background: "transparent",
				fitTo: {
					mode: "width",
					value: 800,
				},
			});

			// Render to PNG
			const pngData = resvg.render();
			const pngBuffer = pngData.asPng();

			return new Response(pngBuffer, {
				headers: {
					"Content-Type": "image/png",
				},
			});
		} catch (error) {
			console.error("Error converting SVG to PNG:", error);

			// Properly handle the unknown error type
			const errorMessage = error instanceof Error
				? error.message
				: "Unknown error occurred";

			return new Response(JSON.stringify({ error: errorMessage }), {
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}
	},
};
