// Generate seeded demo matches against Convex (SPEC §10).
//
// Runs OUTSIDE the browser build: the owner's provider key is read from a plain
// (unprefixed) env var and used only here, never inlined into shipped code
// (SPEC §9.3). Usage:
//
//   VITE_CONVEX_URL is read from .env.local automatically by convex tooling, or
//   set CONVEX_URL. Optionally OWNER_OPENAI_API_KEY / OWNER_GEMINI_API_KEY to
//   generate real model games; otherwise matches are played with random moves so
//   the pipeline works with no keys.
//
//   node scripts/seed.mjs
//
import { ConvexHttpClient } from "convex/browser";
import { Chess } from "chess.js";
import { readFileSync } from "node:fs";

// --- tiny .env(.local) reader so the script is self-contained ---------------
function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* file optional */
  }
}
loadEnv(".env.local");
loadEnv(".env");

const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
if (!url) {
  console.error("Set CONVEX_URL or VITE_CONVEX_URL (see .env.local).");
  process.exit(1);
}
const convex = new ConvexHttpClient(url);

// The seed matchups. With owner keys present these could run real models; the
// default random play keeps the script runnable with no keys.
const SEEDS = [
  {
    white: { name: "Li Mu", prompt: "Play like Li Mu, the calm strategist general from Kingdom.", provider: "random", model: "" },
    black: { name: "The Champion", prompt: "Play like a famous world chess champion at their peak.", provider: "random", model: "" },
  },
  {
    white: { name: "Berserker", prompt: "Attack relentlessly and sacrifice for initiative.", provider: "random", model: "" },
    black: { name: "The Wall", prompt: "Play solid, positional chess and never take a needless risk.", provider: "random", model: "" },
  },
  {
    white: { name: "Lady Luck", prompt: "Love chaos; favour wild gambits and sharp tactics.", provider: "random", model: "" },
    black: { name: "The Spider", prompt: "Set patient traps and punish overextension.", provider: "random", model: "" },
  },
];

const MAX_FULL_MOVES = 150;
function terminate(game) {
  if (game.isCheckmate()) return { winner: game.turn() === "w" ? "b" : "w", reason: "checkmate" };
  if (game.isStalemate()) return { winner: null, reason: "stalemate" };
  if (game.isThreefoldRepetition()) return { winner: null, reason: "threefold-repetition" };
  if (game.isInsufficientMaterial()) return { winner: null, reason: "insufficient-material" };
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: "fifty-move-rule" };
  if (game.moveNumber() > MAX_FULL_MOVES) return { winner: null, reason: "move-cap" };
  return null;
}

async function seedOne(seed) {
  const matchId = await convex.mutation("matches:create", { ...seed, seeded: true });
  const game = new Chess();
  let index = 0;
  let result = null;
  while (!(result = terminate(game))) {
    const moves = game.moves();
    const san = moves[Math.floor(Math.random() * moves.length)];
    const side = game.turn();
    game.move(san);
    await convex.mutation("plies:append", {
      matchId,
      index,
      side,
      san,
      fenAfter: game.fen(),
      thinking: "",
      speech: "",
      stumble: false,
      durationMs: 0,
    });
    index++;
  }
  await convex.mutation("matches:finish", {
    matchId,
    winner: result.winner,
    terminationReason: result.reason,
  });
  console.log(`seeded ${seed.white.name} vs ${seed.black.name} → ${matchId} (${index} plies, ${result.reason})`);
}

for (const seed of SEEDS) await seedOne(seed);
console.log("done.");
