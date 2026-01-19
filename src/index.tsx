import dotenv from "dotenv";

dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
    quiet: true,
});

import { render } from "ink";
import App from "./ui/App";
import { initDb } from "./db/client";

function parseArgs(): { threadId?: string } {
    const args = process.argv.slice(2);
    let threadId: string | undefined;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--thread" && args[i + 1]) {
            threadId = args[i + 1];
            i++; // Skip the next arg since we consumed it
        }
    }

    return { threadId };
}

async function main() {
    await initDb();

    const { threadId } = parseArgs();

    if (threadId) {
        console.log(`Resuming session: ${threadId}`);
    }

    render(<App initialThreadId={threadId} />);
}

main();
