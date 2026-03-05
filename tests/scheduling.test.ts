import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Use a real calendar in a temporary workspace; never modify the demo calendar.
const originalCwd = process.cwd();
const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "daymark-test-"));
process.chdir(workspace);
const { manageCalendar } = await import("../src/agent/nodes/manageCalendar");
const fixture = "Working hours: 9:00 AM - 5:00 PM\nTimezone: Asia/Kolkata\n\nThursday Mar 5, 2026\n- 2:00 PM - 3:00 PM: Study session\n";
beforeEach(() => fs.writeFile("calendar.txt", fixture));
after(async () => {
  process.chdir(originalCwd);
  await fs.rm(workspace, { recursive: true, force: true });
});

async function schedule(startTime: string, duration?: number, endTime?: string) {
  return manageCalendar({
    threadId: "sched_test", intent: "schedule", messages: [],
    eventDetails: { title: "Project work", date: "2026-03-05", startTime, duration, endTime },
  });
}

test("requested duration controls the saved event's end time", async () => {
  await schedule("10:00 AM", 30);
  assert.match(await fs.readFile("calendar.txt", "utf8"), /10:00 AM - 10:30 AM: Project work/);
});

test("duration crosses noon without changing an afternoon start to AM", async () => {
  await schedule("11:45 AM", 30);
  assert.match(await fs.readFile("calendar.txt", "utf8"), /11:45 AM - 12:15 PM: Project work/);
  await schedule("12:30 PM", 30);
  assert.match(await fs.readFile("calendar.txt", "utf8"), /12:30 PM - 1:00 PM: Project work/);
});

test("omitting duration retains the one-hour default", async () => {
  await schedule("10:00 AM");
  assert.match(await fs.readFile("calendar.txt", "utf8"), /10:00 AM - 11:00 AM: Project work/);
});

test("explicit end time takes precedence over duration", async () => {
  await schedule("10:00 AM", 30, "11:15 AM");
  assert.match(await fs.readFile("calendar.txt", "utf8"), /10:00 AM - 11:15 AM: Project work/);
});

test("invalid duration does not write to the calendar", async () => {
  for (const duration of [0, -30, 1.5, NaN, Infinity]) {
    await schedule("10:00 AM", duration);
    assert.equal(await fs.readFile("calendar.txt", "utf8"), fixture);
  }
});

test("a duration that crosses midnight is rejected without writing", async () => {
  await schedule("11:45 PM", 30);
  assert.equal(await fs.readFile("calendar.txt", "utf8"), fixture);
});

test("duration still respects existing conflict detection", async () => {
  const result = await schedule("1:45 PM", 30);
  assert.match(result.messages![0].text, /Conflict/);
  assert.equal(await fs.readFile("calendar.txt", "utf8"), fixture);
});
