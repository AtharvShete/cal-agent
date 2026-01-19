import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { AgentStateType } from "../state";

let model: ChatGoogleGenerativeAI | null = null;

function getModel() {
	if (!model) {
		const apiKey = process.env.GOOGLE_API_KEY;
		if (!apiKey) {
			throw new Error("Missing GOOGLE_API_KEY");
		}
		model = new ChatGoogleGenerativeAI({
			model: "gemini-flash-latest",
			temperature: 0,
			apiKey,
			apiVersion: "v1beta",
		});
	}
	return model;
}

export async function extractDetails(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	if (!state.userInput) return {};

	const modelInstance = getModel();

	// We'll hardcode a reference date for now or use the system instruction's date if I could access it,
	// but for now I'll just ask it to extract relative or absolute.
	// Actually, the user prompts usually contain specific dates as seen in the example "jan 20th 2026".

	const prompt = `
Extract meeting details from the user's input as JSON.
Fields:
- title (string)
- date (string, YYYY-MM-DD format if possible, or keep as user said)
- startTime (string, HH:mm AM/PM)
- endTime (string, HH:mm AM/PM, inferred 1 hour if not specified)

User Input: "${state.userInput}"

Return ONLY valid JSON.
Example:
{
  "title": "Dentist Appointment",
  "date": "2026-01-20",
  "startTime": "10:00 AM",
  "endTime": "11:00 AM"
}
`;

	const result = await modelInstance.invoke(prompt);
	const content = result.content.toString();

	let eventDetails = {};
	try {
		// clean up markdown blocks if any
		const cleaned = content
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
		eventDetails = JSON.parse(cleaned);
	} catch (e) {
		console.error("Failed to parse JSON details", e);
	}

	return { eventDetails };
}
