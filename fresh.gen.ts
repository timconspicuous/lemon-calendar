// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_fetch_calendar_svg from "./routes/api/fetch-calendar-svg.ts";
import * as $api_fetch_calendar_text from "./routes/api/fetch-calendar-text.ts";
import * as $api_svg_to_png from "./routes/api/svg-to-png.ts";
import * as $index from "./routes/index.tsx";
import * as $FormContainer from "./islands/FormContainer.tsx";
import * as $ResultsDisplay from "./islands/ResultsDisplay.tsx";
import * as $URLInput from "./islands/URLInput.tsx";
import * as $WeekPicker from "./islands/WeekPicker.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
	routes: {
		"./routes/_404.tsx": $_404,
		"./routes/_app.tsx": $_app,
		"./routes/api/fetch-calendar-svg.ts": $api_fetch_calendar_svg,
		"./routes/api/fetch-calendar-text.ts": $api_fetch_calendar_text,
		"./routes/api/svg-to-png.ts": $api_svg_to_png,
		"./routes/index.tsx": $index,
	},
	islands: {
		"./islands/FormContainer.tsx": $FormContainer,
		"./islands/ResultsDisplay.tsx": $ResultsDisplay,
		"./islands/URLInput.tsx": $URLInput,
		"./islands/WeekPicker.tsx": $WeekPicker,
	},
	baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
