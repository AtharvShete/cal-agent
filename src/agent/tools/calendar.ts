import fs from "fs/promises";
import path from "path";

const CALENDAR_PATH = path.resolve(process.cwd(), "calendar.txt");

function formatDateForSearch(dateStr: string): string {
	// Input: 2026-01-20
	// Output: Jan 20, 2026
	// We can use basic JS Date (assuming local time or UTC).
	// Note: Parsing YYYY-MM-DD as UTC.
	const parts = dateStr.split("-");
	if (parts.length !== 3) return dateStr;

	const year = parts[0];
	const month = parseInt(parts[1]) - 1;
	const day = parseInt(parts[2]);

	const d = new Date(parseInt(year), month, day);
	const options: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
		year: "numeric",
	};
	return d.toLocaleDateString("en-US", options);
	// This usually outputs "Jan 20, 2026" in en-US
}

export async function addEventToCalendar(
	title: string,
	dateStr: string,
	startTime: string,
	endTime: string,
): Promise<string> {
	try {
		const fileContent = await fs.readFile(CALENDAR_PATH, "utf-8");
		const lines = fileContent.split("\n");
		const newLines: string[] = [];

		// Target format: "Jan 20, 2026"
		const searchDate = formatDateForSearch(dateStr);
		let added = false;

		for (const line of lines) {
			newLines.push(line);
			// Check if this line contains our date
			if (!added && line.includes(searchDate)) {
				// Add the event after this line
				newLines.push(`- ${startTime} - ${endTime}: ${title}`);
				added = true;
			}
		}

		if (!added) {
			return `Could not find date entry for ${searchDate} (derived from ${dateStr}) in calendar.txt.`;
		}

		await fs.writeFile(CALENDAR_PATH, newLines.join("\n"), "utf-8");
		return "Event added successfully.";
	} catch (err: any) {
		return `Error writing calendar: ${err.message}`;
	}
}
