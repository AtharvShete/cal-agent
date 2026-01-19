export interface AgentState {
	threadId: string;
	userInput?: string;
	messages: {
		role: "user" | "agent";
		text: string;
	}[];
}
