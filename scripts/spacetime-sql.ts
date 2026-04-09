export type FetchLike = typeof fetch;

interface SqlSchemaElement {
  name?: { some?: string };
  algebraic_type?: Record<string, unknown>;
}

interface SqlResultSet {
  schema?: {
    elements?: SqlSchemaElement[];
  };
  rows?: unknown[];
}

export interface RunSpacetimeSqlOptions {
  host: string;
  database: string;
  token?: string;
  query: string;
  fetchImpl?: FetchLike;
}

export const escapeSqlLiteral = (value: string): string =>
  value.replace(/'/g, "''");

export const httpHostFromWorkerHost = (host: string): string =>
  host.replace("ws://", "http://").replace("wss://", "https://");

export const runSpacetimeSql = async ({
  host,
  database,
  token,
  query,
  fetchImpl = fetch,
}: RunSpacetimeSqlOptions): Promise<unknown[]> => {
  const response = await fetchImpl(
    `${httpHostFromWorkerHost(host)}/v1/database/${database}/sql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: query,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed SQL request: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  const firstEntry = payload[0];
  if (
    firstEntry &&
    typeof firstEntry === "object" &&
    "rows" in firstEntry &&
    "schema" in firstEntry
  ) {
    return payload.flatMap((entry) =>
      decodeSqlResultSet(entry as SqlResultSet),
    );
  }

  return payload;
};

const decodeSqlResultSet = (resultSet: SqlResultSet): unknown[] => {
  const elements = resultSet.schema?.elements ?? [];
  const rows = resultSet.rows ?? [];

  return rows.map((row) => {
    if (!Array.isArray(row)) {
      return row;
    }

    return Object.fromEntries(
      elements.map((element, index) => [
        element.name?.some ?? `col_${index}`,
        decodeSqlValue(row[index], element.algebraic_type),
      ]),
    );
  });
};

const decodeSqlValue = (
  value: unknown,
  algebraicType: Record<string, unknown> | undefined,
): unknown => {
  if (!algebraicType || value === null || value === undefined) {
    return value;
  }

  if ("Product" in algebraicType) {
    const product = algebraicType.Product as { elements?: SqlSchemaElement[] };
    const elements = product.elements ?? [];
    if (!Array.isArray(value)) {
      return value;
    }
    if (elements.length === 1 && elements[0]?.name?.some === "__identity__") {
      return value[0] ?? null;
    }
    if (
      elements.length === 1 &&
      elements[0]?.name?.some === "__timestamp_micros_since_unix_epoch__"
    ) {
      const micros = Number(value[0]);
      return Number.isFinite(micros)
        ? new Date(micros / 1_000).toISOString()
        : value[0];
    }
    if (elements.length === 0) {
      return [];
    }
    return Object.fromEntries(
      elements.map((element, index) => [
        element.name?.some ?? `field_${index}`,
        decodeSqlValue(value[index], element.algebraic_type),
      ]),
    );
  }

  if ("Sum" in algebraicType) {
    const sum = algebraicType.Sum as { variants?: SqlSchemaElement[] };
    const variants = sum.variants ?? [];
    if (!Array.isArray(value) || value.length === 0) {
      return value;
    }
    const variantIndex =
      typeof value[0] === "number"
        ? value[0]
        : Number.parseInt(String(value[0]), 10);
    const variant = variants[variantIndex];
    const decoded = decodeSqlValue(value[1], variant?.algebraic_type);
    const variantName = variant?.name?.some;
    if (variantName === "some") {
      return decoded;
    }
    if (variantName === "none") {
      return null;
    }
    return decoded;
  }

  return value;
};
