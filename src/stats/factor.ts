import { Result, ok, fail } from "../types/result.ts";
import { Matrix, transpose, multiply } from "../math/matrix.ts";
import { pca, PCAResult } from "./pca.ts";

export interface FactorOptions {
  numFactors?: number; // default choose via Kaiser rule (eigenvalue > 1) or 2 if none
  rotate?: "none" | "varimax";
  standardize?: boolean;
}

export interface FactorAnalysisModel {
  loadings: Matrix; // p x m factor loadings
  eigenvalues: number[];
  means: number[];
  scales?: number[];
}

function varimax(loadings: Matrix, gamma = 1, q = 100, tol = 1e-6): Matrix {
  const p = loadings.length;
  const m = p ? loadings[0].length : 0;
  let R = Array.from({ length: m }, (_, i) => {
    const row = Array(m).fill(0);
    row[i] = 1;
    return row;
  });
  let L = loadings.map((row) => row.slice());
  let d = 0;
  for (let iter = 0; iter < q; iter++) {
    const Lambda = multiply(L, R);
    const u: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
    const v: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        let s1 = 0, s2 = 0;
        for (let k = 0; k < p; k++) {
          const x = Lambda[k][i];
          const y = Lambda[k][j];
          s1 += x * y * (x * x - y * y);
          s2 += (x * x - y * y);
        }
        u[i][j] = 2 / p * s1;
        v[i][j] = gamma / p * s2;
      }
    }
    // Givens-like rotation update using SVD proxy (gradient ascent)
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        let num = 0, den = 0;
        for (let k = 0; k < p; k++) {
          const x = Lambda[k][i];
          const y = Lambda[k][j];
          num += 2 * x * y * (x * x - y * y);
          den += (x * x - y * y) * (x * x - y * y) - 4 * x * x * y * y;
        }
        const angle = 0.25 * Math.atan2(num, den + 1e-12);
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        for (let k = 0; k < p; k++) {
          const xi = Lambda[k][i];
          const xj = Lambda[k][j];
          Lambda[k][i] = c * xi - s * xj;
          Lambda[k][j] = s * xi + c * xj;
        }
        for (let k = 0; k < m; k++) {
          const ri = R[k][i];
          const rj = R[k][j];
          R[k][i] = c * ri - s * rj;
          R[k][j] = s * ri + c * rj;
        }
      }
    }
    const diff = Lambda.flat().reduce((acc, v, idx) => acc + Math.abs(v - L.flat()[idx]), 0);
    L = Lambda;
    if (Math.abs(diff - d) < tol) break;
    d = diff;
  }
  return L;
}

export function factorAnalysis(X: Matrix, options: FactorOptions = {}): Result<FactorAnalysisModel> {
  try {
    const [err, model] = pca(X, { standardize: options.standardize });
    if (err) return fail<FactorAnalysisModel>(err);
    const eigenvalues = model.eigenvalues;
    const kaiserIdx = eigenvalues.map((v, i) => [v, i] as [number, number]).filter(([v]) => v > 1).map(([, i]) => i);
    const m = options.numFactors ?? (kaiserIdx.length > 0 ? kaiserIdx.length : 2);
    const loadings = model.components.map((col) => col).map((col, j) => col.slice(0, m));
    // components is p x p; take first m columns as loadings
    let L = model.components.map((row) => row.slice(0, m));
    if (options.rotate === "varimax") L = varimax(L);
    return ok({ loadings: L, eigenvalues: eigenvalues.slice(0, m), means: model.means, scales: model.scales });
  } catch (error) {
    return fail<FactorAnalysisModel>(error);
  }
}




