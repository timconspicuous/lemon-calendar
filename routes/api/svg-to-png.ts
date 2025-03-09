import { Handlers } from "$fresh/server.ts";
import { initialize, svg2png } from "npm:svg2png-wasm";

// Initialize the WebAssembly module once
let initialized = false;
const initializeWasm = async () => {
	if (!initialized) {
		const wasmModule = await fetch(
			"https://cdn.jsdelivr.net/npm/svg2png-wasm/svg2png_wasm_bg.wasm",
		).then((res) => res.arrayBuffer());

		await initialize(new Uint8Array(wasmModule));
		initialized = true;
	}
};

export const handler: Handlers = {
	async POST(req) {
		try {
			// Make sure WASM is initialized
			await initializeWasm();

			const svgString = await req.text();

			// Convert SVG to PNG
			const pngBuffer = await svg2png(svgString, {
				width: 800, // Set width to match your original config
				backgroundColor: "transparent",
				// Add other options as needed
			});

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
