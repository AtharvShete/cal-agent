import { Box, Text } from "ink";

export default function App() {
    return (
        <Box flexDirection="column" padding={1}>
            <Text color="green">Meeting Scheduler Agent</Text>
            <Text>Testing React Ink</Text>
            <Text dimColor>The color change is working</Text>
        </Box>
    );
}
