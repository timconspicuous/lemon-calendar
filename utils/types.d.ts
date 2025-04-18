interface ICalEvent {
	start: Date;
	end: Date;
	summary?: string;
	location?: string;
	description?: string;
	timezone?: string;
}