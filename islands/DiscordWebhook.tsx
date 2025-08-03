import { useState } from "preact/hooks";
import LocalStorageInput from "./LocalStorageInput.tsx";

interface ICalEvent {
	start: Date;
	end: Date;
	summary?: string;
	location?: string;
	description?: string;
	timezone?: string;
}

interface DiscordWebhookProps {
	svgData: string | null;
	events: ICalEvent[] | null;
}

export default function DiscordWebhook({ svgData, events }: DiscordWebhookProps) {
	const [webhookUrl, setWebhookUrl] = useState<string>("");
	const [urlError, setUrlError] = useState<string | null>(null);
	const [showComposer, setShowComposer] = useState<boolean>(false);
	const [messageContent, setMessageContent] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitStatus, setSubmitStatus] = useState<string | null>(null);

	const isValidDiscordWebhook = (url: string): boolean => {
		return url.includes("discord.com/api/webhooks/") || url.includes("discordapp.com/api/webhooks/");
	};

	const generateEmbedFields = () => {
		if (!events || events.length === 0) return [];

		// Group events by location
		const eventsByLocation: { [key: string]: ICalEvent[] } = {};
		
		events.forEach(event => {
			const location = event.location?.toLowerCase() || "other";
			if (!eventsByLocation[location]) {
				eventsByLocation[location] = [];
			}
			eventsByLocation[location].push(event);
		});

		// Create fields array with custom ordering
		const fields = [];
		const locations = Object.keys(eventsByLocation);
		
		// Add "twitch" first if it exists
		if (eventsByLocation["twitch"]) {
			const eventsText = eventsByLocation["twitch"]
				.map(event => {
					const unixTimestamp = Math.floor(new Date(event.start).getTime() / 1000);
					const summary = event.summary || "Untitled Event";
					const description = event.description ? ` | ${event.description}` : "";
					return `<t:${unixTimestamp}:F> ${summary}${description}`;
				})
				.join("\n");
			
			fields.push({
				name: "***twitch streams***",
				value: eventsText.length > 1024 ? eventsText.substring(0, 1021) + "..." : eventsText,
				inline: false
			});
		}

		// Add other locations (except "twitch" and "other")
		locations
			.filter(location => location !== "twitch" && location !== "other")
			.forEach(location => {
				const eventsText = eventsByLocation[location]
					.map(event => {
						const unixTimestamp = Math.floor(new Date(event.start).getTime() / 1000);
						const summary = event.summary || "Untitled Event";
						const description = event.description ? ` | ${event.description}` : "";
						return `<t:${unixTimestamp}:F> ${summary}${description}`;
					})
					.join("\n");
				
				fields.push({
					name: `***${location}***`,
					value: eventsText.length > 1024 ? eventsText.substring(0, 1021) + "..." : eventsText,
					inline: false
				});
			});

		// Add "other" last if it exists
		if (eventsByLocation["other"]) {
			const eventsText = eventsByLocation["other"]
				.map(event => {
					const unixTimestamp = Math.floor(new Date(event.start).getTime() / 1000);
					const summary = event.summary || "Untitled Event";
					const description = event.description ? ` | ${event.description}` : "";
					return `<t:${unixTimestamp}:F> ${summary}${description}`;
				})
				.join("\n");
			
			fields.push({
				name: "***other***",
				value: eventsText.length > 1024 ? eventsText.substring(0, 1021) + "..." : eventsText,
				inline: false
			});
		}

		return fields;
	};

	const handleUrlChange = (url: string) => {
		setWebhookUrl(url);
		
		// Validate Discord webhook URL
		if (url && !url.match(/^https?:\/\//i)) {
			setUrlError("URL must begin with https:// or http://");
		} else if (url && !isValidDiscordWebhook(url)) {
			setUrlError("URL must be a valid Discord webhook URL");
		} else {
			setUrlError(null);
		}
	};

	const handlePostClick = () => {
		if (!webhookUrl || urlError || !svgData) return;
		setShowComposer(true);
		setMessageContent("");
		setSubmitStatus(null);
	};

	const handleCloseComposer = () => {
		setShowComposer(false);
		setMessageContent("");
		setSubmitStatus(null);
	};

	const handleSubmit = async (e: Event) => {
		e.preventDefault();
		if (!svgData || !webhookUrl) return;

		setIsSubmitting(true);
		setSubmitStatus(null);

		try {
			// First, convert SVG to PNG
			const svgResponse = await fetch("/api/svg-to-png", {
				method: "POST",
				body: svgData,
				headers: {
					"Content-Type": "image/svg+xml",
				},
			});

			if (!svgResponse.ok) {
				throw new Error("Failed to convert SVG to PNG");
			}

			const pngBlob = await svgResponse.blob();
			
			// Create FormData for Discord webhook
			const formData = new FormData();
			
			// Add the message payload
			const payload = {
				content: messageContent.trim() || undefined, // Only include content if not empty
				embeds: [{
					title: "weekly schedule",
					color: 0x406435,
					image: {
						url: "attachment://schedule.png"
					},
					fields: generateEmbedFields(),
					//timestamp: new Date().toISOString()
				}]
			};
			
			formData.append("payload_json", JSON.stringify(payload));
			formData.append("file", pngBlob, "schedule.png");

			// Send to Discord webhook
			const webhookResponse = await fetch(webhookUrl, {
				method: "POST",
				body: formData,
			});

			if (!webhookResponse.ok) {
				const errorText = await webhookResponse.text();
				throw new Error(`Discord webhook failed: ${errorText}`);
			}

			setSubmitStatus("Message sent successfully!");
			setTimeout(() => {
				handleCloseComposer();
			}, 1500);

		} catch (error) {
			console.error("Error sending to Discord:", error);
			setSubmitStatus(`Failed to send: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const canPost = webhookUrl && !urlError && svgData;

	return (
		<div className="discord-webhook-container">
			<h3>Post to Discord</h3>
			
			<LocalStorageInput
				id="discord-webhook-input"
				label="Discord Webhook URL:"
				value={webhookUrl}
				onChange={handleUrlChange}
				placeholder="https://discord.com/api/webhooks/..."
				storageKey="discordWebhookUrlCurrent"
				historyStorageKey="discordWebhookUrlHistory"
				maxHistoryItems={5}
				className="discord-webhook-input-wrapper"
			/>
			
			{urlError && (
				<p className="error-message">{urlError}</p>
			)}
			
			<button
				onClick={handlePostClick}
				className="post-button"
				disabled={!canPost}
				title={!svgData ? "No schedule data available" : !webhookUrl ? "Enter Discord webhook URL" : ""}
			>
				Post to Discord Webhook
			</button>

			{showComposer && (
				<div className="composer-overlay">
					<div className="composer-modal">
						<div className="composer-header">
							<h4>Compose Discord Message</h4>
							<button
								type="button"
								className="close-button"
								onClick={handleCloseComposer}
								disabled={isSubmitting}
							>
								✕
							</button>
						</div>
						
						<form onSubmit={handleSubmit} className="composer-form">
							<div className="input-group">
								<label htmlFor="message-content">Message:</label>
								<textarea
									id="message-content"
									value={messageContent}
									onInput={(e) => setMessageContent((e.target as HTMLTextAreaElement).value)}
									placeholder="Enter your message content... (optional)"
									className="message-textarea"
									rows={4}
									maxLength={2000}
									disabled={isSubmitting}
								/>
								<div className="character-count">
									{messageContent.length}/2000
								</div>
							</div>
							
							{submitStatus && (
								<div className={`status-message ${submitStatus.includes("success") ? "success" : "error"}`}>
									{submitStatus}
								</div>
							)}
							
							<div className="composer-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={handleCloseComposer}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="submit-button"
									disabled={isSubmitting}
								>
									{isSubmitting ? "Sending..." : "Submit"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<style>
				{`
				.discord-webhook-container {
					margin-top: 20px;
					padding: 15px;
					border: 1px solid #e0e0e0;
					border-radius: 4px;
					background-color: #f5f5f5;
				}
				
				.error-message {
					color: #d32f2f;
					font-size: 14px;
					margin: 5px 0;
				}
				
				.post-button {
					margin-top: 10px;
					padding: 10px 16px;
					background-color: #5865F2;
					color: white;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 14px;
					font-weight: 500;
					transition: background-color 0.2s;
				}
				
				.post-button:hover:not(:disabled) {
					background-color: #4752C4;
				}
				
				.post-button:disabled {
					background-color: #cccccc;
					cursor: not-allowed;
				}
				
				.composer-overlay {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background-color: rgba(0, 0, 0, 0.5);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 1000;
				}
				
				.composer-modal {
					background: white;
					border-radius: 8px;
					width: 90%;
					max-width: 500px;
					max-height: 80vh;
					overflow: hidden;
					box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
				}
				
				.composer-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16px 20px;
					border-bottom: 1px solid #e0e0e0;
					background-color: #f8f9fa;
				}
				
				.composer-header h4 {
					margin: 0;
					color: #333;
				}
				
				.close-button {
					background: none;
					border: none;
					font-size: 18px;
					cursor: pointer;
					padding: 4px;
					color: #666;
					border-radius: 4px;
					transition: background-color 0.2s;
				}
				
				.close-button:hover:not(:disabled) {
					background-color: #e0e0e0;
				}
				
				.close-button:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
				
				.composer-form {
					padding: 20px;
				}
				
				.input-group {
					margin-bottom: 16px;
				}
				
				.input-group label {
					display: block;
					margin-bottom: 6px;
					font-weight: 500;
					color: #333;
				}
				
				.message-textarea {
					width: 100%;
					padding: 10px;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-family: inherit;
					font-size: 14px;
					resize: vertical;
					min-height: 80px;
					box-sizing: border-box;
				}
				
				.message-textarea:focus {
					outline: none;
					border-color: #5865F2;
					box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
				}
				
				.message-textarea:disabled {
					background-color: #f5f5f5;
					cursor: not-allowed;
				}
				
				.character-count {
					font-size: 12px;
					color: #666;
					text-align: right;
					margin-top: 4px;
				}
				
				.status-message {
					padding: 8px 12px;
					border-radius: 4px;
					margin-bottom: 16px;
					font-size: 14px;
				}
				
				.status-message.success {
					background-color: #d4edda;
					color: #155724;
					border: 1px solid #c3e6cb;
				}
				
				.status-message.error {
					background-color: #f8d7da;
					color: #721c24;
					border: 1px solid #f5c6cb;
				}
				
				.composer-actions {
					display: flex;
					gap: 10px;
					justify-content: flex-end;
				}
				
				.cancel-button, .submit-button {
					padding: 8px 16px;
					border: none;
					border-radius: 4px;
					cursor: pointer;
					font-size: 14px;
					font-weight: 500;
					transition: background-color 0.2s;
				}
				
				.cancel-button {
					background-color: #6c757d;
					color: white;
				}
				
				.cancel-button:hover:not(:disabled) {
					background-color: #5a6268;
				}
				
				.submit-button {
					background-color: #5865F2;
					color: white;
				}
				
				.submit-button:hover:not(:disabled) {
					background-color: #4752C4;
				}
				
				.cancel-button:disabled, .submit-button:disabled {
					background-color: #cccccc;
					cursor: not-allowed;
				}
				`}
			</style>
		</div>
	);
}