import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import addMonths from "https://deno.land/x/date_fns@v2.22.1/addMonths/index.ts";
import format from "https://deno.land/x/date_fns@v2.22.1/format/index.js";
import subMonths from "https://deno.land/x/date_fns@v2.22.1/subMonths/index.ts";

interface WeekPickerProps {
	onWeekChange?: (startDate: Date, endDate: Date) => void;
	defaultWeek?: { startDate: Date; endDate: Date };
}

export default function WeekPicker(
	{ onWeekChange, defaultWeek }: WeekPickerProps,
) {
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);
	const [displayText, setDisplayText] = useState<string>("Select a week...");
	const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
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
				// Ensure we're passing UTC-normalized dates to avoid timezone issues
				onWeekChange(
					createUTCDate(weekDates[0]),
					createUTCDate(weekDates[6]),
				);
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
				// Ensure we're passing UTC-normalized dates to avoid timezone issues
				onWeekChange(
					createUTCDate(weekDates[0]),
					createUTCDate(weekDates[6]),
				);
			}
		}
	}, []);

	// Create a UTC date with the same year, month, day as the input date
	// This ensures the date is not shifted due to local timezone
	const createUTCDate = (date: Date): Date => {
		const utcDate = new Date(Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			0,
			0,
			0,
			0,
		));
		return utcDate;
	};

	const generateWeekDates = (baseDate: Date): Date[] => {
		const dates: Date[] = [];

		// Create a fresh Date object to avoid any timezone shifts
		const baseDateClone = new Date(baseDate);

		// Get the day of week (0 = Sunday, 1 = Monday, etc.)
		const dayOfWeek = baseDateClone.getDay();

		// Calculate how many days to subtract to get to Monday
		const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

		// Set to Monday
		const weekStart = new Date(baseDateClone);
		weekStart.setDate(baseDateClone.getDate() - daysToSubtract);

		// Ensure the time component is zeroed out
		weekStart.setHours(0, 0, 0, 0);

		// Generate the 7 days of the week
		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStart);
			date.setDate(weekStart.getDate() + i);
			dates.push(date);
		}

		return dates;
	};

	// Format date for display
	const formatDate = (date: Date): string => {
		return format(date, "EEE, MMM d, yyyy", {});
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
				// Ensure we're passing UTC-normalized dates to avoid timezone issues
				onWeekChange(
					createUTCDate(weekDates[0]),
					createUTCDate(weekDates[6]),
				);
			}
		}

		setIsPickerVisible(false);
	};

	// Navigate to previous month
	const goToPreviousMonth = (e: Event) => {
		e.stopPropagation();
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	// Navigate to next month
	const goToNextMonth = (e: Event) => {
		e.stopPropagation();
		setCurrentMonth(addMonths(currentMonth, 1));
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
					<div className="month-navigation">
						<button
							className="month-nav-button"
							onClick={goToPreviousMonth}
						>
							&lt;
						</button>
						<div className="current-month">
							{format(currentMonth, "MMMM yyyy", {})}
						</div>
						<button
							className="month-nav-button"
							onClick={goToNextMonth}
						>
							&gt;
						</button>
					</div>
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

						{generateCalendarDays(currentMonth).map((
							date,
							index,
						) => (
							<div
								key={index}
								className={`calendar-day ${
									isDateInSelectedWeek(date)
										? "selected-day"
										: ""
								} ${
									date.getMonth() !== currentMonth.getMonth()
										? "other-month"
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
        
        .month-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .month-nav-button {
          background-color: #f3f4f6;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }
        
        .month-nav-button:hover {
          background-color: #e5e7eb;
        }
        
        .current-month {
          font-weight: bold;
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
        
        .other-month {
          color: #9ca3af;
        }
      `}
			</style>
		</div>
	);

	// Helper function to generate calendar days for the specified month view
	function generateCalendarDays(date: Date): Date[] {
		const year = date.getFullYear();
		const month = date.getMonth();

		// First day of the month
		const firstDay = new Date(year, month, 1);

		const days: Date[] = [];

		// Get the first Monday (or previous Monday if 1st is not Monday)
		const firstDayOfWeek = firstDay.getDay() || 7; // Convert Sunday (0) to 7
		const firstMonday = new Date(firstDay);
		firstMonday.setDate(firstDay.getDate() - (firstDayOfWeek - 1));

		// Generate 6 weeks worth of days to ensure complete month view
		for (let i = 0; i < 42; i++) {
			const day = new Date(firstMonday);
			day.setDate(firstMonday.getDate() + i);
			days.push(day);
		}

		return days;
	}

	// Helper to check if a date is in the selected week
	function isDateInSelectedWeek(date: Date): boolean {
		if (selectedDates.length === 0) return false;

		const startOfWeek = selectedDates[0];
		const endOfWeek = selectedDates[6];

		// Compare only the date parts, ignoring time
		const dateOnly = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);
		const startOnly = new Date(
			startOfWeek.getFullYear(),
			startOfWeek.getMonth(),
			startOfWeek.getDate(),
		);
		const endOnly = new Date(
			endOfWeek.getFullYear(),
			endOfWeek.getMonth(),
			endOfWeek.getDate(),
		);

		return (
			dateOnly >= startOnly &&
			dateOnly <= endOnly
		);
	}
}
