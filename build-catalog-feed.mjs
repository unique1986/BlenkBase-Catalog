import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const allowedSchemaVersions = new Set([1, 2, 3]);
const allowedMaturity = new Set(["stable", "beta", "experimental"]);
const idPattern = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const versionPattern = /^[0-9A-Za-z][0-9A-Za-z.+_-]{0,39}$/;

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function validateDefinition(file, definition) {
  if (!allowedSchemaVersions.has(definition.schemaVersion)) fail(file, `nicht unterstütztes Schema v${definition.schemaVersion}`);
  if (!idPattern.test(definition.id ?? "")) fail(file, "ungültige oder fehlende Spiel-ID");
  if (file !== `${definition.id}.json`) fail(file, `Dateiname muss ${definition.id}.json entsprechen`);
  if (typeof definition.displayName !== "string" || !definition.displayName.trim()) fail(file, "Anzeigename fehlt");
  if (!allowedMaturity.has(definition.maturity ?? "stable")) fail(file, `unbekannter Reifegrad ${definition.maturity}`);
  const version = definition.package?.version ?? "1.0.0";
  if (!versionPattern.test(version)) fail(file, `ungültige Definitionsversion ${version}`);
  if (!definition.installer?.kind) fail(file, "Installationsprofil fehlt");
  if (!definition.process?.executable || !definition.process?.workingDirectory) fail(file, "Startdatei oder Arbeitsverzeichnis fehlt");
  if (!Array.isArray(definition.ports) || !Array.isArray(definition.configurationFiles)
      || !Array.isArray(definition.persistentPaths)) fail(file, "Ports, Konfigurationsdateien oder persistente Pfade fehlen");
  return version;
}

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const sourceDirectory = resolve(option("--source", "catalog"));
const outputFile = resolve(option("--output", "feed.json"));
const definitionUrlPrefix = option("--url-prefix", "").replace(/^\/+|\/+$/g, "");
const files = (await readdir(sourceDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== basename(outputFile))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "en"));

const definitions = [];
const ids = new Set();

for (const file of files) {
  const bytes = await readFile(resolve(sourceDirectory, file));
  const definition = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  const version = validateDefinition(file, definition);
  if (ids.has(definition.id)) fail(file, `doppelte Spiel-ID ${definition.id}`);
  ids.add(definition.id);

  definitions.push({
    id: definition.id,
    displayName: definition.displayName,
    version,
    maturity: definition.maturity ?? "stable",
    definitionUrl: definitionUrlPrefix ? `${definitionUrlPrefix}/${file}` : file,
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
