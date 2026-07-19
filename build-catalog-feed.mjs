import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const sourceDirectory = resolve(option("--source", "catalog"));
const outputFile = resolve(option("--output", "feed.json"));
const files = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== basename(outputFile))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "en"));

const definitions = [];

for (const file of files) {
  const bytes = await readFile(resolve(sourceDirectory, file));
  const definition = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));

  if (!definition.id || !definition.displayName || !definition.installer || !definition.process) {
    continue;
  }

  definitions.push({
    id: definition.id,
    displayName: definition.displayName,
    version: definition.package?.version ?? "1.0.0",
    maturity: definition.maturity ?? "stable",
    definitionUrl: file,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    notes: definition.summary || undefined,
  });
}

const feed = {
  schemaVersion: 1,
  name: "Offizieller BlenkBase-Katalog",
  generatedAtUtc: new Date().toISOString(),
  definitions,
};

await writeFile(outputFile, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
console.log(`${definitions.length} Definitionen nach ${outputFile} geschrieben.`);
