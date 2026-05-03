/**
 * Maps character IDs to their portrait image paths.
 * Supports both specific character folders and generic role-based assets.
 */

const CHARACTER_PORTRAITS: Record<string, string> = {
  // Specific Characters
  npc_mother_hartmann:
    "/Characters/Eleonora/eleonora_mother_fixed_1776592259184.png",
  npc_felix_hartmann:
    "/Characters/Felix/felix_portrait_fixed_jaw_1776590978986.png",
  clara_altenburg: "/images/characters/clara_altenburg/master.png",
  assistant: "/images/characters/clara_altenburg/master.png",
  npc_archivist_otto: "/images/characters/librarian/librarian.webp",
  npc_baroness_elise:
    "/images/characters/aristocrat_portrait/aristocrat_portrait.png",
  npc_anna_mahler: "/images/characters/mayor/mayor.webp",
  npc_major_falk: "/images/characters/veteran_portrait/veteran_portrait.png",

  // Role-based Fallbacks (from public/images/characters)
  npc_weber_dispatcher: "/images/characters/operator/operator.webp",
  npc_kessler_banker: "/images/characters/bank_manager/bank_manager.webp",
  npc_banker_kessler: "/images/characters/bank_manager/bank_manager.webp",
  npc_vetter_clerk: "/images/characters/worker/worker.webp",
  npc_klein_analyst: "/images/characters/assistant/assistant.webp",
  paperboy: "/images/characters/sandbox_ka/char_client_urchin.png",

  // Generic Fallbacks
  apothecary: "/images/characters/apothecary/apothecary.webp",
  assistant_generic: "/images/characters/assistant/assistant.webp",
  bank_manager: "/images/characters/bank_manager/bank_manager.webp",
  blacksmith: "/images/characters/blacksmith/blacksmith.webp",
  boss: "/images/characters/boss/boss.webp",
  coroner: "/images/characters/coroner/coroner.webp",
  enforcer: "/images/characters/enforcer/enforcer.webp",
  gendarm: "/images/characters/gendarm/gendarm.webp",
  innkeeper: "/images/characters/innkeeper/innkeeper.webp",
  inspector: "/images/characters/inspector/inspector.webp",
  journalist: "/images/characters/journalist/journalist.webp",
  librarian: "/images/characters/librarian/librarian.webp",
  mayor: "/images/characters/mayor/mayor.webp",
  operator: "/images/characters/operator/operator.webp",
  pawnbroker: "/images/characters/pawnbroker/pawnbroker.webp",
  priest: "/images/characters/priest/priest.webp",
  smuggler: "/images/characters/smuggler/smuggler.webp",
  socialist: "/images/characters/socialist/socialist.webp",
  stationmaster: "/images/characters/stationmaster/stationmaster.webp",
  tailor: "/images/characters/tailor/tailor.webp",
  worker: "/images/characters/worker/worker.webp",
};

export function getCharacterPortrait(
  characterId: string | undefined,
): string | null {
  if (!characterId) return null;

  // Direct match
  if (CHARACTER_PORTRAITS[characterId]) {
    return CHARACTER_PORTRAITS[characterId];
  }

  // Role-based heuristic (e.g. npc_kessler_banker -> bank_manager)
  const lowerId = characterId.toLowerCase();

  // Specific patterns
  if (lowerId.includes("banker")) return CHARACTER_PORTRAITS.bank_manager;
  if (lowerId.includes("operator") || lowerId.includes("dispatcher"))
    return CHARACTER_PORTRAITS.operator;
  if (lowerId.includes("analyst")) return CHARACTER_PORTRAITS.assistant_generic;
  if (lowerId.includes("assistant")) return CHARACTER_PORTRAITS.assistant; // Maps to Clara/Felix folder eventually
  if (lowerId.includes("clerk") || lowerId.includes("worker"))
    return CHARACTER_PORTRAITS.worker;
  if (lowerId.includes("archivist") || lowerId.includes("librarian"))
    return CHARACTER_PORTRAITS.librarian;
  if (lowerId.includes("inspector")) return CHARACTER_PORTRAITS.inspector;
  if (lowerId.includes("mayor")) return CHARACTER_PORTRAITS.mayor;
  if (lowerId.includes("paperboy") || lowerId.includes("urchin"))
    return CHARACTER_PORTRAITS.paperboy;

  return null;
}
