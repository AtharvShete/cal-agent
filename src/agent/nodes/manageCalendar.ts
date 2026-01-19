import type { AgentStateType } from "../state";
import {
	addEventToCalendar,
	deleteEventFromCalendar,
	listEvents,
	findAvailableSlots,
} from "../tools/calendar";

export async function manageCalendar(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	const { intent, eventDetails } = state;

	// Destructure properties from eventDetails (with default empty object to avoid errors if undefined)
	// Note: We need to handle cases where eventDetails is undefined but intent is valid (though our flow should ensure details are extracted)
	const { title, date, startTime, endTime, duration } = eventDetails || {};

	if (intent === "find_slots") {
		if (!date) {
			return {
				messages: [
					{
						role: "agent",
						text: "What date would you like me to find available times for?",
					},
				],
			};
		}
		const durationMins = duration || 30; // Default to 30 minutes
		const result = await findAvailableSlots(date, durationMins);
		return {
			messages: [
				{
					role: "agent",
					text: result,
				},
			],
		};
	}

	if (intent === "query") {
		if (!date) {
			return {
				messages: [
					{
						role: "agent",
						text: "I need to know the date you are asking about.",
					},
				],
			};
		}
		const result = await listEvents(date);
		return {
			messages: [
				{
					role: "agent",
					text: result,
				},
			],
		};
	}

	if (intent === "cancel") {
		if (!title || !date) {
			return {
				messages: [
					{
						role: "agent",
						text: "I need to know the title and date of the event you want to cancel.",
					},
				],
			};
		}
		const result = await deleteEventFromCalendar(title, date);
		return {
			messages: [
				{
					role: "agent",
					text: result,
				},
			],
		};
	}

	if (intent === "schedule") {
		const missing: string[] = [];
		if (!title) missing.push("title");
		if (!date) missing.push("date");
		if (!startTime) missing.push("start time");

		if (missing.length > 0) {
			return {
				messages: [
					{
						role: "agent",
						text: `I'm missing the ${missing.join(", ")}. Could you provide ${
							missing.length === 1 ? "it" : "them"
						}?`,
					},
				],
			};
		}

		// If endTime is not provided, default to 1 hour after startTime
		let finalEndTime = endTime;
		if (!finalEndTime) {
			// Parse startTime and add 1 hour
			const match = startTime!.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
			if (match) {
				let hours = parseInt(match[1]);
				const minutes = match[2];
				const period = match[3].toUpperCase();

				// Add 1 hour
				hours += 1;
				let newPeriod = period;

				if (hours === 12 && period === "AM") {
					newPeriod = "PM";
				} else if (hours === 12 && period === "PM") {
					newPeriod = "AM"; // Midnight edge case (unlikely for meetings)
				} else if (hours > 12) {
					hours -= 12;
					newPeriod = period === "AM" ? "PM" : "AM";
				}

				finalEndTime = `${hours}:${minutes} ${newPeriod}`;
			} else {
				finalEndTime = startTime!; // Fallback, shouldn't happen
			}
		}

		const result = await addEventToCalendar(
			title!,
			date!,
			startTime!,
			finalEndTime,
		);

		return {
			messages: [
				{
					role: "agent",
					text:
						result === "Event added successfully."
							? `I've scheduled "${title}" on ${date} from ${startTime} to ${finalEndTime}.`
							: `I encountered an issue: ${result}`,
				},
			],
		};
	}

	return {};
}
