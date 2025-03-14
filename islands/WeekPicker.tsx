import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface WeekPickerProps {
	onWeekChange?: (startDate: Date, endDate: Date) => void;
	defaultWeek?: { startDate: Date; endDate: Date };
}

export default function WeekPicker(
	{ onWeekChange, defaultWeek }: WeekPickerProps,
) {
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);
	const [displayText, setDisplayText] = useState<string>("Select a week...");
	const weekPickerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [isPickerVisible, setIsPickerVisible] = useState(false);

	// Set default week on component mount
	useEffect(() => {
		if (!IS_BROWSER) return;

		if (defaultWeek) {
			const weekDates = generateWeekDates(defaultWeek.startDate);
			setSelectedDates(weekDates);
			setDisplayText(
				`${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`,
			);

			if (onWeekChange) {
				onWeekChange(weekDates[0], weekDates[6]);
			}
		} else {
			// Set to current week if no default provided
			const today = new Date();
			const weekDates = generateWeekDates(today);
			setSelectedDates(weekDates);
			setDisplayText(
				`${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`,
			);

			if (onWeekChange) {
				onWeekChange(weekDates[0], weekDates[6]);
			}
		}
	}, []);

	const generateWeekDates = (baseDate: Date): Date[] => {
		const dates: Date[] = [];
		const weekStart = new Date(baseDate);
		const day = weekStart.getUTCDay();
		const diff = day === 0 ? 6 : day - 1; // Adjust for Monday as week start

		weekStart.setUTCDate(weekStart.getUTCDate() - diff);

		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStart);
			date.setUTCDate(weekStart.getUTCDate() + i);
			dates.push(date);
		}

		return dates;
	};

	// Format date for display
	const formatDate = (date: Date): string => {
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			timeZone: "UTC", // Ensure UTC formatting
		});
	};

	// Handle date selection
	const handleDateSelect = (date: Date) => {
		const weekDates = generateWeekDates(date);
		setSelectedDates(weekDates);

		if (weekDates.length > 0) {
			setDisplayText(
				`${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`,
			);

			if (onWeekChange) {
				onWeekChange(weekDates[0], weekDates[6]);
			}
		}

		setIsPickerVisible(false);
	};

	// Toggle date picker visibility
	const toggleDatePicker = () => {
		setIsPickerVisible(!isPickerVisible);
	};

	// Click outside to close the picker
	useEffect(() => {
		if (!IS_BROWSER) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				weekPickerRef.current &&
				!weekPickerRef.current.contains(event.target as Node)
			) {
				setIsPickerVisible(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="week-picker-container" ref={weekPickerRef}>
			<div className="input-group date" id="week-picker">
				<div
					className="form-control"
					onClick={toggleDatePicker}
				>
					{displayText}
				</div>
				<input type="hidden" ref={inputRef} />
				<span
					className="input-group-addon"
					onClick={toggleDatePicker}
				>
					📅
				</span>
			</div>

			{isPickerVisible && (
				<div className="date-picker-popup">
					<div className="calendar-grid">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
							(day) => (
								<div
									key={day}
									className="day-header"
								>
									{day}
								</div>
							),
						)}

						{generateCalendarDays().map((date, index) => (
							<div
								key={index}
								className={`calendar-day ${
									isDateInSelectedWeek(date)
										? "selected-day"
										: ""
								}`}
								onClick={() => handleDateSelect(date)}
							>
								{date.getDate()}
							</div>
						))}
					</div>
				</div>
			)}

			<style>
				{`
        .week-picker-container {
          position: relative;
          width: 100%;
          max-width: 400px;
        }
        
        .input-group {
          display: flex;
          align-items: center;
        }
        
        .form-control {
          flex: 1;
          cursor: pointer;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .input-group-addon {
          padding: 8px;
          background-color: #e5e7eb;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .date-picker-popup {
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 16px;
          margin-top: 4px;
          z-index: 10;
        }
        
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        .day-header {
          text-align: center;
          font-weight: bold;
        }
        
        .calendar-day {
          text-align: center;
          padding: 8px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .calendar-day:hover {
          background-color: #e5e7eb;
        }
        
        .selected-day {
          background-color: #bfdbfe;
        }
      `}
			</style>
		</div>
	);

	// Helper function to generate calendar days for current month view
	function generateCalendarDays(): Date[] {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth();

		// First day of the month
		const firstDay = new Date(year, month, 1);
		// Last day of the month
		const _lastDay = new Date(year, month + 1, 0);

		const days: Date[] = [];

		// Get the first Monday (or previous Monday if 1st is not Monday)
		const firstMonday = new Date(firstDay);
		const firstDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
		firstMonday.setDate(firstDay.getDate() - (firstDayOfWeek - 1));

		// Generate at least 42 days (6 weeks) to ensure we have a complete view
		for (let i = 0; i < 42; i++) {
			const date = new Date(firstMonday);
			date.setDate(firstMonday.getDate() + i);
			days.push(date);

			// Break if we've reached the end of the month and completed the week
			if (date.getMonth() > month && date.getDay() === 0) {
				break;
			}
		}

		return days;
	}

	// Helper to check if a date is in the selected week
	function isDateInSelectedWeek(date: Date): boolean {
		if (selectedDates.length === 0) return false;

		return selectedDates.some((selectedDate) =>
			selectedDate.getFullYear() === date.getFullYear() &&
			selectedDate.getMonth() === date.getMonth() &&
			selectedDate.getDate() === date.getDate()
		);
	}
}
