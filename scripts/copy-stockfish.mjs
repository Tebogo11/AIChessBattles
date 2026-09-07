/**
 * Put the Stockfish worker where Vite can serve it.
 *
 * The engine is a 7MB WASM blob, so it is copied out of node_modules at build
 * time and git-ignored rather than committed. The **lite single-threaded**
 * build is the one taken on purpose: the multi-threaded build needs
 * SharedArrayBuffer, which needs COOP/COEP headers, which would make the whole
 * site cross-origin isolated for one optional chart (#15).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "stockfish", "bin");
const to = join(root, "public", "stockfish");
const files = ["stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"];

if (!existsSync(from)) {
  console.warn("stockfish is not installed; skipping engine copy.");
  process.exit(0);
}

await mkdir(to, { recursive: true });
for (const file of files) {
  await copyFile(join(from, file), join(to, file));
}
console.log(`Copied ${files.length} Stockfish files to public/stockfish/`);
