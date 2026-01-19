import { useState } from "react";
import { Box, Text, useApp } from "ink";
import { v4 as uuidv4 } from "uuid";
import ChatView from "./ChatView.js";
import InputBox from "./InputBox.js";
import { UIMessage } from "./types.js";

const makeThreadId = () => `sched_${uuidv4().slice(0, 6)}`;

export default function App() {
    const [threadId] = useState(makeThreadId);
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [thinking, setThinking] = useState(false);
    const { exit } = useApp();


    const handleSubmit = async (text: string) => {
        const trimmed = text.trim();

        if (trimmed === "/exit") {
            setMessages((m) => [
                ...m,
                { role: "agent", text: "Goodbye. Session ended." }
            ]);

            setTimeout(() => exit(), 300);
            return;
        }

        setMessages((m) => [...m, { role: "user", text: trimmed }]);
        setThinking(true);

        // Placeholder for agent
        await new Promise((r) => setTimeout(r, 600));

        setMessages((m) => [
            ...m,
            { role: "agent", text: "Got it. Agent logic coming next." }
        ]);
        setThinking(false);
    };


    return (
        <Box flexDirection="column" padding={1}>
            <Text color="green">Meeting Scheduler Agent</Text>
            <Text dimColor>Session: {threadId}</Text>

            <ChatView messages={messages} />

            {thinking && <Text dimColor>Thinking...</Text>}

            <Box marginTop={1}>
                <InputBox onSubmit={handleSubmit} disabled={thinking} />
            </Box>
        </Box>
    );
}
