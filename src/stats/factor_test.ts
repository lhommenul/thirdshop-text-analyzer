import { assert } from "@std/assert";
import { factorAnalysis } from "./factor.ts";

Deno.test("FactorAnalysis basic run", () => {
  const X = [
    [1, 0, 0],
    [0.9, 0.1, 0],
    [0, 1, 0],
    [0, 0.9, 0.1],
    [0, 0, 1],
    [0.1, 0, 0.9],
  ];
  const [err, model] = factorAnalysis(X, { numFactors: 2, rotate: "varimax" });
  if (err) throw err;
  assert(model.loadings.length === 3);
});


