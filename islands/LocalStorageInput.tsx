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
	defaultValue?: string; // Optional default value
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
	defaultValue,
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

	// Delete item from history
	const deleteItem = (itemToDelete: string, e: Event) => {
		e.stopPropagation(); // Prevent click from bubbling to parent (which would select the item)

		const newHistory = history.filter((item) => item !== itemToDelete);
		setHistory(newHistory);

		// Save updated history to localStorage
		if (IS_BROWSER) {
			localStorage.setItem(historyStorageKey, JSON.stringify(newHistory));
		}
	};

	// Reset to default value
	const resetToDefault = () => {
		if (!defaultValue) return;

		// Set input value to default
		onChange(defaultValue);

		// Remove saved value from localStorage to ensure default is used on next load
		if (IS_BROWSER) {
			localStorage.removeItem(storageKey);
		}

		// Focus the input after reset
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	return (
		<div className={`local-storage-input-container ${className}`}>
			<form onSubmit={handleSubmit}>
				<div className="label-with-reset">
					<label htmlFor={id}>{label}</label>
					{defaultValue && (
						<button
							type="button"
							className="reset-button"
							onClick={resetToDefault}
							title="Reset to default value"
						>
							Reset to Default
						</button>
					)}
				</div>

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
							>
								<span
									className="history-item-text"
									onClick={() => selectItem(historyItem)}
								>
									{historyItem}
								</span>
								<button
									type="button"
									className="delete-button"
									onClick={(e) =>
										deleteItem(historyItem, e)}
									aria-label={`Delete ${historyItem}`}
									title="Delete from history"
								>
									🗑️
								</button>
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
          
          .label-with-reset {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          
          .reset-button {
            background: none;
            border: none;
            color: #1976d2;
            font-size: 14px;
            cursor: pointer;
            padding: 0;
            text-decoration: underline;
          }
          
          .reset-button:hover {
            color: #1565c0;
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
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            cursor: pointer;
          }
          
          .history-item:hover {
            background-color: #f5f5f5;
          }
          
          .history-item-text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .delete-button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 0 0 0 8px;
            opacity: 0.7;
            transition: opacity 0.2s;
            line-height: 1;
          }
          
          .delete-button:hover {
            opacity: 1;
          }
        `}
			</style>
		</div>
	);
}
