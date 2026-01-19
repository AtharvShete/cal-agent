import type { AgentStateType } from "../state";

export async function respond(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	let text = "";

	switch (state.intent) {
		case "schedule":
			text =
				"I understand you want to schedule a meeting. I’ll start checking your calendar next.";
			break;
		case "cancel":
			text = "I can help cancel meetings, but that flow isn’t wired yet.";
			break;
		case "query":
			text = "I can help answer questions about your calendar soon.";
			break;
		default:
			text =
				"I’m not quite sure what you want to do. Try asking to schedule a meeting.";
	}

	return {
		messages: [
			{
				role: "agent",
				text,
			},
		],
	};
}
