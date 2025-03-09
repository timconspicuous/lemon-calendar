import satori from "https://esm.sh/satori@0.12.1";
import format from "https://deno.land/x/date_fns@v2.22.1/format/index.js";
import { Event } from "../utils/calendarUtils.ts";

export default function WeeklySchedule(
	events: Event[],
	startDate: Date,
	endDate: Date,
) {
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				width: "100%",
				height: "auto",
				padding: "20px",
				backgroundColor: "#f0f0f0",
			}}
		>
			{days.map((day, index) => {
				const event = events.find((e) =>
					format(e.start, "eee", []) === day
				);
				return (
					<div
						key={index}
						style={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							width: "100%",
							height: "auto",
							backgroundColor: "#fff",
							border: "1px solid #ccc",
							borderRadius: "8px",
							padding: "10px",
							marginBottom: "8px",
						}}
					>
						<div
							style={{
								fontWeight: "bold",
								marginRight: "12px",
								textAlign: "left", // Ensure day is left-aligned
								flex: "1", // Take some space, adjust as needed
							}}
						>
							{day}
						</div>
						{event && (
							<div
								style={{
									display: "flex",
									flexDirection: "column", // Still keep column layout for summary and time if needed later
									textAlign: "center", // Center-align the summary text
									flex: 2, // Summary takes more space in the center
									marginRight: "12px", // Add right margin to separate from time
									wordWrap: "break-word", // Enable word wrapping for long summaries
									fontSize: "0.9em", // Slightly smaller font for summary (optional, adjust or remove if not desired)
								}}
							>
								<div>{event.summary}</div>{" "}
								{/* Summary - word wrapping now enabled */}
							</div>
						)}
						<div
							style={{
								display: "flex",
								textAlign: "right", // Right-align the time
								flex: "1", // Take some space, adjust as needed
								whiteSpace: "nowrap", // Keep time in one line
							}}
						>
							{event && format(event.start, "ha", [])}
							{!event && "No event"}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export async function generateScheduleSVG(
	events: Event[],
	startDate: Date,
	endDate: Date,
) {
	const fontPath = "./static/fonts/Lazydog.ttf";
	const fontData = await Deno.readFile(fontPath);

	const svg = await satori(
		// deno-lint-ignore no-explicit-any
		WeeklySchedule(events, startDate, endDate) as any,
		{
			width: 375,
			// height: 800,
			fonts: [
				{
					name: "Lazydog",
					data: fontData,
				},
			],
		},
	);

	return svg;
}
