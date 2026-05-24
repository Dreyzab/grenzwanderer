import { readFileSync } from "node:fs";

import {
  buildCaseIrFromSnapshot,
  CASE_CATALOG,
  parseVnSnapshotPayload,
  validateCaseIr,
} from "../src/shared/vn-contract";
import {
  resolveContentReleaseProfile,
  resolveContentSnapshotPath,
} from "./content-authoring-contract";

interface SnapshotEnvelopeMetadata {
  checksum?: unknown;
  generatedAt?: unknown;
  contentVersion?: unknown;
}

const releaseProfile = resolveContentReleaseProfile(
  (() => {
    const profileIndex = process.argv.indexOf("--profile");
    return profileIndex >= 0 ? process.argv[profileIndex + 1] : undefined;
  })(),
);

const snapshotPath = resolveContentSnapshotPath(releaseProfile);
const rawSnapshot = readFileSync(snapshotPath, "utf8");
const parsedPayload = parseVnSnapshotPayload(rawSnapshot);

if (!parsedPayload.ok) {
  console.error("[caseir:lint] Snapshot parse failed.");
  for (const issue of parsedPayload.issues) {
    console.error(`- ${issue.path}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  const envelope = JSON.parse(rawSnapshot) as SnapshotEnvelopeMetadata;
  const caseIr = buildCaseIrFromSnapshot(
    parsedPayload.snapshot,
    {
      bundleChecksum:
        typeof envelope.checksum === "string" ? envelope.checksum : undefined,
      generatedAt:
        typeof envelope.generatedAt === "string"
          ? envelope.generatedAt
          : undefined,
      contentVersion:
        typeof envelope.contentVersion === "string"
          ? envelope.contentVersion
          : undefined,
    },
    CASE_CATALOG,
  );
  const validation = validateCaseIr(caseIr);

  if (!validation.ok) {
    console.error("[caseir:lint] Case IR graph validation failed.");
    for (const issue of validation.issues) {
      console.error(
        `- [${issue.severity}] ${issue.code} ${issue.path}: ${issue.message}`,
      );
    }
    process.exitCode = 1;
  } else {
    const warnings = validation.issues.filter(
      (issue) => issue.severity === "warning",
    );
    for (const warning of warnings) {
      console.warn(
        `[caseir:lint] [warning] ${warning.code} ${warning.path}: ${warning.message}`,
      );
    }
    console.log(
      `[caseir:lint] Case IR ok: ${caseIr.cases.length} cases, ${caseIr.scenarios.length} scenarios, ${caseIr.nodes.length} nodes, ${caseIr.choices.length} choices, ${caseIr.conditions.length} conditions, ${caseIr.effects.length} effects, ${caseIr.skillChecks.length} skill checks, ${caseIr.triggerRules.length} trigger rules, ${caseIr.questArchetypes.length} quest archetypes.`,
    );
  }
}
