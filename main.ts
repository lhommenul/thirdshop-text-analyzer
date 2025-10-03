import { computeSummary } from "./src/stats/descriptive.ts";
import { termFrequency } from "./src/text/tf.ts";
import { idfFromDocs } from "./src/text/idf.ts";
import { tfidfFromDocs, topKTerms } from "./src/text/tfidf.ts";

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


