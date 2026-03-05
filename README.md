# Daymark

A conversational calendar assistant for planning appointments, study sessions, and focused work from the terminal.

Daymark turns a scheduling request into a small, explicit workflow: understand the intent, extract event details, check the calendar, and report the result. Calendar changes stay in a readable local file; conversation state lives in PostgreSQL so a session can continue later.

## Project focus

This project explores how to connect natural-language understanding to predictable calendar operations. Its main engineering concerns are intent routing, structured extraction, conflict detection, and persistent conversation context. The terminal interface keeps those parts easy to inspect without requiring a web frontend or calendar-provider integration.

## What it does

- Schedule, cancel, and look up events using natural language.
- Detect overlapping events before writing to the calendar.
- Suggest available slots within the calendar's working hours.
- Honor requested meeting durations; default to one hour when no end time or duration is supplied.
- Read a day's agenda with `/agenda YYYY-MM-DD`, without an LLM call.
- Resume saved conversations with `--thread`.

```text
Daymark
A conversational calendar assistant

> Schedule a 30-minute study session on March 5, 2026 at 10 AM
Daymark: I've scheduled "Study session" on 2026-03-05 from 10:00 AM to 10:30 AM.

> /agenda 2026-03-05
Daymark: Events for Mar 5, 2026:
- 10:00 AM - 10:30 AM: Study session
```

This is an illustrative session. The bundled calendar contains fictional personal events from January 2026.

## Run locally

### Prerequisites

- Node.js 22 or newer.
- pnpm 10.20.0, the version declared in `package.json`.
- A Groq API key with access to `llama-3.3-70b-versatile`.
- An existing PostgreSQL database with TLS support and a user that can create and alter tables.

### Install and configure

Clone this repository, open a terminal in its root directory, and install the locked dependencies:

```bash
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` and fill in both values:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://user:password@host:5432/daymark
```

The app loads `.env` by default and `.env.production` when `NODE_ENV=production`. The database user needs permission to create and alter the `checkpoints` table. Startup creates the table if needed. Keep credentials out of version control.

### Start a session

```bash
pnpm start
pnpm start --thread sched_abc123
```

The terminal displays the session ID. Reusing it restores conversation context for subsequent requests; previous messages are not replayed in the terminal view.

## Commands and examples

| Input | Result |
| --- | --- |
| `/help` | Show commands and example requests |
| `/agenda 2026-01-20` | Read the local calendar for that date |
| `/exit` | End the terminal session |
| `Schedule a 45-minute reading session on January 21, 2026 at 2 PM` | Add an event if the time is free |
| `Find a free hour on January 22, 2026` | Suggest up to five options within working hours |
| `What do I have on January 23, 2026?` | Query the calendar through the agent |
| `Cancel Coding practice on January 22, 2026` | Remove a matching event |

`/agenda` and `/help` bypass the model and do not enter the persisted conversation. Starting the app still requires the database and Groq configuration.

## How it works

```text
Terminal input
  |-- /help, /agenda --> local command --> terminal response
  |-- natural language
       --> load session from PostgreSQL
       --> classify intent (Groq)
       --> extract details (Groq)
       --> calendar operation --> calendar.txt
       --> save session to PostgreSQL
       --> terminal response
```

LangGraph routes schedule, cancel, query, and availability requests through shared detail-extraction and calendar-operation nodes. Unrecognized intents go to a response node. Groq's `llama-3.3-70b-versatile` handles classification and extraction; TypeScript code performs calendar reads, conflict checks, and writes.

The stack is TypeScript, LangGraph, Groq, PostgreSQL, and React with Ink. Session persistence uses direct PostgreSQL queries, rather than a LangGraph checkpointer.

### Design choices

- **An explicit graph:** each step has one responsibility, making the path from a request to a calendar change easier to inspect.
- **A plain-text calendar:** easy to read and edit without a separate service. It suits a single-user experiment, with trade-offs around concurrent writes and parsing.
- **Separate conversation storage:** PostgreSQL holds session state while the calendar file holds events. Resuming a conversation does not require moving calendar data into the database.
- **Deterministic calendar operations:** the model supplies structured details; overlap detection and duration arithmetic run in code.

## Calendar format

Daymark reads `calendar.txt` from the current working directory. Preserve blank lines between day sections and use the following format:

```text
Week of January 19, 2026
Working hours: 9:00 AM - 5:00 PM
Timezone: Asia/Kolkata

Tuesday Jan 20, 2026
- 9:00 AM - 10:00 AM: Study session
- 2:00 PM - 3:00 PM: Portfolio project work
```

An explicit end time takes precedence over duration. Without either, scheduling uses a one-hour duration. Events must start and end on the same day.

## Verification

```bash
pnpm test
pnpm typecheck
```

The tests use temporary calendar files and require no API key or database. They cover duration arithmetic, noon transitions, conflict preservation, invalid durations, and local agenda commands.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Startup reports missing configuration | Create `.env` in the repository root and set both `GROQ_API_KEY` and `DATABASE_URL`. |
| The database cannot connect | Check the host, credentials, database name, TLS support, and table permissions. Startup does not create the database itself. |
| Natural-language requests fail | Check Groq credentials and model access, plus the PostgreSQL connection used to save sessions. |
| An agenda is empty or the calendar cannot be read | Start the app from the repository root and check the date and formatting in `calendar.txt`. |
| A resumed session shows an empty chat view | The saved context is used by the next agent request; the UI does not replay old messages. |

Calendar events are stored in `calendar.txt`; conversation messages are stored in PostgreSQL. Natural-language requests send recent conversation context to Groq. The local `/agenda` and `/help` commands do not send an LLM request.

## Limits

- This is a single-user local calendar; it does not sync with Google Calendar or Outlook.
- Availability suggestions respect working hours, but event creation does not enforce them.
- The timezone header is descriptive. Cross-timezone conversion and timezone-aware relative dates are not implemented.
- Natural-language extraction can be wrong. There is no confirmation step before a valid calendar mutation.
- Cancellation removes the first case-insensitive title match on the requested date.
- File writes are not coordinated between concurrent app instances. A calendar write and a database checkpoint are separate operations.

## Repository

```text
src/
  agent/
    graph.ts                 Workflow routing
    state.ts                 State schema and types
    nodes/                   Intent, extraction, calendar handling, response
    tools/calendar.ts        Calendar parsing and operations
  db/                        PostgreSQL session storage
  ui/                        Ink interface and local commands
  index.tsx                  Startup and argument handling
  runAgent.ts                Session loading, graph execution, persistence
tests/                       Calendar and command regression tests
calendar.txt                 Fictional sample calendar
.env.example                 Configuration template
```
