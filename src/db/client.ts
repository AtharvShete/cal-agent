import pg from "pg";
const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool() {
	if (!pool) {
		if (!process.env.DATABASE_URL) {
			throw new Error("DATABASE_URL environment variable is not set");
		}
		// console.log(
		// 	"Creating database pool with URL:",
		// 	process.env.DATABASE_URL.substring(0, 50) + "...",
		// );
		pool = new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl: true,
			application_name: "cal-agent",
			idle_in_transaction_session_timeout: 30000,
		});

		// Listen for pool errors
		pool.on("error", (err) => {
			console.error("Unexpected error on idle client", err);
		});
	}
	return pool;
}

export async function initDb() {
	try {
		const pool = getPool();

		await pool.query(`
    CREATE TABLE IF NOT EXISTS checkpoints (
      thread_id TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

		await pool.query(`
    ALTER TABLE checkpoints
    ALTER COLUMN state TYPE JSONB
  `);
		// console.log("Database initialization complete");
	} catch (err) {
		if (err instanceof Error) {
			console.warn("Database initialization failed:", err.message);
			console.warn("Error code:", (err as any).code);
		} else {
			console.warn("Database initialization failed:", JSON.stringify(err));
		}
	}
}
