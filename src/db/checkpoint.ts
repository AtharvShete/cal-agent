import { getPool } from "./client";

export async function saveState(threadId: string, state: any) {
	const pool = getPool();
	await pool.query(
		`
    INSERT INTO checkpoints (thread_id, state, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (thread_id)
    DO UPDATE SET state = $2, updated_at = NOW()
    `,
		[threadId, state],
	);
}

export async function loadState(threadId: string) {
	const pool = getPool();
	const res = await pool.query(
		"SELECT state FROM checkpoints WHERE thread_id = $1",
		[threadId],
	);

	return res.rows[0]?.state || null;
}
