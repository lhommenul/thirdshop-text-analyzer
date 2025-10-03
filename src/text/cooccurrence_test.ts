import { assert, assertEquals } from "@std/assert";
import { buildCooccurrenceMatrix, mostAssociated, computePPMI } from "./cooccurrence.ts";

Deno.test("cooccurrence simple window", () => {
  const text = "the cat sat on the mat";
  const [err, M] = buildCooccurrenceMatrix(text, { normalizeHtml: false, windowSize: 1, symmetric: true });
  if (err) throw err;
  assert(M.the.cat > 0 || M.cat.the > 0);
  const topThe = mostAssociated(M, "the", 2);
  assert(topThe.length > 0);
});

Deno.test("PPMI positivity", () => {
  const text = "a b a b c";
  const [err, M] = buildCooccurrenceMatrix(text, { normalizeHtml: false, windowSize: 1, symmetric: true });
  if (err) throw err;
  const [e2, P] = computePPMI(M);
  if (e2) throw e2;
  for (const row of Object.values(P)) for (const v of Object.values(row)) assert(v >= 0);
});


