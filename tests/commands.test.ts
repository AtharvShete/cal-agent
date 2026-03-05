import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const originalCwd = process.cwd();
const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "daymark-commands-"));
process.chdir(workspace);
const { handleLocalCommand } = await import("../src/ui/commands");
const fixture = "Working hours: 9:00 AM - 5:00 PM\nTimezone: Asia/Kolkata\n\nThursday Mar 5, 2026\n- 2:00 PM - 3:00 PM: Study session\n\nFriday Mar 6, 2026\n- 10:00 AM - 11:00 AM: Appointment\n";
beforeEach(() => fs.writeFile("calendar.txt", fixture));
after(async () => {
  process.chdir(originalCwd);
  await fs.rm(workspace, { recursive: true, force: true });
});

test("agenda reads only the requested day without credentials or writes", async () => {
  const result = await handleLocalCommand("/agenda 2026-03-05");
  assert.match(result!, /Study session/);
  assert.doesNotMatch(result!, /Appointment/);
  assert.equal(await fs.readFile("calendar.txt", "utf8"), fixture);
});

test("agenda rejects invalid dates rather than rolling over to another day", async () => {
  for (const command of ["/agenda", "/agenda 2026-02-30", "/agenda tomorrow", "/agenda 2026-03-05 extra"]) {
    assert.match((await handleLocalCommand(command))!, /YYYY-MM-DD/);
  }
});

test("unknown slash commands return guidance rather than reaching the model", async () => {
  assert.match((await handleLocalCommand("/wat"))!, /\/help/);
});

test("natural-language messages are left for the scheduling agent", async () => {
  assert.equal(await handleLocalCommand("Schedule a study session tomorrow"), null);
});

test("help lists the available terminal commands", async () => {
  const result = await handleLocalCommand("/help");
  for (const command of ["/agenda", "/help", "/exit"]) assert.ok(result!.includes(command));
});
