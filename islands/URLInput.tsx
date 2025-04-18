import { useEffect } from "preact/hooks";
import LocalStorageInput from "./LocalStorageInput.tsx";

interface URLInputProps {
	value: string;
	onChange: (url: string) => void;
	onError?: (error: string | null) => void;
}

export default function URLInput({ value, onChange, onError }: URLInputProps) {
	// Handle URL validation
	useEffect(() => {
		if (onError) {
			if (value && !value.match(/^(https?:\/\/|webcal:\/\/)/i)) {
				onError("URL must begin with https://, http://, or webcal://");
			} else {
				onError(null);
			}
		}
	}, [value, onError]);

	return (
		<LocalStorageInput
			id="url-input"
			label="Enter iCalendar URL:"
			value={value}
			onChange={onChange}
			placeholder="https://, http://, or webcal://"
			storageKey="calendarUrlCurrent"
			historyStorageKey="calendarUrlHistory"
			maxHistoryItems={10}
			className="url-input-wrapper"
		/>
	);
}
