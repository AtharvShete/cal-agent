import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { parseIntent } from "./nodes/parseIntent";
import { extractDetails } from "./nodes/extractDetails";
import { manageCalendar } from "./nodes/manageCalendar";
import { respond } from "./nodes/respond";

function routeIntent(state: typeof AgentState.State) {
	if (
		state.intent === "schedule" ||
		state.intent === "cancel" ||
		state.intent === "query"
	) {
		return "extractDetails";
	}
	return "respond";
}

export function buildGraph() {
	const graph = new StateGraph(AgentState)
		.addNode("parseIntent", parseIntent)
		.addNode("extractDetails", extractDetails)
		.addNode("manageCalendar", manageCalendar)
		.addNode("respond", respond)
		.addEdge(START, "parseIntent")
		.addConditionalEdges("parseIntent", routeIntent)
		.addEdge("extractDetails", "manageCalendar")
		.addEdge("manageCalendar", END)
		.addEdge("respond", END);

	return graph.compile();
}
