import { Box, Text } from "ink";
import { UIMessage } from "./types.js";

interface Props {
    messages: UIMessage[];
}

export default function ChatView({ messages }: Props) {
    return (
        <Box flexDirection="column" marginTop={1}>
            {messages.map((msg, idx) => (
                <Box key={idx} marginBottom={1}>
                    <Text color={msg.role === "user" ? "blue" : "green"}>
                        {msg.role === "user" ? "> " : "Agent: "}
                    </Text>
                    <Text>{msg.text}</Text>
                </Box>
            ))}
        </Box>
    );
}
