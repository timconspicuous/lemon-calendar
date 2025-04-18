import { useEffect, useState } from "preact/hooks";

interface EventFormatterProps {
	events: ICalEvent[];
	onFormattedTextChange: (formattedText: string) => void;
}

export default function EventFormatter(
	{ events, onFormattedTextChange }: EventFormatterProps,
) {
	const defaultFormat = "- {timestamp} | **{summary}**{description}";
	const [formatString, setFormatString] = useState(defaultFormat);
	const [formattedText, setFormattedText] = useState("");

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

		setFormattedText(formatted);
		onFormattedTextChange(formatted);
	}, [formatString, events]);

	return (
		<div className="event-formatter">
			<div className="format-input-container">
				<label htmlFor="format-input">Custom Format Pattern:</label>
				<input
					id="format-input"
					type="text"
					value={formatString}
					onChange={(e) =>
						setFormatString((e.target as HTMLInputElement).value)}
					className="format-input"
					placeholder="Enter format pattern"
				/>
				<p className="format-help">
					Available keywords: {"{timestamp}"}, {"{summary}"},{" "}
					{"{description}"}, {"{location}"}
				</p>
			</div>

			<style>
				{`
          .event-formatter {
            margin-bottom: 15px;
          }
          
          .format-input-container {
            margin-bottom: 10px;
          }
          
          .format-input {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
          }
          
          .format-help {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
          }
        `}
			</style>
		</div>
	);
}
