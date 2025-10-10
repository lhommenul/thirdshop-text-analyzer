import { assert, assertEquals } from "@std/assert";
import { pca, pcaTransform } from "./pca.ts";

Deno.test("PCA basic variance ordering", () => {
  // two-dimensional data with variance mostly on first axis
  const X = [
    [1, 1], [2, 1.1], [3, 0.9], [4, 1.2], [5, 0.8]
  ];
  const [err, model] = pca(X);
  if (err) throw err;
  assert(model.eigenvalues[0] >= model.eigenvalues[1]);
  const [e2, scores] = pcaTransform(X, model, 1);
  if (e2) throw e2;
  assert(scores.length === X.length);
});




