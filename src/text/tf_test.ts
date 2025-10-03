import { assertEquals } from "@std/assert";
import { termFrequency } from "./tf.ts";

Deno.test("termFrequency relative", () => {
  const [err, tf] = termFrequency("Hello hello world");
  if (err) throw err;
  // tokens: ["hello","hello","world"] => relative
  assertEquals(tf.hello.toFixed(2), (2 / 3).toFixed(2));
  assertEquals(tf.world.toFixed(2), (1 / 3).toFixed(2));
});

Deno.test("termFrequency raw counts", () => {
  const [err, tf] = termFrequency("<p>Bonjour le monde, bonjour!</p>", { asRelative: false });
  if (err) throw err;
  // naive tokenization should count "bonjour" twice
  assertEquals(tf.bonjour, 2);
});


