# Meeting Scheduler Agent

A command-line scheduling agent built with **LangGraph**, **Groq LLM**, and **PostgreSQL** for state persistence.

---

## Features

- ✅ **Natural language scheduling** - Schedule, cancel, and query events
- ✅ **Conflict detection** - Prevents double-booking
- ✅ **Find available slots** - Suggests free time slots based on duration
- ✅ **Working hours awareness** - Respects 9 AM - 5 PM working hours
- ✅ **Session persistence** - Resume conversations with `--thread` flag
- ✅ **PostgreSQL checkpointing** - State saved to database

---

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd cal-agent
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Groq API Key (required)
# Get yours at: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# PostgreSQL Database URL (required)
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://user:password@localhost:5432/cal_agent
```

#### Getting API Keys:

**Groq API Key:**

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key and copy it

**PostgreSQL Database:**

- **Local**: Install PostgreSQL and create a database
- **Cloud**: Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)

### 3. Run the Agent

```bash
# Start a new session
pnpm start

# Resume an existing session
pnpm start -- --thread sched_abc123
```

---

## Usage Examples

### Query Events

```
What do I have on Monday Jan 20th?
```

### Find Available Slots

```
Find available 30 minute slots on Jan 20th 2026
```

### Schedule an Event

```
Schedule a Team Sync on Jan 24th 2026 at 10am
```

### Cancel an Event

```
Cancel the Weekly Kickoff on Jan 24th 2026
```

### Add Event to New Date

```
Add a dentist appointment on Jan 27th 2026 at 2pm
```

### Exit Session

```
/exit
```

---

## Resuming Sessions

When you exit, note your Session ID (e.g., `sched_abc123`). To resume:

```bash
pnpm start -- --thread sched_abc123
```

The agent will load your previous conversation state from PostgreSQL.

---

## Calendar Format

The agent reads from `calendar.txt`:

```
Week of January 20, 2026
Working hours: 9:00 AM - 5:00 PM
Timezone: America/New_York

Monday Jan 20, 2026
- 9:00 AM - 10:00 AM: Team Standup
- 2:00 PM - 3:00 PM: 1:1 with Sarah

Tuesday Jan 21, 2026
- 10:00 AM - 11:30 AM: Product Review
- 4:00 PM - 5:00 PM: Client Call
```

---

## Tech Stack

- **LangGraph** - Agent orchestration and state management
- **Groq (Llama 3.3 70B)** - LLM for natural language understanding
- **PostgreSQL** - Session state persistence
- **Ink** - Terminal UI framework
- **TypeScript** - Type-safe development

---

## Project Structure

```
cal-agent/
├── src/
│   ├── agent/
│   │   ├── graph.ts          # LangGraph workflow
│   │   ├── state.ts          # State schema
│   │   ├── nodes/
│   │   │   ├── parseIntent.ts    # Intent classification
│   │   │   ├── extractDetails.ts # Detail extraction
│   │   │   ├── manageCalendar.ts # Calendar operations
│   │   │   └── respond.ts        # Response generation
│   │   └── tools/
│   │       └── calendar.ts   # Calendar file operations
│   ├── db/
│   │   ├── client.ts         # PostgreSQL connection
│   │   └── checkpoint.ts     # State persistence
│   ├── ui/
│   │   ├── App.tsx           # Main UI component
│   │   └── ...
│   ├── index.tsx             # Entry point
│   └── runAgent.ts           # Agent runner
├── calendar.txt              # Calendar data
├── .env                      # Environment variables
└── package.json
```
