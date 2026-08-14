// Runs a local, no-sudo, no-Docker Postgres instance for development.
// Started with: node scripts/dev-db.mjs
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "livingword",
  password: "livingword_dev",
  port: 5433,
  persistent: true,
});

async function main() {
  // initialise() runs initdb, which refuses to run against a non-empty data
  // directory (by design) — it must only be called the very first time this
  // cluster is created, never on subsequent runs against existing data.
  const alreadyInitialised = existsSync(path.join(dataDir, "PG_VERSION"));
  if (!alreadyInitialised) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase("livingword");
  } catch {
    // already exists
  }
  console.log("Postgres ready at postgresql://livingword:livingword_dev@localhost:5433/livingword");

  const shutdown = async () => {
    console.log("Stopping Postgres...");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
