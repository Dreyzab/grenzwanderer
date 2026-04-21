import type { MapSnapshot } from "../../src/features/vn/types";

const KARLSRUHE_EVENT_REGIONS: MapSnapshot["regions"] = [
  {
    id: "KARLSRUHE_1905",
    name: "Karlsruhe (1905)",
    geoCenterLat: 49.0069,
    geoCenterLng: 8.4037,
    zoom: 13,
  },
];

export const buildKarlsruheEventMapSnapshot = (
  availableScenarioIds: ReadonlySet<string>,
): MapSnapshot => {
  const assertScenario = (scenarioId: string): string => {
    if (!availableScenarioIds.has(scenarioId)) {
      throw new Error(
        `Karlsruhe event map references missing scenario ${scenarioId}`,
      );
    }
    return scenarioId;
  };

  return {
    defaultRegionId: "KARLSRUHE_1905",
    regions: KARLSRUHE_EVENT_REGIONS,
    points: [
      {
        id: "loc_ka_bank",
        title: "Bankhaus J.A. Krebs",
        regionId: "KARLSRUHE_1905",
        lat: 49.0106,
        lng: 8.4048,
        category: "PUBLIC",
        description: "Victoria's banker file is waiting behind the ledger desk.",
        image: "/images/scenes/scene_bank_intro.png",
        locationId: "loc_ka_bank",
        defaultState: "locked",
        unlockGroup: "loc_ka_bank",
        bindings: [
          {
            id: "ka_event_bank_start",
            trigger: "card_primary",
            label: "Open Banker File",
            priority: 100,
            intent: "objective",
            actions: [
              {
                type: "start_scenario",
                scenarioId: assertScenario("sandbox_banker_pilot"),
              },
            ],
          },
          {
            id: "ka_event_bank_travel",
            trigger: "card_secondary",
            label: "Travel",
            priority: 20,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: "loc_ka_bank" }],
          },
        ],
      },
      {
        id: "loc_ka_rathaus",
        title: "Rathaus Quarter",
        regionId: "KARLSRUHE_1905",
        lat: 49.0094,
        lng: 8.4011,
        category: "PUBLIC",
        description: "The mayor's office is where the dog case breaks open.",
        image: "/images/scenes/scene_rathaus_interior.webp",
        locationId: "loc_ka_rathaus",
        defaultState: "locked",
        unlockGroup: "loc_ka_rathaus",
        bindings: [
          {
            id: "ka_event_dog_start",
            trigger: "card_primary",
            label: "Open Mayor's Dog",
            priority: 100,
            intent: "objective",
            actions: [
              {
                type: "start_scenario",
                scenarioId: assertScenario("sandbox_dog_pilot"),
              },
            ],
          },
          {
            id: "ka_event_rathaus_travel",
            trigger: "card_secondary",
            label: "Travel",
            priority: 20,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: "loc_ka_rathaus" }],
          },
        ],
      },
      {
        id: "loc_ka_bakery",
        title: "Bakery of the Missing Aroma",
        regionId: "KARLSRUHE_1905",
        lat: 49.0041,
        lng: 8.4113,
        category: "PUBLIC",
        description: "A famous scent has vanished from the ovens overnight.",
        image: "/images/scenes/scene_bakery_counter.png",
        locationId: "loc_ka_bakery",
        defaultState: "locked",
        unlockGroup: "loc_ka_bakery",
        bindings: [
          {
            id: "ka_event_aroma_start",
            trigger: "card_primary",
            label: "Open Missing Aroma",
            priority: 100,
            intent: "objective",
            actions: [
              {
                type: "start_scenario",
                scenarioId: assertScenario("sandbox_missing_aroma_pilot"),
              },
            ],
          },
          {
            id: "ka_event_bakery_travel",
            trigger: "card_secondary",
            label: "Travel",
            priority: 20,
            intent: "travel",
            actions: [{ type: "travel_to", locationId: "loc_ka_bakery" }],
          },
        ],
      },
    ],
    shadowRoutes: [],
    qrCodeRegistry: [],
    mapEventTemplates: [],
    testDefaults: {
      defaultEventTtlMinutes: 15,
    },
  };
};
