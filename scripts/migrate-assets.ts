import fs from "node:fs";
import path from "node:path";

const IMAGE_DIR = "images";
const LOC_DIR = path.join(IMAGE_DIR, "locations");
const CHAR_DIR = path.join(IMAGE_DIR, "characters");

const LOCATION_MAPPING: Record<string, string[]> = {
  loc_hbf: ["bahnhof", "train_station", "loc_hauptbahnhof"],
  loc_freiburg_bank: ["bank", "ka_bank", "loc_bankhaus"],
  loc_rathaus: ["rathaus", "city_archive", "loc_rathaus_archiv"],
  loc_uni: ["uni_", "loc_uni"],
  loc_hotel_royal: ["hotel_"],
  loc_police_station: ["police_"],
  loc_pub_deutsche: ["pub_", "loc_ganter", "tavern"],
  loc_freiburg_estate: ["loc_ka_estate", "aristocratic_salon", "bedroom_noble", "bathroom_luxe", "loc_ka_estate"],
  loc_student_house: ["student_house", "loc_student_house"],
  loc_hospital: ["hospital_"],
  loc_agency: ["loc_agency", "loc_ka_agency"],
  loc_munster: ["loc_munster", "munster"],
  loc_misc: ["street_", "bakery", "barbershop", "carriage", "cemetery", "clockmaker", "factory", "haunted", "industrialist", "lab_bg", "lab_workbench", "location_exterior", "location_placeholder", "post_office", "printing", "ruined", "smugglers", "telegraph", "theater", "warehouse_exterior"]
};

function migrateLocations() {
  console.log("--- Migrating Locations ---");
  const files = fs.readdirSync(LOC_DIR);
  
  for (const file of files) {
    if (file.endsWith(".webp") || file.endsWith(".png") || file.endsWith(".meta.json")) {
      const fullPath = path.join(LOC_DIR, file);
      if (fs.lstatSync(fullPath).isDirectory()) continue;

      let targetFolder = "misc";
      for (const [folder, prefixes] of Object.entries(LOCATION_MAPPING)) {
        if (prefixes.some(p => file.startsWith(p))) {
          targetFolder = folder;
          break;
        }
      }

      const destDir = path.join(LOC_DIR, targetFolder);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      const destPath = path.join(destDir, file);
      console.log(`Moving: ${file} -> ${targetFolder}/`);
      fs.renameSync(fullPath, destPath);
    }
  }
}

function migrateCharacters() {
  console.log("\n--- Migrating Characters ---");
  const files = fs.readdirSync(CHAR_DIR);
  
  for (const file of files) {
    if (file.endsWith(".webp") || file.endsWith(".png") || file.endsWith(".meta.json")) {
      const fullPath = path.join(CHAR_DIR, file);
      if (fs.lstatSync(fullPath).isDirectory()) continue;

      // Extract ID: clara_altenburg.webp -> clara_altenburg
      const id = path.basename(file, path.extname(file)).replace(".meta", "");
      
      const destDir = path.join(CHAR_DIR, id);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      const destPath = path.join(destDir, file);
      console.log(`Moving: ${file} -> ${id}/`);
      fs.renameSync(fullPath, destPath);
    }
  }
}

migrateLocations();
migrateCharacters();
console.log("\nMigration Complete!");
