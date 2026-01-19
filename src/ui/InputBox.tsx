import { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface Props {
    onSubmit: (text: string) => void;
    disabled?: boolean;
}

export default function InputBox({ onSubmit, disabled }: Props) {
    const [value, setValue] = useState("");

    return (
        <Box>
            <Text color="blue">{"> "}</Text>
            <TextInput
                value={value}
                onChange={setValue}
                onSubmit={(val) => {
                    if (!val) return;
                    onSubmit(val);
                    setValue("");
                }}
            />
        </Box>
    );
}
