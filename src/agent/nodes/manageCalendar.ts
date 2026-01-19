import type { AgentStateType } from "../state";
import { addEventToCalendar } from "../tools/calendar";

export async function manageCalendar(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	const { intent, eventDetails } = state;

	if (intent !== "schedule" || !eventDetails) {
		return {};
	}

	const { title, date, startTime, endTime } = eventDetails;

	if (!title || !date || !startTime || !endTime) {
		return {
			messages: [
				{
					role: "agent",
					text: "I missed some details. Could you please provide the title, date, and time?",
				},
			],
		};
	}

	const result = await addEventToCalendar(title, date, startTime, endTime);

	return {
		messages: [
			{
				role: "agent",
				text:
					result === "Event added successfully."
						? `I've scheduled "${title}" on ${date} from ${startTime} to ${endTime}.`
						: `I encountered an issue: ${result}`,
			},
		],
	};
}
