import { useState } from "react";
import { Box, Text, useApp } from "ink";
import { v4 as uuidv4 } from "uuid";
import ChatView from "./ChatView";
import InputBox from "./InputBox";
import { UIMessage } from "./types";
import { runAgent } from "../runAgent";

const makeThreadId = () => `sched_${uuidv4().slice(0, 6)}`;

interface AppProps {
    initialThreadId?: string;
}

export default function App({ initialThreadId }: AppProps) {
    const [threadId] = useState(() => initialThreadId || makeThreadId());
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [thinking, setThinking] = useState(false);
    const [isResume] = useState(!!initialThreadId);
    const { exit } = useApp();


    const handleSubmit = async (text: string) => {
        const trimmed = text.trim();

        if (!trimmed) return;

        // Exit command
        if (trimmed === "/exit") {
            setMessages((m) => [
                ...m,
                { role: "agent", text: "Goodbye. Session ended." }
            ]);
            setTimeout(() => exit(), 300);
            return;
        }

        // Show user message immediately
        setMessages((m) => [...m, { role: "user", text: trimmed }]);
        setThinking(true);

        try {
            const result = await runAgent(threadId, trimmed);

            setMessages((m) => [
                ...m,
                { role: "agent", text: result.response }
            ]);
        } catch (err) {
            console.error("Agent error:", err);
            setMessages((m) => [
                ...m,
                {
                    role: "agent",
                    text: "Something went wrong talking to the agent."
                }
            ]);
        } finally {
            setThinking(false);
        }
    };



    return (
        <Box flexDirection="column" padding={1}>
            <Text color="green">Meeting Scheduler Agent</Text>
            <Text dimColor>Session: {threadId}{isResume ? " (resumed)" : ""}</Text>

            <ChatView messages={messages} />

            {thinking && <Text dimColor>Thinking...</Text>}

            <Box marginTop={1}>
                <InputBox onSubmit={handleSubmit} disabled={thinking} />
            </Box>
        </Box>
    );
}
