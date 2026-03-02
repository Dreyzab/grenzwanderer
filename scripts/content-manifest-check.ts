import {
  assertSha256,
  loadManifest,
  type ContentReleaseEntry,
} from "./content-manifest";

const VERSION_RE = /^content-v\d+\.\d+\.\d+\+[a-f0-9]{8}$/;

const assert = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const checkReleaseEntries = (releases: ContentReleaseEntry[]): void => {
  const versions = new Set<string>();
  const checksums = new Set<string>();

  for (const entry of releases) {
    assert(
      VERSION_RE.test(entry.version),
      `Invalid content version format: ${entry.version}`,
    );
    assertSha256(entry.checksum, `release(${entry.version}).checksum`);
    assert(
      entry.version.endsWith(`+${entry.checksum.slice(0, 8)}`),
      `Version/checksum mismatch: ${entry.version} does not include checksum8 suffix`,
    );
    assert(
      !versions.has(entry.version),
      `Duplicate release version found: ${entry.version}`,
    );
    versions.add(entry.version);
    checksums.add(entry.checksum);
  }
};

const main = (): void => {
  const manifest = loadManifest();
  checkReleaseEntries(manifest.releases);

  for (const rollback of manifest.rollbacks) {
    assertSha256(rollback.checksum, "rollback.checksum");
    assert(
      manifest.releases.some(
        (release) => release.checksum === rollback.checksum,
      ),
      `Rollback checksum is not present in releases: ${rollback.checksum}`,
    );
  }

  console.log("Content release manifest is valid.");
  console.log(`Releases: ${manifest.releases.length}`);
  console.log(`Rollbacks: ${manifest.rollbacks.length}`);
};

try {
  main();
} catch (error) {
  console.error("content:manifest:check failed:", error);
  process.exitCode = 1;
}
