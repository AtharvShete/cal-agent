import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { AgentStateType, Intent } from "../state";

let model: ChatGoogleGenerativeAI | null = null;

function getModel() {
	if (!model) {
		const apiKey = process.env.GOOGLE_API_KEY;
		if (!apiKey) {
			throw new Error(
				"Missing GOOGLE_API_KEY environment variable for Gemini.",
			);
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

export async function parseIntent(
	state: AgentStateType,
): Promise<Partial<AgentStateType>> {
	if (!state.userInput) return {};

	const modelInstance = getModel();

	const prompt = `
Classify the user's intent into one of:
- schedule
- cancel
- query
- unknown

User message:
"${state.userInput}"

Respond with only the label.
`;

	const result = await modelInstance.invoke(prompt);

	const raw = result.content.toString().trim().toLowerCase();

	const intent: Intent =
		raw === "schedule" || raw === "cancel" || raw === "query" ? raw : "unknown";

	return { intent };
}
