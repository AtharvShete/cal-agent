import fs from "fs/promises";
import path from "path";

const CALENDAR_PATH = path.resolve(process.cwd(), "calendar.txt");

function formatDateForSearch(dateStr: string): string {
	// Input: 2026-01-20
	// Output: Jan 20, 2026
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
}

function parseTime(timeStr: string): number {
	const [time, period] = timeStr.trim().split(/\s+/);
	const timeParts = time.split(":").map(Number);
	let hours = timeParts[0];
	const minutes = timeParts[1] || 0;

	if (isNaN(hours) || isNaN(minutes)) {
		throw new Error(`Invalid time format: ${timeStr}`);
	}

	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new Error(`Time out of range: ${timeStr}`);
	}

	if (!period) {
		// Assume 24-hour if no period, but usually input is AM/PM.
		// If hours > 12 without period, it's 24h.
		return hours * 60 + minutes;
	}

	const isPM = period.toLowerCase() === "pm";
	const isAM = period.toLowerCase() === "am";

	if (isPM && hours !== 12 && hours < 12) hours += 12;
	if (isAM && hours === 12) hours = 0;

	return hours * 60 + minutes;
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

		// Target format for searching: "Jan 20, 2026"

		const searchDate = formatDateForSearch(dateStr);

		let newStart, newEnd;
		try {
			newStart = parseTime(startTime);
			newEnd = parseTime(endTime);
		} catch (e: any) {
			return e.message;
		}

		if (newStart >= newEnd) {
			return `Invalid time range: ${startTime} to ${endTime}.`;
		}

		let dateFoundIndex = -1;

		// 1. Find the date header
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes(searchDate)) {
				dateFoundIndex = i;
				break;
			}
		}

		// If date not found, create a new date section at the end
		if (dateFoundIndex === -1) {
			// Generate day name from date
			const parts = dateStr.split("-");
			const dateObj = new Date(
				parseInt(parts[0]),
				parseInt(parts[1]) - 1,
				parseInt(parts[2]),
			);
			const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

			// Add new date section at end of file
			const newLines = [...lines];
			// Remove trailing empty lines
			while (
				newLines.length > 0 &&
				newLines[newLines.length - 1].trim() === ""
			) {
				newLines.pop();
			}
			// Add new date header and event
			newLines.push("");
			newLines.push(`${dayName} ${searchDate}`);
			newLines.push(`- ${startTime} - ${endTime}: ${title}`);
			newLines.push("");

			await fs.writeFile(CALENDAR_PATH, newLines.join("\n"), "utf-8");
			return "Event added successfully.";
		}

		// 2. Scan for conflicts in the following lines until we hit an empty line or end format
		// Assumes events are bullet points like "- 9:00 AM - 10:00 AM: Title"
		for (let j = dateFoundIndex + 1; j < lines.length; j++) {
			const line = lines[j].trim();
			if (!line) break; // Empty line signals end of day section usually
			if (!line.startsWith("-")) break; // If it doesn't start with dash, maybe end of events

			// Parse existing event line
			// Format: "- 9:00 AM - 10:00 AM: Team Standup"
			const content = line.replace(/^- /, "");
			const parts = content.split(" - ");

			// We expect at least two parts: StartTime and EndTime+Title
			if (parts.length >= 2) {
				const existingStartStr = parts[0];

				// Reconstruct the rest in case the title had " - "
				const rest = parts.slice(1).join(" - ");

				// Split by ": " to separate time from title
				const timeTitleSplit = rest.split(": ");

				if (timeTitleSplit.length >= 2) {
					const existingEndStr = timeTitleSplit[0];
					let existingStart, existingEnd;
					try {
						existingStart = parseTime(existingStartStr);
						existingEnd = parseTime(existingEndStr);
					} catch (e) {
						// Ignore malformed lines in calendar file
						continue;
					}

					// Check overlap: (StartA < EndB) && (EndA > StartB)
					if (newStart < existingEnd && newEnd > existingStart) {
						return `Conflict detected. There is already an event "${line}" during this time.`;
					}
				}
			}
		}

		// 3. No conflict, insert the new event
		const newLines = [...lines];
		// We insert after the date line, but we can append to the list of events for that date.
		// Let's find where to insert. We can insert right after the date found index if we want,
		// or at the end of the block.
		// To keep it simple and consistent with previous logic, let's find the last event of that day and append after it,
		// or just append right after the header if no events exist yet?
		// Actually, appending right after the date header is easiest for "adding",
		// but visually it might be nice to be sorted.
		// The original code was:
		// if (!added && line.includes(searchDate)) { newLines.push(`- ${startTime} - ${endTime}: ${title}`); ... }
		// This implies it added it *immediately after* the date line (which pushes existing events down).

		// Let's insert immediately after the date line (dateFoundIndex).
		newLines.splice(
			dateFoundIndex + 1,
			0,
			`- ${startTime} - ${endTime}: ${title}`,
		);

		await fs.writeFile(CALENDAR_PATH, newLines.join("\n"), "utf-8");
		return "Event added successfully.";
	} catch (err: any) {
		return `Error writing calendar: ${err.message}`;
	}
}

export async function deleteEventFromCalendar(
	title: string,
	dateStr: string,
): Promise<string> {
	try {
		const fileContent = await fs.readFile(CALENDAR_PATH, "utf-8");
		const lines = fileContent.split("\n");
		const searchDate = formatDateForSearch(dateStr);
		const newLines: string[] = [];
		let dateFound = false;
		let eventDeleted = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Detect Date Header
			if (line.includes(searchDate)) {
				dateFound = true;
				newLines.push(line);
				continue;
			}

			if (dateFound) {
				// If we hit an empty line, we might be done with this day.
				if (line.trim() === "") {
					dateFound = false;
				} else if (line.trim().startsWith("-")) {
					// Check if this event matches the title
					if (
						!eventDeleted &&
						line.toLowerCase().includes(title.toLowerCase())
					) {
						// Found it! Skip adding this line to newLines
						eventDeleted = true;
						continue;
					}
				}
			}

			newLines.push(line);
		}

		if (!eventDeleted) {
			return `Could not find event "${title}" on ${searchDate}.`;
		}

		await fs.writeFile(CALENDAR_PATH, newLines.join("\n"), "utf-8");
		return `Removed event "${title}" on ${searchDate}.`;
	} catch (err: any) {
		return `Error deleting event: ${err.message}`;
	}
}

export async function listEvents(dateStr: string): Promise<string> {
	try {
		const fileContent = await fs.readFile(CALENDAR_PATH, "utf-8");
		const lines = fileContent.split("\n");
		const searchDate = formatDateForSearch(dateStr);

		const events: string[] = [];
		let dateFound = false;

		for (const line of lines) {
			if (line.includes(searchDate)) {
				dateFound = true;
				continue;
			}

			if (dateFound) {
				if (line.trim() === "") break; // End of section
				if (line.trim().startsWith("-")) {
					events.push(line.trim());
				}
			}
		}

		if (!dateFound) {
			return `No entry found for ${searchDate}.`;
		}

		if (events.length === 0) {
			return `No events scheduled for ${searchDate}.`;
		}

		return `Events for ${searchDate}:\n${events.join("\n")}`;
	} catch (err: any) {
		return `Error listing events: ${err.message}`;
	}
}
