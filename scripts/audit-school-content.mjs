import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const facts = JSON.parse(
  await readFile("assets/product-releases.json", "utf8"),
);
assert.equal(facts.preview.status, "preview");
assert.equal(facts.preview.version, "3.8");
const releases = await readFile("releases.html", "utf8");
for (const [value, label] of [
  [facts.preview.lessons, "lessons"],
  [facts.preview.categories, "categories"],
  [facts.preview.questions, "authored questions"],
  [facts.preview.teachingCards, "teaching cards"],
  [facts.preview.playGames, "Play games"],
]) {
  assert.ok(
    releases.includes(`${value} ${label}`),
    `Availability page drift: ${label}`,
  );
}
assert.ok(releases.includes(`Vizancia ${facts.iosPublic.version}`));
for (const [path, expected] of Object.entries(facts.classroomArtifacts)) {
  assert.equal(
    createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
    expected,
    `Classroom source changed: ${path}`,
  );
}
const passport = await readFile("passport.html", "utf8");
const examples = JSON.parse(
  passport.match(
    /id="passport-examples" type="application\/json">([\s\S]*?)<\/script>/,
  )[1],
);
assert.deepEqual(
  Object.keys(examples).sort(),
  ["aiHelp", "anotherTool", "humanHelp", "noAI", "noticedAI", "unsure"].sort(),
);
for (const example of Object.values(examples))
  for (const field of ["choice", "reason", "evidence", "followup"])
    assert.ok(example[field]?.trim());
const demoScript = await readFile("assets/schools.js", "utf8");
assert.ok(
  !/localStorage|sessionStorage|fetch\(|sendBeacon|gtag\(|XMLHttpRequest/.test(
    demoScript,
  ),
  "Demo must not save or transmit a decision",
);
const home = await readFile("index.html", "utf8");
assert.ok(
  !/96 short lessons|17 iOS mini-games|current curriculum spans 16/.test(home),
);
assert.ok(home.includes('href="schools/">For schools &amp; teachers'));
assert.ok(home.includes("AI Passport · 3.8 preview"));
console.log(
  "School content audit passed: release labels, six fictional choices, no demo persistence/network, unchanged classroom artifacts.",
);
