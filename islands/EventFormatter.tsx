import { useEffect, useState } from "preact/hooks";
import LocalStorageInput from "./LocalStorageInput.tsx";

interface EventFormatterProps {
	events: ICalEvent[];
	onFormattedTextChange: (formattedText: string) => void;
}

export default function EventFormatter(
	{ events, onFormattedTextChange }: EventFormatterProps,
) {
	const defaultFormat = "- {timestamp} | **{summary}**{description}";
	const [formatString, setFormatString] = useState(defaultFormat);

	// Format events whenever the format string or events change
	useEffect(() => {
		if (!events || events.length === 0) return;

		const formatted = events.map((event) => {
			let line = formatString;

			// Replace keywords with actual values
			const unixTimestamp = Math.floor(
				new Date(event.start).getTime() / 1000,
			);
			line = line.replace(/{timestamp}/g, `<t:${unixTimestamp}:F>`);
			line = line.replace(/{summary}/g, event.summary || "");
			line = line.replace(
				/{description}/g,
				event.description ? ` | ${event.description}` : "",
			);
			line = line.replace(
				/{location}/g,
				event.location ? ` | ${event.location}` : "",
			);

			return line;
		}).join("\n");

		onFormattedTextChange(formatted);
	}, [formatString, events]);

	return (
		<div className="event-formatter">
			<LocalStorageInput
				id="format-input"
				label="Custom Format Pattern:"
				value={formatString}
				onChange={setFormatString}
				placeholder="Enter format pattern"
				storageKey="calendarFormatCurrent"
				historyStorageKey="calendarFormatHistory"
				maxHistoryItems={10}
				helpText="Available keywords: {timestamp}, {summary}, {description}, {location}"
				className="format-input-wrapper"
				defaultValue={defaultFormat}
			/>

			<style>
				{`
          .event-formatter {
            margin-bottom: 15px;
          }
          
          .format-input-wrapper :global(.storage-input) {
            font-family: monospace;
          }
        `}
			</style>
		</div>
	);
}
