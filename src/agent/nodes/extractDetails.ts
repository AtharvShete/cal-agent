import { ChatGroq } from "@langchain/groq";
import type { AgentStateType } from "../state";

let model: ChatGroq | null = null;

function getModel() {
	if (!model) {
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			throw new Error("Missing GROQ_API_KEY");
		}
		model = new ChatGroq({
			model: "llama-3.3-70b-versatile",
			temperature: 0,
			apiKey,
		});
	}
	return model;
}

export async function extractDetails(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	if (!state.userInput) return {};

	const modelInstance = getModel();

	const recentHistory = state.messages
		.slice(-5)
		.map((m) => `${m.role.toUpperCase()}: ${m.text}`)
		.join("\n");

	// Build intent-aware prompt
	const isQuery = state.intent === "query";

	// Get current date dynamically
	const today = new Date();
	const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const tomorrowStr = tomorrow.toISOString().split("T")[0];

	const prompt = `
Extract event details from the conversation. Return ONLY a JSON object, no explanations.

Current Date: ${todayStr} (today)
User Intent: ${state.intent}

Rules:
- "today" = ${todayStr}
- "tomorrow" = ${tomorrowStr}
- If user says "that" or "this event", look at conversation history to find the event name
- For QUERY intent: you mainly need the date field
- For CANCEL intent: you need title and date
- For SCHEDULE intent: you need title, date, startTime
- For FIND_SLOTS intent: you need date and duration (in minutes)
- Extract duration from phrases like "30 minute meeting" → 30, "1 hour call" → 60, "2 hours" → 120

Conversation History:
${recentHistory}

User Input: "${state.userInput}"

Return JSON with these fields (use null for unknown):
{
  "title": "event name or null",
  "date": "YYYY-MM-DD or null",
  "startTime": "H:MM AM/PM or null",
  "endTime": "H:MM AM/PM or null",
  "duration": number in minutes or null (e.g., 30 for 30 minutes, 60 for 1 hour)
}
`;

	const result = await modelInstance.invoke(prompt);
	const content = result.content.toString();

	let eventDetails: any = {};
	try {
		// Try to extract JSON from the response
		// First, try to find JSON object pattern
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const cleaned = jsonMatch[0]
				.replace(/```json/g, "")
				.replace(/```/g, "")
				.trim();
			eventDetails = JSON.parse(cleaned);
		} else {
			// Fallback: try parsing the whole thing
			const cleaned = content
				.replace(/```json/g, "")
				.replace(/```/g, "")
				.trim();
			eventDetails = JSON.parse(cleaned);
		}
	} catch (e) {
		console.error("Failed to parse JSON details:", content);
		// Return empty details so the agent can ask for clarification
	}

	return { eventDetails };
}
