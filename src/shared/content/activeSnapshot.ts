import { useEffect, useMemo, useState } from "react";
import { useTable } from "spacetimedb/react";
import { parseVnSnapshotPayload } from "../vn-contract/parser";
import { type VnSnapshot } from "../vn-contract/types";
import { tables, type ContentVersion } from "../spacetime/bindings";

let testSnapshotResolver: (() => VnSnapshot | null) | null = null;

export const __bindTestSnapshotResolver = (
  resolver: (() => VnSnapshot | null) | null,
): void => {
  testSnapshotResolver = resolver;
};

export const BUNDLED_SNAPSHOT_URL = "/content/vn/pilot.snapshot.json";

let bundledSnapshotCache: VnSnapshot | null = null;
let bundledSnapshotPromise: Promise<VnSnapshot> | null = null;

export const loadBundledSnapshot = async (): Promise<VnSnapshot> => {
  if (bundledSnapshotCache) {
    return bundledSnapshotCache;
  }

  if (!bundledSnapshotPromise) {
    bundledSnapshotPromise = fetch(BUNDLED_SNAPSHOT_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load bundled snapshot from ${BUNDLED_SNAPSHOT_URL}`,
          );
        }
        const payloadJson = await response.text();
        const parsed = parseVnSnapshotPayload(payloadJson);
        if (!parsed.ok) {
          throw new Error("Bundled snapshot payload is invalid");
        }
        bundledSnapshotCache = parsed.snapshot;
        return parsed.snapshot;
      })
      .finally(() => {
        bundledSnapshotPromise = null;
      });
  }

  return bundledSnapshotPromise;
};

export const useActiveContentSnapshot = (): {
  snapshot: VnSnapshot | null;
  activeVersion: ContentVersion | null;
  contentReady: boolean;
} => {
  const [versions, versionsReady] = useTable(tables.contentVersion);
  const [bundledSnapshot, setBundledSnapshot] = useState<VnSnapshot | null>(
    bundledSnapshotCache,
  );
  const [bundledError, setBundledError] = useState(false);
  const testSnapshot = testSnapshotResolver?.() ?? null;

  const activeVersion = testSnapshot
    ? null
    : (versions.find((entry) => entry.isActive) ?? null);

  useEffect(() => {
    if (testSnapshot || !activeVersion || bundledSnapshot || bundledError) {
      return;
    }

    let cancelled = false;
    void loadBundledSnapshot()
      .then((loaded) => {
        if (!cancelled) {
          setBundledSnapshot(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBundledError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeVersion, bundledError, bundledSnapshot, testSnapshot]);

  const snapshot = useMemo(() => {
    if (testSnapshot) {
      return testSnapshot;
    }
    if (!bundledSnapshot || !activeVersion) {
      return null;
    }

    return bundledSnapshot;
  }, [activeVersion, bundledSnapshot, testSnapshot]);

  const contentReady =
    Boolean(snapshot) ||
    Boolean(testSnapshot) ||
    (versionsReady && !activeVersion) ||
    bundledError;

  return {
    snapshot,
    activeVersion: activeVersion ?? null,
    contentReady,
  };
};
