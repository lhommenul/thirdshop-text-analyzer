import { computeSummary } from "./src/stats/descriptive.ts";
import { termFrequency } from "./src/text/tf.ts";

const numbers = [2, 4, 4, 4, 5, 5, 7, 9];
const [statsErr, stats] = computeSummary(numbers);
if (statsErr) {
  console.error("Stats error:", statsErr.message);
} else {
  console.log("Descriptive stats:", stats);
}

const text = Deno.readTextFileSync("./dataset/pieceoccasion.html");

const [tfErr, tf] = termFrequency(text, { asRelative: true });
if (tfErr) {
  console.error("TF error:", tfErr.message);
} else {
  console.log("Term frequency:", tf);
}


