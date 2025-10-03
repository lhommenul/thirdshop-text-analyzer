import { assertEquals } from "@std/assert";
import { tfidfFromDocs, topKTerms } from "./tfidf.ts";

Deno.test("tfidf simple corpus", () => {
  const docs = [
    "the cat sat on the mat",
    "the dog sat on the log",
  ];
  const [err, vectors] = tfidfFromDocs(docs, { normalizeHtml: false, tfRelative: false, idfSmooth: false, minTokenLength: 2 });
  if (err) throw err;
  // terms unique to doc1 should have non-zero tfidf; 'the' should be 0 idf
  const v1 = vectors[0];
  if (!(v1.cat > 0)) throw new Error("expected cat > 0");
  assertEquals(v1.the, 0);
  const top = topKTerms(v1, 2);
  if (!(top.length === 2)) throw new Error("expected top 2 terms");
});


