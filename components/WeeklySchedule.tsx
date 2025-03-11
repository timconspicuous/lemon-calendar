import satori from "https://esm.sh/satori@0.12.1";
import format from "https://deno.land/x/date_fns@v2.22.1/format/index.js";
import { Event } from "../utils/calendarUtils.ts";

// Define theme interface for styling options
interface Theme {
	fontFamily: string;
	headerColor: string;
	dateRangeColor: string;
	dayColor: string;
	eventBgColor: string;
	eventTextColor: string;
	noEventColor: string;
	backgroundImagePath: string; // Path to background image
	eventIconPath?: string; // Path to event SVG icon (optional)
}

// Default theme
const defaultTheme: Theme = {
	fontFamily: "Lazydog",
	headerColor: "#ffffff",
	dateRangeColor: "#ffffff",
	dayColor: "#ffffff",
	eventBgColor: "#e6d195", //twitch: eebd37 discord: f3af52
	eventTextColor: "#ffffff",
	noEventColor: "#ffffff",
	backgroundImagePath: "./static/background.png",
	eventIconPath: "./static/discord-icon.svg",
};

// Theme collection - can be expanded as needed
const themes: Record<string, Theme> = {
	"light": defaultTheme,
	"dark": {
		fontFamily: "Lazydog",
		headerColor: "#ffffff",
		dateRangeColor: "#cccccc",
		dayColor: "#ffffff",
		eventBgColor: "#333333",
		eventTextColor: "#ffffff",
		noEventColor: "#777777",
		backgroundImagePath: "./static/background.png",
		eventIconPath: "./static/discord-icon.svg",
	},
	// Add more themes as needed
};

export default function WeeklySchedule(
	events: Event[],
	startDate: Date,
	endDate: Date,
	backgroundImageBase64?: string,
	theme: Theme = defaultTheme,
) {
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const aspectRatio = 2700 / 4500; // Based on your original background image size
	const displayWidth = 375; // Your defined width
	const displayHeight = displayWidth / aspectRatio;

	// Calculate relative positions
	const headerPosition = 0.10;
	const dateRangePosition = 0.15;
	const scheduleStartPosition = 0.21;
	const scheduleHeight = 0.73;

	// Format the date range
	const startDateFormatted = format(startDate, "dd.MM.", []);
	const endDateFormatted = format(endDate, "dd.MM.", []);
	const dateRangeText = `${startDateFormatted} - ${endDateFormatted}`;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				width: `${displayWidth}px`,
				height: `${displayHeight}px`,
				position: "relative",
			}}
		>
			{/* Background Image */}
			{backgroundImageBase64 && (
				<img
					src={`data:image/png;base64,${backgroundImageBase64}`}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "cover",
						zIndex: -1,
					}}
				/>
			)}

			{/* Header Title */}
			<div
				style={{
					position: "absolute",
					top: `${headerPosition * 100}%`,
					width: "79%",
					textAlign: "center",
					fontFamily: theme.fontFamily,
					fontSize: "24px",
					fontWeight: "bold",
					color: theme.headerColor,
				}}
			>
				Stream Schedule
			</div>

			{/* Date Range */}
			<div
				style={{
					position: "absolute",
					top: `${dateRangePosition * 100}%`,
					width: "79%",
					textAlign: "center",
					fontFamily: theme.fontFamily,
					fontSize: "18px",
					color: theme.dateRangeColor,
				}}
			>
				{dateRangeText}
			</div>

			{/* Weekly Schedule */}
			<div
				style={{
					position: "absolute",
					top: `${scheduleStartPosition * 100}%`,
					width: "79%",
					height: `${scheduleHeight * 100}%`,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
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
								height: `${100 / days.length - 2}%`,
								backgroundColor: theme.eventBgColor,
								padding: "10px",
								borderRadius: "10px",
								marginBottom: "8px",
								fontFamily: theme.fontFamily,
							}}
						>
							<div
								style={{
									fontWeight: "bold",
									marginRight: "12px",
									textAlign: "left",
									flex: "1",
									fontSize: "1.2em",
									color: theme.dayColor,
								}}
							>
								{day}
							</div>

							{event && (
								<>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											textAlign: "center",
											flex: 2,
											marginRight: "12px",
											wordWrap: "break-word",
											fontSize: "1.2em",
											color: theme.eventTextColor,
										}}
									>
										<div>{event.summary}</div>
									</div>
								</>
							)}

							<div
								style={{
									display: "flex",
									textAlign: "right",
									flex: "1",
									whiteSpace: "nowrap",
									color: event
										? theme.eventTextColor
										: theme.noEventColor,
									fontSize: "1.2em",
								}}
							>
								{event && format(event.start, "ha", [])}
								{!event && "No event"}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export async function generateScheduleSVG(
	events: Event[],
	startDate: Date,
	endDate: Date,
	themeName: string = "light",
) {
	// Get the theme
	const theme = themes[themeName] || defaultTheme;

	// Load font
	const fontPath = "./static/fonts/Lazydog.ttf";
	const fontData = await Deno.readFile(fontPath);

	// Load background image
	let backgroundImageBase64 = undefined;
	try {
		const backgroundData = await Deno.readFile(theme.backgroundImagePath);
		// Use a safer way to convert binary data to base64
		backgroundImageBase64 = encodeBase64(backgroundData);
	} catch (error) {
		console.error(
			`Error loading background image: ${(error as Error).message}`,
		);
	}

	const svg = await satori(
		WeeklySchedule(
			events,
			startDate,
			endDate,
			backgroundImageBase64,
			theme,
			// deno-lint-ignore no-explicit-any
		) as any,
		{
			width: 375,
			height: 625,
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

// Helper function to safely encode binary data to base64
function encodeBase64(data: Uint8Array): string {
	const chunks = [];
	const chunkSize = 1024;

	for (let i = 0; i < data.length; i += chunkSize) {
		const chunk = data.slice(i, i + chunkSize);
		chunks.push(String.fromCharCode.apply(null, [...chunk]));
	}

	return btoa(chunks.join(""));
}
