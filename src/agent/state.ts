import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";
import * as z from "zod";

export type Intent = "schedule" | "cancel" | "query" | "unknown";

export const AgentState = new StateSchema({
	threadId: z.string(),
	userInput: z.string().optional(),
	intent: z.enum(["schedule", "cancel", "query", "unknown"]).optional(),
	eventDetails: z
		.object({
			title: z.string().optional(),
			date: z.string().optional(),
			startTime: z.string().optional(),
			endTime: z.string().optional(),
		})
		.optional(),
	messages: new ReducedValue(
		z
			.array(
				z.object({
					role: z.enum(["user", "agent"]),
					text: z.string(),
				}),
			)
			.default(() => []),
		{
			inputSchema: z.array(
				z.object({
					role: z.enum(["user", "agent"]),
					text: z.string(),
				}),
			),
			reducer: (current, update) => [...current, ...update],
		},
	),
});

export type AgentStateType = typeof AgentState.State;
