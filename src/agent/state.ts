import { StateSchema, MessagesValue, ReducedValue } from "@langchain/langgraph";
import * as z from "zod";

export type Intent = "schedule" | "cancel" | "query" | "find_slots" | "unknown";

export const AgentState = new StateSchema({
	threadId: z.string(),
	userInput: z.string().optional(),
	intent: z
		.enum(["schedule", "cancel", "query", "find_slots", "unknown"])
		.optional(),
	eventDetails: z
		.object({
			title: z.string().optional().nullable(),
			date: z.string().optional().nullable(),
			startTime: z.string().optional().nullable(),
			endTime: z.string().optional().nullable(),
			duration: z.number().optional().nullable(), // Duration in minutes
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

// Define the interface explicitly for better type safety
export interface EventDetails {
	title?: string | null;
	date?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	duration?: number | null;
}

export interface AgentStateType {
	threadId: string;
	userInput?: string;
	intent?: Intent;
	eventDetails?: EventDetails;
	messages: Array<{ role: "user" | "agent"; text: string }>;
}
