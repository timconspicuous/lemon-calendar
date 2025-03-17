import satori from "https://esm.sh/satori@0.12.1";
import format from "https://deno.land/x/date_fns@v2.22.1/format/index.js";
import { Event } from "../utils/calendarUtils.ts";
import { toZonedTime } from "npm:date-fns-tz";

// Define theme interface for styling options
interface Theme {
	fontFamily: string;
	headerColor: string;
	dateRangeColor: string;
	dayColor: string;
	eventBgColors: {
		default: string;
		twitch: string;
		discord: string;
	};
	eventTextColor: string;
	noEventColor: string;
	backgroundImagePath: string; // Path to background image
	iconPaths: {
		discord: string;
		twitch: string;
	};
}

// Default theme
const defaultTheme: Theme = {
	fontFamily: "Lazydog",
	headerColor: "#ffffff",
	dateRangeColor: "#ffffff",
	dayColor: "#ffffff",
	eventBgColors: {
		default: "#e6d195",
		twitch: "#eebd37",
		discord: "#f3af52",
	},
	eventTextColor: "#ffffff",
	noEventColor: "#ffffff",
	backgroundImagePath: "./static/background.png",
	iconPaths: {
		discord: "./static/discord-icon.svg",
		twitch: "./static/twitch-icon.svg",
	},
};

// Theme collection - can be expanded as needed
const themes: Record<string, Theme> = {
	"light": defaultTheme,
	"dark": {
		fontFamily: "Lazydog",
		headerColor: "#ffffff",
		dateRangeColor: "#cccccc",
		dayColor: "#ffffff",
		eventBgColors: {
			default: "#333333",
			twitch: "#333333",
			discord: "#333333",
		},
		eventTextColor: "#ffffff",
		noEventColor: "#777777",
		backgroundImagePath: "./static/background.png",
		iconPaths: {
			discord: "./static/discord-icon.svg",
			twitch: "./static/twitch-icon.svg",
		},
	},
	// Add more themes as needed
};

export default function WeeklySchedule(
	events: Event[],
	startDate: Date,
	endDate: Date,
	backgroundImageBase64?: string,
	iconBase64Map?: Record<string, string>,
	theme: Theme = defaultTheme,
) {
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	const aspectRatio = 2700 / 4500; // Based on your original background image size
	const displayWidth = 375; // Your defined width
	const displayHeight = displayWidth / aspectRatio;

	// Calculate relative positions
	const headerPosition = 0.08;
	const scheduleStartPosition = 0.212;
	const scheduleHeight = 0.73;

	// Format the date range
	const startDateFormatted = format(startDate, "dd.MM.", []);
	const endDateFormatted = format(endDate, "dd.MM.", []);
	const dateRangeText = `${startDateFormatted} - ${endDateFormatted}`;

	// Helper function to get event background color based on location
	const getEventBgColor = (event: Event | undefined) => {
		if (!event || !event.location) return theme.eventBgColors.default;

		const location = event.location.toLowerCase();
		if (location === "twitch") return theme.eventBgColors.twitch;
		if (location === "discord") return theme.eventBgColors.discord;

		return theme.eventBgColors.default;
	};

	// Helper function to get icon based on location
	const getEventIcon = (event: Event | undefined) => {
		if (!event || !event.location || !iconBase64Map) return null;

		const location = event.location.toLowerCase();
		if (location === "twitch" && iconBase64Map.twitch) {
			return iconBase64Map.twitch;
		}
		if (location === "discord" && iconBase64Map.discord) {
			return iconBase64Map.discord;
		}

		return null;
	};

	const getSummaryFontSize = (summary: string | undefined): string => {
		const baseFontSize = 1.1; // em
		const idealLength = 10;
		const minFontSize = 0.55; // em
		const reductionStartLength = idealLength;
		const reductionEndLength = 50; // Length at which minFontSize is reached
		const fontSizeRange = baseFontSize - minFontSize;
		const lengthRange = reductionEndLength - reductionStartLength;

		if (!summary) return `${baseFontSize}em`;

		const summaryLength = summary.length;

		if (summaryLength <= idealLength) {
			return `${baseFontSize}em`;
		} else if (summaryLength >= reductionEndLength) {
			return `${minFontSize}em`;
		} else {
			const lengthOverIdeal = summaryLength - reductionStartLength;
			const fontSizeReduction = (lengthOverIdeal / lengthRange) *
				fontSizeRange;
			const calculatedFontSize = baseFontSize - fontSizeReduction;
			return `${calculatedFontSize.toFixed(2)}em`; // Format to 2 decimal places for cleaner output
		}
	};

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

			{/* Header */}
			<div
				className="header"
				style={{
					position: "absolute",
					top: `${headerPosition * 100}%`,
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{/* Title */}
				<div
					className="title"
					style={{
						fontFamily: theme.fontFamily,
						fontSize: "32px",
						fontWeight: "bold",
						color: theme.headerColor,
						justifyContent: "center",
						width: "100%",
						marginBottom: "8px",
					}}
				>
					Stream Schedule
				</div>

				{/* Date Range */}
				<div
					className="week-range"
					style={{
						fontFamily: theme.fontFamily,
						fontSize: "20px",
						color: theme.dateRangeColor,
						justifyContent: "center",
						width: "100%",
					}}
				>
					{dateRangeText}
				</div>
			</div>

			{/* Weekly Schedule */}
			<div
				className="schedule"
				style={{
					position: "absolute",
					top: `${scheduleStartPosition * 100}%`,
					width: "80%",
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
					const hasEvent = !!event;
					const eventBgColor = getEventBgColor(event);
					const eventIcon = getEventIcon(event);
					const summaryFontSize = getSummaryFontSize(event?.summary);

					return (
						<div
							key={index}
							className="event-box"
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								width: "100%",
								height: `${100 / days.length - 2}%`,
								backgroundColor: eventBgColor,
								padding: "10px",
								borderRadius: "15px",
								marginBottom: "8px",
								fontSize: "1.2em",
								fontFamily: theme.fontFamily,
								position: "relative",
							}}
						>
							{/* Location icon overlay */}
							{eventIcon && (
								<img
									src={`data:image/svg+xml;base64,${eventIcon}`}
									style={{
										position: "absolute",
										top: "-12px",
										left: "-12px",
										width: "30px",
										height: "30px",
										zIndex: 10,
									}}
								/>
							)}

							<div
								className="weekday"
								style={{
									fontWeight: "bold",
									marginRight: "10px",
									justifyContent: "flex-start",
									flex: "1",
									color: theme.dayColor,
								}}
							>
								{day}
							</div>

							<div
								className="summary"
								style={{
									display: "flex",
									justifyContent: "center",
									textAlign: "center",
									flex: 2,
									marginRight: "10px",
									wordWrap: "break-word",
									color: theme.eventTextColor,
									fontSize: summaryFontSize,
								}}
							>
								{hasEvent ? event.summary : "-"}
							</div>

							<div
								className="time"
								style={{
									display: "flex",
									justifyContent: "flex-end",
									flex: "1",
									whiteSpace: "nowrap",
									color: theme.eventTextColor,
								}}
							>
								{hasEvent
									? format(
										toZonedTime(
											event.start,
											event.timezone!,
										),
										"ha",
										[],
									)
									: ""}
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

	// Load icon images
	const iconBase64Map: Record<string, string> = {};
	try {
		// Load Discord icon
		const discordIconData = await Deno.readFile(theme.iconPaths.discord);
		iconBase64Map.discord = encodeBase64(discordIconData);

		// Load Twitch icon
		const twitchIconData = await Deno.readFile(theme.iconPaths.twitch);
		iconBase64Map.twitch = encodeBase64(twitchIconData);
	} catch (error) {
		console.error(
			`Error loading icon images: ${(error as Error).message}`,
		);
	}

	const svg = await satori(
		WeeklySchedule(
			events,
			startDate,
			endDate,
			backgroundImageBase64,
			iconBase64Map,
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
