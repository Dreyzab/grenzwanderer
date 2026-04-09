import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPage } from "./AdminPage";

const mocks = vi.hoisted(() => ({
  useTableMock: vi.fn(),
  useIdentityMock: vi.fn(),
  tables: {
    playerPresence: Symbol("playerPresence"),
    myPlayerProfile: Symbol("myPlayerProfile"),
    auditLog: Symbol("auditLog"),
    opsExternalMetric: Symbol("opsExternalMetric"),
    telemetryAggregate: Symbol("telemetryAggregate"),
    contentVersion: Symbol("contentVersion"),
  },
}));

vi.mock("spacetimedb/react", () => ({
  useTable: (...args: unknown[]) => mocks.useTableMock(...args),
}));

vi.mock("../shared/spacetime/useIdentity", () => ({
  useIdentity: () => mocks.useIdentityMock(),
}));

vi.mock("../shared/spacetime/bindings", () => ({
  tables: mocks.tables,
}));

const timestamp = (iso: string) => ({
  microsSinceUnixEpoch: BigInt(Date.parse(iso)) * 1000n,
});

const identity = (hex: string) => ({
  toHexString: () => hex,
});

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-11T12:00:00.000Z"));

    mocks.useIdentityMock.mockReturnValue({
      identityHex: "viewer-identity",
    });

    mocks.useTableMock.mockImplementation((table: symbol) => {
      if (table === mocks.tables.playerPresence) {
        return [
          [
            {
              playerId: identity("player-1"),
              currentTab: "admin",
              appVersion: "0.2.0",
              buildCommit: "abcdef123456",
              lastSeenAt: timestamp("2026-03-11T11:59:30.000Z"),
            },
          ],
          true,
        ];
      }

      if (table === mocks.tables.myPlayerProfile) {
        return [
          [
            {
              playerId: identity("player-1"),
              nickname: { tag: "some", value: "Operator Anna" },
            },
          ],
          true,
        ];
      }

      if (table === mocks.tables.auditLog) {
        return [
          [
            {
              auditId: 1n,
              actorIdentity: identity("admin-1"),
              actorRole: "admin",
              action: "content_published",
              subjectType: "content_version",
              subjectId: "content-v1",
              summary: "Published content-v1",
              detailsJson: "{}",
              createdAt: timestamp("2026-03-11T11:50:00.000Z"),
            },
          ],
          true,
        ];
      }

      if (table === mocks.tables.opsExternalMetric) {
        return [
          [
            {
              metricKey: "sentry_sync_status",
              label: "Sentry Sync",
              source: "sentry",
              status: "ok",
              summary: "Synced 2 unresolved issues.",
              value: 2,
              hasValue: true,
              unit: "issues",
              linkUrl: "https://sentry.io/demo",
              observedAt: timestamp("2026-03-11T11:58:00.000Z"),
              updatedAt: timestamp("2026-03-11T11:58:00.000Z"),
            },
          ],
          true,
        ];
      }

      if (table === mocks.tables.telemetryAggregate) {
        return [
          [
            {
              aggregateKey: "1",
              bucketStart: timestamp("2026-03-11T11:55:00.000Z"),
              eventName: "scenario_started",
              tagsHash: "hash",
              count: 3n,
              sumValue: 0,
              updatedAt: timestamp("2026-03-11T11:56:00.000Z"),
            },
            {
              aggregateKey: "2",
              bucketStart: timestamp("2026-03-11T11:55:00.000Z"),
              eventName: "ai_request_enqueued",
              tagsHash: "hash",
              count: 2n,
              sumValue: 0,
              updatedAt: timestamp("2026-03-11T11:56:00.000Z"),
            },
            {
              aggregateKey: "3",
              bucketStart: timestamp("2026-03-11T11:55:00.000Z"),
              eventName: "ai_request_delivered",
              tagsHash: "hash",
              count: 1n,
              sumValue: 0,
              updatedAt: timestamp("2026-03-11T11:56:00.000Z"),
            },
          ],
          true,
        ];
      }

      if (table === mocks.tables.contentVersion) {
        return [
          [
            {
              version: "content-v1",
              checksum: "checksum",
              schemaVersion: 1,
              publishedAt: timestamp("2026-03-11T11:40:00.000Z"),
              isActive: true,
            },
          ],
          true,
        ];
      }

      return [[], true];
    });
  });

  it("renders the admin summary from the currently available tables", () => {
    render(<AdminPage />);

    expect(screen.getByText("Control Room")).toBeInTheDocument();
    expect(screen.getByText("Online Now")).toBeInTheDocument();
    expect(screen.getByText("Active Content")).toBeInTheDocument();
    expect(screen.getByText("content-v1")).toBeInTheDocument();
    expect(screen.getByText("Scenarios started")).toBeInTheDocument();
    expect(screen.getByText("AI Enqueued 24h")).toBeInTheDocument();
    expect(screen.getByText("AI Delivered 24h")).toBeInTheDocument();
    expect(
      screen.getByText("No external metrics ingested yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No active presence rows in the last 90 seconds."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No audit events recorded yet."),
    ).toBeInTheDocument();
  });
});
