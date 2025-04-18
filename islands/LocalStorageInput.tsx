import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

export interface LocalStorageInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	onSubmit?: (value: string) => void;
	placeholder?: string;
	storageKey: string;
	historyStorageKey: string;
	maxHistoryItems?: number;
	helpText?: string;
	className?: string;
}

export default function LocalStorageInput({
	id,
	label,
	value,
	onChange,
	onSubmit,
	placeholder = "",
	storageKey,
	historyStorageKey,
	maxHistoryItems = 10,
	helpText,
	className = "",
}: LocalStorageInputProps) {
	const [history, setHistory] = useState<string[]>([]);
	const [showHistory, setShowHistory] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Load history from localStorage on component mount
	useEffect(() => {
		if (IS_BROWSER) {
			// Get saved value from localStorage
			const savedValue = localStorage.getItem(storageKey);
			if (savedValue && savedValue !== value) {
				onChange(savedValue);
			}

			// Get history from localStorage
			const storedHistory = localStorage.getItem(historyStorageKey);
			if (storedHistory) {
				setHistory(JSON.parse(storedHistory));
			}
		}
	}, []);

	// Add click outside listener to close dropdown
	useEffect(() => {
		if (IS_BROWSER && showHistory) {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					dropdownRef.current &&
					!dropdownRef.current.contains(event.target as Node) &&
					inputRef.current &&
					!inputRef.current.contains(event.target as Node)
				) {
					setShowHistory(false);
				}
			};

			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [showHistory]);

	// Save value to localStorage when it changes
	useEffect(() => {
		if (IS_BROWSER && value) {
			localStorage.setItem(storageKey, value);
		}
	}, [value, storageKey]);

	// Handle input changes
	const handleChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		onChange(target.value);
	};

	// Handle input focus
	const handleFocus = () => {
		setShowHistory(true);
	};

	// Handle form submission
	const handleSubmit = (e: Event) => {
		e.preventDefault();

		if (!value) return;

		// Add to history if not already present
		if (!history.includes(value)) {
			const newHistory = [value, ...history].slice(0, maxHistoryItems);
			setHistory(newHistory);

			// Save to localStorage
			if (IS_BROWSER) {
				localStorage.setItem(
					historyStorageKey,
					JSON.stringify(newHistory),
				);
			}
		}

		setShowHistory(false);

		if (onSubmit) {
			onSubmit(value);
		}
	};

	// Handle selection from history
	const selectItem = (selectedItem: string) => {
		onChange(selectedItem);
		setShowHistory(false);
		// Focus the input after selection
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	return (
		<div className={`local-storage-input-container ${className}`}>
			<form onSubmit={handleSubmit}>
				<label htmlFor={id}>{label}</label>
				<div className="input-with-button">
					<input
						id={id}
						type="text"
						value={value}
						onInput={handleChange}
						onFocus={handleFocus}
						placeholder={placeholder}
						className="storage-input"
						ref={inputRef}
					/>
					<button type="submit" className="save-button">Save</button>
				</div>

				{helpText && <p className="help-text">{helpText}</p>}

				{showHistory && history.length > 0 && (
					<div className="history-dropdown" ref={dropdownRef}>
						{history.map((historyItem, index) => (
							<div
								key={index}
								className="history-item"
								onClick={() => selectItem(historyItem)}
							>
								{historyItem}
							</div>
						))}
					</div>
				)}
			</form>

			<style>
				{`
          .local-storage-input-container {
            position: relative;
            margin-bottom: 10px;
          }
          
          .input-with-button {
            display: flex;
            gap: 8px;
            margin-top: 5px;
          }
          
          .storage-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          .save-button {
            padding: 8px 12px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          
          .save-button:hover {
            background-color: #1565c0;
          }
          
          .help-text {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
          }
          
          .history-dropdown {
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
          
          .history-item {
            padding: 8px 12px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .history-item:hover {
            background-color: #f5f5f5;
          }
        `}
			</style>
		</div>
	);
}
