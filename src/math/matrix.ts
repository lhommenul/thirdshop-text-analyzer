export type Matrix = number[][];

export function transpose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = rows ? A[0].length : 0;
  const T: Matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

export function multiply(A: Matrix, B: Matrix): Matrix {
  const rA = A.length;
  const cA = rA ? A[0].length : 0;
  const rB = B.length;
  const cB = rB ? B[0].length : 0;
  if (cA !== rB) throw new Error("Incompatible shapes for multiply");
  const C: Matrix = Array.from({ length: rA }, () => Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let k = 0; k < cA; k++) {
      const aik = A[i][k];
      for (let j = 0; j < cB; j++) C[i][j] += aik * B[k][j];
    }
  }
  return C;
}

export function dot(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Mismatched vector lengths");
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function columnMeans(X: Matrix): number[] {
  const n = X.length;
  if (n === 0) return [];
  const p = X[0].length;
  const means = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) means[j] += X[i][j];
  }
  for (let j = 0; j < p; j++) means[j] /= n;
  return means;
}

export function columnStdDevs(X: Matrix): number[] {
  const n = X.length;
  if (n === 0) return [];
  const p = X[0].length;
  const means = columnMeans(X);
  const vars = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      const d = X[i][j] - means[j];
      vars[j] += d * d;
    }
  }
  for (let j = 0; j < p; j++) vars[j] = Math.sqrt(vars[j] / (n - 1 || 1));
  return vars;
}

export function centerColumns(X: Matrix): { centered: Matrix; means: number[] } {
  const n = X.length;
  if (n === 0) return { centered: [], means: [] };
  const p = X[0].length;
  const means = columnMeans(X);
  const Y: Matrix = Array.from({ length: n }, () => Array(p).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) Y[i][j] = X[i][j] - means[j];
  }
  return { centered: Y, means };
}

export function standardizeColumns(X: Matrix): { standardized: Matrix; means: number[]; scales: number[] } {
  const n = X.length;
  if (n === 0) return { standardized: [], means: [], scales: [] };
  const p = X[0].length;
  const means = columnMeans(X);
  const stds = columnStdDevs(X).map((s) => (s === 0 ? 1 : s));
  const Y: Matrix = Array.from({ length: n }, () => Array(p).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) Y[i][j] = (X[i][j] - means[j]) / stds[j];
  }
  return { standardized: Y, means, scales: stds };
}

export function covarianceMatrix(X: Matrix, centered = true): Matrix {
  const n = X.length;
  if (n === 0) return [];
  const p = X[0].length;
  const Y = centered ? X : centerColumns(X).centered;
  const denom = Math.max(1, n - 1);
  const S: Matrix = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      const ya = Y[i][a];
      for (let b = 0; b < p; b++) S[a][b] += ya * Y[i][b];
    }
  }
  for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) S[a][b] /= denom;
  return S;
}

// Jacobi eigen decomposition for symmetric matrices
export function jacobiEigenDecomposition(S: Matrix, maxIter = 100, tol = 1e-10): { values: number[]; vectors: Matrix } {
  const n = S.length;
  if (n === 0) return { values: [], vectors: [] };
  // copy S
  const A: Matrix = S.map((row) => row.slice());
  // initialize V to identity
  const V: Matrix = Array.from({ length: n }, (_, i) => {
    const row = Array(n).fill(0);
    row[i] = 1;
    return row;
  });

  function maxOffDiagonal(A: Matrix): { p: number; q: number; value: number } {
    let max = 0;
    let p = 0;
    let q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = Math.abs(A[i][j]);
        if (v > max) {
          max = v;
          p = i;
          q = j;
        }
      }
    }
    return { p, q, value: max };
  }

  for (let iter = 0; iter < maxIter; iter++) {
    const { p, q, value } = maxOffDiagonal(A);
    if (value < tol) break;
    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    // rotate A
    for (let i = 0; i < n; i++) {
      const aip = A[i][p];
      const aiq = A[i][q];
      A[i][p] = c * aip - s * aiq;
      A[i][q] = s * aip + c * aiq;
    }
    for (let i = 0; i < n; i++) {
      const api = A[p][i];
      const aqi = A[q][i];
      A[p][i] = c * api - s * aqi;
      A[q][i] = s * api + c * aqi;
    }
    A[p][q] = 0;
    A[q][p] = 0;

    // rotate V
    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = s * vip + c * viq;
    }
  }

  const values = Array(n).fill(0);
  for (let i = 0; i < n; i++) values[i] = A[i][i];
  return { values, vectors: V };
}

export function argsortDescending(values: number[]): number[] {
  return values.map((v, i) => [v, i] as [number, number]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
}


