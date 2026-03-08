import { execFileSync } from "node:child_process";
import { loadManifest } from "./content-manifest";

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

interface CliOptions {
  version: string;
}

const usage = () => {
  console.error("Usage: bun run content:tag -- --version <X.Y.Z>");
};

const readArg = (args: string[], name: string): string | null => {
  const index = args.indexOf(name);
  if (index < 0 || index + 1 >= args.length) {
    return null;
  }
  return args[index + 1];
};

const parseCli = (): CliOptions => {
  const version = readArg(process.argv.slice(2), "--version");
  if (!version || !SEMVER_RE.test(version)) {
    usage();
    throw new Error("The --version argument must use semver format X.Y.Z");
  }

  return { version };
};

const tagExists = (tagName: string): boolean => {
  try {
    execFileSync(
      "git",
      ["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`],
      {
        stdio: "ignore",
      },
    );
    return true;
  } catch {
    return false;
  }
};

const createAnnotatedTag = (tagName: string, message: string): void => {
  execFileSync("git", ["tag", "-a", tagName, "-m", message], {
    stdio: "inherit",
  });
};

const main = (): void => {
  const cli = parseCli();
  const manifest = loadManifest();
  const expectedPrefix = `content-v${cli.version}+`;
  const release = [...manifest.releases]
    .reverse()
    .find((entry) => entry.version.startsWith(expectedPrefix));

  if (!release) {
    throw new Error(
      `No release entry matching version ${cli.version} was found in content/vn/releases.manifest.json`,
    );
  }

  if (tagExists(release.version)) {
    throw new Error(`Git tag '${release.version}' already exists`);
  }

  const message = [
    `Content release ${release.version}`,
    `Checksum: ${release.checksum}`,
    `Schema version: ${release.schemaVersion}`,
    `Published at: ${release.publishedAt}`,
    `Target: ${release.target.server} (${release.target.host}) db=${release.target.database}`,
  ].join("\n");

  createAnnotatedTag(release.version, message);

  console.log(`Created annotated tag ${release.version}`);
  console.log(`Next step: git push origin ${release.version}`);
};

try {
  main();
} catch (error) {
  console.error("content:tag failed:", error);
  process.exitCode = 1;
}
