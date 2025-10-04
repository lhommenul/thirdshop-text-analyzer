import { Result, ok, fail } from "../types/result.ts";
import { Matrix, covarianceMatrix, jacobiEigenDecomposition, argsortDescending, centerColumns, standardizeColumns, multiply } from "../math/matrix.ts";

export interface PCAOptions {
  standardize?: boolean; // if true, standardize columns before PCA (correlation PCA)
}

export interface PCAResult {
  components: Matrix; // columns are principal components (loadings)
  eigenvalues: number[]; // corresponding eigenvalues
  means: number[]; // used for centering
  scales?: number[]; // used for standardization if any
}

export function pca(X: Matrix, options: PCAOptions = {}): Result<PCAResult> {
  try {
    if (X.length === 0) return ok({ components: [], eigenvalues: [], means: [], scales: [] });
    const useStd = !!options.standardize;
    let data: Matrix;
    let means: number[] = [];
    let scales: number[] | undefined = undefined;
    if (useStd) {
      const r = standardizeColumns(X);
      data = r.standardized;
      means = r.means;
      scales = r.scales;
    } else {
      const r = centerColumns(X);
      data = r.centered;
      means = r.means;
    }
    const S = covarianceMatrix(data, true);
    const { values, vectors } = jacobiEigenDecomposition(S);
    const order = argsortDescending(values);
    const eigenvalues = order.map((i) => values[i]);
    const components = vectors.map((row) => order.map((i) => row[i]));
    return ok({ components, eigenvalues, means, scales });
  } catch (error) {
    return fail<PCAResult>(error);
  }
}

export function pcaTransform(X: Matrix, model: PCAResult, k?: number): Result<Matrix> {
  try {
    const comps = k ? model.components.map((row) => row.slice(0, k)) : model.components;
    // center (and standardize if model.scales provided)
    const Y = X.map((row) => row.map((v, j) => {
      const centered = v - (model.means[j] ?? 0);
      const s = model.scales && model.scales[j] ? model.scales[j] : 1;
      return centered / s;
    }));
    const scores = multiply(Y, comps);
    return ok(scores);
  } catch (error) {
    return fail<Matrix>(error);
  }
}


