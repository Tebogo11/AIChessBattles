import type { BotConfig } from "./botConfig";

/**
 * Map the two configured bots onto white and black. White has a real first-move
 * advantage, so in a model comparison the assignment matters and is disclosed on
 * the board (SPEC §4.6). With randomise off, the first bot takes white.
 */
export function assignColors(
  first: BotConfig,
  second: BotConfig,
  randomize: boolean,
  coin: () => boolean = () => Math.random() < 0.5,
): { white: BotConfig; black: BotConfig } {
  const swap = randomize && coin();
  return swap ? { white: second, black: first } : { white: first, black: second };
}
