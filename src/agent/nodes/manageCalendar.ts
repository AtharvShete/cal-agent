import type { AgentStateType } from "../state";
import {
	addEventToCalendar,
	deleteEventFromCalendar,
	listEvents,
	findAvailableSlots,
	parseTime,
	formatMinutesToTime,
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

		// An explicit end time wins; otherwise honor duration (default one hour).
		let finalEndTime = endTime;
		if (!finalEndTime) {
			const durationMins = duration ?? 60;
			if (!Number.isInteger(durationMins) || durationMins <= 0) {
				return { messages: [{ role: "agent", text: "Please provide a positive whole-number duration in minutes." }] };
			}
			try {
				const endMinutes = parseTime(startTime!) + durationMins;
				if (endMinutes >= 24 * 60) {
					return { messages: [{ role: "agent", text: "Events must start and end on the same day. Please choose an earlier time or shorter duration." }] };
				}
				finalEndTime = formatMinutesToTime(endMinutes);
			} catch (error) {
				return { messages: [{ role: "agent", text: error instanceof Error ? error.message : "Invalid start time." }] };
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
