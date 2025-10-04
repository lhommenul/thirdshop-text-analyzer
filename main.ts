import { computeSummary } from "./src/stats/descriptive.ts";
import { termFrequency } from "./src/text/tf.ts";
import { idfFromDocs } from "./src/text/idf.ts";
import { tfidfFromDocs, topKTerms } from "./src/text/tfidf.ts";
import { buildCooccurrenceMatrix, mostAssociated, computePPMI } from "./src/text/cooccurrence.ts";
import { pca } from "./src/stats/pca.ts";
import { factorAnalysis } from "./src/stats/factor.ts";

const numbers = [2, 4, 4, 4, 5, 5, 7, 9];
const [statsErr, stats] = computeSummary(numbers);
if (statsErr) {
  console.error("Stats error:", statsErr.message);
} else {
  console.log("Descriptive stats:", stats);
}

const text1 = Deno.readTextFileSync("./dataset/pieceoccasion-1.html");
const text2 = Deno.readTextFileSync("./dataset/pieceoccasion-2.html");

const [tfErr, tf] = termFrequency(text1, { asRelative: true });
if (tfErr) {
  console.error("TF error:", tfErr.message);
} else {
  console.log("Term frequency:", tf);
}

// IDF demo using two small docs (pieceoccasion subset + second synthetic doc)
const doc1 = text1;
const doc2 = text2;
const [idfErr, idf] = idfFromDocs([doc1, doc2], { smooth: true });

if (idfErr) {
  console.error("IDF error:", idfErr.message);
} else {
  const sampleTerms = ["référence", "de", "garantie", "hello"]; // show some common/rare terms
  const view: Record<string, number> = {};
  for (const t of sampleTerms) if (idf[t] !== undefined) view[t] = Number(idf[t].toFixed(4));
  console.log("IDF (sample):", view);
}

// TF-IDF demo: compute vectors and display top terms for each doc
const [tfidfErr, vectors] = tfidfFromDocs([doc1, doc2], { tfRelative: false, idfSmooth: true });
if (tfidfErr) {
  console.error("TF-IDF error:\n", tfidfErr.message);
} else {
  const top1 = topKTerms(vectors[0], 10);
  const top2 = topKTerms(vectors[1], 10);
  console.log("TF-IDF top 10 (doc1):", top1);
  console.log("TF-IDF top 10 (doc2):", top2);
}

// Co-occurrence demo: window-based counts and PPMI
const [coocErr, cooc] = buildCooccurrenceMatrix(text1, { windowSize: 2, distanceWeighting: true });
if (coocErr) {
  console.error("Co-occurrence error:", coocErr.message);
} else {

  const lookupTerm = "prix";

  const neighbors = mostAssociated(cooc, lookupTerm, 10);
  console.log(`Co-occurrence top for ${lookupTerm}:`, neighbors);
  const [ppmiErr, ppmi] = computePPMI(cooc);
  if (ppmiErr) {
    console.error("PPMI error:", ppmiErr.message);
  } else {
    const neighborsPpmi = mostAssociated(ppmi, lookupTerm, 10);
    console.log(`PPMI top for ${lookupTerm}:`, neighborsPpmi);
  }
}

// PCA/Factor Analysis demo on TF-IDF vectors
const [tfidfForPcaErr, tfidfVectors] = tfidfFromDocs([text1, text2], { tfRelative: false, idfSmooth: true });
if (tfidfForPcaErr) {
  console.error("TF-IDF for PCA error:", tfidfForPcaErr.message);
} else {
  // build unified vocabulary
  const vocab = new Set<string>();
  for (const v of tfidfVectors) for (const t of Object.keys(v)) vocab.add(t);
  const terms = Array.from(vocab);
  const X = tfidfVectors.map((vec) => terms.map((t) => vec[t] ?? 0));

  const [pcaErr, pcaModel] = pca(X, { standardize: true });
  if (pcaErr) {
    console.error("PCA error:", pcaErr.message);
  } else {
    // loadings: variables x components
    const componentsToShow = 2;
    for (let c = 0; c < Math.min(componentsToShow, pcaModel.components[0]?.length ?? 0); c++) {
      const loadings = terms.map((t, i) => [t, Math.abs(pcaModel.components[i][c])] as [string, number]);
      loadings.sort((a, b) => b[1] - a[1]);
      console.log(`PCA comp ${c + 1} top terms:`, loadings.slice(0, 10));
    }
  }

  const [faErr, faModel] = factorAnalysis(X, { numFactors: 2, rotate: "varimax", standardize: true });
  if (faErr) {
    console.error("Factor Analysis error:", faErr.message);
  } else {
    for (let f = 0; f < Math.min(2, faModel.loadings[0]?.length ?? 0); f++) {
      const loads = terms.map((t, i) => [t, Math.abs(faModel.loadings[i][f])] as [string, number]);
      loads.sort((a, b) => b[1] - a[1]);
      console.log(`FA factor ${f + 1} top terms:`, loads.slice(0, 10));
    }
  }
}


