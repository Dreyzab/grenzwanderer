import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  VISUAL_MANIFEST_OUTPUT_PATH,
  VISUAL_MISSING_OUTPUT_PATH,
  VISUAL_OUTPUT_DIR,
  VISUAL_VARIANTS_OUTPUT_PATH,
  VN_SCENE_BACKGROUND_MANIFEST_OUTPUT_PATH,
  VN_SCENE_BACKGROUND_MISSING_OUTPUT_PATH,
  CHARACTER_SPRITE_MANIFEST_OUTPUT_PATH,
  CHARACTER_SPRITE_MISSING_OUTPUT_PATH,
  buildCase01VisualScaffoldOutput,
  buildCase01VnSceneBackgroundManifest,
  buildCase01VnSceneBackgroundMissingReport,
  buildCase01CharacterSpriteManifest,
  buildCase01CharacterSpriteMissingReport,
} from "./data/freiburg_visual_assets";

const OUTPUT_FILES = [
  VISUAL_MANIFEST_OUTPUT_PATH,
  VISUAL_VARIANTS_OUTPUT_PATH,
  VISUAL_MISSING_OUTPUT_PATH,
  VN_SCENE_BACKGROUND_MANIFEST_OUTPUT_PATH,
  VN_SCENE_BACKGROUND_MISSING_OUTPUT_PATH,
  CHARACTER_SPRITE_MANIFEST_OUTPUT_PATH,
  CHARACTER_SPRITE_MISSING_OUTPUT_PATH,
] as const;

const toJson = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const readUtf8IfExists = (absolutePath: string): string | null => {
  try {
    return readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
};

const main = (): void => {
  const checkOnly = process.argv.includes("--check");
  const scaffold = buildCase01VisualScaffoldOutput();
  const vnSceneBackgroundManifest = buildCase01VnSceneBackgroundManifest();
  const vnSceneBackgroundMissing = buildCase01VnSceneBackgroundMissingReport(
    vnSceneBackgroundManifest,
  );
  const characterSpriteManifest = buildCase01CharacterSpriteManifest();
  const characterSpriteMissing = buildCase01CharacterSpriteMissingReport(
    characterSpriteManifest,
  );

  if (scaffold.parity.errors.length > 0) {
    throw new Error(
      [
        "Case01 authoring/runtime parity failed.",
        ...scaffold.parity.errors.map((entry) => `- ${entry}`),
      ].join("\n"),
    );
  }

  const renderedFiles = new Map<string, string>([
    [VISUAL_MANIFEST_OUTPUT_PATH, toJson(scaffold.manifest)],
    [VISUAL_VARIANTS_OUTPUT_PATH, toJson(scaffold.variants)],
    [VISUAL_MISSING_OUTPUT_PATH, toJson(scaffold.missing)],
    [
      VN_SCENE_BACKGROUND_MANIFEST_OUTPUT_PATH,
      toJson(vnSceneBackgroundManifest),
    ],
    [VN_SCENE_BACKGROUND_MISSING_OUTPUT_PATH, toJson(vnSceneBackgroundMissing)],
    [CHARACTER_SPRITE_MANIFEST_OUTPUT_PATH, toJson(characterSpriteManifest)],
    [CHARACTER_SPRITE_MISSING_OUTPUT_PATH, toJson(characterSpriteMissing)],
  ]);

  if (checkOnly) {
    const mismatchedFiles = OUTPUT_FILES.filter((absolutePath) => {
      const expected = renderedFiles.get(absolutePath);
      const current = readUtf8IfExists(absolutePath);
      return current !== expected;
    });

    if (mismatchedFiles.length > 0) {
      throw new Error(
        [
          "Visual asset scaffold outputs are stale.",
          ...mismatchedFiles.map(
            (absolutePath) =>
              `- ${path.relative(process.cwd(), absolutePath).replaceAll("\\", "/")}`,
          ),
          "Run 'bun run assets:visual:scaffold' and commit the updated JSON artifacts.",
        ].join("\n"),
      );
    }

    console.log("Visual asset scaffold outputs are up to date.");
    console.log(`Manifest entries: ${scaffold.manifest.length}`);
    console.log(`Variant stubs: ${scaffold.variants.length}`);
    console.log(`Missing asset entries: ${scaffold.missing.length}`);
    console.log(
      `VN scene background entries: ${vnSceneBackgroundManifest.length}`,
    );
    console.log(
      `VN scene background missing entries: ${vnSceneBackgroundMissing.length}`,
    );
    console.log(`Character sprite entries: ${characterSpriteManifest.length}`);
    console.log(
      `Character sprite missing entries: ${characterSpriteMissing.length}`,
    );
    return;
  }

  mkdirSync(VISUAL_OUTPUT_DIR, { recursive: true });
  for (const [absolutePath, contents] of renderedFiles) {
    writeFileSync(absolutePath, contents, "utf8");
  }

  console.log("Visual asset scaffold outputs written.");
  console.log(`Manifest: ${VISUAL_MANIFEST_OUTPUT_PATH}`);
  console.log(`Variants: ${VISUAL_VARIANTS_OUTPUT_PATH}`);
  console.log(`Missing: ${VISUAL_MISSING_OUTPUT_PATH}`);
  console.log(`Manifest entries: ${scaffold.manifest.length}`);
  console.log(`Variant stubs: ${scaffold.variants.length}`);
  console.log(`Missing asset entries: ${scaffold.missing.length}`);
  console.log(
    `VN scene background entries: ${vnSceneBackgroundManifest.length}`,
  );
  console.log(
    `VN scene background missing entries: ${vnSceneBackgroundMissing.length}`,
  );
  console.log(`Character sprite entries: ${characterSpriteManifest.length}`);
  console.log(
    `Character sprite missing entries: ${characterSpriteMissing.length}`,
  );
};

try {
  main();
} catch (error) {
  console.error("assets:visual:scaffold failed:", error);
  process.exitCode = 1;
}
