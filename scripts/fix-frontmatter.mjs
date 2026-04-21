import fs from "node:fs";
import path from "node:path";

const filesToFix = [
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_caseboard.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_market_beat2.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_pub_beat2.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_station_beat2.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/Plot/02_Dog/scene_dog_tailor_beat2.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_bootblack_tip_end.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_cleaner_tip_end.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip.md",
  "obsidian/StoryDetective/40_GameViewer/Sandbox_KA/08_LivingCity/scene_city_student_tip_end.md",
];

for (const relPath of filesToFix) {
  const absPath = path.resolve("f:/proje/grenzwanderer/Grenzwanderer", relPath);
  if (!fs.existsSync(absPath)) {
    console.error("File not found:", absPath);
    continue;
  }
  const content = fs.readFileSync(absPath, "utf8");
  if (content.startsWith("---")) continue;

  const idName = path.basename(relPath, ".md");
  const frontmatter = `---
id: ${idName}
type: vn_scene
---

`;

  fs.writeFileSync(absPath, frontmatter + content);
  console.log("Fixed", absPath);
}
