import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import WeekPicker from "./WeekPicker.tsx";

export default function FormContainer() {
	const [url, setUrl] = useState<string>("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [svgData, setSvgData] = useState<string | null>(null);
	const [textData, setTextData] = useState<string | null>(null);

	// Calculate default week (current week)
	const getDefaultWeek = () => {
		if (!IS_BROWSER) return undefined;

		const today = new Date();
		const currentWeekStart = new Date(today);
		const day = today.getDay();
		const diff = day === 0 ? 6 : day - 1; // Adjust for Monday as week start
		currentWeekStart.setDate(today.getDate() - diff);

		const currentWeekEnd = new Date(currentWeekStart);
		currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

		return { startDate: currentWeekStart, endDate: currentWeekEnd };
	};

	// Handle URL input changes
	const handleUrlChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		setUrl(target.value);
		setFormError(null);
	};

	// Handle week selection from WeekPicker
	const handleWeekChange = (start: Date, end: Date) => {
		setStartDate(start);
		setEndDate(end);
		setFormError(null);
	};

	// Handle form submission
	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		// Basic validation
		if (!url.trim()) {
			setFormError("Please enter a valid URL");
			return;
		}

		if (!startDate || !endDate) {
			setFormError("Please select a week");
			return;
		}

		// Additional URL validation
		try {
			new URL(url); // This will throw if URL is invalid
		} catch (_error) {
			setFormError(
				"Please enter a valid URL including http:// or https://",
			);
			return;
		}

		setIsSubmitting(true);
		setSvgData(null);
		setTextData(null);

		try {
			// Fetch SVG data
			const svgParams = new URLSearchParams({
				url: url,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			});
			const svgResponse = await fetch(
				`/api/fetch-calendar-svg?${svgParams.toString()}`,
			);

			if (!svgResponse.ok) {
				throw new Error(`SVG fetch failed: ${svgResponse.statusText}`);
			}

			const svgContent = await svgResponse.text();
			setSvgData(svgContent);

			// Fetch text data
			const textParams = new URLSearchParams({
				url: url,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			});
			const textResponse = await fetch(
				`/api/fetch-calendar-text?${textParams.toString()}`,
			);

			if (!textResponse.ok) {
				throw new Error(
					`Text fetch failed: ${textResponse.statusText}`,
				);
			}

			const jsonData = await textResponse.json();
			setTextData(jsonData.result);
		} catch (error) {
			console.error("Error fetching data:", error);
			// setFormError(`Failed to fetch calendar data: ${error.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Initialize with default week if dates are null
	if (IS_BROWSER && !startDate && !endDate) {
		const defaultWeek = getDefaultWeek();
		if (defaultWeek) {
			setStartDate(defaultWeek.startDate);
			setEndDate(defaultWeek.endDate);
		}
	}

	return (
		<div className="form-container">
			<form onSubmit={handleSubmit}>
				<div className="form-group">
					<label htmlFor="url-input">Enter iCalendar URL:</label>
					<input
						id="url-input"
						type="text"
						value={url}
						onInput={handleUrlChange}
						placeholder="https://example.com"
						className="url-input"
					/>
				</div>

				<div className="form-group">
					<label>Select week period:</label>
					<WeekPicker
						onWeekChange={handleWeekChange}
						defaultWeek={getDefaultWeek()}
					/>
				</div>

				{formError && <div className="error-message">{formError}</div>}

				<div className="form-group">
					<button
						type="submit"
						className="submit-button"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Processing..." : "Generate Schedule"}
					</button>
				</div>
			</form>

			{/* Results Section */}
			{(svgData || textData) && (
				<div className="results-container">
					<h2>Calendar Results</h2>

					{textData && (
						<div className="text-container">
							<h3>Event Listing</h3>
							<pre className="text-output">{textData}</pre>
						</div>
					)}

					{svgData && (
						<div className="svg-container">
							<h3>Weekly Schedule</h3>
							<div
								// deno-lint-ignore react-no-danger
								dangerouslySetInnerHTML={{ __html: svgData }}
							/>
						</div>
					)}
				</div>
			)}

			<style>
				{`
          .form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
          }
          
          .url-input {
            width: 100%;
            padding: 8px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          
          .error-message {
            color: #d32f2f;
            margin-bottom: 16px;
            padding: 8px;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            background-color: #f8d7da;
          }
          
          .submit-button {
            padding: 10px 16px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          
          .submit-button:hover {
            background-color: #1565c0;
          }
          
          .submit-button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
          
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
          
          .text-output {
            background-color: white;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: monospace;
            overflow-x: auto;
          }
        `}
			</style>
		</div>
	);
}
