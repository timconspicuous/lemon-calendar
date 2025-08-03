import { useState } from "preact/hooks";
import EventFormatter from "./EventFormatter.tsx";
import DiscordWebhook from "./DiscordWebhook.tsx";

interface ResultsDisplayProps {
	svgData: string | null;
	events: ICalEvent[] | null;
}

export default function ResultsDisplay(
	{ svgData, events }: ResultsDisplayProps,
) {
	const [copyMessage, setCopyMessage] = useState<string | null>(null);
	const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
	const [formattedText, setFormattedText] = useState<string>("");

	// Copy text to clipboard
	const copyTextToClipboard = async () => {
		if (!formattedText) return;

		try {
			await navigator.clipboard.writeText(formattedText);
			setCopyMessage("Copied to clipboard!");
			setTimeout(() => setCopyMessage(null), 2000);
		} catch (_err) {
			setCopyMessage("Failed to copy");
			setTimeout(() => setCopyMessage(null), 2000);
		}
	};

	// Download SVG as PNG
	const downloadPNG = async () => {
		if (!svgData) return;

		try {
			setDownloadStatus("Converting...");

			const response = await fetch("/api/svg-to-png", {
				method: "POST",
				body: svgData,
				headers: {
					"Content-Type": "image/svg+xml",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to convert to PNG");
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);

			// Create download link and trigger click
			const a = document.createElement("a");
			a.href = url;
			a.download = `calendar-schedule-${
				new Date().toISOString().split("T")[0]
			}.png`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			setDownloadStatus("Downloaded!");
			setTimeout(() => setDownloadStatus(null), 2000);
		} catch (error) {
			console.error("Error downloading PNG:", error);
			setDownloadStatus("Download failed");
			setTimeout(() => setDownloadStatus(null), 2000);
		}
	};

	if (!svgData && !events) return null;

	return (
		<div className="results-container">
			<h2>Calendar Results</h2>

			{events && events.length > 0 && (
				<div className="text-container">
					<div className="result-header">
						<h3>Event Listing</h3>
						<button
							onClick={copyTextToClipboard}
							className="action-button"
							disabled={!!copyMessage}
						>
							{copyMessage || "Copy to Clipboard"}
						</button>
					</div>

					<EventFormatter
						events={events}
						onFormattedTextChange={setFormattedText}
					/>

					<pre className="text-output">{formattedText}</pre>
				</div>
			)}

			{svgData && (
				<div className="svg-container">
					<div className="result-header">
						<h3>Weekly Schedule</h3>
						<button
							onClick={downloadPNG}
							className="action-button"
							disabled={!!downloadStatus}
						>
							{downloadStatus || "Download as PNG"}
						</button>
					</div>
					<div dangerouslySetInnerHTML={{ __html: svgData }} />
				</div>
			)}

			{svgData && <DiscordWebhook svgData={svgData} events={events} />}

			<style>
				{`
          .results-container {
            margin-top: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            background-color: #f9f9f9;
          }
          
          .svg-container, .text-container {
            margin-top: 20px;
          }
          
          .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .text-output {
            background-color: white;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: monospace;
            overflow-x: auto;
          }
          
          .action-button {
            padding: 6px 12px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          
          .action-button:hover {
            background-color: #1565c0;
          }
          
          .action-button:disabled {
            background-color: #cccccc;
            cursor: default;
          }
        `}
			</style>
		</div>
	);
}
