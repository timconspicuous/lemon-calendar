import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import WeekPicker from "./WeekPicker.tsx";
import URLInput from "../islands/URLInput.tsx";
import ResultsDisplay from "../islands/ResultsDisplay.tsx";
import {
	getDefaultWeek,
	isValidUrl,
	saveUrlToHistory,
} from "../utils/formUtils.ts";

export default function FormContainer() {
	const [url, setUrl] = useState<string>("");
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [svgData, setSvgData] = useState<string | null>(null);
	const [events, setEvents] = useState<ICalEvent[] | null>(null);
	const [urlHistory, setUrlHistory] = useState<string[]>([]);

	// Initialize with default week if dates are null
	useEffect(() => {
		if (IS_BROWSER && !startDate && !endDate) {
			const defaultWeek = getDefaultWeek();
			if (defaultWeek) {
				setStartDate(defaultWeek.startDate);
				setEndDate(defaultWeek.endDate);
			}
		}
	}, []);

	// Handle URL input changes
	const handleUrlChange = (newUrl: string) => {
		setUrl(newUrl);
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
		if (!isValidUrl(url)) {
			setFormError(
				"Please enter a valid URL including http:// or https://",
			);
			return;
		}

		setIsSubmitting(true);
		setSvgData(null);
		setEvents(null);

		// Save the valid URL to history
		const updatedHistory = saveUrlToHistory(url, urlHistory);
		setUrlHistory(updatedHistory);

		try {
			// Fetch events data
			const eventsParams = new URLSearchParams({
				url: url,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			});

			const eventsResponse = await fetch(
				`/api/fetch-calendar-events?${eventsParams.toString()}`,
			);

			if (!eventsResponse.ok) {
				throw new Error(
					`Events fetch failed: ${eventsResponse.statusText}`,
				);
			}

			const jsonData = await eventsResponse.json();
			setEvents(jsonData.events);

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
		} catch (error) {
			console.error("Error fetching data:", error);
			setFormError(
				`Failed to fetch calendar data: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="form-container">
			<form onSubmit={handleSubmit}>
				<div className="form-group">
					<URLInput
						value={url}
						onChange={handleUrlChange}
						onError={setFormError}
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
			<ResultsDisplay svgData={svgData} events={events} />

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
        `}
			</style>
		</div>
	);
}
