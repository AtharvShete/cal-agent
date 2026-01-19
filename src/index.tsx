import dotenv from "dotenv";

dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
    quiet: true,
 });

import { render } from "ink";
import App from "./ui/App";
import { initDb } from "./db/client";

async function main() {
    await initDb();
    render(<App />);
}

main();
