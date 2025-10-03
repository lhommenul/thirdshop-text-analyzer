import { assertEquals } from "@std/assert";
import { idfFromDocs } from "./idf.ts";

Deno.test("idf simple corpus", () => {
  const docs = [
    "the cat sat on the mat",
    "the dog sat on the log",
  ];
  const [err, idf] = idfFromDocs(docs, { normalizeHtml: false, minTokenLength: 2, smooth: false });
  if (err) throw err;
  // df("the") = 2 in 2 docs → idf = log(2/2) = 0
  // df("cat") = 1 → idf = log(2/1) = log(2)
  assertEquals(idf.the, 0);
  // base e; compare rounded value
  const approx = Number(idf.cat.toFixed(4));
  assertEquals(approx, Number(Math.log(2).toFixed(4)));
});

Deno.test("idf smoothing keeps values positive", () => {
  const docs = ["hello world", "hello there"]; // df(hello)=2, df(world)=1
  const [err, idf] = idfFromDocs(docs, { normalizeHtml: false, smooth: true });
  if (err) throw err;
  // with smoothing +1, idf should be > 0
  if (!(idf.hello > 0)) throw new Error("expected positive idf for 'hello'");
});


