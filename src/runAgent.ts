import { loadState, saveState } from "./db/checkpoint.js";
import { AgentState } from "./agent/state.js";

function createInitialState(threadId: string): AgentState {
	return {
		threadId,
		messages: [],
	};
}

export async function runAgent(threadId: string, input: string) {
	let state = await loadState(threadId);

	if (!state) {
		state = createInitialState(threadId);
	}

	state.userInput = input;
	state.messages.push({ role: "user", text: input });

	// Placeholder for LangGraph
	const agentReply = "State saved. LangGraph coming next.";

	state.messages.push({ role: "agent", text: agentReply });

	await saveState(threadId, state);

	return {
		response: agentReply,
		state,
	};
}
