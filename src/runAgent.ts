import { loadState, saveState } from "./db/checkpoint";
import { AgentState, AgentStateType } from "./agent/state";
import { buildGraph } from "./agent/graph";

const graph = buildGraph();

function createInitialState(threadId: string): AgentStateType {
	return {
		threadId,
		messages: [],
		userInput: "",
		intent: undefined,
	};
}

export async function runAgent(threadId: string, input: string) {
	let state = (await loadState(threadId)) as AgentStateType | null;

	if (!state) {
		state = createInitialState(threadId);
	}

	state.userInput = input;

	const inputState = {
		...state,
		messages: [...state.messages, { role: "user", text: input }],
	};

	const finalState = await graph.invoke(inputState);

	await saveState(threadId, finalState as AgentStateType);

	const lastMessage = (finalState as AgentStateType).messages[
		(finalState as AgentStateType).messages.length - 1
	];

	return {
		response: lastMessage.text,
		state: finalState,
	};
}
