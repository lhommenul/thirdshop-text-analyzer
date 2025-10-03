export interface DescriptiveStats {
  count: number;
  sum: number;
  mean: number;
  median: number;
  modes: number[]; // multiple modes possible
  variance: number;
  standardDeviation: number;
  min: number;
  max: number;
  q1: number; // 25th percentile
  q3: number; // 75th percentile
}


