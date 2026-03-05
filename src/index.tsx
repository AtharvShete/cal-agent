import dotenv from "dotenv";

dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
    quiet: true,
});

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
    const missing = ["GROQ_API_KEY", "DATABASE_URL"].filter((name) => !process.env[name]);
    if (missing.length) {
        console.error(`Missing ${missing.join(" and ")}. Copy .env.example to .env and fill in your credentials.`);
        process.exit(1);
    }
    const { render } = await import("ink");
    const { default: App } = await import("./ui/App");
    const { initDb } = await import("./db/client");
    await initDb();

    const { threadId } = parseArgs();

    if (threadId) {
        console.log(`Resuming session: ${threadId}`);
    }

    render(<App initialThreadId={threadId} />);
}

main().catch(() => {
    console.error("Daymark could not start. Check DATABASE_URL in .env. Your PostgreSQL server must be reachable and support TLS. See README.md for setup.");
    process.exit(1);
});
