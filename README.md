# AI/ML Hiring Task: Meeting Scheduler Agent

## Overview

Build a command-line scheduling agent using **LangGraph** and **PostgreSQL checkpointing**.

**Time Limit**: 4 hours
**Language**: TypeScript

---

## The Task

- Agent reads a calendar from a text file
- Agent proposes available meeting times based on user request
- Agent terminates after proposing times
- User can return later, respond, and continue the conversation
- Use LangGraph checkpointing to persist and resume state
- **The agent must be generalized — no hard-coded inputs or outputs. It should dynamically handle any scheduling request, not just the examples provided.**

---

## Important Requirements

⚠️ **No Hard-Coding**: Your agent must be a generalized solution:
- Do not hard-code specific dates, times, or meeting participants
- The agent should parse and understand any user request dynamically
- Calendar parsing should work with any valid calendar format, not just the provided example
- The agent should reason about availability based on the actual calendar data, not pre-programmed responses

The examples provided are just demonstrations — your agent will be tested with different inputs.

---

## Example Workflow (For Reference Only)

### Step 1: User starts a new request

```bash
$ npx tsx src/index.ts "Schedule a 30 minute meeting with Jordan on Monday afternoon"
```

**Agent Output:**
Thread ID: sched_7f8a9b2c

```

I checked your calendar for Monday Jan 20, 2025.

You have these existing commitments:
- 9:00 AM - 10:00 AM: Team Standup
- 2:00 PM - 3:00 PM: 1:1 with Sarah

Here are available 30-minute slots on Monday afternoon:

1. 12:00 PM - 12:30 PM
2. 3:00 PM - 3:30 PM
3. 4:00 PM - 4:30 PM

Which option works for you?
```

**[Agent terminates]**

---

### Step 2: User returns and continues

```bash
$ npx tsx src/index.ts --thread sched_7f8a9b2c "Option 2 works best"
```

**Agent Output:**
```
Great! I've noted your preference:

Meeting with Jordan
Monday Jan 20, 2025, 3:00 PM - 3:30 PM
```

**[Agent terminates]**

---

## Provided Files

### `calendar.txt`

```
Week of January 20, 2025
Working hours: 9:00 AM - 5:00 PM

Monday Jan 20, 2025
- 9:00 AM - 10:00 AM: Team Standup
- 2:00 PM - 3:00 PM: 1:1 with Sarah

Tuesday Jan 21, 2025
- 10:00 AM - 11:30 AM: Product Review
- 4:00 PM - 5:00 PM: Client Call

Wednesday Jan 22, 2025
- 9:30 AM - 10:00 AM: Daily Sync
- 1:00 PM - 2:00 PM: Design Review

Thursday Jan 23, 2025
- 11:00 AM - 12:00 PM: Team Lunch
- 3:00 PM - 4:00 PM: Sprint Planning

Friday Jan 24, 2025
- 9:00 AM - 9:30 AM: Weekly Kickoff
- 2:00 PM - 3:00 PM: Retrospective
```

---

## Submission

Provide a GitHub repository with:
- Source code
- Setup instructions
- Demo showing the workflow above
