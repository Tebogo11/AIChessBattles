// Smoke check: fail loudly if the landing page would have no seed to show.
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "node:fs";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* optional */
  }
}
loadEnv(".env.local");
loadEnv(".env");

const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
if (!url) {
  console.error("Set CONVEX_URL or VITE_CONVEX_URL.");
  process.exit(1);
}
const seeded = await new ConvexHttpClient(url).query("matches:listSeeded", {});
if (!seeded || seeded.length === 0) {
  console.error("FAIL: no seeded matches — the landing page would show no replay.");
  process.exit(1);
}
console.log(`OK: ${seeded.length} seeded match(es) available for the landing page.`);
