import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface EventFormatterProps {
	events: ICalEvent[];
	onFormattedTextChange: (formattedText: string) => void;
}

export default function EventFormatter(
	{ events, onFormattedTextChange }: EventFormatterProps,
) {
	const defaultFormat = "- {timestamp} | **{summary}**{description}";
	const [formatString, setFormatString] = useState(defaultFormat);
	const [formatHistory, setFormatHistory] = useState<string[]>([]);
	const [showFormatHistory, setShowFormatHistory] = useState<boolean>(false);
	const formatInputRef = useRef<HTMLInputElement>(null);
	const formatDropdownRef = useRef<HTMLDivElement>(null);

	// Load format history from localStorage on component mount
	useEffect(() => {
		if (IS_BROWSER) {
			// Get saved format from localStorage or use default
			const savedFormat = localStorage.getItem("calendarFormatCurrent");
			if (savedFormat) {
				setFormatString(savedFormat);
			}

			// Get format history from localStorage
			const storedFormats = localStorage.getItem("calendarFormatHistory");
			if (storedFormats) {
				setFormatHistory(JSON.parse(storedFormats));
			}
		}
	}, []);

	// Add click outside listener to close dropdown
	useEffect(() => {
		if (IS_BROWSER && showFormatHistory) {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					formatDropdownRef.current &&
					!formatDropdownRef.current.contains(event.target as Node) &&
					formatInputRef.current &&
					!formatInputRef.current.contains(event.target as Node)
				) {
					setShowFormatHistory(false);
				}
			};

			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [showFormatHistory]);

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

	// Save format string to localStorage when it changes
	useEffect(() => {
		if (IS_BROWSER && formatString) {
			localStorage.setItem("calendarFormatCurrent", formatString);
		}
	}, [formatString]);

	// Handle format input changes
	const handleFormatChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		setFormatString(target.value);
	};

	// Handle format input focus
	const handleFormatFocus = () => {
		setShowFormatHistory(true);
	};

	// Handle format submission
	const handleFormatSubmit = (e: Event) => {
		e.preventDefault();

		if (!formatString || formatString === defaultFormat) return;

		// Add to history if not already present
		if (!formatHistory.includes(formatString)) {
			const newHistory = [formatString, ...formatHistory].slice(0, 10); // Keep last 10 formats
			setFormatHistory(newHistory);

			// Save to localStorage
			if (IS_BROWSER) {
				localStorage.setItem(
					"calendarFormatHistory",
					JSON.stringify(newHistory),
				);
			}
		}

		setShowFormatHistory(false);
	};

	// Handle format selection from history
	const selectFormat = (selectedFormat: string) => {
		setFormatString(selectedFormat);
		setShowFormatHistory(false);
		// Focus the input after selection
		if (formatInputRef.current) {
			formatInputRef.current.focus();
		}
	};

	return (
		<div className="event-formatter">
			<form
				onSubmit={handleFormatSubmit}
				className="format-input-container"
			>
				<label htmlFor="format-input">Custom Format Pattern:</label>
				<div className="input-with-button">
					<input
						id="format-input"
						type="text"
						value={formatString}
						onInput={handleFormatChange}
						onFocus={handleFormatFocus}
						className="format-input"
						placeholder="Enter format pattern"
						ref={formatInputRef}
					/>
					<button type="submit" className="save-format-button">
						Save
					</button>
				</div>

				<p className="format-help">
					Available keywords: {"{timestamp}"}, {"{summary}"},{" "}
					{"{description}"}, {"{location}"}
				</p>

				{showFormatHistory && formatHistory.length > 0 && (
					<div
						className="format-history-dropdown"
						ref={formatDropdownRef}
					>
						{formatHistory.map((historyFormat, index) => (
							<div
								key={index}
								className="format-history-item"
								onClick={() => selectFormat(historyFormat)}
							>
								{historyFormat}
							</div>
						))}
					</div>
				)}
			</form>

			<style>
				{`
          .event-formatter {
            margin-bottom: 15px;
          }
          
          .format-input-container {
            position: relative;
            margin-bottom: 10px;
          }
          
          .input-with-button {
            display: flex;
            gap: 8px;
            margin-top: 5px;
          }
          
          .format-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
          }
          
          .save-format-button {
            padding: 8px 12px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          
          .save-format-button:hover {
            background-color: #1565c0;
          }
          
          .format-help {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
          }
          
          .format-history-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            background-color: white;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 4px 4px;
            z-index: 10;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .format-history-item {
            padding: 8px 12px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .format-history-item:hover {
            background-color: #f5f5f5;
          }
        `}
			</style>
		</div>
	);
}
