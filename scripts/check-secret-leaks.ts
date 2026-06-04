import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

// High-signal credential patterns. Kept deliberately narrow so the large
// content/asset/narrative surface does not generate noise -- we want real
// leaks, not files that merely contain the word "secret".
const RULES: { name: string; pattern: RegExp }[] = [
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: "Google OAuth access token", pattern: /ya29\.[0-9A-Za-z_-]{20,}/g },
  { name: "AWS access key id", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "GitHub token", pattern: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/g },
  { name: "Slack token", pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  {
    name: "Private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
  },
];

// Substrings that mark a line as a known-safe placeholder / fake. A pattern
// hit on a line containing one of these is ignored. Add new placeholders here
// rather than weakening a rule.
const ALLOWLIST_SUBSTRINGS = ["set-via-OPENVIKING_GOOGLE_API_KEY"];

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".bmp",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".mov",
  ".webm",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".7z",
  ".wasm",
  ".lockb",
]);

const MAX_FILE_BYTES = 2_000_000;
const NULL_BYTE = "\u0000";

interface Finding {
  file: string;
  line: number;
  rule: string;
  redacted: string;
}

const listTrackedFiles = (): string[] => {
  const out = execFileSync("git", ["ls-files", "-z"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return out.split(NULL_BYTE).filter(Boolean);
};

const redact = (value: string): string => {
  if (value.length <= 8) {
    return "****";
  }
  return `${value.slice(0, 4)}...${value.slice(-2)} (${value.length} chars)`;
};

const findings: Finding[] = [];

for (const relPath of listTrackedFiles()) {
  if (BINARY_EXTENSIONS.has(path.extname(relPath).toLowerCase())) {
    continue;
  }

  const absPath = path.join(repoRoot, relPath);
  let stat;
  try {
    stat = statSync(absPath);
  } catch {
    continue; // tracked but absent in the working tree (e.g. deleted)
  }
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) {
    continue;
  }

  let content: string;
  try {
    content = readFileSync(absPath, "utf8");
  } catch {
    continue;
  }
  if (content.includes(NULL_BYTE)) {
    continue; // binary sniff
  }

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOWLIST_SUBSTRINGS.some((needle) => line.includes(needle))) {
      continue;
    }
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = rule.pattern.exec(line)) !== null) {
        findings.push({
          file: relPath,
          line: i + 1,
          rule: rule.name,
          redacted: redact(match[0]),
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error(
    `Potential secret(s) found in tracked files (${findings.length}):`,
  );
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.line} [${finding.rule}] ${finding.redacted}`,
    );
  }
  console.error(
    "\nIf a finding is a placeholder/fake, add a marker substring to " +
      "ALLOWLIST_SUBSTRINGS in scripts/check-secret-leaks.ts. " +
      "If it is a real secret, rotate it and remove it from version control.",
  );
  process.exit(1);
}

console.log(
  "secret scan passed (no high-signal credentials in tracked files).",
);
