import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface URLInputProps {
	value: string;
	onChange: (url: string) => void;
	onError?: (error: string | null) => void;
}

export default function URLInput({ value, onChange, onError }: URLInputProps) {
	const [urlHistory, setUrlHistory] = useState<string[]>([]);
	const [showUrlHistory, setShowUrlHistory] = useState<boolean>(false);
	const urlInputRef = useRef<HTMLInputElement>(null);
	const urlDropdownRef = useRef<HTMLDivElement>(null);

	// Load URL history from localStorage on component mount
	useEffect(() => {
		if (IS_BROWSER) {
			const storedUrls = localStorage.getItem("calendarUrlHistory");
			if (storedUrls) {
				setUrlHistory(JSON.parse(storedUrls));
			}
		}
	}, []);

	// Add click outside listener to close dropdown
	useEffect(() => {
		if (IS_BROWSER && showUrlHistory) {
			const handleClickOutside = (event: MouseEvent) => {
				if (
					urlDropdownRef.current &&
					!urlDropdownRef.current.contains(event.target as Node) &&
					urlInputRef.current &&
					!urlInputRef.current.contains(event.target as Node)
				) {
					setShowUrlHistory(false);
				}
			};

			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}
	}, [showUrlHistory]);

	// Handle URL input changes
	const handleUrlChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		onChange(target.value);
		if (onError) onError(null);
	};

	// Handle URL input focus
	const handleUrlFocus = () => {
		setShowUrlHistory(true);
	};

	// Handle URL selection from history
	const selectUrl = (selectedUrl: string) => {
		onChange(selectedUrl);
		setShowUrlHistory(false);
		// Focus the input after selection
		if (urlInputRef.current) {
			urlInputRef.current.focus();
		}
	};

	return (
		<div className="url-input-container">
			<label htmlFor="url-input">Enter iCalendar URL:</label>
			<input
				id="url-input"
				type="text"
				value={value}
				onInput={handleUrlChange}
				onFocus={handleUrlFocus}
				placeholder="https://example.com"
				className="url-input"
				ref={urlInputRef}
			/>

			{showUrlHistory && urlHistory.length > 0 && (
				<div className="url-history-dropdown" ref={urlDropdownRef}>
					{urlHistory.map((historyUrl, index) => (
						<div
							key={index}
							className="url-history-item"
							onClick={() => selectUrl(historyUrl)}
						>
							{historyUrl}
						</div>
					))}
				</div>
			)}

			<style>
				{`
          .url-input-container {
            position: relative;
          }
          
          .url-input {
            width: 100%;
            padding: 8px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          
          .url-history-dropdown {
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
          
          .url-history-item {
            padding: 8px 12px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .url-history-item:hover {
            background-color: #f5f5f5;
          }
        `}
			</style>
		</div>
	);
}
