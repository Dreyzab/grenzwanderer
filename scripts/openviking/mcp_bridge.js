import { appendFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL = process.env.OPENVIKING_BASE_URL ?? "http://127.0.0.1:1933";
const API_KEY = process.env.OPENVIKING_API_KEY ?? "";
const LOG_FILE = path.join(__dirname, "mcp.bridge.log");
const PROTOCOL_VERSION = "2024-11-05";

const TOOL_DEFINITIONS = [
  {
    name: "query_context",
    description:
      "Run semantic retrieval against the OpenViking index and return matching resources, skills, and memories.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Semantic search query." },
        targetUri: {
          type: "string",
          description: "Optional viking:// URI prefix to scope the search.",
        },
        target_uri: {
          type: "string",
          description: "Snake_case alias for targetUri.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 10,
          description: "Maximum number of matches to return.",
        },
        nodeLimit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Alias for limit used by some OpenViking endpoints.",
        },
        node_limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Snake_case alias for nodeLimit.",
        },
        scoreThreshold: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Optional minimum score threshold.",
        },
        score_threshold: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Snake_case alias for scoreThreshold.",
        },
        filter: {
          type: "object",
          description: "Optional metadata filter forwarded to OpenViking.",
          additionalProperties: true,
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "read_context",
    description:
      "Read a specific OpenViking URI, or fetch its overview/abstract for quick inspection.",
    inputSchema: {
      type: "object",
      properties: {
        uri: { type: "string", description: "Exact viking:// URI to inspect." },
        view: {
          type: "string",
          enum: ["read", "overview", "abstract"],
          default: "read",
          description: "Which content endpoint to use.",
        },
        offset: {
          type: "integer",
          minimum: 0,
          default: 0,
          description: "Line offset for read mode.",
        },
        limit: {
          type: "integer",
          default: -1,
          description: "Line limit for read mode; -1 reads to the end.",
        },
      },
      required: ["uri"],
      additionalProperties: false,
    },
  },
  {
    name: "grep_context",
    description:
      "Run exact or regex-style text matching inside OpenViking-managed content.",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Text or regex pattern to search for.",
        },
        uri: {
          type: "string",
          default: "viking://resources/",
          description: "URI scope to search within.",
        },
        caseInsensitive: {
          type: "boolean",
          default: false,
          description: "Whether matching should ignore case.",
        },
        case_insensitive: {
          type: "boolean",
          default: false,
          description: "Snake_case alias for caseInsensitive.",
        },
        nodeLimit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          description: "Optional result cap.",
        },
        node_limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          description: "Snake_case alias for nodeLimit.",
        },
      },
      required: ["pattern"],
      additionalProperties: false,
    },
  },
  {
    name: "get_viking_status",
    description:
      "Check OpenViking health and basic system initialization status.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function log(message, details) {
  const timestamp = new Date().toISOString();
  const lines = [`[${timestamp}] ${message}`];
  if (details !== undefined) {
    try {
      lines.push(JSON.stringify(details, null, 2));
    } catch {
      lines.push(String(details));
    }
  }
  try {
    appendFileSync(LOG_FILE, `${lines.join("\n")}\n`);
  } catch {
    // Ignore logging failures. stdout must remain protocol-only.
  }
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  const byteLength = Buffer.byteLength(json, "utf8");
  process.stdout.write(
    `Content-Length: ${byteLength}\r\nContent-Type: application/json\r\n\r\n${json}`,
  );
}

function sendResult(id, result) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result,
  });
}

function sendError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  });
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function coerceInteger(value, fallback, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  const rounded = Math.trunc(value);
  return Math.max(min, Math.min(max, rounded));
}

function coerceNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function coerceBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function truncateText(value, limit = 240) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit - 3)}...`;
}

function pickPreview(item) {
  const candidates = [
    item.abstract,
    item.overview,
    item.content,
    item.text,
    item.summary,
    item.snippet,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return truncateText(candidate);
    }
  }
  return "";
}

function formatJson(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function formatBucket(label, items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const lines = [`${label} (${items.length})`];
  items.forEach((item, index) => {
    if (!isRecord(item)) {
      lines.push(`${index + 1}. ${formatJson(item)}`);
      return;
    }

    const uri = typeof item.uri === "string" ? item.uri : "(missing uri)";
    const score =
      typeof item.score === "number" && Number.isFinite(item.score)
        ? ` score=${item.score.toFixed(3)}`
        : "";
    const category =
      typeof item.category === "string" && item.category
        ? ` category=${item.category}`
        : "";
    lines.push(`${index + 1}. ${uri}${score}${category}`);

    const preview = pickPreview(item);
    if (preview) {
      lines.push(`   ${preview}`);
    }
  });

  return lines.join("\n");
}

async function apiRequest(endpoint, { method = "GET", body, query } = {}) {
  const url = new URL(endpoint, SERVER_URL);
  if (query && isRecord(query)) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const headers = {
    Accept: "application/json",
  };
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const rawText = await response.text();
  let payload = rawText;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    throw new Error(
      `OpenViking request failed (${response.status} ${response.statusText}): ${formatJson(payload)}`,
    );
  }

  return payload;
}

async function handleQueryContext(args) {
  const query = coerceString(args.query);
  if (!query) {
    throw new Error("query_context requires a non-empty query.");
  }

  const targetUri = coerceString(firstDefined(args.targetUri, args.target_uri));
  const limit = coerceInteger(
    firstDefined(args.limit, args.nodeLimit, args.node_limit),
    10,
    1,
    50,
  );
  const scoreThreshold = coerceNumber(
    firstDefined(args.scoreThreshold, args.score_threshold),
  );
  const body = {
    query,
    limit,
    ...(targetUri ? { target_uri: targetUri } : {}),
    ...(scoreThreshold === undefined
      ? {}
      : { score_threshold: scoreThreshold }),
    ...(isRecord(args.filter) ? { filter: args.filter } : {}),
  };

  const response = await apiRequest("/api/v1/search/find", {
    method: "POST",
    body,
  });
  const result =
    isRecord(response) && isRecord(response.result) ? response.result : {};
  const total =
    typeof result.total === "number"
      ? result.total
      : ["resources", "skills", "memories"].reduce((sum, key) => {
          const value = result[key];
          return sum + (Array.isArray(value) ? value.length : 0);
        }, 0);

  const sections = [
    `Query: ${query}`,
    `Server: ${SERVER_URL}`,
    `Total matches: ${total}`,
  ];

  if (targetUri) {
    sections.push(`Scope: ${targetUri}`);
  }

  const buckets = [
    formatBucket("Resources", result.resources),
    formatBucket("Skills", result.skills),
    formatBucket("Memories", result.memories),
  ].filter(Boolean);

  if (buckets.length === 0) {
    sections.push("No OpenViking matches found.");
  } else {
    sections.push(...buckets);
  }

  return {
    content: [
      {
        type: "text",
        text: sections.join("\n\n"),
      },
    ],
    structuredContent: {
      request: body,
      response,
    },
  };
}

async function handleReadContext(args) {
  const uri = coerceString(args.uri);
  if (!uri) {
    throw new Error("read_context requires a non-empty uri.");
  }

  const view = coerceString(args.view || "read").toLowerCase() || "read";
  const endpoint =
    view === "overview"
      ? "/api/v1/content/overview"
      : view === "abstract"
        ? "/api/v1/content/abstract"
        : "/api/v1/content/read";

  const query = {
    uri,
    ...(view === "read"
      ? {
          offset: coerceInteger(args.offset, 0, 0, Number.MAX_SAFE_INTEGER),
          limit:
            typeof args.limit === "number" && Number.isFinite(args.limit)
              ? Math.trunc(args.limit)
              : -1,
        }
      : {}),
  };

  const response = await apiRequest(endpoint, { query });
  const result = isRecord(response) ? response.result : response;
  const payloadText = formatJson(result ?? "");

  return {
    content: [
      {
        type: "text",
        text: [`View: ${view}`, `URI: ${uri}`, "", payloadText].join("\n"),
      },
    ],
    structuredContent: {
      view,
      uri,
      response,
    },
  };
}

async function handleGrepContext(args) {
  const pattern = coerceString(args.pattern);
  if (!pattern) {
    throw new Error("grep_context requires a non-empty pattern.");
  }

  const uri = coerceString(args.uri) || "viking://resources/";
  const nodeLimit = firstDefined(args.nodeLimit, args.node_limit);
  const body = {
    uri,
    pattern,
    case_insensitive: coerceBoolean(
      firstDefined(args.caseInsensitive, args.case_insensitive),
      false,
    ),
    ...(typeof nodeLimit === "number" && Number.isFinite(nodeLimit)
      ? { node_limit: coerceInteger(nodeLimit, 50, 1, 200) }
      : {}),
  };

  const response = await apiRequest("/api/v1/search/grep", {
    method: "POST",
    body,
  });
  const result = isRecord(response) ? response.result : response;

  return {
    content: [
      {
        type: "text",
        text: [
          `Pattern: ${pattern}`,
          `URI: ${uri}`,
          "",
          formatJson(result ?? response),
        ].join("\n"),
      },
    ],
    structuredContent: {
      request: body,
      response,
    },
  };
}

async function handleGetVikingStatus() {
  const [health, systemStatus] = await Promise.allSettled([
    apiRequest("/health"),
    apiRequest("/api/v1/system/status"),
  ]);

  const structuredContent = {
    serverUrl: SERVER_URL,
    health:
      health.status === "fulfilled"
        ? health.value
        : { error: String(health.reason) },
    systemStatus:
      systemStatus.status === "fulfilled"
        ? systemStatus.value
        : { error: String(systemStatus.reason) },
  };

  return {
    content: [
      {
        type: "text",
        text: [
          `Server: ${SERVER_URL}`,
          "",
          "Health:",
          formatJson(structuredContent.health),
          "",
          "System status:",
          formatJson(structuredContent.systemStatus),
        ].join("\n"),
      },
    ],
    structuredContent,
  };
}

const TOOL_HANDLERS = {
  query_context: handleQueryContext,
  read_context: handleReadContext,
  grep_context: handleGrepContext,
  get_viking_status: handleGetVikingStatus,
};

async function dispatchRequest(message) {
  if (!isRecord(message)) {
    return;
  }

  const { id, method } = message;
  const params = isRecord(message.params) ? message.params : {};

  if (typeof method !== "string") {
    if (id !== undefined) {
      sendError(id, -32600, "Invalid Request");
    }
    return;
  }

  try {
    if (method === "initialize") {
      sendResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: "openviking-stdio-bridge",
          version: "0.2.0",
        },
        instructions:
          "Use OpenViking tools to search indexed project context and inspect matching content.",
      });
      return;
    }

    if (
      method === "notifications/initialized" ||
      method === "notifications/cancelled"
    ) {
      return;
    }

    if (method === "ping") {
      sendResult(id, {});
      return;
    }

    if (method === "tools/list") {
      sendResult(id, {
        tools: TOOL_DEFINITIONS,
      });
      return;
    }

    if (method === "tools/call") {
      const toolName = coerceString(params.name);
      const args = isRecord(params.arguments) ? params.arguments : {};
      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        sendError(id, -32601, `Unknown tool: ${toolName}`);
        return;
      }

      const result = await handler(args);
      sendResult(id, result);
      return;
    }

    if (id !== undefined) {
      sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    log("request_failed", {
      method,
      params,
      error: messageText,
    });

    if (id !== undefined) {
      sendError(id, -32000, messageText);
    }
  }
}

function parseHeaders(headerText) {
  const headers = {};
  for (const line of headerText.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    headers[key] = value;
  }
  return headers;
}

function findHeaderTerminator(buffer) {
  const crlfIndex = buffer.indexOf("\r\n\r\n");
  const lfIndex = buffer.indexOf("\n\n");

  if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
    return { headerEnd: crlfIndex, separatorLength: 4 };
  }

  if (lfIndex !== -1) {
    return { headerEnd: lfIndex, separatorLength: 2 };
  }

  return null;
}

let inputBuffer = Buffer.alloc(0);
let drainingInput = false;

async function drainInput() {
  while (true) {
    const headerInfo = findHeaderTerminator(inputBuffer);
    if (!headerInfo) {
      return;
    }

    const headerText = inputBuffer
      .subarray(0, headerInfo.headerEnd)
      .toString("utf8");
    const headers = parseHeaders(headerText);
    const contentLength = Number.parseInt(headers["content-length"] ?? "", 10);

    if (!Number.isFinite(contentLength) || contentLength < 0) {
      log("invalid_headers", { headerText });
      inputBuffer = Buffer.alloc(0);
      return;
    }

    const totalLength =
      headerInfo.headerEnd + headerInfo.separatorLength + contentLength;
    if (inputBuffer.length < totalLength) {
      return;
    }

    const bodyBuffer = inputBuffer.subarray(
      headerInfo.headerEnd + headerInfo.separatorLength,
      totalLength,
    );
    inputBuffer = inputBuffer.subarray(totalLength);

    let message;
    try {
      message = JSON.parse(bodyBuffer.toString("utf8"));
    } catch (error) {
      log("invalid_json", {
        error: error instanceof Error ? error.message : String(error),
        body: bodyBuffer.toString("utf8"),
      });
      continue;
    }

    if (Array.isArray(message)) {
      for (const entry of message) {
        await dispatchRequest(entry);
      }
    } else {
      await dispatchRequest(message);
    }
  }
}

async function scheduleDrain() {
  if (drainingInput) {
    return;
  }

  drainingInput = true;
  try {
    await drainInput();
  } finally {
    drainingInput = false;
    if (inputBuffer.length > 0) {
      void scheduleDrain();
    }
  }
}

process.stdin.on("data", (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  void scheduleDrain();
});

process.stdin.on("end", () => {
  log("stdin_closed");
});

process.stdin.on("error", (error) => {
  log("stdin_error", error instanceof Error ? error.message : String(error));
});

log("bridge_started", {
  serverUrl: SERVER_URL,
});
