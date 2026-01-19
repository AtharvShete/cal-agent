import { ChatGroq } from "@langchain/groq";
import type { AgentStateType, Intent } from "../state";

let model: ChatGroq | null = null;

function getModel() {
	if (!model) {
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			throw new Error("Missing GROQ_API_KEY environment variable.");
		}

		model = new ChatGroq({
			model: "llama-3.3-70b-versatile",
			temperature: 0,
			apiKey,
		});
	}
	return model;
}

export async function parseIntent(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	if (!state.userInput) return {};

	const modelInstance = getModel();

	const recentHistory = state.messages
		.slice(-5)
		.map((m) => `${m.role.toUpperCase()}: ${m.text}`)
		.join("\n");

	const prompt = `
Classify the user's intent into one of:
- schedule (user wants to add/create a meeting with specific time)
- cancel (user wants to remove/delete an event)
- query (user wants to see what's scheduled)
- find_slots (user wants to find available times or asks "when can I meet" without specifying time)
- unknown

Examples:
- "Schedule a meeting at 3pm" → schedule
- "When can I meet with John on Monday?" → find_slots
- "Find available times for a 30 minute meeting" → find_slots
- "What do I have today?" → query
- "Cancel the standup" → cancel

History:
${recentHistory}

User message:
"${state.userInput}"

Respond with only the label.
`;

	const result = await modelInstance.invoke(prompt);

	const raw = result.content.toString().trim().toLowerCase();

	const intent: Intent =
		raw === "schedule" ||
		raw === "cancel" ||
		raw === "query" ||
		raw === "find_slots"
			? raw
			: "unknown";

	return { intent };
}
