import assert from "node:assert/strict";
import test from "node:test";
import { analyze, examples } from "../dist/engine.mjs";

for (const [category, input] of Object.entries(examples)) {
  test(`${category} seed returns exact evidence and actionable guidance`, () => {
    const result = analyze(input, category);
    assert.ok(result.score >= 55 && result.score <= 100);
    assert.ok(result.nextStep);
    for (const flag of result.flags) {
      assert.ok(input.includes(flag.evidence));
      assert.ok(flag.action);
    }
  });
}
test("neutral listing has no matched signals", () => {
  const result = analyze(
    "Open house on Saturday at 2 PM. Contact the property office to book.",
    "rental",
  );
  assert.equal(result.score, 0);
  assert.deepEqual(result.flags, []);
});
test("category-specific rules stay scoped", () => {
  assert.ok(
    !analyze(examples.job, "rental").flags.some(({ id }) => id === "check"),
  );
});
test("score is capped and repeated language only counts once", () => {
  const input = (examples.market + " Pay today. ").repeat(4);
  const result = analyze(input, "market");
  assert.equal(result.score, 100);
  assert.equal(result.flags.length, 3);
});
test("invalid category and text lengths are rejected", () => {
  assert.throws(() => analyze(examples.job, "__proto__"), /listing type/);
  assert.throws(() => analyze("  ", "job"), /characters/);
  assert.throws(() => analyze("a".repeat(12001), "job"), /characters/);
});
