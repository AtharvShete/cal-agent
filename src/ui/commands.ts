import { listEvents } from "../agent/tools/calendar";

export async function handleLocalCommand(input: string): Promise<string | null> {
  const [command, ...args] = input.trim().split(/\s+/);
  if (command === "/help") {
    return [
      "Daymark commands",
      "/agenda YYYY-MM-DD  Show the day's events without an LLM call",
      "/help               Show this guide",
      "/exit               End the session",
      "",
      'Try: "Schedule a 30-minute study session tomorrow at 10 AM"',
      'Or: "Find a free hour tomorrow"',
    ].join("\n");
  }
  if (command === "/agenda") {
    const date = args[0] ?? "";
    const parsed = new Date(`${date}T00:00:00Z`);
    if (args.length !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return "Usage: /agenda YYYY-MM-DD (use a valid calendar date).";
    }
    return listEvents(date);
  }
  if (command.startsWith("/")) return `Unknown command: ${command}. Type /help for available commands.`;
  return null;
}
