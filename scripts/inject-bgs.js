const fs = require("fs");
const contentPath = "scripts/extract-vn-content.ts";
let code = fs.readFileSync(contentPath, "utf8");

const replacements = [
  ["/assets/vn/bg/bank_exterior.webp", "/images/scenes/scene_bank_intro.png"],
  [
    "/assets/vn/bg/rathaus_hall.webp",
    "/images/scenes/scene_rathaus_interior.webp",
  ],
  ["/assets/vn/bg/estate_night.webp", "/images/scenes/scene_estate_intro.png"],
  ["/assets/vn/bg/cafe_riegler.webp", "/images/scenes/jurnalistintro.png"],
  ["/assets/vn/bg/salon_night.webp", "/images/scenes/salon_night.png"],
  ["/assets/vn/bg/barracks_dusk.webp", "/images/scenes/barracks_dusk.png"],
  ["/assets/vn/bg/archive_stacks.webp", "/images/scenes/archive_stacks.png"],
  [
    "/assets/vn/bg/casino_interior.webp",
    "/images/scenes/scene_casino_duel.png",
  ],
];

replacements.forEach(([from, to]) => {
  code = code.replace(from, to);
});

const nodeAdditions = [
  ["scene_start", "/images/scenes/scene_start.webp"],
  ["scene_language_select", "/images/scenes/scene_language_select.webp"],
  ["scene_backstory_select", "/images/scenes/scene_backstory_select.webp"],
  ["scene_map_intro", "/images/scenes/scene_map_intro.webp"],
  ["scene_evidence_collection", "/images/scenes/scene_evidence_collection.png"],
  ["scene_guild_tutorial", "/images/scenes/scene_guild_tutorial.png"],
  ["scene_park_reunion", "/images/scenes/scene_park_reunion.png"],
  ["scene_park_reunion_beat1", "/images/scenes/scene_park_reunion.png"],
];

nodeAdditions.forEach(([id, bgPath]) => {
  const nodeStart = `    id: "${id}",\n`;
  if (code.includes(nodeStart)) {
    code = code.replace(
      nodeStart,
      `${nodeStart}    backgroundUrl: "${bgPath}",\n`,
    );
  }
});

fs.writeFileSync(contentPath, code, "utf8");
console.log("Backgrounds injected.");
